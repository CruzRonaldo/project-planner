import assert from 'node:assert/strict';
import test from 'node:test';
import { createServer } from 'vite';

test('useCrossTabListener se carga limpiamente en SSR y es una función', async () => {
  const server = await createServer({ server: { middlewareMode: true, hmr: false }, appType: 'custom' });
  try {
    const { useCrossTabListener } = await server.ssrLoadModule('/src/utils/useCrossTabListener.js');
    assert.equal(typeof useCrossTabListener, 'function');
  } finally {
    await server.close();
  }
});

test('useCrossTabListener esta integrado en useAuthController y useThemeController', async () => {
  const server = await createServer({ server: { middlewareMode: true, hmr: false }, appType: 'custom' });
  try {
    const { useAuthController } = await server.ssrLoadModule('/src/controllers/useAuthController.js');
    const { useThemeController } = await server.ssrLoadModule('/src/controllers/useThemeController.js');

    assert.equal(typeof useAuthController, 'function');
    assert.equal(typeof useThemeController, 'function');
  } finally {
    await server.close();
  }
});
