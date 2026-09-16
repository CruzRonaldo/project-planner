import axios from 'axios';

// Axios seleccionará automáticamente:
// application/json para datos normales
// multipart/form-data para archivos
const api = axios.create({
  baseURL:
    import.meta.env.VITE_API_URL ||
    'http://127.0.0.1:8000/api',
});

export default api;