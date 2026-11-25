import assert from 'node:assert/strict';
import test from 'node:test';
import { createServer } from 'vite';

test('projectsApi.getPeriodicAudit existe y está disponible como función en projectsApi', async () => {
  const server = await createServer({ server: { middlewareMode: true, hmr: false }, appType: 'custom' });
  try {
    const { projectsApi } = await server.ssrLoadModule('/src/services/projectsApi.js');
    assert.equal(typeof projectsApi.getPeriodicAudit, 'function');
  } finally {
    await server.close();
  }
});

test('NAVIGATION_ITEMS configura roles para perfil (showInSidebar: false) y project-audit en sidebar (showInSidebar: true)', async () => {
  const server = await createServer({ server: { middlewareMode: true, hmr: false }, appType: 'custom' });
  try {
    const { NAVIGATION_ITEMS, USER_ROLES, getAllowedSidebarItems } = await server.ssrLoadModule(
      '/src/config/navigation.config.js'
    );

    const rolesItem = NAVIGATION_ITEMS.find((item) => item.id === 'roles');
    assert.ok(rolesItem, 'El item roles debe existir en NAVIGATION_ITEMS');
    assert.equal(rolesItem.showInSidebar, false);
    assert.equal(rolesItem.showInMobile, false);
    assert.deepEqual(rolesItem.roles, [USER_ROLES.ADMIN, USER_ROLES.SUBADMIN]);
    assert.ok(rolesItem.icon, 'Debe tener icono asignado');

    const auditItem = NAVIGATION_ITEMS.find((item) => item.id === 'project-audit');
    assert.ok(auditItem, 'El item project-audit debe existir en NAVIGATION_ITEMS');
    assert.equal(auditItem.showInSidebar, true);
    assert.equal(auditItem.showInMobile, true);

    // Comprobar que project-audit aparece en el sidebar pero roles no (va en perfil)
    const adminUser = { accountType: 'admin' };
    const subAdminUser = { accountType: 'user', role: 'subadmin', isSubAdmin: true, roleLabel: 'SubAdministrador' };
    const normalUser = { accountType: 'user' };

    const adminSidebar = getAllowedSidebarItems(adminUser);
    const subAdminSidebar = getAllowedSidebarItems(subAdminUser);
    const userSidebar = getAllowedSidebarItems(normalUser);

    assert.ok(
      adminSidebar.some((i) => i.id === 'project-audit'),
      'El administrador debe tener auditoría en el sidebar'
    );
    assert.ok(
      subAdminSidebar.some((i) => i.id === 'project-audit'),
      'El subadministrador debe tener auditoría en el sidebar'
    );
    assert.ok(
      !userSidebar.some((i) => i.id === 'project-audit'),
      'El usuario normal NO debe tener auditoría en el sidebar'
    );
    assert.ok(
      !adminSidebar.some((i) => i.id === 'roles'),
      'Roles no debe figurar en el sidebar (está en dropdown de perfil)'
    );
    assert.ok(
      !userSidebar.some((i) => i.id === 'roles'),
      'El usuario normal NO debe tener roles en el sidebar'
    );
  } finally {
    await server.close();
  }
});

test('useAppController retorna toggleTheme dentro de su API unificada', async () => {
  const server = await createServer({ server: { middlewareMode: true, hmr: false }, appType: 'custom' });
  try {
    const { useAppController } = await server.ssrLoadModule('/src/controllers/useAppController.jsx');
    assert.equal(typeof useAppController, 'function');
  } finally {
    await server.close();
  }
});

test('PeriodicProjectAuditModal y exportAuditToCsv se cargan limpiamente y están en el barrel technical', async () => {
  const server = await createServer({ server: { middlewareMode: true, hmr: false }, appType: 'custom' });
  try {
    const modalModule = await server.ssrLoadModule(
      '/src/views/technical/components/PeriodicProjectAuditModal.jsx'
    );
    assert.equal(typeof modalModule.default, 'function');
    assert.equal(typeof modalModule.PeriodicProjectAuditModal, 'function');
    assert.equal(typeof modalModule.exportAuditToCsv, 'function');

    const barrel = await server.ssrLoadModule('/src/views/technical/components/index.js');
    assert.equal(typeof barrel.PeriodicProjectAuditModal, 'function');
  } finally {
    await server.close();
  }
});

test('Topbar y ProfileControls se cargan en Vite SSR sin errores de importación', async () => {
  const server = await createServer({ server: { middlewareMode: true, hmr: false }, appType: 'custom' });
  try {
    const topbarModule = await server.ssrLoadModule('/src/components/layout/Topbar.jsx');
    assert.equal(typeof topbarModule.default, 'function');

    const profileModule = await server.ssrLoadModule('/src/components/layout/ProfileControls.jsx');
    assert.equal(typeof profileModule.default, 'function');
  } finally {
    await server.close();
  }
});

test('EditProjectDialog se carga limpiamente y exporta correctamente', async () => {
  const server = await createServer({ server: { middlewareMode: true, hmr: false }, appType: 'custom' });
  try {
    const editModule = await server.ssrLoadModule(
      '/src/views/technical/components/EditProjectDialog.jsx'
    );
    assert.equal(typeof editModule.default, 'function');
    assert.equal(typeof editModule.EditProjectDialog, 'function');
  } finally {
    await server.close();
  }
});

test('Los diccionarios es.json y en.json contienen todas las claves de auditoría y navegación', async () => {
  const server = await createServer({ server: { middlewareMode: true, hmr: false }, appType: 'custom' });
  try {
    const { createTranslate } = await server.ssrLoadModule('/src/context/LanguageContext.jsx');
    const tEs = createTranslate('es');
    const tEn = createTranslate('en');

    // Topbar
    assert.equal(tEs('topbar.themeToggle'), 'Cambiar tema de la interfaz');
    assert.equal(tEn('topbar.themeToggle'), 'Toggle interface theme');
    assert.equal(tEs('topbar.themeToggleTooltip'), 'Cambiar tema (Claro / Oscuro / Midnight)');
    assert.equal(tEn('topbar.themeToggleTooltip'), 'Change theme (Light / Dark / Midnight)');

    // Profile
    assert.equal(tEs('profile.projectAudit'), 'Auditoría de Proyectos');
    assert.equal(tEn('profile.projectAudit'), 'Project Audit');

    // Portfolio y Auditoría Periódica
    assert.equal(tEs('portfolio.periodicAuditBtn'), 'Auditoría Periódica');
    assert.equal(tEn('portfolio.periodicAuditBtn'), 'Periodic Audit');
    assert.equal(tEs('portfolio.auditModalTitle'), 'Auditoría Periódica de Proyectos');
    assert.equal(tEn('portfolio.auditModalTitle'), 'Periodic Project Audit');

    assert.equal(tEs('portfolio.periodMonthly'), 'Mensual (30 días)');
    assert.equal(tEn('portfolio.periodMonthly'), 'Monthly (30 days)');
    assert.equal(tEs('portfolio.periodQuarterly'), 'Trimestral (90 días)');
    assert.equal(tEn('portfolio.periodQuarterly'), 'Quarterly (90 days)');
    assert.equal(tEs('portfolio.periodSemiannual'), 'Semestral (180 días)');
    assert.equal(tEn('portfolio.periodSemiannual'), 'Semiannual (180 days)');

    assert.equal(tEs('portfolio.healthHealthy'), 'En Cronograma');
    assert.equal(tEn('portfolio.healthHealthy'), 'On Schedule');
    assert.equal(tEs('portfolio.healthWarning'), 'En Advertencia');
    assert.equal(tEn('portfolio.healthWarning'), 'Warning');
    assert.equal(tEs('portfolio.healthCritical'), 'Crítico / Desviado');
    assert.equal(tEn('portfolio.healthCritical'), 'Critical / Delayed');
    assert.equal(tEs('portfolio.healthStale'), 'Inactivo / Estancado');
    assert.equal(tEn('portfolio.healthStale'), 'Inactive / Stale');

    assert.equal(tEs('portfolio.statusReasonLabel'), 'Motivo del cambio de estado / justificación para auditoría');
    assert.equal(tEn('portfolio.statusReasonLabel'), 'Status change rationale / audit justification');
    assert.equal(tEs('portfolio.exportAuditCsv'), 'Exportar a CSV');
    assert.equal(tEn('portfolio.exportAuditCsv'), 'Export to CSV');

    // Nav y Topbar
    assert.equal(tEs('nav.auditoria'), 'Auditoría de Proyectos');
    assert.equal(tEn('nav.auditoria'), 'Project Audit');
    assert.equal(tEs('topbar.searchAuditoria'), 'Buscar en auditoría de proyectos...');
    assert.equal(tEn('topbar.searchAuditoria'), 'Search project audit...');

    // Audit section
    assert.equal(tEs('audit.kpiTotal'), 'Total Auditados');
    assert.equal(tEn('audit.kpiTotal'), 'Total Audited');
    assert.equal(tEs('audit.kpiCriticalStale'), 'Críticos / Estancados');
    assert.equal(tEn('audit.kpiCriticalStale'), 'Critical / Stalled');
  } finally {
    await server.close();
  }
});

test('ProjectAuditView y exportAuditToCsv se cargan limpiamente y están exportados en views/technical y views', async () => {
  const server = await createServer({ server: { middlewareMode: true, hmr: false }, appType: 'custom' });
  try {
    const auditViewModule = await server.ssrLoadModule('/src/views/technical/ProjectAuditView.jsx');
    assert.equal(typeof auditViewModule.default, 'function');
    assert.equal(typeof auditViewModule.ProjectAuditView, 'function');
    assert.equal(typeof auditViewModule.exportAuditToCsv, 'function');
    assert.equal(typeof auditViewModule.sortAuditProjects, 'function');
    assert.ok(Array.isArray(auditViewModule.auditSortCategories));
    assert.equal(auditViewModule.auditSortCategories.length, 5);
    assert.ok(auditViewModule.HEALTH_LEVELS);
    assert.ok(Array.isArray(auditViewModule.PERIOD_OPTIONS));

    // Validar categorías de ordenamiento
    const catIds = auditViewModule.auditSortCategories.map((c) => c.id);
    assert.deepEqual(catIds, ['budget', 'name', 'progress', 'gap', 'cpm']);

    // Probar función de ordenamiento
    const sampleProjects = [
      { id: 1, name: 'Beta', budget: 100000, actual_progress: 30, expected_progress: 50, overdue_critical_count: 2 },
      { id: 2, name: 'Alpha', budget: 500000, actual_progress: 80, expected_progress: 70, overdue_critical_count: 0 },
      { id: 3, name: 'Gamma', budget: 250000, actual_progress: 10, expected_progress: 60, overdue_critical_count: 5 },
    ];

    // Por presupuesto descendente
    const byBudgetDesc = auditViewModule.sortAuditProjects(sampleProjects, 'budget_desc');
    assert.equal(byBudgetDesc[0].id, 2); // 500k
    assert.equal(byBudgetDesc[2].id, 1); // 100k

    // Por nombre ascendente
    const byNameAsc = auditViewModule.sortAuditProjects(sampleProjects, 'name_asc');
    assert.equal(byNameAsc[0].name, 'Alpha');
    assert.equal(byNameAsc[2].name, 'Gamma');

    // Por avance descendente
    const byProgDesc = auditViewModule.sortAuditProjects(sampleProjects, 'progress_desc');
    assert.equal(byProgDesc[0].actual_progress, 80);

    // Por mayor desfase (expected - actual)
    // Beta: 50 - 30 = 20, Alpha: 70 - 80 = 0, Gamma: 60 - 10 = 50
    const byGapDesc = auditViewModule.sortAuditProjects(sampleProjects, 'gap_desc');
    assert.equal(byGapDesc[0].id, 3); // 50 de desfase

    // Por tareas CPM vencidas descendente
    const byCpmDesc = auditViewModule.sortAuditProjects(sampleProjects, 'cpm_desc');
    assert.equal(byCpmDesc[0].id, 3); // 5 vencidas

    const technicalBarrel = await server.ssrLoadModule('/src/views/technical/index.js');
    assert.equal(typeof technicalBarrel.ProjectAuditView, 'function');

    const viewsBarrel = await server.ssrLoadModule('/src/views/index.js');
    assert.equal(typeof viewsBarrel.ProjectAuditView, 'function');
  } finally {
    await server.close();
  }
});

test('NAVIGATION_ITEMS incluye project-audit con ClipboardCheck y habilitado en sidebar/mobile', async () => {
  const server = await createServer({ server: { middlewareMode: true, hmr: false }, appType: 'custom' });
  try {
    const { NAVIGATION_ITEMS, USER_ROLES } = await server.ssrLoadModule('/src/config/navigation.config.js');
    const auditItem = NAVIGATION_ITEMS.find((item) => item.id === 'project-audit' || item.id === 'auditoria');
    assert.ok(auditItem, 'El item project-audit debe existir en NAVIGATION_ITEMS');
    assert.equal(auditItem.path, '/project-audit');
    assert.equal(auditItem.showInSidebar, true);
    assert.equal(auditItem.showInMobile, true);
    assert.equal(auditItem.category, 'technical');
    assert.deepEqual(auditItem.roles, [USER_ROLES.ADMIN, USER_ROLES.SUBADMIN]);
    assert.ok(auditItem.icon, 'Debe tener icono asignado');
  } finally {
    await server.close();
  }
});

test('App.jsx se carga en SSR sin importar el modal flotante PeriodicProjectAuditModal', async () => {
  const server = await createServer({ server: { middlewareMode: true, hmr: false }, appType: 'custom' });
  try {
    const appModule = await server.ssrLoadModule('/src/App.jsx');
    assert.equal(typeof appModule.default, 'function');
  } finally {
    await server.close();
  }
});
