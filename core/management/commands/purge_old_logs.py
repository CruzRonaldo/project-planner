import datetime
from django.core.management.base import BaseCommand
from django.utils import timezone
from core.models import ProjectChangeLog, SecurityAuditLog, TeamMemberChangeLog


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
            default=180,
            help="Días de retención para ProjectChangeLog (por defecto 180).",
        )
        parser.add_argument(
            '--days-team',
            type=int,
            default=180,
            help="Días de retención para TeamMemberChangeLog (por defecto 180).",
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

    def handle(self, *args, **options):
        global_days = options.get('days')
        days_project = global_days if global_days is not None else options['days_project']
        days_team = global_days if global_days is not None else options['days_team']
        days_security = global_days if global_days is not None else options['days_security']

        batch_size = options['batch_size']
        dry_run = options['dry_run']
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

        total_all_purged = 0

        for name, model_cls, days in targets:
            cutoff = now - datetime.timedelta(days=days)
            filter_kwargs = {'created_at__lt': cutoff}
            total_matching = model_cls.objects.filter(**filter_kwargs).count()

            if total_matching == 0:
                self.stdout.write(f" - {name} (> {days}d, corte {cutoff.strftime('%Y-%m-%d')}): 0 registros a purgar.")
                continue

            if dry_run:
                self.stdout.write(
                    f" - {name} (> {days}d, corte {cutoff.strftime('%Y-%m-%d')}): {total_matching} registros candidatos para eliminación."
                )
                total_all_purged += total_matching
                continue

            purged_for_model = 0
            while True:
                batch_ids = list(model_cls.objects.filter(**filter_kwargs).values_list('id', flat=True)[:batch_size])
                if not batch_ids:
                    break
                deleted_count, _ = model_cls.objects.filter(id__in=batch_ids).delete()
                purged_for_model += deleted_count

            self.stdout.write(
                self.style.SUCCESS(f" - {name} (> {days}d): {purged_for_model} registros purgados exitosamente.")
            )
            total_all_purged += purged_for_model

        if dry_run:
            self.stdout.write(
                self.style.SUCCESS(f"Simulación completa. Total de registros que serían eliminados: {total_all_purged}")
            )
        else:
            self.stdout.write(
                self.style.SUCCESS(f"Purga finalizada. Total de registros eliminados: {total_all_purged}")
            )
