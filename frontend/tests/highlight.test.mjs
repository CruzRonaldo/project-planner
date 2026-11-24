import assert from 'node:assert/strict';
import test from 'node:test';
import { createServer } from 'vite';

test('useDirectAccessHighlight se carga en SSR y exporta una función', async () => {
  const server = await createServer({ server: { middlewareMode: true, hmr: false }, appType: 'custom' });
  try {
    const { useDirectAccessHighlight, default: defaultHook } = await server.ssrLoadModule(
      '/src/hooks/useDirectAccessHighlight.js'
    );
    assert.equal(typeof useDirectAccessHighlight, 'function');
    assert.equal(typeof defaultHook, 'function');
  } finally {
    await server.close();
  }
});
