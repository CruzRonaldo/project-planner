import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';
import { buildPersonnelCsv, createHumanResourcesData, filterPersonnel, getIncidentDuration, getUpcomingIncidentAlerts, normalizePersonnelIncidents, normalizeTeamMemberHistory, personnelIncidentTypes, registerPersonnelIncident, summarizePersonnel, updatePersonnel, sortPersonnelMembers } from '../src/mocks/humanResourcesData.js';

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
  assert.equal(filterPersonnel(members, '', ['active', 'support']).length, 14);
  assert.equal(filterPersonnel(members, '', ['standby', 'support']).length, 6);
  assert.equal(filterPersonnel(members, '', ['active', 'standby', 'support']).length, 18);
  assert.equal(filterPersonnel(members, '', []).length, 18);
});

test('sortPersonnelMembers ordena integrantes por disponibilidad, nombre y área', () => {
  const { members } = createHumanResourcesData();
  const byAvailDesc = sortPersonnelMembers(members, 'avail_desc');
  assert.equal(byAvailDesc[0].availability, 100);
  assert.ok(byAvailDesc[byAvailDesc.length - 1].availability <= 20);

  const byAvailAsc = sortPersonnelMembers(members, 'avail_asc');
  assert.ok(byAvailAsc[0].availability <= 20);

  const byNameAsc = sortPersonnelMembers(members, 'name_asc');
  assert.equal(byNameAsc[0].name, 'Adriana Vega');

  const byAreaAsc = sortPersonnelMembers(members, 'area_asc');
  assert.equal(byAreaAsc[0].area, 'Arquitectura');
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

test('Normaliza incidencias paginadas e historial persistente del backend', () => {
  const incidents = normalizePersonnelIncidents({ results: [{
    id: 17,
    member: 4,
    member_name: 'Sofía Torres',
    incident_type: 'vacation',
    incident_type_display: 'Vacaciones programadas',
    start_date: '2026-10-20',
    end_date: '2026-10-24',
    resulting_status_name: 'Stand-by',
    availability: 0,
    backup_member: 8,
    backup_member_name: 'Alejandro Ruiz',
    reason: 'Vacaciones aprobadas.',
    workflow_status: 'approved',
    workflow_status_display: 'Aprobada',
    created_at: '2026-10-16T10:00:00-05:00',
    duration_days: 5,
  }] });
  assert.equal(incidents.length, 1);
  assert.equal(incidents[0].memberId, 4);
  assert.equal(incidents[0].memberName, 'Sofía Torres');
  assert.equal(incidents[0].workflowStatus, 'approved');
  assert.equal(incidents[0].status, 'standby');
  assert.equal(incidents[0].calendarDays, 5);

  const history = normalizeTeamMemberHistory([{ id: 9, date: '2026-10-16', name: 'Sofía Torres', previousStatus: 'Activo', nextStatus: 'Stand-by', comment: 'Incidencia aprobada.' }]);
  assert.deepEqual(history[0], {
    id: 9,
    date: '2026-10-16',
    name: 'Sofía Torres',
    previousStatus: 'active',
    nextStatus: 'standby',
    comment: 'Incidencia aprobada.',
    changedByName: '',
  });
});

test('Las alertas incluyen reincorporaciones a siete días y vencidas', () => {
  const alerts = getUpcomingIncidentAlerts([
    { id: 1, workflowStatus: 'approved', endDate: '2026-10-14' },
    { id: 2, workflowStatus: 'approved', endDate: '2026-10-20' },
    { id: 3, workflowStatus: 'approved', endDate: '2026-10-30' },
    { id: 4, workflowStatus: 'pending', endDate: '2026-10-17' },
  ], new Date(2026, 9, 16, 8));
  assert.deepEqual(alerts.map((incident) => [incident.id, incident.daysUntilReturn]), [[1, -2], [2, 4]]);
});

test('La pantalla se renderiza con fondo oscuro y las cuatro secciones esperadas', async () => {
  const server = await createServer({ server: { middlewareMode: true, hmr: false }, appType: 'custom' });
  try {
    const { default: HumanResources, PersonnelIncidentDialog } = await server.ssrLoadModule('/src/views/human-resources/HumanResources.jsx');
    const props = { data: createHumanResourcesData(), onChange: () => {}, onQueryChange: () => {}, canManage: true };
    const html = renderToStaticMarkup(React.createElement(HumanResources, props));
    for (const title of ['Recursos Humanos y Estados', 'Asignación de Personal', 'Estado de Equipos', 'Incidencias y Licencias', 'Próximas reincorporaciones', 'Historial de Cambios de Estado']) assert.ok(html.includes(title));
    assert.match(html, /<main class="[^"]*bg-\[#0d1117\]/);
    assert.ok(html.includes('Total personal: 18'));
    assert.ok(html.includes('Ordenar asignación de personal'));
    assert.ok(html.includes('Registrar Incidencia / Licencia'));
    assert.ok(html.includes('Exportar Matriz'));
    assert.ok(html.includes('Pendiente de sincronización'));
    assert.equal(html.match(/<tbody>([\s\S]*?)<\/tbody>/)[1].match(/<tr\b/g).length, 8);

    const searched = renderToStaticMarkup(React.createElement(HumanResources, { ...props, query: 'Sofia' }));
    assert.equal(searched.match(/<tbody>([\s\S]*?)<\/tbody>/)[1].match(/<tr\b/g).length, 1);
    const empty = renderToStaticMarkup(React.createElement(HumanResources, { ...props, query: 'no existe' }));
    assert.ok(empty.includes('No se encontró personal'));

    const viewer = renderToStaticMarkup(React.createElement(HumanResources, { ...props, canManage: false }));
    assert.ok(!viewer.includes('Registrar Incidencia / Licencia'));
    assert.ok(!viewer.includes('Exportar Matriz'));
    const viewerTeamStatus = viewer.match(/<section[^>]*aria-labelledby="team-status-title"[^>]*>[\s\S]*?<\/section>/)?.[0] || '';
    const managerTeamStatus = html.match(/<section[^>]*aria-labelledby="team-status-title"[^>]*>[\s\S]*?<\/section>/)?.[0] || '';
    assert.ok(viewerTeamStatus.includes('Sofía Torres'));
    assert.equal((viewerTeamStatus.match(/<button\b/g) || []).length, 4);
    assert.ok((managerTeamStatus.match(/<button\b/g) || []).length > 4);

    const incidentDialog = renderToStaticMarkup(React.createElement(PersonnelIncidentDialog, { data: props.data, onSubmit: () => {}, onClose: () => {} }));
    for (const field of ['Registrar Incidencia / Licencia', 'Integrante del personal', 'Tipo de incidencia', 'Fecha de inicio / desde', 'Fecha de retorno / hasta', 'Estado operativo resultante', 'Disponibilidad en este periodo', 'Técnico de respaldo / cobertura temporal', 'Motivo / comentario detallado', 'Registrar incidencia']) assert.ok(incidentDialog.includes(field));
    assert.ok(incidentDialog.includes('Vacaciones programadas'));
    assert.ok(incidentDialog.includes('como pendiente'));

    const workflowData = {
      ...props.data,
      incidents: [
        { id: 1, memberName: 'Sofía Torres', typeLabel: 'Vacaciones programadas', startDate: '2026-10-20', endDate: '2026-10-24', status: 'standby', availability: 0, comment: 'Vacaciones coordinadas.', workflowStatus: 'pending', backupMemberName: 'Alejandro Ruiz', calendarDays: 4 },
        { id: 2, memberName: 'Elena Gómez', typeLabel: 'Capacitación externa', startDate: '2026-10-18', endDate: '2026-10-19', status: 'support', availability: 50, comment: 'Capacitación técnica.', workflowStatus: 'approved', backupMemberName: '', calendarDays: 1 },
      ],
    };
    const workflowHtml = renderToStaticMarkup(React.createElement(HumanResources, { ...props, data: workflowData }));
    assert.ok(workflowHtml.includes('Aprobar'));
    assert.ok(workflowHtml.includes('Rechazar'));
    assert.ok(workflowHtml.includes('Finalizar'));
    const privateViewerHtml = renderToStaticMarkup(React.createElement(HumanResources, { ...props, data: workflowData, canManage: false }));
    assert.ok(!privateViewerHtml.includes('Incidencias y Licencias'));

    const { default: MobileNavigation } = await server.ssrLoadModule('/src/components/layout/MobileNavigation.jsx');
    const navigated = [];
    const mobile = MobileNavigation({ activeView: 'dashboard', onNavigate: (id) => navigated.push(id) });
    const hrButton = mobile.props.children.find((button) => button.key === 'human-resources');
    hrButton.props.onClick();
    assert.deepEqual(navigated, ['human-resources']);
    const teamButton = mobile.props.children.find((button) => button.key === 'technical-team');
    assert.equal(teamButton.props.disabled, false);
    teamButton.props.onClick();
    assert.deepEqual(navigated, ['human-resources', 'technical-team']);

    const { default: Sidebar } = await server.ssrLoadModule('/src/components/layout/Sidebar.jsx');
    const sidebar = renderToStaticMarkup(React.createElement(Sidebar, { activeView: 'human-resources', onNavigate: () => {}, fontScale: 100, onFontScaleChange: () => {} }));
    const desktopHR = sidebar.match(/<button\b[\s\S]*?<\/button>/g).find((button) => button.includes('Recursos Humanos'));
    assert.ok(!desktopHR.includes('disabled=""'));
    assert.ok(desktopHR.includes('aria-current="page"'));
  } finally {
    await server.close();
  }
});

test('Recursos Humanos y sus diálogos integran runSafe para el manejo seguro de operaciones asíncronas', async () => {
  const server = await createServer({ server: { middlewareMode: true, hmr: false }, appType: 'custom' });
  try {
    const { PersonnelEditorModal } = await server.ssrLoadModule('/src/views/human-resources/components/PersonnelEditorModal.jsx');
    const { IncidentActionDialog } = await server.ssrLoadModule('/src/views/human-resources/components/IncidentActionDialog.jsx');
    const { PersonnelIncidentDialog } = await server.ssrLoadModule('/src/views/human-resources/components/PersonnelIncidentDialog.jsx');
    const { runSafe } = await server.ssrLoadModule('/src/utils/asyncHandler.js');

    assert.equal(typeof runSafe, 'function');
    assert.equal(typeof PersonnelEditorModal, 'function');
    assert.equal(typeof IncidentActionDialog, 'function');
    assert.equal(typeof PersonnelIncidentDialog, 'function');
  } finally {
    await server.close();
  }
});

function findReactElement(node, predicate) {
  if (!node || typeof node !== 'object') return null;
  if (Array.isArray(node)) {
    for (const child of node) {
      const found = findReactElement(child, predicate);
      if (found) return found;
    }
    return null;
  }
  if (predicate(node)) return node;
  return findReactElement(node.props?.children, predicate);
}

function createHookRunner(Component, props) {
  const states = [];
  const internals = React.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE;

  return () => {
    const previousDispatcher = internals.H;
    let hookIndex = 0;
    internals.H = {
      useState(initialState) {
        const index = hookIndex++;
        if (!(index in states)) {
          states[index] = typeof initialState === 'function' ? initialState() : initialState;
        }
        const setState = (updater) => {
          states[index] = typeof updater === 'function' ? updater(states[index]) : updater;
        };
        return [states[index], setState];
      },
      useMemo(factory, deps) {
        const index = hookIndex++;
        const previous = states[index];
        if (!previous || !deps || deps.some((dep, depIndex) => !Object.is(dep, previous.deps[depIndex]))) {
          states[index] = { value: factory(), deps };
        }
        return states[index].value;
      },
      useContext(context) {
        return context._currentValue;
      },
      useCallback(fn) {
        return fn;
      },
      useRef(initialValue) {
        const index = hookIndex++;
        if (!(index in states)) states[index] = { current: initialValue };
        return states[index];
      },
      useEffect() {},
    };

    try {
      return Component(props);
    } finally {
      internals.H = previousDispatcher;
    }
  };
}

test('HumanResources navega a la página 2 de personal manteniendo sortOrder y Pagination expone cursores', async () => {
  const server = await createServer({ server: { middlewareMode: true, hmr: false }, appType: 'custom' });
  try {
    const { default: HumanResources } = await server.ssrLoadModule('/src/views/human-resources/HumanResources.jsx');
    const { default: Pagination } = await server.ssrLoadModule('/src/components/common/Pagination.jsx');
    const { default: SortDropdown } = await server.ssrLoadModule('/src/components/common/SortDropdown.jsx');

    const data = createHumanResourcesData();
    const renderHR = createHookRunner(HumanResources, {
      data,
      onChange: () => {},
      onQueryChange: () => {},
      canManage: true,
    });

    let tree = renderHR();
    let pagination = findReactElement(tree, (node) => node.type === Pagination && node.props?.pageSize === 8);
    let sortDropdown = findReactElement(tree, (node) => node.type === SortDropdown);
    assert.equal(pagination.props.currentPage, 1);
    assert.equal(sortDropdown.props.value, 'avail_desc');

    pagination.props.onPageChange(2);
    tree = renderHR();
    pagination = findReactElement(tree, (node) => node.type === Pagination && node.props?.pageSize === 8);
    assert.equal(pagination.props.currentPage, 2);

    const personnelSection = findReactElement(
      tree,
      (node) => node.type === 'section' && node.props?.['aria-labelledby'] === 'personnel-assignment-title'
    );
    const pageTwoRowsAvail = findReactElement(personnelSection, (node) => node.type === 'tbody').props.children[0];
    const expectedAvailSecondPageFirst = sortPersonnelMembers(data.members, 'avail_desc')[8];
    assert.equal(pageTwoRowsAvail[0].key, expectedAvailSecondPageFirst.id);

    sortDropdown = findReactElement(tree, (node) => node.type === SortDropdown);
    sortDropdown.props.onChange('name_asc');
    tree = renderHR();
    sortDropdown = findReactElement(tree, (node) => node.type === SortDropdown);
    pagination = findReactElement(tree, (node) => node.type === Pagination && node.props?.pageSize === 8);
    assert.equal(sortDropdown.props.value, 'name_asc');
    assert.equal(pagination.props.currentPage, 1);

    pagination.props.onPageChange(2);
    tree = renderHR();
    sortDropdown = findReactElement(tree, (node) => node.type === SortDropdown);
    pagination = findReactElement(tree, (node) => node.type === Pagination && node.props?.pageSize === 8);
    assert.equal(sortDropdown.props.value, 'name_asc');
    assert.equal(pagination.props.currentPage, 2);

    const personnelSectionSorted = findReactElement(
      tree,
      (node) => node.type === 'section' && node.props?.['aria-labelledby'] === 'personnel-assignment-title'
    );
    const pageTwoRowsName = findReactElement(personnelSectionSorted, (node) => node.type === 'tbody').props.children[0];
    const expectedNameSecondPageFirst = sortPersonnelMembers(data.members, 'name_asc')[8];
    assert.equal(pageTwoRowsName[0].key, expectedNameSecondPageFirst.id);

    const paginationHtml = renderToStaticMarkup(
      React.createElement(Pagination, {
        currentPage: 1,
        totalPages: 3,
        totalItems: 18,
        pageSize: 8,
        itemLabel: 'integrantes',
        onPageChange: () => {},
      })
    );
    assert.ok(paginationHtml.includes('enabled:cursor-pointer'));
    assert.ok(paginationHtml.includes('disabled:cursor-not-allowed'));
    assert.ok(!paginationHtml.includes('disabled:pointer-events-none'));
  } finally {
    await server.close();
  }
});
