import api from './api';

/**
 * Cliente de servicios para el módulo de Proyectos (Portfolio)
 * Conectado con los endpoints REST de Django: /api/projects/
 */
export const projectsApi = {
  /**
   * Obtiene la lista completa de proyectos registrados en la base de datos MySQL.
   */
  getProjects: async () => {
    const response = await api.get('/projects/');
    return response.data;
  },

  /**
   * Registra un nuevo proyecto en el Backend.
   * El Backend valida en MySQL y despacha automáticamente la notificación a Make.
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
   * Obtiene la lista de miembros y líderes del equipo registrados en MySQL.
   */
  getTeamMembers: async () => {
    const response = await api.get('/team-members/');
    return response.data;
  },

  /**
   * Obtiene el estado real de conexión (isOnline) y permisos de usuarios técnicos desde MySQL.
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

  /**
   * Obtiene las notificaciones personalizadas del usuario autenticado.
   */
  getNotifications: async (params = {}) => {
    const response = await api.get('/notifications/', { params });
    return response.data;
  },
};

export default projectsApi;
