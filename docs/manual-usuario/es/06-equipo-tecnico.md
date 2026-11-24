# 6. Directorio del Equipo Técnico y Especialistas

[← Volver al índice](./README.md)

---

## Espacios, Tarjetas y Semáforo de Disponibilidad

El módulo de **Equipo Técnico** gestiona el directorio de ingenieros, arquitectos y especialistas que conforman la fuerza operativa de la organización:

- **1. Pestañas de Especialidad con Contadores Numéricos:**
  - **Todos los especialistas:** Muestra la totalidad de la nómina con su contador global.
  - **Arquitectura:** Especialistas en diseño espacial, urbanismo y modelado BIM.
  - **Civil / Estructuras:** Ingenieros dedicados a cimentaciones, cálculo y supervisión de obra.
  - **Sistemas / Instalaciones:** Especialistas electromecánicos, sanitarios y de telecomunicaciones (MEP).

- **2. Desplegable de Ordenamiento (`SortDropdown`):**
  - *Mayor disponibilidad primero* / *Menor disponibilidad primero*.
  - *Nombre (A-Z)* / *Nombre (Z-A)*.
  - *Fecha de incorporación más reciente*.

- **3. Buscador Dinámico y Botón [Limpiar Filtros]:**
  - Permite localizar a cualquier profesional escribiendo su nombre, especialidad o el proyecto donde colabora.

- **4. Tarjetas de Especialistas Técnicos:**
  - **Fotografía de Perfil:** Avatar profesional con distintivo de estado.
  - **Identidad:** Nombre completo, cargo técnico y correo corporativo.
  - **Proyecto Activo:** Obra en la que colabora actualmente o la indicación *“Sin proyecto inicial”*.
  - **Semáforo de Carga Laboral y Disponibilidad:**
    - **Verde (Disponible):** Carga menor o igual al 70%. Apto para asignarle nuevas labores.
    - **Azul (Asignado):** Carga entre 71% y 100%. Capacidad de trabajo equilibrada.
    - **Rojo (Sobrecargado):** Carga superior al 100%. Señal de alerta para evitar saturación laboral.
  - **Canales de Contacto Directo:** Icono de correo para redactar un mensaje directo e icono de teléfono para llamada telefónica inmediata.
  - **Menú de Opciones en Tarjeta:** Acceso a reasignación de obra, pausa de cuenta (modo suave) y baja definitiva auditada.

![Directorio del Equipo Técnico](../../assets/manual/07-directorio-tecnico.png)
*Figura 6.1: Directorio técnico con pestañas de especialidad, semáforo de disponibilidad y opciones de reasignación.*

---

## 6.1 Consultar especialistas y disponibilidad

**Disponible para:** todos los roles.

1. En el menú lateral, seleccione **“Equipo Técnico”** (`Shift + 5`).
2. Utilice las pestañas para filtrar por especialidad (*Civil*, *Arquitectura*, etc.).
3. Revise la barra de color en la tarjeta de cada profesional para verificar si está disponible (verde), asignado (azul) o sobrecargado (rojo).
4. Use el menú **Ordenar:** si desea listar primero a los profesionales con mayor tiempo disponible.

**Resultado esperado:** el directorio organiza las tarjetas según los filtros y criterios seleccionados.

---

## 6.2 Dar de alta a un especialista técnico

**Disponible para:** Administrador y Subadministrador.

1. Presione el botón **[Añadir Técnico]** en la cabecera.
2. Complete los datos obligatorios del formulario:
   - **Nombres y Apellidos (\*):** Datos de identidad del profesional.
   - **Correo institucional (\*):** Correo corporativo para inicio de sesión.
   - **Contraseña inicial (\*):** Clave de acceso con un mínimo de 6 caracteres.
   - **Área Técnica (\*):** Elija entre *Civil*, *Arquitectura* o *Sistemas*.
   - **Especialidad (\*):** Cargo técnico específico (ej. *"Ingeniero Estructural"* o *"Topógrafo"*).
   - **Proyecto inicial y Estado:** Asigne una obra existente y defina su estado (*Activo*, *Stand-by*, *En apoyo*).
   - **Porcentaje de dedicación (\*):** Capacidad de trabajo inicial asignada (0% a 100%).
   - **Fotografía (Opcional):** Imagen en formato JPG o PNG.
3. Presione **[Añadir al equipo]**.

**Resultado esperado:** aparece la notificación de confirmación y la nueva tarjeta se agrega al directorio.

---

## 6.3 Reasignar a un técnico de proyecto

**Disponible para:** Administrador y Subadministrador.

1. En la tarjeta del especialista, abra el menú de opciones (icono de tres puntos) y seleccione **[Reasignar proyecto]**.
2. Elija la nueva obra receptora en la lista desplegable.
3. Ajuste el porcentaje de dedicación y seleccione el motivo técnico del traslado.
4. Presione **[Guardar Reasignación]**.

**Resultado esperado:** la tarjeta actualiza el nombre de la obra asignada y el movimiento queda registrado en el historial del sistema.

---

## 6.4 Desactivar temporalmente a un técnico (Modo Suave)

**Disponible para:** Administrador y Subadministrador.

1. En el menú de la tarjeta del técnico, seleccione **[Desactivar técnico]**.
2. Confirme la acción en el diálogo.

**Resultado esperado:** la cuenta pasa a estado inactivo temporalmente, conservando todas sus asignaciones e historial para cuando sea reactivada.

---

## 6.5 Dar de baja definitiva a un técnico (Baja Auditada)

**Disponible para:** exclusivo Administrador.

1. En el menú de la tarjeta del especialista, seleccione **[Eliminar / Dar de baja]**.
2. El sistema evaluará automáticamente si el técnico tiene órdenes de trabajo activas o liderazgo en proyectos.
3. En el diálogo de confirmación, verifique las tareas pendientes y confirme si serán reasignadas a la coordinación general.
4. Presione **[Confirmar Baja Definitiva]**.

**Resultado esperado:** la cuenta se retira del sistema garantizando que ninguna orden de trabajo quede huérfana y protegiendo la integridad histórica de las auditorías.
