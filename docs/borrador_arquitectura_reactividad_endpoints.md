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

## 5. Próximos Pasos para el Documento Final

1. Integrar diagramas de secuencia en formato SVG/Mermaid para el flujo de emisión y cumplimiento de órdenes de trabajo.
2. Añadir métricas comparativas de tiempo de respuesta (antes y después de la optimización de llamadas).
3. Consolidar el documento formal en PDF o Markdown profesional bajo `docs/arquitectura_relacional_y_optimizacion_api.md`.
