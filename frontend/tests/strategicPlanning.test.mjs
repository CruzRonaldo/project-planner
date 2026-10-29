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
  assert.equal(formatMilestoneDate(updated.milestones[0].targetDate), 'Programado para el 08 Oct 2026');
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

test('Ajustar fechas reales conserva días y cruza años sin mutar el proyecto original', () => {
  const data = createStrategicPlanningData();
  const updated = adjustProjectSchedule(data, { projectId: 'planning-puente', startDate: '2027-12-31', endDate: '2028-02-29', reason: scheduleAdjustmentReasons[0] }, new Date(2026, 8, 7, 12));
  assert.equal(data.projects[1].period, 'Feb - Ago (7 Meses)');
  assert.equal(data.adjustments.length, 0);
  assert.equal(updated.projects[1].startDate, '2027-12-31');
  assert.equal(updated.projects[1].endDate, '2028-02-29');
  assert.equal(updated.projects[1].duration, 3);
  assert.equal(updated.adjustments.length, 1);
  assert.equal(updated.adjustments[0].date, '2026-09-07');
  assert.equal(updated.adjustments[0].projectName, 'Puente Industrial');
});

test('El ajuste rechaza fechas inexistentes, rangos invertidos y motivos inválidos', () => {
  const data = createStrategicPlanningData();
  const valid = { projectId: 'planning-puente', startDate: '2028-02-29', endDate: '2029-01-31', reason: scheduleAdjustmentReasons[0] };
  const updated = adjustProjectSchedule(data, valid);
  assert.equal(adjustProjectSchedule(updated, valid), updated);
  assert.throws(() => adjustProjectSchedule(data, { ...valid, projectId: 'missing' }), /proyecto válido/);
  for (const startDate of ['', '2027-02-29', '2028-04-31', '2028-13-01', '0000-01-01']) {
    assert.throws(() => adjustProjectSchedule(data, { ...valid, startDate }), /fechas/);
  }
  assert.throws(() => adjustProjectSchedule(data, { ...valid, endDate: '2027-12-31' }), /anterior/);
  assert.throws(() => adjustProjectSchedule(data, { ...valid, reason: 'Otro' }), /motivo/);
  assert.equal(data.adjustments.length, 0);
});

test('Planificación contiene calendario, acciones restringidas, hitos, presupuesto y formularios administrativos', async () => {
  const server = await createServer({ server: { middlewareMode: true, hmr: false }, appType: 'custom' });
  try {
    const { default: StrategicPlanning, AdjustScheduleDialog, NewGlobalMilestoneDialog } = await server.ssrLoadModule('/src/views/admin/StrategicPlanning.jsx');
    const data = createStrategicPlanningData();
    const manager = renderToStaticMarkup(React.createElement(StrategicPlanning, { data, onChange: () => {}, canManage: true }));
    for (const title of [`Calendario Maestro ${new Date().getFullYear()}`, 'Ajustar Calendario', 'Exportar Gantt / PDF', 'Nuevo Hito Global', 'Hitos Globales', 'Control Presupuestario', 'Puente Industrial']) assert.ok(manager.includes(title));
    assert.equal((manager.match(/aria-label="Ajustar calendario de /g) ?? []).length, 6);

    const viewer = renderToStaticMarkup(React.createElement(StrategicPlanning, { data, onChange: () => {}, canManage: false }));
    for (const restrictedAction of ['> Ajustar Calendario</button>', 'Exportar Gantt / PDF', 'Nuevo Hito Global']) assert.ok(!viewer.includes(restrictedAction));
    assert.equal((viewer.match(/aria-label="Ajustar calendario de /g) ?? []).length, 0);

    const dialog = renderToStaticMarkup(React.createElement(AdjustScheduleDialog, { data, initialProjectId: 'planning-puente', onSubmit: () => {}, onClose: () => {} }));
    for (const field of ['Ajustar Calendario de Proyecto', 'Proyecto a reprogramar', 'Fecha de inicio', 'Fecha de fin', 'Vista previa del cronograma resultante', 'Motivo del reajuste', 'Guardar ajustes']) assert.ok(dialog.includes(field));
    assert.ok(dialog.includes('Puente Industrial — Infraestructura Vial'));
    assert.ok(dialog.includes('Selecciona un rango válido.'));

    const milestoneDialog = renderToStaticMarkup(React.createElement(NewGlobalMilestoneDialog, { data, onSubmit: () => {}, onClose: () => {} }));
    for (const field of ['Nuevo Hito Global', 'Proyecto asociado', 'Estado inicial', 'Nombre del hito / entrega crítica', 'Fecha límite programada', 'Responsable de validación', 'Descripción y entregables clave', 'Hito bloqueante', 'Registrar Hito Global']) assert.ok(milestoneDialog.includes(field));
    assert.ok(milestoneDialog.includes('Torre Reforma (PRJ-2026-001)'));
  } finally {
    await server.close();
  }
});

test('El Gantt renderiza marcadores visuales de hitos y la regla de gobernanza $100k', async () => {
  const server = await createServer({ server: { middlewareMode: true, hmr: false }, appType: 'custom' });
  try {
    const { default: StrategicPlanning } = await server.ssrLoadModule('/src/views/admin/StrategicPlanning.jsx');
    const { mapToGanttProject } = await server.ssrLoadModule('/src/utils/strategicPlanning.js');

    const dbProjectHigh = {
      id: 1,
      code: 'PRJ-2026-LOC',
      name: 'Edificio Central Miraflores',
      area: 'Arquitectura',
      totalBudget: 450000,
      startDate: `${new Date().getFullYear()}-10-01`,
      endDate: `${new Date().getFullYear() + 1}-04-01`,
    };
    const mappedHigh = mapToGanttProject(dbProjectHigh);
    assert.equal(mappedHigh.start, 10);
    assert.equal(mappedHigh.duration, 7);
    assert.equal(mappedHigh.isAbove100k, true);
    assert.equal(mappedHigh.approvalType, 'Revisión por Comité Directivo');

    const dbProjectLow = {
      id: 2,
      code: 'PRJ-2026-MIN',
      name: 'Remodelación Oficinas',
      area: 'Sistemas',
      totalBudget: 45000,
      startDate: `${new Date().getFullYear()}-03-01`,
      endDate: `${new Date().getFullYear()}-06-30`,
    };
    const mappedLow = mapToGanttProject(dbProjectLow);
    assert.equal(mappedLow.start, 3);
    assert.equal(mappedLow.duration, 4);
    assert.equal(mappedLow.isAbove100k, false);
    assert.equal(mappedLow.approvalType, 'Aprobación Líder Técnico');

    const testData = {
      projects: [mappedHigh, mappedLow],
      milestones: [
        {
          id: 1,
          projectId: 1,
          title: 'Entrega Expediente BIM',
          targetDate: `${new Date().getFullYear()}-10-25`,
          status: 'completed',
        },
        {
          id: 2,
          projectId: 1,
          title: 'Vaciado Estructural',
          targetDate: `${new Date().getFullYear()}-12-15`,
          status: 'upcoming',
        },
      ],
      adjustments: [],
    };

    const html = renderToStaticMarkup(React.createElement(StrategicPlanning, { data: testData, canManage: true }));
    assert.ok(html.includes('Comité (&gt;$100k)'));
    assert.ok(html.includes('Líder (≤$100k)'));
    assert.ok(html.includes('aria-label="Hito: Entrega Expediente BIM"'));
    assert.ok(html.includes('aria-label="Hito: Vaciado Estructural"'));
  } finally {
    await server.close();
  }
});


test('Las barras recortan diciembre y enero al año elegido y respetan febrero bisiesto', async () => {
  const { projectYearBar, planningDatePosition, parsePlanningDate, mapToGanttProject } = await import('../src/utils/strategicPlanning.js');
  const project = { startDate: '2027-12-15', endDate: '2028-02-29' };
  assert.equal(projectYearBar(project, 2026), null);
  const first = projectYearBar(project, 2027);
  assert.ok(Math.abs(first.left + first.width - 100) < 1e-9);
  const next = projectYearBar(project, 2028);
  assert.equal(next.left, 0);
  assert.ok(Math.abs(next.width - 100 / 6) < 1e-9);
  assert.equal(planningDatePosition('2027-12-15', 2028), null);
  assert.ok(Math.abs(planningDatePosition('2028-02-29', 2028, true) - 100 / 6) < 1e-9);
  assert.equal(parsePlanningDate('2027-02-29'), null);
  assert.ok(parsePlanningDate('2028-02-29'));
  const mapped = mapToGanttProject({ id: 1, start_date: '2029-01-31', end_date: '2030-03-01' }, { start: 10, duration: 2 });
  assert.equal(mapped.start, 1);
  assert.equal(mapped.duration, 15);
  assert.equal(mapped.startDate, '2029-01-31');
});

test('Un proyecto de un día tiene barra visible y las fechas faltantes no se inventan', async () => {
  const { projectYearBar, mapToGanttProject, parsePlanningDate } = await import('../src/utils/strategicPlanning.js');
  const bar = projectYearBar({ startDate: '2028-02-29', endDate: '2028-02-29' }, 2028);
  assert.ok(bar.width > 0);
  assert.ok(Math.abs(bar.width - 100 / (12 * 29)) < 1e-9);
  assert.equal(projectYearBar({ startDate: '2028-02-29', endDate: '2027-01-01' }, 2028), null);
  const mapped = mapToGanttProject({ id: 1 });
  assert.equal(mapped.startDate, '');
  assert.equal(mapped.duration, 0);
  assert.equal(parsePlanningDate('2028-02-29T00:00:00'), null);
});

test('El reajuste espera la respuesta y mantiene los datos originales ante fallos de API', async () => {
  const { persistProjectSchedule } = await import('../src/utils/strategicPlanning.js');
  const data = { projects: [{ id: 42, startDate: '2028-01-01', endDate: '2028-06-30' }], adjustments: [] };
  const draft = { projectId: 42, startDate: '2029-12-31', endDate: '2030-03-31', reason: scheduleAdjustmentReasons[0] };
  let release;
  let settled = false;
  const promise = persistProjectSchedule(data, draft, async (id, payload) => {
    assert.equal(id, 42);
    assert.deepEqual(payload, { start_date: '2029-12-31', end_date: '2030-03-31' });
    await new Promise((resolve) => { release = resolve; });
  }).then((value) => { settled = true; return value; });
  await Promise.resolve();
  assert.equal(settled, false);
  assert.equal(data.projects[0].startDate, '2028-01-01');
  release();
  const updated = await promise;
  assert.equal(updated.projects[0].startDate, '2029-12-31');
  await assert.rejects(persistProjectSchedule(data, draft, async () => { throw new Error('HTTP 403'); }), /No se pudo guardar/);
  assert.equal(data.projects[0].startDate, '2028-01-01');
  assert.equal(data.adjustments.length, 0);
  let requests = 0;
  const unchanged = await persistProjectSchedule(updated, draft, async () => { requests += 1; });
  assert.equal(unchanged, updated);
  assert.equal(requests, 0);
});

test('Portafolio recibe las fechas guardadas conservando los demás campos y proyectos', async () => {
  const { syncPortfolioSchedule } = await import('../src/utils/strategicPlanning.js');
  const other = { id: 2, name: 'Sin cambios', startDate: '2028-01-01', endDate: '2028-12-31' };
  const portfolio = { projects: [{ id: 1, name: 'Proyecto', budget: 500, startDate: '2028-01-01', endDate: '2028-12-31' }, other], changes: [] };
  const updated = syncPortfolioSchedule(portfolio, [{ id: 1, startDate: '2029-12-31', endDate: '2030-03-31' }]);
  assert.equal(portfolio.projects[0].startDate, '2028-01-01');
  assert.equal(updated.projects[0].startDate, '2029-12-31');
  assert.equal(updated.projects[0].budget, 500);
  assert.equal(updated.projects[1], other);
  assert.equal(syncPortfolioSchedule(updated, [{ id: 1, startDate: '2029-12-31', endDate: '2030-03-31' }]), updated);
});
