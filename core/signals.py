import datetime
from django.db.models.signals import pre_save, post_save
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
    """
    actor_name = getattr(instance, '_actor_name', None) or 'Administrador'
    today = datetime.date.today()

    if created:
        ProjectChangeLog.objects.create(
            project=instance,
            description=f"Alta del proyecto '{instance.name}' ({instance.code})",
            user_name=actor_name,
            date=today,
        )
        return

    old = getattr(instance, '_old_instance', None)
    if not old:
        return

    changes = []
    # 1. Cambio de Presupuesto
    if old.budget != instance.budget:
        old_b = f"${old.budget:,.2f}" if old.budget is not None else "$0.00"
        new_b = f"${instance.budget:,.2f}" if instance.budget is not None else "$0.00"
        changes.append(f"Presupuesto ajustado de {old_b} a {new_b}")

    # 2. Cambio de Estado
    if old.status != instance.status:
        old_st = old.get_status_display()
        new_st = instance.get_status_display()
        changes.append(f"Estado cambiado de '{old_st}' a '{new_st}'")

    # 3. Cambio de Cronograma (Fechas)
    if old.start_date != instance.start_date or old.end_date != instance.end_date:
        changes.append(f"Cronograma reprogramado ({old.start_date}..{old.end_date} ➔ {instance.start_date}..{instance.end_date})")

    # 4. Cambio de Nombre o Descripción
    if old.name != instance.name:
        changes.append(f"Nombre actualizado de '{old.name}' a '{instance.name}'")

    if not changes:
        changes.append("Actualización general de metadatos")

    for desc in changes:
        ProjectChangeLog.objects.create(
            project=instance,
            description=desc,
            user_name=actor_name,
            date=today,
        )
