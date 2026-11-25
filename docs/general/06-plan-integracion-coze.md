# 06. Plan de incorporación futura de Coze

> **Estado:** preparación técnica en la rama `Manual-update`  
> **Fecha:** 23 de noviembre de 2026  
> **Alcance inicial:** asistente de consulta en modo solo lectura  
> **Activación:** deshabilitada por defecto  
> **Proveedor activo por defecto:** OpenRouter

## 1. Objetivo

Preparar **Project Planner** para incorporar Coze como proveedor opcional del asistente sin reemplazar inmediatamente el servicio actual ni alterar la experiencia del frontend.

La integración debe mantener en Django:

- autenticación y permisos por rol;
- recuperación de contexto con PostgreSQL y pgvector;
- acceso a los datos del sistema;
- auditoría y validación de acciones;
- filtrado de información sensible;
- selección y configuración del proveedor.

La primera activación de Coze será únicamente para consultas. Coze no tendrá acceso directo a PostgreSQL ni podrá crear, editar o eliminar información del proyecto.

## 2. Estado actual aprovechado

Project Planner ya dispone de:

- `frontend/src/components/common/ChatWidget.jsx`, que consume `POST /api/chatbot/` y procesa texto en streaming;
- `core/chatbot_views.py`, con los endpoints de chat y RAG;
- `core/services/ai_service.py`, que centraliza prompts y selección del proveedor;
- `DocumentEmbedding` y pgvector para recuperar contexto local;
- variables de entorno para almacenar secretos fuera del código;
- pruebas automatizadas del chatbot.

El contrato actual de `/api/chatbot/` se conserva. El frontend no necesita conocer el token, identificador del bot ni URL de Coze.

## 3. Arquitectura prevista

```text
Usuario autenticado
        │
        ▼
ChatWidget (React)
        │ Bearer token
        ▼
POST /api/chatbot/ (Django)
        │
        ├── valida sesión y rol
        ├── recupera contexto autorizado con pgvector
        └── selecciona el proveedor configurado
                ├── OpenRouter (actual y predeterminado)
                └── Coze (opcional y desactivado inicialmente)
                         │
                         ▼
                    API de Coze
        │
        ▼
Respuesta de texto normalizada hacia React
```

Django actúa como única puerta de entrada. El navegador nunca se comunica directamente con Coze.

## 4. Preparación incorporada

La rama incluye una preparación que no activa llamadas externas por sí sola:

1. selector `AI_CHAT_PROVIDER` con valor predeterminado `openrouter`;
2. bandera `COZE_ENABLED=False`;
3. configuración de Coze mediante variables de entorno;
4. adaptador aislado en `core/services/coze_service.py`;
5. normalización del streaming de Coze al texto que ya consume React;
6. autenticación obligatoria en los endpoints del chatbot;
7. obtención del rol desde `request.user`, ignorando roles enviados por el cliente;
8. uso de un identificador interno del usuario, nunca su correo;
9. pruebas para autenticación, suplantación de rol, selección del proveedor y streaming.

Mientras se mantenga la configuración predeterminada, el comportamiento del asistente actual no cambia.

## 5. Variables de entorno

Configuración segura y desactivada:

```env
AI_CHAT_PROVIDER=openrouter

COZE_ENABLED=False
COZE_API_TOKEN=
COZE_BOT_ID=
COZE_API_BASE_URL=https://api.coze.com
COZE_REQUEST_TIMEOUT=30
COZE_AUTO_SAVE_HISTORY=False
COZE_INCLUDE_RAG_CONTEXT=False
```

Reglas obligatorias:

- `COZE_API_TOKEN` no debe escribirse en Git;
- ninguna credencial debe usar el prefijo `VITE_`;
- el token debe configurarse únicamente en el backend y, en producción, en las variables de entorno de Render;
- un PAT puede utilizarse durante desarrollo controlado;
- antes de producción debe evaluarse OAuth o una credencial de servicio con permisos mínimos;
- si el proveedor es `coze` pero `COZE_ENABLED=False`, Project Planner conserva OpenRouter.
- `COZE_AUTO_SAVE_HISTORY` debe continuar en `False` hasta aprobar una política de retención;
- `COZE_INCLUDE_RAG_CONTEXT` debe continuar en `False` hasta asociar cada documento con su proyecto y validar su alcance por usuario.

## 6. Contrato del endpoint

El frontend seguirá utilizando:

```http
POST /api/chatbot/
Authorization: Bearer <token de Project Planner>
Content-Type: application/json
```

Ejemplo:

```json
{
  "message": "Resume el avance del proyecto que tengo asignado"
}
```

La respuesta seguirá llegando como fragmentos de texto en streaming. Django transformará internamente los eventos SSE de Coze para que `ChatWidget` no dependa del formato de un proveedor específico.

## 7. Seguridad y permisos

La integración debe cumplir las siguientes reglas:

1. solo usuarios autenticados pueden usar el chatbot;
2. el rol se determina en el backend a partir de la cuenta autenticada;
3. los campos `role` o `user_role` enviados por React no conceden permisos;
4. un técnico solo recibe contexto autorizado para su rol y proyectos;
5. un administrador o subadministrador recibe únicamente la información que sus permisos permiten;
6. el token de Coze no aparece en respuestas, logs ni archivos del frontend;
7. Coze no accede directamente a PostgreSQL;
8. cualquier acción futura de escritura vuelve a validar permisos en Django y solicita confirmación;
9. las respuestas de error no exponen detalles internos ni credenciales;
10. deben aplicarse límites de longitud, frecuencia, tiempo de espera y auditoría antes de producción.

### Datos que se pueden enviar

- fragmentos del manual y documentación no confidencial;
- nombres, códigos, hitos, tareas y estados que el usuario pueda consultar;
- contexto mínimo recuperado y filtrado por Django;
- identificadores internos que no revelen el correo del usuario.

### Datos que no se deben enviar

- contraseñas, códigos 2FA, JWT, PAT u otros tokens;
- secretos de Django, PostgreSQL, Google Drive, Make o APS;
- respaldos de la base de datos;
- correos, teléfonos o información personal innecesaria;
- comentarios privados de incidencias o licencias;
- presupuestos o auditorías sin autorización;
- información de otros proyectos o usuarios fuera del alcance de la sesión.

## 8. Memoria de conversación y errores

La preparación actual no activa memoria externa: `COZE_AUTO_SAVE_HISTORY=False`. El historial que muestra `ChatWidget` permanece únicamente en la interfaz y no se reutiliza como `conversation_id` de Coze.

Si en el futuro se necesita continuidad, Django deberá guardar la relación entre usuario, proveedor e identificador externo en un modelo propio. El backend recuperará ese identificador desde la sesión; no deberá confiar en un `conversation_id` arbitrario enviado por el navegador.

Antes de producción también se debe definir un contrato de error para streaming. Un fallo ocurrido antes de iniciar el flujo debe devolver el estado HTTP correspondiente; un fallo durante el flujo debe enviarse como evento de error reconocido por React, no como si fuera una respuesta normal del asistente.

## 9. Etapas de incorporación

### Etapa 0 — Preparación técnica

- [x] proteger los endpoints del chatbot;
- [x] agregar selector y bandera del proveedor;
- [x] mantener OpenRouter como proveedor predeterminado;
- [x] crear el adaptador de Coze sin credenciales reales;
- [x] normalizar el streaming;
- [x] añadir pruebas básicas de seguridad y regresión;
- [x] documentar activación y retorno al proveedor anterior.

### Etapa 1 — Configuración de prueba

- [ ] crear y publicar un agente en Coze;
- [ ] obtener el `bot_id` de prueba;
- [ ] generar una credencial de desarrollo con alcance mínimo;
- [ ] configurar las variables únicamente en un entorno no productivo;
- [ ] probar autenticación, latencia, errores y límites;
- [ ] comprobar que ningún secreto se incluya en el bundle de React.

### Etapa 2 — Validación con documentación

- [ ] permitir consultas únicamente sobre el manual de usuario;
- [ ] conservar pgvector como fuente de contexto;
- [ ] filtrar documentos por sesión y rol;
- [ ] evaluar respuestas incorrectas e inyección de instrucciones;
- [ ] registrar métricas sin almacenar contenido confidencial.

### Etapa 3 — Producción en modo consulta

- [ ] sustituir la credencial de prueba por el mecanismo aprobado para producción;
- [ ] configurar secretos en Render;
- [ ] establecer límites por usuario y monitoreo de costos;
- [ ] aprobar las pruebas de seguridad, carga y accesibilidad;
- [ ] activar progresivamente por rol;
- [ ] comprobar el procedimiento de rollback.

### Etapa 4 — Workflows futuros

Después de validar el modo consulta se podrán evaluar workflows para:

- resumir avances y tareas pendientes;
- generar borradores de reportes;
- explicar hitos vencidos;
- localizar procedimientos en la documentación;
- preparar notificaciones que un usuario deba confirmar.

Las operaciones que cambien proyectos, técnicos, incidencias o presupuestos deberán ejecutarse mediante endpoints protegidos de Django, nunca mediante acceso directo de Coze a la base de datos.

## 10. Activación futura

Cuando existan un agente publicado y credenciales aprobadas, el entorno de prueba podrá utilizar:

```env
AI_CHAT_PROVIDER=coze
COZE_ENABLED=True
COZE_API_TOKEN=<secreto del entorno>
COZE_BOT_ID=<identificador del agente publicado>
COZE_API_BASE_URL=https://api.coze.com
COZE_REQUEST_TIMEOUT=30
COZE_AUTO_SAVE_HISTORY=False
COZE_INCLUDE_RAG_CONTEXT=False
```

Después de modificar las variables se debe reiniciar el backend y probar primero con una cuenta técnica y una cuenta administrativa. No se deben usar credenciales productivas durante las pruebas locales compartidas.

## 11. Rollback

La integración se puede desactivar sin modificar código:

```env
AI_CHAT_PROVIDER=openrouter
COZE_ENABLED=False
```

Luego se reinicia Django y se verifica que `/api/chatbot/` vuelva a utilizar el proveedor actual. La preparación no requiere migraciones ni modifica tablas, por lo que no elimina ni transforma datos existentes.

## 12. Pruebas requeridas antes de producción

### Backend

- petición sin autenticación devuelve `401`;
- un técnico que envía `role=Admin` continúa siendo técnico;
- Coze desactivado no realiza llamadas a su API;
- los eventos de streaming se transforman correctamente;
- errores `401`, `403`, `429`, timeout y `5xx` producen mensajes seguros;
- el token no aparece en respuestas ni logs;
- el contexto administrativo no se entrega a técnicos.

### Frontend

- `ChatWidget` conserva carga, cancelación y manejo de errores;
- el nombre visual del asistente no depende del proveedor;
- no existen tokens o identificadores sensibles en el bundle de Vite;
- los mensajes y controles mantienen accesibilidad WCAG 2.2 AA.

### Seguridad

- intento de suplantación de rol;
- acceso a proyectos no asignados;
- inyección de instrucciones en mensajes y documentos;
- consultas excesivamente grandes o repetidas;
- contenido sensible en prompts y respuestas;
- auditoría del usuario, fecha, proveedor, resultado y duración.

## 13. Criterios de aceptación

La integración podrá activarse cuando:

- el frontend conserve el endpoint actual;
- Coze continúe desactivable mediante variables de entorno;
- no existan credenciales en Git ni React;
- autenticación y RBAC estén cubiertos por pruebas;
- el contexto esté filtrado por usuario y rol;
- los errores y respuestas tengan un formato estable;
- el equipo haya probado activación y rollback;
- costos, límites y política de datos estén aprobados;
- Coze permanezca sin acceso directo a PostgreSQL.

## 14. Referencias oficiales

- [Coze API Overview](https://www.coze.com/open/docs/developer_guides/coze_api_overview)
- [Chat API v3](https://www.coze.com/open/docs/developer_guides/chat_v3)
- [OAuth Apps](https://www.coze.com/open/docs/developer_guides/oauth_apps)
- [Access Token con Python](https://www.coze.com/open/docs/developer_guides/python_access_token)
- [Knowledge bases](https://www.coze.com/open/docs/guides/agent_knowledge)
- [Workflows](https://www.coze.com/open/docs/guides/workflow)

## 15. Decisión recomendada

Conservar `AI_CHAT_PROVIDER=openrouter` y `COZE_ENABLED=False` hasta que el equipo cree el agente, apruebe la política de datos y realice las pruebas en un entorno separado. Esta preparación deja el sistema listo para incorporar Coze sin convertirlo todavía en una dependencia operativa.
