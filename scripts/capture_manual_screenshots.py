#!/usr/bin/env python3
"""
Script de automatización para captura sistemática de pantallas de alta resolución
de todas las vistas de Project Planner para el Manual de Usuario oficial.
"""

import os
import sys
import time
from pathlib import Path
from playwright.sync_api import sync_playwright

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173").rstrip("/")
ADMIN_USER = os.getenv("ADMIN_USER", "admin.sistemas@projectplanner.com")
ADMIN_PASS = os.getenv("ADMIN_PASS", "password123")

BASE_DIR = Path(__file__).resolve().parent.parent
DOCS_ASSETS_DIR = BASE_DIR / "docs" / "assets" / "manual"
PUBLIC_ASSETS_DIR = BASE_DIR / "frontend" / "public" / "assets" / "manual"

DOCS_ASSETS_DIR.mkdir(parents=True, exist_ok=True)
PUBLIC_ASSETS_DIR.mkdir(parents=True, exist_ok=True)


def save_screenshot(page, filename: str, description: str = ""):
    docs_path = DOCS_ASSETS_DIR / filename
    public_path = PUBLIC_ASSETS_DIR / filename
    
    # Asegurar renderizado completo
    page.wait_for_timeout(1000)
    page.screenshot(path=str(docs_path), full_page=True)
    page.screenshot(path=str(public_path), full_page=True)
    print(f"✔ [CAPTURA] Guardada: {filename} - {description}")


def main():
    print("=" * 70)
    print("🚀 INICIANDO CAPTURA AUTOMATIZADA DE PANTALLAS PARA MANUAL DE USUARIO")
    print(f"URL Frontend: {FRONTEND_URL}")
    print(f"Destinos: {DOCS_ASSETS_DIR} y {PUBLIC_ASSETS_DIR}")
    print("=" * 70)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            viewport={"width": 1600, "height": 1000},
            device_scale_factor=1,
        )
        page = context.new_page()
        page.set_default_timeout(30000)

        # -------------------------------------------------------------
        # 1. PANTALLA DE ACCESO Y LOGIN
        # -------------------------------------------------------------
        print("\n[1/12] Capturando Pantalla de Login...")
        page.goto(f"{FRONTEND_URL}/login", wait_until="networkidle")
        page.wait_for_timeout(1000)
        save_screenshot(page, "01-login-seleccion-roles.png", "Pantalla de acceso y roles")

        # Iniciar sesión como ADMIN
        admin_role_btn = page.locator('button:has-text("ADMIN")')
        if admin_role_btn.count() > 0:
            admin_role_btn.first.click()
            page.wait_for_timeout(200)

        page.fill('input[type="email"]', ADMIN_USER)
        page.fill('input[type="password"]', ADMIN_PASS)
        page.locator('button[type="submit"]:has-text("Iniciar Sesión")').first.click()

        page.wait_for_selector('#main-sidebar, nav', timeout=15000)
        page.wait_for_timeout(1500)

        # -------------------------------------------------------------
        # 2. DASHBOARD / PANEL DE CONTROL
        # -------------------------------------------------------------
        print("\n[2/12] Capturando Dashboard...")
        page.goto(f"{FRONTEND_URL}/dashboard", wait_until="networkidle")
        page.wait_for_selector('main, #main-sidebar', timeout=15000)
        page.wait_for_timeout(2000)
        save_screenshot(page, "02-dashboard-kpis-gantt.png", "Dashboard principal y KPIs ejecutivos")

        # -------------------------------------------------------------
        # 3. PLANIFICACIÓN ESTRATÉGICA
        # -------------------------------------------------------------
        print("\n[3/12] Capturando Planificación Estratégica...")
        page.goto(f"{FRONTEND_URL}/planning", wait_until="networkidle")
        page.wait_for_selector('main', timeout=15000)
        page.wait_for_timeout(2000)
        save_screenshot(page, "03-planificacion-estrategica-gantt.png", "Planificación maestra y cronograma Gantt")

        # -------------------------------------------------------------
        # 4. PORTAFOLIO DE PROYECTOS
        # -------------------------------------------------------------
        print("\n[4/12] Capturando Portafolio de Proyectos...")
        page.goto(f"{FRONTEND_URL}/portfolio", wait_until="networkidle")
        page.wait_for_selector('main', timeout=15000)
        page.wait_for_timeout(2000)
        save_screenshot(page, "04-portafolio-tarjetas-gobernanza.png", "Portafolio de proyectos y tarjetas de gobernanza")

        # -------------------------------------------------------------
        # 5. GESTIÓN OPERATIVA
        # -------------------------------------------------------------
        print("\n[5/12] Capturando Gestión Operativa...")
        page.goto(f"{FRONTEND_URL}/operations", wait_until="networkidle")
        page.wait_for_selector('main', timeout=15000)
        page.wait_for_timeout(2000)
        save_screenshot(page, "06-ficha-tecnica-operaciones.png", "Gestión operativa, órdenes de trabajo y CPM")

        # -------------------------------------------------------------
        # 6. EQUIPO TÉCNICO
        # -------------------------------------------------------------
        print("\n[6/12] Capturando Directorio de Equipo Técnico...")
        page.goto(f"{FRONTEND_URL}/technical-team", wait_until="networkidle")
        page.wait_for_selector('main', timeout=15000)
        page.wait_for_timeout(2000)
        save_screenshot(page, "07-directorio-tecnico.png", "Directorio de especialistas técnicos")

        # -------------------------------------------------------------
        # 7. RECURSOS HUMANOS
        # -------------------------------------------------------------
        print("\n[7/12] Capturando Recursos Humanos...")
        page.goto(f"{FRONTEND_URL}/human-resources", wait_until="networkidle")
        page.wait_for_selector('main', timeout=15000)
        page.wait_for_timeout(2000)
        save_screenshot(page, "08-matriz-rrhh-incidencias.png", "Matriz de recursos humanos e incidencias")

        # -------------------------------------------------------------
        # 8. INTEGRACIONES Y SERVICIOS
        # -------------------------------------------------------------
        print("\n[8/12] Capturando Integraciones...")
        page.goto(f"{FRONTEND_URL}/integrations", wait_until="networkidle")
        page.wait_for_selector('main', timeout=15000)
        page.wait_for_timeout(2000)
        save_screenshot(page, "09-integraciones-servicios.png", "Panel de integraciones externas y Make")

        # -------------------------------------------------------------
        # 9. AUDITORÍA PERIÓDICA DE PROYECTOS (Nueva Vista Oficial)
        # -------------------------------------------------------------
        print("\n[9/12] Capturando Auditoría Periódica de Proyectos...")
        page.goto(f"{FRONTEND_URL}/project-audit", wait_until="networkidle")
        page.wait_for_selector('main', timeout=15000)
        page.wait_for_timeout(2000)
        save_screenshot(page, "18-auditoria-periodica-proyectos.png", "Auditoría periódica con desvíos y CPM")

        # -------------------------------------------------------------
        # 10. GESTIÓN DE ROLES Y PERMISOS (RBAC)
        # -------------------------------------------------------------
        print("\n[10/12] Capturando Gestión de Roles...")
        page.goto(f"{FRONTEND_URL}/role-management", wait_until="networkidle")
        page.wait_for_selector('main', timeout=15000)
        page.wait_for_timeout(2000)
        save_screenshot(page, "11-gestion-roles-usuarios.png", "Gestión de roles y permisos RBAC")

        # -------------------------------------------------------------
        # 11. CONFIGURACIÓN Y SEGURIDAD
        # -------------------------------------------------------------
        print("\n[11/12] Capturando Configuración y Seguridad...")
        page.goto(f"{FRONTEND_URL}/configuracion", wait_until="networkidle")
        page.wait_for_timeout(2500)
        save_screenshot(page, "12-perfil-preferencias-configuracion.png", "Configuración personal, temas y seguridad")

        # -------------------------------------------------------------
        # 12. CENTRO DE NOTIFICACIONES (TOPBAR)
        # -------------------------------------------------------------
        print("\n[12/12] Capturando Centro de Notificaciones In-App...")
        page.goto(f"{FRONTEND_URL}/dashboard", wait_until="networkidle")
        page.wait_for_timeout(1000)
        bell_btn = page.locator('button[aria-label*="Notificaciones"], button[title*="Notificaciones"], button:has(svg.lucide-bell)').first
        if bell_btn.count() > 0:
            bell_btn.click()
            page.wait_for_timeout(1000)
            save_screenshot(page, "16-centro-notificaciones-topbar.png", "Bandeja de notificaciones in-app desplegada")

        browser.close()

    print("\n🎉 ¡TODAS LAS PANTALLAS HAN SIDO CAPTURADAS Y ACTUALIZADAS EXITOSAMENTE!")


if __name__ == "__main__":
    main()
