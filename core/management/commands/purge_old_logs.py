import datetime
import time
from django.core.management.base import BaseCommand
from django.utils import timezone
from core.models import ProjectChangeLog, SecurityAuditLog, TeamMemberChangeLog, AuditPurgeLog


class Command(BaseCommand):
    help = "Purga registros antiguos de auditoría en lotes con políticas de retención diferenciadas por tabla."

    def add_arguments(self, parser):
        parser.add_argument(
            '--days',
            type=int,
            default=None,
            help="Sobrescribe los días de retención para todas las tablas simultáneamente.",
        )
        parser.add_argument(
            '--days-project',
            type=int,
            default=195,
            help="Días de retención para ProjectChangeLog (por defecto 195 - ventana semestral protegida).",
        )
        parser.add_argument(
            '--days-team',
            type=int,
            default=195,
            help="Días de retención para TeamMemberChangeLog (por defecto 195 - ventana semestral protegida).",
        )
        parser.add_argument(
            '--days-security',
            type=int,
            default=365,
            help="Días de retención para SecurityAuditLog (por defecto 365 - evidencia de credenciales).",
        )
        parser.add_argument(
            '--batch-size',
            type=int,
            default=5000,
            help="Tamaño de lote para borrado por iteración (por defecto 5000).",
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help="Simula la purga sin borrar registros de la base de datos.",
        )
        parser.add_argument(
            '--triggered-by',
            type=str,
            default='CRON_JOB',
            help="Identificador del originador de la purga (CRON_JOB, MANUAL, GITHUB_ACTION, etc.).",
        )

    def handle(self, *args, **options):
        start_time = time.time()
        global_days = options.get('days')
        days_project = global_days if global_days is not None else options['days_project']
        days_team = global_days if global_days is not None else options['days_team']
        days_security = global_days if global_days is not None else options['days_security']

        batch_size = options['batch_size']
        dry_run = options['dry_run']
        triggered_by = options.get('triggered_by') or 'CRON_JOB'
        now = timezone.now()

        self.stdout.write(
            f"Iniciando purga de bitácoras (Project: {days_project}d, Team: {days_team}d, Security: {days_security}d)..."
        )
        if dry_run:
            self.stdout.write(self.style.WARNING("MODO DRY-RUN ACTIVADO: Ningún registro será eliminado."))

        targets = [
            ("ProjectChangeLog", ProjectChangeLog, days_project),
            ("TeamMemberChangeLog", TeamMemberChangeLog, days_team),
            ("SecurityAuditLog", SecurityAuditLog, days_security),
        ]

        purged_counts = {
            'ProjectChangeLog': 0,
            'TeamMemberChangeLog': 0,
            'SecurityAuditLog': 0,
        }
        notes_lines = []
        total_all_purged = 0

        for name, model_cls, days in targets:
            cutoff = now - datetime.timedelta(days=days)
            filter_kwargs = {'created_at__lt': cutoff}
            total_matching = model_cls.objects.filter(**filter_kwargs).count()

            if total_matching == 0:
                msg = f" - {name} (> {days}d, corte {cutoff.strftime('%Y-%m-%d')}): 0 registros a purgar."
                self.stdout.write(msg)
                notes_lines.append(f"{name}: 0")
                continue

            if dry_run:
                msg = f" - {name} (> {days}d, corte {cutoff.strftime('%Y-%m-%d')}): {total_matching} registros candidatos para eliminación."
                self.stdout.write(msg)
                purged_counts[name] = total_matching
                total_all_purged += total_matching
                notes_lines.append(f"{name}: {total_matching} candidatos")
                continue

            purged_for_model = 0
            while True:
                batch_ids = list(model_cls.objects.filter(**filter_kwargs).values_list('id', flat=True)[:batch_size])
                if not batch_ids:
                    break
                deleted_count, _ = model_cls.objects.filter(id__in=batch_ids).delete()
                purged_for_model += deleted_count

            msg = f" - {name} (> {days}d): {purged_for_model} registros purgados exitosamente."
            self.stdout.write(self.style.SUCCESS(msg))
            purged_counts[name] = purged_for_model
            total_all_purged += purged_for_model
            notes_lines.append(f"{name}: {purged_for_model} purgados")

        duration = time.time() - start_time

        if dry_run:
            self.stdout.write(
                self.style.SUCCESS(f"Simulación completa. Total de registros que serían eliminados: {total_all_purged}")
            )
        else:
            self.stdout.write(
                self.style.SUCCESS(f"Purga finalizada. Total de registros eliminados: {total_all_purged}")
            )

        # Registro persistente en AuditPurgeLog
        try:
            purge_log = AuditPurgeLog.objects.create(
                triggered_by=triggered_by,
                project_logs_purged=purged_counts['ProjectChangeLog'],
                team_logs_purged=purged_counts['TeamMemberChangeLog'],
                security_logs_purged=purged_counts['SecurityAuditLog'],
                total_purged=total_all_purged,
                execution_time_seconds=round(duration, 3),
                was_dry_run=dry_run,
                status='SUCCESS',
                notes="; ".join(notes_lines),
            )
            self.stdout.write(
                self.style.SUCCESS(f"Registro de purga guardado en base de datos (ID #{purge_log.id}).")
            )
        except Exception as exc:
            self.stdout.write(
                self.style.ERROR(f"Error al guardar registro de purga en AuditPurgeLog: {exc}")
            )
