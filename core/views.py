import time
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.http import JsonResponse
from django.db import connection

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
from .serializers import (
    TechnicalAreaSerializer,
    TeamStatusSerializer,
    TeamMemberSerializer,
    ProjectSerializer,
    MilestoneSerializer,
    TaskSerializer,
    PerformanceMetricSerializer,
    DriveLinkSerializer,
)


def test_db_connection(request):
    """
    Endpoint para probar la conectividad directa entre Backend (Django) y la Base de Datos (MySQL).
    """
    start_time = time.time()
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1;")
            cursor.fetchone()

            cursor.execute("SELECT DATABASE(), VERSION();")
            row = cursor.fetchone()
            db_name = row[0] if row else 'Desconocida'
            db_version = row[1] if row else 'Desconocida'

        latency_ms = round((time.time() - start_time) * 1000, 2)

        return JsonResponse({
            'status': 'success',
            'connected': True,
            'database': {
                'engine': connection.vendor,
                'name': db_name,
                'version': db_version,
                'latency_ms': latency_ms,
            },
            'message': '¡Conexión exitosa con la base de datos MySQL!'
        }, status=200)

    except Exception as e:
        latency_ms = round((time.time() - start_time) * 1000, 2)
        return JsonResponse({
            'status': 'error',
            'connected': False,
            'database': {
                'engine': getattr(connection, 'vendor', 'mysql'),
                'latency_ms': latency_ms,
                'error_detail': str(e),
            },
            'message': f'Error al conectar con la base de datos: {str(e)}'
        }, status=500)


class TechnicalAreaViewSet(viewsets.ModelViewSet):
    """
    CRUD para Áreas Técnicas (Arquitectura, Estructuras, Sistemas)
    """
    queryset = TechnicalArea.objects.all()
    serializer_class = TechnicalAreaSerializer


class TeamStatusViewSet(viewsets.ModelViewSet):
    """
    CRUD para Estados del Equipo (Active, Stand-by, Support)
    """
    queryset = TeamStatus.objects.all()
    serializer_class = TeamStatusSerializer


class TeamMemberViewSet(viewsets.ModelViewSet):
    """
    CRUD para Miembros del Equipo Técnico
    """
    queryset = TeamMember.objects.select_related('technical_area', 'status', 'project').all()
    serializer_class = TeamMemberSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        area = self.request.query_params.get('area')
        status_id = self.request.query_params.get('status')
        project_id = self.request.query_params.get('project')
        if area:
            queryset = queryset.filter(technical_area_id=area)
        if status_id:
            queryset = queryset.filter(status_id=status_id)
        if project_id:
            queryset = queryset.filter(project_id=project_id)
        return queryset


class ProjectViewSet(viewsets.ModelViewSet):
    """
    CRUD principal para Proyectos y Portafolio
    """
    queryset = Project.objects.prefetch_related('milestones', 'tasks', 'team_members').all()
    serializer_class = ProjectSerializer

    @action(detail=True, methods=['get', 'post'], url_path='optimize')
    def optimize_timeline(self, request, pk=None):
        """
        Endpoint para ejecutar el Motor de Optimización de Tiempos del Proyecto.
        Calcula la reducción potencial basada en rendimientos históricos y aplica tolerancias (7 días).
        """
        project = self.get_object()
        tasks = project.tasks.all()
        metrics = project.performance_metrics.all()

        total_original_days = sum(t.duration_days for t in tasks) if tasks.exists() else (project.duration_months * 30)
        
        # Algoritmo de optimización basado en rendimientos y factor divisor
        optimized_tasks = []
        total_optimized_days = 0

        for task in tasks:
            task_metrics = metrics.filter(task=task)
            divisor = 5
            rate_per_day = 1.0

            if task_metrics.exists():
                metric = task_metrics.first()
                divisor = metric.divisor or 5
                rate_per_day = float(metric.rate_per_day or 1.0)
            
            # Cálculo de reducción: Duración / divisor
            base_duration = task.duration_days
            reduction = base_duration / divisor if divisor > 0 else 0
            opt_duration = max(1, round(base_duration - reduction))

            # Si es ruta crítica se asegura la tolerancia de 7 días
            if task.is_critical_path:
                tolerance = task.tolerance_days
            else:
                tolerance = 0

            optimized_tasks.append({
                'task_id': task.id,
                'title': task.title,
                'original_duration_days': base_duration,
                'optimized_duration_days': opt_duration,
                'days_saved': base_duration - opt_duration,
                'is_critical_path': task.is_critical_path,
                'tolerance_days': tolerance,
            })
            total_optimized_days += opt_duration

        original_months = project.duration_months
        optimized_months = max(1, round(total_optimized_days / 30)) if total_optimized_days > 0 else max(1, original_months - 1)
        months_saved = max(0, original_months - optimized_months)

        return Response({
            'project_id': project.id,
            'project_code': project.code,
            'project_name': project.name,
            'original_duration_months': original_months,
            'optimized_duration_months': optimized_months,
            'months_saved': months_saved,
            'total_original_days': total_original_days,
            'total_optimized_days': total_optimized_days,
            'tolerance_applied_days': 7,
            'optimized_tasks': optimized_tasks,
            'message': f'Optimización calculada: Reducción de {original_months} a {optimized_months} meses.'
        }, status=status.HTTP_200_OK)


class MilestoneViewSet(viewsets.ModelViewSet):
    """
    CRUD para Hitos Estratégicos
    """
    queryset = Milestone.objects.select_related('project').all()
    serializer_class = MilestoneSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        project_id = self.request.query_params.get('project')
        if project_id:
            queryset = queryset.filter(project_id=project_id)
        return queryset


class TaskViewSet(viewsets.ModelViewSet):
    """
    CRUD para Tareas Operativas y Ruta Crítica
    """
    queryset = Task.objects.select_related('project', 'category', 'assigned_to', 'milestone').prefetch_related('predecessors', 'drive_links').all()
    serializer_class = TaskSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        project_id = self.request.query_params.get('project')
        is_critical = self.request.query_params.get('critical')
        if project_id:
            queryset = queryset.filter(project_id=project_id)
        if is_critical is not None:
            queryset = queryset.filter(is_critical_path=is_critical.lower() == 'true')
        return queryset


class PerformanceMetricViewSet(viewsets.ModelViewSet):
    """
    CRUD para Métricas de Rendimiento
    """
    queryset = PerformanceMetric.objects.select_related('project', 'task').all()
    serializer_class = PerformanceMetricSerializer


class DriveLinkViewSet(viewsets.ModelViewSet):
    """
    CRUD para Enlaces de Google Drive
    """
    queryset = DriveLink.objects.select_related('task', 'task__project').all()
    serializer_class = DriveLinkSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        task_id = self.request.query_params.get('task')
        project_id = self.request.query_params.get('project')
        if task_id:
            queryset = queryset.filter(task_id=task_id)
        if project_id:
            queryset = queryset.filter(task__project_id=project_id)
        return queryset
