# Project Planner

Sistema de gestión y optimización de proyectos desarrollado con
**Django** (Backend REST API) y **React + Vite + Tailwind CSS** (Frontend
SPA).

---

## 🛠️ Arquitectura y Tecnologías

- **Backend:** Django 6.1, MySQL Server, `django-cors-headers` (para permitir la comunicación segura entre puertos), `django-environ` (para variables de entorno).
- **Frontend:** React 19, Vite, Tailwind CSS, Axios, Lucide React.
- **Comunicación:** REST API (JSON) entre puertos `http://127.0.0.1:8000`
  (Django) y `http://localhost:5173` (React).

---

## ⚙️ Requisitos Previos

- Python 3.12+ (o 3.14)
- Node.js 18+ y npm
- MySQL Server activo

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
# con tus credenciales de MySQL y SECRET_KEY
```

### 2.1 Crear la base de datos en MySQL

Antes de aplicar las migraciones, crea la base de datos (Django no la crea automáticamente):

```sql
CREATE DATABASE project_planner CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Puedes hacerlo desde MySQL Workbench, la terminal de MySQL, o cualquier cliente de tu preferencia.

### 2.2 Aplicar migraciones e iniciar el servidor

```bash
# Aplicar migraciones
python manage.py migrate

# Iniciar servidor backend (Puerto 8000)
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
DB_NAME=project_planner
DB_USER=root
DB_PASSWORD=tu_password_aqui
DB_HOST=localhost
DB_PORT=3306
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

**Frontend → Django Backend → MySQL Database**

Si todo está bien configurado, verás el estado "Conexión Exitosa" junto con
el nombre de la base de datos, versión de MySQL y latencia.

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
