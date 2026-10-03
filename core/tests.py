from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from .models import TeamMember


class CreateTechnicianViewTests(APITestCase):
    def setUp(self):
        self.url = reverse('create-technician')
        self.admin = get_user_model().objects.create_user(
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
        }

    def test_creates_login_user_and_team_member(self):
        response = self.client.post(self.url, self.payload, format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        user = get_user_model().objects.get(email=self.payload['email'])
        member = TeamMember.objects.select_related('technical_area', 'role', 'status').get(
            email=self.payload['email']
        )

        self.assertTrue(user.check_password(self.payload['password']))
        self.assertEqual(user.username, self.payload['email'])
        self.assertEqual(member.technical_area.name, 'Arquitectura')
        self.assertEqual(member.role.name, self.payload['specialty'])
        self.assertEqual(member.status.name, 'Active')
        self.assertNotIn('password', response.data)
        self.assertEqual(response.data['member']['id'], member.id)

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

    def test_rejects_duplicate_email_without_creating_extra_records(self):
        first_response = self.client.post(self.url, self.payload, format='json')
        second_response = self.client.post(self.url, self.payload, format='json')

        self.assertEqual(first_response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(second_response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(get_user_model().objects.filter(email=self.payload['email']).count(), 1)
        self.assertEqual(TeamMember.objects.filter(email=self.payload['email']).count(), 1)

    def test_rejects_weak_password_without_saving_partial_data(self):
        self.payload['password'] = '123'

        response = self.client.post(self.url, self.payload, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(get_user_model().objects.filter(email=self.payload['email']).exists())
        self.assertFalse(TeamMember.objects.filter(email=self.payload['email']).exists())

    def test_rejects_creation_without_admin_or_subadmin_permissions(self):
        self.client.credentials()

        response = self.client.post(self.url, self.payload, format='json')

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertFalse(get_user_model().objects.filter(email=self.payload['email']).exists())
        self.assertFalse(TeamMember.objects.filter(email=self.payload['email']).exists())
