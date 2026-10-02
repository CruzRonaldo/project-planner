import api from './api';

export const revitApi = {
  getToken: async () => {
    return await api.get('/integrations/aps/token/');
  },
  checkStatus: async () => {
    return await api.get('/integrations/aps/status/');
  },
  getModels: async () => {
    return await api.get('/integrations/aps/models/');
  },
  renameModel: async (id, name) => {
    return await api.patch(`/integrations/aps/models/${id}/`, { name });
  },
  deleteModel: async (id) => {
    return await api.delete(`/integrations/aps/models/${id}/`);
  },
  getDownloadUrl: async (id) => {
    const userStr = localStorage.getItem('project_planner_user');
    let userId = '';
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        userId = user.id;
      } catch (e) {}
    }
    return await api.get(`/integrations/aps/models/${id}/download/`, {
        headers: { 
            'Authorization': `Bearer ${userId}`
        }
    });
  },
  uploadModel: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    
    // Extraer datos del usuario (actúa como "token" en este proyecto)
    const userStr = localStorage.getItem('project_planner_user');
    let userId = '';
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        userId = user.id;
      } catch (e) {}
    }

    return await api.post('/integrations/aps/upload/', formData, {
        headers: { 
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${userId}`
        }
    });
  }
};
