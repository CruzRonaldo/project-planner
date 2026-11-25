# 5. Gestión Operativa y Órdenes de Trabajo

[← Volver al índice](./README.md)

---

## Espacios, Métricas y Componentes de la Vista

La vista de **Gestión Operativa** coordina las labores de campo y gabinete mediante indicadores de productividad, control de actividades críticas y emisión de órdenes de trabajo:

- **1. Tarjetas KPI Operativas Superiores:**
  - **Tareas en progreso:** Conteo de labores activas que están siendo ejecutadas en este momento.
  - **Tareas completadas:** Registro de actividades finalizadas y técnicamente aprobadas.
  - **Incidencias abiertas:** Número de bloqueos, accidentes o alertas que requieren solución técnica.
  - **Eficiencia operativa:** Porcentaje global de cumplimiento de metas y plazos de obra.

- **2. Cronograma Crítico de Campo:**
  - Panel visual que resume las fases de trabajo activas y las labores prioritarias programadas para la semana en curso.

- **3. Ficha Técnica Consolidada del Proyecto:**
  - Al elegir una obra en el selector, presenta de inmediato el líder a cargo, la disciplina técnica principal, el total de horas hombre consumidas y el porcentaje de avance físico real.

- **4. Tablero de Órdenes de Trabajo:**
  - **Filtros Combinados:** Permite filtrar órdenes por estado (*Todas*, *En Progreso*, *Completadas*, *En Pausa*) y por obra específica.
  - **Menú de Ordenamiento (`SortDropdown`):** Organiza las tareas por fecha límite, por horas estimadas o por nivel de prioridad (*Crítica*, *Alta*, *Media*, *Baja*).
  - **Tabla de Labores:**
    - Código de la orden (`OT-xxx`) y título descriptivo de la labor.
    - Especialista técnico responsable y proyecto asociado.
    - **Insignia roja `CPM`:** Identifica labores en ruta crítica que no admiten demoras.
    - Horas estimadas frente a horas reales ejecutadas.
    - Selector desplegable de estado en línea (*Pendiente*, *En Proceso*, *Completada*, *Atrasada*).
    - Botón de detalle: despliega la ficha completa de la orden con especificaciones y firmas.

- **5. Acciones de Cabecera:**
  - **Botón [Generar Reporte Diario]:** Descarga inmediata del archivo estructurado `reporte-operativo-diario.csv`.
  - **Botón [Nueva Orden de Trabajo]:** Abre el asistente de emisión de labores operativas.

![Gestión Operativa y Ficha Técnica](../../assets/manual/06-ficha-tecnica-operaciones.png)
*Figura 5.1: Panel de Gestión Operativa con resumen de tareas, cronograma crítico y tabla de órdenes de trabajo.*

---

## 5.1 Consultar indicadores operativos y cronograma crítico

**Disponible para:** todos los roles.

1. En el menú lateral, seleccione **“Gestión Operativa”** (`Shift + 4`).
2. Revise las 4 tarjetas KPI para conocer las tareas activas, completadas y la eficiencia general.
3. Observe el cronograma crítico para identificar qué labores deben cumplirse con urgencia.
4. En el desplegable de proyectos, seleccione una obra específica para ver su ficha técnica consolidada.

**Resultado esperado:** la vista filtra las métricas y muestra las órdenes correspondientes al proyecto elegido.

---

## 5.2 Emitir una nueva Orden de Trabajo

**Disponible para:** Administrador, Subadministrador y Líder de Proyecto.

1. Presione el botón **[Nueva Orden de Trabajo]** en la cabecera.
2. Complete los campos del formulario:
   - **Proyecto vinculado (\*):** Confirme la obra donde se ejecutará la labor.
   - **Título de la labor (\*):** Descripción clara de la actividad (ej. *"Vaciado de concreto en losa nivel 3"*).
   - **Especialista asignado (\*):** Seleccione al técnico responsable dentro del personal disponible.
   - **Prioridad (\*):** Elija entre *Baja*, *Media*, *Alta* o *Crítica*.
   - **Horas estimadas (\*):** Ingrese el esfuerzo previsto en horas.
   - **Labor predecesora (Opcional):** Si la tarea requiere que otra labor concluya antes de iniciar, elíjala en la lista.
   - **Descripción y especificaciones:** Instrucciones de seguridad o control de calidad.
3. Presione **[Emitir Orden]**.

**Resultado esperado:** la orden queda registrada en el tablero con su código oficial y se añade a la lista de tareas del técnico asignado.

---

## 5.3 Actualizar el estado de una orden de trabajo

**Disponible para:** todos los roles (los técnicos pueden actualizar el estado de sus labores asignadas).

1. Localice la orden en la tabla de actividades.
2. En la columna **Estado**, abra el menú desplegable.
3. Seleccione el nuevo estado de avance (*En Proceso* o *Completada*).

**Resultado esperado:** el sistema actualiza la etiqueta de color al instante y recalcula el porcentaje de avance general de la obra.

---

## 5.4 Ver el detalle técnico de una orden

**Disponible para:** todos los roles.

1. En la fila de la orden de trabajo, presione el botón de inspección (icono de hoja o tres puntos).
2. Se abrirá la ventana modal con las especificaciones técnicas completas, horas reportadas y observaciones registradas.
3. Presione cerrar para volver a la tabla.

---

## 5.5 Exportar el reporte operativo diario en CSV

**Disponible para:** todos los roles.

1. Aplique los filtros de proyecto o estado que desee incluir en el reporte.
2. En la cabecera, presione el botón **[Generar Reporte Diario]**.
3. El navegador descargará automáticamente el archivo `reporte-operativo-diario.csv` listo para su revisión en hojas de cálculo.
