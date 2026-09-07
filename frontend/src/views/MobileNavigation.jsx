import React from 'react';
import { Briefcase, LayoutDashboard, TrendingUp, UserCog, Users } from 'lucide-react';

const mobileItems = [
  { id: 'dashboard', label: 'Inicio', icon: LayoutDashboard },
  { id: 'planning', label: 'Planificación', icon: TrendingUp },
  { id: 'portfolio', label: 'Portafolio', icon: Briefcase },
  { id: 'technical-team', label: 'Equipo', icon: Users, enabled: false },
  { id: 'human-resources', label: 'RR. HH.', icon: UserCog },
];

export default function MobileNavigation({ activeView, onNavigate }) {
  return (
    <nav
      aria-label="Navegación móvil"
      className="fixed inset-x-0 bottom-0 z-50 grid grid-cols-5 border-t border-[#30363d] bg-[#10141b]/95 shadow-[0_-10px_30px_rgba(0,0,0,0.3)] backdrop-blur lg:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {mobileItems.map((item) => {
        const Icon = item.icon;
        const isActive = activeView === item.id;

        return (
          <button
            key={item.id}
            type="button"
            disabled={item.enabled === false}
            onClick={item.enabled === false ? undefined : () => onNavigate(item.id)}
            aria-current={isActive ? 'page' : undefined}
            className={`flex min-h-16 flex-col items-center justify-center gap-1 px-2 py-2 text-[10px] font-medium transition-colors ${
              isActive ? 'bg-cyan-400/10 text-cyan-400' : 'text-slate-400 hover:bg-white/5 hover:text-white'
            }`}
          >
            <Icon size={19} />
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
