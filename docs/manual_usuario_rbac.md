# MANUAL DE USUARIO Y DIRECTIVAS DE SEGURIDAD RBAC — PROJECT PLANNER

> **DOCUMENTO OFICIAL DE GOBERNANZA, PROCEDIMIENTOS Y CONTROL DE ACCESOS**  
> **Versión:** 2.0.0  
> **Clasificación:** Confidencial / Segmentado por Roles  
> **Sistema:** Project Planner (Backend Django REST Framework + Frontend React Vite + PostgreSQL pgvector)

---

## POLÍTICA GENERAL DE SEGURIDAD Y PRIVILEGIO MÍNIMO (ZERO-LEAKAGE DIRECTIVE)

### Directiva de Seguridad Obligatoria
En concordancia con el principio de **Privilegio Mínimo (Principle of Least Privilege)** y la arquitectura de Control de Acceso Basado en Roles (**RBAC**):
1. **Separación de Funciones:** Ningún usuario con rol estándar (*Usuario / Desarrollador / Técnico*) podrá visualizar, invocar, consultar ni recibir datos, credenciales, registros financieros, logs de auditoría forense ni directivas estratégicas reservadas para el *Administrador (Project Manager / PMO)*.
2. **Filtrado en Profundidad (Defense in Depth):**
   - **Frontend:** La navegación y los componentes de acción crítica (`canManage`, `isAdmin`) se ocultan y bloquean dinámicamente según el token de sesión.
   - **Backend:** Los endpoints protegidos aplican validadores estrictos (`IsAdminUser`, `IsSuperUser`, `SimpleUserAuthentication`). Cualquier intento de elevación de privilegios es rechazado con códigos HTTP 403 Forbidden y registrado en `SecurityAuditLog`.
   - **Capa RAG / IA:** Los fragmentos de documentación técnica vectorizados están etiquetados por rol. El motor semántico y la instrucción del sistema impiden que se divulguen secretos administrativos, nóminas o protocolos de auditoría a usuarios sin privilegios administrativos.

---

# SECCIÓN 1: GUÍA Y FUNCIONALIDADES PARA EL USUARIO / DESARROLLADOR (EQUIPO TÉCNICO)

Esta sección describe las herramientas, pantallas y flujos de trabajo habilitados para el personal técnico, ingenieros y desarrolladores asignados a proyectos.

---

### 1.1 Autenticación y Perfil de Usuario
- **Inicio de Sesión:** Acceso mediante credenciales asignadas (correo institucional o nombre de usuario) y selección del rol **"Equipo Técnico"** en la pantalla de ingreso (`/login`).
- **Seguridad de Acceso:** La cuenta está protegida contra intentos de manipulación de rol. La interfaz no solicita código 2FA/TOTP a menos que el usuario sea promovido a nivel administrativo.
- **Configuración Personal (`/configuracion`):**
  - Actualización de datos de perfil (nombre, teléfono de contacto y avatar).
  - Cambio seguro de contraseña mediante validación de clave actual.
  - Selección de temas visuales de interfaz (Modo Claro, Oscuro o Medianoche).

---

### 1.2 Vista de Tareas y Gestión Operativa (`/operations`)
- **Consulta de Órdenes de Trabajo:** Acceso al backlog operativo de tareas asignadas al equipo.
- **Seguimiento de Avance:**
  - Los técnicos pueden monitorear el porcentaje de ejecución de las órdenes de trabajo.
  - Consulta de alertas operativas, fechas de inicio y fechas compromiso de entrega.
  - Verificación de especificaciones y estándares de control de calidad vinculados a cada tarea.
- **Restricción:** La emisión de nuevas órdenes de trabajo de alta prioridad o la modificación de cronogramas base está restringida al Administrador.

---

### 1.3 Portafolio de Proyectos e Hitos de Desarrollo (`/portfolio`)
- **Navegación de Proyectos:** Consulta de las tarjetas de proyecto en las que el usuario participa o que pertenecen a su área técnica (Sistemas, Estructuras, Arquitectura).
- **Rol de Líder de Proyecto (`isProjectLeader`):**
  - Si un técnico es designado como líder de un proyecto específico, se le habilitan permisos de edición para actualizar el avance porcentual, descripción y fechas de ejecución de las actividades de su proyecto.
  - **Exclusión Financiera:** Los campos de presupuesto global (`budget`) y la reasignación del líder del proyecto permanecen estrictamente deshabilitados (`disabled={!isAdmin}`) y protegidos en el backend.
- **Regla de Negocio: Finalización de Hitos de Código y Pull Requests:**
  - Para que un hito de desarrollo pase a estado **'Finalizado'**, el desarrollador debe asociar el commit o tag con el prefijo estandarizado `[RELEASE]`.
  - El líder técnico o Project Manager debe revisar y aprobar el Pull Request en el repositorio antes de que el hito se marque como completado en el sistema.

---

### 1.4 Directorio Técnico y Trabajo Colaborativo (`/technical-team`)
- **Vista de Consulta del Equipo:** Visualización del directorio de compañeros de equipo, sus especialidades técnicas, disponibilidad porcentual y proyectos asignados.
- **Canales de Contacto Directo:** Enlaces rápidos para comunicación mediante correo corporativo y acceso a canal de mensajería (WhatsApp) para coordinaciones operativas directas.
- **Restricción:** Los técnicos no pueden alterar la disponibilidad de otros integrantes, reasignar proyectos ni dar de alta a nuevos integrantes.

---

### 1.5 Integraciones Técnicas y Visualizador BIM / APS (`/integrations`)
- **Modelos BIM 3D:** Acceso al visor de modelos alojados en Autodesk Platform Services (APS / Revit).
- **Descarga Segura de Archivos:** A través del endpoint autenticado `/api/integrations/aps/models/<id>/download/`, el desarrollador obtiene URLs firmadas temporales para descargar insumos técnicos autorizados sin exponer llaves secretas de almacenamiento en la nube.
- **Carpetas de Documentación:** Acceso de lectura a las carpetas sincronizadas en Google Drive para especificaciones técnicas y planos.

---

### 1.6 Asistente de IA (Chatbot) para Soporte Técnico
- **Consultas Permitidas:** El desarrollador puede consultar procedimientos de desarrollo, estándares de codificación, requisitos de hitos, directivas de control de versiones y convenciones operativas.
- **Respuestas Adaptadas:** El asistente responde de forma técnica, concisa y orientada a la acción. Si se consultan presupuestos confidenciales o directivas de nómina, el chatbot deniega la respuesta cortésmente recordando la política de confidencialidad.

---

# SECCIÓN 2: GUÍA Y FUNCIONALIDADES EXCLUSIVAS PARA EL ADMINISTRADOR (PROJECT MANAGER / PMO)

Esta sección detalla los módulos privilegiados de gobernanza, auditoría, gestión financiera y control operativo global accesibles únicamente para usuarios con permisos `is_staff=True` o `is_superuser=True`.

---

### 2.1 Autenticación Reforzada y 2FA/TOTP Obligatorio
- **Ingreso con Rol Administrativo:** Selección obligatoria del rol **"Project Manager (Admin)"** en `/login`. El backend verifica que el usuario cuente con los atributos `is_staff` o `is_superuser`.
- **Doble Factor de Autenticación (2FA):**
  - Implementación obligatoria mediante TOTP (Time-Based One-Time Password) con perfil `TwoFactorProfile`.
  - El sistema solicita el código de 6 dígitos emitido por aplicaciones de autenticación (Google Authenticator, Microsoft Authenticator) antes de otorgar el `session_token`.

---

### 2.2 Planificación Estratégica Maestra y Diagrama de Gantt (`/planning`)
- **Control Maestro del Calendario:** Vista y edición completa de la ventana temporal de proyectos (semestral, anual y plurianual).
- **Ajuste de Fechas y Cronogramas (`AdjustScheduleDialog`):**
  - Capacidad de reprogramar fechas de inicio y finalización de proyectos.
  - Registro automático del motivo de ajuste y preservación del histórico en `ScheduleAdjustment`.
- **Registro de Hitos Globales (`NewGlobalMilestoneDialog`):** Creación de hitos críticos interdepartamentales con asignación de responsables y fechas de control.
- **Análisis de Cronogramas (`TimelineAnalysisDialog`):** Simulación y propuesta de optimización de tiempos de entrega y dependencias críticas entre proyectos.
- **Regla de Gobernanza Financiera ($100,000 USD):**
  - Los proyectos con presupuesto igual o superior a $100,000 USD activan automáticamente controles de gobernanza reforzada, señalizados en el diagrama de Gantt con distintivos de auditoría prioritaria.

---

### 2.3 Control Total de Portafolio y Presupuestos (`/portfolio`)
- **Creación de Proyectos (`NewProjectDialog`):** Alta de proyectos en el sistema asignando código correlativo anual, área técnica, fechas oficiales, carpeta de Drive, asignación de líder y presupuesto financiero oficial.
- **Edición Completa (`EditProjectDialog`):** Exclusiva capacidad de modificar el presupuesto asignado (`budget`) y reasignar el líder técnico del proyecto.
- **Eliminación y Depuración (`ConfirmDeleteDialog`):** Exclusivo para administradores. Eliminación controlada de proyectos no viables o cancelados, con registro inmediato en la bitácora de auditoría.

---

### 2.4 Gestión de Recursos Humanos y Flujo de Incidencias (`/human-resources`)
- **Control de Cargas de Trabajo y Disponibilidad:** Asignación de dedicación porcentual (0% a 100%) y balanceo de carga técnica entre las distintas áreas.
- **Ciclo Completo de Incidencias de Personal (`PersonnelIncidentViewSet`):**
  - Registro de incidencias: Vacaciones (`vacation`), Licencias médicas (`medical`), Permisos personales (`personal`) y Capacitaciones (`training`).
  - **Aprobación de Incidencias (`approve`):** El Administrador aprueba formalmente la solicitud, lo que reduce automáticamente la disponibilidad del integrante y activa el integrante de respaldo (`backup_member`).
  - **Rechazo de Incidencias (`reject`):** Cancelación documentada con registro de comentarios obligatorios.
  - **Finalización de Incidencias (`finalize`):** Cierre de la licencia y retorno del técnico a disponibilidad productiva completa.
  - **Ciclo de Vida Automatizado (`process_incident_lifecycle`):** Cálculo de fechas de retorno y reincorporación automática a proyectos.

---

### 2.5 Alta de Técnicos y Control de Credenciales
- **Creación de Personal Técnico (`CreateTechnicianView`):** Endpoint administrativo `/api/technical-team/create/` que registra al integrante en `TeamMember`, crea la cuenta en `auth_user` con contraseña provisional y asigna el área técnica y cargo correspondiente.
- **Exportación de Nóminas y Reportes:** Generación de hojas de cálculo completas en formato Excel (`.xlsx`) y CSV con datos detallados de dedicación, proyectos, áreas y estados operativos.

---

### 2.6 Auditoría Avanzada y Bitácoras de Seguridad
- **Historial Permanente de Personal (`TeamMemberChangeLog`):** Registro inmutable de cada cambio de proyecto, estado o disponibilidad, capturando usuario ejecutor, fecha y detalles del cambio.
- **Auditoría Forense (`SecurityAuditLog`):** Monitoreo en tiempo real de inicios de sesión, cambios de contraseña, intentos de acceso denegados y alteraciones de configuración.

---

### 2.7 Gestión de Respaldos de Base de Datos (Disaster Recovery)
- **Acceso Superusuario Exclusivo:** Endpoints en `/api/database/` protegidos con `IsSuperUser` y autenticación segura con token de respaldo.
- **Funcionalidades de Respaldo:**
  - `export_database_view`: Generación y descarga inmediata de respaldo comprimido de PostgreSQL (`pg_dump`).
  - `restore_database_view`: Restauración controlada exigiendo confirmación explícita de seguridad (`confirm_restore=True`).
  - `backup_history_view`: Consulta del historial de archivos de respaldo físicos disponibles en el servidor.
  - Encabezados HTTP `Cache-Control: no-store` para impedir almacenamiento en proxies o cachés intermedias.

---

### 2.8 Configuración del Asistente RAG y Políticas de IA
- **Instrucción de Sistema para Administradores:** El modelo de lenguaje responde con enfoque ejecutivo y estratégico, integrando métricas financieras, gobernanza de hitos y recomendaciones de asignación de recursos.
- **Actualización de Base Vectorial:** Capacidad de ejecutar scripts de reindexación semántica (`vectorizar_manual_real.py`) para actualizar la base de conocimientos con nuevos manuales de gobernanza.

