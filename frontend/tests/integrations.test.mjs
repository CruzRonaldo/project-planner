import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';
import { createIntegrationsData, filterIntegrations, summarizeIntegrations, testIntegration, updateIntegration } from '../src/mocks/integrationsData.js';
import { computeActivityChartPoints } from '../src/utils/integrations.js';

test('El panel inicia con tres integraciones y los valores de la referencia', () => {
  const data = createIntegrationsData();
  assert.deepEqual(summarizeIntegrations(data), { active: 2, total: 3, errors: 2, uptime: 99.84, connected: 2, partial: 1, offline: 0 });
  assert.deepEqual(data.integrations.map((item) => item.name), ['Google Drive', 'Revit / BIM Data', 'Make (Integromat)']);
  assert.equal(new Set(data.integrations.map((item) => item.id)).size, 3);
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
  assert.deepEqual(summarizeIntegrations(updated), { active: 3, total: 3, errors: 0, uptime: 99.84, connected: 3, partial: 0, offline: 0 });
  assert.equal(data.integrations[2].status, 'partial');
  assert.equal(updated.integrations[2].endpoint, 'Escenarios / Producción');
  assert.equal(updated.integrations[2].metrics.find((metric) => metric.key === 'errors').value, 0);
  assert.equal(updated.activities.length, data.activities.length + 1);
  assert.match(updated.activities[0].title, /Configuración actualizada/);
});

test('Guardar los mismos datos no crea actividad duplicada', () => {
  const data = createIntegrationsData();
  const integration = data.integrations[0];
  assert.equal(updateIntegration(data, integration.id, integration), data);
});

test('updateIntegration preserva extraConfig y detecta cambios en tareas personalizadas', () => {
  const data = createIntegrationsData();
  const draft = {
    endpoint: 'https://hook.make.com/test',
    frequency: 'Cada 30 min',
    status: 'connected',
    errors: 0,
    extraConfig: {
      tasks: [
        { id: 'two_factor', name: '2FA', enabled: true, endpoint: 'https://hook.make.com/2fa' },
        { id: 'notifications', name: 'Notif', enabled: false, endpoint: '' },
      ],
      primaryUrl: 'https://hook.make.com/2fa',
    },
  };
  const updated = updateIntegration(data, 'make', draft);
  const makeItem = updated.integrations.find((i) => i.id === 'make');
  assert.equal(makeItem.extraConfig?.tasks?.length, 2);
  assert.equal(makeItem.extraConfig.tasks[1].enabled, false);
  assert.equal(makeItem.endpoint, 'https://hook.make.com/test');

  // Guardar exactamente el mismo draft no crea actividad duplicada
  assert.equal(updateIntegration(updated, 'make', draft), updated);

  // Modificar el toggle de una tarea dispara actualización
  const toggledDraft = {
    ...draft,
    extraConfig: {
      ...draft.extraConfig,
      tasks: [
        { id: 'two_factor', name: '2FA', enabled: true, endpoint: 'https://hook.make.com/2fa' },
        { id: 'notifications', name: 'Notif', enabled: true, endpoint: '' },
      ],
    },
  };
  const toggled = updateIntegration(updated, 'make', toggledDraft);
  assert.notEqual(toggled, updated);
  const toggledMake = toggled.integrations.find((i) => i.id === 'make');
  assert.equal(toggledMake.extraConfig.tasks[1].enabled, true);

  // Actualiza metrics cuando el draft incluye metrics explícitas (ej. escenarios y errores de Make)
  const withMetricsDraft = {
    ...toggledDraft,
    errors: 1,
    metrics: [
      { key: 'scenarios', value: 2, label: 'escenarios' },
      { key: 'errors', value: 1, label: 'con error' },
    ],
  };
  const withMetrics = updateIntegration(toggled, 'make', withMetricsDraft);
  const makeWithMetrics = withMetrics.integrations.find((i) => i.id === 'make');
  assert.deepEqual(makeWithMetrics.metrics, [
    { key: 'scenarios', value: 2, label: 'escenarios' },
    { key: 'errors', value: 1, label: 'con error' },
  ]);
  assert.equal(makeWithMetrics.errors, 1);
  assert.equal(updateIntegration(withMetrics, 'make', withMetricsDraft), withMetrics);
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
  assert.equal(tested.integrations[2].status, 'connected');
  assert.equal(tested.integrations[2].errors, 0);
  assert.equal(tested.integrations[2].lastActivity, 'Ahora');
  assert.match(tested.activities[0].title, /Prueba de conexión/);
  assert.throws(() => testIntegration(data, 'missing'), /No se encontró/);
});

test('La vista conserva el fondo oscuro, se adapta a búsqueda y no usa modal de configuración', async () => {
  const server = await createServer({ server: { middlewareMode: true, hmr: false }, appType: 'custom' });
  try {
    const { default: Integrations, IntegrationEditor } = await server.ssrLoadModule('/src/views/common/Integrations.jsx');
    const { ToastProvider } = await server.ssrLoadModule('/src/context/ToastContext.jsx');
    const data = createIntegrationsData();
    const props = { data, onChange: () => {}, onQueryChange: () => {} };
    const html = renderToStaticMarkup(React.createElement(ToastProvider, null, React.createElement(Integrations, props)));
    for (const title of ['Integraciones', 'Registro de Actividad de Integraciones', 'Estado General', 'Actividad de Peticiones (API)', 'SLA y Mantenimiento']) assert.ok(html.includes(title));
    assert.match(html, /<main class="[^"]*bg-\[#0d1117\]/);
    assert.equal((html.match(/aria-label="Configurar /g) ?? []).length, 3);
    assert.ok(html.includes('Conectividad con servicios externos y automatización'));

    const searched = renderToStaticMarkup(React.createElement(ToastProvider, null, React.createElement(Integrations, { ...props, query: 'Make' })));
    assert.equal((searched.match(/aria-label="Configurar /g) ?? []).length, 1);
    const empty = renderToStaticMarkup(React.createElement(ToastProvider, null, React.createElement(Integrations, { ...props, query: 'no existe' })));
    assert.ok(empty.includes('No se encontraron integraciones'));
    assert.ok(empty.includes('No hay actividad'));

    const editor = renderToStaticMarkup(React.createElement(IntegrationEditor, { integration: data.integrations[0], onSave: () => {}, onTest: () => {}, onCancel: () => {} }));
    assert.ok(editor.includes('Configurar Google Drive'));
    assert.ok(editor.includes('Probar conexión'));
    assert.ok(!editor.includes('fixed inset-0'));

    const { default: MobileNavigation } = await server.ssrLoadModule('/src/components/layout/MobileNavigation.jsx');
    const navigated = [];
    const mobile = MobileNavigation({ activeView: 'dashboard', onNavigate: (id) => navigated.push(id) });
    mobile.props.children.find((button) => button.key === 'integrations').props.onClick();
    assert.deepEqual(navigated, ['integrations']);
    const teamButton = mobile.props.children.find((button) => button.key === 'technical-team');
    assert.equal(teamButton.props.disabled, false);
    teamButton.props.onClick();
    assert.deepEqual(navigated, ['integrations', 'technical-team']);

    const { default: Sidebar } = await server.ssrLoadModule('/src/components/layout/Sidebar.jsx');
    const sidebar = renderToStaticMarkup(React.createElement(Sidebar, { activeView: 'integrations', onNavigate: () => {}, fontScale: 100, onFontScaleChange: () => {} }));
    const desktopIntegration = sidebar.match(/<button\b[\s\S]*?<\/button>/g).find((button) => button.includes('Integraciones'));
    assert.ok(!desktopIntegration.includes('disabled=""'));
    assert.ok(desktopIntegration.includes('aria-current="page"'));
  } finally {
    await server.close();
  }
});

test('Integraciones integra runSafe para pruebas de conexión seguras', async () => {
  const { createServer } = await import('vite');
  const server = await createServer({ server: { middlewareMode: true, hmr: false }, appType: 'custom' });
  try {
    const { default: Integrations } = await server.ssrLoadModule('/src/views/common/Integrations.jsx');
    const { runSafe } = await server.ssrLoadModule('/src/utils/asyncHandler.js');

    assert.equal(typeof runSafe, 'function');
    assert.equal(typeof Integrations, 'function');
  } finally {
    await server.close();
  }
});

test('GoogleDriveModal y MakeModal renderizan modales accesibles con soporte multitarea', async () => {
  const { createServer } = await import('vite');
  const server = await createServer({ server: { middlewareMode: true, hmr: false }, appType: 'custom' });
  try {
    const { GoogleDriveModal, MakeModal } = await server.ssrLoadModule('/src/views/common/integrations/index.js');
    const { ToastProvider } = await server.ssrLoadModule('/src/context/ToastContext.jsx');
    const data = createIntegrationsData();

    // 1. GoogleDriveModal renderiza diálogo con explorador de archivos y acciones OAuth
    const driveIntegration = data.integrations.find((i) => i.id === 'drive');
    const driveHtml = renderToStaticMarkup(
      React.createElement(
        ToastProvider,
        null,
        React.createElement(GoogleDriveModal, {
          isOpen: true,
          onClose: () => {},
          integration: driveIntegration,
          onConnect: () => {},
          onTest: () => {},
        })
      )
    );
    assert.ok(driveHtml.includes('Configuración de Google Drive'));
    assert.ok(driveHtml.includes('Probar conexión'));
    assert.ok(driveHtml.includes('Reautorizar Google Drive') || driveHtml.includes('Conectar Google Drive'));
    assert.ok(driveHtml.includes('role="dialog"'));

    // 2. MakeModal renderiza diálogo multitarea con webhooks para 2FA, notificaciones y alertas
    const makeIntegration = data.integrations.find((i) => i.id === 'make');
    const makeHtml = renderToStaticMarkup(
      React.createElement(
        ToastProvider,
        null,
        React.createElement(MakeModal, {
          isOpen: true,
          onClose: () => {},
          integration: makeIntegration,
          onSave: () => {},
        })
      )
    );
    assert.ok(makeHtml.includes('Configuración Multitarea de Make'));
    assert.ok(makeHtml.includes('Autenticación de 2 Factores (2FA)'));
    assert.ok(makeHtml.includes('Notificaciones y Asignaciones'));
    assert.ok(makeHtml.includes('Gobernanza Presupuestaria ($100k)'));
    assert.ok(makeHtml.includes('Probar Webhook'));
    assert.ok(makeHtml.includes('Advertencia de Notificaciones'));
    assert.ok(makeHtml.includes('Modo: Tiempo real por evento'));
    assert.ok(makeHtml.includes('aria-label="Ajustes de token para Autenticación de 2 Factores (2FA)"'));
    assert.ok(makeHtml.includes('aria-label="Ajustes de token para Notificaciones y Asignaciones"'));
    assert.ok(makeHtml.includes('aria-label="Ajustes de token para Gobernanza Presupuestaria ($100k)"'));
    assert.ok(!makeHtml.includes('aria-label="Ajustes avanzados"'));
    assert.ok(!makeHtml.includes('Créditos disponibles'));
    assert.ok(makeHtml.includes('role="dialog"'));

    // 3. MakeModal oculta la advertencia cuando todas las tareas están activas y muestra barra de créditos por tarea cuando hay uso configurado
    const allEnabledMake = {
      ...makeIntegration,
      extraConfig: {
        tasks: [
          {
            id: 'two_factor',
            name: '2FA',
            description: 'OTP',
            enabled: true,
            endpoint: 'https://hook.make.com/1',
            has_api_token: true,
            usage: {
              configured: true,
              limit: 10000,
              used: 2000,
              available: 8000,
              percent: 80.0,
              organization_name: 'Acme',
              error: null,
            },
          },
        ],
      },
    };
    const allEnabledHtml = renderToStaticMarkup(
      React.createElement(
        ToastProvider,
        null,
        React.createElement(MakeModal, {
          isOpen: true,
          onClose: () => {},
          integration: allEnabledMake,
          onSave: () => {},
        })
      )
    );
    assert.ok(!allEnabledHtml.includes('Advertencia de Notificaciones'));
    assert.ok(allEnabledHtml.includes('Créditos disponibles'));
    assert.ok(allEnabledHtml.includes('80%'));
    assert.ok(allEnabledHtml.includes('role="progressbar"'));
    assert.ok(allEnabledHtml.includes('1 de 1 tareas configuradas'));
    assert.ok(allEnabledHtml.includes('Conectado'));

    // 4. MakeModal muestra estado Parcial y contador exacto cuando 1 de 2 tareas habilitadas tiene endpoint
    const partialMake = {
      ...makeIntegration,
      extraConfig: {
        tasks: [
          { id: 'two_factor', name: '2FA', description: 'OTP', enabled: true, endpoint: 'https://hook.make.com/1' },
          { id: 'notifications', name: 'Notif', description: 'Alerts', enabled: true, endpoint: '' },
          { id: 'governance', name: 'Gov', description: 'Budget', enabled: false, endpoint: '' },
        ],
      },
    };
    const partialHtml = renderToStaticMarkup(
      React.createElement(
        ToastProvider,
        null,
        React.createElement(MakeModal, {
          isOpen: true,
          onClose: () => {},
          integration: partialMake,
          onSave: () => {},
        })
      )
    );
    assert.ok(partialHtml.includes('1 de 2 tareas configuradas'));
    assert.ok(partialHtml.includes('Parcial'));

    // 5. MakeModal renderiza barra en rojo y mensaje de cuenta pausada cuando is_paused=true
    const pausedMake = {
      ...makeIntegration,
      extraConfig: {
        tasks: [
          {
            id: 'two_factor',
            name: '2FA',
            description: 'OTP',
            enabled: true,
            endpoint: 'https://hook.make.com/1',
            has_api_token: true,
            usage: {
              configured: true,
              limit: 1000,
              used: 1024,
              available: 0,
              percent: 0,
              is_paused: true,
              next_reset: '2026-12-01T00:00:00.000Z',
              organization_name: 'Acme',
              error: null,
            },
          },
        ],
      },
    };
    const pausedHtml = renderToStaticMarkup(
      React.createElement(
        ToastProvider,
        null,
        React.createElement(MakeModal, {
          isOpen: true,
          onClose: () => {},
          integration: pausedMake,
          onSave: () => {},
        })
      )
    );
    assert.ok(pausedHtml.includes('0%'));
    assert.ok(pausedHtml.includes('bg-rose-500'));
    assert.ok(pausedHtml.includes('Cuenta pausada en Make por límite excedido (1024 ops)'));
  } finally {
    await server.close();
  }
});

test('Integrations restringe el acceso y visibilidad de Make únicamente a Administradores (RBAC)', async () => {
  const { createServer } = await import('vite');
  const server = await createServer({ server: { middlewareMode: true, hmr: false }, appType: 'custom' });
  try {
    const { default: Integrations } = await server.ssrLoadModule('/src/views/common/Integrations.jsx');
    const { ToastProvider } = await server.ssrLoadModule('/src/context/ToastContext.jsx');
    const data = createIntegrationsData();
    const props = { data, onChange: () => {}, onQueryChange: () => {} };

    // 1. Usuario Técnico (sin rol administrador): Make debe estar oculto
    const technicianHtml = renderToStaticMarkup(
      React.createElement(
        ToastProvider,
        null,
        React.createElement(Integrations, {
          ...props,
          isAdmin: false,
          canManage: false,
          currentUser: { role: 'user', accountType: 'user' },
        })
      )
    );
    assert.ok(technicianHtml.includes('Google Drive'), 'Google Drive debe ser visible para técnicos');
    assert.ok(technicianHtml.includes('Revit / BIM Data'), 'Revit debe ser visible para técnicos');
    assert.ok(!technicianHtml.includes('Make (Integromat)'), 'Make NO debe ser visible para técnicos');
    assert.equal((technicianHtml.match(/aria-label="Configurar /g) ?? []).length, 2, 'Solo 2 tarjetas visibles para técnicos');

    // 2. Administrador / PMO: Make debe ser visible y configurable
    const adminHtml = renderToStaticMarkup(
      React.createElement(
        ToastProvider,
        null,
        React.createElement(Integrations, {
          ...props,
          isAdmin: true,
          canManage: true,
          currentUser: { role: 'admin', accountType: 'admin' },
        })
      )
    );
    assert.ok(adminHtml.includes('Make (Integromat)'), 'Make debe ser visible para administradores');
    assert.equal((adminHtml.match(/aria-label="Configurar /g) ?? []).length, 3, 'Las 3 tarjetas visibles para administradores');
  } finally {
    await server.close();
  }
});

test('IntegrationActivityList pagina las actividades con límite de 5 elementos y updateIntegration/testIntegration limitan a 30', async () => {
  const base = createIntegrationsData();
  const manyActivities = Array.from({ length: 30 }, (_, index) => ({
    id: `act-${index + 1}`,
    integrationId: 'drive',
    title: `Actividad histórica ${index + 1}`,
    time: 'Hace 1 hora',
    status: 'success',
  }));
  const cappedByTest = testIntegration({ ...base, activities: manyActivities }, 'make', new Date(2026, 8, 6));
  assert.equal(cappedByTest.activities.length, 30);
  assert.match(cappedByTest.activities[0].title, /Prueba de conexión/);

  const cappedByUpdate = updateIntegration(
    { ...base, activities: manyActivities },
    'make',
    { status: 'connected', endpoint: 'Escenarios / Límite', frequency: 'Cada 10 min', errors: 0 },
    new Date(2026, 8, 7)
  );
  assert.equal(cappedByUpdate.activities.length, 30);
  assert.match(cappedByUpdate.activities[0].title, /Configuración actualizada/);

  const server = await createServer({ server: { middlewareMode: true, hmr: false }, appType: 'custom' });
  try {
    const { IntegrationActivityList } = await server.ssrLoadModule('/src/views/common/integrations/index.js');
    const eightActivities = Array.from({ length: 8 }, (_, index) => ({
      id: `item-${index + 1}`,
      integrationId: 'drive',
      title: `Evento de prueba #${index + 1}`,
      time: `Hace ${index + 1} min`,
      status: 'success',
    }));

    const paginatedHtml = renderToStaticMarkup(
      React.createElement(IntegrationActivityList, {
        activities: eightActivities,
        integrations: base.integrations,
      })
    );

    for (let i = 1; i <= 5; i += 1) {
      assert.ok(paginatedHtml.includes(`Evento de prueba #${i}`), `Debe renderizar el elemento ${i}`);
    }
    for (let i = 6; i <= 8; i += 1) {
      assert.ok(!paginatedHtml.includes(`Evento de prueba #${i}`), `No debe renderizar el elemento ${i} en la página 1`);
    }
    assert.ok(paginatedHtml.includes('1–5 de 8 actividades'), 'Debe mostrar el rango paginado de actividades');
    assert.ok(paginatedHtml.includes('1 / 2'), 'Debe mostrar el indicador de página 1 / 2');
    assert.ok(paginatedHtml.includes('aria-label="Navegación de páginas"'), 'Debe mostrar controles accesibles de paginación');

    const singlePageHtml = renderToStaticMarkup(
      React.createElement(IntegrationActivityList, {
        activities: eightActivities.slice(0, 3),
        integrations: base.integrations,
      })
    );
    assert.ok(!singlePageHtml.includes('aria-label="Navegación de páginas"'), 'Debe ocultar paginación cuando hay 5 o menos actividades');
  } finally {
    await server.close();
  }
});

test('summarizeIntegrations calcula conteos SLA, uptime dinámico y computeActivityChartPoints genera 12 puntos reales', async () => {
  const fromActivities = summarizeIntegrations({
    integrations: [
      { id: 'drive', status: 'connected', errors: 0 },
      { id: 'make', status: 'partial', errors: 1 },
      { id: 'revit', status: 'disconnected', errors: 3 },
      { id: 'slack', status: 'error', errors: 2 },
    ],
    activities: [
      { id: '1', time: 'Ahora', status: 'success' },
      { id: '2', time: 'Hace 25 minutos', status: 'success' },
      { id: '3', time: 'Hace 45 minutos', status: 'error' },
      { id: '4', time: 'Hace 1 hora', status: 'success' },
      { id: '5', time: 'Hace 2 horas', status: 'processing' },
    ],
  });
  assert.deepEqual(fromActivities, {
    active: 1,
    total: 4,
    errors: 6,
    uptime: 75,
    connected: 1,
    partial: 1,
    offline: 2,
  });

  const fromIntegrationsOnly = summarizeIntegrations({
    integrations: [
      { id: 'drive', status: 'connected', errors: 0 },
      { id: 'make', status: 'partial', errors: 0 },
      { id: 'revit', status: 'disconnected', errors: 0 },
    ],
    activities: [{ id: '1', time: 'Ahora', status: 'processing' }],
  });
  assert.equal(fromIntegrationsOnly.uptime, 50);

  assert.deepEqual(summarizeIntegrations({ integrations: [], activities: [] }), {
    active: 0,
    total: 0,
    errors: 0,
    uptime: 0,
    connected: 0,
    partial: 0,
    offline: 0,
  });

  assert.equal(computeActivityChartPoints([]), '');
  assert.equal(computeActivityChartPoints(null), '');

  const pointsString = computeActivityChartPoints([
    { time: 'Ahora' },
    { time: 'Hace 15 min' },
    { time: 'Hace 45 minutos' },
    { time: 'Hace 1 hora' },
    { time: 'Hace 2 horas' },
    { time: 'Hace 4 horas' },
    { time: 'Ayer, 6:00 PM' },
    { time: 'Hace 6 horas' },
  ]);
  const coords = pointsString.split(' ');
  assert.equal(coords.length, 12);
  // buckets: [0]=1('Hace 6 horas',67), [1]=1('Ayer',67), [6]=1('4 horas',67), [8]=1('2 horas',67), [9]=1('1 hora',67), [10]=1('45 min',67), [11]=2('Ahora'+'15 min',49)
  assert.equal(coords[0], '0,67');
  assert.equal(coords[1], '28,67');
  assert.equal(coords[6], '168,67');
  assert.equal(coords[8], '224,67');
  assert.equal(coords[9], '252,67');
  assert.equal(coords[10], '280,67');
  assert.equal(coords[11], '308,49');

  const server = await createServer({ server: { middlewareMode: true, hmr: false }, appType: 'custom' });
  try {
    const { StatusPanel } = await server.ssrLoadModule('/src/views/common/integrations/index.js');

    const operationalHtml = renderToStaticMarkup(
      React.createElement(StatusPanel, {
        summary: { active: 1, total: 2, errors: 1, uptime: 80.0, connected: 1, partial: 1, offline: 0 },
        activities: [{ time: 'Ahora' }],
        hasActivities: true,
      })
    );
    assert.ok(operationalHtml.includes('75% online'));
    assert.ok(operationalHtml.includes('80.0%'));
    assert.ok(operationalHtml.includes('Operativo'));
    assert.ok(operationalHtml.includes('308,67'));

    const degradedHtml = renderToStaticMarkup(
      React.createElement(StatusPanel, {
        summary: { active: 0, total: 3, errors: 4, uptime: 50.0, connected: 0, partial: 1, offline: 2 },
        activities: [],
        hasActivities: false,
      })
    );
    assert.ok(degradedHtml.includes('17% online'));
    assert.ok(degradedHtml.includes('50.0%'));
    assert.ok(degradedHtml.includes('Requiere atención'));
    assert.ok(degradedHtml.includes('Sin peticiones registradas'));
  } finally {
    await server.close();
  }
});

test('getActivityTimestamp clasifica correctamente ahora, minutos, horas, ayer y timestamps explícitos', async () => {
  const server = await createServer({ server: { middlewareMode: true, hmr: false }, appType: 'custom' });
  try {
    const { getActivityTimestamp } = await server.ssrLoadModule('/src/views/common/integrations/IntegrationActivityList.jsx');

    const nowTs = getActivityTimestamp({ id: 'a-1', time: 'Ahora' }, 0);
    const momentTs = getActivityTimestamp({ id: 'a-2', time: 'hace un momento' }, 1);
    const minTs = getActivityTimestamp({ id: 'a-3', time: 'Hace 10 minutos' }, 2);
    const hrTs = getActivityTimestamp({ id: 'a-4', time: 'Hace 1 hora' }, 3);
    const yesterdayTs = getActivityTimestamp({ id: 'a-5', time: 'Ayer, 6:00 PM' }, 4);

    assert.ok(nowTs > momentTs, 'Ahora (index 0) debe ser más reciente que hace un momento (index 1)');
    assert.ok(momentTs > minTs, 'hace un momento debe ser más reciente que Hace 10 minutos');
    assert.ok(minTs > hrTs, 'Hace 10 minutos debe ser más reciente que Hace 1 hora');
    assert.ok(hrTs > yesterdayTs, 'Hace 1 hora debe ser más reciente que Ayer');

    const isoTs = getActivityTimestamp({ id: 'iso-1', timestamp: '2026-10-01T12:00:00.000Z', time: 'Ayer' }, 0);
    assert.equal(isoTs, new Date('2026-10-01T12:00:00.000Z').getTime());

    const createdAtTs = getActivityTimestamp({ id: 'iso-2', created_at: '2026-09-15T08:30:00.000Z', time: 'Ahora' }, 0);
    assert.equal(createdAtTs, new Date('2026-09-15T08:30:00.000Z').getTime());

    const numericIdTs = getActivityTimestamp({ id: 'evt-1700000000000', time: '' }, 0);
    assert.equal(numericIdTs, 1700000000000);
  } finally {
    await server.close();
  }
});

test('IntegrationActivityList filtra por conexión, ordena por fecha/estado y gestiona ClearFiltersButton', async () => {
  const server = await createServer({ server: { middlewareMode: true, hmr: false }, appType: 'custom' });
  try {
    const {
      default: IntegrationActivityList,
      activitySortCategories,
      filterAndSortActivities,
    } = await server.ssrLoadModule('/src/views/common/integrations/IntegrationActivityList.jsx');
    const { default: SortDropdown } = await server.ssrLoadModule('/src/components/common/SortDropdown.jsx');
    const { default: ClearFiltersButton } = await server.ssrLoadModule('/src/components/common/ClearFiltersButton.jsx');
    const { LanguageProvider } = await server.ssrLoadModule('/src/context/LanguageContext.jsx');

    const base = createIntegrationsData();
    const unsortedActivities = [
      { id: 'act-old', integrationId: 'make', title: 'Evento ayer', time: 'Ayer, 6:00 PM', status: 'success' },
      { id: 'act-err', integrationId: 'drive', title: 'Fallo de sync', time: 'Hace 2 horas', status: 'error' },
      { id: 'act-proc', integrationId: 'revit', title: 'Modelo en cola', time: 'Hace 15 min', status: 'processing' },
      { id: 'act-now', integrationId: 'drive', title: 'Sync reciente', time: 'Ahora', status: 'success' },
    ];

    // 1. Filtrado por conexión (integrationId)
    const onlyDrive = filterAndSortActivities(unsortedActivities, { connectionFilter: 'drive' });
    assert.deepEqual(onlyDrive.map((item) => item.id), ['act-now', 'act-err']);
    const onlyMake = filterAndSortActivities(unsortedActivities, { connectionFilter: 'make' });
    assert.deepEqual(onlyMake.map((item) => item.id), ['act-old']);
    const allConnections = filterAndSortActivities(unsortedActivities, { connectionFilter: 'ALL' });
    assert.equal(allConnections.length, 4);

    // 2. Ordenamiento por fecha descendente y ascendente
    const byDateDesc = filterAndSortActivities(unsortedActivities, { sortOrder: 'activity-date-desc' });
    assert.deepEqual(byDateDesc.map((item) => item.id), ['act-now', 'act-proc', 'act-err', 'act-old']);

    const byDateAsc = filterAndSortActivities(unsortedActivities, { sortOrder: 'activity-date-asc' });
    assert.deepEqual(byDateAsc.map((item) => item.id), ['act-old', 'act-err', 'act-proc', 'act-now']);

    // 3. Ordenamiento por estado (errores primero / exitosas primero)
    const byErrorFirst = filterAndSortActivities(unsortedActivities, { sortOrder: 'activity-status-desc' });
    assert.deepEqual(byErrorFirst.map((item) => item.id), ['act-err', 'act-proc', 'act-now', 'act-old']);

    const bySuccessFirst = filterAndSortActivities(unsortedActivities, { sortOrder: 'activity-status-asc' });
    assert.deepEqual(bySuccessFirst.map((item) => item.id), ['act-now', 'act-old', 'act-proc', 'act-err']);

    // 4. Render SSR de IntegrationActivityList: selector de conexión, SortDropdown y ordenamiento por defecto
    const defaultHtml = renderToStaticMarkup(
      React.createElement(IntegrationActivityList, {
        activities: unsortedActivities,
        integrations: base.integrations,
        query: '',
        onClearQuery: () => {},
      })
    );
    assert.ok(defaultHtml.includes('aria-label="Filtrar actividades por conexión"'));
    assert.ok(defaultHtml.includes('Todas las conexiones'));
    assert.ok(defaultHtml.includes('Google Drive'));
    assert.ok(defaultHtml.includes('Revit / BIM Data'));
    assert.ok(defaultHtml.includes('Make (Integromat)'));
    assert.ok(defaultHtml.includes('Ordenar actividades de integración'));
    assert.ok(defaultHtml.includes('Más recientes'));
    assert.ok(defaultHtml.includes('Limpiar filtro'), 'Debe renderizar siempre ClearFiltersButton aunque no haya filtros activos');
    assert.ok(
      defaultHtml.includes('disabled=""') && defaultHtml.includes('aria-disabled="true"'),
      'ClearFiltersButton debe estar deshabilitado cuando no hay filtros activos'
    );

    // Verificar orden cronológico descendente en el DOM renderizado
    const posNow = defaultHtml.indexOf('Sync reciente');
    const posProc = defaultHtml.indexOf('Modelo en cola');
    const posErr = defaultHtml.indexOf('Fallo de sync');
    const posOld = defaultHtml.indexOf('Evento ayer');
    assert.ok(posNow < posProc && posProc < posErr && posErr < posOld, 'Debe ordenar por fecha descendente en el render inicial');

    // 5. ClearFiltersButton se habilita cuando hay búsqueda activa y ejecuta limpieza solo si está habilitado
    let clearedCalled = false;
    const withQueryHtml = renderToStaticMarkup(
      React.createElement(IntegrationActivityList, {
        activities: unsortedActivities,
        integrations: base.integrations,
        query: 'Torre',
        onClearQuery: () => {
          clearedCalled = true;
        },
      })
    );
    assert.ok(withQueryHtml.includes('Limpiar filtro'), 'Debe mostrar ClearFiltersButton cuando query no está vacío');
    assert.ok(
      withQueryHtml.includes('aria-disabled="false"') && !withQueryHtml.includes('disabled=""'),
      'ClearFiltersButton debe estar habilitado cuando query no está vacío'
    );

    let disabledClickCount = 0;
    const disabledBtn = ClearFiltersButton({
      onClick: () => {
        disabledClickCount += 1;
      },
      label: 'Limpiar filtro',
      disabled: true,
    });
    assert.equal(disabledBtn.props.disabled, true);
    assert.equal(disabledBtn.props['aria-disabled'], true);
    assert.equal(disabledBtn.props.onClick, undefined);
    disabledBtn.props.onClick?.();
    assert.equal(disabledClickCount, 0, 'No debe ejecutar onClick cuando disabled=true');

    const enabledBtn = ClearFiltersButton({
      onClick: () => {
        clearedCalled = true;
      },
      label: 'Limpiar filtro',
      disabled: false,
    });
    assert.equal(enabledBtn.props.disabled, false);
    assert.equal(enabledBtn.props['aria-disabled'], false);
    enabledBtn.props.onClick();
    assert.equal(clearedCalled, true, 'Debe ejecutar onClick cuando disabled=false');

    // 6. Traducciones en inglés para Select, SortDropdown y ClearFiltersButton
    const enHtml = renderToStaticMarkup(
      React.createElement(
        LanguageProvider,
        { initialLang: 'en' },
        React.createElement(IntegrationActivityList, {
          activities: unsortedActivities,
          integrations: base.integrations,
          query: 'Sync',
          onClearQuery: () => {},
        })
      )
    );
    assert.ok(enHtml.includes('All connections'));
    assert.ok(enHtml.includes('Filter activities by connection'));
    assert.ok(enHtml.includes('Sort integration activities'));
    assert.ok(enHtml.includes('Most recent'));
    assert.ok(enHtml.includes('Clear filter'));

    // 7. SortDropdown muestra etiquetas traducidas para las categorías de actividad
    const sortStatusHtml = renderToStaticMarkup(
      React.createElement(
        LanguageProvider,
        { initialLang: 'en' },
        React.createElement(SortDropdown, {
          value: 'activity-status-desc',
          onChange: () => {},
          categories: activitySortCategories,
        })
      )
    );
    assert.ok(sortStatusHtml.includes('Errors first'));
  } finally {
    await server.close();
  }
});

test('createEmptyIntegrations retorna estado inicial limpio sin mocks y con métricas reales', async () => {
  const server = await createServer({ server: { middlewareMode: true, hmr: false }, appType: 'custom' });
  try {
    const { createEmptyIntegrations } = await server.ssrLoadModule('/src/controllers/useIntegrationsController.js');
    const empty = createEmptyIntegrations();

    assert.equal(empty.uptime, 0);
    assert.deepEqual(empty.activities, []);
    assert.equal(empty.integrations.length, 3);

    for (const item of empty.integrations) {
      assert.equal(item.status, 'offline');
      assert.equal(item.errors, 0);
      assert.equal(item.lastActivity, 'Sin actividad');
    }

    const drive = empty.integrations.find((item) => item.id === 'drive');
    assert.equal(drive.endpoint, 'Sin cuenta conectada');
    assert.deepEqual(drive.metrics, [
      { key: 'account', value: 0, label: 'cuentas conectadas' },
      { key: 'api', value: 'Pendiente', label: 'Google Drive API' },
    ]);

    const revit = empty.integrations.find((item) => item.id === 'revit');
    assert.equal(revit.endpoint, 'Bóveda BIM Colaborativa');
    assert.deepEqual(revit.metrics, [
      { key: 'models', value: 0, label: 'modelos activos' },
      { key: 'api', value: 'Pendiente', label: 'Estado API' },
    ]);

    const make = empty.integrations.find((item) => item.id === 'make');
    assert.equal(make.endpoint, 'Sin webhook configurado');
    assert.equal(make.frequency, 'Tiempo real');
    assert.deepEqual(make.metrics, [
      { key: 'scenarios', value: 0, label: 'escenarios' },
      { key: 'errors', value: 0, label: 'con error' },
    ]);
  } finally {
    await server.close();
  }
});

test('useIntegrationsController inicia con createEmptyIntegrations y purga caché mock obsoleta de localStorage', async () => {
  const server = await createServer({ server: { middlewareMode: true, hmr: false }, appType: 'custom' });
  const originalWindow = globalThis.window;

  const readControllerState = (storedValue, options = {}) => {
    globalThis.window = {
      localStorage: {
        getItem: (key) => (key === 'project_planner_integrations' ? storedValue : null),
        setItem: () => {},
      },
    };
    const captured = [];
    function Harness({ onCapture }) {
      const controller = useIntegrationsControllerFn(options);
      onCapture(controller.integrationsData);
      return null;
    }
    renderToStaticMarkup(React.createElement(Harness, { onCapture: (state) => captured.push(state) }));
    return captured[0];
  };

  let useIntegrationsControllerFn;
  let createEmptyIntegrationsFn;
  try {
    ({
      useIntegrationsController: useIntegrationsControllerFn,
      createEmptyIntegrations: createEmptyIntegrationsFn,
    } = await server.ssrLoadModule('/src/controllers/useIntegrationsController.js'));

    // 1. Sin caché previa (incluso con hideMocks=false) debe iniciar con createEmptyIntegrations()
    const freshState = readControllerState(null, { hideMocks: false });
    assert.deepEqual(freshState, createEmptyIntegrationsFn());

    // 2. Caché mock antigua con uptime 99.84 debe purgarse
    const staleUptimeCache = JSON.stringify({
      integrations: createEmptyIntegrationsFn().integrations,
      activities: [],
      uptime: 99.84,
    });
    const purgedByUptime = readControllerState(staleUptimeCache);
    assert.deepEqual(purgedByUptime, createEmptyIntegrationsFn());

    // 3. Caché mock antigua con actividad "Torre Reforma" debe purgarse
    const staleTorreCache = JSON.stringify({
      integrations: createEmptyIntegrationsFn().integrations,
      activities: [{ id: 'old-1', integrationId: 'drive', title: 'Sincronización Torre Reforma', status: 'success' }],
      uptime: 0,
    });
    const purgedByTorre = readControllerState(staleTorreCache);
    assert.deepEqual(purgedByTorre, createEmptyIntegrationsFn());

    // 4. Caché válida de sesión real debe preservarse
    const validSession = {
      integrations: createEmptyIntegrationsFn().integrations.map((item) =>
        item.id === 'drive' ? { ...item, status: 'connected', endpoint: 'real@company.com' } : item
      ),
      activities: [{ id: 'real-1', integrationId: 'drive', title: 'Google Drive verificado', status: 'success' }],
      uptime: 0,
    };
    const preserved = readControllerState(JSON.stringify(validSession));
    assert.deepEqual(preserved, validSession);
  } finally {
    if (originalWindow === undefined) {
      delete globalThis.window;
    } else {
      globalThis.window = originalWindow;
    }
    await server.close();
  }
});

test('summarizeIntegrations retorna uptime 0 cuando todo está offline y sin actividad, y calcula porcentaje dinámico al conectar o registrar actividad', async () => {
  const server = await createServer({ server: { middlewareMode: true, hmr: false }, appType: 'custom' });
  try {
    const { createEmptyIntegrations } = await server.ssrLoadModule('/src/controllers/useIntegrationsController.js');

    // Estado inicial vacío -> uptime 0
    const empty = createEmptyIntegrations();
    assert.deepEqual(summarizeIntegrations(empty), {
      active: 0,
      total: 3,
      errors: 0,
      uptime: 0,
      connected: 0,
      partial: 0,
      offline: 3,
    });

    // Con integraciones conectadas y sin actividades de éxito/error -> uptime dinámico por estado
    const oneConnected = {
      ...empty,
      integrations: empty.integrations.map((item) =>
        item.id === 'drive' ? { ...item, status: 'connected' } : item
      ),
    };
    assert.equal(summarizeIntegrations(oneConnected).uptime, 33.3);

    // Con actividades de sesión (3 success, 1 error) -> 75% uptime dinámico
    const withActivities = {
      ...oneConnected,
      activities: [
        { id: '1', status: 'success' },
        { id: '2', status: 'success' },
        { id: '3', status: 'success' },
        { id: '4', status: 'error' },
      ],
    };
    assert.equal(summarizeIntegrations(withActivities).uptime, 75);
  } finally {
    await server.close();
  }
});

test('resolveLastActivity localiza "Nunca", "Hace un momento" y "Reciente" en inglés y español', async () => {
  const { readFileSync } = await import('node:fs');
  const es = JSON.parse(readFileSync(new URL('../src/locales/es.json', import.meta.url), 'utf8'));
  const en = JSON.parse(readFileSync(new URL('../src/locales/en.json', import.meta.url), 'utf8'));
  const makeTranslator = (dict) => (key, fallback) => {
    const value = key.split('.').reduce((acc, part) => acc?.[part], dict);
    return value ?? fallback ?? key;
  };
  const tEs = makeTranslator(es);
  const tEn = makeTranslator(en);

  const server = await createServer({ server: { middlewareMode: true, hmr: false }, appType: 'custom' });
  try {
    const { resolveLastActivity } = await server.ssrLoadModule('/src/views/common/integrations/constants.js');
    assert.equal(resolveLastActivity('Nunca', tEn), 'Never');
    assert.equal(resolveLastActivity('Nunca', tEs), 'Nunca');
    assert.equal(resolveLastActivity('never', tEn), 'Never');
    assert.equal(resolveLastActivity('Hace un momento', tEn), 'Just now');
    assert.equal(resolveLastActivity('Hace un momento', tEs), 'Hace un momento');
    assert.equal(resolveLastActivity('Reciente', tEn), 'Recent');
    assert.equal(resolveLastActivity('Reciente', tEs), 'Reciente');
  } finally {
    await server.close();
  }
});


