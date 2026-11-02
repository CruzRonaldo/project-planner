import React from 'react';
import { Sun, Moon, MoonStar } from 'lucide-react';
import Button from '../../../components/common/Button';

/**
 * Tarjeta de Preferencias del Sistema: Idioma, Zona horaria,
 * Escala tipográfica global y Selector de temas (Claro, Oscuro, Medianoche).
 */
export default function PreferencesCard({
  fontScale,
  setFontScale,
  theme,
  setTheme,
}) {
  return (
    <section
      aria-labelledby="preferences-card-title"
      className="border rounded-xl p-6 shadow-sm transition-colors duration-300 bg-white border-slate-200 dark:bg-[#161b22] dark:border-[#30363d] midnight:bg-[#0a1120] midnight:border-cyan-900/30"
    >
      <h2
        id="preferences-card-title"
        className="text-lg font-bold mb-6 text-slate-900 dark:text-white midnight:text-cyan-100"
      >
        Preferencias del Sistema
      </h2>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <p className="text-sm mb-1 text-slate-500 dark:text-slate-400 midnight:text-cyan-600">Idioma</p>
          <p className="text-slate-900 dark:text-slate-200 midnight:text-cyan-100">Español (ES)</p>
        </div>
        <div>
          <p className="text-sm mb-1 text-slate-500 dark:text-slate-400 midnight:text-cyan-600">Zona Horaria</p>
          <p className="text-slate-900 dark:text-slate-200 midnight:text-cyan-100">GMT-5 (Lima)</p>
        </div>
      </div>

      {/* Control de Escala de Letra */}
      <div className="rounded-lg p-5 mb-6 border transition-colors duration-300 bg-slate-50 border-slate-200 dark:bg-[#0d1117] dark:border-[#30363d] midnight:bg-[#050B14] midnight:border-cyan-900/40">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-serif text-lg font-bold text-cyan-600 dark:text-cyan-400 midnight:text-cyan-500">T</span>
          <h3 className="text-sm font-medium text-slate-900 dark:text-white midnight:text-cyan-100">Tamaño de letra</h3>
        </div>
        <p className="text-xs mb-4 text-slate-500 dark:text-slate-400 midnight:text-cyan-600/70">
          Ajusta toda la interfaz sin modificar el logo.
        </p>

        <div className="flex items-center gap-3 mb-4">
          <button
            type="button"
            onClick={() => setFontScale((prev) => Math.max(85, prev - 5))}
            aria-label="Disminuir tamaño de letra"
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
            aria-label="Aumentar tamaño de letra"
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
          aria-label="Selector de escala de texto"
          onChange={(e) => setFontScale(Number(e.target.value))}
          className="w-full h-1 rounded-lg appearance-none cursor-pointer accent-cyan-500 mb-4 bg-slate-300 dark:bg-slate-600 midnight:bg-cyan-900"
        />

        <button
          type="button"
          onClick={() => setFontScale(100)}
          className="w-full text-xs flex items-center justify-center gap-2 transition-colors text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white midnight:text-cyan-600 midnight:hover:text-cyan-300 cursor-pointer"
        >
          ↻ Restablecer al 100%
        </button>
      </div>

      {/* Selector de Temas */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center pt-2 gap-3 border-t border-slate-200 dark:border-[#30363d] midnight:border-cyan-900/30">
        <span className="text-sm font-medium text-slate-700 dark:text-slate-300 midnight:text-cyan-200">
          Tema de Interfaz
        </span>
        <div className="grid grid-cols-3 w-full sm:w-80 gap-1 p-1 rounded-lg border transition-colors bg-slate-100 border-slate-300 dark:bg-[#0d1117] dark:border-[#30363d] midnight:bg-cyan-950 midnight:border-cyan-800/40">
          <button
            type="button"
            onClick={() => setTheme('light')}
            className={`flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium border transition-all cursor-pointer ${
              theme === 'light'
                ? 'bg-white text-slate-900 shadow-sm border-slate-200'
                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white midnight:text-cyan-600 midnight:hover:text-cyan-400 border-transparent'
            }`}
          >
            <Sun size={14} className="shrink-0" />
            <span>Claro</span>
          </button>
          <button
            type="button"
            onClick={() => setTheme('dark')}
            className={`flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium border transition-all cursor-pointer ${
              theme === 'dark'
                ? 'bg-cyan-500 text-white shadow-md border-cyan-400'
                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white midnight:text-cyan-600 midnight:hover:text-cyan-400 border-transparent'
            }`}
          >
            <Moon size={14} className="shrink-0" />
            <span>Oscuro</span>
          </button>
          <button
            type="button"
            onClick={() => setTheme('midnight')}
            className={`flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium border transition-all cursor-pointer ${
              theme === 'midnight'
                ? 'bg-cyan-600 text-white shadow-md border-cyan-500'
                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white midnight:text-cyan-600 midnight:hover:text-cyan-400 border-transparent'
            }`}
          >
            <MoonStar size={14} className="shrink-0" />
            <span>Medianoche</span>
          </button>
        </div>
      </div>
    </section>
  );
}
