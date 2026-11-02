import React from 'react';

/**
 * Componente unificado para badges de estado, prioridad y workflow.
 *
 * @param {Object} props
 * @param {string} props.status - Identificador o código del estado (ej. 'active', 'pending')
 * @param {string} [props.label] - Texto a mostrar (si se omite, se busca en statusMap o items)
 * @param {Record<string, { label?: string, shortLabel?: string, className?: string }>} [props.statusMap] - Mapa de configuración por clave
 * @param {Array<{ id: string, label?: string, shortLabel?: string, className?: string }>} [props.items] - Catálogo en formato array
 * @param {'xs'|'sm'} [props.size='sm'] - Modificador de escala tipográfica (xs=9px, sm=10px)
 * @param {string} [props.className=''] - Clases adicionales de Tailwind
 */
export default function StatusBadge({
  status,
  label: explicitLabel,
  statusMap,
  items,
  size = 'sm',
  className = '',
}) {
  let matchedConfig = null;

  if (items && Array.isArray(items)) {
    matchedConfig = items.find((item) => item.id === status);
  } else if (statusMap && typeof statusMap === 'object') {
    matchedConfig = statusMap[status];
  }

  const fallbackClass =
    'border-slate-200 bg-slate-50 text-slate-600 dark:border-[#30363d] dark:bg-white/5 dark:text-slate-400 midnight:border-cyan-900/30 midnight:bg-cyan-900/20 midnight:text-cyan-600';

  const badgeClass = matchedConfig?.className || fallbackClass;
  const displayLabel =
    explicitLabel ||
    matchedConfig?.shortLabel ||
    matchedConfig?.label ||
    status ||
    'Sin estado';

  const sizeClass = size === 'xs' ? 'text-[9px] px-1.5 py-0.5' : 'text-[10px] px-2 py-1';

  return (
    <span
      className={`inline-flex whitespace-nowrap rounded border font-semibold transition-colors duration-300 ${sizeClass} ${badgeClass} ${className}`}
    >
      {displayLabel}
    </span>
  );
}
