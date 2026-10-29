from unittest.mock import patch, MagicMock
from django.contrib.auth import get_user_model
from django.db import IntegrityError, transaction
from django.test import TestCase
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient, APITestCase

from core.models import (
    Milestone,
    PerformanceMetric,
    Project,
    Role,
    SecurityAuditLog,
    Task,
    TeamMember,
    TeamStatus,
    TechnicalArea,
)
from core.services.make_service import send_make_webhook, test_make_connection

User = get_user_model()


class CreateTechnicianViewTests(APITestCase):
    def setUp(self):
        self.url = reverse('create-technician')
        self.admin = User.objects.create_user(
            username='admin-pruebas',
            email='admin.pruebas@empresa.com',
            password='Admin-2026-Segura!',
            is_staff=True,
        )
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.admin.id}')
        self.payload = {
            'first_name': 'Sofía',
            'last_name': 'Torres',
            'email': 'sofia.torres@empresa.com',
            'password': 'Tecnico-2026-Segura!',
            'specialty': 'Arquitecta Principal / BIM',
            'area': 'architecture',
            'project': '',
            'status': 'active',
            'availability': 80,
            'allocation_percentage': 65,
        }

    def test_creates_login_user_and_team_member(self):
        response = self.client.post(self.url, self.payload, format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        user = User.objects.get(email=self.payload['email'])
        member = TeamMember.objects.select_related('technical_area', 'role', 'status').get(
            email=self.payload['email']
        )

        self.assertTrue(user.check_password(self.payload['password']))
        self.assertEqual(user.username, self.payload['email'])
        self.assertEqual(member.technical_area.name, 'Arquitectura')
        self.assertEqual(member.role.name, self.payload['specialty'])
        self.assertEqual(member.status.name, 'Active')
        self.assertEqual(member.availability, 80)
        self.assertEqual(member.allocation_percentage, 65)
        self.assertNotIn('password', response.data)
        self.assertEqual(response.data['member']['id'], member.id)
        self.assertEqual(response.data['member']['availability'], 80)
        self.assertEqual(response.data['member']['allocation_percentage'], 65)

        self.client.credentials()
        login_response = self.client.post(
            reverse('api_login'),
            {
                'email': self.payload['email'],
                'password': self.payload['password'],
                'role': 'user',
            },
            format='json',
        )
        self.assertEqual(login_response.status_code, status.HTTP_200_OK)
        self.assertEqual(login_response.data['user']['id'], user.id)

    def test_created_technician_remains_in_directory_after_reload(self):
        create_response = self.client.post(self.url, self.payload, format='json')
        self.assertEqual(create_response.status_code, status.HTTP_201_CREATED)

        reloaded_client = APIClient()
        directory_response = reloaded_client.get(reverse('team-member-list'))
        self.assertEqual(directory_response.status_code, status.HTTP_200_OK)
        directory = (
            directory_response.data.get('results', [])
            if isinstance(directory_response.data, dict)
            else directory_response.data
        )
        persisted = next(
            member for member in directory
            if member['id'] == create_response.data['member']['id']
        )

        self.assertEqual(persisted['email'], self.payload['email'])
        self.assertEqual(persisted['technical_area_name'], 'Arquitectura')
        self.assertEqual(persisted['status_name'], 'Active')
        self.assertEqual(persisted['availability'], 80)
        self.assertEqual(persisted['allocation_percentage'], 65)

    def test_rejects_duplicate_email_without_creating_extra_records(self):
        first_response = self.client.post(self.url, self.payload, format='json')
        second_response = self.client.post(self.url, self.payload, format='json')

        self.assertEqual(first_response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(second_response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(User.objects.filter(email=self.payload['email']).count(), 1)
        self.assertEqual(TeamMember.objects.filter(email=self.payload['email']).count(), 1)

    def test_rejects_weak_password_without_saving_partial_data(self):
        self.payload['password'] = '123'

        response = self.client.post(self.url, self.payload, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(User.objects.filter(email=self.payload['email']).exists())
        self.assertFalse(TeamMember.objects.filter(email=self.payload['email']).exists())

    def test_rejects_creation_without_admin_or_subadmin_permissions(self):
        self.client.credentials()

        response = self.client.post(self.url, self.payload, format='json')

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertFalse(User.objects.filter(email=self.payload['email']).exists())
        self.assertFalse(TeamMember.objects.filter(email=self.payload['email']).exists())


class TeamMemberHumanResourcesTests(APITestCase):
    def setUp(self):
        self.area = TechnicalArea.objects.create(name='Sistemas')
        self.role = Role.objects.create(
            name='Desarrollador Backend',
            technical_area=self.area,
        )
        self.team_status = TeamStatus.objects.create(
            name='Active',
            color_code='#10B981',
        )
        self.project = Project.objects.create(
            code='PRJ-2026-HR1',
            name='UnificaciÃ³n de Recursos Humanos',
            start_date='2026-01-01',
            end_date='2026-06-30',
        )
        self.member = TeamMember.objects.create(
            first_name='Laura',
            last_name='Castro',
            email='laura.castro@empresa.com',
            role=self.role,
            technical_area=self.area,
            status=self.team_status,
            project=self.project,
        )
        self.super_admin = User.objects.create_superuser(
            username='superadmin-rrhh',
            email='superadmin.rrhh@empresa.com',
            password='Admin-2026-Segura!',
        )
        self.sub_admin = User.objects.create_user(
            username='subadmin-rrhh',
            email='subadmin.rrhh@empresa.com',
            password='SubAdmin-2026-Segura!',
            is_staff=True,
        )
        self.regular_user = User.objects.create_user(
            username='usuario-rrhh',
            email='usuario.rrhh@empresa.com',
            password='Usuario-2026-Segura!',
        )
        self.list_url = reverse('team-member-list')
        self.detail_url = reverse('team-member-detail', args=[self.member.id])

    def authenticate_as(self, user):
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {user.id}')

    def test_defaults_and_public_read_expose_human_resources_percentages(self):
        self.assertEqual(self.member.availability, 100)
        self.assertEqual(self.member.allocation_percentage, 0)

        response = self.client.get(self.detail_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['availability'], 100)
        self.assertEqual(response.data['allocation_percentage'], 0)
        self.assertIn('updated_at', response.data)

    def test_admin_and_subadmin_can_update_percentages(self):
        for actor, availability, allocation in (
            (self.super_admin, 70, 30),
            (self.sub_admin, 55, 45),
        ):
            with self.subTest(actor=actor.username):
                self.authenticate_as(actor)
                response = self.client.patch(
                    self.detail_url,
                    {
                        'availability': availability,
                        'allocation_percentage': allocation,
                    },
                    format='json',
                )

                self.assertEqual(response.status_code, status.HTTP_200_OK)
                self.member.refresh_from_db()
                self.assertEqual(self.member.availability, availability)
                self.assertEqual(self.member.allocation_percentage, allocation)

    def test_regular_user_and_anonymous_cannot_update_team_member(self):
        self.authenticate_as(self.regular_user)
        response = self.client.patch(
            self.detail_url,
            {'availability': 25},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

        self.client.credentials()
        response = self.client.patch(
            self.detail_url,
            {'availability': 25},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

        self.member.refresh_from_db()
        self.assertEqual(self.member.availability, 100)

    def test_api_rejects_percentages_outside_zero_to_one_hundred(self):
        self.authenticate_as(self.sub_admin)
        response = self.client.patch(
            self.detail_url,
            {
                'availability': 101,
                'allocation_percentage': -1,
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('availability', response.data)
        self.assertIn('allocation_percentage', response.data)

    def test_database_constraints_reject_percentages_above_one_hundred(self):
        for field_name in ('availability', 'allocation_percentage'):
            with self.subTest(field=field_name):
                with self.assertRaises(IntegrityError):
                    with transaction.atomic():
                        TeamMember.objects.filter(pk=self.member.pk).update(
                            **{field_name: 101}
                        )


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

    def test_non_admin_cannot_delete_project_and_budget_is_protected(self):
        project = Project.objects.create(
            code="PRJ-2026-099",
            name="Proyecto Protegido",
            start_date="2026-01-01",
            end_date="2026-06-01",
            budget=500000.00,
        )
        non_admin_user = User.objects.create_user(
            username="tecnico_user",
            email="tecnico@empresa.com",
            password="Password123!",
            is_staff=False,
            is_superuser=False,
        )
        self.client.force_authenticate(user=non_admin_user)

        # 1. Intento de borrado por no-admin debe ser 403 Forbidden
        delete_response = self.client.delete(f"/api/projects/{project.id}/")
        self.assertEqual(delete_response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertTrue(Project.objects.filter(id=project.id).exists())

        # 2. Intento de alterar presupuesto por no-admin: se preserva el monto original
        patch_response = self.client.patch(
            f"/api/projects/{project.id}/",
            {"budget": 9999999.00, "name": "Nombre Modificado por Líder"},
            format="json",
        )
        self.assertEqual(patch_response.status_code, status.HTTP_200_OK)
        project.refresh_from_db()
        self.assertEqual(project.name, "Nombre Modificado por Líder")
        self.assertEqual(float(project.budget), 500000.00)


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


class MilestoneStrategicPlanningTests(TestCase):
    """Pruebas del Módulo de Planificación Estratégica e Hitos Globales (/api/milestones/)."""

    def setUp(self):
        self.client = APIClient()
        self.project = Project.objects.create(
            code="PRJ-2026-001",
            name="Torre Reforma",
            start_date="2026-01-01",
            end_date="2026-06-30",
            duration_months=6,
            budget=1500000.00,
        )
        self.other_project = Project.objects.create(
            code="PRJ-2026-002",
            name="Puente Industrial",
            start_date="2026-02-01",
            end_date="2026-08-31",
            duration_months=7,
            budget=85000.00,
        )

    def test_create_milestone_with_frontend_aliases(self):
        payload = {
            "projectId": self.project.id,
            "title": "Entrega Cimentación y Pilotes",
            "targetDate": "2026-03-15",
            "status": "pending",
            "description": "Entrega y validación de la cimentación principal.",
        }
        response = self.client.post("/api/milestones/", payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        data = response.json()
        self.assertEqual(data["title"], "Entrega Cimentación y Pilotes")
        self.assertEqual(data["name"], "Entrega Cimentación y Pilotes")
        self.assertEqual(data["projectId"], self.project.id)
        self.assertEqual(data["targetDate"], "2026-03-15")
        self.assertEqual(data["status"], "pending")
        self.assertEqual(data["status_backend"], "PENDING")

        milestone = Milestone.objects.get(id=data["id"])
        self.assertEqual(milestone.name, "Entrega Cimentación y Pilotes")
        self.assertEqual(milestone.status, "PENDING")

    def test_filter_milestones_by_project(self):
        Milestone.objects.create(
            project=self.project,
            name="Hito Proyecto 1",
            target_date="2026-03-15",
            status="PENDING",
        )
        Milestone.objects.create(
            project=self.other_project,
            name="Hito Proyecto 2",
            target_date="2026-05-30",
            status="IN_PROGRESS",
        )

        # Filtrar por project
        response = self.client.get(f"/api/milestones/?project={self.project.id}")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.json()
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]["title"], "Hito Proyecto 1")
        self.assertEqual(results[0]["project_code"], "PRJ-2026-001")

    def test_update_milestone_status(self):
        m = Milestone.objects.create(
            project=self.project,
            name="Hito Pendiente",
            target_date="2026-06-15",
            status="PENDING",
        )
        response = self.client.patch(
            f"/api/milestones/{m.id}/",
            {"status": "completed"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        m.refresh_from_db()
        self.assertEqual(m.status, "COMPLETED")

    def test_delete_milestone(self):
        m = Milestone.objects.create(
            project=self.project,
            name="Hito Temporal",
            target_date="2026-07-20",
            status="PENDING",
        )
        response = self.client.delete(f"/api/milestones/{m.id}/")
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Milestone.objects.filter(id=m.id).exists())


class ChangePasswordTests(APITestCase):
    def setUp(self):
        self.username = "sistemas"
        self.email = "sistemas@projectplanner.com"
        self.old_password = "User123*"
        self.user = User.objects.create_user(
            username=self.username,
            email=self.email,
            password=self.old_password,
            first_name="Luis",
            last_name="Gonzales",
        )
        self.url = "/api/auth/change-password/"

    def test_change_password_success(self):
        new_password = "NuevoPassword456*"
        payload = {
            "identifier": self.email,
            "current_password": self.old_password,
            "new_password": new_password,
            "confirm_password": new_password,
        }
        response = self.client.post(self.url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["status"], "success")

        # Verificar que el usuario en BD tiene la nueva contraseña
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password(new_password))
        self.assertFalse(self.user.check_password(self.old_password))

        # Verificar que login funciona con la nueva contraseña
        login_resp = self.client.post(
            "/api/auth/login/",
            {"email": self.email, "password": new_password, "role": "user"},
            format="json",
        )
        self.assertEqual(login_resp.status_code, status.HTTP_200_OK)
        self.assertEqual(login_resp.data["status"], "success")

        # Verificar que login falla con la contraseña anterior
        login_fail_resp = self.client.post(
            "/api/auth/login/",
            {"email": self.email, "password": self.old_password, "role": "user"},
            format="json",
        )
        self.assertEqual(login_fail_resp.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_change_password_invalid_current_password(self):
        payload = {
            "identifier": self.email,
            "current_password": "WrongPassword!",
            "new_password": "NuevoPassword456*",
            "confirm_password": "NuevoPassword456*",
        }
        response = self.client.post(self.url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("La contraseña actual no es correcta", response.data["message"])

        # La clave original se mantiene
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password(self.old_password))

    def test_change_password_identical_password(self):
        payload = {
            "identifier": self.email,
            "current_password": self.old_password,
            "new_password": self.old_password,
            "confirm_password": self.old_password,
        }
        response = self.client.post(self.url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("no puede ser idéntica", response.data["message"])

    def test_change_password_mismatched_confirmation(self):
        payload = {
            "identifier": self.email,
            "current_password": self.old_password,
            "new_password": "NuevoPassword456*",
            "confirm_password": "DifferentPassword789*",
        }
        response = self.client.post(self.url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("no coinciden", response.data["message"])

    def test_change_password_too_short(self):
        payload = {
            "identifier": self.email,
            "current_password": self.old_password,
            "new_password": "123",
            "confirm_password": "123",
        }
        response = self.client.post(self.url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("al menos 6 caracteres", response.data["message"])

    def test_change_password_user_not_found(self):
        payload = {
            "identifier": "nonexistent@user.com",
            "current_password": "AnyPassword123*",
            "new_password": "NuevoPassword456*",
            "confirm_password": "NuevoPassword456*",
        }
        response = self.client.post(self.url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


class UserProfileAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.username = "admin"
        self.email = "admin@gmail.com"
        self.password = "Admin123*"
        self.user = User.objects.create_superuser(
            username=self.username,
            email=self.email,
            password=self.password,
            first_name="Admin",
            last_name="Master",
        )
        self.profile_url = "/api/auth/profile/"

    def test_update_and_persist_profile_photo_and_phone(self):
        mock_photo = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
        payload = {
            "identifier": self.email,
            "photo": mock_photo,
            "phone": "+51 987 654 321",
            "name": "Administrador Principal",
        }
        response = self.client.patch(self.profile_url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["status"], "success")
        self.assertEqual(response.data["profile"]["photo"], mock_photo)
        self.assertEqual(response.data["profile"]["phone"], "+51 987 654 321")

        # Verificar que el login posterior devuelve la foto y teléfono de la base de datos
        login_resp = self.client.post(
            "/api/auth/login/",
            {"email": self.email, "password": self.password, "role": "admin"},
            format="json",
        )
        self.assertEqual(login_resp.status_code, status.HTTP_200_OK)
        self.assertEqual(login_resp.data["user"]["photo"], mock_photo)
        self.assertEqual(login_resp.data["user"]["phone"], "+51 987 654 321")

    def test_remove_profile_photo(self):
        # Primero guardar foto
        self.client.patch(self.profile_url, {"identifier": self.email, "photo": "data:image/png;base64,mock"}, format="json")
        # Luego remover foto
        remove_resp = self.client.patch(self.profile_url, {"identifier": self.email, "photo": None}, format="json")
        self.assertEqual(remove_resp.status_code, status.HTTP_200_OK)
        self.assertIsNone(remove_resp.data["profile"]["photo"])

    def test_update_email_success_and_creates_audit_log(self):
        new_email = "nuevo.admin@gmail.com"
        payload = {
            "identifier": self.email,
            "email": new_email,
            "name": "Administrador Renovado",
        }
        response = self.client.patch(self.profile_url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["status"], "success")
        self.assertEqual(response.data["profile"]["email"], new_email)

        # Verificar actualización en Base de Datos
        self.user.refresh_from_db()
        self.assertEqual(self.user.email, new_email)

        # Verificar registro en Bitácora de Auditoría
        audit_log = SecurityAuditLog.objects.filter(user=self.user, action="email_change").first()
        self.assertIsNotNone(audit_log)
        self.assertEqual(audit_log.old_value, self.email)
        self.assertEqual(audit_log.new_value, new_email)

        # Verificar que endpoint de auditoría retorna el registro
        audit_resp = self.client.get("/api/auth/audit-logs/")
        self.assertEqual(audit_resp.status_code, status.HTTP_200_OK)
        self.assertTrue(any(log["newValue"] == new_email for log in audit_resp.data["logs"]))

    def test_update_email_rejects_invalid_format(self):
        payload = {
            "identifier": self.email,
            "email": "correo-invalido-sin-arroba",
        }
        response = self.client.patch(self.profile_url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("no es válido", response.data["message"])

    def test_update_email_rejects_duplicate(self):
        other_email = "otro.usuario@gmail.com"
        User.objects.create_user(username="otro", email=other_email, password="Password123*")

        payload = {
            "identifier": self.email,
            "email": other_email,
        }
        response = self.client.patch(self.profile_url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("ya está registrado", response.data["message"])


class BackupAuthenticationAndSecurityTests(TestCase):
    """Pruebas de seguridad y autenticación para la gestión de respaldos."""

    def setUp(self):
        self.client = APIClient()
        self.admin_user = User.objects.create_superuser(
            username="admin_activo",
            email="admin.activo@empresa.com",
            password="SecureAdminPass123!",
            is_staff=True,
            is_superuser=True,
        )
        self.other_admin = User.objects.create_superuser(
            username="otro_admin",
            email="otro.admin@empresa.com",
            password="OtherSecurePass123!",
            is_staff=True,
            is_superuser=True,
        )
        self.regular_user = User.objects.create_user(
            username="usuario_comun",
            email="comun@empresa.com",
            password="RegularPass123!",
            is_staff=False,
            is_superuser=False,
        )
        self.url = "/api/backups/"

    def _basic_auth(self, username, password):
        import base64
        token = base64.b64encode(f"{username}:{password}".encode()).decode("utf-8")
        return f"Basic {token}"

    def test_accepts_username_of_active_admin(self):
        auth_header = self._basic_auth("admin_activo", "SecureAdminPass123!")
        response = self.client.get(
            self.url,
            HTTP_AUTHORIZATION=auth_header,
            HTTP_X_CURRENT_USER="admin_activo",
            secure=True,
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("database", response.data)
        self.assertIn("backups", response.data)

    def test_accepts_email_of_active_admin(self):
        auth_header = self._basic_auth("admin.activo@empresa.com", "SecureAdminPass123!")
        response = self.client.get(
            self.url,
            HTTP_AUTHORIZATION=auth_header,
            HTTP_X_CURRENT_USER="admin.activo@empresa.com",
            secure=True,
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_rejects_credentials_of_different_admin(self):
        # Sesión activa es 'admin_activo', pero se envían credenciales de 'otro_admin'
        # Mitigación OWASP: responde 401 Credenciales incorrectas sin delatar si la clave era válida
        auth_header = self._basic_auth("otro_admin", "OtherSecurePass123!")
        response = self.client.get(
            self.url,
            HTTP_AUTHORIZATION=auth_header,
            HTTP_X_CURRENT_USER="admin_activo",
            secure=True,
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertIn("Credenciales incorrectas", str(response.data))

    def test_rejects_regular_non_admin_user(self):
        auth_header = self._basic_auth("usuario_comun", "RegularPass123!")
        response = self.client.get(
            self.url,
            HTTP_AUTHORIZATION=auth_header,
            HTTP_X_CURRENT_USER="usuario_comun",
            secure=True,
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_rejects_invalid_password(self):
        auth_header = self._basic_auth("admin_activo", "ClaveIncorrecta!")
        response = self.client.get(
            self.url,
            HTTP_AUTHORIZATION=auth_header,
            HTTP_X_CURRENT_USER="admin_activo",
            secure=True,
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)




