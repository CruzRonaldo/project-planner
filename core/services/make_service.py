import json
import logging
import re
import urllib.error
import urllib.request
from datetime import datetime, timezone
from urllib.parse import urlparse
from django.conf import settings

logger = logging.getLogger(__name__)

CONFIG_FILE_PATH = settings.BASE_DIR / 'config' / 'make_config.json'


def get_make_config() -> dict:
    """
    Obtiene la configuración de Make desde el archivo JSON de configuración
    o desde las variables del entorno/settings como fallback.
    """
    fallback_url = getattr(settings, 'MAKE_WEBHOOK_URL', '') or ''
    fallback_token = getattr(settings, 'MAKE_API_TOKEN', '') or ''
    fallback = {
        'webhook_url': fallback_url,
        'api_token': fallback_token,
        'status': 'connected' if fallback_url else 'offline',
        'frequency': 'Cada 30 min',
        'tasks': [],
    }

    if not CONFIG_FILE_PATH.exists():
        return fallback

    try:
        with open(CONFIG_FILE_PATH, 'r', encoding='utf-8') as f:
            data = json.load(f)
            if not isinstance(data, dict):
                return fallback

            webhook_url = data.get('webhook_url') or fallback_url
            return {
                'webhook_url': webhook_url,
                'api_token': data.get('api_token', '') or fallback_token,
                'status': data.get('status') or ('connected' if webhook_url else 'offline'),
                'frequency': data.get('frequency', 'Cada 30 min'),
                'tasks': data.get('tasks', []) if isinstance(data.get('tasks'), list) else [],
            }
    except Exception as exc:
        logger.warning(f"[Make Config] Error al leer configuración desde {CONFIG_FILE_PATH}: {exc}")
        return fallback


def save_make_config(data: dict) -> dict:
    """
    Persiste la configuración de Make en make_config.json y actualiza settings.MAKE_WEBHOOK_URL en memoria.
    """
    if not isinstance(data, dict):
        data = {}

    existing_cfg = get_make_config() if CONFIG_FILE_PATH.exists() else {}
    existing_tasks_by_id = {
        t.get('id'): t
        for t in (existing_cfg.get('tasks') or [])
        if isinstance(t, dict) and t.get('id')
    }

    webhook_url = str(data.get('webhook_url') or '').strip()
    if 'api_token' in data:
        api_token = str(data.get('api_token') or '').strip()
    elif CONFIG_FILE_PATH.exists():
        api_token = str(existing_cfg.get('api_token') or '').strip()
    else:
        api_token = ''
    status = str(data.get('status') or ('connected' if webhook_url else 'offline')).strip()
    frequency = str(data.get('frequency') or 'Cada 30 min').strip()
    tasks = data.get('tasks', [])
    if not isinstance(tasks, list):
        tasks = []

    clean_tasks = []
    for t in tasks:
        if isinstance(t, dict):
            clean_task = dict(t)
            if 'icon' in clean_task and not isinstance(clean_task['icon'], str):
                clean_task.pop('icon', None)
            clean_task.pop('usage', None)
            clean_task.pop('has_api_token', None)
            preserve_token = bool(clean_task.pop('preserve_api_token', False))
            clear_token = bool(clean_task.pop('clear_api_token', False))

            clean_task['endpoint'] = str(clean_task.get('endpoint') or '').strip()
            clean_task['enabled'] = bool(clean_task.get('enabled', True))

            task_id = clean_task.get('id')
            existing_task_token = str((existing_tasks_by_id.get(task_id) or {}).get('api_token') or '').strip()
            if clear_token:
                clean_task['api_token'] = ''
            elif 'api_token' not in t:
                clean_task['api_token'] = existing_task_token
            else:
                incoming_token = str(clean_task.get('api_token') or '').strip()
                if incoming_token:
                    clean_task['api_token'] = incoming_token
                elif preserve_token:
                    clean_task['api_token'] = existing_task_token
                else:
                    clean_task['api_token'] = ''

            clean_tasks.append(clean_task)

    config_to_save = {
        'webhook_url': webhook_url,
        'api_token': api_token,
        'status': status,
        'frequency': frequency,
        'tasks': clean_tasks,
    }

    try:
        CONFIG_FILE_PATH.parent.mkdir(parents=True, exist_ok=True)
        with open(CONFIG_FILE_PATH, 'w', encoding='utf-8') as f:
            json.dump(config_to_save, f, indent=2, ensure_ascii=False)
    except Exception as exc:
        logger.error(f"[Make Config] Error al persistir configuración en {CONFIG_FILE_PATH}: {exc}")
        raise

    setattr(settings, 'MAKE_WEBHOOK_URL', webhook_url)
    return get_make_config()


def compute_make_status(tasks: list, webhook_url: str) -> str:
    """
    Calcula dinámicamente el estado real de la integración de Make según las tareas
    habilitadas y los endpoints/URL global configurados.
    """
    task_list = [t for t in (tasks or []) if isinstance(t, dict)]
    enabled_tasks = [t for t in task_list if bool(t.get('enabled', True))]
    configured_tasks = [
        t for t in enabled_tasks
        if bool(str(t.get('endpoint') or '').strip())
    ]
    if not enabled_tasks:
        return 'offline'
    if not configured_tasks:
        has_global = bool(str(webhook_url or '').strip())
        return 'connected' if has_global else 'offline'
    if len(configured_tasks) == len(enabled_tasks):
        return 'connected'
    return 'partial'


def extract_make_zone(webhook_url: str) -> str:
    """
    Extrae el subdominio de zona de Make (ej. us2, eu1) desde la URL del webhook.
    Retorna 'us1' por defecto.
    """
    raw_url = str(webhook_url or '').strip()
    if not raw_url:
        return 'us1'
    parsed = urlparse(raw_url if '://' in raw_url else f'https://{raw_url}')
    hostname = (parsed.hostname or '').lower()
    match = re.match(r'^(?:hook\.)?([a-z0-9-]+)\.make\.com$', hostname)
    if match and match.group(1) not in ('hook', 'www', 'api'):
        return match.group(1)
    return 'us1'


def _empty_make_usage(configured: bool, error: str | None = None) -> dict:
    """Construye la estructura estándar de respuesta para el consumo de operaciones de Make."""
    return {
        'configured': configured,
        'limit': 0,
        'used': 0,
        'available': 0,
        'percent': 0.0,
        'is_paused': False,
        'next_reset': None,
        'organization_name': '',
        'error': error,
    }


def _make_api_get_json(api_url: str, token: str, timeout: int) -> dict:
    """Ejecuta una petición GET autenticada hacia la API v2 de Make y decodifica el JSON."""
    req = urllib.request.Request(
        api_url,
        headers={
            'Authorization': f'Token {token}',
            'Accept': 'application/json',
            'User-Agent': 'ProjectPlanner/1.0',
        },
        method='GET',
    )
    with urllib.request.urlopen(req, timeout=timeout) as response:
        raw_body = response.read().decode('utf-8', errors='replace')
        payload = json.loads(raw_body) if raw_body else {}
        return payload if isinstance(payload, dict) else {}


def fetch_make_account_usage(api_token: str = None, zone: str = None, timeout: int = 5) -> dict:
    """
    Consulta el límite y consumo real de operaciones de la cuenta de Make mediante
    su API v2 (/organizations y /organizations/{org_id}) cuando se provee un API Token.
    """
    token = str(api_token or '').strip()
    if not token:
        return _empty_make_usage(configured=False)

    target_zone = str(zone or '').strip() or 'us1'
    orgs_url = f"https://{target_zone}.make.com/api/v2/organizations"

    try:
        payload = _make_api_get_json(orgs_url, token, timeout)
        organizations = payload.get('organizations')
        if isinstance(organizations, list) and len(organizations) > 0:
            first_org = organizations[0] if isinstance(organizations[0], dict) else {}
            org_id = first_org.get('id')
            if org_id is not None and str(org_id).strip():
                org_url = f"https://{target_zone}.make.com/api/v2/organizations/{org_id}"
                payload2 = _make_api_get_json(org_url, token, timeout)
                org = payload2.get('organization', {})
                if not isinstance(org, dict):
                    org = {}
                license_obj = org.get('license', {})
                if not isinstance(license_obj, dict):
                    license_obj = {}

                limit = int(license_obj.get('operations', 0) or 0)
                used = int(org.get('operations', 0) or 0)
                available = max(0, limit - used)
                percent = round((available / limit * 100), 1) if limit > 0 else 0.0
                is_paused = bool(org.get('isPaused', False))
                next_reset = org.get('nextReset')
                organization_name = str(org.get('name') or first_org.get('name') or '')
                return {
                    'configured': True,
                    'limit': limit,
                    'used': used,
                    'available': available,
                    'percent': percent,
                    'is_paused': is_paused,
                    'next_reset': next_reset,
                    'organization_name': organization_name,
                    'error': None,
                }

        return _empty_make_usage(configured=True)

    except urllib.error.HTTPError as http_err:
        logger.warning(f"[Make API] Error HTTP {http_err.code} al consultar uso de cuenta Make: {http_err}")
        return _empty_make_usage(configured=True, error=str(http_err))
    except urllib.error.URLError as url_err:
        logger.warning(f"[Make API] Error de conexión al consultar uso de cuenta Make: {url_err.reason}")
        return _empty_make_usage(configured=True, error=str(url_err))
    except Exception as exc:
        logger.warning(f"[Make API] Excepción inesperada al consultar uso de cuenta Make: {exc}")
        return _empty_make_usage(configured=True, error=str(exc))


def extract_client_request_metadata(request) -> dict:
    """
    Extrae la dirección IP real del cliente y su User-Agent a partir del objeto HttpRequest.
    Prioriza HTTP_X_FORWARDED_FOR tomando el primer salto, con fallback a REMOTE_ADDR.
    """
    if not request:
        return {'ip_address': '', 'user_agent': ''}

    ip_raw = request.META.get('HTTP_X_FORWARDED_FOR') or request.META.get('REMOTE_ADDR') or ''
    if ',' in ip_raw:
        ip_raw = ip_raw.split(',')[0].strip()
    else:
        ip_raw = str(ip_raw).strip()

    user_agent = str(request.META.get('HTTP_USER_AGENT') or '').strip()

    return {
        'ip_address': ip_raw[:45] if ip_raw else '',
        'user_agent': user_agent,
    }


def dispatch_security_alert_webhook(event: str, user, request=None, extra_data: dict = None):
    """
    Construye y despacha de manera asíncrona una alerta de seguridad hacia Make.com
    (ej. auth.password_changed, auth.email_changed).
    Garantiza que sessions_invalidated: True y los metadatos del cliente viajen completos.
    """
    from core.signals import _dispatch_async_webhook

    meta = extract_client_request_metadata(request)

    actor_name = ""
    if user:
        if hasattr(user, 'get_full_name'):
            actor_name = user.get_full_name().strip()
        if not actor_name and hasattr(user, 'first_name') and hasattr(user, 'last_name'):
            actor_name = f"{user.first_name} {user.last_name}".strip()
        if not actor_name and hasattr(user, 'username'):
            actor_name = user.username or ''

    actor_username = getattr(user, 'username', '') if user else ''
    actor_email = getattr(user, 'email', '') if user else ''
    actor_id = getattr(user, 'id', None) if user else None

    payload = {
        'actor_id': actor_id,
        'actor_name': actor_name,
        'actor_username': actor_username,
        'actor_email': actor_email,
        'ip_address': meta['ip_address'],
        'user_agent': meta['user_agent'],
        'sessions_invalidated': True,
    }

    if extra_data and isinstance(extra_data, dict):
        payload.update(extra_data)

    _dispatch_async_webhook(event=event, data=payload)


def _task_matches_event(task: dict, event: str) -> bool:
    if not isinstance(task, dict) or not event:
        return False
    task_event = task.get('event')
    if task_event == event:
        return True
    if task_event == 'project.assignment' and event in (
        'task.assigned',
        'project.leader_assigned',
        'member.created',
        'member.reassigned',
        'milestone.created',
        'incident.registered',
    ):
        return True
    if task_event == 'auth.security_alert' and event in (
        'auth.password_changed',
        'auth.email_changed',
    ):
        return True
    return False


def is_event_enabled(event: str) -> bool:
    """
    Verifica si un evento específico de Make está habilitado según las tareas configuradas.
    Retorna False si la tarea coincidente tiene enabled=False, True en cualquier otro caso.
    Prioriza coincidencias exactas antes de coincidencias agrupadas.
    """
    if not event:
        return True
    config = get_make_config()
    tasks = config.get('tasks', [])

    # 1. Prioridad: coincidencia exacta por nombre de evento
    for task in tasks:
        if isinstance(task, dict) and task.get('event') == event:
            if task.get('enabled') is False:
                return False

    # 2. Coincidencia agrupada
    for task in tasks:
        if _task_matches_event(task, event):
            if task.get('enabled') is False:
                return False
    return True


def get_configured_make_webhook_url(event: str = None) -> str:
    """
    Obtiene la URL del Webhook de Make configurada.
    Si se especifica un evento:
    - Si la tarea correspondiente está deshabilitada (enabled=False), retorna "".
    - Si la tarea correspondiente tiene endpoint no vacío, retorna dicho endpoint.
    - En caso contrario, retorna el webhook_url global de la configuración o settings.MAKE_WEBHOOK_URL.
    """
    config = get_make_config()
    tasks = config.get('tasks', [])

    if event and tasks:
        # 1. Prioridad: coincidencia exacta por evento
        for task in tasks:
            if isinstance(task, dict) and task.get('event') == event:
                if task.get('enabled') is False:
                    return ""
                task_endpoint = str(task.get('endpoint') or '').strip()
                if task_endpoint:
                    return task_endpoint
                break

        # 2. Coincidencia por grupo
        for task in tasks:
            if _task_matches_event(task, event):
                if task.get('enabled') is False:
                    return ""
                task_endpoint = str(task.get('endpoint') or '').strip()
                if task_endpoint:
                    return task_endpoint
                break

    fallback_url = (config.get('webhook_url') or getattr(settings, 'MAKE_WEBHOOK_URL', '') or '').strip()
    return fallback_url


def send_make_webhook(event: str, data: dict, webhook_url: str = None, timeout: int = 5) -> dict:
    """
    Envía un evento en formato JSON hacia un escenario de Make (Integromat).
    
    :param event: Nombre del evento (ej: 'project.created', 'task.alert', 'budget.updated')
    :param data: Diccionario con la carga útil de datos del evento
    :param webhook_url: URL específica de Make (opcional, si no se provee usa la configurada)
    :param timeout: Tiempo máximo de espera en segundos (default 5s)
    :return: Diccionario con el resultado de la transmisión
    """
    target_url = (webhook_url or get_configured_make_webhook_url(event)).strip()

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
                'message': 'Evento enviado correctamente a Make.',
                'error': None
            }

    except urllib.error.HTTPError as http_err:
        err_body = http_err.read().decode('utf-8', errors='replace') if http_err.fp else ''
        logger.warning(f"[Make Integration] Error HTTP {http_err.code} al enviar a Make: {err_body}")
        return {
            'success': False,
            'status_code': http_err.code,
            'response': err_body,
            'message': 'No fue posible completar la notificación a Make.',
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
