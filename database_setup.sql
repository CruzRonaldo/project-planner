-- ==========================================================
-- SCRIPT DE INICIALIZACIÓN DE BASE DE DATOS PARA PROJECT PLANNER
-- ==========================================================

-- 1. Para PostgreSQL (Motor principal / Producción Render):
-- En psql, DBeaver o pgAdmin:
CREATE DATABASE project_planner;

-- 2. Para MySQL / MariaDB (Compatibilidad local opcional):
-- CREATE DATABASE IF NOT EXISTS project_planner
--     CHARACTER SET utf8mb4
--     COLLATE utf8mb4_unicode_ci;
-- USE project_planner;

-- ==========================================================
-- NOTA:
-- Una vez creada la base de datos, ejecuta en la terminal:
--   python manage.py migrate
--   python manage.py seed_data
-- Django creará automáticamente todas las tablas y datos iniciales.
-- ==========================================================
