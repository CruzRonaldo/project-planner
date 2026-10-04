from unittest.mock import patch, MagicMock
from django.contrib.auth import get_user_model
from django.test import TestCase
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient

from core.models import (
    Milestone,
    PerformanceMetric,
    Project,
    Role,
    Task,
    TeamMember,
    TeamStatus,
    TechnicalArea,
)
from core.services.make_service import send_make_webhook, test_make_connection

User = get_user_model()


class ProjectModelAndWorkflowTests(TestCase):
    """Pruebas unitarias para el modelo Project y el flujo de creación con líderes y webhooks."""

    def setUp(self):
        self.client = APIClient()
        self.area = TechnicalArea.objects.create(name="Estructuras", description="Cálculo estructural y BIM")
        self.role = Role.objects.create(name="Ingeniero Estructural", technical_area=self.area)
        self.status_active = TeamStatus.objects.create(name="Active", color_code="#10B981")
        self.leader = TeamMember.objects.create(
            first_name="Carlos",
            last_name="Mendoza",
            email="carlos.mendoza@polyline.com",
            technical_area=self.area,
            role=self.role,
            status=self.status_active,
        )

    def test_project_str_representation(self):
        project = Project.objects.create(
            code="PRJ-2026-001",
            name="Torre Reforma Corporativa",
            start_date="2026-01-15",
            end_date="2026-10-15",
            duration_months=9,
            budget=1500000.00,
        )
        self.assertEqual(str(project), "[PRJ-2026-001] Torre Reforma Corporativa")
        self.assertEqual(project.status, "PLANNING")

    @patch("core.services.make_service.send_make_webhook")
    def test_create_project_assigns_leader_and_dispatches_webhook(self, mock_make_webhook):
        mock_make_webhook.return_value = {"success": True, "status_code": 200, "message": "OK"}

        payload = {
            "code": "PRJ-2026-002",
            "name": "Puente Industrial San Pedro",
            "description": "Puente de concreto postensado",
            "start_date": "2026-02-01",
            "end_date": "2026-08-01",
            "duration_months": 6,
            "budget": "850000.00",
            "status": "PLANNING",
            "leaderId": self.leader.id,
        }

        response = self.client.post("/api/projects/", payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # Verificar que el proyecto fue creado en la base de datos
        created_project = Project.objects.get(code="PRJ-2026-002")
        self.assertEqual(created_project.name, "Puente Industrial San Pedro")

        # Verificar que se asignó el líder relacionalmente
        self.leader.refresh_from_db()
        self.assertEqual(self.leader.project_id, created_project.id)

        # Verificar que se despachó el webhook con el evento 'project.created'
        mock_make_webhook.assert_called_once()
        call_kwargs = mock_make_webhook.call_args[1]
        self.assertEqual(call_kwargs.get("event"), "project.created")
        self.assertEqual(call_kwargs.get("data", {}).get("code"), "PRJ-2026-002")


class ProjectTimelineOptimizationTests(TestCase):
    """Pruebas del Motor de Tiempos y Optimización (Ruta Crítica, Divisor y Holgura 7d)."""

    def setUp(self):
        self.client = APIClient()
        self.area = TechnicalArea.objects.create(name="Arquitectura")
        self.project = Project.objects.create(
            code="PRJ-2026-010",
            name="Complejo Residencial Altavista",
            start_date="2026-01-01",
            end_date="2026-10-31",
            duration_months=10,
            budget=2000000.00,
        )

    def test_optimize_timeline_with_tasks_and_performance_metrics(self):
        # Crear tarea en ruta crítica con duración de 30 días y tolerancia de 7 días
        task = Task.objects.create(
            project=self.project,
            category=self.area,
            title="Encofrado de Muros y Placas",
            start_date="2026-01-01",
            end_date="2026-01-30",
            duration_days=30,
            is_critical_path=True,
            tolerance_days=7,
        )

        # Rendimiento con factor divisor = 5 (espera reducción de 30 / 5 = 6 días => 24 días)
        PerformanceMetric.objects.create(
            project=self.project,
            task=task,
            unit="M2",
            quantity=1200.00,
            rate_per_day=40.00,
            divisor=5,
        )

        response = self.client.get(f"/api/projects/{self.project.id}/optimize/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        data = response.json()
        self.assertEqual(data["project_id"], self.project.id)
        self.assertEqual(data["tolerance_applied_days"], 7)
        self.assertIn("optimized_tasks", data)

        task_opt = data["optimized_tasks"][0]
        self.assertEqual(task_opt["original_duration_days"], 30)
        self.assertEqual(task_opt["optimized_duration_days"], 24)
        self.assertEqual(task_opt["days_saved"], 6)
        self.assertTrue(task_opt["is_critical_path"])
        self.assertEqual(task_opt["tolerance_days"], 7)

    def test_optimize_timeline_fallback_without_tasks(self):
        # Proyecto sin tareas hijas debe calcular reducción estimada
        response = self.client.get(f"/api/projects/{self.project.id}/optimize/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertEqual(data["original_duration_months"], 10)
        self.assertLessEqual(data["optimized_duration_months"], 10)


class DatabaseAndAuthEndpointsTests(TestCase):
    """Pruebas de endpoints transversales: diagnóstico de base de datos y autenticación."""

    def setUp(self):
        self.client = APIClient()
        self.username = "carlos_pm"
        self.password = "SecurePass123!"
        self.user = User.objects.create_user(
            username=self.username,
            email="carlos@polyline.com",
            password=self.password,
            first_name="Carlos",
            last_name="Mendoza",
            is_staff=True,
            is_superuser=True,
        )

    def test_database_connection_diagnostic_endpoint(self):
        response = self.client.get("/api/test-db/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertTrue(data.get("connected"))
        self.assertEqual(data.get("status"), "success")
        self.assertIn("database", data)
        self.assertIn("engine", data["database"])

    def test_login_success_and_last_login_updated(self):
        response = self.client.post(
            "/api/auth/login/",
            {"username": self.username, "password": self.password, "role": "admin"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertEqual(data["status"], "success")
        self.assertEqual(data["user"]["role"], "admin")

        self.user.refresh_from_db()
        self.assertIsNotNone(self.user.last_login)

    def test_login_invalid_credentials_rejected(self):
        response = self.client.post(
            "/api/auth/login/",
            {"username": self.username, "password": "WrongPassword!", "role": "admin"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_users_status_list(self):
        response = self.client.get("/api/auth/users-status/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertIsInstance(data, list)
        self.assertGreaterEqual(len(data), 1)
        self.assertEqual(data[0]["username"], self.username)


class MakeServiceUnitTests(TestCase):
    """Pruebas de la capa de servicio de webhooks hacia Make (Integromat)."""

    @patch("core.services.make_service.get_configured_make_webhook_url", return_value="")
    def test_send_make_webhook_without_url_fails_gracefully(self, mock_get_url):
        result = send_make_webhook(event="test.event", data={}, webhook_url="")
        self.assertFalse(result["success"])
        self.assertEqual(result["error"], "MISSING_WEBHOOK_URL")

    @patch("urllib.request.urlopen")
    def test_send_make_webhook_success_with_url(self, mock_urlopen):
        mock_response = MagicMock()
        mock_response.getcode.return_value = 200
        mock_response.read.return_value = b'{"status": "accepted"}'
        mock_urlopen.return_value.__enter__.return_value = mock_response

        result = send_make_webhook(
            event="system.ping",
            data={"action": "test"},
            webhook_url="https://hook.eu2.make.com/mock_webhook",
        )
        self.assertTrue(result["success"])
        self.assertEqual(result["status_code"], 200)
