import re

from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import transaction
from django.utils import timezone
from rest_framework import serializers

from .models import (
    TechnicalArea,
    Role,
    TeamStatus,
    TeamMember,
    TeamMemberChangeLog,
    PersonnelIncident,
    Project,
    Milestone,
    Task,
    PerformanceMetric,
    DriveLink,
    ProjectMeeting,
)


class TechnicalAreaSerializer(serializers.ModelSerializer):
    """
    Serializador para las áreas técnicas (Arquitectura, Estructuras, Sistemas)
    """
    members_count = serializers.IntegerField(source='members.count', read_only=True)
    roles_count = serializers.IntegerField(source='roles.count', read_only=True)

    class Meta:
        model = TechnicalArea
        fields = ['id', 'name', 'description', 'members_count', 'roles_count', 'created_at']


class RoleSerializer(serializers.ModelSerializer):
    """
    Serializador para roles y cargos técnicos por área con funciones y capacidades
    """
    technical_area_name = serializers.ReadOnlyField(source='technical_area.name')
    members_count = serializers.IntegerField(source='members.count', read_only=True)

    class Meta:
        model = Role
        fields = [
            'id',
            'technical_area',
            'technical_area_name',
            'name',
            'description',
            'can_manage_projects',
            'can_manage_tasks',
            'can_view_metrics',
            'members_count',
            'created_at',
        ]


class TeamStatusSerializer(serializers.ModelSerializer):
    """
    Serializador para los estados del personal (Active, Stand-by, Support)
    """
    class Meta:
        model = TeamStatus
        fields = ['id', 'name', 'description', 'color_code']


class TeamMemberSerializer(serializers.ModelSerializer):
    """
    Serializador para el personal técnico, incluyendo nombres legibles de área, rol y estado
    """
    technical_area_name = serializers.ReadOnlyField(source='technical_area.name')
    role_name = serializers.ReadOnlyField(source='role.name')
    status_name = serializers.ReadOnlyField(source='status.name')
    status_color = serializers.ReadOnlyField(source='status.color_code')
    project_code = serializers.ReadOnlyField(source='project.code')
    project_name = serializers.ReadOnlyField(source='project.name')
    full_name = serializers.SerializerMethodField()
    change_comment = serializers.CharField(
        write_only=True,
        required=False,
        allow_blank=True,
        max_length=500,
    )

    class Meta:
        model = TeamMember
        fields = [
            'id',
            'first_name',
            'last_name',
            'full_name',
            'email',
            'role',
            'role_name',
            'technical_area',
            'technical_area_name',
            'status',
            'status_name',
            'status_color',
            'project',
            'project_code',
            'project_name',
            'availability',
            'allocation_percentage',
            'is_active',
            'created_at',
            'updated_at',
            'change_comment',
        ]

    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}"

    def update(self, instance, validated_data):
        validated_data.pop('change_comment', None)
        return super().update(instance, validated_data)


def _frontend_status_code(name):
    normalized = re.sub(r'[\s_-]+', '', (name or '').strip().lower())
    if normalized in {'active', 'activo', 'activoenobra'}:
        return 'active'
    if normalized in {'standby', 'enespera', 'fueradeobra'}:
        return 'standby'
    if normalized in {'support', 'apoyo', 'enapoyo'}:
        return 'support'
    return normalized or 'standby'


class PersonnelIncidentSerializer(serializers.ModelSerializer):
    member_name = serializers.SerializerMethodField()
    incident_type_display = serializers.CharField(source='get_incident_type_display', read_only=True)
    resulting_status_name = serializers.ReadOnlyField(source='resulting_status.name')
    backup_member_name = serializers.SerializerMethodField()
    workflow_status_display = serializers.CharField(source='get_workflow_status_display', read_only=True)
    created_by_name = serializers.SerializerMethodField()
    reviewed_by_name = serializers.SerializerMethodField()
    duration_days = serializers.SerializerMethodField()
    registeredAt = serializers.SerializerMethodField()
    memberId = serializers.IntegerField(source='member_id', read_only=True)
    memberName = serializers.SerializerMethodField()
    type = serializers.CharField(source='incident_type', read_only=True)
    typeLabel = serializers.CharField(source='get_incident_type_display', read_only=True)
    startDate = serializers.DateField(source='start_date', read_only=True)
    endDate = serializers.DateField(source='end_date', read_only=True)
    status = serializers.SerializerMethodField()
    backupMemberId = serializers.IntegerField(source='backup_member_id', read_only=True)
    backupMemberName = serializers.SerializerMethodField()
    comment = serializers.CharField(source='reason', read_only=True)

    class Meta:
        model = PersonnelIncident
        fields = [
            'id', 'member', 'member_name', 'incident_type', 'incident_type_display',
            'start_date', 'end_date', 'resulting_status', 'resulting_status_name',
            'availability', 'backup_member', 'backup_member_name', 'reason',
            'workflow_status', 'workflow_status_display', 'previous_status',
            'previous_status_name', 'previous_availability', 'applied_at',
            'restored_at', 'restoration_skipped', 'restoration_note',
            'created_by', 'created_by_name', 'reviewed_by', 'reviewed_by_name',
            'reviewed_at', 'review_comment', 'created_at', 'updated_at',
            'duration_days', 'registeredAt', 'memberId', 'memberName', 'type',
            'typeLabel', 'startDate', 'endDate', 'status', 'backupMemberId',
            'backupMemberName', 'comment',
        ]
        read_only_fields = [
            'workflow_status', 'previous_status', 'previous_status_name',
            'previous_availability', 'applied_at', 'restored_at',
            'restoration_skipped', 'restoration_note', 'created_by', 'reviewed_by',
            'reviewed_at', 'review_comment', 'created_at', 'updated_at',
        ]

    @staticmethod
    def _related_id(value):
        if value in (None, ''):
            return None
        if isinstance(value, int):
            return value
        match = re.search(r'(\d+)$', str(value).strip())
        return int(match.group(1)) if match else value

    def to_internal_value(self, data):
        data = data.copy() if hasattr(data, 'copy') else dict(data)
        aliases = {
            'memberId': 'member',
            'type': 'incident_type',
            'startDate': 'start_date',
            'endDate': 'end_date',
            'backupMemberId': 'backup_member',
            'comment': 'reason',
        }
        for source, target in aliases.items():
            if source in data and target not in data:
                data[target] = data[source]
        if 'status' in data and 'resulting_status' not in data:
            data['resulting_status'] = data['status']

        for field in ('member', 'backup_member'):
            if field in data:
                data[field] = self._related_id(data[field])

        raw_status = data.get('resulting_status')
        if raw_status not in (None, '') and not str(raw_status).isdigit():
            candidates = {
                'active': ('Active', 'Activo'),
                'standby': ('Stand-by', 'Standby', 'En espera'),
                'support': ('Support', 'Apoyo', 'En apoyo'),
            }.get(_frontend_status_code(str(raw_status)), (str(raw_status),))
            status_record = TeamStatus.objects.filter(name__iexact=candidates[0]).first()
            if not status_record:
                for candidate in candidates[1:]:
                    status_record = TeamStatus.objects.filter(name__iexact=candidate).first()
                    if status_record:
                        break
            if not status_record:
                raise serializers.ValidationError({
                    'resulting_status': 'No se encontró el estado operativo indicado.'
                })
            data['resulting_status'] = status_record.pk
        return super().to_internal_value(data)

    def validate(self, attrs):
        from .services.personnel_incidents import (
            overlapping_backup_assignments,
            overlapping_incidents,
            validate_backup_availability,
        )

        member = attrs.get('member', getattr(self.instance, 'member', None))
        start_date = attrs.get('start_date', getattr(self.instance, 'start_date', None))
        end_date = attrs.get('end_date', getattr(self.instance, 'end_date', None))
        backup_member = attrs.get('backup_member', getattr(self.instance, 'backup_member', None))
        reason = attrs.get('reason', getattr(self.instance, 'reason', ''))

        if self.instance and self.instance.workflow_status != 'pending' and attrs:
            raise serializers.ValidationError(
                'Solo se puede editar una incidencia mientras está pendiente.'
            )
        if start_date and end_date and end_date < start_date:
            raise serializers.ValidationError({
                'end_date': 'La fecha de retorno no puede ser anterior a la fecha de inicio.'
            })
        if reason is not None and len(reason.strip()) < 5:
            raise serializers.ValidationError({
                'reason': 'Detalla el motivo de la incidencia con al menos 5 caracteres.'
            })
        if member and not member.is_active:
            raise serializers.ValidationError({'member': 'El integrante seleccionado está inactivo.'})
        if member and start_date and end_date and overlapping_incidents(
            member=member,
            start_date=start_date,
            end_date=end_date,
            exclude_id=getattr(self.instance, 'pk', None),
        ).exists():
            raise serializers.ValidationError({
                'member': 'El integrante ya tiene una incidencia pendiente o aprobada en ese periodo.'
            })
        if member and start_date and end_date and overlapping_backup_assignments(
            member=member,
            start_date=start_date,
            end_date=end_date,
            exclude_id=getattr(self.instance, 'pk', None),
        ).exists():
            raise serializers.ValidationError({
                'member': 'El integrante ya fue asignado como respaldo durante ese periodo.'
            })
        if member and start_date and end_date:
            validate_backup_availability(
                backup_member=backup_member,
                member=member,
                start_date=start_date,
                end_date=end_date,
                exclude_id=getattr(self.instance, 'pk', None),
            )
        return attrs

    @transaction.atomic
    def create(self, validated_data):
        from .services.personnel_incidents import (
            capture_member_state,
            create_change_log,
            overlapping_backup_assignments,
            overlapping_incidents,
            validate_backup_availability,
        )

        member = TeamMember.objects.select_for_update().get(pk=validated_data['member'].pk)
        backup_member = validated_data.get('backup_member')
        if backup_member:
            backup_member = TeamMember.objects.select_for_update().get(pk=backup_member.pk)
            validated_data['backup_member'] = backup_member
        if overlapping_incidents(
            member=member,
            start_date=validated_data['start_date'],
            end_date=validated_data['end_date'],
        ).exists():
            raise serializers.ValidationError({
                'member': 'El integrante ya tiene una incidencia pendiente o aprobada en ese periodo.'
            })
        if overlapping_backup_assignments(
            member=member,
            start_date=validated_data['start_date'],
            end_date=validated_data['end_date'],
        ).exists():
            raise serializers.ValidationError({
                'member': 'El integrante ya fue asignado como respaldo durante ese periodo.'
            })
        validate_backup_availability(
            backup_member=backup_member,
            member=member,
            start_date=validated_data['start_date'],
            end_date=validated_data['end_date'],
        )
        incident = PersonnelIncident.objects.create(**validated_data)
        state = capture_member_state(member)
        create_change_log(
            member=member,
            incident=incident,
            action='incident_created',
            source='incident',
            previous=state,
            current=state,
            comment=incident.reason,
            actor=incident.created_by,
        )
        return incident

    def get_member_name(self, obj):
        return f"{obj.member.first_name} {obj.member.last_name}".strip()

    def get_memberName(self, obj):
        return self.get_member_name(obj)

    def get_backup_member_name(self, obj):
        if not obj.backup_member:
            return ''
        return f"{obj.backup_member.first_name} {obj.backup_member.last_name}".strip()

    def get_backupMemberName(self, obj):
        return self.get_backup_member_name(obj)

    def get_created_by_name(self, obj):
        if not obj.created_by:
            return ''
        return obj.created_by.get_full_name() or obj.created_by.username

    def get_reviewed_by_name(self, obj):
        if not obj.reviewed_by:
            return ''
        return obj.reviewed_by.get_full_name() or obj.reviewed_by.username

    def get_duration_days(self, obj):
        return max(1, (obj.end_date - obj.start_date).days)

    def get_registeredAt(self, obj):
        return timezone.localtime(obj.created_at).date().isoformat()

    def get_status(self, obj):
        return _frontend_status_code(obj.resulting_status.name)


class TeamMemberChangeLogSerializer(serializers.ModelSerializer):
    changed_by_name = serializers.SerializerMethodField()
    date = serializers.SerializerMethodField()
    name = serializers.CharField(source='member_name', read_only=True)
    previousStatus = serializers.SerializerMethodField()
    nextStatus = serializers.SerializerMethodField()

    class Meta:
        model = TeamMemberChangeLog
        fields = [
            'id', 'member', 'member_name', 'member_email', 'incident', 'action',
            'source', 'previous_status', 'new_status', 'previous_status_name',
            'new_status_name', 'previous_availability', 'new_availability',
            'previous_project', 'new_project', 'previous_project_name',
            'new_project_name', 'field_changes', 'comment', 'changed_by',
            'changed_by_name', 'created_at', 'date', 'name', 'previousStatus',
            'nextStatus',
        ]
        read_only_fields = fields

    def get_changed_by_name(self, obj):
        if not obj.changed_by:
            return 'Sistema'
        return obj.changed_by.get_full_name() or obj.changed_by.username

    def get_date(self, obj):
        return timezone.localtime(obj.created_at).date().isoformat()

    def get_previousStatus(self, obj):
        return _frontend_status_code(obj.previous_status_name)

    def get_nextStatus(self, obj):
        return _frontend_status_code(obj.new_status_name)


STATUS_TO_BACKEND_MILESTONE = {
    'pending': 'PENDING',
    'upcoming': 'IN_PROGRESS',
    'in_progress': 'IN_PROGRESS',
    'completed': 'COMPLETED',
    'delayed': 'DELAYED',
    'PENDING': 'PENDING',
    'IN_PROGRESS': 'IN_PROGRESS',
    'COMPLETED': 'COMPLETED',
    'DELAYED': 'DELAYED',
}

STATUS_TO_FRONTEND_MILESTONE = {
    'PENDING': 'pending',
    'IN_PROGRESS': 'upcoming',
    'COMPLETED': 'completed',
    'DELAYED': 'delayed',
}


class MilestoneSerializer(serializers.ModelSerializer):
    """
    Serializador para los hitos del proyecto (Módulo Estratégico)
    """
    class Meta:
        model = Milestone
        fields = [
            'id',
            'project',
            'name',
            'description',
            'target_date',
            'completed_date',
            'status',
        ]

    def to_internal_value(self, data):
        data = data.copy() if hasattr(data, 'copy') else dict(data)
        if 'title' in data and 'name' not in data:
            data['name'] = data['title']
        if 'projectId' in data and 'project' not in data:
            data['project'] = data['projectId']
        if 'targetDate' in data and 'target_date' not in data:
            data['target_date'] = data['targetDate']
        raw_status = data.get('status')
        if raw_status:
            data['status'] = STATUS_TO_BACKEND_MILESTONE.get(str(raw_status).lower(), str(raw_status).upper())
        return super().to_internal_value(data)

    def to_representation(self, obj):
        rep = super().to_representation(obj)
        rep['title'] = obj.name
        rep['projectId'] = obj.project_id
        rep['targetDate'] = str(obj.target_date) if obj.target_date else None
        rep['status_backend'] = obj.status
        rep['status'] = STATUS_TO_FRONTEND_MILESTONE.get(obj.status, 'pending')
        rep['project_code'] = obj.project.code if obj.project else ''
        rep['project_name'] = obj.project.name if obj.project else ''
        rep['validator'] = 'Carlos M. (Project Manager)'
        rep['blocking'] = True
        return rep



class TaskSerializer(serializers.ModelSerializer):
    """
    Serializador para las tareas operativas, ruta crítica y dependencias
    """
    category_name = serializers.ReadOnlyField(source='category.name')
    assigned_to_name = serializers.SerializerMethodField()
    drive_links_count = serializers.IntegerField(source='drive_links.count', read_only=True)

    class Meta:
        model = Task
        fields = [
            'id',
            'project',
            'milestone',
            'category',
            'category_name',
            'assigned_to',
            'assigned_to_name',
            'title',
            'description',
            'start_date',
            'end_date',
            'duration_days',
            'progress',
            'is_critical_path',
            'tolerance_days',
            'predecessors',
            'drive_links_count',
            'status',
            'created_at',
            'updated_at',
        ]

    def get_assigned_to_name(self, obj):
        if obj.assigned_to:
            return f"{obj.assigned_to.first_name} {obj.assigned_to.last_name}"
        return None


class DriveLinkSerializer(serializers.ModelSerializer):
    """
    Serializador para los enlaces y archivos asociados en Google Drive vinculados a tareas
    """
    file_type_display = serializers.CharField(source='get_file_type_display', read_only=True)
    task_title = serializers.ReadOnlyField(source='task.title')
    project_id = serializers.ReadOnlyField(source='task.project_id')
    project_code = serializers.ReadOnlyField(source='task.project.code')

    class Meta:
        model = DriveLink
        fields = [
            'id',
            'task',
            'task_title',
            'project_id',
            'project_code',
            'title',
            'drive_url',
            'file_id',
            'file_type',
            'file_type_display',
            'created_at',
        ]


class PerformanceMetricSerializer(serializers.ModelSerializer):
    """
    Serializador para métricas de rendimiento diario utilizadas en la optimización
    """
    calculated_days = serializers.SerializerMethodField()

    class Meta:
        model = PerformanceMetric
        fields = [
            'id',
            'project',
            'task',
            'unit',
            'quantity',
            'rate_per_day',
            'divisor',
            'calculated_days',
        ]

    def get_calculated_days(self, obj):
        if obj.rate_per_day and obj.rate_per_day > 0:
            return round(float(obj.quantity) / float(obj.rate_per_day), 1)
        return 0


STATUS_TO_BACKEND = {
    'planning': 'PLANNING',
    'active': 'IN_PROGRESS',
    'paused': 'STAND_BY',
    'completed': 'COMPLETED',
    'risk': 'RISK',
    'cancelled': 'CANCELLED',
    'PLANNING': 'PLANNING',
    'IN_PROGRESS': 'IN_PROGRESS',
    'STAND_BY': 'STAND_BY',
    'COMPLETED': 'COMPLETED',
    'RISK': 'RISK',
    'CANCELLED': 'CANCELLED',
}

STATUS_TO_FRONTEND = {
    'PLANNING': 'planning',
    'IN_PROGRESS': 'active',
    'STAND_BY': 'paused',
    'COMPLETED': 'completed',
    'RISK': 'risk',
    'CANCELLED': 'paused',
}


class ProjectSerializer(serializers.ModelSerializer):
    """
    Serializador principal para proyectos con resumen de tareas, hitos y compatibilidad con Frontend
    """
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    milestones_count = serializers.IntegerField(source='milestones.count', read_only=True)
    tasks_count = serializers.IntegerField(source='tasks.count', read_only=True)
    team_members_count = serializers.IntegerField(source='team_members.count', read_only=True)
    drive_links_count = serializers.SerializerMethodField()

    class Meta:
        model = Project
        fields = [
            'id',
            'code',
            'name',
            'description',
            'start_date',
            'end_date',
            'duration_months',
            'budget',
            'status',
            'status_display',
            'milestones_count',
            'tasks_count',
            'team_members_count',
            'drive_links_count',
            'created_at',
            'updated_at',
        ]

    def get_drive_links_count(self, obj):
        return DriveLink.objects.filter(task__project=obj).count()

    def to_internal_value(self, data):
        data = data.copy() if hasattr(data, 'copy') else dict(data)

        # Mapeo de aliases desde el Frontend (camelCase a snake_case)
        if 'startDate' in data and 'start_date' not in data:
            data['start_date'] = data['startDate']
        if 'endDate' in data and 'end_date' not in data:
            data['end_date'] = data['endDate']
        if 'totalBudget' in data and 'budget' not in data:
            data['budget'] = data['totalBudget']

        # Normalizar estado hacia las opciones de choices del modelo
        raw_status = data.get('status')
        if raw_status:
            mapped_status = STATUS_TO_BACKEND.get(str(raw_status).lower(), str(raw_status).upper())
            data['status'] = mapped_status

        # Autocalcular duration_months si no fue proporcionado
        if not data.get('duration_months'):
            from datetime import datetime
            s_date = data.get('start_date')
            e_date = data.get('end_date')
            if s_date and e_date:
                try:
                    s_dt = datetime.strptime(str(s_date), '%Y-%m-%d').date() if isinstance(s_date, str) else s_date
                    e_dt = datetime.strptime(str(e_date), '%Y-%m-%d').date() if isinstance(e_date, str) else e_date
                    diff_days = (e_dt - s_dt).days
                    data['duration_months'] = max(1, round(diff_days / 30))
                except Exception:
                    data['duration_months'] = 1

        return super().to_internal_value(data)

    def to_representation(self, obj):
        rep = super().to_representation(obj)

        # Campos alias para consumo directo en React / Portfolio
        rep['startDate'] = rep.get('start_date')
        rep['endDate'] = rep.get('end_date')
        budget_val = float(obj.budget) if obj.budget is not None else 0.0
        rep['totalBudget'] = budget_val

        # Progreso y presupuesto usado a partir de tareas
        tasks = obj.tasks.all()
        if tasks.exists():
            rep['progress'] = int(round(sum(t.progress for t in tasks) / tasks.count()))
            rep['usedBudget'] = round(budget_val * (rep['progress'] / 100), 2)
        else:
            rep['progress'] = 0
            rep['usedBudget'] = 0.0

        # Iniciales de miembros asignados
        members = []
        for member in obj.team_members.all():
            initials = f"{member.first_name[:1]}{member.last_name[:1]}".upper()
            if initials and initials not in members:
                members.append(initials)
        rep['members'] = members or ['PM']

        # Área técnica y datos del líder asignado
        first_member = obj.team_members.first()
        if first_member:
            rep['leaderId'] = first_member.id
            rep['leaderName'] = f"{first_member.first_name} {first_member.last_name}"
            rep['leaderEmail'] = first_member.email
            rep['area'] = first_member.technical_area.name if first_member.technical_area else 'Edificaciones Comerciales'
        else:
            rep['leaderId'] = None
            rep['leaderName'] = None
            rep['leaderEmail'] = None
            rep['area'] = 'Edificaciones Comerciales'

        # Formato de status para Portfolio frontend
        rep['status_backend'] = obj.status
        rep['status'] = STATUS_TO_FRONTEND.get(obj.status, 'planning')

        return rep
class CreateTechnicianSerializer(serializers.Serializer):
    """Crea en una sola operación la cuenta de acceso y su ficha técnica."""

    AREA_NAMES = {
        'architecture': ('Arquitectura',),
        'structures': ('Estructuras', 'Civil'),
        'systems': ('Sistemas',),
    }
    STATUS_DATA = {
        'active': ('Active', '#10B981'),
        'standby': ('Stand-by', '#F59E0B'),
        'support': ('Support', '#3B82F6'),
        'offline': ('No disponible', '#64748B'),
    }

    first_name = serializers.CharField(max_length=100)
    last_name = serializers.CharField(max_length=100)
    email = serializers.EmailField(max_length=120)
    password = serializers.CharField(
        write_only=True,
        trim_whitespace=False,
        style={'input_type': 'password'},
    )
    specialty = serializers.CharField(max_length=100)
    area = serializers.ChoiceField(choices=tuple(AREA_NAMES))
    status = serializers.ChoiceField(choices=tuple(STATUS_DATA))
    project = serializers.CharField(required=False, allow_blank=True, max_length=250)
    availability = serializers.IntegerField(min_value=0, max_value=100, default=100)
    allocation_percentage = serializers.IntegerField(min_value=0, max_value=100, default=0)

    def validate_email(self, value):
        email = value.strip().lower()
        user_model = get_user_model()

        if user_model.objects.filter(username__iexact=email).exists() or user_model.objects.filter(email__iexact=email).exists():
            raise serializers.ValidationError('Ya existe una cuenta de usuario con este correo.')
        if TeamMember.objects.filter(email__iexact=email).exists():
            raise serializers.ValidationError('Ya existe un técnico registrado con este correo.')

        return email

    def validate(self, attrs):
        user_model = get_user_model()
        pending_user = user_model(
            username=attrs['email'],
            email=attrs['email'],
            first_name=attrs['first_name'].strip(),
            last_name=attrs['last_name'].strip(),
        )
        try:
            validate_password(attrs['password'], user=pending_user)
        except DjangoValidationError as error:
            raise serializers.ValidationError({'password': list(error.messages)}) from error
        return attrs

    def _resolve_area(self, area_code):
        possible_names = self.AREA_NAMES[area_code]
        for name in possible_names:
            area = TechnicalArea.objects.filter(name__iexact=name).first()
            if area:
                return area

        return TechnicalArea.objects.create(
            name=possible_names[0],
            description='Área técnica registrada desde Gestión del Equipo Técnico.',
        )

    def _resolve_status(self, status_code):
        name, color_code = self.STATUS_DATA[status_code]
        team_status = TeamStatus.objects.filter(name__iexact=name).first()
        if team_status:
            return team_status

        return TeamStatus.objects.create(
            name=name,
            description='Estado registrado desde Gestión del Equipo Técnico.',
            color_code=color_code,
        )

    @staticmethod
    def _resolve_project(project_label):
        clean_label = (project_label or '').strip()
        if not clean_label or clean_label.lower().startswith('sin proyecto'):
            return None

        code_match = re.search(r'(PRJ-\d{4}-\d+)', clean_label, flags=re.IGNORECASE)
        if code_match:
            project = Project.objects.filter(code__iexact=code_match.group(1)).first()
            if project:
                return project

        project_name = clean_label.split('(')[0].strip()
        return Project.objects.filter(name__iexact=project_name).first()

    @transaction.atomic
    def create(self, validated_data):
        password = validated_data.pop('password')
        specialty = validated_data.pop('specialty').strip()
        area_code = validated_data.pop('area')
        status_code = validated_data.pop('status')
        project_label = validated_data.pop('project', '')
        availability = validated_data.pop('availability')
        allocation_percentage = validated_data.pop('allocation_percentage')

        first_name = validated_data['first_name'].strip()
        last_name = validated_data['last_name'].strip()
        email = validated_data['email']

        technical_area = self._resolve_area(area_code)
        team_status = self._resolve_status(status_code)
        role, _ = Role.objects.get_or_create(
            technical_area=technical_area,
            name=specialty,
            defaults={
                'description': 'Rol registrado desde Gestión del Equipo Técnico.',
            },
        )
        project = self._resolve_project(project_label)

        user_model = get_user_model()
        user = user_model(
            username=email,
            email=email,
            first_name=first_name,
            last_name=last_name,
            is_active=True,
            is_staff=False,
            is_superuser=False,
        )
        user.set_password(password)
        user.save()

        return TeamMember.objects.create(
            first_name=first_name,
            last_name=last_name,
            email=email,
            role=role,
            technical_area=technical_area,
            status=team_status,
            project=project,
            availability=availability,
            allocation_percentage=allocation_percentage,
            is_active=True,
        )


class ProjectMeetingSerializer(serializers.ModelSerializer):
    """
    Serializador para el modelo ProjectMeeting (Reuniones / Videoconferencias Jitsi).
    """
    created_by_name = serializers.SerializerMethodField(read_only=True)
    project_name = serializers.ReadOnlyField(source='project.name')

    class Meta:
        model = ProjectMeeting
        fields = '__all__'
        read_only_fields = ('room_name', 'meeting_url', 'created_at')

    def get_created_by_name(self, obj):
        if obj.created_by:
            name = f"{obj.created_by.first_name} {obj.created_by.last_name}".strip()
            return name or obj.created_by.username
        return None
