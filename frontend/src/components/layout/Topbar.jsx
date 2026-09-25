import React from 'react';
import { Menu, Search } from 'lucide-react';
import ProfileControls from './ProfileControls';

export default function Topbar({
  activeView,
  currentUser,
  users,
  onToggleSubAdmin,
  onLogout,
  onNavigate,
  searchValue,
  onSearchChange,
  searchPlaceholder,
  onOpenMobileMenu,
}) {
  const placeholders = {
    dashboard: 'Buscar proyectos, hitos o equipos...',
    planning: 'Buscar en planificación maestra...',
    portfolio: 'Buscar por nombre de proyecto, líder, etiquetas...',
    operations: 'Buscar órdenes de trabajo, tareas o alertas...',
    roles: 'Buscar usuarios, correos o roles...',
    'human-resources': 'Buscar personal, disponibilidad o estados...',
    integrations: 'Buscar integración, actividad o estado...',
    'technical-team': 'Buscar técnico, área, especialidad o proyecto...',
    configuracion: 'Buscar en configuración...',
  };
  const placeholder = searchPlaceholder || placeholders[activeView] || placeholders.dashboard;

  return (
    <header className="flex items-center justify-between gap-3 px-3 py-3 sm:gap-6 sm:px-6 sm:py-4 transition-colors duration-300 bg-white border-b border-slate-200 dark:bg-[#0d1117] dark:border-[#30363d] midnight:bg-[#050B14] midnight:border-cyan-900/30">
      <div className="flex min-w-0 flex-1 items-center gap-2">
        {/* BOTÓN HAMBURGUESA EN MÓVIL */}
        <button
          type="button"
          onClick={onOpenMobileMenu}
          aria-label="Abrir menú"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900 dark:border-[#30363d] dark:bg-[#161b22] dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white midnight:border-cyan-800/40 midnight:bg-[#0a1120] midnight:text-cyan-200 midnight:hover:bg-cyan-900/40 transition-colors lg:hidden"
        >
          <Menu size={20} />
        </button>

        <div className="flex min-w-0 flex-1 items-center rounded-lg px-3 py-2.5 sm:max-w-md sm:px-4 transition-colors duration-300 bg-slate-100 border border-slate-200 dark:bg-[#161b22] dark:border-[#30363d] midnight:bg-[#0a1120] midnight:border-cyan-800/30">
          <Search size={18} className="shrink-0 transition-colors duration-300 text-slate-500 dark:text-gray-400 midnight:text-cyan-500/70" />
        <input
          key={activeView}
          type="text"
          placeholder={placeholder}
          aria-label={placeholder}
          value={searchValue}
          onChange={
            onSearchChange
              ? (event) => onSearchChange(event.target.value)
              : undefined
          }
          className="ml-3 min-w-0 w-full bg-transparent text-sm outline-none transition-colors duration-300 text-slate-900 placeholder-slate-400 dark:text-white dark:placeholder-gray-500 midnight:text-cyan-50 midnight:placeholder-cyan-600/50"
        />
        </div>
      </div>
      <ProfileControls
        currentUser={currentUser}
        users={users}
        onToggleSubAdmin={onToggleSubAdmin}
        onLogout={onLogout}
        onNavigate={onNavigate}
      />
    </header>
  );
}
