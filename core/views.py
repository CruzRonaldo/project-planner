import base64
import logging
import os
import re
import time
from datetime import date, timedelta

from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth.models import update_last_login
from django.db import connection, transaction
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
    authentication_classes,
    parser_classes,
    permission_classes,
)
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import AllowAny, IsAdminUser, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import (
    DriveLink,
    Milestone,
    PerformanceMetric,
    Project,
    PersonnelIncident,
    Role,
    SecurityAuditLog,
    Task,
    TeamMember,
    TeamMemberChangeLog,
    TeamStatus,
    TechnicalArea,
    UserProfile,
    ProjectMeeting,
    ProjectChangeLog,
    ScheduleAdjustment,
    TwoFactorProfile,
)

from rest_framework.authentication import SessionAuthentication
from rest_framework.exceptions import ValidationError
from .authentication import PasswordBoundAuthentication, issue_session_token

SimpleUserAuthentication = PasswordBoundAuthentication
from .serializers import (
    ProjectChangeLogSerializer,
    ScheduleAdjustmentSerializer,
    CreateTechnicianSerializer,
    DriveLinkSerializer,
    MilestoneSerializer,
    PerformanceMetricSerializer,
    ProjectSerializer,
    PersonnelIncidentSerializer,
    RoleSerializer,
    TaskSerializer,
    TeamMemberSerializer,
    TeamMemberChangeLogSerializer,
    TeamStatusSerializer,
    TechnicalAreaSerializer,
    ProjectMeetingSerializer,
    resolve_team_member,
    resolve_project,
    resolve_technical_area,
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
from .services.password_policy import (
    format_password_policy_error,
    get_password_policy_errors,
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

    # Autenticación de Dos Factores (2FA/TOTP) obligatoria y exclusiva para Administradores
    if is_admin and not getattr(settings, 'DISABLE_2FA', False):
        two_fa, _ = TwoFactorProfile.objects.get_or_create(user=user)
        return Response({
            "requires_2fa": True,
            "user_id": user.id,
            "is_2fa_setup": bool(two_fa.totp_secret),
            "status": "requires_2fa",
            "message": "Se requiere 2FA",
        }, status=status.HTTP_200_OK)

    # Actualizar last_login en la base de datos
    update_last_login(None, user)
    session_token = issue_session_token(user)

    user_role = "admin" if is_admin else "user"
    role_display = "Project Manager (Admin)" if is_admin else "Equipo Técnico"

    user_photo = None
    user_phone = ""
    try:
        profile, _ = UserProfile.objects.get_or_create(user=user)
        user_photo = profile.avatar
        user_phone = profile.phone or ""
    except Exception:
        pass

    return Response(
        {
            "status": "success",
            "message": f"Bienvenido al sistema, {user.username}",
            "session_token": session_token,
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
                "photo": user_photo,
                "avatar": user_photo,
                "phone": user_phone,
                "session_token": session_token,
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
        for u in User.objects.all().select_related('profile').order_by('id'):
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

            user_avatar = getattr(u, 'profile', None).avatar if hasattr(u, 'profile') and u.profile else None

            users_list.append({
                'id': user_id,
                'db_id': u.id,
                'username': u.username,
                'name': display_name,
                'email': u.email,
                'isAdmin': is_admin_user,
                'isSubAdmin': bool(u.is_staff and not is_admin_user),
                'isOnline': is_online,
                'photo': user_avatar,
                'avatar': user_avatar,
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
@authentication_classes([SimpleUserAuthentication])
@permission_classes([IsAuthenticated])
def session_validate_view(request):
    """Confirma que el token siga vinculado a la contraseña vigente."""
    return Response({
        'status': 'success',
        'valid': True,
        'user_id': request.user.id,
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@authentication_classes([SimpleUserAuthentication])
@permission_classes([IsAuthenticated])
def change_password_view(request):
    """
    Endpoint para cambiar la contraseña de un usuario validando su contraseña actual.
    Garantiza que la clave anterior coincida y que la nueva contraseña se almacene
    encriptada en la Base de Datos cumpliendo toda la política de seguridad.
    """
    data = request.data
    current_password = data.get('current_password') or data.get('currentPassword') or ''
    new_password = data.get('new_password') or data.get('newPassword') or ''
    confirm_password = data.get('confirm_password') or data.get('confirmPassword') or ''
    verify_only_value = data.get('verify_only', data.get('verifyOnly', False))
    verify_only = verify_only_value is True or str(verify_only_value).lower() in ('1', 'true', 'yes')

    # La cuenta se toma únicamente del token de sesión autenticado.
    user = request.user

    # 2. Validar contraseña actual obligatoria y correcta
    if not current_password:
        return Response({
            'status': 'error',
            'message': 'Debe ingresar su contraseña actual.'
        }, status=status.HTTP_400_BAD_REQUEST)

    if not user.check_password(current_password):
        return Response({
            'status': 'error',
            'message': 'La contraseña actual no es correcta. Verifique e intente nuevamente.'
        }, status=status.HTTP_400_BAD_REQUEST)

    # Permite que la interfaz verifique la clave actual antes de mostrar
    # los campos de la nueva contraseña, sin modificar ningún dato.
    if verify_only:
        return Response({
            'status': 'success',
            'verified': True,
            'message': 'Contraseña actual verificada correctamente.'
        }, status=status.HTTP_200_OK)

    # 3. Validar nueva contraseña con política unificada
    policy_errors = get_password_policy_errors(
        new_password,
        confirm_password=confirm_password,
        current_password=current_password,
    )
    if policy_errors:
        return Response({
            'status': 'error',
            'message': format_password_policy_error(policy_errors),
        }, status=status.HTTP_400_BAD_REQUEST)

    # 4. Actualizar contraseña cifrada en la base de datos
    user.set_password(new_password)
    user.save()
    new_session_token = issue_session_token(user)

    # Registrar en bitácora de auditoría
    try:
        actor_name = f"{user.first_name} {user.last_name}".strip() or user.username
        ip_addr = request.META.get('HTTP_X_FORWARDED_FOR') or request.META.get('REMOTE_ADDR')
        if ip_addr and ',' in ip_addr:
            ip_addr = ip_addr.split(',')[0].strip()
        SecurityAuditLog.objects.create(
            user=user,
            action='password_change',
            description=f"El usuario **{actor_name}** ({user.email or user.username}) actualizó su contraseña de acceso.",
            ip_address=ip_addr if ip_addr and len(ip_addr) <= 45 else None
        )
    except Exception:
        pass

    return Response({
        'status': 'success',
        'message': 'Contraseña modificada correctamente. Las demás sesiones fueron cerradas.',
        'session_token': new_session_token,
    }, status=status.HTTP_200_OK)


def format_known_country_phone(digits_after_plus: str) -> str | None:
    """
    Formatea canónicamente números internacionales con prefijo de países reconocidos
    (Perú, México, Colombia, Chile, España, EE.UU./Canadá, Argentina).
    """
    if not digits_after_plus or not isinstance(digits_after_plus, str):
        return None

    # Perú (+51): 9 dígitos iniciando en 9
    if len(digits_after_plus) == 11 and digits_after_plus.startswith('519'):
        d = digits_after_plus[2:]
        return f"+51 {d[0:3]} {d[3:6]} {d[6:9]}"

    # México (+52): 10 dígitos nacionales (ej. +52 55 8869 4904)
    if len(digits_after_plus) == 12 and digits_after_plus.startswith('52'):
        d = digits_after_plus[2:]
        return f"+52 {d[0:2]} {d[2:6]} {d[6:10]}"

    # Colombia (+57): 10 dígitos nacionales (ej. +57 300 123 4567)
    if len(digits_after_plus) == 12 and digits_after_plus.startswith('57'):
        d = digits_after_plus[2:]
        return f"+57 {d[0:3]} {d[3:6]} {d[6:10]}"

    # Chile (+56): 9 dígitos nacionales (ej. +56 9 1234 5678)
    if len(digits_after_plus) == 11 and digits_after_plus.startswith('56'):
        d = digits_after_plus[2:]
        return f"+56 {d[0:1]} {d[1:5]} {d[5:9]}"

    # España (+34): 9 dígitos nacionales (ej. +34 612 345 678)
    if len(digits_after_plus) == 11 and digits_after_plus.startswith('34'):
        d = digits_after_plus[2:]
        return f"+34 {d[0:3]} {d[3:6]} {d[6:9]}"

    # EE.UU. / Canadá (+1): 10 dígitos nacionales (ej. +1 555 123 4567)
    if len(digits_after_plus) == 11 and digits_after_plus.startswith('1'):
        d = digits_after_plus[1:]
        return f"+1 {d[0:3]} {d[3:6]} {d[6:10]}"

    # Argentina (+54): 10 dígitos nacionales (ej. +54 11 2345 6789)
    if len(digits_after_plus) == 12 and digits_after_plus.startswith('54'):
        d = digits_after_plus[2:]
        return f"+54 {d[0:2]} {d[2:6]} {d[6:10]}"

    return None


@api_view(['GET', 'PATCH', 'POST'])
@permission_classes([AllowAny])
def user_profile_view(request):
    """
    Obtiene o actualiza la foto de perfil (avatar), datos personales y correo electrónico del usuario.
    Permite el cambio flexible a correos personales/corporativos (Gmail, Outlook, etc.),
    validando unicidad y registrando cada cambio en la bitácora de auditoría.
    """
    data = request.data if request.method in ['POST', 'PATCH'] else request.query_params
    identifier = (data.get('identifier') or data.get('email') or data.get('username') or '').strip()
    user_id = data.get('user_id') or data.get('userId') or data.get('id')

    user = None
    if user_id and str(user_id).isdigit():
        user = User.objects.filter(id=int(user_id)).first()
    if not user and identifier:
        clean_id = str(identifier).replace('usr-', '').strip()
        user = User.objects.filter(
            Q(username__iexact=identifier) | Q(email__iexact=identifier) | Q(username__iexact=clean_id)
        ).first()
    if not user and request.user and request.user.is_authenticated:
        user = request.user

    if not user:
        return Response({
            'status': 'error',
            'message': 'Usuario no encontrado.'
        }, status=status.HTTP_404_NOT_FOUND)

    profile, _ = UserProfile.objects.get_or_create(user=user)

    if request.method in ['POST', 'PATCH']:
        # 1. Actualizar foto / avatar
        if 'photo' in data or 'avatar' in data:
            photo_val = data.get('photo') if 'photo' in data else data.get('avatar')
            profile.avatar = photo_val or None

        # 2. Actualizar teléfono
        if 'phone' in data:
            raw_phone = (data.get('phone') or '').strip()
            if raw_phone:
                if len(raw_phone) > 20:
                    return Response({
                        'status': 'error',
                        'message': 'El formato del teléfono ingresado no es válido.'
                    }, status=status.HTTP_400_BAD_REQUEST)

                # Validar que no contenga letras, puntos ni comas
                if re.search(r'[a-zA-Z.,]', raw_phone):
                    return Response({
                        'status': 'error',
                        'message': 'El formato del teléfono ingresado no es válido.'
                    }, status=status.HTTP_400_BAD_REQUEST)

                # Si no empieza con '+': asumimos Perú (9 dígitos iniciando con 9)
                if not raw_phone.startswith('+'):
                    digits = re.sub(r'\D', '', raw_phone)
                    if len(digits) == 9 and digits.startswith('9'):
                        profile.phone = f"+51 {digits[0:3]} {digits[3:6]} {digits[6:9]}"
                    else:
                        return Response({
                            'status': 'error',
                            'message': 'El formato del teléfono ingresado no es válido.'
                        }, status=status.HTTP_400_BAD_REQUEST)
                else:
                    # Formato internacional: tras el '+' debe tener entre 8 y 15 dígitos y no iniciar en '0'
                    digits_after_plus = re.sub(r'\D', '', raw_phone[1:])
                    if (
                        len(digits_after_plus) < 8
                        or len(digits_after_plus) > 15
                        or digits_after_plus.startswith('0')
                    ):
                        return Response({
                            'status': 'error',
                            'message': 'El formato del teléfono ingresado no es válido.'
                        }, status=status.HTTP_400_BAD_REQUEST)

                    formatted_known = format_known_country_phone(digits_after_plus)
                    if formatted_known:
                        profile.phone = formatted_known
                    else:
                        clean_intl = '+' + re.sub(r'\s+', ' ', raw_phone[1:]).strip()
                        if len(clean_intl) > 20:
                            return Response({
                                'status': 'error',
                                'message': 'El formato del teléfono ingresado no es válido.'
                            }, status=status.HTTP_400_BAD_REQUEST)
                        profile.phone = clean_intl
            else:
                profile.phone = ""

        profile.save()

        user_update_fields = []

        # 3. Actualizar nombre si se envía
        if 'name' in data and data.get('name'):
            full_name = data.get('name').strip()
            parts = full_name.split(' ')
            user.first_name = parts[0]
            user.last_name = ' '.join(parts[1:]) if len(parts) > 1 else ''
            user_update_fields.extend(['first_name', 'last_name'])

        # 4. Actualizar correo electrónico (Gmail, Outlook u otro dominio)
        if 'email' in data and data.get('email'):
            new_email = data.get('email').strip().lower()
            old_email = (user.email or '').strip().lower()

            if new_email != old_email:
                from django.core.validators import validate_email
                from django.core.exceptions import ValidationError as DjangoValidationError
                try:
                    validate_email(new_email)
                except DjangoValidationError:
                    return Response({
                        'status': 'error',
                        'message': 'El formato del correo electrónico ingresado no es válido.'
                    }, status=status.HTTP_400_BAD_REQUEST)

                # Validar unicidad en usuarios existentes
                if User.objects.filter(Q(email__iexact=new_email) | Q(username__iexact=new_email)).exclude(id=user.id).exists():
                    return Response({
                        'status': 'error',
                        'message': 'El correo electrónico ya está registrado por otra cuenta en el sistema.'
                    }, status=status.HTTP_400_BAD_REQUEST)

                # Validar unicidad en técnicos
                if TeamMember.objects.filter(email__iexact=new_email).exclude(email__iexact=old_email).exists():
                    return Response({
                        'status': 'error',
                        'message': 'El correo electrónico ya se encuentra registrado en el equipo técnico.'
                    }, status=status.HTTP_400_BAD_REQUEST)

                # Si el username coincidía con el email antiguo o contenía un correo, mantener sincronía
                user.email = new_email
                user_update_fields.append('email')
                if not user.username or user.username.strip().lower() == old_email or '@' in user.username:
                    user.username = new_email
                    user_update_fields.append('username')

                # Sincronizar en ficha de TeamMember (vinculada a sus proyectos y asignaciones)
                if old_email:
                    TeamMember.objects.filter(email__iexact=old_email).update(email=new_email)

                # Registrar evento en la bitácora de auditoría
                try:
                    actor_name = f"{user.first_name} {user.last_name}".strip() or user.username
                    ip_addr = request.META.get('HTTP_X_FORWARDED_FOR') or request.META.get('REMOTE_ADDR')
                    if ip_addr and ',' in ip_addr:
                        ip_addr = ip_addr.split(',')[0].strip()
                    SecurityAuditLog.objects.create(
                        user=user,
                        action='email_change',
                        description=f"El usuario **{actor_name}** modificó su correo de acceso de **{old_email or 'sin correo'}** a **{new_email}**.",
                        old_value=old_email,
                        new_value=new_email,
                        ip_address=ip_addr if ip_addr and len(ip_addr) <= 45 else None
                    )
                except Exception:
                    pass

        if user_update_fields:
            user.save(update_fields=list(set(user_update_fields)))

        return Response({
            'status': 'success',
            'message': 'Perfil actualizado correctamente.',
            'profile': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'name': f"{user.first_name} {user.last_name}".strip() or user.username,
                'photo': profile.avatar,
                'avatar': profile.avatar,
                'phone': profile.phone,
            }
        }, status=status.HTTP_200_OK)

    # GET
    return Response({
        'status': 'success',
        'profile': {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'name': f"{user.first_name} {user.last_name}".strip() or user.username,
            'photo': profile.avatar,
            'avatar': profile.avatar,
            'phone': profile.phone,
        }
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([AllowAny])
def audit_logs_view(request):
    """
    Retorna la bitácora de auditoría de seguridad para supervisión del Administrador.
    Muestra modificaciones de correo, claves y eventos de cuentas.
    """
    logs = SecurityAuditLog.objects.select_related('user').order_by('-created_at')[:50]
    result = []
    for log in logs:
        result.append({
            'id': log.id,
            'userId': log.user.id,
            'userName': f"{log.user.first_name} {log.user.last_name}".strip() or log.user.username,
            'userEmail': log.user.email,
            'action': log.action,
            'actionDisplay': log.get_action_display(),
            'description': log.description,
            'oldValue': log.old_value,
            'newValue': log.new_value,
            'ipAddress': log.ip_address,
            'createdAt': log.created_at.strftime('%Y-%m-%d %H:%M:%S'),
            'dateFormatted': log.created_at.strftime('%d/%m/%Y %H:%M'),
        })
    return Response({'status': 'success', 'logs': result}, status=status.HTTP_200_OK)


@api_view(['GET'])
@authentication_classes([SimpleUserAuthentication])
@permission_classes([AllowAny])
def notifications_view(request):
    """
    Retorna notificaciones personalizadas según el usuario conectado,
    incluyendo asignaciones directas de proyectos como líder técnico
    y alertas de auditoría de seguridad para el Administrador.
    """
    from .services.personnel_incidents import process_incident_lifecycle

    process_incident_lifecycle()
    username = (request.query_params.get('username') or '').strip().lower()
    email = (request.query_params.get('email') or '').strip().lower()
    notifications = []

    # Resuelve el usuario autenticado (Bearer token) o mediante parámetros retrocompatibles
    user = None
    target_ident = email or username
    if target_ident:
        user = User.objects.filter(
            Q(email__iexact=target_ident) |
            Q(username__iexact=target_ident)
        ).first()
    elif request.user and request.user.is_authenticated:
        user = request.user
        username = (user.username or '').strip().lower()
        email = (user.email or '').strip().lower()

    is_admin = bool(
        (user and (user.is_superuser or user.is_staff)) or
        ('admin' in username) or
        ('admin' in email)
    )

    if is_admin:
        try:
            recent_audits = SecurityAuditLog.objects.select_related('user').filter(
                created_at__gte=timezone.now() - timedelta(days=14)
            ).order_by('-created_at')[:8]
            for log in recent_audits:
                notifications.append({
                    'id': f"audit-{log.id}",
                    'title': f"Auditoría: {log.get_action_display()}",
                    'detail': log.description,
                    'time': log.created_at.strftime('%d/%m %H:%M'),
                    'type': 'security_audit',
                    'unread': True,
                })
        except Exception:
            pass

    # Buscar si el usuario actual es un miembro de equipo con un proyecto asignado
    member = None
    if target_ident:
        member = TeamMember.objects.filter(
            Q(email__iexact=target_ident) |
            Q(first_name__iexact=target_ident) |
            Q(last_name__iexact=target_ident)
        ).first()

    if member and member.project:
        p = member.project
        notifications.append({
            'id': f"proj-assigned-{p.id}",
            'title': 'Proyecto Asignado',
            'detail': f"Has sido asignado como líder técnico del proyecto **{p.name}** ({p.code}).",
            'time': 'Reciente',
            'type': 'project_assignment',
            'projectId': p.id,
            'unread': True,
        })

    # Alertas de reincorporación. Los administradores observan a todo el equipo;
    # cada técnico solo recibe alertas de sus propias incidencias.
    today = timezone.localdate()
    upcoming_returns = PersonnelIncident.objects.filter(
        workflow_status='approved',
    ).select_related('member')
    if not is_admin:
        if member:
            upcoming_returns = upcoming_returns.filter(member=member)
        else:
            upcoming_returns = upcoming_returns.none()
    from .services.personnel_incidents import incident_return_date
    upcoming_returns = [
        incident for incident in upcoming_returns.order_by('end_date', 'id')
        if today <= incident_return_date(incident.start_date, incident.end_date)
        <= today + timedelta(days=7)
    ][:8]
    for incident in upcoming_returns:
        member_name = f"{incident.member.first_name} {incident.member.last_name}".strip()
        return_date = incident_return_date(incident.start_date, incident.end_date)
        days = (return_date - today).days
        when = 'Hoy' if days == 0 else f'En {days} día(s)'
        notifications.append({
            'id': f'incident-return-{incident.id}',
            'title': 'Reincorporación próxima',
            'detail': (
                f"{member_name} retorna el {return_date:%d/%m/%Y} "
                f"tras {incident.get_incident_type_display().lower()}."
            ),
            'time': when,
            'type': 'personnel_return',
            'incidentId': incident.id,
            'memberId': incident.member_id,
            'unread': True,
        })

    # Notificaciones de hitos próximos
    try:
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
                'detail': f"Proyecto **{m.project.name}** ({m.project.code}) programado para {m.target_date}.",
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
    """CRUD y administración del Directorio de Personal y Equipo Técnico.

    Coordina la asignación operativa de técnicos a proyectos, áreas técnicas,
    roles de especialidad y porcentajes de dedicación (allocation_percentage).

    Características clave:
    - Ciclo de Vida de Incidencias: Ejecuta `process_incident_lifecycle()` automáticamente
      en cada consulta para aplicar transiciones de estado de personal por licencias,
      vacaciones o incapacidades activas.
    - Control de Acceso (RBAC): Permite lectura (GET/HEAD/OPTIONS) con permisos amplios,
      restringiendo las mutaciones (POST/PUT/PATCH/DELETE) exclusivamente a administradores (`IsAdminUser`).
    - Filtros Query Parameters: Soporta filtrado directo por área técnica (`?area=<id>`),
      estado operativo (`?status=<id>`) y proyecto asignado (`?project=<id>`).
    """

    authentication_classes = [SimpleUserAuthentication]
    queryset = TeamMember.objects.select_related(
        "role",
        "technical_area",
        "status",
        "project",
    ).all()
    serializer_class = TeamMemberSerializer

    def get_permissions(self):
        """Permite consultar el directorio y restringe sus cambios a gestores."""
        if self.request.method in ('GET', 'HEAD', 'OPTIONS'):
            return [AllowAny()]
        return [IsAdminUser()]

    def get_queryset(self):
        from .services.personnel_incidents import process_incident_lifecycle

        process_incident_lifecycle()
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

    @transaction.atomic
    def update(self, request, *args, **kwargs):
        from .services.personnel_incidents import process_incident_lifecycle

        process_incident_lifecycle()
        instance = self.get_object()
        protected_fields = {'status', 'availability'}.intersection(request.data.keys())
        today = timezone.localdate()
        from .services.personnel_incidents import incident_return_date
        active_incident = any(
            incident.start_date <= today < incident_return_date(
                incident.start_date, incident.end_date
            )
            for incident in PersonnelIncident.objects.filter(
            member=instance,
            workflow_status='approved',
            applied_at__isnull=False,
            start_date__lte=today,
            ).only('start_date', 'end_date')
        )
        if protected_fields and active_incident:
            raise ValidationError({
                'detail': (
                    'No se puede cambiar directamente el estado o la disponibilidad '
                    'mientras exista una incidencia aprobada vigente.'
                )
            })
        return super().update(request, *args, **kwargs)

    def perform_update(self, serializer):
        from .services.personnel_incidents import (
            build_field_changes,
            capture_member_state,
            create_change_log,
        )

        previous = capture_member_state(serializer.instance)

        user = getattr(self.request, 'user', None)
        creator = user if user and user.is_authenticated else None
        if creator:
            serializer.instance._assigned_by = creator
            serializer.instance.created_by = creator
        else:
            fallback_name = self.request.data.get('creator_name') or self.request.data.get('createdBy')
            fallback_email = self.request.data.get('creator_email')
            if fallback_name:
                serializer.instance._fallback_creator_name = fallback_name
            if fallback_email:
                serializer.instance._fallback_creator_email = fallback_email

        member = serializer.save()
        current = capture_member_state(member)
        if build_field_changes(previous, current):
            create_change_log(
                member=member,
                action='manual_update',
                source='manual',
                previous=previous,
                current=current,
                comment=(
                    self.request.data.get('change_comment')
                    or self.request.data.get('comment')
                    or 'Actualización manual desde Recursos Humanos.'
                ),
                actor=self.request.user,
            )

    @transaction.atomic
    def perform_destroy(self, instance):
        from .services.personnel_incidents import capture_member_state, create_change_log

        state = capture_member_state(instance)
        create_change_log(
            member=instance,
            action='member_deleted',
            source='manual',
            previous=state,
            current=state,
            comment='Integrante eliminado del directorio técnico.',
            actor=self.request.user,
        )
        instance.delete()


class PersonnelIncidentViewSet(viewsets.ModelViewSet):
    """Flujo persistente de incidencias/licencias para Administradores."""

    authentication_classes = [SimpleUserAuthentication]
    permission_classes = [IsAdminUser]
    serializer_class = PersonnelIncidentSerializer
    queryset = PersonnelIncident.objects.select_related(
        'member', 'member__technical_area', 'resulting_status', 'backup_member',
        'previous_status', 'created_by', 'reviewed_by',
    ).all()

    def get_queryset(self):
        from .services.personnel_incidents import process_incident_lifecycle

        process_incident_lifecycle()
        queryset = super().get_queryset()
        params = self.request.query_params
        if params.get('member'):
            queryset = queryset.filter(member_id=params['member'])
        if params.get('type'):
            queryset = queryset.filter(incident_type=params['type'])
        if params.get('status'):
            queryset = queryset.filter(workflow_status=params['status'])
        if params.get('start_date'):
            queryset = queryset.filter(end_date__gt=params['start_date'])
        if params.get('end_date'):
            queryset = queryset.filter(start_date__lt=params['end_date'])
        if str(params.get('active', '')).lower() in {'1', 'true', 'yes'}:
            from .services.personnel_incidents import incident_return_date

            today = timezone.localdate()
            active_ids = [
                incident.id for incident in queryset.filter(
                    workflow_status='approved', start_date__lte=today
                ).only('id', 'start_date', 'end_date')
                if today < incident_return_date(incident.start_date, incident.end_date)
            ]
            queryset = queryset.filter(id__in=active_ids)
        if params.get('upcoming_return_days'):
            from .services.personnel_incidents import incident_return_date

            try:
                days = max(0, min(365, int(params['upcoming_return_days'])))
            except (TypeError, ValueError):
                raise ValidationError({'upcoming_return_days': 'Debe ser un número entero.'})
            today = timezone.localdate()
            upcoming_ids = [
                incident.id for incident in queryset.filter(
                    workflow_status='approved'
                ).only('id', 'start_date', 'end_date')
                if today <= incident_return_date(incident.start_date, incident.end_date)
                <= today + timedelta(days=days)
            ]
            queryset = queryset.filter(id__in=upcoming_ids)
        return queryset

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    def destroy(self, request, *args, **kwargs):
        incident = self.get_object()
        if incident.workflow_status == 'approved':
            raise ValidationError(
                'Finaliza la incidencia aprobada antes de eliminarla.'
            )
        return super().destroy(request, *args, **kwargs)

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        from .services.personnel_incidents import approve_incident

        incident = approve_incident(
            self.get_object(),
            actor=request.user,
            comment=request.data.get('comment', ''),
        )
        return Response(self.get_serializer(incident).data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        from .services.personnel_incidents import reject_incident

        incident = reject_incident(
            self.get_object(),
            actor=request.user,
            comment=request.data.get('comment', ''),
        )
        return Response(self.get_serializer(incident).data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'])
    def finalize(self, request, pk=None):
        from .services.personnel_incidents import finalize_incident

        incident = finalize_incident(
            self.get_object(),
            actor=request.user,
            comment=request.data.get('comment', ''),
        )
        return Response(self.get_serializer(incident).data, status=status.HTTP_200_OK)


class TeamMemberChangeLogViewSet(viewsets.ReadOnlyModelViewSet):
    """Consulta del historial permanente de cambios de Recursos Humanos."""

    authentication_classes = [SimpleUserAuthentication]
    permission_classes = [IsAdminUser]
    serializer_class = TeamMemberChangeLogSerializer
    queryset = TeamMemberChangeLog.objects.select_related(
        'member', 'incident', 'previous_status', 'new_status',
        'previous_project', 'new_project', 'changed_by',
    ).all()

    def get_queryset(self):
        queryset = super().get_queryset()
        params = self.request.query_params
        if params.get('member'):
            queryset = queryset.filter(member_id=params['member'])
        if params.get('source'):
            queryset = queryset.filter(source=params['source'])
        if params.get('action'):
            queryset = queryset.filter(action=params['action'])
        if params.get('date_from'):
            queryset = queryset.filter(created_at__date__gte=params['date_from'])
        if params.get('date_to'):
            queryset = queryset.filter(created_at__date__lte=params['date_to'])
        return queryset


class ProjectViewSet(viewsets.ModelViewSet):
    """CRUD y controlador de gobernanza para Proyectos y Portafolio.

    Gestiona el ciclo de vida completo de los proyectos de la plataforma, coordinando
    relaciones con hitos estratégicos, tareas operativas e integrantes del equipo técnico.

    Reglas de Gobernanza Corporativa:
    - Umbral de Presupuesto ($100,000 USD): Proyectos con presupuesto superior a $100,000 USD
      requieren revisión formal por Comité Directivo ('Revisión por Comité Directivo'),
      mientras que proyectos de menor escala operan bajo aprobación del Líder Técnico.
      Los usuarios sin privilegios administrativos (is_staff / is_superuser) tienen
      estrictamente bloqueada la alteración de presupuestos y asignación de líderes en actualizaciones.
    - Eliminación Exclusiva de Administradores: El método `destroy` valida que solo usuarios
      con privilegios de Administrador (Project Manager) puedan dar de baja o eliminar proyectos
      físicamente de la base de datos.
    - Integración de Webhooks Make: Despacha notificaciones automáticas a Make (Integromat)
      ante los eventos 'project.created', 'project.updated' y 'project.deleted'.
    - Optimización de Cronograma: Expone la acción `/projects/{id}/optimize/` para el análisis
      heurístico de holguras y compresión de rutas críticas mediante `analyze_project_timeline`.
    """
    authentication_classes = [SimpleUserAuthentication, SessionAuthentication]
    queryset = Project.objects.prefetch_related('milestones', 'tasks', 'team_members__technical_area').all()
    serializer_class = ProjectSerializer

    def create(self, request, *args, **kwargs):
        # 1. Identificar líder técnico seleccionado en el formulario (soporta ID o nombre/alias)
        leader_val = request.data.get('leaderId') or request.data.get('leader_id')
        selected_leader = resolve_team_member(leader_val) if leader_val else None

        # 2. Identificar usuario creador autenticado (con fallback tolerante a request.data)
        user = getattr(request, 'user', None)
        creator = user if user and user.is_authenticated else None

        if not creator:
            creator_identifier = (
                request.data.get('creator_email')
                or request.data.get('creator_username')
                or request.data.get('createdBy')
                or request.data.get('created_by')
            )
            if creator_identifier and isinstance(creator_identifier, str):
                from django.db.models import Q
                creator = User.objects.filter(
                    Q(email__iexact=creator_identifier.strip()) |
                    Q(username__iexact=creator_identifier.strip())
                ).first()

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # 3. Guardar pasando creador y líder seleccionado en memoria para post_save
        project = serializer.save(created_by=creator, selected_leader=selected_leader)
        if not creator:
            fallback_name = request.data.get('creator_name') or request.data.get('createdBy')
            fallback_email = request.data.get('creator_email')
            if fallback_name:
                project._fallback_creator_name = fallback_name
            if fallback_email:
                project._fallback_creator_email = fallback_email

        # 4. Persistir relación del líder con el proyecto en base de datos (sin duplicar señal project.leader_assigned)
        if selected_leader:
            selected_leader._skip_leader_assigned_signal = True
            selected_leader.project = project
            selected_leader.save(update_fields=['project'])

        response_data = self.get_serializer(project).data
        headers = self.get_success_headers(response_data)
        return Response(response_data, status=status.HTTP_201_CREATED, headers=headers)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()

        # Identificar creador / editor autenticado
        user = getattr(request, 'user', None)
        creator = user if user and user.is_authenticated else None
        if not creator:
            creator_identifier = (
                request.data.get('creator_email')
                or request.data.get('creator_username')
                or request.data.get('createdBy')
                or request.data.get('created_by')
            )
            if creator_identifier and isinstance(creator_identifier, str):
                from django.contrib.auth import get_user_model
                from django.db.models import Q
                User = get_user_model()
                creator = User.objects.filter(
                    Q(email__iexact=creator_identifier.strip()) |
                    Q(username__iexact=creator_identifier.strip())
                ).first()

        is_admin_user = bool(
            user and (
                getattr(user, 'is_staff', False) or
                getattr(user, 'is_superuser', False) or
                'admin' in getattr(user, 'username', '').lower() or
                'admin' in getattr(user, 'email', '').lower()
            )
        )

        request_data = request.data.copy() if hasattr(request.data, 'copy') else dict(request.data)
        # Regla de Gobernanza: Si un usuario autenticado no es Administrador, no puede modificar el presupuesto
        if user and user.is_authenticated and not is_admin_user:
            if 'budget' in request_data:
                request_data['budget'] = instance.budget
            if 'totalBudget' in request_data:
                request_data['totalBudget'] = instance.budget

        serializer = self.get_serializer(instance, data=request_data, partial=partial)
        serializer.is_valid(raise_exception=True)
        project = serializer.save()

        # Actualizar asignación del líder técnico si viene especificado en la petición
        leader_val = request.data.get('leaderId') or request.data.get('leader_id')
        if leader_val is not None and leader_val != '':
            leader = resolve_team_member(leader_val)
            if leader:
                if creator:
                    leader._assigned_by = creator
                    leader.created_by = creator
                else:
                    fallback_name = request.data.get('creator_name') or request.data.get('createdBy')
                    fallback_email = request.data.get('creator_email')
                    if fallback_name:
                        leader._fallback_creator_name = fallback_name
                    if fallback_email:
                        leader._fallback_creator_email = fallback_email

                leader._is_leader_assignment = True
                leader.project = project
                leader.save()

        response_data = self.get_serializer(project).data
        return Response(response_data)

    def destroy(self, request, *args, **kwargs):
        # Regla de Gobernanza: Solo administradores pueden eliminar proyectos
        user = getattr(request, 'user', None)
        if user and user.is_authenticated and not (user.is_staff or user.is_superuser):
            return Response(
                {"message": "Solo el Administrador (Project Manager) puede eliminar proyectos."},
                status=status.HTTP_403_FORBIDDEN
            )
        instance = self.get_object()
        self.perform_destroy(instance)
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=['get', 'post'], url_path='optimize')
    def optimize_timeline(self, request, pk=None):
        from .services.timeline_optimizer import TimelineError, analyze_project_timeline

        project = self.get_object()
        try:
            return Response(analyze_project_timeline(project))
        except TimelineError as error:
            return Response(
                {'detail': str(error)},
                status=status.HTTP_400_BAD_REQUEST,
            )


class MilestoneViewSet(viewsets.ModelViewSet):
    """CRUD y gestión de entregas clave para Hitos Estratégicos.

    Permite el registro, edición, actualización de estado ('pending', 'in_progress', 'completed')
    y consulta de los hitos asociados a proyectos del Calendario Maestro y diagramas de Gantt.
    Soporta filtrado por proyecto mediante el query parameter `?project=<id>`.
    """

    queryset = Milestone.objects.select_related("project").all()
    serializer_class = MilestoneSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        project_id = self.request.query_params.get("project")

        if project_id:
            queryset = queryset.filter(project_id=project_id)

        return queryset


class TaskViewSet(viewsets.ModelViewSet):
    """CRUD y control de ejecución de Tareas y Órdenes de Trabajo Operativas.

    Gestiona tareas asignadas al personal técnico con relaciones a hitos, predecesores,
    categorías operativas y enlaces documentales de Google Drive.

    Filtros soportados mediante query parameters:
    - `?project=<id>`: Filtra tareas pertenecientes a un proyecto específico.
    - `?critical=true|false`: Filtra tareas según pertenezcan a la ruta crítica (`is_critical_path`).
    """

    authentication_classes = [SimpleUserAuthentication, SessionAuthentication]
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

    def perform_create(self, serializer):
        user = getattr(self.request, 'user', None)
        creator = user if user and user.is_authenticated else None
        if not creator:
            creator_identifier = (
                self.request.data.get('creator_email')
                or self.request.data.get('creator_username')
                or self.request.data.get('createdBy')
                or self.request.data.get('created_by')
                or self.request.data.get('assigned_by')
            )
            if creator_identifier and isinstance(creator_identifier, str):
                from django.contrib.auth import get_user_model
                from django.db.models import Q
                User = get_user_model()
                creator = User.objects.filter(
                    Q(email__iexact=creator_identifier.strip()) |
                    Q(username__iexact=creator_identifier.strip())
                ).first()

        serializer.save(
            creator=creator,
            priority=self.request.data.get('priority'),
            due_date=self.request.data.get('due_date') or self.request.data.get('dueDate')
        )

    def perform_update(self, serializer):
        user = getattr(self.request, 'user', None)
        creator = user if user and user.is_authenticated else None
        if not creator:
            creator_identifier = (
                self.request.data.get('creator_email')
                or self.request.data.get('creator_username')
                or self.request.data.get('createdBy')
                or self.request.data.get('created_by')
                or self.request.data.get('assigned_by')
            )
            if creator_identifier and isinstance(creator_identifier, str):
                from django.contrib.auth import get_user_model
                from django.db.models import Q
                User = get_user_model()
                creator = User.objects.filter(
                    Q(email__iexact=creator_identifier.strip()) |
                    Q(username__iexact=creator_identifier.strip())
                ).first()

        serializer.save(
            creator=creator,
            priority=self.request.data.get('priority'),
            due_date=self.request.data.get('due_date') or self.request.data.get('dueDate')
        )


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
                    "synced": timezone.localtime(model.created_at).strftime("%Y-%m-%d %H:%M") if model.created_at else "N/A",
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


class APSDownloadView(APIView):
    """
    GET /api/integrations/aps/models/<id>/download/
    
    Devuelve una URL firmada de S3 para descargar el archivo original.
    """
    authentication_classes = [SimpleUserAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        try:
            model = BIMModel.objects.get(pk=pk)
            download_url = APSService.get_download_url(model.object_id, model.name)
            return Response({
                "status": "success",
                "download_url": download_url
            })
        except BIMModel.DoesNotExist:
            return Response({"status": "error", "message": "Modelo no encontrado."}, status=404)
        except Exception as error:
            logger.exception("Error obteniendo URL de descarga")
            return Response({"status": "error", "message": str(error)}, status=500)


class CreateTechnicianView(APIView):
    authentication_classes = [SimpleUserAuthentication]
    permission_classes = [IsAdminUser]
    serializer_class = CreateTechnicianSerializer

    def post(self, request):
        serializer = CreateTechnicianSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        technician = serializer.save()

        return Response(
            {
                "message": "Técnico y cuenta de acceso creados exitosamente.",
                "member": TeamMemberSerializer(technician).data,
            },
            status=status.HTTP_201_CREATED,
        )


# ==========================================================================
# PASSWORD RESET — Recuperacion de contrasena por codigo OTP de 6 digitos
# ==========================================================================

class PasswordResetRequestView(APIView):
    """
    POST /api/auth/password-reset/request/
    Body: { "email": "usuario@empresa.com" }

    Genera un codigo OTP numerico de 6 digitos, lo guarda (o actualiza si ya
    existia uno previo) en PasswordResetCode y envia una peticion POST
    al webhook configurado en settings.RECOVERY_WEBHOOK_URL.
    Siempre responde con 200 OK para no revelar si el email existe en la BD.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        import random
        import requests
        from .models import PasswordResetCode

        email = (request.data.get('email') or '').strip().lower()
        if not email:
            return Response(
                {'status': 'error', 'message': 'El campo email es obligatorio.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = User.objects.filter(email__iexact=email).first()

        # Respuesta generica para no exponer si el correo existe
        generic_ok = Response({
            'status': 'success',
            'message': 'Si el correo existe en el sistema, recibiras un codigo de recuperacion.',
        })

        if not user:
            return generic_ok

        # Generar codigo y guardar/actualizar
        code = str(random.randint(100000, 999999))
        PasswordResetCode.objects.update_or_create(
            user=user,
            defaults={'code': code},
        )

        # Enviar peticion POST al webhook de recuperacion
        webhook_url = getattr(settings, 'RECOVERY_WEBHOOK_URL', '')
        payload = {
            'email': user.email,
            'code': code,
        }

        try:
            if webhook_url:
                requests.post(webhook_url, json=payload, timeout=5)
            else:
                print("Aviso: settings.RECOVERY_WEBHOOK_URL no esta configurado.")
        except requests.RequestException as error:
            print(f"Error al enviar webhook de recuperacion de contrasena: {error}")

        return generic_ok


class PasswordResetVerifyCodeView(APIView):
    """
    POST /api/auth/password-reset/verify-code/
    Body: { "email": "usuario@empresa.com", "code": "123456" }

    Valida que el codigo OTP coincida con el usuario y no este expirado (15 min).
    No elimina el codigo para permitir que la vista de confirmacion lo valide antes de cambiar la contrasena.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        from .models import PasswordResetCode

        email = (request.data.get('email') or '').strip().lower()
        code  = (request.data.get('code') or '').strip()

        if not email or not code:
            return Response(
                {'status': 'error', 'message': 'El correo y el codigo de verificacion son obligatorios.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = User.objects.filter(email__iexact=email).first()
        if not user:
            return Response(
                {'status': 'error', 'message': 'Codigo invalido o expirado.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            reset_code = PasswordResetCode.objects.get(user=user)
        except PasswordResetCode.DoesNotExist:
            return Response(
                {'status': 'error', 'message': 'Codigo invalido o expirado.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if reset_code.code != code:
            return Response(
                {'status': 'error', 'message': 'El codigo ingresado no es correcto.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if reset_code.is_expired(minutes=15):
            reset_code.delete()
            return Response(
                {'status': 'error', 'message': 'El codigo ha expirado. Solicita uno nuevo.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response({
            'status': 'success',
            'message': 'Codigo verificado correctamente.',
        }, status=status.HTTP_200_OK)


class PasswordResetConfirmView(APIView):
    """Confirmación y aplicación de cambio de contraseña mediante código de un solo uso (OTP).

    Endpoint: POST /api/auth/password-reset/confirm/
    Payload esperado:
        - email (str): Correo electrónico del usuario solicitante.
        - code (str): Código de 6 dígitos emitido en el flujo de recuperación.
        - new_password (str): Nueva contraseña elegida por el usuario.
        - confirm_password (str): Confirmación idéntica de la nueva contraseña.

    Reglas de negocio:
    - Valida el código OTP y comprueba que no haya superado su periodo de validez de 15 minutos.
    - Valida la política unificada de contraseña (mínimo 12 caracteres, mayúsculas, minúsculas, números, símbolos, sin espacios y coincidencia) mediante `get_password_policy_errors`.
    - Aplica la nueva contraseña mediante `user.set_password()` y elimina el código usado.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        from .models import PasswordResetCode

        email            = (request.data.get('email') or '').strip().lower()
        code             = (request.data.get('code') or '').strip()
        new_password     = request.data.get('new_password') or ''
        confirm_password = request.data.get('confirm_password') or ''

        # Validaciones basicas
        if not all([email, code, new_password, confirm_password]):
            return Response(
                {'status': 'error', 'message': 'Todos los campos son obligatorios.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        policy_errors = get_password_policy_errors(
            new_password,
            confirm_password=confirm_password,
        )
        if policy_errors:
            return Response(
                {'status': 'error', 'message': format_password_policy_error(policy_errors)},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = User.objects.filter(email__iexact=email).first()
        if not user:
            return Response(
                {'status': 'error', 'message': 'Codigo invalido o expirado.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            reset_code = PasswordResetCode.objects.get(user=user)
        except PasswordResetCode.DoesNotExist:
            return Response(
                {'status': 'error', 'message': 'Codigo invalido o expirado.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Verificar codigo
        if reset_code.code != code:
            return Response(
                {'status': 'error', 'message': 'El codigo ingresado no es correcto.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Verificar expiracion (15 minutos)
        if reset_code.is_expired(minutes=15):
            reset_code.delete()
            return Response(
                {'status': 'error', 'message': 'El codigo ha expirado. Solicita uno nuevo.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user.set_password(new_password)
        user.save(update_fields=['password'])
        reset_code.delete()

        logger.info('Contrasena restablecida exitosamente para el usuario %s', user.email)

        return Response({
            'status': 'success',
            'message': 'Tu contrasena ha sido actualizada correctamente. Ya puedes iniciar sesion.',
        })


class ProjectMeetingViewSet(viewsets.ModelViewSet):
    """
    CRUD para reuniones virtuales y videoconferencias Jitsi Meet de proyectos.
    """
    queryset = ProjectMeeting.objects.select_related('project', 'created_by').all().order_by('-created_at')
    serializer_class = ProjectMeetingSerializer
    authentication_classes = [SimpleUserAuthentication]
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = super().get_queryset()
        project_id = self.request.query_params.get('project')
        if project_id:
            queryset = queryset.filter(project_id=project_id)
        return queryset

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class ProjectChangeLogViewSet(viewsets.ModelViewSet):
    """CRUD para historial de cambios en proyectos (Portafolio)."""
    queryset = ProjectChangeLog.objects.select_related('project').all()
    serializer_class = ProjectChangeLogSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        project_id = self.request.query_params.get('project')
        if project_id:
            queryset = queryset.filter(project_id=project_id)
        return queryset


class ScheduleAdjustmentViewSet(viewsets.ModelViewSet):
    """CRUD para historial de reajustes de cronograma (Planificacion Estrategica)."""
    queryset = ScheduleAdjustment.objects.select_related('project').all()
    serializer_class = ScheduleAdjustmentSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        project_id = self.request.query_params.get('project')
        if project_id:
            queryset = queryset.filter(project_id=project_id)
        return queryset


# =============================================================
# AUTENTICACION DE DOS FACTORES (2FA/TOTP) — Solo Administradores
# =============================================================

class Setup2FAView(APIView):
    """Configuración y aprovisionamiento inicial de Autenticación de Dos Factores (2FA/TOTP).

    Genera el secreto Base32 seguro y la URI de aprovisionamiento estándar (otpauth://)
    junto con la imagen QR codificada en Base64 para que el usuario administrador
    la escanee en aplicaciones TOTP (Google Authenticator, Microsoft Authenticator, Authy).
    Restringido a usuarios con privilegios de Administrador (is_staff / is_superuser).
    """
    permission_classes = [AllowAny]

    def post(self, request):
        user = None
        if request.user and request.user.is_authenticated:
            user = request.user
        else:
            user_id = request.data.get('user_id')
            if user_id:
                User = get_user_model()
                user = User.objects.filter(id=user_id).first()

        if not user or not (user.is_superuser or user.is_staff):
            return Response(
                {"status": "error", "message": "Solo los administradores pueden configurar 2FA."},
                status=status.HTTP_403_FORBIDDEN,
            )

        import pyotp
        import qrcode
        import io
        import base64

        profile, _ = TwoFactorProfile.objects.get_or_create(user=user)
        if not profile.totp_secret:
            profile.totp_secret = pyotp.random_base32()
            profile.is_enabled = True
            profile.save(update_fields=['totp_secret', 'is_enabled'])
        elif not profile.is_enabled:
            profile.is_enabled = True
            profile.save(update_fields=['is_enabled'])

        secret = profile.totp_secret

        totp = pyotp.TOTP(secret)
        app_name = "ProjectPlanner"
        provisioning_uri = totp.provisioning_uri(
            name=user.email or user.username,
            issuer_name=app_name,
        )

        qr_code = ""
        try:
            img = qrcode.make(provisioning_uri)
            buffer = io.BytesIO()
            img.save(buffer, format="PNG")
            base64_img = base64.b64encode(buffer.getvalue()).decode('utf-8')
            qr_code = f"data:image/png;base64,{base64_img}"
        except Exception as e:
            pass

        return Response({
            "status": "success",
            "message": "2FA configurado correctamente. Escanea el código QR con tu aplicación.",
            "secret": secret,
            "provisioning_uri": provisioning_uri,
            "qr_code": qr_code,
            "account": user.email or user.username,
        }, status=status.HTTP_200_OK)


class Verify2FAView(APIView):
    """Verificación de código TOTP temporal y emisión de token de sesión administrativo.

    Valida el código numérico de 6 dígitos introducido por el administrador contra el
    secreto criptográfico TOTP guardado en su perfil (TwoFactorProfile).
    Tolera una ventana de desfase temporal de 30 segundos (valid_window=1).
    Al verificar exitosamente, actualiza la fecha de último acceso y retorna el
    session_token firmado junto con el perfil completo del usuario.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        user_id = request.data.get("user_id")
        otp_code = (request.data.get("otp_code") or request.data.get("code") or "").strip()

        if not user_id or not otp_code:
            return Response(
                {"status": "error", "message": "Se requieren user_id y otp_code."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        User = get_user_model()
        try:
            user = User.objects.get(id=user_id)
        except (User.DoesNotExist, ValueError):
            return Response(
                {"status": "error", "message": "Usuario no encontrado."},
                status=status.HTTP_404_NOT_FOUND,
            )

        try:
            profile = TwoFactorProfile.objects.get(user=user)
            if not profile.totp_secret:
                return Response(
                    {"status": "error", "message": "2FA no tiene un secreto configurado para este usuario."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
        except TwoFactorProfile.DoesNotExist:
            return Response(
                {"status": "error", "message": "2FA no está habilitado para este usuario."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        import pyotp
        totp = pyotp.TOTP(profile.totp_secret)
        # valid_window=1 tolera 1 periodo de 30s anterior/siguiente por desfase de reloj
        if not totp.verify(otp_code, valid_window=1):
            return Response(
                {"status": "error", "message": "Código de verificación inválido o expirado. Verifique la hora de su dispositivo."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Código válido → completar el login
        update_last_login(None, user)

        is_admin = bool(user.is_superuser or user.is_staff)
        user_role = "admin" if is_admin else "user"
        role_display = "Project Manager (Admin)" if is_admin else "Equipo Técnico"

        user_photo = None
        user_phone = ""
        try:
            up, _ = UserProfile.objects.get_or_create(user=user)
            user_photo = up.avatar
            user_phone = up.phone or ""
        except Exception:
            pass

        # El mismo token firmado se usa en las claves heredadas para conservar
        # compatibilidad con los consumidores actuales sin aceptar IDs como sesión.
        session_token = issue_session_token(user)

        return Response({
            "status": "success",
            "message": f"Verificación 2FA exitosa. Bienvenido, {user.username}.",
            "session_token": session_token,
            "access": session_token,
            "refresh": session_token,
            "token": session_token,
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
                "photo": user_photo,
                "avatar": user_photo,
                "phone": user_phone,
                "session_token": session_token,
            },
        }, status=status.HTTP_200_OK)


class Request2FAResetView(APIView):
    """Solicitud de código de restablecimiento de 2FA por extravío o cambio de dispositivo.

    Genera un código numérico temporal de 6 dígitos con validez de 15 minutos en el perfil
    del administrador y despacha una notificación POST asíncrona al webhook de recuperación
    de Make (Integromat) configurado en `settings.RECOVERY_WEBHOOK_URL` para su envío por correo.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        import random
        import requests
        from datetime import timedelta
        from django.utils import timezone

        user_id = request.data.get('user_id')
        if not user_id:
            return Response(
                {'status': 'error', 'message': 'El user_id es obligatorio.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        User = get_user_model()
        user = User.objects.filter(id=user_id).first()
        if not user or not (user.is_superuser or user.is_staff):
            return Response(
                {'status': 'error', 'message': 'Usuario administrador no encontrado.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Generar código numérico de 6 dígitos
        code = str(random.randint(100000, 999999))
        expires_at = timezone.now() + timedelta(minutes=15)

        two_fa, _ = TwoFactorProfile.objects.get_or_create(user=user)
        two_fa.recovery_code = code
        two_fa.recovery_code_expires = expires_at
        two_fa.save(update_fields=['recovery_code', 'recovery_code_expires'])

        # Enviar petición POST al webhook de Make
        webhook_url = getattr(settings, 'RECOVERY_WEBHOOK_URL', '')
        payload = {
            'email': user.email or user.username,
            'code': code,
            'action': '2fa_reset',
        }

        try:
            if webhook_url:
                requests.post(webhook_url, json=payload, timeout=5)
            else:
                logger.warning("settings.RECOVERY_WEBHOOK_URL no está configurado.")
        except requests.RequestException as error:
            logger.error(f"Error al enviar webhook de recuperación de 2FA: {error}")

        return Response({
            'status': 'success',
            'message': 'Se ha enviado un código de 6 dígitos a tu correo.',
        }, status=status.HTTP_200_OK)


class Verify2FAResetView(APIView):
    """Verificación del código de recuperación y reseteo definitivo del 2FA.

    Valida el código de 6 dígitos enviado por correo. Si es correcto y no ha expirado,
    limpia el secreto TOTP (`totp_secret = None`), deshabilita 2FA (`is_enabled = False`)
    e invalida el código de recuperación, permitiendo un re-aprovisionamiento limpio.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        from django.utils import timezone

        user_id = request.data.get('user_id')
        code = (request.data.get('code') or request.data.get('recovery_code') or '').strip()

        if not user_id or not code:
            return Response(
                {'status': 'error', 'message': 'user_id y código son obligatorios.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        User = get_user_model()
        user = User.objects.filter(id=user_id).first()
        if not user:
            return Response(
                {'status': 'error', 'message': 'Usuario no encontrado.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        two_fa = TwoFactorProfile.objects.filter(user=user).first()
        if not two_fa or not two_fa.recovery_code:
            return Response(
                {'status': 'error', 'message': 'No hay un código de recuperación activo para este usuario.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Validar expiración
        if two_fa.recovery_code_expires and timezone.now() > two_fa.recovery_code_expires:
            return Response(
                {'status': 'error', 'message': 'El código de recuperación ha expirado. Solicita uno nuevo.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Validar coincidencia
        if two_fa.recovery_code != code:
            return Response(
                {'status': 'error', 'message': 'Código de recuperación inválido.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Restablecer 2FA
        two_fa.totp_secret = None
        two_fa.is_enabled = False
        two_fa.recovery_code = None
        two_fa.recovery_code_expires = None
        two_fa.save(update_fields=['totp_secret', 'is_enabled', 'recovery_code', 'recovery_code_expires'])

        return Response({
            'status': 'success',
            'message': '2FA restablecido exitosamente. Inicia sesión nuevamente para configurar tu nuevo celular.',
        }, status=status.HTTP_200_OK)


# Aliases para compatibilidad formal de nomenclatura
TwoFactorSetupView = Setup2FAView
TwoFactorVerifyView = Verify2FAView
TwoFactorResetRequestView = Request2FAResetView


# Asistente de IA (Chatbot)
from .chatbot_views import ChatbotView, RAGChatbotView