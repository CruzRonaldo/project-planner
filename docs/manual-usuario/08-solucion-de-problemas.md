# 8. Solución de problemas

[← Volver al índice](./README.md)

## 8.1 Tabla rápida

| Problema | Comprobación | Acción recomendada |
|---|---|---|
| No se puede iniciar sesión | Mensaje de conexión con Django | Confirmar que el backend esté funcionando y volver a intentar. |
| Credenciales inválidas | Rol, correo y contraseña | Elegir la tarjeta correcta y usar recuperación si no recuerda la clave. |
| Código 2FA rechazado | Hora del teléfono y código vigente | Esperar un código nuevo y verificar que el reloj sea automático. |
| Pantalla vacía | Filtros activos o datos inexistentes | Limpiar filtros, actualizar registros y comprobar la base de datos. |
| No aparece un botón | Rol o sesión anterior | Cerrar sesión, volver a ingresar y confirmar permisos con el administrador. |
| Un cambio no se refleja en otros puestos | Sincronización o guardado | Confirmar guardado mediante botón explícito y verificar conexión al backend. |
| Drive no conecta | OAuth o URI de retorno | Reautorizar y solicitar revisión de configuración al responsable técnico. |
| Make no responde | URL de webhook | Verificar formato, disponibilidad y escenario activo. |
| APS/Revit no carga | Credenciales, formato o procesamiento | Esperar la traducción y revisar el mensaje de estado. |
| Respaldo falla | PostgreSQL y herramientas | Escalar al responsable de base de datos; no repetir restauraciones a ciegas. |

## 8.2 Información que debe enviarse al soporte

Cuando solicite ayuda, incluya:

1. módulo donde ocurrió el problema;
2. botón presionado;
3. fecha y hora aproximada;
4. rol de la cuenta, sin enviar contraseña;
5. mensaje completo mostrado;
6. si el problema continúa después de actualizar;
7. una captura donde no aparezcan credenciales ni información sensible.

## 8.3 Acciones que no debe realizar

- No comparta contraseñas, códigos 2FA, tokens ni archivos `.env`.
- No elimine proyectos o archivos para “probar” una solución.
- No restaure una base de datos sin autorización y respaldo previo.
- No ejecute `seed_data --clear` sobre una base con información que deba conservarse.
- No modifique permisos administrativos desde la base de datos sin un procedimiento aprobado.

## 8.4 Escalamiento

- **Problema de uso:** Administrador del sistema.
- **Cuenta o permisos:** Administrador o Superadministrador.
- **Base de datos y respaldos:** responsable de PostgreSQL.
- **Drive, Make, APS o correo:** responsable de integraciones.
- **Error recurrente del sistema:** equipo de desarrollo, adjuntando los datos de diagnóstico anteriores.

## 8.5 Control del manual

Si un botón cambia de nombre o un flujo ya no coincide:

1. anote la ruta y la acción afectada;
2. compare con la versión desplegada;
3. actualice primero el Markdown;
4. valide el procedimiento con cada rol;
5. reemplace la captura;
6. registre fecha y commit verificado;
7. regenere el PDF únicamente al finalizar la revisión.

