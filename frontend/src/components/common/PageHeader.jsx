import React from 'react';

/**
 * Encabezado principal unificado para páginas y vistas.
 *
 * @param {Object} props
 * @param {string} props.title - Título principal de la vista (h1)
 * @param {string} [props.subtitle] - Subtítulo o descripción explicativa
 * @param {React.ReactNode} [props.children] - Botones o acciones alineadas a la derecha
 * @param {string} [props.className=''] - Clases adicionales para el contenedor
 */
export default function PageHeader({
  title,
  subtitle,
  children,
  className = '',
}) {
  return (
    <div
      className={`flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between ${className}`}
    >
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 transition-colors duration-300 dark:text-white midnight:text-cyan-50 md:text-[28px]">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1 text-sm text-slate-500 transition-colors duration-300 dark:text-slate-400 midnight:text-cyan-500/70">
            {subtitle}
          </p>
        )}
      </div>
      {children && (
        <div className="flex flex-wrap items-center gap-2.5 sm:self-center">
          {children}
        </div>
      )}
    </div>
  );
}
