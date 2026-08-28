import axios from 'axios';

// Instancia base de Axios para comunicarse con el backend de Django
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;
