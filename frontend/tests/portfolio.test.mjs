import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';
import { addPortfolioProject, createPortfolioData, createProjectCode, filterPortfolio, formatMoney, getProjectDuration } from '../src/mocks/portfolioData.js';

const validDraft = {
  code: 'PRJ-2026-005', area: 'Edificaciones Comerciales', name: 'Torre Reforma Corporativa',
  startDate: '2026-01-15', endDate: '2026-07-15', totalBudget: '1200000', status: 'planning',
  leaderId: 'carlos', driveFolder: 'https://drive.google.com/drive/folders/prj-2026-005',
  description: 'Edificio corporativo con certificación ambiental.', createdBy: 'Carlos M.',
};

test('El código siguiente se genera por año sin repetir secuencias', () => {
  const data = createPortfolioData();
  assert.equal(createProjectCode(data, 2026), 'PRJ-2026-005');
  assert.equal(createProjectCode(data, 2027), 'PRJ-2027-001');
});

test('La duración se calcula en meses y rechaza rangos invertidos', () => {
  assert.equal(getProjectDuration('2026-01-15', '2026-07-15'), 6);
  assert.equal(getProjectDuration('2026-01-15', '2026-01-15'), 1);
  assert.equal(getProjectDuration('2026-07-15', '2026-01-15'), null);
  assert.equal(getProjectDuration('', ''), null);
});

test('Crear un proyecto lo agrega primero y registra la auditoría sin mutar el original', () => {
  const data = createPortfolioData();
  const updated = addPortfolioProject(data, validDraft, new Date(2026, 8, 5, 12));
  assert.equal(data.projects.length, 4);
  assert.equal(data.changes.length, 5);
  assert.equal(updated.projects.length, 5);
  assert.equal(updated.projects[0].code, 'PRJ-2026-005');
  assert.equal(updated.projects[0].name, 'Torre Reforma Corporativa');
  assert.equal(updated.projects[0].progress, 0);
  assert.equal(updated.projects[0].usedBudget, 0);
  assert.equal(updated.projects[0].totalBudget, 1200000);
  assert.equal(updated.projects[0].duration, 6);
  assert.deepEqual(updated.projects[0].members, ['CM']);
  assert.equal(updated.changes.length, 6);
  assert.equal(updated.changes[0].date, '2026-09-05');
  assert.match(updated.changes[0].change, /PRJ-2026-005/);
  assert.match(updated.changes[0].change, /\$1.2M/);
});

test('La carpeta de Drive es opcional', () => {
  const project = addPortfolioProject(createPortfolioData(), { ...validDraft, driveFolder: '' }).projects[0];
  assert.equal(project.driveFolder, '');
});

test('El alta rechaza códigos, datos, rangos y enlaces inválidos', () => {
  const data = createPortfolioData();
  assert.throws(() => addPortfolioProject(data, { ...validDraft, code: '005' }), /formato/);
  assert.throws(() => addPortfolioProject(data, { ...validDraft, code: 'prj-2026-001' }), /Ya existe/);
  assert.throws(() => addPortfolioProject(data, { ...validDraft, name: ' ' }), /nombre/);
  assert.throws(() => addPortfolioProject(data, { ...validDraft, area: 'Otra' }), /área técnica/);
  assert.throws(() => addPortfolioProject(data, { ...validDraft, endDate: '2025-01-01' }), /fecha final/);
  for (const totalBudget of [0, -1, '', 'abc', 1000000000001]) assert.throws(() => addPortfolioProject(data, { ...validDraft, totalBudget }), /presupuesto/);
  assert.throws(() => addPortfolioProject(data, { ...validDraft, status: 'completed' }), /estado inicial/);
  assert.throws(() => addPortfolioProject(data, { ...validDraft, leaderId: 'missing' }), /líder/);
  assert.throws(() => addPortfolioProject(data, { ...validDraft, driveFolder: 'https://example.com/carpeta' }), /Google Drive/);
  assert.equal(data.projects.length, 4);
});

test('La búsqueda encuentra código, nombre, área, estado y líder', () => {
  const data = createPortfolioData();
  assert.equal(filterPortfolio(data, 'PRJ-2026-002').projects[0].name, 'Puente Industrial');
  assert.equal(filterPortfolio(data, 'infraestructura').projects[0].name, 'Puente Industrial');
  assert.equal(filterPortfolio(data, 'Lucia').projects[0].name, 'Centro Comercial Norte');
  assert.equal(filterPortfolio(data, 'En Riesgo').projects[0].name, 'Hospital Regional');
  assert.equal(filterPortfolio(data, '', 'active').projects.length, 1);
  assert.deepEqual(filterPortfolio(data, 'no existe'), { projects: [], changes: [] });
});

test('Los presupuestos se muestran en un formato compacto', () => {
  assert.equal(formatMoney(1200000), '$1.2M');
  assert.equal(formatMoney(936000), '$936K');
  assert.equal(formatMoney(500), '$500');
});

test('Portafolio conserva sus tarjetas y muestra el alta solo a administradores', async () => {
  const server = await createServer({ server: { middlewareMode: true, hmr: false }, appType: 'custom' });
  try {
    const { default: Portfolio, NewProjectDialog } = await server.ssrLoadModule('/src/Portfolio.jsx');
    const data = createPortfolioData();
    const props = { data, onChange: () => {}, onQueryChange: () => {}, canManage: true, currentUserName: 'Carlos M.' };
    const html = renderToStaticMarkup(React.createElement(Portfolio, props));
    assert.ok(html.includes('Repositorio de Proyectos'));
    assert.ok(html.includes('Crear Proyecto'));
    assert.equal((html.match(/aria-label="\d+ integrantes"/g) ?? []).length, 4);
    assert.ok(html.includes('Historial de Cambios Reciente'));

    const viewer = renderToStaticMarkup(React.createElement(Portfolio, { ...props, canManage: false }));
    assert.ok(!viewer.includes('>Crear Proyecto</button>'));
    const searched = renderToStaticMarkup(React.createElement(Portfolio, { ...props, query: 'Puente Industrial' }));
    assert.equal((searched.match(/aria-label="\d+ integrantes"/g) ?? []).length, 1);

    const dialog = renderToStaticMarkup(React.createElement(NewProjectDialog, { data, currentUserName: 'Carlos M.', onSubmit: () => {}, onClose: () => {} }));
    for (const field of ['Código del proyecto', 'Área técnica', 'Nombre del proyecto', 'Fecha de inicio', 'Fecha final estimada', 'Presupuesto estimado', 'Estado inicial', 'Líder de obra', 'Carpeta de Google Drive', 'Descripción / alcance']) assert.ok(dialog.includes(field));
    assert.ok(dialog.includes('Autogenerado'));
    assert.ok(dialog.includes('PRJ-'));
  } finally {
    await server.close();
  }
});
