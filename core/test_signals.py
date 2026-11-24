import datetime
from decimal import Decimal
from django.test import TestCase
from django.core.management import call_command
from django.utils import timezone
from django.db import connection
from rest_framework import status
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
        if connection.vendor != 'postgresql':
            import json
            payload_size = len(json.dumps(latest_log.field_changes))
            self.assertLess(payload_size, 500)
            return

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

        # Purga con defaults diferenciados: Project > 195d, Security > 365d
        call_command('purge_old_logs', '--batch-size', '100')
        # ProjectLog (>200d) debe haber sido eliminado
        self.assertFalse(ProjectChangeLog.objects.filter(id=old_proj_log.id).exists())
        # SecurityLog mediano (200d < 365d) debe conservarse
        self.assertTrue(SecurityAuditLog.objects.filter(id=med_sec_log.id).exists())
        # SecurityLog antiguo (400d > 365d) debe haber sido eliminado
        self.assertFalse(SecurityAuditLog.objects.filter(id=ancient_sec_log.id).exists())

    def test_purge_old_logs_protects_semiannual_window_185_days_and_logs_history(self):
        from core.models import AuditPurgeLog

        project = Project.objects.create(
            code='PRJ-SEMI-01',
            name='Proyecto Auditoria Semestral',
            start_date=datetime.date(2026, 1, 1),
            end_date=datetime.date(2026, 6, 1),
            duration_months=5,
            budget=Decimal('10000.00'),
            status='PLANNING'
        )
        # 1. Registro con 185 días de antigüedad (dentro del margen de 195 días)
        date_185d = timezone.now() - datetime.timedelta(days=185)
        log_185d = ProjectChangeLog.objects.create(
            project=project,
            action_type='PROJECT_UPDATE',
            field_changes={'status': {'old': 'PLANNING', 'new': 'IN_PROGRESS'}},
            user_name='system',
            date=date_185d.date()
        )
        ProjectChangeLog.objects.filter(id=log_185d.id).update(created_at=date_185d)

        # 2. Registro con 205 días de antigüedad (> 195 días, debe purgarse)
        date_205d = timezone.now() - datetime.timedelta(days=205)
        log_205d = ProjectChangeLog.objects.create(
            project=project,
            action_type='PROJECT_UPDATE',
            field_changes={'budget': {'old': 10000, 'new': 12000}},
            user_name='system',
            date=date_205d.date()
        )
        ProjectChangeLog.objects.filter(id=log_205d.id).update(created_at=date_205d)

        # Ejecutar en dry-run
        call_command('purge_old_logs', '--dry-run')
        self.assertTrue(ProjectChangeLog.objects.filter(id=log_185d.id).exists())
        self.assertTrue(ProjectChangeLog.objects.filter(id=log_205d.id).exists())

        # Verificar que el dry-run generó registro en AuditPurgeLog
        dry_run_entry = AuditPurgeLog.objects.filter(was_dry_run=True).latest('executed_at')
        self.assertIsNotNone(dry_run_entry)
        self.assertTrue(dry_run_entry.was_dry_run)
        self.assertEqual(dry_run_entry.status, 'SUCCESS')

        # Ejecutar purga real con valores por defecto (195 días)
        call_command('purge_old_logs', '--batch-size', '500')

        # El registro de 185 días NO debe purgarse (protección de ventana semestral)
        self.assertTrue(ProjectChangeLog.objects.filter(id=log_185d.id).exists(), "El registro de 185 días fue purgado erróneamente!")

        # El registro de 205 días sí debe haberse purgado
        self.assertFalse(ProjectChangeLog.objects.filter(id=log_205d.id).exists(), "El registro de 205 días no fue purgado!")

        # Verificar registro real en AuditPurgeLog
        real_purge_entry = AuditPurgeLog.objects.filter(was_dry_run=False).latest('executed_at')
        self.assertIsNotNone(real_purge_entry)
        self.assertFalse(real_purge_entry.was_dry_run)
        self.assertGreaterEqual(real_purge_entry.total_purged, 1)
        self.assertGreaterEqual(real_purge_entry.project_logs_purged, 1)

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

    def test_admin_audit_logs_registered_and_read_only(self):
        from django.contrib import admin
        from core.models import ProjectChangeLog, SecurityAuditLog

        # Verificar que ambos modelos estén registrados en el sitio de administración
        self.assertIn(ProjectChangeLog, admin.site._registry)
        self.assertIn(SecurityAuditLog, admin.site._registry)

        proj_admin = admin.site._registry[ProjectChangeLog]
        sec_admin = admin.site._registry[SecurityAuditLog]

        # Verificar inmutabilidad (permisos estrictos de solo lectura)
        self.assertFalse(proj_admin.has_add_permission(None))
        self.assertFalse(proj_admin.has_change_permission(None))
        self.assertFalse(proj_admin.has_delete_permission(None))

        self.assertFalse(sec_admin.has_add_permission(None))
        self.assertFalse(sec_admin.has_change_permission(None))
        self.assertFalse(sec_admin.has_delete_permission(None))

    def test_audit_viewsets_are_readonly_and_reject_mutations(self):
        from core.models import ScheduleAdjustment

        project = Project.objects.create(
            code='PRJ-RO-01',
            name='Proyecto Solo Lectura',
            start_date=datetime.date(2026, 1, 1),
            end_date=datetime.date(2026, 6, 1),
            duration_months=5,
            budget=Decimal('10000.00'),
            status='PLANNING'
        )
        proj_log = ProjectChangeLog.objects.filter(project=project).first()
        sched_adj = ScheduleAdjustment.objects.create(
            project=project,
            previous_period='Q1 2026',
            next_period='Q2 2026',
            reason='Replanificación estratégica',
            date=datetime.date.today()
        )

        endpoints = [
            ('/api/project-change-logs/', f'/api/project-change-logs/{proj_log.id}/'),
            ('/api/schedule-adjustments/', f'/api/schedule-adjustments/{sched_adj.id}/'),
        ]

        for list_url, detail_url in endpoints:
            # GET list y detail permitidos (200)
            self.assertEqual(self.client.get(list_url).status_code, 200)
            self.assertEqual(self.client.get(detail_url).status_code, 200)

            # POST prohibido (405 Method Not Allowed)
            post_resp = self.client.post(list_url, {'some': 'data'}, format='json')
            self.assertEqual(post_resp.status_code, 405)

            # PUT prohibido (405)
            put_resp = self.client.put(detail_url, {'some': 'data'}, format='json')
            self.assertEqual(put_resp.status_code, 405)

            # PATCH prohibido (405)
            patch_resp = self.client.patch(detail_url, {'some': 'data'}, format='json')
            self.assertEqual(patch_resp.status_code, 405)

            # DELETE prohibido (405)
            del_resp = self.client.delete(detail_url)
            self.assertEqual(del_resp.status_code, 405)

    def test_rls_migration_sql_and_vendor_guard(self):
        import importlib
        from unittest.mock import MagicMock

        rls_module = importlib.import_module('core.migrations.0023_enable_rls_public_tables')
        PostgresOnlyRunSQL = rls_module.PostgresOnlyRunSQL
        ENABLE_RLS_SQL = rls_module.ENABLE_RLS_SQL
        DISABLE_RLS_REVERSE_SQL = rls_module.DISABLE_RLS_REVERSE_SQL

        # Verificar que el SQL contenga la instrucción ENABLE/DISABLE ROW LEVEL SECURITY
        self.assertIn("ENABLE ROW LEVEL SECURITY", ENABLE_RLS_SQL)
        self.assertIn("DISABLE ROW LEVEL SECURITY", DISABLE_RLS_REVERSE_SQL)
        self.assertIn("core_%", ENABLE_RLS_SQL)
        self.assertIn("auth_%", ENABLE_RLS_SQL)
        self.assertIn("django_%", ENABLE_RLS_SQL)

        # Simular schema_editor en SQLite vs PostgreSQL
        run_sql = PostgresOnlyRunSQL(sql=ENABLE_RLS_SQL, reverse_sql=DISABLE_RLS_REVERSE_SQL)

        mock_sqlite_schema = MagicMock()
        mock_sqlite_schema.connection.vendor = 'sqlite'
        mock_sqlite_schema.connection.alias = 'default'
        # En SQLite no debe ejecutar execute
        run_sql.database_forwards('core', mock_sqlite_schema, None, None)
        mock_sqlite_schema.execute.assert_not_called()

        mock_pg_schema = MagicMock()
        mock_pg_schema.connection.vendor = 'postgresql'
        mock_pg_schema.connection.alias = 'default'
        mock_pg_schema.connection.ops.prepare_sql_script.return_value = [ENABLE_RLS_SQL]
        run_sql.database_forwards('core', mock_pg_schema, None, None)
        mock_pg_schema.execute.assert_called_once()

    def test_avatar_validation_rules(self):
        import base64
        self.client.force_authenticate(user=self.user)
        url = '/api/auth/profile/'

        # 1. Avatar normal (~30 KB JPEG con magic bytes \xff\xd8\xff) -> Debe pasar (200)
        jpeg_header = b'\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x01\x00`\x00`\x00\x00'
        jpeg_dummy_body = b'\x00' * (30 * 1024)
        valid_jpeg_b64 = base64.b64encode(jpeg_header + jpeg_dummy_body).decode('ascii')
        valid_jpeg_uri = f"data:image/jpeg;base64,{valid_jpeg_b64}"

        resp1 = self.client.patch(url, {'avatar': valid_jpeg_uri}, format='json')
        self.assertEqual(resp1.status_code, 200)
        self.user.profile.refresh_from_db()
        self.assertEqual(self.user.profile.avatar, valid_jpeg_uri)

        # 2. Avatar sobredimensionado (> 80 KB) -> Debe ser rechazado (400)
        oversized_bytes = b'\xff\xd8\xff' + (b'\x00' * (85 * 1024))
        oversized_b64 = base64.b64encode(oversized_bytes).decode('ascii')
        oversized_uri = f"data:image/jpeg;base64,{oversized_b64}"

        resp2 = self.client.patch(url, {'avatar': oversized_uri}, format='json')
        self.assertEqual(resp2.status_code, 400)
        self.assertIn("excede el tamaño máximo", resp2.data.get('message', ''))

        # 3. Avatar con formato MIME no permitido (ej. GIF) -> Debe ser rechazado (400)
        gif_bytes = b'GIF89a\x01\x00\x01\x00\x80\x00\x00'
        gif_b64 = base64.b64encode(gif_bytes).decode('ascii')
        gif_uri = f"data:image/gif;base64,{gif_b64}"

        resp3 = self.client.patch(url, {'avatar': gif_uri}, format='json')
        self.assertEqual(resp3.status_code, 400)
        self.assertIn("Formato de imagen no permitido", resp3.data.get('message', ''))

        # 4. Avatar con cabecera declarada JPEG pero bytes falsos -> Debe ser rechazado (400)
        fake_jpeg_bytes = b'NOT_A_JPEG_FILE_HEADER_DATA'
        fake_jpeg_b64 = base64.b64encode(fake_jpeg_bytes).decode('ascii')
        fake_jpeg_uri = f"data:image/jpeg;base64,{fake_jpeg_b64}"

        resp4 = self.client.patch(url, {'avatar': fake_jpeg_uri}, format='json')
        self.assertEqual(resp4.status_code, 400)
        self.assertIn("no coinciden con la cabecera MIME", resp4.data.get('message', ''))

        # 5. Avatar PNG válido -> Debe pasar (200)
        png_bytes = b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR' + (b'\x00' * 500)
        png_uri = f"data:image/png;base64,{base64.b64encode(png_bytes).decode('ascii')}"
        resp5 = self.client.patch(url, {'avatar': png_uri}, format='json')
        self.assertEqual(resp5.status_code, 200)

        # 6. Avatar WEBP válido -> Debe pasar (200)
        webp_bytes = b'RIFF\x20\x00\x00\x00WEBPVP8 ' + (b'\x00' * 500)
        webp_uri = f"data:image/webp;base64,{base64.b64encode(webp_bytes).decode('ascii')}"
        resp6 = self.client.patch(url, {'avatar': webp_uri}, format='json')
        self.assertEqual(resp6.status_code, 200)

        # 7. Eliminación / limpieza de avatar -> Debe pasar (200) y quedar en None
        resp7 = self.client.patch(url, {'avatar': None}, format='json')
        self.assertEqual(resp7.status_code, 200)
        self.user.profile.refresh_from_db()
        self.assertIsNone(self.user.profile.avatar)

    def test_check_db_size_command_thresholds_and_webhook(self):
        from io import StringIO
        from unittest.mock import patch

        # 1. Ejecución estándar según motor (SQLite omite, PostgreSQL calcula)
        out1 = StringIO()
        call_command('check_db_size', stdout=out1)
        if connection.vendor != 'postgresql':
            self.assertIn("check_db_size solo aplica a PostgreSQL", out1.getvalue())
        else:
            self.assertIn("Consumo de base de datos", out1.getvalue())

        # 2. Consumo normal (200 MB = 40% de 500 MB) -> OK
        out2 = StringIO()
        call_command('check_db_size', '--mock-size-mb', '200', stdout=out2)
        self.assertIn("200.00 MB de 500 MB", out2.getvalue())
        self.assertIn("Almacenamiento dentro de los límites operativos", out2.getvalue())

        # 3. Advertencia (360 MB = 72% de 500 MB) -> WARNING y despacho de webhook
        out3 = StringIO()
        with patch('requests.post') as mock_post:
            mock_post.return_value.status_code = 200
            call_command(
                'check_db_size',
                '--mock-size-mb', '360',
                '--webhook-url', 'https://hook.make.com/test-warn',
                stdout=out3
            )
            self.assertIn("ALERTA [WARNING]", out3.getvalue())
            self.assertIn("72.0%", out3.getvalue())
            mock_post.assert_called_once()
            called_payload = mock_post.call_args[1]['json']
            self.assertEqual(called_payload['level'], 'WARNING')
            self.assertEqual(called_payload['percentage'], 72.0)

        # 4. Crítico (420 MB = 84% de 500 MB) -> CRITICAL
        out4 = StringIO()
        with patch('requests.post') as mock_post_crit:
            mock_post_crit.return_value.status_code = 200
            call_command(
                'check_db_size',
                '--mock-size-mb', '420',
                '--webhook-url', 'https://hook.make.com/test-crit',
                stdout=out4
            )
            self.assertIn("ALERTA [CRITICAL]", out4.getvalue())
            self.assertIn("84.0%", out4.getvalue())
            called_payload_crit = mock_post_crit.call_args[1]['json']
            self.assertEqual(called_payload_crit['level'], 'CRITICAL')
