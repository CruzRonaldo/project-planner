# 1. Acceso, Autenticación y Navegación Global

[← Volver al índice](./README.md)

---

## Espacios de la Pantalla de Acceso

La pantalla inicial centraliza el ingreso seguro a Project Planner y cuenta con los siguientes componentes:
- **Selector Rápido de Roles:** Tarjetas interactivas **[USUARIO — Equipo Técnico]** y **[ADMIN — Project Manager]** para alternar perfiles con un solo clic.
- **Formulario de Credenciales:** Campos de correo institucional y contraseña con botón de visibilidad (icono de ojo) y casilla opcional *“Recordarme”*.
- **Ventana de Verificación 2FA:** Pantalla de seguridad para cuentas administrativas que solicita el código temporal de 6 dígitos.
- **Asistente de Vinculación Inicial (QR):** Modal para nuevos administradores que exhibe el código QR para configurar la app autenticadora.

---

## 1.1 Iniciar sesión como Equipo Técnico

**Disponible para:** cuentas técnicas activas.

1. Abra Project Planner en su navegador web.
2. En la pantalla inicial, presione la tarjeta **“USUARIO — Equipo Técnico”**.
3. Escriba su correo institucional asignado.
4. Escriba su contraseña de acceso.
5. Active **“Recordarme”** únicamente si se encuentra en un equipo de uso personal.
6. Presione **“Iniciar Sesión”**.

**Resultado esperado:** el sistema abre el Panel de Control (Dashboard) y muestra su nombre en la esquina superior derecha.

**Si no funciona:**
- Compruebe que seleccionó la tarjeta **USUARIO** y no **ADMIN**.
- Presione el icono de ojo para verificar que no haya errores de mayúsculas en la contraseña.
- Si aparece un mensaje de servicio no disponible, compruebe su conexión a la red o espere unos instantes.
- Si la cuenta está desactivada, contacte a la coordinación para su rehabilitación.

![Pantalla de inicio de sesión](../../assets/manual/01-login-seleccion-roles.png)
*Figura 1.1: Pantalla de inicio de sesión con selector rápido de roles y formulario de credenciales.*

---

## 1.2 Iniciar sesión como Administrador (con 2FA)

**Disponible para:** Administradores y Subadministradores.

1. Presione la tarjeta **“ADMIN — Project Manager”**.
2. Escriba su correo institucional y contraseña.
3. Presione **“Iniciar Sesión”**.
4. En la pantalla de verificación 2FA, abra su aplicación autenticadora en el teléfono móvil (Google Authenticator o Microsoft Authenticator).
5. Introduzca el código temporal de 6 dígitos y presione **“Verificar Código”**.

**Si es su primer acceso administrativo:**
1. En la pantalla 2FA, presione **“¿Primera vez? Configurar Autenticador”**.
2. Abra la app autenticadora en su teléfono y escanee el código QR que aparece en pantalla.
3. Introduzca el código de 6 dígitos generado por la app y presione **“Verificar Código”**.

**Resultado esperado:** se abre el sistema con todas las funciones de gestión, edición y reportes habilitadas.

**Si no funciona:**
- Si el código es rechazado, espere unos segundos a que la aplicación móvil genere un código nuevo antes de ingresarlo.
- Asegúrese de que la hora de su teléfono móvil esté configurada en modo automático de red.

---

## 1.3 ¿Qué hacer si olvida su contraseña? (Recuperación de Credenciales)

**Disponible para:** todos los usuarios registrados.

1. En la pantalla de inicio de sesión, presione el enlace **“¿Olvidaste tu contraseña?”**.
2. Escriba su correo institucional registrado y presione **“Enviar código”**.
3. Revise su bandeja de entrada (y la carpeta de correo no deseado) para copiar el código de verificación de 6 dígitos recibido.
4. Ingrese el código en pantalla y presione **“Verificar código”**.
5. Escriba su nueva contraseña (mínimo 6 caracteres) y confírmela en el segundo campo.
6. Presione **“Restablecer Contraseña”**.
7. Regrese a la pantalla principal e ingrese con sus nuevas credenciales.

**Resultado esperado:** el sistema confirma la actualización y le permite iniciar sesión inmediatamente.

**Si no funciona:**
- Verifique que el correo ingresado no contenga espacios accidentales al inicio o al final.
- Si el código caducó, solicite un nuevo envío presionando reenviar código.
- Si su cuenta figura como suspendida o bloqueada, solicite al Administrador su reactivación desde la gestión de roles.

---

## 1.4 ¿Qué hacer si pierde su teléfono o acceso a la app 2FA?

**Disponible para:** cuentas con doble factor habilitado.

1. En la pantalla de verificación 2FA, presione **“Usar código de recuperación de emergencia”**.
2. Ingrese uno de los códigos de respaldo de un solo uso que descargó al momento de configurar su seguridad.
3. El sistema le concederá acceso inmediato.
4. Una vez dentro, diríjase a **Configuración** (`Shift + 9`) para vincular su nuevo teléfono móvil.

**Si no cuenta con códigos de respaldo:**
- Solicite al Administrador principal del sistema que restablezca la vinculación de su autenticador.

---

## 1.5 Menú Principal y Atajos de Teclado

La barra lateral izquierda permite desplazarse rápidamente entre los módulos de la plataforma:

| Atajo | Acción |
| :--- | :--- |
| `Shift + 0` | Contraer o expandir la barra lateral. |
| `Shift + 1` | Abrir el Panel de Control (Dashboard). |
| `Shift + 2` | Abrir Planificación Estratégica. |
| `Shift + 3` | Abrir Portafolio de Proyectos. |
| `Shift + 4` | Abrir Gestión Operativa. |
| `Shift + 5` | Abrir Directorio de Equipo Técnico. |
| `Shift + 6` | Abrir Recursos Humanos. |
| `Shift + 7` | Abrir Integraciones. |
| `Shift + 8` | Abrir el Manual de Usuario. |
| `Shift + 9` | Abrir Configuración. |
| `Ctrl + K` | Activar el buscador global en cualquier momento. |

---

## 1.6 Cerrar Sesión Segura

1. En la esquina superior derecha, presione su nombre o fotografía de perfil.
2. En el menú desplegable, seleccione **“Cerrar Sesión”**.
3. Confirme que la pantalla regrese al formulario inicial de acceso.

> [!NOTE]
> En computadoras compartidas, cierre siempre su sesión al terminar y evite activar la casilla *Recordarme*.
