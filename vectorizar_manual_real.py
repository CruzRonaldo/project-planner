"""Script de Ingesta Inteligente y Vectorización Semántica del Manual RBAC.

Procesa la documentación oficial de Project Planner, la segmenta por roles
(General, Técnico/Desarrollador y Administrador), genera embeddings de 768
dimensiones mediante Google Gemini y persiste los vectores en PostgreSQL con pgvector.
"""
import os
import sys
import time
from pathlib import Path

# 1. Configurar entorno Django
BASE_DIR = Path(__file__).resolve().parent
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

import django
django.setup()

from core.models import DocumentEmbedding
from core.services.ai_service import get_embedding


MANUAL_PATH = BASE_DIR / "docs" / "manual_usuario_rbac.md"


CHUNKS = [
    {
        "title": "[Rol: General] Directiva de Privilegio Minimo y Gobernanza RBAC",
        "role_category": "General",
        "content": (
            "POLITICA GENERAL DE SEGURIDAD Y PRIVILEGIO MINIMO (ZERO-LEAKAGE DIRECTIVE) EN PROJECT PLANNER:\n"
            "- Separacion Estricta de Funciones: Ningun usuario con rol estandar (Usuario / Desarrollador / Tecnico) "
            "podra visualizar, consultar ni recibir datos, credenciales, registros financieros, logs de auditoria forense "
            "ni directivas estrategicas reservadas para el Administrador (Project Manager / PMO).\n"
            "- Filtrado en Profundidad (Defense in Depth):\n"
            "  * Frontend: Ocultamiento de componentes administrativos con banderas canManage e isAdmin.\n"
            "  * Backend: Validacion estricta mediante IsAdminUser, IsSuperUser y SimpleUserAuthentication. Rechazo con HTTP 403 Forbidden.\n"
            "  * Capa RAG / IA: Exclusion automatica de fragmentos administrativos para consultas originadas por usuarios tecnicos."
        ),
    },
    {
        "title": "[Rol: Tecnico / Desarrollador] 1.1 Autenticacion y Perfil de Usuario",
        "role_category": "Tecnico",
        "content": (
            "GUIA PARA DESARROLLADOR / TECNICO - AUTENTICACION Y PERFIL:\n"
            "- Acceso al Sistema: Inicio de sesion mediante credenciales en /login seleccionando el rol 'Equipo Tecnico'.\n"
            "- Seguridad de Acceso: El sistema valida la coherencia del rol y restringe el acceso al panel administrativo.\n"
            "- Configuracion Personal (/configuracion): El tecnico puede actualizar su foto de perfil, telefono y clave actual.\n"
            "- Temas Visuales: Soporte para Modo Claro, Modo Oscuro y Medianoche."
        ),
    },
    {
        "title": "[Rol: Tecnico / Desarrollador] 1.2 Vista de Tareas y Gestion Operativa",
        "role_category": "Tecnico",
        "content": (
            "GUIA PARA DESARROLLADOR / TECNICO - GESTION OPERATIVA (/operations):\n"
            "- Backlog Operativo: Consulta de ordenes de trabajo asignadas a su especialidad tecnica.\n"
            "- Seguimiento de Avance: Revision de fechas de inicio, fechas compromiso y porcentaje de ejecucion de tareas.\n"
            "- Controles de Calidad: Inspeccion de estandares y especificaciones tecnicas asociadas a cada orden.\n"
            "- Restriccion: La emision de nuevas ordenes de trabajo de alta prioridad o modificacion de cronogramas "
            "es una facultad exclusiva del Administrador."
        ),
    },
    {
        "title": "[Rol: Tecnico / Desarrollador] 1.3 Portafolio e Hitos de Codigo (Regla [RELEASE])",
        "role_category": "Tecnico",
        "content": (
            "GUIA PARA DESARROLLADOR / TECNICO - PORTAFOLIO E HITOS (/portfolio):\n"
            "- Consulta de Proyectos: Navegacion de tarjetas de proyectos pertenecientes a su area tecnica.\n"
            "- Rol de Lider de Proyecto (isProjectLeader): Si un tecnico es lider de un proyecto, puede editar "
            "el progreso porcentual y fechas de actividades, pero los campos de presupuesto (budget) y cambio de lider "
            "permanecen deshabilitados (disabled={!isAdmin}).\n"
            "- Regla de Negocio de Finalizacion de Hitos: Para que un hito del proyecto pase a estado 'Finalizado', "
            "el desarrollador debe subir el codigo con el prefijo [RELEASE] y el lider tecnico o PM debe aprobar "
            "el Pull Request correspondiente en el repositorio."
        ),
    },
    {
        "title": "[Rol: Tecnico / Desarrollador] 1.4 Directorio Tecnico y Colaboracion",
        "role_category": "Tecnico",
        "content": (
            "GUIA PARA DESARROLLADOR / TECNICO - DIRECTORIO TECNICO (/technical-team):\n"
            "- Directorio del Personal: Vista de consulta con las especialidades, disponibilidad porcentual y proyectos del equipo.\n"
            "- Canales de Comunicacion: Enlaces rapidos de correo corporativo y boton de integracion con WhatsApp.\n"
            "- Restriccion: Los tecnicos se encuentran en modo 'Vista de consulta' y no pueden registrar integrantes, "
            "reasignar proyectos ni modificar porcentajes de disponibilidad ajenos."
        ),
    },
    {
        "title": "[Rol: Tecnico / Desarrollador] 1.5 Integraciones Tecnicas y Visualizador BIM / APS",
        "role_category": "Tecnico",
        "content": (
            "GUIA PARA DESARROLLADOR / TECNICO - INTEGRACIONES BIM/APS (/integrations):\n"
            "- Visualizador 3D: Carga e interaccion con modelos BIM alojados en Autodesk Platform Services (APS / Revit).\n"
            "- Descarga Segura: Endpoint autenticado /api/integrations/aps/models/<id>/download/ que provee URLs firmadas temporales "
            "para descarga de insumos sin divulgar credenciales directas de AWS S3.\n"
            "- Enlaces de Drive: Acceso de lectura a carpetas de documentacion tecnica y planos sincronizados."
        ),
    },
    {
        "title": "[Rol: Tecnico / Desarrollador] 1.6 Asistente de IA para Soporte Tecnico",
        "role_category": "Tecnico",
        "content": (
            "GUIA PARA DESARROLLADOR / TECNICO - ASISTENTE DE IA (CHATBOT OPERATIVO):\n"
            "- Consultas Permitidas: Procedimientos tecnicos, estandares de desarrollo, flujo de hitos y politicas operativas.\n"
            "- Respuestas Adaptadas: El motor de IA responde con enfoque practico y formato Markdown (listas, negritas y codigo).\n"
            "- Restriccion Zero-Leakage: Si el tecnico solicita informacion reservada (presupuestos financieros de proyectos, "
            "nominas salariales o auditorias de personal), el asistente declinara la respuesta por politica de confidencialidad."
        ),
    },
    {
        "title": "[Rol: Administrador] 2.1 Autenticacion Reforzada y 2FA/TOTP Obligatorio",
        "role_category": "Administrador",
        "content": (
            "[DESTINATARIO: ADMINISTRADOR] GUIA DE SEGURIDAD ADMINISTRATIVA - AUTENTICACION Y 2FA:\n"
            "- Credenciales Privilegiadas: Ingreso seleccionando 'Project Manager (Admin)'. El backend valida atributos is_staff o is_superuser.\n"
            "- Doble Factor de Autenticacion (2FA/TOTP): Exclusivo y obligatorio para administradores mediante perfil TwoFactorProfile.\n"
            "- Validacion OTP: Requiere el codigo numerico de 6 digitos emitido por aplicaciones TOTP antes de generar el session_token."
        ),
    },
    {
        "title": "[Rol: Administrador] 2.2 Planificacion Estrategica y Regla de Gobernanza de $100k",
        "role_category": "Administrador",
        "content": (
            "[DESTINATARIO: ADMINISTRADOR] PLANIFICACION ESTRATEGICA MAESTRA (/planning):\n"
            "- Control Maestro del Calendario: Capacidad de reprogramar proyectos arrastrando barras de Gantt y ajustando ventanas temporales.\n"
            "- Ajuste de Cronogramas (AdjustScheduleDialog): Registro de motivos de ajuste y persistencia historica en ScheduleAdjustment.\n"
            "- Hitos Globales (NewGlobalMilestoneDialog): Creacion de hitos criticos interdepartamentales con fecha y responsable.\n"
            "- Analisis de Cronogramas (TimelineAnalysisDialog): Simulacion automatizada de propuestas y dependencias.\n"
            "- Regla de Gobernanza Financiera ($100,000 USD): Todo proyecto cuyo presupuesto supere los $100,000 USD activa "
            "gobernanza reforzada con marcadores visuales prioritarios en el Gantt y obligatoriedad de revisiones de auditoria."
        ),
    },
    {
        "title": "[Rol: Administrador] 2.3 Control Total de Portafolio y Presupuestos",
        "role_category": "Administrador",
        "content": (
            "[DESTINATARIO: ADMINISTRADOR] CONTROL TOTAL DE PORTAFOLIO (/portfolio):\n"
            "- Creacion de Proyectos (NewProjectDialog): Asignacion de codigo correlativo anual, lider de proyecto, area, carpeta Drive y presupuesto.\n"
            "- Modificacion Presupuestaria (EditProjectDialog): Modificacion exclusiva del monto presupuestado (budget) y reasignacion de lider.\n"
            "- Eliminacion de Proyectos (ConfirmDeleteDialog): Supresion controlada de proyectos con registro instantaneo en bitacoras de auditoria."
        ),
    },
    {
        "title": "[Rol: Administrador] 2.4 Gestion de RRHH y Ciclo de Vida de Incidencias",
        "role_category": "Administrador",
        "content": (
            "[DESTINATARIO: ADMINISTRADOR] GESTION DE RECURSOS HUMANOS E INCIDENCIAS (/human-resources):\n"
            "- Control de Cargas de Trabajo: Asignacion y balanceo de disponibilidad porcentual (0% a 100%) del personal.\n"
            "- Flujo de Incidencias (PersonnelIncidentViewSet): Registro de tipos: vacaciones (vacation), licencias medicas (medical), "
            "permisos personales (personal) y capacitaciones (training).\n"
            "- Aprobacion (approve): Reduce disponibilidad del tecnico y activa el integrante de respaldo (backup_member).\n"
            "- Rechazo (reject) y Finalizacion (finalize): Cierre documentado y retorno automatico a disponibilidad al vencer la fecha de retorno."
        ),
    },
    {
        "title": "[Rol: Administrador] 2.5 Alta de Tecnicos y Control de Credenciales",
        "role_category": "Administrador",
        "content": (
            "[DESTINATARIO: ADMINISTRADOR] ALTA DE TECNICOS Y GESTION DE ACCESOS:\n"
            "- Creacion de Tecnicos (CreateTechnicianView): Endpoint administrativo /api/technical-team/create/ para registrar al integrante "
            "en TeamMember y crear su usuario en auth_user con contrasena provisional.\n"
            "- Exportacion de Nominas y Reportes: Descarga de planillas consolidadas en formato Excel (.xlsx) y CSV con datos completos de personal."
        ),
    },
    {
        "title": "[Rol: Administrador] 2.6 Auditoria Avanzada y Bitacoras de Seguridad",
        "role_category": "Administrador",
        "content": (
            "[DESTINATARIO: ADMINISTRADOR] AUDITORIA AVANZADA Y SEGURIDAD:\n"
            "- Historial Permanente de Personal (TeamMemberChangeLog): Registro inmutable de cada cambio de proyecto, estado o disponibilidad, "
            "indicando usuario ejecutor (actor), fecha y estados anterior/nuevo.\n"
            "- Bitacora Forense (SecurityAuditLog): Monitoreo de inicios de sesion, cambios de contrasena, accesos denegados y alteraciones de seguridad."
        ),
    },
    {
        "title": "[Rol: Administrador] 2.7 Gestion de Respaldos de Base de Datos y Disaster Recovery",
        "role_category": "Administrador",
        "content": (
            "[DESTINATARIO: ADMINISTRADOR] GESTION DE RESPALDOS DE BASE DE DATOS (/api/database/):\n"
            "- Privilegio Superusuario: Exclusivo para usuarios con is_superuser=True y token de respaldo.\n"
            "- Exportacion (export_database_view): Generacion de volcados PostgreSQL (pg_dump) con encabezado Cache-Control: no-store.\n"
            "- Restauracion (restore_database_view): Restauracion de emergencias con confirmacion explicita (confirm_restore=True).\n"
            "- Historial de Respaldos (backup_history_view): Inspeccion del estado y antiguedad de copias de seguridad fisicas."
        ),
    },
    {
        "title": "[Rol: Administrador] 2.8 Configuracion del Asistente RAG y Politicas de IA",
        "role_category": "Administrador",
        "content": (
            "[DESTINATARIO: ADMINISTRADOR] GOBERNANZA DE IA Y ASISTENTE ESTRATEGICO:\n"
            "- Instruccion de Sistema Ejecutiva: Respuestas con vision gerencial, metricas de costos y control de hitos.\n"
            "- Administracion de Base de Conocimientos: Reindexacion de fragmentos documentales con vectorizar_manual_real.py "
            "utilizando Google Gemini (gemini-embedding-001, 768 dimensiones) y PostgreSQL pgvector."
        ),
    },
]


def ingest_manual():
    print("=" * 75)
    print("INGESTA INTELIGENTE Y VECTORIZACION SEMANTICA DEL MANUAL RBAC")
    print("Google Gemini (gemini-embedding-001, 768 dims) + PostgreSQL (pgvector)")
    print("=" * 75)

    if not MANUAL_PATH.exists():
        print(f"[ERROR] No se encontro el archivo del manual en: {MANUAL_PATH}")
        return False

    print(f"\n[INFO] Manual fuente encontrado: {MANUAL_PATH.name} ({MANUAL_PATH.stat().st_size} bytes)")
    print(f"[INFO] Total de fragmentos clasificados a vectorizar: {len(CHUNKS)}")

    # 1. Limpiar registros previos en DocumentEmbedding
    print("\n-> 1. Limpiando registros previos en 'DocumentEmbedding'...")
    prev_count = DocumentEmbedding.objects.count()
    DocumentEmbedding.objects.all().delete()
    print(f"   [OK] Se eliminaron {prev_count} registros anteriores para garantizar consistencia limpia.")

    # 2. Generar embeddings y persistir en PostgreSQL
    print("\n-> 2. Generando vectores e insertando en PostgreSQL con pgvector...")
    created_records = []
    failed_records = []

    for idx, chunk_data in enumerate(CHUNKS, start=1):
        title = chunk_data["title"]
        category = chunk_data["role_category"]
        content = chunk_data["content"]

        print(f"   [{idx:02d}/{len(CHUNKS):02d}] Vectorizando: '{title}' ({category})...", end="", flush=True)

        try:
            vector = get_embedding(content)
            if not vector or len(vector) != 768:
                raise ValueError(f"Longitud de vector inesperada: {len(vector) if vector else 0} (esperado 768)")

            doc = DocumentEmbedding.objects.create(
                title=title,
                content=content,
                embedding=vector,
            )
            created_records.append((doc.id, title, category, len(vector)))
            print(f" -> [OK] ID {doc.id} (768 dims)")
            # Breve pausa para no saturar rate limit
            time.sleep(0.5)
        except Exception as exc:
            print(f" -> [ERROR]: {exc}")
            failed_records.append((title, str(exc)))

    # 3. Reporte final
    print("\n" + "=" * 75)
    print("REPORTE DE INGESTA VECTORIAL EN POSTGRESQL:")
    print("=" * 75)
    print(f"Total procesados con exito: {len(created_records)}")
    print(f"Total fallidos:             {len(failed_records)}")

    general_count = sum(1 for _, _, cat, _ in created_records if cat == "General")
    tecnico_count = sum(1 for _, _, cat, _ in created_records if cat == "Tecnico")
    admin_count = sum(1 for _, _, cat, _ in created_records if cat == "Administrador")

    print("\nDistribucion por Segregacion de Roles:")
    print(f" - [General]:                   {general_count} fragmentos")
    print(f" - [Tecnico / Desarrollador]:   {tecnico_count} fragmentos")
    print(f" - [Administrador]:             {admin_count} fragmentos")

    print("\nListado de Documentos Indexados en PostgreSQL:")
    for doc_id, doc_title, doc_cat, doc_dim in created_records:
        print(f"  ID #{doc_id:02d} | Dim: {doc_dim} | Cat: {doc_cat:<14} | {doc_title}")

    if failed_records:
        print("\nDetalle de Errores:")
        for ft, fe in failed_records:
            print(f"  - {ft}: {fe}")
        return False

    return True


if __name__ == '__main__':
    success = ingest_manual()
    sys.exit(0 if success else 1)

