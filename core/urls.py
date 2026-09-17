from django.urls import include, path
from rest_framework.routers import DefaultRouter

from . import views
from .views_make import (
    make_incoming_webhook_view,
    make_status_view,
    test_make_connection_view,
    trigger_make_event_view,
)


router = DefaultRouter()
router.register(
    r"technical-areas",
    views.TechnicalAreaViewSet,
    basename="technical-area",
)
router.register(r"roles", views.RoleViewSet, basename="role")
router.register(
    r"team-statuses",
    views.TeamStatusViewSet,
    basename="team-status",
)
router.register(
    r"team-members",
    views.TeamMemberViewSet,
    basename="team-member",
)
router.register(r"projects", views.ProjectViewSet, basename="project")
router.register(r"milestones", views.MilestoneViewSet, basename="milestone")
router.register(r"tasks", views.TaskViewSet, basename="task")
router.register(
    r"performance-metrics",
    views.PerformanceMetricViewSet,
    basename="performance-metric",
)
router.register(
    r"drive-links",
    views.DriveLinkViewSet,
    basename="drive-link",
)


urlpatterns = [
    path("auth/login/", views.login_view, name="api_login"),
    path("test-db/", views.test_db_connection, name="test_db_connection"),

    # -------------------------------------------------------
    # Google Drive — Autorización OAuth 2.0
    # -------------------------------------------------------
    path(
        "integrations/google-drive/connect/",
        views.google_drive_connect_view,
        name="google_drive_connect",
    ),
    path(
        "integrations/google-drive/callback/",
        views.google_drive_callback_view,
        name="google_drive_callback",
    ),
    path(
        "integrations/google-drive/status/",
        views.google_drive_status_view,
        name="google_drive_status",
    ),

    # Google Drive — CRUD de archivos y carpetas
    path(
        "integrations/google-drive/files/",
        views.google_drive_files_view,
        name="google_drive_files",
    ),
    path(
        "integrations/google-drive/folders/",
        views.google_drive_create_folder_view,
        name="google_drive_create_folder",
    ),
    path(
        "integrations/google-drive/upload/",
        views.google_drive_upload_view,
        name="google_drive_upload",
    ),
    path(
        "integrations/google-drive/files/<str:file_id>/",
        views.google_drive_file_detail_view,
        name="google_drive_file_detail",
    ),

    # -------------------------------------------------------
    # Make (Integromat) — Webhooks salientes y entrantes
    # -------------------------------------------------------
    path("integrations/make/status/", make_status_view, name="make_status"),
    path("integrations/make/test/", test_make_connection_view, name="make_test_connection"),
    path("integrations/make/trigger/", trigger_make_event_view, name="make_trigger_event"),
    path("integrations/make/webhook/", make_incoming_webhook_view, name="make_incoming_webhook"),

    # -------------------------------------------------------
    # Autodesk Revit / BIM Data
    # -------------------------------------------------------
    path("integrations/revit/models/", views.revit_models_view, name="revit_models"),

    # -------------------------------------------------------
    # Endpoints REST generados automáticamente por el router
    # -------------------------------------------------------
    path("", include(router.urls)),
]
