import logging
import sys
import threading
from django.conf import settings
from django.db import transaction
from django.db.models.signals import post_save, post_delete, pre_save
from django.dispatch import receiver
from django.contrib.auth import get_user_model

from .models import Project, Task, ProjectMeeting, TeamMember
from .services import make_service

logger = logging.getLogger(__name__)
User = get_user_model()


def _dispatch_async_webhook(event: str, data: dict):
    """
    Despacha el webhook de Make (Integromat) en segundo plano mediante un daemon thread
    sujeto a transaction.on_commit para garantizar que la transacción en PostgreSQL
    haya sido confirmada antes de notificar externamente.
    """
    if not make_service.is_event_enabled(event):
        logger.info(f"[Make Webhook] Evento '{event}' desactivado en la configuración.")
        return

    target_url = make_service.get_configured_make_webhook_url(event)

    def _worker():
        try:
            make_service.send_make_webhook(event=event, data=data, webhook_url=target_url)
        except Exception as exc:
            logger.warning(f"[Make Webhook] Error al enviar evento '{event}': {exc}")

    # En entorno de pruebas (manage.py test), ejecutar de manera síncrona para permitir
    # que los mocks y aserciones de pruebas unitarias funcionen deterministamente.
    if 'test' in sys.argv or getattr(settings, 'TESTING', False):
        _worker()
        return

    # En producción / desarrollo: esperar al commit exitoso de la base de datos
    transaction.on_commit(lambda: threading.Thread(target=_worker, daemon=True).start())


# =========================================================================
# 1. Evento: Creación y Actualización de Proyectos ('project.created')
# =========================================================================
@receiver(post_save, sender=Project)
def handle_project_saved(sender, instance, created, **kwargs):
    assigned_leader = getattr(instance, '_selected_leader', None) or instance.team_members.first()

    # Extraer información del creador (soporta campos o atributos created_by u owner, o fallback en memoria)
    creator = getattr(instance, 'created_by', None) or getattr(instance, 'owner', None)
    creator_email = getattr(instance, '_fallback_creator_email', '') or ''
    creator_name = getattr(instance, '_fallback_creator_name', '') or ''

    if creator:
        creator_email = getattr(creator, 'email', '') or creator_email
        creator_name = (
            getattr(creator, 'username', '')
            or (creator.get_username() if hasattr(creator, 'get_username') else '')
            or getattr(creator, 'get_full_name', lambda: '')()
            or str(creator)
        )

    payload = {
        'id': instance.id,
        'code': instance.code,
        'name': instance.name,
        'description': instance.description or '',
        'start_date': str(instance.start_date),
        'end_date': str(instance.end_date),
        'duration_months': instance.duration_months,
        'budget': float(instance.budget) if instance.budget is not None else 0.0,
        'status': instance.get_status_display(),
        'status_code': instance.status,
        'leader_name': f"{assigned_leader.first_name} {assigned_leader.last_name}".strip() if assigned_leader else 'Sin Asignar',
        'leader_email': assigned_leader.email if assigned_leader else '',
        'leader_role': assigned_leader.role.name if assigned_leader and assigned_leader.role else '',
        'creator_email': creator_email,
        'creator_name': creator_name,
    }

    if created:
        _dispatch_async_webhook(event='project.created', data=payload)
    else:
        _dispatch_async_webhook(event='project.updated', data=payload)


@receiver(post_delete, sender=Project)
def handle_project_deleted(sender, instance, **kwargs):
    payload = {
        'id': instance.id,
        'code': instance.code,
        'name': instance.name,
    }
    _dispatch_async_webhook(event='project.deleted', data=payload)


# =========================================================================
# 2. Evento: Asignación de Líder a Proyecto ('project.leader_assigned')
# =========================================================================
@receiver(pre_save, sender=TeamMember)
def track_team_member_project_change(sender, instance, **kwargs):
    """
    Rastrea el project_id anterior para detectar reasignaciones de proyecto.
    """
    if instance.pk:
        try:
            old = TeamMember.objects.filter(pk=instance.pk).values('project_id').first()
            instance._old_project_id = old['project_id'] if old else None
        except Exception:
            instance._old_project_id = None
    else:
        instance._old_project_id = None


@receiver(post_save, sender=TeamMember)
def handle_leader_assigned(sender, instance, created, **kwargs):
    if not instance.project:
        return

    # Si se marcó para ignorar (ej. durante la creación de un nuevo proyecto, ya cubierto por project.created)
    if getattr(instance, '_skip_leader_assigned_signal', False):
        return

    # Verificar si el rol corresponde a una posición de liderazgo / gestión
    is_leader = False
    if instance.role:
        role_name = (instance.role.name or '').lower()
        is_leader = (
            getattr(instance.role, 'can_manage_projects', False)
            or any(kw in role_name for kw in ['líder', 'lider', 'director', 'coordinador', 'pm', 'lead', 'gerente'])
        )

    old_project_id = getattr(instance, '_old_project_id', None)
    is_explicit_assignment = getattr(instance, '_is_leader_assignment', False)

    # Disparar si es una asignación explícita de líder, o si es líder y es nueva creación o cambio de proyecto
    if is_explicit_assignment or (is_leader and (created or old_project_id != instance.project_id)):
        creator = (
            getattr(instance, '_assigned_by', None)
            or getattr(instance, 'created_by', None)
            or getattr(instance, 'assigned_by', None)
            or getattr(instance, 'owner', None)
        )
        creator_email = getattr(instance, '_fallback_creator_email', '') or ''
        creator_name = getattr(instance, '_fallback_creator_name', '') or ''

        if creator:
            creator_email = getattr(creator, 'email', '') or creator_email
            creator_name = (
                getattr(creator, 'username', '')
                or (creator.get_username() if hasattr(creator, 'get_username') else '')
                or getattr(creator, 'get_full_name', lambda: '')()
                or str(creator)
            )

        leader_name = f"{instance.first_name} {instance.last_name}".strip()
        leader_role = instance.role.name if instance.role else 'Líder Técnico'

        payload = {
            'project_name': instance.project.name,
            'project_code': instance.project.code,
            'leader_name': leader_name,
            'leader_email': instance.email or '',
            'leader_role': leader_role,
            'creator_name': creator_name,
            'creator_email': creator_email,
            'project_id': instance.project.id,
            'leader_id': instance.id,
            'technical_area': instance.technical_area.name if instance.technical_area else '',
        }
        _dispatch_async_webhook(event='project.leader_assigned', data=payload)


@receiver(post_save, sender=TeamMember)
def handle_member_created(sender, instance, created, **kwargs):
    if not created:
        return
    if getattr(instance, '_skip_member_created_signal', False):
        return
    # Evitar colisión si es líder, o enviar de todas formas los datos del nuevo miembro
    name = f"{instance.first_name} {instance.last_name}".strip()
    payload = {
        'member_id': instance.id,
        'first_name': instance.first_name,
        'last_name': instance.last_name,
        'name': name,
        'email': instance.email or '',
        'role': instance.role.name if instance.role else '',
        'technical_area': instance.technical_area.name if instance.technical_area else '',
        'project_name': instance.project.name if instance.project else '',
        'project_code': instance.project.code if instance.project else '',
        'status': instance.status.name if instance.status else '',
    }
    _dispatch_async_webhook(event='member.created', data=payload)


# =========================================================================
# 3. Evento: Asignación de Trabajo/Tarea a un Usuario ('task.assigned')
# =========================================================================
@receiver(pre_save, sender=Task)
def track_task_assignment_change(sender, instance, **kwargs):
    """
    Rastrea el assigned_to_id previo para disparar webhook solo ante nuevas asignaciones.
    """
    if instance.pk:
        try:
            old = Task.objects.filter(pk=instance.pk).values('assigned_to_id').first()
            instance._old_assigned_to_id = old['assigned_to_id'] if old else None
        except Exception:
            instance._old_assigned_to_id = None
    else:
        instance._old_assigned_to_id = None


@receiver(post_save, sender=Task)
def handle_task_assigned(sender, instance, created, **kwargs):
    if not instance.assigned_to:
        return

    old_assigned_to_id = getattr(instance, '_old_assigned_to_id', None)
    # Notificar si se creó con responsable o si el responsable fue reasignado
    if created or old_assigned_to_id != instance.assigned_to_id:
        assigned_member = instance.assigned_to
        system_user = User.objects.filter(email__iexact=assigned_member.email).first()

        creator = (
            getattr(instance, '_assigned_by', None)
            or getattr(instance, 'created_by', None)
            or getattr(instance, 'assigned_by', None)
            or getattr(instance, 'owner', None)
        )
        creator_email = getattr(instance, '_fallback_creator_email', '') or ''
        creator_name = getattr(instance, '_fallback_creator_name', '') or ''

        if creator:
            creator_email = getattr(creator, 'email', '') or creator_email
            creator_name = (
                getattr(creator, 'username', '')
                or (creator.get_username() if hasattr(creator, 'get_username') else '')
                or getattr(creator, 'get_full_name', lambda: '')()
                or str(creator)
            )

        priority = getattr(instance, '_priority', None) or ('Alta' if instance.is_critical_path else 'Media')
        due_date = getattr(instance, '_due_date', None) or (str(instance.end_date) if instance.end_date else '')
        project_name = instance.project.name if instance.project else ''
        project_code = instance.project.code if instance.project else ''
        assignee_name = f"{assigned_member.first_name} {assigned_member.last_name}".strip()
        assignee_email = assigned_member.email or ''

        payload = {
            'title': instance.title,
            'project_name': project_name,
            'project_code': project_code,
            'priority': priority,
            'due_date': str(due_date),
            'assignee_name': assignee_name,
            'assignee_email': assignee_email,
            'creator_name': creator_name,
            'creator_email': creator_email,
            'task_id': instance.id,
            'task_title': instance.title,
            'task_description': instance.description or '',
            'start_date': str(instance.start_date) if instance.start_date else '',
            'end_date': str(instance.end_date) if instance.end_date else '',
            'duration_days': instance.duration_days,
            'status': instance.get_status_display(),
            'is_critical_path': instance.is_critical_path,
            'project': {
                'id': instance.project.id if instance.project else None,
                'code': project_code,
                'name': project_name,
            },
            'assignee': {
                'id': assigned_member.id,
                'name': assignee_name,
                'email': assignee_email,
                'username': system_user.username if system_user else (assignee_email.split('@')[0] if assignee_email else ''),
                'technical_area': assigned_member.technical_area.name if assigned_member.technical_area else '',
                'role': assigned_member.role.name if assigned_member.role else '',
            }
        }
        _dispatch_async_webhook(event='task.assigned', data=payload)


# =========================================================================
# 4. Evento: Inicio o Agendamiento de Videoconferencia ('meeting.created')
# =========================================================================
@receiver(post_save, sender=ProjectMeeting)
def handle_meeting_created(sender, instance, created, **kwargs):
    if not created:
        return

    # Extraer correos electrónicos de los miembros asignados al proyecto
    team_emails = []
    seen_emails = set()

    if instance.project:
        # Optimización de consulta directa a la base de datos (evita instanciar modelos)
        member_emails = (
            instance.project.team_members
            .exclude(email__isnull=True)
            .exclude(email__exact='')
            .values_list('email', flat=True)
        )
        for email in member_emails:
            clean_email = email.strip()
            if clean_email and clean_email.lower() not in seen_emails:
                seen_emails.add(clean_email.lower())
                team_emails.append(clean_email)

    # Extraer correo del organizador (created_by)
    organizer_email = instance.created_by.email if instance.created_by and instance.created_by.email else ''
    if organizer_email:
        clean_organizer = organizer_email.strip()
        if clean_organizer and clean_organizer.lower() not in seen_emails:
            seen_emails.add(clean_organizer.lower())
            team_emails.append(clean_organizer)

    payload = {
        'meeting_id': str(instance.id),
        'project_code': instance.project.code if instance.project else '',
        'project_name': instance.project.name if instance.project else '',
        'title': instance.title,
        'room_name': instance.room_name,
        'meeting_url': instance.meeting_url,
        'scheduled_at': instance.scheduled_at.isoformat() if instance.scheduled_at else None,
        'created_by': {
            'username': instance.created_by.username if instance.created_by else 'Sistema',
            'email': instance.created_by.email if instance.created_by else '',
        },
        'team_emails': team_emails,
    }
    _dispatch_async_webhook(event='meeting.created', data=payload)
