import { useState, useEffect, useCallback, useMemo } from 'react';

export const THEMES = Object.freeze({
  LIGHT: 'light',
  DARK: 'dark',
  MIDNIGHT: 'midnight',
});

export const ALLOWED_THEMES = Object.freeze([
  THEMES.LIGHT,
  THEMES.DARK,
  THEMES.MIDNIGHT,
]);

export const FONT_SCALE_LIMITS = Object.freeze({
  MIN: 85,
  MAX: 120,
  DEFAULT: 100,
});

export const THEME_STORAGE_KEYS = Object.freeze({
  THEME: 'project-planner-theme',
  FONT_SCALE: 'project-planner-font-scale',
});

/**
 * Valida y acota la escala tipográfica al rango accesible admitido (85% a 120%).
 * @param {number|string} scale
 * @returns {number}
 */
export function sanitizeFontScale(scale) {
  if (scale === null || scale === undefined || scale === '') {
    return FONT_SCALE_LIMITS.DEFAULT;
  }
  const numeric = Number(scale);
  if (Number.isNaN(numeric)) return FONT_SCALE_LIMITS.DEFAULT;
  return Math.min(
    Math.max(numeric, FONT_SCALE_LIMITS.MIN),
    FONT_SCALE_LIMITS.MAX
  );
}

/**
 * Valida si un tema especificado pertenece a la lista permitida.
 * @param {string} theme
 * @returns {boolean}
 */
export function isValidTheme(theme) {
  return typeof theme === 'string' && ALLOWED_THEMES.includes(theme);
}

/**
 * Controlador de Apariencia, Temas y Accesibilidad Tipográfica.
 * Gestiona de forma reactiva y desacoplada las preferencias visuales del usuario,
 * persistiendo en localStorage y sincronizando clases y esquemas de color en el DOM.
 *
 * @param {Object} [initialPreferences]
 * @param {string} [initialPreferences.defaultTheme='dark']
 * @param {number} [initialPreferences.defaultFontScale=100]
 * @returns {Object} Estado visual, selectores semánticos y acciones de mutación
 */
export function useThemeController({
  defaultTheme = THEMES.DARK,
  defaultFontScale = FONT_SCALE_LIMITS.DEFAULT,
} = {}) {
  // 1. Escala tipográfica inicializada de forma segura (SSR tolerante)
  const [fontScale, setFontScaleState] = useState(() => {
    try {
      const storage =
        typeof window !== 'undefined'
          ? window.localStorage
          : typeof localStorage !== 'undefined'
            ? localStorage
            : null;
      const savedScale = storage
        ? storage.getItem(THEME_STORAGE_KEYS.FONT_SCALE)
        : null;
      return savedScale !== null
        ? sanitizeFontScale(savedScale)
        : sanitizeFontScale(defaultFontScale);
    } catch {
      return sanitizeFontScale(defaultFontScale);
    }
  });

  // 2. Tema inicializado con validación y fallback seguro
  const [theme, setThemeState] = useState(() => {
    try {
      const storage =
        typeof window !== 'undefined'
          ? window.localStorage
          : typeof localStorage !== 'undefined'
            ? localStorage
            : null;
      const savedTheme = storage
        ? storage.getItem(THEME_STORAGE_KEYS.THEME)
        : null;
      return isValidTheme(savedTheme) ? savedTheme : defaultTheme;
    } catch {
      return defaultTheme;
    }
  });

  // 3. Sincronización de escala tipográfica con el elemento raíz (document.documentElement)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      window.localStorage.setItem(
        THEME_STORAGE_KEYS.FONT_SCALE,
        String(fontScale)
      );
    } catch {}

    if (typeof document !== 'undefined' && document.documentElement) {
      document.documentElement.style.fontSize = `${16 * (fontScale / 100)}px`;
    }
  }, [fontScale]);

  // 4. Sincronización del tema y esquema de color con document.documentElement
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      window.localStorage.setItem(THEME_STORAGE_KEYS.THEME, theme);
    } catch {}

    if (typeof document !== 'undefined' && document.documentElement) {
      const root = document.documentElement;
      root.classList.remove(THEMES.LIGHT, THEMES.DARK, THEMES.MIDNIGHT);
      root.classList.add(theme);
      root.style.colorScheme = theme === THEMES.LIGHT ? 'light' : 'dark';
    }
  }, [theme]);

  // 5. Mutación segura de escala tipográfica con validación de límites
  const setFontScale = useCallback((nextScale) => {
    setFontScaleState((prev) => {
      const target =
        typeof nextScale === 'function' ? nextScale(prev) : nextScale;
      return sanitizeFontScale(target);
    });
  }, []);

  // 6. Mutación segura de tema con validación de catálogo
  const setTheme = useCallback((nextTheme) => {
    setThemeState((prev) => {
      const target =
        typeof nextTheme === 'function' ? nextTheme(prev) : nextTheme;
      return isValidTheme(target) ? target : prev;
    });
  }, []);

  // 7. Alternancia cíclica entre temas (Claro -> Oscuro -> Medianoche -> Claro)
  const toggleTheme = useCallback(() => {
    setThemeState((current) => {
      if (current === THEMES.LIGHT) return THEMES.DARK;
      if (current === THEMES.DARK) return THEMES.MIDNIGHT;
      return THEMES.LIGHT;
    });
  }, []);

  // 8. Restablecimiento a valores de fábrica
  const resetPreferences = useCallback(() => {
    setFontScaleState(FONT_SCALE_LIMITS.DEFAULT);
    setThemeState(THEMES.DARK);
  }, []);

  const isLight = useMemo(() => theme === THEMES.LIGHT, [theme]);
  const isDark = useMemo(() => theme === THEMES.DARK, [theme]);
  const isMidnight = useMemo(() => theme === THEMES.MIDNIGHT, [theme]);

  return {
    theme,
    setTheme,
    toggleTheme,
    fontScale,
    setFontScale,
    resetPreferences,
    isLight,
    isDark,
    isMidnight,
  };
}
