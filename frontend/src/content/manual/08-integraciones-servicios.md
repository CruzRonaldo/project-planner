# 8. Integraciones y Servicios Cloud

[← Volver al índice](./README.md)

---

## Espacios y Conectores de la Vista

El módulo de **Integraciones** centraliza la comunicación con plataformas y servicios externos que amplían la capacidad operativa de Project Planner:

- **1. Conector Make (Integromat) — Exclusivo Administrador:**
  - **Indicador de Estado:** Señala *Conectado* (en verde) o *Desconectado* (en gris).
  - **URL del Webhook Principal:** Dirección del enlace receptor que recibe las alertas de la plataforma.
  - **Frecuencia de Sincronización:** Selector del intervalo de actualización (ej. *Cada 15 min*, *Cada 30 min*, *En tiempo real*).
  - **Interruptores Individuales de Tareas:** Permite activar o pausar de forma independiente:
    - *Autenticación de 2 Factores (2FA):* Notificación de códigos temporales de seguridad.
    - *Notificaciones y Asignaciones:* Envío instantáneo de avisos a Discord o correo electrónico ante nuevas obras u órdenes de trabajo.
    - *Gobernanza Presupuestaria ($100k):* Disparo de alerta preventiva cuando una obra alcanza o supera los $100.000 USD de presupuesto.
  - **Botón [Probar Conexión]:** Envía una señal de prueba para verificar que el enlace responda correctamente.

- **2. Conector Google Drive:**
  - Muestra el estado de vinculación y el correo de la cuenta Google conectada.
  - **Botón [Conectar Google Drive]:** Abre la ventana segura de inicio de sesión institucional con Google.
  - **Botón [Probar Conexión]:** Comprueba en tiempo real que el acceso a las carpetas en la nube siga activo.

- **3. Visor de Modelos 3D Autodesk APS / Revit:**
  - Visor interactivo embebido que permite revisar planos y modelos de arquitectura, estructuras e instalaciones en formato IFC y Revit (`.rvt`) directamente en el navegador, sin necesidad de instalar programas pesados en la computadora.
  - **Herramientas de Visualización:**
    - Rotación y órbita 3D interactiva con el ratón.
    - Herramienta de corte transversal (sección) para inspeccionar losas y vigas interiores.
    - Filtro de capas para aislar muros, columnas o ductos electromecánicos.

![Panel de Integraciones](../../assets/manual/09-integraciones-servicios.png)
*Figura 8.1: Panel de integraciones activas mostrando el estado de Make, Google Drive y Autodesk Revit.*

---

## 8.1 Comprobar el estado general de integraciones

**Disponible para:** Administrador y Subadministrador.

1. En el menú lateral, seleccione **“Integraciones”** (`Shift + 7`).
2. Revise las tarjetas para verificar si los servicios figuran como **Conectado** (verde) o **Desconectado** (gris).
3. Consulte la fecha de la última sincronización reportada en cada tarjeta.

---

## 8.2 Conectar Google Drive con la plataforma

**Disponible para:** Administrador y Subadministrador.

1. En la tarjeta de **Google Drive**, presione el botón **[Conectar Google Drive]**.
2. En la pestaña emergente del navegador, inicie sesión con la cuenta institucional de Google y autorice el acceso.
3. Regrese a Project Planner y presione el botón **[Probar Conexión]**.

**Resultado esperado:** la tarjeta cambia su estado a **Conectado** y exhibe la dirección de correo autorizada.

---

## 8.3 Configurar el Webhook de Make y activar tareas

**Disponible para:** exclusivo Administrador.

1. En la tarjeta de **Make**, presione **[Configurar Webhook]**.
2. Pegue la dirección URL generada en su cuenta de Make (Integromat).
3. Active los interruptores de las tareas automáticas que desea habilitar (*2FA*, *Notificaciones*, *Gobernanza $100k*).
4. Presione **[Guardar]**.
5. Presione el botón **[Probar Conexión]** para validar que el sistema reciba respuesta satisfactoria.

**Resultado esperado:** el sistema confirma que el webhook respondió exitosamente.

---

## 8.4 Explorar un modelo 3D en el visor de Revit

**Disponible para:** todos los roles.

1. Ingrese a la ficha de un proyecto que cuente con archivo de modelo 3D vinculado.
2. Presione el botón del **Visor 3D**.
3. Utilice el ratón para rotar y hacer zoom sobre la estructura.
4. Utilice el panel lateral de capas para ocultar o aislar elementos específicos (por ejemplo, visualizar únicamente la estructura metálica).
