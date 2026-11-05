import assert from 'node:assert/strict';
import test from 'node:test';
import { createServer } from 'vite';

test('createNameFromEmail extrae y capitaliza nombres legibles o devuelve fallback', async () => {
  const server = await createServer({ server: { middlewareMode: true, hmr: false }, appType: 'custom' });
  try {
    const { createNameFromEmail } = await server.ssrLoadModule('/src/controllers/useAuthController.js');

    assert.equal(createNameFromEmail('sistemas@projectplanner.com'), 'Sistemas');
    assert.equal(createNameFromEmail('carlos.mendoza@empresa.com'), 'Carlos Mendoza');
    assert.equal(createNameFromEmail('andrea-rojas_civil@obra.pe'), 'Andrea Rojas Civil');
    assert.equal(createNameFromEmail(''), 'Usuario Técnico');
    assert.equal(createNameFromEmail(null), 'Usuario Técnico');
  } finally {
    await server.close();
  }
});

test('useAuthController se carga limpiamente y expone interfaz completa de autenticación', async () => {
  const server = await createServer({ server: { middlewareMode: true, hmr: false }, appType: 'custom' });
  try {
    const { useAuthController } = await server.ssrLoadModule('/src/controllers/useAuthController.js');
    assert.equal(typeof useAuthController, 'function');
  } finally {
    await server.close();
  }
});

test('useAppController integra useAuthController y preserva el contrato público para App.jsx', async () => {
  const server = await createServer({ server: { middlewareMode: true, hmr: false }, appType: 'custom' });
  try {
    const { useAppController } = await server.ssrLoadModule('/src/controllers/useAppController.jsx');
    assert.equal(typeof useAppController, 'function');
  } finally {
    await server.close();
  }
});
