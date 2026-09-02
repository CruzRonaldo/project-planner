from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    test_db_connection,
    TechnicalAreaViewSet,
    TeamStatusViewSet,
    TeamMemberViewSet,
    ProjectViewSet,
    MilestoneViewSet,
    TaskViewSet,
    PerformanceMetricViewSet,
    DriveLinkViewSet,
)

# Creamos el enrutador REST
router = DefaultRouter()
router.register(r'technical-areas', TechnicalAreaViewSet, basename='technical-area')
router.register(r'team-statuses', TeamStatusViewSet, basename='team-status')
router.register(r'team-members', TeamMemberViewSet, basename='team-member')
router.register(r'projects', ProjectViewSet, basename='project')
router.register(r'milestones', MilestoneViewSet, basename='milestone')
router.register(r'tasks', TaskViewSet, basename='task')
router.register(r'performance-metrics', PerformanceMetricViewSet, basename='performance-metric')
router.register(r'drive-links', DriveLinkViewSet, basename='drive-link')

urlpatterns = [
    # Endpoint de verificación de base de datos
    path('test-db/', test_db_connection, name='test_db_connection'),

    # Endpoints REST generados automáticamente por el router
    path('', include(router.urls)),
]
