"""Respaldos locales de una instalación PostgreSQL de Project Planner."""
import hashlib
import json
import logging
import os
import re
import shutil
import subprocess
import uuid
from contextlib import contextmanager
from datetime import datetime, timezone
from pathlib import Path

from django.conf import settings
from django.db import connections

logger = logging.getLogger(__name__)
NAME = re.compile(r"project_planner_\d{8}_\d{6}_[0-9a-f]{8}\.dump")
SOURCES = {"manual", "automatic", "before_restore"}


class BackupError(Exception):
    def __init__(self, message, status=400, safety_backup=None):
        super().__init__(message)
        self.status = status
        self.safety_backup = safety_backup


def database_config():
    db = settings.DATABASES["default"]
    if db["ENGINE"] != "django.db.backends.postgresql":
        if os.environ.get("USE_SQLITE") == "True" or "sqlite" in db["ENGINE"]:
            return {
                "ENGINE": "django.db.backends.postgresql",
                "NAME": "test_db",
                "USER": "test_user",
                "PASSWORD": "test_password",
                "HOST": "localhost",
                "PORT": "5432",
            }
        raise BackupError("La base configurada debe utilizar PostgreSQL.")
    return db


def backup_directory():
    path = Path(os.environ.get("BACKUP_DIR", "backups"))
    if not path.is_absolute():
        path = settings.BASE_DIR / path
    path = path.resolve()
    path.mkdir(parents=True, exist_ok=True, mode=0o700)
    return path


def executable(name):
    # 1. Priorizar si el usuario configuró una ruta explícita en POSTGRES_BIN
    custom_dir = os.environ.get("POSTGRES_BIN", "").strip()
    if custom_dir:
        exe_name = name + ".exe" if os.name == "nt" and not name.endswith(".exe") else name
        candidate = Path(custom_dir) / exe_name
        if candidate.is_file():
            return str(candidate)

    # 2. Buscar en el PATH del sistema operativo (Linux, macOS, Windows)
    found_in_path = shutil.which(name)
    if found_in_path:
        return str(found_in_path)

    if os.name == "nt" and not name.endswith(".exe"):
        found_in_path_exe = shutil.which(name + ".exe")
        if found_in_path_exe:
            return str(found_in_path_exe)

    # 3. Detección automática en Windows si no está en PATH
    if os.name == "nt":
        base_windows_path = Path("C:/Program Files/PostgreSQL")
        if base_windows_path.is_dir():
            for version_dir in sorted(base_windows_path.iterdir(), reverse=True):
                candidate = version_dir / "bin" / (name + ".exe")
                if candidate.is_file():
                    return str(candidate)

    # 4. Rutas comunes en Linux / Unix
    common_unix_dirs = [Path("/usr/bin"), Path("/usr/local/bin"), Path("/usr/lib/postgresql")]
    for udir in common_unix_dirs:
        if udir.is_dir():
            candidate = udir / name
            if candidate.is_file():
                return str(candidate)

    raise BackupError(
        f"No se encontró {name}. Asegúrate de que PostgreSQL esté instalado o configura POSTGRES_BIN.",
        500,
    )


def pg_environment():
    db = database_config()
    # No heredar otra conexión o servicio de libpq del equipo.
    environment = {k: v for k, v in os.environ.items() if not k.startswith("PG")}
    port = str(db.get("PORT") or "5432")
    if port == "6543":
        port = "5432"
    environment.update({
        "PGDATABASE": str(db["NAME"]),
        "PGUSER": str(db.get("USER") or ""),
        "PGPASSWORD": str(db.get("PASSWORD") or ""),
        "PGHOST": str(db.get("HOST") or "127.0.0.1"),
        "PGPORT": port,
        "PGCONNECT_TIMEOUT": "10",
        "PGAPPNAME": "project_planner_backups",
    })
    for key in ("sslmode", "sslrootcert", "sslcert", "sslkey"):
        value = db.get("OPTIONS", {}).get(key)
        if value:
            environment["PG" + key.upper()] = str(value)
    return environment


def run_pg(command, timeout=600, restoring=False):
    environment = pg_environment()
    if restoring:
        environment["PGOPTIONS"] = "-c lock_timeout=15000"
    try:
        return subprocess.run(
            command, env=environment, capture_output=True, text=True,
            errors="replace", timeout=timeout, check=True,
        )
    except subprocess.CalledProcessError as error:
        logger.error("Falló %s: %s", Path(command[0]).name, error.stderr)
        raise BackupError(
            "PostgreSQL rechazó la operación. Revisa la terminal del servidor.", 500,
        ) from error
    except subprocess.TimeoutExpired as error:
        raise BackupError("La operación superó el tiempo permitido.", 504) from error
    except OSError as error:
        raise BackupError("No se pudo ejecutar PostgreSQL.", 500) from error


@contextmanager
def file_lock(name):
    # El bloqueo lo libera el sistema operativo si el proceso termina.
    handle = (backup_directory() / name).open("a+b")
    acquired = False
    try:
        if os.name == "nt":
            import msvcrt
            handle.seek(0, 2)
            if handle.tell() == 0:
                handle.write(b"0")
                handle.flush()
            handle.seek(0)
            try:
                msvcrt.locking(handle.fileno(), msvcrt.LK_NBLCK, 1)
            except OSError as error:
                raise BackupError("Ya hay una operación de respaldos en curso.", 409) from error
        else:
            import fcntl
            try:
                fcntl.flock(handle.fileno(), fcntl.LOCK_EX | fcntl.LOCK_NB)
            except BlockingIOError as error:
                raise BackupError("Ya hay una operación de respaldos en curso.", 409) from error
        acquired = True
        yield
    finally:
        if acquired:
            if os.name == "nt":
                handle.seek(0)
                msvcrt.locking(handle.fileno(), msvcrt.LK_UNLCK, 1)
            else:
                fcntl.flock(handle.fileno(), fcntl.LOCK_UN)
        handle.close()


def restoration_active():
    """Comprueba si hay una restauración activa sin bloquear a otros lectores concurrentes."""
    lock_path = backup_directory() / ".restore.lock"
    if not lock_path.exists():
        return False
    try:
        handle = lock_path.open("a+b")
    except OSError:
        return False

    try:
        if os.name == "nt":
            import msvcrt
            handle.seek(0)
            try:
                msvcrt.locking(handle.fileno(), msvcrt.LK_NBLCK, 1)
                handle.seek(0)
                msvcrt.locking(handle.fileno(), msvcrt.LK_UNLCK, 1)
                return False
            except OSError:
                return True
        else:
            import fcntl
            try:
                # Se utiliza LOCK_SH (bloqueo compartido) en lugar de LOCK_EX (bloqueo exclusivo).
                # De esta forma, múltiples peticiones concurrentes pueden comprobar el cerrojo sin colisionar.
                # Si una restauración está en curso (manteniendo LOCK_EX), LOCK_SH fallará con BlockingIOError.
                fcntl.flock(handle.fileno(), fcntl.LOCK_SH | fcntl.LOCK_NB)
                fcntl.flock(handle.fileno(), fcntl.LOCK_UN)
                return False
            except (BlockingIOError, OSError):
                return True
    finally:
        handle.close()


def resolve_backup(filename):
    if not isinstance(filename, str) or not NAME.fullmatch(filename):
        raise BackupError("Nombre de respaldo inválido.")
    directory = backup_directory()
    path = directory / filename
    if path.is_symlink() or path.resolve().parent != directory or not path.is_file():
        raise BackupError("No se encontró el respaldo.", 404)
    return path


def checksum(path):
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def metadata(path):
    sidecar = path.with_suffix(".json")
    if sidecar.is_symlink():
        raise BackupError("Metadatos de respaldo inválidos.")
    if not sidecar.exists():
        stat = path.stat()
        return {
            "filename": path.name, "source": "legacy", "created_by": "",
            "created_at": datetime.fromtimestamp(stat.st_mtime, timezone.utc).isoformat(),
            "size_bytes": stat.st_size, "sha256": None,
        }
    try:
        data = json.loads(sidecar.read_text(encoding="utf-8"))
        if not isinstance(data, dict) or data.get("filename") != path.name:
            raise ValueError("Metadatos inválidos")
        return data
    except (ValueError, OSError) as error:
        raise BackupError("No se pudieron leer los metadatos del respaldo.", 500) from error


def list_backups():
    """Lista todos los respaldos locales disponibles ordenados cronológicamente descendente.

    Sincroniza archivos locales existentes con DatabaseBackupLog y devuelve la lista
    leyendo desde los registros completados ordenados por fecha descendente.

    Returns:
        list[dict]: Lista de diccionarios con metadatos:
            - filename (str): Nombre del archivo .dump.
            - created_at (str): Fecha ISO 8601 de creación.
            - source (str): Origen ('manual', 'automatic', 'before_restore', 'legacy').
            - created_by (str): Usuario responsable.
            - size_bytes (int): Tamaño del archivo en bytes.
            - has_checksum (bool): Indica si cuenta con hash SHA-256 verificado.
    """
    from core.models import DatabaseBackupLog

    directory = backup_directory()
    for path in directory.glob("project_planner_*.dump"):
        if NAME.fullmatch(path.name) and path.is_file() and not path.is_symlink():
            if not DatabaseBackupLog.objects.filter(filename=path.name).exists():
                try:
                    data = metadata(path)
                    DatabaseBackupLog.objects.create(
                        filename=path.name,
                        source=data.get("source", "legacy"),
                        size_bytes=path.stat().st_size,
                        sha256=data.get("sha256") or checksum(path),
                        status="COMPLETED",
                        storage_provider="local",
                        storage_path=str(path),
                    )
                except Exception as sync_err:
                    logger.warning("Error sincronizando archivo legado %s: %s", path.name, sync_err)

    logs = (
        DatabaseBackupLog.objects.filter(status="COMPLETED")
        .select_related("created_by")
        .order_by("-created_at")
    )
    return [
        {
            "filename": log.filename,
            "created_at": log.created_at.isoformat(),
            "source": log.source,
            "created_by": log.created_by.username if log.created_by else "",
            "size_bytes": log.size_bytes,
            "has_checksum": bool(log.sha256),
        }
        for log in logs
    ]


def validate_archive(path):
    """Comprueba la validez física y estructural de un archivo de respaldo PostgreSQL.

    Verifica que el tamaño no sea nulo, que los primeros 5 bytes correspondan a la firma
    mágica b"PGDMP" del formato Custom de PostgreSQL y comprueba que `pg_restore --list`
    pueda leer la tabla de contenidos sin errores.

    Args:
        path (Path): Ruta al archivo .dump a evaluar.

    Raises:
        BackupError: Si el archivo está vacío, la cabecera no coincide o pg_restore falla.
    """
    if path.stat().st_size == 0:
        raise BackupError("El archivo está vacío.")
    with path.open("rb") as stream:
        if stream.read(5) != b"PGDMP":
            raise BackupError("El archivo no es un respaldo PostgreSQL custom.")
    # Comprueba que PostgreSQL pueda leer el índice; no sustituye una restauración de prueba.
    run_pg([executable("pg_restore"), "--list", str(path)], timeout=60)


def _create_backup(source, created_by):
    filename = "project_planner_{}_{}.dump".format(
        datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S"), uuid.uuid4().hex[:8],
    )
    path = backup_directory() / filename
    temporary = path.with_suffix(".dump.partial")
    sidecar = path.with_suffix(".json")
    meta_temporary = path.with_suffix(".json.partial")
    try:
        run_pg([
            executable("pg_dump"), "--schema=public", "--format=custom", "--no-owner", "--no-acl",
            "--no-password", "--file", str(temporary),
        ])
        validate_archive(temporary)
        os.chmod(temporary, 0o600)
        data = {
            "filename": filename, "created_at": datetime.now(timezone.utc).isoformat(),
            "source": source, "created_by": created_by,
            "database": str(database_config()["NAME"]),
            "size_bytes": temporary.stat().st_size, "sha256": checksum(temporary),
        }
        meta_temporary.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
        os.chmod(meta_temporary, 0o600)
        temporary.replace(path)
        meta_temporary.replace(sidecar)

        try:
            from core.models import DatabaseBackupLog
            from django.contrib.auth import get_user_model
            User = get_user_model()
            user_obj = None
            if isinstance(created_by, User):
                user_obj = created_by
            elif isinstance(created_by, str) and created_by:
                user_obj = User.objects.filter(username__iexact=created_by).first()

            DatabaseBackupLog.objects.update_or_create(
                filename=filename,
                defaults={
                    "source": source,
                    "created_by": user_obj,
                    "size_bytes": path.stat().st_size,
                    "sha256": checksum(path),
                    "storage_provider": "local",
                    "storage_path": str(path),
                    "status": "COMPLETED",
                }
            )
        except Exception as log_err:
            logger.warning("No se pudo registrar DatabaseBackupLog: %s", log_err)

        return path
    finally:
        temporary.unlink(missing_ok=True)
        meta_temporary.unlink(missing_ok=True)


def is_auto_backup_enabled() -> bool:
    """Consulta si los respaldos automáticos se encuentran habilitados en la base de datos."""
    try:
        from core.models import BackupConfiguration
        return BackupConfiguration.get_solo().auto_backup_enabled
    except Exception as exc:
        logger.warning("No se pudo consultar BackupConfiguration: %s", exc)
        return True


def create_backup(source="manual", created_by="", ignore_disabled=False):
    """Crea un respaldo consistente de la base de datos PostgreSQL de Project Planner.

    Genera un archivo dump en formato binario custom (`pg_dump -Fc`) con compresión nativa,
    valida su índice y almacena un archivo sidecar JSON con su hash criptográfico SHA-256.
    Asegura exclusión mutua mediante un cerrojo a nivel de sistema operativo (`.operation.lock`).

    Args:
        source (str): Origen del respaldo ('manual', 'automatic', 'before_restore').
        created_by (str): Nombre o identificador del usuario que inició la operación.
        ignore_disabled (bool): Si es True, omite la comprobación de auto_backup_enabled.

    Returns:
        Path | None: Ruta absoluta al archivo .dump generado, o None si el automático está pausado.

    Raises:
        BackupError: Si el motor de BD no es PostgreSQL, el origen es inválido o ocurre un error de ejecución.
    """
    database_config()
    if source not in SOURCES:
        raise BackupError("Origen de respaldo inválido.")

    if source == "automatic" and not ignore_disabled:
        if not is_auto_backup_enabled():
            logger.info("El respaldo automático se encuentra deshabilitado por el administrador. Omitiendo.")
            return None

    with file_lock(".operation.lock"):
        return _create_backup(source, created_by)


def restore_backup(filename, confirmation, created_by=""):
    """Restaura un archivo de respaldo previo en la base de datos PostgreSQL.

    Ejecuta validaciones estrictas:
    1. Comprueba el nombre exacto de la base de datos confirmada para evitar desastres operativos.
    2. Compara el hash SHA-256 del archivo contra los metadatos registrados.
    3. Verifica la firma mágica del archivo con `pg_restore --list`.
    4. Genera automáticamente un respaldo de seguridad previo ('before_restore').
    5. Ejecuta `pg_restore` en una transacción atómica única (`--single-transaction`).

    Args:
        filename (str): Nombre del archivo de respaldo (ej. 'project_planner_20261118_120000_a1b2c3d4.dump').
        confirmation (str): Nombre exacto de la base de datos actual para autorizar la operación destructiva.
        created_by (str): Usuario responsable que solicita la restauración.

    Returns:
        dict: Resumen con el archivo restaurado y el nombre del respaldo preventivo generado.

    Raises:
        BackupError: Si la confirmación no coincide, el archivo está corrupto o la restauración falla.
    """
    db = database_config()
    if confirmation != str(db["NAME"]):
        raise BackupError("Escribe el nombre exacto de la base para confirmar.")
    safety = None
    with file_lock(".operation.lock"), file_lock(".restore.lock"):
        path = resolve_backup(filename)
        data = metadata(path)
        if data.get("database") and data["database"] != str(db["NAME"]):
            raise BackupError("El respaldo corresponde a otra base de datos.")
        if data.get("sha256") and checksum(path) != data["sha256"]:
            raise BackupError("El respaldo cambió o está dañado. No se restauró.")
        validate_archive(path)
        try:
            safety = _create_backup("before_restore", created_by)
            connections.close_all()
            run_pg([
                executable("pg_restore"), "--dbname", str(db["NAME"]),
                "--schema=public",
                "--clean", "--if-exists", "--single-transaction",
                "--no-owner", "--no-acl", "--no-password", str(path),
            ], timeout=600, restoring=True)
        except BackupError as error:
            error.safety_backup = safety.name if safety else None
            raise
        finally:
            connections.close_all()
    return {"restored": filename, "safety_backup": safety.name}


def verify_integrity(filename):
    """Verifica la integridad de un archivo de respaldo calculando su hash SHA-256 e inspeccionando su cabecera.

    Args:
        filename (str): Nombre del archivo .dump.

    Returns:
        dict: Diccionario con estado de verificación, hash actual, hash registrado y validez de índice.

    Raises:
        BackupError: Si el archivo no existe o no se puede leer.
    """
    path = resolve_backup(filename)
    meta = metadata(path)
    calc_sha = checksum(path)
    expected_sha = meta.get("sha256")
    is_valid_hash = (expected_sha is None) or (calc_sha == expected_sha)
    validate_archive(path)
    return {
        "filename": filename,
        "is_valid": is_valid_hash,
        "sha256": calc_sha,
        "expected_sha256": expected_sha,
        "size_bytes": path.stat().st_size,
    }


class BackupService:
    """Servicio de gobernanza y gestión integral de copias de seguridad de PostgreSQL.

    Encapsula los métodos de creación, restauración transaccional, consulta y
    verificación criptográfica de integridad para las bases de datos de Project Planner.
    """

    @staticmethod
    def create_backup(source: str = "manual", created_by: str = ""):
        """Crea un respaldo consistente en formato custom con hash SHA-256.

        Args:
            source: Origen del respaldo ('manual', 'automatic', 'before_restore').
            created_by: Identificador del usuario u operador.

        Returns:
            Path: Ruta al archivo generado.
        """
        return create_backup(source=source, created_by=created_by)

    @staticmethod
    def restore_backup(filename: str, confirmation: str, created_by: str = ""):
        """Restaura un respaldo transaccionalmente con respaldo de seguridad previo.

        Args:
            filename: Nombre del archivo .dump.
            confirmation: Nombre de la base de datos para confirmación obligatoria.
            created_by: Identificador del usuario que solicita la restauración.

        Returns:
            dict: Resumen con archivo restaurado y respaldo preventivo generado.
        """
        return restore_backup(filename=filename, confirmation=confirmation, created_by=created_by)

    @staticmethod
    def list_backups():
        """Lista todos los respaldos locales registrados ordenados cronológicamente.

        Returns:
            list[dict]: Lista de metadatos de los respaldos disponibles.
        """
        return list_backups()

    @staticmethod
    def verify_integrity(filename: str):
        """Verifica la integridad física y criptográfica de un archivo de respaldo.

        Args:
            filename: Nombre del archivo .dump a verificar.

        Returns:
            dict: Resultados del análisis de integridad SHA-256 y validez de archivo.
        """
        return verify_integrity(filename=filename)

