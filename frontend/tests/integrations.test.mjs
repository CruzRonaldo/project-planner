import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';
import { createIntegrationsData, filterIntegrations, summarizeIntegrations, testIntegration, updateIntegration } from '../src/integrationsData.js';

test('El panel inicia con cuatro integraciones y los valores de la referencia', () => {
  const data = createIntegrationsData();
  assert.deepEqual(summarizeIntegrations(data), { active: 3, total: 4, errors: 2, uptime: 99.84 });
  assert.deepEqual(data.integrations.map((item) => item.name), ['Google Drive', 'Revit / BIM Data', 'N8N', 'Make (Integromat)']);
  assert.equal(new Set(data.integrations.map((item) => item.id)).size, 4);
});

test('Cada sesión recibe copias independientes de métricas y actividades', () => {
  const first = createIntegrationsData();
  first.integrations[0].metrics[0].value = 0;
  first.activities[0].title = 'Prueba';
  const second = createIntegrationsData();
  assert.equal(second.integrations[0].metrics[0].value, 245);
  assert.notEqual(second.activities[0].title, 'Prueba');
});

test('La búsqueda encuentra servicios, estados, métricas y actividad sin depender de tildes', () => {
  const data = createIntegrationsData();
  assert.equal(filterIntegrations(data, 'sincronizacion').integrations[0].id, 'drive');
  assert.equal(filterIntegrations(data, 'Parcial').integrations[0].id, 'make');
  assert.equal(filterIntegrations(data, '245').integrations[0].id, 'drive');
  assert.equal(filterIntegrations(data, 'presupuesto').activities[0].integrationId, 'make');
  assert.deepEqual(filterIntegrations(data, 'no existe'), { integrations: [], activities: [] });
});

test('Guardar configuración actualiza el resumen, métricas y actividad sin mutar el original', () => {
  const data = createIntegrationsData();
  const updated = updateIntegration(data, 'make', { status: 'connected', endpoint: ' Escenarios / Producción ', frequency: 'Cada 10 min', errors: '0' }, new Date(2026, 8, 5));
  assert.deepEqual(summarizeIntegrations(updated), { active: 4, total: 4, errors: 0, uptime: 99.84 });
  assert.equal(data.integrations[3].status, 'partial');
  assert.equal(updated.integrations[3].endpoint, 'Escenarios / Producción');
  assert.equal(updated.integrations[3].metrics.find((metric) => metric.key === 'errors').value, 0);
  assert.equal(updated.activities.length, data.activities.length + 1);
  assert.match(updated.activities[0].title, /Configuración actualizada/);
});

test('Guardar los mismos datos no crea actividad duplicada', () => {
  const data = createIntegrationsData();
  const integration = data.integrations[0];
  assert.equal(updateIntegration(data, integration.id, integration), data);
});

test('La configuración inválida se rechaza sin alterar el estado', () => {
  const data = createIntegrationsData();
  const valid = data.integrations[0];
  assert.throws(() => updateIntegration(data, 'missing', valid), /No se encontró/);
  assert.throws(() => updateIntegration(data, valid.id, { ...valid, status: 'invalid' }), /estado válido/);
  assert.throws(() => updateIntegration(data, valid.id, { ...valid, frequency: 'Cada año' }), /frecuencia válida/);
  assert.throws(() => updateIntegration(data, valid.id, { ...valid, endpoint: ' ' }), /endpoint/);
  for (const errors of [-1, 1000, 1.5, '', 'abc']) assert.throws(() => updateIntegration(data, valid.id, { ...valid, errors }), /errores/);
  assert.equal(data.activities.length, 6);
});

test('La prueba local recupera una integración parcial y registra el evento', () => {
  const data = createIntegrationsData();
  const tested = testIntegration(data, 'make', new Date(2026, 8, 5));
  assert.equal(tested.integrations[3].status, 'connected');
  assert.equal(tested.integrations[3].errors, 0);
  assert.equal(tested.integrations[3].lastActivity, 'Ahora');
  assert.match(tested.activities[0].title, /Prueba de conexión/);
  assert.throws(() => testIntegration(data, 'missing'), /No se encontró/);
});

test('La vista conserva el fondo oscuro, se adapta a búsqueda y no usa modal de configuración', async () => {
  const server = await createServer({ server: { middlewareMode: true, hmr: false }, appType: 'custom' });
  try {
    const { default: Integrations, IntegrationEditor } = await server.ssrLoadModule('/src/Integrations.jsx');
    const data = createIntegrationsData();
    const props = { data, onChange: () => {}, onQueryChange: () => {} };
    const html = renderToStaticMarkup(React.createElement(Integrations, props));
    for (const title of ['Integraciones', 'Registro de Actividad de Integraciones', 'Estado General', 'Actividad de Peticiones (API)', 'SLA y Mantenimiento']) assert.ok(html.includes(title));
    assert.match(html, /<main class="[^"]*bg-\[#0d1117\]/);
    assert.equal((html.match(/aria-label="Configurar /g) ?? []).length, 4);
    assert.ok(html.includes('Datos de demostración'));

    const searched = renderToStaticMarkup(React.createElement(Integrations, { ...props, query: 'Make' }));
    assert.equal((searched.match(/aria-label="Configurar /g) ?? []).length, 1);
    const empty = renderToStaticMarkup(React.createElement(Integrations, { ...props, query: 'no existe' }));
    assert.ok(empty.includes('No se encontraron integraciones'));
    assert.ok(empty.includes('No hay actividad'));

    const editor = renderToStaticMarkup(React.createElement(IntegrationEditor, { integration: data.integrations[0], onSave: () => {}, onTest: () => {}, onCancel: () => {} }));
    assert.ok(editor.includes('Configurar Google Drive'));
    assert.ok(editor.includes('Probar conexión'));
    assert.ok(!editor.includes('fixed inset-0'));

    const { default: MobileNavigation } = await server.ssrLoadModule('/src/MobileNavigation.jsx');
    const navigated = [];
    const mobile = MobileNavigation({ activeView: 'dashboard', onNavigate: (id) => navigated.push(id) });
    mobile.props.children.find((button) => button.key === 'integrations').props.onClick();
    assert.deepEqual(navigated, ['integrations']);
    const teamButton = mobile.props.children.find((button) => button.key === 'technical-team');
    assert.equal(teamButton.props.disabled, false);
    teamButton.props.onClick();
    assert.deepEqual(navigated, ['integrations', 'technical-team']);

    const { default: Sidebar } = await server.ssrLoadModule('/src/Sidebar.jsx');
    const sidebar = renderToStaticMarkup(React.createElement(Sidebar, { activeView: 'integrations', onNavigate: () => {}, fontScale: 100, onFontScaleChange: () => {} }));
    const desktopIntegration = sidebar.match(/<button\b[\s\S]*?<\/button>/g).find((button) => button.includes('Integraciones'));
    assert.ok(!desktopIntegration.includes('disabled=""'));
    assert.ok(desktopIntegration.includes('aria-current="page"'));
  } finally {
    await server.close();
  }
});
