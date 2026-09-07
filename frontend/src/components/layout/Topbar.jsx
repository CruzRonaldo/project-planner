import React from 'react';
import { Search, Bell, LogOut } from 'lucide-react';

export default function Topbar({ activeView, user, onLogout }) {
  const placeholders = {
    dashboard: 'Buscar proyectos, hitos o equipos...',
    planning: 'Buscar en planificación maestra...',
    portfolio: 'Buscar por nombre de proyecto, líder, etiquetas...',
  };
  const placeholder = placeholders[activeView] ?? placeholders.dashboard;

  const displayName = user?.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : (user?.username || 'Usuario');
  const roleDisplay = user?.role_display || (user?.is_superuser ? 'Project Manager (Admin)' : 'Equipo Técnico');

  return (
    <header className="flex items-center justify-between gap-3 border-b border-[#30363d] bg-[#0d1117] px-3 py-3 sm:gap-6 sm:px-6 sm:py-4">
      <div className="flex min-w-0 flex-1 items-center rounded-lg border border-[#30363d] bg-[#161b22] px-3 py-2.5 sm:max-w-md sm:px-4">
        <Search size={18} className="shrink-0 text-gray-400" />
        <input type="text" placeholder={placeholder} className="ml-3 min-w-0 w-full bg-transparent text-sm text-white placeholder-gray-500 outline-none" />
      </div>
      <div className="flex shrink-0 items-center gap-3 sm:gap-6">
        <button className="text-gray-400 hover:text-white relative" title="Notificaciones">
          <Bell size={20} />
          <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 overflow-hidden rounded-full bg-cyan-950 border border-cyan-500/40 flex items-center justify-center font-bold text-cyan-400 text-xs sm:h-9 sm:w-9">
            {displayName.substring(0, 2).toUpperCase()}
          </div>
          <div className="hidden sm:flex flex-col">
            <span className="text-sm font-semibold text-white">{displayName}</span>
            <span className="text-xs text-cyan-400 font-medium">{roleDisplay}</span>
          </div>
        </div>
        {onLogout && (
          <button
            onClick={onLogout}
            title="Cerrar sesión"
            className="p-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all cursor-pointer"
          >
            <LogOut size={18} />
          </button>
        )}
      </div>
    </header>
  );
}
