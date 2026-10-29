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
  X,
  PanelLeftClose,
  Command,
} from 'lucide-react';
import logoEmpresa from '../../assets/logoempresa1.png';
import { usePlatform } from '../../hooks/usePlatform';

const mainItems = [
  { id: 'dashboard', label: 'Inicio', icon: LayoutDashboard, shortcut: 'Shift + 1', enabled: true },
  { id: 'planning', label: 'Planificación Estratégica', icon: TrendingUp, shortcut: 'Shift + 2', enabled: true },
  { id: 'portfolio', label: 'Portafolio', icon: Briefcase, shortcut: 'Shift + 3', enabled: true },
  { id: 'operations', label: 'Gestión Operativa', icon: Zap, shortcut: 'Shift + 4', enabled: true },
  { id: 'technical-team', label: 'Equipo Técnico', icon: Users, shortcut: 'Shift + 5', enabled: true },
  { id: 'human-resources', label: 'Recursos Humanos', icon: UserCog, shortcut: 'Shift + 6', enabled: true },
  { id: 'integrations', label: 'Integraciones', icon: Code, shortcut: 'Shift + 7', enabled: true },
];

const VIEW_SHORTCUTS = {
  dashboard: 'Shift + 1',
  planning: 'Shift + 2',
  portfolio: 'Shift + 3',
  operations: 'Shift + 4',
  'technical-team': 'Shift + 5',
  'human-resources': 'Shift + 6',
  integrations: 'Shift + 7',
  configuracion: 'Shift + 9',
};

export default function Sidebar({
  items = mainItems,
  activeView,
  onNavigate,
  isOpenMobile = false,
  onCloseMobile = () => {},
  isOpenDesktop = true,
  onToggleDesktop = () => {},
}) {
  const { isMobile, formatShortcut } = usePlatform();

  const handleNavigation = (viewId) => {
    onNavigate(viewId);
    if (onCloseMobile) onCloseMobile();
  };

  return (
    <>
      {/* OVERLAY PARA MÓVIL */}
      {isOpenMobile && (
        <div
          role="presentation"
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300 animate-in fade-in md:hidden"
        />
      )}

      {/* BARRA LATERAL*/}
      <aside
        id="main-sidebar"
        aria-label="Navegación principal"
        className={`fixed inset-y-0 left-0 z-50 flex flex-col justify-between transition-[width] duration-300 ease-in-out bg-[#0A1628] border-r border-slate-700/50 dark:bg-[#10141b] dark:border-[#30363d] midnight:bg-[#050B14] midnight:border-cyan-900/30 ${
          isOpenMobile
            ? 'w-[260px] translate-x-0 shadow-2xl'
            : '-translate-x-full md:translate-x-0'
        } ${
          isOpenDesktop ? 'md:w-[210px]' : 'md:w-[60px]'
        } md:relative md:z-30 md:shadow-none md:overflow-visible select-none`}
      >
        <div className="flex flex-col flex-1 py-3 md:overflow-visible">
          {/* HEADER: LOGO, MARCA Y BOTÓN DE COLAPSO */}
          <div
            className={`px-3 mb-3 flex items-center transition-all duration-300 ${
              isOpenDesktop
                ? 'justify-between'
                : 'justify-between md:justify-center md:px-1'
            }`}
          >
            {/* Contenedor del Logo*/}
            <div className="relative group flex items-center justify-center">
              <button
                type="button"
                onClick={!isOpenDesktop ? onToggleDesktop : undefined}
                aria-label={!isOpenDesktop ? 'Expandir barra lateral' : 'Project Planner'}
                title={!isOpenDesktop ? `Expandir barra lateral (${formatShortcut('Shift + 0')})` : 'Project Planner'}
                className={`flex items-center gap-2.5 text-left transition-colors ${
                  !isOpenDesktop ? 'cursor-pointer hover:opacity-85' : 'cursor-default'
                }`}
              >
                <img
                  src={logoEmpresa}
                  alt="Logo Project Planner"
                  className="w-7 h-7 object-contain shrink-0"
                />
                <span
                  className={`font-bold text-[13px] tracking-wide text-white dark:text-white midnight:text-cyan-50 whitespace-nowrap transition-all duration-200 ${
                    isOpenDesktop ? 'block' : 'block md:hidden'
                  }`}
                >
                  PROJECT PLANNER
                </span>
              </button>

              {/* Tooltip flotante sobre el logo al estar colapsado */}
              {!isOpenDesktop && !isMobile && (
                <div
                  role="tooltip"
                  className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-3.5 hidden md:flex items-center gap-2 whitespace-nowrap rounded-lg bg-slate-900/95 dark:bg-slate-900/95 midnight:bg-[#071326] px-2.5 py-1.5 text-xs font-medium text-slate-100 shadow-2xl border border-slate-700/80 dark:border-slate-800 midnight:border-cyan-800/60 z-50 opacity-0 group-hover:opacity-100 transition-opacity duration-150"
                >
                  <span>Expandir barra lateral</span>
                  <span className="text-[10px] font-mono text-cyan-300 dark:text-cyan-400">
                    ({formatShortcut('Shift + 0')})
                  </span>
                </div>
              )}
            </div>

            {/* Botón cerrar en móvil */}
            <button
              type="button"
              onClick={onCloseMobile}
              aria-label="Cerrar menú lateral"
              className="rounded-lg p-1 text-slate-400 hover:bg-white/10 hover:text-white transition-colors md:hidden cursor-pointer"
            >
              <X size={18} />
            </button>

            {/* Botón colapsar en escritorio */}
            {isOpenDesktop && (
              <div className="relative group flex items-center">
                <button
                  type="button"
                  onClick={onToggleDesktop}
                  aria-label="Colapsar barra lateral"
                  title={`Colapsar barra lateral (${formatShortcut('Shift + 0')})`}
                  className="hidden md:flex rounded-lg p-1 text-slate-400 hover:bg-white/10 hover:text-white transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
                >
                  <PanelLeftClose size={16} />
                </button>
                {!isMobile && (
                  <div
                    role="tooltip"
                    className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-3.5 hidden md:flex items-center gap-2 whitespace-nowrap rounded-lg bg-slate-900/95 dark:bg-slate-900/95 midnight:bg-[#071326] px-2.5 py-1.5 text-xs font-medium text-slate-100 shadow-2xl border border-slate-700/80 dark:border-slate-800 midnight:border-cyan-800/60 z-50 opacity-0 group-hover:opacity-100 transition-opacity duration-150"
                  >
                    <span>Colapsar barra lateral</span>
                    <span className="text-[10px] font-mono text-cyan-300 dark:text-cyan-400">
                      ({formatShortcut('Shift + 0')})
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* NAVEGACIÓN PRINCIPAL */}
          <nav className="flex flex-col gap-0.5 px-2 md:overflow-visible" aria-label="Secciones del sistema">
            {items.map((item, index) => {
              const Icon = item.icon;
              const isActive = activeView === item.id;
              const rawShortcut = VIEW_SHORTCUTS[item.id] || (index < 7 ? `Shift + ${index + 1}` : null);
              const formattedShortcut = !isMobile ? formatShortcut(rawShortcut) : null;

              return (
                <div key={item.id} className="relative group flex items-center">
                  <button
                    type="button"
                    disabled={item.enabled === false}
                    onClick={() => handleNavigation(item.id)}
                    aria-label={item.label}
                    title={formattedShortcut ? `${item.label} (${formattedShortcut})` : item.label}
                    aria-current={isActive ? 'page' : undefined}
                    className={`relative flex items-center rounded-xl transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${
                      isOpenDesktop
                        ? 'w-full gap-2.5 px-2.5 py-2 text-[13px] font-medium'
                        : 'w-full gap-2.5 px-2.5 py-2 text-[13px] font-medium md:w-9 md:h-9 md:justify-center md:mx-auto md:p-0'
                    } ${
                      isActive
                        ? 'bg-cyan-500/15 text-cyan-300 dark:text-cyan-300 font-semibold border border-cyan-500/30 shadow-sm'
                        : 'text-slate-400 hover:bg-white/5 hover:text-white dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-white midnight:text-cyan-100/60 midnight:hover:bg-cyan-900/30 midnight:hover:text-cyan-100 border border-transparent'
                    }`}
                  >
                    <Icon
                      size={17}
                      className={`shrink-0 transition-transform duration-200 ${
                        isActive ? 'text-cyan-400 scale-105' : 'group-hover:scale-105'
                      }`}
                    />
                    <span
                      className={`whitespace-nowrap transition-all duration-200 truncate ${
                        isOpenDesktop ? 'inline' : 'inline md:hidden'
                      }`}
                    >
                      {item.label}
                    </span>
                  </button>

                  {/* Tooltip flotante al pasar el cursor */}
                  {!isMobile && (
                    <div
                      role="tooltip"
                      className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-3.5 hidden md:flex items-center gap-2 whitespace-nowrap rounded-lg bg-slate-900/95 dark:bg-slate-900/95 midnight:bg-[#071326] px-2.5 py-1.5 text-xs font-medium text-slate-100 shadow-2xl border border-slate-700/80 dark:border-slate-800 midnight:border-cyan-800/60 z-50 opacity-0 group-hover:opacity-100 transition-opacity duration-150"
                    >
                      <span>{item.label}</span>
                      {formattedShortcut && (
                        <span className="text-[10px] font-mono text-cyan-300 dark:text-cyan-400">
                          ({formattedShortcut})
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </div>

        {/* SECCIÓN INFERIOR: CONFIGURACIÓN */}
        <div className="p-2 border-t transition-colors duration-300 border-slate-700/50 dark:border-[#30363d] midnight:border-cyan-900/30 flex flex-col gap-0.5 md:overflow-visible">

          {/* BOTÓN CONFIGURACIÓN */}
          <div className="relative group flex items-center">
            <button
              type="button"
              onClick={() => handleNavigation('configuracion')}
              aria-label="Configuración"
              title={`Configuración (${formatShortcut('Shift + 9')})`}
              aria-current={activeView === 'configuracion' ? 'page' : undefined}
              className={`flex items-center rounded-xl transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${
                isOpenDesktop
                  ? 'w-full gap-2.5 px-2.5 py-1.5 text-[13px] font-medium'
                  : 'w-full gap-2.5 px-2.5 py-1.5 text-[13px] font-medium md:w-9 md:h-9 md:justify-center md:mx-auto md:p-0'
              } ${
                activeView === 'configuracion'
                  ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-semibold shadow-sm'
                  : 'text-slate-400 hover:bg-white/5 hover:text-white border border-transparent'
              }`}
            >
              <Settings size={16} className="shrink-0 group-hover:rotate-45 transition-transform duration-300" />
              <span
                className={`whitespace-nowrap transition-all duration-200 truncate ${
                  isOpenDesktop ? 'inline' : 'inline md:hidden'
                }`}
              >
                Configuración
              </span>
            </button>
            {/* Tooltip flotante al pasar el cursor */}
            {!isMobile && (
              <div
                role="tooltip"
                className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-3.5 hidden md:flex items-center gap-2 whitespace-nowrap rounded-lg bg-slate-900/95 dark:bg-slate-900/95 midnight:bg-[#071326] px-2.5 py-1.5 text-xs font-medium text-slate-100 shadow-2xl border border-slate-700/80 dark:border-slate-800 midnight:border-cyan-800/60 z-50 opacity-0 group-hover:opacity-100 transition-opacity duration-150"
              >
                <span>Configuración</span>
                <span className="text-[10px] font-mono text-cyan-300 dark:text-cyan-400">
                  ({formatShortcut('Shift + 9')})
                </span>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}