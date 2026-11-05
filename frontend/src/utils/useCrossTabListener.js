import { useEffect, useRef } from 'react';

/**
 * Hook reutilizable que escucha cambios en una o más claves de localStorage
 * emitidos en tiempo real por otras pestañas o ventanas del navegador (evento nativo 'storage').
 *
 * Cumple con el principio DRY y separa la lógica de sincronización entre pestañas
 * de los controladores de dominio.
 *
 * @param {string|string[]} keys - Clave o lista de claves a observar en localStorage
 * @param {Function} onChange - Función callback invocada con (newValue, key, event)
 */
export function useCrossTabListener(keys, onChange) {
  const callbackRef = useRef(onChange);

  // Mantener siempre la referencia más reciente sin forzar reinscripción del listener
  useEffect(() => {
    callbackRef.current = onChange;
  }, [onChange]);

  const serializedKeys = Array.isArray(keys) ? keys.join(',') : String(keys);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const targetKeys = Array.isArray(keys) ? keys : [keys];

    const handleStorageChange = (event) => {
      // Si se ejecuta localStorage.clear(), el evento emite event.key === null
      if (event.key === null) {
        callbackRef.current(null, null, event);
        return;
      }

      if (targetKeys.includes(event.key)) {
        callbackRef.current(event.newValue, event.key, event);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serializedKeys]);
}
