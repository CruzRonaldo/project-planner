import React from 'react';
import { Menu, Search } from 'lucide-react';
import ProfileControls from './ProfileControls';
import { usePlatform } from '../../hooks/usePlatform';

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
  const searchInputRef = React.useRef(null);
  const { isMac, isMobile } = usePlatform();

  React.useEffect(() => {
    const handleGlobalKeyDown = (event) => {
      // Atajo global Ctrl + K o Cmd + K para enfocar el buscador
      if ((event.ctrlKey || event.metaKey) && (event.key === 'k' || event.key === 'K')) {
        event.preventDefault();
        if (searchInputRef.current) {
          searchInputRef.current.focus();
          searchInputRef.current.select();
        }
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

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
    <header className="flex items-center justify-between gap-3 px-3 py-2 sm:gap-4 sm:px-5 sm:py-2.5 transition-colors duration-300 bg-white border-b border-slate-200 dark:bg-[#0d1117] dark:border-[#30363d] midnight:bg-[#050B14] midnight:border-cyan-900/30">
      <div className="flex min-w-0 flex-1 items-center gap-2">
        {/* BOTÓN HAMBURGUESA EN MÓVIL (Únicamente en pantallas menores a 768px) */}
        <button
          type="button"
          onClick={onOpenMobileMenu}
          aria-label="Abrir menú"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900 dark:border-[#30363d] dark:bg-[#161b22] dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white midnight:border-cyan-800/40 midnight:bg-[#0a1120] midnight:text-cyan-200 midnight:hover:bg-cyan-900/40 transition-colors md:hidden cursor-pointer"
        >
          <Menu size={18} />
        </button>

        <div className="flex min-w-0 flex-1 items-center rounded-lg px-3 py-2 sm:max-w-md sm:px-4 transition-colors duration-300 bg-slate-100 border border-slate-200 dark:bg-[#161b22] dark:border-[#30363d] midnight:bg-[#0a1120] midnight:border-cyan-800/30 focus-within:ring-2 focus-within:ring-cyan-500/40 focus-within:border-cyan-500">
          <Search size={18} className="shrink-0 transition-colors duration-300 text-slate-500 dark:text-gray-400 midnight:text-cyan-500/70" />
          <input
            ref={searchInputRef}
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
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                e.currentTarget.blur();
              }
            }}
            className="ml-3 min-w-0 w-full bg-transparent text-sm outline-none transition-colors duration-300 text-slate-900 placeholder-slate-400 dark:text-white dark:placeholder-gray-500 midnight:text-cyan-50 midnight:placeholder-cyan-600/50"
          />
          {!isMobile && (
            <kbd
              title={`Atajo de búsqueda: ${isMac ? '⌘K' : 'Ctrl + K'}`}
              className="hidden sm:inline-flex items-center gap-1 rounded bg-slate-200/70 dark:bg-slate-800 midnight:bg-cyan-950/70 px-1.5 py-0.5 text-[10px] font-mono font-medium text-slate-500 dark:text-slate-400 midnight:text-cyan-400 border border-slate-300/80 dark:border-slate-700/60 midnight:border-cyan-800/40 select-none shrink-0"
            >
              {isMac ? '⌘K' : 'Ctrl K'}
            </kbd>
          )}
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
