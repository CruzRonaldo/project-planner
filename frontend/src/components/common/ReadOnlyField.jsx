import React from 'react';

/**
 * Campo informativo de solo lectura (label + valor estructurado).
 *
 * @param {Object} props
 * @param {string} props.label - Etiqueta descriptiva del campo
 * @param {React.ReactNode} props.value - Valor a mostrar (string, número, badge o componente)
 * @param {string} [props.className=''] - Clases adicionales para el contenedor
 * @param {string} [props.labelClassName=''] - Clases personalizadas para el label
 * @param {string} [props.valueClassName=''] - Clases personalizadas para el valor
 */
export default function ReadOnlyField({
  label,
  value,
  className = '',
  labelClassName = '',
  valueClassName = '',
}) {
  return (
    <div className={`transition-colors duration-300 ${className}`}>
      <p
        className={`text-xs text-slate-500 transition-colors duration-300 dark:text-slate-400 midnight:text-cyan-500/70 ${labelClassName}`}
      >
        {label}
      </p>
      <div
        className={`mt-0.5 text-sm font-medium text-slate-800 transition-colors duration-300 dark:text-slate-200 midnight:text-cyan-100 ${valueClassName}`}
      >
        {value ?? <span className="text-slate-400 italic">No especificado</span>}
      </div>
    </div>
  );
}
