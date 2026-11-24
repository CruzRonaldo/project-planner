# 2. Panel de Control (Dashboard)

[← Volver al índice](./README.md)

---

## Espacios, Gráficos y su Utilidad para el Usuario

El **Panel de Control (Dashboard)** resume el estado de salud de toda la organización en una sola pantalla:

- **1. Tarjetas KPI Superiores (Resumen Ejecutivo):**
  - **Proyectos Activos:** Muestra la cantidad total de obras en ejecución simultánea para medir el volumen operativo actual.
  - **Hitos Pendientes:** Cuantifica las metas intermedias o entregables próximos a vencer en el cronograma.
  - **Presupuesto Total:** Presenta la inversión financiera consolidada de todos los proyectos registrados.
  - **Índice de Optimización / Avance Promedio:** Refleja la velocidad media y el porcentaje de progreso físico ejecutado en toda la cartera.

- **2. Calendario Semestral de Proyectos (Mini-Gantt):**
  - *Utilidad:* Permite identificar a simple vista qué proyectos estarán activos en los próximos 6 meses sin necesidad de abrir la planificación compleja.
  - *Lectura de las barras:*
    - **Relleno sombreado interno:** Muestra el porcentaje de avance físico real de la obra.
    - **Flecha ◀ a la izquierda:** Indica que el proyecto inició antes de la ventana semestral visible.
    - **Flecha ▶ a la derecha:** Indica que el proyecto continúa después de la ventana visible.
    - **Botón [Ver Planificación]:** Salta directamente al cronograma interactivo anual.

- **3. Panel de Alertas de Ruta Crítica:**
  - *Utilidad:* Funciona como un radar preventivo que destaca proyectos con tareas críticas vencidas, en estado de riesgo o en pausa, permitiendo actuar antes de que el retraso afecte la entrega final. Cuenta con un contador numérico rojo y lista paginada.

- **4. Avance por Proyecto (Barras Horizontales):**
  - *Utilidad:* Compara visualmente el avance porcentual de las obras principales para detectar qué frentes de trabajo avanzan a buen ritmo y cuáles requieren apoyo inmediato.

- **5. Anillo de Salud del Portafolio (Gráfico Concéntrico):**
  - *Utilidad:* Clasifica la cartera completa en tres estados de salud:
    - **Verde (En Cronograma):** Obras con avance normal y sin tareas críticas atrasadas.
    - **Amarillo (En Advertencia):** Obras con retraso moderado (entre 10% y 25%).
    - **Rojo (Crítico / Desviado):** Obras con atraso severo (mayor al 25%) o detenidas.
  - En el centro muestra el porcentaje global de proyectos que se encuentran "En Plazo".
  - **Botón [Ver Auditoría Completa]:** Enlace directo para abrir la vista de Auditoría Periódica.

![Panel de Control y Métricas](../../assets/manual/02-dashboard-kpis-gantt.png)
*Figura 2.1: Panel de Control con tarjetas de KPIs ejecutivos, Mini-Gantt semestral y anillo de salud de la cartera.*

---

## 2.1 Consultar indicadores y estado del Dashboard

**Disponible para:** todos los roles de usuario.

1. En el menú lateral, presione **“Inicio”** o utilice el atajo `Shift + 1`.
2. Revise las 4 tarjetas superiores para conocer proyectos activos, hitos por cumplir y presupuesto total.
3. Observe el calendario semestral para comprobar la continuidad de las obras en los meses venideros.
4. Revise el panel de **Alertas Ruta Crítica** para detectar proyectos con advertencias.
5. Inspeccione el anillo de **Salud del Portafolio** para evaluar el porcentaje de obras en plazo.

**Resultado esperado:** las métricas y gráficos se presentan actualizados con la información registrada en el sistema.

---

## 2.2 Localizar proyectos desde la barra de búsqueda

**Disponible para:** todos los roles de usuario.

1. Presione la caja de búsqueda en la parte superior o utilice el atajo `Ctrl + K`.
2. Escriba el nombre, código o área del proyecto deseado.
3. El sistema filtrará instantáneamente los resultados en pantalla.
4. Para volver a ver toda la información, borre el texto de la caja de búsqueda.

---

## 2.3 ¿Qué hacer si el Dashboard aparece vacío?

Si las tarjetas muestran valores en cero o los gráficos aparecen vacíos:
1. Compruebe si existen proyectos creados ingresando a **Portafolio** (`Shift + 3`).
2. Si la plataforma acaba de iniciar, espere unos instantes mientras el sistema termina de cargar los datos.
3. Presione el botón de recarga de su navegador web para refrescar la información.
