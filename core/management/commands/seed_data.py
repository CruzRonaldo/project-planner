import datetime
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.db import transaction

from core.models import (
    TechnicalArea,
    TeamStatus,
    TeamMember,
    Project,
    Milestone,
    Task,
    PerformanceMetric,
    DriveLink,
)

User = get_user_model()


class Command(BaseCommand):
    help = "Puebla la base de datos MySQL con datos semilla coherentes (usuario normal, proyectos, hitos, tareas, métricas y enlaces)."

    def add_arguments(self, parser):
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Limpia los datos existentes antes de insertar los nuevos.',
        )

    @transaction.atomic
    def handle(self, *args, **options):
        self.stdout.write(self.style.NOTICE("\nIniciando carga de datos semilla en MySQL...\n"))

        if options.get('clear'):
            self.stdout.write(self.style.WARNING("Limpiando datos existentes de core..."))
            DriveLink.objects.all().delete()
            PerformanceMetric.objects.all().delete()
            Task.objects.all().delete()
            Milestone.objects.all().delete()
            TeamMember.objects.all().delete()
            Project.objects.all().delete()
            TechnicalArea.objects.all().delete()
            TeamStatus.objects.all().delete()

        # =========================================================================
        # 1. USUARIO NORMAL (COLABORADOR)
        # =========================================================================
        normal_username = "colaborador"
        normal_email = "colaborador@projectplanner.com"
        normal_password = "User123*"

        if not User.objects.filter(username=normal_username).exists():
            normal_user = User.objects.create_user(
                username=normal_username,
                email=normal_email,
                password=normal_password,
                is_staff=False,
                is_superuser=False,
            )
            self.stdout.write(self.style.SUCCESS(f"[OK] Usuario normal creado: {normal_username} (Clave: {normal_password})"))
        else:
            self.stdout.write(self.style.WARNING(f"[INFO] Usuario normal '{normal_username}' ya existia."))

        # =========================================================================
        # 2. ÁREAS TÉCNICAS
        # =========================================================================
        areas_data = [
            ("Arquitectura", "Diseño espacial, modelado 3D, acabados y visualización."),
            ("Estructuras", "Cálculo estructural, cimentaciones, losas y muros de concreto/acero."),
            ("Instalaciones / MEP", "Redes eléctricas, sanitarias, climatización y domótica."),
            ("Gestión de Proyectos", "Planificación, costos, control de cronograma y auditoría."),
        ]
        areas = {}
        for name, desc in areas_data:
            area, _ = TechnicalArea.objects.get_or_create(name=name, defaults={'description': desc})
            areas[name] = area
        self.stdout.write(self.style.SUCCESS(f"[OK] Areas Tecnicas listas ({len(areas)})."))

        # =========================================================================
        # 3. ESTADOS DE EQUIPO
        # =========================================================================
        statuses_data = [
            ("Active", "Personal disponible y asignado en producción continua.", "#10B981"),
            ("Stand-by", "En espera de validaciones técnicas o inicio de fase.", "#F59E0B"),
            ("Support", "Brindando asistencia técnica transversal a varios proyectos.", "#3B82F6"),
        ]
        statuses = {}
        for name, desc, color in statuses_data:
            st, _ = TeamStatus.objects.get_or_create(name=name, defaults={'description': desc, 'color_code': color})
            statuses[name] = st
        self.stdout.write(self.style.SUCCESS(f"[OK] Estados de Equipo listos ({len(statuses)})."))

        # =========================================================================
        # 4. PROYECTOS (Alineados con el Frontend)
        # =========================================================================
        today = datetime.date.today()

        projects_data = [
            {
                "code": "PRJ-2026-001",
                "name": "Torre Reforma",
                "description": "Edificación comercial corporativa de 25 niveles con certificación LEED.",
                "start_date": datetime.date(2026, 1, 15),
                "end_date": datetime.date(2026, 7, 15),
                "duration_months": 6,
                "budget": 1200000.00,
                "status": "IN_PROGRESS",
            },
            {
                "code": "PRJ-2026-002",
                "name": "Puente Industrial",
                "description": "Infraestructura vial de conexión de carga pesada sobre río.",
                "start_date": datetime.date(2026, 2, 1),
                "end_date": datetime.date(2026, 9, 1),
                "duration_months": 7,
                "budget": 900000.00,
                "status": "STAND_BY",
            },
            {
                "code": "PRJ-2026-003",
                "name": "Centro Comercial Norte",
                "description": "Complejo comercial de 3 niveles con áreas de retail, cines y estacionamientos.",
                "start_date": datetime.date(2025, 10, 1),
                "end_date": datetime.date(2026, 7, 1),
                "duration_months": 9,
                "budget": 1500000.00,
                "status": "COMPLETED",
            },
            {
                "code": "PRJ-2026-004",
                "name": "Hospital Regional",
                "description": "Equipamiento de salud pública con módulos quirúrgicos y hospitalización.",
                "start_date": datetime.date(2026, 5, 1),
                "end_date": datetime.date(2026, 12, 31),
                "duration_months": 8,
                "budget": 1100000.00,
                "status": "PLANNING",
            },
        ]

        projects = {}
        for pdata in projects_data:
            code = pdata.pop("code")
            proj, _ = Project.objects.get_or_create(code=code, defaults=pdata)
            projects[code] = proj
        self.stdout.write(self.style.SUCCESS(f"[OK] Proyectos creados ({len(projects)})."))

        # =========================================================================
        # 5. MIEMBROS DE EQUIPO (Asignados a Proyectos)
        # =========================================================================
        members_data = [
            ("Carlos", "Mendoza", "carlos.mendoza@projectplanner.com", "Modelador Revit Senior", "Arquitectura", "Active", "PRJ-2026-001"),
            ("Andrea", "Rojas", "andrea.rojas@projectplanner.com", "Ingeniera Estructural", "Estructuras", "Active", "PRJ-2026-001"),
            ("Luis", "Gonzales", "luis.gonzales@projectplanner.com", "Coordinador MEP", "Instalaciones / MEP", "Support", "PRJ-2026-001"),
            ("Jorge", "Vega", "jorge.vega@projectplanner.com", "Analista de Presupuestos", "Gestión de Proyectos", "Stand-by", "PRJ-2026-002"),
            ("Valeria", "Castro", "valeria.castro@projectplanner.com", "Arquitecta BIM", "Arquitectura", "Active", "PRJ-2026-004"),
        ]

        members = {}
        for fname, lname, email, role, area_name, status_name, proj_code in members_data:
            member, _ = TeamMember.objects.get_or_create(
                email=email,
                defaults={
                    "first_name": fname,
                    "last_name": lname,
                    "role": role,
                    "technical_area": areas[area_name],
                    "status": statuses[status_name],
                    "project": projects[proj_code],
                    "is_active": True,
                }
            )
            members[email] = member
        self.stdout.write(self.style.SUCCESS(f"[OK] Miembros del Equipo asignados ({len(members)})."))

        # =========================================================================
        # 6. HITOS ESTRATÉGICOS (Milestones)
        # =========================================================================
        p1 = projects["PRJ-2026-001"]
        milestones_data = [
            (p1, "Entrega Cimentación", "Fin de vaciado de zapatas y muros de contención.", datetime.date(2026, 3, 15), datetime.date(2026, 3, 14), "COMPLETED"),
            (p1, "Revisión Estructural Niveles 1-10", "Aprobación de cálculos por supervisor externo.", datetime.date(2026, 5, 30), None, "IN_PROGRESS"),
            (p1, "Inauguración y Entrega Fase 1", "Hito contractual de entrega de obra gruesa.", datetime.date(2026, 7, 15), None, "PENDING"),
        ]
        created_milestones = []
        for proj, name, desc, t_date, c_date, m_status in milestones_data:
            m, _ = Milestone.objects.get_or_create(
                project=proj,
                name=name,
                defaults={
                    "description": desc,
                    "target_date": t_date,
                    "completed_date": c_date,
                    "status": m_status,
                }
            )
            created_milestones.append(m)
        self.stdout.write(self.style.SUCCESS(f"[OK] Hitos estrategicos registrados ({len(created_milestones)})."))

        # =========================================================================
        # 7. TAREAS Y RUTA CRÍTICA (Tasks)
        # =========================================================================
        t1, _ = Task.objects.get_or_create(
            project=p1,
            title="Excavación y Cimentación Profunda",
            defaults={
                "category": areas["Estructuras"],
                "assigned_to": members["andrea.rojas@projectplanner.com"],
                "milestone": created_milestones[0],
                "description": "Vaciado de concreto ciclópeo y colocación de armaduras.",
                "start_date": datetime.date(2026, 1, 20),
                "end_date": datetime.date(2026, 3, 10),
                "duration_days": 50,
                "progress": 100,
                "is_critical_path": True,
                "tolerance_days": 7,
                "status": "DONE",
            }
        )

        t2, _ = Task.objects.get_or_create(
            project=p1,
            title="Montaje de Estructura Metálica Niveles 1-5",
            defaults={
                "category": areas["Estructuras"],
                "assigned_to": members["andrea.rojas@projectplanner.com"],
                "milestone": created_milestones[1],
                "description": "Montaje de vigas principales y perfiles estructurales de acero.",
                "start_date": datetime.date(2026, 3, 12),
                "end_date": datetime.date(2026, 4, 30),
                "duration_days": 49,
                "progress": 70,
                "is_critical_path": True,
                "tolerance_days": 7,
                "status": "IN_PROGRESS",
            }
        )
        t2.predecessors.add(t1)

        t3, _ = Task.objects.get_or_create(
            project=p1,
            title="Modelado BIM de Redes Sanitarias y Eléctricas",
            defaults={
                "category": areas["Instalaciones / MEP"],
                "assigned_to": members["luis.gonzales@projectplanner.com"],
                "milestone": created_milestones[1],
                "description": "Coordinación y detección de interferencias en Navisworks.",
                "start_date": datetime.date(2026, 3, 15),
                "end_date": datetime.date(2026, 4, 20),
                "duration_days": 36,
                "progress": 45,
                "is_critical_path": False,
                "tolerance_days": 0,
                "status": "IN_PROGRESS",
            }
        )

        t4, _ = Task.objects.get_or_create(
            project=p1,
            title="Diseño de Muros Cortina y Fachada Vidriada",
            defaults={
                "category": areas["Arquitectura"],
                "assigned_to": members["carlos.mendoza@projectplanner.com"],
                "milestone": created_milestones[2],
                "description": "Especificaciones técnicas de perfiles de aluminio y vidrios dobles insulados.",
                "start_date": datetime.date(2026, 5, 1),
                "end_date": datetime.date(2026, 6, 20),
                "duration_days": 50,
                "progress": 15,
                "is_critical_path": True,
                "tolerance_days": 7,
                "status": "TODO",
            }
        )
        t4.predecessors.add(t2)
        self.stdout.write(self.style.SUCCESS("[OK] Tareas con dependencias y Ruta Critica configuradas."))

        # =========================================================================
        # 8. MÉTRICAS DE RENDIMIENTO (PerformanceMetric para el Optimizador)
        # =========================================================================
        pm, _ = PerformanceMetric.objects.get_or_create(
            project=p1,
            unit="M2 de Encofrado y Vaciado",
            defaults={
                "task": t2,
                "quantity": 2500.00,
                "rate_per_day": 65.00,
                "divisor": 5,
            }
        )
        self.stdout.write(self.style.SUCCESS("[OK] Metrica de rendimiento para optimizador vinculada."))

        # =========================================================================
        # 9. ENLACES DE GOOGLE DRIVE (DriveLinks)
        # =========================================================================
        links_data = [
            (t2, "Modelo Estructural Revit 2026", "https://drive.google.com/file/d/1A2B3C4D5E6F7G8H9-RevitStructure/view", "1A2B3C4D5E6F7G8H9", "BIM_MODEL"),
            (t3, "Carpeta de Entregables MEP Coordinados", "https://drive.google.com/drive/folders/1X9Y8Z7W6V5U4T3-MEPFolder", "1X9Y8Z7W6V5U4T3", "FOLDER"),
            (t4, "Render 360 Fachada Exterior", "https://drive.google.com/file/d/1R2E3N4D5E6R7-Fachada360/view", "1R2E3N4D5E6R7", "RENDER_360"),
        ]
        for task, title, url, fid, ftype in links_data:
            DriveLink.objects.get_or_create(
                task=task,
                title=title,
                defaults={"drive_url": url, "file_id": fid, "file_type": ftype}
            )
        self.stdout.write(self.style.SUCCESS(f"[OK] Enlaces documentales de Drive asociados ({len(links_data)})."))

        self.stdout.write(self.style.SUCCESS("\n========================================================"))
        self.stdout.write(self.style.SUCCESS("  BASE DE DATOS POBLADA EXITOSAMENTE CON DATOS SEMILLA"))
        self.stdout.write(self.style.SUCCESS("========================================================\n"))
