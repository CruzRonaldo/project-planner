/**
 * Utilidades de detección de plataforma, sistema operativo y periféricos (A11y / Clean Code).
 * Funciones puras y desacopladas para uso en cualquier componente o servicio.
 */

export function detectPlatform() {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return {
      os: 'unknown',
      isMac: false,
      isWindows: false,
      isLinux: false,
      isMobile: false,
      hasKeyboard: true,
      modKey: 'Ctrl',
      modKeyName: 'Ctrl',
    };
  }

  const ua = navigator.userAgent || '';
  const platform = navigator.userAgentData?.platform || navigator.platform || '';

  // Detección de dispositivos móviles o pantallas táctiles pequeñas (< 768px)
  const isMobileDevice =
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua) ||
    (typeof window.matchMedia === 'function' && window.matchMedia('(pointer: coarse)').matches) ||
    ('ontouchstart' in window && window.innerWidth < 768);

  // Detección del sistema operativo de escritorio
  const isMac = /Mac|iPhone|iPad|iPod/i.test(platform) || /Macintosh|Mac OS X/i.test(ua);
  const isWindows = /Win/i.test(platform) || /Windows/i.test(ua);
  const isLinux = (/Linux/i.test(platform) || /Linux/i.test(ua)) && !/Android/i.test(ua);

  let os = 'unknown';
  if (isMobileDevice) os = 'mobile';
  else if (isMac) os = 'macos';
  else if (isWindows) os = 'windows';
  else if (isLinux) os = 'linux';

  return {
    os,
    isMac,
    isWindows,
    isLinux,
    isMobile: isMobileDevice,
    hasKeyboard: !isMobileDevice,
    modKey: isMac ? '⌘' : 'Ctrl',
    modKeyName: isMac ? 'Cmd' : 'Ctrl',
  };
}

/**
 * Formatea un atajo de teclado según la plataforma del usuario.
 * Si es un dispositivo móvil o táctil, retorna null para no saturar la vista.
 *
 * @param {string} shortcut - Ejemplo: "Shift + 1" o "Ctrl + K"
 * @param {object} [platformInfo] - Resultado de detectPlatform()
 * @returns {string|null} - Atajo adaptado o null si no aplica
 */
export function formatShortcut(shortcut, platformInfo = null) {
  const info = platformInfo || detectPlatform();

  // En móvil o dispositivos sin teclado físico, no se muestran los atajos
  if (info.isMobile || !info.hasKeyboard) {
    return null;
  }

  if (!shortcut) return null;

  // En macOS se adaptan las etiquetas a los símbolos habituales de Apple
  if (info.isMac) {
    return shortcut
      .replace(/Ctrl\s*\+\s*/gi, '⌘')
      .replace(/Ctrl/gi, '⌘')
      .replace(/Shift\s*\+\s*/gi, '⇧');
  }

  return shortcut;
}
