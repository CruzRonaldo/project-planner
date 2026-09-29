from django.urls import include, path
from rest_framework.routers import DefaultRouter
from .views import (
    test_db_connection,
    login_view,
    logout_view,
    users_status_view,
    notifications_view,
    TechnicalAreaViewSet,
    RoleViewSet,
    TeamStatusViewSet,
    TeamMemberViewSet,
    ProjectViewSet,
    MilestoneViewSet,
    TaskViewSet,
    PerformanceMetricViewSet,
    DriveLinkViewSet,
    # Vistas de Google Drive
    google_drive_connect_view,
    google_drive_callback_view,
    google_drive_status_view,
    google_drive_files_view,
    google_drive_create_folder_view,
    google_drive_upload_view,
    google_drive_file_detail_view,
    # Nuevas vistas de la Bóveda BIM APS
    APSStatusView,
    BIMModelListView,
    BIMModelDetailView,
    APSUploadView,
    APSTokenView,
)
from .views_make import (
    make_incoming_webhook_view,
    make_status_view,
    test_make_connection_view,
    trigger_make_event_view,
)

router = DefaultRouter()
# Registros corregidos (sin el prefijo 'views.')
router.register(r"technical-areas", TechnicalAreaViewSet, basename="technical-area")
router.register(r"roles", RoleViewSet, basename="role")
router.register(r"team-statuses", TeamStatusViewSet, basename="team-status")
router.register(r"team-members", TeamMemberViewSet, basename="team-member")
router.register(r"projects", ProjectViewSet, basename="project")
router.register(r"milestones", MilestoneViewSet, basename="milestone")
router.register(r"tasks", TaskViewSet, basename="task")
router.register(r"performance-metrics", PerformanceMetricViewSet, basename="performance-metric")
router.register(r"drive-links", DriveLinkViewSet, basename="drive-link")


urlpatterns = [
    # Endpoints de autenticación y estado
    path('auth/login/', login_view, name='api_login'),
    path('auth/logout/', logout_view, name='api_logout'),
    path('auth/users-status/', users_status_view, name='api_users_status'),
    path('notifications/', notifications_view, name='api_notifications'),

    # Integración con Google Drive
    path('integrations/google-drive/status/', google_drive_status_view, name='drive_status'),
    path('integrations/google-drive/connect/', google_drive_connect_view, name='drive_connect'),
    path('integrations/google-drive/callback/', google_drive_callback_view, name='drive_callback'),
    path('integrations/google-drive/files/', google_drive_files_view, name='drive_files'),
    path('integrations/google-drive/folders/', google_drive_create_folder_view, name='drive_create_folder'),
    path('integrations/google-drive/upload/', google_drive_upload_view, name='drive_upload'),
    path('integrations/google-drive/files/<str:file_id>/', google_drive_file_detail_view, name='drive_file_detail'),

    # Endpoint de verificación de base de datos
    path('test-db/', test_db_connection, name='test_db_connection'),

    # Endpoints de integración con Make (Integromat)
    path('integrations/make/status/', make_status_view, name='make_status'),
    path('integrations/make/test/', test_make_connection_view, name='make_test_connection'),
    path('integrations/make/trigger/', trigger_make_event_view, name='make_trigger_event'),
    path('integrations/make/webhook/', make_incoming_webhook_view, name='make_incoming_webhook'),

    # -------------------------------------------------------
    # Autodesk Platform Services (APS) — Bóveda BIM Colaborativa
    # -------------------------------------------------------
    path('integrations/aps/status/', APSStatusView.as_view(), name='aps_status'),
    path('integrations/aps/models/', BIMModelListView.as_view(), name='aps_models'),
    path('integrations/aps/models/<int:pk>/', BIMModelDetailView.as_view(), name='aps_model_detail'),
    path('integrations/aps/upload/', APSUploadView.as_view(), name='aps_upload'),
    path('integrations/aps/token/', APSTokenView.as_view(), name='aps_token'),

    # -------------------------------------------------------
    # Endpoints REST generados automáticamente por el router
    # -------------------------------------------------------
    path("", include(router.urls)),
]

 