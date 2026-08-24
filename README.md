# Project Planner

Sistema de gestión y optimización de proyectos.

## Requisitos

- Python 3.14
- MySQL Server corriendo localmente

## Instalación

1. Clonar el repo: `git clone <url>`
2. Crear entorno virtual: `python -m venv venv`
3. Activar: `venv\Scripts\activate` (Windows) o `source venv/bin/activate` (Mac/Linux)
4. Instalar dependencias: `pip install -r requirements.txt`
5. Crear una base de datos MySQL vacía: `CREATE DATABASE project_planner;`
6. Copiar `.env.example` a `.env` y llenarlo con tus datos
7. Correr migraciones: `python manage.py migrate`
8. Levantar servidor: `python manage.py runserver`
