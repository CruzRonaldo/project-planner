# Análisis de Accesibilidad — WCAG 2.2 AA

> **Producto evaluado:** Project Planner  
> **Tipo de revisión:** Evaluación preliminar de accesibilidad  
> **Estado general:** Cumplimiento parcial; no constituye conformidad formal  
> **Estándar usado:** WCAG 2.2  
> **Nivel objetivo:** AA, incluyendo todos los criterios A y AA  
> **Versión normativa:** Recomendación W3C publicada el 5 de octubre de 2023 y actualizada el 12 de diciembre de 2024  
> **Metodología de referencia:** WCAG-EM 2.0, Nota del Grupo W3C del 23 de julio de 2026  
> **Fecha de evaluación:** 14 de noviembre de 2026  
> **Commit evaluado:** `18fb1a3`  
> **Rama evaluada:** `Manual-update`

## 1. Resultado ejecutivo

Project Planner contiene varias bases positivas de accesibilidad: idioma de documento definido, regiones semánticas, botones nativos, encabezados de tabla, nombres accesibles en numerosos controles, estados de filtros y mensajes globales anunciados mediante regiones vivas.

Sin embargo, la revisión encontró barreras confirmadas en navegación por teclado, etiquetado de campos, comunicación de estados, gestión del foco en diálogos y contraste de determinados colores. Por ello, **no corresponde declarar todavía que el producto cumple WCAG 2.2 nivel AA**.

> **Declaración correcta para esta versión:** evaluación preliminar basada en WCAG 2.2 AA y realizada siguiendo parcialmente WCAG-EM 2.0. Identifica soportes, incumplimientos y pruebas pendientes, pero no constituye una certificación ni una declaración formal de conformidad.

WCAG 3.0 no se utiliza como referencia normativa porque, en la fecha de esta evaluación, continúa siendo un borrador de trabajo del W3C.

## 2. Alcance

La muestra revisada incluye:

- acceso, recuperación de contraseña y autenticación de dos factores;
- navegación principal, barra superior, búsqueda, perfil y notificaciones;
- componentes comunes de formularios, tablas, paginación, filtros, mensajes y diálogos;
- Dashboard, Planificación Estratégica, Portafolio y Gestión Operativa;
- Equipo Técnico, Recursos Humanos e Integraciones;
- Configuración, roles, auditoría y respaldos;
- temas Light, Dark y Midnight a nivel de tokens representativos.

Tecnologías consideradas: React 19, HTML, CSS/Tailwind CSS, JavaScript, React Router, Lucide React y componentes WAI-ARIA propios.

## 3. Metodología y límites

Se aplicaron las primeras etapas de WCAG-EM 2.0:

1. definición del alcance y del nivel objetivo;
2. exploración de vistas, componentes y procesos principales;
3. selección de una muestra representativa;
4. inspección estática del código y cálculo de contraste de combinaciones representativas;
5. registro de evidencias, impacto, prioridad y recomendación.

Estados usados en este informe:

| Estado | Significado |
|---|---|
| **Soporte identificado** | El código contiene un mecanismo adecuado, sujeto a comprobación funcional. |
| **No cumple** | Existe evidencia suficiente de una barrera respecto del criterio indicado. |
| **Parcial** | Hay soporte, pero no cubre todos los estados o componentes. |
| **Requiere prueba manual** | El resultado no puede determinarse de manera fiable solo mediante inspección del código. |
| **No aplica en la muestra** | No se encontró contenido o interacción correspondiente dentro del alcance revisado. |

La aplicación no estaba abierta en un navegador durante esta revisión. Por tanto, quedan pendientes Axe/Lighthouse, navegación completa por teclado, lectores de pantalla, zoom, reflujo, tamaños físicos de objetivos y contraste renderizado de todos los estados. Esta limitación impide emitir una declaración formal de conformidad.

## 4. Resumen por principio WCAG

| Principio | Estado preliminar | Resumen |
|---|---|---|
| **Perceptible** | Parcial | Existen texto alternativo, estructura semántica y tablas con encabezados, pero hay contrastes insuficientes, campos sin etiqueta y gráficas sin alternativa equivalente. |
| **Operable** | No cumple | Se confirmaron controles no alcanzables por teclado, elementos activables solo con clic y gestión incompleta del foco en diálogos. |
| **Comprensible** | Parcial | La mayoría de formularios presenta etiquetas e instrucciones; algunos campos y mensajes de error no están asociados o anunciados correctamente. |
| **Robusto** | Parcial | Se emplean HTML semántico y atributos ARIA, pero ciertos estados y controles personalizados no exponen toda su información a tecnologías de asistencia. |

## 5. Soportes de accesibilidad identificados

| Criterios relacionados | Evidencia actual |
|---|---|
| 3.1.1 Idioma de la página | `frontend/index.html` declara `lang="es"`. |
| 1.3.1 Información y relaciones | Se utilizan `main`, `nav`, `aside`, `header`, secciones con títulos y tablas con `th scope="col"`. |
| 2.4.4 Propósito de enlaces / 4.1.2 Nombre, función y valor | Muchos botones de icono incluyen `aria-label`; la navegación usa `aria-current="page"`. |
| 2.4.7 Foco visible | La barra lateral, paginación, buscador y varios controles muestran anillos o bordes de foco. |
| 3.3.1 Identificación de errores | El componente común `Input` expone `aria-invalid` y asocia el error mediante `aria-describedby`. |
| 4.1.3 Mensajes de estado | Los mensajes globales de `ToastContext` usan `role="status"` y `aria-live="polite"`. |
| 1.3.1 Tablas | El componente común `TableHead` genera encabezados de columna con `scope="col"`. |
| 2.1.1 Teclado | Filtros, pestañas, paginación y navegación principales usan botones nativos; el selector de orden implementa teclado. |
| 1.4.4 Cambio de tamaño del texto | Configuración permite cambiar la escala tipográfica; aún debe probarse al 200 % y 400 %. |

Estos soportes no significan por sí solos que el criterio se cumpla en todas las páginas, estados y procesos.

## 6. Hallazgos confirmados

### A11Y-01 — Controles de contraseña fuera de la secuencia de teclado

- **Prioridad:** Alta.
- **Estado:** No cumple.
- **Criterios:** 2.1.1 Teclado (A) y 4.1.2 Nombre, función y valor (A).
- **Evidencia:** `frontend/src/components/common/PasswordInput.jsx`, líneas 81–106. Los botones para mostrar y limpiar la contraseña usan `tabIndex={-1}`.
- **Impacto:** una persona que navega únicamente con Tab no puede activar esas funciones.
- **Recomendación:** incluir ambos botones en el orden natural de tabulación y conservar sus nombres accesibles dinámicos.

### A11Y-02 — Elementos activables únicamente con clic

- **Prioridad:** Alta.
- **Estado:** No cumple.
- **Criterios:** 2.1.1 Teclado (A) y 4.1.2 Nombre, función y valor (A).
- **Evidencia:** las notificaciones son `article` con `onClick`, sin foco ni evento de teclado, en `ProfileControls.jsx`, líneas 277–282. Los hitos del Gantt son `div` con `onClick` sin semántica ni teclado en `GanttScheduleSection.jsx`, líneas 184–200.
- **Impacto:** usuarios de teclado no pueden abrir la notificación ni el detalle del hito.
- **Recomendación:** usar botones o enlaces reales; como mínimo, definir semántica, foco y activación mediante Enter y Espacio.

### A11Y-03 — Campos sin etiqueta accesible

- **Prioridad:** Alta.
- **Estado:** No cumple.
- **Criterios:** 1.3.1 Información y relaciones (A), 3.3.2 Etiquetas o instrucciones (A) y 4.1.2 Nombre, función y valor (A).
- **Evidencia:** códigos 2FA y recuperación en `LoginScreen.jsx`, líneas 436–446, 534–544 y 884–897. También dependen del `placeholder` el nombre de carpeta Drive, URL de webhook y título de videollamada.
- **Impacto:** el lector de pantalla puede anunciar el tipo de campo sin explicar su finalidad.
- **Recomendación:** asociar un `label` visible mediante `htmlFor` e `id`, o un nombre accesible equivalente.

### A11Y-04 — Estados seleccionados comunicados solo visualmente

- **Prioridad:** Alta.
- **Estado:** No cumple.
- **Criterios:** 1.4.1 Uso del color (A) y 4.1.2 Nombre, función y valor (A).
- **Evidencia:** ADMIN/USUARIO cambia borde, punto y color sin `aria-pressed`, `aria-checked` ni radiogrupo en `LoginScreen.jsx`, líneas 631–690. El selector de tema presenta el mismo riesgo en `PreferencesCard.jsx`, líneas 87–128.
- **Impacto:** la selección no se comunica de forma fiable a personas ciegas o con baja percepción del color.
- **Recomendación:** implementar radiogrupos o agregar `aria-pressed` y un indicador textual no dependiente del color.

### A11Y-05 — Errores y éxitos de autenticación no se anuncian

- **Prioridad:** Alta.
- **Estado:** No cumple.
- **Criterio:** 4.1.3 Mensajes de estado (AA).
- **Evidencia:** `LoginScreen.jsx`, líneas 448–452, 546–550, 755–768 y 946–951. Los mensajes aparecen visualmente sin `role="alert"`, `role="status"` o `aria-live`.
- **Impacto:** un usuario de lector de pantalla puede no enterarse de que las credenciales, el código o la recuperación fallaron.
- **Recomendación:** anunciar errores con `role="alert"` y confirmaciones no urgentes con `role="status"`.

### A11Y-06 — Falta un acceso visible para saltar la navegación

- **Prioridad:** Media.
- **Estado:** Parcial; requiere prueba manual.
- **Criterio:** 2.4.1 Evitar bloques (A).
- **Evidencia:** no existe un enlace “Saltar al contenido principal”. Los landmarks `nav` y `main` ofrecen un mecanismo de navegación para tecnologías de asistencia compatibles, pero no un acceso visible al foco para todas las personas que usan teclado.
- **Impacto:** cada carga obliga a recorrer nuevamente barra lateral y barra superior.
- **Recomendación:** añadir al inicio un enlace visible al foco que apunte a un `main` identificable.

### A11Y-07 — Gestión incompleta del foco y semántica de diálogos

- **Prioridad:** Alta.
- **Estado:** Parcial, con probable incumplimiento.
- **Criterios:** 2.4.3 Orden del foco (A), 2.4.11 Foco no oculto (mínimo) (AA) y 4.1.2 Nombre, función y valor (A).
- **Evidencia:** `ModalDialog.jsx`, líneas 32–43 y 56–71, admite Escape y declara `aria-modal`, pero no contiene ni restaura el foco. `VideoConferenceModal.jsx`, líneas 8–21, carece de semántica de diálogo y nombre accesible. `ProjectDetail.jsx`, líneas 117–165, no asigna un nombre al diálogo ni gestiona el foco.
- **Impacto:** el teclado puede continuar detrás del diálogo, perder su posición o no identificar la ventana abierta.
- **Recomendación:** enfocar el título o primer control, contener Tab y Shift+Tab, volver inerte el fondo, nombrar cada diálogo y devolver el foco al activador.

### A11Y-08 — Contraste insuficiente en combinaciones representativas

- **Prioridad:** Alta.
- **Estado:** No cumple en las combinaciones indicadas.
- **Criterios:** 1.4.3 Contraste mínimo (AA) y 1.4.11 Contraste no textual (AA).
- **Evidencia:** cálculo de luminancia relativa sobre tokens y fondos documentados.

| Uso representativo | Combinación | Ratio aproximado | Mínimo | Resultado |
|---|---|---:|---:|---|
| Texto normal Light | `cyan-600 #0891B2` sobre blanco | 3.68:1 | 4.5:1 | No cumple |
| Texto normal Light | `amber-600 #D97706` sobre blanco | 3.19:1 | 4.5:1 | No cumple |
| Texto normal Light | `emerald-600 #059669` sobre blanco | 3.77:1 | 4.5:1 | No cumple |
| Texto secundario Light | `slate-400 #94A3B8` sobre blanco | 2.56:1 | 4.5:1 | No cumple |
| Indicador de foco Light | `cyan-500 #06B6D4` sobre blanco | 2.43:1 | 3:1 | No cumple |
| Texto normal Midnight | `cyan-500/70` sobre `#0A1120` | 4.36:1 | 4.5:1 | No cumple |

El componente `InlineAlert` también contiene una combinación informativa de muy bajo contraste en tema claro. Los valores con transparencia deben confirmarse sobre cada superficie final renderizada. Existen combinaciones adecuadas, como `slate-500` sobre blanco (4.76:1) y `cyan-700` sobre blanco (5.36:1).

- **Impacto:** textos pequeños, estados e indicadores de foco pueden ser difíciles de percibir.
- **Recomendación:** usar tonos que alcancen 4.5:1 para texto normal y 3:1 para componentes, bordes de foco y texto grande.

### A11Y-09 — Texto de ayuda no siempre asociado al campo

- **Prioridad:** Media.
- **Estado:** Parcial.
- **Criterios:** 1.3.1 Información y relaciones (A) y 3.3.2 Etiquetas o instrucciones (A).
- **Evidencia:** `Input.jsx`, líneas 104–110 y 136–145. El error recibe asociación, pero `helperText` no tiene identificador ni se incorpora a `aria-describedby`.
- **Impacto:** la instrucción puede no anunciarse al enfocar el campo.
- **Recomendación:** asignar un id al texto de ayuda y combinarlo con el id del error.

### A11Y-10 — Jerarquía incompleta en el Dashboard

- **Prioridad:** Media.
- **Estado:** Parcial.
- **Criterios:** 1.3.1 Información y relaciones (A) y 2.4.6 Encabezados y etiquetas (AA).
- **Evidencia:** `DashboardContent.jsx`, desde la línea 100, inicia con secciones y encabezados `h3`, sin un `h1` propio; otras vistas sí utilizan `PageHeader`.
- **Impacto:** se dificulta identificar el propósito de la vista y recorrerla por encabezados.
- **Recomendación:** incorporar un `h1` y mantener una jerarquía secuencial.

### A11Y-11 — Gráficas e iconos de acción necesitan alternativas más completas

- **Prioridad:** Media.
- **Estado:** Parcial.
- **Criterios:** 1.1.1 Contenido no textual (A) y 4.1.2 Nombre, función y valor (A).
- **Evidencia:** la gráfica de peticiones API no ofrece valores o tabla equivalente en `StatusPanel.jsx`, líneas 89–123. Varias acciones de Drive dependen de `title` en `GoogleDriveFileManager.jsx`, líneas 354–383. El QR de 2FA usa el texto alternativo genérico `QR Code`.
- **Recomendación:** proporcionar resumen/tendencia o tabla equivalente, nombres accesibles que incluyan el archivo y un texto alternativo funcional para el QR.

### A11Y-12 — Menús personalizados requieren estado y foco programáticos

- **Prioridad:** Media.
- **Estado:** Parcial.
- **Criterios:** 2.4.3 Orden del foco (A) y 4.1.2 Nombre, función y valor (A).
- **Evidencia:** el menú de acciones del técnico no expone `aria-expanded` o `aria-controls` y no administra el foco al abrir/cerrar en `TechnicalTeam.jsx`, líneas 377–378.
- **Recomendación:** comunicar su estado, enlazar control y panel, permitir Escape y restaurar el foco.

## 7. Criterios nuevos de WCAG 2.2 que requieren seguimiento

| Criterio AA | Estado | Próxima comprobación |
|---|---|---|
| 2.4.11 Foco no oculto (mínimo) | Riesgo en modales | Recorrer todos los diálogos y verificar que el foco siempre permanezca visible. |
| 2.5.7 Movimientos de arrastre | No se observó dependencia en la muestra | Confirmar en Gantt, rangos y controles gráficos una alternativa de clic o teclado. |
| 2.5.8 Tamaño del objetivo (mínimo) | Requiere prueba manual | Medir controles; deben alcanzar 24 × 24 CSS px o cumplir una excepción. |
| 3.2.6 Ayuda consistente | Requiere prueba manual | Comprobar ubicación y orden coherentes de contacto, ayuda y asistente. |
| 3.3.7 Entrada redundante | Requiere prueba de procesos | Recorrer altas, reasignaciones e incidencias para evitar datos repetidos innecesarios. |
| 3.3.8 Autenticación accesible (mínimo) | Parcial | Verificar pegado, gestores de contraseña y alternativas que eviten memoria o transcripción manual. |

## 8. Plan de corrección recomendado

### Prioridad 0 — Antes de declarar conformidad

1. hacer operables por teclado los controles de contraseña, notificaciones e hitos;
2. etiquetar los campos 2FA y los demás campos basados solo en placeholder;
3. exponer los estados seleccionados de rol y tema;
4. anunciar errores y confirmaciones de autenticación;
5. incorporar un enlace para saltar al contenido principal;
6. corregir los contrastes confirmados;
7. corregir semántica y foco de los diálogos.

### Prioridad 1 — Componentes compartidos

1. asociar `helperText` con sus campos;
2. añadir un `h1` al Dashboard;
3. unificar foco visible, nombres accesibles y tamaños mínimos en botones de icono;
4. completar alternativas textuales de gráficas;
5. ofrecer reducción de movimiento mediante `prefers-reduced-motion`.

### Prioridad 2 — Validación funcional

1. ejecutar Axe o una herramienta equivalente en cada vista y estado relevante;
2. probar solo con teclado: Tab, Shift+Tab, Enter, Espacio, Escape y flechas;
3. probar con NVDA y al menos Chrome/Edge y Firefox;
4. comprobar zoom a 200 % y 400 %, y reflujo a 320 CSS px;
5. comprobar los tres temas y estados de error, foco, hover, deshabilitado y selección;
6. validar texto espaciado y tamaño de objetivos;
7. repetir procesos completos de todos los módulos y roles;
8. incluir personas con discapacidad en pruebas de usabilidad cuando sea posible.

## 9. Condiciones para una declaración formal

Solo se podrá declarar conformidad WCAG 2.2 AA cuando:

- todos los criterios A y AA aplicables se cumplan en páginas o vistas completas;
- se evalúen procesos completos, no únicamente pantallas aisladas;
- las tecnologías empleadas sean compatibles con accesibilidad;
- el contenido fuera del alcance no interfiera con el uso accesible;
- se documenten navegadores, tecnologías de asistencia, muestra, resultados y excepciones;
- no permanezcan fallos de nivel A o AA en el alcance declarado.

## 10. Referencias oficiales

- [Web Content Accessibility Guidelines (WCAG) 2.2](https://www.w3.org/TR/WCAG22/).
- [Descripción general de WCAG 2](https://www.w3.org/WAI/standards-guidelines/wcag/).
- [Novedades de WCAG 2.2](https://www.w3.org/WAI/standards-guidelines/wcag/new-in-22/).
- [WCAG Evaluation Methodology (WCAG-EM) 2.0](https://www.w3.org/TR/wcag-em-2/).
- [Descripción general de WCAG-EM](https://www.w3.org/WAI/test-evaluate/conformance/wcag-em/).
- [Referencia rápida para cumplir WCAG 2.2](https://www.w3.org/WAI/WCAG22/quickref/).

## 11. Registro de revisión

| Versión | Fecha | Cambio |
|---|---|---|
| 0.1 | 14/11/2026 | Primera evaluación preliminar WCAG 2.2 AA basada en inspección del frontend y contraste representativo. |
