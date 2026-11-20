from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from core.authentication import issue_session_token
from core.models import Project, Role, TeamMember, TeamStatus, TechnicalArea

User = get_user_model()


class TeamMemberDeleteDeactivateTests(APITestCase):
    def setUp(self):
        self.area = TechnicalArea.objects.create(name='Sistemas y TI')
        self.role = Role.objects.create(name='Desarrollador Full Stack', technical_area=self.area)
        self.active_status = TeamStatus.objects.create(name='Active', color_code='#10B981')
        self.offline_status = TeamStatus.objects.create(name='No disponible (Offline)', color_code='#6B7280')

        self.project = Project.objects.create(
            name='Proyecto Alpha',
            code='PRJ-ALPHA',
            start_date='2026-01-01',
            end_date='2026-12-31',
        )

        self.member_email = 'carlos.dev@empresa.com'
        self.member_user = User.objects.create_user(
            username=self.member_email,
            email=self.member_email,
            password='Password123!',
            is_active=True,
        )

        self.member = TeamMember.objects.create(
            first_name='Carlos',
            last_name='Mendoza',
            email=self.member_email,
            role=self.role,
            technical_area=self.area,
            status=self.active_status,
            project=self.project,
            availability=80,
            allocation_percentage=50,
            is_active=True,
        )

        self.admin = User.objects.create_superuser(
            username='admin-tester',
            email='admin.tester@empresa.com',
            password='AdminPassword123!',
        )
        self.regular_user = User.objects.create_user(
            username='regular-tester',
            email='regular.tester@empresa.com',
            password='RegularPassword123!',
        )

        self.detail_url = reverse('team-member-detail', kwargs={'pk': self.member.pk})

    def test_deactivate_member_logical_flow(self):
        """Baja lógica: inactiva TeamMember y User, pone disponibilidad en 0 y desasigna proyecto."""
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {issue_session_token(self.admin)}')
        response = self.client.delete(f'{self.detail_url}?mode=deactivate')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data.get('action'), 'deactivate')
        self.assertIn('ha sido dado de baja', response.data.get('message', ''))

        self.member.refresh_from_db()
        self.assertFalse(self.member.is_active)
        self.assertEqual(self.member.availability, 0)
        self.assertEqual(self.member.allocation_percentage, 0)
        self.assertIsNone(self.member.project)
        self.assertEqual(self.member.status, self.offline_status)

        self.member_user.refresh_from_db()
        self.assertFalse(self.member_user.is_active)

    def test_default_mode_is_deactivate(self):
        """Si no se especifica modo, el comportamiento predeterminado es baja lógica (deactivate)."""
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {issue_session_token(self.admin)}')
        response = self.client.delete(self.detail_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data.get('action'), 'deactivate')

        self.member.refresh_from_db()
        self.assertFalse(self.member.is_active)

    def test_hard_delete_member_physical_flow(self):
        """Eliminación física: borra TeamMember y User de acceso permanentemente."""
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {issue_session_token(self.admin)}')
        response = self.client.delete(f'{self.detail_url}?mode=hard_delete')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data.get('action'), 'hard_delete')
        self.assertIn('eliminados completamente', response.data.get('message', ''))

        self.assertFalse(TeamMember.objects.filter(pk=self.member.pk).exists())
        self.assertFalse(User.objects.filter(pk=self.member_user.pk).exists())

    def test_regular_user_cannot_delete_member(self):
        """Un usuario sin permisos de administrador no puede dar de baja ni eliminar técnicos."""
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {issue_session_token(self.regular_user)}')
        response = self.client.delete(f'{self.detail_url}?mode=deactivate')

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.member.refresh_from_db()
        self.assertTrue(self.member.is_active)

    def test_prefixed_id_tolerance(self):
        """Tolera identificadores con formato cliente tipo tech-db-X o hr-db-X sin generar 404."""
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {issue_session_token(self.admin)}')
        prefixed_url = f'/api/team-members/tech-db-{self.member.pk}/?mode=deactivate'
        response = self.client.delete(prefixed_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data.get('action'), 'deactivate')
        self.member.refresh_from_db()
        self.assertFalse(self.member.is_active)
