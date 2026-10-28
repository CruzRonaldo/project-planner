from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    test_db_connection,
    login_view,
    logout_view,
    change_password_view,
    user_profile_view,
    users_status_view,
    notifications_view,
    audit_logs_view,
    PasswordResetRequestView,
    PasswordResetVerifyCodeView,
    PasswordResetConfirmView,

    TechnicalAreaViewSet,
    RoleViewSet,
    TeamStatusViewSet,
    TeamMemberViewSet,
    ProjectViewSet,
    MilestoneViewSet,
    TaskViewSet,
    PerformanceMetricViewSet,
    DriveLinkViewSet,
    ProjectMeetingViewSet,

    google_drive_connect_view,
    google_drive_callback_view,
    google_drive_status_view,
    google_drive_files_view,
    google_drive_create_folder_view,
    google_drive_upload_view,
    google_drive_file_detail_view,

    APSStatusView,
    BIMModelListView,
    BIMModelDetailView,
    APSUploadView,
    APSTokenView,
    APSDownloadView,
    CreateTechnicianView,
)

from .views_make import (
    make_incoming_webhook_view,
    make_status_view,
    test_make_connection_view,
    trigger_make_event_view,
)


router = DefaultRouter()

router.register(
    r"technical-areas",
    TechnicalAreaViewSet,
    basename="technical-area",
)
router.register(
    r"roles",
    RoleViewSet,
    basename="role",
)
router.register(
    r"team-statuses",
    TeamStatusViewSet,
    basename="team-status",
)
router.register(
    r"team-members",
    TeamMemberViewSet,
    basename="team-member",
)
router.register(
    r"projects",
    ProjectViewSet,
    basename="project",
)
router.register(
    r"milestones",
    MilestoneViewSet,
    basename="milestone",
)
router.register(
    r"tasks",
    TaskViewSet,
    basename="task",
)
router.register(
    r"performance-metrics",
    PerformanceMetricViewSet,
    basename="performance-metric",
)
router.register(
    r"drive-links",
    DriveLinkViewSet,
    basename="drive-link",
)
router.register(
    r"meetings",
    ProjectMeetingViewSet,
    basename="meetings",
)


urlpatterns = [
    # Autenticación y estado
    path(
        'auth/login/',
        login_view,
        name='api_login',
    ),
    path(
        'auth/logout/',
        logout_view,
        name='api_logout',
    ),
    path(
        'auth/change-password/',
        change_password_view,
        name='api_change_password',
    ),
    path(
        'auth/profile/',
        user_profile_view,
        name='api_user_profile',
    ),
    path(
        'auth/users-status/',
        users_status_view,
        name='api_users_status',
    ),
    path(
        'auth/audit-logs/',
        audit_logs_view,
        name='api_audit_logs',
    ),
    path(
        'notifications/',
        notifications_view,
        name='api_notifications',
    ),

    # Recuperación de contraseña por OTP de 6 dígitos
    path(
        'auth/password-reset/request/',
        PasswordResetRequestView.as_view(),
        name='password_reset_request',
    ),
    path(
        'auth/password-reset/verify-code/',
        PasswordResetVerifyCodeView.as_view(),
        name='password_reset_verify_code',
    ),
    path(
        'auth/password-reset/confirm/',
        PasswordResetConfirmView.as_view(),
        name='password_reset_confirm',
    ),

    # Historial, exportación, descarga y restauración
    path(
        'backups/',
        include('core.urls_backups'),
    ),

    # Google Drive
    path(
        'integrations/google-drive/status/',
        google_drive_status_view,
        name='drive_status',
    ),
    path(
        'integrations/google-drive/connect/',
        google_drive_connect_view,
        name='drive_connect',
    ),
    path(
        'integrations/google-drive/callback/',
        google_drive_callback_view,
        name='drive_callback',
    ),
    path(
        'integrations/google-drive/files/',
        google_drive_files_view,
        name='drive_files',
    ),
    path(
        'integrations/google-drive/folders/',
        google_drive_create_folder_view,
        name='drive_create_folder',
    ),
    path(
        'integrations/google-drive/upload/',
        google_drive_upload_view,
        name='drive_upload',
    ),
    path(
        'integrations/google-drive/files/<str:file_id>/',
        google_drive_file_detail_view,
        name='drive_file_detail',
    ),

    # Verificación de base de datos
    path(
        'test-db/',
        test_db_connection,
        name='test_db_connection',
    ),

    # Make
    path(
        'integrations/make/status/',
        make_status_view,
        name='make_status',
    ),
    path(
        'integrations/make/test/',
        test_make_connection_view,
        name='make_test_connection',
    ),
    path(
        'integrations/make/trigger/',
        trigger_make_event_view,
        name='make_trigger_event',
    ),
    path(
        'integrations/make/webhook/',
        make_incoming_webhook_view,
        name='make_incoming_webhook',
    ),

    # Autodesk Platform Services — BIM
    path(
        'integrations/aps/status/',
        APSStatusView.as_view(),
        name='aps_status',
    ),
    path(
        'integrations/aps/models/',
        BIMModelListView.as_view(),
        name='aps_models',
    ),
    path(
        'integrations/aps/models/<int:pk>/',
        BIMModelDetailView.as_view(),
        name='aps_model_detail',
    ),
    path(
        'integrations/aps/models/<int:pk>/download/',
        APSDownloadView.as_view(),
        name='aps_model_download',
    ),
    path(
        'integrations/aps/upload/',
        APSUploadView.as_view(),
        name='aps_upload',
    ),
    path(
        'integrations/aps/token/',
        APSTokenView.as_view(),
        name='aps_token',
    ),

    # Alta del técnico y su cuenta
    path(
        'technicians/create/',
        CreateTechnicianView.as_view(),
        name='create-technician',
    ),

    # Rutas generadas por el router
    path("", include(router.urls)),
]