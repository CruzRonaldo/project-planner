import os
import sys
import requests
from django.core.management.base import BaseCommand
from django.conf import settings
from django.db import connection
from django.utils import timezone


class Command(BaseCommand):
    help = "Verifica el tamaño de la base de datos en PostgreSQL y envía alertas si supera el 70% u 80% de 500 MB."

    def add_arguments(self, parser):
        parser.add_argument(
            '--threshold-warning',
            type=int,
            default=70,
            help="Porcentaje de advertencia (por defecto 70%%).",
        )
        parser.add_argument(
            '--threshold-critical',
            type=int,
            default=80,
            help="Porcentaje crítico (por defecto 80%%).",
        )
        parser.add_argument(
            '--webhook-url',
            type=str,
            default=None,
            help="URL del webhook de Make (Integromat) para despachar la alerta.",
        )
        parser.add_argument(
            '--mock-size-mb',
            type=float,
            default=None,
            help="Valor simulado en MB para pruebas unitarias en entornos no PostgreSQL.",
        )

    def handle(self, *args, **options):
        threshold_warn = options['threshold_warning']
        threshold_crit = options['threshold_critical']
        webhook_url = (
            options.get('webhook_url')
            or os.environ.get('MAKE_STORAGE_ALERT_WEBHOOK_URL')
            or getattr(settings, 'MAKE_STORAGE_ALERT_WEBHOOK_URL', '')
        )
        mock_size_mb = options.get('mock_size_mb')

        total_limit_mb = 500.0
        total_limit_bytes = int(total_limit_mb * 1024 * 1024)

        if mock_size_mb is not None:
            current_bytes = int(mock_size_mb * 1024 * 1024)
        elif connection.vendor == 'postgresql':
            with connection.cursor() as cursor:
                cursor.execute("SELECT pg_database_size(current_database());")
                current_bytes = cursor.fetchone()[0]
        else:
            self.stdout.write(
                self.style.WARNING("check_db_size solo aplica a PostgreSQL. Omitiendo verificación en motor local/SQLite.")
            )
            return

        current_mb = current_bytes / (1024 * 1024)
        usage_pct = (current_bytes / total_limit_bytes) * 100

        self.stdout.write(
            f"Consumo de base de datos: {current_mb:.2f} MB de {total_limit_mb:.0f} MB ({usage_pct:.1f}%)."
        )

        level = 'OK'
        if usage_pct >= threshold_crit:
            level = 'CRITICAL'
        elif usage_pct >= threshold_warn:
            level = 'WARNING'

        if level == 'OK':
            self.stdout.write(self.style.SUCCESS("Almacenamiento dentro de los límites operativos."))
            return

        status_style = self.style.ERROR if level == 'CRITICAL' else self.style.WARNING
        alert_msg = (
            f"ALERTA [{level}]: La base de datos ha alcanzado el {usage_pct:.1f}% "
            f"({current_mb:.2f} MB de {total_limit_mb:.0f} MB límite de Supabase Free Tier)."
        )
        self.stdout.write(status_style(alert_msg))

        # Enviar notificación a Webhook de Make si está configurado
        if webhook_url:
            payload = {
                'event': 'database.storage_alert',
                'level': level,
                'current_bytes': current_bytes,
                'current_mb': round(current_mb, 2),
                'limit_mb': total_limit_mb,
                'percentage': round(usage_pct, 1),
                'timestamp': timezone.now().isoformat(),
                'message': alert_msg,
            }
            try:
                resp = requests.post(webhook_url, json=payload, timeout=10)
                if resp.status_code in [200, 201, 204]:
                    self.stdout.write(self.style.SUCCESS(f"Alerta enviada exitosamente a Make ({webhook_url})."))
                else:
                    self.stdout.write(
                        self.style.WARNING(f"El webhook de Make respondió con código HTTP {resp.status_code}.")
                    )
            except Exception as exc:
                self.stdout.write(self.style.ERROR(f"Error al enviar alerta al webhook de Make: {exc}"))
        else:
            self.stdout.write(
                self.style.NOTICE("No se configuró MAKE_STORAGE_ALERT_WEBHOOK_URL. Alerta emitida únicamente en logs.")
            )
