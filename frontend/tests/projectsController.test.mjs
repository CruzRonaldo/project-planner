import assert from 'node:assert/strict';
import test from 'node:test';
import { createServer } from 'vite';

test('useProjectsController se carga limpiamente en Vite SSR y expone una función', async () => {
  const server = await createServer({ server: { middlewareMode: true, hmr: false }, appType: 'custom' });
  try {
    const { useProjectsController } = await server.ssrLoadModule('/src/controllers/useProjectsController.js');
    assert.equal(typeof useProjectsController, 'function');
  } finally {
    await server.close();
  }
});

test('useProjectsController está exportado en barrel de controllers', async () => {
  const server = await createServer({ server: { middlewareMode: true, hmr: false }, appType: 'custom' });
  try {
    const barrel = await server.ssrLoadModule('/src/controllers/index.js');
    assert.equal(typeof barrel.useProjectsController, 'function');
  } finally {
    await server.close();
  }
});

test('useAppController integra los 5 domain controllers en su arquitectura Facade', async () => {
  const server = await createServer({ server: { middlewareMode: true, hmr: false }, appType: 'custom' });
  try {
    const { useAppController } = await server.ssrLoadModule('/src/controllers/useAppController.jsx');
    assert.equal(typeof useAppController, 'function');
  } finally {
    await server.close();
  }
});
