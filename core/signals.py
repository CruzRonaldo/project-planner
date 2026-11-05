import datetime
from django.db.models.signals import pre_save, post_save, pre_delete
from django.dispatch import receiver
from .models import Project, ProjectChangeLog


@receiver(pre_save, sender=Project)
def capture_old_project_state(sender, instance, **kwargs):
    """
    Captura el estado previo del proyecto antes de guardar para comparar deltas.
    """
    if instance.pk:
        instance._old_instance = Project.objects.filter(pk=instance.pk).first()
    else:
        instance._old_instance = None


@receiver(post_save, sender=Project)
def log_project_changes(sender, instance, created, **kwargs):
    """
    Genera automáticamente un registro en ProjectChangeLog tras la creación o modificación.
    Usa un esquema compacto libre de redundancias para optimizar almacenamiento en PostgreSQL/Supabase.
    """
    actor_name = getattr(instance, '_actor_name', None) or 'system'
    today = datetime.date.today()

    if created:
        initial_deltas = {
            'name': {'old': None, 'new': instance.name},
            'code': {'old': None, 'new': instance.code},
            'budget': {'old': None, 'new': float(instance.budget) if instance.budget is not None else 0.0},
            'status': {'old': None, 'new': instance.status},
        }
        ProjectChangeLog.objects.create(
            project=instance,
            project_code=instance.code,
            project_name=instance.name,
            action_type='PROJECT_CREATED',
            field_changes=initial_deltas,
            description=f"Alta del proyecto '{instance.name}' ({instance.code})",
            user_name=actor_name,
            date=today,
        )
        return

    old = getattr(instance, '_old_instance', None)
    if not old:
        return

    deltas = {}
    if old.budget != instance.budget:
        deltas['budget'] = {
            'old': float(old.budget) if old.budget is not None else 0.0,
            'new': float(instance.budget) if instance.budget is not None else 0.0,
        }
    if old.status != instance.status:
        deltas['status'] = {
            'old': old.status,
            'new': instance.status,
        }
    if old.start_date != instance.start_date:
        deltas['start_date'] = {
            'old': str(old.start_date) if old.start_date else None,
            'new': str(instance.start_date) if instance.start_date else None,
        }
    if old.end_date != instance.end_date:
        deltas['end_date'] = {
            'old': str(old.end_date) if old.end_date else None,
            'new': str(instance.end_date) if instance.end_date else None,
        }
    if old.name != instance.name:
        deltas['name'] = {
            'old': old.name,
            'new': instance.name,
        }
    if old.description != instance.description:
        deltas['description'] = {
            'old': old.description,
            'new': instance.description,
        }

    # Si no hubo cambios reales en los campos de negocio (o solo updated_at): NO CREAR LOG
    if not deltas:
        return

    # Clasificación simple del evento
    if 'budget' in deltas and len(deltas) == 1:
        action_type = 'BUDGET_UPDATE'
    elif 'status' in deltas and len(deltas) == 1:
        action_type = 'STATUS_CHANGE'
    elif ('start_date' in deltas or 'end_date' in deltas) and len(deltas) <= 2:
        action_type = 'SCHEDULE_SHIFT'
    else:
        action_type = 'PROJECT_UPDATE'

    ProjectChangeLog.objects.create(
        project=instance,
        project_code=instance.code,
        project_name=instance.name,
        action_type=action_type,
        field_changes=deltas,
        user_name=actor_name,
        date=today,
        description='',  # La descripción legible se calcula dinámicamente en el serializer
    )


@receiver(pre_delete, sender=Project)
def log_project_deletion(sender, instance, **kwargs):
    """
    Registra una última línea de auditoría antes de la eliminación física del proyecto.
    Como la FK project tiene on_delete=SET_NULL, el historial se preserva para siempre.
    """
    actor_name = getattr(instance, '_actor_name', None) or 'system'
    today = datetime.date.today()

    ProjectChangeLog.objects.create(
        project=None,
        project_code=instance.code,
        project_name=instance.name,
        action_type='PROJECT_DELETED',
        field_changes={
            'status': {'old': instance.status, 'new': 'DELETED'},
            'budget': {'old': float(instance.budget) if instance.budget is not None else 0.0, 'new': 0.0},
        },
        description=f"Eliminación permanente del proyecto '{instance.name}' ({instance.code})",
        user_name=actor_name,
        date=today,
    )
