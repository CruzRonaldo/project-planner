import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';

test('El análisis ofrece selección de proyecto y aclara que la propuesta conserva las fechas', async () => {
  const server = await createServer({ server: { middlewareMode: true, hmr: false }, appType: 'custom' });
  try {
    const { default: Dialog } = await server.ssrLoadModule('/src/views/admin/TimelineAnalysisDialog.jsx');
    const html = renderToStaticMarkup(React.createElement(Dialog, {
      projects: [{ id: 42, name: 'Proyecto de prueba' }], initialProjectId: 42, onClose: () => {},
    }));
    assert.ok(html.includes('Análisis de tiempos'));
    assert.ok(html.includes('Calcular propuesta'));
    assert.ok(html.includes('Proyecto de prueba'));
    assert.ok(html.includes('conserva las fechas guardadas'));
    const empty = renderToStaticMarkup(React.createElement(Dialog, { projects: [], onClose: () => {} }));
    assert.match(empty, /type="submit" disabled=""/);
  } finally {
    await server.close();
  }
});
