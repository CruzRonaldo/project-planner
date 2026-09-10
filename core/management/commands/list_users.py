from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

User = get_user_model()


class Command(BaseCommand):
    help = "Lista todos los usuarios registrados en el sistema (Administradores y Estándar)."

    def handle(self, *args, **options):
        users = User.objects.all().order_by('id')
        total = users.count()

        if total == 0:
            self.stdout.write(self.style.WARNING("\nNo hay usuarios registrados en la base de datos.\n"))
            return

        self.stdout.write(self.style.SUCCESS(f"\n=== LISTA DE USUARIOS REGISTRADOS ({total}) ===\n"))

        # Encabezado de la tabla
        header = f"{'ID':<4} | {'Usuario':<16} | {'Nombre / Área':<28} | {'Email':<32} | {'Nivel':<18} | {'Estado':<10}"
        separator = "-" * len(header)
        self.stdout.write(header)
        self.stdout.write(separator)

        for u in users:
            # Determinamos el rol
            if u.is_superuser:
                role = "Superadministrador"
            elif u.is_staff:
                role = "Staff / Gestor"
            else:
                role = "Usuario Estandar"

            status = "Activo" if u.is_active else "Inactivo"
            email = u.email if u.email else "(sin email)"
            full_name = f"{u.first_name} {u.last_name}".strip() or "-"

            row = f"{u.id:<4} | {u.username:<16} | {full_name:<28} | {email:<32} | {role:<18} | {status:<10}"
            
            if u.is_superuser:
                self.stdout.write(self.style.SUCCESS(row))
            else:
                self.stdout.write(row)

        self.stdout.write(separator)
        self.stdout.write("\n")
