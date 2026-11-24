# 3. Planificación Estratégica, Hitos Globales e Historial de Reajustes

[← Volver al índice](./README.md)

---

## Espacios, Gráficos y Controles de la Vista

La vista de **Planificación Estratégica** coordina los horizontes temporales de entrega y el control presupuestario de la organización mediante 4 secciones interactivas:

- **1. Cronograma Maestro Gantt Anual:**
  - Despliega en barras mensuales el ciclo de vida de todas las obras del año.
  - **Filtro por Proyecto:** Desplegable que permite enfocar el cronograma en una obra específica o seleccionar *“Todos los proyectos”*.
  - **Selector de Año:** Alterna la visualización entre distintos periodos anuales (ej. 2025, 2026, 2027).
  - **Marcadores de Hitos:** Rombos numerados sobre las barras que señalan fechas clave de entrega.
  - **Insignia de Gobernanza Presupuestaria ($100k):** Distintivo visual en proyectos que igualan o superan los $100.000 USD.
  - **Botón [Exportar Gantt / PDF]:** Permite imprimir o descargar el cronograma anual en formato PDF.
  - **Botones de Gestión:** Acceso a **[Ajustar Calendario]**, **[Analizar tiempos]** y **[Nuevo Hito]**.

- **2. Panel de Hitos Globales:**
  - **Sincronización:** Si selecciona un proyecto en el Gantt, la lista de hitos se filtra automáticamente para mostrar solo los de esa obra. Si elige *“Todos”*, muestra los hitos de toda la cartera.
  - **Menú de Ordenamiento (`SortDropdown`):** Permite organizar los hitos según su prioridad:
    - *Fecha más próxima (Fecha ascendente)*
    - *Fecha más lejana (Fecha descendente)*
    - *Por estado: En Proceso primero*
    - *Por estado: Pendientes primero*
    - *Por estado: Completados primero*
  - **Ficha de Hito:** Presenta el nombre de la meta, código de proyecto asociado (`PRJ-2026-xxx`), nombre de la obra y fecha límite.
  - **Selector de Estado en Línea:** Menú desplegable para cambiar directamente el estado a *Pendiente*, *En Proceso* o *Completado*.
  - **Acciones:** Botón de detalles (icono tres puntos) para ver la descripción y responsable, y botón de eliminar (icono papelera).

- **3. Control Presupuestario y Distribución por Área Técnica:**
  - Gráfico de donut con el presupuesto total asignado, monto ejecutado y saldo disponible.
  - **Si hay un proyecto seleccionado:** Detalla su disciplina técnica, duración en meses, porcentaje de avance y tasa de ejecución.
  - **Si está en vista general:** Exhibe barras horizontales con la inversión distribuida por Área Técnica (*Civil*, *Arquitectura*, *Sistemas*), presupuesto promedio por obra y total de iniciativas en cartera.

- **4. Historial de Auditoría y Reajustes de Cronograma:**
  - Registro inmutable al pie de la vista que documenta cada reprogramación realizada.
  - Muestra: Proyecto modificado, Fechas Anteriores, Nuevas Fechas, Duración Ajustada, Responsable del cambio, Fecha/Hora exacta y el **Motivo Obligatorio de Reprogramación** (ej. *Retraso climático*, *Ampliación de alcance*, *Adenda de contrato*).

![Planificación Estratégica y Cronograma Gantt](../../assets/manual/03-planificacion-estrategica-gantt.png)
*Figura 3.1: Vista general de Planificación Estratégica con cronograma Gantt maestro, panel de hitos y control presupuestario.*

---

## 3.1 Consultar y filtrar el cronograma Gantt

**Disponible para:** todos los roles.

1. En el menú lateral, seleccione **“Planificación Estratégica”** (`Shift + 2`).
2. En el desplegable **Filtrar por proyecto**, seleccione una obra en particular o elija **Todos los proyectos**.
3. En el selector de año, elija el periodo que desea revisar (ej. 2026).
4. Revise las barras horizontales para conocer las fechas de inicio, término y los rombos de hitos programados.

**Resultado esperado:** la cuadrícula del cronograma se ajusta mostrando únicamente los proyectos que coinciden con los filtros aplicados.

---

## 3.2 Ajustar el calendario de un proyecto (Reprogramación)

**Disponible para:** Administrador y Subadministrador.

1. En la parte superior de la vista, presione el botón **[Ajustar Calendario]**.
2. En la ventana modal, seleccione el proyecto que requiere reprogramación.
3. Elija el nuevo mes y año de inicio.
4. Ajuste la duración total en meses mediante el selector numérico.
5. Ingrese el **Motivo del Reajuste** (campo obligatorio que justifica el cambio ante auditorías).
6. Revise la vista previa de las nuevas fechas y presione **[Guardar ajustes]**.

**Resultado esperado:** la barra del proyecto se desplaza en el Gantt y el movimiento se registra de inmediato en la tabla del **Historial de Reajustes**.

**Si no funciona:** compruebe que la duración sea de al menos 1 mes y que haya escrito una justificación técnica válida.

![Modal de Ajuste de Calendario](../../assets/manual/03-ajustar-calendario-modal.png)
*Figura 3.2: Asistente modal para reprogramación de fechas con registro obligatorio de motivo de auditoría.*

---

## 3.3 Consultar y ordenar los Hitos Globales

**Disponible para:** todos los roles (actualización de estado reservada a roles de gestión).

1. Desplácese a la sección **Hitos Globales**.
2. Abra el menú desplegable **Ordenar:** y seleccione el criterio deseado (*Fecha más próxima*, *En Proceso primero*, etc.).
3. Para cambiar el avance de un hito, presione sobre su etiqueta de estado y seleccione *En Proceso* o *Completado*.
4. Para consultar detalles adicionales o el responsable, presione el icono de tres puntos.

**Resultado esperado:** la lista se reorganiza según el criterio elegido y el cambio de estado se refleja en el rombo del Gantt.

---

## 3.4 Registrar un nuevo hito global

**Disponible para:** Administrador y Subadministrador.

1. Presione el botón **[Nuevo Hito]** en la cabecera.
2. Escriba el título del hito (ej. *"Cierre de cimentaciones y losa base"*).
3. Seleccione el proyecto vinculado.
4. Defina la fecha límite de cumplimiento.
5. Indique el nombre del especialista o líder responsable.
6. Presione **[Guardar Hito]**.

**Resultado esperado:** el nuevo hito se incorpora al panel y aparece marcado como un rombo sobre la barra de la obra correspondiente.

---

## 3.5 Analizar tiempos con el motor de optimización

**Disponible para:** Administrador y Subadministrador.

1. Presione el botón **[Analizar tiempos]**.
2. Seleccione la obra que desea evaluar.
3. El sistema evaluará las tareas y holguras para proponer una compresión de plazos viable.
4. Revise las recomendaciones y decida si aplica la sugerencia de calendario.

---

## 3.6 Exportar o imprimir el cronograma en PDF

**Disponible para:** todos los roles.

1. Aplique los filtros de proyecto y año que desea exportar.
2. Presione el botón **[Exportar Gantt / PDF]**.
3. Se abrirá la vista de impresión estilizada lista para guardar en PDF o imprimir en papel.

---

## 3.7 Consultar el Historial de Reajustes de Cronograma

**Disponible para:** todos los roles.

1. Desplácese a la tabla ubicada en la parte inferior de la vista.
2. Revise las filas para comprobar qué proyectos fueron reprogramados, qué usuario realizó el cambio, la fecha del ajuste y el motivo registrado.
