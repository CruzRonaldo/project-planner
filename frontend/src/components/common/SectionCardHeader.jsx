import React from 'react';

/**
 * Encabezado flex para tarjetas y secciones operativas.
 *
 * @param {Object} props
 * @param {React.ComponentType<{ size?: number, className?: string }>} [props.icon] - Icono de Lucide
 * @param {string} [props.iconContainerClass='bg-cyan-50 text-cyan-600 dark:bg-cyan-500/15 dark:text-cyan-400 midnight:bg-cyan-500/15 midnight:text-cyan-300'] - Clases para la caja del icono
 * @param {string} props.title - Título de la sección
 * @param {string} [props.subtitle] - Subtítulo o descripción breve
 * @param {'h2'|'h3'|'h4'} [props.titleAs='h2'] - Nivel de etiqueta semántica para el título
 * @param {React.ReactNode} [props.children] - Controles, badges o acciones alineadas a la derecha
 * @param {string} [props.className=''] - Clases adicionales de Tailwind
 */
export default function SectionCardHeader({
  icon: Icon,
  iconContainerClass = 'bg-cyan-50 text-cyan-600 dark:bg-cyan-500/15 dark:text-cyan-400 midnight:bg-cyan-500/15 midnight:text-cyan-300',
  title,
  subtitle,
  titleAs: TitleTag = 'h2',
  children,
  className = '',
}) {
  return (
    <div
      className={`flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between ${className}`}
    >
      <div className="flex items-center gap-2.5">
        {Icon && (
          <div
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors duration-300 ${iconContainerClass}`}
          >
            <Icon size={16} aria-hidden="true" />
          </div>
        )}
        <div>
          <TitleTag className="text-sm font-semibold text-slate-900 transition-colors duration-300 dark:text-white midnight:text-cyan-50">
            {title}
          </TitleTag>
          {subtitle && (
            <p className="text-[10px] text-slate-500 transition-colors duration-300 dark:text-slate-400 midnight:text-cyan-500/70">
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {children && (
        <div className="flex items-center gap-2 self-start sm:self-center">
          {children}
        </div>
      )}
    </div>
  );
}
