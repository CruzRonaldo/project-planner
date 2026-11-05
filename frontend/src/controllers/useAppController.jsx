import React, { useEffect, useCallback, useMemo } from 'react';
import { useAuthController } from './useAuthController';
import { useThemeController } from './useThemeController';
import { useNavigationController } from './useNavigationController';
import { useTeamController } from './useTeamController';
import { useProjectsController } from './useProjectsController';
import { useIntegrationsController } from './useIntegrationsController';

// Importamos vistas desde el barrel centralizado
import {
  DashboardContent,
  StrategicPlanning,
  Portfolio,
  Operations,
  TechnicalTeam,
  HumanResources,
  Integrations,
  RolesManagement,
  Configuration,
} from '../views';

/**
 * Controlador Principal y Orquestador de la Aplicación (Patrón Facade).
 *
 * Desacopla la lógica de negocio en seis controladores atómicos:
 * 1. useProjectsController: Proyectos, Gantt y Gestión Operativa
 * 2. useTeamController: Directorio técnico, nómina, historial e incidencias
 * 3. useAuthController: Sesión, tokens, RBAC y perfil de usuario
 * 4. useThemeController: Paleta multitema y escala de accesibilidad tipográfica
 * 5. useNavigationController: Rutas, navegación y barra de búsqueda
 * 6. useIntegrationsController: Conectores externos (Google Drive, Make, Revit APS)
 *
 * Expone el contrato público unificado para App.jsx y los componentes de vista.
 */
export function useAppController() {
  // Detección de entorno: en producción o con VITE_HIDE_MOCKS no se cargan datos simulados por defecto
  const isProduction =
    import.meta.env.PROD ||
    (typeof window !== 'undefined' &&
      !['localhost', '127.0.0.1'].includes(window.location.hostname));
  const hideMocks = isProduction || import.meta.env.VITE_HIDE_MOCKS === 'true';

  // 1. Dominio de Proyectos, Portafolio y Planificación Operativa
  const projects = useProjectsController({ hideMocks });

  // 2. Dominio de Personal, Directorio Técnico y Recursos Humanos
  const team = useTeamController({
    hideMocks,
    projects: projects.portfolioData?.projects || [],
  });

  // 3. Dominio de Autenticación, Sesión y Perfil de Usuario
  const auth = useAuthController({
    users: team.users,
    setUsers: team.setUsers,
  });

  // 4. Dominio de Apariencia Visual, Temas y Accesibilidad Tipográfica
  const theme = useThemeController();

  // 5. Dominio de Navegación, Enrutamiento y Control de Acceso (RBAC)
  const navigation = useNavigationController({
    currentUser: auth.displayedCurrentUser,
    isAuthenticated: auth.isAuthenticated,
    isInitializing: auth.isInitializing,
  });

  // 6. Dominio de Conectores Externos e Integraciones (Google Drive, Make, Revit)
  const integrations = useIntegrationsController({ hideMocks });

  // Sincronizar asignaciones remotas de proyectos al equipo técnico si se reciben del backend
  useEffect(() => {
    if (projects.remoteAssignments?.length > 0) {
      team.setTechnicalTeamData((prev) => ({
        ...prev,
        assignments: projects.remoteAssignments,
      }));
    }
  }, [projects.remoteAssignments, team.setTechnicalTeamData]);

  // Cargar personal desde el backend al autenticar la sesión
  useEffect(() => {
    if (!auth.isAuthenticated) return undefined;
    const timer = window.setTimeout(() => {
      team.refreshTeamMembers().catch((error) => {
        console.error('Error al sincronizar el personal desde la Base de Datos:', error);
      });
      if (auth.canManage) {
        team.refreshHumanResourcesRecords().catch((error) => {
          console.error('Error al sincronizar incidencias e historial:', error);
        });
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, [auth.canManage, auth.isAuthenticated, team.refreshHumanResourcesRecords, team.refreshTeamMembers]);

  // Enrutar valor de búsqueda según la vista activa
  const searchValue = useMemo(() => {
    switch (navigation.activeView) {
      case 'portfolio':
        return projects.portfolioQuery;
      case 'operations':
        return projects.operationsQuery;
      case 'technical-team':
        return team.technicalTeamQuery;
      case 'human-resources':
        return team.humanResourcesQuery;
      case 'integrations':
        return integrations.integrationsQuery;
      default:
        return undefined;
    }
  }, [
    navigation.activeView,
    projects.portfolioQuery,
    projects.operationsQuery,
    team.technicalTeamQuery,
    team.humanResourcesQuery,
    integrations.integrationsQuery,
  ]);

  // Enrutar despachador de búsqueda según la vista activa
  const onSearchChange = useMemo(() => {
    switch (navigation.activeView) {
      case 'portfolio':
        return projects.setPortfolioQuery;
      case 'operations':
        return projects.setOperationsQuery;
      case 'technical-team':
        return team.setTechnicalTeamQuery;
      case 'human-resources':
        return team.setHumanResourcesQuery;
      case 'integrations':
        return integrations.setIntegrationsQuery;
      default:
        return undefined;
    }
  }, [
    navigation.activeView,
    projects.setPortfolioQuery,
    projects.setOperationsQuery,
    team.setTechnicalTeamQuery,
    team.setHumanResourcesQuery,
    integrations.setIntegrationsQuery,
  ]);

  // Lista de responsables derivada del equipo técnico para selección en órdenes operativas
  const responsibleOptions = useMemo(() => {
    return (team.technicalTeamData?.members || []).map((member) => ({
      id: member.id,
      name: member.firstNames
        ? `${member.firstNames} ${member.lastNames}`.trim()
        : member.name || 'Sin nombre',
      specialty: member.specialty || '',
    }));
  }, [team.technicalTeamData?.members]);

  // Renderizador declarativo de vistas del sistema
  const renderActiveView = useCallback(() => {
    if (navigation.activeView === 'planning') {
      return (
        <StrategicPlanning
          data={projects.strategicPlanningData}
          onChange={projects.handlePlanningChange}
          canManage={auth.canManage}
        />
      );
    }
    if (navigation.activeView === 'portfolio') {
      return (
        <Portfolio
          data={projects.portfolioData}
          onChange={projects.setPortfolioData}
          query={projects.portfolioQuery}
          onQueryChange={projects.setPortfolioQuery}
          canManage={auth.canManage}
          isAdmin={auth.isAdmin}
          currentUser={auth.displayedCurrentUser}
          currentUserName={auth.displayedCurrentUser?.name}
        />
      );
    }
    if (navigation.activeView === 'operations') {
      return (
        <Operations
          data={projects.operationsData}
          onChange={projects.setOperationsData}
          query={projects.operationsQuery}
          onQueryChange={projects.setOperationsQuery}
          canManage={auth.canManage}
          projectOptions={projects.projectOptions}
          responsibleOptions={responsibleOptions}
        />
      );
    }
    if (navigation.activeView === 'technical-team') {
      return (
        <TechnicalTeam
          data={team.technicalTeamData}
          onChange={team.setTechnicalTeamData}
          onMemberCreated={team.registerPersistedTeamMember}
          onRefreshMembers={team.refreshTeamMembers}
          onPersistMember={team.persistTechnicalMember}
          query={team.technicalTeamQuery}
          onQueryChange={team.setTechnicalTeamQuery}
          canManage={auth.canManage}
          projectOptions={projects.projectOptions}
          syncLoading={team.teamMembersLoading}
          syncError={team.teamMembersError}
        />
      );
    }
    if (navigation.activeView === 'human-resources') {
      return (
        <HumanResources
          data={team.humanResourcesData}
          onChange={team.setHumanResourcesData}
          onPersistMember={team.persistHumanResourcesMember}
          onCreateIncident={auth.canManage ? team.createPersonnelIncident : undefined}
          onTransitionIncident={auth.canManage ? team.transitionPersonnelIncident : undefined}
          onRefreshRecords={auth.canManage ? team.refreshHumanResourcesRecords : undefined}
          query={team.humanResourcesQuery}
          onQueryChange={team.setHumanResourcesQuery}
          canManage={auth.canManage}
          projectOptions={projects.projectOptions}
          syncLoading={team.teamMembersLoading || (auth.canManage && team.humanResourcesRecordsLoading)}
          syncError={[team.teamMembersError, auth.canManage ? team.humanResourcesRecordsError : ''].filter(Boolean).join(' ')}
          syncedAt={team.teamMembersSyncedAt}
        />
      );
    }
    if (navigation.activeView === 'integrations') {
      return (
        <Integrations
          data={integrations.integrationsData}
          onChange={integrations.setIntegrationsData}
          query={integrations.integrationsQuery}
          onQueryChange={integrations.setIntegrationsQuery}
        />
      );
    }
    if (navigation.activeView === 'configuracion') {
      return (
        <Configuration
          currentUser={auth.displayedCurrentUser}
          onUpdateCurrentUser={auth.handleUpdateCurrentUser}
          onSessionTokenChange={auth.handleSessionTokenChange}
          fontScale={theme.fontScale}
          setFontScale={theme.setFontScale}
          users={team.users}
          onAddMember={team.handleAddMember}
          theme={theme.theme}
          setTheme={theme.setTheme}
        />
      );
    }
    if (navigation.activeView === 'roles' && auth.isAdmin) {
      return (
        <RolesManagement
          users={team.users}
          onToggleSubAdmin={team.handleToggleSubAdmin}
        />
      );
    }
    return (
      <DashboardContent
        portfolioData={projects.portfolioData}
        strategicPlanningData={projects.strategicPlanningData}
        onNavigate={navigation.setActiveView}
      />
    );
  }, [
    navigation.activeView,
    navigation.setActiveView,
    projects.strategicPlanningData,
    projects.handlePlanningChange,
    projects.portfolioData,
    projects.setPortfolioData,
    projects.portfolioQuery,
    projects.setPortfolioQuery,
    projects.operationsData,
    projects.setOperationsData,
    projects.operationsQuery,
    projects.setOperationsQuery,
    integrations.integrationsData,
    integrations.setIntegrationsData,
    integrations.integrationsQuery,
    integrations.setIntegrationsQuery,
    projects.projectOptions,
    team.technicalTeamData,
    team.setTechnicalTeamData,
    team.registerPersistedTeamMember,
    team.refreshTeamMembers,
    team.persistTechnicalMember,
    team.technicalTeamQuery,
    team.setTechnicalTeamQuery,
    team.teamMembersLoading,
    team.teamMembersError,
    team.teamMembersSyncedAt,
    team.humanResourcesData,
    team.setHumanResourcesData,
    team.persistHumanResourcesMember,
    team.createPersonnelIncident,
    team.transitionPersonnelIncident,
    team.refreshHumanResourcesRecords,
    team.humanResourcesQuery,
    team.setHumanResourcesQuery,
    team.humanResourcesRecordsLoading,
    team.humanResourcesRecordsError,
    team.users,
    team.handleAddMember,
    team.handleToggleSubAdmin,
    auth.canManage,
    auth.isAdmin,
    auth.displayedCurrentUser,
    auth.handleUpdateCurrentUser,
    auth.handleSessionTokenChange,
    theme.fontScale,
    theme.setFontScale,
    theme.theme,
    theme.setTheme,
    responsibleOptions,
  ]);

  return {
    isInitializing: auth.isInitializing,
    isAuthenticated: auth.isAuthenticated,
    displayedCurrentUser: auth.displayedCurrentUser,
    activeView: navigation.activeView,
    setActiveView: navigation.setActiveView,
    fontScale: theme.fontScale,
    setFontScale: theme.setFontScale,
    theme: theme.theme,
    setTheme: theme.setTheme,
    users: team.users,
    handleLogin: auth.handleLogin,
    handleLogout: auth.handleLogout,
    handleToggleSubAdmin: team.handleToggleSubAdmin,
    allowedSidebarItems: navigation.allowedSidebarItems,
    allowedMobileItems: navigation.allowedMobileItems,
    searchPlaceholder: navigation.searchPlaceholder,
    searchValue,
    onSearchChange,
    renderActiveView,
  };
}
