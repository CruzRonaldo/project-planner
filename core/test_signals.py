import datetime
from decimal import Decimal
from django.test import TestCase
from rest_framework.test import APIClient
from django.contrib.auth.models import User
from core.models import Project, ProjectChangeLog


class ProjectSignalsAuditTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='auditor',
            password='Password123!',
            first_name='Carlos',
            last_name='Mendoza',
            is_staff=True
        )

    def test_project_creation_signal_creates_changelog(self):
        project = Project(
            code='PRJ-TEST-001',
            name='Proyecto Test Inicial',
            start_date=datetime.date(2026, 1, 1),
            end_date=datetime.date(2026, 6, 1),
            duration_months=5,
            budget=Decimal('50000.00'),
            status='PLANNING'
        )
        project._actor_name = 'Supervisor Juan'
        project.save()

        logs = ProjectChangeLog.objects.filter(project=project)
        self.assertEqual(logs.count(), 1)
        log = logs.first()
        self.assertIn("Alta del proyecto 'Proyecto Test Inicial'", log.description)
        self.assertIn("PRJ-TEST-001", log.description)
        self.assertEqual(log.user_name, 'Supervisor Juan')
        self.assertEqual(log.date, datetime.date.today())

    def test_project_update_signals_tracks_deltas(self):
        project = Project.objects.create(
            code='PRJ-TEST-002',
            name='Proyecto Original',
            start_date=datetime.date(2026, 1, 1),
            end_date=datetime.date(2026, 6, 1),
            duration_months=5,
            budget=Decimal('10000.00'),
            status='PLANNING'
        )
        # Clear creation log
        ProjectChangeLog.objects.filter(project=project).delete()

        # Update budget, status, dates, and name
        project._actor_name = 'PM Laura'
        project.name = 'Proyecto Modificado'
        project.budget = Decimal('25000.00')
        project.status = 'IN_PROGRESS'
        project.start_date = datetime.date(2026, 2, 1)
        project.end_date = datetime.date(2026, 8, 1)
        project.save()

        logs = ProjectChangeLog.objects.filter(project=project).order_by('id')
        descriptions = [log.description for log in logs]

        self.assertTrue(any('Presupuesto ajustado de $10,000.00 a $25,000.00' in d for d in descriptions))
        self.assertTrue(any('Estado cambiado' in d for d in descriptions))
        self.assertTrue(any('Cronograma reprogramado' in d for d in descriptions))
        self.assertTrue(any("Nombre actualizado de 'Proyecto Original' a 'Proyecto Modificado'" in d for d in descriptions))
        for log in logs:
            self.assertEqual(log.user_name, 'PM Laura')

    def test_project_viewset_integration_create_and_update(self):
        self.client.force_authenticate(user=self.user)
        # Test DRF create
        create_resp = self.client.post('/api/projects/', {
            'code': 'PRJ-TEST-003',
            'name': 'Proyecto API Test',
            'startDate': '2026-03-01',
            'endDate': '2026-09-01',
            'totalBudget': 80000.00,
            'status': 'planning',
        }, format='json')
        self.assertEqual(create_resp.status_code, 201)
        project_id = create_resp.data['id']

        logs = ProjectChangeLog.objects.filter(project_id=project_id)
        self.assertTrue(logs.exists())
        self.assertEqual(logs.first().user_name, 'Carlos Mendoza')

        # Test DRF patch / update
        update_resp = self.client.patch(f'/api/projects/{project_id}/', {
            'totalBudget': 95000.00,
        }, format='json')
        self.assertEqual(update_resp.status_code, 200)

        update_logs = ProjectChangeLog.objects.filter(
            project_id=project_id,
            description__contains='Presupuesto ajustado'
        )
        self.assertTrue(update_logs.exists())
        self.assertEqual(update_logs.first().user_name, 'Carlos Mendoza')

    def test_project_unauthenticated_with_custom_username(self):
        # Client not authenticated, but sending userName in payload
        create_resp = self.client.post('/api/projects/', {
            'code': 'PRJ-TEST-004',
            'name': 'Proyecto Anonimo',
            'startDate': '2026-04-01',
            'endDate': '2026-10-01',
            'totalBudget': 45000.00,
            'status': 'planning',
            'userName': 'Operador Campo',
        }, format='json')
        self.assertEqual(create_resp.status_code, 201)
        project_id = create_resp.data['id']

        logs = ProjectChangeLog.objects.filter(project_id=project_id)
        self.assertTrue(logs.exists())
        self.assertEqual(logs.first().user_name, 'Operador Campo')
