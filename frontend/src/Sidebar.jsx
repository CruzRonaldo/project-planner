import React from 'react';
import { LayoutDashboard, TrendingUp, Briefcase, Zap, Users, UserCog, Code, Settings, Layers } from 'lucide-react';

const mainItems = [
  { id: 'dashboard', label: 'Inicio', icon: LayoutDashboard, enabled: true },
  { id: 'planning', label: 'Planificación Estratégica', icon: TrendingUp, enabled: true },
  { id: 'portfolio', label: 'Portafolio', icon: Briefcase, enabled: true },
  { id: 'operations', label: 'Gestión Operativa', icon: Zap },
  { id: 'technical-team', label: 'Equipo Técnico', icon: Users },
  { id: 'human-resources', label: 'Recursos Humanos', icon: UserCog },
  { id: 'integrations', label: 'Integraciones', icon: Code },
];

export default function Sidebar({ activeView, onNavigate }) {
  const handleNavigation = (item) => {
    if (item.enabled) onNavigate(item.id);
  };

  return (
    <aside className="w-[260px] bg-[#10141b] border-r border-[#30363d] flex-col justify-between hidden lg:flex">
      <div>
        <div className="p-6 flex items-center gap-3 font-bold text-[15px] tracking-wide">
          <Layers className="text-cyan-400" size={22} /> PROJECT PLANNER
        </div>
        <nav className="mt-2 flex flex-col">
          {mainItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavigation(item)}
                aria-current={isActive ? 'page' : undefined}
                className={`flex w-full items-center gap-4 border-l-[3px] px-6 py-3.5 text-left text-sm transition-colors ${
                  isActive
                    ? 'border-cyan-400 bg-cyan-400/10 text-white'
                    : 'border-transparent text-gray-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
      <div className="p-6">
        <a href="#" className="flex items-center gap-4 text-sm text-gray-400 hover:text-white"><Settings size={18} /> Configuración</a>
      </div>
    </aside>
  );
}
