import datetime
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.db import transaction

from core.models import (
    TechnicalArea,
    Role,
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
    help = "Puebla la base de datos MySQL con datos semilla coherentes (áreas: Sistemas, Civil, Arquitectura, roles, miembros, proyectos, etc.)."

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
            Role.objects.all().delete()
            TechnicalArea.objects.all().delete()
            TeamStatus.objects.all().delete()
            # Limpiar usuarios anteriores que no sean superadministradores
            User.objects.filter(is_superuser=False).delete()

        # =========================================================================
        # 1. USUARIOS POR ÁREA TÉCNICA (Sistemas, Civil, Arquitectura)
        # =========================================================================
        # Eliminar específicamente usuario 'colaborador' si aún existe
        User.objects.filter(username="colaborador").delete()

        users_by_area = [
            {
                "username": "sistemas",
                "email": "sistemas@projectplanner.com",
                "first_name": "Luis",
                "last_name": "Gonzales (Sistemas)",
                "password": "User123*",
            },
            {
                "username": "civil",
                "email": "civil@projectplanner.com",
                "first_name": "Andrea",
                "last_name": "Rojas (Civil)",
                "password": "User123*",
            },
            {
                "username": "arquitectura",
                "email": "arquitectura@projectplanner.com",
                "first_name": "Carlos",
                "last_name": "Mendoza (Arquitectura)",
                "password": "User123*",
            },
        ]

        for udata in users_by_area:
            uname = udata["username"]
            u_obj = User.objects.filter(username=uname).first()
            if not u_obj:
                u_obj = User.objects.create_user(
                    username=uname,
                    email=udata["email"],
                    password=udata["password"],
                    first_name=udata["first_name"],
                    last_name=udata["last_name"],
                    is_staff=False,
                    is_superuser=False,
                )
                self.stdout.write(self.style.SUCCESS(f"[OK] Usuario creado: '{uname}' ({udata['last_name']}) | Clave: '{udata['password']}'"))
            else:
                self.stdout.write(self.style.WARNING(f"[INFO] Usuario '{uname}' ya existia."))

        # =========================================================================
        # 2. ÁREAS TÉCNICAS (Sistemas, Civil, Arquitectura)
        # =========================================================================
        areas_data = [
            ("Sistemas", "Desarrollo de software, infraestructura TI, bases de datos y soporte digital."),
            ("Civil", "Cálculo estructural, obras civiles, cimentaciones y mecánica de suelos."),
            ("Arquitectura", "Diseño espacial, modelado 3D / BIM, acabados y visualización."),
        ]
        areas = {}
        for name, desc in areas_data:
            area, _ = TechnicalArea.objects.get_or_create(name=name, defaults={'description': desc})
            areas[name] = area
        self.stdout.write(self.style.SUCCESS(f"[OK] Areas Tecnicas listas ({len(areas)}): Sistemas, Civil, Arquitectura."))

        # =========================================================================
        # 3. ROLES TÉCNICOS POR ÁREA (Con Funciones y Capacidades)
        # =========================================================================
        roles_data = [
            # (area, nombre_rol, funciones/descripcion, can_manage_projects, can_manage_tasks, can_view_metrics)
            ("Sistemas", "Desarrollador Full Stack", "Desarrollo de módulos frontend y backend, integración de APIs y pruebas unitarias.", False, True, True),
            ("Sistemas", "Administrador de Base de Datos (DBA)", "Modelado relacional, optimización de consultas SQL, integridad y respaldos.", False, True, True),
            ("Sistemas", "Ingeniero DevOps / Infraestructura", "Gestión de servidores, contenedores Docker, pipelines CI/CD y monitoreo de nube.", True, True, True),

            ("Civil", "Ingeniero Residente", "Supervisión técnica de obra en campo, cumplimiento del cronograma y control de calidad.", True, True, True),
            ("Civil", "Calculista Estructural", "Análisis y cálculo de estructuras de concreto y acero, memorias de cálculo y resistencia sísmica.", False, True, True),
            ("Civil", "Topógrafo / Especialista en Suelos", "Levantamiento topográfico, estudios de mecánica de suelos y control de niveles.", False, True, True),

            ("Arquitectura", "Modelador BIM / Revit", "Modelado paramétrico en Revit, coordinación interdisciplinaria y detección de colisiones.", False, True, True),
            ("Arquitectura", "Renderista / Visualizador 3D", "Generación de imágenes hiperrealistas, postproducción y recorridos virtuales 360°.", False, True, True),
            ("Arquitectura", "Diseñador Arquitectónico", "Conceptualización formal, planos de distribución, selección de acabados y fachadas.", True, True, True),
        ]
        roles = {}
        for area_name, role_name, desc, can_proj, can_task, can_metrics in roles_data:
            role_obj, _ = Role.objects.get_or_create(
                technical_area=areas[area_name],
                name=role_name,
                defaults={
                    'description': desc,
                    'can_manage_projects': can_proj,
                    'can_manage_tasks': can_task,
                    'can_view_metrics': can_metrics,
                }
            )
            roles[(area_name, role_name)] = role_obj
        self.stdout.write(self.style.SUCCESS(f"[OK] Roles Tecnicos con funciones registrados ({len(roles)})."))

        # =========================================================================
        # 4. ESTADOS DE EQUIPO
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
        # 6. MIEMBROS DE EQUIPO (Asignados a Roles, Áreas y Proyectos)
        # =========================================================================
        members_data = [
            ("Carlos", "Mendoza", "carlos.mendoza@projectplanner.com", "Modelador BIM / Revit", "Arquitectura", "Active", "PRJ-2026-001"),
            ("Andrea", "Rojas", "andrea.rojas@projectplanner.com", "Calculista Estructural", "Civil", "Active", "PRJ-2026-001"),
            ("Luis", "Gonzales", "luis.gonzales@projectplanner.com", "Desarrollador Full Stack", "Sistemas", "Support", "PRJ-2026-001"),
            ("Jorge", "Vega", "jorge.vega@projectplanner.com", "Ingeniero Residente", "Civil", "Stand-by", "PRJ-2026-002"),
            ("Valeria", "Castro", "valeria.castro@projectplanner.com", "Diseñador Arquitectónico", "Arquitectura", "Active", "PRJ-2026-004"),
        ]

        members = {}
        for fname, lname, email, role_name, area_name, status_name, proj_code in members_data:
            member, _ = TeamMember.objects.get_or_create(
                email=email,
                defaults={
                    "first_name": fname,
                    "last_name": lname,
                    "role": roles[(area_name, role_name)],
                    "technical_area": areas[area_name],
                    "status": statuses[status_name],
                    "project": projects[proj_code],
                    "is_active": True,
                }
            )
            members[email] = member
        self.stdout.write(self.style.SUCCESS(f"[OK] Miembros del Equipo asignados ({len(members)})."))

        # =========================================================================
        # 7. HITOS ESTRATÉGICOS (Milestones)
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
        # 8. TAREAS Y RUTA CRÍTICA (Tasks)
        # =========================================================================
        t1, _ = Task.objects.get_or_create(
            project=p1,
            title="Excavación y Cimentación Profunda",
            defaults={
                "category": areas["Civil"],
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
                "category": areas["Civil"],
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
            title="Implementación de Infraestructura Digital y Red Troncal",
            defaults={
                "category": areas["Sistemas"],
                "assigned_to": members["luis.gonzales@projectplanner.com"],
                "milestone": created_milestones[1],
                "description": "Instalación de servidores locales, centro de telecomunicaciones y switches de red.",
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
        # 9. MÉTRICAS DE RENDIMIENTO (PerformanceMetric para el Optimizador)
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
        # 10. ENLACES DE GOOGLE DRIVE (DriveLinks)
        # =========================================================================
        links_data = [
            (t2, "Modelo Estructural Revit 2026", "https://drive.google.com/file/d/1A2B3C4D5E6F7G8H9-RevitStructure/view", "1A2B3C4D5E6F7G8H9", "BIM_MODEL"),
            (t3, "Carpeta de Planos de Redes y Telecomunicaciones", "https://drive.google.com/drive/folders/1X9Y8Z7W6V5U4T3-ITFolder", "1X9Y8Z7W6V5U4T3", "FOLDER"),
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
