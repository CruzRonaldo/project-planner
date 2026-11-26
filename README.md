# Project Planner

Sistema de gestión y optimización de proyectos desarrollado con **Django** (Backend REST API) y **React + Vite + Tailwind CSS** (Frontend SPA).

---

## Arquitectura y Tecnologías

| Capa | Tecnologías |
| :--- | :--- |
| **Backend** | Python 3.12+, Django 6.1, Django REST Framework, `drf-spectacular` |
| **Base de Datos** | PostgreSQL 14+ (motor principal para persistencia relacional y extensiones) |
| **Frontend** | React 19, Vite, Tailwind CSS, Axios, Lucide React |
| **Comunicación** | REST API (JSON) entre `http://127.0.0.1:8000` (Django) y `http://localhost:5173` (React) |

---

## Requisitos Previos

Antes de comenzar, asegúrate de contar con las siguientes herramientas instaladas en tu sistema:

* **Git:** Para control de versiones y clonación del repositorio.
* **Python:** 3.12 o superior (con `pip` y soporte para `venv`).
* **Node.js:** 18 o superior (con `npm`).
* **PostgreSQL Server activo**

---

## Instalación y Puesta en Marcha

### 1. Clonar el repositorio

```bash
git clone https://github.com/InmobiliariaPolyline/project-planner.git
cd project-planner
```

### 2. Configurar el Backend (Django)

1. **Crear y activar el entorno virtual:**

   * En Linux / macOS:
     ```bash
     python -m venv venv
     source venv/bin/activate
     ```
   * En Windows (PowerShell):
     ```powershell
     python -m venv venv
     .\venv\Scripts\Activate.ps1
     ```
   * En Windows (CMD):
     ```cmd
     python -m venv venv
     venv\Scripts\activate.bat
     ```

2. **Instalar dependencias de Python:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Crear la base de datos en PostgreSQL:**
   Asegúrate de que PostgreSQL esté activo y crea la base de datos `project_planner` en tu cliente preferido (`psql`, pgAdmin, DBeaver):
   ```sql
   CREATE DATABASE project_planner;
   ```
   *(También puedes consultar el script de inicialización en [scripts/database_setup.sql](scripts/database_setup.sql)).*

4. **Configurar variables de entorno (`.env`):**
   Copia el archivo de plantilla en la raíz del proyecto:
   ```bash
   # En Linux / macOS:
   cp .env.example .env

   # En Windows:
   copy .env.example .env
   ```
   Abre `.env` y configura tus credenciales de PostgreSQL:
   ```env
   SECRET_KEY=clave-secreta-para-desarrollo-local
   DEBUG=True

   # Conexión a PostgreSQL Local
   DB_ENGINE=postgresql
   DB_NAME=project_planner
   DB_USER=postgres
   DB_PASSWORD=tu_password_aqui
   DB_HOST=localhost
   DB_PORT=5432

   # Desactivar 2FA temporalmente para desarrollo local
   DISABLE_2FA=True
   ```

   > [!TIP]
   > **Desarrollo Local sin 2FA:** Establecer `DISABLE_2FA=True` permite ingresar con los usuarios administradores directamente con usuario y contraseña, evitando la solicitud de códigos TOTP.

5. **Aplicar migraciones:**
   ```bash
   python manage.py migrate
   ```

6. **Cargar datos iniciales y usuarios (`seed_data`):**
   ```bash
   # Catálogo base (roles, estados y áreas técnicas con base limpia)
   python manage.py seed_data

   # (Recomendado para desarrollo) Cargar proyectos, hitos y datos de demostración
   python manage.py seed_data --demo-projects

   # (Opcional) Limpieza completa y repoblación desde cero
   python manage.py seed_data --clear --demo-projects

   # Crear superusuario administrativo personalizado
   python manage.py createsuperuser
   ```

7. **Iniciar el servidor backend:**
   ```bash
   python manage.py runserver
   ```
   El backend estará disponible en **`http://127.0.0.1:8000/`**.
   * Documentación interactiva Swagger UI: `http://127.0.0.1:8000/api/docs/`
   * Especificación técnica Redoc: `http://127.0.0.1:8000/api/redoc/`
   * Panel de Administración de Django: `http://127.0.0.1:8000/admin/`

---

### 3. Configurar el Frontend (React)

En una **segunda terminal**, navega al directorio del cliente web:

1. **Instalar dependencias de Node.js:**
   ```bash
   cd frontend
   npm install
   ```

2. **Configurar variables de entorno (`frontend/.env`):**
   Copia la plantilla dentro de `frontend/`:
   ```bash
   # En Linux / macOS:
   cp .env.example .env

   # En Windows:
   copy .env.example .env
   ```
   Configuración predeterminada en `frontend/.env`:
   ```env
   # URL base de la API Backend (Django)
   VITE_API_URL=http://127.0.0.1:8000/api

   # true: Muestra únicamente datos reales de la Base de Datos (Recomendado)
   # false: Carga datos simulados iniciales (Mocks)
   VITE_HIDE_MOCKS=true
   ```

3. **Iniciar el servidor de desarrollo:**
   ```bash
   npm run dev
   ```
   La aplicación web estará disponible en **`http://localhost:5173/`**.

---

## Credenciales de Acceso Local

Si ejecutaste `python manage.py seed_data`, puedes acceder de inmediato con las siguientes cuentas de prueba:

| Rol en Sistema | Correo de Acceso | Contraseña | Perfil y Alcance |
| :--- | :--- | :--- | :--- |
| **Project Manager (Admin)** | `admin.sistemas@projectplanner.com` | `password123` | Gestión completa, gobernanza, asignación presupuestaria y administración |
| **Equipo Técnico (Usuario)** | `dev.sistemas@projectplanner.com` | `password123` | Ficha técnica de terreno, avance de hitos y consulta operativa |

*(Existen cuentas análogas para las áreas de Civil y Arquitectura: `admin.civil@projectplanner.com`, `dev.civil@projectplanner.com`, etc., todas con la contraseña `password123`).*

---

## Pruebas Automatizadas

* **Pruebas del Backend (Django):**
  ```bash
  python manage.py test core
  ```

* **Pruebas del Frontend (Node.js Test Runner):**
  ```bash
  cd frontend
  npm test
  ```

* **Análisis Estático de Código (Linter Frontend):**
  ```bash
  cd frontend
  npm run lint
  ```

---

## Documentación Técnica para Desarrolladores

Para comprender la arquitectura interna, diseño de controladores y especificaciones técnicas, consulta los documentos de referencia en `docs/`:

* **[Directrices de Arquitectura y Estándares](./docs/architecture.md):** Clean Code, principios SOLID, diseño ergonómico y catálogo de componentes compartidos.
* **[Catálogo de Endpoints y API REST](./docs/general/02.%20Documentación%20API%20y%20Endpoints.md):** Especificación completa de Django REST Framework, parámetros y contratos de respuesta.
* **[Arquitectura Frontend y React](./docs/general/03.%20Documentación%20Frontend.md):** Separación de capas (Vistas, Controladores, Servicios), manejo de estado reactivo y políticas de guards RBAC.
* **[Especificación Modular](./docs/modules/README.md):** Lógica de negocio, modelos relacionales y endpoints por módulo.
* **[Matriz de Historias de Usuario (HU)](./docs/general/04.%20Matriz%20de%20Historias%20de%20Usuario%20(HU).md):** Criterios de aceptación (Gherkin), trazabilidad y Definition of Done (DoD).
* **[Plan de Incorporación Futura de Coze](./docs/general/06-plan-integracion-coze.md):** Tarea técnica pendiente para la integración opcional de Coze como proveedor del asistente IA (RAG con pgvector) bajo el modelo de menor privilegio.

---

## Estructura del Repositorio

```
project-planner/
├── config/              # Configuración global de Django (settings, urls, wsgi)
├── core/                # Dominio de negocio, modelos relacionales y vistas de API
│   ├── management/      # Comandos personalizados (seed_data, backups, etc.)
│   ├── migrations/      # Migraciones de esquema versionadas
│   ├── services/        # Conectores y lógica de negocio especializada
│   └── tests.py         # Suite de pruebas automatizadas
├── docs/                # Base de conocimiento y especificaciones técnicas
├── frontend/            # Cliente SPA (React 19 + Vite + Tailwind CSS)
│   ├── src/             # Componentes, controladores, servicios y vistas
│   └── tests/           # Suites de pruebas funcionales
├── manage.py            # CLI de administración de Django
└── requirements.txt     # Dependencias del backend
```

---

## Buenas Prácticas y Seguridad

* **Seguridad y Auditoría OWASP (ZAP):** Cumplimiento estricto de directivas OWASP Top 10 (sanitización rigurosa de entradas contra inyecciones, cabeceras HTTP de seguridad CSP, `X-Frame-Options: SAMEORIGIN`, `X-Content-Type-Options: nosniff` y auditoría de vulnerabilidades con OWASP ZAP).
* **Rendimiento y Pruebas de Carga (JMeter):** Validación de resiliencia y tiempos de respuesta de los endpoints de la API REST mediante pruebas de carga y estrés con Apache JMeter.
* **Aislamiento de Entornos (BD Local vs. Producción):** Realizar siempre las pruebas de desarrollo, experimentación y población de datos demo (`--demo-projects`) en la base de datos local (`localhost`). La base de datos de producción debe mantenerse protegida y como fuente de la verdad únicamente con datos reales.
* **Flujo de Ramas en Git (Protección de `main`):** No realizar cambios ni *push* directos sobre la rama `main`. Todo desarrollo debe gestionarse a través de ramas específicas (`feat/`, `fix/`, `refactor/`, `docs/`) y validarse exhaustivamente antes de su integración.
* **Gestión de Secretos:** Todas las claves de API, secretos de sesión y conexiones a bases de datos residen estrictamente en variables de entorno (`.env`), nunca en el repositorio.
