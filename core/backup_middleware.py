from django.http import JsonResponse
from .services.database_backups import BackupError, restoration_active


class BackupMaintenanceMiddleware:
    """Rechaza nuevas peticiones mientras esta instalación restaura su base."""
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        try:
            active = restoration_active()
        except (BackupError, OSError):
            active = True
        if active:
            response = JsonResponse(
                {"detail": "Mantenimiento de respaldos. Espera y vuelve a intentar."},
                status=503,
            )
            response["Retry-After"] = "10"
            response["Cache-Control"] = "no-store"
            return response
        return self.get_response(request)
