# 2. Dashboard y Planificación Estratégica

[← Volver al índice](./README.md)

## 2.1 Consultar el Dashboard

**Disponible para:** todos los roles.

1. Presione **“Inicio”** en el menú lateral.
2. Revise las tarjetas de indicadores: proyectos activos, hitos pendientes, presupuesto y optimización.
3. Consulte el calendario resumido de proyectos.
4. Revise alertas, progreso y distribución presupuestaria cuando existan datos.
5. Utilice el buscador superior para localizar un proyecto o hito.

**Resultado esperado:** los indicadores se calculan con la información disponible del portafolio.

Si el Dashboard aparece vacío, abra **Portafolio** y confirme que existan proyectos registrados. También puede deberse a que el backend todavía está cargando.

> **Captura recomendada:** Dashboard completo con las cuatro tarjetas y el calendario numerados.

## 2.2 Consultar el Calendario Maestro

**Disponible para:** todos los roles. Las cuentas técnicas tienen acceso principalmente de consulta.

1. Presione **“Planificación Estratégica”**.
2. En **“Filtrar por proyecto”**, seleccione un proyecto o deje la opción general.
3. Seleccione el año que desea consultar.
4. Lea las barras del Gantt para identificar inicio, duración y continuidad.
5. Revise **Hitos Globales**, estados y fechas.
6. Consulte el historial de reajustes cuando esté disponible.

**Resultado esperado:** el cronograma muestra únicamente los proyectos que coinciden con los filtros.

## 2.3 Ajustar el calendario de un proyecto

**Disponible para:** Administrador y Subadministrador.

1. Presione **“Ajustar Calendario”**.
2. Seleccione el proyecto que será reprogramado.
3. Seleccione el mes de inicio.
4. Ajuste la duración total.
5. Seleccione o escriba el motivo del reajuste.
6. Revise la vista previa.
7. Presione **“Guardar ajustes”**.

**Resultado esperado:** la barra del proyecto cambia y el movimiento queda registrado en el historial de reajustes.

**Si no funciona:** confirme que el proyecto exista en la base de datos, que la duración sea válida y que la cuenta tenga permisos de gestión.

> **Captura recomendada:** diálogo Ajustar Calendario con proyecto, duración, motivo y botón Guardar ajustes.

## 2.4 Analizar tiempos

**Disponible para:** Administrador y Subadministrador.

1. Presione **“Analizar tiempos”**.
2. Seleccione el proyecto.
3. Revise dependencias, responsables y tareas disponibles.
4. Presione **“Calcular propuesta”**.
5. Revise el resultado antes de modificar manualmente un cronograma.

El análisis entrega una propuesta. No debe asumirse que cambia automáticamente todas las fechas del proyecto.

## 2.5 Crear un Hito Global

**Disponible para:** Administrador y Subadministrador.

1. Presione **“Nuevo Hito Global”**.
2. Seleccione el proyecto asociado.
3. Seleccione el estado inicial.
4. Escriba el nombre del hito o entrega crítica.
5. Indique la fecha límite.
6. Seleccione el responsable de validación si el formulario lo solicita.
7. Escriba la descripción o entregables.
8. Presione **“Registrar Hito Global”**.

**Resultado esperado:** el hito aparece en la sección Hitos Globales.

## 2.6 Cambiar o eliminar un hito

1. Localice el hito.
2. Para cambiarlo, abra el selector de estado y elija la nueva condición.
3. Para consultar información, presione el botón de detalle.
4. Para eliminarlo, presione el icono de eliminación y confirme solo si está seguro.

La eliminación no está disponible para cuentas técnicas.

## 2.7 Exportar el Gantt

1. Aplique primero los filtros de proyecto y año.
2. Presione **“Exportar Gantt / PDF”**.
3. En la ventana de impresión, seleccione **Guardar como PDF**.
4. Revise orientación, márgenes y vista previa.
5. Guarde el archivo.

> **Capturas recomendadas:** cabecera con las cuatro acciones administrativas, Gantt filtrado, alta de hito y selector de estado.

