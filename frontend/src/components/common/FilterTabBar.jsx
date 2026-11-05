import React from 'react';

/**
 * Barra de pestañas o filtros de píldora accesibles (role="tablist").
 *
 * @param {Object} props
 * @param {Array<{ id: string, label: string, count?: number }>} props.tabs - Lista de pestañas o filtros
 * @param {string} props.activeTab - Identificador de la pestaña actualmente activa
 * @param {(tabId: string) => void} props.onChange - Callback al seleccionar una pestaña
 * @param {'sm'|'md'} [props.size='md'] - Escala del botón (sm=text-[11px], md=text-xs)
 * @param {string} [props.className=''] - Clases adicionales para el contenedor
 * @param {string} [props.ariaLabel='Filtros de contenido'] - Etiqueta accesible para el tablist
 */
export default function FilterTabBar({
  tabs,
  activeTab,
  onChange,
  size = 'md',
  className = '',
  ariaLabel = 'Filtros de contenido',
}) {
  const sizeClasses =
    size === 'sm' ? 'px-2.5 py-1 text-[11px]' : 'px-3 py-1.5 text-xs';

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={`flex flex-wrap items-center gap-1.5 sm:gap-2 ${className}`}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;

        const buttonClasses = isActive
          ? 'border-cyan-500 bg-cyan-50 text-cyan-800 dark:border-cyan-400/50 dark:bg-cyan-500/10 dark:text-cyan-300 midnight:border-cyan-500/50 midnight:bg-cyan-900/20 midnight:text-cyan-200 font-semibold'
          : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-700 dark:border-[#30363d] dark:bg-transparent dark:text-slate-400 dark:hover:border-slate-600 dark:hover:text-slate-200 midnight:border-cyan-900/30 midnight:text-cyan-600 midnight:hover:border-cyan-700/40 midnight:hover:text-cyan-400';

        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            className={`inline-flex items-center gap-1.5 rounded-lg border font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 ${sizeClasses} ${buttonClasses}`}
          >
            <span>{tab.label}</span>
            {typeof tab.count === 'number' && (
              <span
                className={`rounded-full px-1.5 py-0.5 text-[10px] transition-colors ${
                  isActive
                    ? 'bg-cyan-200/60 text-cyan-900 dark:bg-cyan-500/25 dark:text-cyan-200 midnight:bg-cyan-800/40 midnight:text-cyan-200'
                    : 'bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-slate-400 midnight:bg-cyan-950 midnight:text-cyan-500'
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
