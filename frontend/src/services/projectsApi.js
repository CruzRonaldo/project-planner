import api from './api';

function getActorHeaders() {
  try {
    const savedUser = JSON.parse(window.localStorage.getItem('project_planner_user'));
    const sessionToken = savedUser?.session_token;
    return sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {};
  } catch {
    return {};
  }
}

/**
 * Cliente de servicios para el módulo de Proyectos (Portfolio)
 * Conectado con los endpoints REST de Django: /api/projects/
 */
export const projectsApi = {
  /**
   * Obtiene la lista completa de proyectos registrados en la base de datos.
   */
  getProjects: async () => {
    const response = await api.get('/projects/');
    return response.data;
  },

  /**
   * Registra un nuevo proyecto en el Backend.
   * El Backend valida en la base de datos y despacha automáticamente la notificación a Make.
   * @param {Object} projectData Datos del borrador del proyecto (draft)
   * @returns {Promise<Object>} Proyecto creado y resultado de la notificación Make
   */
  createProject: async (projectData) => {
    const response = await api.post('/projects/', projectData);
    return response.data;
  },

  /**
   * Obtiene el detalle de un proyecto específico por ID.
   */
  getProjectById: async (id) => {
    const response = await api.get(`/projects/${id}/`);
    return response.data;
  },

  /**
   * Actualiza parcialmente un proyecto existente (PATCH).
   * @param {string|number} id ID del proyecto
   * @param {Object} projectData Campos actualizados
   */
  updateProject: async (id, projectData) => {
    const response = await api.patch(`/projects/${id}/`, projectData);
    return response.data;
  },

  /**
   * Elimina un proyecto por ID (DELETE).
   * @param {string|number} id ID del proyecto
   */
  deleteProject: async (id) => {
    const response = await api.delete(`/projects/${id}/`);
    return response.data;
  },

  /**
   * Obtiene la lista de hitos estratégicos registrados en la base de datos.
   * Permite filtrar por ID de proyecto opcional.
   */
  getMilestones: async (projectId = null) => {
    const params = projectId ? { project: projectId } : {};
    const response = await api.get('/milestones/', { params });
    return response.data;
  },

  /**
   * Registra un nuevo hito global/estratégico en el Backend.
   */
  createMilestone: async (milestoneData) => {
    const response = await api.post('/milestones/', milestoneData);
    return response.data;
  },

  /**
   * Actualiza parcialmente un hito estratégico existente (PATCH).
   */
  updateMilestone: async (id, milestoneData) => {
    const response = await api.patch(`/milestones/${id}/`, milestoneData);
    return response.data;
  },

  /**
   * Elimina un hito estratégico por ID (DELETE).
   */
  deleteMilestone: async (id) => {
    const response = await api.delete(`/milestones/${id}/`);
    return response.data;
  },

  /**
   * Obtiene la lista de tareas y ordenes operativas registradas en la Base de Datos.
   */
  getTasks: async (params = {}) => {
    const response = await api.get('/tasks/', { params });
    return response.data;
  },

  /**
   * Obtiene el historial de cambios y auditoria de proyectos (Portafolio).
   */
  getProjectChangeLogs: async (params = {}) => {
    const response = await api.get('/project-change-logs/', { params });
    return response.data;
  },

  /**
   * Obtiene el historial de reajustes de cronograma (Planificacion Estrategica).
   */
  getScheduleAdjustments: async (params = {}) => {
    const response = await api.get('/schedule-adjustments/', { params });
    return response.data;
  },

  /**
   * Registra un reajuste de cronograma en la base de datos de auditoría.
   */
  createScheduleAdjustment: async (adjustmentData) => {
    const response = await api.post('/schedule-adjustments/', adjustmentData, {
      headers: getActorHeaders(),
    });
    return response.data;
  },


  /**
   * Obtiene la lista de miembros y líderes del equipo registrados en la Base de Datos.
   */
  getTeamMembers: async () => {
    const response = await api.get('/team-members/');
    return response.data;
  },

  /** Obtiene el catálogo persistido de estados operativos del equipo. */
  getTeamStatuses: async () => {
    const response = await api.get('/team-statuses/');
    return response.data;
  },

  /** Actualiza parcialmente una ficha TeamMember existente. */
  updateTeamMember: async (id, memberData) => {
    const response = await api.patch(`/team-members/${id}/`, memberData, {
      headers: getActorHeaders(),
    });
    return response.data;
  },

  /** Obtiene las incidencias y licencias persistidas (admite paginación DRF). */
  getPersonnelIncidents: async (params = {}) => {
    const response = await api.get('/personnel-incidents/', {
      params,
      headers: getActorHeaders(),
    });
    return response.data;
  },

  /** Registra una incidencia en estado pendiente para revisión. */
  createPersonnelIncident: async (incidentData) => {
    const response = await api.post('/personnel-incidents/', incidentData, {
      headers: getActorHeaders(),
    });
    return response.data;
  },

  /** Ejecuta una transición autorizada del flujo de una incidencia. */
  transitionPersonnelIncident: async (id, action, comment = '') => {
    if (!['approve', 'reject', 'finalize'].includes(action)) {
      throw new Error('La acción solicitada para la incidencia no es válida.');
    }
    const response = await api.post(
      `/personnel-incidents/${id}/${action}/`,
      { comment: String(comment ?? '').trim() },
      { headers: getActorHeaders() }
    );
    return response.data;
  },

  approvePersonnelIncident: async (id, comment = '') =>
    projectsApi.transitionPersonnelIncident(id, 'approve', comment),

  rejectPersonnelIncident: async (id, comment = '') =>
    projectsApi.transitionPersonnelIncident(id, 'reject', comment),

  finalizePersonnelIncident: async (id, comment = '') =>
    projectsApi.transitionPersonnelIncident(id, 'finalize', comment),

  /** Obtiene el historial permanente de cambios del personal. */
  getTeamMemberHistory: async (params = {}) => {
    const response = await api.get('/team-member-change-logs/', {
      params,
      headers: getActorHeaders(),
    });
    return response.data;
  },

  /**
   * Crea la ficha del técnico y su cuenta de acceso en una sola operación.
   */
  createTechnician: async (technicianData) => {
    const availability = technicianData.availability ?? technicianData.workload;
    const allocationPercentage = technicianData.allocation_percentage
      ?? technicianData.allocationPercentage
      ?? technicianData.workload;

    const response = await api.post('/technicians/create/', {
      first_name: technicianData.firstNames?.trim(),
      last_name: technicianData.lastNames?.trim(),
      email: technicianData.email?.trim().toLowerCase(),
      password: technicianData.password,
      specialty: technicianData.specialty?.trim(),
      area: technicianData.area,
      project: technicianData.project || '',
      status: technicianData.status,
      availability: Number(availability),
      allocation_percentage: Number(allocationPercentage),
    }, {
      headers: getActorHeaders(),
    });
    return response.data;
  },

  /**
   * Obtiene el estado real de conexión (isOnline) y permisos de usuarios técnicos desde la Base de Datos.
   */
  getUsersStatus: async () => {
    const response = await api.get('/auth/users-status/');
    return response.data;
  },

  /**
   * Actualiza el permiso de SubAdministrador para un usuario.
   */
  toggleSubAdmin: async (id, isSubAdmin) => {
    const response = await api.patch('/auth/users-status/', { id, isSubAdmin });
    return response.data;
  },

  /**
   * Notifica al backend el cierre de sesión para marcar offline al usuario.
   */
  logoutUser: async (data = {}) => {
    const response = await api.post('/auth/logout/', data);
    return response.data;
  },

  /** Comprueba que la sesión del dispositivo continúe vigente. */
  validateSession: async () => {
    const response = await api.get('/auth/session/validate/');
    return response.data;
  },

  /**
   * Obtiene las notificaciones personalizadas del usuario autenticado.
   */
  getNotifications: async (params = {}) => {
    const response = await api.get('/notifications/', { params });
    return response.data;
  },

  /**
   * Cambia la contraseña del usuario validando su clave actual en la Base de Datos.
   */
  verifyCurrentPassword: async ({ identifier, userId, currentPassword }) => {
    const response = await api.post('/auth/change-password/', {
      identifier,
      user_id: userId,
      current_password: currentPassword,
      verify_only: true,
    });
    return response.data;
  },

  changePassword: async ({ identifier, userId, currentPassword, newPassword, confirmPassword }) => {
    const response = await api.post('/auth/change-password/', {
      identifier,
      user_id: userId,
      current_password: currentPassword,
      new_password: newPassword,
      confirm_password: confirmPassword,
    });
    return response.data;
  },

  /**
   * Actualiza la foto de perfil, correo electrónico y datos de contacto en la Base de Datos.
   */
  updateProfile: async ({ userId, identifier, name, email, photo, phone }) => {
    const response = await api.patch('/auth/profile/', {
      userId,
      identifier,
      name,
      email,
      photo,
      avatar: photo,
      phone,
    });
    return response.data;
  },

  /**
   * Obtiene la bitácora de auditoría de seguridad para supervisión del Administrador.
   */
  getAuditLogs: async () => {
    const response = await api.get('/auth/audit-logs/');
    return response.data;
  },

  /**
   * Obtiene el perfil (foto, teléfono, nombre) desde la Base de Datos.
   */
  getProfile: async ({ userId, identifier }) => {
    const response = await api.get('/auth/profile/', {
      params: {
        userId,
        identifier,
      },
    });
    return response.data;
  },
  /**
   * Obtiene la lista de videoconferencias / salas Jitsi Meet registradas.
   * Permite filtrar por ID de proyecto.
   * @param {string|number} projectId ID del proyecto
   */
  getMeetings: async (projectId = null) => {
    const params = projectId ? { project: projectId } : {};
    const response = await api.get('/meetings/', { params });
    return response.data;
  },

  /**
   * Registra una nueva reunión / sala de videoconferencia en Jitsi Meet.
   * El backend autogenera un room_name único y la meeting_url.
   * @param {Object} meetingData { project: id, title: string, scheduled_at?: string }
   */
  createMeeting: async (meetingData) => {
    const response = await api.post('/meetings/', meetingData);
    return response.data;
  },
  /**
   * Verifica el código TOTP de 6 dígitos para administradores (2FA)
   */
  verify2FA: async (userId, otpCode) => {
    const response = await api.post('/auth/verify-2fa/', {
      user_id: userId,
      otp_code: otpCode,
    });
    return response.data;
  },

  /**
   * Genera el secreto TOTP, URI de aprovisionamiento y código QR para 2FA
   */
  setup2FA: async (userId) => {
    const response = await api.post('/auth/setup-2fa/', {
      user_id: userId,
    });
    return response.data;
  },
  /**
   * Solicita el restablecimiento de 2FA por correo
   */
  request2FAReset: async (userId) => {
    const response = await api.post('/auth/request-2fa-reset/', {
      user_id: userId,
    });
    return response.data;
  },

  /**
   * Verifica el código de recuperación de 2FA
   */
  verify2FAReset: async (userId, code) => {
    const response = await api.post('/auth/verify-2fa-reset/', {
      user_id: userId,
      code,
    });
    return response.data;
  },
};

export default projectsApi;