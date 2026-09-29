import time

from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth.models import update_last_login
from django.db import connection
from django.http import JsonResponse
from django.shortcuts import redirect

from google.auth.exceptions import RefreshError
from googleapiclient.errors import HttpError

from rest_framework import status, viewsets
from rest_framework.decorators import (
    action,
    api_view,
    permission_classes,
)
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

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
    create_authorization_url,
    get_connection_information,
    process_oauth_callback,
)


User = get_user_model()


def test_db_connection(request):
    """
    Prueba la conexión entre Django y MySQL.
    """

    start_time = time.time()

    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1;")
            cursor.fetchone()

            cursor.execute("SELECT DATABASE(), VERSION();")
            row = cursor.fetchone()

            db_name = row[0] if row else "Desconocida"
            db_version = row[1] if row else "Desconocida"

        latency_ms = round(
            (time.time() - start_time) * 1000,
            2,
        )

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
                "message": (
                    "¡Conexión exitosa con la base de datos MySQL!"
                ),
            },
            status=200,
        )

    except Exception as error:
        latency_ms = round(
            (time.time() - start_time) * 1000,
            2,
        )

        return JsonResponse(
            {
                "status": "error",
                "connected": False,
                "database": {
                    "engine": getattr(
                        connection,
                        "vendor",
                        "mysql",
                    ),
                    "latency_ms": latency_ms,
                    "error_detail": str(error),
                },
                "message": (
                    "Error al conectar con la base de datos: "
                    f"{error}"
                ),
            },
            status=500,
        )


@api_view(["POST"])
@permission_classes([AllowAny])
def login_view(request):
    """
    Verifica las credenciales y el rol del usuario.
    """

    data = request.data

    identifier = (
        data.get("email")
        or data.get("username")
        or ""
    ).strip()

    password = data.get("password", "")
    selected_role = data.get("role", "user").lower()

    if not identifier or not password:
        return Response(
            {
                "status": "error",
                "message": (
                    "Por favor ingrese correo o usuario "
                    "y contraseña."
                ),
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    user = User.objects.filter(
        email__iexact=identifier
    ).first()

    if not user:
        user = User.objects.filter(
            username__iexact=identifier
        ).first()

    if not user or not user.check_password(password):
        return Response(
            {
                "status": "error",
                "message": (
                    "Credenciales inválidas. Verifique su "
                    "correo, usuario y contraseña."
                ),
            },
            status=status.HTTP_401_UNAUTHORIZED,
        )

    if not user.is_active:
        return Response(
            {
                "status": "error",
                "message": (
                    "Esta cuenta de usuario fue desactivada."
                ),
            },
            status=status.HTTP_403_FORBIDDEN,
        )

    is_admin = user.is_superuser or user.is_staff

    if selected_role == "admin" and not is_admin:
        return Response(
            {
                "status": "error",
                "message": (
                    f"Acceso denegado: el usuario "
                    f"'{user.username}' no tiene permisos "
                    "de administrador."
                ),
            },
            status=status.HTTP_403_FORBIDDEN,
        )

    update_last_login(None, user)

    user_role = "admin" if is_admin else "user"

    role_display = (
        "Project Manager (Admin)"
        if is_admin
        else "Equipo Técnico"
    )

    return Response(
        {
            "status": "success",
            "message": (
                f"Bienvenido al sistema, {user.username}"
            ),
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


class TechnicalAreaViewSet(viewsets.ModelViewSet):
    """
    CRUD para áreas técnicas.
    """

    queryset = TechnicalArea.objects.all()
    serializer_class = TechnicalAreaSerializer


class RoleViewSet(viewsets.ModelViewSet):
    """
    CRUD para roles y cargos técnicos.
    """

    queryset = Role.objects.select_related(
        "technical_area"
    ).all()

    serializer_class = RoleSerializer

    def get_queryset(self):
        queryset = super().get_queryset()

        technical_area_id = (
            self.request.query_params.get(
                "technical_area"
            )
            or self.request.query_params.get("area")
        )

        if technical_area_id:
            queryset = queryset.filter(
                technical_area_id=technical_area_id
            )

        return queryset


class TeamStatusViewSet(viewsets.ModelViewSet):
    """
    CRUD para estados del equipo.
    """

    queryset = TeamStatus.objects.all()
    serializer_class = TeamStatusSerializer


class TeamMemberViewSet(viewsets.ModelViewSet):
    """
    CRUD para miembros del equipo técnico.
    """

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
        status_id = self.request.query_params.get(
            "status"
        )
        project_id = self.request.query_params.get(
            "project"
        )

        if area:
            queryset = queryset.filter(
                technical_area_id=area
            )

        if status_id:
            queryset = queryset.filter(
                status_id=status_id
            )

        if project_id:
            queryset = queryset.filter(
                project_id=project_id
            )

        return queryset


class ProjectViewSet(viewsets.ModelViewSet):
    """
    CRUD principal para proyectos y portafolio.
    """

    queryset = Project.objects.prefetch_related(
        "milestones",
        "tasks",
        "team_members",
    ).all()

    serializer_class = ProjectSerializer

    @action(
        detail=True,
        methods=["get", "post"],
        url_path="optimize",
    )
    def optimize_timeline(self, request, pk=None):
        """
        Calcula una posible optimización del proyecto.
        """

        project = self.get_object()
        tasks = project.tasks.all()
        metrics = project.performance_metrics.all()

        if tasks.exists():
            total_original_days = sum(
                task.duration_days
                for task in tasks
            )
        else:
            total_original_days = (
                project.duration_months * 30
            )

        optimized_tasks = []
        total_optimized_days = 0

        for task in tasks:
            task_metrics = metrics.filter(task=task)

            divisor = 5

            if task_metrics.exists():
                metric = task_metrics.first()
                divisor = metric.divisor or 5

            base_duration = task.duration_days

            reduction = (
                base_duration / divisor
                if divisor > 0
                else 0
            )

            optimized_duration = max(
                1,
                round(base_duration - reduction),
            )

            tolerance = (
                task.tolerance_days
                if task.is_critical_path
                else 0
            )

            optimized_tasks.append(
                {
                    "task_id": task.id,
                    "title": task.title,
                    "original_duration_days": (
                        base_duration
                    ),
                    "optimized_duration_days": (
                        optimized_duration
                    ),
                    "days_saved": (
                        base_duration
                        - optimized_duration
                    ),
                    "is_critical_path": (
                        task.is_critical_path
                    ),
                    "tolerance_days": tolerance,
                }
            )

            total_optimized_days += (
                optimized_duration
            )

        original_months = project.duration_months

        if total_optimized_days > 0:
            optimized_months = max(
                1,
                round(total_optimized_days / 30),
            )
        else:
            optimized_months = max(
                1,
                original_months - 1,
            )

        months_saved = max(
            0,
            original_months - optimized_months,
        )

        return Response(
            {
                "project_id": project.id,
                "project_code": project.code,
                "project_name": project.name,
                "original_duration_months": (
                    original_months
                ),
                "optimized_duration_months": (
                    optimized_months
                ),
                "months_saved": months_saved,
                "total_original_days": (
                    total_original_days
                ),
                "total_optimized_days": (
                    total_optimized_days
                ),
                "tolerance_applied_days": 7,
                "optimized_tasks": optimized_tasks,
                "message": (
                    "Optimización calculada: reducción "
                    f"de {original_months} a "
                    f"{optimized_months} meses."
                ),
            },
            status=status.HTTP_200_OK,
        )


class MilestoneViewSet(viewsets.ModelViewSet):
    """
    CRUD para hitos estratégicos.
    """

    queryset = Milestone.objects.select_related(
        "project"
    ).all()

    serializer_class = MilestoneSerializer

    def get_queryset(self):
        queryset = super().get_queryset()

        project_id = self.request.query_params.get(
            "project"
        )

        if project_id:
            queryset = queryset.filter(
                project_id=project_id
            )

        return queryset


class TaskViewSet(viewsets.ModelViewSet):
    """
    CRUD para tareas operativas.
    """

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

        project_id = self.request.query_params.get(
            "project"
        )

        is_critical = self.request.query_params.get(
            "critical"
        )

        if project_id:
            queryset = queryset.filter(
                project_id=project_id
            )

        if is_critical is not None:
            queryset = queryset.filter(
                is_critical_path=(
                    is_critical.lower() == "true"
                )
            )

        return queryset


class PerformanceMetricViewSet(
    viewsets.ModelViewSet
):
    """
    CRUD para métricas de rendimiento.
    """

    queryset = PerformanceMetric.objects.select_related(
        "project",
        "task",
    ).all()

    serializer_class = PerformanceMetricSerializer


class DriveLinkViewSet(viewsets.ModelViewSet):
    """
    CRUD para enlaces de Google Drive.
    """

    queryset = DriveLink.objects.select_related(
        "task",
        "task__project",
    ).all()

    serializer_class = DriveLinkSerializer

    def get_queryset(self):
        queryset = super().get_queryset()

        task_id = self.request.query_params.get(
            "task"
        )

        project_id = self.request.query_params.get(
            "project"
        )

        if task_id:
            queryset = queryset.filter(
                task_id=task_id
            )

        if project_id:
            queryset = queryset.filter(
                task__project_id=project_id
            )

        return queryset


@api_view(["GET"])
@permission_classes([AllowAny])
def google_drive_connect_view(request):
    """
    Redirige al usuario hacia Google para autorizar Drive.
    """

    try:
        authorization_url, state_value = (
            create_authorization_url()
        )

        request.session[
            "google_drive_oauth_state"
        ] = state_value

        return redirect(authorization_url)

    except GoogleDriveConfigurationError as error:
        return Response(
            {
                "status": "error",
                "message": str(error),
            },
            status=status.HTTP_400_BAD_REQUEST,
        )


@api_view(["GET"])
@permission_classes([AllowAny])
def google_drive_callback_view(request):
    """
    Recibe la autorización enviada por Google.
    """

    google_error = request.GET.get("error")

    if google_error:
        return Response(
            {
                "status": "error",
                "message": (
                    "La autorización de Google Drive "
                    "fue cancelada."
                ),
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    stored_state = request.session.get(
        "google_drive_oauth_state"
    )

    returned_state = request.GET.get("state")

    if (
        not stored_state
        or returned_state != stored_state
    ):
        return Response(
            {
                "status": "error",
                "message": (
                    "El estado de autorización "
                    "no es válido."
                ),
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        process_oauth_callback(
            authorization_response=(
                request.build_absolute_uri()
            ),
            state=stored_state,
        )

        request.session.pop(
            "google_drive_oauth_state",
            None,
        )

        frontend_url = (
            settings.GOOGLE_DRIVE_FRONTEND_URL
            .rstrip("/")
        )

        return redirect(
            f"{frontend_url}/?google_drive=connected"
        )

    except Exception:
        return Response(
            {
                "status": "error",
                "message": (
                    "No se pudo completar la autorización "
                    "de Google Drive."
                ),
            },
            status=(
                status.HTTP_500_INTERNAL_SERVER_ERROR
            ),
        )


@api_view(["GET"])
@permission_classes([AllowAny])
def google_drive_status_view(request):
    """
    Devuelve el estado actual de Google Drive.
    """

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

    except (RefreshError, HttpError):
        return Response(
            {
                "status": "error",
                "connected": False,
                "message": (
                    "La autorización de Google Drive "
                    "expiró o fue revocada."
                ),
            },
            status=status.HTTP_502_BAD_GATEWAY,
        )