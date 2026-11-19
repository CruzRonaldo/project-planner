-- ==========================================================
-- SCRIPT DE INICIALIZACIÓN DE BASE DE DATOS PARA PROJECT PLANNER
-- ==========================================================

-- Para PostgreSQL (Motor principal / Producción Render):
-- En psql, DBeaver o pgAdmin:
CREATE DATABASE project_planner;

-- ==========================================================
-- NOTA:
-- Una vez creada la base de datos, ejecuta en la terminal:
--   python manage.py migrate
--   python manage.py seed_data
-- Django creará automáticamente todas las tablas y datos iniciales.
-- ==========================================================
