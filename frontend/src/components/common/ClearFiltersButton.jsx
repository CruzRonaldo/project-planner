import React from 'react';
import { RotateCcw } from 'lucide-react';

/**
 * Botón interactivo accesible para restablecer filtros aplicados.
 *
 * @param {Object} props
 * @param {() => void} props.onClick - Manejador de clic para limpiar los filtros
 * @param {string} [props.label='Limpiar filtros'] - Texto descriptivo del botón
 * @param {boolean} [props.showIcon=false] - Muestra un icono pequeño de reinicio
 * @param {boolean} [props.disabled=false] - Deshabilita visual y funcionalmente el botón cuando no hay filtros activos
 * @param {string} [props.className=''] - Clases adicionales de Tailwind
 */
export default function ClearFiltersButton({
  onClick,
  label = 'Limpiar filtros',
  showIcon = false,
  disabled = false,
  className = '',
}) {
  const stateClasses = disabled
    ? 'cursor-default text-slate-400 dark:text-slate-600 midnight:text-cyan-900/60 opacity-50 select-none'
    : 'cursor-pointer text-cyan-700 hover:text-cyan-600 hover:underline dark:text-cyan-400 dark:hover:text-cyan-300 midnight:text-cyan-400 midnight:hover:text-cyan-200';

  return (
    <button
      type="button"
      disabled={disabled}
      aria-disabled={disabled}
      onClick={disabled ? undefined : onClick}
      className={`inline-flex items-center gap-1 text-xs font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:underline ${stateClasses} ${className}`}
    >
      {showIcon && <RotateCcw size={12} aria-hidden="true" />}
      <span>{label}</span>
    </button>
  );
}
