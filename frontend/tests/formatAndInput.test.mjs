import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';
import { formatMoney, formatDateInput, formatDate, formatPercentage, getYearOptions } from '../src/utils/format.js';

test('formatMoney formatea cantidades a M, K y unidades legibles', () => {
  assert.equal(formatMoney(1500000), '$1.5M');
  assert.equal(formatMoney(250000), '$250K');
  assert.equal(formatMoney(500), '$500');
  assert.equal(formatMoney(0), '$0');
});

test('formatPercentage formatea porcentajes redondeados', () => {
  assert.equal(formatPercentage(94.2), '94%');
  assert.equal(formatPercentage(100), '100%');
  assert.equal(formatPercentage('invalid'), '0%');
});

test('formatDateInput devuelve formato YYYY-MM-DD', () => {
  const date = new Date(2026, 9, 29); // Oct 29, 2026
  assert.equal(formatDateInput(date), '2026-10-29');
});

test('Input renderiza label, error accesible y clases multitema con Vite SSR', async () => {
  const server = await createServer({ server: { middlewareMode: true, hmr: false }, appType: 'custom' });
  try {
    const { default: Input } = await server.ssrLoadModule('/src/components/common/Input.jsx');
    const html = renderToStaticMarkup(
      React.createElement(Input, {
        label: 'Nombre de prueba',
        error: 'Campo obligatorio',
        placeholder: 'Escribe aquí...',
        required: true,
        defaultValue: 'Valor test',
      })
    );
    assert.ok(html.includes('Nombre de prueba'));
    assert.ok(html.includes('Campo obligatorio'));
    assert.ok(html.includes('role="alert"'));
    assert.ok(html.includes('aria-invalid="true"'));
    assert.ok(html.includes('border-red-500'));
  } finally {
    await server.close();
  }
});

test('Select renderiza opciones, clases multitema y soporta options y children con Vite SSR', async () => {
  const server = await createServer({ server: { middlewareMode: true, hmr: false }, appType: 'custom' });
  try {
    const { default: Select } = await server.ssrLoadModule('/src/components/common/Select.jsx');
    const htmlFromOptions = renderToStaticMarkup(
      React.createElement(Select, {
        'aria-label': 'Filtro de prueba',
        className: 'custom-filter-class',
        options: [
          { value: 'all', label: 'Todos' },
          { value: 'active', label: 'Activos' },
        ],
      })
    );
    assert.ok(htmlFromOptions.includes('aria-label="Filtro de prueba"'));
    assert.ok(htmlFromOptions.includes('custom-filter-class'));
    assert.ok(htmlFromOptions.includes('value="all"'));
    assert.ok(htmlFromOptions.includes('Todos'));
    assert.ok(htmlFromOptions.includes('value="active"'));
    assert.ok(htmlFromOptions.includes('Activos'));
    assert.ok(htmlFromOptions.includes('midnight:border-cyan-800/40'));

    const htmlFromChildren = renderToStaticMarkup(
      React.createElement(
        Select,
        { 'aria-label': 'Selector children' },
        React.createElement('option', { value: 'opt1' }, 'Opción 1')
      )
    );
    assert.ok(htmlFromChildren.includes('Opción 1'));
    assert.ok(htmlFromChildren.includes('value="opt1"'));
  } finally {
    await server.close();
  }
});

test('getYearOptions genera ventana móvil configurable e incluye años históricos', () => {
  const current = new Date().getFullYear();
  const options = getYearOptions(1, 2);
  assert.equal(options.length, 4); // [current - 1, current, current + 1, current + 2]
  assert.equal(options[0].value, String(current - 1));
  assert.equal(options[options.length - 1].value, String(current + 2));

  // Con años históricos previos a la ventana estándar
  const withHistory = getYearOptions(1, 2, [2022]);
  assert.equal(withHistory[0].value, '2022');
  assert.ok(withHistory.some((opt) => opt.value === String(current)));
});
