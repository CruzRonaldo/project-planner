import logging

from django.conf import settings
from django.http import FileResponse
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


class SecureBackupAuthentication(BasicAuthentication):
    def authenticate(self, request):
        if not settings.DEBUG and not request.is_secure():
            raise PermissionDenied("Esta operación requiere HTTPS.")
        return super().authenticate(request)


class IsSuperUser(BasePermission):
    message = "Solo un superusuario puede administrar los respaldos."

    def has_permission(self, request, view):
        user = request.user
        return bool(user and user.is_authenticated and user.is_active and user.is_superuser)


def error_response(error):
    if isinstance(error, BackupError):
        data = {"detail": str(error)}
        if error.safety_backup:
            data["safety_backup"] = error.safety_backup
        response = Response(data, status=error.status)
    else:
        logger.exception("No se pudo completar la operación de respaldos")
        response = Response({"detail": "No se pudo acceder a los respaldos. Revisa Django."}, status=500)
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
