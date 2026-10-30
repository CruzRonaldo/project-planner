import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';
import { buildWorkOrdersCsv, createOperationsData, createWorkOrder, filterWorkOrders, getWorkOrderDuration } from '../src/mocks/operationsData.js';

const validDraft = {
  project: 'Torre Reforma (PRJ-2026-001)', type: 'Inspección técnica', title: 'Vaciado de losa Nivel 4',
  area: 'Estructuras', responsible: 'Sofía Torres', startDate: '2026-09-07', endDate: '2026-09-14',
  priority: 'high', critical: true, tolerance: '3', documentUrl: 'https://drive.google.com/drive/folders/demo',
  description: 'Verificar compactación y resistencia antes del vertido de concreto.',
};

test('El panel operativo inicia con métricas, cronograma, órdenes, alertas y calidad', () => {
  const data = createOperationsData();
  assert.deepEqual(data.metrics, { inProgress: 18, completed: 142, incidents: 3, efficiency: 94.2 });
  assert.equal(data.orders.length, 4);
  assert.equal(data.activities.length, 3);
  assert.equal(data.alerts.length, 2);
  assert.equal(data.qualityChecks.length, 3);
});

test('La búsqueda y filtros de órdenes se combinan', () => {
  const orders = createOperationsData().orders;
  assert.equal(filterWorkOrders(orders, 'SOFIA').length, 1);
  assert.equal(filterWorkOrders(orders, 'estructuras').length, 2);
  assert.equal(filterWorkOrders(orders, '', 'high').length, 2);
  assert.equal(filterWorkOrders(orders, '', 'in-progress').length, 2);
  assert.equal(filterWorkOrders(orders, '', 'all', 'Puente Industrial (PRJ-2026-002)').length, 1);
  assert.equal(filterWorkOrders(orders, 'no existe').length, 0);
});

test('Emitir una orden la agrega primero y actualiza la métrica sin mutar el original', () => {
  const data = createOperationsData();
  const updated = createWorkOrder(data, validDraft, new Date(2026, 8, 7, 12));
  assert.equal(data.orders.length, 4);
  assert.equal(data.metrics.inProgress, 18);
  assert.equal(updated.orders.length, 5);
  assert.equal(updated.orders[0].code, '#108');
  assert.equal(updated.orders[0].status, 'in-progress');
  assert.equal(updated.orders[0].duration, 7);
  assert.equal(updated.orders[0].tolerance, 3);
  assert.equal(updated.orders[0].documentUrl, validDraft.documentUrl);
  assert.equal(updated.metrics.inProgress, 19);
});

test('La nueva orden valida sus campos y fechas', () => {
  const data = createOperationsData();
  assert.equal(getWorkOrderDuration('2026-09-07', '2026-09-14'), 7);
  assert.equal(getWorkOrderDuration('2026-09-14', '2026-09-07'), null);
  assert.throws(() => createWorkOrder(data, { ...validDraft, project: ' ' }), /proyecto/);
  assert.throws(() => createWorkOrder(data, { ...validDraft, type: 'Otro' }), /tipo de operación/);
  assert.throws(() => createWorkOrder(data, { ...validDraft, title: ' ' }), /título/);
  assert.throws(() => createWorkOrder(data, { ...validDraft, area: 'Otra' }), /área técnica/);
  assert.throws(() => createWorkOrder(data, { ...validDraft, responsible: ' ' }), /responsable/);
  assert.throws(() => createWorkOrder(data, { ...validDraft, endDate: '2026-09-06' }), /fecha límite/);
  assert.throws(() => createWorkOrder(data, { ...validDraft, priority: 'urgent' }), /prioridad/);
  for (const tolerance of [-1, 31, 1.5, '', 'abc']) assert.throws(() => createWorkOrder(data, { ...validDraft, tolerance }), /tolerancia/);
  assert.throws(() => createWorkOrder(data, { ...validDraft, documentUrl: 'https://example.com/file' }), /Google Drive/);
  assert.throws(() => createWorkOrder(data, { ...validDraft, description: 'Breve' }), /instrucciones/);
});

test('El reporte operativo contiene todas las órdenes', () => {
  const csv = buildWorkOrdersCsv(createOperationsData().orders);
  assert.ok(csv.startsWith('ID,Proyecto,Tipo,Título,Área,Responsable,Prioridad,Estado,Inicio,Límite'));
  assert.ok(csv.includes('#104'));
  assert.equal(csv.split('\n').length, 5);
});

test('La vista operativa y su modal están disponibles y son responsive', async () => {
  const server = await createServer({ server: { middlewareMode: true, hmr: false }, appType: 'custom' });
  try {
    const { default: Operations, NewWorkOrderDialog } = await server.ssrLoadModule('/src/views/technical/Operations.jsx');
    const data = createOperationsData();
    const props = { data, onChange: () => {}, onQueryChange: () => {}, canManage: true, projectOptions: ['Proyecto Nuevo (PRJ-2026-005)'], responsibleOptions: [{ id: 'tech-sofia', name: 'Sofía Torres', specialty: 'Arquitecta Principal' }] };
    const html = renderToStaticMarkup(React.createElement(Operations, props));
    for (const title of ['Gestión Operativa de Campo', 'Nueva Orden de Trabajo', 'Generar Reporte Diario', 'Cronograma de Actividades Críticas', 'Órdenes de Trabajo Activas', 'Alertas Críticas de Operación', 'Aseguramiento de Calidad']) assert.ok(html.includes(title));
    assert.match(html, /<main class="[^"]*bg-\[#0d1117\]/);
    assert.ok(html.includes('Proyecto Nuevo (PRJ-2026-005)'));

    const viewer = renderToStaticMarkup(React.createElement(Operations, { ...props, canManage: false }));
    assert.ok(!viewer.includes('Nueva Orden de Trabajo'));
    assert.ok(!viewer.includes('Generar Reporte Diario'));

    const dialog = renderToStaticMarkup(React.createElement(NewWorkOrderDialog, { projectOptions: ['Torre Reforma (PRJ-2026-001)'], responsibleOptions: props.responsibleOptions, onSubmit: () => {}, onClose: () => {} }));
    for (const field of ['Nueva Orden de Trabajo', 'Proyecto asociado', 'Tipo de operación', 'Título de la tarea / orden', 'Área técnica', 'Responsable asignado', 'Fecha de inicio', 'Fecha de fin / límite', 'Nivel de prioridad', 'Parámetro de ruta crítica', 'Documento o plano vinculado', 'Descripción e instrucciones', 'Emitir Orden de Trabajo']) assert.ok(dialog.includes(field));

    const { default: Sidebar } = await server.ssrLoadModule('/src/components/layout/Sidebar.jsx');
    const sidebar = renderToStaticMarkup(React.createElement(Sidebar, { activeView: 'operations', onNavigate: () => {}, fontScale: 100, onFontScaleChange: () => {} }));
    const desktopOperations = sidebar.match(/<button\b[\s\S]*?<\/button>/g).find((button) => button.includes('Gestión Operativa'));
    assert.ok(!desktopOperations.includes('disabled=""'));
    assert.ok(desktopOperations.includes('aria-current="page"'));
  } finally {
    await server.close();
  }
});

test('normalizeCriticalActivities normaliza camelCase, snake_case, formato legado y objetos vacios sin mutar', async () => {
  const { normalizeCriticalActivities } = await import('../src/utils/operations.js');
  const { getBarGeometry } = await import('../src/utils/gantt.js');

  const rawInput = [
    { id: 'act-camel', name: 'CamelCase', startDate: '2026-03-01', endDate: '2026-05-30' },
    { id: 'act-snake', name: 'SnakeCase', start_date: '2026-04-10', end_date: '2026-06-20' },
    { id: 'act-legacy', name: 'Legacy', start: 1, duration: 3 },
    { id: 'act-empty', name: 'Sin fechas' },
    { id: 'act-overflow', name: 'Desborde semestral', start: 5, duration: 4 },
  ];
  const inputCopy = JSON.parse(JSON.stringify(rawInput));

  const normalized = normalizeCriticalActivities(rawInput, 2026);

  // 1. Inmutabilidad: el array original no cambia
  assert.deepEqual(rawInput, inputCopy);

  // 2. camelCase respetado
  assert.equal(normalized[0].startDate, '2026-03-01');
  assert.equal(normalized[0].endDate, '2026-05-30');

  // 3. snake_case mapeado
  assert.equal(normalized[1].startDate, '2026-04-10');
  assert.equal(normalized[1].endDate, '2026-06-20');

  // 4. Legado puente
  assert.equal(normalized[2].startDate, '2026-01-01');
  assert.equal(normalized[2].endDate, '2026-03-31');

  // 5. Sin fechas utilizables queda con null
  assert.equal(normalized[3].startDate, null);
  assert.equal(normalized[3].endDate, null);

  // 6. Actividad que desborda el semestre (Mayo a Agosto en ventana Ene-Jun = 6 meses)
  assert.equal(normalized[4].startDate, '2026-05-01');
  assert.equal(normalized[4].endDate, '2026-08-31');
  const overflowGeom = getBarGeometry({
    startDate: normalized[4].startDate,
    endDate: normalized[4].endDate,
    windowStart: '2026-01-01',
    windowMonths: 6,
  });
  assert.ok(overflowGeom !== null);
  assert.equal(Math.round(overflowGeom.leftPct * 100) / 100, 66.67);
  assert.equal(Math.round(overflowGeom.widthPct * 100) / 100, 33.33);
  assert.equal(overflowGeom.clippedLeft, false);
  assert.equal(overflowGeom.clippedRight, true);
});
