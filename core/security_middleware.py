"""
Middleware de cabeceras de seguridad defensivas para Project Planner.

Inyecta Content-Security-Policy (CSP) y directivas de aislamiento en todas
las respuestas HTTP servidas por la API REST y el panel administrativo.
"""


class SecurityHeadersMiddleware:
    """Inyecta cabeceras de seguridad defensiva (CSP, etc.) en respuestas HTTP."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        if "Content-Security-Policy" not in response:
            if request.path.startswith(("/api/docs", "/api/redoc", "/admin")):
                # Documentación Swagger / Redoc y panel de administración
                response["Content-Security-Policy"] = (
                    "default-src 'self'; "
                    "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; "
                    "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; "
                    "img-src 'self' data: https://cdn.jsdelivr.net; "
                    "frame-ancestors 'none'; "
                    "form-action 'self'"
                )
            else:
                # Endpoints de API REST (JSON) y respuestas generales
                response["Content-Security-Policy"] = (
                    "default-src 'none'; frame-ancestors 'none'; form-action 'none'"
                )
        return response
