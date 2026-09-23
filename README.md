# Project Planner

Sistema de gestión y optimización de proyectos desarrollado con
**Django** (Backend REST API) y **React + Vite + Tailwind CSS** (Frontend
SPA).

---

## 🛠️ Arquitectura y Tecnologías

- **Backend:** Django 6.1, PostgreSQL (motor principal para local y producción en Render, con soporte opcional para MySQL y SQLite), `psycopg2-binary`, `dj-database-url`, `django-cors-headers`, `django-environ`.
- **Frontend:** React 19, Vite, Tailwind CSS, Axios, Lucide React.
- **Comunicación:** REST API (JSON) entre puertos `http://127.0.0.1:8000`
  (Django) y `http://localhost:5173` (React).

---

## ⚙️ Requisitos Previos

- Python 3.12+ (o 3.14)
- Node.js 18+ y npm
- PostgreSQL Server activo (o MySQL/MariaDB)

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

### 2.1 Crear la base de datos (PostgreSQL / MySQL)

Antes de aplicar las migraciones, crea la base de datos:

**En PostgreSQL (Recomendado):**
```sql
CREATE DATABASE project_planner;
```

**En MySQL / MariaDB (Opcional):**
```sql
CREATE DATABASE project_planner CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Puedes hacerlo desde DBeaver, psql, pgAdmin o el cliente de tu preferencia.

### 2.2 Aplicar migraciones

```bash
# Aplicar migraciones
python manage.py migrate
```

### 2.3 Cargar datos iniciales y usuarios

```bash
# Poblar áreas, roles, proyectos y usuarios de prueba (sistemas, civil, arquitectura)
python manage.py seed_data

# Crear usuario Administrador (Project Manager)
python manage.py createsuperuser

# (Opcional) Listar usuarios registrados
python manage.py list_users
```

### 2.4 Iniciar el servidor backend (Puerto 8000)

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
DB_NAME=project_planner
DB_USER=postgres
DB_PASSWORD=tu_password_aqui
DB_HOST=localhost
DB_PORT=5432

# (Opcional en Render) Conexión automática por URL
# DATABASE_URL=postgresql://usuario:password@host:5432/nombre_db
```

### Frontend (`frontend/.env`)

```env
VITE_API_URL=http://127.0.0.1:8000/api
```

> ⚠️ Ambos archivos `.env` están excluidos del control de versiones (`.gitignore`). Usa los archivos `.env.example` correspondientes como plantilla.

---

## ✅ Verificación de la Conexión

Una vez ambos servidores estén corriendo, abre `http://localhost:5173` y haz clic
en el botón **"Test BD & Backend"** (esquina inferior derecha). Este widget
verifica en tiempo real la conexión completa:

**Frontend → Django Backend → Base de Datos (PostgreSQL / MySQL)**

Si todo está bien configurado, verás el estado "Conexión Exitosa" junto con
el nombre de la base de datos, versión del motor y latencia.

---

## 🌐 Comunicación CORS

El backend incluye `django-cors-headers` configurado en `settings.py` para permitir
peticiones HTTP desde `http://localhost:5173`.

---

## 📁 Estructura del Proyecto

```
project-planner/
├── config/              # Configuración principal de Django (settings, urls)
├── core/                # App Django con la lógica de negocio
├── frontend/             # Aplicación React + Vite
│   ├── src/
│   │   ├── components/  # Componentes reutilizables
│   │   ├── services/    # Clientes API (Axios)
│   │   └── views/       # Vistas/pantallas de la aplicación
│   └── .env.example
├── venv/                # Entorno virtual (no se sube al repo)
├── .env.example
├── .gitignore
├── manage.py
└── requirements.txt
```
