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
import { mapToGanttProject } from '../utils/strategicPlanning';
import {
  normalizePersonnelIncidents,
  normalizeTeamMemberHistory,
} from '../utils/humanResources';
import {
  mapTeamMemberToHumanResources,
  mapTeamMemberToTechnical,
  normalizeTeamStatus,
} from '../utils/teamMembers';
import {
  normalizeTeamMemberRecords,
  readCachedTeamMembers,
  upsertCachedTeamMember,
  writeCachedTeamMembers,
} from '../utils/teamMemberCache';

// Importamos datos mock aislados para visualización (se sustituirán con endpoints de Django)
import {
  createStrategicPlanningData,
  createPortfolioData,
  createOperationsData,
  createTechnicalTeamData,
  createIntegrationsData,
  initialUsers,
} from '../mocks';

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

function getApiErrorMessage(error, fallback) {
  const responseData = error?.response?.data;
  if (typeof responseData?.detail === 'string') return responseData.detail;
  if (typeof responseData?.message === 'string') return responseData.message;
  if (responseData && typeof responseData === 'object') {
    const messages = Object.values(responseData).flatMap((value) =>
      Array.isArray(value) ? value : [value]
    );
    if (messages.length) return messages.join(' ');
  }
  return error?.message || fallback;
}

export function useAppController() {
  const location = useLocation();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(true);

  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('project_planner_user');
      if (!saved || saved === 'null' || saved === 'undefined') return null;
      const parsed = JSON.parse(saved);
      return parsed && typeof parsed === 'object' ? parsed : null;
    } catch {
      return null;
    }
  });

  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    try {
      const saved = localStorage.getItem('project_planner_user');
      if (!saved || saved === 'null' || saved === 'undefined') return false;
      const parsed = JSON.parse(saved);
      return Boolean(parsed && typeof parsed === 'object');
    } catch {
      return false;
    }
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

  // Estados de datos (en producción se inicializan vacíos por defecto)
  const [strategicPlanningData, setStrategicPlanningData] = useState(() =>
    hideMocks ? { projects: [], milestones: [], adjustments: [] } : createStrategicPlanningData()
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
  // Equipo Técnico y Recursos Humanos comparten una única fuente real: TeamMember en Django.
  const [technicalTeamData, setTechnicalTeamData] = useState(() => ({
    members: readCachedTeamMembers().map(mapTeamMemberToTechnical),
    assignments: hideMocks ? [] : createTechnicalTeamData().assignments,
  }));
  const [humanResourcesData, setHumanResourcesData] = useState(() => ({
    members: readCachedTeamMembers().map(mapTeamMemberToHumanResources),
    history: [],
    incidents: [],
  }));
  const [teamStatusRecords, setTeamStatusRecords] = useState([]);
  const [teamMembersLoading, setTeamMembersLoading] = useState(false);
  const [teamMembersError, setTeamMembersError] = useState('');
  const [teamMembersSyncedAt, setTeamMembersSyncedAt] = useState(null);
  const [humanResourcesRecordsLoading, setHumanResourcesRecordsLoading] = useState(false);
  const [humanResourcesRecordsError, setHumanResourcesRecordsError] = useState('');
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
      const storage = typeof window !== 'undefined' ? window.localStorage : (typeof localStorage !== 'undefined' ? localStorage : null);
      const savedUsers = storage ? storage.getItem('project-planner-users') : null;
      const parsedUsers = savedUsers ? JSON.parse(savedUsers) : null;
      if (
        Array.isArray(parsedUsers) &&
        parsedUsers.length >= 4 &&
        parsedUsers.every((u) => u && typeof u === 'object' && u.name)
      ) {
        return parsedUsers;
      }
      return initialUsers;
    } catch {
      return initialUsers;
    }
  });

  const [fontScale, setFontScale] = useState(() => {
    try {
      const storage = typeof window !== 'undefined' ? window.localStorage : (typeof localStorage !== 'undefined' ? localStorage : null);
      const savedScale = Number(storage ? storage.getItem('project-planner-font-scale') : 100);
      return savedScale >= 85 && savedScale <= 120 ? savedScale : 100;
    } catch {
      return 100;
    }
  });

  const [theme, setTheme] = useState(() => {
    try {
      const storage = typeof window !== 'undefined' ? window.localStorage : (typeof localStorage !== 'undefined' ? localStorage : null);
      return (storage && storage.getItem('project-planner-theme')) || 'dark';
    } catch {
      return 'dark';
    }
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
      photo:
        currentUser.photo ||
        currentUser.avatar ||
        registeredCurrentUser?.avatar ||
        registeredCurrentUser?.photo ||
        null,
      phone: currentUser.phone || registeredCurrentUser?.phone || '',
      name:
        currentUser.name ||
        (currentUser.first_name
          ? `${currentUser.first_name} ${currentUser.last_name || ''}`.trim()
          : currentUser.username ||
            registeredCurrentUser?.name ||
            'Usuario'),
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

      const identifier = (userData?.email || userData?.username || '').toLowerCase();
      let cachedProfile = null;
      try {
        const raw = localStorage.getItem(`project_planner_profile_${identifier}`);
        if (raw) cachedProfile = JSON.parse(raw);
      } catch {}

      const userPhoto =
        userData?.photo ||
        userData?.avatar ||
        cachedProfile?.photo ||
        cachedProfile?.avatar ||
        null;
      const userPhone = userData?.phone || cachedProfile?.phone || '';

      const userToSave = {
        ...userData,
        accountType,
        photo: userPhoto,
        avatar: userPhoto,
        phone: userPhone,
        name:
          userData?.name ||
          cachedProfile?.name ||
          (userData?.first_name
            ? `${userData.first_name} ${userData.last_name || ''}`.trim()
            : userData?.username ||
              (userData?.email ? createNameFromEmail(userData.email) : 'Usuario')),
      };

      try {
        localStorage.setItem('project_planner_user', JSON.stringify(userToSave));
        if (identifier) {
          localStorage.setItem(
            `project_planner_profile_${identifier}`,
            JSON.stringify({
              photo: userPhoto,
              avatar: userPhoto,
              phone: userPhone,
              name: userToSave.name,
            })
          );
        }
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

  const handleAddMember = useCallback((newMember) => {
    setUsers((currentUsers) => [newMember, ...currentUsers]);
  }, []);

  const handleUpdateCurrentUser = useCallback((updatedData) => {
    setCurrentUser((prev) => {
      const merged = { ...prev, ...updatedData };
      try {
        localStorage.setItem('project_planner_user', JSON.stringify(merged));
        const identifier = (merged.email || merged.username || '').toLowerCase();
        if (identifier) {
          localStorage.setItem(
            `project_planner_profile_${identifier}`,
            JSON.stringify({
              photo: merged.photo,
              avatar: merged.avatar,
              phone: merged.phone,
              name: merged.name,
            })
          );
        }
      } catch (err) {
        console.error('Error saving user to localStorage:', err);
      }
      return merged;
    });

    // Guardar en la Base de Datos mediante API de Django
    if (currentUser) {
      const activeId = currentUser.db_id || currentUser.id;
      const activeIdentifier = currentUser.email || currentUser.username;
      projectsApi
        .updateProfile({
          userId: activeId,
          identifier: activeIdentifier,
          name: updatedData.name,
          email: updatedData.email,
          photo: updatedData.photo !== undefined ? updatedData.photo : currentUser.photo,
          phone: updatedData.phone !== undefined ? updatedData.phone : currentUser.phone,
        })
        .catch((err) => {
          console.warn('Sincronización de perfil en BD:', err);
        });
    }

    if (
      updatedData.name ||
      updatedData.email ||
      updatedData.photo !== undefined ||
      updatedData.avatar !== undefined ||
      updatedData.phone !== undefined
    ) {
      setUsers((prevUsers) => {
        const nextUsers = prevUsers.map((u) => {
          if (
            (currentUser?.id && u.id === currentUser.id) ||
            (currentUser?.email &&
              u.email &&
              u.email.toLowerCase() === currentUser.email.toLowerCase()) ||
            (currentUser?.username &&
              u.username &&
              u.username.toLowerCase() === currentUser.username.toLowerCase())
          ) {
            return {
              ...u,
              ...(updatedData.name ? { name: updatedData.name } : {}),
              ...(updatedData.email ? { email: updatedData.email } : {}),
              ...(updatedData.photo !== undefined
                ? { avatar: updatedData.photo, photo: updatedData.photo }
                : {}),
              ...(updatedData.phone !== undefined ? { phone: updatedData.phone } : {}),
            };
          }
          return u;
        });
        try {
          localStorage.setItem('project-planner-users', JSON.stringify(nextUsers));
        } catch {}
        return nextUsers;
      });
    }
  }, [currentUser]);

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

  const refreshTeamMembers = useCallback(async () => {
    setTeamMembersLoading(true);
    setTeamMembersError('');
    try {
      const [membersResult, statusesResult] = await Promise.allSettled([
        projectsApi.getTeamMembers(),
        projectsApi.getTeamStatuses(),
      ]);

      if (membersResult.status === 'rejected') throw membersResult.reason;
      const safeMembers = normalizeTeamMemberRecords(membersResult.value);
      if (!safeMembers) throw new Error('El servidor devolvió un formato de personal no reconocido.');
      const safeStatuses = statusesResult.status === 'fulfilled'
        ? normalizeTeamMemberRecords(statusesResult.value)
        : null;

      if (safeStatuses) setTeamStatusRecords(safeStatuses);
      writeCachedTeamMembers(safeMembers);
      setTechnicalTeamData((previous) => ({
        ...previous,
        members: safeMembers.map(mapTeamMemberToTechnical),
      }));
      setHumanResourcesData((previous) => ({
        ...previous,
        members: safeMembers.map(mapTeamMemberToHumanResources),
      }));
      setTeamMembersSyncedAt(new Date());
      if (statusesResult.status === 'rejected' || !safeStatuses) {
        setTeamMembersError('El personal se cargó correctamente, pero no se pudo actualizar el catálogo de estados.');
      }
      return safeMembers;
    } catch (error) {
      const hasCachedMembers = readCachedTeamMembers().length > 0;
      const message = getApiErrorMessage(
        error,
        'No se pudo cargar el personal desde el servidor.'
      );
      setTeamMembersError(hasCachedMembers
        ? `${message} Se mantiene la última copia disponible.`
        : message);
      throw error;
    } finally {
      setTeamMembersLoading(false);
    }
  }, []);

  const refreshHumanResourcesRecords = useCallback(async () => {
    setHumanResourcesRecordsLoading(true);
    setHumanResourcesRecordsError('');
    try {
      const [incidentsResult, historyResult] = await Promise.allSettled([
        projectsApi.getPersonnelIncidents(),
        projectsApi.getTeamMemberHistory(),
      ]);

      if (incidentsResult.status === 'rejected' && historyResult.status === 'rejected') {
        throw incidentsResult.reason;
      }

      setHumanResourcesData((previous) => ({
        ...previous,
        incidents: incidentsResult.status === 'fulfilled'
          ? normalizePersonnelIncidents(incidentsResult.value)
          : previous.incidents,
        history: historyResult.status === 'fulfilled'
          ? normalizeTeamMemberHistory(historyResult.value)
          : previous.history,
      }));

      if (incidentsResult.status === 'rejected' || historyResult.status === 'rejected') {
        setHumanResourcesRecordsError(
          incidentsResult.status === 'rejected'
            ? 'No se pudieron actualizar las incidencias; se mantiene la última información disponible.'
            : 'No se pudo actualizar el historial; se mantiene la última información disponible.'
        );
      }
    } catch (error) {
      setHumanResourcesRecordsError(getApiErrorMessage(
        error,
        'No se pudo cargar el historial de Recursos Humanos desde el servidor.'
      ));
      throw error;
    } finally {
      setHumanResourcesRecordsLoading(false);
    }
  }, []);

  const registerPersistedTeamMember = useCallback((memberRecord) => {
    if (!memberRecord || typeof memberRecord !== 'object') return;

    upsertCachedTeamMember(memberRecord);
    const technicalMember = mapTeamMemberToTechnical(memberRecord);
    const humanResourcesMember = mapTeamMemberToHumanResources(memberRecord);
    const isDifferentMember = (item, nextMember) =>
      String(item?.dbId ?? '') !== String(nextMember.dbId ?? '')
      && String(item?.email ?? '').toLowerCase() !== String(nextMember.email ?? '').toLowerCase();

    setTechnicalTeamData((previous) => ({
      ...previous,
      members: [technicalMember, ...(previous.members || []).filter((item) => isDifferentMember(item, technicalMember))],
    }));
    setHumanResourcesData((previous) => ({
      ...previous,
      members: [humanResourcesMember, ...(previous.members || []).filter((item) => isDifferentMember(item, humanResourcesMember))],
    }));
    setTeamMembersSyncedAt(new Date());
  }, []);

  const findStatusId = useCallback((statusCode, fallbackId) => {
    const match = teamStatusRecords.find(
      (statusRecord) => normalizeTeamStatus(statusRecord.name) === statusCode
    );
    if (match) return match.id;
    if (fallbackId !== undefined && fallbackId !== null) return fallbackId;
    throw new Error('No se encontró el estado seleccionado en la base de datos.');
  }, [teamStatusRecords]);

  const findProjectId = useCallback((projectLabel, fallbackId) => {
    const cleanLabel = String(projectLabel ?? '').trim();
    const normalized = cleanLabel.toLocaleLowerCase('es');
    if (
      !cleanLabel ||
      normalized === 'ninguno' ||
      normalized.startsWith('sin proyecto') ||
      normalized === 'en espera'
    ) {
      return null;
    }

    const match = (portfolioData?.projects || []).find((project) =>
      cleanLabel.includes(project.code) ||
      cleanLabel === project.name ||
      cleanLabel === `${project.name} (${project.code})`
    );
    if (match) return match.id;
    if (fallbackId !== undefined && fallbackId !== null) return fallbackId;
    throw new Error('Selecciona un proyecto registrado en Portafolio.');
  }, [portfolioData.projects]);

  const persistTechnicalMember = useCallback(async (memberId, draft) => {
    const member = (technicalTeamData?.members || []).find((item) => item.id === memberId);
    if (!member?.dbId) throw new Error('Este técnico todavía no está registrado en la base de datos.');

    await projectsApi.updateTeamMember(member.dbId, {
      status: findStatusId(draft.status, draft.status === member.status ? member.statusId : null),
      project: findProjectId(draft.project, draft.project === member.project ? member.projectId : null),
      allocation_percentage: Number(draft.workload),
    });
    try {
      await refreshTeamMembers();
    } catch (refreshError) {
      console.warn('El cambio se guardó, pero no se pudo refrescar el directorio:', refreshError);
    }
  }, [technicalTeamData.members, findProjectId, findStatusId, refreshTeamMembers]);

  const persistHumanResourcesMember = useCallback(async (memberId, draft) => {
    const member = (humanResourcesData?.members || []).find((item) => item.id === memberId);
    if (!member?.dbId) throw new Error('Este integrante todavía no está registrado en la base de datos.');

    await projectsApi.updateTeamMember(member.dbId, {
      status: findStatusId(draft.status, draft.status === member.status ? member.statusId : null),
      project: findProjectId(draft.project, draft.project === member.project ? member.projectId : null),
      availability: Number(draft.availability),
      change_comment: String(draft.comment ?? '').trim(),
    });
    const refreshResults = await Promise.allSettled([
      refreshTeamMembers(),
      refreshHumanResourcesRecords(),
    ]);
    if (refreshResults.some((result) => result.status === 'rejected')) {
      console.warn('El cambio se guardó, pero no se pudo refrescar toda la información de Recursos Humanos.');
    }
  }, [humanResourcesData.members, findProjectId, findStatusId, refreshHumanResourcesRecords, refreshTeamMembers]);

  const createPersonnelIncident = useCallback(async (draft) => {
    const member = (humanResourcesData?.members || []).find((item) => item.id === draft.memberId);
    if (!member?.dbId) throw new Error('Selecciona un integrante registrado en la base de datos.');
    const backupMember = draft.backupMemberId
      ? (humanResourcesData?.members || []).find((item) => item.id === draft.backupMemberId)
      : null;
    if (draft.backupMemberId && !backupMember?.dbId) {
      throw new Error('Selecciona un técnico de respaldo registrado en la base de datos.');
    }

    await projectsApi.createPersonnelIncident({
      member: member.dbId,
      incident_type: draft.type,
      start_date: draft.startDate,
      end_date: draft.endDate,
      // El serializador de incidencias acepta tanto el PK como el código visual;
      // así el alta sigue disponible aunque el catálogo tarde en sincronizar.
      resulting_status: findStatusId(
        draft.status,
        draft.status === member.status && member.statusId ? member.statusId : draft.status
      ),
      availability: Number(draft.availability),
      backup_member: backupMember?.dbId ?? null,
      reason: String(draft.comment ?? '').trim(),
    });
    await refreshHumanResourcesRecords();
  }, [findStatusId, humanResourcesData.members, refreshHumanResourcesRecords]);

  const transitionPersonnelIncident = useCallback(async (incidentId, action, comment = '') => {
    await projectsApi.transitionPersonnelIncident(incidentId, action, comment);
    const refreshResults = await Promise.allSettled([
      refreshHumanResourcesRecords(),
      refreshTeamMembers(),
    ]);
    if (refreshResults.some((result) => result.status === 'rejected')) {
      console.warn('La incidencia cambió de estado, pero no se pudo refrescar toda la vista.');
    }
  }, [refreshHumanResourcesRecords, refreshTeamMembers]);

  // Efectos de inicialización y persistencia
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  // Sincronización de sesión en tiempo real entre múltiples pestañas (Cross-Tab Session Sync)
  useEffect(() => {
    const handleStorageChange = (event) => {
      if (event.key !== 'project_planner_user' && event.key !== null) return;

      if (!event.newValue) {
        // Sesión cerrada o removida en otra pestaña: desalojar memoria y volver a login de inmediato
        setCurrentUser(null);
        setIsAuthenticated(false);
        navigate('/login', { replace: true });
      } else {
        // Sesión cambiada/iniciada en otra pestaña: sincronizar usuario activo en tiempo real
        try {
          const updatedUser = JSON.parse(event.newValue);
          if (updatedUser && typeof updatedUser === 'object') {
            setCurrentUser(updatedUser);
            setIsAuthenticated(true);
          }
        } catch {
          setCurrentUser(null);
          setIsAuthenticated(false);
          navigate('/login', { replace: true });
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [navigate]);

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

  // Cargar una sola colección de TeamMember para las vistas de Equipo Técnico y RR. HH.
  useEffect(() => {
    if (!isAuthenticated) return undefined;
    const timer = window.setTimeout(() => {
      refreshTeamMembers().catch((error) => {
        console.error('Error al sincronizar el personal desde la Base de Datos:', error);
      });
      if (canManage) {
        refreshHumanResourcesRecords().catch((error) => {
          console.error('Error al sincronizar incidencias e historial:', error);
        });
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, [canManage, isAuthenticated, refreshHumanResourcesRecords, refreshTeamMembers]);

  // Sincronizar proyectos reales e hitos de la Base de Datos globalmente desde el inicio
  useEffect(() => {
    let isMounted = true;
    const syncBackendData = async () => {
      try {
        const [
          backendProjects,
          backendMilestones,
          backendTasks,
          historyResult,
          backendProjectChanges,
          backendAdjustments,
        ] = await Promise.all([
          projectsApi.getProjects().catch((err) => {
            console.error('Error al sincronizar proyectos de la Base de Datos:', err);
            return null;
          }),
          projectsApi.getMilestones().catch((err) => {
            console.warn('Error al sincronizar hitos de la Base de Datos:', err);
            return null;
          }),
          projectsApi.getTasks().catch((err) => {
            console.warn('Error al sincronizar tareas operativas de la Base de Datos:', err);
            return null;
          }),
          projectsApi.getTeamMemberHistory().catch((err) => {
            console.warn('Error al sincronizar historial de personal:', err);
            return null;
          }),
          projectsApi.getProjectChangeLogs().catch((err) => {
            console.warn('Error al sincronizar historial de cambios de proyectos:', err);
            return null;
          }),
          projectsApi.getScheduleAdjustments().catch((err) => {
            console.warn('Error al sincronizar reajustes de cronograma:', err);
            return null;
          }),
        ]);

        if (!isMounted) return;

        if (Array.isArray(backendProjects) && backendProjects.length > 0) {
          const mapped = backendProjects.map((bp) => ({
            id: bp.id,
            code: bp.code,
            name: bp.name,
            area: bp.area || 'Edificaciones Comerciales',
            status: bp.status || 'planning',
            progress: bp.progress ?? 0,
            usedBudget: bp.usedBudget ?? 0,
            totalBudget: bp.totalBudget || Number(bp.budget) || 0,
            startDate: bp.startDate || bp.start_date,
            endDate: bp.endDate || bp.end_date,
            leaderId: bp.leaderId || 'carlos',
            leaderName: bp.leaderName || '',
            leaderEmail: bp.leaderEmail || '',
            driveFolder: '',
            description: bp.description || '',
            members: bp.members || ['PM'],
          }));

          const mappedChanges = Array.isArray(backendProjectChanges) && backendProjectChanges.length > 0
            ? backendProjectChanges.map((c) => ({
                id: c.id,
                date: c.date,
                project: c.project_name || c.project_code || 'Proyecto',
                change: c.change,
                user: c.user,
              }))
            : [];

          setPortfolioData((prev) => ({
            ...prev,
            projects: mapped,
            changes: mappedChanges.length > 0 ? mappedChanges : (prev.changes || []),
          }));

          // Sincronizar Calendario Maestro (Gantt)
          const mappedGanttProjects = mapped.map((p) => mapToGanttProject(p));

          const mappedMilestones = Array.isArray(backendMilestones) && backendMilestones.length > 0
            ? backendMilestones.map((bm) => ({
                id: bm.id,
                projectId: bm.project ?? bm.projectId,
                title: bm.name ?? bm.title,
                targetDate: bm.target_date ?? bm.targetDate,
                status: (bm.status || 'pending').toLowerCase(),
                validator: bm.validator || 'Carlos M. (Project Manager)',
                description: bm.description || '',
                blocking: bm.blocking !== undefined ? bm.blocking : true,
              }))
            : [];

          const mappedAdjustments = Array.isArray(backendAdjustments) && backendAdjustments.length > 0
            ? backendAdjustments.map((a) => ({
                id: a.id,
                date: a.date,
                projectId: a.projectId ?? a.project,
                projectName: a.projectName,
                previousPeriod: a.previousPeriod,
                nextPeriod: a.nextPeriod,
                reason: a.reason,
              }))
            : [];

          setStrategicPlanningData((prev) => ({
            ...prev,
            projects: mappedGanttProjects,
            milestones: mappedMilestones.length > 0 ? mappedMilestones : prev.milestones,
            adjustments: mappedAdjustments.length > 0 ? mappedAdjustments : (prev.adjustments || []),
          }));
        }

        // Sincronizar Gestión Operativa desde las Tareas de la Base de Datos
        if (Array.isArray(backendTasks) && backendTasks.length > 0) {
          const projectMap = {};
          if (Array.isArray(backendProjects)) {
            backendProjects.forEach((p) => {
              projectMap[p.id] = p.name;
              projectMap[p.code] = p.name;
            });
          }

          const statusMap = {
            DONE: 'completed',
            IN_PROGRESS: 'in-progress',
            TODO: 'planned',
            REVIEW: 'in-progress',
          };

          const mappedOrders = backendTasks.map((t) => {
            const projName = projectMap[t.project] || (typeof t.project === 'object' && t.project?.name) || 'Proyecto Operativo';
            return {
              id: `order-${t.id}`,
              code: `#${100 + Number(t.id || 1)}`,
              project: projName,
              type: t.category_name ? `Inspección ${t.category_name}` : 'Operación técnica',
              title: t.title,
              area: t.category_name || 'Operaciones',
              responsible: t.assigned_to_name || 'Personal Técnico',
              startDate: t.start_date,
              endDate: t.end_date,
              priority: t.is_critical_path ? 'high' : 'medium',
              status: statusMap[t.status] || 'in-progress',
              critical: !!t.is_critical_path,
              tolerance: t.tolerance_days || 7,
              documentUrl: '',
              description: t.description || '',
              progress: t.progress ?? 0,
            };
          });

          const inProg = mappedOrders.filter((o) => o.status === 'in-progress').length;
          const comp = mappedOrders.filter((o) => o.status === 'completed').length;
          const avgEff = mappedOrders.length > 0
            ? Math.round((mappedOrders.reduce((acc, o) => acc + (o.progress || 0), 0) / mappedOrders.length) * 10) / 10
            : 93.4;

          setOperationsData((prev) => ({
            ...prev,
            orders: mappedOrders,
            metrics: {
              inProgress: inProg,
              completed: comp,
              incidents: 2,
              efficiency: avgEff,
            },
            activities: prev.activities?.length > 0 ? prev.activities : createOperationsData().activities,
            alerts: prev.alerts?.length > 0 ? prev.alerts : createOperationsData().alerts,
            qualityChecks: prev.qualityChecks?.length > 0 ? prev.qualityChecks : createOperationsData().qualityChecks,
          }));
        }

        // Sincronizar Historial de Asignaciones en Equipo Técnico
        if (Array.isArray(historyResult) && historyResult.length > 0) {
          const mappedAssignments = historyResult.map((log) => ({
            id: `assign-${log.id}`,
            date: (log.date || log.created_at || '').split('T')[0] || '2026-10-24',
            memberPrefix: (log.member_name || log.name || '').toLowerCase().includes('arq') ? 'Arq.' : 'Ing.',
            memberName: log.member_name || log.name || 'Especialista',
            project: log.new_project_name || log.previous_project_name || 'Proyecto Asignado',
            reason: log.comment || 'Asignación técnica de responsabilidades',
          }));

          setTechnicalTeamData((prev) => ({
            ...prev,
            assignments: mappedAssignments,
          }));
        }
      } catch (err) {
        console.error('Error al sincronizar datos de la Base de Datos:', err);
      }
    };
    syncBackendData();
    return () => {
      isMounted = false;
    };
  }, []);

  // Mantener el Calendario Maestro sincronizado si se añade o actualiza un proyecto en Portafolio
  useEffect(() => {
    if (portfolioData?.projects && portfolioData.projects.length > 0) {
      setStrategicPlanningData((prev) => {
        let hasChanges = false;
        const updatedGantt = portfolioData.projects.map((p) => {
          const existing = prev.projects?.find((ep) => String(ep.id) === String(p.id) || ep.code === p.code);
          const mapped = mapToGanttProject(p, existing);
          if (
            !existing ||
            existing.start !== mapped.start ||
            existing.duration !== mapped.duration ||
            existing.startDate !== mapped.startDate ||
            existing.endDate !== mapped.endDate ||
            existing.name !== mapped.name ||
            existing.area !== mapped.area ||
            existing.totalBudget !== mapped.totalBudget
          ) {
            hasChanges = true;
            return mapped;
          }
          return existing;
        });

        if (!hasChanges && updatedGantt.length === prev.projects?.length) {
          return prev;
        }

        return {
          ...prev,
          projects: updatedGantt,
        };
      });
    }
  }, [portfolioData.projects]);

  const handlePlanningChange = useCallback((updated) => {
    setStrategicPlanningData(updated);
    if (updated?.projects?.length) {
      setPortfolioData((prev) => {
        if (!prev?.projects?.length) return prev;
        let hasChanges = false;
        const newProjects = prev.projects.map((p) => {
          const updatedProj = updated.projects.find((up) => String(up.id) === String(p.id) || up.code === p.code);
          if (
            updatedProj &&
            ((updatedProj.startDate && updatedProj.startDate !== p.startDate) ||
              (updatedProj.endDate && updatedProj.endDate !== p.endDate) ||
              (updatedProj.start_date && updatedProj.start_date !== p.start_date) ||
              (updatedProj.end_date && updatedProj.end_date !== p.end_date))
          ) {
            hasChanges = true;
            return {
              ...p,
              startDate: updatedProj.startDate,
              endDate: updatedProj.endDate,
              start_date: updatedProj.startDate,
              end_date: updatedProj.endDate,
              duration_months: updatedProj.duration,
            };
          }
          return p;
        });
        return hasChanges ? { ...prev, projects: newProjects } : prev;
      });
    }
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
          onChange={handlePlanningChange}
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
          isAdmin={isAdmin}
          currentUser={displayedCurrentUser}
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
          onMemberCreated={registerPersistedTeamMember}
          onRefreshMembers={refreshTeamMembers}
          onPersistMember={persistTechnicalMember}
          query={technicalTeamQuery}
          onQueryChange={setTechnicalTeamQuery}
          canManage={canManage}
          projectOptions={projectOptions}
          syncLoading={teamMembersLoading}
          syncError={teamMembersError}
        />
      );
    }
    if (activeView === 'human-resources') {
      const projectOptions = (portfolioData?.projects || []).map(
        (project) => `${project.name} (${project.code})`
      );
      return (
        <HumanResources
          data={humanResourcesData}
          onChange={setHumanResourcesData}
          onPersistMember={persistHumanResourcesMember}
          onCreateIncident={canManage ? createPersonnelIncident : undefined}
          onTransitionIncident={canManage ? transitionPersonnelIncident : undefined}
          onRefreshRecords={canManage ? refreshHumanResourcesRecords : undefined}
          query={humanResourcesQuery}
          onQueryChange={setHumanResourcesQuery}
          canManage={canManage}
          projectOptions={projectOptions}
          syncLoading={teamMembersLoading || (canManage && humanResourcesRecordsLoading)}
          syncError={[teamMembersError, canManage ? humanResourcesRecordsError : ''].filter(Boolean).join(' ')}
          syncedAt={teamMembersSyncedAt}
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
          onUpdateCurrentUser={handleUpdateCurrentUser}
          fontScale={fontScale}
          setFontScale={setFontScale}
          users={users}
          onAddMember={handleAddMember}
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
    handleAddMember,
    handleUpdateCurrentUser,
    createPersonnelIncident,
    transitionPersonnelIncident,
    refreshHumanResourcesRecords,
    persistHumanResourcesMember,
    persistTechnicalMember,
    registerPersistedTeamMember,
    refreshTeamMembers,
    teamMembersError,
    teamMembersLoading,
    teamMembersSyncedAt,
    humanResourcesRecordsError,
    humanResourcesRecordsLoading,
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
