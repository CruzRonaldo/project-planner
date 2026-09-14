import React from 'react';
import { Briefcase, Code, LayoutDashboard, TrendingUp, UserCog, Users, Zap } from 'lucide-react';

const mobileItems = [
  { id: 'dashboard', label: 'Inicio', icon: LayoutDashboard },
  { id: 'planning', label: 'Planificación', icon: TrendingUp },
  { id: 'portfolio', label: 'Portafolio', icon: Briefcase },
  { id: 'operations', label: 'Operaciones', icon: Zap },
  { id: 'technical-team', label: 'Equipo', icon: Users },
  { id: 'human-resources', label: 'RR. HH.', icon: UserCog },
  { id: 'integrations', label: 'Integrar', icon: Code },
];

export default function MobileNavigation({ items = mobileItems, activeView, onNavigate }) {
  return (
    <nav
      aria-label="Navegación móvil"
      className="fixed inset-x-0 bottom-0 z-50 flex overflow-x-auto border-t border-slate-200 bg-white/95 shadow-[0_-10px_30px_rgba(15,23,42,0.08)] backdrop-blur transition-colors duration-300 dark:border-[#30363d] dark:bg-[#10141b]/95 dark:shadow-[0_-10px_30px_rgba(0,0,0,0.3)] midnight:border-cyan-900/30 midnight:bg-[#050B14]/95 lg:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = activeView === item.id;

        return (
          <button
            key={item.id}
            type="button"
            disabled={item.enabled === false}
            onClick={item.enabled === false ? undefined : () => onNavigate(item.id)}
            aria-current={isActive ? 'page' : undefined}
            className={`flex min-h-16 min-w-[72px] flex-1 flex-col items-center justify-center gap-1 px-2 py-2 text-[10px] font-medium transition-colors duration-300 ${
              isActive
                ? 'bg-cyan-600/10 text-cyan-800 dark:bg-cyan-400/10 dark:text-cyan-400 midnight:bg-cyan-500/20 midnight:text-cyan-300'
                : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-white midnight:text-cyan-500/70 midnight:hover:bg-cyan-900/20 midnight:hover:text-cyan-100'
            }`}
          >
            <Icon size={19} />
            <span>{item.mobileLabel || item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
