import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';
import { addTechnicalMember, buildTechnicalTeamCsv, createTechnicalTeamData, filterTechnicalTeam, getMemberFullName, reassignTechnicalMember, reassignmentReasons, sortTechnicalTeam, summarizeTechnicalTeam } from '../src/technicalTeamData.js';

const validDraft = {
  firstNames: 'Sofía Alejandra', lastNames: 'Torres Valdivia', email: 'sofia.nueva@empresa.com',
  specialty: 'Arquitecta Principal / BIM', area: 'architecture',
  project: 'Edificio Terminal B (PRJ-2026-004)', status: 'active', workload: '100', avatar: 'data:image/png;base64,AAA',
};

test('El directorio inicia con 18 técnicos distribuidos 8/6/4', () => {
  const data = createTechnicalTeamData();
  assert.deepEqual(summarizeTechnicalTeam(data.members), { total: 18, active: 12, standby: 4, support: 1, offline: 1, areas: { architecture: 8, structures: 6, systems: 4 } });
  assert.equal(new Set(data.members.map((member) => member.email)).size, 18);
  assert.equal(data.assignments.length, 4);
});

test('Cada sesión comienza con una copia independiente', () => {
  const first = createTechnicalTeamData();
  first.members[0].firstNames = 'Prueba';
  first.assignments[0].project = 'Prueba';
  assert.equal(createTechnicalTeamData().members[0].firstNames, 'Sofía');
  assert.notEqual(createTechnicalTeamData().assignments[0].project, 'Prueba');
});

test('La búsqueda tolera tildes y se combina con el filtro de área', () => {
  const members = createTechnicalTeamData().members;
  assert.equal(filterTechnicalTeam(members, 'SOFIA')[0].id, 'tech-sofia');
  assert.equal(filterTechnicalTeam(members, 'Andres')[0].id, 'tech-andres');
  assert.equal(filterTechnicalTeam(members, '', 'architecture').length, 8);
  assert.equal(filterTechnicalTeam(members, 'BIM', 'architecture').length, 3);
  assert.equal(filterTechnicalTeam(members, 'Viaducto', 'structures').length, 3);
  assert.equal(filterTechnicalTeam(members, 'no existe').length, 0);
});

test('La nómina se puede ordenar y exportar sin alterar el directorio', () => {
  const members = createTechnicalTeamData().members;
  assert.equal(sortTechnicalTeam(members, 'availability-desc')[0].workload, 100);
  assert.equal(sortTechnicalTeam(members, 'availability-asc')[0].workload, 10);
  assert.equal(sortTechnicalTeam(members, 'name')[0].firstNames, 'Adriana');
  assert.equal(members[0].firstNames, 'Sofía');
  const csv = buildTechnicalTeamCsv(members);
  assert.ok(csv.startsWith('Nombre,Correo,Área,Especialidad,Proyecto asignado,Estado,Dedicación'));
  assert.ok(csv.includes('Sofía Torres'));
  assert.equal(csv.split('\n').length, 19);
});

test('Añadir un técnico lo inserta primero y actualiza los resúmenes sin mutar el original', () => {
  const data = createTechnicalTeamData();
  const updated = addTechnicalMember(data, validDraft, new Date(2026, 8, 5, 12));
  assert.equal(data.members.length, 18);
  assert.equal(updated.members.length, 19);
  assert.equal(getMemberFullName(updated.members[0]), 'Sofía Alejandra Torres Valdivia');
  assert.equal(updated.members[0].email, 'sofia.nueva@empresa.com');
  assert.equal(updated.members[0].workload, 100);
  assert.equal(updated.members[0].avatar, validDraft.avatar);
  assert.equal(updated.members[0].createdAt, '2026-09-05');
  assert.equal(data.assignments.length, 4);
  assert.equal(updated.assignments.length, 5);
  assert.equal(updated.assignments[0].memberName, 'Sofía Alejandra Torres Valdivia');
  assert.deepEqual(summarizeTechnicalTeam(updated.members), { total: 19, active: 13, standby: 4, support: 1, offline: 1, areas: { architecture: 9, structures: 6, systems: 4 } });
});

test('Un proyecto vacío se registra como Sin proyecto inicial', () => {
  const updated = addTechnicalMember(createTechnicalTeamData(), { ...validDraft, email: 'otra@empresa.com', project: ' ' });
  assert.equal(updated.members[0].project, 'Sin proyecto inicial');
});

test('El alta rechaza datos incompletos, duplicados o fuera de rango', () => {
  const data = createTechnicalTeamData();
  assert.throws(() => addTechnicalMember(data, { ...validDraft, firstNames: ' ' }), /nombres/);
  assert.throws(() => addTechnicalMember(data, { ...validDraft, lastNames: ' ' }), /apellidos/);
  assert.throws(() => addTechnicalMember(data, { ...validDraft, email: 'incorrecto' }), /correo/);
  assert.throws(() => addTechnicalMember(data, { ...validDraft, email: 'SOFIA.TORRES@EMPRESA.COM' }), /Ya existe/);
  assert.throws(() => addTechnicalMember(data, { ...validDraft, specialty: ' ' }), /especialidad/);
  assert.throws(() => addTechnicalMember(data, { ...validDraft, area: 'invalid' }), /área técnica/);
  assert.throws(() => addTechnicalMember(data, { ...validDraft, status: 'invalid' }), /estado de disponibilidad/);
  for (const workload of [-1, 101, 1.5, '', 'abc']) assert.throws(() => addTechnicalMember(data, { ...validDraft, workload }), /carga inicial/);
  assert.equal(data.members.length, 18);
});

test('Reasignar actualiza proyecto, estado y dedicación y registra el movimiento', () => {
  const data = createTechnicalTeamData();
  const draft = { project: 'Torre Reforma (PRJ-2026-001)', status: 'support', workload: '75', reason: reassignmentReasons[0] };
  const updated = reassignTechnicalMember(data, 'tech-sofia', draft, new Date(2026, 8, 5, 12));
  const member = updated.members.find((item) => item.id === 'tech-sofia');
  assert.equal(data.members.find((item) => item.id === 'tech-sofia').project, 'Edificio Terminal B (PRJ-2026-004)');
  assert.deepEqual({ project: member.project, status: member.status, workload: member.workload }, { project: draft.project, status: 'support', workload: 75 });
  assert.equal(data.assignments.length, 4);
  assert.equal(updated.assignments.length, 5);
  assert.match(updated.assignments[0].id, /^assignment-\d+-tech-sofia$/);
  assert.deepEqual({ ...updated.assignments[0], id: undefined }, {
    id: undefined, date: '2026-09-05', memberId: 'tech-sofia', memberName: 'Sofía Torres', memberPrefix: 'Arq.',
    previousProject: 'Edificio Terminal B (PRJ-2026-004)', project: draft.project, status: 'support', workload: 75, reason: reassignmentReasons[0],
  });
});

test('La reasignación valida sus datos y evita registrar movimientos idénticos', () => {
  const data = createTechnicalTeamData();
  const member = data.members[0];
  const valid = { project: 'Nuevo Proyecto', status: 'active', workload: 50, reason: reassignmentReasons[1] };
  assert.throws(() => reassignTechnicalMember(data, 'no-existe', valid), /No se encontró/);
  assert.throws(() => reassignTechnicalMember(data, member.id, { ...valid, project: ' ' }), /nuevo proyecto/);
  assert.throws(() => reassignTechnicalMember(data, member.id, { ...valid, status: 'offline' }), /estado operativo/);
  for (const workload of [-1, 101, 1.5, '', 'abc']) assert.throws(() => reassignTechnicalMember(data, member.id, { ...valid, workload }), /dedicación/);
  assert.throws(() => reassignTechnicalMember(data, member.id, { ...valid, reason: 'Otro' }), /motivo/);
  const unchanged = reassignTechnicalMember(data, member.id, { project: member.project, status: member.status, workload: member.workload, reason: reassignmentReasons[0] });
  assert.equal(unchanged, data);
});

test('La página usa tarjetas y el administrador recibe el formulario de alta', async () => {
  const server = await createServer({ server: { middlewareMode: true, hmr: false }, appType: 'custom' });
  try {
    const { default: TechnicalTeam, AddTechnicalMemberDialog, ReassignProjectDialog } = await server.ssrLoadModule('/src/TechnicalTeam.jsx');
    const data = createTechnicalTeamData();
    const props = { data, onChange: () => {}, onQueryChange: () => {}, canManage: true };
    const html = renderToStaticMarkup(React.createElement(TechnicalTeam, props));
    for (const title of ['Gestión del Equipo Técnico', 'Resumen por Área', 'Asignaciones Recientes', 'Exportar Nómina / Reporte', 'Añadir Técnico', 'Mayor disponibilidad']) assert.ok(html.includes(title));
    assert.match(html, /<main class="[^"]*bg-\[#0d1117\]/);
    assert.equal((html.match(/aria-label="Escribir a /g) ?? []).length, 6);
    assert.equal((html.match(/aria-label="Reasignar a /g) ?? []).length, 6);
    assert.ok(html.includes('Arquitectura'));
    assert.ok(html.includes('8 Miembros'));
    assert.ok(html.includes('6 Miembros'));
    assert.ok(html.includes('4 Miembros'));
    assert.ok(html.includes('18 Total'));

    const searched = renderToStaticMarkup(React.createElement(TechnicalTeam, { ...props, query: 'Sofia' }));
    assert.equal((searched.match(/aria-label="Escribir a /g) ?? []).length, 1);
    const empty = renderToStaticMarkup(React.createElement(TechnicalTeam, { ...props, query: 'no existe' }));
    assert.ok(empty.includes('No se encontraron técnicos'));

    const viewer = renderToStaticMarkup(React.createElement(TechnicalTeam, { ...props, canManage: false }));
    assert.ok(viewer.includes('Vista de consulta'));
    assert.ok(!viewer.includes('>Añadir Técnico</button>'));
    assert.equal((viewer.match(/aria-label="Reasignar a /g) ?? []).length, 0);

    const dialog = renderToStaticMarkup(React.createElement(AddTechnicalMemberDialog, { existingData: data, onSubmit: () => {}, onClose: () => {} }));
    for (const field of ['Nombres', 'Apellidos', 'Correo electrónico corporativo', 'Especialidad / Rol', 'Área técnica', 'Proyecto asignado inicial', 'Estado de disponibilidad', 'Disponibilidad / carga inicial']) assert.ok(dialog.includes(field));
    assert.ok(dialog.includes('Subir foto de perfil'));
    assert.ok(dialog.includes('Añadir al equipo'));

    const reassignmentDialog = renderToStaticMarkup(React.createElement(ReassignProjectDialog, { member: data.members[0], projectOptions: ['Proyecto creado en Portafolio (PRJ-2026-005)'], onSubmit: () => {}, onClose: () => {} }));
    for (const field of ['Reasignar Proyecto', 'Nuevo proyecto asignado', 'Estado operativo', 'Porcentaje de dedicación', 'Motivo de la reasignación', 'Guardar reasignación']) assert.ok(reassignmentDialog.includes(field));
    assert.ok(reassignmentDialog.includes('Proyecto creado en Portafolio (PRJ-2026-005)'));
    assert.ok(reassignmentDialog.includes('En Apoyo'));

    const { default: MobileNavigation } = await server.ssrLoadModule('/src/MobileNavigation.jsx');
    const navigated = [];
    const mobile = MobileNavigation({ activeView: 'dashboard', onNavigate: (id) => navigated.push(id) });
    const mobileTeam = mobile.props.children.find((button) => button.key === 'technical-team');
    assert.equal(mobileTeam.props.disabled, false);
    mobileTeam.props.onClick();
    assert.deepEqual(navigated, ['technical-team']);

    const { default: Sidebar } = await server.ssrLoadModule('/src/Sidebar.jsx');
    const sidebar = renderToStaticMarkup(React.createElement(Sidebar, { activeView: 'technical-team', onNavigate: () => {}, fontScale: 100, onFontScaleChange: () => {} }));
    const desktopTeam = sidebar.match(/<button\b[\s\S]*?<\/button>/g).find((button) => button.includes('Equipo Técnico'));
    assert.ok(!desktopTeam.includes('disabled=""'));
    assert.ok(desktopTeam.includes('aria-current="page"'));
  } finally {
    await server.close();
  }
});
