# Borrador Técnico: Arquitectura Relacional, Conexión de Endpoints y Optimización de API

> **Estado:** Borrador de Trabajo en Proceso (Draft)  
> **Fecha:** Noviembre 2026  
> **Proyecto:** PROJECT PLANNER — Core & Frontend  
> **Rama:** `feat/task-api-optimization`

---

## 1. Visión General del Modelo Relacional

En PROJECT PLANNER, el **`Project` (Proyecto)** es la entidad central y el eje organizador de todas las áreas técnicas, operativas y de recursos humanos.

```
                  ┌──────────────────────┐
                  │       PROJECT        │
                  │ (Portafolio / Macro) │
                  └──────────┬───────────┘
                             │
            ┌────────────────┼────────────────┐
            ▼                ▼                ▼
     ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
     │  MILESTONE  │  │    TASK     │  │ TEAM_MEMBER │
     │  (Hitos en  │  │  (Órdenes   │  │ (Asignación │
     │  Gantt)     │  │ Operativas) │  │  y Carga %) │
     └──────┬──────┘  └──────┬──────┘  └─────────────┘
            │                │
            └────────►───────┴────────► [assigned_to]
```

### 1.1 Entidades y Claves Foráneas Clave

1. **`Project` (`core_project`)**:
   - `code`, `name`, `start_date`, `end_date`, `duration_months`, `budget`, `status`.
   - **Autocálculos en Backend (`ProjectSerializer`)**:
     - `progress`: promedio aritmético del progreso (`progress`) de todas sus tareas (`Task`) asociadas.
     - `usedBudget`: presupuesto gastado calculado como `budget * (progress / 100)`.
     - `members`: lista única de iniciales de los `TeamMember` que tienen asignado este proyecto.

2. **`Milestone` (`core_milestone`)**:
   - FK: `project_id` (on delete CASCADE).
   - Fechas objetivo y estado del hito en el Calendario Maestro (Gantt).

3. **`Task` (`core_task`)**:
   - FK: `project_id` (on delete CASCADE).
   - FK: `milestone_id` (opcional, null=True, blank=True).
   - FK: `category_id` (TechnicalArea: Arquitectura, Civil/Estructuras, Sistemas).
   - FK: `assigned_to_id` (TeamMember responsable de la ejecución).
   - `start_date`, `end_date`, `duration_days`, `tolerance_days` (holgura por defecto 7 días), `is_critical_path` (Ruta Crítica), `status` (`TODO`, `IN_PROGRESS`, `REVIEW`, `DONE`), `progress` (0–100%).

4. **`TeamMember` (`core_teammember`)**:
   - FK: `project_id` (opcional, null=True, blank=True para técnicos en "Stand-by").
   - FK: `technical_area_id` y `status_id`.
   - `allocation_percentage` (% dedicación a este proyecto) y `availability` (% de tiempo libre).

---

## 2. Diagnóstico de Gaps Previos y Soluciones

### Gap 1: Doble carga inicial en Portfolio.jsx (Resuelto en `fix/data-sync-gaps`)
- **Problema:** `Portfolio.jsx` invocaba `projectsApi.getProjects()` y `projectsApi.getTeamMembers()` al montarse en un `useEffect` local, duplicando las peticiones que ya hacía `useProjectsController`.
- **Solución:** Se retiró el `useEffect` redundante y se unificó el helper puro `mapBackendProject(bp)`.

### Gap 2: Falta de persistencia en Operaciones (Abordado en esta rama)
- **Problema:** En `Operations.jsx`, el método `saveOrder` y las transiciones `handleUpdateOrderStatus` / `handleCompleteAndNext` solo mutaban el estado en memoria de React mediante `onChange(updated)`. No interactuaban con `/api/tasks/`.
- **Solución:**
  1. Agregar `createTask(data)`, `updateTask(id, data)` y `deleteTask(id)` a `projectsApi.js`.
  2. Implementar un mapper UI ➔ Backend para resolver `project_id`, `category_id`, y `assigned_to_id`.
  3. Ejecutar las mutaciones mediante `runSafe()` con notificaciones toast informativas.

---

## 3. Optimización de API y Reducción de Latencia

### 3.1 El Problema de Sobrecarga Inicial (11 Peticiones Concurrentes)
Al arrancar la aplicación, se disparaban simultáneamente:
- `getProjects()`
- `getMilestones()`
- `getTasks()`
- `getTeamMemberHistory()` **(Llamada 1 - useProjectsController)**
- `getProjectChangeLogs()`
- `getScheduleAdjustments()`
- `getUsersStatus()`
- `getTeamMembers()`
- `getTeamStatuses()`
- `getPersonnelIncidents()`
- `getTeamMemberHistory()` **(Llamada 2 - useTeamController) ➔ DUPLICADA**

### 3.2 Estrategia de Mitigación

| Medida | Implementación | Beneficio |
| :--- | :--- | :--- |
| **Deduplicación** | Remover `getTeamMemberHistory()` de `useProjectsController`. Centralizar la responsabilidad en `useTeamController`. | Elimina 1 petición HTTP pesada en cada carga. |
| **Carga Diferida (Lazy Fetch)** | `getProjectChangeLogs()` y `getScheduleAdjustments()` no bloquean el arranque. Se cargan solo bajo demanda o en segundo plano. | Reduce la contención inicial de la red y del servidor backend. |
| **Persistencia de Catálogos** | `team-statuses` y áreas técnicas se conservan en memoria mientras la sesión esté activa. | Evita peticiones repetitivas a tablas casi estáticas. |

---

## 4. Matriz de Mapeo de Estados y Campos (Frontend ↔ Backend)

### Estados de Tarea (`Task.status`)
| Frontend (UI) | Backend Choice (`core.models.Task`) | Significado |
| :--- | :--- | :--- |
| `planned` / `todo` | `TODO` | Por Hacer / Planificada |
| `in-progress` | `IN_PROGRESS` | En Curso / Ejecutándose |
| `review` | `REVIEW` | En Revisión Técnica |
| `completed` | `DONE` | Finalizada y Aprobada |

### Categorías Operativas ➔ Áreas Técnicas (`TechnicalArea`)
| Categoría UI | Backend Area (`TechnicalArea.name`) | ID Típico |
| :--- | :--- | :--- |
| `Arquitectura` | `Arquitectura` | 3 |
| `Estructuras` / `Civil` | `Civil` | 2 |
| `Sistemas` / `Instalaciones` | `Sistemas` | 1 |

---

## 5. Auditoría Autónoma y Desacoplada (Backend-Driven Auditing con Opción B)

### 5.1 Principio de Inversión de Control y No Repudio
**El Frontend nunca debe ser responsable de generar o redactar las bitácoras de auditoría.**
1. **No Repudio y Seguridad (OWASP):** El actor responsable de la acción se extrae **exclusivamente de `request.user`** en la sesión autenticada. Se prohíbe explícitamente confiar en cualquier campo enviado en el cuerpo de la petición (como `userName` o `user`). Si una petición llega sin autenticación, se registra como `system`.
2. **Decisión Arquitectónica (Opción B — Signals Puros):** Se implementa la auditoría mediante **Django Signals (`pre_save` y `post_save`)**. Todo cambio realizado a través de la API REST que invoque `.save()` queda automáticamente auditado.
3. **Limitación Explícita Documentada:** Las Signals de Django no capturan escrituras directas ejecutadas fuera del ciclo de vida del ORM, tales como:
   - Sentencias SQL ejecutadas directamente desde el SQL Editor o Dashboard de Supabase.
   - Mutaciones masivas con `QuerySet.update()` o `bulk_update()` en código nuevo (se establece como regla de desarrollo usar `.save()` sobre modelos auditados).
   - Acciones de mantenimiento por psql en terminal.

### 5.2 Arquitectura del Interceptor en Backend

```
┌─────────────────────────────────┐
│     Cliente (Frontend / API)    │  Envía únicamente:
│      PATCH /api/projects/1/     │  { "budget": 1500000, "status": "IN_PROGRESS" }
└────────────────┬────────────────┘  (Cualquier userName enviado es ignorado)
                 │
                 ▼
┌─────────────────────────────────┐
│     ProjectViewSet (Django)     │  Extrae: actor = request.user.get_full_name()
│                                 │  Asigna: project._actor_name = actor
└────────────────┬────────────────┘
                 │
                 ▼
┌─────────────────────────────────┐
│     Django Signals (pre/post)   │  1. pre_save: almacena old_instance
│     (core/signals.py)           │  2. post_save: compara deltas
└────────────────┬────────────────┘  3. Si no hay cambios reales (o solo updated_at): no crea log
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ INSERT en core_projectchangelog                             │
│ - action_type: 'PROJECT_UPDATE'                             │
│ - field_changes: {"budget": {"old": 1.2M, "new": 1.5M}}    │
│ - user_name: 'Carlos Mendoza'                               │
│ - description: '' (se genera al leer en el serializer)      │
└─────────────────────────────────────────────────────────────┘
```

### 5.3 Eventos Críticos y Diccionario de Datos del Trigger

#### A. Esquema Compacto del Log (`ProjectChangeLog`)
Para respetar el límite de **500 MB de Supabase Free Tier**, el registro almacena únicamente los campos modificados en formato compacto, eliminando redundancias y campos derivados:

| Campo | Tipo SQL | Descripción | Ejemplo |
| :--- | :--- | :--- | :--- |
| `id` | `BIGINT AUTO_INCREMENT` | Identificador único del evento. | `1042` |
| `project_id` | `INTEGER (FK)` | Referencia a `core_project`. | `5` |
| `action_type` | `VARCHAR(40)` | Código del evento. | `BUDGET_UPDATE`, `SCHEDULE_SHIFT`, `STATUS_CHANGE` |
| `field_changes` | `JSONB` | Deltas puros `{"campo": {"old": ..., "new": ...}}`. Sin métricas derivadas. | `{"budget": {"old": 10000, "new": 25000}}` |
| `description` | `VARCHAR(255)` | Opcional/vacío en BD; se calcula dinámicamente al leer en el serializer. | `""` |
| `user_name` | `VARCHAR(150)` | Actor fidedigno validado de `request.user` o `'system'`. | `Carlos Mendoza` |
| `date` | `DATE` | Fecha del cambio. | `2026-11-05` |
| `created_at` | `TIMESTAMP WITH TIME ZONE` | Timestamp UTC con índice simple para purgas. | `2026-11-05 12:21:49.123+00` |

#### B. Estructura Compacta de `field_changes` (JSONB)
Se eliminan datos redundantes (`difference`, `percentage_increase`, `days_shifted`, `old_display`, `new_display`) y el actor duplicado dentro del JSONB. Los cálculos se realizan al momento de la lectura:

```json
{
  "budget": { "old": 1200000.00, "new": 1500000.00 },
  "status": { "old": "PLANNING", "new": "IN_PROGRESS" },
  "end_date": { "old": "2026-10-15", "new": "2026-12-01" }
}
```

#### C. Índices Mínimos (Sin GIN)
Para evitar que los índices dupliquen el tamaño de la tabla en Supabase:
- **No se crea índice GIN** sobre `field_changes`.
- Solo se indexa `(project_id, created_at)` para consultas filtradas por proyecto y `created_at` para la purga periódica.

#### D. Medición Real de Huella de Almacenamiento en PostgreSQL
* **Medición sobre base de datos PostgreSQL local (esquema final con `project_code` y `project_name` incluidos):**
  - Columnas base y metadatos (`id`, `project_id`, `project_code`, `project_name`, `action_type`, `user_name`, `date`, `created_at`): **~131 bytes**.
  - Columna `field_changes` JSONB con 3 deltas simultáneos: **~190 bytes**.
  - Columna `description` vacía/dinámica: **1 byte** (el texto legible se genera al vuelo en el serializador).
  - Subtotal neto de datos por fila (`pg_column_size`): **~322 bytes** (la adición de `project_code` y `project_name` se compensa con creces al omitir el almacenamiento de descripciones estáticas repetitivas).
  - Sobrecarga de índices B-Tree (`pg_relation_size` para `pkey`, `(project_id, created_at)` y `created_at`): **~85–88 bytes por fila**.
  - **Huella física total por registro (datos + índices):** **~407–410 bytes** (holgadamente por debajo del límite presupuestado de 500 bytes).
* **Volumen proyectado con índices incluidos:**
  - 10 proyectos con 5 modificaciones diarias = ~50 logs/día = **~20.5 KB/día**.
  - En 180 días de operación: **~3.69 MB** totales de bitácora física en PostgreSQL.
  - Esto representa apenas el **0.74%** del límite de 500 MB de Supabase Free Tier.
* **Nota de calibración:** Las cifras de conteo inicial (10 filas en `ProjectChangeLog`, 16 en `TeamMemberChangeLog` y 4 en `SecurityAuditLog`) y las mediciones de bytes provienen de la base de datos local de desarrollo con datos de prueba, calibradas en el esquema definitivo.

#### E. Retención Diferenciada, Purga por Lotes y Monitoreo de Disco
1. **Comando de Purga por Lotes (`core/management/commands/purge_old_logs.py`):**
   - Soporta políticas de retención diferenciadas por tabla:
     - `--days-project`: 180 días (por defecto).
     - `--days-team`: 180 días (por defecto).
     - `--days-security`: 365 días (por defecto, para preservar evidencia forense de seguridad y credenciales sin impacto de espacio, dado su volumen < 5 logs/mes).
   - Borrado en lotes configurables de **5,000 filas** (`--batch-size 5000`) para evitar bloqueos de tabla.
   - Soporta simulación mediante flag `--dry-run` y `--days` para sobrescribir globalmente.
2. **Programación Automática con `pg_cron` en Supabase (1 job por tabla):**
   ```sql
   -- 1. Purga de historial de proyectos (retención: 180 días, 03:00 UTC)
   SELECT cron.schedule('purge-project-changelogs', '0 3 * * *', $$
     DELETE FROM core_projectchangelog
     WHERE id IN (
       SELECT id FROM core_projectchangelog
       WHERE created_at < now() - interval '180 days'
       LIMIT 5000
     );
   $$);

   -- 2. Purga de historial del equipo técnico (retención: 180 días, 03:15 UTC)
   SELECT cron.schedule('purge-team-changelogs', '15 3 * * *', $$
     DELETE FROM core_teammemberchangelog
     WHERE id IN (
       SELECT id FROM core_teammemberchangelog
       WHERE created_at < now() - interval '180 days'
       LIMIT 5000
     );
   $$);

   -- 3. Purga de auditoría de seguridad y credenciales (retención: 365 días, 03:30 UTC)
   SELECT cron.schedule('purge-security-auditlogs', '30 3 * * *', $$
     DELETE FROM core_securityauditlog
     WHERE id IN (
       SELECT id FROM core_securityauditlog
       WHERE created_at < now() - interval '365 days'
       LIMIT 5000
     );
   $$);
   ```
   *Alternativa sin costo adicional:* Workflow programado en GitHub Actions ejecutando `python manage.py purge_old_logs`.
3. **Consulta de Monitoreo de Tamaño de Tablas:**
   Para auditar el espacio en disco directamente en PostgreSQL o Supabase SQL Editor:
   ```sql
   SELECT relname, pg_size_pretty(pg_total_relation_size(relid)) AS total_size
   FROM pg_catalog.pg_statio_user_tables
   ORDER BY pg_total_relation_size(relid) DESC
   LIMIT 10;
   ```
   También accesible en el dashboard de Supabase en **Reports ➔ Database**.
4. **Fases Posteriores (Fuera de Alcance Actual):**
   - Exportación a Google Drive/S3 antes del purgado, vistas materializadas para KPIs y particionamiento mensual quedan para fases posteriores de crecimiento.

---

### 5.4 Implementación y Verificación (Rama `feat/audit-signals-and-changelog`)
- **Señales registradas (`core/signals.py`):**
  - `@receiver(pre_save, sender=Project)`: Captura en `_old_instance` el estado previo en la BD.
  - `@receiver(post_save, sender=Project)`: Compara deltas de campos críticos, omite logs si no hay cambios reales o solo cambió `updated_at`, y genera el registro compacto en `ProjectChangeLog`.
- **Inyección del Actor (`core/views.py`):** `ProjectViewSet` extrae el usuario autenticado (`request.user`) e ignora estrictamente cualquier `userName` o `user` enviado en el payload.
- **Vías de Escritura NO Auditadas por Signals (Limitaciones Explícitas Documentadas):**
  1. Sentencias SQL ejecutadas manualmente desde el SQL Editor o Table Editor del panel de Supabase.
  2. Mutaciones masivas directas con `QuerySet.update()` o `bulk_update()` que omiten el método `.save()`.
  3. La excepción operativa en `ProfileView.patch`: `TeamMember.objects.filter(email__iexact=old_email).update(email=new_email)` (sincronización utilitaria del correo de contacto al modificar perfil).
  *(Regla de desarrollo: Toda mutación de datos de negocio debe invocar `.save()` para garantizar la ejecución de los interceptores).*
- **Frontend desacoplado (`Portfolio.jsx`):** Eliminada la creación sintética de `newChange` en memoria. El cliente consulta directamente los logs generados por la BD vía `projectsApi.getProjectChangeLogs()`.
- **Generación Dinámica (`core/serializers.py`):** `ProjectChangeLogSerializer.get_change()` formatea dinámicamente el texto legible para la UI a partir de `field_changes`, soportando logs anteriores y nuevos.
- **Suite de Pruebas Automatizadas:** 90 pruebas de backend en Django (incluyendo `core/test_signals.py`) y 152 pruebas de frontend en Node/Vitest pasando al 100%.

---

## 6. Próximos Pasos para el Documento Final

1. Integrar diagramas de secuencia en formato SVG/Mermaid para el flujo de emisión y cumplimiento de órdenes de trabajo.
2. Añadir métricas comparativas de tiempo de respuesta (antes y después de la optimización de llamadas).
3. Consolidar el documento formal en PDF o Markdown profesional bajo `docs/arquitectura_relacional_y_optimizacion_api.md`.
