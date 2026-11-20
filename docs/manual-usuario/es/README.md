# Manual de Usuario — Project Planner

> **Estado:** Documentación Oficial Verificada  
> **Versión:** 1.0  
> **Última verificación:** 15 de noviembre de 2026  
> **Rama de documentación:** `Manual-update`  
> **Audiencia:** Equipo Técnico, Subadministradores, Administradores y Superadministradores  
> **Referencia de accesibilidad:** WCAG 2.2, nivel objetivo AA

## 1. Propósito

Este manual explica cómo utilizar Project Planner desde la interfaz. Está orientado a acciones concretas: dónde ingresar, qué opción elegir, qué botón presionar y qué resultado esperar.

No contiene contraseñas, correos reales ni secretos de integración. Las capturas que se incorporen deberán usar información de demostración.

## 2. Roles del sistema

| Rol | Uso principal | Acciones habituales |
|---|---|---|
| **Equipo Técnico** | Consultar información y ejecutar trabajo asignado | Ver proyectos, cronogramas, órdenes, equipo, documentos e información personal. |
| **Subadministrador** | Apoyar la gestión operativa | Crear y actualizar proyectos, órdenes, técnicos e incidencias cuando la opción esté habilitada. |
| **Administrador** | Gestionar el sistema | Administrar planificación, portafolio, personal, integraciones, auditoría y roles. |
| **Superadministrador** | Gobierno y recuperación | Supervisar administradores, respaldos, restauraciones y operaciones críticas. |

> Algunas capacidades administrativas dependen de la configuración efectiva de permisos del servidor. Si un botón no aparece, la cuenta no tiene acceso a esa acción o debe volver a iniciar sesión después de un cambio de rol.

## 3. Índice

1. [Acceso y navegación](./01-acceso-y-navegacion.md)
2. [Dashboard y planificación estratégica](./02-dashboard-y-planificacion.md)
3. [Portafolio y gestión operativa](./03-portafolio-y-operaciones.md)
4. [Equipo técnico y Recursos Humanos](./04-equipo-tecnico-y-recursos-humanos.md)
5. [Integraciones](./05-integraciones.md)
6. [Configuración y seguridad personal](./06-configuracion-y-seguridad.md)
7. [Administración, roles y respaldos](./07-administracion-y-respaldos.md)
8. [Solución de problemas](./08-solucion-de-problemas.md)
9. [Automatizaciones y Webhooks con Make](./09-configuracion-make.md)
10. [Control y Centro de Notificaciones](./10-control-de-notificaciones.md)
11. [Análisis de accesibilidad WCAG 2.2 AA](../general/05-analisis-accesibilidad-wcag.md)

## 4. Convenciones de lectura

- Los nombres entre comillas, como **“Crear Proyecto”**, corresponden al texto visible de un botón o una opción.
- Las rutas se muestran así: **Menú lateral → Portafolio → Crear Proyecto**.
- **Resultado esperado** describe la confirmación que debe verse al terminar.
- **Si no funciona** muestra las comprobaciones básicas antes de solicitar soporte.
- **Solo administrador** identifica acciones que una cuenta técnica no debería ejecutar.

## 5. Capturas previstas

Cada capítulo incluye una lista de capturas recomendadas. Las imágenes se incorporarán después de validar esta primera versión del texto y deberán:

1. mostrar únicamente datos ficticios;
2. resaltar el botón correspondiente con un número o recuadro;
3. ocultar correos, contraseñas, tokens y códigos 2FA;
4. conservar el mismo tamaño y tema visual;
5. indicar el rol con el que se obtuvo la captura.

## 6. Nota sobre persistencia

Cuando una acción se describe como **persistida**, el cambio debe conservarse después de recargar la página porque fue guardado por el backend. Si una función se encuentra en validación o depende del estado local de la interfaz, el capítulo lo advertirá expresamente.

