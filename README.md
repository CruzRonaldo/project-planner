# Project Planner

> Plataforma integral de gestión, optimización y seguimiento estratégico de proyectos de ingeniería y construcción.

Project Planner centraliza el ciclo de vida completo de proyectos corporativos: desde la planificación estratégica y diagramación de Gantt con cálculo de ruta crítica, hasta la gestión operativa de órdenes de trabajo, control de recursos humanos y auditoría de datos en tiempo real.

---

## 🚀 Características Principales

* **Portafolio de Proyectos:** Supervisión de métricas clave (KPIs), presupuestos, fases operativas y control de gobernanza con reglas de aprobación.
* **Planificación Estratégica & Gantt:** Cronograma multianual interactivo, estimación de dependencias, cálculo de ruta crítica y análisis predictivo de tiempos.
* **Operaciones & Órdenes de Trabajo:** Desglose modular de tareas, control de prioridades, estados de avance y asignaciones técnicas.
* **Gestión de Recursos Humanos:** Administración de equipos, balance de carga de trabajo, disponibilidad por áreas y control de acceso basado en roles (RBAC).
* **Auditoría & Respaldos de Base de Datos:** Motor automatizado de copias de seguridad `.dump` en PostgreSQL con verificación criptográfica SHA-256 e historial de restauraciones.
* **Integraciones Industriales:** Visualización 3D de modelos BIM (Autodesk APS) y webhooks para automatizaciones con Make.

---

## 🛠️ Stack Tecnológico

| Capa | Tecnologías |
| :--- | :--- |
| **Backend** | Python 3.12+, Django 6.1, Django REST Framework, PostgreSQL |
| **Frontend** | React 19, Vite, Tailwind CSS, Lucide Icons, Axios |
| **API & Documentación** | OpenAPI 3.0, Swagger UI, Redoc (`drf-spectacular`) |
| **Seguridad & Datos** | `psycopg2-binary`, `django-environ`, `django-cors-headers` |

---

## 📋 Requisitos Previos

Asegúrate de contar con las siguientes herramientas instaladas:

* **Python:** 3.12 o superior
* **Node.js:** 18 o superior (con npm)
* **PostgreSQL:** 14 o superior en ejecución (local o en la nube)

---

## ⚙️ Instalación y Configuración

### 1. Clonar el repositorio

```bash
git clone https://github.com/.../project-planner.git
cd project-planner
```

### 2. Configurar el Backend (Django)

1. **Crear y activar el entorno virtual:**
   ```bash
   # En Linux / macOS:
   python -m venv venv
   source venv/bin/activate

   # En Windows:
   python -m venv venv
   venv\Scripts\activate
   ```

2. **Instalar dependencias de Python:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Configurar variables de entorno:**
   Crea un archivo `.env` en la raíz del proyecto tomando como plantilla `.env.example`:
   ```env
   SECRET_KEY=tu_clave_secreta_aqui
   DEBUG=True

   # Conexión a PostgreSQL
   DB_ENGINE=postgresql
   DB_NAME=project_planner
   DB_USER=postgres
   DB_PASSWORD=tu_password
   DB_HOST=localhost
   DB_PORT=5432
   ```

4. **Migraciones y datos iniciales:**
   ```bash
   # Aplicar migraciones
   python manage.py migrate

   # Cargar catálogo base (roles, estados, áreas técnicas)
   python manage.py seed_data

   # (Opcional) Cargar proyectos y datos de prueba para demostración
   python manage.py seed_data --demo-projects

   # Crear usuario administrador
   python manage.py createsuperuser
   ```

5. **Iniciar el servidor backend:**
   ```bash
   python manage.py runserver
   ```

---

### 3. Configurar el Frontend (React)

En una terminal independiente:

1. **Navegar a la carpeta del frontend e instalar dependencias:**
   ```bash
   cd frontend
   npm install
   ```

2. **Configurar variables de entorno:**
   Crea el archivo `frontend/.env` basado en `frontend/.env.example`:
   ```env
   VITE_API_URL=http://127.0.0.1:8000/api
   VITE_HIDE_MOCKS=true
   ```

3. **Iniciar el servidor de desarrollo:**
   ```bash
   npm run dev
   ```

---

### 4. Acceso Rápido y Credenciales de Prueba

Una vez iniciados ambos servidores:

* **Aplicación Web (Frontend):** [http://localhost:5173](http://localhost:5173)
* **API REST & Documentación Interactiva (Swagger UI):** [http://127.0.0.1:8000/api/docs/](http://127.0.0.1:8000/api/docs/)
* **Panel de Administración de Django:** [http://127.0.0.1:8000/admin/](http://127.0.0.1:8000/admin/)

Si ejecutaste `python manage.py seed_data`, puedes acceder de inmediato con las siguientes cuentas de prueba:

| Rol en Sistema | Correo de Acceso | Contraseña | Perfil y Alcance |
| :--- | :--- | :--- | :--- |
| **Project Manager (Admin)** | `admin.sistemas@projectplanner.com` | `password123` | Gestión completa, gobernanza, asignación presupuestaria y 2FA |
| **Equipo Técnico (Usuario)** | `dev.sistemas@projectplanner.com` | `password123` | Ficha técnica de terreno, avance de hitos y consulta operativa |

---

## 📚 Centro de Documentación (`/docs`)

El proyecto cuenta con especificaciones completas para diferentes perfiles, centralizadas en el directorio [`docs/`](docs/):

### 👤 Para Usuarios y Operación
* **[Manual de Usuario Operativo](./docs/manual-usuario/README.md):** Guía visual paso a paso organizada por módulos, navegación por roles, acciones permitidas y resolución de incidencias.
* **[Auditoría de Accesibilidad WCAG 2.2 AA](./docs/general/05-analisis-accesibilidad-wcag.md):** Evaluación y matriz de cumplimiento de accesibilidad web nivel AA.

### 💻 Para Desarrolladores y Arquitectura
* **[Centro de Documentación (Índice Maestro)](./docs/README.md):** Mapa general de navegación técnica y base de conocimiento del proyecto.
* **[Directrices de Arquitectura y Estándares](./docs/architecture.md):** Clean code, principios SOLID, diseño multitema ergonómico y catálogo de componentes comunes.
* **[Catálogo de Endpoints y API REST](./docs/general/02.%20Documentación%20API%20y%20Endpoints.md):** Especificación completa de Django REST Framework, parámetros y respuestas.
* **[Arquitectura Frontend y RBAC](./docs/general/03.%20Documentación%20Frontend.md):** Capas de presentación, controladores reactivos, servicios y políticas de guards.
* **[Especificación Modular](./docs/modules/):** Documentación técnica 360° de cada módulo de backend y base de datos.
* **[Matriz de Historias de Usuario (HU)](./docs/general/04.%20Matriz%20de%20Historias%20de%20Usuario%20(HU).md):** Trazabilidad, criterios de aceptación Gherkin y Definition of Done (DoD).

---

## 📁 Estructura del Repositorio

```
project-planner/
├── config/              # Configuración global de Django (settings, urls, wsgi)
├── core/                # Dominio de negocio, modelos relacionales y vistas de API
│   ├── management/
│   │   └── commands/    # Comandos personalizados (seed_data, backups, purge_old_logs)
│   ├── migrations/      # Migraciones de esquema versionadas
│   ├── services/        # Conectores externos (Make, Autodesk APS)
│   ├── signals.py       # Auditoría automática (bitácora de cambios de proyecto)
│   ├── test_signals.py  # Pruebas de auditoría, helper de IP y purga
│   └── tests.py         # Suite de pruebas unitarias y de integración
├── docs/                # Documentación técnica, diagramas ER y especificaciones
├── frontend/            # Cliente SPA (React + Vite + Tailwind CSS)
│   ├── src/
│   │   ├── components/  # Componentes reutilizables de UI
│   │   ├── controllers/ # Gestión y orquestación de estado
│   │   ├── services/    # Clientes HTTP (Axios)
│   │   └── views/       # Vistas y paneles por módulo
│   └── tests/           # Suites de pruebas funcionales
├── manage.py            # CLI de administración de Django
└── requirements.txt     # Dependencias del backend
```

---

## 🧪 Pruebas Automatizadas

* **Pruebas de Backend (Django):**
  ```bash
  python manage.py test core
  ```

* **Pruebas de Frontend (React):**
  ```bash
  cd frontend
  npm test
  ```

---

## 🔒 Buenas Prácticas y Seguridad

* **Aislamiento de Entornos (BD Local vs. Producción):** Realizar siempre las pruebas de desarrollo, experimentación y población de datos demo (`--demo-projects`) en la base de datos local (`localhost`). La base de datos de producción debe mantenerse protegida y como fuente de la verdad únicamente con datos reales.
* **Flujo de Ramas en Git (Protección de `main`):** No realizar cambios ni *push* directos sobre la rama `main`. Todo desarrollo debe gestionarse a través de ramas específicas (`feat/`, `fix/`, `refactor/`) y validarse exhaustivamente antes de su integración.
* **Gestión de Credenciales:** Todas las claves de API, secretos de sesión y conexiones a bases de datos residen estrictamente en variables de entorno (`.env`), nunca en el repositorio.
* **Integridad de Datos:** Respaldos automáticos y manuales con sumas de verificación criptográficas SHA-256 antes de cualquier restauración.
* **Control de Acceso:** Políticas RBAC para restringir acciones sensibles exclusivamente a administradores y líderes de proyecto.
