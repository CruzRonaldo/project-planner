# 7. Recursos Humanos, Balance de Carga y Flujo de Incidencias

[← Volver al índice](./README.md)

---

## Espacios, Matriz y Flujo de Incidencias

El módulo de **Recursos Humanos** supervisa la distribución equitativa del esfuerzo técnico, gestiona incidencias laborales y genera reportes consolidados para la administración:

- **1. Tarjetas KPI de Personal:**
  - **Total Personal:** Conteo global de ingenieros, arquitectos y especialistas registrados.
  - **Activos:** Colaboradores asignados a obras en ejecución sin impedimentos de disponibilidad.
  - **Stand-by:** Especialistas en reserva técnica esperando el inicio de nuevas etapas.
  - **En Apoyo:** Personal asignado a labores transversales de asesoría o soporte.
  - **Alerta de Próximas Licencias:** Indicador numérico que alerta sobre ausencias o permisos programados que iniciarán en los próximos días.

- **2. Tabla de Asignación y Carga Laboral:**
  - Detalla nombre, correo, área técnica y proyecto activo de cada colaborador.
  - **Barra de Dedicación Efectiva:** Muestra el porcentaje de esfuerzo acumulado. Si supera el 100%, se ilumina en rojo como alerta visual para prevenir la sobrecarga y el desgaste laboral (*burnout*).

- **3. Tabla de Registro y Flujo de Incidencias Laborales:**
  - Registra las ausencias temporales: Especialista, Tipo de evento (*Licencia médica*, *Permiso especial*, *Falta injustificada*, *Capacitación técnica*, *Accidente laboral*), Fechas de inicio y fin, Justificación y Estado (*Pendiente*, *Aprobada*, *Rechazada*, *Finalizada*).
  - **Botones de Flujo de Aprobación en Línea:**
    - **Botón [Aprobar]:** Valida la ausencia y descuenta la dedicación del especialista durante las fechas indicadas.
    - **Botón [Rechazar]:** Abre un diálogo para registrar el motivo de denegación.
    - **Botón [Finalizar]:** Concluye la incidencia tras la reincorporación del especialista, restableciendo su disponibilidad al 100%.

- **4. Acciones de Cabecera:**
  - **Botón [Registrar Incidencia / Licencia]:** Despliega el formulario de reporte de ausencias.
  - **Botón [Exportar Matriz]:** Compila y descarga la nómina institucional completa en formato Microsoft Excel (`matriz-recursos-humanos.xlsx`).

![Matriz de Recursos Humanos e Incidencias](../../assets/manual/08-matriz-rrhh-incidencias.png)
*Figura 7.1: Matriz de Recursos Humanos con balance de carga laboral, flujo de aprobación de incidencias y exportación a Excel.*

---

## 7.1 Supervisar balance de carga y saturación de personal

**Disponible para:** Administrador y Subadministrador (lectura para líderes de equipo).

1. En el menú lateral, seleccione **“Recursos Humanos”** (`Shift + 6`).
2. Revise las tarjetas KPI para conocer la dotación activa y la alerta de próximas licencias.
3. En la tabla de asignación, examine las barras de dedicación para identificar profesionales con sobrecarga (>100%).
4. Utilice el buscador para consultar a un colaborador por nombre o correo.

---

## 7.2 Registrar una incidencia o licencia de personal

**Disponible para:** Administrador y Subadministrador.

1. Presione el botón **[Registrar Incidencia / Licencia]** en la parte superior.
2. Complete los campos requeridos:
   - **Colaborador (\*):** Seleccione al especialista en la lista desplegable.
   - **Tipo de evento (\*):** Elija entre *Licencia médica*, *Permiso especial*, *Falta*, *Capacitación* o *Accidente laboral*.
   - **Fechas de inicio y fin (\*):** Defina el periodo exacto de ausencia.
   - **Justificación (\*):** Escriba el motivo y referencias de comprobantes.
3. Presione **[Guardar Incidencia]**.

**Resultado esperado:** la incidencia se agrega a la tabla de seguimiento con estado inicial *Pendiente*.

---

## 7.3 Flujo de supervisión y aprobación de incidencias

**Disponible para:** Administrador y Subadministrador.

1. Desplácese a la sección inferior de **Incidencias Registradas**.
2. Revise las solicitudes pendientes:
   - Para aprobar: presione el botón verde **[Aprobar]**. El sistema registrará la aprobación y ajustará la disponibilidad del técnico en las fechas previstas.
   - Para denegar: presione el botón rojo **[Rechazar]**, escriba el motivo del rechazo en el diálogo y confirme.
   - Para concluir: cuando el especialista se reincorpore a sus funciones de obra, presione el botón **[Finalizar]** para restaurar su capacidad de asignación al 100%.

---

## 7.4 Exportar la nómina completa a Excel

**Disponible para:** Administrador y Subadministrador.

1. En la esquina superior derecha, presione el botón **[Exportar Matriz]**.
2. El sistema compilará la nómina de especialistas, especialidades, proyectos y horas.
3. El navegador descargará automáticamente el archivo `matriz-recursos-humanos.xlsx` estilizado con encabezados oficiales.
