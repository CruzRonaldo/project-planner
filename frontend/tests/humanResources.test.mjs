import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';
import { buildPersonnelCsv, createHumanResourcesData, filterPersonnel, getIncidentDuration, personnelIncidentTypes, registerPersonnelIncident, summarizePersonnel, updatePersonnel } from '../src/humanResourcesData.js';

test('Los totales coinciden con los 18 registros de demostración', () => {
  const { members } = createHumanResourcesData();
  assert.deepEqual(summarizePersonnel(members), { total: 18, active: 12, standby: 4, support: 2 });
  assert.equal(new Set(members.map((member) => member.id)).size, 18);
  assert.deepEqual(createHumanResourcesData().incidents, []);
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

test('La matriz de Recursos Humanos se puede exportar como CSV', () => {
  const csv = buildPersonnelCsv(createHumanResourcesData().members);
  assert.ok(csv.startsWith('Nombre,Área técnica,Proyecto asignado,Estado,Disponibilidad'));
  assert.ok(csv.includes('Sofía Torres,Arquitectura,Edificio Terminal B,Activo,100%'));
  assert.equal(csv.split('\n').length, 19);
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

test('La duración de una incidencia calcula días calendario y hábiles', () => {
  assert.deepEqual(getIncidentDuration('2026-09-10', '2026-09-24'), { calendarDays: 14, businessDays: 10 });
  assert.deepEqual(getIncidentDuration('2026-09-07', '2026-09-07'), { calendarDays: 1, businessDays: 1 });
  assert.equal(getIncidentDuration('2026-09-10', '2026-09-09'), null);
  assert.equal(getIncidentDuration('', '2026-09-09'), null);
});

test('Registrar una incidencia actualiza la matriz y agrega historial sin mutar el original', () => {
  const data = createHumanResourcesData();
  const draft = {
    memberId: 'hr-sofia', type: 'vacation', startDate: '2026-09-10', endDate: '2026-09-24',
    status: 'standby', availability: '0', backupMemberId: 'hr-alejandro', comment: 'Vacaciones aprobadas y entrega de turnos coordinada.',
  };
  const updated = registerPersonnelIncident(data, draft, new Date(2026, 8, 5, 12));
  assert.equal(data.members[0].status, 'active');
  assert.equal(data.incidents.length, 0);
  assert.equal(updated.members[0].status, 'standby');
  assert.equal(updated.members[0].availability, 0);
  assert.equal(updated.incidents.length, 1);
  assert.equal(updated.incidents[0].typeLabel, 'Vacaciones programadas');
  assert.equal(updated.incidents[0].calendarDays, 14);
  assert.equal(updated.incidents[0].businessDays, 10);
  assert.equal(updated.incidents[0].backupMemberName, 'Alejandro Ruiz');
  assert.equal(updated.history.length, 6);
  assert.match(updated.history[0].comment, /Vacaciones programadas/);
  assert.match(updated.history[0].comment, /Cobertura temporal: Alejandro Ruiz/);
  assert.deepEqual(summarizePersonnel(updated.members), { total: 18, active: 11, standby: 5, support: 2 });
});

test('El registro de incidencia rechaza datos inválidos', () => {
  const data = createHumanResourcesData();
  const valid = { memberId: 'hr-sofia', type: personnelIncidentTypes[0].id, startDate: '2026-09-10', endDate: '2026-09-24', status: 'standby', availability: 0, backupMemberId: 'hr-alejandro', comment: 'Ausencia temporal coordinada.' };
  assert.throws(() => registerPersonnelIncident(data, { ...valid, memberId: 'missing' }), /integrante/);
  assert.throws(() => registerPersonnelIncident(data, { ...valid, type: 'invalid' }), /tipo de incidencia/);
  assert.throws(() => registerPersonnelIncident(data, { ...valid, endDate: '2026-09-09' }), /fecha de retorno/);
  assert.throws(() => registerPersonnelIncident(data, { ...valid, status: 'invalid' }), /estado operativo/);
  for (const availability of [-1, 101, 1.5, '', 'abc']) assert.throws(() => registerPersonnelIncident(data, { ...valid, availability }), /disponibilidad/);
  assert.throws(() => registerPersonnelIncident(data, { ...valid, backupMemberId: 'missing' }), /respaldo válido/);
  assert.throws(() => registerPersonnelIncident(data, { ...valid, backupMemberId: 'hr-sofia' }), /propio respaldo/);
  assert.throws(() => registerPersonnelIncident(data, { ...valid, comment: ' ' }), /Detalla/);
  assert.equal(data.history.length, 5);
  assert.equal(data.incidents.length, 0);
});

test('La pantalla se renderiza con fondo oscuro y las cuatro secciones esperadas', async () => {
  const server = await createServer({ server: { middlewareMode: true, hmr: false }, appType: 'custom' });
  try {
    const { default: HumanResources, PersonnelIncidentDialog } = await server.ssrLoadModule('/src/HumanResources.jsx');
    const props = { data: createHumanResourcesData(), onChange: () => {}, onQueryChange: () => {}, canManage: true };
    const html = renderToStaticMarkup(React.createElement(HumanResources, props));
    for (const title of ['Recursos Humanos y Estados', 'Asignación de Personal', 'Estado de Equipos', 'Historial de Cambios de Estado']) assert.ok(html.includes(title));
    assert.match(html, /<main class="[^"]*bg-\[#0d1117\]/);
    assert.ok(html.includes('Total personal: 18'));
    assert.ok(html.includes('Registrar Incidencia / Licencia'));
    assert.ok(html.includes('Exportar Matriz'));
    assert.ok(html.includes('Sincronizado en tiempo real'));
    assert.equal(html.match(/<tbody>([\s\S]*?)<\/tbody>/)[1].match(/<tr\b/g).length, 8);

    const searched = renderToStaticMarkup(React.createElement(HumanResources, { ...props, query: 'Sofia' }));
    assert.equal(searched.match(/<tbody>([\s\S]*?)<\/tbody>/)[1].match(/<tr\b/g).length, 1);
    const empty = renderToStaticMarkup(React.createElement(HumanResources, { ...props, query: 'no existe' }));
    assert.ok(empty.includes('No se encontró personal'));

    const viewer = renderToStaticMarkup(React.createElement(HumanResources, { ...props, canManage: false }));
    assert.ok(!viewer.includes('Registrar Incidencia / Licencia'));
    assert.ok(!viewer.includes('Exportar Matriz'));

    const incidentDialog = renderToStaticMarkup(React.createElement(PersonnelIncidentDialog, { data: props.data, onSubmit: () => {}, onClose: () => {} }));
    for (const field of ['Registrar Incidencia / Licencia', 'Integrante del personal', 'Tipo de incidencia', 'Fecha de inicio / desde', 'Fecha de retorno / hasta', 'Estado operativo resultante', 'Disponibilidad en este periodo', 'Técnico de respaldo / cobertura temporal', 'Motivo / comentario detallado', 'Registrar incidencia']) assert.ok(incidentDialog.includes(field));
    assert.ok(incidentDialog.includes('Vacaciones programadas'));

    const { default: MobileNavigation } = await server.ssrLoadModule('/src/MobileNavigation.jsx');
    const navigated = [];
    const mobile = MobileNavigation({ activeView: 'dashboard', onNavigate: (id) => navigated.push(id) });
    const hrButton = mobile.props.children.find((button) => button.key === 'human-resources');
    hrButton.props.onClick();
    assert.deepEqual(navigated, ['human-resources']);
    const teamButton = mobile.props.children.find((button) => button.key === 'technical-team');
    assert.equal(teamButton.props.disabled, false);
    teamButton.props.onClick();
    assert.deepEqual(navigated, ['human-resources', 'technical-team']);

    const { default: Sidebar } = await server.ssrLoadModule('/src/Sidebar.jsx');
    const sidebar = renderToStaticMarkup(React.createElement(Sidebar, { activeView: 'human-resources', onNavigate: () => {}, fontScale: 100, onFontScaleChange: () => {} }));
    const desktopHR = sidebar.match(/<button\b[\s\S]*?<\/button>/g).find((button) => button.includes('Recursos Humanos'));
    assert.ok(!desktopHR.includes('disabled=""'));
    assert.ok(desktopHR.includes('aria-current="page"'));
  } finally {
    await server.close();
  }
});
