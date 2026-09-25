import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  hasViewAccess,
  getSearchPlaceholder,
  getAllowedSidebarItems,
  getAllowedMobileItems,
  NAVIGATION_ITEMS,
  USER_ROLES,
} from '../config/navigation.config';

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
import projectsApi from '../services/projectsApi';

// Importamos datos mock aislados para visualización (se sustituirán con endpoints de Django)
import {
  createStrategicPlanningData,
  createPortfolioData,
  createOperationsData,
  createTechnicalTeamData,
  createHumanResourcesData,
  createIntegrationsData,
} from '../mocks';

const initialUsers = [
  {
    id: 'usr-admin',
    db_id: 4,
    username: 'Admin',
    name: 'Admin',
    email: 'admin@gmail.com',
    isAdmin: true,
    isSubAdmin: false,
    isOnline: true,
  },
  {
    id: 'usr-sistemas',
    db_id: 1,
    username: 'sistemas',
    name: 'Luis Gonzales (Sistemas)',
    email: 'sistemas@projectplanner.com',
    isAdmin: false,
    isSubAdmin: false,
    isOnline: false,
  },
  {
    id: 'usr-civil',
    db_id: 2,
    username: 'civil',
    name: 'Andrea Rojas (Civil)',
    email: 'civil@projectplanner.com',
    isAdmin: false,
    isSubAdmin: false,
    isOnline: false,
  },
  {
    id: 'usr-arquitectura',
    db_id: 3,
    username: 'arquitectura',
    name: 'Carlos Mendoza (Arquitectura)',
    email: 'arquitectura@projectplanner.com',
    isAdmin: false,
    isSubAdmin: false,
    isOnline: false,
  },
];

function createNameFromEmail(email) {
  const baseName = email
    .split('@')[0]
    .replace(/[._-]+/g, ' ')
    .trim();
  return (
    baseName
      .split(' ')
      .filter(Boolean)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ') || 'Usuario Técnico'
  );
}

export function useAppController() {
  const location = useLocation();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(true);

  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('project_planner_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('project_planner_user') !== null;
  });

  // Ruta normalizada del navegador
  const normalizedPath = useMemo(() => {
    return location.pathname.replace(/\/$/, '') || '/';
  }, [location.pathname]);

  // Derivar activeView a partir de la URL real
  const activeView = useMemo(() => {
    if (normalizedPath === '/login') return 'login';
    if (normalizedPath === '/' || normalizedPath === '/dashboard') return 'dashboard';
    const matched = NAVIGATION_ITEMS.find((item) => item.path === normalizedPath);
    return matched ? matched.id : 'dashboard';
  }, [normalizedPath]);

  // Detección de entorno: en producción o con VITE_HIDE_MOCKS no se cargan datos simulados por defecto
  const isProduction =
    import.meta.env.PROD ||
    (typeof window !== 'undefined' &&
      !['localhost', '127.0.0.1'].includes(window.location.hostname));
  const hideMocks = isProduction || import.meta.env.VITE_HIDE_MOCKS === 'true';

  // Estados de datos (en Render se inicializan vacíos por defecto)
  const [strategicPlanningData, setStrategicPlanningData] = useState(() =>
    hideMocks ? { projects: [], milestones: [] } : createStrategicPlanningData()
  );
  const [portfolioData, setPortfolioData] = useState(() =>
    hideMocks ? { projects: [], changes: [] } : createPortfolioData()
  );
  const [operationsData, setOperationsData] = useState(() =>
    hideMocks
      ? {
          metrics: { inProgress: 0, completed: 0, incidents: 0, efficiency: 0 },
          orders: [],
          activities: [],
          alerts: [],
          qualityChecks: [],
        }
      : createOperationsData()
  );
  const [technicalTeamData, setTechnicalTeamData] = useState(() =>
    hideMocks ? { members: [], assignments: [] } : createTechnicalTeamData()
  );
  const [humanResourcesData, setHumanResourcesData] = useState(() =>
    hideMocks
      ? {
          members: [],
          history: [],
          incidents: [],
        }
      : createHumanResourcesData()
  );
  const [integrationsData, setIntegrationsData] = useState(() =>
    hideMocks
      ? {
          integrations: [
            {
              id: 'drive',
              name: 'Google Drive',
              icon: 'cloud',
              status: 'offline',
              description: 'Sincronización de documentación y planos en la nube.',
              endpoint: 'Carpeta /Project Planner',
              frequency: 'Cada 10 min',
              errors: 0,
              lastActivity: 'Sin actividad',
              metrics: [
                { key: 'files', value: 0, label: 'archivos' },
                { key: 'projects', value: 0, label: 'proyectos' },
              ],
            },
            {
              id: 'revit',
              name: 'Revit / BIM Data',
              icon: 'model',
              status: 'offline',
              description: 'Importación de datos de modelado 3D BIM.',
              endpoint: 'BIM 360 / Modelos',
              frequency: 'Cada hora',
              errors: 0,
              lastActivity: 'Sin actividad',
              metrics: [
                { key: 'models', value: 0, label: 'modelos' },
                { key: 'sync', value: '-', label: 'última sync' },
              ],
            },
            {
              id: 'make',
              name: 'Make (Integromat)',
              icon: 'automation',
              status: 'offline',
              description: 'Automatización de procesos y conexión con servicios de terceros.',
              endpoint: 'Escenarios / Operaciones',
              frequency: 'Cada 30 min',
              errors: 0,
              lastActivity: 'Sin actividad',
              metrics: [
                { key: 'scenarios', value: 0, label: 'escenarios' },
                { key: 'errors', value: 0, label: 'con error' },
              ],
            },
          ],
          activities: [],
          uptime: 0,
        }
      : createIntegrationsData()
  );

  // Estados de búsqueda por pestaña
  const [portfolioQuery, setPortfolioQuery] = useState('');
  const [operationsQuery, setOperationsQuery] = useState('');
  const [technicalTeamQuery, setTechnicalTeamQuery] = useState('');
  const [humanResourcesQuery, setHumanResourcesQuery] = useState('');
  const [integrationsQuery, setIntegrationsQuery] = useState('');

  const [users, setUsers] = useState(() => {
    if (hideMocks) {
      return [];
    }
    try {
      const savedUsers = window.localStorage.getItem('project-planner-users');
      const parsedUsers = savedUsers ? JSON.parse(savedUsers) : null;
      const validUserIds = ['usr-admin', 'usr-sistemas', 'usr-civil', 'usr-arquitectura'];
      if (
        Array.isArray(parsedUsers) &&
        parsedUsers.length === 4 &&
        parsedUsers.every((u) => validUserIds.includes(u.id))
      ) {
        return parsedUsers;
      }
      window.localStorage.removeItem('project-planner-users');
      return initialUsers;
    } catch {
      return initialUsers;
    }
  });

  const [fontScale, setFontScale] = useState(() => {
    const savedScale = Number(
      window.localStorage.getItem('project-planner-font-scale')
    );
    return savedScale >= 85 && savedScale <= 120 ? savedScale : 100;
  });

  const [theme, setTheme] = useState(() => {
    return window.localStorage.getItem('project-planner-theme') || 'dark';
  });

  const registeredCurrentUser = useMemo(() => {
    if (currentUser?.accountType !== USER_ROLES.USER) return null;
    return users.find(
      (user) =>
        user.id === currentUser.id ||
        (user.email &&
          currentUser.email &&
          user.email.toLowerCase() === currentUser.email.toLowerCase())
    ) || null;
  }, [currentUser, users]);

  const displayedCurrentUser = useMemo(() => {
    if (!currentUser) return null;
    return {
      ...currentUser,
      name: currentUser.first_name
        ? `${currentUser.first_name} ${currentUser.last_name || ''}`.trim()
        : currentUser.username ||
          registeredCurrentUser?.name ||
          currentUser.name ||
          'Usuario',
      roleLabel:
        currentUser.role === USER_ROLES.ADMIN ||
        currentUser.is_superuser ||
        currentUser.accountType === USER_ROLES.ADMIN
          ? 'Project Manager'
          : registeredCurrentUser?.isSubAdmin
            ? 'SubAdministrador'
            : 'Equipo Técnico',
    };
  }, [currentUser, registeredCurrentUser]);

  const isAdmin =
    displayedCurrentUser?.accountType === USER_ROLES.ADMIN ||
    displayedCurrentUser?.role === USER_ROLES.ADMIN ||
    Boolean(displayedCurrentUser?.is_superuser);

  const canManage =
    isAdmin || displayedCurrentUser?.roleLabel === 'SubAdministrador';

  // Navegación real por URL con guardia RBAC
  const setActiveView = useCallback(
    (target) => {
      if (target === 'login') {
        navigate('/login');
        return;
      }
      const item = NAVIGATION_ITEMS.find(
        (n) => n.id === target || n.path === target
      );
      if (item) {
        if (hasViewAccess(item.id, displayedCurrentUser)) {
          navigate(item.path);
        } else {
          navigate('/dashboard', { replace: true });
        }
      } else {
        navigate('/dashboard');
      }
    },
    [displayedCurrentUser, navigate]
  );

  const handleLogin = useCallback(
    (userData) => {
      const accountType =
        userData?.role === USER_ROLES.ADMIN ||
        userData?.is_superuser ||
        userData?.accountType === USER_ROLES.ADMIN
          ? USER_ROLES.ADMIN
          : USER_ROLES.USER;

      const userToSave = {
        ...userData,
        accountType,
        name:
          userData?.username ||
          (userData?.email ? createNameFromEmail(userData.email) : 'Usuario'),
      };

      try {
        localStorage.setItem('project_planner_user', JSON.stringify(userToSave));
      } catch {}

      setCurrentUser(userToSave);
      setIsAuthenticated(true);
      navigate('/dashboard');
    },
    [navigate]
  );

  const handleToggleSubAdmin = useCallback((userId) => {
    setUsers((currentUsers) => {
      const targetUser = currentUsers.find((u) => u.id === userId);
      const newSubAdmin = targetUser ? !targetUser.isSubAdmin : false;
      projectsApi.toggleSubAdmin(userId, newSubAdmin).catch((err) => {
        console.error('Error al persistir rol de SubAdministrador:', err);
      });
      return currentUsers.map((user) =>
        user.id === userId ? { ...user, isSubAdmin: newSubAdmin } : user
      );
    });
  }, []);

  const handleLogout = useCallback(() => {
    // 1. Notificar al backend de forma asíncrona sin bloquear la UI
    if (currentUser?.username || currentUser?.email) {
      projectsApi
        .logoutUser({
          username: currentUser.username,
          email: currentUser.email,
        })
        .catch(() => {});
    }

    // 2. Limpieza inmediata del almacenamiento local y estados
    try {
      localStorage.removeItem('project_planner_user');
      localStorage.removeItem('project-planner-users');
    } catch {}

    setCurrentUser(null);
    setIsAuthenticated(false);
    navigate('/login', { replace: true });
  }, [currentUser, navigate]);

  // Efectos de inicialización y persistencia
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  // Sincronizar usuarios reales y presencia (En línea / Desconectado) desde la Base de Datos al recargar la app
  useEffect(() => {
    let isMounted = true;
    const syncUsersStatus = async () => {
      try {
        const remoteUsers = await projectsApi.getUsersStatus();
        if (isMounted && Array.isArray(remoteUsers)) {
          setUsers(remoteUsers);
          try {
            window.localStorage.setItem(
              'project-planner-users',
              JSON.stringify(remoteUsers)
            );
          } catch {}
        }
      } catch (err) {
        console.error('Error al sincronizar usuarios de la Base de Datos:', err);
      }
    };
    syncUsersStatus();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    window.localStorage.setItem('project-planner-users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    window.localStorage.setItem(
      'project-planner-font-scale',
      String(fontScale)
    );
    document.documentElement.style.fontSize = `${16 * (fontScale / 100)}px`;
  }, [fontScale]);

  useEffect(() => {
    window.localStorage.setItem('project-planner-theme', theme);
    const root = document.documentElement;
    root.classList.remove('light', 'dark', 'midnight');
    root.classList.add(theme);
    root.style.colorScheme = theme === 'light' ? 'light' : 'dark';
  }, [theme]);

  // Guardia de sincronización de rutas y sesión
  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      if (normalizedPath !== '/login') {
        navigate('/login', { replace: true });
      }
    } else {
      if (normalizedPath === '/login' || normalizedPath === '/') {
        navigate('/dashboard', { replace: true });
      } else if (!hasViewAccess(activeView, displayedCurrentUser)) {
        navigate('/dashboard', { replace: true });
      }
    }
  }, [isLoading, isAuthenticated, normalizedPath, activeView, displayedCurrentUser, navigate]);

  // Items de navegación permitidos
  const allowedSidebarItems = useMemo(() => {
    return getAllowedSidebarItems(displayedCurrentUser);
  }, [displayedCurrentUser]);

  const allowedMobileItems = useMemo(() => {
    return getAllowedMobileItems(displayedCurrentUser);
  }, [displayedCurrentUser]);

  const searchPlaceholder = useMemo(() => {
    return getSearchPlaceholder(activeView);
  }, [activeView]);

  // Valor y manejador de búsqueda según vista activa
  const searchValue = useMemo(() => {
    switch (activeView) {
      case 'portfolio':
        return portfolioQuery;
      case 'operations':
        return operationsQuery;
      case 'technical-team':
        return technicalTeamQuery;
      case 'human-resources':
        return humanResourcesQuery;
      case 'integrations':
        return integrationsQuery;
      default:
        return undefined;
    }
  }, [activeView, portfolioQuery, operationsQuery, technicalTeamQuery, humanResourcesQuery, integrationsQuery]);

  const onSearchChange = useMemo(() => {
    switch (activeView) {
      case 'portfolio':
        return setPortfolioQuery;
      case 'operations':
        return setOperationsQuery;
      case 'technical-team':
        return setTechnicalTeamQuery;
      case 'human-resources':
        return setHumanResourcesQuery;
      case 'integrations':
        return setIntegrationsQuery;
      default:
        return undefined;
    }
  }, [activeView]);

  // Renderizador declarativo de vistas
  const renderActiveView = useCallback(() => {
    if (activeView === 'planning') {
      return (
        <StrategicPlanning
          data={strategicPlanningData}
          onChange={setStrategicPlanningData}
          canManage={canManage}
        />
      );
    }
    if (activeView === 'portfolio') {
      return (
        <Portfolio
          data={portfolioData}
          onChange={setPortfolioData}
          query={portfolioQuery}
          onQueryChange={setPortfolioQuery}
          canManage={canManage}
          currentUserName={displayedCurrentUser?.name}
        />
      );
    }
    if (activeView === 'operations') {
      const projectOptions = (portfolioData?.projects || []).map(
        (project) => `${project.name} (${project.code})`
      );
      const responsibleOptions = (technicalTeamData?.members || []).map((member) => ({
        id: member.id,
        name: member.firstNames ? `${member.firstNames} ${member.lastNames}`.trim() : (member.name || 'Sin nombre'),
        specialty: member.specialty || '',
      }));
      return (
        <Operations
          data={operationsData}
          onChange={setOperationsData}
          query={operationsQuery}
          onQueryChange={setOperationsQuery}
          canManage={canManage}
          projectOptions={projectOptions}
          responsibleOptions={responsibleOptions}
        />
      );
    }
    if (activeView === 'technical-team') {
      const projectOptions = (portfolioData?.projects || []).map(
        (project) => `${project.name} (${project.code})`
      );
      return (
        <TechnicalTeam
          data={technicalTeamData}
          onChange={setTechnicalTeamData}
          query={technicalTeamQuery}
          onQueryChange={setTechnicalTeamQuery}
          canManage={canManage}
          projectOptions={projectOptions}
        />
      );
    }
    if (activeView === 'human-resources') {
      return (
        <HumanResources
          data={humanResourcesData}
          onChange={setHumanResourcesData}
          query={humanResourcesQuery}
          onQueryChange={setHumanResourcesQuery}
          canManage={canManage}
        />
      );
    }
    if (activeView === 'integrations') {
      return (
        <Integrations
          data={integrationsData}
          onChange={setIntegrationsData}
          query={integrationsQuery}
          onQueryChange={setIntegrationsQuery}
        />
      );
    }
    if (activeView === 'configuracion') {
      return (
        <Configuration
          currentUser={displayedCurrentUser}
          fontScale={fontScale}
          setFontScale={setFontScale}
          users={users}
          theme={theme}
          setTheme={setTheme}
        />
      );
    }
    if (activeView === 'roles' && isAdmin) {
      return (
        <RolesManagement
          users={users}
          onToggleSubAdmin={handleToggleSubAdmin}
        />
      );
    }
    return (
      <DashboardContent
        portfolioData={portfolioData}
        strategicPlanningData={strategicPlanningData}
        onNavigate={setActiveView}
      />
    );
  }, [
    activeView,
    strategicPlanningData,
    portfolioData,
    portfolioQuery,
    operationsData,
    operationsQuery,
    technicalTeamData,
    technicalTeamQuery,
    humanResourcesData,
    humanResourcesQuery,
    integrationsData,
    integrationsQuery,
    users,
    canManage,
    isAdmin,
    displayedCurrentUser,
    handleToggleSubAdmin,
    fontScale,
    theme,
  ]);

  return {
    isLoading,
    isAuthenticated,
    displayedCurrentUser,
    activeView,
    setActiveView,
    fontScale,
    setFontScale,
    theme,
    setTheme,
    users,
    handleLogin,
    handleLogout,
    handleToggleSubAdmin,
    allowedSidebarItems,
    allowedMobileItems,
    searchPlaceholder,
    searchValue,
    onSearchChange,
    renderActiveView,
  };
}
