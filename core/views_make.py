import logging
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from .services.make_service import (
    get_configured_make_webhook_url,
    send_make_webhook,
    test_make_connection,
)
from .models import Project, Task, Milestone

logger = logging.getLogger(__name__)


@api_view(['GET'])
@permission_classes([AllowAny])
def make_status_view(request):
    """
    Retorna el estado de configuración de la integración con Make.
    """
    webhook_url = get_configured_make_webhook_url()
    is_configured = bool(webhook_url)

    # Enmascarar la URL por seguridad para el frontend
    masked_url = ""
    if is_configured:
        if len(webhook_url) > 20:
            masked_url = f"{webhook_url[:12]}...{webhook_url[-8:]}"
        else:
            masked_url = "***"

    return Response({
        'status': 'success',
        'integration': 'make',
        'name': 'Make (Integromat)',
        'is_configured': is_configured,
        'configured_endpoint': masked_url,
        'has_webhook_url': is_configured,
        'message': 'Integración lista para recibir y enviar eventos.' if is_configured else 'Falta configurar la URL del Webhook de Make en el backend.'
    }, status=status.HTTP_200_OK)


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

    return Response({
        'status': 'success' if result['success'] else 'error',
        'data': result
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

    return Response({
        'status': 'success' if result['success'] else 'error',
        'result': result
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
