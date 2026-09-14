import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';
import {
  adjustProjectSchedule,
  createGlobalMilestone,
  createStrategicPlanningData,
  formatMilestoneDate,
  formatPlanningPeriod,
  milestoneValidators,
  scheduleAdjustmentReasons,
} from '../src/mocks/strategicPlanningData.js';

test('El Calendario Maestro inicia con sus seis proyectos y periodos', () => {
  const data = createStrategicPlanningData();
  assert.equal(data.projects.length, 6);
  assert.equal(data.milestones.length, 5);
  assert.equal(data.adjustments.length, 0);
  assert.equal(data.projects[0].period, 'Ene - Jun (6 Meses)');
  assert.equal(data.projects[1].period, 'Feb - Ago (7 Meses)');
  assert.equal(formatPlanningPeriod(12, 1), 'Dic - Dic (1 Mes)');
});

test('Registrar un hito global lo agrega al calendario sin mutar los hitos existentes', () => {
  const data = createStrategicPlanningData();
  const registrationDate = new Date(2026, 8, 7, 12);
  const updated = createGlobalMilestone(data, {
    projectId: 'planning-puente',
    status: 'pending',
    title: 'Entrega de pilotes estructurales',
    targetDate: '2026-10-08',
    validator: milestoneValidators[0],
    description: 'Aprobación de pilotes, ensayos y acta de entrega de la estructura.',
    blocking: true,
  }, registrationDate);

  assert.equal(data.milestones.length, 5);
  assert.equal(updated.milestones.length, 6);
  assert.deepEqual(updated.milestones[0], {
    id: `milestone-${registrationDate.getTime()}-5`,
    projectId: 'planning-puente',
    title: 'Entrega de pilotes estructurales',
    targetDate: '2026-10-08',
    status: 'pending',
    validator: milestoneValidators[0],
    description: 'Aprobación de pilotes, ensayos y acta de entrega de la estructura.',
    blocking: true,
  });
  assert.equal(formatMilestoneDate(updated.milestones[0].targetDate), 'Programado para el 08 Oct');
});

test('El nuevo hito valida proyecto, estado, nombre, fecha, responsable y descripción', () => {
  const data = createStrategicPlanningData();
  const valid = {
    projectId: 'planning-torre',
    status: 'pending',
    title: 'Entrega principal',
    targetDate: '2026-09-30',
    validator: milestoneValidators[0],
    description: 'Entregables técnicos validados para la fase principal.',
    blocking: false,
  };

  assert.throws(() => createGlobalMilestone(data, { ...valid, projectId: 'missing' }), /proyecto asociado válido/);
  assert.throws(() => createGlobalMilestone(data, { ...valid, status: 'missing' }), /estado inicial válido/);
  assert.throws(() => createGlobalMilestone(data, { ...valid, title: 'A' }), /nombre del hito/);
  assert.throws(() => createGlobalMilestone(data, { ...valid, targetDate: 'fecha-inválida' }), /fecha límite válida/);
  assert.throws(() => createGlobalMilestone(data, { ...valid, validator: 'Sin responsable' }), /responsable de validación válido/);
  assert.throws(() => createGlobalMilestone(data, { ...valid, description: 'Breve' }), /entregables clave/);
  assert.equal(data.milestones.length, 5);
});

test('Ajustar un proyecto actualiza el Gantt y registra la auditoría sin mutar el original', () => {
  const data = createStrategicPlanningData();
  const updated = adjustProjectSchedule(data, { projectId: 'planning-puente', start: 3, duration: 6, reason: scheduleAdjustmentReasons[0] }, new Date(2026, 8, 7, 12));
  assert.equal(data.projects[1].period, 'Feb - Ago (7 Meses)');
  assert.equal(data.adjustments.length, 0);
  assert.deepEqual({ start: updated.projects[1].start, duration: updated.projects[1].duration, period: updated.projects[1].period }, { start: 3, duration: 6, period: 'Mar - Ago (6 Meses)' });
  assert.equal(updated.adjustments.length, 1);
  assert.equal(updated.adjustments[0].date, '2026-09-07');
  assert.equal(updated.adjustments[0].projectName, 'Puente Industrial');
  assert.equal(updated.adjustments[0].previousPeriod, 'Feb - Ago (7 Meses)');
  assert.equal(updated.adjustments[0].nextPeriod, 'Mar - Ago (6 Meses)');
});

test('El ajuste valida proyecto, fechas, duración y motivo y evita duplicados', () => {
  const data = createStrategicPlanningData();
  const valid = { projectId: 'planning-puente', start: 2, duration: 7, reason: scheduleAdjustmentReasons[0] };
  assert.equal(adjustProjectSchedule(data, valid), data);
  assert.throws(() => adjustProjectSchedule(data, { ...valid, projectId: 'missing' }), /proyecto válido/);
  for (const start of [0, 13, 1.5, 'abc']) assert.throws(() => adjustProjectSchedule(data, { ...valid, start }), /mes de inicio/);
  for (const duration of [0, 13, 1.5, 'abc']) assert.throws(() => adjustProjectSchedule(data, { ...valid, duration }), /duración/);
  assert.throws(() => adjustProjectSchedule(data, { ...valid, start: 10, duration: 4 }), /superar diciembre/);
  assert.throws(() => adjustProjectSchedule(data, { ...valid, reason: 'Otro' }), /motivo/);
  assert.equal(data.adjustments.length, 0);
});

test('Planificación contiene calendario, acciones restringidas, hitos, presupuesto y formularios administrativos', async () => {
  const server = await createServer({ server: { middlewareMode: true, hmr: false }, appType: 'custom' });
  try {
    const { default: StrategicPlanning, AdjustScheduleDialog, NewGlobalMilestoneDialog } = await server.ssrLoadModule('/src/StrategicPlanning.jsx');
    const data = createStrategicPlanningData();
    const manager = renderToStaticMarkup(React.createElement(StrategicPlanning, { data, onChange: () => {}, canManage: true }));
    for (const title of ['Calendario Maestro 2026', 'Ajustar Calendario', 'Exportar Gantt / PDF', 'Nuevo Hito Global', 'Hitos Globales', 'Control Presupuestario', 'Puente Industrial']) assert.ok(manager.includes(title));
    assert.equal((manager.match(/aria-label="Ajustar calendario de /g) ?? []).length, 6);

    const viewer = renderToStaticMarkup(React.createElement(StrategicPlanning, { data, onChange: () => {}, canManage: false }));
    for (const restrictedAction of ['> Ajustar Calendario</button>', 'Exportar Gantt / PDF', 'Nuevo Hito Global']) assert.ok(!viewer.includes(restrictedAction));
    assert.equal((viewer.match(/aria-label="Ajustar calendario de /g) ?? []).length, 0);

    const dialog = renderToStaticMarkup(React.createElement(AdjustScheduleDialog, { data, initialProjectId: 'planning-puente', onSubmit: () => {}, onClose: () => {} }));
    for (const field of ['Ajustar Calendario de Proyecto', 'Proyecto a reprogramar', 'Mes de inicio', 'Duración total', 'Vista previa del cronograma resultante', 'Ruta Crítica Activa', 'Motivo del reajuste / historial de auditoría', 'Guardar ajustes']) assert.ok(dialog.includes(field));
    assert.ok(dialog.includes('Puente Industrial — Infraestructura Vial'));
    assert.ok(dialog.includes('Feb - Ago (7 Meses)'));

    const milestoneDialog = renderToStaticMarkup(React.createElement(NewGlobalMilestoneDialog, { data, onSubmit: () => {}, onClose: () => {} }));
    for (const field of ['Nuevo Hito Global', 'Proyecto asociado', 'Estado inicial', 'Nombre del hito / entrega crítica', 'Fecha límite programada', 'Responsable de validación', 'Descripción y entregables clave', 'Hito bloqueante', 'Registrar Hito Global']) assert.ok(milestoneDialog.includes(field));
    assert.ok(milestoneDialog.includes('Torre Reforma (PRJ-2026-001)'));
  } finally {
    await server.close();
  }
});
