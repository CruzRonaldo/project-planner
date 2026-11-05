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

test('FormattedAuditText formatea negritas con asteriscos en strong con text-inherit', async () => {
  const server = await createServer({ server: { middlewareMode: true, hmr: false }, appType: 'custom' });
  try {
    const { default: FormattedAuditText } = await server.ssrLoadModule('/src/components/common/FormattedAuditText.jsx');
    const html = renderToStaticMarkup(
      React.createElement(FormattedAuditText, { text: 'Este es un texto con **negrita importante** en el chat.' })
    );

    assert.ok(html.includes('<strong'), 'Debe generar una etiqueta <strong>');
    assert.ok(html.includes('negrita importante</strong>'), 'El texto resaltado debe ir dentro de <strong>');
    assert.ok(html.includes('font-bold'), 'Debe tener clase font-bold');
    assert.ok(html.includes('text-inherit'), 'Debe tener clase text-inherit');
  } finally {
    await server.close();
  }
});

test('FormattedAuditText renderiza encabezados, listas y bloques de codigo Markdown', async () => {
  const server = await createServer({ server: { middlewareMode: true, hmr: false }, appType: 'custom' });
  try {
    const { default: FormattedAuditText } = await server.ssrLoadModule('/src/components/common/FormattedAuditText.jsx');
    const markdownSample = `
### Regla de Negocio
Aquí tienes las especificaciones:
- Requisito 1: Código limpio
- Requisito 2: Tests pasando

\`\`\`javascript
const status = "RELEASE";
\`\`\`
    `.trim();

    const html = renderToStaticMarkup(
      React.createElement(FormattedAuditText, { text: markdownSample })
    );

    // Titulo h3
    assert.ok(html.includes('<h3'), 'Debe generar encabezado <h3>');
    assert.ok(html.includes('Regla de Negocio</h3>'), 'Debe contener el texto del encabezado');
    assert.ok(html.includes('text-cyan-300'), 'El encabezado h3 debe tener estilo text-cyan-300');

    // Lista desordenada
    assert.ok(html.includes('<ul'), 'Debe generar lista <ul>');
    assert.ok(html.includes('list-disc'), 'La lista debe incluir clase list-disc');
    assert.ok(html.includes('<li'), 'Debe incluir elementos <li>');

    // Bloque de codigo
    assert.ok(html.includes('<pre'), 'Debe generar bloque <pre>');
    assert.ok(html.includes('bg-slate-950/90'), 'Debe tener fondo oscuro estilizado');
    assert.ok(html.includes('const status = &quot;RELEASE&quot;;'), 'Debe contener el codigo sin acentos graves');
  } finally {
    await server.close();
  }
});


