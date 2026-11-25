# 11. Configuración, Perfil, Seguridad 2FA y Respaldos

[← Volver al índice](./README.md)

---

## Espacios de la Vista de Configuración

La vista de **Configuración** centraliza las preferencias personales, la identidad del usuario, los controles de seguridad y los respaldos generales del sistema:

- **1. Tarjeta de Perfil de Usuario:**
  - Muestra nombre completo, correo institucional, teléfono de contacto y foto de perfil activa.
  - Permite actualizar los datos personales con validación de teléfono en formato internacional.

- **2. Tarjeta de Preferencias Visuales y Accesibilidad:**
  - **Temas de Interfaz:** Selector de 3 modos visuales:
    - *Claro (Light):* Fondo blanco de alta claridad.
    - *Oscuro (Dark):* Fondo grafito de bajo brillo.
    - *Medianoche (Midnight):* Fondo azul oscuro con contrastes cian de estilo centro de control.
  - **Tamaño de Texto Adaptativo:** Control deslizante para ajustar el tamaño de letra entre **85% y 120%** según su pantalla.
  - **Idioma del Sistema:** Conmutador instantáneo entre **Español** e **Inglés (English)** sin necesidad de recargar la página.

- **3. Tarjeta de Seguridad y Doble Factor (2FA / TOTP):**
  - Asistente para vincular aplicaciones como Google Authenticator o Microsoft Authenticator mediante código QR.
  - Generación de claves secretas y descarga de códigos de emergencia de un solo uso.

- **4. Tarjeta de Respaldos de la Plataforma (Solo Administrador):**
  - Generador de copias completas de la base de datos descargables con huella criptográfica **SHA-256** para certificar su autenticidad e integridad inalterada.

![Configuración y Preferencias](../../assets/manual/12-perfil-preferencias-configuracion.png)
*Figura 11.1: Panel de Configuración con tarjeta de perfil, preferencias visuales, seguridad 2FA y respaldos.*

---

## 11.1 Actualizar datos de perfil y teléfono

**Disponible para:** todos los usuarios.

1. En el menú superior o en la base del menú lateral, seleccione **“Configuración”** (`Shift + 9`).
2. En la tarjeta de perfil, presione el botón **[Editar Perfil]**.
3. Ingrese o modifique su nombre visible y su teléfono de contacto con código de país.
4. Presione **[Guardar Cambios]**.

**Resultado esperado:** la tarjeta actualiza sus datos de contacto inmediatamente.

---

## 11.2 Cambiar contraseña

**Disponible para:** todos los usuarios.

1. En la tarjeta de perfil, presione el botón **[Cambiar Contraseña]**.
2. Escriba su **Contraseña Actual**.
3. Escriba su **Nueva Contraseña** (mínimo 6 caracteres) y confírmela en el campo inferior.
4. Presione **[Actualizar Contraseña]**.

**Resultado esperado:** la contraseña queda actualizada y, por seguridad, el sistema cierra automáticamente cualquier sesión abierta en otros dispositivos o navegadores.

---

## 11.3 Personalizar apariencia y tamaño de letra

**Disponible para:** todos los usuarios.

1. En la tarjeta de **Preferencias**, elija el tema visual deseado (*Claro*, *Oscuro* o *Medianoche*).
2. Ajuste el control deslizante de **Tamaño de Texto** hacia la izquierda o derecha para agrandar o reducir la tipografía.
3. Si desea cambiar el idioma, presione el botón de idioma correspondiente (**Español** / **English**).

**Resultado esperado:** la interfaz adapta sus colores, tamaños e idioma de forma instantánea.

---

## 11.4 Activar y configurar el Doble Factor (2FA / TOTP)

**Disponible para:** todos los usuarios (obligatorio para administradores).

1. En la tarjeta de **Seguridad**, presione **[Activar 2FA]**.
2. Abra Google Authenticator o Microsoft Authenticator en su teléfono y escanee el código QR exhibido.
3. Ingrese el código temporal de 6 dígitos generado por la app y presione **[Validar y Activar]**.
4. Descargue y guarde en un lugar seguro sus códigos de respaldo de emergencia.

**Resultado esperado:** el sistema confirma que el doble factor quedó activado con éxito.

---

## 11.5 Generar y descargar una copia de respaldo

**Disponible para:** exclusivo Administrador.

1. Desplácese a la tarjeta **Respaldos de Base de Datos**.
2. Presione el botón **[Generar Nuevo Respaldo]**.
3. Ingrese su contraseña de administrador para confirmar la operación.
4. El sistema compilará la copia de seguridad, calculará la huella SHA-256 y habilitará el botón de descarga.
5. Presione **[Descargar Respaldo]** para guardar el archivo en su computadora.

![Respaldos del Sistema](../../assets/manual/10-respaldos-postgresql-sha256.png)
*Figura 11.2: Panel de generación de respaldos del sistema con verificación criptográfica SHA-256.*
