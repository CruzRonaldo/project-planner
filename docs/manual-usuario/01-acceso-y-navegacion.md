# 1. Acceso y navegación

[← Volver al índice](./README.md)

## 1.1 Iniciar sesión como Equipo Técnico

**Disponible para:** cuentas técnicas activas.

1. Abra Project Planner.
2. En **“Seleccione su rol”**, presione la tarjeta **“USUARIO — Equipo Técnico”**.
3. Escriba el correo electrónico asignado.
4. Escriba la contraseña.
5. Active **“Recordarme”** únicamente en un equipo personal.
6. Presione **“Iniciar Sesión”**.

**Resultado esperado:** el sistema abre el Dashboard y muestra el nombre del usuario en la esquina superior derecha.

**Si no funciona:**

- Compruebe que eligió **USUARIO**, no **ADMIN**.
- Revise mayúsculas y minúsculas de la contraseña.
- Si aparece un aviso de conexión con Django, confirme que el backend esté disponible.
- Si la cuenta está desactivada, contacte al administrador.

> **Captura recomendada:** pantalla de inicio con la tarjeta USUARIO y el botón Iniciar Sesión numerados.

## 1.2 Iniciar sesión como Administrador

**Disponible para:** Administrador, Subadministrador y Superadministrador.

1. Presione la tarjeta **“ADMIN — Project Manager”**.
2. Ingrese correo y contraseña.
3. Presione **“Iniciar Sesión”**.
4. Cuando aparezca la verificación de dos factores, escriba el código de seis dígitos de la aplicación autenticadora.
5. Presione **“Verificar Código”**.

Si es el primer acceso administrativo:

1. Presione **“¿Primera vez? Configurar Autenticador”**.
2. Escanee el código QR con Google Authenticator o Microsoft Authenticator.
3. Introduzca el código temporal generado por la aplicación.
4. Presione **“Verificar Código”**.

**Resultado esperado:** se abre el Dashboard con las acciones administrativas habilitadas.

> Nunca incluya el QR, el secreto TOTP ni un código vigente en una captura del manual.

## 1.3 Recuperar una contraseña

1. En la pantalla de acceso, presione **“¿Olvidaste tu contraseña?”**.
2. Escriba el correo corporativo.
3. Presione **“Enviar código”**.
4. Ingrese el código de seis dígitos recibido.
5. Presione **“Verificar código”**.
6. Escriba la nueva contraseña y repítala.
7. Presione **“Restablecer Contraseña”**.
8. Regrese al inicio e ingrese con la nueva contraseña.

**Resultado esperado:** aparece la confirmación de que la contraseña fue actualizada.

**Errores frecuentes:** código expirado, código incorrecto, contraseñas diferentes o nueva contraseña menor de ocho caracteres.

## 1.4 Recuperar el segundo factor administrativo

1. En la pantalla de verificación 2FA, solicite el restablecimiento.
2. Espere el código enviado al correo configurado.
3. Escríbalo y presione **“Verificar Código de Recuperación”**.
4. Configure nuevamente la aplicación autenticadora.

Si el correo no llega, no repita solicitudes de manera continua: confirme primero la configuración del correo o del webhook con el responsable técnico.

## 1.5 Usar el menú principal

La barra lateral contiene:

- **Inicio**
- **Planificación Estratégica**
- **Portafolio**
- **Gestión Operativa**
- **Equipo Técnico**
- **Recursos Humanos**
- **Integraciones**
- **Configuración**, en la parte inferior

Presione una opción para abrirla. El elemento activo queda resaltado.

Atajos disponibles:

| Atajo | Acción |
|---|---|
| `Shift + 0` | Expandir o contraer la barra lateral. |
| `Shift + 1` a `Shift + 7` | Abrir los módulos principales. |
| `Shift + 9` | Abrir Configuración. |
| `Ctrl + K` | Enfocar el buscador superior. |

## 1.6 Buscar dentro de un módulo

1. Abra el módulo deseado.
2. Presione el buscador de la barra superior o use `Ctrl + K`.
3. Escriba el nombre del proyecto, técnico, hito u orden.
4. Revise los resultados filtrados.
5. Borre el texto para volver a mostrar todos los registros.

## 1.7 Revisar notificaciones

1. Presione el icono de campana.
2. Seleccione una notificación para revisar el detalle.
3. Use **“Marcar todas como leídas”** si corresponde.

El indicador rojo muestra que existen notificaciones pendientes.

## 1.8 Cerrar sesión

1. Presione el nombre o la fotografía del usuario.
2. En el menú desplegable, presione **“Cerrar Sesión”**.
3. Confirme que vuelva a mostrarse la pantalla de acceso.

En un equipo compartido, cierre siempre la sesión y no active **Recordarme**.

