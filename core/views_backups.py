import logging
from typing import Optional

from django.conf import settings
from django.contrib.auth.models import User
from django.db.models import Q
from django.http import FileResponse
from rest_framework import exceptions
from rest_framework.authentication import BasicAuthentication
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import BasePermission
from rest_framework.response import Response

from .authentication import PasswordBoundAuthentication
from .models import SecurityAuditLog, BackupConfiguration
from .services.database_backups import (
    BackupError, create_backup, database_config, is_auto_backup_enabled,
    list_backups, resolve_backup, restore_backup,
)

logger = logging.getLogger(__name__)


def find_user_by_identifier(identifier: str) -> Optional[User]:
    """Busca un usuario activo por su nombre de usuario o dirección de correo electrónico."""
    clean_identifier = (identifier or "").strip()
    if not clean_identifier:
        return None
    return User.objects.filter(
        Q(username__iexact=clean_identifier) | Q(email__iexact=clean_identifier)
    ).first()


def user_matches_active_session(user: User, active_identifier: str) -> bool:
    """Valida si el usuario autenticado coincide con la sesión de administrador activa."""
    if not active_identifier:
        return True
    active_clean = active_identifier.strip().lower()
    return (
        user.username.lower() == active_clean
        or (bool(user.email) and user.email.lower() == active_clean)
        or str(user.id) == active_clean
    )


def get_active_session_identifier(request) -> str:
    """Extrae el identificador del usuario de la sesión activa desde cabeceras o parámetros."""
    if not request:
        return ""
    header_val = (
        request.headers.get("X-Current-User")
        or request.META.get("HTTP_X_CURRENT_USER")
        or ""
    ).strip()
    if header_val:
        return header_val
    return request.GET.get("active_user", "").strip()


def is_secure_request(request) -> bool:
    """Comprueba si la solicitud utiliza HTTPS directa o a través de proxy inverso."""
    return bool(
        request.is_secure()
        or request.headers.get("X-Forwarded-Proto") == "https"
        or request.META.get("HTTP_X_FORWARDED_PROTO") == "https"
    )


class SecureBackupAuthentication(BasicAuthentication):
    """
    Autenticación HTTP Basic reforzada:
    1. Exige HTTPS en entornos que no sean de desarrollo.
    2. Acepta tanto nombre de usuario como correo electrónico.
    3. Asegura que las credenciales pertenezcan únicamente al administrador con la sesión activa.
    """

    def authenticate(self, request):
        if not settings.DEBUG and not is_secure_request(request):
            raise PermissionDenied("Esta operación requiere HTTPS.")
        return super().authenticate(request)

    def authenticate_credentials(self, userid, password, request=None):
        clean_identifier = (userid or "").strip()
        if not clean_identifier or not password:
            raise exceptions.AuthenticationFailed("Debe proporcionar nombre/correo y contraseña.")

        user = find_user_by_identifier(clean_identifier)
        if not user or not user.check_password(password):
            raise exceptions.AuthenticationFailed("Nombre/correo o contraseña incorrectos.")

        if not user.is_active:
            raise exceptions.AuthenticationFailed("La cuenta de usuario está desactivada.")

        if request:
            active_identifier = get_active_session_identifier(request)
            if not user_matches_active_session(user, active_identifier):
                # Principio OWASP anti-enumeración: no revelar si las credenciales
                # pertenecían válidamente a otro usuario del sistema.
                raise exceptions.AuthenticationFailed("Credenciales incorrectas.")

        return (user, None)


class IsSuperUser(BasePermission):
    """Permite el acceso exclusivamente a superusuarios / administradores principales."""
    message = "No tienes permisos para realizar esta acción."

    def has_permission(self, request, view):
        user = request.user
        return bool(
            user
            and user.is_authenticated
            and user.is_active
            and user.is_superuser
        )


def error_response(error):
    if isinstance(error, BackupError):
        data = {"detail": str(error)}
        if error.safety_backup:
            data["safety_backup"] = error.safety_backup
        response = Response(data, status=error.status)
    else:
        logger.exception("No se pudo completar la operación de respaldos")
        response = Response({"detail": "No se pudo acceder a los respaldos. Revisa el servidor."}, status=500)
    response["Cache-Control"] = "no-store"
    return response


def download_response(path):
    response = FileResponse(
        path.open("rb"), as_attachment=True, filename=path.name,
        content_type="application/octet-stream",
    )
    response["Cache-Control"] = "no-store"
    return response


def _record_backup_audit(request, action: str, description: str) -> None:
    """Registra una operación de respaldo en la bitácora de auditoría de seguridad."""
    ip_addr = request.META.get("HTTP_X_FORWARDED_FOR") or request.META.get("REMOTE_ADDR")
    if ip_addr and "," in ip_addr:
        ip_addr = ip_addr.split(",")[0].strip()
    SecurityAuditLog.objects.create(
        user=request.user,
        action=action,
        description=description,
        ip_address=ip_addr,
    )


@api_view(["GET"])
@authentication_classes([PasswordBoundAuthentication, SecureBackupAuthentication])
@permission_classes([IsSuperUser])
def backup_history_view(request):
    try:
        response = Response({
            "database": str(database_config()["NAME"]),
            "auto_backup_enabled": is_auto_backup_enabled(),
            "backups": list_backups(),
        })
        response["Cache-Control"] = "no-store"
        return response
    except (BackupError, OSError) as error:
        return error_response(error)


@api_view(["POST"])
@authentication_classes([PasswordBoundAuthentication, SecureBackupAuthentication])
@permission_classes([IsSuperUser])
def toggle_auto_backup_view(request):
    """Activa o desactiva la ejecución diaria de respaldos automáticos."""
    try:
        config = BackupConfiguration.get_solo()
        raw_enabled = request.data.get("enabled")
        if raw_enabled is None:
            config.auto_backup_enabled = not config.auto_backup_enabled
        else:
            config.auto_backup_enabled = bool(raw_enabled)
        config.updated_by = request.user
        config.save()

        action_desc = "activado" if config.auto_backup_enabled else "pausado"
        _record_backup_audit(
            request,
            action="backup_toggle_auto",
            description=f"Respaldo automático {action_desc} por {request.user.username}",
        )
        response = Response({
            "auto_backup_enabled": config.auto_backup_enabled,
            "detail": f"Respaldo automático {action_desc}",
        })
        response["Cache-Control"] = "no-store"
        return response
    except Exception as error:
        return error_response(error)


@api_view(["POST"])
@authentication_classes([PasswordBoundAuthentication, SecureBackupAuthentication])
@permission_classes([IsSuperUser])
def export_database_view(request):
    try:
        path = create_backup(created_by=request.user.get_username())
        _record_backup_audit(
            request,
            action="backup_export",
            description=f"Exportación manual de respaldo ({path.name})",
        )
        return download_response(path)
    except (BackupError, OSError) as error:
        return error_response(error)


@api_view(["GET"])
@authentication_classes([PasswordBoundAuthentication, SecureBackupAuthentication])
@permission_classes([IsSuperUser])
def download_backup_view(request, filename):
    try:
        path = resolve_backup(filename)
        _record_backup_audit(
            request,
            action="backup_download",
            description=f"Descarga de respaldo ({path.name})",
        )
        return download_response(path)
    except (BackupError, OSError) as error:
        return error_response(error)


@api_view(["POST"])
@authentication_classes([PasswordBoundAuthentication, SecureBackupAuthentication])
@permission_classes([IsSuperUser])
def restore_database_view(request):
    try:
        if request.data.get("confirm_restore") is not True:
            raise BackupError("Debes confirmar expresamente la restauración.")
        raw_password = (
            request.data.get("password")
            if "password" in request.data
            else request.data.get("admin_password")
        )
        if raw_password is not None and (
            not isinstance(raw_password, str)
            or not raw_password
            or not request.user.check_password(raw_password)
        ):
            raise BackupError("Contraseña incorrecta.", status=403)
        result = restore_backup(
            request.data.get("filename"), request.data.get("confirm_database"),
            created_by=request.user.get_username(),
        )
        _record_backup_audit(
            request,
            action="backup_restore",
            description=f"Restauración de respaldo ({result.get('restored', '')})",
        )
        response = Response({
            "detail": "Restauración completada. Cierra sesión y vuelve a entrar.", **result,
        })
        response["Cache-Control"] = "no-store"
        return response
    except (BackupError, OSError) as error:
        return error_response(error)
