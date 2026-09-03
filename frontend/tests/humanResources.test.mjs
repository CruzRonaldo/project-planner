import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';
import { createHumanResourcesData, filterPersonnel, summarizePersonnel, updatePersonnel } from '../src/humanResourcesData.js';

test('Los totales coinciden con los 18 registros de demostración', () => {
  const { members } = createHumanResourcesData();
  assert.deepEqual(summarizePersonnel(members), { total: 18, active: 12, standby: 4, support: 2 });
  assert.equal(new Set(members.map((member) => member.id)).size, 18);
});

test('Cada sesión comienza con copias independientes de los datos', () => {
  const first = createHumanResourcesData();
  first.members[0].name = 'Prueba';
  first.history[0].comment = 'Prueba';
  const second = createHumanResourcesData();
  assert.equal(second.members[0].name, 'Sofía Torres');
  assert.notEqual(second.history[0].comment, 'Prueba');
});

test('La búsqueda tolera tildes y mayúsculas y combina filtros', () => {
  const { members } = createHumanResourcesData();
  assert.equal(filterPersonnel(members, 'SOFIA')[0].id, 'hr-sofia');
  assert.equal(filterPersonnel(members, 'andres')[0].id, 'hr-andres');
  assert.equal(filterPersonnel(members, 'sistemas', 'standby').length, 1);
  assert.equal(filterPersonnel(members, '50%')[0].id, 'hr-elena');
  assert.equal(filterPersonnel(members, 'Viaducto', 'support')[0].id, 'hr-andres');
  assert.equal(filterPersonnel(members, 'Stand-by').length, 4);
  assert.equal(filterPersonnel(members, 'no existe').length, 0);
});

test('Editar personal actualiza estado, resumen e historial sin mutar el original', () => {
  const data = createHumanResourcesData();
  const updated = updatePersonnel(data, 'hr-sofia', { project: ' Nuevo proyecto ', status: 'support', availability: '60', comment: 'Refuerzo temporal' }, new Date(2026, 8, 2, 10));
  assert.deepEqual(summarizePersonnel(updated.members), { total: 18, active: 11, standby: 4, support: 3 });
  assert.equal(data.members[0].status, 'active');
  assert.equal(updated.members[0].project, 'Nuevo proyecto');
  assert.equal(updated.members[0].availability, 60);
  assert.equal(updated.history.length, data.history.length + 1);
  assert.equal(updated.history[0].date, '2026-09-02');
  assert.equal(updated.history[0].previousStatus, 'active');
  assert.equal(updated.history[0].nextStatus, 'support');
  assert.match(updated.history[0].comment, /Refuerzo temporal/);
  assert.match(updated.history[0].comment, /100% → 60%/);
});

test('Cambiar solamente proyecto conserva ambos estados en el historial', () => {
  const data = createHumanResourcesData();
  const updated = updatePersonnel(data, 'hr-sofia', { ...data.members[0], project: 'Hospital Regional' });
  assert.equal(updated.history[0].previousStatus, 'active');
  assert.equal(updated.history[0].nextStatus, 'active');
  assert.match(updated.history[0].comment, /Edificio Terminal B → Hospital Regional/);
});

test('Guardar sin cambios no crea entradas duplicadas', () => {
  const data = createHumanResourcesData();
  assert.equal(updatePersonnel(data, data.members[0].id, data.members[0]), data);
});

test('La disponibilidad acepta los extremos 0 y 100', () => {
  const data = createHumanResourcesData();
  for (const availability of [0, 100]) {
    assert.equal(updatePersonnel(data, 'hr-mateo', { ...data.members[2], availability }).members[2].availability, availability);
  }
});

test('Datos inválidos no alteran registros ni historial', () => {
  const data = createHumanResourcesData();
  for (const availability of [-1, 101, 1.5, 'abc', '', ' ']) {
    assert.throws(() => updatePersonnel(data, 'hr-sofia', { ...data.members[0], availability }), /disponibilidad/);
  }
  assert.throws(() => updatePersonnel(data, 'hr-sofia', { ...data.members[0], project: ' ' }), /proyecto/);
  assert.throws(() => updatePersonnel(data, 'hr-sofia', { ...data.members[0], status: 'invalid' }), /estado válido/);
  assert.throws(() => updatePersonnel(data, 'missing', data.members[0]), /integrante/);
  assert.equal(data.history.length, 5);
});

test('La pantalla se renderiza con fondo oscuro y las cuatro secciones esperadas', async () => {
  const server = await createServer({ server: { middlewareMode: true, hmr: false }, appType: 'custom' });
  try {
    const { default: HumanResources } = await server.ssrLoadModule('/src/HumanResources.jsx');
    const props = { data: createHumanResourcesData(), onChange: () => {}, onQueryChange: () => {} };
    const html = renderToStaticMarkup(React.createElement(HumanResources, props));
    for (const title of ['Recursos Humanos y Estados', 'Asignación de Personal', 'Estado de Equipos', 'Historial de Cambios de Estado']) assert.ok(html.includes(title));
    assert.match(html, /<main class="[^"]*bg-\[#0d1117\]/);
    assert.ok(html.includes('Total personal: 18'));
    assert.ok(html.includes('Datos de ejemplo'));
    assert.equal(html.match(/<tbody>([\s\S]*?)<\/tbody>/)[1].match(/<tr\b/g).length, 8);

    const searched = renderToStaticMarkup(React.createElement(HumanResources, { ...props, query: 'Sofia' }));
    assert.equal(searched.match(/<tbody>([\s\S]*?)<\/tbody>/)[1].match(/<tr\b/g).length, 1);
    const empty = renderToStaticMarkup(React.createElement(HumanResources, { ...props, query: 'no existe' }));
    assert.ok(empty.includes('No se encontró personal'));

    const { default: MobileNavigation } = await server.ssrLoadModule('/src/MobileNavigation.jsx');
    const navigated = [];
    const mobile = MobileNavigation({ activeView: 'dashboard', onNavigate: (id) => navigated.push(id) });
    const hrButton = mobile.props.children.find((button) => button.key === 'human-resources');
    hrButton.props.onClick();
    assert.deepEqual(navigated, ['human-resources']);
    const teamButton = mobile.props.children.find((button) => button.key === 'technical-team');
    assert.equal(teamButton.props.disabled, true);
    assert.equal(teamButton.props.onClick, undefined);

    const { default: Sidebar } = await server.ssrLoadModule('/src/Sidebar.jsx');
    const sidebar = renderToStaticMarkup(React.createElement(Sidebar, { activeView: 'human-resources', onNavigate: () => {}, fontScale: 100, onFontScaleChange: () => {} }));
    const desktopHR = sidebar.match(/<button\b[\s\S]*?<\/button>/g).find((button) => button.includes('Recursos Humanos'));
    assert.ok(!desktopHR.includes('disabled=""'));
    assert.ok(desktopHR.includes('aria-current="page"'));
  } finally {
    await server.close();
  }
});
