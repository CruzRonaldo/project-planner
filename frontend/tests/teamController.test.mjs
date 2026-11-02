import assert from 'node:assert/strict';
import test from 'node:test';
import { createServer } from 'vite';

test('useTeamController se carga limpiamente en Vite SSR y expone una función', async () => {
  const server = await createServer({ server: { middlewareMode: true, hmr: false }, appType: 'custom' });
  try {
    const { useTeamController } = await server.ssrLoadModule('/src/controllers/useTeamController.js');
    assert.equal(typeof useTeamController, 'function');
  } finally {
    await server.close();
  }
});

test('useTeamController está exportado en barrel de controllers', async () => {
  const server = await createServer({ server: { middlewareMode: true, hmr: false }, appType: 'custom' });
  try {
    const barrel = await server.ssrLoadModule('/src/controllers/index.js');
    assert.equal(typeof barrel.useTeamController, 'function');
  } finally {
    await server.close();
  }
});

test('useAppController integra useTeamController sin romper su API pública', async () => {
  const server = await createServer({ server: { middlewareMode: true, hmr: false }, appType: 'custom' });
  try {
    const { useAppController } = await server.ssrLoadModule('/src/controllers/useAppController.jsx');
    assert.equal(typeof useAppController, 'function');
  } finally {
    await server.close();
  }
});
