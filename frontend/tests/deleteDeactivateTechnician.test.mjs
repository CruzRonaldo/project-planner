import assert from 'node:assert/strict';
import test from 'node:test';
import { createServer } from 'vite';

test('projectsApi expone deleteTeamMember y realiza peticiones DELETE con el modo especificado', async () => {
  const server = await createServer({ server: { middlewareMode: true, hmr: false }, appType: 'custom' });
  try {
    const { projectsApi } = await server.ssrLoadModule('/src/services/projectsApi.js');
    assert.equal(typeof projectsApi.deleteTeamMember, 'function');
  } finally {
    await server.close();
  }
});

test('useTeamController y useAppController integran handleRemoveMember sin romper el contrato', async () => {
  const server = await createServer({ server: { middlewareMode: true, hmr: false }, appType: 'custom' });
  try {
    const { useTeamController } = await server.ssrLoadModule('/src/controllers/useTeamController.js');
    assert.equal(typeof useTeamController, 'function');

    const { useAppController } = await server.ssrLoadModule('/src/controllers/useAppController.jsx');
    assert.equal(typeof useAppController, 'function');
  } finally {
    await server.close();
  }
});

test('DeleteTechnicalMemberDialog se carga limpiamente en Vite SSR y está disponible en componentes', async () => {
  const server = await createServer({ server: { middlewareMode: true, hmr: false }, appType: 'custom' });
  try {
    const dialogModule = await server.ssrLoadModule('/src/views/technical/components/DeleteTechnicalMemberDialog.jsx');
    assert.equal(typeof dialogModule.default, 'function');
    assert.equal(typeof dialogModule.DeleteTechnicalMemberDialog, 'function');

    const technicalBarrel = await server.ssrLoadModule('/src/views/technical/components/index.js');
    assert.equal(typeof technicalBarrel.DeleteTechnicalMemberDialog, 'function');
  } finally {
    await server.close();
  }
});

test('Los diccionarios es.json y en.json contienen todas las claves para dar de baja y eliminar integrantes', async () => {
  const server = await createServer({ server: { middlewareMode: true, hmr: false }, appType: 'custom' });
  try {
    const { createTranslate } = await server.ssrLoadModule('/src/context/LanguageContext.jsx');
    const tEs = createTranslate('es');
    const tEn = createTranslate('en');

    // Comprobar modo de dar de baja
    assert.equal(tEs('technicalTeam.deactivateTitle'), 'Dar de Baja al Técnico');
    assert.equal(tEn('technicalTeam.deactivateTitle'), 'Deactivate Technician');
    assert.equal(tEs('technicalTeam.deactivateAction'), 'Dar de baja');
    assert.equal(tEn('technicalTeam.deactivateAction'), 'Deactivate');

    const promptEs = tEs('technicalTeam.deactivateConfirmPrompt', '', { name: 'Carlos Mendoza' });
    const promptEn = tEn('technicalTeam.deactivateConfirmPrompt', '', { name: 'Carlos Mendoza' });
    assert.equal(promptEs, '¿Deseas dar de baja a Carlos Mendoza?');
    assert.equal(promptEn, 'Do you want to deactivate Carlos Mendoza?');

    // Comprobar modo de eliminación permanente
    assert.equal(tEs('technicalTeam.hardDeleteTitle'), 'Confirmar Eliminación Definitiva');
    assert.equal(tEn('technicalTeam.hardDeleteTitle'), 'Confirm Permanent Deletion');
    assert.equal(tEs('technicalTeam.hardDeleteAction'), 'Eliminar Definitivamente');
    assert.equal(tEn('technicalTeam.hardDeleteAction'), 'Permanently Delete');

    const hardPromptEs = tEs('technicalTeam.hardDeleteConfirmPrompt', '', { name: 'Carlos Mendoza' });
    const hardPromptEn = tEn('technicalTeam.hardDeleteConfirmPrompt', '', { name: 'Carlos Mendoza' });
    assert.equal(hardPromptEs, '¿Estás seguro de que deseas eliminar permanentemente a Carlos Mendoza?');
    assert.equal(hardPromptEn, 'Are you sure you want to permanently delete Carlos Mendoza?');

    // Comprobar tooltips de RRHH
    assert.ok(tEs('humanResources.deactivateTooltip').includes('Dar de baja'));
    assert.ok(tEn('humanResources.deactivateTooltip').includes('Deactivate'));
    assert.ok(tEs('humanResources.deleteTooltip').includes('Eliminar permanentemente'));
    assert.ok(tEn('humanResources.deleteTooltip').includes('Permanently delete'));

    // Comprobar títulos de toasts
    assert.equal(tEs('toasts.Baja Registrada'), 'Baja Registrada');
    assert.equal(tEn('toasts.Baja Registrada'), 'Deactivation Registered');
    assert.equal(tEs('toasts.Técnico Eliminado'), 'Técnico Eliminado');
    assert.equal(tEn('toasts.Técnico Eliminado'), 'Technician Deleted');
  } finally {
    await server.close();
  }
});

test('projectsApi sanitiza identificadores prefijados (tech-db-X, hr-db-X) al llamar al backend', async () => {
  const server = await createServer({ server: { middlewareMode: true, hmr: false }, appType: 'custom' });
  try {
    const { projectsApi } = await server.ssrLoadModule('/src/services/projectsApi.js');
    assert.equal(typeof projectsApi.deleteTeamMember, 'function');

    const { removeCachedTeamMember, writeCachedTeamMembers, readCachedTeamMembers } = await server.ssrLoadModule('/src/utils/teamMemberCache.js');
    const mockStorage = {
      store: {},
      getItem(k) { return this.store[k] ?? null; },
      setItem(k, v) { this.store[k] = String(v); },
    };
    writeCachedTeamMembers([{ id: 'tech-db-1', dbId: 1, name: 'Juan' }, { id: 'tech-db-2', dbId: 2, name: 'Pedro' }], mockStorage);
    removeCachedTeamMember(1, mockStorage);
    const remaining = readCachedTeamMembers(mockStorage);
    assert.equal(remaining.length, 1);
    assert.equal(remaining[0].dbId, 2);
  } finally {
    await server.close();
  }
});
