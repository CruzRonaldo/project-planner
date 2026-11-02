import assert from 'node:assert/strict';
import test from 'node:test';
import { createServer } from 'vite';

test('useIntegrationsController se carga limpiamente en Vite SSR y expone una función', async () => {
  const server = await createServer({ server: { middlewareMode: true, hmr: false }, appType: 'custom' });
  try {
    const { useIntegrationsController } = await server.ssrLoadModule('/src/controllers/useIntegrationsController.js');
    assert.equal(typeof useIntegrationsController, 'function');
  } finally {
    await server.close();
  }
});

test('useIntegrationsController está exportado en barrel de controllers', async () => {
  const server = await createServer({ server: { middlewareMode: true, hmr: false }, appType: 'custom' });
  try {
    const barrel = await server.ssrLoadModule('/src/controllers/index.js');
    assert.equal(typeof barrel.useIntegrationsController, 'function');
    assert.equal(typeof barrel.createEmptyIntegrations, 'function');
    assert.equal(typeof barrel.updateGoogleDriveStatus, 'function');
    assert.equal(typeof barrel.updateRevitStatus, 'function');
    assert.equal(typeof barrel.formatRelativeTime, 'function');
  } finally {
    await server.close();
  }
});

test('createEmptyIntegrations genera la estructura requerida para producción', async () => {
  const server = await createServer({ server: { middlewareMode: true, hmr: false }, appType: 'custom' });
  try {
    const { createEmptyIntegrations } = await server.ssrLoadModule('/src/controllers/useIntegrationsController.js');
    const empty = createEmptyIntegrations();
    assert.equal(Array.isArray(empty.integrations), true);
    assert.equal(empty.integrations.length, 3);
    assert.equal(empty.integrations.map((i) => i.id).sort().join(','), 'drive,make,revit');
  } finally {
    await server.close();
  }
});

test('updateGoogleDriveStatus y updateRevitStatus transforman el estado sin mutar el original', async () => {
  const server = await createServer({ server: { middlewareMode: true, hmr: false }, appType: 'custom' });
  try {
    const {
      createEmptyIntegrations,
      updateGoogleDriveStatus,
      updateRevitStatus,
    } = await server.ssrLoadModule('/src/controllers/useIntegrationsController.js');

    const initial = createEmptyIntegrations();

    const withDrive = updateGoogleDriveStatus(initial, {
      connected: true,
      email: 'sistemas@projectplanner.com',
      display_name: 'Sistemas',
    });
    const driveItem = withDrive.integrations.find((i) => i.id === 'drive');
    assert.equal(driveItem.status, 'connected');
    assert.equal(driveItem.endpoint, 'sistemas@projectplanner.com');
    assert.ok(driveItem.description.includes('Sistemas'));

    const withRevit = updateRevitStatus(initial, {
      connected: true,
      total_models: 5,
      last_sync: new Date().toISOString(),
    });
    const revitItem = withRevit.integrations.find((i) => i.id === 'revit');
    assert.equal(revitItem.status, 'connected');
    assert.equal(revitItem.metrics.find((m) => m.key === 'models')?.value, 5);
  } finally {
    await server.close();
  }
});

test('useAppController integra useIntegrationsController sin romper su API pública', async () => {
  const server = await createServer({ server: { middlewareMode: true, hmr: false }, appType: 'custom' });
  try {
    const { useAppController } = await server.ssrLoadModule('/src/controllers/useAppController.jsx');
    assert.equal(typeof useAppController, 'function');
  } finally {
    await server.close();
  }
});
