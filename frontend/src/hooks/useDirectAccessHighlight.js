import { useState, useEffect, useCallback } from 'react';

/**
 * Hook reutilizable para acceso directo y resaltado luminoso temporal de elementos.
 * Aplica el patrón de foco visual para tarjetas, filas o nodos específicos
 * tras una navegación con contexto (ej. desde Auditoría o Notificaciones).
 *
 * @param {Object} [options={}]
 * @param {string|number|null} [options.targetId=null] - Identificador único o código del elemento a resaltar.
 * @param {number} [options.durationMs=2000] - Tiempo en ms durante el cual el resplandor permanece activo (default: 2.0s).
 * @param {string} [options.elementPrefix=''] - Prefijo opcional para el selector DOM por ID (ej. 'project-card-').
 * @param {Function} [options.onClear=null] - Callback ejecutado cuando el resplandor se apaga.
 * @param {Function} [options.onLocate=null] - Callback para preparar visibilidad previa (ajuste de paginación o filtros).
 * @returns {{
 *   activeHighlightId: string|number|null,
 *   isHighlighted: (id: string|number) => boolean,
 *   clearHighlight: () => void
 * }}
 */
export function useDirectAccessHighlight({
  targetId = null,
  durationMs = 2000,
  elementPrefix = '',
  onClear = null,
  onLocate = null,
} = {}) {
  const [activeHighlightId, setActiveHighlightId] = useState(null);

  useEffect(() => {
    if (!targetId) return undefined;

    setActiveHighlightId(targetId);

    if (onLocate) {
      onLocate(targetId);
    }

    // Scroll suave hacia el elemento en el DOM si se especificó prefijo o selector
    const scrollTimer = setTimeout(() => {
      const elementId = elementPrefix ? `${elementPrefix}${targetId}` : String(targetId);
      const el = document.getElementById(elementId) || document.querySelector(`[data-highlight-id="${targetId}"]`);
      if (el && typeof el.scrollIntoView === 'function') {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 150);

    // Apagar la luz tras el tiempo estipulado (por defecto 2.0 segundos)
    const clearTimer = setTimeout(() => {
      setActiveHighlightId(null);
      if (onClear) onClear();
    }, durationMs);

    return () => {
      clearTimeout(scrollTimer);
      clearTimeout(clearTimer);
    };
  }, [targetId, durationMs, elementPrefix, onClear, onLocate]);

  const isHighlighted = useCallback(
    (id) => {
      if (!activeHighlightId || !id) return false;
      return String(activeHighlightId) === String(id);
    },
    [activeHighlightId]
  );

  const clearHighlight = useCallback(() => {
    setActiveHighlightId(null);
    if (onClear) onClear();
  }, [onClear]);

  return {
    activeHighlightId,
    isHighlighted,
    clearHighlight,
  };
}

export default useDirectAccessHighlight;
