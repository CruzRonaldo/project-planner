"""Reglas transaccionales para incidencias y el historial de Recursos Humanos."""

from datetime import timedelta

from django.db import transaction
from django.db.models import Case, DateField, F, When
from django.utils import timezone
from rest_framework.exceptions import ValidationError

from core.models import PersonnelIncident, TeamMember, TeamMemberChangeLog


ACTIVE_WORKFLOW_STATUSES = ('pending', 'approved')


def incident_return_date(start_date, end_date):
    """Fin exclusivo; una incidencia con fechas iguales representa un día completo."""
    return end_date + timedelta(days=1) if end_date == start_date else end_date


def _member_name(member):
    return f"{member.first_name} {member.last_name}".strip()


def capture_member_state(member):
    return {
        'status_id': member.status_id,
        'status_name': member.status.name if member.status else '',
        'availability': member.availability,
        'project_id': member.project_id,
        'project_name': member.project.name if member.project else '',
    }


def build_field_changes(previous, current):
    changes = {}
    for field in ('status', 'availability', 'project'):
        previous_value = previous.get(f'{field}_id', previous.get(field))
        current_value = current.get(f'{field}_id', current.get(field))
        if previous_value != current_value:
            changes[field] = {
                'previous': previous_value,
                'previous_label': previous.get(f'{field}_name', ''),
                'new': current_value,
                'new_label': current.get(f'{field}_name', ''),
            }
    return changes


def create_change_log(
    *,
    member,
    action,
    source,
    previous=None,
    current=None,
    comment='',
    actor=None,
    incident=None,
):
    previous = previous or capture_member_state(member)
    current = current or capture_member_state(member)
    return TeamMemberChangeLog.objects.create(
        member=member,
        member_name=_member_name(member),
        member_email=member.email,
        incident=incident,
        action=action,
        source=source,
        previous_status_id=previous.get('status_id'),
        new_status_id=current.get('status_id'),
        previous_status_name=previous.get('status_name', ''),
        new_status_name=current.get('status_name', ''),
        previous_availability=previous.get('availability'),
        new_availability=current.get('availability'),
        previous_project_id=previous.get('project_id'),
        new_project_id=current.get('project_id'),
        previous_project_name=previous.get('project_name', ''),
        new_project_name=current.get('project_name', ''),
        field_changes=build_field_changes(previous, current),
        comment=(comment or '').strip(),
        changed_by=actor if getattr(actor, 'is_authenticated', False) else None,
    )


def overlapping_incidents(*, member, start_date, end_date, exclude_id=None):
    """Los rangos son [inicio, retorno); inicio==fin ocupa un día efectivo."""
    effective_end = incident_return_date(start_date, end_date)
    queryset = PersonnelIncident.objects.annotate(
        effective_end=Case(
            When(end_date=F('start_date'), then=F('end_date') + timedelta(days=1)),
            default=F('end_date'),
            output_field=DateField(),
        )
    ).filter(
        member=member,
        workflow_status__in=ACTIVE_WORKFLOW_STATUSES,
        start_date__lt=effective_end,
        effective_end__gt=start_date,
    )
    if exclude_id:
        queryset = queryset.exclude(pk=exclude_id)
    return queryset


def overlapping_backup_assignments(*, member, start_date, end_date, exclude_id=None):
    """Coberturas donde el integrante ya fue comprometido como respaldo."""
    effective_end = incident_return_date(start_date, end_date)
    queryset = PersonnelIncident.objects.annotate(
        effective_end=Case(
            When(end_date=F('start_date'), then=F('end_date') + timedelta(days=1)),
            default=F('end_date'),
            output_field=DateField(),
        )
    ).filter(
        backup_member=member,
        workflow_status__in=ACTIVE_WORKFLOW_STATUSES,
        start_date__lt=effective_end,
        effective_end__gt=start_date,
    )
    if exclude_id:
        queryset = queryset.exclude(pk=exclude_id)
    return queryset


def validate_backup_availability(*, backup_member, member, start_date, end_date, exclude_id=None):
    if not backup_member:
        return
    if backup_member.pk == member.pk:
        raise ValidationError({'backup_member': 'El integrante no puede ser su propio respaldo.'})
    if not backup_member.is_active or backup_member.availability <= 0:
        raise ValidationError({'backup_member': 'El técnico de respaldo debe estar activo y disponible.'})

    primary_conflict = overlapping_incidents(
        member=backup_member,
        start_date=start_date,
        end_date=end_date,
        exclude_id=exclude_id,
    ).exists()
    backup_conflict = overlapping_backup_assignments(
        member=backup_member,
        start_date=start_date,
        end_date=end_date,
        exclude_id=exclude_id,
    )
    if primary_conflict or backup_conflict.exists():
        raise ValidationError({
            'backup_member': 'El técnico de respaldo ya tiene una incidencia o cobertura solapada.'
        })


def _activate_locked(incident, *, actor=None, now=None):
    now = now or timezone.now()
    if incident.workflow_status != 'approved' or incident.applied_at:
        return False

    member = TeamMember.objects.select_for_update().get(pk=incident.member_id)
    backup_member = None
    if incident.backup_member_id:
        backup_member = TeamMember.objects.select_for_update().get(pk=incident.backup_member_id)
    validate_backup_availability(
        backup_member=backup_member,
        member=member,
        start_date=incident.start_date,
        end_date=incident.end_date,
        exclude_id=incident.pk,
    )

    previous = capture_member_state(member)
    incident.previous_status_id = member.status_id
    incident.previous_status_name = previous['status_name']
    incident.previous_availability = member.availability
    incident.applied_at = now
    incident.save(update_fields=[
        'previous_status',
        'previous_status_name',
        'previous_availability',
        'applied_at',
        'updated_at',
    ])

    member.status_id = incident.resulting_status_id
    member.availability = incident.availability
    member.save(update_fields=['status', 'availability', 'updated_at'])
    member.refresh_from_db(fields=['status', 'availability', 'project'])
    create_change_log(
        member=member,
        incident=incident,
        action='incident_approved',
        source='incident',
        previous=previous,
        current=capture_member_state(member),
        comment=(
            f"{incident.get_incident_type_display()}: {incident.start_date} al "
            f"{incident.end_date}. {incident.reason}"
        ),
        actor=actor,
    )
    return True


@transaction.atomic
def approve_incident(incident, *, actor=None, comment=''):
    incident = PersonnelIncident.objects.select_for_update().get(pk=incident.pk)
    member = TeamMember.objects.select_for_update().get(pk=incident.member_id)
    backup_member = None
    if incident.backup_member_id:
        backup_member = TeamMember.objects.select_for_update().get(pk=incident.backup_member_id)
    if incident.workflow_status != 'pending':
        raise ValidationError({'workflow_status': 'Solo se puede aprobar una incidencia pendiente.'})

    today = timezone.localdate()
    return_date = incident_return_date(incident.start_date, incident.end_date)
    if return_date <= today:
        raise ValidationError({'end_date': 'No se puede aprobar una incidencia cuyo retorno ya venció.'})
    if overlapping_incidents(
        member=member,
        start_date=incident.start_date,
        end_date=incident.end_date,
        exclude_id=incident.pk,
    ).exclude(workflow_status='pending').exists():
        raise ValidationError({'member': 'El integrante ya tiene una incidencia aprobada en ese periodo.'})
    if overlapping_backup_assignments(
        member=member,
        start_date=incident.start_date,
        end_date=incident.end_date,
        exclude_id=incident.pk,
    ).exists():
        raise ValidationError({
            'member': 'El integrante ya fue asignado como respaldo durante ese periodo.'
        })
    validate_backup_availability(
        backup_member=backup_member,
        member=member,
        start_date=incident.start_date,
        end_date=incident.end_date,
        exclude_id=incident.pk,
    )

    incident.workflow_status = 'approved'
    incident.reviewed_by = actor if getattr(actor, 'is_authenticated', False) else None
    incident.reviewed_at = timezone.now()
    incident.review_comment = (comment or '').strip()
    incident.save(update_fields=[
        'workflow_status', 'reviewed_by', 'reviewed_at', 'review_comment', 'updated_at'
    ])
    if incident.start_date <= today < return_date:
        _activate_locked(incident, actor=actor, now=incident.reviewed_at)
    return PersonnelIncident.objects.get(pk=incident.pk)


@transaction.atomic
def reject_incident(incident, *, actor=None, comment=''):
    reason = (comment or '').strip()
    if not reason:
        raise ValidationError({'comment': 'Indica el motivo del rechazo.'})
    incident = PersonnelIncident.objects.select_for_update().get(pk=incident.pk)
    if incident.workflow_status != 'pending':
        raise ValidationError({'workflow_status': 'Solo se puede rechazar una incidencia pendiente.'})

    incident.workflow_status = 'rejected'
    incident.reviewed_by = actor if getattr(actor, 'is_authenticated', False) else None
    incident.reviewed_at = timezone.now()
    incident.review_comment = reason
    incident.save(update_fields=[
        'workflow_status', 'reviewed_by', 'reviewed_at', 'review_comment', 'updated_at'
    ])
    member = incident.member
    state = capture_member_state(member)
    create_change_log(
        member=member,
        incident=incident,
        action='incident_rejected',
        source='incident',
        previous=state,
        current=state,
        comment=reason,
        actor=actor,
    )
    return incident


def _has_relevant_manual_change(incident):
    if not incident.applied_at:
        return False
    logs = TeamMemberChangeLog.objects.filter(
        member_id=incident.member_id,
        source='manual',
        created_at__gt=incident.applied_at,
    ).only('field_changes')
    return any(
        {'status', 'availability'}.intersection((log.field_changes or {}).keys())
        for log in logs
    )


@transaction.atomic
def finalize_incident(incident, *, actor=None, comment='', automatic=False, as_of=None):
    incident = PersonnelIncident.objects.select_for_update().get(pk=incident.pk)
    if incident.workflow_status != 'approved':
        raise ValidationError({'workflow_status': 'Solo se puede finalizar una incidencia aprobada.'})

    today = as_of or timezone.localdate()
    if automatic and incident_return_date(incident.start_date, incident.end_date) > today:
        raise ValidationError({'end_date': 'La incidencia todavía no llegó a su fecha de retorno.'})

    member = TeamMember.objects.select_for_update().get(pk=incident.member_id)
    previous = capture_member_state(member)
    restoration_safe = bool(incident.applied_at)
    reasons = []
    if not incident.applied_at:
        restoration_safe = False
        reasons.append('La incidencia aún no había modificado al integrante.')
    if incident.applied_at and (
        member.status_id != incident.resulting_status_id
        or member.availability != incident.availability
    ):
        restoration_safe = False
        reasons.append('El estado o la disponibilidad cambiaron después de aplicar la incidencia.')
    if _has_relevant_manual_change(incident):
        restoration_safe = False
        reasons.append('Existe un cambio manual posterior que no debe sobrescribirse.')
    later_incident = PersonnelIncident.objects.filter(
        member_id=member.pk,
        workflow_status='approved',
        applied_at__gt=incident.applied_at,
    ).exclude(pk=incident.pk).exists() if incident.applied_at else False
    if later_incident:
        restoration_safe = False
        reasons.append('Existe una incidencia posterior aplicada al integrante.')

    if restoration_safe:
        member.status_id = incident.previous_status_id
        if incident.previous_availability is not None:
            member.availability = incident.previous_availability
        member.save(update_fields=['status', 'availability', 'updated_at'])
        member.refresh_from_db(fields=['status', 'availability', 'project'])
        incident.restored_at = timezone.now()
        action = 'automatic_restoration' if automatic else 'incident_finalized'
        source = 'system' if automatic else 'incident'
        log_comment = (comment or '').strip() or 'Estado y disponibilidad restaurados al finalizar la incidencia.'
    else:
        incident.restoration_skipped = True
        incident.restoration_note = ' '.join(reasons)[:255]
        action = 'incident_finalized'
        source = 'system' if automatic else 'incident'
        log_comment = ((comment or '').strip() + ' ' + incident.restoration_note).strip()

    incident.workflow_status = 'finalized'
    if actor and getattr(actor, 'is_authenticated', False):
        incident.reviewed_by = actor
    incident.reviewed_at = timezone.now()
    if comment:
        incident.review_comment = comment.strip()
    incident.save(update_fields=[
        'workflow_status', 'reviewed_by', 'reviewed_at', 'review_comment',
        'restored_at', 'restoration_skipped', 'restoration_note', 'updated_at',
    ])
    create_change_log(
        member=member,
        incident=incident,
        action=action,
        source=source,
        previous=previous,
        current=capture_member_state(member),
        comment=log_comment,
        actor=actor,
    )
    return incident


def process_incident_lifecycle(*, as_of=None):
    """Activa incidencias vigentes y restaura las que llegan a su retorno."""
    today = as_of or timezone.localdate()
    finalized = 0
    activated = 0

    approved = list(PersonnelIncident.objects.filter(workflow_status='approved').only(
        'id', 'start_date', 'end_date', 'applied_at'
    ))
    expired_ids = [
        incident.id for incident in approved
        if incident_return_date(incident.start_date, incident.end_date) <= today
    ]
    for incident_id in expired_ids:
        try:
            finalize_incident(
                PersonnelIncident(pk=incident_id),
                automatic=True,
                as_of=today,
            )
            finalized += 1
        except (PersonnelIncident.DoesNotExist, ValidationError):
            continue

    due_ids = [
        incident.id for incident in approved
        if incident.applied_at is None
        and incident.start_date <= today
        < incident_return_date(incident.start_date, incident.end_date)
    ]
    for incident_id in due_ids:
        try:
            with transaction.atomic():
                incident = PersonnelIncident.objects.select_for_update().get(pk=incident_id)
                if _activate_locked(incident, actor=None):
                    activated += 1
        except (PersonnelIncident.DoesNotExist, ValidationError):
            continue

    return {'activated': activated, 'finalized': finalized}
