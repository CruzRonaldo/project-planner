import logging
import os
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
    parser_classes,
    permission_classes,
)
from rest_framework.parsers import FormParser, MultiPartParser
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


logger = logging.getLogger(__name__)
User = get_user_model()


def test_db_connection(request):
    """Prueba la conexión entre Django y MySQL."""

    start_time = time.time()

    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1;")
            cursor.fetchone()

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
                "message": "¡Conexión exitosa con la base de datos MySQL!",
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
                    "engine": getattr(connection, "vendor", "mysql"),
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
    """Verifica las credenciales y el rol del usuario."""

    data = request.data
    identifier = (data.get("email") or data.get("username") or "").strip()
    password = data.get("password", "")
    selected_role = data.get("role", "user").lower()

    if not identifier or not password:
        return Response(
            {
                "status": "error",
                "message": "Por favor ingrese correo o usuario y contraseña.",
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    user = User.objects.filter(email__iexact=identifier).first()

    if not user:
        user = User.objects.filter(username__iexact=identifier).first()

    if not user or not user.check_password(password):
        return Response(
            {
                "status": "error",
                "message": (
                    "Credenciales inválidas. Verifique su correo, "
                    "usuario y contraseña."
                ),
            },
            status=status.HTTP_401_UNAUTHORIZED,
        )

    if not user.is_active:
        return Response(
            {
                "status": "error",
                "message": "Esta cuenta de usuario fue desactivada.",
            },
            status=status.HTTP_403_FORBIDDEN,
        )

    is_admin = user.is_superuser or user.is_staff

    if selected_role == "admin" and not is_admin:
        return Response(
            {
                "status": "error",
                "message": (
                    f"Acceso denegado: el usuario '{user.username}' "
                    "no tiene permisos de administrador."
                ),
            },
            status=status.HTTP_403_FORBIDDEN,
        )

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
    """CRUD principal para proyectos y portafolio."""

    queryset = Project.objects.prefetch_related(
        "milestones",
        "tasks",
        "team_members",
    ).all()
    serializer_class = ProjectSerializer

    @action(detail=True, methods=["get", "post"], url_path="optimize")
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

@api_view(["GET"])
@permission_classes([AllowAny])
def revit_models_view(request):
    """Mock endpoint que devuelve modelos BIM desde Revit."""
    import datetime
    import locale
    
    # Intentamos establecer locale a espanol para la fecha, pero si falla ignoramos
    try:
        locale.setlocale(locale.LC_TIME, 'es_ES.UTF-8')
    except:
        pass
        
    today = datetime.datetime.now().strftime("%d %b %Y, %H:%M").capitalize()
    
    models = [
        {"id": 1, "name": "Estructura_Edificio_Principal.rvt", "size": "248 MB", "synced": today},
        {"id": 2, "name": "Instalaciones_Electricas_v2.rvt", "size": "134 MB", "synced": today},
        {"id": 3, "name": "Topografia_Terreno.rvt", "size": "87 MB", "synced": today},
    ]
    
    return JsonResponse({
        "status": "success",
        "models": models
    })
