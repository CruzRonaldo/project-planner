---
description: Estándares de calidad de código, métricas estáticas, seguridad y accesibilidad para Project Planner.
globs: "**/*.{py,js,jsx}"
alwaysApply: true
---

# Estándares Locales de Calidad — Project Planner

Estas directrices aplican a todo el repositorio `project-planner`:

## 1. Métricas Estáticas y Formato de Código (cloc / oxlint)
- **Líneas en blanco:** Mantener entre el **10 % y el 20 %** del total del archivo para garantizar legibilidad y ritmo visual.
- **Ratio de comentarios:** Superar progresivamente el **15 % - 20 %** de comentarios y documentación en módulos de negocio, servicios y controladores.
- **Sintaxis idiomática por lenguaje:**
  - **Python (Django):** Docstrings PEP 257 (`""" ... """`) para describir propósito, parámetros y retorno de vistas, serializers y servicios. Comentarios de línea con `#` para decisiones no evidentes.
  - **React / JavaScript:** JSDoc (`/** ... */`) para contratos de componentes, hooks personalizados y utilidades. Comentarios de línea con `//` para lógica interna.
- **Profundidad condicional:** Máximo **3 niveles** (objetivo estricto $\le 2$ niveles) empleando cláusulas de guarda (*early returns* / *continue*) y descomposición en hooks o funciones auxiliares.
- **Reglas de React Hooks:** Cero llamadas condicionales a Hooks (`useNavigate`, `useEffect`, `useState`). Ningún Hook debe ejecutarse dentro de bloques `if`, `try/catch` o bucles.

## 2. Seguridad Defensiva, Auditoría y Resiliencia
- **Auditoría Dinámica Periódica (DAST con OWASP ZAP):**
  - Ejecutar análisis periódicos con OWASP ZAP (pasivos y activos) sobre los entornos de pruebas y producción para detectar vulnerabilidades en tiempo de ejecución (XSS, CSRF, inyección SQL, fuga de metadatos o cabeceras faltantes).
  - Prohibido desplegar a producción con alertas abiertas de severidad Alta o Media sin mitigar o justificar.
- **Pruebas de Resiliencia ante DoS (slowhttptest):**
  - Ejecutar periódicamente pruebas de estrés con herramientas especializadas como `slowhttptest` (simulación de ataques *Slowloris*, *Slow HTTP POST* y *Slow Read*).
  - Garantizar que los servidores y proxies (Gunicorn, Nginx, Render) tengan límites estrictos de *timeout*, *keepalive* y tamaño máximo de cuerpo (`DATA_UPLOAD_MAX_MEMORY_SIZE`) para evitar el agotamiento de *workers*.
- **Cabeceras de Protección Global:**
  - Mantener forzadas en Django (`settings.py` / middlewares) las cabeceras `Content-Security-Policy`, `X-Frame-Options: SAMEORIGIN`, `X-Content-Type-Options: nosniff` y `Referrer-Policy`.
- **Validación Estricta y RBAC:**
  - Toda mutación de datos debe pasar por validación de esquemas con DRF (`serializers.Serializer`) y verificación rigurosa de permisos por rol (`IsAdminUser`).
- **Gestión Segura de Secretos y Respaldos:**
  - Prohibido quemar API keys o contraseñas en código fuente. Respaldar siempre con extensión `.bak` antes de tocar archivos de infraestructura y verificar que permanezcan en `.gitignore`.

## 3. Accesibilidad e Interfaz Adaptativa (WCAG 2.1 AA)
- **Atajos y Teclado:** No asumir siempre teclados de escritorio. Proporcionar alternativas accesibles en interfaces táctiles/móviles y etiquetas `aria-label` en botones interactivos.
- **Soporte Multitema:** Todo nuevo componente o vista debe soportar los tres temas del sistema (`light`, `dark` y `midnight`) mediante clases semánticas de Tailwind y contraste accesible.

## 4. Código Limpio y Cero Residuos
- **Cero Código Muerto:** Eliminar de inmediato componentes, archivos o dependencias no importadas.
- **Cero TODOs en Producción:** Prohibido dejar comentarios tipo `// TODO:` o reservas de paneles inexistentes en el código fuente.
