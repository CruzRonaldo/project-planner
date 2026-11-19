/**
 * @fileoverview Cliente HTTP principal Axios para la plataforma Project Planner.
 *
 * Configura la resolución inteligente de la URL base según el entorno:
 * 1. Variable de entorno Vite: Si `import.meta.env.VITE_API_URL` está definida, se normaliza asegurando el prefijo `/api`.
 * 2. Despliegue en la nube (Render): Si el hostname contiene `onrender.com`, conecta a `https://project-planner-to9j.onrender.com/api`.
 * 3. Entorno local: Fallback predeterminado a `http://127.0.0.1:8000/api`.
 *
 * Interceptores:
 * - Request: Lee el `session_token` firmado desde `project_planner_user` en localStorage e inyecta la cabecera `Authorization: Bearer <token>`
 *   en todas las peticiones protegidas.
 */
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

/**
 * Instancia preconfigurada de Axios para peticiones a la API REST de Django.
 * Soporta serialización automática de JSON y multipart/form-data para archivos.
 */
const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Interceptor de solicitudes salientes:
 * Inyecta el token firmado de sesión (Bearer) si existe un usuario autenticado en localStorage.
 */
api.interceptors.request.use((requestConfig) => {
  if (typeof window === 'undefined') return requestConfig;

  try {
    const savedUser = JSON.parse(window.localStorage.getItem('project_planner_user') || 'null');
    const sessionToken = savedUser?.session_token;
    if (sessionToken && !requestConfig.headers?.Authorization) {
      requestConfig.headers = requestConfig.headers || {};
      requestConfig.headers.Authorization = `Bearer ${sessionToken}`;
    }
  } catch {
    // Una sesión local dañada será tratada por el controlador de la aplicación.
  }

  return requestConfig;
});

/**
 * Verifica el código TOTP de 6 dígitos del Administrador ante el backend
 * @param {string|number} userId
 * @param {string} otpCode
 */
export const verify2FA = async (userId, otpCode) => {
  const response = await api.post('/auth/verify-2fa/', {
    user_id: userId,
    otp_code: otpCode,
  });
  return response.data;
};

/**
 * Genera el secreto TOTP, URI de aprovisionamiento y código QR para 2FA
 * @param {string|number} userId
 */
export const setup2FA = async (userId) => {
  const response = await api.post('/auth/setup-2fa/', {
    user_id: userId,
  });
  return response.data;
};

/**
 * Solicita el restablecimiento de 2FA por correo vía webhook de Make
 * @param {string|number} userId
 */
export const request2FAReset = async (userId) => {
  const response = await api.post('/auth/request-2fa-reset/', {
    user_id: userId,
  });
  return response.data;
};

/**
 * Verifica el código de 6 dígitos enviado por correo y restablece el 2FA
 * @param {string|number} userId
 * @param {string} code
 */
export const verify2FAReset = async (userId, code) => {
  const response = await api.post('/auth/verify-2fa-reset/', {
    user_id: userId,
    code,
  });
  return response.data;
};
export { baseURL };
export default api;
