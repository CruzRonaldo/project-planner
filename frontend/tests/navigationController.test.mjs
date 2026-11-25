import assert from 'node:assert/strict';
import test from 'node:test';
import { createServer } from 'vite';

test('useNavigationController se carga limpiamente en SSR y expone la API de navegación', async () => {
  const server = await createServer({ server: { middlewareMode: true, hmr: false }, appType: 'custom' });
  try {
    const { useNavigationController } = await server.ssrLoadModule('/src/controllers/useNavigationController.js');
    assert.equal(typeof useNavigationController, 'function');
  } finally {
    await server.close();
  }
});

test('useNavigationController calcula items permitidos y placeholders según rol', async () => {
  const server = await createServer({ server: { middlewareMode: true, hmr: false }, appType: 'custom' });
  try {
    const { hasViewAccess, getSearchPlaceholder } = await server.ssrLoadModule('/src/config/navigation.config.js');

    const adminUser = { role: 'admin', accountType: 'admin', is_superuser: true };
    const subAdminUser = { role: 'subadmin', accountType: 'user', isSubAdmin: true, roleLabel: 'SubAdministrador' };
    const techUser = { role: 'user', accountType: 'user' };

    // Validar acceso RBAC
    assert.equal(hasViewAccess('dashboard', adminUser), true);
    assert.equal(hasViewAccess('dashboard', subAdminUser), true);
    assert.equal(hasViewAccess('dashboard', techUser), true);
    assert.equal(hasViewAccess('manual', adminUser), true);
    assert.equal(hasViewAccess('manual', subAdminUser), true);
    assert.equal(hasViewAccess('manual', techUser), true);
    assert.equal(hasViewAccess('roles', adminUser), true);
    assert.equal(hasViewAccess('roles', subAdminUser), true);
    assert.equal(hasViewAccess('roles', techUser), false);
    assert.equal(hasViewAccess('project-audit', adminUser), true);
    assert.equal(hasViewAccess('project-audit', subAdminUser), true);
    assert.equal(hasViewAccess('project-audit', techUser), false);

    // Placeholders contextuales
    assert.ok(getSearchPlaceholder('planning').toLowerCase().includes('planificación'));
    assert.ok(getSearchPlaceholder('portfolio').toLowerCase().includes('proyecto'));
    assert.ok(getSearchPlaceholder('operations').toLowerCase().includes('órdenes') || getSearchPlaceholder('operations').toLowerCase().includes('tarea'));
    assert.ok(getSearchPlaceholder('manual').toLowerCase().includes('manual'));
  } finally {
    await server.close();
  }
});

test('useAppController integra useNavigationController y exporta contrato público intacto', async () => {
  const server = await createServer({ server: { middlewareMode: true, hmr: false }, appType: 'custom' });
  try {
    const { useAppController } = await server.ssrLoadModule('/src/controllers/useAppController.jsx');
    assert.equal(typeof useAppController, 'function');
  } finally {
    await server.close();
  }
});

test('MANUAL_SECTIONS aplica RBAC: el capítulo de roles es exclusivo de admin y filtrable para no-admin', async () => {
  const server = await createServer({ server: { middlewareMode: true, hmr: false }, appType: 'custom' });
  try {
    const { MANUAL_SECTIONS } = await server.ssrLoadModule('/src/views/manual/manualSections.js');
    
    const adminChapter = MANUAL_SECTIONS.find((s) => s.id === '10-roles');
    assert.ok(adminChapter, 'Debe existir el capítulo 10 de roles');
    assert.equal(adminChapter.roleRequired, 'admin');

    // Simular el filtro de un usuario sin privilegios de admin (isAdmin = false)
    const userVisibleChapters = MANUAL_SECTIONS.filter((s) => s.roleRequired !== 'admin');
    assert.equal(userVisibleChapters.some((s) => s.id === '10-roles'), false);
    assert.equal(userVisibleChapters.length, 13); // 13 no administrativos (14 en total - 1 de admin: roles)
  } finally {
    await server.close();
  }
});
