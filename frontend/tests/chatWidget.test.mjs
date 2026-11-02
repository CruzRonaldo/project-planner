import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';

test('ChatWidget renderiza el botón flotante con diseño corporativo y accesibilidad', async () => {
  const server = await createServer({ server: { middlewareMode: true, hmr: false }, appType: 'custom' });
  try {
    const { default: ChatWidget } = await server.ssrLoadModule('/src/components/common/ChatWidget.jsx');

    const html = renderToStaticMarkup(
      React.createElement(ChatWidget, {
        currentUser: {
          username: 'admin',
          role_display: 'Project Manager (Admin)',
          is_staff: true,
        },
      })
    );

    // Verifica la presencia del launcher flotante
    assert.ok(html.includes('Abrir Asistente de IA'), 'Debe contener el aria-label para abrir el asistente');
    assert.ok(html.includes('fixed bottom-6 right-6'), 'Debe ubicarse como botón flotante en la esquina inferior derecha');
  } finally {
    await server.close();
  }
});

