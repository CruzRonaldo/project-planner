# Generated manually for the persistent Human Resources workflow.

import django.core.validators
import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0013_teammember_workload_percentages'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='PersonnelIncident',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('incident_type', models.CharField(choices=[('vacation', 'Vacaciones programadas'), ('medical-leave', 'Descanso médico'), ('paid-leave', 'Licencia con goce'), ('unpaid-leave', 'Licencia sin goce'), ('personal-permission', 'Permiso personal'), ('training', 'Capacitación externa'), ('other', 'Otro')], max_length=30, verbose_name='Tipo de incidencia')),
                ('start_date', models.DateField(verbose_name='Fecha de inicio')),
                ('end_date', models.DateField(verbose_name='Fecha de retorno / fin')),
                ('availability', models.PositiveSmallIntegerField(validators=[django.core.validators.MinValueValidator(0), django.core.validators.MaxValueValidator(100)], verbose_name='Disponibilidad durante la incidencia (%)')),
                ('reason', models.TextField(verbose_name='Motivo / comentario detallado')),
                ('workflow_status', models.CharField(choices=[('pending', 'Pendiente'), ('approved', 'Aprobada'), ('rejected', 'Rechazada'), ('finalized', 'Finalizada')], db_index=True, default='pending', max_length=20, verbose_name='Estado de aprobación')),
                ('previous_status_name', models.CharField(blank=True, max_length=50)),
                ('previous_availability', models.PositiveSmallIntegerField(blank=True, null=True, validators=[django.core.validators.MinValueValidator(0), django.core.validators.MaxValueValidator(100)])),
                ('applied_at', models.DateTimeField(blank=True, null=True)),
                ('restored_at', models.DateTimeField(blank=True, null=True)),
                ('restoration_skipped', models.BooleanField(default=False)),
                ('restoration_note', models.CharField(blank=True, max_length=255)),
                ('reviewed_at', models.DateTimeField(blank=True, null=True)),
                ('review_comment', models.TextField(blank=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('backup_member', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.PROTECT, related_name='incidents_as_backup', to='core.teammember', verbose_name='Técnico de respaldo')),
                ('created_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='created_personnel_incidents', to=settings.AUTH_USER_MODEL)),
                ('member', models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name='personnel_incidents', to='core.teammember', verbose_name='Integrante del personal')),
                ('previous_status', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='incident_snapshots', to='core.teamstatus', verbose_name='Estado anterior')),
                ('resulting_status', models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name='personnel_incidents', to='core.teamstatus', verbose_name='Estado operativo durante la incidencia')),
                ('reviewed_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='reviewed_personnel_incidents', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'verbose_name': 'Incidencia / Licencia del Personal',
                'verbose_name_plural': 'Incidencias / Licencias del Personal',
                'ordering': ['-start_date', '-created_at'],
            },
        ),
        migrations.CreateModel(
            name='TeamMemberChangeLog',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('member_name', models.CharField(max_length=220)),
                ('member_email', models.EmailField(blank=True, max_length=254)),
                ('action', models.CharField(choices=[('manual_update', 'Actualización manual'), ('incident_created', 'Incidencia registrada'), ('incident_approved', 'Incidencia aprobada'), ('incident_rejected', 'Incidencia rechazada'), ('incident_finalized', 'Incidencia finalizada'), ('automatic_restoration', 'Restauración automática'), ('member_deleted', 'Integrante eliminado')], max_length=30)),
                ('source', models.CharField(choices=[('manual', 'Manual'), ('incident', 'Incidencia / licencia'), ('system', 'Sistema')], default='manual', max_length=20)),
                ('previous_status_name', models.CharField(blank=True, max_length=50)),
                ('new_status_name', models.CharField(blank=True, max_length=50)),
                ('previous_availability', models.PositiveSmallIntegerField(blank=True, null=True)),
                ('new_availability', models.PositiveSmallIntegerField(blank=True, null=True)),
                ('previous_project_name', models.CharField(blank=True, max_length=200)),
                ('new_project_name', models.CharField(blank=True, max_length=200)),
                ('field_changes', models.JSONField(blank=True, default=dict)),
                ('comment', models.TextField(blank=True)),
                ('created_at', models.DateTimeField(auto_now_add=True, db_index=True)),
                ('changed_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='team_member_change_logs', to=settings.AUTH_USER_MODEL)),
                ('incident', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='change_logs', to='core.personnelincident')),
                ('member', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='change_logs', to='core.teammember')),
                ('new_project', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='team_logs_as_new_project', to='core.project')),
                ('new_status', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='change_logs_as_new', to='core.teamstatus')),
                ('previous_project', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='team_logs_as_previous_project', to='core.project')),
                ('previous_status', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='change_logs_as_previous', to='core.teamstatus')),
            ],
            options={
                'verbose_name': 'Cambio de Estado del Personal',
                'verbose_name_plural': 'Historial de Cambios del Personal',
                'ordering': ['-created_at', '-id'],
            },
        ),
        migrations.AddIndex(
            model_name='personnelincident',
            index=models.Index(fields=['member', 'start_date', 'end_date'], name='core_person_member__2543ec_idx'),
        ),
        migrations.AddIndex(
            model_name='personnelincident',
            index=models.Index(fields=['workflow_status', 'end_date'], name='core_person_workflo_ba723a_idx'),
        ),
        migrations.AddConstraint(
            model_name='personnelincident',
            constraint=models.CheckConstraint(condition=models.Q(('end_date__gte', models.F('start_date'))), name='personnel_incident_valid_date_range'),
        ),
        migrations.AddConstraint(
            model_name='personnelincident',
            constraint=models.CheckConstraint(condition=models.Q(('availability__gte', 0), ('availability__lte', 100)), name='personnel_incident_availability_0_100'),
        ),
        migrations.AddIndex(
            model_name='teammemberchangelog',
            index=models.Index(fields=['member', 'created_at'], name='core_teamme_member__3aa81c_idx'),
        ),
        migrations.AddIndex(
            model_name='teammemberchangelog',
            index=models.Index(fields=['source', 'created_at'], name='core_teamme_source_6a817a_idx'),
        ),
    ]
