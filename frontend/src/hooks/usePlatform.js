import { useState, useEffect } from 'react';
import { detectPlatform, formatShortcut } from '../utils/platform';

/**
 * Hook reutilizable para consultar la plataforma del usuario en tiempo real.
 * Se actualiza ante cambios de tamaño de ventana o acoplamiento de periféricos.
 */
export function usePlatform() {
  const [platform, setPlatform] = useState(() => detectPlatform());

  useEffect(() => {
    const updatePlatform = () => {
      setPlatform(detectPlatform());
    };

    window.addEventListener('resize', updatePlatform);

    // Observar cambio entre cursor fino (ratón) y cursor grueso (táctil)
    const mediaPointer = window.matchMedia?.('(pointer: coarse)');
    if (mediaPointer?.addEventListener) {
      mediaPointer.addEventListener('change', updatePlatform);
    }

    return () => {
      window.removeEventListener('resize', updatePlatform);
      if (mediaPointer?.removeEventListener) {
        mediaPointer.removeEventListener('change', updatePlatform);
      }
    };
  }, []);

  return {
    ...platform,
    formatShortcut: (shortcut) => formatShortcut(shortcut, platform),
  };
}

export default usePlatform;
