import datetime
from datetime import date, timedelta

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient

from core.models import (
    Milestone,
    Project,
    ProjectChangeLog,
    Task,
    TechnicalArea,
)
from core.services.project_audit_service import (
    analyze_periodic_project_audit,
)

User = get_user_model()


class PeriodicAuditServiceCalculationTests(TestCase):
    """Pruebas para los cálculos matemáticos y fechas de la auditoría periódica."""

    def test_period_calculation_monthly(self):
        ref_date = date(2026, 6, 15)
        result = analyze_periodic_project_audit(period='monthly', reference_date=ref_date)
        self.assertEqual(result['period'], 'monthly')
        self.assertEqual(result['period_days'], 30)
        self.assertEqual(result['reference_date'], '2026-06-15')
        self.assertEqual(result['cutoff_date'], '2026-05-16')

    def test_period_calculation_quarterly(self):
        ref_date = date(2026, 6, 15)
        result = analyze_periodic_project_audit(period='quarterly', reference_date=ref_date)
        self.assertEqual(result['period'], 'quarterly')
        self.assertEqual(result['period_days'], 90)
        self.assertEqual(result['reference_date'], '2026-06-15')
        self.assertEqual(result['cutoff_date'], '2026-03-17')

    def test_period_calculation_semiannual(self):
        ref_date = date(2026, 6, 15)
        result = analyze_periodic_project_audit(period='semiannual', reference_date=ref_date)
        self.assertEqual(result['period'], 'semiannual')
        self.assertEqual(result['period_days'], 180)
        self.assertEqual(result['reference_date'], '2026-06-15')
        self.assertEqual(result['cutoff_date'], '2025-12-17')

    def test_invalid_period_fallback_to_monthly(self):
        ref_date = date(2026, 6, 15)
        result = analyze_periodic_project_audit(period='invalid_period', reference_date=ref_date)
        self.assertEqual(result['period'], 'monthly')
        self.assertEqual(result['period_days'], 30)
        self.assertEqual(result['cutoff_date'], '2026-05-16')


class PeriodicAuditClassificationTests(TestCase):
    """Pruebas de clasificación de salud (CRITICAL, STALE, WARNING, HEALTHY)."""

    def setUp(self):
        self.area = TechnicalArea.objects.create(name="Ingeniería y Construcción")

    def test_classification_critical_overdue_critical_task(self):
        ref_date = date(2026, 6, 15)
        project = Project.objects.create(
            code="PRJ-CRIT-01",
            name="Planta de Tratamiento",
            start_date=date(2026, 1, 1),
            end_date=date(2026, 12, 31),
            status="IN_PROGRESS",
            budget=150000.00,
        )
        # Tarea en ruta crítica con fecha fin anterior a ref_date y no finalizada
        task = Task.objects.create(
            project=project,
            category=self.area,
            title="Cimentación Estructural",
            start_date=date(2026, 1, 10),
            end_date=date(2026, 5, 20),  # Vencida respecto a ref_date (15 de junio)
            is_critical_path=True,
            status="IN_PROGRESS",
            progress=40,
        )
        # Asegurar actividad reciente para no ser considerado STALE
        ProjectChangeLog.objects.create(
            project=project,
            description="Revisión técnica de cimentación",
            user_name="Ing. Supervisor",
            date=date(2026, 6, 1),
        )

        result = analyze_periodic_project_audit(period='monthly', reference_date=ref_date)
        project_report = next(p for p in result['projects'] if p['id'] == project.id)

        self.assertEqual(project_report['health'], 'CRITICAL')
        self.assertEqual(project_report['overdue_critical_count'], 1)
        self.assertTrue(any('ruta crítica vencida' in f for f in project_report['findings']))
        self.assertGreaterEqual(result['summary']['critical'], 1)

    def test_classification_critical_overdue_milestone(self):
        ref_date = date(2026, 6, 15)
        project = Project.objects.create(
            code="PRJ-CRIT-02",
            name="Puente Metálico",
            start_date=date(2026, 1, 1),
            end_date=date(2026, 12, 31),
            status="IN_PROGRESS",
        )
        Milestone.objects.create(
            project=project,
            name="Aprobación de Planos de Taller",
            target_date=date(2026, 5, 1),  # Vencido
            status="DELAYED",
        )
        ProjectChangeLog.objects.create(
            project=project,
            description="Revisión de hito",
            date=date(2026, 6, 1),
        )

        result = analyze_periodic_project_audit(period='monthly', reference_date=ref_date)
        project_report = next(p for p in result['projects'] if p['id'] == project.id)

        self.assertEqual(project_report['health'], 'CRITICAL')
        self.assertEqual(project_report['overdue_milestones_count'], 1)

    def test_classification_stale_inactivity(self):
        ref_date = date(2026, 6, 15)
        # Proyecto en ejecución pero sin logs ni tareas actualizadas en los últimos 30 días
        project = Project.objects.create(
            code="PRJ-STALE-01",
            name="Proyecto Desatendido",
            start_date=date(2026, 1, 1),
            end_date=date(2026, 12, 31),
            status="IN_PROGRESS",
        )
        # Sin logs ni tareas
        ProjectChangeLog.objects.filter(project=project).delete()
        result = analyze_periodic_project_audit(period='monthly', reference_date=ref_date)
        project_report = next(p for p in result['projects'] if p['id'] == project.id)

        self.assertEqual(project_report['health'], 'STALE')
        self.assertIn("Sin actividad ni actualizaciones registradas en el período auditado.", project_report['findings'])
        self.assertGreaterEqual(result['summary']['stale'], 1)

    def test_terminal_status_not_marked_as_stale(self):
        ref_date = date(2026, 6, 15)
        completed_project = Project.objects.create(
            code="PRJ-DONE-01",
            name="Proyecto Culminado",
            start_date=date(2025, 1, 1),
            end_date=date(2025, 12, 31),
            status="COMPLETED",
        )
        cancelled_project = Project.objects.create(
            code="PRJ-CANC-01",
            name="Proyecto Cancelado",
            start_date=date(2025, 1, 1),
            end_date=date(2025, 12, 31),
            status="CANCELLED",
        )

        result = analyze_periodic_project_audit(period='monthly', reference_date=ref_date)
        done_rep = next(p for p in result['projects'] if p['id'] == completed_project.id)
        canc_rep = next(p for p in result['projects'] if p['id'] == cancelled_project.id)

        self.assertNotEqual(done_rep['health'], 'STALE')
        self.assertNotEqual(canc_rep['health'], 'STALE')

    def test_classification_warning_moderate_progress_gap(self):
        ref_date = date(2026, 6, 30)
        # Duración total: 100 días (1 de marzo a 9 de junio aprox: 100 días)
        # Del 1 de marzo al 30 de junio: 121 días -> expected 100%
        # Usemos fechas exactas:
        # start: 2026-01-01, end: 2026-12-31 (364 días)
        # A 2026-07-02 (día 182 de 364): expected ~50%
        start_d = date(2026, 1, 1)
        end_d = date(2026, 12, 31)
        ref_d = start_d + timedelta(days=182)  # expected_progress = 50%

        project = Project.objects.create(
            code="PRJ-WARN-01",
            name="Expansión de Red",
            start_date=start_d,
            end_date=end_d,
            status="IN_PROGRESS",
        )
        # Tarea no crítica con avance del 35% (gap = 50 - 35 = 15%, entre 10% y 25%)
        Task.objects.create(
            project=project,
            category=self.area,
            title="Instalación de Fibra",
            start_date=start_d,
            end_date=end_d,
            is_critical_path=False,
            status="IN_PROGRESS",
            progress=35,
        )
        ProjectChangeLog.objects.create(
            project=project,
            description="Avance semanal registrado",
            date=ref_d - timedelta(days=5),
        )

        result = analyze_periodic_project_audit(period='monthly', reference_date=ref_d)
        project_report = next(p for p in result['projects'] if p['id'] == project.id)

        self.assertEqual(project_report['health'], 'WARNING')
        self.assertTrue(any('Retraso moderado' in f for f in project_report['findings']))

    def test_classification_healthy_on_schedule(self):
        start_d = date(2026, 1, 1)
        end_d = date(2026, 12, 31)
        ref_d = start_d + timedelta(days=182)  # expected 50%

        project = Project.objects.create(
            code="PRJ-HLTH-01",
            name="Construcción Subestación",
            start_date=start_d,
            end_date=end_d,
            status="IN_PROGRESS",
        )
        Task.objects.create(
            project=project,
            category=self.area,
            title="Montaje Electromecánico",
            start_date=start_d,
            end_date=end_d,
            is_critical_path=True,
            status="IN_PROGRESS",
            progress=55,  # Real 55% vs Esperado 50% -> gap -5% (adelantado)
        )
        ProjectChangeLog.objects.create(
            project=project,
            description="Certificación mensual aprobada",
            date=ref_d - timedelta(days=2),
        )

        result = analyze_periodic_project_audit(period='monthly', reference_date=ref_d)
        project_report = next(p for p in result['projects'] if p['id'] == project.id)

        self.assertEqual(project_report['health'], 'HEALTHY')
        self.assertIn("Avance y plazos alineados con el cronograma previsto.", project_report['findings'])


class PeriodicAuditEndpointTests(TestCase):
    """Pruebas para el endpoint REST GET /api/projects/periodic-audit/."""

    def setUp(self):
        self.client = APIClient()
        self.area = TechnicalArea.objects.create(name="Sistemas y Datos")
        self.project = Project.objects.create(
            code="PRJ-API-01",
            name="Migración Cloud",
            start_date=date(2026, 1, 1),
            end_date=date(2026, 12, 31),
            status="IN_PROGRESS",
        )
        ProjectChangeLog.objects.create(
            project=self.project,
            description="Kick-off inicial",
            date=date.today(),
        )

    def test_endpoint_get_periodic_audit_default(self):
        response = self.client.get('/api/projects/periodic-audit/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.data

        self.assertEqual(data['period'], 'monthly')
        self.assertEqual(data['period_days'], 30)
        self.assertIn('reference_date', data)
        self.assertIn('cutoff_date', data)
        self.assertIn('summary', data)
        self.assertIn('projects', data)
        self.assertGreaterEqual(data['total_projects'], 1)

    def test_endpoint_get_periodic_audit_quarterly(self):
        response = self.client.get('/api/projects/periodic-audit/?period=quarterly')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['period'], 'quarterly')
        self.assertEqual(response.data['period_days'], 90)

    def test_endpoint_get_periodic_audit_semiannual(self):
        response = self.client.get('/api/projects/periodic-audit/?period=semiannual')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['period'], 'semiannual')
        self.assertEqual(response.data['period_days'], 180)


class ProjectStatusChangeAuditLogTests(TestCase):
    """Pruebas de actualización de estado y registro en ProjectChangeLog."""

    def setUp(self):
        self.client = APIClient()
        self.project = Project.objects.create(
            code="PRJ-STATUS-01",
            name="Modernización de Sede",
            start_date=date(2026, 1, 1),
            end_date=date(2026, 12, 31),
            status="PLANNING",
            budget=50000.00,
        )
        ProjectChangeLog.objects.filter(project=self.project).delete()

    def test_update_status_creates_changelog_with_reason(self):
        url = f"/api/projects/{self.project.id}/"
        payload = {
            "status": "STAND_BY",
            "status_change_reason": "Suspensión temporal por veda electoral",
            "userName": "Auditor Principal",
        }
        response = self.client.patch(url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        self.project.refresh_from_db()
        self.assertEqual(self.project.status, "STAND_BY")

        # Verificar que se creó el registro de cambio en ProjectChangeLog
        logs = ProjectChangeLog.objects.filter(project=self.project)
        self.assertEqual(logs.count(), 1)
        log = logs.first()
        self.assertIn("En Espera (Stand-by)", log.description)
        self.assertIn("Motivo: Suspensión temporal por veda electoral", log.description)
        self.assertEqual(log.user_name, "Auditor Principal")

    def test_update_status_camelcase_status_reason_supported(self):
        url = f"/api/projects/{self.project.id}/"
        payload = {
            "status": "RISK",
            "statusReason": "Desabastecimiento de acero estructural",
            "userName": "Coordinador BIM",
        }
        response = self.client.patch(url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        logs = ProjectChangeLog.objects.filter(project=self.project)
        self.assertEqual(logs.count(), 1)
        log = logs.first()
        self.assertIn("En Riesgo", log.description)
        self.assertIn("Motivo: Desabastecimiento de acero estructural", log.description)

    def test_update_without_status_change_does_not_create_status_log(self):
        url = f"/api/projects/{self.project.id}/"
        payload = {
            "name": "Modernización de Sede - Fase Actualizada",
        }
        response = self.client.patch(url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        logs = ProjectChangeLog.objects.filter(project=self.project, action_type='STATUS_CHANGE')
        self.assertEqual(logs.count(), 0)

    def test_status_reasons_included_in_periodic_audit(self):
        url = f"/api/projects/{self.project.id}/"
        self.client.patch(url, {
            "status": "STAND_BY",
            "status_change_reason": "Ajuste de presupuesto anual",
            "userName": "Director Financiero",
        }, format='json')

        report = analyze_periodic_project_audit(period='monthly')
        proj_data = next(p for p in report['projects'] if p['id'] == self.project.id)

        self.assertGreaterEqual(len(proj_data['status_reasons']), 1)
        reason_entry = proj_data['status_reasons'][0]
        self.assertIn("Ajuste de presupuesto anual", reason_entry['description'])
        self.assertEqual(reason_entry['user'], "Director Financiero")

    def test_leader_info_included_in_periodic_audit(self):
        from core.models import Role, TeamMember
        area = TechnicalArea.objects.first() or TechnicalArea.objects.create(name="General")
        leader_role = Role.objects.create(name="Gerente de Proyecto", can_manage_projects=True, technical_area=area)
        member = TeamMember.objects.create(
            first_name="Carlos",
            last_name="Mendoza",
            email="carlos.mendoza@constructora.com",
            role=leader_role,
            technical_area=area,
            project=self.project,
        )

        report = analyze_periodic_project_audit(period='monthly')
        proj_data = next(p for p in report['projects'] if p['id'] == self.project.id)

        self.assertEqual(proj_data['leader_id'], member.id)
        self.assertEqual(proj_data['leader_name'], "Carlos Mendoza")
        self.assertEqual(proj_data['leader_email'], "carlos.mendoza@constructora.com")
        self.assertEqual(proj_data['leaderEmail'], "carlos.mendoza@constructora.com")
