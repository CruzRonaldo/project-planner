from django.core.management.base import BaseCommand, CommandError
from core.services.database_backups import BackupError, create_backup


class Command(BaseCommand):
    help = "Genera un respaldo PostgreSQL custom con metadatos e integridad SHA-256."

    def add_arguments(self, parser):
        parser.add_argument("--source", choices=["manual", "automatic"], default="manual")

    def handle(self, *args, **options):
        try:
            path = create_backup(source=options["source"], created_by="terminal")
        except (BackupError, OSError) as error:
            raise CommandError(str(error)) from error
        self.stdout.write(self.style.SUCCESS("Respaldo generado correctamente."))
        self.stdout.write(f"Archivo: {path}")
        self.stdout.write(f"Tamaño: {path.stat().st_size:,} bytes")
        return str(path)
