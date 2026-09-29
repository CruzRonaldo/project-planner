import base64
import logging
import os
import time

from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth.models import update_last_login
from django.db import connection
from django.db.models import Q
from django.http import JsonResponse
from django.shortcuts import redirect
from django.utils import timezone

from google.auth.exceptions import RefreshError
from googleapiclient.errors import HttpError

from rest_framework import status, viewsets
from rest_framework.decorators import (
    action,
    api_view,
    parser_classes,
    permission_classes,
)
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import (
    DriveLink,
    Milestone,
    PerformanceMetric,
    Project,
    Role,
    Task,
    TeamMember,
    TeamStatus,
    TechnicalArea,
)

from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed

class SimpleUserAuthentication(BaseAuthentication):
    """Autenticación simple que asume que el token Bearer es el ID del usuario."""
    def authenticate(self, request):
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return None
            
        user_id = auth_header.split(' ')[1]
        User = get_user_model()
        try:
            user = User.objects.get(id=user_id)
            return (user, None)
        except (User.DoesNotExist, ValueError):
            raise AuthenticationFailed('Usuario no encontrado o token inválido')
from .serializers import (
    DriveLinkSerializer,
    MilestoneSerializer,
    PerformanceMetricSerializer,
    ProjectSerializer,
    RoleSerializer,
    TaskSerializer,
    TeamMemberSerializer,
    TeamStatusSerializer,
    TechnicalAreaSerializer,
)
from .services.google_drive import (
    GoogleDriveConfigurationError,
    GoogleDriveNotConnectedError,
    classify_drive_link_type,
    create_folder,
    create_authorization_url,
    delete_file,
    get_connection_information,
    list_files,
    process_oauth_callback,
    rename_file,
    upload_file,
)
from core.services.aps_service import APSService


logger = logging.getLogger(__name__)
User = get_user_model()


def test_db_connection(request):
    """
    Endpoint para probar la conectividad directa entre Backend (Django) y la Base de Datos.
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

            db_name = row[0] if row else "Desconocida"
            db_version = row[1] if row else "Desconocida"

        latency_ms = round((time.time() - start_time) * 1000, 2)

        return JsonResponse(
            {
                "status": "success",
                "connected": True,
                "database": {
                    "engine": connection.vendor,
                    "name": db_name,
                    "version": db_version,
                    "latency_ms": latency_ms,
                },
                'message': f'¡Conexión exitosa con la base de datos ({connection.vendor.upper()})!'
            },
            status=200,
        )

    except Exception as error:
        latency_ms = round((time.time() - start_time) * 1000, 2)

        return JsonResponse(
            {
                "status": "error",
                "connected": False,
                "database": {
                    "engine": getattr(connection, "vendor", "postgresql"),
                    "latency_ms": latency_ms,
                    "error_detail": str(error),
                },
                "message": f"Error al conectar con la base de datos: {error}",
            },
            status=500,
        )


@api_view(["POST"])
@permission_classes([AllowAny])
def login_view(request):
    """
    Endpoint de autenticación para verificar credenciales de usuario y rol.
    Actualiza la fecha de último inicio de sesión (last_login) en la Base de Datos.
    """
    data = request.data
    identifier = (data.get("email") or data.get("username") or "").strip()
    password = data.get("password", "")
    selected_role = data.get("role", "user").lower()

    if not identifier or not password:
        return Response({
            'status': 'error',
            'message': 'Debe ingresar su usuario/correo y contraseña.'
        }, status=status.HTTP_400_BAD_REQUEST)

    # Autenticación tolerante (acepta username o email)
    user = User.objects.filter(Q(username__iexact=identifier) | Q(email__iexact=identifier)).first()

    if not user or not user.check_password(password):
        return Response({
            'status': 'error',
            'message': 'Credenciales inválidas. Verifique su usuario y contraseña.'
        }, status=status.HTTP_401_UNAUTHORIZED)

    if not user.is_active:
        return Response(
            {
                "status": "error",
                "message": "Esta cuenta de usuario fue desactivada.",
            },
            status=status.HTTP_403_FORBIDDEN,
        )

    # Validar coherencia de rol seleccionado con el perfil real
    is_admin = bool(user.is_superuser or user.is_staff)
    if selected_role == 'admin' and not is_admin:
        return Response({
            'status': 'error',
            'message': f"Acceso denegado: El usuario '{user.username}' no tiene permisos de Administrador."
        }, status=status.HTTP_403_FORBIDDEN)

    # Actualizar last_login en la base de datos
    update_last_login(None, user)

    user_role = "admin" if is_admin else "user"
    role_display = "Project Manager (Admin)" if is_admin else "Equipo Técnico"

    return Response(
        {
            "status": "success",
            "message": f"Bienvenido al sistema, {user.username}",
            "user": {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "role": user_role,
                "role_display": role_display,
                "is_superuser": user.is_superuser,
                "last_login": user.last_login,
            },
        },
        status=status.HTTP_200_OK,
    )


@api_view(['GET', 'PATCH'])
@permission_classes([AllowAny])
def users_status_view(request):
    """
    Retorna la lista de usuarios técnicos con su estado real de conexión (isOnline)
    calculado según su último inicio de sesión (last_login) en la Base de Datos.
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
    Registra el cierre de sesión del usuario para marcarlo desconectado en la Base de Datos.
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

    # Notificaciones de hitos próximos
    try:
        from datetime import date, timedelta
        today = date.today()
        upcoming_milestones = Milestone.objects.filter(
            target_date__gte=today,
            target_date__lte=today + timedelta(days=14),
            status__in=['pending', 'upcoming']
        ).select_related('project')[:5]
        for m in upcoming_milestones:
            notifications.append({
                'id': f"milestone-{m.id}",
                'title': f"Hito próximo: {m.title}",
                'detail': f"Proyecto «{m.project.name}» ({m.project.code}) programado para {m.target_date}.",
                'time': 'Próximamente',
                'type': 'milestone',
                'projectId': m.project.id,
                'unread': True,
            })
    except Exception:
        pass

    return Response(notifications, status=status.HTTP_200_OK)


class TechnicalAreaViewSet(viewsets.ModelViewSet):
    """CRUD para áreas técnicas."""

    queryset = TechnicalArea.objects.all()
    serializer_class = TechnicalAreaSerializer


class RoleViewSet(viewsets.ModelViewSet):
    """CRUD para roles y cargos técnicos."""

    queryset = Role.objects.select_related("technical_area").all()
    serializer_class = RoleSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        technical_area_id = (
            self.request.query_params.get("technical_area")
            or self.request.query_params.get("area")
        )

        if technical_area_id:
            queryset = queryset.filter(technical_area_id=technical_area_id)

        return queryset


class TeamStatusViewSet(viewsets.ModelViewSet):
    """CRUD para estados del equipo."""

    queryset = TeamStatus.objects.all()
    serializer_class = TeamStatusSerializer


class TeamMemberViewSet(viewsets.ModelViewSet):
    """CRUD para miembros del equipo técnico."""

    queryset = TeamMember.objects.select_related(
        "role",
        "technical_area",
        "status",
        "project",
    ).all()
    serializer_class = TeamMemberSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        area = self.request.query_params.get("area")
        status_id = self.request.query_params.get("status")
        project_id = self.request.query_params.get("project")

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
        """Calcula una posible optimización del proyecto."""

        project = self.get_object()
        tasks = project.tasks.all()
        metrics = project.performance_metrics.all()

        if tasks.exists():
            total_original_days = sum(task.duration_days for task in tasks)
        else:
            total_original_days = project.duration_months * 30

        optimized_tasks = []
        total_optimized_days = 0

        for task in tasks:
            task_metrics = metrics.filter(task=task)
            divisor = 5

            if task_metrics.exists():
                metric = task_metrics.first()
                divisor = metric.divisor or 5

            base_duration = task.duration_days
            reduction = base_duration / divisor if divisor > 0 else 0
            optimized_duration = max(1, round(base_duration - reduction))
            tolerance = task.tolerance_days if task.is_critical_path else 0

            optimized_tasks.append(
                {
                    "task_id": task.id,
                    "title": task.title,
                    "original_duration_days": base_duration,
                    "optimized_duration_days": optimized_duration,
                    "days_saved": base_duration - optimized_duration,
                    "is_critical_path": task.is_critical_path,
                    "tolerance_days": tolerance,
                }
            )

            total_optimized_days += optimized_duration

        original_months = project.duration_months

        if total_optimized_days > 0:
            optimized_months = max(1, round(total_optimized_days / 30))
        else:
            optimized_months = max(1, original_months - 1)

        months_saved = max(0, original_months - optimized_months)

        return Response(
            {
                "project_id": project.id,
                "project_code": project.code,
                "project_name": project.name,
                "original_duration_months": original_months,
                "optimized_duration_months": optimized_months,
                "months_saved": months_saved,
                "total_original_days": total_original_days,
                "total_optimized_days": total_optimized_days,
                "tolerance_applied_days": 7,
                "optimized_tasks": optimized_tasks,
                "message": (
                    "Optimización calculada: reducción "
                    f"de {original_months} a {optimized_months} meses."
                ),
            },
            status=status.HTTP_200_OK,
        )


class MilestoneViewSet(viewsets.ModelViewSet):
    """CRUD para hitos estratégicos."""

    queryset = Milestone.objects.select_related("project").all()
    serializer_class = MilestoneSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        project_id = self.request.query_params.get("project")

        if project_id:
            queryset = queryset.filter(project_id=project_id)

        return queryset


class TaskViewSet(viewsets.ModelViewSet):
    """CRUD para tareas operativas."""

    queryset = Task.objects.select_related(
        "project",
        "category",
        "assigned_to",
        "milestone",
    ).prefetch_related(
        "predecessors",
        "drive_links",
    ).all()
    serializer_class = TaskSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        project_id = self.request.query_params.get("project")
        is_critical = self.request.query_params.get("critical")

        if project_id:
            queryset = queryset.filter(project_id=project_id)

        if is_critical is not None:
            queryset = queryset.filter(
                is_critical_path=(is_critical.lower() == "true")
            )

        return queryset


class PerformanceMetricViewSet(viewsets.ModelViewSet):
    """CRUD para métricas de rendimiento."""

    queryset = PerformanceMetric.objects.select_related("project", "task").all()
    serializer_class = PerformanceMetricSerializer


class DriveLinkViewSet(viewsets.ModelViewSet):
    """CRUD para enlaces de Google Drive."""

    queryset = DriveLink.objects.select_related("task", "task__project").all()
    serializer_class = DriveLinkSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        task_id = self.request.query_params.get("task")
        project_id = self.request.query_params.get("project")

        if task_id:
            queryset = queryset.filter(task_id=task_id)

        if project_id:
            queryset = queryset.filter(task__project_id=project_id)

        return queryset


# =============================================================
# GOOGLE DRIVE — Vistas OAuth y CRUD
# =============================================================

@api_view(["GET"])
@permission_classes([AllowAny])
def google_drive_connect_view(request):
    """Redirige al usuario hacia Google para autorizar Drive."""

    try:
        authorization_url, state_value = create_authorization_url()
        request.session["google_drive_oauth_state"] = state_value
        return redirect(authorization_url)

    except GoogleDriveConfigurationError as error:
        return Response(
            {
                "status": "error",
                "message": str(error),
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    except Exception as error:
        logger.exception("No se pudo iniciar Google Drive OAuth")
        response_data = {
            "status": "error",
            "message": "No se pudo iniciar la autorización de Google Drive.",
        }

        if settings.DEBUG:
            response_data["error_type"] = type(error).__name__
            response_data["error_detail"] = str(error)

        return Response(
            response_data,
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["GET"])
@permission_classes([AllowAny])
def google_drive_callback_view(request):
    """Recibe la autorización enviada por Google."""

    google_error = request.GET.get("error")

    if google_error:
        return Response(
            {
                "status": "error",
                "message": "La autorización de Google Drive fue cancelada.",
                "google_error": google_error,
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    stored_state = request.session.get("google_drive_oauth_state")
    returned_state = request.GET.get("state")

    if not stored_state or returned_state != stored_state:
        return Response(
            {
                "status": "error",
                "message": (
                    "El estado de autorización no es válido. "
                    "Inicia nuevamente la conexión con Google Drive."
                ),
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        # OAuthlib exige HTTPS. Esta excepción se habilita únicamente para
        # el entorno local de desarrollo cuando Django tiene DEBUG=True.
        redirect_uri = settings.GOOGLE_DRIVE_REDIRECT_URI

        if settings.DEBUG and redirect_uri.startswith("http://"):
            os.environ["OAUTHLIB_INSECURE_TRANSPORT"] = "1"

        process_oauth_callback(
            authorization_response=request.build_absolute_uri(),
            state=stored_state,
        )

        request.session.pop("google_drive_oauth_state", None)
        frontend_url = settings.GOOGLE_DRIVE_FRONTEND_URL.rstrip("/")

        return redirect(f"{frontend_url}/?google_drive=connected")

    except GoogleDriveConfigurationError as error:
        logger.exception("Configuración incorrecta de Google Drive OAuth")
        return Response(
            {
                "status": "error",
                "message": str(error),
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    except Exception as error:
        logger.exception("Falló el callback de Google Drive OAuth")
        response_data = {
            "status": "error",
            "message": "No se pudo completar la autorización de Google Drive.",
        }

        # Solo se muestra el detalle durante el desarrollo local.
        if settings.DEBUG:
            response_data["error_type"] = type(error).__name__
            response_data["error_detail"] = str(error)

        return Response(
            response_data,
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["GET"])
@permission_classes([AllowAny])
def google_drive_status_view(request):
    """Devuelve el estado actual de Google Drive."""

    try:
        information = get_connection_information()

        return Response(
            {
                "status": "success",
                **information,
            },
            status=status.HTTP_200_OK,
        )

    except GoogleDriveNotConnectedError:
        return Response(
            {
                "status": "success",
                "connected": False,
                "display_name": "",
                "email": "",
            },
            status=status.HTTP_200_OK,
        )

    except (RefreshError, HttpError) as error:
        logger.exception("Google Drive rechazó la credencial guardada")
        response_data = {
            "status": "error",
            "connected": False,
            "message": "La autorización de Google Drive expiró o fue revocada.",
        }

        if settings.DEBUG:
            response_data["error_type"] = type(error).__name__
            response_data["error_detail"] = str(error)

        return Response(
            response_data,
            status=status.HTTP_502_BAD_GATEWAY,
        )

    except GoogleDriveConfigurationError as error:
        return Response(
            {
                "status": "error",
                "connected": False,
                "message": str(error),
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    except Exception as error:
        logger.exception("No se pudo consultar el estado de Google Drive")
        response_data = {
            "status": "error",
            "connected": False,
            "message": "No se pudo consultar el estado de Google Drive.",
        }

        if settings.DEBUG:
            response_data["error_type"] = type(error).__name__
            response_data["error_detail"] = str(error)

        return Response(
            response_data,
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


def _drive_error_response(error, default_message):
    """Convierte errores de Google Drive en respuestas JSON consistentes."""

    if isinstance(error, GoogleDriveNotConnectedError):
        return Response(
            {
                "status": "error",
                "message": (
                    "Google Drive todavía no está conectado. "
                    "Autoriza una cuenta antes de continuar."
                ),
            },
            status=status.HTTP_409_CONFLICT,
        )

    if isinstance(error, GoogleDriveConfigurationError):
        return Response(
            {
                "status": "error",
                "message": str(error),
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    if isinstance(error, RefreshError):
        return Response(
            {
                "status": "error",
                "message": (
                    "La autorización de Google Drive expiró o fue revocada. "
                    "Vuelve a autorizar la cuenta."
                ),
            },
            status=status.HTTP_502_BAD_GATEWAY,
        )

    if isinstance(error, HttpError):
        google_status = getattr(error.resp, "status", 502)

        if google_status == 404:
            response_status = status.HTTP_404_NOT_FOUND
            message = "El archivo o carpeta ya no existe en Google Drive."
        elif google_status == 403:
            response_status = status.HTTP_403_FORBIDDEN
            message = "Google Drive rechazó la operación por falta de permiso."
        else:
            response_status = status.HTTP_502_BAD_GATEWAY
            message = default_message

        response_data = {
            "status": "error",
            "message": message,
            "google_status": google_status,
        }
    else:
        response_status = status.HTTP_500_INTERNAL_SERVER_ERROR
        response_data = {
            "status": "error",
            "message": default_message,
        }

    if settings.DEBUG:
        response_data["error_type"] = type(error).__name__
        response_data["error_detail"] = str(error)

    return Response(response_data, status=response_status)


def _save_drive_link(item, task_id):
    """Vincula opcionalmente un archivo de Drive con una tarea existente."""

    if not task_id:
        return None

    task = Task.objects.filter(pk=task_id).first()

    if task is None:
        raise GoogleDriveConfigurationError(
            "La tarea seleccionada no existe."
        )

    drive_url = item.get("web_view_link") or (
        f"https://drive.google.com/open?id={item['id']}"
    )
    existing_link = DriveLink.objects.filter(file_id=item["id"]).first()

    if existing_link:
        existing_link.task = task
        existing_link.title = item["name"]
        existing_link.drive_url = drive_url
        existing_link.file_type = classify_drive_link_type(item)
        existing_link.save(
            update_fields=[
                "task",
                "title",
                "drive_url",
                "file_type",
            ]
        )
        drive_link = existing_link
    else:
        drive_link = DriveLink.objects.create(
            task=task,
            title=item["name"],
            drive_url=drive_url,
            file_id=item["id"],
            file_type=classify_drive_link_type(item),
        )

    return DriveLinkSerializer(drive_link).data


@api_view(["GET"])
@permission_classes([AllowAny])
def google_drive_files_view(request):
    """Lista carpetas y archivos creados mediante Project Planner."""

    folder_id = (request.query_params.get("folder_id") or "").strip() or None

    try:
        result = list_files(folder_id=folder_id)
        return Response(
            {
                "status": "success",
                **result,
            },
            status=status.HTTP_200_OK,
        )
    except Exception as error:
        logger.exception("No se pudieron listar los archivos de Google Drive")
        return _drive_error_response(
            error,
            "No se pudieron listar los archivos de Google Drive.",
        )


@api_view(["POST"])
@permission_classes([AllowAny])
def google_drive_create_folder_view(request):
    """Crea una carpeta dentro de la ubicación seleccionada."""

    name = request.data.get("name")
    parent_id = (request.data.get("parent_id") or "").strip() or None
    task_id = request.data.get("task")

    try:
        folder = create_folder(name=name, parent_id=parent_id)
        drive_link = _save_drive_link(folder, task_id)
        return Response(
            {
                "status": "success",
                "message": "Carpeta creada correctamente en Google Drive.",
                "file": folder,
                "drive_link": drive_link,
            },
            status=status.HTTP_201_CREATED,
        )
    except Exception as error:
        logger.exception("No se pudo crear la carpeta de Google Drive")
        return _drive_error_response(
            error,
            "No se pudo crear la carpeta de Google Drive.",
        )


@api_view(["POST"])
@permission_classes([AllowAny])
@parser_classes([MultiPartParser, FormParser])
def google_drive_upload_view(request):
    """Sube un archivo a la carpeta seleccionada de Google Drive."""

    uploaded_file = request.FILES.get("file")
    folder_id = (request.data.get("folder_id") or "").strip() or None
    task_id = request.data.get("task")
    max_upload_size = getattr(
        settings,
        "GOOGLE_DRIVE_MAX_UPLOAD_SIZE",
        100 * 1024 * 1024,
    )

    if uploaded_file is None:
        return Response(
            {
                "status": "error",
                "message": "Selecciona un archivo para subir.",
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    if uploaded_file.size > max_upload_size:
        max_megabytes = round(max_upload_size / (1024 * 1024))
        return Response(
            {
                "status": "error",
                "message": (
                    f"El archivo supera el límite de {max_megabytes} MB."
                ),
            },
            status=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
        )

    try:
        item = upload_file(uploaded_file, folder_id=folder_id)
        drive_link = _save_drive_link(item, task_id)
        return Response(
            {
                "status": "success",
                "message": "Archivo subido correctamente a Google Drive.",
                "file": item,
                "drive_link": drive_link,
            },
            status=status.HTTP_201_CREATED,
        )
    except Exception as error:
        logger.exception("No se pudo subir el archivo a Google Drive")
        return _drive_error_response(
            error,
            "No se pudo subir el archivo a Google Drive.",
        )


@api_view(["PATCH", "DELETE"])
@permission_classes([AllowAny])
def google_drive_file_detail_view(request, file_id):
    """Renombra o envía a papelera un elemento de Google Drive."""

    try:
        if request.method == "PATCH":
            item = rename_file(file_id, request.data.get("name"))
            DriveLink.objects.filter(file_id=file_id).update(
                title=item["name"],
                drive_url=(
                    item.get("web_view_link")
                    or f"https://drive.google.com/open?id={item['id']}"
                ),
            )
            return Response(
                {
                    "status": "success",
                    "message": "Nombre actualizado correctamente.",
                    "file": item,
                },
                status=status.HTTP_200_OK,
            )

        delete_file(file_id)
        DriveLink.objects.filter(file_id=file_id).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    except Exception as error:
        logger.exception("No se pudo modificar el elemento de Google Drive")
        return _drive_error_response(
            error,
            "No se pudo modificar el elemento de Google Drive.",
        )


# =============================================================
# AUTODESK PLATFORM SERVICES (APS) — Viewer 3D / BIM
# =============================================================

from .models import BIMModel

class APSStatusView(APIView):
    """
    GET /api/integrations/aps/status/
    Verifica silenciosamente si la conexión APS está activa probando el token.
    Retorna métricas para el dashboard.
    """
    permission_classes = [AllowAny]

    def get(self, request):
        try:
            APSService.get_auth_token(scopes="viewables:read")
            total_models = BIMModel.objects.count()
            last_model = BIMModel.objects.order_by('-created_at').first()
            last_sync = last_model.created_at.isoformat() if last_model else None

            return Response({
                "status": "success", 
                "connected": True,
                "total_models": total_models,
                "last_sync": last_sync
            })
        except Exception as error:
            return Response({"status": "error", "connected": False, "message": str(error)})

class BIMModelListView(APIView):
    """
    GET /api/integrations/aps/models/
    Lista los modelos BIM almacenados en la base de datos (Bóveda colaborativa).
    """
    permission_classes = [AllowAny]

    def get(self, request):
        try:
            models = BIMModel.objects.select_related('uploaded_by').all()
            models_data = []
            for model in models:
                size_mb = model.size_bytes / (1024 * 1024) if model.size_bytes else 0
                uploader_name = "Desconocido"
                if model.uploaded_by:
                    uploader_name = f"{model.uploaded_by.first_name} {model.uploaded_by.last_name}".strip()
                    if not uploader_name:
                        uploader_name = model.uploaded_by.username

                models_data.append({
                    "id": model.id,
                    "name": model.name,
                    "size": f"{size_mb:.1f} MB",
                    "synced": model.created_at.strftime("%Y-%m-%d %H:%M") if model.created_at else "N/A",
                    "urn": model.urn,
                    "object_id": model.object_id,
                    "uploaded_by_name": uploader_name,
                })
            return Response({"status": "success", "models": models_data})
        except Exception as error:
            logger.exception("Error al listar modelos BIM")
            return Response({"status": "error", "message": str(error)}, status=500)

class BIMModelDetailView(APIView):
    """
    PATCH /api/integrations/aps/models/<id>/
    Renombrar un modelo.
    DELETE /api/integrations/aps/models/<id>/
    Eliminar un modelo de la BD.
    """
    permission_classes = [AllowAny]

    def patch(self, request, pk):
        try:
            model = BIMModel.objects.get(pk=pk)
            name = request.data.get("name")
            if name:
                model.name = name
                model.save(update_fields=['name'])
            return Response({"status": "success", "message": "Nombre del modelo actualizado."})
        except BIMModel.DoesNotExist:
            return Response({"status": "error", "message": "Modelo no encontrado."}, status=404)
        except Exception as error:
            return Response({"status": "error", "message": str(error)}, status=500)

    def delete(self, request, pk):
        try:
            model = BIMModel.objects.get(pk=pk)
            model.delete()
            return Response({"status": "success", "message": "Modelo eliminado localmente."})
        except BIMModel.DoesNotExist:
            return Response({"status": "error", "message": "Modelo no encontrado."}, status=404)
        except Exception as error:
            return Response({"status": "error", "message": str(error)}, status=500)


class APSUploadView(APIView):
    """
    POST /api/integrations/aps/upload/
    Sube un archivo a Autodesk OSS, inicia traducción y guarda en Bóveda.
    """
    authentication_classes = [SimpleUserAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            file_obj = request.FILES.get("file")
            if not file_obj:
                return Response({"status": "error", "message": "Archivo no proporcionado"}, status=400)

            filename = file_obj.name
            size_bytes = file_obj.size

            # Subir archivo al bucket de APS
            upload_res = APSService.upload_file(file_obj, filename)
            object_id = upload_res["objectId"]

            # Codificar URN en base64 sin padding (URL safe)
            urn_bytes = base64.urlsafe_b64encode(object_id.encode("utf-8"))
            urn = urn_bytes.decode("utf-8").rstrip("=")

            # Iniciar traducción
            APSService.translate_model(urn)

            # Guardar en base de datos local
            BIMModel.objects.create(
                name=filename,
                urn=urn,
                object_id=object_id,
                size_bytes=size_bytes,
                uploaded_by=request.user
            )

            return Response({
                "status": "success",
                "message": "Archivo subido y agregado a la bóveda BIM",
                "urn": urn
            })
        except Exception as error:
            logger.exception("Error al subir/traducir modelo")
            return Response({"status": "error", "message": str(error)}, status=500)


class APSTokenView(APIView):
    """
    GET /api/integrations/aps/token/

    Genera un token de acceso de solo lectura para el Autodesk Viewer 3D.
    El scope 'viewables:read' es el mínimo necesario para que el Viewer
    pueda cargar modelos ya traducidos.

    El Client Secret NUNCA sale de este endpoint — el frontend solo
    recibe el access_token temporal (válido por 3600 s normalmente).
    """

    permission_classes = [AllowAny]

    def get(self, request):
        try:
            token_data = APSService.get_auth_token(scopes="viewables:read")
            return Response(
                {
                    "access_token": token_data["access_token"],
                    "expires_in":   token_data["expires_in"],
                },
                status=status.HTTP_200_OK,
            )
        except Exception as error:
            logger.exception("Error al generar token de APS")
            return Response(
                {
                    "message": "No se pudo generar el token de Autodesk Platform Services.",
                    "detail":  str(error),
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
