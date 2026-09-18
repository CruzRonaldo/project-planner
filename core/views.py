import time
import logging
from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django.http import JsonResponse
from django.db import connection
from django.db.models import Q
from django.utils import timezone
from django.contrib.auth import get_user_model
from django.contrib.auth.models import update_last_login

logger = logging.getLogger(__name__)

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
from .serializers import (
    TechnicalAreaSerializer,
    RoleSerializer,
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

            vendor = connection.vendor
            if vendor == 'postgresql':
                cursor.execute("SELECT current_database(), version();")
            elif vendor == 'sqlite':
                cursor.execute("SELECT 'sqlite', sqlite_version();")
            else:
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
            'message': f'¡Conexión exitosa con la base de datos ({connection.vendor.upper()})!'
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
User = get_user_model()


@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    """
    Endpoint de autenticación para verificar credenciales de usuario y rol.
    Actualiza la fecha de último inicio de sesión (last_login) en MySQL.
    """
    data = request.data
    identifier = (data.get('email') or data.get('username') or '').strip()
    password = data.get('password', '')
    selected_role = data.get('role', 'user').lower()  # 'admin' o 'user'

    if not identifier or not password:
        return Response({
            'status': 'error',
            'message': 'Por favor ingrese correo o usuario y contraseña.'
        }, status=status.HTTP_400_BAD_REQUEST)

    # Buscar usuario por email o por username
    user = User.objects.filter(email__iexact=identifier).first()
    if not user:
        user = User.objects.filter(username__iexact=identifier).first()

    if not user or not user.check_password(password):
        return Response({
            'status': 'error',
            'message': 'Credenciales invalidas. Verifique su correo/usuario y contrasena.'
        }, status=status.HTTP_401_UNAUTHORIZED)

    if not user.is_active:
        return Response({
            'status': 'error',
            'message': 'Esta cuenta de usuario ha sido desactivada.'
        }, status=status.HTTP_403_FORBIDDEN)

    # Validar coincidencia de rol
    is_admin = user.is_superuser or user.is_staff

    if selected_role == 'admin' and not is_admin:
        return Response({
            'status': 'error',
            'message': f"Acceso denegado: El usuario '{user.username}' no tiene permisos de Administrador."
        }, status=status.HTTP_403_FORBIDDEN)

    # Actualizar last_login en la base de datos MySQL
    update_last_login(None, user)

    user_role = 'admin' if is_admin else 'user'
    role_display = 'Project Manager (Admin)' if is_admin else 'Equipo Tecnico'

    return Response({
        'status': 'success',
        'message': f'Bienvenido al sistema, {user.username}',
        'user': {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'role': user_role,
            'role_display': role_display,
            'is_superuser': user.is_superuser,
            'last_login': user.last_login,
        }
    }, status=status.HTTP_200_OK)


@api_view(['GET', 'PATCH'])
@permission_classes([AllowAny])
def users_status_view(request):
    """
    Retorna la lista de usuarios técnicos con su estado real de conexión (isOnline)
    calculado según su último inicio de sesión (last_login) en MySQL.
    Permite además actualizar el rol de SubAdministrador (is_staff).
    """
    now = timezone.now()
    name_mapping = {
        'sistemas': 'Luis Gonzales (Sistemas)',
        'civil': 'Andrea Rojas (Civil)',
        'arquitectura': 'Carlos Mendoza (Arquitectura)',
    }

    if request.method == 'GET':
        users_list = []
        for u in User.objects.all().order_by('id'):
            is_admin_user = bool(u.is_superuser)
            is_online = False
            if u.last_login:
                diff_seconds = (now - u.last_login).total_seconds()
                is_online = diff_seconds < 21600

            user_id = f"usr-{u.username.lower()}"
            if is_admin_user:
                display_name = f"{u.first_name} {u.last_name}".strip() or u.username or "Administrador (Admin)"
            else:
                display_name = name_mapping.get(u.username.lower(), f"{u.first_name} {u.last_name}".strip() or u.username)

            users_list.append({
                'id': user_id,
                'db_id': u.id,
                'username': u.username,
                'name': display_name,
                'email': u.email,
                'isAdmin': is_admin_user,
                'isSubAdmin': bool(u.is_staff and not is_admin_user),
                'isOnline': is_online,
                'last_login': u.last_login.isoformat() if u.last_login else None,
            })
        return Response(users_list, status=status.HTTP_200_OK)

    elif request.method == 'PATCH':
        user_id = request.data.get('id', '')
        is_sub_admin = request.data.get('isSubAdmin')
        clean_username = str(user_id).replace('usr-', '').strip()
        u = User.objects.filter(username__iexact=clean_username).first()
        if not u and request.data.get('db_id'):
            u = User.objects.filter(id=request.data.get('db_id')).first()

        if u and is_sub_admin is not None:
            u.is_staff = bool(is_sub_admin)
            u.save(update_fields=['is_staff'])
            return Response({'status': 'success', 'isSubAdmin': u.is_staff}, status=status.HTTP_200_OK)

        return Response({'status': 'error', 'message': 'Usuario no encontrado'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['POST'])
@permission_classes([AllowAny])
def logout_view(request):
    """
    Registra el cierre de sesión del usuario para marcarlo desconectado en MySQL.
    """
    identifier = (request.data.get('username') or request.data.get('email') or '').strip()
    if identifier:
        u = User.objects.filter(Q(username__iexact=identifier) | Q(email__iexact=identifier)).first()
        if u:
            u.last_login = None
            u.save(update_fields=['last_login'])
    return Response({'status': 'success', 'message': 'Sesión cerrada correctamente'}, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([AllowAny])
def notifications_view(request):
    """
    Retorna notificaciones personalizadas según el usuario conectado,
    incluyendo asignaciones directas de proyectos como líder técnico.
    """
    username = (request.query_params.get('username') or '').strip().lower()
    email = (request.query_params.get('email') or '').strip().lower()

    user_member_map = {
        'sistemas': 'luis.gonzales@projectplanner.com',
        'sistemas@projectplanner.com': 'luis.gonzales@projectplanner.com',
        'civil': 'andrea.rojas@projectplanner.com',
        'civil@projectplanner.com': 'andrea.rojas@projectplanner.com',
        'arquitectura': 'carlos.mendoza@projectplanner.com',
        'arquitectura@projectplanner.com': 'carlos.mendoza@projectplanner.com',
    }

    target_email = user_member_map.get(username) or user_member_map.get(email) or email
    notifications = []

    # Buscar si el usuario actual es un miembro de equipo con un proyecto asignado
    member = None
    if target_email or username:
        q_filter = Q(email__iexact=target_email) if target_email else Q()
        if 'sistemas' in username or 'luis' in target_email or 'luis' in username:
            q_filter = q_filter | Q(first_name__iexact='Luis')
        member = TeamMember.objects.filter(q_filter).first()

    if member and member.project:
        p = member.project
        notifications.append({
            'id': f"proj-assigned-{p.id}",
            'title': 'Proyecto Asignado',
            'detail': f"Has sido asignado como líder técnico del proyecto «{p.name}» ({p.code}).",
            'time': 'Reciente',
            'type': 'project_assignment',
            'projectId': p.id,
            'unread': True,
        })

    # Notificaciones generales de contexto
    notifications.append({
        'id': 'notif-milestone-1',
        'title': 'Hito próximo',
        'detail': 'Revisión estructural programada para hoy.',
        'time': 'Hace 10 min',
        'unread': False,
    })
    notifications.append({
        'id': 'notif-budget-1',
        'title': 'Presupuesto actualizado',
        'detail': 'Torre Reforma recibió una actualización.',
        'time': 'Hace 1 h',
        'unread': False,
    })

    return Response(notifications, status=status.HTTP_200_OK)


class TechnicalAreaViewSet(viewsets.ModelViewSet):
    """
    CRUD para Áreas Técnicas (Arquitectura, Civil, Sistemas)
    """
    queryset = TechnicalArea.objects.all()
    serializer_class = TechnicalAreaSerializer


class RoleViewSet(viewsets.ModelViewSet):
    """
    CRUD para Roles y Cargos Técnicos por Área con soporte de filtrado por área técnica
    """
    queryset = Role.objects.select_related('technical_area').all()
    serializer_class = RoleSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        technical_area_id = (
            self.request.query_params.get('technical_area') or
            self.request.query_params.get('area')
        )
        if technical_area_id:
            queryset = queryset.filter(technical_area_id=technical_area_id)
        return queryset


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
    queryset = TeamMember.objects.select_related('role', 'technical_area', 'status', 'project').all()
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
    queryset = Project.objects.prefetch_related('milestones', 'tasks', 'team_members__technical_area').all()
    serializer_class = ProjectSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        project = serializer.save()

        # Asignar líder técnico si fue seleccionado en el frontend
        leader_val = request.data.get('leaderId') or request.data.get('leader_id')
        if leader_val:
            try:
                from .models import TeamMember
                leader = TeamMember.objects.filter(id=int(leader_val)).first()
                if leader:
                    leader.project = project
                    leader.save(update_fields=['project'])
            except (ValueError, TypeError):
                pass

        # Enviar notificación automática a Make (Integromat)
        make_result = None
        try:
            from .services.make_service import send_make_webhook
            assigned_leader = project.team_members.first()
            project_data = {
                'id': project.id,
                'code': project.code,
                'name': project.name,
                'description': project.description or '',
                'start_date': str(project.start_date),
                'end_date': str(project.end_date),
                'duration_months': project.duration_months,
                'budget': float(project.budget),
                'status': project.get_status_display(),
                'status_code': project.status,
                'leader_name': f"{assigned_leader.first_name} {assigned_leader.last_name}" if assigned_leader else 'Sin Asignar',
                'leader_email': assigned_leader.email if assigned_leader else '',
                'leader_role': assigned_leader.role.name if assigned_leader and assigned_leader.role else '',
            }
            make_result = send_make_webhook(event='project.created', data=project_data)
            logger.info(f"[Make Integration] Notificación de creación de proyecto {project.code} enviada: {make_result}")
        except Exception as exc:
            logger.warning(f"[Make Integration] Error al despachar webhook de creación de proyecto: {exc}")
            make_result = {'success': False, 'message': str(exc)}

        response_data = self.get_serializer(project).data
        response_data['make_notification'] = make_result
        headers = self.get_success_headers(response_data)
        return Response(response_data, status=status.HTTP_201_CREATED, headers=headers)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        project = serializer.save()

        # Actualizar asignación del líder técnico si fue modificado
        leader_val = request.data.get('leaderId') or request.data.get('leader_id')
        if leader_val:
            try:
                from .models import TeamMember
                leader = TeamMember.objects.filter(id=int(leader_val)).first()
                if leader:
                    leader.project = project
                    leader.save(update_fields=['project'])
            except (ValueError, TypeError):
                pass

        # Enviar notificación automática a Make (Integromat)
        make_result = None
        try:
            from .services.make_service import send_make_webhook
            assigned_leader = project.team_members.first()
            project_data = {
                'id': project.id,
                'code': project.code,
                'name': project.name,
                'description': project.description or '',
                'start_date': str(project.start_date),
                'end_date': str(project.end_date),
                'duration_months': project.duration_months,
                'budget': float(project.budget),
                'status': project.get_status_display(),
                'status_code': project.status,
                'leader_name': f"{assigned_leader.first_name} {assigned_leader.last_name}" if assigned_leader else 'Sin Asignar',
                'leader_email': assigned_leader.email if assigned_leader else '',
                'leader_role': assigned_leader.role.name if assigned_leader and assigned_leader.role else '',
            }
            make_result = send_make_webhook(event='project.updated', data=project_data)
            logger.info(f"[Make Integration] Notificación de actualización de proyecto {project.code} enviada: {make_result}")
        except Exception as exc:
            logger.warning(f"[Make Integration] Error al despachar webhook de actualización de proyecto: {exc}")
            make_result = {'success': False, 'message': str(exc)}

        response_data = self.get_serializer(project).data
        response_data['make_notification'] = make_result
        return Response(response_data)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        project_data = {
            'id': instance.id,
            'code': instance.code,
            'name': instance.name,
        }
        self.perform_destroy(instance)
        try:
            from .services.make_service import send_make_webhook
            send_make_webhook(event='project.deleted', data=project_data)
            logger.info(f"[Make Integration] Notificación de eliminación de proyecto {instance.code} enviada")
        except Exception as exc:
            logger.warning(f"[Make Integration] Error al despachar webhook de eliminación de proyecto: {exc}")
        return Response(status=status.HTTP_204_NO_CONTENT)

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
