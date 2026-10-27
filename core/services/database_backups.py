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
    environment.update({
        "PGDATABASE": str(db["NAME"]),
        "PGUSER": str(db.get("USER") or ""),
        "PGPASSWORD": str(db.get("PASSWORD") or ""),
        "PGHOST": str(db.get("HOST") or "127.0.0.1"),
        "PGPORT": str(db.get("PORT") or "5432"),
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
    try:
        with file_lock(".restore.lock"):
            return False
    except BackupError as error:
        if error.status == 409:
            return True
        raise


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
    result = []
    for path in backup_directory().glob("project_planner_*.dump"):
        if NAME.fullmatch(path.name) and path.is_file() and not path.is_symlink():
            data = metadata(path)
            result.append({
                "filename": path.name, "created_at": data["created_at"],
                "source": data.get("source", "legacy"),
                "created_by": data.get("created_by", ""),
                "size_bytes": path.stat().st_size,
                "has_checksum": bool(data.get("sha256")),
            })
    return sorted(result, key=lambda item: item["created_at"], reverse=True)


def validate_archive(path):
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
            executable("pg_dump"), "--format=custom", "--no-owner", "--no-acl",
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
        return path
    finally:
        temporary.unlink(missing_ok=True)
        meta_temporary.unlink(missing_ok=True)


def create_backup(source="manual", created_by=""):
    database_config()
    if source not in SOURCES:
        raise BackupError("Origen de respaldo inválido.")
    with file_lock(".operation.lock"):
        return _create_backup(source, created_by)


def restore_backup(filename, confirmation, created_by=""):
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
                "--clean", "--if-exists", "--single-transaction", "--exit-on-error",
                "--no-owner", "--no-acl", "--no-password", str(path),
            ], timeout=600, restoring=True)
        except BackupError as error:
            error.safety_backup = safety.name if safety else None
            raise
        finally:
            connections.close_all()
    return {"restored": filename, "safety_backup": safety.name}
