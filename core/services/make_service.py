import json
import logging
import urllib.error
import urllib.request
from datetime import datetime, timezone
from django.conf import settings

logger = logging.getLogger(__name__)


def get_configured_make_webhook_url() -> str:
    """
    Obtiene la URL del Webhook de Make configurada en las variables de entorno / settings.
    """
    return getattr(settings, 'MAKE_WEBHOOK_URL', '') or ''


def send_make_webhook(event: str, data: dict, webhook_url: str = None, timeout: int = 5) -> dict:
    """
    Envía un evento en formato JSON hacia un escenario de Make (Integromat).
    
    :param event: Nombre del evento (ej: 'project.created', 'task.alert', 'budget.updated')
    :param data: Diccionario con la carga útil de datos del evento
    :param webhook_url: URL específica de Make (opcional, si no se provee usa la configurada)
    :param timeout: Tiempo máximo de espera en segundos (default 5s)
    :return: Diccionario con el resultado de la transmisión
    """
    target_url = (webhook_url or get_configured_make_webhook_url()).strip()

    if not target_url:
        return {
            'success': False,
            'status_code': 400,
            'message': 'No se ha configurado ninguna URL de webhook para Make.',
            'error': 'MISSING_WEBHOOK_URL'
        }

    payload = {
        'event': event,
        'timestamp': datetime.now(timezone.utc).isoformat(),
        'source': 'Project Planner API',
        'data': data or {}
    }

    try:
        json_data = json.dumps(payload, default=str).encode('utf-8')
        req = urllib.request.Request(
            target_url,
            data=json_data,
            headers={
                'Content-Type': 'application/json',
                'User-Agent': 'ProjectPlanner-MakeIntegration/1.0',
            },
            method='POST'
        )

        with urllib.request.urlopen(req, timeout=timeout) as response:
            status_code = response.getcode()
            response_body = response.read().decode('utf-8', errors='replace')

            logger.info(f"[Make Integration] Evento '{event}' enviado con éxito a Make. Status: {status_code}")
            return {
                'success': 200 <= status_code < 300,
                'status_code': status_code,
                'response': response_body,
                'message': f'Evento enviado correctamente a Make (HTTP {status_code}).',
                'error': None
            }

    except urllib.error.HTTPError as http_err:
        err_body = http_err.read().decode('utf-8', errors='replace') if http_err.fp else ''
        logger.warning(f"[Make Integration] Error HTTP {http_err.code} al enviar a Make: {err_body}")
        return {
            'success': False,
            'status_code': http_err.code,
            'response': err_body,
            'message': f'Make respondió con un error HTTP {http_err.code}.',
            'error': str(http_err)
        }

    except urllib.error.URLError as url_err:
        logger.error(f"[Make Integration] Error de conexión con Make: {url_err.reason}")
        return {
            'success': False,
            'status_code': 503,
            'response': None,
            'message': f'No fue posible conectar con el servidor de Make: {str(url_err.reason)}',
            'error': str(url_err.reason)
        }

    except Exception as exc:
        logger.error(f"[Make Integration] Excepción inesperada: {str(exc)}")
        return {
            'success': False,
            'status_code': 500,
            'response': None,
            'message': f'Error interno al despachar el webhook: {str(exc)}',
            'error': str(exc)
        }


def test_make_connection(webhook_url: str = None) -> dict:
    """
    Envía un evento de diagnóstico ('system.ping') para verificar la conectividad con Make.
    """
    test_data = {
        'action': 'ping',
        'message': 'Prueba de conexión exitosa desde Project Planner.',
        'environment': getattr(settings, 'DEBUG', False) and 'development' or 'production'
    }
    return send_make_webhook(event='system.ping', data=test_data, webhook_url=webhook_url)
