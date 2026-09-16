import api from './api';

/**
 * Cliente de API para la integración con Make (Integromat).
 */
export const makeApi = {
  /**
   * Obtiene el estado actual de la integración con Make desde el backend.
   */
  async getStatus() {
    const response = await api.get('/integrations/make/status/');
    return response.data;
  },

  /**
   * Realiza una prueba de conexión directa hacia el Webhook de Make.
   * @param {string} [webhookUrl] - URL opcional del webhook para probar en tiempo real.
   */
  async testConnection(webhookUrl = '') {
    const response = await api.post('/integrations/make/test/', {
      webhook_url: webhookUrl || undefined,
    });
    return response.data;
  },

  /**
   * Dispara un evento personalizado hacia Make.
   * @param {string} event - Nombre del evento (ej: 'project.created', 'task.alert').
   * @param {object} data - Datos asociados al evento.
   * @param {string} [webhookUrl] - URL opcional de Make.
   */
  async triggerEvent(event, data = {}, webhookUrl = '') {
    const response = await api.post('/integrations/make/trigger/', {
      event,
      data,
      webhook_url: webhookUrl || undefined,
    });
    return response.data;
  },
};

export default makeApi;
