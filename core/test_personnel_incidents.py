from datetime import timedelta
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient, APITestCase

from core.models import (
    PersonnelIncident,
    Role,
    TeamMember,
    TeamMemberChangeLog,
    TeamStatus,
    TechnicalArea,
)
from core.services.personnel_incidents import (
    capture_member_state,
    create_change_log,
    process_incident_lifecycle,
)


User = get_user_model()


class PersonnelIncidentWorkflowTests(APITestCase):
    def setUp(self):
        self.today = timezone.localdate()
        self.area = TechnicalArea.objects.create(name='Arquitectura')
        self.role = Role.objects.create(name='Arquitecta BIM', technical_area=self.area)
        self.active = TeamStatus.objects.create(name='Active', color_code='#10B981')
        self.standby = TeamStatus.objects.create(name='Stand-by', color_code='#F59E0B')
        self.support = TeamStatus.objects.create(name='Support', color_code='#3B82F6')
        self.member = self.make_member('Sofía', 'Torres', 'sofia@empresa.com', 90)
        self.backup = self.make_member('Elena', 'Gómez', 'elena@empresa.com', 75)
        self.other = self.make_member('Mateo', 'Fernández', 'mateo@empresa.com', 60)
        self.admin = User.objects.create_superuser(
            username='admin-incidents',
            email='admin.incidents@empresa.com',
            password='Admin-2026-Segura!',
        )
        self.subadmin = User.objects.create_user(
            username='subadmin-incidents',
            email='subadmin.incidents@empresa.com',
            password='SubAdmin-2026-Segura!',
            is_staff=True,
        )
        self.regular = User.objects.create_user(
            username='regular-incidents',
            email='regular.incidents@empresa.com',
            password='Regular-2026-Segura!',
        )
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.admin.id}')
        self.list_url = reverse('personnel-incident-list')

    def make_member(self, first_name, last_name, email, availability):
        return TeamMember.objects.create(
            first_name=first_name,
            last_name=last_name,
            email=email,
            role=self.role,
            technical_area=self.area,
            status=self.active,
            availability=availability,
        )

    def payload(self, *, member=None, backup=None, start=None, end=None):
        member = member or self.member
        backup = self.backup if backup is None else backup
        start = start or self.today
        end = end or self.today + timedelta(days=3)
        return {
            'memberId': f'hr-db-{member.id}',
            'type': 'vacation',
            'startDate': start.isoformat(),
            'endDate': end.isoformat(),
            'status': 'standby',
            'availability': 0,
            'backupMemberId': f'hr-db-{backup.id}' if backup else '',
            'comment': 'Vacaciones coordinadas con entrega formal de actividades.',
        }

    def create_incident(self, **kwargs):
        response = self.client.post(self.list_url, self.payload(**kwargs), format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)
        return PersonnelIncident.objects.get(pk=response.data['id'])

    def test_create_persists_and_is_visible_after_new_api_client(self):
        incident = self.create_incident()

        self.assertEqual(incident.workflow_status, 'pending')
        self.assertEqual(incident.created_by, self.admin)
        self.assertTrue(TeamMemberChangeLog.objects.filter(
            incident=incident, action='incident_created'
        ).exists())

        reloaded_client = APIClient()
        reloaded_client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.admin.id}')
        response = reloaded_client.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        records = response.data.get('results', []) if isinstance(response.data, dict) else response.data
        persisted = next(record for record in records if record['id'] == incident.id)
        self.assertEqual(persisted['memberName'], 'Sofía Torres')
        self.assertEqual(persisted['type'], 'vacation')
        self.assertEqual(persisted['workflow_status'], 'pending')

    def test_only_admin_and_subadmin_can_use_incident_endpoints(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.regular.id}')
        denied = self.client.post(self.list_url, self.payload(), format='json')
        self.assertEqual(denied.status_code, status.HTTP_403_FORBIDDEN)

        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.subadmin.id}')
        allowed = self.client.post(self.list_url, self.payload(), format='json')
        self.assertEqual(allowed.status_code, status.HTTP_201_CREATED, allowed.data)

    def test_approve_applies_state_and_repeated_transition_is_rejected(self):
        incident = self.create_incident()
        response = self.client.post(
            reverse('personnel-incident-approve', args=[incident.id]),
            {'comment': 'Cobertura confirmada.'},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        self.member.refresh_from_db()
        incident.refresh_from_db()
        self.assertEqual(incident.workflow_status, 'approved')
        self.assertEqual(incident.previous_status, self.active)
        self.assertEqual(incident.previous_availability, 90)
        self.assertEqual(self.member.status, self.standby)
        self.assertEqual(self.member.availability, 0)
        self.assertTrue(TeamMemberChangeLog.objects.filter(
            incident=incident, action='incident_approved'
        ).exists())

        repeated = self.client.post(
            reverse('personnel-incident-approve', args=[incident.id]),
            {},
            format='json',
        )
        self.assertEqual(repeated.status_code, status.HTTP_400_BAD_REQUEST)

        direct_patch = self.client.patch(
            reverse('team-member-detail', args=[self.member.id]),
            {'availability': 50},
            format='json',
        )
        self.assertEqual(direct_patch.status_code, status.HTTP_400_BAD_REQUEST)

    def test_rejection_requires_reason_and_does_not_modify_member(self):
        incident = self.create_incident()
        missing_reason = self.client.post(
            reverse('personnel-incident-reject', args=[incident.id]),
            {},
            format='json',
        )
        self.assertEqual(missing_reason.status_code, status.HTTP_400_BAD_REQUEST)

        rejected = self.client.post(
            reverse('personnel-incident-reject', args=[incident.id]),
            {'comment': 'La cobertura propuesta no está disponible.'},
            format='json',
        )
        self.assertEqual(rejected.status_code, status.HTTP_200_OK, rejected.data)
        incident.refresh_from_db()
        self.member.refresh_from_db()
        self.assertEqual(incident.workflow_status, 'rejected')
        self.assertEqual(self.member.status, self.active)
        self.assertEqual(self.member.availability, 90)

        repeated = self.client.post(
            reverse('personnel-incident-reject', args=[incident.id]),
            {'comment': 'Segundo intento.'},
            format='json',
        )
        self.assertEqual(repeated.status_code, status.HTTP_400_BAD_REQUEST)

    def test_overlap_is_rejected_but_contiguous_period_is_allowed(self):
        self.create_incident(start=self.today, end=self.today + timedelta(days=3))

        overlap = self.client.post(
            self.list_url,
            self.payload(start=self.today + timedelta(days=2), end=self.today + timedelta(days=4)),
            format='json',
        )
        self.assertEqual(overlap.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('member', overlap.data)

        contiguous = self.client.post(
            self.list_url,
            self.payload(start=self.today + timedelta(days=3), end=self.today + timedelta(days=5)),
            format='json',
        )
        self.assertEqual(contiguous.status_code, status.HTTP_201_CREATED, contiguous.data)

    def test_same_day_incident_occupies_one_effective_day(self):
        self.create_incident(start=self.today, end=self.today)
        overlap = self.client.post(
            self.list_url,
            self.payload(start=self.today, end=self.today),
            format='json',
        )
        self.assertEqual(overlap.status_code, status.HTTP_400_BAD_REQUEST)

        next_day = self.client.post(
            self.list_url,
            self.payload(
                start=self.today + timedelta(days=1),
                end=self.today + timedelta(days=1),
            ),
            format='json',
        )
        self.assertEqual(next_day.status_code, status.HTTP_201_CREATED, next_day.data)

    def test_backup_cannot_have_or_cover_an_overlapping_incident(self):
        self.create_incident(member=self.member, backup=self.backup)

        used_as_backup = self.client.post(
            self.list_url,
            self.payload(member=self.other, backup=self.backup),
            format='json',
        )
        self.assertEqual(used_as_backup.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('backup_member', used_as_backup.data)

        backup_as_primary = self.client.post(
            self.list_url,
            self.payload(member=self.backup, backup=self.other),
            format='json',
        )
        self.assertEqual(backup_as_primary.status_code, status.HTTP_400_BAD_REQUEST)

    def test_future_incident_activates_and_restores_automatically(self):
        start = self.today + timedelta(days=5)
        end = self.today + timedelta(days=8)
        incident = self.create_incident(start=start, end=end)
        approved = self.client.post(
            reverse('personnel-incident-approve', args=[incident.id]),
            {},
            format='json',
        )
        self.assertEqual(approved.status_code, status.HTTP_200_OK, approved.data)
        self.member.refresh_from_db()
        self.assertEqual(self.member.status, self.active)
        self.assertEqual(self.member.availability, 90)

        activation = process_incident_lifecycle(as_of=start)
        self.assertEqual(activation['activated'], 1)
        self.member.refresh_from_db()
        self.assertEqual(self.member.status, self.standby)
        self.assertEqual(self.member.availability, 0)

        restoration = process_incident_lifecycle(as_of=end)
        self.assertEqual(restoration['finalized'], 1)
        self.member.refresh_from_db()
        incident.refresh_from_db()
        self.assertEqual(incident.workflow_status, 'finalized')
        self.assertIsNotNone(incident.restored_at)
        self.assertEqual(self.member.status, self.active)
        self.assertEqual(self.member.availability, 90)
        self.assertTrue(TeamMemberChangeLog.objects.filter(
            incident=incident, action='automatic_restoration', source='system'
        ).exists())

    def test_upcoming_return_is_exposed_as_notification(self):
        incident = self.create_incident(end=self.today + timedelta(days=3))
        self.client.post(
            reverse('personnel-incident-approve', args=[incident.id]),
            {},
            format='json',
        )

        response = self.client.get(
            reverse('api_notifications'),
            {'email': self.admin.email},
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        alert = next(
            item for item in response.data
            if item.get('id') == f'incident-return-{incident.id}'
        )
        self.assertEqual(alert['type'], 'personnel_return')
        self.assertEqual(alert['memberId'], self.member.id)

    def test_regular_user_notifications_do_not_fail_and_only_show_own_return(self):
        self.regular.email = self.member.email
        self.regular.save(update_fields=['email'])
        own_incident = self.create_incident(end=self.today + timedelta(days=3))
        self.client.post(
            reverse('personnel-incident-approve', args=[own_incident.id]),
            {},
            format='json',
        )
        response = self.client.get(
            reverse('api_notifications'),
            {'email': self.regular.email},
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        return_alerts = [
            item for item in response.data if item.get('type') == 'personnel_return'
        ]
        self.assertEqual(len(return_alerts), 1)
        self.assertEqual(return_alerts[0]['incidentId'], own_incident.id)

    def test_finalize_does_not_overwrite_a_later_manual_change(self):
        incident = self.create_incident()
        self.client.post(reverse('personnel-incident-approve', args=[incident.id]), {}, format='json')
        self.member.refresh_from_db()
        previous = capture_member_state(self.member)
        self.member.status = self.support
        self.member.availability = 40
        self.member.save()
        self.member.refresh_from_db()
        create_change_log(
            member=self.member,
            action='manual_update',
            source='manual',
            previous=previous,
            current=capture_member_state(self.member),
            comment='Cambio operativo posterior autorizado.',
            actor=self.admin,
        )

        finalized = self.client.post(
            reverse('personnel-incident-finalize', args=[incident.id]),
            {'comment': 'Cierre anticipado.'},
            format='json',
        )
        self.assertEqual(finalized.status_code, status.HTTP_200_OK, finalized.data)
        self.member.refresh_from_db()
        incident.refresh_from_db()
        self.assertEqual(self.member.status, self.support)
        self.assertEqual(self.member.availability, 40)
        self.assertTrue(incident.restoration_skipped)


class TeamMemberPermanentHistoryTests(APITestCase):
    def setUp(self):
        area = TechnicalArea.objects.create(name='Sistemas')
        role = Role.objects.create(name='Ingeniera Backend', technical_area=area)
        self.active = TeamStatus.objects.create(name='Active', color_code='#10B981')
        self.support = TeamStatus.objects.create(name='Support', color_code='#3B82F6')
        self.member = TeamMember.objects.create(
            first_name='Laura',
            last_name='Castro',
            email='laura.historial@empresa.com',
            role=role,
            technical_area=area,
            status=self.active,
            availability=100,
        )
        self.admin = User.objects.create_user(
            username='history-admin',
            email='history.admin@empresa.com',
            password='Admin-2026-Segura!',
            is_staff=True,
        )
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.admin.id}')

    def test_manual_update_creates_persistent_auditable_history(self):
        response = self.client.patch(
            reverse('team-member-detail', args=[self.member.id]),
            {
                'status': self.support.id,
                'availability': 45,
                'change_comment': 'Apoyo temporal en integración y pruebas.',
            },
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        log = TeamMemberChangeLog.objects.get(member=self.member, source='manual')
        self.assertEqual(log.changed_by, self.admin)
        self.assertEqual(log.previous_status, self.active)
        self.assertEqual(log.new_status, self.support)
        self.assertEqual(log.previous_availability, 100)
        self.assertEqual(log.new_availability, 45)
        self.assertIn('Apoyo temporal', log.comment)

        reloaded_client = APIClient()
        reloaded_client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.admin.id}')
        history = reloaded_client.get(
            reverse('team-member-change-log-list'),
            {'member': self.member.id, 'source': 'manual'},
        )
        self.assertEqual(history.status_code, status.HTTP_200_OK)
        records = history.data.get('results', []) if isinstance(history.data, dict) else history.data
        self.assertEqual(len(records), 1)
        self.assertEqual(records[0]['name'], 'Laura Castro')
        self.assertEqual(records[0]['previousStatus'], 'active')
        self.assertEqual(records[0]['nextStatus'], 'support')

    def test_member_update_rolls_back_if_history_cannot_be_written(self):
        with patch(
            'core.services.personnel_incidents.create_change_log',
            side_effect=RuntimeError('No se pudo escribir la bitácora.'),
        ):
            with self.assertRaises(RuntimeError):
                self.client.patch(
                    reverse('team-member-detail', args=[self.member.id]),
                    {
                        'status': self.support.id,
                        'availability': 45,
                        'change_comment': 'Cambio que debe ser atómico.',
                    },
                    format='json',
                )

        self.member.refresh_from_db()
        self.assertEqual(self.member.status, self.active)
        self.assertEqual(self.member.availability, 100)
        self.assertFalse(TeamMemberChangeLog.objects.filter(member=self.member).exists())

