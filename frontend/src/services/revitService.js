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
  uploadModel: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return await api.post('/integrations/aps/upload/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
  }
};
