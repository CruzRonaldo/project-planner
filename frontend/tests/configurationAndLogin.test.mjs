import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';

test('Configuration renderiza perfiles, preferencias y acciones de administración según rol', async () => {
  const server = await createServer({ server: { middlewareMode: true, hmr: false }, appType: 'custom' });
  try {
    const { default: Configuration } = await server.ssrLoadModule('/src/views/common/Configuration.jsx');

    const adminUser = {
      name: 'Carlos Mendoza',
      username: 'admin',
      roleLabel: 'Project Manager',
      accountType: 'admin',
    };

    const dummyUsers = [
      { id: 'usr-1', name: 'Luis Gonzales', email: 'sistemas@projectplanner.com', isOnline: true },
      { id: 'usr-2', name: 'Andrea Rojas', email: 'civil@projectplanner.com', isOnline: false },
    ];

    const adminHtml = renderToStaticMarkup(
      React.createElement(Configuration, {
        currentUser: adminUser,
        fontScale: 100,
        setFontScale: () => {},
        theme: 'midnight',
        setTheme: () => {},
        users: dummyUsers,
        onAddMember: () => {},
      })
    );

    // Secciones principales y botones interactivos
    assert.ok(adminHtml.includes('Configuración del Sistema'));
    assert.ok(adminHtml.includes('Perfil de Usuario'));
    assert.ok(adminHtml.includes('Cambiar Contraseña'));
    assert.ok(adminHtml.includes('Editar Perfil'));
    assert.ok(adminHtml.includes('Teléfono de Contacto'));
    assert.ok(adminHtml.includes('Preferencias del Sistema'));
    assert.ok(adminHtml.includes('Parámetros del Proyecto'));
    assert.ok(adminHtml.includes('Directorio y Equipo Técnico'));
    assert.ok(adminHtml.includes('Respaldo y Seguridad'));
    assert.ok(adminHtml.includes('Exportar Datos'));
    assert.ok(adminHtml.includes('Bitácora de Auditoría'));

    // Vista de usuario no-administrador
    const techUser = {
      name: 'Andrea Rojas',
      username: 'civil',
      roleLabel: 'Equipo Técnico',
      accountType: 'user',
      photo: 'data:image/png;base64,mockphotodata',
    };

    const techHtml = renderToStaticMarkup(
      React.createElement(Configuration, {
        currentUser: techUser,
        fontScale: 100,
        setFontScale: () => {},
        theme: 'dark',
        setTheme: () => {},
        users: dummyUsers,
      })
    );

    assert.ok(techHtml.includes('Perfil de Usuario'));
    assert.ok(techHtml.includes('Cambiar Contraseña'));
    assert.ok(techHtml.includes('Editar Perfil'));
    assert.ok(techHtml.includes('Eliminar foto'));
    assert.ok(techHtml.includes('Preferencias del Sistema'));
    assert.ok(!techHtml.includes('Respaldo y Seguridad'));
    assert.ok(!techHtml.includes('Exportar Datos'));
    assert.ok(!techHtml.includes('Directorio y Equipo Técnico'));
  } finally {
    await server.close();
  }
});

test('LoginScreen contiene botones interactivos para recuperación y contacto con soporte', async () => {
  const server = await createServer({ server: { middlewareMode: true, hmr: false }, appType: 'custom' });
  try {
    const { default: LoginScreen } = await server.ssrLoadModule('/src/views/auth/LoginScreen.jsx');

    const html = renderToStaticMarkup(
      React.createElement(LoginScreen, { onLogin: () => {} })
    );

    // Contenido general
    assert.ok(html.includes('PROJECT PLANNER'));
    assert.ok(html.includes('Iniciar Sesión'));
    assert.ok(html.includes('¿Olvidaste tu contraseña?'));
    assert.ok(html.includes('Contacta al administrador del sistema'));

    // Verificar que no son enlaces muertos href="#"
    assert.ok(!html.includes('href="#"'));

    // Verificar que los textos están en botones interactivos
    assert.match(html, /<button[^>]*>[^<]*¿Olvidaste tu contraseña\?[^<]*<\/button>/);
    assert.match(html, /<button[^>]*>[^<]*Contacta al administrador del sistema[^<]*<\/button>/);
  } finally {
    await server.close();
  }
});

test('StrategicPlanning Hitos Globales sincroniza con el filtro del cronograma sin select duplicado', async () => {
  const server = await createServer({ server: { middlewareMode: true, hmr: false }, appType: 'custom' });
  try {
    const { default: StrategicPlanning } = await server.ssrLoadModule('/src/views/admin/StrategicPlanning.jsx');
    const { createStrategicPlanningData } = await server.ssrLoadModule('/src/mocks/strategicPlanningData.js');

    const data = createStrategicPlanningData();
    const html = renderToStaticMarkup(
      React.createElement(StrategicPlanning, { data, onChange: () => {}, canManage: true })
    );

    // No debe existir el select id="milestone-project-filter"
    assert.ok(!html.includes('id="milestone-project-filter"'));
    assert.ok(!html.includes('aria-label="Filtrar hitos por proyecto"'));

    // Debe mostrar la cantidad de hitos registrados cuando no hay filtro específico
    assert.ok(html.includes('5 hitos registrados'));
  } finally {
    await server.close();
  }
});

test('Campos de contraseña incluyen botones con icono de ojo para alternar visibilidad', async () => {
  const server = await createServer({ server: { middlewareMode: true, hmr: false }, appType: 'custom' });
  try {
    const { default: LoginScreen } = await server.ssrLoadModule('/src/views/auth/LoginScreen.jsx');
    const { AddTechnicalMemberDialog } = await server.ssrLoadModule('/src/views/technical/TechnicalTeam.jsx');
    const { default: projectsApi } = await server.ssrLoadModule('/src/services/projectsApi.js');

    // 1. LoginScreen tiene botón de visualización de contraseña con icono
    const loginHtml = renderToStaticMarkup(
      React.createElement(LoginScreen, { onLogin: () => {} })
    );
    assert.ok(loginHtml.includes('aria-label="Ver contraseña"'));

    // 2. AddTechnicalMemberDialog tiene botones de visualización de contraseña para ambas claves
    const techDialogHtml = renderToStaticMarkup(
      React.createElement(AddTechnicalMemberDialog, {
        existingData: { members: [] },
        onSubmit: () => {},
        onClose: () => {},
      })
    );
    assert.ok(techDialogHtml.includes('Contraseña inicial'));
    assert.ok(techDialogHtml.includes('Confirmar contraseña'));
    assert.ok(techDialogHtml.includes('aria-label="Ver contraseña"'));
    assert.ok(techDialogHtml.includes('aria-label="Ver confirmación de contraseña"'));

    // 3. projectsApi permite verificar primero la clave actual y luego cambiarla
    assert.equal(typeof projectsApi.verifyCurrentPassword, 'function');
    assert.equal(typeof projectsApi.changePassword, 'function');
    assert.equal(typeof projectsApi.validateSession, 'function');
  } finally {
    await server.close();
  }
});

test('LoadingScreen renderiza logotipo, mensaje de inicialización y barra animada', async () => {
  const server = await createServer({ server: { middlewareMode: true, hmr: false }, appType: 'custom' });
  try {
    const { default: LoadingScreen } = await server.ssrLoadModule('/src/views/auth/LoadingScreen.jsx');

    const html = renderToStaticMarkup(
      React.createElement(LoadingScreen)
    );

    assert.ok(html.includes('Inicializando Entorno...'));
    assert.ok(html.includes('Logo LS Empresa'));
    assert.ok(html.includes('loadingTrack'));
    assert.ok(html.includes('animate-loading-bar'));
  } finally {
    await server.close();
  }
});
