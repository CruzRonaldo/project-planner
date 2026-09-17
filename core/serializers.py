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

        # Área técnica asociada
        first_member = obj.team_members.first()
        if first_member and first_member.technical_area:
            rep['area'] = first_member.technical_area.name
        else:
            rep['area'] = 'Edificaciones Comerciales'

        # Formato de status para Portfolio frontend
        rep['status_backend'] = obj.status
        rep['status'] = STATUS_TO_FRONTEND.get(obj.status, 'planning')

        return rep
