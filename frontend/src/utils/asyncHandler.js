/**
 * Utilidades para manejo seguro de operaciones asíncronas y extracción
 * consistente de mensajes de error de APIs (Axios / Django REST Framework).
 */

/**
 * Extrae un mensaje de error legible para el usuario final a partir de
 * una respuesta de error de Axios o excepción de JavaScript.
 *
 * Soporta las estructuras comunes de Django y Django REST Framework:
 * - { detail: "..." }
 * - { error: "..." }
 * - { message: "..." }
 * - { non_field_errors: ["..."] }
 * - { field_name: ["..."] } (errores de validación de serializers)
 * - Errores de desconexión o red (sin response).
 *
 * @param {unknown} error - Excepción o error capturado.
 * @param {string} [fallbackMessage='Ocurrió un error inesperado.'] - Mensaje por defecto.
 * @returns {string} Mensaje procesado y seguro para mostrar en la interfaz.
 */
export function getApiErrorMessage(error, fallbackMessage = 'Ocurrió un error inesperado.') {
  if (!error) return fallbackMessage;

  // Si ya es un string directo
  if (typeof error === 'string') return error;

  // Comprobación de fallo de red (servidor inalcanzable o sin conexión)
  if (error && typeof error === 'object') {
    const isNetworkError =
      ('request' in error && !('response' in error)) ||
      error.code === 'ERR_NETWORK' ||
      error.message === 'Network Error';

    if (isNetworkError) {
      return 'No se pudo conectar con el servidor. Verifica tu conexión de red o si el servicio está disponible.';
    }

    const data = error.response?.data;

    if (data) {
      if (typeof data === 'string' && data.trim()) {
        return data.trim();
      }

      if (typeof data === 'object') {
        if (data.error && typeof data.error === 'string') {
          return data.error;
        }

        if (data.detail && typeof data.detail === 'string') {
          return data.detail;
        }

        if (data.message && typeof data.message === 'string') {
          return data.message;
        }

        if (Array.isArray(data.non_field_errors) && data.non_field_errors.length > 0) {
          return data.non_field_errors.join(' ');
        }

        // Inspeccionar primer campo con error de validación (ej. { email: ['Email inválido'] })
        const keys = Object.keys(data);
        if (keys.length > 0) {
          const firstVal = data[keys[0]];
          if (Array.isArray(firstVal) && firstVal.length > 0) {
            return String(firstVal[0]);
          }
          if (typeof firstVal === 'string' && firstVal.trim()) {
            return firstVal.trim();
          }
        }
      }
    }

    if (typeof error.message === 'string' && error.message.trim()) {
      return error.message.trim();
    }
  }

  return fallbackMessage;
}

/**
 * Ejecuta una operación asíncrona de manera segura, retornando una tupla
 * [data, error] inspirada en el patrón Go, evitando bloques try/catch anidados
 * y gestionando opcionalmente el estado de carga (setLoading) y notificaciones (Toast).
 *
 * @template T
 * @param {(() => Promise<T>) | Promise<T>} asyncOperation - Función o promesa a ejecutar.
 * @param {Object} [options={}] - Opciones de control de UI.
 * @param {(loading: boolean) => void} [options.setLoading] - Setter de estado de carga.
 * @param {(toast: { title: string, message: string, type: 'success'|'error'|'info' }) => void} [options.showToast] - Disparador de Toast.
 * @param {string | ((data: T) => string)} [options.successMessage] - Mensaje de éxito a mostrar.
 * @param {string} [options.successTitle='Operación exitosa'] - Título del toast de éxito.
 * @param {string} [options.fallbackError='No se pudo completar la operación.'] - Mensaje fallback de error.
 * @param {string} [options.errorTitle='Error'] - Título del toast de error.
 * @param {(data: T) => void} [options.onSuccess] - Callback opcional en caso de éxito.
 * @param {(error: unknown, message: string) => void} [options.onError] - Callback opcional en caso de fallo.
 * @returns {Promise<[T | null, (Error & { friendlyMessage?: string }) | null]>} Tupla [resultado, error].
 */
export async function runSafe(asyncOperation, options = {}) {
  const {
    setLoading,
    showToast,
    successMessage,
    successTitle = 'Operación exitosa',
    fallbackError = 'No se pudo completar la operación.',
    errorTitle = 'Error',
    onSuccess,
    onError,
  } = options;

  if (typeof setLoading === 'function') {
    setLoading(true);
  }

  try {
    const promise = typeof asyncOperation === 'function' ? asyncOperation() : asyncOperation;
    const data = await promise;

    if (showToast && successMessage) {
      const msg = typeof successMessage === 'function' ? successMessage(data) : successMessage;
      showToast({
        title: successTitle,
        message: msg,
        type: 'success',
      });
    }

    if (typeof onSuccess === 'function') {
      onSuccess(data);
    }

    return [data, null];
  } catch (error) {
    const friendlyMessage = getApiErrorMessage(error, fallbackError);

    // Adjuntar el mensaje amigable al error para consumidores
    if (error && typeof error === 'object') {
      try {
        error.friendlyMessage = friendlyMessage;
      } catch {
        // En caso de que el objeto de error esté congelado
      }
    }

    if (showToast) {
      showToast({
        title: errorTitle,
        message: friendlyMessage,
        type: 'error',
      });
    }

    if (typeof onError === 'function') {
      onError(error, friendlyMessage);
    }

    return [null, error];
  } finally {
    if (typeof setLoading === 'function') {
      setLoading(false);
    }
  }
}
