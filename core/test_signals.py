import datetime
from decimal import Decimal
from django.test import TestCase
from django.core.management import call_command
from django.utils import timezone
from django.db import connection
from rest_framework.test import APIClient
from django.contrib.auth.models import User
from core.models import Project, ProjectChangeLog, SecurityAuditLog, TeamMemberChangeLog


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

    def test_project_creation_signal_creates_compact_changelog(self):
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
        self.assertEqual(log.action_type, 'PROJECT_CREATED')
        self.assertIn("Alta del proyecto 'Proyecto Test Inicial'", log.description)
        self.assertIn("PRJ-TEST-001", log.description)
        self.assertEqual(log.user_name, 'Supervisor Juan')
        self.assertEqual(log.date, datetime.date.today())
        # Verificar que field_changes almacena formato compacto
        self.assertIn('budget', log.field_changes)
        self.assertEqual(log.field_changes['budget']['new'], 50000.0)

    def test_project_update_signal_tracks_compact_deltas(self):
        project = Project.objects.create(
            code='PRJ-TEST-002',
            name='Proyecto Original',
            start_date=datetime.date(2026, 1, 1),
            end_date=datetime.date(2026, 6, 1),
            duration_months=5,
            budget=Decimal('10000.00'),
            status='PLANNING'
        )
        # Limpiar log de creación
        ProjectChangeLog.objects.filter(project=project).delete()

        # Actualizar campos
        project._actor_name = 'PM Laura'
        project.name = 'Proyecto Modificado'
        project.budget = Decimal('25000.00')
        project.status = 'IN_PROGRESS'
        project.start_date = datetime.date(2026, 2, 1)
        project.end_date = datetime.date(2026, 8, 1)
        project.save()

        logs = ProjectChangeLog.objects.filter(project=project)
        self.assertEqual(logs.count(), 1)
        log = logs.first()
        self.assertEqual(log.user_name, 'PM Laura')
        # Deltas compactos
        deltas = log.field_changes
        self.assertEqual(deltas['budget'], {'old': 10000.0, 'new': 25000.0})
        self.assertEqual(deltas['status'], {'old': 'PLANNING', 'new': 'IN_PROGRESS'})
        self.assertEqual(deltas['name'], {'old': 'Proyecto Original', 'new': 'Proyecto Modificado'})

    def test_update_without_changes_does_not_create_log(self):
        project = Project.objects.create(
            code='PRJ-NO-CHANGE',
            name='Sin Cambios',
            start_date=datetime.date(2026, 1, 1),
            end_date=datetime.date(2026, 6, 1),
            duration_months=5,
            budget=Decimal('10000.00'),
            status='PLANNING'
        )
        initial_count = ProjectChangeLog.objects.filter(project=project).count()
        self.assertEqual(initial_count, 1)

        # Guardar sin modificar ningún campo
        project._actor_name = 'PM Laura'
        project.save()

        # No debe haber creado ningún log adicional
        self.assertEqual(ProjectChangeLog.objects.filter(project=project).count(), initial_count)

    def test_security_actor_ignores_falsified_username_in_payload(self):
        self.client.force_authenticate(user=self.user)
        # Enviar userName falso en el payload pretendiendo ser otra persona
        resp = self.client.post('/api/projects/', {
            'code': 'PRJ-SPOOF-01',
            'name': 'Proyecto Spoofed',
            'startDate': '2026-03-01',
            'endDate': '2026-09-01',
            'totalBudget': 80000.00,
            'status': 'planning',
            'userName': 'HACKER_ATTEMPT',
        }, format='json')
        self.assertEqual(resp.status_code, 201)
        project_id = resp.data['id']

        log = ProjectChangeLog.objects.filter(project_id=project_id).first()
        # DEBE registrar Carlos Mendoza (usuario autenticado), NUNCA HACKER_ATTEMPT
        self.assertEqual(log.user_name, 'Carlos Mendoza')
        self.assertNotEqual(log.user_name, 'HACKER_ATTEMPT')

    def test_unauthenticated_client_logs_system_actor(self):
        # Cliente sin autenticar enviando un userName
        resp = self.client.post('/api/projects/', {
            'code': 'PRJ-UNAUTH-01',
            'name': 'Proyecto Sin Auth',
            'startDate': '2026-04-01',
            'endDate': '2026-10-01',
            'totalBudget': 45000.00,
            'status': 'planning',
            'userName': 'FakeUser',
        }, format='json')
        self.assertEqual(resp.status_code, 201)
        project_id = resp.data['id']

        log = ProjectChangeLog.objects.filter(project_id=project_id).first()
        # Debe registrar 'system', nunca 'FakeUser'
        self.assertEqual(log.user_name, 'system')

    def test_compact_log_size_under_500_bytes(self):
        project = Project.objects.create(
            code='PRJ-SIZE-001',
            name='Proyecto Medición',
            start_date=datetime.date(2026, 1, 1),
            end_date=datetime.date(2026, 6, 1),
            duration_months=5,
            budget=Decimal('100000.00'),
            status='PLANNING'
        )
        project._actor_name = 'Carlos Mendoza'
        project.budget = Decimal('150000.00')
        project.status = 'IN_PROGRESS'
        project.save()

        latest_log = ProjectChangeLog.objects.filter(project=project).order_by('-id').first()
        with connection.cursor() as cursor:
            cursor.execute("SELECT pg_column_size(%s::jsonb);", [str(latest_log.field_changes).replace("'", '"')])
            size = cursor.fetchone()[0]
            # Debe ser significativamente menor a 500 bytes (usualmente ~150-250 bytes)
            self.assertLess(size, 500)

    def test_purge_old_logs_command(self):
        project = Project.objects.create(
            code='PRJ-PURGE-01',
            name='Proyecto Purga',
            start_date=datetime.date(2026, 1, 1),
            end_date=datetime.date(2026, 6, 1),
            duration_months=5,
            budget=Decimal('10000.00'),
            status='PLANNING'
        )
        # 1. ProjectChangeLog antiguo (>180 días)
        old_project_date = timezone.now() - datetime.timedelta(days=200)
        old_proj_log = ProjectChangeLog.objects.create(
            project=project,
            action_type='PROJECT_UPDATE',
            field_changes={'budget': {'old': 1000, 'new': 2000}},
            user_name='system',
            date=old_project_date.date()
        )
        ProjectChangeLog.objects.filter(id=old_proj_log.id).update(created_at=old_project_date)

        # 2. SecurityAuditLog entre 180 y 365 días (debe conservarse con default 365)
        med_sec_date = timezone.now() - datetime.timedelta(days=200)
        med_sec_log = SecurityAuditLog.objects.create(
            user=self.user,
            action='password_change',
            description='Cambio de clave seguro',
        )
        SecurityAuditLog.objects.filter(id=med_sec_log.id).update(created_at=med_sec_date)

        # 3. SecurityAuditLog muy antiguo (>365 días, debe purgarse)
        ancient_sec_date = timezone.now() - datetime.timedelta(days=400)
        ancient_sec_log = SecurityAuditLog.objects.create(
            user=self.user,
            action='email_change',
            description='Cambio de correo antiguo',
        )
        SecurityAuditLog.objects.filter(id=ancient_sec_log.id).update(created_at=ancient_sec_date)

        # Prueba dry-run: no debe borrar nada
        call_command('purge_old_logs', '--dry-run')
        self.assertTrue(ProjectChangeLog.objects.filter(id=old_proj_log.id).exists())
        self.assertTrue(SecurityAuditLog.objects.filter(id=med_sec_log.id).exists())
        self.assertTrue(SecurityAuditLog.objects.filter(id=ancient_sec_log.id).exists())

        # Purga con defaults diferenciados: Project > 180d, Security > 365d
        call_command('purge_old_logs', '--batch-size', '100')
        # ProjectLog (>200d) debe haber sido eliminado
        self.assertFalse(ProjectChangeLog.objects.filter(id=old_proj_log.id).exists())
        # SecurityLog mediano (200d < 365d) debe conservarse
        self.assertTrue(SecurityAuditLog.objects.filter(id=med_sec_log.id).exists())
        # SecurityLog antiguo (400d > 365d) debe haber sido eliminado
        self.assertFalse(SecurityAuditLog.objects.filter(id=ancient_sec_log.id).exists())

    def test_project_deletion_preserves_logs_with_set_null_and_records_final_log(self):
        project = Project.objects.create(
            code='PRJ-DEL-01',
            name='Proyecto para Borrar',
            start_date=datetime.date(2026, 1, 1),
            end_date=datetime.date(2026, 6, 1),
            duration_months=5,
            budget=Decimal('10000.00'),
            status='PLANNING'
        )
        # Hay 1 log de creación
        creation_log = ProjectChangeLog.objects.filter(project=project).first()
        self.assertIsNotNone(creation_log)
        self.assertEqual(creation_log.project_code, 'PRJ-DEL-01')

        # Eliminar el proyecto
        project._actor_name = 'Admin Carlos'
        project.delete()

        # 1. El log previo debe conservarse con project=None gracias a SET_NULL
        creation_log.refresh_from_db()
        self.assertIsNone(creation_log.project)
        self.assertEqual(creation_log.project_code, 'PRJ-DEL-01')
        self.assertEqual(creation_log.project_name, 'Proyecto para Borrar')
        # __str__ no debe fallar con project=None
        self.assertIn('[PRJ-DEL-01]', str(creation_log))

        # 2. Debe existir la última línea con action_type='PROJECT_DELETED'
        deletion_log = ProjectChangeLog.objects.filter(action_type='PROJECT_DELETED', project_code='PRJ-DEL-01').first()
        self.assertIsNotNone(deletion_log)
        self.assertIn("Eliminación permanente", deletion_log.description)
        self.assertEqual(deletion_log.user_name, 'Admin Carlos')
        self.assertIsNone(deletion_log.project)
        self.assertEqual(deletion_log.project_code, 'PRJ-DEL-01')
        self.assertEqual(deletion_log.project_name, 'Proyecto para Borrar')
        # __str__ no debe fallar
        self.assertIn('[PRJ-DEL-01]', str(deletion_log))

    def test_get_client_ip_helper(self):
        from core.views import get_client_ip
        from django.test import RequestFactory

        rf = RequestFactory()

        # 1. Con X-Forwarded-For múltiple
        req1 = rf.get('/', HTTP_X_FORWARDED_FOR='203.0.113.195, 70.41.3.18, 150.172.238.178')
        self.assertEqual(get_client_ip(req1), '203.0.113.195')

        # 2. Con REMOTE_ADDR fallback
        req2 = rf.get('/', REMOTE_ADDR='198.51.100.1')
        self.assertEqual(get_client_ip(req2), '198.51.100.1')

        # 3. Sin request
        self.assertIsNone(get_client_ip(None))
