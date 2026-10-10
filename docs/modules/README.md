# 📚 Documentación Modular por Dominios — Project Planner

Bienvenido al compendio de documentación modular de **Project Planner**. Esta carpeta reúne la especificación técnica, reglas de negocio, modelos de base de datos, endpoints REST y pruebas de cada módulo del sistema en un formato autocontenido de 360° (*Vertical Slice*).

---

## 📑 Catálogo de Módulos

| N° | Módulo | Rutas | Responsabilidad Principal | Estado |
| :---: | :--- | :---: | :--- | :---: |
| **00** | [**Panel de Control (Dashboard)**](./00-panel-de-control-dashboard.md) | `/dashboard`, `/` | KPIs consolidados, mini-Gantt semestral, alertas de ruta crítica y dona presupuestaria. | 🟢 100% |
| **01** | [**Autenticación y Seguridad (RBAC)**](./01-autenticacion-y-seguridad.md) | `/login`, `/roles`, `/configuracion` | Login seguro, control de presencia en tiempo real, roles (`ADMIN`, `USER`, SubAdmin) y guards. | 🟢 100% |
| **02** | [**Planificación Estratégica**](./02-planificacion-estrategica.md) | `/planning` | Calendario maestro Gantt (12 meses), hitos globales, auditoría de reajustes y regla $100k. | 🟢 100% |
| **03** | [**Portafolio de Proyectos**](./03-portafolio-de-proyectos.md) | `/portfolio` | Inventario centralizado, cálculo de duraciones, códigos `PRJ-YYYY-XXX` y webhook a Make. | 🟢 100% |
| **04** | [**Gestión Operativa y Motor de Tiempos**](./04-gestion-operativa-y-motor-tiempos.md) | `/operations` | Órdenes de trabajo, ruta crítica y motor matemático de compresión de tiempos con tolerancia de 7d. | 🟡 85% |
| **05** | [**Directorio Técnico y Recursos Humanos**](./05-directorio-tecnico-y-rrhh.md) | `/team`, `/human-resources` | Alta atómica de técnicos y usuarios, matrices de disponibilidad (Active/Stand-by) y cálculo de licencias. | 🟢 90% |
| **06** | [**Integraciones Externas**](./06-integraciones-externas.md) | `/integrations` | Automatizaciones Make (Discord/Gmail), Google Drive API y visor BIM 3D Autodesk APS (Revit). | 🟢 100% |

---

## 🧭 ¿Cómo leer esta documentación?

Cada documento de módulo sigue el mismo estándar estructurado:
1. **Propósito y Alcance:** Qué problema resuelve y para qué roles aplica.
2. **Reglas de Negocio:** Algoritmos, límites, factores reductores y reglas de gobernanza.
3. **Flujo de Trabajo:** Diagramas secuenciales o de flujo interactivos en formato Mermaid.
4. **Modelo de Datos:** Tablas y entidades relacionales de PostgreSQL asociadas.
5. **Endpoints REST:** Métodos HTTP, URLs de API y acciones soportadas.
6. **Pruebas Automatizadas:** Suites de pruebas unitarias y de integración asociadas (`npm test` y `manage.py test`).
