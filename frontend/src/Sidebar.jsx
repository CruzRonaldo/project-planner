import React from 'react';
import { LayoutDashboard, TrendingUp, Briefcase, Zap, Users, UserCog, Code, Settings } from 'lucide-react';
import logoEmpresa from './assets/logoempresa1.png';

const mainItems = [
  { id: 'dashboard', label: 'Inicio', icon: LayoutDashboard, enabled: true },
  { id: 'planning', label: 'Planificación Estratégica', icon: TrendingUp, enabled: true },
  { id: 'portfolio', label: 'Portafolio', icon: Briefcase, enabled: true },
  { id: 'operations', label: 'Gestión Operativa', icon: Zap, enabled: true },
  { id: 'technical-team', label: 'Equipo Técnico', icon: Users, enabled: true },
  { id: 'human-resources', label: 'Recursos Humanos', icon: UserCog, enabled: true },
  { id: 'integrations', label: 'Integraciones', icon: Code, enabled: true },
];

export default function Sidebar({ activeView, onNavigate }) {
  const handleNavigation = (item) => {
    if (item.enabled) {
      onNavigate(item.id);
    }
  };

  return (
    <aside className="relative w-[250px] flex-col justify-between hidden lg:flex transition-colors duration-300 bg-[#0A1628] border-r border-slate-700/50 dark:bg-[#10141b] dark:border-[#30363d] midnight:bg-[#050B14] midnight:border-cyan-900/30">
      
      <div>
        {/* LOGO Y TÍTULO */}
        <div className="p-6 flex items-center gap-3 font-bold text-[15px] tracking-wide text-white dark:text-white midnight:text-cyan-50 transition-colors duration-300">
          <img
            src={logoEmpresa}
            alt="Logo Project Planner"
            className="w-8 h-8 object-contain"
          />
          PROJECT PLANNER
        </div>

        {/* NAVEGACIÓN PRINCIPAL */}
        <nav className="mt-2 flex flex-col">
          {mainItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;

            return (
              <button
                key={item.id}
                type="button"
                disabled={item.enabled === false}
                onClick={() => handleNavigation(item)}
                aria-current={isActive ? 'page' : undefined}
                className={`flex w-full items-center gap-4 border-l-[3px] px-6 py-3.5 text-left text-sm transition-colors duration-200 ${
                  isActive
                    ? 'border-cyan-400 bg-cyan-400/10 text-white dark:border-cyan-400 dark:bg-cyan-400/10 dark:text-white midnight:border-cyan-500 midnight:bg-cyan-500/20 midnight:text-cyan-300'
                    : 'border-transparent text-slate-400 hover:bg-white/5 hover:text-white dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-white midnight:text-cyan-100/50 midnight:hover:bg-cyan-900/20 midnight:hover:text-cyan-100'
                }`}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* BOTÓN DE CONFIGURACIÓN */}
      <div className="p-6 border-t transition-colors duration-300 border-slate-700/50 dark:border-[#30363d] midnight:border-cyan-900/30">
        <button
          type="button"
          onClick={() => onNavigate('configuracion')}
          className={`flex w-full items-center gap-4 text-sm transition-colors duration-200 ${
            activeView === 'configuracion'
              ? 'text-cyan-400 dark:text-cyan-400 midnight:text-cyan-400'
              : 'text-slate-400 hover:text-white dark:text-slate-400 dark:hover:text-white midnight:text-cyan-100/50 midnight:hover:text-cyan-100'
          }`}
        >
          <Settings size={18} /> Configuración
        </button>
      </div>
      
    </aside>
  );
}
