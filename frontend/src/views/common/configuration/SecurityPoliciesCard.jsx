import React from 'react';
import { cardClass } from '../../../constants/themeClasses';

/**
 * Tarjeta de Seguridad y Asignación Operativa (para usuarios no-administradores)
 */
export default function SecurityPoliciesCard({ currentUser }) {
  return (
    <section
      aria-labelledby="security-policies-title"
      className={`${cardClass} p-6`}
    >
      <h2
        id="security-policies-title"
        className="text-lg font-bold mb-4 text-slate-900 dark:text-white midnight:text-cyan-100"
      >
        Seguridad y Políticas
      </h2>
      <div className="space-y-4">
        <div className="flex justify-between items-center text-sm">
          <span className="text-slate-600 dark:text-slate-400 midnight:text-cyan-100/70">Nivel de Acceso</span>
          <span className="font-semibold text-slate-900 dark:text-slate-200 midnight:text-cyan-100">
            {currentUser?.roleLabel || 'Equipo Técnico'}
          </span>
        </div>
        <div className="flex justify-between items-center text-sm">
          <span className="text-slate-600 dark:text-slate-400 midnight:text-cyan-100/70">Autenticación</span>
          <span className="text-xs font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 midnight:bg-cyan-900/30 midnight:text-cyan-300">
            Token JWT Seguro
          </span>
        </div>
        <div className="flex justify-between items-center text-sm">
          <span className="text-slate-600 dark:text-slate-400 midnight:text-cyan-100/70">Asignación Operativa</span>
          <span className="text-xs font-medium text-cyan-600 dark:text-cyan-400 midnight:text-cyan-300">
            {currentUser?.area || currentUser?.technicalArea || 'Especialista Técnico'}
          </span>
        </div>
        <div className="pt-3 border-t border-slate-200 dark:border-[#30363d] midnight:border-cyan-900/30 flex items-center justify-between text-xs">
          <span className="text-slate-500 dark:text-slate-400 midnight:text-cyan-600">Sesión actual</span>
          <span className="text-emerald-600 dark:text-emerald-400 midnight:text-emerald-300 font-medium">
            Activa en este dispositivo
          </span>
        </div>
      </div>
    </section>
  );
}
