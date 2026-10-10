# Project Planner

Sistema de gestión y optimización de proyectos desarrollado con
**Django** (Backend REST API) y **React + Vite + Tailwind CSS** (Frontend
SPA).

---

## 🛠️ Arquitectura y Tecnologías

- **Backend:** Django 6.1, PostgreSQL (motor principal para local y producción en Render, con soporte para SQLite), `psycopg2-binary`, `dj-database-url`, `django-cors-headers`, `django-environ`.
- **Frontend:** React 19, Vite, Tailwind CSS, Axios, Lucide React.
- **Comunicación:** REST API (JSON) entre puertos `http://127.0.0.1:8000`
  (Django) y `http://localhost:5173` (React).

---

## ⚙️ Requisitos Previos

- Python 3.12+ (o 3.14)
- Node.js 18+ y npm
- PostgreSQL Server activo (Local o renderBD)

---

## 💻 Instalación y Puesta en Marcha

### 1. Clonar el repositorio

```bash
git clone <URL_DEL_REPOSITORIO>
cd project-planner
```

### 2. Configurar el Backend (Django)

```bash
# Crear y activar entorno virtual
python -m venv venv
venv\Scripts\activate      # En Windows
# source venv/bin/activate # En Mac/Linux

# Instalar dependencias
pip install -r requirements.txt

# Configurar variables de entorno
# Crear archivo .env en la raíz del proyecto basado en .env.example
# con tus credenciales de Base de Datos y SECRET_KEY
```

### 2.1 Crear la base de datos (PostgreSQL)

Antes de aplicar las migraciones, crea la base de datos:

**En PostgreSQL (Recomendado):**

```sql
CREATE DATABASE project_planner;
```

### 2.2 Aplicar migraciones

```bash
# Aplicar migraciones
python manage.py migrate
```

### 2.3 Cargar datos iniciales y usuarios (`seed_data`)

El comando `seed_data` gestiona la población inicial de la base de datos de manera modular:

```bash
# 1. Modo Estándar / Producción (Por defecto):
# Crea la infraestructura base (áreas técnicas, roles, estados y usuarios para login)
# dejando la base de datos limpia con 0 proyectos.
python manage.py seed_data

# 2. Modo Demostración (Uso exclusivo en Local / Pruebas):
# Inserta todo lo anterior MÁS 4 proyectos de prueba con sus hitos, tareas y métricas.
python manage.py seed_data --demo-projects

# 3. Limpieza y re-población completa:
# (Opcional) Borra registros existentes de core antes de sembrar los nuevos datos.
python manage.py seed_data --clear
python manage.py seed_data --clear --demo-projects

# Crear usuario Administrador (Project Manager)
python manage.py createsuperuser

# (Opcional) Listar usuarios registrados
python manage.py list_users
```

### 2.4 Ejecutar pruebas automatizadas del Backend

```bash
# Ejecutar suite de pruebas unitarias y de integración (10 pruebas)
python manage.py test core
```

> [!IMPORTANT]
> **Buenas Prácticas de Entornos: Base de Datos Local vs. Producción (Render)**
>
> - **Entorno Local (`localhost`):** Utiliza siempre la base de datos local para experimentación, pruebas visuales y comprobaciones con `--demo-projects`. Puedes crear, editar o purgar datos sin riesgo.
> - **Producción (Render):** La base de datos en la nube es la **fuente de la verdad**. Debe mantenerse estrictamente limpia de datos ficticios y operar únicamente con proyectos y registros reales generados desde la aplicación.

### 2.5 Iniciar el servidor backend (Puerto 8000)

```bash
python manage.py runserver
```

### 3. Configurar el Frontend (React)

Abre otra terminal:

```bash
# Entrar a la carpeta del frontend
cd frontend

# Instalar dependencias
npm install

# Configurar variables de entorno
# Crear archivo .env dentro de /frontend basado en .env.example
# con la URL del backend (VITE_API_URL)

# Iniciar servidor de desarrollo (Puerto 5173)
npm run dev
```

---

## 🔑 Variables de Entorno

### Backend (`.env` en la raíz del proyecto)

```env
SECRET_KEY=tu_secret_key_aqui
DEBUG=True

# Configuración de Base de Datos (PostgreSQL por defecto)
DB_ENGINE=postgresql
DB_NAME=project_planner
DB_USER=postgres
DB_PASSWORD=tu_password_aqui
DB_HOST=localhost
DB_PORT=5432

# (Opcional en Render) Conexión automática por URL
# DATABASE_URL=postgresql://usuario:password@host:5432/nombre_db

# Integración Make y Autodesk APS (Modelos 3D Revit)
MAKE_WEBHOOK_URL=https://hook.eu2.make.com/tu_webhook_aqui
APS_CLIENT_ID=tu_aps_client_id
APS_CLIENT_SECRET=tu_aps_client_secret
APS_BUCKET_KEY=planner_bucket_models
```

### Frontend (`frontend/.env`)

```env
VITE_API_URL=http://127.0.0.1:8000/api

# Control de datos de prueba (Mocks) en local:
# true  -> Oculta los mocks y muestra únicamente datos de la Base de Datos
# false -> Carga mocks iniciales de demostración
VITE_HIDE_MOCKS=false
```

> ⚠️ Ambos archivos `.env` están excluidos del control de versiones (`.gitignore`). Usa los archivos `.env.example` correspondientes como plantilla.

---

## ✅ Verificación de la Conexión

Una vez ambos servidores estén corriendo, abre `http://localhost:5173` y haz clic
en el botón **"Test BD & Backend"** (esquina inferior derecha). Este widget
verifica en tiempo real la conexión completa:

**Frontend → Django Backend → Base de Datos (PostgreSQL)**

Si todo está bien configurado, verás el estado "Conexión Exitosa" junto con
el nombre de la base de datos, versión del motor y latencia.

---

## 📖 Documentación de la API (Swagger & OpenAPI 3.0)

El backend cuenta con documentación OpenAPI 3.0 auto-generada e interactiva con **`drf-spectacular`**:

- **Swagger UI (Interactivo con pruebas en vivo):** `http://127.0.0.1:8000/api/docs/`
- **Redoc (Vista tipo especificación técnica):** `http://127.0.0.1:8000/api/redoc/`
- **Esquema OpenAPI en formato YAML:** `http://127.0.0.1:8000/api/schema/` (archivo local en [`docs/schema.yml`](file:///home/ronaldo/Documentos/GitHub/PROJECT%20PLANNER/project-planner/docs/schema.yml))
- **Catálogo Markdown para Obsidian / PDF:** [`docs/02. Documentación API y Endpoints.md`](file:///home/ronaldo/Documentos/GitHub/PROJECT%20PLANNER/project-planner/docs/02.%20Documentaci%C3%B3n%20API%20y%20Endpoints.md)

Para regenerar el archivo `schema.yml` manualmente:

```bash
python manage.py spectacular --file docs/schema.yml
```

---

## 📚 Documentación Técnica del Sistema (Bóveda de Obsidian & PDFs)

El proyecto incluye especificaciones completas de negocio, flujos y arquitectura dentro de la carpeta [`/docs/`](file:///home/ronaldo/Documentos/GitHub/PROJECT%20PLANNER/project-planner/docs):

1. **[`01. Flujo de Negocio y Procesos (Mermaid).md`](file:///home/ronaldo/Documentos/GitHub/PROJECT%20PLANNER/project-planner/docs/01.%20Flujo%20de%20Negocio%20y%20Procesos%20%28Mermaid%29.md):** Modelado visual del ciclo de vida, regla de aprobación ($100k) y disparadores de Make.
2. **[`02. Documentación API y Endpoints.md`](file:///home/ronaldo/Documentos/GitHub/PROJECT%20PLANNER/project-planner/docs/02.%20Documentaci%C3%B3n%20API%20y%20Endpoints.md):** Catálogo integral de endpoints REST, métodos HTTP y parámetros.
3. **[`03. Documentación Frontend.md`](file:///home/ronaldo/Documentos/GitHub/PROJECT%20PLANNER/project-planner/docs/03.%20Documentaci%C3%B3n%20Frontend.md):** Arquitectura por capas, modelo RBAC y suites de pruebas unitarias.
4. **[`04. Matriz de Historias de Usuario (HU).md`](file:///home/ronaldo/Documentos/GitHub/PROJECT%20PLANNER/project-planner/docs/04.%20Matriz%20de%20Historias%20de%20Usuario%20%28HU%29.md):** Matriz de Historias de Usuario (HU-01 a HU-12), criterios Gherkin y trazabilidad DoD.
5. **[`docs/assets/Diagrama Entidad.png`](file:///home/ronaldo/Documentos/GitHub/PROJECT%20PLANNER/project-planner/docs/assets/Diagrama%20Entidad.png):** Diagrama físico entidad-relación de la base de datos PostgreSQL.
6. **[`/docs/pdf/`](file:///home/ronaldo/Documentos/GitHub/PROJECT%20PLANNER/project-planner/docs/pdf):** Documentación técnica y diagramas originales listos para impresión.

### 🔮 ¿Cómo abrir la documentación en Obsidian?
Si utilizas **Obsidian**, puedes abrir y navegar esta documentación de forma nativa:
1. Abre Obsidian y haz clic en **"Abrir carpeta como bóveda"** (*Open folder as vault*).
2. Selecciona la carpeta `docs` (o la carpeta raíz clonada del repositorio).
3. ¡Listo! Se abrirán todas las notas interconectadas con sus enlaces, diagramas Mermaid interactivos y la vista de grafo preconfigurada en `.obsidian/`.

---

## 🌐 Comunicación CORS

El backend incluye `django-cors-headers` configurado en `settings.py` para permitir
peticiones HTTP desde `http://localhost:5173`.

---

## 📁 Estructura del Proyecto

```
project-planner/
├── config/              # Configuración principal de Django (settings, urls)
├── core/                # App Django con modelos, lógica de negocio y pruebas
│   ├── services/        # Conectores externos (Make, Drive, Autodesk APS)
│   └── tests.py         # Suite de pruebas unitarias y de integración
├── docs/                # Bóveda de Obsidian, especificaciones y PDFs
│   ├── assets/          # Diagrama Entidad y recursos visuales
│   ├── pdf/             # Documentos exportados para lectura o impresión
│   ├── .obsidian/       # Configuración compartida de Obsidian (grafos, plugins)
│   └── schema.yml       # Esquema OpenAPI 3.0 de la API REST
├── frontend/            # Aplicación React + Vite + Tailwind CSS
│   ├── src/
│   │   ├── components/  # Componentes reutilizables
│   │   ├── controllers/ # Orquestación de estado (useAppController)
│   │   ├── services/    # Clientes API (Axios)
│   │   ├── utils/       # Lógica pura de negocio y cálculos por módulo
│   │   └── views/       # Vistas organizadas por dominio funcional
│   └── tests/           # Suites de pruebas con Node.js Test Runner
├── venv/                # Entorno virtual (no se sube al repo)
├── .env.example
├── .gitignore
├── manage.py
└── requirements.txt
```

---

## 📋 Definición de Terminado (Definition of Done - DoD)

Para que una historia de usuario, módulo o corrección se considere **Done (Terminada)** e integrada en la rama principal (`main`), debe cumplir con los siguientes criterios de calidad:

### 1. ⚙️ Backend & Base de Datos (Django + PostgreSQL)

- [ ] Modelos relacionales y migraciones aplicados correctamente en PostgreSQL (`python manage.py migrate`).
- [ ] Endpoints REST estructurados bajo `/api/` con respuestas y códigos HTTP semánticos (`200`, `201`, `400`, `404`).
- [ ] **Seguridad y datos sensibles:** Contraseñas, claves de API, webhooks y credenciales de base de datos residen estrictamente en variables de entorno (`.env`), garantizando que información crítica nunca se exponga al frontend ni al repositorio público.

### 2. 🎨 Frontend & Arquitectura de Interfaz (React + Tailwind CSS)

- [ ] **Patrón modular por paneles:** Vistas estructuradas mediante componentes de diseño consistentes (Layouts, Barra lateral de navegación, Topbar y Paneles modales interactivos).
- [ ] **Diseño Responsivo:** Interfaz adaptable a diferentes resoluciones de pantalla (móvil, tablet y escritorio).
- [ ] **Experiencia de usuario:** Manejo visible de estados de carga (_loaders_), notificaciones de acción (_toasts_) y soporte para temas de interfaz (Claro y Oscuro).

### 3. 🧪 Verificación Funcional, Pruebas Automatizadas & Conectividad

- [ ] **Pruebas de Backend aprobadas:** Ejecución exitosa de la suite completa (`python manage.py test core`).
- [ ] **Pruebas de Frontend aprobadas:** Ejecución exitosa de las suites modulares (`npm run test:portfolio`, `npm run test:operations`, etc.).
- [ ] Verificación de enlace entre Backend y PostgreSQL mediante el widget de diagnóstico (`/api/test-db/`).
- [ ] Validación de integraciones activas (ej. test de ping en vivo con webhooks de Make).
- [ ] Verificación manual de permisos y roles de usuario (Administrador vs. Colaborador Técnico).

### 4. 🚀 Flujo de Trabajo en Git & Despliegue en Render

- [ ] **Trabajo organizado por ramas:** El desarrollo se realiza en ramas de características (`feature/nombre-tarea`, `refactor/...`) y solo se integran a `main` una vez probadas y validadas.
- [ ] Commits descriptivos bajo el estándar de _Conventional Commits_ (`feat:`, `fix:`, `docs:`, `refactor:`).
- [ ] **Despliegue verificado en Render:** Compilación exitosa y operativa en la nube tanto en el Web Service (Backend) como en el Static Site (Frontend).
