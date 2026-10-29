from datetime import date, timedelta

from django.contrib.auth import get_user_model
from django.test import SimpleTestCase, TestCase
from rest_framework.test import APIClient

from .models import Project, Task, TechnicalArea
from .services.timeline_optimizer import TimelineError, calculate_timeline


START = date(2028, 1, 1)


def task(key, duration, predecessors=(), resource=None, release=0, availability=100):
    return {
        'id': key, 'title': f'Tarea {key}', 'duration_days': duration,
        'predecessors': list(predecessors), 'assigned_to': resource,
        'start_date': START + timedelta(days=release), 'availability': availability,
    }


class TimelineCalculationTests(SimpleTestCase):
    def calculate(self, tasks, days=12):
        return calculate_timeline(START, START + timedelta(days=days - 1), tasks)

    def test_parallel_tasks_and_critical_path(self):
        result = self.calculate([task(1, 4), task(2, 6), task(3, 2, [1, 2])])
        self.assertEqual(result['scheduled_duration_days'], 8)
        self.assertEqual(result['critical_task_ids'], [2, 3])
        self.assertEqual(result['days_saved'], 4)
        self.assertEqual(result['tasks'][0]['slack_days'], 2)

    def test_shared_person_never_overlaps(self):
        result = self.calculate([task(1, 4, resource=5), task(2, 6, resource=5), task(3, 2, [1, 2])])
        self.assertEqual(result['scheduled_duration_days'], 12)
        first, second = [row for row in result['tasks'] if row['assigned_to'] == 5]
        self.assertLess(first['end_date'], second['start_date'])

    def test_different_people_can_work_in_parallel(self):
        result = self.calculate([task(1, 4, resource=5), task(2, 6, resource=6)])
        self.assertEqual(result['scheduled_duration_days'], 6)

    def test_dependencies_are_respected(self):
        result = self.calculate([task(1, 4), task(2, 6, [1]), task(3, 2, [2])])
        self.assertEqual(result['scheduled_duration_days'], 12)
        for previous, following in zip(result['tasks'], result['tasks'][1:]):
            self.assertLess(previous['end_date'], following['start_date'])

    def test_availability_extends_effort_duration(self):
        result = self.calculate([task(1, 5, resource=5, availability=50)])
        self.assertEqual(result['scheduled_duration_days'], 10)

    def test_unavailable_or_inactive_person_blocks_analysis(self):
        for availability in (0, -1, 101):
            with self.assertRaises(TimelineError):
                self.calculate([task(1, 5, resource=5, availability=availability)])
        with self.assertRaises(TimelineError):
            self.calculate([{**task(1, 5, resource=5), 'is_active': False}])

    def test_cycle_is_rejected(self):
        with self.assertRaisesMessage(TimelineError, 'ciclo'):
            self.calculate([task(1, 2, [2]), task(2, 3, [1])])

    def test_external_and_self_dependencies_are_rejected(self):
        for predecessor in (1, 99):
            with self.assertRaisesMessage(TimelineError, 'mismo proyecto'):
                self.calculate([task(1, 2, [predecessor])])

    def test_empty_project_does_not_invent_savings(self):
        result = self.calculate([])
        self.assertEqual(result['status'], 'empty')
        self.assertEqual(result['days_saved'], 0)
        self.assertIsNone(result['proposed_end_date'])

    def test_release_dates_are_respected_and_resource_gaps_are_used(self):
        result = self.calculate([task(1, 8, resource=5, release=10), task(2, 3, resource=5)])
        rows = {row['task_id']: row for row in result['tasks']}
        self.assertEqual(rows[2]['start_date'], '2028-01-01')
        self.assertEqual(rows[1]['start_date'], '2028-01-11')
        self.assertEqual(result['delay_days'], 6)

    def test_invalid_duration_and_huge_horizon_are_rejected(self):
        for duration in (0, -1, 1.5, 36601):
            with self.assertRaises(TimelineError):
                self.calculate([task(1, duration)])

    def test_leap_day_and_year_change(self):
        result = calculate_timeline(date(2027, 12, 31), date(2028, 3, 1), [
            {**task(1, 61), 'start_date': date(2027, 12, 31)},
        ])
        self.assertEqual(result['proposed_end_date'], '2028-02-29')


class TimelineEndpointTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.client.force_authenticate(user=get_user_model()(username='reviewer', is_staff=True))
        self.project = Project.objects.create(code='TEST-OPT', name='Análisis', start_date=START, end_date=START + timedelta(days=11))
        self.area = TechnicalArea.objects.create(name='Sistemas')

    def add_task(self, title, duration):
        return Task.objects.create(project=self.project, category=self.area, title=title, start_date=START, end_date=START + timedelta(days=duration - 1), duration_days=duration)

    def test_endpoint_calculates_without_writing_dates_or_flags(self):
        a = self.add_task('A', 4)
        b = self.add_task('B', 6)
        c = self.add_task('C', 2)
        c.predecessors.set([a, b])
        before = list(self.project.tasks.values('id', 'start_date', 'end_date', 'duration_days', 'is_critical_path'))
        response = self.client.get(f'/api/projects/{self.project.pk}/optimize/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['scheduled_duration_days'], 8)
        self.assertFalse(response.data['applied'])
        self.assertEqual(before, list(self.project.tasks.values('id', 'start_date', 'end_date', 'duration_days', 'is_critical_path')))
        self.project.refresh_from_db()
        self.assertEqual(self.project.end_date, START + timedelta(days=11))

    def test_endpoint_rejects_cycle(self):
        a = self.add_task('A', 4)
        b = self.add_task('B', 6)
        a.predecessors.add(b)
        b.predecessors.add(a)
        response = self.client.post(f'/api/projects/{self.project.pk}/optimize/')
        self.assertEqual(response.status_code, 400)
        self.assertIn('ciclo', response.data['detail'])

    def test_empty_endpoint_is_honest(self):
        response = self.client.get(f'/api/projects/{self.project.pk}/optimize/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['status'], 'empty')
