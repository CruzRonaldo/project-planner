from rest_framework import serializers
from .models import (
    TechnicalArea,
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

    class Meta:
        model = TechnicalArea
        fields = ['id', 'name', 'description', 'members_count', 'created_at']


class TeamStatusSerializer(serializers.ModelSerializer):
    """
    Serializador para los estados del personal (Active, Stand-by, Support)
    """
    class Meta:
        model = TeamStatus
        fields = ['id', 'name', 'description', 'color_code']


class TeamMemberSerializer(serializers.ModelSerializer):
    """
    Serializador para el personal técnico, incluyendo nombres legibles de área y estado
    """
    technical_area_name = serializers.ReadOnlyField(source='technical_area.name')
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


class ProjectSerializer(serializers.ModelSerializer):
    """
    Serializador principal para proyectos con resumen de tareas e hitos
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
