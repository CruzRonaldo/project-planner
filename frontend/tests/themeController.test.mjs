import assert from 'node:assert/strict';
import test from 'node:test';
import { createServer } from 'vite';

test('sanitizeFontScale valida, acota al rango 85-120 y maneja fallbacks', async () => {
  const server = await createServer({ server: { middlewareMode: true, hmr: false }, appType: 'custom' });
  try {
    const { sanitizeFontScale, FONT_SCALE_LIMITS } = await server.ssrLoadModule('/src/controllers/useThemeController.js');

    assert.equal(sanitizeFontScale(50), 85);
    assert.equal(sanitizeFontScale(85), 85);
    assert.equal(sanitizeFontScale(100), 100);
    assert.equal(sanitizeFontScale(115), 115);
    assert.equal(sanitizeFontScale(120), 120);
    assert.equal(sanitizeFontScale(200), 120);

    // Soporte para strings y fallbacks tolerantes
    assert.equal(sanitizeFontScale('110'), 110);
    assert.equal(sanitizeFontScale('invalido'), FONT_SCALE_LIMITS.DEFAULT);
    assert.equal(sanitizeFontScale(null), FONT_SCALE_LIMITS.DEFAULT);
    assert.equal(sanitizeFontScale(undefined), FONT_SCALE_LIMITS.DEFAULT);
  } finally {
    await server.close();
  }
});

test('isValidTheme valida estrictamente los temas admitidos', async () => {
  const server = await createServer({ server: { middlewareMode: true, hmr: false }, appType: 'custom' });
  try {
    const { isValidTheme, THEMES, ALLOWED_THEMES } = await server.ssrLoadModule('/src/controllers/useThemeController.js');

    assert.equal(isValidTheme(THEMES.LIGHT), true);
    assert.equal(isValidTheme(THEMES.DARK), true);
    assert.equal(isValidTheme(THEMES.MIDNIGHT), true);

    assert.equal(isValidTheme('solar'), false);
    assert.equal(isValidTheme('neon'), false);
    assert.equal(isValidTheme(''), false);
    assert.equal(isValidTheme(null), false);
    assert.equal(isValidTheme(undefined), false);
    assert.equal(ALLOWED_THEMES.length, 3);
  } finally {
    await server.close();
  }
});

test('useThemeController se carga limpiamente y expone la API de preferencias visuales', async () => {
  const server = await createServer({ server: { middlewareMode: true, hmr: false }, appType: 'custom' });
  try {
    const { useThemeController } = await server.ssrLoadModule('/src/controllers/useThemeController.js');
    assert.equal(typeof useThemeController, 'function');
  } finally {
    await server.close();
  }
});

test('useThemeController exporta constantes de almacenamiento para sincronizacion cross-tab', async () => {
  const server = await createServer({ server: { middlewareMode: true, hmr: false }, appType: 'custom' });
  try {
    const { THEME_STORAGE_KEYS } = await server.ssrLoadModule('/src/controllers/useThemeController.js');
    assert.equal(THEME_STORAGE_KEYS.THEME, 'project-planner-theme');
    assert.equal(THEME_STORAGE_KEYS.FONT_SCALE, 'project-planner-font-scale');
  } finally {
    await server.close();
  }
});

test('useAppController integra useThemeController sin romper su API publica', async () => {
  const server = await createServer({ server: { middlewareMode: true, hmr: false }, appType: 'custom' });
  try {
    const { useAppController } = await server.ssrLoadModule('/src/controllers/useAppController.jsx');
    assert.equal(typeof useAppController, 'function');
  } finally {
    await server.close();
  }
});
