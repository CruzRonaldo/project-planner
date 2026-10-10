import re

from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import transaction
from rest_framework import serializers

from .models import (
    TechnicalArea,
    Role,
    TeamStatus,
    TeamMember,
    Project,
    Milestone,
    Task,
    PerformanceMetric,
    DriveLink,
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
            'is_active',
            'created_at',
        ]

    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}"


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
            is_active=True,
        )
