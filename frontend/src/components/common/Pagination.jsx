import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * Componente atómico de paginación accesible y multitema (Claro, Oscuro y Midnight).
 *
 * @param {Object} props
 * @param {number} props.currentPage - Página actual activa (base 1)
 * @param {number} props.totalPages - Número total de páginas
 * @param {number} [props.totalItems] - Cantidad total de elementos (opcional)
 * @param {number} [props.pageSize] - Tamaño de elementos por página (opcional)
 * @param {string} [props.itemLabel='elementos'] - Etiqueta descriptiva en plural (ej. "hitos", "técnicos", "integrantes")
 * @param {Function} props.onPageChange - Callback invocado al cambiar de página: (nextPage: number) => void
 * @param {boolean} [props.hideOnSinglePage=false] - Si es true y totalPages <= 1, no renderiza controles
 * @param {string} [props.className=''] - Clases adicionales de contenedor
 * @param {string} [props.ariaLabel='Navegación de páginas'] - Etiqueta accesible para el contenedor nav
 */
export default function Pagination({
  currentPage = 1,
  totalPages = 1,
  totalItems,
  pageSize,
  itemLabel = 'elementos',
  onPageChange,
  hideOnSinglePage = false,
  className = '',
  ariaLabel = 'Navegación de páginas',
}) {
  const safeTotalPages = Math.max(1, totalPages);
  const safeCurrentPage = Math.min(Math.max(1, currentPage), safeTotalPages);

  if (hideOnSinglePage && safeTotalPages <= 1) {
    return null;
  }

  const hasItemDetails = typeof totalItems === 'number' && typeof pageSize === 'number' && totalItems > 0;
  const startItem = hasItemDetails ? (safeCurrentPage - 1) * pageSize + 1 : null;
  const endItem = hasItemDetails ? Math.min(safeCurrentPage * pageSize, totalItems) : null;

  const handlePrevious = () => {
    if (safeCurrentPage > 1 && onPageChange) {
      onPageChange(safeCurrentPage - 1);
    }
  };

  const handleNext = () => {
    if (safeCurrentPage < safeTotalPages && onPageChange) {
      onPageChange(safeCurrentPage + 1);
    }
  };

  const buttonBaseClass =
    'inline-flex items-center justify-center rounded p-1 transition-colors duration-200 outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 disabled:opacity-30 disabled:pointer-events-none disabled:cursor-not-allowed ' +
    'border border-slate-200 bg-white text-slate-500 hover:text-slate-900 ' +
    'dark:border-[#30363d] dark:bg-[#161b22] dark:text-slate-400 dark:hover:text-white ' +
    'midnight:border-cyan-900/30 midnight:bg-[#0a1120] midnight:text-cyan-600 midnight:hover:text-cyan-50';

  return (
    <nav
      role="navigation"
      aria-label={ariaLabel}
      className={`flex items-center justify-between gap-3 text-[10px] text-slate-500 transition-colors duration-300 dark:text-slate-400 midnight:text-cyan-600 no-print print:hidden ${className}`}
    >
      <div className="min-w-0 truncate">
        {hasItemDetails ? (
          <span>
            {startItem}–{endItem} de {totalItems} {itemLabel}
          </span>
        ) : typeof totalItems === 'number' ? (
          <span>
            {totalItems ? `1–${totalItems}` : '0'} de {totalItems} {itemLabel}
          </span>
        ) : (
          <span>
            Página {safeCurrentPage} de {safeTotalPages}
          </span>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          onClick={handlePrevious}
          disabled={safeCurrentPage <= 1}
          aria-label="Página anterior"
          title="Página anterior"
          className={buttonBaseClass}
        >
          <ChevronLeft size={14} />
        </button>

        <span
          aria-current="page"
          className="font-medium text-slate-700 dark:text-slate-300 midnight:text-cyan-200"
        >
          {safeCurrentPage} / {safeTotalPages}
        </span>

        <button
          type="button"
          onClick={handleNext}
          disabled={safeCurrentPage >= safeTotalPages}
          aria-label="Página siguiente"
          title="Página siguiente"
          className={buttonBaseClass}
        >
          <ChevronRight size={14} />
        </button>
      </div>
    </nav>
  );
}
