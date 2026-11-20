/**
 * Servicio de Autenticación y Verificación de Dos Factores (2FA / TOTP).
 * Expone métodos para la configuración, validación de tokens temporales
 * y restablecimiento seguro de credenciales 2FA ante el backend Django.
 */
import { verify2FA, setup2FA, request2FAReset, verify2FAReset } from './api';

/**
 * Objeto unificado del servicio de autenticación 2FA.
 */
export const authApi = {
  /**
   * Valida el código TOTP de 6 dígitos del usuario ante el backend.
   * @param {string|number} userId - Identificador numérico o clave primaria del usuario.
   * @param {string} otpCode - Código de 6 dígitos generado por la app autenticadora.
   * @returns {Promise<Object>} Datos de sesión y usuario autenticado.
   */
  verify2FA,

  /**
   * Genera el secreto TOTP, URI de aprovisionamiento y código QR para un administrador.
   * @param {string|number} userId - ID del usuario administrador.
   * @returns {Promise<{ status: string, secret: string, provisioning_uri: string, qr_code_base64: string }>}
   */
  setup2FA,

  /**
   * Solicita el restablecimiento de 2FA por correo mediante webhook automatizado de Make.
   * @param {string|number} userId - ID del usuario.
   * @returns {Promise<{ status: string, message: string }>}
   */
  request2FAReset,

  /**
   * Valida el código de recuperación de 6 dígitos recibido por correo y restablece el 2FA.
   * @param {string|number} userId - ID del usuario.
   * @param {string} code - Código temporal de recuperación (expira en 15 minutos).
   * @returns {Promise<{ status: string, message: string }>}
   */
  verify2FAReset,
};

export { verify2FA, setup2FA, request2FAReset, verify2FAReset };
export default authApi;
