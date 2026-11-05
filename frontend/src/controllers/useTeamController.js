import { useState, useEffect, useCallback } from 'react';
import projectsApi from '../services/projectsApi';
import { getApiErrorMessage } from '../utils/asyncHandler';
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
import { createTechnicalTeamData, initialUsers } from '../mocks';
import { useCrossTabListener } from '../utils/useCrossTabListener';

/**
 * Controlador de Dominio para Equipo Técnico, Directorio y Recursos Humanos.
 * Desacopla la persistencia de integrantes, nómina, historial e incidencias laborales.
 *
 * @param {Object} [options]
 * @param {boolean} [options.hideMocks=false] - Oculta datos ficticios en producción
 * @param {Array} [options.projects=[]] - Lista de proyectos de portafolio para resolver asignaciones
 * @returns {Object} Estados de equipo y recursos humanos, queries y acciones CRUD
 */
export function useTeamController({
  hideMocks = false,
  projects = [],
} = {}) {
  // 1. Directorio de cuentas de usuario / subadministradores
  const [users, setUsers] = useState(() => {
    if (hideMocks) {
      return [];
    }
    try {
      const storage =
        typeof window !== 'undefined'
          ? window.localStorage
          : typeof localStorage !== 'undefined'
            ? localStorage
            : null;
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

  // 2. Colecciones de Equipo Técnico y Recursos Humanos
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

  // 3. Filtros de búsqueda específicos de cada vista
  const [technicalTeamQuery, setTechnicalTeamQuery] = useState('');
  const [humanResourcesQuery, setHumanResourcesQuery] = useState('');

  // Sincronización de directorio de usuarios entre pestañas
  useCrossTabListener('project-planner-users', (newUsersRaw) => {
    if (!newUsersRaw) return;
    try {
      const parsed = JSON.parse(newUsersRaw);
      if (Array.isArray(parsed)) {
        setUsers(parsed);
      }
    } catch {}
  });

  // Persistir directorio de usuarios en localStorage al cambiar
  useEffect(() => {
    try {
      window.localStorage.setItem('project-planner-users', JSON.stringify(users));
    } catch {}
  }, [users]);

  // Sincronizar usuarios reales y presencia (En línea / Desconectado) desde Django
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

  // 4. Alternar rol de SubAdministrador en Django y en memoria
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

  // 5. Agregar un nuevo integrante al directorio
  const handleAddMember = useCallback((newMember) => {
    setUsers((currentUsers) => [newMember, ...currentUsers]);
  }, []);

  // 6. Refrescar personal desde TeamMember en Django
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

  // 7. Refrescar historial e incidencias laborales
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

  // 8. Registro inmediato de un técnico persistido en caché y colecciones
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

  // Helper para resolver el ID de estado del catálogo
  const findStatusId = useCallback((statusCode, fallbackId) => {
    const match = teamStatusRecords.find(
      (statusRecord) => normalizeTeamStatus(statusRecord.name) === statusCode
    );
    if (match) return match.id;
    if (fallbackId !== undefined && fallbackId !== null) return fallbackId;
    throw new Error('No se encontró el estado seleccionado en la base de datos.');
  }, [teamStatusRecords]);

  // Helper para resolver el ID de proyecto a partir de su etiqueta o nombre
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

    const match = (projects || []).find((project) =>
      cleanLabel.includes(project.code) ||
      cleanLabel === project.name ||
      cleanLabel === `${project.name} (${project.code})`
    );
    if (match) return match.id;
    if (fallbackId !== undefined && fallbackId !== null) return fallbackId;
    throw new Error('Selecciona un proyecto registrado en Portafolio.');
  }, [projects]);

  // 9. Persistir cambios de técnico (estado, proyecto, carga de trabajo)
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

  // 10. Persistir cambios de integrante en Recursos Humanos (disponibilidad, comentarios)
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

  // 11. Crear una incidencia laboral (vacaciones, incapacidad, ausencia)
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

  // 12. Transición de estado en incidencia laboral (aprobar, rechazar, cerrar)
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

  return {
    users,
    setUsers,
    technicalTeamData,
    setTechnicalTeamData,
    humanResourcesData,
    setHumanResourcesData,
    teamStatusRecords,
    teamMembersLoading,
    teamMembersError,
    teamMembersSyncedAt,
    humanResourcesRecordsLoading,
    humanResourcesRecordsError,
    technicalTeamQuery,
    setTechnicalTeamQuery,
    humanResourcesQuery,
    setHumanResourcesQuery,
    handleToggleSubAdmin,
    handleAddMember,
    refreshTeamMembers,
    refreshHumanResourcesRecords,
    registerPersistedTeamMember,
    findStatusId,
    findProjectId,
    persistTechnicalMember,
    persistHumanResourcesMember,
    createPersonnelIncident,
    transitionPersonnelIncident,
  };
}
