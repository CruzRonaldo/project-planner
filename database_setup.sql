-- ==========================================================
-- SCRIPT DE INICIALIZACIÓN DE BASE DE DATOS PARA PROJECT PLANNER
-- ==========================================================

-- 1. Crear la base de datos si no existe
CREATE DATABASE IF NOT EXISTS project_planner
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

-- 2. Usar la base de datos
USE project_planner;

-- ==========================================================
-- NOTA:
-- Una vez creada la base de datos, ejecuta en la terminal:
--   python manage.py migrate
-- Django creará automáticamente todas las tablas del sistema.
-- ==========================================================
