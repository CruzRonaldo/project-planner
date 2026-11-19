import React from 'react';
import { Globe } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export default function LanguageSelector() {
  const { lang, setLang, supportedLanguages } = useLanguage();

  return (
    <div
      role="group"
      aria-label="Seleccionar idioma / Select language"
      className="inline-flex items-center gap-0.5 rounded-lg p-0.5 border transition-colors duration-200 border-slate-200 bg-slate-100 dark:border-[#30363d] dark:bg-[#161b22] midnight:border-cyan-800/40 midnight:bg-[#0a1120]"
    >
      <span
        className="flex items-center justify-center pl-1.5 pr-0.5 text-slate-400 dark:text-slate-500 midnight:text-cyan-500/70"
        aria-hidden="true"
      >
        <Globe size={13} />
      </span>
      {supportedLanguages.map((itemLang) => {
        const isActive = lang === itemLang;
        const upper = itemLang.toUpperCase();
        const fullLabel = itemLang === 'es' ? 'Español' : 'English';

        return (
          <button
            key={itemLang}
            type="button"
            onClick={() => setLang(itemLang)}
            aria-pressed={isActive}
            aria-label={fullLabel}
            title={fullLabel}
            className={`px-2 py-1 text-[11px] leading-none rounded-md transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 select-none ${
              isActive
                ? 'bg-white text-cyan-700 font-bold shadow-xs dark:bg-[#21262d] dark:text-cyan-300 midnight:bg-cyan-950/90 midnight:text-cyan-300 midnight:border midnight:border-cyan-800/60'
                : 'font-medium text-slate-500 hover:text-slate-900 hover:bg-slate-200/60 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-white/5 midnight:text-cyan-200/60 midnight:hover:text-cyan-200 midnight:hover:bg-cyan-900/30'
            }`}
          >
            {upper}
          </button>
        );
      })}
    </div>
  );
}
