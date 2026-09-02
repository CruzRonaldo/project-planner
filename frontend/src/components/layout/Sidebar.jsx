import React from 'react';

import {
  LayoutDashboard,
  TrendingUp,
  Briefcase,
  Zap,
  Users,
  UserCog,
  Code,
  Settings,
  Layers,
} from 'lucide-react';

const mainItems = [
  {
    id: 'dashboard',
    label: 'Inicio',
    icon: LayoutDashboard,
    enabled: true,
  },
  {
    id: 'planning',
    label: 'Planificación Estratégica',
    icon: TrendingUp,
    enabled: true,
  },
  {
    id: 'portfolio',
    label: 'Portafolio',
    icon: Briefcase,
    enabled: true,
  },
  {
    id: 'operations',
    label: 'Gestión Operativa',
    icon: Zap,
    enabled: true,
  },
  {
    id: 'technical-team',
    label: 'Equipo Técnico',
    icon: Users,
    enabled: true,
  },
  {
    id: 'human-resources',
    label: 'Recursos Humanos',
    icon: UserCog,
    enabled: false,
  },
  {
    id: 'integrations',
    label: 'Integraciones',
    icon: Code,
    enabled: false,
  },
];

export default function Sidebar({
  activeView,
  onNavigate,
}) {
  const handleNavigation = (item) => {
    if (item.enabled) {
      onNavigate(item.id);
    }
  };

  return (
    <aside className="hidden w-[260px] flex-col justify-between border-r border-[#30363d] bg-[#10141b] lg:flex">
      <div>
        {/* Logo */}
        <div className="flex items-center gap-3 p-6 text-[15px] font-bold tracking-wide">
          <Layers
            className="text-cyan-400"
            size={22}
          />

          <span>PROJECT PLANNER</span>
        </div>

        {/* Opciones del menú */}
        <nav className="mt-2 flex flex-col">
          {mainItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavigation(item)}
                disabled={!item.enabled}
                aria-current={isActive ? 'page' : undefined}
                className={`flex w-full items-center gap-4 border-l-[3px] px-6 py-3.5 text-left text-sm transition-colors ${
                  isActive
                    ? 'border-cyan-400 bg-cyan-400/10 text-white'
                    : item.enabled
                      ? 'border-transparent text-gray-400 hover:bg-white/5 hover:text-white'
                      : 'cursor-not-allowed border-transparent text-gray-600'
                }`}
              >
                <Icon size={18} />

                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Configuración */}
      <div className="p-6">
        <a
          href="#"
          className="flex items-center gap-4 text-sm text-gray-400 transition-colors hover:text-white"
        >
          <Settings size={18} />

          <span>Configuración</span>
        </a>
      </div>
    </aside>
  );
}