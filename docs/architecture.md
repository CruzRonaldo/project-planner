# Project Planner — Directrices de Arquitectura y Estándares de Desarrollo

Este documento establece los estándares de calidad de software, arquitectura modular, catálogo de componentes comunes y directrices para el desarrollo colaborativo y multi-agente en **Project Planner**.

---

## 1. Principios de Clean Code y Estándares de Calidad

1. **Legibilidad y Nombres Significativos:**
   - Emplear nombres que revelen intención sin ambigüedades en variables, funciones, componentes y módulos.
   - Prohibido el uso de nombres genéricos, crípticos o abreviaturas opacas (`data`, `temp`, `res`, `val`, `aux`, `item`).
   - Funciones con verbos (`calculateMetrics`, `getUserProfile`, `validateOrderState`); clases y componentes con sustantivos (`ProjectController`, `InvoiceService`, `ModalDialog`).

2. **Funciones Pequeñas y de Responsabilidad Única:**
   - Cada función o método realiza una sola tarea y la ejecuta con precisión.
   - Reducción de complejidad ciclomática mediante cláusulas de guarda (*early return*).
   - Sin efectos secundarios ocultos: los métodos de consulta no deben mutar estado inadvertidamente.

3. **Manejo Robusto y Explicativo de Errores:**
   - Prohibido silenciar excepciones con bloques vacíos (`except: pass` o `catch (e) {}`).
   - Capturar excepciones específicas, registrar diagnósticos contextuales y transformar fallos en respuestas controladas.

4. **Cero Código Muerto y Principio DRY (Don't Repeat Yourself):**
   - Prohibido dejar bloques de código comentado, archivos residuales obsoletos o imports sin uso.
   - Si una lógica o transformación se utiliza en más de un lugar, se abstrae en una utilidad compartida dentro de `frontend/src/utils/`.

---

## 2. Diseños de Arquitectura y Separación por Capas

1. **Separación Estricta de Responsabilidades:**
   - **Presentación (UI):** Componentes limpios, declarativos y desacoplados del transporte HTTP (`frontend/src/views/`).
   - **Controladores y Estado:** Centralización del ciclo de vida y estado reactivo sin mezclar maquetado (`frontend/src/controllers/useAppController.jsx`).
   - **Capa de Servicios / API:** Abstracción unificada para llamadas de red y contratos REST (`frontend/src/services/projectsApi.js`, `frontend/src/services/api.js`). Ningún componente React ejecuta `fetch` o `axios` directamente.
   - **Capa de Dominio / Datos:** Modelos de negocio, validaciones relacionales e integridad en Django (`core/models.py`, `core/views.py`, `core/serializers.py`).

2. **Arquitectura Basada en Dominios (Domain-Driven Design):**
   - El código se estructura por módulos o dominios funcionales cohesivos:
     - `frontend/src/views/technical/` (Operaciones, Portafolio, Directorio Técnico)
     - `frontend/src/views/admin/` (Planificación Estratégica, Gestión de Roles, Configuración)
     - `frontend/src/views/human-resources/` (Matriz de Personal e Incidencias)
     - `frontend/src/views/common/` (Dashboard, Pantalla de Carga, Login)

3. **Principios SOLID en Componentes y Servicios:**
   - **S (Single Responsibility):** Cada componente o módulo tiene una sola razón para cambiar.
   - **O (Open/Closed):** Diseños extensibles mediante props sin modificar el núcleo probado.
   - **L (Liskov Substitution):** Componentes polimórficos intercambiables según el rol de usuario.
   - **I (Interface Segregation):** Props e interfaces específicas; ningún componente depende de props innecesarias.
   - **D (Dependency Inversion):** Los componentes de presentación dependen de abstracciones y callbacks, no de implementaciones concretas de transporte.

4. **Única Fuente de Verdad (Single Source of Truth) y Cero Mocks en Producción:**
   - Cada entidad de negocio (proyectos, integrantes, hitos, órdenes) tiene un único punto canónico de persistencia en Django.
   - El frontend consume datos reales respetando los esquemas oficiales.

---

## 3. Catálogo Consolidado de Componentes Base (UI Kit Común)

Ubicación obligatoria: `frontend/src/components/common/`

| Componente | Archivo | Propósito y Reglas de Uso |
| :--- | :--- | :--- |
| `<ModalDialog />` | `frontend/src/components/common/ModalDialog.jsx` | Contenedor modal accesible con overlay difuminado, soporte para tecla Escape, bloqueo de scroll y slots para encabezado, cuerpo y pie. Prohibido maquetar modales con divs flotantes locales. |
| `<Pagination />` | `frontend/src/components/common/Pagination.jsx` | Paginación unificada con botones de navegación accesible, selector de página y contador dinámico de registros. Soporta prop `hideOnSinglePage`. |
| `<MemberAvatar />` | `frontend/src/components/common/MemberAvatar.jsx` | Avatar unificado con generación determinista de iniciales y paleta de fondo según nombre. Admite objetos de integrantes, strings o registros de RR. HH. |
| `<Button />` | `frontend/src/components/common/Button.jsx` | Botón interactivo con variantes `primary`, `secondary`, `danger`, `ghost`, soporte de loading y focus ring accesible. |
| `<Input />` | `frontend/src/components/common/Input.jsx` | Campo de formulario con soporte de labels, mensajes de error accesibles y clases dinámicas por tema. |
| `<Select />` | `frontend/src/components/common/Select.jsx` | Selector desplegable tipado, compatible tanto con arreglo de opciones como con hijos nativos `<option>`. |
| `<SortDropdown />` | `frontend/src/components/common/SortDropdown.jsx` | Desplegable de ordenamiento accesible con soporte de dirección ascendente y descendente. |

### Regla de los Dos Usos (Rule of Two)
Si un componente, variante de interfaz o función de transformación se requiere en dos dominios distintos, se promueve inmediatamente a `components/common/` o `utils/` respectivamente.

---

## 4. Sistema de Diseño Multitema

Es mandatorio importar y usar las clases semánticas centralizadas de `frontend/src/constants/themeClasses.js`:
- `cardClass`: Contenedores de tarjetas con fondo y borde adaptativo (`bg-white dark:bg-[#161b22] midnight:bg-[#0d1527]`).
- `headingClass`: Títulos con contraste asegurado en Claro, Oscuro y Medianoche.
- `mutedClass`: Textos secundarios y metadatos.
- `inputClass`: Controles de entrada de datos compatibles con los tres temas.

Prohibido utilizar clases de fondo fijo (`bg-white` o `bg-slate-900`) sin contemplar los temas oscuro y medianoche correspondientes.

---

## 5. Motor de Geometría Temporal (`utils/gantt.js`)

Todos los cronogramas, calendarios y diagramas de Gantt (`StrategicPlanning`, `Operations`, `DashboardContent`) se rigen por el motor puro de cálculo temporal:
- **Índice Absoluto Continuo:** `monthIndex(d) = d.getFullYear() * 12 + d.getMonth()`. Permite escalas semestrales, anuales o móviles con cruce de año sin fechas fijas ni heurísticas.
- **Ventana y Recorte:** `getBarGeometry` calcula porcentajes exactos (`leftPct`, `widthPct`) y banderas de recorte (`clippedLeft`, `clippedRight`).
- **Ventana Móvil:** `getRollingWindow(referenceDate, windowMonths, monthsBack)` calcula la ventana relativa desde el mes actual con cruce de año garantizado.
- **Marcadores de Continuación:** Indicadores visuales (`◀` y `▶`) con borde responsivo y contraste verificado en los tres temas.

---

## 6. Gobernanza, Auditoría y Seguridad

1. **Control de Acceso Basado en Roles (RBAC):**
   - Vistas y acciones restringidas según rol (`is_staff`, `is_superuser`, sub-administradores o clientes no autenticados en modo lectura).
   - Regla de Gobernanza de $100k (`evaluateProjectGovernance`): proyectos con presupuesto superior a $100,000 requieren aprobación por Comité Directivo.

2. **Auditoría de Cambios:**
   - **Proyectos:** Creación de entradas en `ProjectChangeLog` ante cambios de líder, fechas o presupuesto.
   - **Cronogramas:** Creación de registros en `ScheduleAdjustment` ante reajustes de calendario maestro en Planificación.

---

## 7. Red de Seguridad y Verificación Continua (CI Guard)

Antes y después de cualquier cambio arquitectónico o refactorización, debe ejecutarse y validarse la suite de pruebas completa:
- **Frontend SSR y Unitario:** `npm test` en el directorio `frontend/` (Node.js test runner con Vite SSR).
- **Backend Django:** `python manage.py test core.tests core.test_personnel_incidents` en el entorno virtual.
- **Compilación de Producción:** `npm run build` en `frontend/` sin errores de módulos ni bundle.
