import React from 'react';
import ReadOnlyField from '../../../components/common/ReadOnlyField';
import { cardClass } from '../../../constants/themeClasses';
import { useLanguage, SUPPORTED_LANGUAGES } from '../../../context/LanguageContext';
import usePlatform from '../../../hooks/usePlatform';

const LANGUAGE_CONFIG = {
  es: { key: 'configuration.spanish', defaultLabel: 'Español (ES)' },
  en: { key: 'configuration.english', defaultLabel: 'English (EN)' },
};

/**
 * Tarjeta de Preferencias del Sistema: Idioma, Zona horaria,
 * Escala tipográfica y Selector de temas (Claro, Oscuro, Medianoche).
 */
export default function PreferencesCard({
  fontScale,
  setFontScale,
  theme,
  setTheme,
  _isAdmin,
}) {
  const { lang, setLang, t, supportedLanguages } = useLanguage();
  const { isMobile } = usePlatform();
  const languages = supportedLanguages || SUPPORTED_LANGUAGES || ['es', 'en'];

  return (
    <section
      aria-labelledby="preferences-card-title"
      className={`${cardClass} p-6`}
    >
      <h2
        id="preferences-card-title"
        className="text-lg font-bold mb-6 text-slate-900 dark:text-white midnight:text-cyan-100"
      >
        {t('configuration.systemPreferences', 'Preferencias del Sistema')}
      </h2>

      {/* Selector limpio de Idioma y Zona Horaria en grid de 2 columnas */}
      <div className={`grid grid-cols-1 sm:grid-cols-2 gap-4 ${isMobile ? '' : 'mb-6'}`}>
        <div>
          <label
            id="language-select-label"
            className="block text-xs text-slate-500 transition-colors duration-300 dark:text-slate-400 midnight:text-cyan-500/70 mb-1.5"
          >
            {t('configuration.language', 'Idioma')}
          </label>
          <div
            role="group"
            aria-labelledby="language-select-label"
            className="flex items-center gap-1.5 p-1 rounded-lg border transition-colors bg-slate-100 border-slate-300 dark:bg-[#0d1117] dark:border-[#30363d] midnight:bg-cyan-950 midnight:border-cyan-800/40"
          >
            {languages.map((code) => {
              const config = LANGUAGE_CONFIG[code];
              const label = config
                ? t(config.key, config.defaultLabel)
                : t(`configuration.lang_${code}`, code.toUpperCase());
              const isSelected = lang === code;
              return (
                <button
                  key={code}
                  type="button"
                  onClick={() => setLang(code)}
                  aria-pressed={isSelected}
                  className={`flex-1 flex items-center justify-center py-1.5 px-2.5 rounded-md text-xs font-medium border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-white text-slate-900 shadow-sm border-slate-200 dark:bg-[#21262d] dark:text-white dark:border-[#30363d] midnight:bg-cyan-900/60 midnight:text-cyan-100 midnight:border-cyan-700/50 font-semibold'
                      : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white midnight:text-cyan-600 midnight:hover:text-cyan-400 border-transparent'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        <ReadOnlyField
          label={t('configuration.timeZone', 'Zona Horaria')}
          value="GMT-5 (Lima)"
        />
      </div>

      {/* Control de Escala de Letra (Solo disponible en dispositivos de escritorio) */}
      {!isMobile && (
        <div className="rounded-lg p-5 border transition-colors duration-300 bg-slate-50 border-slate-200 dark:bg-[#0d1117] dark:border-[#30363d] midnight:bg-[#050B14] midnight:border-cyan-900/40">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-serif text-lg font-bold text-cyan-600 dark:text-cyan-400 midnight:text-cyan-500">T</span>
            <h3 className="text-sm font-medium text-slate-900 dark:text-white midnight:text-cyan-100">
              {t('configuration.fontSize', 'Tamaño de letra')}
            </h3>
          </div>
          <p className="text-xs mb-4 text-slate-500 dark:text-slate-400 midnight:text-cyan-600/70">
            {t('configuration.fontSizeDesc', 'Ajusta toda la interfaz sin modificar el logo.')}
          </p>

          <div className="flex items-center gap-3 mb-4">
            <button
              type="button"
              onClick={() => setFontScale((prev) => Math.max(85, prev - 5))}
              aria-label={t('configuration.decreaseFontSize', 'Disminuir tamaño de letra')}
              className="w-10 h-10 rounded-lg border flex items-center justify-center text-xl transition-colors border-slate-300 text-slate-600 hover:bg-slate-200 dark:border-[#30363d] dark:text-slate-300 dark:hover:bg-white/5 midnight:border-cyan-800 midnight:text-cyan-400 midnight:hover:bg-cyan-900/40 cursor-pointer"
            >
              −
            </button>
            <div className="flex-1 h-10 rounded-lg border flex items-center justify-center font-bold transition-colors border-cyan-200 bg-cyan-50 text-cyan-700 dark:border-cyan-400/30 dark:bg-cyan-500/10 dark:text-cyan-400 midnight:border-cyan-500/50 midnight:bg-cyan-900/20 midnight:text-cyan-300">
              {fontScale}%
            </div>
            <button
              type="button"
              onClick={() => setFontScale((prev) => Math.min(120, prev + 5))}
              aria-label={t('configuration.increaseFontSize', 'Aumentar tamaño de letra')}
              className="w-10 h-10 rounded-lg border flex items-center justify-center text-xl transition-colors border-slate-300 text-slate-600 hover:bg-slate-200 dark:border-[#30363d] dark:text-slate-300 dark:hover:bg-white/5 midnight:border-cyan-800 midnight:text-cyan-400 midnight:hover:bg-cyan-900/40 cursor-pointer"
            >
              +
            </button>
          </div>

          <input
            type="range"
            min="85"
            max="120"
            step="5"
            value={fontScale}
            aria-label={t('configuration.fontScaleSlider', 'Selector de escala de texto')}
            onChange={(e) => setFontScale(Number(e.target.value))}
            className="w-full h-1 rounded-lg appearance-none cursor-pointer accent-cyan-500 mb-4 bg-slate-300 dark:bg-slate-600 midnight:bg-cyan-900"
          />

          <button
            type="button"
            onClick={() => setFontScale(100)}
            className="w-full text-xs flex items-center justify-center gap-2 transition-colors text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white midnight:text-cyan-600 midnight:hover:text-cyan-300 cursor-pointer"
          >
            ↻ {t('configuration.fontSizeReset', 'Restablecer al 100%')}
          </button>
        </div>
      )}
    </section>
  );
}
