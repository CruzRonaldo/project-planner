# 12. Centro y Control de Notificaciones

[← Volver al índice](./README.md)

---

## Espacios y Canales de Alerta de la Plataforma

Project Planner implementa un sistema multicanal para mantener a todos los integrantes informados sobre los eventos clave de sus obras:

- **1. Bandeja en la Barra Superior (Icono de Campana):**
  - Muestra un contador rojo cuando existen avisos pendientes de lectura.
  - Al hacer clic, despliega la lista cronológica de notificaciones indicando fecha, hora y detalle del evento (ej. *"Se te ha asignado como líder técnico de la obra PRJ-2026-045"* o *"Nueva orden de trabajo emitida en tu proyecto"*).
  - Incluye filtros rápidos para alternar entre **Todas** y **No leídas**, además del botón **[Marcar todo como leído]**.

- **2. Alertas Emergentes en Pantalla (Toasts):**
  - Mensajes visuales breves que aparecen en la esquina superior tras completar acciones operativas:
    - **Verde (Éxito):** Operación guardada o procesada satisfactoriamente.
    - **Azul (Informativo):** Notificaciones de estado o sincronizaciones completadas.
    - **Amarillo (Advertencia):** Alertas sobre fechas próximas o márgenes de holgura reducidos.
    - **Rojo (Error):** Validación rechazada o campos obligatorios faltantes.

- **3. Alertas Externas por Correo Electrónico (Integración con Make):**
  - Además de los avisos visuales dentro de la plataforma, el sistema se conecta con **Make** para despachar notificaciones automáticas directamente al correo electrónico corporativo de los ingenieros y líderes técnicos cuando se les asigna una obra, cuando se emite una orden de trabajo o cuando un proyecto supera el umbral de gobernanza presupuestaria ($100k).

![Centro de Notificaciones en Barra Superior](../../assets/manual/16-centro-notificaciones-topbar.png)
*Figura 12.1: Bandeja de notificaciones in-app desplegada desde la campana en la barra superior.*

---

## 12.1 Consultar alertas pendientes en la campana

**Disponible para:** todos los roles.

1. En la barra superior, verifique si el icono de campana presenta el indicador rojo con número de avisos.
2. Haga clic sobre la campana para abrir la bandeja desplegable.
3. Revise la lista de mensajes ordenados cronológicamente desde el más reciente.
4. Si solo desea ver las notificaciones pendientes, presione la pestaña **No leídas**.

---

## 12.2 Navegar a una obra o tarea desde la notificación

**Disponible para:** todos los roles.

1. Dentro de la bandeja de notificaciones, localice el aviso correspondiente.
2. Haga clic directamente sobre la tarjeta del mensaje.
3. El sistema lo redirigirá al proyecto o a la orden de trabajo referenciada.

---

## 12.3 Marcar avisos como leídos

**Disponible para:** todos los roles.

- **Marcar individualmente:** Haga clic en el icono de verificación circular junto a la notificación que ya revisó.
- **Marcar todas a la vez:** En la parte superior de la bandeja, presione el botón **[Marcar todo como leído]**.

**Resultado esperado:** el contador rojo de la campana se apaga y las notificaciones quedan archivadas como leídas.

---

## 12.4 Cerrar la bandeja de notificaciones

Para ocultar el panel desplegable, presione la tecla `Escape` en su teclado o haga clic en cualquier zona libre fuera de la bandeja.

![Alerta Emergente Toast](../../assets/manual/15-toast-confirmacion-accion.png)
*Figura 12.2: Alerta emergente en pantalla confirmando la ejecución exitosa de una acción.*
