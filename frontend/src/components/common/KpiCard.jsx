import React from 'react';
import { cardClass } from '../../constants/themeClasses';

/**
 * Componente unificado de tarjeta de métrica / KPI.
 * Basado en las medidas y proporciones compactas de RRHH (p-4 sm:p-5, mt-3, text-3xl).
 *
 * - Modo Estático (Dashboard / Operaciones): Contenedor informativo accesible (<article>)
 *   sin comportamiento de botón, sin cursores interactivos y sin aros de selección.
 * - Modo Interactivo (RRHH): Botón accesible (<button>) con gestión de filtro activo
 *   y aro de selección suave multitema.
 *
 * @param {Object} props
 * @param {string} props.title - Título o etiqueta descriptiva (ej. "PROYECTOS ACTIVOS", "Total personal")
 * @param {string|number} props.value - Valor métrico destacado (ej. 18, "$1.2M", "85%")
 * @param {React.ComponentType} [props.icon] - Icono vectorial Lucide opcional en caja redondeada
 * @param {string} [props.iconColor] - Clase de color o acento para el icono
 * @param {string} [props.dotClass] - Indicador circular de estado (punto de color)
 * @param {string} [props.badge] - Etiqueta secundaria / nota (ej. "0 en total", "En rango")
 * @param {string} [props.badgeClass] - Clases de estilo para el cuadro/pastilla que rodea al badge
 * @param {Function} [props.onClick] - Si se define, renderiza como <button> accesible
 * @param {boolean} [props.isSelected] - Estado seleccionado para filtros activos
 * @param {string} [props.selectedClass] - Clases personalizadas de selección
 * @param {string} [props.ariaLabel] - Etiqueta ARIA para accesibilidad
 * @param {string} [props.className] - Clases adicionales de Tailwind
 */
export default function KpiCard({
  title,
  value,
  icon: Icon,
  iconColor = 'text-cyan-600 dark:text-cyan-400 midnight:text-cyan-300',
  dotClass,
  badge,
  badgeClass = 'text-cyan-600 bg-cyan-500/10 dark:text-cyan-400 dark:bg-cyan-400/10 midnight:text-cyan-300 midnight:bg-cyan-900/40',
  onClick,
  isSelected = false,
  selectedClass,
  ariaLabel,
  className = '',
}) {
  const Component = onClick ? 'button' : 'article';

  const defaultSelectedStyle =
    'border-cyan-500 bg-cyan-50/50 ring-2 ring-cyan-500/30 dark:border-cyan-400 dark:bg-cyan-950/20 dark:ring-cyan-400/30 midnight:border-cyan-400 midnight:bg-cyan-950/30 midnight:ring-cyan-400/40';

  const containerClasses = onClick
    ? `relative rounded-xl border p-4 sm:p-5 text-left shadow-sm transition-all duration-300 cursor-pointer ${
        isSelected
          ? selectedClass || defaultSelectedStyle
          : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs dark:border-[#30363d] dark:bg-[#161b22] dark:hover:border-slate-600 midnight:border-cyan-900/30 midnight:bg-[#0a1120] midnight:hover:border-cyan-700/50'
      } ${className}`
    : `${cardClass} p-4 sm:p-5 transition-colors duration-300 ${className}`;

  return (
    <Component
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      aria-pressed={onClick ? isSelected : undefined}
      aria-label={ariaLabel || (typeof title === 'string' ? `${title}: ${value}` : undefined)}
      className={containerClasses}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 transition-colors duration-300 dark:text-slate-400 midnight:text-cyan-600">
          <span className={isSelected ? 'font-bold text-slate-900 dark:text-white midnight:text-cyan-100' : ''}>
            {title}
          </span>
        </span>

        {/* Icono en caja redondeada sutil */}
        {Icon && (
          <span className={`shrink-0 rounded-md border border-slate-200 bg-slate-100 p-1.5 transition-colors duration-300 dark:border-[#30363d] dark:bg-[#0d1117] midnight:border-cyan-800/40 midnight:bg-cyan-950 ${iconColor}`}>
            <Icon size={16} />
          </span>
        )}

        {/* Indicador de punto circular para tarjetas de estado */}
        {dotClass && (
          <i className={`h-2 w-2 shrink-0 rounded-full ${dotClass} ${isSelected ? 'ring-2 ring-offset-1 ring-current' : ''}`} />
        )}
      </div>

      <div className="mt-3 flex items-end justify-between gap-2">
        <strong
          className={`block text-3xl font-bold transition-colors duration-300 ${
            isSelected
              ? 'text-slate-950 dark:text-white midnight:text-cyan-50'
              : 'text-slate-900 dark:text-white midnight:text-cyan-50'
          }`}
        >
          {value}
        </strong>

        {/* Cuadro que rodea a la fuente abajo a la derecha */}
        {badge && (
          <span className={`shrink-0 rounded px-2 py-1 text-xs font-medium transition-colors duration-300 ${badgeClass}`}>
            {badge}
          </span>
        )}
      </div>
    </Component>
  );
}
