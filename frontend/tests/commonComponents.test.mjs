import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';

test('Components Common: Barrel export index.js exporta todos los componentes', async () => {
  const server = await createServer({ server: { middlewareMode: true, hmr: false }, appType: 'custom' });
  try {
    const common = await server.ssrLoadModule('/src/components/common/index.js');
    assert.equal(typeof common.EmptyState, 'function');
    assert.equal(typeof common.InlineAlert, 'function');
    assert.equal(typeof common.PageHeader, 'function');
    assert.equal(typeof common.StatusBadge, 'function');
    assert.equal(typeof common.Table, 'function');
    assert.equal(typeof common.TableHead, 'function');
    assert.equal(typeof common.TableRow, 'function');
    assert.equal(typeof common.SectionCardHeader, 'function');
    assert.equal(typeof common.FilterTabBar, 'function');
    assert.equal(typeof common.ReadOnlyField, 'function');
    assert.equal(typeof common.FootnoteText, 'function');
    assert.equal(typeof common.ClearFiltersButton, 'function');
  } finally {
    await server.close();
  }
});

test('EmptyState: renderiza título, descripción, borde opcional y rol status', async () => {
  const server = await createServer({ server: { middlewareMode: true, hmr: false }, appType: 'custom' });
  try {
    const { default: EmptyState } = await server.ssrLoadModule('/src/components/common/EmptyState.jsx');

    // Variante estándar
    const htmlBasic = renderToStaticMarkup(
      React.createElement(EmptyState, {
        title: 'Sin elementos',
        description: 'No se encontraron resultados para la búsqueda.',
      })
    );
    assert.ok(htmlBasic.includes('Sin elementos'));
    assert.ok(htmlBasic.includes('No se encontraron resultados'));
    assert.ok(htmlBasic.includes('role="status"'));
    assert.ok(!htmlBasic.includes('border-dashed'));

    // Variante bordered con acción
    const htmlBordered = renderToStaticMarkup(
      React.createElement(EmptyState, {
        title: 'Bandeja vacía',
        bordered: true,
        action: React.createElement('button', null, 'Crear nuevo'),
      })
    );
    assert.ok(htmlBordered.includes('border-dashed'));
    assert.ok(htmlBordered.includes('Crear nuevo'));
  } finally {
    await server.close();
  }
});

test('InlineAlert: renderiza variantes semánticas y roles de accesibilidad', async () => {
  const server = await createServer({ server: { middlewareMode: true, hmr: false }, appType: 'custom' });
  try {
    const { default: InlineAlert } = await server.ssrLoadModule('/src/components/common/InlineAlert.jsx');

    // Variante error con icono
    const htmlError = renderToStaticMarkup(
      React.createElement(
        InlineAlert,
        { variant: 'error', title: 'Error crítico', showIcon: true },
        'Credenciales incorrectas'
      )
    );
    assert.ok(htmlError.includes('role="alert"'));
    assert.ok(htmlError.includes('Error crítico'));
    assert.ok(htmlError.includes('Credenciales incorrectas'));
    assert.ok(htmlError.includes('border-red-200'));

    // Variante success
    const htmlSuccess = renderToStaticMarkup(
      React.createElement(InlineAlert, { variant: 'success' }, 'Guardado exitosamente')
    );
    assert.ok(htmlSuccess.includes('role="status"'));
    assert.ok(htmlSuccess.includes('Guardado exitosamente'));
    assert.ok(htmlSuccess.includes('border-emerald-200'));

    // Variante info
    const htmlInfo = renderToStaticMarkup(
      React.createElement(InlineAlert, { variant: 'info' }, 'Información del sistema')
    );
    assert.ok(htmlInfo.includes('role="status"'));
    assert.ok(htmlInfo.includes('Información del sistema'));
  } finally {
    await server.close();
  }
});

test('PageHeader: renderiza h1, subtítulo y botones de acción a la derecha', async () => {
  const server = await createServer({ server: { middlewareMode: true, hmr: false }, appType: 'custom' });
  try {
    const { default: PageHeader } = await server.ssrLoadModule('/src/components/common/PageHeader.jsx');

    const html = renderToStaticMarkup(
      React.createElement(
        PageHeader,
        {
          title: 'Portafolio Principal',
          subtitle: 'Visión general de proyectos activos',
        },
        React.createElement('button', null, 'Nuevo Proyecto')
      )
    );

    assert.ok(html.includes('<h1'));
    assert.ok(html.includes('Portafolio Principal'));
    assert.ok(html.includes('Visión general de proyectos activos'));
    assert.ok(html.includes('Nuevo Proyecto'));
  } finally {
    await server.close();
  }
});

test('StatusBadge: resuelve estados desde statusMap o catálogo array', async () => {
  const server = await createServer({ server: { middlewareMode: true, hmr: false }, appType: 'custom' });
  try {
    const { default: StatusBadge } = await server.ssrLoadModule('/src/components/common/StatusBadge.jsx');

    // Catálogo array (ej. technicalStatuses)
    const items = [
      { id: 'active', shortLabel: 'Activo', className: 'bg-emerald-50 text-emerald-700' },
      { id: 'leave', shortLabel: 'Licencia', className: 'bg-amber-50 text-amber-700' },
    ];

    const htmlArray = renderToStaticMarkup(
      React.createElement(StatusBadge, { status: 'active', items })
    );
    assert.ok(htmlArray.includes('Activo'));
    assert.ok(htmlArray.includes('bg-emerald-50'));

    // Objeto statusMap (ej. workflowStatuses)
    const map = {
      approved: { label: 'Aprobado', className: 'border-emerald-300' },
    };

    const htmlMap = renderToStaticMarkup(
      React.createElement(StatusBadge, { status: 'approved', statusMap: map })
    );
    assert.ok(htmlMap.includes('Aprobado'));
    assert.ok(htmlMap.includes('border-emerald-300'));
  } finally {
    await server.close();
  }
});

test('Table, TableHead y TableRow: generan estructura accesible con hover y bordes', async () => {
  const server = await createServer({ server: { middlewareMode: true, hmr: false }, appType: 'custom' });
  try {
    const { default: Table, TableHead, TableRow } = await server.ssrLoadModule('/src/components/common/Table.jsx');

    const columns = [
      { label: 'Nombre', align: 'left' },
      { label: 'Estado', align: 'center' },
      { label: 'Acciones', align: 'right' },
    ];

    const html = renderToStaticMarkup(
      React.createElement(
        Table,
        null,
        React.createElement(TableHead, { columns }),
        React.createElement(
          'tbody',
          null,
          React.createElement(
            TableRow,
            null,
            React.createElement('td', null, 'Proyecto Alfa'),
            React.createElement('td', null, 'En Curso'),
            React.createElement('td', null, 'Ver')
          )
        )
      )
    );

    assert.ok(html.includes('<table'));
    assert.ok(html.includes('<thead'));
    assert.ok(html.includes('scope="col"'));
    assert.ok(html.includes('Nombre'));
    assert.ok(html.includes('text-center'));
    assert.ok(html.includes('text-right'));
    assert.ok(html.includes('Proyecto Alfa'));
    assert.ok(html.includes('hover:bg-slate-50'));
  } finally {
    await server.close();
  }
});

test('SectionCardHeader, FilterTabBar, ReadOnlyField, FootnoteText y ClearFiltersButton', async () => {
  const server = await createServer({ server: { middlewareMode: true, hmr: false }, appType: 'custom' });
  try {
    const { default: SectionCardHeader } = await server.ssrLoadModule('/src/components/common/SectionCardHeader.jsx');
    const { default: FilterTabBar } = await server.ssrLoadModule('/src/components/common/FilterTabBar.jsx');
    const { default: ReadOnlyField } = await server.ssrLoadModule('/src/components/common/ReadOnlyField.jsx');
    const { default: FootnoteText } = await server.ssrLoadModule('/src/components/common/FootnoteText.jsx');
    const { default: ClearFiltersButton } = await server.ssrLoadModule('/src/components/common/ClearFiltersButton.jsx');

    // SectionCardHeader
    const headerHtml = renderToStaticMarkup(
      React.createElement(SectionCardHeader, {
        title: 'Historial',
        subtitle: 'Auditoría interna',
        titleAs: 'h3',
      })
    );
    assert.ok(headerHtml.includes('<h3'));
    assert.ok(headerHtml.includes('Historial'));
    assert.ok(headerHtml.includes('Auditoría interna'));

    // FilterTabBar
    const tabs = [
      { id: 'all', label: 'Todos', count: 12 },
      { id: 'active', label: 'Activos', count: 8 },
    ];
    const tabsHtml = renderToStaticMarkup(
      React.createElement(FilterTabBar, { tabs, activeTab: 'all', onChange: () => {} })
    );
    assert.ok(tabsHtml.includes('role="tablist"'));
    assert.ok(tabsHtml.includes('aria-selected="true"'));
    assert.ok(tabsHtml.includes('Todos'));
    assert.ok(tabsHtml.includes('12'));

    // ReadOnlyField
    const fieldHtml = renderToStaticMarkup(
      React.createElement(ReadOnlyField, { label: 'Correo', value: 'usuario@empresa.com' })
    );
    assert.ok(fieldHtml.includes('Correo'));
    assert.ok(fieldHtml.includes('usuario@empresa.com'));

    // FootnoteText
    const noteHtml = renderToStaticMarkup(
      React.createElement(FootnoteText, { text: 'Campos requeridos' })
    );
    assert.ok(noteHtml.includes('*'));
    assert.ok(noteHtml.includes('Campos requeridos'));

    // ClearFiltersButton
    const btnHtml = renderToStaticMarkup(
      React.createElement(ClearFiltersButton, { label: 'Limpiar filtros', onClick: () => {} })
    );
    assert.ok(btnHtml.includes('Limpiar filtros'));
    assert.ok(btnHtml.includes('<button'));
  } finally {
    await server.close();
  }
});
