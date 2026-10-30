import datetime
import uuid
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.db import transaction
from django.utils import timezone

from core.models import (
    TechnicalArea,
    Role,
    TeamStatus,
    TeamMember,
    PersonnelIncident,
    TeamMemberChangeLog,
    Project,
    Milestone,
    Task,
    PerformanceMetric,
    DriveLink,
    ProjectMeeting,
    ProjectChangeLog,
    ScheduleAdjustment,
)

User = get_user_model()


class Command(BaseCommand):
    help = "Puebla la base de datos con un ecosistema completo y realista de datos semilla (20 proyectos, 18 técnicos, 52 hitos, tareas operativas, incidencias y auditoría)."

    def add_arguments(self, parser):
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Elimina todos los datos de áreas, roles, miembros, proyectos, hitos e incidencias antes de insertar las semillas.',
        )
        parser.add_argument(
            '--demo-projects',
            action='store_true',
            help='Inserta proyectos, hitos, órdenes, incidencias y auditoría de demostración.',
        )

    @transaction.atomic
    def handle(self, *args, **options):
        self.stdout.write(self.style.NOTICE("\nIniciando carga completa de datos semilla en la Base de Datos...\n"))

        if options.get('clear'):
            self.stdout.write(self.style.WARNING("Limpiando datos existentes de core..."))
            ScheduleAdjustment.objects.all().delete()
            ProjectChangeLog.objects.all().delete()
            ProjectMeeting.objects.all().delete()
            DriveLink.objects.all().delete()
            PerformanceMetric.objects.all().delete()
            Task.objects.all().delete()
            Milestone.objects.all().delete()
            TeamMemberChangeLog.objects.all().delete()
            PersonnelIncident.objects.all().delete()
            TeamMember.objects.all().delete()
            Project.objects.all().delete()
            Role.objects.all().delete()
            TechnicalArea.objects.all().delete()
            TeamStatus.objects.all().delete()
            User.objects.filter(is_superuser=False).delete()

        # =========================================================================
        # 1. USUARIOS POR ÁREA TÉCNICA
        # =========================================================================
        User.objects.filter(username="colaborador").delete()

        users_by_area = [
            # Sistemas
            {"username": "admin_sistemas", "email": "admin.sistemas@projectplanner.com", "first_name": "Luis", "last_name": "Gonzales (Admin Sistemas)", "password": "password123", "role": "admin"},
            {"username": "dev_sistemas", "email": "dev.sistemas@projectplanner.com", "first_name": "Javier", "last_name": "Peña (Dev Sistemas)", "password": "password123", "role": "team_member"},
            # Civil
            {"username": "admin_civil", "email": "admin.civil@projectplanner.com", "first_name": "Andrea", "last_name": "Rojas (Admin Civil)", "password": "password123", "role": "admin"},
            {"username": "dev_civil", "email": "dev.civil@projectplanner.com", "first_name": "Mateo", "last_name": "Castro (Dev Civil)", "password": "password123", "role": "team_member"},
            # Arquitectura
            {"username": "admin_arquitectura", "email": "admin.arquitectura@projectplanner.com", "first_name": "Carlos", "last_name": "Mendoza (Admin Arq)", "password": "password123", "role": "admin"},
            {"username": "dev_arquitectura", "email": "dev.arquitectura@projectplanner.com", "first_name": "Sofía", "last_name": "Torres (Dev Arq)", "password": "password123", "role": "team_member"},
        ]

        for udata in users_by_area:
            uname = udata["username"]
            if not User.objects.filter(username=uname).exists():
                User.objects.create_user(
                    username=uname,
                    email=udata["email"],
                    password=udata["password"],
                    first_name=udata["first_name"],
                    last_name=udata["last_name"],
                    is_staff=False,
                    is_superuser=False,
                )
                self.stdout.write(self.style.SUCCESS(f"[OK] Usuario creado: '{uname}' ({udata['last_name']})"))
            else:
                self.stdout.write(self.style.WARNING(f"[INFO] Usuario '{uname}' ya existía."))

        # =========================================================================
        # 2. ÁREAS TÉCNICAS
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
        self.stdout.write(self.style.SUCCESS(f"[OK] Áreas Técnicas listas ({len(areas)}): Sistemas, Civil, Arquitectura."))

        # =========================================================================
        # 3. ROLES TÉCNICOS POR ÁREA
        # =========================================================================
        roles_data = [
            ("Sistemas", "Desarrollador Full Stack", "Desarrollo frontend y backend, integración de APIs y pruebas.", False, True, True),
            ("Sistemas", "Administrador de Base de Datos (DBA)", "Modelado relacional, consultas SQL y respaldos.", False, True, True),
            ("Sistemas", "Ingeniero DevOps / Infraestructura", "Gestión de servidores, Docker, CI/CD y monitoreo.", True, True, True),
            ("Sistemas", "Arquitecto de Software", "Diseño de patrones de arquitectura e interoperabilidad técnica.", True, True, True),

            ("Civil", "Ingeniero Residente", "Supervisión técnica de obra en campo y control de calidad.", True, True, True),
            ("Civil", "Calculista Estructural", "Análisis y cálculo de estructuras de concreto y acero sismorresistente.", False, True, True),
            ("Civil", "Topógrafo / Especialista en Suelos", "Levantamiento topográfico y control de niveles.", False, True, True),
            ("Civil", "Supervisor de Calidad y Ensayos", "Control de ensayos de compresión de concreto y ensayos no destructivos.", False, True, True),

            ("Arquitectura", "Modelador BIM / Revit", "Modelado paramétrico en Revit y coordinación de interferencias.", False, True, True),
            ("Arquitectura", "Renderista / Visualizador 3D", "Generación de renders hiperrealistas y recorridos 360°.", False, True, True),
            ("Arquitectura", "Diseñador Arquitectónico", "Planos de distribución, selección de acabados y fachadas.", True, True, True),
            ("Arquitectura", "Coordinador BIM", "Gestión de estándares BIM y compatibilización multidisciplinaria.", True, True, True),
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
        self.stdout.write(self.style.SUCCESS(f"[OK] Roles Técnicos registrados ({len(roles)})."))

        # =========================================================================
        # 4. ESTADOS DE EQUIPO
        # =========================================================================
        statuses_data = [
            ("Active", "Personal disponible y asignado en producción continua.", "#10B981"),
            ("Stand-by", "En espera de validaciones técnicas o inicio de fase.", "#F59E0B"),
            ("Support", "Brindando soporte de contingencia transversal a otros proyectos.", "#3B82F6"),
            ("Licencia", "De permiso oficial o licencia temporal aprobada.", "#EF4444"),
        ]
        statuses = {}
        for sname, sdesc, scolor in statuses_data:
            st, _ = TeamStatus.objects.get_or_create(name=sname, defaults={'description': sdesc, 'color_code': scolor})
            statuses[sname] = st
        self.stdout.write(self.style.SUCCESS(f"[OK] Estados de Equipo registrados ({len(statuses)})."))

        # =========================================================================
        # 5. PROYECTOS DEL PORTAFOLIO (20 Proyectos circulando en producción)
        # =========================================================================
        projects_data = [
            {
                "code": "PRJ-2026-001",
                "name": "Torre Reforma Norte",
                "description": "Edificación corporativa de 32 niveles con certificación LEED Gold y diseño sismorresistente.",
                "start_date": datetime.date(2026, 1, 15),
                "end_date": datetime.date(2026, 11, 30),
                "duration_months": 11,
                "budget": 4200000.00,
                "status": "IN_PROGRESS",
            },
            {
                "code": "PRJ-2026-002",
                "name": "Puente Industrial Río Verde",
                "description": "Infraestructura vial de conexión de carga pesada sobre río con vanos de 80m y vigas postensadas.",
                "start_date": datetime.date(2026, 2, 1),
                "end_date": datetime.date(2026, 9, 30),
                "duration_months": 8,
                "budget": 3800000.00,
                "status": "IN_PROGRESS",
            },
            {
                "code": "PRJ-2026-003",
                "name": "Centro Comercial San Isidro",
                "description": "Complejo comercial de 3 niveles con áreas de retail, cines y estacionamiento subterráneo.",
                "start_date": datetime.date(2025, 6, 1),
                "end_date": datetime.date(2026, 2, 28),
                "duration_months": 9,
                "budget": 1500000.00,
                "status": "COMPLETED",
            },
            {
                "code": "PRJ-2026-004",
                "name": "Hospital Regional Materno Infantil",
                "description": "Equipamiento de salud pública con módulos quirúrgicos y aislamiento sísmico basal.",
                "start_date": datetime.date(2026, 5, 1),
                "end_date": datetime.date(2026, 12, 31),
                "duration_months": 8,
                "budget": 2900000.00,
                "status": "PLANNING",
            },
            {
                "code": "PRJ-2026-005",
                "name": "Residencial Los Sauces",
                "description": "Conjunto habitacional multifamiliar de 12 pisos y 48 departamentos bioclimáticos.",
                "start_date": datetime.date(2026, 3, 1),
                "end_date": datetime.date(2026, 10, 31),
                "duration_months": 8,
                "budget": 650000.00,
                "status": "IN_PROGRESS",
            },
            {
                "code": "PRJ-2026-006",
                "name": "Planta de Tratamiento Sanitaria",
                "description": "Obra civil y electromecánica para depuración biológica de aguas residuales urbanas.",
                "start_date": datetime.date(2026, 4, 15),
                "end_date": datetime.date(2026, 11, 30),
                "duration_months": 8,
                "budget": 1800000.00,
                "status": "PLANNING",
            },
            {
                "code": "PRJ-2026-007",
                "name": "Subestación Eléctrica Este",
                "description": "Infraestructura de alta tensión 220kV para distribución eléctrica metropolitana.",
                "start_date": datetime.date(2026, 1, 10),
                "end_date": datetime.date(2026, 6, 30),
                "duration_months": 6,
                "budget": 480000.00,
                "status": "IN_PROGRESS",
            },
            {
                "code": "PRJ-2026-008",
                "name": "Terminal Terrestre Metropolitano",
                "description": "Hub intermodal de transporte de pasajeros con 30 andenes y estación de enlace.",
                "start_date": datetime.date(2026, 6, 1),
                "end_date": datetime.date(2027, 2, 28),
                "duration_months": 9,
                "budget": 3200000.00,
                "status": "PLANNING",
            },
            {
                "code": "PRJ-2026-009",
                "name": "Campus Universitario Pabellón B",
                "description": "Edificio de aulas magnas, laboratorios de cómputo y auditorio acústico.",
                "start_date": datetime.date(2026, 2, 15),
                "end_date": datetime.date(2026, 8, 31),
                "duration_months": 7,
                "budget": 820000.00,
                "status": "IN_PROGRESS",
            },
            {
                "code": "PRJ-2026-010",
                "name": "Complejo Deportivo Municipal",
                "description": "Polideportivo techado con piscina semiolímpica y graderías para 1,500 espectadores.",
                "start_date": datetime.date(2025, 8, 1),
                "end_date": datetime.date(2026, 3, 15),
                "duration_months": 8,
                "budget": 350000.00,
                "status": "COMPLETED",
            },
            {
                "code": "PRJ-2026-011",
                "name": "Túnel Interurbano Km 45",
                "description": "Túnel carretero bitubo de 1.8 km con sistema de ventilación longitudinal y galerías de escape.",
                "start_date": datetime.date(2026, 1, 5),
                "end_date": datetime.date(2026, 12, 15),
                "duration_months": 12,
                "budget": 4500000.00,
                "status": "IN_PROGRESS",
            },
            {
                "code": "PRJ-2026-012",
                "name": "Centro de Datos Tier III",
                "description": "Edificio de misión crítica con doble acometida eléctrica, generadores redundantes y climatización de precisión.",
                "start_date": datetime.date(2026, 7, 1),
                "end_date": datetime.date(2026, 12, 31),
                "duration_months": 6,
                "budget": 1300000.00,
                "status": "STAND_BY",
            },
            {
                "code": "PRJ-2026-013",
                "name": "Parque Fotovoltaico Andino",
                "description": "Planta de generación solar de 40MW con 12,000 paneles bifaciales y subestación elevadora.",
                "start_date": datetime.date(2026, 2, 1),
                "end_date": datetime.date(2026, 10, 30),
                "duration_months": 9,
                "budget": 2750000.00,
                "status": "IN_PROGRESS",
            },
            {
                "code": "PRJ-2026-014",
                "name": "Viaducto Elevado Tramo Sur",
                "description": "Viaducto de 2.4 km sobre autopista con 45 pilares circulares y vigas cajón prefabricadas.",
                "start_date": datetime.date(2026, 1, 20),
                "end_date": datetime.date(2026, 11, 15),
                "duration_months": 10,
                "budget": 3900000.00,
                "status": "IN_PROGRESS",
            },
            {
                "code": "PRJ-2026-015",
                "name": "Edificio Corporativo Costa Verde",
                "description": "Torre de oficinas frente al mar de 18 pisos con fachada de vidrio bioclimático inteligente.",
                "start_date": datetime.date(2026, 3, 10),
                "end_date": datetime.date(2026, 12, 20),
                "duration_months": 10,
                "budget": 2100000.00,
                "status": "IN_PROGRESS",
            },
            {
                "code": "PRJ-2026-016",
                "name": "Intercambio Vial El Trébol",
                "description": "Rediseño de nudo vial metropolitano con 4 ramales curvos y 2 pasos a desnivel.",
                "start_date": datetime.date(2026, 5, 15),
                "end_date": datetime.date(2027, 1, 30),
                "duration_months": 9,
                "budget": 1950000.00,
                "status": "PLANNING",
            },
            {
                "code": "PRJ-2026-017",
                "name": "Red de Distribución Gas Natural",
                "description": "Tendido urbano de 25 km de polietileno de alta densidad para suministro domiciliario y comercial.",
                "start_date": datetime.date(2026, 2, 10),
                "end_date": datetime.date(2026, 9, 15),
                "duration_months": 8,
                "budget": 1150000.00,
                "status": "IN_PROGRESS",
            },
            {
                "code": "PRJ-2026-018",
                "name": "Condominio Residencial Mirador",
                "description": "Desarrollo urbano en ladera con 3 edificios de 8 pisos y áreas verdes paisajísticas.",
                "start_date": datetime.date(2026, 3, 1),
                "end_date": datetime.date(2026, 11, 30),
                "duration_months": 9,
                "budget": 980000.00,
                "status": "IN_PROGRESS",
            },
            {
                "code": "PRJ-2026-019",
                "name": "Centro Logístico y Aduanero",
                "description": "Naves de almacenamiento de 15,000 m2 con patios de maniobra y control aduanero automatizado.",
                "start_date": datetime.date(2026, 6, 1),
                "end_date": datetime.date(2026, 12, 31),
                "duration_months": 7,
                "budget": 1650000.00,
                "status": "STAND_BY",
            },
            {
                "code": "PRJ-2026-020",
                "name": "Biblioteca Digital e Innovación",
                "description": "Recuperación de edificio patrimonial con integración de sala inmersiva y auditorio digital.",
                "start_date": datetime.date(2026, 1, 25),
                "end_date": datetime.date(2026, 8, 30),
                "duration_months": 8,
                "budget": 720000.00,
                "status": "IN_PROGRESS",
            },
        ]

        projects = {}
        if options.get("demo_projects"):
            for pdata in projects_data:
                code = pdata.pop("code")
                proj, _ = Project.objects.get_or_create(code=code, defaults=pdata)
                projects[code] = proj
            self.stdout.write(self.style.SUCCESS(f"[OK] Proyectos en circulación creados ({len(projects)})."))
        else:
            self.stdout.write(self.style.NOTICE("[INFO] Base de datos configurada sin proyectos demo."))

        # =========================================================================
        # 6. MIEMBROS DE EQUIPO (18 Técnicos distribuidos en las 3 Áreas)
        # =========================================================================
        members_data = [
            # Sistemas (6)
            ("Luis", "Gonzales", "luis.gonzales@projectplanner.com", "Desarrollador Full Stack", "Sistemas", "Support", "PRJ-2026-001", 60, 100),
            ("Javier", "Peña", "javier.pena@projectplanner.com", "Ingeniero DevOps / Infraestructura", "Sistemas", "Active", "PRJ-2026-007", 100, 100),
            ("Lucía", "Herrera", "lucia.herrera@projectplanner.com", "Administrador de Base de Datos (DBA)", "Sistemas", "Active", "PRJ-2026-012", 90, 100),
            ("Diego", "Silva", "diego.silva@projectplanner.com", "Arquitecto de Software", "Sistemas", "Active", "PRJ-2026-013", 100, 100),
            ("Camila", "Morales", "camila.morales@projectplanner.com", "Desarrollador Full Stack", "Sistemas", "Support", "PRJ-2026-009", 70, 100),
            ("Andrés", "Ríos", "andres.rios@projectplanner.com", "Ingeniero DevOps / Infraestructura", "Sistemas", "Stand-by", "PRJ-2026-020", 50, 100),

            # Civil (6)
            ("Andrea", "Rojas", "andrea.rojas@projectplanner.com", "Calculista Estructural", "Civil", "Active", "PRJ-2026-001", 100, 100),
            ("Mateo", "Castro", "mateo.castro@projectplanner.com", "Ingeniero Residente", "Civil", "Active", "PRJ-2026-002", 100, 100),
            ("Alejandro", "Ruiz", "alejandro.ruiz@projectplanner.com", "Supervisor de Calidad y Ensayos", "Civil", "Stand-by", "PRJ-2026-014", 40, 100),
            ("Natalia", "Ramos", "natalia.ramos@projectplanner.com", "Topógrafo / Especialista en Suelos", "Civil", "Active", "PRJ-2026-011", 90, 100),
            ("Gabriel", "Vargas", "gabriel.vargas@projectplanner.com", "Calculista Estructural", "Civil", "Active", "PRJ-2026-004", 100, 100),
            ("Daniel", "Paredes", "daniel.paredes@projectplanner.com", "Ingeniero Residente", "Civil", "Active", "PRJ-2026-006", 80, 100),

            # Arquitectura (6)
            ("Carlos", "Mendoza", "carlos.mendoza@projectplanner.com", "Modelador BIM / Revit", "Arquitectura", "Active", "PRJ-2026-001", 100, 100),
            ("Sofía", "Torres", "sofia.torres@projectplanner.com", "Diseñador Arquitectónico", "Arquitectura", "Active", "PRJ-2026-005", 100, 100),
            ("Elena", "Gómez", "elena.gomez@projectplanner.com", "Renderista / Visualizador 3D", "Arquitectura", "Support", "PRJ-2026-015", 60, 100),
            ("Valentina", "Díaz", "valentina.diaz@projectplanner.com", "Coordinador BIM", "Arquitectura", "Active", "PRJ-2026-009", 100, 100),
            ("Isabella", "Cruz", "isabella.cruz@projectplanner.com", "Diseñador Arquitectónico", "Arquitectura", "Stand-by", "PRJ-2026-018", 50, 100),
            ("Valeria", "Ortiz", "valeria.ortiz@projectplanner.com", "Modelador BIM / Revit", "Arquitectura", "Active", "PRJ-2026-020", 90, 100),
        ]

        members = {}
        for fname, lname, email, role_name, area_name, status_name, proj_code, workload, avail in members_data:
            member, _ = TeamMember.objects.get_or_create(
                email=email,
                defaults={
                    "first_name": fname,
                    "last_name": lname,
                    "role": roles[(area_name, role_name)],
                    "technical_area": areas[area_name],
                    "status": statuses[status_name],
                    "project": projects.get(proj_code) if options.get("demo_projects") else None,
                    "allocation_percentage": workload,
                    "availability": avail,
                    "is_active": True,
                }
            )
            members[email] = member
        self.stdout.write(self.style.SUCCESS(f"[OK] Miembros del Equipo registrados ({len(members)})."))

        # =========================================================================
        # 7. HITOS ESTRATÉGICOS (Todos los 20 Proyectos cuentan con sus propios hitos)
        # =========================================================================
        if options.get("demo_projects") and len(projects) > 0:
            milestones_seed = [
                # PRJ-2026-001: Torre Reforma Norte
                ("PRJ-2026-001", "Entrega de Cimentación y Pilotes", "Vaciado de 80 pilotes y zapatas continuas.", datetime.date(2026, 3, 15), datetime.date(2026, 3, 14), "COMPLETED"),
                ("PRJ-2026-001", "Revisión Estructural Niveles 1 al 10", "Aprobación de marcos y placas por supervisor estructural.", datetime.date(2026, 5, 30), None, "IN_PROGRESS"),
                ("PRJ-2026-001", "Inauguración y Entrega de Casco Grueso", "Hito contractual de entrega de estructura principal.", datetime.date(2026, 7, 15), None, "PENDING"),

                # PRJ-2026-002: Puente Industrial Río Verde
                ("PRJ-2026-002", "Ensayos de Mecánica de Suelos y Pilares", "Validación geotécnica en lecho de río.", datetime.date(2026, 3, 20), datetime.date(2026, 3, 18), "COMPLETED"),
                ("PRJ-2026-002", "Izaje y Montaje de Vigas Postensadas", "Montaje de 12 vigas de 40m con grúas de alto tonelaje.", datetime.date(2026, 6, 15), None, "IN_PROGRESS"),
                ("PRJ-2026-002", "Pruebas de Carga Estática y Dinámica", "Ensayos con tren de carga de 4 camiones pesados.", datetime.date(2026, 8, 25), None, "PENDING"),

                # PRJ-2026-003: Centro Comercial San Isidro
                ("PRJ-2026-003", "Cierre de Casco Estructural", "Techado completo de los 3 niveles de retail.", datetime.date(2026, 2, 10), datetime.date(2026, 2, 9), "COMPLETED"),
                ("PRJ-2026-003", "Habilitación de Locales Comerciales", "Entrega formal a los locatarios para acondicionamiento.", datetime.date(2026, 6, 20), datetime.date(2026, 6, 18), "COMPLETED"),

                # PRJ-2026-004: Hospital Regional Materno Infantil
                ("PRJ-2026-004", "Aprobación de Especialidades Sanitarias y Gases", "Validación ministerial de redes de oxígeno y vacío.", datetime.date(2026, 6, 30), None, "PENDING"),
                ("PRJ-2026-004", "Vaciado de Losas de Módulos Quirúrgicos", "Concreto especial con blindaje radiológico en salas de rayos X.", datetime.date(2026, 9, 15), None, "PENDING"),
                ("PRJ-2026-004", "Certificación de Aislamiento Sísmico Basal", "Pruebas de laboratorio de los 48 aisladores elastoméricos.", datetime.date(2026, 11, 20), None, "PENDING"),

                # PRJ-2026-005: Residencial Los Sauces
                ("PRJ-2026-005", "Excavación Masiva y Muros Pantalla", "Sostenimiento perimetral con anclajes postensados.", datetime.date(2026, 4, 15), datetime.date(2026, 4, 12), "COMPLETED"),
                ("PRJ-2026-005", "Techado de Piso Típico Nivel 8", "Vaciado monolítico de losa postensada.", datetime.date(2026, 7, 30), None, "IN_PROGRESS"),
                ("PRJ-2026-005", "Acabados Interiores y Carpintería Bioclimática", "Instalación de ventanería hermética y pisos ecoamigables.", datetime.date(2026, 10, 15), None, "PENDING"),

                # PRJ-2026-006: Planta de Tratamiento Sanitaria
                ("PRJ-2026-006", "Obra Civil de Tanques de Sedimentación", "Vaciado de muros circulares de concreto impermeable.", datetime.date(2026, 6, 15), None, "PENDING"),
                ("PRJ-2026-006", "Montaje Electromecánico de Bombas y Difusores", "Instalación de compresores y líneas de soplado de aire.", datetime.date(2026, 9, 30), None, "PENDING"),

                # PRJ-2026-007: Subestación Eléctrica Este
                ("PRJ-2026-007", "Cimentación de Transformadores de Potencia", "Bancadas de concreto armado y fosas de retención de aceite.", datetime.date(2026, 2, 28), datetime.date(2026, 2, 25), "COMPLETED"),
                ("PRJ-2026-007", "Tendido de Bandejas y Cableado de Control", "Montaje de canalizaciones e interconexión de tableros SCADA.", datetime.date(2026, 4, 30), None, "IN_PROGRESS"),
                ("PRJ-2026-007", "Pruebas de Aislamiento y Energización", "Protocolos de puesta en servicio con operador de red.", datetime.date(2026, 6, 15), None, "PENDING"),

                # PRJ-2026-008: Terminal Terrestre Metropolitano
                ("PRJ-2026-008", "Aprobación de Estudio de Impacto Vial", "Autorización de rutas de acceso y giros de transporte.", datetime.date(2026, 7, 15), None, "PENDING"),
                ("PRJ-2026-008", "Movimiento de Tierras y Pavimentación de Andenes", "Subbase granular y losas de rodadura para tránsito pesado.", datetime.date(2026, 10, 30), None, "PENDING"),
                ("PRJ-2026-008", "Estructura Metálica de Nave Central", "Montaje de cubierta espacial con perfiles tubulares.", datetime.date(2027, 1, 20), None, "PENDING"),

                # PRJ-2026-009: Campus Universitario Pabellón B
                ("PRJ-2026-009", "Aprobación Expediente Técnico BIM Integrado", "Compatibilización integral de arquitectura, estructuras y MEP.", datetime.date(2026, 3, 31), datetime.date(2026, 3, 30), "COMPLETED"),
                ("PRJ-2026-009", "Estructura de Aulas y Auditorio", "Montaje de cerchas metálicas espaciales sobre auditorio.", datetime.date(2026, 6, 15), None, "IN_PROGRESS"),
                ("PRJ-2026-009", "Instalación de Red Acústica y Climatización", "Paneles fonoabsorbentes y ductos de renovación de aire.", datetime.date(2026, 8, 15), None, "PENDING"),

                # PRJ-2026-010: Complejo Deportivo Municipal
                ("PRJ-2026-010", "Entrega de Losa y Graderías Techadas", "Pavimento deportivo sintético certificado para alta competencia.", datetime.date(2026, 1, 30), datetime.date(2026, 1, 28), "COMPLETED"),
                ("PRJ-2026-010", "Equipamiento de Piscina Semiolímpica", "Sistemas de filtración, recirculación y calentamiento solar.", datetime.date(2026, 3, 10), datetime.date(2026, 3, 9), "COMPLETED"),

                # PRJ-2026-011: Túnel Interurbano Km 45
                ("PRJ-2026-011", "Perforación y Voladura Tramo Norte", "Avance de 800m de bóveda con método NATM.", datetime.date(2026, 5, 30), None, "IN_PROGRESS"),
                ("PRJ-2026-011", "Revestimiento Definitivo con Concreto Lanzado", "Impermeabilización con geomembrana y encofrado deslizante.", datetime.date(2026, 9, 30), None, "PENDING"),
                ("PRJ-2026-011", "Instalación de Sistemas de Ventilación y Seguridad", "Ventiladores de chorro y señalización de evacuación.", datetime.date(2026, 11, 30), None, "PENDING"),

                # PRJ-2026-012: Centro de Datos Tier III
                ("PRJ-2026-012", "Validación de Acometida Eléctrica Dual", "Inspección técnica de media tensión redundante.", datetime.date(2026, 8, 15), None, "PENDING"),
                ("PRJ-2026-012", "Instalación de Piso Falso y Climatización de Precisión", "Montaje de unidades CRAC y contención de pasillos fríos.", datetime.date(2026, 11, 15), None, "PENDING"),

                # PRJ-2026-013: Parque Fotovoltaico Andino
                ("PRJ-2026-013", "Hincado de Estructuras y Montaje de Trackers", "Cimentación de postes de acero galvanizado.", datetime.date(2026, 4, 30), datetime.date(2026, 4, 28), "COMPLETED"),
                ("PRJ-2026-013", "Instalación de 12,000 Paneles Bifaciales", "Conexión en serie de módulos monocristalinos.", datetime.date(2026, 7, 31), None, "IN_PROGRESS"),
                ("PRJ-2026-013", "Interconexión y Pruebas a la Red Nacional", "Sincronización con el sistema interconectado.", datetime.date(2026, 10, 15), None, "PENDING"),

                # PRJ-2026-014: Viaducto Elevado Tramo Sur
                ("PRJ-2026-014", "Cimentación Profunda de 45 Pilares", "Excavación con barrena continua y armaduras de refuerzo.", datetime.date(2026, 4, 15), datetime.date(2026, 4, 10), "COMPLETED"),
                ("PRJ-2026-014", "Lanzamiento de Vigas Cajón Prefabricadas", "Montaje nocturno de superestructura con grúas telescópicas.", datetime.date(2026, 8, 15), None, "IN_PROGRESS"),
                ("PRJ-2026-014", "Pavimentación Asfáltica y Defensas Metálicas", "Carpeta de rodadura con polímeros y barreras New Jersey.", datetime.date(2026, 10, 31), None, "PENDING"),

                # PRJ-2026-015: Edificio Corporativo Costa Verde
                ("PRJ-2026-015", "Excavación y Muros de Contención Subterráneos", "Muros anclados para 4 niveles de sótano.", datetime.date(2026, 5, 15), datetime.date(2026, 5, 12), "COMPLETED"),
                ("PRJ-2026-015", "Estructura de Concreto Armado hasta Piso 15", "Vaciado continuo de losas postensadas.", datetime.date(2026, 9, 30), None, "IN_PROGRESS"),
                ("PRJ-2026-015", "Instalación de Fachada Termoacústica Inteligente", "Paneles de doble acristalamiento hermético low-e.", datetime.date(2026, 12, 10), None, "PENDING"),

                # PRJ-2026-016: Intercambio Vial El Trébol
                ("PRJ-2026-016", "Aprobación de Diseños Geométricos y Rasantes", "Modelado BIM vial y simulación de tráfico vehicular.", datetime.date(2026, 7, 31), None, "PENDING"),
                ("PRJ-2026-016", "Construcción de Pasos a Desnivel y Rampas", "Estructuras aporticadas y muros de tierra armada.", datetime.date(2026, 11, 15), None, "PENDING"),

                # PRJ-2026-017: Red de Distribución Gas Natural
                ("PRJ-2026-017", "Zanjeo y Tendido de Tubería PEAD", "Soldadura por electrofusión en redes matrices.", datetime.date(2026, 4, 30), datetime.date(2026, 4, 25), "COMPLETED"),
                ("PRJ-2026-017", "Pruebas Neumáticas de Hermeticidad", "Presurización con nitrógeno a 100 psi durante 24 horas.", datetime.date(2026, 7, 15), None, "IN_PROGRESS"),
                ("PRJ-2026-017", "Instalación de Estaciones de Regulación ERM", "Válvulas de corte rápido y telemetría remota.", datetime.date(2026, 9, 1), None, "PENDING"),

                # PRJ-2026-018: Condominio Residencial Mirador
                ("PRJ-2026-018", "Plataformas y Muros de Suelo Reforzado", "Estabilización de taludes con geomallas y gaviones.", datetime.date(2026, 5, 20), datetime.date(2026, 5, 18), "COMPLETED"),
                ("PRJ-2026-018", "Techado de Bloques A y B", "Estructura aporticada con ladrillos sísmicos.", datetime.date(2026, 8, 31), None, "IN_PROGRESS"),
                ("PRJ-2026-018", "Entrega de Áreas Comunes y Paisajismo", "Zonas recreativas, senderos y arborización nativa.", datetime.date(2026, 11, 15), None, "PENDING"),

                # PRJ-2026-019: Centro Logístico y Aduanero
                ("PRJ-2026-019", "Vaciado de Losas Industriales de Alta Carga", "Piso pulido con fibra metálica resistente a 8 ton/m2.", datetime.date(2026, 8, 30), None, "PENDING"),
                ("PRJ-2026-019", "Montaje de Racks Automatizados y Rociadores", "Sistema de almacenamiento vertical y red de agua contra incendio.", datetime.date(2026, 11, 30), None, "PENDING"),

                # PRJ-2026-020: Biblioteca Digital e Innovación
                ("PRJ-2026-020", "Restauración de Estructura Patrimonial", "Consolidación de muros de quincha y adobe reforzado.", datetime.date(2026, 3, 31), datetime.date(2026, 3, 29), "COMPLETED"),
                ("PRJ-2026-020", "Implementación de Red Óptica y Data Center", "Cableado estructurado Cat 6A y salas de servidores.", datetime.date(2026, 6, 30), None, "IN_PROGRESS"),
                ("PRJ-2026-020", "Acondicionamiento Interior y Mobiliario Tecnológico", "Instalación de pantallas interactivas y cabinas de estudio.", datetime.date(2026, 8, 20), None, "PENDING"),
            ]

            created_milestones = {}
            for proj_code, name, desc, t_date, c_date, m_status in milestones_seed:
                if proj_code in projects:
                    m, _ = Milestone.objects.get_or_create(
                        project=projects[proj_code],
                        name=name,
                        defaults={
                            "description": desc,
                            "target_date": t_date,
                            "completed_date": c_date,
                            "status": m_status,
                        }
                    )
                    created_milestones[f"{proj_code}:{name}"] = m
            self.stdout.write(self.style.SUCCESS(f"[OK] Hitos estratégicos creados en los 20 proyectos ({len(created_milestones)})."))

            # =========================================================================
            # 8. TAREAS Y ÓRDENES OPERATIVAS (24 Tareas en Ruta Crítica y Operaciones)
            # =========================================================================
            tasks_seed = [
                # Torre Reforma
                ("PRJ-2026-001", "Civil", "andrea.rojas@projectplanner.com", "Excavación y Cimentación Profunda", "Vaciado de concreto ciclópeo y armaduras.", datetime.date(2026, 1, 20), datetime.date(2026, 3, 10), 50, 100, True, 7, "DONE"),
                ("PRJ-2026-001", "Civil", "andrea.rojas@projectplanner.com", "Montaje de Estructura Metálica Niveles 1-5", "Montaje de vigas principales de acero estructural.", datetime.date(2026, 3, 12), datetime.date(2026, 4, 30), 49, 70, True, 7, "IN_PROGRESS"),
                ("PRJ-2026-001", "Sistemas", "luis.gonzales@projectplanner.com", "Implementación de Red Troncal e IT", "Instalación de centros de datos y switches de piso.", datetime.date(2026, 3, 15), datetime.date(2026, 4, 20), 36, 45, False, 0, "IN_PROGRESS"),
                ("PRJ-2026-001", "Arquitectura", "carlos.mendoza@projectplanner.com", "Diseño de Muros Cortina y Vidrios Dobles", "Especificaciones técnicas de fachada acristalada.", datetime.date(2026, 5, 1), datetime.date(2026, 6, 20), 50, 15, True, 7, "TODO"),

                # Puente Industrial
                ("PRJ-2026-002", "Civil", "mateo.castro@projectplanner.com", "Perforación de Pilares en Lecho", "Perforación submarina con camisa metálica recuperable.", datetime.date(2026, 2, 10), datetime.date(2026, 3, 15), 34, 100, True, 5, "DONE"),
                ("PRJ-2026-002", "Civil", "alejandro.ruiz@projectplanner.com", "Aseguramiento de Calidad en Vaciado de Pilares", "Ensayos de esclerometría y ultrasonido de concreto.", datetime.date(2026, 3, 16), datetime.date(2026, 4, 15), 30, 85, False, 0, "IN_PROGRESS"),
                ("PRJ-2026-002", "Civil", "mateo.castro@projectplanner.com", "Montaje de Apoyos de Neopreno y Vigas", "Instalación de aisladores sísmicos de puente.", datetime.date(2026, 5, 1), datetime.date(2026, 6, 15), 45, 20, True, 7, "IN_PROGRESS"),

                # Residencial Los Sauces
                ("PRJ-2026-005", "Arquitectura", "sofia.torres@projectplanner.com", "Compatibilización BIM Arquitectura-Estructuras", "Detección de interferencias con Navisworks.", datetime.date(2026, 3, 5), datetime.date(2026, 4, 10), 36, 100, True, 5, "DONE"),
                ("PRJ-2026-005", "Civil", "andrea.rojas@projectplanner.com", "Vaciado de Muros y Placas Nivel 1 a 4", "Encofrado metálico modulado y vaciado continuo.", datetime.date(2026, 4, 15), datetime.date(2026, 6, 30), 76, 60, True, 7, "IN_PROGRESS"),

                # Subestación Eléctrica
                ("PRJ-2026-007", "Sistemas", "javier.pena@projectplanner.com", "Configuración de Servidores SCADA y Telemetría", "Instalación de RTU y protocolos IEC 61850.", datetime.date(2026, 2, 15), datetime.date(2026, 4, 15), 60, 90, True, 7, "IN_PROGRESS"),
                ("PRJ-2026-007", "Sistemas", "diego.silva@projectplanner.com", "Auditoría de Ciberseguridad de Red Eléctrica", "Pruebas de penetración y segmentación de VLANs.", datetime.date(2026, 4, 1), datetime.date(2026, 5, 15), 45, 30, False, 0, "TODO"),

                # Campus Universitario
                ("PRJ-2026-009", "Arquitectura", "valentina.diaz@projectplanner.com", "Modelado 3D de Envolvente y Auditorio", "Cálculo de confort acústico y líneas visuales.", datetime.date(2026, 3, 1), datetime.date(2026, 4, 15), 45, 100, True, 7, "DONE"),
                ("PRJ-2026-009", "Sistemas", "camila.morales@projectplanner.com", "Infraestructura WiFi 6 y Cableado Categoría 6A", "Tendido de fibra óptica monomodo vertical.", datetime.date(2026, 5, 1), datetime.date(2026, 7, 15), 75, 40, False, 0, "IN_PROGRESS"),

                # Túnel Interurbano
                ("PRJ-2026-011", "Civil", "natalia.ramos@projectplanner.com", "Control Topográfico con Escaneo Láser LiDAR", "Verificación de sobreexcavación y convergencia de túnel.", datetime.date(2026, 1, 15), datetime.date(2026, 6, 15), 150, 65, True, 10, "IN_PROGRESS"),

                # Centro de Datos Tier III
                ("PRJ-2026-012", "Sistemas", "lucia.herrera@projectplanner.com", "Diseño de Esquema de Respaldos de Alta Disponibilidad", "Configuración de replicación asíncrona multisitio.", datetime.date(2026, 7, 10), datetime.date(2026, 8, 30), 51, 10, False, 0, "TODO"),

                # Parque Fotovoltaico Andino
                ("PRJ-2026-013", "Sistemas", "diego.silva@projectplanner.com", "Sistema de Monitoreo IoT de Paneles Solares", "Integración de sensores de radiación, temperatura e inversores.", datetime.date(2026, 3, 1), datetime.date(2026, 5, 15), 75, 80, True, 5, "IN_PROGRESS"),
                ("PRJ-2026-013", "Civil", "mateo.castro@projectplanner.com", "Cimentaciones de Inversores Centrales y Transformadores", "Construcción de zapatas y canalizaciones subterráneas de media tensión.", datetime.date(2026, 3, 15), datetime.date(2026, 5, 30), 76, 75, True, 7, "IN_PROGRESS"),

                # Viaducto Elevado Tramo Sur
                ("PRJ-2026-014", "Civil", "alejandro.ruiz@projectplanner.com", "Control de Ensayos No Destructivos en Vigas Cajón", "Inspección por partículas magnéticas y ultrasonido en soldaduras.", datetime.date(2026, 4, 1), datetime.date(2026, 6, 30), 90, 70, True, 5, "IN_PROGRESS"),

                # Edificio Corporativo Costa Verde
                ("PRJ-2026-015", "Arquitectura", "elena.gomez@projectplanner.com", "Simulación Térmica y Eficiencia Energética de Fachada", "Estudio de transmitancia térmica y soleamiento en verano e invierno.", datetime.date(2026, 4, 1), datetime.date(2026, 5, 20), 50, 95, False, 0, "IN_PROGRESS"),

                # Red de Distribución Gas Natural
                ("PRJ-2026-017", "Civil", "daniel.paredes@projectplanner.com", "Inspección de Cruces Especiales bajo Vías Principales", "Perforación horizontal teledirigida para cruces de avenidas.", datetime.date(2026, 3, 10), datetime.date(2026, 5, 10), 61, 85, True, 7, "IN_PROGRESS"),

                # Condominio Residencial Mirador
                ("PRJ-2026-018", "Arquitectura", "isabella.cruz@projectplanner.com", "Planos de Distribución y Vistas Panorámicas", "Optimización de asoleamiento y ventilación cruzada en departamentos.", datetime.date(2026, 3, 15), datetime.date(2026, 5, 30), 76, 90, False, 0, "IN_PROGRESS"),

                # Biblioteca Digital e Innovación
                ("PRJ-2026-020", "Arquitectura", "valeria.ortiz@projectplanner.com", "Levantamiento Arquitectónico con Escáner 3D y Nube de Puntos", "Registro milimétrico de molduras y arcos patrimoniales para restauración.", datetime.date(2026, 2, 1), datetime.date(2026, 3, 20), 48, 100, True, 5, "DONE"),
                ("PRJ-2026-020", "Sistemas", "andres.rios@projectplanner.com", "Implementación de Red de Fibra y Puntos de Acceso WiFi", "Tendido disimulado para proteger el patrimonio arquitectónico.", datetime.date(2026, 4, 1), datetime.date(2026, 6, 15), 75, 55, False, 0, "IN_PROGRESS"),
            ]

            created_tasks = []
            for pcode, area_name, email, title, desc, s_date, e_date, duration, progress, is_cp, tol, t_status in tasks_seed:
                if pcode in projects and email in members:
                    task_obj, _ = Task.objects.get_or_create(
                        project=projects[pcode],
                        title=title,
                        defaults={
                            "category": areas[area_name],
                            "assigned_to": members[email],
                            "description": desc,
                            "start_date": s_date,
                            "end_date": e_date,
                            "duration_days": duration,
                            "progress": progress,
                            "is_critical_path": is_cp,
                            "tolerance_days": tol,
                            "status": t_status,
                        }
                    )
                    created_tasks.append(task_obj)
            self.stdout.write(self.style.SUCCESS(f"[OK] Tareas operativas registradas ({len(created_tasks)})."))

            # =========================================================================
            # 9. INCIDENCIAS DE PERSONAL (Recursos Humanos)
            # =========================================================================
            incidents_seed = [
                ("sofia.torres@projectplanner.com", "vacation", datetime.date(2026, 10, 20), datetime.date(2026, 10, 26), "Stand-by", 0, "carlos.mendoza@projectplanner.com", "Vacaciones anuales coordinadas con jefatura de área.", "approved"),
                ("elena.gomez@projectplanner.com", "training", datetime.date(2026, 10, 18), datetime.date(2026, 10, 22), "Support", 50, "valentina.diaz@projectplanner.com", "Capacitación avanzada en Unreal Engine para visualización arquitectónica.", "approved"),
                ("alejandro.ruiz@projectplanner.com", "medical-leave", datetime.date(2026, 9, 10), datetime.date(2026, 9, 17), "Stand-by", 0, "mateo.castro@projectplanner.com", "Descanso médico por intervención ambulatoria con alta médica.", "finalized"),
                ("isabella.cruz@projectplanner.com", "personal-permission", datetime.date(2026, 11, 2), datetime.date(2026, 11, 4), "Stand-by", 0, "sofia.torres@projectplanner.com", "Permiso personal sustentado por trámite notarial.", "pending"),
                ("andres.rios@projectplanner.com", "paid-leave", datetime.date(2026, 11, 10), datetime.date(2026, 11, 15), "Stand-by", 0, "javier.pena@projectplanner.com", "Licencia con goce por capacitación corporativa en seguridad.", "pending"),
                ("natalia.ramos@projectplanner.com", "training", datetime.date(2026, 10, 5), datetime.date(2026, 10, 9), "Support", 50, "mateo.castro@projectplanner.com", "Entrenamiento en estaciones totales robóticas y drones de fotogrametría.", "finalized"),
                ("luis.gonzales@projectplanner.com", "vacation", datetime.date(2026, 8, 10), datetime.date(2026, 8, 17), "Stand-by", 0, "javier.pena@projectplanner.com", "Descanso vacacional anual del segundo periodo.", "finalized"),
                ("daniel.paredes@projectplanner.com", "medical-leave", datetime.date(2026, 10, 28), datetime.date(2026, 11, 3), "Stand-by", 0, "andrea.rojas@projectplanner.com", "Afección respiratoria estacional con descanso médico acreditado.", "approved"),
            ]

            created_incidents = []
            for email, itype, s_date, e_date, res_status, avail, backup_email, reason, wf_status in incidents_seed:
                if email in members and backup_email in members:
                    inc_obj, _ = PersonnelIncident.objects.get_or_create(
                        member=members[email],
                        incident_type=itype,
                        start_date=s_date,
                        end_date=e_date,
                        defaults={
                            "resulting_status": statuses[res_status],
                            "availability": avail,
                            "backup_member": members[backup_email],
                            "reason": reason,
                            "workflow_status": wf_status,
                        }
                    )
                    created_incidents.append(inc_obj)
            self.stdout.write(self.style.SUCCESS(f"[OK] Incidencias de personal registradas ({len(created_incidents)})."))

            # =========================================================================
            # 10. HISTORIAL DE AUDITORÍA Y ASIGNACIONES (TeamMemberChangeLog)
            # =========================================================================
            admin_user = User.objects.filter(is_superuser=True).first() or User.objects.first()
            logs_seed = [
                ("andrea.rojas@projectplanner.com", "Andrea Rojas", "PRJ-2026-002", "PRJ-2026-001", "Puente Industrial Río Verde", "Torre Reforma Norte", "Reasignación para liderar el cálculo estructural de los niveles superiores."),
                ("mateo.castro@projectplanner.com", "Mateo Castro", "PRJ-2026-001", "PRJ-2026-002", "Torre Reforma Norte", "Puente Industrial Río Verde", "Asignado como Ingeniero Residente para la fase de cimentaciones profundas."),
                ("javier.pena@projectplanner.com", "Javier Peña", "PRJ-2026-001", "PRJ-2026-007", "Torre Reforma Norte", "Subestación Eléctrica Este", "Reasignado para supervisar la infraestructura SCADA de subestación."),
                ("valentina.diaz@projectplanner.com", "Valentina Díaz", "PRJ-2026-003", "PRJ-2026-009", "Centro Comercial San Isidro", "Campus Universitario Pabellón B", "Transferencia al nuevo pabellón universitario para coordinar el expediente BIM."),
                ("natalia.ramos@projectplanner.com", "Natalia Ramos", None, "PRJ-2026-011", "Sin proyecto asignado", "Túnel Interurbano Km 45", "Asignación inicial de topografía y control de túnel."),
                ("diego.silva@projectplanner.com", "Diego Silva", "PRJ-2026-007", "PRJ-2026-013", "Subestación Eléctrica Este", "Parque Fotovoltaico Andino", "Asignado al proyecto de energía renovable para liderar la telemetría IoT."),
                ("alejandro.ruiz@projectplanner.com", "Alejandro Ruiz", "PRJ-2026-002", "PRJ-2026-014", "Puente Industrial Río Verde", "Viaducto Elevado Tramo Sur", "Control de calidad de vigas de superestructura en viaducto elevado."),
                ("elena.gomez@projectplanner.com", "Elena Gómez", "PRJ-2026-003", "PRJ-2026-015", "Centro Comercial San Isidro", "Edificio Corporativo Costa Verde", "Generación de recorridos 360 y renders de fachada inteligente."),
                ("isabella.cruz@projectplanner.com", "Isabella Cruz", "PRJ-2026-008", "PRJ-2026-018", "Terminal Terrestre Metropolitano", "Condominio Residencial Mirador", "Diseño arquitectónico y distribución de departamentos en ladera."),
                ("valeria.ortiz@projectplanner.com", "Valeria Ortiz", "PRJ-2026-010", "PRJ-2026-020", "Complejo Deportivo Municipal", "Biblioteca Digital e Innovación", "Modelado de nube de puntos y escaneo láser de patrimonio arquitectónico."),
                ("andres.rios@projectplanner.com", "Andrés Ríos", "PRJ-2026-012", "PRJ-2026-020", "Centro de Datos Tier III", "Biblioteca Digital e Innovación", "Montaje de infraestructura de comunicaciones y salas audiovisuales."),
                ("daniel.paredes@projectplanner.com", "Daniel Paredes", "PRJ-2026-006", "PRJ-2026-017", "Planta de Tratamiento Sanitaria", "Red de Distribución Gas Natural", "Supervisión de zanjas y cruces teledirigidos de gas natural."),
            ]

            created_logs = 0
            for email, mname, prev_pcode, new_pcode, prev_pname, new_pname, comment in logs_seed:
                if email in members:
                    TeamMemberChangeLog.objects.create(
                        member=members[email],
                        member_name=mname,
                        member_email=email,
                        action='manual_update',
                        source='manual',
                        previous_status=statuses['Active'],
                        new_status=statuses['Active'],
                        previous_status_name='Active',
                        new_status_name='Active',
                        previous_project=projects.get(prev_pcode) if prev_pcode else None,
                        new_project=projects.get(new_pcode) if new_pcode else None,
                        previous_project_name=prev_pname,
                        new_project_name=new_pname,
                        comment=comment,
                        changed_by=admin_user,
                    )
                    created_logs += 1
            self.stdout.write(self.style.SUCCESS(f"[OK] Historial de movimientos y auditoría de personal registrado ({created_logs})."))

            # =========================================================================
            # 11. REUNIONES TÉCNICAS Y DE COORDINACIÓN (ProjectMeeting)
            # =========================================================================
            meetings_seed = [
                ("PRJ-2026-001", "Comité de Coordinación BIM Nivel 1-10", "coord-bim-torre-reforma", timezone.make_aware(datetime.datetime(2026, 11, 4, 10, 0))),
                ("PRJ-2026-002", "Revisión de Avance y Ruta Crítica - Puente Industrial", "ruta-critica-puente-industrial", timezone.make_aware(datetime.datetime(2026, 11, 6, 15, 30))),
                ("PRJ-2026-005", "Validación Municipal de Planos Bioclimáticos", "validacion-los-sauces", timezone.make_aware(datetime.datetime(2026, 11, 10, 9, 0))),
                ("PRJ-2026-007", "Comité de Seguridad y Protocolos de Energización", "seguridad-subestacion-este", timezone.make_aware(datetime.datetime(2026, 11, 12, 11, 0))),
                ("PRJ-2026-009", "Compatibilización Acústica y Climatización", "acustica-campus-pabellon-b", timezone.make_aware(datetime.datetime(2026, 11, 15, 16, 0))),
                ("PRJ-2026-011", "Comité de Seguridad en Galerías de Túnel Km 45", "seguridad-tunel-km45", timezone.make_aware(datetime.datetime(2026, 11, 18, 14, 0))),
                ("PRJ-2026-013", "Sincronización de Inversores y Parque Solar", "sincronizacion-fotovoltaico", timezone.make_aware(datetime.datetime(2026, 11, 20, 10, 30))),
                ("PRJ-2026-020", "Patrimonio y Tecnologías Inmersivas", "patrimonio-biblioteca-digital", timezone.make_aware(datetime.datetime(2026, 11, 22, 11, 0))),
            ]

            created_meetings = 0
            for pcode, title, rname, sched_time in meetings_seed:
                if pcode in projects:
                    ProjectMeeting.objects.get_or_create(
                        project=projects[pcode],
                        title=title,
                        defaults={
                            "room_name": rname,
                            "meeting_url": f"https://meet.jit.si/{rname}",
                            "scheduled_at": sched_time,
                            "created_by": admin_user,
                        }
                    )
                    created_meetings += 1
            self.stdout.write(self.style.SUCCESS(f"[OK] Reuniones de coordinación registradas ({created_meetings})."))

            # =========================================================================
            # 12. ENLACES DOCUMENTALES DE DRIVE Y RENDIMIENTO
            # =========================================================================
            if created_tasks:
                PerformanceMetric.objects.get_or_create(
                    project=projects["PRJ-2026-001"],
                    unit="M2 de Encofrado y Vaciado",
                    defaults={
                        "task": created_tasks[1],
                        "quantity": 2500.00,
                        "rate_per_day": 65.00,
                        "divisor": 5,
                    }
                )

                links_seed = [
                    (created_tasks[1], "Modelo Estructural Revit 2026", "https://drive.google.com/file/d/1A2B3C4D5E6F7G8H9-RevitStructure/view", "1A2B3C4D5E6F7G8H9", "BIM_MODEL"),
                    (created_tasks[2], "Carpeta de Planos de Redes y Telecomunicaciones", "https://drive.google.com/drive/folders/1X9Y8Z7W6V5U4T3-ITFolder", "1X9Y8Z7W6V5U4T3", "FOLDER"),
                    (created_tasks[3], "Render 360 Fachada Exterior Doble Vidrio", "https://drive.google.com/file/d/1R2E3N4D5E6R7-Fachada360/view", "1R2E3N4D5E6R7", "RENDER_360"),
                ]
                for task_obj, title, url, fid, ftype in links_seed:
                    DriveLink.objects.get_or_create(
                        task=task_obj,
                        title=title,
                        defaults={"drive_url": url, "file_id": fid, "file_type": ftype}
                    )
                self.stdout.write(self.style.SUCCESS(f"[OK] Enlaces documentales y modelos Drive asociados ({len(links_seed)})."))

            # =========================================================================
            # 13. HISTORIAL DE CAMBIOS DE PROYECTOS (Portafolio)
            # =========================================================================
            portfolio_changes_seed = [
                ("PRJ-2026-001", "Ampliacion de presupuesto para fase de muros pantalla a $4.2M", "Carlos Mendoza", datetime.date(2026, 3, 24)),
                ("PRJ-2026-002", "Aprobacion de adenda tecnica por incremento de vano en rio a 80m", "Andrea Rojas", datetime.date(2026, 3, 22)),
                ("PRJ-2026-003", "Recepcion definitiva de obra y cierre de liquidacion economica", "Luis Gonzales", datetime.date(2026, 2, 28)),
                ("PRJ-2026-004", "Actualizacion de especificaciones tecnicas para aislamiento sismico", "Carlos Mendoza", datetime.date(2026, 5, 2)),
                ("PRJ-2026-005", "Validacion municipal de expediente bioclimatico y licencia de obra", "Sofia Torres", datetime.date(2026, 3, 12)),
                ("PRJ-2026-007", "Reasignacion de contratista electrico para celdas de media tension", "Javier Pena", datetime.date(2026, 2, 18)),
                ("PRJ-2026-009", "Compatibilizacion final de especialidades acusticas con auditorio", "Valentina Diaz", datetime.date(2026, 4, 5)),
                ("PRJ-2026-011", "Incorporacion de escaneo laser LiDAR para control milimetrico de tunel", "Natalia Ramos", datetime.date(2026, 3, 1)),
                ("PRJ-2026-013", "Autorizacion ambiental para parque solar y conexion a subestacion", "Diego Silva", datetime.date(2026, 2, 15)),
                ("PRJ-2026-020", "Aprobacion de restauracion patrimonial por ministerio de cultura", "Valeria Ortiz", datetime.date(2026, 2, 10)),
            ]

            created_pchanges = 0
            for pcode, desc, uname, cdate in portfolio_changes_seed:
                if pcode in projects:
                    ProjectChangeLog.objects.create(
                        project=projects[pcode],
                        description=desc,
                        user_name=uname,
                        date=cdate,
                    )
                    created_pchanges += 1
            self.stdout.write(self.style.SUCCESS(f"[OK] Historial de cambios de Portafolio registrado ({created_pchanges})."))

            # =========================================================================
            # 14. HISTORIAL DE REAJUSTES DE CRONOGRAMA (Planificacion Estrategica)
            # =========================================================================
            schedule_adjustments_seed = [
                ("PRJ-2026-001", "Ene - Oct 2026", "Ene - Nov 2026", "Ampliacion de alcance solicitada por el cliente", datetime.date(2026, 10, 14)),
                ("PRJ-2026-002", "Feb - Ago 2026", "Feb - Sep 2026", "Contingencia climatica por crecida de caudal de rio", datetime.date(2026, 10, 2)),
                ("PRJ-2026-007", "Ene - May 2026", "Ene - Jun 2026", "Retraso por entrega de insumos estructurales y celdas SCADA", datetime.date(2026, 9, 18)),
                ("PRJ-2026-011", "Ene - Nov 2026", "Ene - Dic 2026", "Reprogramacion por disponibilidad de maquinaria pesada LiDAR", datetime.date(2026, 8, 25)),
                ("PRJ-2026-009", "Feb - Jul 2026", "Feb - Ago 2026", "Optimizacion del cronograma y compatibilizacion acustica", datetime.date(2026, 7, 12)),
                ("PRJ-2026-005", "Mar - Sep 2026", "Mar - Oct 2026", "Cambio de especificaciones en ventaneria bioclimatica", datetime.date(2026, 6, 30)),
                ("PRJ-2026-013", "Feb - Sep 2026", "Feb - Oct 2026", "Adelanto en hincado de estructuras y montaje de paneles", datetime.date(2026, 5, 14)),
                ("PRJ-2026-014", "Ene - Oct 2026", "Ene - Nov 2026", "Coordinacion con transito metropolitano para cierres nocturnos", datetime.date(2026, 4, 20)),
                ("PRJ-2026-017", "Feb - Ago 2026", "Feb - Sep 2026", "Reprogramacion de permisos de cruce teledirigido bajo avenidas", datetime.date(2026, 4, 8)),
                ("PRJ-2026-020", "Ene - Jul 2026", "Ene - Ago 2026", "Tramite de consolidacion estructural de muros patrimoniales", datetime.date(2026, 3, 19)),
            ]

            created_adjustments = 0
            for pcode, pprev, pnext, preason, adate in schedule_adjustments_seed:
                if pcode in projects:
                    ScheduleAdjustment.objects.create(
                        project=projects[pcode],
                        previous_period=pprev,
                        next_period=pnext,
                        reason=preason,
                        date=adate,
                    )
                    created_adjustments += 1
            self.stdout.write(self.style.SUCCESS(f"[OK] Historial de reajustes de cronograma registrado ({created_adjustments})."))

        self.stdout.write(self.style.SUCCESS("\n========================================================"))
        self.stdout.write(self.style.SUCCESS("  BASE DE DATOS POBLADA EXITOSAMENTE CON ECOSISTEMA COMPLETO"))
        self.stdout.write(self.style.SUCCESS("  - 20 Proyectos en Portafolio"))
        self.stdout.write(self.style.SUCCESS("  - 18 Técnicos en Equipo y RRHH"))
        self.stdout.write(self.style.SUCCESS("  - 52 Hitos Estratégicos en Calendario Maestro"))
        self.stdout.write(self.style.SUCCESS("  - 23 Tareas y Órdenes Operativas"))
        self.stdout.write(self.style.SUCCESS("  - 8 Incidencias de Personal"))
        self.stdout.write(self.style.SUCCESS("  - 12 Registros de Auditoría y Movimientos"))
        self.stdout.write(self.style.SUCCESS("  - 8 Reuniones de Proyecto"))
        self.stdout.write(self.style.SUCCESS("========================================================\n"))
