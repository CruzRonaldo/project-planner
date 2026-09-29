from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    DriveLinkViewSet,
    MilestoneViewSet,
    PerformanceMetricViewSet,
    ProjectViewSet,
    RoleViewSet,
    TaskViewSet,
    TeamMemberViewSet,
    TeamStatusViewSet,
    TechnicalAreaViewSet,
    google_drive_callback_view,
    google_drive_connect_view,
    google_drive_status_view,
    login_view,
    test_db_connection,
)


# Enrutador de los CRUD REST
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


urlpatterns = [
    # Autenticación
    path(
        "auth/login/",
        login_view,
        name="api_login",
    ),

    # Prueba de MySQL
    path(
        "test-db/",
        test_db_connection,
        name="test_db_connection",
    ),

    # Google Drive OAuth
    path(
        "integrations/google-drive/connect/",
        google_drive_connect_view,
        name="google_drive_connect",
    ),

    path(
        "integrations/google-drive/callback/",
        google_drive_callback_view,
        name="google_drive_callback",
    ),

    path(
        "integrations/google-drive/status/",
        google_drive_status_view,
        name="google_drive_status",
    ),

    # CRUD del router
    path(
        "",
        include(router.urls),
    ),
]