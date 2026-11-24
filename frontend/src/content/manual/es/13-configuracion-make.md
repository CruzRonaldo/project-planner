# 13. Automatizaciones y Conexión con Make

[← Volver al índice](./README.md)

---

## Funcionamiento de las Automatizaciones

Project Planner despacha notificaciones automáticas en tiempo real hacia canales externos de comunicación (como correo electrónico corporativo, Discord o Slack) para mantener coordinado al equipo sin necesidad de enviar mensajes manuales.

El sistema emite avisos ante 4 eventos fundamentales del ciclo de vida de los proyectos:

1. **Creación de Proyecto (`project.created`):**  
   Se dispara al registrar una nueva obra en el Portafolio. Transmite el código, nombre, presupuesto, fechas y el líder técnico asignado.
2. **Asignación o Cambio de Líder (`project.leader_assigned`):**  
   Avisa inmediatamente al ingeniero o arquitecto designado como líder de una obra sobre sus nuevas responsabilidades de coordinación.
3. **Emisión de Orden de Trabajo (`task.assigned`):**  
   Notifica al especialista técnico cuando se le asigna una labor en campo o gabinete, detallando título, prioridad, horas estimadas y fecha límite.
4. **Alerta de Gobernanza Presupuestaria ($100k) (`governance.budget_alert`):**  
   Alerta preventiva obligatoria que se activa cuando una obra iguala o supera los $100.000 USD de presupuesto para la revisión del Comité Directivo.

---

## 13.1 Configurar el enlace de automatización en Project Planner

**Disponible para:** exclusivo Administrador.

1. En el menú lateral, diríjase a **Integraciones** (`Shift + 7`).
2. En la tarjeta de **Make**, presione el botón **[Configurar Webhook]**.
3. Pegue la dirección URL generada en su escenario de Make (Integromat).
4. Active los interruptores de los eventos que desea despachar de forma automática.
5. Presione **[Guardar]**.

**Resultado esperado:** la tarjeta registra la dirección y muestra el estado **Conectado**.

---

## 13.2 Comprobar la conexión con Make

**Disponible para:** exclusivo Administrador.

1. En la tarjeta de **Make**, presione el botón **[Probar Conexión]**.
2. El sistema enviará una señal de diagnóstico a Make.
3. En pantalla aparecerá un mensaje confirmando que la conexión respondió satisfactoriamente.

**Si no funciona:** compruebe que la dirección URL copiada no tenga espacios y que su escenario en Make.com se encuentre activo (*ON*).

---

## 13.3 Conectar canales de destino en Make.com

**Disponible para:** Administradores o responsables de flujos de automatización.

1. En su cuenta de **Make.com**, abra el escenario vinculado al webhook de Project Planner.
2. Añada el módulo de destino deseado:
   - **Correo Electrónico (Gmail o Microsoft 365):** Para enviar resúmenes automáticos al correo de los líderes técnicos.
   - **Discord o Slack:** Para publicar alertas instantáneas en los canales de obra del equipo.
3. Mapee los campos recibidos (código de obra, nombre del proyecto, especialista asignado o presupuesto).
4. Guarde y active el escenario en modo **ON**.
