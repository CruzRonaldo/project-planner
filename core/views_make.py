import logging
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from .services.make_service import (
    compute_make_status,
    extract_make_zone,
    fetch_make_account_usage,
    get_configured_make_webhook_url,
    get_make_config,
    save_make_config,
    send_make_webhook,
    test_make_connection,
)
from .models import Project, Task, Milestone, SecurityAuditLog

logger = logging.getLogger(__name__)
User = get_user_model()


def _extract_client_ip(request) -> str | None:
    """Extrae la IP del cliente desde cabeceras proxy o REMOTE_ADDR (máx. 45 chars)."""
    ip_addr = request.META.get('HTTP_X_FORWARDED_FOR') or request.META.get('REMOTE_ADDR')
    if not ip_addr:
        return None
    if ',' in ip_addr:
        ip_addr = ip_addr.split(',')[0].strip()
    else:
        ip_addr = ip_addr.strip()
    return ip_addr[:45] if ip_addr else None


def _resolve_audit_actor(request):
    """Obtiene el usuario autenticado o un fallback administrativo para auditoría."""
    req_user = getattr(request, 'user', None)
    if req_user is not None and getattr(req_user, 'is_authenticated', False):
        return req_user
    return User.objects.filter(is_superuser=True).first() or User.objects.first()


def _detect_make_config_changes(old_cfg: dict, saved_cfg: dict) -> list[str]:
    """Compara la configuración anterior y guardada de Make y describe las diferencias."""
    changes = []
    old_url = (old_cfg.get('webhook_url') or '').strip()
    new_url = (saved_cfg.get('webhook_url') or '').strip()
    if old_url != new_url:
        changes.append(f"URL global ({old_url or 'vacía'} -> {new_url or 'vacía'})")

    old_freq = old_cfg.get('frequency')
    new_freq = saved_cfg.get('frequency')
    if old_freq != new_freq:
        changes.append(f"Frecuencia ({old_freq} -> {new_freq})")

    old_status = old_cfg.get('status')
    new_status = saved_cfg.get('status')
    if old_status != new_status:
        changes.append(f"Estado ({old_status} -> {new_status})")

    old_token = (old_cfg.get('api_token') or '').strip()
    new_token = (saved_cfg.get('api_token') or '').strip()
    if old_token != new_token:
        changes.append("Token de API de Make actualizado")

    old_tasks_by_id = {
        t.get('id'): t
        for t in (old_cfg.get('tasks') or [])
        if isinstance(t, dict) and t.get('id')
    }
    for task in (saved_cfg.get('tasks') or []):
        if not isinstance(task, dict):
            continue
        task_id = task.get('id')
        task_label = task.get('name') or task_id or 'Tarea'
        old_task = old_tasks_by_id.get(task_id) if task_id else None

        if old_task is None:
            state_lbl = 'activada' if bool(task.get('enabled', True)) else 'desactivada'
            changes.append(f"Tarea '{task_label}' configurada ({state_lbl})")
            if (task.get('api_token') or '').strip():
                changes.append(f"Token de API de '{task_label}' actualizado")
            continue

        old_enabled = bool(old_task.get('enabled', True))
        new_enabled = bool(task.get('enabled', True))
        if old_enabled != new_enabled:
            state_lbl = 'activada' if new_enabled else 'desactivada'
            changes.append(f"Tarea '{task_label}' {state_lbl}")

        old_ep = (old_task.get('endpoint') or '').strip()
        new_ep = (task.get('endpoint') or '').strip()
        if old_ep != new_ep:
            changes.append(f"Endpoint de '{task_label}' ({old_ep or 'vacío'} -> {new_ep or 'vacío'})")

        old_task_token = (old_task.get('api_token') or '').strip()
        new_task_token = (task.get('api_token') or '').strip()
        if old_task_token != new_task_token:
            changes.append(f"Token de API de '{task_label}' actualizado")

    return changes


def _record_make_config_audit(request, old_cfg: dict, saved_cfg: dict) -> None:
    """Registra en SecurityAuditLog las modificaciones realizadas a la configuración de Make."""
    changes = _detect_make_config_changes(old_cfg, saved_cfg)
    if not changes:
        return

    try:
        actor_user = _resolve_audit_actor(request)
        if not actor_user:
            logger.warning("[Make Config View] No se pudo registrar auditoría: no hay usuario disponible.")
            return

        actor_name = f"{actor_user.first_name} {actor_user.last_name}".strip() or actor_user.username
        ip_addr = _extract_client_ip(request)
        old_url = (old_cfg.get('webhook_url') or '').strip()
        new_url = (saved_cfg.get('webhook_url') or '').strip()
        desc = (
            f"El usuario **{actor_name}** modificó la configuración de integraciones "
            f"(Make/Webhooks). Cambios: {'; '.join(changes)}."
        )

        SecurityAuditLog.objects.create(
            user=actor_user,
            action='integration_update',
            description=desc,
            old_value=(old_url or '')[:255],
            new_value=(new_url or '')[:255],
            ip_address=ip_addr if ip_addr and len(ip_addr) <= 45 else None,
        )
    except Exception as audit_err:
        logger.warning(f"[Make Config View] Error al registrar SecurityAuditLog: {audit_err}")


def _sanitize_task_for_response(task: dict, include_usage: bool = False) -> dict:
    """
    Prepara una tarea para la respuesta HTTP removiendo api_token en texto plano
    y adjuntando has_api_token y opcionalmente el consumo de operaciones de Make.
    """
    safe_task = dict(task)
    task_token = str(safe_task.pop('api_token', '') or '').strip()
    if task_token:
        safe_task['has_api_token'] = True
        if include_usage:
            task_zone = extract_make_zone(safe_task.get('endpoint'))
            safe_task['usage'] = fetch_make_account_usage(task_token, zone=task_zone)
    else:
        safe_task['has_api_token'] = False
        if include_usage:
            safe_task['usage'] = None
    return safe_task


@api_view(['GET'])
@permission_classes([AllowAny])
def make_status_view(request):
    """
    Retorna el estado de configuración de la integración con Make.
    """
    cfg = get_make_config()
    webhook_url = cfg.get('webhook_url', '') or ''
    raw_tasks = cfg.get('tasks', [])
    is_configured = bool(webhook_url)
    computed_status = compute_make_status(raw_tasks, webhook_url)
    zone = extract_make_zone(webhook_url)
    api_token = cfg.get('api_token', '') or ''
    usage_data = fetch_make_account_usage(api_token=api_token, zone=zone)

    tasks = [
        _sanitize_task_for_response(task, include_usage=True)
        for task in raw_tasks
        if isinstance(task, dict)
    ]

    # Enmascarar la URL por seguridad para el frontend
    masked_url = ""
    if is_configured:
        if len(webhook_url) > 20:
            masked_url = f"{webhook_url[:12]}...{webhook_url[-8:]}"
        else:
            masked_url = "***"

    return Response({
        'status': computed_status,
        'integration': 'make',
        'name': 'Make (Integromat)',
        'is_configured': is_configured,
        'webhook_url': webhook_url,
        'configured_endpoint': masked_url,
        'has_webhook_url': is_configured,
        'has_api_token': bool(api_token),
        'usage': usage_data,
        'frequency': 'Tiempo real',
        'tasks': tasks,
        'message': 'Integración lista para recibir y enviar eventos.' if is_configured else 'Falta configurar la URL del Webhook de Make en el backend.'
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([AllowAny])
def save_make_config_view(request):
    """
    Guarda la configuración persistente de Make (webhook_url, tareas y token opcional).
    """
    try:
        old_cfg = get_make_config()
        saved_cfg = save_make_config(request.data or {})
        _record_make_config_audit(request, old_cfg, saved_cfg)
        safe_tasks = [
            _sanitize_task_for_response(task, include_usage=False)
            for task in (saved_cfg.get('tasks') or [])
            if isinstance(task, dict)
        ]
        safe_cfg = {
            **saved_cfg,
            'tasks': safe_tasks,
            'has_api_token': bool(saved_cfg.get('api_token')),
        }
        safe_cfg.pop('api_token', None)
        return Response({
            'status': 'success',
            'message': 'Configuración de Make guardada con éxito.',
            'config': safe_cfg
        }, status=status.HTTP_200_OK)
    except Exception as exc:
        logger.error(f"[Make Config View] Error al guardar configuración: {exc}")
        return Response({
            'status': 'error',
            'message': f'Error al guardar la configuración de Make: {str(exc)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


def _build_make_diagnostic_message(result: dict) -> str:
    """Construye un mensaje descriptivo de primer nivel a partir del resultado de Make."""
    if result.get('success'):
        return result.get('message') or 'Operación completada correctamente en Make.'

    if result.get('error') == 'MISSING_WEBHOOK_URL' and result.get('message'):
        return result['message']

    raw_response = str(result.get('response') or '').strip()
    status_code = result.get('status_code')

    if 'Queue is full' in raw_response:
        return (
            'Make rechazó la conexión: "Queue is full" '
            '(La cuenta agotó sus créditos/operaciones o el escenario está pausado en Make.com).'
        )
    if status_code == 404:
        return (
            'Make no encontró el webhook (HTTP 404). '
            'Verifica que el escenario exista y esté activo en Make.com.'
        )
    if status_code == 400:
        return f'Make rechazó la solicitud (HTTP 400): {raw_response or "Parámetros inválidos"}'
    return result.get('message') or f'Error al conectar con Make (HTTP {status_code}).'


@api_view(['POST'])
@permission_classes([AllowAny])
def test_make_connection_view(request):
    """
    Endpoint para probar la conectividad con Make.
    Puede recibir opcionalmente {"webhook_url": "https://hook.make.com/..."} en el body.
    """
    custom_url = request.data.get('webhook_url') if isinstance(request.data, dict) else None

    result = test_make_connection(webhook_url=custom_url)
    http_status = status.HTTP_200_OK if result['success'] else status.HTTP_400_BAD_REQUEST
    message = _build_make_diagnostic_message(result)

    return Response({
        'status': 'success' if result['success'] else 'error',
        'message': message,
        'detail': message,
        'data': result,
    }, status=http_status)


@api_view(['POST'])
@permission_classes([AllowAny])
def trigger_make_event_view(request):
    """
    Dispara un evento arbitrario hacia Make.
    Body esperado:
    {
        "event": "project.alert",
        "data": { ... },
        "webhook_url": "opcional"
    }
    """
    event_name = request.data.get('event')
    event_data = request.data.get('data', {})
    custom_url = request.data.get('webhook_url')

    if not event_name:
        return Response({
            'status': 'error',
            'message': "El campo 'event' es requerido (ej: 'project.created', 'task.alert')."
        }, status=status.HTTP_400_BAD_REQUEST)

    result = send_make_webhook(event=event_name, data=event_data, webhook_url=custom_url)
    http_status = status.HTTP_200_OK if result['success'] else status.HTTP_502_BAD_GATEWAY
    message = _build_make_diagnostic_message(result)

    return Response({
        'status': 'success' if result['success'] else 'error',
        'message': message,
        'detail': message,
        'data': result,
        'result': result,
    }, status=http_status)


@api_view(['POST'])
@permission_classes([AllowAny])
def make_incoming_webhook_view(request):
    """
    Endpoint receptor para llamadas entrantes desde Make hacia Project Planner.
    Permite que un escenario de Make envíe actualizaciones o confirmaciones.
    Ejemplo de payload recibido desde Make:
    {
        "action": "update_budget",
        "project_id": 1,
        "new_budget": 150000.0,
        "notes": "Ajuste automático desde escenario de Make"
    }
    """
    payload = request.data
    action = payload.get('action')

    logger.info(f"[Make Incoming Webhook] Acción recibida: {action}")

    if action == 'update_budget':
        project_id = payload.get('project_id')
        new_budget = payload.get('new_budget')

        if not project_id or new_budget is None:
            return Response({
                'status': 'error',
                'message': "Se requieren 'project_id' y 'new_budget' para la acción 'update_budget'."
            }, status=status.HTTP_400_BAD_REQUEST)

        try:
            project = Project.objects.get(id=project_id)
            old_budget = float(project.budget)
            project.budget = float(new_budget)
            project.save(update_fields=['budget'])

            return Response({
                'status': 'success',
                'message': f"Presupuesto del proyecto '{project.name}' actualizado de {old_budget} a {new_budget}.",
                'project_id': project.id,
                'new_budget': project.budget
            }, status=status.HTTP_200_OK)

        except Project.DoesNotExist:
            return Response({
                'status': 'error',
                'message': f"No se encontró el proyecto con ID {project_id}."
            }, status=status.HTTP_404_NOT_FOUND)

    elif action == 'ping':
        return Response({
            'status': 'success',
            'message': 'Pong desde Project Planner. Receptor de Make activo.'
        }, status=status.HTTP_200_OK)

    # Acción genérica / log
    return Response({
        'status': 'success',
        'message': f"Webhook entrante procesado para la acción '{action}'.",
        'received_payload': payload
    }, status=status.HTTP_200_OK)
