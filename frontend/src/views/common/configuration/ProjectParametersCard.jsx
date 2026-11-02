import React from 'react';

/**
 * Parámetros Globales del Proyecto (exclusivo para Administrador)
 */
export default function ProjectParametersCard() {
  return (
    <section
      aria-labelledby="project-parameters-title"
      className="border rounded-xl p-6 shadow-sm transition-colors duration-300 bg-white border-slate-200 dark:bg-[#161b22] dark:border-[#30363d] midnight:bg-[#0a1120] midnight:border-cyan-900/30"
    >
      <h2
        id="project-parameters-title"
        className="text-lg font-bold mb-4 text-slate-900 dark:text-white midnight:text-cyan-100"
      >
        Parámetros del Proyecto
      </h2>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs mb-1 text-slate-500 dark:text-slate-400 midnight:text-cyan-600">Moneda Base</p>
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-200 midnight:text-cyan-100">USD ($)</p>
        </div>
        <div>
          <p className="text-xs mb-1 text-slate-500 dark:text-slate-400 midnight:text-cyan-600">Año Fiscal</p>
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-200 midnight:text-cyan-100">2026 (Ene - Dic)</p>
        </div>
        <div>
          <p className="text-xs mb-1 text-slate-500 dark:text-slate-400 midnight:text-cyan-600">Margen de Tolerancia</p>
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-200 midnight:text-cyan-100">7 días calendario</p>
        </div>
        <div>
          <p className="text-xs mb-1 text-slate-500 dark:text-slate-400 midnight:text-cyan-600">Motor de Optimización</p>
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-200 midnight:text-cyan-100">Rendimiento M²/día</p>
        </div>
      </div>
    </section>
  );
}
