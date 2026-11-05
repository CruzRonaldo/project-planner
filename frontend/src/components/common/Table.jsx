import React from 'react';

/**
 * Encabezado de tabla con estilos unificados y accesibilidad.
 *
 * @param {Object} props
 * @param {Array<string | { label: string, align?: 'left'|'center'|'right', className?: string }>} props.columns - Lista de columnas
 * @param {string} [props.className=''] - Clases adicionales para thead
 * @param {React.ReactNode} [props.children] - Contenido th personalizado si no se pasa columns
 */
export function TableHead({ columns, className = '', children }) {
  return (
    <thead className={className}>
      <tr className="border-b border-slate-200 text-[10px] text-slate-500 transition-colors duration-300 dark:border-[#30363d] midnight:border-cyan-900/30 midnight:text-cyan-600">
        {columns
          ? columns.map((col, index) => {
              const label = typeof col === 'string' ? col : col.label;
              const align = typeof col === 'object' && col.align ? col.align : 'left';
              const customClass = typeof col === 'object' && col.className ? col.className : '';
              const alignClass =
                align === 'center' ? 'text-center' : align === 'right' ? 'text-right' : 'text-left';

              return (
                <th
                  key={index}
                  scope="col"
                  className={`pb-2.5 font-semibold uppercase tracking-wide ${alignClass} ${customClass}`}
                >
                  {label}
                </th>
              );
            })
          : children}
      </tr>
    </thead>
  );
}

/**
 * Fila de tabla con estilos consistentes de hover y bordes multitema.
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - Celdas td de la fila
 * @param {Function} [props.onClick] - Manejador opcional para filas interactivas
 * @param {string} [props.className=''] - Clases adicionales de Tailwind
 */
export function TableRow({ children, onClick, className = '' }) {
  const isClickable = typeof onClick === 'function';
  const interactiveClasses = isClickable ? 'cursor-pointer' : '';

  return (
    <tr
      onClick={onClick}
      className={`border-b border-slate-200 last:border-0 transition-colors hover:bg-slate-50 dark:border-[#30363d] dark:hover:bg-white/[0.02] midnight:border-cyan-900/30 midnight:hover:bg-cyan-900/20 ${interactiveClasses} ${className}`}
    >
      {children}
    </tr>
  );
}

/**
 * Contenedor de tabla con scroll horizontal adaptable.
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - thead, tbody, etc.
 * @param {string} [props.className=''] - Clases adicionales para el elemento <table>
 * @param {string} [props.wrapperClassName=''] - Clases adicionales para el contenedor con scroll
 */
export default function Table({ children, className = '', wrapperClassName = '' }) {
  return (
    <div className={`overflow-x-auto ${wrapperClassName}`}>
      <table className={`w-full text-left text-xs ${className}`}>
        {children}
      </table>
    </div>
  );
}
