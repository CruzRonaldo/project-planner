# 4. Portafolio de Proyectos y Repositorio de Obras

[← Volver al índice](./README.md)

---

## Espacios, Controles y Tarjetas de Proyecto

El **Portafolio** centraliza el repositorio de todas las obras corporativas mediante tarjetas visuales de alta densidad y herramientas de filtrado rápido:

- **1. Barra Superior y Acciones de Cabecera:**
  - **Botón [Auditoría de Proyectos]:** Abre una ventana modal de auditoría periódica directamente en el Portafolio, permitiendo inspeccionar desvíos y salud sin cambiar de vista.
  - **Botón [Crear Proyecto]:** Despliega el formulario para dar de alta una nueva obra (reservado a roles de gestión).

- **2. Sistema de Filtros y Ordenamiento:**
  - **Pestañas por Estado:** Permiten aislar proyectos por su etapa operativa: *Todos los proyectos*, *Activos (En Progreso)*, *En Planificación*, *En Pausa* y *En Riesgo*.
  - **Filtro de Alcance:** Pestaña *“Mis proyectos”* (muestra exclusivamente las obras donde el usuario autenticado figura como líder o colaborador) frente a *“Todos”*.
  - **Desplegable de Ordenamiento (`SortDropdown`):** Ofrece 4 criterios de clasificación:
    - *Mayor presupuesto* / *Menor presupuesto*.
    - *Nombre (A-Z)* / *Nombre (Z-A)*.
    - *Mayor avance* / *Menor avance*.
    - *Entrega más próxima* / *Fecha más lejana*.
  - **Botón [Limpiar Filtros]:** Se activa de forma automática cuando hay texto de búsqueda o filtros aplicados, permitiendo restablecer la cuadrícula completa con un solo clic.

- **3. Ficha / Tarjeta de Obra:**
  - **Cabecera:** Código institucional (`PRJ-2026-xxx`), título oficial del proyecto y distintivo cian *"Tu Liderazgo"* si usted es el líder asignado.
  - **Insignia de Gobernanza:** Distintivo `Comité (>$100k)` para obras con presupuestos mayores a $100.000 USD.
  - **Métricas:** Barra de progreso general con porcentaje exacto, fechas programadas de inicio y fin, presupuesto total y avatares del equipo técnico asignado.
  - **Conectores Directos:**
    - Icono de carpeta: abre la carpeta compartida en **Google Drive** con planos DWG y documentación técnica.
    - Icono de cámara de video: abre directamente la sala virtual en **Jitsi Meet** para coordinación técnica remota.
  - **Herramientas de Edición:** Icono de lápiz para modificar datos y papelera para eliminar obras (según permisos del rol).

![Portafolio de Proyectos](../../assets/manual/04-portafolio-tarjetas-gobernanza.png)
*Figura 4.1: Vista general del Portafolio con tarjetas de obra, filtros por estado y distintivos de gobernanza.*

---

## 4.1 Consultar y ordenar proyectos

**Disponible para:** todos los roles.

1. En el menú lateral, seleccione **“Portafolio”** (`Shift + 3`).
2. Utilice las pestañas para filtrar por estado (*Activos*, *En Pausa*, etc.) o presione la pestaña **Mis proyectos** para ver solo las obras a su cargo.
3. Abra el desplegable **Ordenar por** y elija el criterio que necesite (por ejemplo, *Mayor presupuesto* o *Entrega más próxima*).
4. Si desea buscar una obra específica, escriba su nombre o código en la barra superior.
5. Para reiniciar la vista, presione el botón **[Limpiar Filtros]**.

**Resultado esperado:** la cuadrícula muestra únicamente las tarjetas de proyectos que coinciden con los criterios elegidos.

---

## 4.2 Crear un nuevo proyecto

**Disponible para:** Administrador y Subadministrador.

1. Presione el botón **[Crear Proyecto]** en la cabecera.
2. Complete los datos obligatorios del formulario:
   - **Código (\*):** Código alfanumérico institucional (ej. `PRJ-2026-045`).
   - **Nombre de la obra (\*):** Título oficial del proyecto.
   - **Área Técnica (\*):** Elija entre *Civil*, *Arquitectura* o *Sistemas*.
   - **Presupuesto Total (\*):** Inversión asignada en dólares.
   - **Fecha de Inicio y Fecha de Fin (\*):** Periodo de vigencia de la obra.
   - **Líder de Obra (\*):** Seleccione al responsable técnico en la lista.
   - **Carpeta Google Drive (Opcional):** Enlace compartido para almacenar planos y memorias.
3. Presione **[Crear Proyecto]**.

**Resultado esperado:** aparece el mensaje de confirmación *"¡Proyecto Creado con Éxito!"* y la nueva tarjeta se agrega a la cuadrícula.

**Si no funciona:**
- Verifique que el código no esté repetido en otra obra existente.
- Compruebe que la fecha final sea posterior a la fecha de inicio.
- Asegúrese de que el presupuesto no contenga caracteres inválidos ni valores negativos.

![Modal Crear Nuevo Proyecto](../../assets/manual/05-nuevo-proyecto-modal.png)
*Figura 4.2: Asistente para dar de alta una nueva obra con presupuesto, fechas y líder asignado.*

---

## 4.3 Editar un proyecto existente

**Disponible para:** Administrador y Subadministrador.

1. Localice la tarjeta de la obra en el portafolio.
2. Presione el icono de lápiz (**Editar proyecto**) en la esquina superior de la tarjeta.
3. Actualice las fechas, el presupuesto, el estado operativo o la carpeta de Drive.
4. Presione **[Guardar Cambios]**.

**Resultado esperado:** la tarjeta refleja los nuevos datos inmediatamente.

---

## 4.4 Abrir Google Drive o sala de videollamada Jitsi

**Disponible para:** todos los roles con acceso a la obra.

1. En la tarjeta del proyecto, presione el icono de carpeta para abrir los planos y documentos en **Google Drive** en una nueva pestaña.
2. Presione el icono de cámara de video para unirse al instante a la sala de coordinación de **Jitsi Meet** vinculada a la obra.

---

## 4.5 Abrir la auditoría rápida desde el Portafolio

**Disponible para:** todos los roles.

1. En la cabecera de la vista, presione el botón **[Auditoría de Proyectos]**.
2. Se desplegará la ventana modal de auditoría periódica mostrando los proyectos evaluados, sus desvíos de cronograma y el estado de la ruta crítica sin abandonar el portafolio.
3. Presione el icono de cerrar (`X`) o la tecla `Escape` para volver al portafolio.

---

## 4.6 Eliminar un proyecto

**Disponible para:** exclusivo Administrador.

1. En la tarjeta de la obra, presione el icono de papelera.
2. Se abrirá un diálogo de confirmación indicando el impacto de la eliminación.
3. Escriba o confirme la acción presionando **[Confirmar Eliminación]**.

**Resultado esperado:** el proyecto se retira de la cartera salvaguardando los registros históricos de auditoría.
