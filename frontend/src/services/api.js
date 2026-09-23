import axios from 'axios';

// Determinar la URL base de forma inteligente:
// 1. Si existe VITE_API_URL en el entorno, usarla asegurando el sufijo /api.
// 2. Si estamos corriendo en la nube (*.onrender.com), conectar automáticamente al backend de Render.
// 3. En entorno local de desarrollo, conectar a http://127.0.0.1:8000/api.
let configuredUrl = import.meta.env.VITE_API_URL;

if (!configuredUrl) {
  if (typeof window !== 'undefined' && window.location.hostname.includes('onrender.com')) {
    configuredUrl = 'https://project-planner-to9j.onrender.com/api';
  } else {
    configuredUrl = 'http://127.0.0.1:8000/api';
  }
}

// Asegurar que termine en /api y no tenga barras duplicadas
const cleanUrl = configuredUrl.replace(/\/+$/, '');
const baseURL = cleanUrl.endsWith('/api') ? cleanUrl : `${cleanUrl}/api`;

const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;
