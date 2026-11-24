import React from 'react';
import { Menu, Search, Sun, Moon, MoonStar } from 'lucide-react';
import ProfileControls from './ProfileControls';
import { usePlatform } from '../../hooks/usePlatform';
import { useLanguage } from '../../context/LanguageContext';

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
  theme,
  toggleTheme,
  onOpenProjectAudit,
}) {
  const searchInputRef = React.useRef(null);
  const { isMac, isMobile, formatShortcut } = usePlatform();
  const { t } = useLanguage();

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
    dashboard: t('topbar.searchDashboard', 'Buscar proyectos, hitos o equipos...'),
    planning: t('topbar.searchPlanning', 'Buscar en planificación maestra...'),
    portfolio: t('topbar.searchPortfolio', 'Buscar por nombre de proyecto, líder, etiquetas...'),
    operations: t('topbar.searchOperations', 'Buscar órdenes de trabajo, tareas o alertas...'),
    roles: t('topbar.searchRoles', 'Buscar usuarios, correos o roles...'),
    'human-resources': t('topbar.searchHumanResources', 'Buscar personal, disponibilidad o estados...'),
    integrations: t('topbar.searchIntegrations', 'Buscar integración, actividad o estado...'),
    'technical-team': t('topbar.searchTechnicalTeam', 'Buscar técnico, área, especialidad o proyecto...'),
    configuracion: t('topbar.searchConfiguration', 'Buscar en configuración...'),
    manual: t('topbar.searchManualPlaceholder', 'Buscar en el manual de usuario o atajos...'),
    auditoria: t('topbar.searchAuditoria', 'Buscar en auditoría de proyectos...'),
  };
  const defaultSearchPlaceholder = t('topbar.searchDefault', 'Buscar proyectos, hitos o equipos...');
  const placeholder = placeholders[activeView] || defaultSearchPlaceholder;

  return (
    <header className="flex items-center justify-between gap-3 px-3 py-2 sm:gap-4 sm:px-5 sm:py-2.5 transition-colors duration-300 bg-white border-b border-slate-200 dark:bg-[#0d1117] dark:border-[#30363d] midnight:bg-[#050B14] midnight:border-cyan-900/30">
      <div className="flex min-w-0 flex-1 items-center gap-2">
        {/* BOTÓN HAMBURGUESA EN MÓVIL (Únicamente en pantallas menores a 768px) */}
        <button
          type="button"
          onClick={onOpenMobileMenu}
          aria-label={t('topbar.menu', 'Menú')}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900 dark:border-[#30363d] dark:bg-[#161b22] dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white midnight:border-cyan-800/40 midnight:bg-[#0a1120] midnight:text-cyan-200 midnight:hover:bg-cyan-900/40 midnight:hover:text-cyan-50 transition-colors md:hidden cursor-pointer"
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
              title={t('topbar.searchShortcutTooltip', 'Atajo de búsqueda: {shortcut}', { shortcut: isMac ? '⌘K' : t('topbar.searchShortcut', 'Ctrl K') })}
              className="hidden sm:inline-flex items-center gap-1 rounded bg-slate-200/70 dark:bg-slate-800 midnight:bg-cyan-950/70 px-1.5 py-0.5 text-[10px] font-mono font-medium text-slate-500 dark:text-slate-400 midnight:text-cyan-400 border border-slate-300/80 dark:border-slate-700/60 midnight:border-cyan-800/40 select-none shrink-0"
            >
              {isMac ? '⌘K' : t('topbar.searchShortcut', 'Ctrl K')}
            </kbd>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={toggleTheme}
          title={t('topbar.themeToggleTooltip', 'Cambiar tema (Claro / Oscuro / Midnight)')}
          aria-label={t('topbar.themeToggle', 'Cambiar tema de la interfaz')}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900 dark:border-[#30363d] dark:bg-[#161b22] dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white midnight:border-cyan-800/40 midnight:bg-[#0a1120] midnight:text-cyan-200 midnight:hover:bg-cyan-900/40 midnight:hover:text-cyan-50 transition-colors cursor-pointer"
        >
          {theme === 'light' && <Sun size={17} className="text-amber-500" />}
          {theme === 'dark' && <Moon size={17} className="text-blue-400" />}
          {theme === 'midnight' && <MoonStar size={17} className="text-cyan-400" />}
          {!['light', 'dark', 'midnight'].includes(theme) && <Sun size={17} className="text-slate-500" />}
        </button>
        <ProfileControls
          currentUser={currentUser}
          users={users}
          onToggleSubAdmin={onToggleSubAdmin}
          onLogout={onLogout}
          onNavigate={onNavigate}
          onOpenProjectAudit={onOpenProjectAudit}
        />
      </div>
    </header>
  );
}
