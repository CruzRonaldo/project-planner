# Manual de Usuario / User Manual — Project Planner

> **Documentación Oficial / Official Documentation**  
> **Versión / Version:** 1.0  
> **Metodología / Methodology:** Docs-as-Code Multilingüe (i18n)

Bienvenido al centro de documentación oficial del sistema **Project Planner**. Seleccione su idioma de preferencia para acceder al manual interactivo y las guías operativas:

Welcome to the official documentation center for **Project Planner**. Select your preferred language to access the interactive user manual and operational guides:

---

## Idiomas Disponibles / Available Languages

- 🇪🇸 **[Manual de Usuario en Español](./es/README.md)**  
  Documentación canónica completa: acceso, autenticación de dos factores (TOTP), planificación estratégica Gantt, portafolio de proyectos, equipo técnico, integraciones (Revit APS, Google Drive, Make), configuración, automatizaciones y administración.

- 🇬🇧 **[User Manual in English](./en/README.md)**  
  Complete translated documentation: system access, two-factor authentication (TOTP), dynamic Gantt strategic planning, project portfolio, technical team, cloud integrations (Revit APS, Google Drive, Make), configuration, automations, and administration.

---

## Estructura Docs-as-Code / Docs-as-Code Architecture

| Directorio / Path | Descripción / Description |
|---|---|
| `./es/` | Fuente canónica en español con control de versiones Git. |
| `./en/` | Documentación sincronizada en inglés generada mediante pipeline automatizado MyMemory. |
| `./assets/manual/` | Capturas de pantalla e infografías compartidas entre todos los idiomas. |
| `.translation-cache.json` | Hash SHA-256 de integridad para traducciones incrementales y caché local. |
