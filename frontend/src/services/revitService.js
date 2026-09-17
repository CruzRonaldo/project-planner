import api from './api';

export const revitApi = {
  syncRevitModels: async () => {
    const response = await api.get('/integrations/revit/models/');
    return response;
  }
};

