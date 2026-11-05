import React from 'react';
import { RotateCcw } from 'lucide-react';

/**
 * Botón interactivo accesible para restablecer filtros aplicados.
 *
 * @param {Object} props
 * @param {() => void} props.onClick - Manejador de clic para limpiar los filtros
 * @param {string} [props.label='Limpiar filtros'] - Texto descriptivo del botón
 * @param {boolean} [props.showIcon=false] - Muestra un icono pequeño de reinicio
 * @param {string} [props.className=''] - Clases adicionales de Tailwind
 */
export default function ClearFiltersButton({
  onClick,
  label = 'Limpiar filtros',
  showIcon = false,
  className = '',
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1 text-xs font-medium text-cyan-700 transition-colors duration-200 hover:text-cyan-600 focus-visible:outline-none focus-visible:underline dark:text-cyan-400 dark:hover:text-cyan-300 midnight:text-cyan-400 midnight:hover:text-cyan-200 ${className}`}
    >
      {showIcon && <RotateCcw size={12} aria-hidden="true" />}
      <span>{label}</span>
    </button>
  );
}
