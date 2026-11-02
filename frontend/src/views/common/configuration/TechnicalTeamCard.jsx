import React from 'react';
import { Users, ArrowRight } from 'lucide-react';

/**
 * Acceso directo a Nómina y Gestión de Equipo Técnico (exclusivo para Administrador)
 */
export default function TechnicalTeamCard() {
  return (
    <section
      aria-labelledby="technical-team-card-title"
      className="border rounded-xl p-6 shadow-sm transition-colors duration-300 bg-white border-slate-200 dark:bg-[#161b22] dark:border-[#30363d] midnight:bg-[#0a1120] midnight:border-cyan-900/30"
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-600 dark:text-cyan-400 midnight:text-cyan-300 flex items-center justify-center">
          <Users size={20} />
        </div>
        <div>
          <h2
            id="technical-team-card-title"
            className="text-base font-bold text-slate-900 dark:text-white midnight:text-cyan-100"
          >
            Directorio y Equipo Técnico
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 midnight:text-cyan-500/80">
            Módulos 2.4 y 2.5 de Arquitectura
          </p>
        </div>
      </div>
      <p className="text-xs text-slate-600 dark:text-slate-300 midnight:text-cyan-100/70 mb-4 leading-relaxed">
        El alta de especialistas, asignación a proyectos, áreas técnicas (Arquitectura, Estructuras, Sistemas) y disponibilidad se gestionan centralizadamente en la nómina técnica.
      </p>
      <a
        href="/technical-team"
        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-colors shadow-sm cursor-pointer"
      >
        <span>Gestionar Nómina en Equipo Técnico</span>
        <ArrowRight size={14} />
      </a>
    </section>
  );
}
