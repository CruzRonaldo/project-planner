import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

function createTestServer() {
  return createServer({
    root: rootDir,
    server: { middlewareMode: true, hmr: false },
    appType: 'custom',
  });
}

function getDeepKeys(obj, prefix = '') {
  let keys = [];
  for (const [key, value] of Object.entries(obj)) {
    const newKey = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      keys = keys.concat(getDeepKeys(value, newKey));
    } else {
      keys.push(newKey);
    }
  }
  return keys;
}

test('es.json y en.json tienen una estructura de claves simétrica y completa', () => {
  const esPath = path.resolve(__dirname, '../src/locales/es.json');
  const enPath = path.resolve(__dirname, '../src/locales/en.json');

  assert.ok(fs.existsSync(esPath), 'es.json debe existir');
  assert.ok(fs.existsSync(enPath), 'en.json debe existir');

  const es = JSON.parse(fs.readFileSync(esPath, 'utf-8'));
  const en = JSON.parse(fs.readFileSync(enPath, 'utf-8'));

  const esKeys = getDeepKeys(es).sort();
  const enKeys = getDeepKeys(en).sort();

  assert.deepEqual(esKeys, enKeys, 'Las claves entre es.json y en.json deben ser exactamente idénticas');

  // Validar módulos requeridos
  const requiredModules = [
    'common',
    'nav',
    'topbar',
    'profile',
    'configuration',
    'auth',
    'portfolio',
    'operations',
    'dashboard',
    'statuses',
    'sort',
    'toasts',
    'strategicPlanning',
    'technicalTeam',
    'humanResources',
    'rolesManagement',
    'pagination',
    'chatWidget',
    'integrations',
    'manual',
    'months',
    'notifications',
  ];
  for (const mod of requiredModules) {
    assert.ok(es[mod], `es.json debe contener el módulo ${mod}`);
    assert.ok(en[mod], `en.json debe contener el módulo ${mod}`);
  }

  assert.equal(es.common.year, 'Año');
  assert.equal(en.common.year, 'Year');
  assert.equal(es.months['1'], 'Ene');
  assert.equal(en.months['1'], 'Jan');

  // Validar claves específicas de common
  const commonKeys = ['save', 'cancel', 'edit', 'delete', 'search', 'loading', 'close', 'back', 'actions', 'confirm', 'refresh'];
  for (const k of commonKeys) {
    assert.ok(es.common[k], `common.${k} debe estar definido en es.json`);
    assert.ok(en.common[k], `common.${k} debe estar definido en en.json`);
  }

  // Validar claves de nav
  const navKeys = ['dashboard', 'planning', 'portfolio', 'operations', 'technicalTeam', 'humanResources', 'integrations', 'manual', 'settings', 'roles'];
  for (const k of navKeys) {
    assert.ok(es.nav[k], `nav.${k} debe estar definido en es.json`);
    assert.ok(en.nav[k], `nav.${k} debe estar definido en en.json`);
  }

  // Validar claves de topbar
  const topbarKeys = ['searchDefault', 'searchManual', 'searchShortcut', 'menu'];
  for (const k of topbarKeys) {
    assert.ok(es.topbar[k], `topbar.${k} debe estar definido en es.json`);
    assert.ok(en.topbar[k], `topbar.${k} debe estar definido en en.json`);
  }

  // Validar claves de profile
  const profileKeys = ['profileSettings', 'manual', 'notifications', 'roles', 'logout'];
  for (const k of profileKeys) {
    assert.ok(es.profile[k], `profile.${k} debe estar definido en es.json`);
    assert.ok(en.profile[k], `profile.${k} debe estar definido en en.json`);
  }

  // Validar claves de configuration
  const configurationKeys = [
    'title',
    'systemPreferences',
    'language',
    'globalLanguage',
    'globalLanguageDesc',
    'globalBadge',
    'spanish',
    'english',
    'timeZone',
    'fontSize',
    'fontSizeDesc',
    'fontSizeReset',
    'themeTitle',
  ];
  for (const k of configurationKeys) {
    assert.ok(es.configuration[k], `configuration.${k} debe estar definido en es.json`);
    assert.ok(en.configuration[k], `configuration.${k} debe estar definido en en.json`);
  }

  // Validar claves de auth
  const authKeys = [
    'welcome',
    'loginTitle',
    'selectRole',
    'admin',
    'projectManager',
    'adminRoleDesc',
    'user',
    'technicalTeam',
    'userRoleDesc',
    'email',
    'emailPlaceholder',
    'password',
    'rememberMe',
    'forgotPassword',
    'loginButton',
    'verifying',
    'needAccess',
    'contactAdmin',
    'version',
    'initializing',
    'twoFactorTitle',
    'twoFactorDesc',
    'verifyCode',
    'verifyingCode',
    'firstTime2FA',
    'generatingQr',
    'scanQr',
    'hideQr',
    'lostDevice',
    'sendingEmailCode',
    'backToLogin',
    'recoveryTitle',
    'recoveryDesc',
    'recoveryCodeInput',
    'verifyRecovery',
    'resetting2FA',
    'resendCode',
    'backToTOTP',
    'forgotModalTitle1',
    'forgotModalTitle2',
    'forgotModalTitle3',
    'forgotStep1',
    'forgotStep2',
    'forgotStep3',
    'forgotEmailDesc',
    'corporateEmail',
    'codeSentNotice',
    'codeVerifiedNotice',
    'newPassword',
    'newPasswordPlaceholder',
    'confirmNewPassword',
    'confirmPasswordPlaceholder',
    'cancel',
    'back',
    'sendCode',
    'verifyCodeBtn',
    'resetPasswordBtn',
    'supportTitle',
    'supportSubtitle',
    'supportDesc',
    'supportLabel',
    'phoneSupportLabel',
    'hoursLabel',
    'hoursValue',
    'securityNoticeTitle',
    'securityNoticeDesc',
    'understood',
  ];
  for (const k of authKeys) {
    assert.ok(es.auth[k], `auth.${k} debe estar definido en es.json`);
    assert.ok(en.auth[k], `auth.${k} debe estar definido en en.json`);
  }

  // Validar claves de portfolio
  const portfolioKeys = [
    'title',
    'subtitle',
    'createProject',
    'sync',
    'syncing',
    'all',
    'sortLabel',
    'recentChanges',
    'yourLeadership',
    'usedBudget',
    'totalBudget',
    'progress',
    'duration',
    'members',
    'noProjects',
    'noProjectsDesc',
    'projectCode',
    'technicalArea',
    'projectName',
    'startDate',
    'endDate',
    'estimatedBudget',
    'initialStatus',
    'projectLeader',
    'driveFolder',
    'description',
    'autogenerated',
    'newProjectTitle',
    'editProjectTitle',
    'deleteProjectTitle',
    'confirmDelete',
  ];
  for (const k of portfolioKeys) {
    assert.ok(es.portfolio[k], `portfolio.${k} debe estar definido en es.json`);
    assert.ok(en.portfolio[k], `portfolio.${k} debe estar definido en en.json`);
  }

  // Validar claves de operations
  const operationsKeys = [
    'title',
    'subtitle',
    'newWorkOrder',
    'generateDailyReport',
    'tasksInProgress',
    'tasksCompleted',
    'openIncidents',
    'operationalEfficiency',
    'criticalSchedule',
    'activeWorkOrders',
    'criticalAlerts',
    'qualityAssurance',
    'sortWorkOrders',
    'associatedProject',
    'operationType',
    'orderTitle',
    'technicalArea',
    'responsible',
    'startDate',
    'deadline',
    'priorityLevel',
    'criticalPath',
    'linkedDocument',
    'instructions',
    'issueWorkOrder',
    'workOrderDetail',
    'onTime',
    'accelerated',
    'scheduled',
    'criticalScheduleSubtitle',
    'activityWork',
    'totalProgress',
    'noActivities',
    'urgent',
    'attend',
    'review',
    'noActiveAlerts',
    'isoNorm',
    'approved',
    'pending',
    'noQualityChecks',
  ];
  for (const k of operationsKeys) {
    assert.ok(es.operations[k], `operations.${k} debe estar definido en es.json`);
    assert.ok(en.operations[k], `operations.${k} debe estar definido en en.json`);
  }

  // Validar claves de dashboard
  const dashboardKeys = [
    'executiveSummaryAria',
    'kpiActiveProjects',
    'kpiTotalProjects',
    'kpiPendingMilestones',
    'kpiTotalMilestones',
    'kpiTotalBudget',
    'kpiUsedBudget',
    'kpiAvgProgress',
    'projectCalendarTitle',
    'projectCalendarSubtitle',
    'viewPlanning',
    'criticalAlertsTitle',
    'statusRisk',
    'statusPaused',
    'statusCompleted',
    'statusOnTime',
    'progressByProjectTitle',
    'budgetControlTitle',
  ];
  for (const k of dashboardKeys) {
    assert.ok(es.dashboard[k], `dashboard.${k} debe estar definido en es.json`);
    assert.ok(en.dashboard[k], `dashboard.${k} debe estar definido en en.json`);
  }

  // Validar claves de statuses
  const statusesKeys = [
    'planning',
    'active',
    'paused',
    'completed',
    'risk',
    'inProgress',
    'planned',
    'pending',
    'upcoming',
    'high',
    'medium',
    'low',
    'available',
    'assigned',
    'vacation',
    'medicalLeave',
  ];
  for (const k of statusesKeys) {
    assert.ok(es.statuses[k], `statuses.${k} debe estar definido en es.json`);
    assert.ok(en.statuses[k], `statuses.${k} debe estar definido en en.json`);
  }

  // Validar claves de sort
  const sortKeys = [
    'budget_desc',
    'budget_asc',
    'name_asc',
    'name_desc',
    'progress_desc',
    'progress_asc',
    'end_date_asc',
    'end_date_desc',
    'prio_desc',
    'prio_asc',
    'due_asc',
    'due_desc',
    'title_asc',
    'title_desc',
    'date_asc',
    'date_desc',
    'status_asc',
    'status_desc',
    'dedication_desc',
    'dedication_asc',
    'area_asc',
    'area_desc',
    'availability-desc',
    'availability-asc',
  ];
  for (const k of sortKeys) {
    assert.ok(es.sort[k], `sort.${k} debe estar definido en es.json`);
    assert.ok(en.sort[k], `sort.${k} debe estar definido en en.json`);
  }

  // Validar claves de toasts
  const toastsKeys = [
    'Orden Emitida',
    'Reporte Exportado',
    'Estado Actualizado',
    'Proyecto Creado',
    'Proyecto Actualizado',
    'Proyecto Eliminado',
    'Sincronización Completa',
    'Cronograma Reajustado',
    'Hito Registrado',
    'Integrante Registrado',
    'Reasignación Exitosa',
    'Contraseña Actualizada',
    'Perfil Actualizado',
    'Éxito',
    'Error',
    'Información',
    'Advertencia',
    'Operación Exitosa',
    'projectsSynced',
    'projectsSyncedMsg',
    'syncErrorMsg',
    'Proyectos Actualizados',
    'Los proyectos se han sincronizado exitosamente.',
    'Estado de Google Drive',
    'driveStatusTitle',
    'driveConnected',
    'driveConnectedWithEmail',
    'driveNotConnected',
    'driveError',
    'Autorización Iniciada',
    'authStarted',
    'authStartedMsg',
    'Prueba Completada',
    'testCompleted',
    'testCompletedMsg',
    'Bóveda Actualizada',
    'vaultUpdated',
    'vaultUpdatedMsg',
    'vaultUpdateError',
    'Nombre Requerido',
    'nameRequired',
    'nameRequiredMsg',
    'Carpeta Creada',
    'folderCreated',
    'folderCreatedMsg',
    'Archivo Requerido',
    'fileRequired',
    'fileRequiredMsg',
    'Archivo Subido',
    'fileUploaded',
    'fileUploadedMsg',
    'Elemento Renombrado',
    'itemRenamed',
    'itemRenamedMsg',
    'Elemento Eliminado',
    'itemDeleted',
    'itemDeletedMsg',
  ];
  for (const k of toastsKeys) {
    assert.ok(es.toasts[k], `toasts.${k} debe estar definido en es.json`);
    assert.ok(en.toasts[k], `toasts.${k} debe estar definido en en.json`);
  }

  // Validar claves de rolesManagement
  const rolesManagementKeys = [
    'title',
    'subtitle',
    'adminExclusiveAccess',
    'summaryAriaLabel',
    'users',
    'subAdmins',
    'online',
    'offline',
    'systemUsers',
    'systemUsersDesc',
    'currentRole',
    'admin',
    'subAdmin',
    'technicalTeam',
    'mainAdmin',
    'subAdminToggleAriaLabel',
    'enabled',
    'disabled',
  ];
  for (const k of rolesManagementKeys) {
    assert.ok(es.rolesManagement[k], `rolesManagement.${k} debe estar definido en es.json`);
    assert.ok(en.rolesManagement[k], `rolesManagement.${k} debe estar definido en en.json`);
  }

  // Validar claves de strategicPlanning
  const strategicPlanningKeys = [
    'allProjects',
    'showingAllProjects',
    'noMilestones',
    'masterScheduleTitle',
    'masterScheduleSubtitle',
    'adjustSchedule',
    'analyzeTimelines',
    'exportPdf',
    'newGlobalMilestone',
    'scheduleFilters',
    'filterByProject',
    'selectYear',
    'globalMilestones',
    'budgetControl',
    'budget',
    'available',
    'executed',
    'total',
    'adjustScheduleTitle',
    'adjustScheduleSubtitle',
    'saveAdjustments',
    'projectToReschedule',
    'startMonth',
    'totalDuration',
    'timelineAnalysisTitle',
    'timelineAnalysisSubtitle',
    'calculateProposal',
    'adjustmentsHistoryTitle',
    'adjustmentsHistorySubtitle',
  ];
  for (const k of strategicPlanningKeys) {
    assert.ok(es.strategicPlanning[k], `strategicPlanning.${k} debe estar definido en es.json`);
    assert.ok(en.strategicPlanning[k], `strategicPlanning.${k} debe estar definido en en.json`);
  }

  // Validar claves de pagination
  const paginationKeys = ['ariaLabel', 'pageOf', 'itemsOf', 'totalOnly', 'prevPage', 'nextPage'];
  for (const k of paginationKeys) {
    assert.ok(es.pagination[k], `pagination.${k} debe estar definido en es.json`);
    assert.ok(en.pagination[k], `pagination.${k} debe estar definido en en.json`);
  }

  // Validar claves de chatWidget
  const chatWidgetKeys = [
    'title',
    'statusOnline',
    'welcomeMessage',
    'optimisticAnalysis',
    'errorProcessing',
    'inputPlaceholder',
    'clearHistory',
    'clearHistoryAria',
    'openAssistantAria',
    'closeAssistantAria',
    'sendAria',
  ];
  for (const k of chatWidgetKeys) {
    assert.ok(es.chatWidget[k], `chatWidget.${k} debe estar definido en es.json`);
    assert.ok(en.chatWidget[k], `chatWidget.${k} debe estar definido en en.json`);
  }

  // Validar claves de integrations
  const integrationsKeys = [
    'pageTitle',
    'pageSubtitle',
    'searchPlaceholder',
    'integratedServicesAria',
    'noIntegrationsFound',
    'configure',
    'configureIntegration',
    'integrationSettings',
    'statusPanelTitle',
    'totalConnected',
    'totalAvailable',
    'totalIssues',
    'activityListTitle',
    'noActivities',
    'clearFilter',
    'testConnection',
    'saveSettings',
    'disconnect',
    'connect',
    'syncNow',
    'val_active',
    'val_pending',
    'metric_api',
    'metric_drive_api',
    'metric_account',
    'metric_account_plural',
    'metric_models_singular',
    'noConnectedAccount',
    'noAuthorizedAccount',
    'noActivity',
    'noConnection',
    'verifiedNow',
    'tenMinutesAgo',
    'oneHourAgo',
    'twoHoursAgo',
  ];
  for (const k of integrationsKeys) {
    assert.ok(es.integrations[k], `integrations.${k} debe estar definido en es.json`);
    assert.ok(en.integrations[k], `integrations.${k} debe estar definido en en.json`);
  }

  // Validar claves de manual
  const manualKeys = [
    'pageTitle',
    'systemDocs',
    'searchPlaceholder',
    'printChapter',
    'closeIndex',
    'closeIndexAria',
    'filterRoleAll',
    'filterRoleAdmin',
    'filterRoleTechnical',
    'prevChapter',
    'nextChapter',
    'goToView',
    'noResults',
    'clearSearch',
    'zoomImageAria',
    'closeZoomAria',
  ];
  for (const k of manualKeys) {
    assert.ok(es.manual[k], `manual.${k} debe estar definido en es.json`);
    assert.ok(en.manual[k], `manual.${k} debe estar definido en en.json`);
  }

  // Validar claves de notifications
  const notificationsKeys = [
    'projectAssignedTitle',
    'upcomingReturnTitle',
    'auditPrefix',
    'milestonePrefix',
    'recent',
    'today',
    'soon',
    'inDays',
    'projectAssignedDetail',
    'personnelReturnDetail',
    'auditPasswordChangeTitle',
    'auditEmailChangeTitle',
    'auditProfileUpdateTitle',
    'auditPasswordChangeDetail',
    'auditEmailChangeDetail',
    'milestoneDetail',
    'reasonVacation',
    'reasonMedicalLeave',
    'reasonPaidLeave',
    'reasonUnpaidLeave',
    'reasonPersonalPermission',
    'reasonTraining',
    'reasonOther',
  ];
  for (const k of notificationsKeys) {
    assert.ok(es.notifications[k], `notifications.${k} debe estar definido en es.json`);
    assert.ok(en.notifications[k], `notifications.${k} debe estar definido en en.json`);
  }
});

test('LanguageContext resuelve claves anidadas correctamente en español e inglés', async () => {
  const server = await createTestServer();
  try {
    const { createTranslate } = await server.ssrLoadModule('/src/context/LanguageContext.jsx');

    const tEs = createTranslate('es');
    assert.equal(tEs('common.save'), 'Guardar');
    assert.equal(tEs('nav.dashboard'), 'Inicio');
    assert.equal(tEs('nav.technicalTeam'), 'Equipo Técnico');
    assert.equal(tEs('profile.logout'), 'Cerrar sesión');
    assert.equal(tEs('topbar.searchManual'), 'Manual de Usuario');

    const tEn = createTranslate('en');
    assert.equal(tEn('common.save'), 'Save');
    assert.equal(tEn('nav.dashboard'), 'Dashboard');
    assert.equal(tEn('nav.technicalTeam'), 'Technical Team');
    assert.equal(tEn('profile.logout'), 'Log out');
    assert.equal(tEn('topbar.searchManual'), 'User Manual');
  } finally {
    await server.close();
  }
});

test('LanguageContext soporta interpolación de parámetros en cadenas', async () => {
  const server = await createTestServer();
  try {
    const { createTranslate } = await server.ssrLoadModule('/src/context/LanguageContext.jsx');

    const mockDicts = {
      es: { greeting: 'Hola, {name}! Tienes {count} tareas.' },
      en: { greeting: 'Hello, {name}! You have {count} tasks.' },
    };

    const tEs = createTranslate('es', mockDicts);
    assert.equal(tEs('greeting', '', { name: 'Carlos', count: 5 }), 'Hola, Carlos! Tienes 5 tareas.');

    const tEn = createTranslate('en', mockDicts);
    assert.equal(tEn('greeting', '', { name: 'Alice', count: 2 }), 'Hello, Alice! You have 2 tasks.');

    // Interpolación en fallback cuando la clave no existe
    assert.equal(
      tEs('not.found', 'Bienvenido a {place}, {user}', { place: 'Madrid', user: 'Laura' }),
      'Bienvenido a Madrid, Laura'
    );
  } finally {
    await server.close();
  }
});

test('LanguageContext maneja fallback cuando una clave no existe', async () => {
  const server = await createTestServer();
  try {
    const { createTranslate } = await server.ssrLoadModule('/src/context/LanguageContext.jsx');

    const mockDicts = {
      es: { onlyInSpanish: 'Solo en español' },
      en: {},
    };

    const tEn = createTranslate('en', mockDicts);
    // Debe usar el respaldo en español si falta en inglés
    assert.equal(tEn('onlyInSpanish'), 'Solo en español');

    // Si falta en ambos y hay fallback explícito
    assert.equal(tEn('total.missing', 'Valor por defecto'), 'Valor por defecto');

    // Si falta en ambos y no hay fallback, devuelve el path
    assert.equal(tEn('total.missing'), 'total.missing');
  } finally {
    await server.close();
  }
});

test('defaultLanguageContext y useLanguage fuera de provider no crashean', async () => {
  const server = await createTestServer();
  try {
    const { defaultLanguageContext, useLanguage } = await server.ssrLoadModule('/src/context/LanguageContext.jsx');

    assert.equal(defaultLanguageContext.lang, 'es');
    assert.deepEqual(defaultLanguageContext.supportedLanguages, ['es', 'en']);
    assert.equal(typeof defaultLanguageContext.t, 'function');
    assert.equal(defaultLanguageContext.t('common.confirm'), 'Confirmar');

    // Componente consumidor sin Provider
    function TestConsumer() {
      const { lang, t } = useLanguage();
      return React.createElement('span', null, `${lang}:${t('common.save')}`);
    }

    const html = renderToStaticMarkup(React.createElement(TestConsumer));
    assert.equal(html, '<span>es:Guardar</span>');
  } finally {
    await server.close();
  }
});

test('LanguageSelector renderiza grupo accesible con botones ES y EN', async () => {
  const server = await createTestServer();
  try {
    const { default: LanguageSelector } = await server.ssrLoadModule('/src/components/common/LanguageSelector.jsx');
    const { LanguageProvider } = await server.ssrLoadModule('/src/context/LanguageContext.jsx');

    // En español por defecto
    const htmlEs = renderToStaticMarkup(
      React.createElement(LanguageProvider, { initialLang: 'es' },
        React.createElement(LanguageSelector)
      )
    );

    assert.ok(htmlEs.includes('role="group"'), 'Debe tener role="group"');
    assert.ok(htmlEs.includes('aria-label="Seleccionar idioma / Select language"'), 'Debe tener aria-label descriptivo');
    assert.ok(htmlEs.includes('aria-pressed="true"'), 'El botón activo debe tener aria-pressed="true"');
    assert.ok(htmlEs.includes('ES') && htmlEs.includes('EN'), 'Debe mostrar ES y EN');

    // En inglés
    const htmlEn = renderToStaticMarkup(
      React.createElement(LanguageProvider, { initialLang: 'en' },
        React.createElement(LanguageSelector)
      )
    );
    assert.ok(htmlEn.includes('aria-pressed="true"'));
  } finally {
    await server.close();
  }
});

test('Sidebar se traduce dinámicamente según el idioma activo', async () => {
  const server = await createTestServer();
  try {
    const { default: Sidebar } = await server.ssrLoadModule('/src/components/layout/Sidebar.jsx');
    const { LanguageProvider } = await server.ssrLoadModule('/src/context/LanguageContext.jsx');

    // Sidebar en español
    const htmlEs = renderToStaticMarkup(
      React.createElement(LanguageProvider, { initialLang: 'es' },
        React.createElement(Sidebar, { activeView: 'dashboard', onNavigate: () => {} })
      )
    );
    assert.ok(htmlEs.includes('Inicio'), 'Debe incluir Inicio en español');
    assert.ok(htmlEs.includes('Planificación Estratégica'), 'Debe incluir Planificación Estratégica en español');
    assert.ok(htmlEs.includes('Equipo Técnico'), 'Debe incluir Equipo Técnico en español');
    assert.ok(htmlEs.includes('Configuración'), 'Debe incluir Configuración en español');
    assert.ok(htmlEs.includes('Atajo:'), 'Debe incluir Atajo: en español');

    // Sidebar en inglés
    const htmlEn = renderToStaticMarkup(
      React.createElement(LanguageProvider, { initialLang: 'en' },
        React.createElement(Sidebar, { activeView: 'dashboard', onNavigate: () => {} })
      )
    );
    assert.ok(htmlEn.includes('Dashboard'), 'Debe incluir Dashboard en inglés');
    assert.ok(htmlEn.includes('Strategic Planning'), 'Debe incluir Strategic Planning en inglés');
    assert.ok(htmlEn.includes('Technical Team'), 'Debe incluir Technical Team en inglés');
    assert.ok(htmlEn.includes('Settings'), 'Debe incluir Settings en inglés');
    assert.ok(htmlEn.includes('Shortcut:'), 'Debe incluir Shortcut: en inglés');
  } finally {
    await server.close();
  }
});

test('Topbar traduce elementos accesibles y ya no incluye selector de idioma en la barra superior', async () => {
  const server = await createTestServer();
  try {
    const { default: Topbar } = await server.ssrLoadModule('/src/components/layout/Topbar.jsx');
    const { LanguageProvider } = await server.ssrLoadModule('/src/context/LanguageContext.jsx');

    // Topbar en español
    const htmlEs = renderToStaticMarkup(
      React.createElement(LanguageProvider, { initialLang: 'es' },
        React.createElement(Topbar, {
          activeView: 'dashboard',
          currentUser: { name: 'Admin', roleLabel: 'Administrador' },
          onNavigate: () => {},
        })
      )
    );
    assert.ok(htmlEs.includes('Buscar proyectos, hitos o equipos...'));
    assert.ok(htmlEs.includes('Cambiar tema de la interfaz'));
    assert.ok(htmlEs.includes('Atajo de búsqueda:'));
    assert.ok(!htmlEs.includes('aria-label="Seleccionar idioma / Select language"'), 'Ya no debe contener el selector de idioma en la barra superior');

    // Topbar en inglés
    const htmlEn = renderToStaticMarkup(
      React.createElement(LanguageProvider, { initialLang: 'en' },
        React.createElement(Topbar, {
          activeView: 'dashboard',
          currentUser: { name: 'Admin', roleLabel: 'Administrator' },
          onNavigate: () => {},
        })
      )
    );
    assert.ok(htmlEn.includes('Search projects, milestones or teams...'));
    assert.ok(htmlEn.includes('Toggle interface theme'));
    assert.ok(htmlEn.includes('Search shortcut:'));
    assert.ok(!htmlEn.includes('aria-label="Seleccionar idioma / Select language"'), 'Ya no debe contener el selector de idioma en la barra superior');

    // Topbar en planificación con vista activa
    const htmlPlanningEn = renderToStaticMarkup(
      React.createElement(LanguageProvider, { initialLang: 'en' },
        React.createElement(Topbar, {
          activeView: 'planning',
          currentUser: { name: 'Admin', roleLabel: 'Administrator' },
          onNavigate: () => {},
        })
      )
    );
    assert.ok(htmlPlanningEn.includes('Search master planning...'), 'Debe traducir placeholder de búsqueda en planning a Search master planning...');
  } finally {
    await server.close();
  }
});

test('PreferencesCard renderiza selector limpio de Idioma junto a Zona Horaria y opciones ES/EN', async () => {
  const server = await createTestServer();
  try {
    const { default: PreferencesCard } = await server.ssrLoadModule('/src/views/common/configuration/PreferencesCard.jsx');
    const { LanguageProvider } = await server.ssrLoadModule('/src/context/LanguageContext.jsx');

    // Render en español
    const htmlEs = renderToStaticMarkup(
      React.createElement(LanguageProvider, { initialLang: 'es' },
        React.createElement(PreferencesCard, {
          fontScale: 100,
          setFontScale: () => {},
          theme: 'midnight',
          setTheme: () => {},
          isAdmin: true,
        })
      )
    );

    assert.ok(htmlEs.includes('Idioma'), 'Debe renderizar la etiqueta limpia de Idioma');
    assert.ok(!htmlEs.includes('Ajuste Global'), 'No debe mostrar textos invasivos como Ajuste Global');
    assert.ok(!htmlEs.includes('Idioma Global del Sistema'), 'No debe mostrar títulos sobrecargados como Idioma Global del Sistema');
    assert.ok(!htmlEs.includes('Define el idioma predeterminado de la plataforma'), 'No debe mostrar descripciones redundantes');
    assert.ok(htmlEs.includes('Español (ES)'));
    assert.ok(htmlEs.includes('English (EN)'));
    assert.ok(htmlEs.includes('Zona Horaria'), 'Debe conservar el campo adyacente de Zona Horaria');
    assert.ok(htmlEs.includes('Tamaño de letra'), 'Debe conservar el control de escala de letra');
    assert.ok(!htmlEs.includes('Tema de Interfaz'), 'El selector de tema se trasladó al Topbar para evitar redundancia');

    // Render en inglés tras conmutación
    const htmlEn = renderToStaticMarkup(
      React.createElement(LanguageProvider, { initialLang: 'en' },
        React.createElement(PreferencesCard, {
          fontScale: 100,
          setFontScale: () => {},
          theme: 'dark',
          setTheme: () => {},
          isAdmin: true,
        })
      )
    );

    assert.ok(htmlEn.includes('Language'), 'Debe reflejar Language en inglés');
    assert.ok(!htmlEn.includes('Global Setting'), 'No debe mostrar Global Setting');
    assert.ok(!htmlEn.includes('System Global Language'), 'No debe mostrar System Global Language');
    assert.ok(!htmlEn.includes('Sets the default platform language'), 'No debe mostrar descripciones redundantes');
    assert.ok(htmlEn.includes('System Preferences'), 'Debe reflejar System Preferences en inglés');
    assert.ok(htmlEn.includes('Time Zone'), 'Debe reflejar Time Zone en inglés');
    assert.ok(htmlEn.includes('Font Size'), 'Debe reflejar Font Size en inglés');
    assert.ok(!htmlEn.includes('Interface Theme'), 'Interface Theme se trasladó al Topbar para evitar redundancia');
  } finally {
    await server.close();
  }
});

test('LoginScreen y LoadingScreen se traducen dinámicamente con LanguageProvider', async () => {
  const server = await createTestServer();
  try {
    const { default: LoginScreen } = await server.ssrLoadModule('/src/views/auth/LoginScreen.jsx');
    const { default: LoadingScreen } = await server.ssrLoadModule('/src/views/auth/LoadingScreen.jsx');
    const { LanguageProvider } = await server.ssrLoadModule('/src/context/LanguageContext.jsx');

    // 1. LoadingScreen en inglés y español
    const loadingEnHtml = renderToStaticMarkup(
      React.createElement(LanguageProvider, { initialLang: 'en' },
        React.createElement(LoadingScreen)
      )
    );
    assert.ok(loadingEnHtml.includes('Initializing Environment...'), 'LoadingScreen debe mostrar Initializing Environment... en inglés');

    const loadingEsHtml = renderToStaticMarkup(
      React.createElement(LanguageProvider, { initialLang: 'es' },
        React.createElement(LoadingScreen)
      )
    );
    assert.ok(loadingEsHtml.includes('Inicializando Entorno...'), 'LoadingScreen debe mostrar Inicializando Entorno... en español');

    // 2. LoginScreen en inglés
    const loginEnHtml = renderToStaticMarkup(
      React.createElement(LanguageProvider, { initialLang: 'en' },
        React.createElement(LoginScreen, { onLogin: () => {} })
      )
    );
    assert.ok(loginEnHtml.includes('Sign In'), 'Debe traducir Sign In');
    assert.ok(loginEnHtml.includes('Forgot your password?'), 'Debe traducir Forgot your password?');
    assert.ok(loginEnHtml.includes('Select your role'), 'Debe traducir Select your role');
    assert.ok(loginEnHtml.includes('Welcome to the PROJECT PLANNER system'), 'Debe traducir welcome');
    assert.ok(loginEnHtml.includes('Email address'), 'Debe traducir email');
    assert.ok(loginEnHtml.includes('Password'), 'Debe traducir password');
    assert.ok(loginEnHtml.includes('Remember me'), 'Debe traducir rememberMe');
    assert.ok(loginEnHtml.includes('Need access?'), 'Debe traducir needAccess');
    assert.ok(loginEnHtml.includes('Contact the system administrator'), 'Debe traducir contactAdmin');
    assert.ok(loginEnHtml.includes('Full system control, project management, budgets and teams'), 'Debe traducir adminRoleDesc');
    assert.ok(loginEnHtml.includes('Access to assigned projects, documentation and team status'), 'Debe traducir userRoleDesc');

    // 3. LoginScreen en español
    const loginEsHtml = renderToStaticMarkup(
      React.createElement(LanguageProvider, { initialLang: 'es' },
        React.createElement(LoginScreen, { onLogin: () => {} })
      )
    );
    assert.ok(loginEsHtml.includes('Iniciar Sesión'), 'Debe mostrar Iniciar Sesión en español');
    assert.ok(loginEsHtml.includes('¿Olvidaste tu contraseña?'), 'Debe mostrar ¿Olvidaste tu contraseña? en español');
    assert.ok(loginEsHtml.includes('Seleccione su rol'), 'Debe mostrar Seleccione su rol en español');
    assert.ok(loginEsHtml.includes('Bienvenido al sistema PROJECT PLANNER'), 'Debe mostrar bienvenido en español');
    assert.ok(loginEsHtml.includes('Correo electrónico'), 'Debe mostrar Correo electrónico en español');
    assert.ok(loginEsHtml.includes('Recordarme'), 'Debe mostrar Recordarme en español');
    assert.ok(loginEsHtml.includes('¿Necesitas acceso?'), 'Debe mostrar ¿Necesitas acceso? en español');
    assert.ok(loginEsHtml.includes('Contacta al administrador del sistema'), 'Debe mostrar Contacta al administrador en español');
  } finally {
    await server.close();
  }
});

test('Portfolio y sus diálogos se traducen adecuadamente al renderizarse con LanguageProvider initialLang: en', async () => {
  const server = await createTestServer();
  try {
    const { default: Portfolio, NewProjectDialog } = await server.ssrLoadModule('/src/views/technical/Portfolio.jsx');
    const { LanguageProvider } = await server.ssrLoadModule('/src/context/LanguageContext.jsx');
    const { ToastProvider } = await server.ssrLoadModule('/src/context/ToastContext.jsx');
    const { createPortfolioData } = await server.ssrLoadModule('/src/mocks/portfolioData.js');

    const data = createPortfolioData();
    const props = { data, onChange: () => {}, onQueryChange: () => {}, canManage: true, currentUserName: 'Carlos M.' };

    const htmlEn = renderToStaticMarkup(
      React.createElement(LanguageProvider, { initialLang: 'en' },
        React.createElement(ToastProvider, null,
          React.createElement(Portfolio, props)
        )
      )
    );

    assert.ok(htmlEn.includes('Project Repository'), 'Debe traducir título de Portfolio a inglés');
    assert.ok(htmlEn.includes('Create Project'), 'Debe traducir botón Crear Proyecto a Create Project');
    assert.ok(htmlEn.includes('Sort portfolio projects'), 'Debe traducir aria-label de ordenación');
    assert.ok(htmlEn.includes('Recent Change History'), 'Debe traducir Historial de Cambios a Recent Change History');
    assert.ok(htmlEn.includes('members'), 'Debe traducir integrantes a members');
    assert.ok(htmlEn.includes('Sync'), 'Debe traducir Sincronizar a Sync');

    const dialogEn = renderToStaticMarkup(
      React.createElement(LanguageProvider, { initialLang: 'en' },
        React.createElement(NewProjectDialog, { data, currentUserName: 'Carlos M.', onSubmit: () => {}, onClose: () => {} })
      )
    );

    for (const field of [
      'Project code',
      'Technical area',
      'Project name',
      'Start date',
      'Estimated end date',
      'Estimated budget',
      'Initial status',
      'Project leader',
      'Google Drive Folder',
      'Description / scope',
      'Autogenerated',
    ]) {
      assert.ok(dialogEn.includes(field), `NewProjectDialog en inglés debe contener: ${field}`);
    }
  } finally {
    await server.close();
  }
});

test('Operations y sus componentes se traducen adecuadamente al renderizarse con LanguageProvider initialLang: en', async () => {
  const server = await createTestServer();
  try {
    const { default: Operations, NewWorkOrderDialog } = await server.ssrLoadModule('/src/views/technical/Operations.jsx');
    const { LanguageProvider } = await server.ssrLoadModule('/src/context/LanguageContext.jsx');
    const { ToastProvider } = await server.ssrLoadModule('/src/context/ToastContext.jsx');
    const { createOperationsData } = await server.ssrLoadModule('/src/mocks/operationsData.js');

    const data = createOperationsData();
    const props = {
      data,
      onChange: () => {},
      onQueryChange: () => {},
      canManage: true,
      projectOptions: ['New Project (PRJ-2026-005)'],
      responsibleOptions: [{ id: 'tech-sofia', name: 'Sofía Torres', specialty: 'Lead Architect' }],
    };

    const htmlEn = renderToStaticMarkup(
      React.createElement(LanguageProvider, { initialLang: 'en' },
        React.createElement(ToastProvider, null,
          React.createElement(Operations, props)
        )
      )
    );

    for (const title of [
      'Field Operations Management',
      'New Work Order',
      'Generate Daily Report',
      'Critical Activities Schedule',
      'Active Work Orders',
      'Critical Operation Alerts',
      'Quality Assurance',
      'Sort work orders',
      'Tasks in progress',
      'Tasks completed',
      'Open incidents',
      'Operational efficiency',
    ]) {
      assert.ok(htmlEn.includes(title), `Operations en inglés debe contener: ${title}`);
    }

    for (const badge of [
      'active',
      'completed',
      'alerts',
      'In range',
    ]) {
      assert.ok(htmlEn.includes(badge), `Operations en inglés debe contener badge de KPI: ${badge}`);
    }
    assert.ok(htmlEn.includes('Operational summary'), 'Operations en inglés debe contener aria-label "Operational summary"');

    const dialogEn = renderToStaticMarkup(
      React.createElement(LanguageProvider, { initialLang: 'en' },
        React.createElement(NewWorkOrderDialog, {
          projectOptions: ['Torre Reforma (PRJ-2026-001)'],
          responsibleOptions: props.responsibleOptions,
          onSubmit: () => {},
          onClose: () => {},
        })
      )
    );

    for (const field of [
      'New Work Order',
      'Associated project',
      'Operation type',
      'Task / order title',
      'Technical area',
      'Assigned responsible',
      'Start date',
      'End / due date',
      'Priority level',
      'Critical path parameter',
      'Linked document or blueprint',
      'Description and instructions',
      'Issue Work Order',
    ]) {
      assert.ok(dialogEn.includes(field), `NewWorkOrderDialog en inglés debe contener: ${field}`);
    }
  } finally {
    await server.close();
  }
});

test('Portfolio traduce botones de filtro de estado y badges en inglés', async () => {
  const server = await createTestServer();
  try {
    const { default: Portfolio } = await server.ssrLoadModule('/src/views/technical/Portfolio.jsx');
    const { LanguageProvider } = await server.ssrLoadModule('/src/context/LanguageContext.jsx');
    const { ToastProvider } = await server.ssrLoadModule('/src/context/ToastContext.jsx');
    const { createPortfolioData } = await server.ssrLoadModule('/src/mocks/portfolioData.js');

    const data = createPortfolioData();
    const props = { data, onChange: () => {}, onQueryChange: () => {}, canManage: true, currentUserName: 'Carlos M.' };

    const htmlEn = renderToStaticMarkup(
      React.createElement(LanguageProvider, { initialLang: 'en' },
        React.createElement(ToastProvider, null,
          React.createElement(Portfolio, props)
        )
      )
    );

    // Botones de filtro de estado en Portfolio traducidos a inglés
    for (const statusLabel of ['In Planning', 'Active', 'Paused', 'Completed', 'At Risk']) {
      assert.ok(htmlEn.includes(statusLabel), `Portfolio en inglés debe incluir el filtro de estado: ${statusLabel}`);
    }
  } finally {
    await server.close();
  }
});

test('SortDropdown traduce opciones de ordenamiento y etiquetas en inglés', async () => {
  const server = await createTestServer();
  try {
    const { default: SortDropdown } = await server.ssrLoadModule('/src/components/common/SortDropdown.jsx');
    const { LanguageProvider } = await server.ssrLoadModule('/src/context/LanguageContext.jsx');

    const categories = [
      {
        id: 'budget',
        defaultId: 'budget_desc',
        defaultLabel: 'Mayor presupuesto',
        descId: 'budget_desc',
        ascId: 'budget_asc',
        descLabel: 'Mayor presupuesto',
        ascLabel: 'Menor presupuesto',
      },
      {
        id: 'name',
        defaultId: 'name_asc',
        defaultLabel: 'Nombre (A-Z)',
        descId: 'name_desc',
        ascId: 'name_asc',
        descLabel: 'Nombre (Z-A)',
        ascLabel: 'Nombre (A-Z)',
      },
    ];

    const htmlEn = renderToStaticMarkup(
      React.createElement(LanguageProvider, { initialLang: 'en' },
        React.createElement(SortDropdown, {
          value: 'budget_desc',
          onChange: () => {},
          categories,
          label: 'Ordenar por:',
        })
      )
    );

    assert.ok(htmlEn.includes('Sort by:'), 'Debe traducir etiqueta de ordenamiento a Sort by:');
    assert.ok(htmlEn.includes('Highest budget'), 'Debe traducir opción activa a Highest budget');
    assert.ok(htmlEn.includes('aria-haspopup="listbox"'), 'Debe conservar atributo accesibilidad aria-haspopup');
    assert.ok(htmlEn.includes('aria-label="Sort records. Current criteria: Highest budget, order descending"'), 'Debe incluir aria-label traducido');
  } finally {
    await server.close();
  }
});

test('ToastContainer traduce títulos de notificación y botones en inglés', async () => {
  const server = await createTestServer();
  try {
    const { ToastContainer } = await server.ssrLoadModule('/src/context/ToastContext.jsx');
    const { LanguageProvider } = await server.ssrLoadModule('/src/context/LanguageContext.jsx');

    const toast1 = {
      id: 1,
      title: 'Orden Emitida',
      message: 'La orden OT-2026-001 fue emitida correctamente.',
      type: 'success',
    };

    const html1 = renderToStaticMarkup(
      React.createElement(LanguageProvider, { initialLang: 'en' },
        React.createElement(ToastContainer, { toast: toast1, onClose: () => {} })
      )
    );

    assert.ok(html1.includes('Order Issued'), 'Debe traducir título Orden Emitida a Order Issued');
    assert.ok(html1.includes('aria-label="Close notification"'), 'Debe traducir botón de cerrar a Close notification');

    const toast2 = {
      id: 2,
      title: 'Proyecto Creado',
      message: 'El proyecto fue registrado en la base de datos.',
      type: 'success',
    };

    const html2 = renderToStaticMarkup(
      React.createElement(LanguageProvider, { initialLang: 'en' },
        React.createElement(ToastContainer, { toast: toast2, onClose: () => {} })
      )
    );

    assert.ok(html2.includes('Project Created'), 'Debe traducir título Proyecto Creado a Project Created');

    const toast3 = {
      id: 3,
      title: 'Estado Actualizado',
      message: 'El estado cambió a Completado.',
      type: 'info',
    };

    const html3 = renderToStaticMarkup(
      React.createElement(LanguageProvider, { initialLang: 'en' },
        React.createElement(ToastContainer, { toast: toast3, onClose: () => {} })
      )
    );

    assert.ok(html3.includes('Status Updated'), 'Debe traducir título Estado Actualizado a Status Updated');

    const toastSync = {
      id: 4,
      title: 'Proyectos Actualizados',
      message: 'Los proyectos se han sincronizado exitosamente.',
      type: 'success',
    };

    const htmlSync = renderToStaticMarkup(
      React.createElement(LanguageProvider, { initialLang: 'en' },
        React.createElement(ToastContainer, { toast: toastSync, onClose: () => {} })
      )
    );

    assert.ok(htmlSync.includes('Projects Synced'), 'Debe traducir "Proyectos Actualizados" a "Projects Synced"');
    assert.ok(
      htmlSync.includes('Projects have been synced successfully.'),
      'Debe traducir "Los proyectos se han sincronizado exitosamente." a "Projects have been synced successfully."'
    );

    const toastTech = {
      id: 5,
      title: 'Nómina Exportada',
      message: 'Reporte del equipo técnico exportado correctamente.',
      type: 'info',
    };

    const htmlTech = renderToStaticMarkup(
      React.createElement(LanguageProvider, { initialLang: 'en' },
        React.createElement(ToastContainer, { toast: toastTech, onClose: () => {} })
      )
    );

    assert.ok(htmlTech.includes('Payroll Exported'), 'Debe traducir Nómina Exportada a Payroll Exported');
    assert.ok(
      htmlTech.includes('Technical team report exported successfully.'),
      'Debe traducir mensaje de exportación de equipo técnico'
    );
  } finally {
    await server.close();
  }
});

test('CriticalScheduleSection traduce leyendas, cabeceras y avance en inglés', async () => {
  const server = await createTestServer();
  try {
    const { default: CriticalScheduleSection } = await server.ssrLoadModule('/src/views/technical/components/CriticalScheduleSection.jsx');
    const { LanguageProvider } = await server.ssrLoadModule('/src/context/LanguageContext.jsx');

    const sampleActivities = [
      {
        id: 'act-1',
        name: 'Excavación y Cimentación',
        project: 'Torre Horizon',
        startDate: '2026-01-01',
        endDate: '2026-03-31',
        period: 'Ene - Mar',
        color: '#3b82f6',
        progress: 85,
      },
    ];

    const htmlEn = renderToStaticMarkup(
      React.createElement(LanguageProvider, { initialLang: 'en' },
        React.createElement(CriticalScheduleSection, {
          activitiesList: sampleActivities,
        })
      )
    );

    assert.ok(htmlEn.includes('On time'), 'Debe traducir "En tiempo" a "On time"');
    assert.ok(htmlEn.includes('Accelerated'), 'Debe traducir "Acelerada" a "Accelerated"');
    assert.ok(htmlEn.includes('Scheduled'), 'Debe traducir "Programada" a "Scheduled"');
    assert.ok(htmlEn.includes('Activity / Work'), 'Debe traducir "Actividad / Obra" a "Activity / Work"');
    assert.ok(htmlEn.includes('Total progress'), 'Debe traducir "Avance total" a "Total progress"');
    assert.ok(htmlEn.includes('Timeline tracking and actual delivery progress'), 'Debe traducir subtitulo del cronograma');
    assert.ok(htmlEn.includes('Jan'), 'Debe traducir Ene a Jan');
    assert.ok(htmlEn.includes('Apr'), 'Debe traducir Abr a Apr');

    const htmlEmpty = renderToStaticMarkup(
      React.createElement(LanguageProvider, { initialLang: 'en' },
        React.createElement(CriticalScheduleSection, {
          activitiesList: [],
        })
      )
    );
    assert.ok(htmlEmpty.includes('No critical activities registered.'), 'Debe traducir EmptyState de actividades críticas');
  } finally {
    await server.close();
  }
});

test('OperationsSidebar traduce alertas, inspecciones de calidad y botones en inglés', async () => {
  const server = await createTestServer();
  try {
    const { default: OperationsSidebar } = await server.ssrLoadModule('/src/views/technical/components/OperationsSidebar.jsx');
    const { LanguageProvider } = await server.ssrLoadModule('/src/context/LanguageContext.jsx');

    const sampleAlerts = [
      { id: 'al-1', title: 'Falta de hormigón', project: 'Torre Horizon', level: 'critical' },
      { id: 'al-2', title: 'Revisión técnica', project: 'Edificio Central', level: 'warning' },
    ];

    const sampleQuality = [
      { id: 'qc-1', title: 'Prueba de fraguado', status: 'Aprobada' },
      { id: 'qc-2', title: 'Inspección de soldaduras', status: 'Pendiente' },
    ];

    const htmlEn = renderToStaticMarkup(
      React.createElement(LanguageProvider, { initialLang: 'en' },
        React.createElement(OperationsSidebar, {
          alertsList: sampleAlerts,
          qualityList: sampleQuality,
        })
      )
    );

    assert.ok(htmlEn.includes('2 Urgent'), 'Debe traducir conteo y etiqueta "2 Urgent"');
    assert.ok(htmlEn.includes('Attend'), 'Debe traducir botón crítico "Attend"');
    assert.ok(htmlEn.includes('Review'), 'Debe traducir botón warning "Review"');
    assert.ok(htmlEn.includes('ISO-9001 Standard'), 'Debe traducir norma ISO');
    assert.ok(htmlEn.includes('Approved'), 'Debe traducir estado de inspección "Approved"');
    assert.ok(htmlEn.includes('Pending'), 'Debe traducir estado de inspección "Pending"');

    const htmlEmpty = renderToStaticMarkup(
      React.createElement(LanguageProvider, { initialLang: 'en' },
        React.createElement(OperationsSidebar, {
          alertsList: [],
          qualityList: [],
        })
      )
    );
    assert.ok(htmlEmpty.includes('No active operational alerts.'), 'Debe traducir EmptyState de alertas');
    assert.ok(htmlEmpty.includes('No recent quality checks.'), 'Debe traducir EmptyState de aseguramiento de calidad');
  } finally {
    await server.close();
  }
});

test('TechnicalTeam traduce título, filtros y secciones en inglés', async () => {
  const server = await createTestServer();
  try {
    const { default: TechnicalTeam } = await server.ssrLoadModule('/src/views/technical/TechnicalTeam.jsx');
    const { LanguageProvider } = await server.ssrLoadModule('/src/context/LanguageContext.jsx');

    const htmlEn = renderToStaticMarkup(
      React.createElement(LanguageProvider, { initialLang: 'en' },
        React.createElement(TechnicalTeam, {
          data: { members: [], assignments: [] },
          canManage: true,
        })
      )
    );

    assert.ok(htmlEn.includes('Technical Team Management'), 'Debe traducir título en inglés');
    assert.ok(htmlEn.includes('Add Technician'), 'Debe traducir botón Add Technician en inglés');
    assert.ok(htmlEn.includes('Export Payroll / Report'), 'Debe traducir botón Export Report en inglés');
    assert.ok(htmlEn.includes('Technical Directory'), 'Debe traducir Technical Directory en inglés');
    assert.ok(htmlEn.includes('Summary by Area'), 'Debe traducir Summary by Area en inglés');
    assert.ok(htmlEn.includes('Recent Assignments'), 'Debe traducir Recent Assignments en inglés');
  } finally {
    await server.close();
  }
});

test('HumanResources traduce título, subtítulo, secciones y botones en inglés', async () => {
  const server = await createTestServer();
  try {
    const { default: HumanResources } = await server.ssrLoadModule('/src/views/human-resources/HumanResources.jsx');
    const { LanguageProvider } = await server.ssrLoadModule('/src/context/LanguageContext.jsx');

    const htmlEn = renderToStaticMarkup(
      React.createElement(LanguageProvider, { initialLang: 'en' },
        React.createElement(HumanResources, {
          data: { personnel: [] },
          canManage: true,
        })
      )
    );

    assert.ok(htmlEn.includes('Human Resources and Statuses'), 'Debe traducir título en inglés');
    assert.ok(htmlEn.includes('Personnel availability and assignment management'), 'Debe traducir subtítulo en inglés');
    assert.ok(htmlEn.includes('Export Matrix'), 'Debe traducir Export Matrix en inglés');
    assert.ok(htmlEn.includes('Personnel Assignment'), 'Debe traducir Personnel Assignment en inglés');
    assert.ok(htmlEn.includes('Team Status'), 'Debe traducir Team Status en inglés');
    assert.ok(htmlEn.includes('Incidents and Leaves'), 'Debe traducir Incidents and Leaves en inglés');
  } finally {
    await server.close();
  }
});

test('RolesManagement traduce título, subtítulo, tarjetas de resumen, roles y estados en inglés y español', async () => {
  const server = await createTestServer();
  try {
    const { default: RolesManagement } = await server.ssrLoadModule('/src/views/admin/RolesManagement.jsx');
    const { LanguageProvider } = await server.ssrLoadModule('/src/context/LanguageContext.jsx');

    const sampleUsers = [
      { id: 1, name: 'Admin Boss', email: 'admin@corp.com', isOnline: true, isAdmin: true, isSubAdmin: false, avatar: 'https://example.com/avatar1.jpg' },
      { id: 2, name: 'Carlos Tech', email: 'carlos@corp.com', isOnline: false, isAdmin: false, isSubAdmin: true },
      { id: 3, name: 'Ana Member', email: 'ana@corp.com', isOnline: true, isAdmin: false, isSubAdmin: false },
    ];

    // 1. Render en inglés
    const htmlEn = renderToStaticMarkup(
      React.createElement(LanguageProvider, { initialLang: 'en' },
        React.createElement(RolesManagement, {
          users: sampleUsers,
          onToggleSubAdmin: () => {},
        })
      )
    );

    assert.ok(htmlEn.includes('Roles Management'), 'Debe traducir título a Roles Management');
    assert.ok(htmlEn.includes('Exclusive Administrator access'), 'Debe traducir acceso exclusivo');
    assert.ok(htmlEn.includes('https://example.com/avatar1.jpg'), 'Debe renderizar la imagen de avatar si el usuario la tiene');
    assert.ok(htmlEn.includes('Users'), 'Debe traducir métrica Users');
    assert.ok(htmlEn.includes('SubAdministrators'), 'Debe traducir métrica SubAdministrators');
    assert.ok(htmlEn.includes('Online'), 'Debe traducir estado Online');
    assert.ok(htmlEn.includes('Offline'), 'Debe traducir estado Offline');
    assert.ok(htmlEn.includes('System users'), 'Debe traducir System users');
    assert.ok(htmlEn.includes('Current role'), 'Debe traducir Current role');
    assert.ok(htmlEn.includes('Main Admin'), 'Debe traducir Main Admin');
    assert.ok(htmlEn.includes('Enabled'), 'Debe traducir Enabled');
    assert.ok(htmlEn.includes('Disabled'), 'Debe traducir Disabled');

    // 2. Render en español
    const htmlEs = renderToStaticMarkup(
      React.createElement(LanguageProvider, { initialLang: 'es' },
        React.createElement(RolesManagement, {
          users: sampleUsers,
          onToggleSubAdmin: () => {},
        })
      )
    );

    assert.ok(htmlEs.includes('Administración de roles'));
    assert.ok(htmlEs.includes('Acceso exclusivo del Administrador'));
    assert.ok(htmlEs.includes('Usuarios'));
    assert.ok(htmlEs.includes('SubAdministradores'));
    assert.ok(htmlEs.includes('En línea'));
    assert.ok(htmlEs.includes('Desconectado'));
    assert.ok(htmlEs.includes('Usuarios del sistema'));
    assert.ok(htmlEs.includes('Rol actual'));
    assert.ok(htmlEs.includes('Admin Principal'));
    assert.ok(htmlEs.includes('Activado'));
    assert.ok(htmlEs.includes('Desactivado'));
  } finally {
    await server.close();
  }
});

test('StrategicPlanning y sus diálogos se traducen adecuadamente al renderizarse con LanguageProvider initialLang: en', async () => {
  const server = await createTestServer();
  try {
    const { default: StrategicPlanning, AdjustScheduleDialog, NewGlobalMilestoneDialog } = await server.ssrLoadModule('/src/views/admin/StrategicPlanning.jsx');
    const { default: TimelineAnalysisDialog } = await server.ssrLoadModule('/src/views/admin/TimelineAnalysisDialog.jsx');
    const { LanguageProvider } = await server.ssrLoadModule('/src/context/LanguageContext.jsx');
    const { ToastProvider } = await server.ssrLoadModule('/src/context/ToastContext.jsx');
    const { createStrategicPlanningData } = await server.ssrLoadModule('/src/mocks/strategicPlanningData.js');

    const data = createStrategicPlanningData();
    const props = { data, onChange: () => {}, canManage: true, initialYear: 2026 };

    const htmlEn = renderToStaticMarkup(
      React.createElement(LanguageProvider, { initialLang: 'en' },
        React.createElement(ToastProvider, null,
          React.createElement(StrategicPlanning, props)
        )
      )
    );

    assert.ok(htmlEn.includes('Master Schedule 2026'), 'Debe traducir título de StrategicPlanning a Master Schedule 2026');
    assert.ok(htmlEn.includes('Adjust Schedule'), 'Debe traducir botón Adjust Schedule');
    assert.ok(htmlEn.includes('Analyze Timelines'), 'Debe traducir botón Analyze Timelines');
    assert.ok(htmlEn.includes('Export Gantt / PDF'), 'Debe traducir botón Export Gantt / PDF');
    assert.ok(htmlEn.includes('New Global Milestone'), 'Debe traducir botón New Global Milestone');
    assert.ok(htmlEn.includes('Schedule filters:'), 'Debe traducir Schedule filters:');
    assert.ok(htmlEn.includes('Global Milestones'), 'Debe traducir Global Milestones');
    assert.ok(htmlEn.includes('Budget Control'), 'Debe traducir Budget Control');
    assert.ok(htmlEn.includes('Schedule Adjustments History'), 'Debe traducir Historial de Reajustes');
    assert.ok(htmlEn.includes('Year 2026'), 'Debe traducir selector de año a Year 2026');
    assert.ok(htmlEn.includes('Jan'), 'Debe traducir meses del Gantt a inglés');
    assert.ok(htmlEn.includes('Apr'), 'Debe traducir Abr a Apr en Gantt');

    // Probar AdjustScheduleDialog en inglés
    const adjustDialogEn = renderToStaticMarkup(
      React.createElement(LanguageProvider, { initialLang: 'en' },
        React.createElement(AdjustScheduleDialog, { data, initialProjectId: data.projects[0].id, onSubmit: () => {}, onClose: () => {} })
      )
    );
    assert.ok(adjustDialogEn.includes('Adjust Project Schedule'));
    assert.ok(adjustDialogEn.includes('Project to reschedule'));
    assert.ok(adjustDialogEn.includes('Start month'));
    assert.ok(adjustDialogEn.includes('Total duration'));
    assert.ok(adjustDialogEn.includes('Active Critical Path'));
    assert.ok(adjustDialogEn.includes('Save adjustments'));
    assert.ok(adjustDialogEn.includes('Jan'), 'Debe traducir meses en selector de AdjustScheduleDialog a Jan');

    // Probar NewGlobalMilestoneDialog en inglés
    const milestoneDialogEn = renderToStaticMarkup(
      React.createElement(LanguageProvider, { initialLang: 'en' },
        React.createElement(NewGlobalMilestoneDialog, { data, onSubmit: () => {}, onClose: () => {} })
      )
    );
    assert.ok(milestoneDialogEn.includes('New Global Milestone'));
    assert.ok(milestoneDialogEn.includes('Associated project'));
    assert.ok(milestoneDialogEn.includes('Initial status'));
    assert.ok(milestoneDialogEn.includes('Milestone name / critical delivery'));
    assert.ok(milestoneDialogEn.includes('Scheduled deadline'));
    assert.ok(milestoneDialogEn.includes('Validation responsible'));
    assert.ok(milestoneDialogEn.includes('Register Global Milestone'));

    // Probar TimelineAnalysisDialog en inglés
    const analysisDialogEn = renderToStaticMarkup(
      React.createElement(LanguageProvider, { initialLang: 'en' },
        React.createElement(TimelineAnalysisDialog, { projects: data.projects, initialProjectId: data.projects[0].id, onClose: () => {} })
      )
    );
    assert.ok(analysisDialogEn.includes('Timeline analysis'));
    assert.ok(analysisDialogEn.includes('Calculate proposal'));
    assert.ok(analysisDialogEn.includes('Select a project'));
  } finally {
    await server.close();
  }
});

test('Configuration y sus tarjetas se traducen adecuadamente al renderizarse con LanguageProvider initialLang: en', async () => {
  const server = await createTestServer();
  try {
    const { default: Configuration } = await server.ssrLoadModule('/src/views/common/Configuration.jsx');
    const { LanguageProvider } = await server.ssrLoadModule('/src/context/LanguageContext.jsx');

    const adminUser = {
      name: 'Carlos Mendoza',
      username: 'admin',
      roleLabel: 'Project Manager',
      accountType: 'admin',
      isAdmin: true,
    };

    const htmlEn = renderToStaticMarkup(
      React.createElement(LanguageProvider, { initialLang: 'en' },
        React.createElement(Configuration, {
          currentUser: adminUser,
          fontScale: 100,
          setFontScale: () => {},
          theme: 'dark',
          setTheme: () => {},
          users: [],
        })
      )
    );

    assert.ok(htmlEn.includes('System Settings'), 'Debe traducir título a System Settings');
    assert.ok(htmlEn.includes('User Profile'), 'Debe traducir User Profile');
    assert.ok(htmlEn.includes('Edit Profile'), 'Debe traducir botón Edit Profile');
    assert.ok(htmlEn.includes('Change Password'), 'Debe traducir botón Change Password');
    assert.ok(htmlEn.includes('Email Address'), 'Debe traducir Email Address');
    assert.ok(htmlEn.includes('Contact Phone'), 'Debe traducir Contact Phone');
    assert.ok(htmlEn.includes('Account Status'), 'Debe traducir Account Status');
    assert.ok(htmlEn.includes('Active / Online'), 'Debe traducir Active / Online');
    assert.ok(htmlEn.includes('Project Parameters'), 'Debe traducir Project Parameters');
    assert.ok(htmlEn.includes('Base Currency'), 'Debe traducir Base Currency');
    assert.ok(htmlEn.includes('Fiscal Year'), 'Debe traducir Fiscal Year');
    assert.ok(htmlEn.includes('Backup and Security'), 'Debe traducir Backup and Security');
    assert.ok(htmlEn.includes('Export Data'), 'Debe traducir Export Data');
    assert.ok(htmlEn.includes('Audit Log'), 'Debe traducir Audit Log');
    assert.ok(htmlEn.includes('View photo'), 'Debe traducir botón de ver foto de perfil');
    assert.ok(htmlEn.includes('View or manage profile photo'), 'Debe traducir aria-label de avatar');

    // Probar AvatarPreviewModal en inglés
    const { AvatarPreviewModal } = await server.ssrLoadModule('/src/views/common/configuration/index.js');
    const modalEn = renderToStaticMarkup(
      React.createElement(LanguageProvider, { initialLang: 'en' },
        React.createElement(AvatarPreviewModal, {
          isOpen: true,
          onClose: () => {},
          userPhoto: 'data:image/png;base64,mock',
          userName: 'Carlos Mendoza',
          onPhotoChange: () => {},
          onRemovePhoto: () => {},
        })
      )
    );
    assert.ok(modalEn.includes('Profile Photo'), 'Debe traducir modal title en inglés');
    assert.ok(modalEn.includes('Preview and manage your profile photo'), 'Debe traducir modal subtitle en inglés');
    assert.ok(modalEn.includes('Change Photo'), 'Debe traducir botón Change Photo en inglés');
    assert.ok(modalEn.includes('Remove Photo'), 'Debe traducir botón Remove Photo en inglés');
    assert.ok(modalEn.includes('Supported formats: JPG, PNG, or WEBP (max. 2 MB)'), 'Debe traducir avatarHint en inglés');

    const modalEnNoPhoto = renderToStaticMarkup(
      React.createElement(LanguageProvider, { initialLang: 'en' },
        React.createElement(AvatarPreviewModal, {
          isOpen: true,
          onClose: () => {},
          userPhoto: null,
          userName: 'Carlos Mendoza',
          onPhotoChange: () => {},
          onRemovePhoto: () => {},
        })
      )
    );
    assert.ok(modalEnNoPhoto.includes('Upload Photo'), 'Debe traducir Upload Photo cuando no hay foto');

    // Probar vista de usuario no-administrador en inglés
    const techUser = {
      name: 'Andrea Rojas',
      username: 'civil',
      roleLabel: 'Technical Specialist',
      accountType: 'user',
      isAdmin: false,
    };

    const techHtmlEn = renderToStaticMarkup(
      React.createElement(LanguageProvider, { initialLang: 'en' },
        React.createElement(Configuration, {
          currentUser: techUser,
          fontScale: 100,
          setFontScale: () => {},
          theme: 'midnight',
          setTheme: () => {},
          users: [],
        })
      )
    );

    assert.ok(techHtmlEn.includes('Security and Policies'), 'Debe traducir Security and Policies');
    assert.ok(techHtmlEn.includes('Access Level'), 'Debe traducir Access Level');
    assert.ok(techHtmlEn.includes('Authentication'), 'Debe traducir Authentication');
    assert.ok(techHtmlEn.includes('Operational Assignment'), 'Debe traducir Operational Assignment');
    assert.ok(techHtmlEn.includes('Current session'), 'Debe traducir Current session');
    assert.ok(techHtmlEn.includes('Active on this device'), 'Debe traducir Active on this device');
  } finally {
    await server.close();
  }
});

test('DashboardContent se traduce adecuadamente al renderizarse con LanguageProvider initialLang: en', async () => {
  const server = await createTestServer();
  try {
    const { default: DashboardContent } = await server.ssrLoadModule('/src/views/common/DashboardContent.jsx');
    const { LanguageProvider } = await server.ssrLoadModule('/src/context/LanguageContext.jsx');

    const portfolioData = {
      projects: [
        {
          id: 1,
          name: 'Edificio Central',
          area: 'Civil',
          progress: 65,
          totalBudget: 500000,
          usedBudget: 250000,
          status: 'risk',
          startDate: '2026-10-01',
          endDate: '2026-12-31',
        },
      ],
    };

    const strategicPlanningData = {
      milestones: [
        { id: 'm-1', title: 'Hito 1', status: 'pending' },
      ],
    };

    const htmlEn = renderToStaticMarkup(
      React.createElement(LanguageProvider, { initialLang: 'en' },
        React.createElement(DashboardContent, {
          portfolioData,
          strategicPlanningData,
          referenceDate: new Date('2026-10-15T00:00:00'),
        })
      )
    );

    assert.ok(htmlEn.includes('ACTIVE PROJECTS'), 'Debe traducir ACTIVE PROJECTS');
    assert.ok(htmlEn.includes('PENDING MILESTONES'), 'Debe traducir PENDING MILESTONES');
    assert.ok(htmlEn.includes('TOTAL BUDGET'), 'Debe traducir TOTAL BUDGET');
    assert.ok(htmlEn.includes('AVERAGE PROGRESS'), 'Debe traducir AVERAGE PROGRESS');
    assert.ok(htmlEn.includes('Oct 2026 – Mar 2027'), 'Debe traducir ventana semestral de meses a Oct 2026 – Mar 2027');
    assert.ok(htmlEn.includes('Project Calendar'), 'Debe traducir Project Calendar');
    assert.ok(htmlEn.includes('Critical operational phases for the next 6 months'), 'Debe traducir subtítulo de calendario');
    assert.ok(htmlEn.includes('Critical Path Alerts'), 'Debe traducir Critical Path Alerts');
    assert.ok(htmlEn.includes('At risk'), 'Debe traducir estado At risk');
    assert.ok(htmlEn.includes('Progress by Project'), 'Debe traducir Progress by Project');
    assert.ok(htmlEn.includes('Portfolio Health'), 'Debe traducir Portfolio Health');
    assert.ok(htmlEn.includes('On Track'), 'Debe traducir On Track en el anillo de salud');
    assert.ok(htmlEn.includes('On Schedule'), 'Debe traducir On Schedule en el desglose de salud');
    assert.ok(htmlEn.includes('View Complete Audit'), 'Debe traducir botón View Complete Audit');

    // Probar estados vacíos en inglés
    const emptyHtmlEn = renderToStaticMarkup(
      React.createElement(LanguageProvider, { initialLang: 'en' },
        React.createElement(DashboardContent, {
          portfolioData: { projects: [] },
          strategicPlanningData: { milestones: [] },
          onNavigate: () => {},
        })
      )
    );

    assert.ok(emptyHtmlEn.includes('No projects registered in the calendar'), 'Debe traducir EmptyState de calendario vacío');
    assert.ok(emptyHtmlEn.includes('Go to Portfolio'), 'Debe traducir botón Go to Portfolio');
    assert.ok(emptyHtmlEn.includes('✓ No critical alerts'), 'Debe traducir No critical alerts');
    assert.ok(emptyHtmlEn.includes('No projects registered to calculate progress metrics.'), 'Debe traducir aviso de proyectos para progreso');
  } finally {
    await server.close();
  }
});

test('Pagination se renderiza correctamente en inglés con LanguageProvider', async () => {
  const server = await createTestServer();
  try {
    const { default: Pagination } = await server.ssrLoadModule('/src/components/common/Pagination.jsx');
    const { LanguageProvider } = await server.ssrLoadModule('/src/context/LanguageContext.jsx');

    const htmlEn = renderToStaticMarkup(
      React.createElement(LanguageProvider, { initialLang: 'en' },
        React.createElement(Pagination, {
          currentPage: 1,
          totalPages: 5,
          totalItems: 25,
          pageSize: 5,
          itemLabel: 'items',
          onPageChange: () => {},
        })
      )
    );

    assert.ok(htmlEn.includes('1–5 of 25 items'), 'Debe traducir rango en inglés');
    assert.ok(htmlEn.includes('aria-label="Previous page"'), 'Debe traducir botón anterior');
    assert.ok(htmlEn.includes('aria-label="Next page"'), 'Debe traducir botón siguiente');
  } finally {
    await server.close();
  }
});

test('ChatWidget se renderiza correctamente en inglés con LanguageProvider', async () => {
  const server = await createTestServer();
  try {
    const { default: ChatWidget } = await server.ssrLoadModule('/src/components/common/ChatWidget.jsx');
    const { LanguageProvider } = await server.ssrLoadModule('/src/context/LanguageContext.jsx');

    const htmlEn = renderToStaticMarkup(
      React.createElement(LanguageProvider, { initialLang: 'en' },
        React.createElement(ChatWidget, {
          currentUser: { username: 'test', role_display: 'Admin', is_staff: true },
        })
      )
    );

    assert.ok(htmlEn.includes('Open AI Assistant'), 'Debe traducir aria-label de launcher en inglés');
  } finally {
    await server.close();
  }
});

test('Integrations se renderiza correctamente en inglés con LanguageProvider', async () => {
  const server = await createTestServer();
  try {
    const { default: Integrations } = await server.ssrLoadModule('/src/views/common/Integrations.jsx');
    const { default: IntegrationCard } = await server.ssrLoadModule('/src/views/common/integrations/IntegrationCard.jsx');
    const { default: GoogleDriveModal } = await server.ssrLoadModule('/src/views/common/integrations/GoogleDriveModal.jsx');
    const { default: MakeModal } = await server.ssrLoadModule('/src/views/common/integrations/MakeModal.jsx');
    const { default: IntegrationEditor } = await server.ssrLoadModule('/src/views/common/integrations/IntegrationEditor.jsx');
    const { default: RevitModal } = await server.ssrLoadModule('/src/views/common/components/RevitModal.jsx');
    const { default: GoogleDriveFileManager } = await server.ssrLoadModule('/src/views/common/integrations/GoogleDriveFileManager.jsx');
    const { ToastProvider } = await server.ssrLoadModule('/src/context/ToastContext.jsx');
    const { LanguageProvider } = await server.ssrLoadModule('/src/context/LanguageContext.jsx');
    const { createIntegrationsData } = await server.ssrLoadModule('/src/mocks/integrationsData.js');

    const data = createIntegrationsData();
    const htmlEn = renderToStaticMarkup(
      React.createElement(LanguageProvider, { initialLang: 'en' },
        React.createElement(ToastProvider, null,
          React.createElement(Integrations, { data, onChange: () => {} })
        )
      )
    );

    assert.ok(htmlEn.includes('Integrations'), 'Debe traducir título a Integrations');
    assert.ok(htmlEn.includes('General Status'), 'Debe traducir título de panel a General Status');
    assert.ok(htmlEn.includes('Integration Activity Log'), 'Debe traducir Activity Log en inglés');
    assert.ok(htmlEn.includes('Active integrations'), 'Debe traducir métricas en inglés');
    assert.ok(htmlEn.includes('synced files'), 'Debe traducir métricas files en inglés');
    assert.ok(htmlEn.includes('Activity:'), 'Debe traducir Activity: en tarjeta');
    assert.ok(htmlEn.includes('Excellent'), 'Debe traducir uptime a Excellent');
    assert.ok(htmlEn.includes('Operational (no incidents)'), 'Debe traducir SLA Operational');
    assert.ok(htmlEn.includes('Degraded performance'), 'Debe traducir SLA Degraded');
    assert.ok(htmlEn.includes('Service outage'), 'Debe traducir SLA Outage');

    // Renderizar GoogleDriveModal
    const driveIntegration = data.integrations.find((i) => i.id === 'drive');
    const driveModalHtml = renderToStaticMarkup(
      React.createElement(LanguageProvider, { initialLang: 'en' },
        React.createElement(ToastProvider, null,
          React.createElement(GoogleDriveModal, {
            isOpen: true,
            onClose: () => {},
            integration: driveIntegration,
            onConnect: () => {},
            onTest: () => {},
          })
        )
      )
    );
    assert.ok(driveModalHtml.includes('Document vault for plans'), 'Debe traducir subtítulo de Drive');
    assert.ok(driveModalHtml.includes('Vault Status:'), 'Debe traducir Vault Status:');
    assert.ok(driveModalHtml.includes('Linked account:'), 'Debe traducir Linked account:');
    assert.ok(driveModalHtml.includes('Reauthorize Google Drive'), 'Debe traducir Reauthorize Google Drive');

    // Renderizar GoogleDriveModal cuando no hay cuenta conectada
    const driveDisconnected = {
      ...driveIntegration,
      status: 'offline',
      endpoint: 'Sin cuenta conectada',
      lastActivity: 'Sin conexión',
      metrics: [
        { key: 'account', value: 0, label: 'cuentas conectadas' },
        { key: 'api', value: 'Pendiente', label: 'Google Drive API' },
      ],
    };
    const driveDisconnectedModalHtml = renderToStaticMarkup(
      React.createElement(LanguageProvider, { initialLang: 'en' },
        React.createElement(ToastProvider, null,
          React.createElement(GoogleDriveModal, {
            isOpen: true,
            onClose: () => {},
            integration: driveDisconnected,
            onConnect: () => {},
            onTest: () => {},
          })
        )
      )
    );
    assert.ok(driveDisconnectedModalHtml.includes('No connected account'), 'Debe traducir Sin cuenta conectada a No connected account');
    assert.ok(driveDisconnectedModalHtml.includes('No connection'), 'Debe traducir Sin conexión a No connection');
    assert.ok(!driveDisconnectedModalHtml.includes('Sin cuenta conectada'), 'No debe contener Sin cuenta conectada en español');

    // Renderizar IntegrationCard con valores 'Pendiente' y 'Activa'
    const cardPendingHtml = renderToStaticMarkup(
      React.createElement(LanguageProvider, { initialLang: 'en' },
        React.createElement(IntegrationCard, {
          integration: driveDisconnected,
          onConfigure: () => {},
        })
      )
    );
    assert.ok(cardPendingHtml.includes('Pending'), 'Debe traducir métrica Pendiente a Pending');
    assert.ok(cardPendingHtml.includes('connected accounts'), 'Debe traducir etiqueta cuentas conectadas en plural');
    assert.ok(cardPendingHtml.includes('No connection'), 'Debe traducir Sin conexión en actividad');
    assert.ok(!cardPendingHtml.includes('Pendiente'), 'No debe mostrar Pendiente en español');

    const revitActive = {
      id: 'revit',
      name: 'Revit / BIM Data',
      icon: 'model',
      status: 'connected',
      description: 'Importación de datos de modelado 3D, estructuras de concreto y acero.',
      endpoint: 'BIM 360 / Modelos',
      frequency: 'Cada hora',
      errors: 0,
      lastActivity: 'Verificado ahora',
      metrics: [
        { key: 'models', value: 1, label: 'modelo activo' },
        { key: 'api', value: 'Activa', label: 'Estado API' },
      ],
    };
    const cardActiveHtml = renderToStaticMarkup(
      React.createElement(LanguageProvider, { initialLang: 'en' },
        React.createElement(IntegrationCard, {
          integration: revitActive,
          onConfigure: () => {},
        })
      )
    );
    assert.ok(cardActiveHtml.includes('Active'), 'Debe traducir métrica Activa a Active');
    assert.ok(cardActiveHtml.includes('API Status'), 'Debe traducir Estado API a API Status');
    assert.ok(cardActiveHtml.includes('active model'), 'Debe traducir modelo activo en singular');
    assert.ok(cardActiveHtml.includes('Verified now'), 'Debe traducir Verificado ahora');
    assert.ok(!cardActiveHtml.includes('Activa'), 'No debe mostrar Activa en español');

    // Renderizar MakeModal
    const makeIntegration = data.integrations.find((i) => i.id === 'make');
    const makeModalHtml = renderToStaticMarkup(
      React.createElement(LanguageProvider, { initialLang: 'en' },
        React.createElement(ToastProvider, null,
          React.createElement(MakeModal, {
            isOpen: true,
            onClose: () => {},
            integration: makeIntegration,
            onSave: () => {},
          })
        )
      )
    );
    assert.ok(makeModalHtml.includes('Orchestration of webhooks'), 'Debe traducir subtítulo de Make');
    assert.ok(makeModalHtml.includes('Active Scenarios'), 'Debe traducir Active Scenarios');
    assert.ok(makeModalHtml.includes('Save scenarios'), 'Debe traducir Save scenarios');
    assert.ok(makeModalHtml.includes('General automation status'), 'Debe traducir General automation status');
    assert.ok(makeModalHtml.includes('Two-Factor Authentication (2FA)'), 'Debe traducir tarea 2FA');

    // Renderizar IntegrationEditor
    const editorHtml = renderToStaticMarkup(
      React.createElement(LanguageProvider, { initialLang: 'en' },
        React.createElement(ToastProvider, null,
          React.createElement(IntegrationEditor, {
            integration: makeIntegration,
            onSave: () => {},
            onTest: () => {},
            onCancel: () => {},
          })
        )
      )
    );
    assert.ok(editorHtml.includes('Local demo settings; no credentials are sent.'), 'Debe traducir demo notice');
    assert.ok(editorHtml.includes('Recent errors'), 'Debe traducir Recent errors');
    assert.ok(editorHtml.includes('Folder / endpoint'), 'Debe traducir Folder / endpoint');
    assert.ok(editorHtml.includes('Every 30 min'), 'Debe traducir frecuencia Every 30 min');

    // Renderizar IntegrationEditor con Google Drive sin cuenta conectada
    const editorDriveDisconnectedHtml = renderToStaticMarkup(
      React.createElement(LanguageProvider, { initialLang: 'en' },
        React.createElement(ToastProvider, null,
          React.createElement(IntegrationEditor, {
            integration: driveDisconnected,
            onSave: () => {},
            onTest: () => {},
            onCancel: () => {},
          })
        )
      )
    );
    assert.ok(editorDriveDisconnectedHtml.includes('No connected account'), 'Debe traducir Sin cuenta conectada en IntegrationEditor');
    assert.ok(!editorDriveDisconnectedHtml.includes('Sin cuenta conectada'), 'No debe mostrar Sin cuenta conectada en español');

    // Renderizar RevitModal
    const revitHtml = renderToStaticMarkup(
      React.createElement(LanguageProvider, { initialLang: 'en' },
        React.createElement(ToastProvider, null,
          React.createElement(RevitModal, {
            onClose: () => {},
          })
        )
      )
    );
    assert.ok(revitHtml.includes('Collaborative BIM Vault (APS)'), 'Debe traducir título de RevitModal');
    assert.ok(revitHtml.includes('Integration status'), 'Debe traducir Integration status');

    // Renderizar GoogleDriveFileManager con connected: false
    const fileManagerNotConnectedHtml = renderToStaticMarkup(
      React.createElement(LanguageProvider, { initialLang: 'en' },
        React.createElement(ToastProvider, null,
          React.createElement(GoogleDriveFileManager, {
            connected: false,
          })
        )
      )
    );
    assert.ok(fileManagerNotConnectedHtml.includes('Connect Google Drive to manage vault folders and files.'), 'Debe traducir connect notice');

    // Renderizar GoogleDriveFileManager con connected: true
    const fileManagerConnectedHtml = renderToStaticMarkup(
      React.createElement(LanguageProvider, { initialLang: 'en' },
        React.createElement(ToastProvider, null,
          React.createElement(GoogleDriveFileManager, {
            connected: true,
          })
        )
      )
    );
    assert.ok(fileManagerConnectedHtml.includes('Project Planner Files'), 'Debe traducir Project Planner Files');
    assert.ok(fileManagerConnectedHtml.includes('New Folder'), 'Debe traducir botón New Folder');
    assert.ok(fileManagerConnectedHtml.includes('Upload File'), 'Debe traducir botón Upload File');
    assert.ok(fileManagerConnectedHtml.includes('Refresh'), 'Debe traducir botón Refresh');
    assert.ok(fileManagerConnectedHtml.includes('Back'), 'Debe traducir botón Back');
  } finally {
    await server.close();
  }
});

test('UserManualView se renderiza correctamente en inglés con LanguageProvider', async () => {
  const server = await createTestServer();
  try {
    const { default: UserManualView } = await server.ssrLoadModule('/src/views/manual/UserManualView.jsx');
    const { LanguageProvider } = await server.ssrLoadModule('/src/context/LanguageContext.jsx');

    const htmlEn = renderToStaticMarkup(
      React.createElement(LanguageProvider, { initialLang: 'en' },
        React.createElement(UserManualView, { isAdmin: true })
      )
    );

    assert.ok(htmlEn.includes('User Manual'), 'Debe traducir título a User Manual');
    assert.ok(htmlEn.includes('System Documentation'), 'Debe traducir subtítulo a System Documentation');
    assert.ok(htmlEn.includes('Search content or shortcuts...'), 'Debe traducir placeholder del buscador');
    assert.ok(htmlEn.includes('All roles'), 'Debe traducir filtro de roles');
    assert.ok(htmlEn.includes('Access &amp; 2FA') || htmlEn.includes('Access & 2FA'), 'Debe traducir títulos de capítulos en inglés');
  } finally {
    await server.close();
  }
});

test('manualSections: getManualSections y getMarkdownContent resuelven metadatos y contenido multilingüe con fallback', async () => {
  const server = await createTestServer();
  try {
    const { getManualSections, getSectionById, getMarkdownContent } = await server.ssrLoadModule('/src/views/manual/manualSections.js');
    const { createTranslate } = await server.ssrLoadModule('/src/context/LanguageContext.jsx');

    const tEn = createTranslate('en');
    const sectionsEn = getManualSections('en', tEn);
    assert.equal(sectionsEn.length, 15);
    assert.equal(sectionsEn[0].title, 'Index and General Structure');
    assert.equal(sectionsEn[1].shortTitle, 'Access & 2FA');
    assert.ok(sectionsEn[0].content.length > 50, 'Debe cargar contenido en inglés de README.md');

    const tEs = createTranslate('es');
    const sectionsEs = getManualSections('es', tEs);
    assert.equal(sectionsEs.length, 15);
    assert.equal(sectionsEs[0].title, 'Índice y Estructura General');
    assert.equal(sectionsEs[1].shortTitle, 'Acceso y 2FA');
    assert.ok(sectionsEs[0].content.length > 50, 'Debe cargar contenido en español de README.md');

    // Fallback de archivo inexistente a es
    const fallbackContent = getMarkdownContent('README.md', 'fr');
    assert.ok(fallbackContent.length > 0, 'Debe aplicar fallback a es cuando el idioma no existe');

    const sec = getSectionById('01-acceso', 'en', tEn);
    assert.equal(sec.title, 'System Access and Navigation');
  } finally {
    await server.close();
  }
});

test('Toasts de Google Drive y gestión de archivos se traducen correctamente en inglés', async () => {
  const server = await createTestServer();
  try {
    const { LanguageProvider, useLanguage } = await server.ssrLoadModule('/src/context/LanguageContext.jsx');

    let testedT = null;
    function Consumer() {
      const { t } = useLanguage();
      testedT = t;
      return React.createElement('div', null, 'loaded');
    }

    renderToStaticMarkup(
      React.createElement(LanguageProvider, { initialLang: 'en' },
        React.createElement(Consumer)
      )
    );

    assert.ok(testedT, 't debe estar disponible');
    assert.equal(testedT('toasts.driveStatusTitle', 'Estado de Google Drive'), 'Google Drive Status');
    assert.equal(testedT('toasts.driveConnected', 'Google Drive conectado correctamente.'), 'Google Drive connected successfully.');
    assert.equal(
      testedT('toasts.driveConnectedWithEmail', 'Google Drive conectado correctamente: {email}', { email: 'user@example.com' }),
      'Google Drive connected successfully: user@example.com'
    );
    assert.equal(testedT('toasts.driveNotConnected', 'Google Drive todavía no está conectado.'), 'Google Drive is not connected yet.');
    assert.equal(testedT('toasts.driveError', 'No se pudo consultar Google Drive. Verifica que Django esté encendido.'), 'Could not query Google Drive. Verify that Django is running.');
    assert.equal(testedT('toasts.authStarted', 'Autorización Iniciada'), 'Authorization Started');
    assert.equal(testedT('toasts.authStartedMsg', '...'), 'Authorize Google Drive in the new tab and then click "Test connection".');
    assert.equal(testedT('toasts.testCompleted', 'Prueba Completada'), 'Test Completed');
    assert.equal(testedT('toasts.testCompletedMsg', '...'), 'The integration was marked as connected in the current session.');
    assert.equal(testedT('toasts.vaultUpdated', 'Bóveda Actualizada'), 'Vault Updated');
    assert.equal(testedT('toasts.vaultUpdatedMsg', '...'), 'Folder content was updated successfully.');
    assert.equal(testedT('toasts.vaultUpdateError', '...'), 'Could not update Google Drive content.');
    assert.equal(testedT('toasts.nameRequired', 'Nombre Requerido'), 'Name Required');
    assert.equal(testedT('toasts.nameRequiredMsg', '...'), 'Enter a name for the folder.');
    assert.equal(testedT('toasts.folderCreated', 'Carpeta Creada'), 'Folder Created');
    assert.equal(
      testedT('toasts.folderCreatedMsg', 'Carpeta "{name}" creada correctamente.', { name: 'Planos' }),
      'Folder "Planos" created successfully.'
    );
    assert.equal(testedT('toasts.fileRequired', 'Archivo Requerido'), 'File Required');
    assert.equal(testedT('toasts.fileRequiredMsg', '...'), 'Select a file to upload to Google Drive.');
    assert.equal(testedT('toasts.fileUploaded', 'Archivo Subido'), 'File Uploaded');
    assert.equal(
      testedT('toasts.fileUploadedMsg', '"{name}" subido con éxito a Google Drive.', { name: 'doc.pdf' }),
      '"doc.pdf" uploaded successfully to Google Drive.'
    );
    assert.equal(testedT('toasts.itemRenamed', 'Elemento Renombrado'), 'Item Renamed');
    assert.equal(
      testedT('toasts.itemRenamedMsg', 'Se actualizó el nombre a "{name}".', { name: 'nuevo.pdf' }),
      'Name updated to "nuevo.pdf".'
    );
    assert.equal(testedT('toasts.itemDeleted', 'Elemento Eliminado'), 'Item Deleted');
    assert.equal(
      testedT('toasts.itemDeletedMsg', '"{name}" fue enviado a la papelera.', { name: 'viejo.pdf' }),
      '"viejo.pdf" was moved to trash.'
    );
  } finally {
    await server.close();
  }
});

test('Notificaciones y bitácora de auditoría se formatean y traducen adecuadamente en inglés y español', async () => {
  const server = await createTestServer();
  try {
    const { createTranslate } = await server.ssrLoadModule('/src/context/LanguageContext.jsx');
    const {
      formatNotificationTitle,
      formatNotificationDetail,
      formatNotificationTime,
      formatAuditAction,
    } = await server.ssrLoadModule('/src/utils/notificationFormatting.js');

    const tEs = createTranslate('es');
    const tEn = createTranslate('en');

    // 1. formatNotificationTitle
    // Proyecto Asignado
    assert.equal(formatNotificationTitle('Proyecto Asignado', tEs), 'Proyecto Asignado');
    assert.equal(formatNotificationTitle('Proyecto Asignado', tEn), 'Project Assigned');

    // Reincorporación próxima
    assert.equal(formatNotificationTitle('Reincorporación próxima', tEs), 'Reincorporación próxima');
    assert.equal(formatNotificationTitle('Reincorporación próxima', tEn), 'Upcoming Return');

    // Auditoría
    assert.equal(
      formatNotificationTitle('Auditoría: Cambio de Contraseña', tEs),
      'Auditoría: Cambio de Contraseña'
    );
    assert.equal(
      formatNotificationTitle('Auditoría: Cambio de Contraseña', tEn),
      'Audit: Password Change'
    );
    assert.equal(
      formatNotificationTitle('Auditoría: Cambio de Correo Electrónico', tEs),
      'Auditoría: Cambio de Correo Electrónico'
    );
    assert.equal(
      formatNotificationTitle('Auditoría: Cambio de Correo Electrónico', tEn),
      'Audit: Email Address Change'
    );
    assert.equal(
      formatNotificationTitle('Auditoría: Actualización de Perfil', tEs),
      'Auditoría: Actualización de Perfil'
    );
    assert.equal(
      formatNotificationTitle('Auditoría: Actualización de Perfil', tEn),
      'Audit: Profile Update'
    );

    // Hito próximo
    assert.equal(
      formatNotificationTitle('Hito próximo: Entrega Fase 1', tEs),
      'Hito próximo: Entrega Fase 1'
    );
    assert.equal(
      formatNotificationTitle('Hito próximo: Entrega Fase 1', tEn),
      'Upcoming Milestone: Entrega Fase 1'
    );

    // 2. formatNotificationDetail
    // Asignación de proyecto
    const projDetail = 'Has sido asignado como líder técnico del proyecto **Titanium** (PRJ-01).';
    assert.equal(
      formatNotificationDetail(projDetail, tEs),
      'Has sido asignado como líder técnico del proyecto **Titanium** (PRJ-01).'
    );
    assert.equal(
      formatNotificationDetail(projDetail, tEn),
      'You have been assigned as technical leader for project **Titanium** (PRJ-01).'
    );

    // Reincorporación de personal
    const returnDetail = 'Carlos Gómez retorna el 20/12/2026 tras vacaciones programadas.';
    assert.equal(
      formatNotificationDetail(returnDetail, tEs),
      'Carlos Gómez retorna el 20/12/2026 tras vacaciones programadas.'
    );
    assert.equal(
      formatNotificationDetail(returnDetail, tEn),
      'Carlos Gómez returns on 20/12/2026 after scheduled vacation.'
    );

    const medReturnDetail = 'Ana Torres retorna el 15/01/2027 tras descanso médico.';
    assert.equal(
      formatNotificationDetail(medReturnDetail, tEn),
      'Ana Torres returns on 15/01/2027 after medical leave.'
    );

    // Auditoría: Cambio de contraseña
    const pwdDetail = 'El usuario **ronaldo** (ronaldo@gmail.com) actualizó su contraseña de acceso.';
    assert.equal(
      formatNotificationDetail(pwdDetail, tEs),
      'El usuario **ronaldo** (ronaldo@gmail.com) actualizó su contraseña de acceso.'
    );
    assert.equal(
      formatNotificationDetail(pwdDetail, tEn),
      'User **ronaldo** (ronaldo@gmail.com) updated their access password.'
    );

    // Auditoría: Cambio de correo
    const emailDetail = 'El usuario **ronaldo** modificó su correo de acceso de **old@mail.com** a **new@mail.com**.';
    assert.equal(
      formatNotificationDetail(emailDetail, tEs),
      'El usuario **ronaldo** modificó su correo de acceso de **old@mail.com** a **new@mail.com**.'
    );
    assert.equal(
      formatNotificationDetail(emailDetail, tEn),
      'User **ronaldo** changed their access email from **old@mail.com** to **new@mail.com**.'
    );

    // Hito próximo
    const milestoneDetail = 'Proyecto **Torre Titan** (PRJ-99) programado para 2026-11-30.';
    assert.equal(
      formatNotificationDetail(milestoneDetail, tEs),
      'Proyecto **Torre Titan** (PRJ-99) programado para 2026-11-30.'
    );
    assert.equal(
      formatNotificationDetail(milestoneDetail, tEn),
      'Project **Torre Titan** (PRJ-99) scheduled for 2026-11-30.'
    );

    // 3. formatNotificationTime
    assert.equal(formatNotificationTime('Reciente', tEs), 'Reciente');
    assert.equal(formatNotificationTime('Reciente', tEn), 'Recent');
    assert.equal(formatNotificationTime('Hoy', tEs), 'Hoy');
    assert.equal(formatNotificationTime('Hoy', tEn), 'Today');
    assert.equal(formatNotificationTime('Próximamente', tEs), 'Próximamente');
    assert.equal(formatNotificationTime('Próximamente', tEn), 'Soon');
    assert.equal(formatNotificationTime('En 3 día(s)', tEs), 'En 3 día(s)');
    assert.equal(formatNotificationTime('En 3 día(s)', tEn), 'In 3 day(s)');

    // 4. formatAuditAction
    assert.equal(formatAuditAction('password_change', 'Cambio de Contraseña', tEs), 'Cambio de Contraseña');
    assert.equal(formatAuditAction('password_change', 'Cambio de Contraseña', tEn), 'Password Change');
    assert.equal(formatAuditAction('email_change', 'Cambio de Correo Electrónico', tEs), 'Cambio de Correo Electrónico');
    assert.equal(formatAuditAction('email_change', 'Cambio de Correo Electrónico', tEn), 'Email Address Change');
    assert.equal(formatAuditAction('profile_update', 'Actualización de Perfil', tEs), 'Actualización de Perfil');
    assert.equal(formatAuditAction('profile_update', 'Actualización de Perfil', tEn), 'Profile Update');
  } finally {
    await server.close();
  }
});
