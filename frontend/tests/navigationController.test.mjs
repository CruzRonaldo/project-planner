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
    const techUser = { role: 'user', accountType: 'user' };

    // Validar acceso RBAC
    assert.equal(hasViewAccess('dashboard', adminUser), true);
    assert.equal(hasViewAccess('dashboard', techUser), true);
    assert.equal(hasViewAccess('roles', adminUser), true);
    assert.equal(hasViewAccess('roles', techUser), false);

    // Placeholders contextuales
    assert.ok(getSearchPlaceholder('planning').toLowerCase().includes('planificación'));
    assert.ok(getSearchPlaceholder('portfolio').toLowerCase().includes('proyecto'));
    assert.ok(getSearchPlaceholder('operations').toLowerCase().includes('órdenes') || getSearchPlaceholder('operations').toLowerCase().includes('tarea'));
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
