from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    test_db_connection,
    login_view,
    TechnicalAreaViewSet,
    RoleViewSet,
    TeamStatusViewSet,
    TeamMemberViewSet,
    ProjectViewSet,
    MilestoneViewSet,
    TaskViewSet,
    PerformanceMetricViewSet,
    DriveLinkViewSet,
)
from .views_make import (
    make_status_view,
    test_make_connection_view,
    trigger_make_event_view,
    make_incoming_webhook_view,
)


# Creamos el enrutador REST
router = DefaultRouter()
router.register(r'technical-areas', TechnicalAreaViewSet, basename='technical-area')
router.register(r'roles', RoleViewSet, basename='role')
router.register(r'team-statuses', TeamStatusViewSet, basename='team-status')
router.register(r'team-members', TeamMemberViewSet, basename='team-member')
router.register(r'projects', ProjectViewSet, basename='project')
router.register(r'milestones', MilestoneViewSet, basename='milestone')
router.register(r'tasks', TaskViewSet, basename='task')
router.register(r'performance-metrics', PerformanceMetricViewSet, basename='performance-metric')
router.register(r'drive-links', DriveLinkViewSet, basename='drive-link')

urlpatterns = [
    # Endpoint de autenticación (Login)
    path('auth/login/', login_view, name='api_login'),

    # Endpoint de verificación de base de datos
    path('test-db/', test_db_connection, name='test_db_connection'),

    # Endpoints de integración con Make (Integromat)
    path('integrations/make/status/', make_status_view, name='make_status'),
    path('integrations/make/test/', test_make_connection_view, name='make_test_connection'),
    path('integrations/make/trigger/', trigger_make_event_view, name='make_trigger_event'),
    path('integrations/make/webhook/', make_incoming_webhook_view, name='make_incoming_webhook'),

    # Endpoints REST generados automáticamente por el router
    path('', include(router.urls)),
]

