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

from .services.database_backups import (
    BackupError, create_backup, database_config, list_backups,
    resolve_backup, restore_backup,
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
    """Permite el acceso a administradores o superusuarios autorizados."""
    message = "No tienes permisos para realizar esta acción."

    def has_permission(self, request, view):
        user = request.user
        return bool(
            user
            and user.is_authenticated
            and user.is_active
            and (user.is_superuser or user.is_staff)
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


@api_view(["GET"])
@authentication_classes([SecureBackupAuthentication])
@permission_classes([IsSuperUser])
def backup_history_view(request):
    try:
        response = Response({"database": str(database_config()["NAME"]), "backups": list_backups()})
        response["Cache-Control"] = "no-store"
        return response
    except (BackupError, OSError) as error:
        return error_response(error)


@api_view(["POST"])
@authentication_classes([SecureBackupAuthentication])
@permission_classes([IsSuperUser])
def export_database_view(request):
    try:
        path = create_backup(created_by=request.user.get_username())
        return download_response(path)
    except (BackupError, OSError) as error:
        return error_response(error)


@api_view(["GET"])
@authentication_classes([SecureBackupAuthentication])
@permission_classes([IsSuperUser])
def download_backup_view(request, filename):
    try:
        return download_response(resolve_backup(filename))
    except (BackupError, OSError) as error:
        return error_response(error)


@api_view(["POST"])
@authentication_classes([SecureBackupAuthentication])
@permission_classes([IsSuperUser])
def restore_database_view(request):
    try:
        if request.data.get("confirm_restore") is not True:
            raise BackupError("Debes confirmar expresamente la restauración.")
        result = restore_backup(
            request.data.get("filename"), request.data.get("confirm_database"),
            created_by=request.user.get_username(),
        )
        response = Response({
            "detail": "Restauración completada. Cierra sesión y vuelve a entrar.", **result,
        })
        response["Cache-Control"] = "no-store"
        return response
    except (BackupError, OSError) as error:
        return error_response(error)
