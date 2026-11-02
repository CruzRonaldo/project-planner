import React from 'react';

/**
 * Componente unificado para estados vacíos o sin resultados.
 *
 * @param {Object} props
 * @param {React.ComponentType<{ size?: number, className?: string }>} [props.icon] - Icono de Lucide opcional
 * @param {string} [props.title] - Título o encabezado principal
 * @param {string} [props.description] - Descripción o texto secundario
 * @param {React.ReactNode} [props.action] - Botón o control de acción opcional
 * @param {boolean} [props.bordered=false] - Envolver en tarjeta punteada con borde dashed
 * @param {string} [props.className=''] - Clases adicionales de Tailwind
 */
export default function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  bordered = false,
  className = '',
}) {
  const containerClasses = bordered
    ? `rounded-xl border border-dashed border-slate-300 p-8 text-center transition-colors duration-300 dark:border-[#30363d] midnight:border-cyan-900/40 ${className}`
    : `py-8 text-center transition-colors duration-300 ${className}`;

  return (
    <div className={containerClasses} role="status">
      {Icon && (
        <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-400 transition-colors duration-300 dark:bg-slate-800 dark:text-slate-500 midnight:bg-cyan-950 midnight:text-cyan-600">
          <Icon size={20} aria-hidden="true" />
        </div>
      )}
      {title && (
        <h4 className={`${Icon ? 'mt-3' : ''} text-xs font-medium text-slate-800 transition-colors duration-300 dark:text-slate-200 midnight:text-cyan-100`}>
          {title}
        </h4>
      )}
      {description && (
        <p className={`${title ? 'mt-1' : ''} text-xs text-slate-500 transition-colors duration-300 dark:text-slate-400 midnight:text-cyan-500/70 max-w-sm mx-auto`}>
          {description}
        </p>
      )}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}
