import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import esDict from '../locales/es.json';
import enDict from '../locales/en.json';

const STORAGE_KEY = 'project_planner_lang';
export const SUPPORTED_LANGUAGES = ['es', 'en'];
export const DEFAULT_LANGUAGE = 'es';

const DICTIONARIES = {
  es: esDict,
  en: enDict,
};

/**
 * Resuelve una propiedad anidada mediante notación de puntos (ej: "nav.dashboard")
 */
function getNestedValue(obj, path) {
  if (!obj || typeof obj !== 'object' || typeof path !== 'string') return undefined;
  const keys = path.split('.');
  let current = obj;
  let found = true;
  for (const key of keys) {
    if (current && typeof current === 'object' && Object.prototype.hasOwnProperty.call(current, key)) {
      current = current[key];
    } else {
      found = false;
      break;
    }
  }
  if (found && typeof current === 'string') return current;

  // Soporte para claves que contienen puntos dentro del nombre de la propiedad (ej: "toasts.Los proyectos se han sincronizado exitosamente.")
  const firstDotIndex = path.indexOf('.');
  if (firstDotIndex > 0) {
    const domain = path.slice(0, firstDotIndex);
    const subKey = path.slice(firstDotIndex + 1);
    if (obj[domain] && typeof obj[domain] === 'object' && Object.prototype.hasOwnProperty.call(obj[domain], subKey)) {
      const val = obj[domain][subKey];
      if (typeof val === 'string') return val;
    }
  }

  return undefined;
}

/**
 * Reemplaza variables {clave} en una cadena de texto según el objeto de parámetros
 */
function interpolate(template, params) {
  if (typeof template !== 'string') return template;
  if (!params || typeof params !== 'object' || Object.keys(params).length === 0) {
    return template;
  }
  return template.replace(/\{([a-zA-Z0-9_-]+)\}/g, (match, key) => {
    return Object.prototype.hasOwnProperty.call(params, key) ? String(params[key]) : match;
  });
}

/**
 * Crea la función de traducción vinculada a un idioma específico
 */
export function createTranslate(currentLang, dictionaries = DICTIONARIES) {
  return function t(path, fallback = '', params = {}) {
    if (!path || typeof path !== 'string') {
      return fallback !== '' && fallback !== undefined && fallback !== null
        ? interpolate(String(fallback), params)
        : '';
    }

    const dict = dictionaries[currentLang] || dictionaries[DEFAULT_LANGUAGE];
    let resolved = getNestedValue(dict, path);

    // Si la clave no existe en el idioma actual, usa el diccionario de respaldo (español)
    if (resolved === undefined && currentLang !== DEFAULT_LANGUAGE) {
      resolved = getNestedValue(dictionaries[DEFAULT_LANGUAGE], path);
    }

    // Si encontramos una traducción válida
    if (resolved !== undefined) {
      return interpolate(resolved, params);
    }

    // Si tampoco existe, usa fallback si fue provisto; si no, devuelve path
    if (fallback !== '' && fallback !== undefined && fallback !== null) {
      return interpolate(String(fallback), params);
    }

    return path;
  };
}

/**
 * Obtiene el idioma inicial persistido de forma segura para SSR y navegadores
 */
function getInitialLanguage() {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved && SUPPORTED_LANGUAGES.includes(saved)) {
        return saved;
      }
    }
  } catch {
    // Entorno protegido o sin acceso a localStorage
  }
  return DEFAULT_LANGUAGE;
}

export const defaultLanguageContext = {
  lang: DEFAULT_LANGUAGE,
  setLang: () => {},
  t: createTranslate(DEFAULT_LANGUAGE, DICTIONARIES),
  supportedLanguages: SUPPORTED_LANGUAGES,
};

const LanguageContext = createContext(defaultLanguageContext);

export function LanguageProvider({ children, initialLang }) {
  const [lang, setLangState] = useState(() => {
    if (initialLang && SUPPORTED_LANGUAGES.includes(initialLang)) {
      return initialLang;
    }
    return getInitialLanguage();
  });

  const setLang = useCallback((newLang) => {
    if (!SUPPORTED_LANGUAGES.includes(newLang)) return;
    setLangState(newLang);
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(STORAGE_KEY, newLang);
      }
    } catch {
      // Ignorar fallo de almacenamiento
    }
    if (typeof document !== 'undefined' && document.documentElement) {
      document.documentElement.lang = newLang;
    }
  }, []);

  // Sincronizar atributo html lang al montar o cambiar
  useEffect(() => {
    if (typeof document !== 'undefined' && document.documentElement) {
      document.documentElement.lang = lang;
    }
  }, [lang]);

  // Sincronización entre pestañas si cambia el idioma en otra ventana
  useEffect(() => {
    const handleStorage = (event) => {
      if (
        event.key === STORAGE_KEY &&
        event.newValue &&
        SUPPORTED_LANGUAGES.includes(event.newValue)
      ) {
        setLangState(event.newValue);
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', handleStorage);
      return () => window.removeEventListener('storage', handleStorage);
    }
  }, []);

  const t = useMemo(() => createTranslate(lang, DICTIONARIES), [lang]);

  const value = useMemo(
    () => ({
      lang,
      setLang,
      t,
      supportedLanguages: SUPPORTED_LANGUAGES,
    }),
    [lang, setLang, t]
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  return context || defaultLanguageContext;
}

export { LanguageContext };
