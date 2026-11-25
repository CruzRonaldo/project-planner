/**
 * Localiza un mensaje de error utilizando la función de traducción (t) de i18n.
 * Busca coincidencias directas en la clave `toasts.<error>` o en la raíz,
 * y en mensajes compuestos descompone por oraciones para traducir cada segmento.
 *
 * @param {string} errorString - Mensaje de error a traducir.
 * @param {Function} t - Función traductora de useLanguage.
 * @returns {string} Mensaje traducido o el original como fallback.
 */
export function localizeApiErrorMessage(errorString, t) {
  if (!errorString || typeof errorString !== 'string' || typeof t !== 'function') {
    return errorString || '';
  }

  // 1. Coincidencia directa completa en namespace toasts
  const directToast = t(`toasts.${errorString}`, null);
  if (directToast && directToast !== `toasts.${errorString}`) {
    return directToast;
  }

  // 2. Coincidencia directa completa en raíz
  const directRoot = t(errorString, null);
  if (directRoot && directRoot !== errorString) {
    return directRoot;
  }

  // 3. Coincidencia para sufijos conocidos de caché / contingencia
  const CACHE_SUFFIX = 'Se mantiene la última copia disponible.';
  if (errorString.includes(CACHE_SUFFIX)) {
    const mainPart = errorString.replace(CACHE_SUFFIX, '').trim();
    const mainTranslated = mainPart
      ? (t(`toasts.${mainPart}`, null) || t(mainPart, null) || mainPart)
      : '';
    const suffixTranslated =
      t(`toasts.${CACHE_SUFFIX}`, null) || t(CACHE_SUFFIX, null) || CACHE_SUFFIX;
    return [mainTranslated, suffixTranslated].filter(Boolean).join(' ');
  }

  // 4. Fallback para mensajes compuestos generales (separados por punto y espacio)
  const sentences = errorString.split(/(?<=[.!?])\s+/);
  if (sentences && sentences.length > 1) {
    const translatedParts = sentences.map((part) => {
      const trimmed = part.trim();
      if (!trimmed) return '';
      const partToast = t(`toasts.${trimmed}`, null);
      if (partToast && partToast !== `toasts.${trimmed}`) return partToast;
      const partRoot = t(trimmed, null);
      if (partRoot && partRoot !== trimmed) return partRoot;
      return trimmed;
    });
    return translatedParts.filter(Boolean).join(' ');
  }

  return errorString;
}

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
