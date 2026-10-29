import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { ArrowDown, ArrowUp } from 'lucide-react';

/**
 * Componente atómico de ordenamiento desplegable con dirección integrada (A–Z ↔ Z–A / Mayor ↔ Menor).
 *
 * Características:
 * - Menú flotante accesible con role="listbox" y role="option".
 * - Alternancia direccional en el mismo espacio al pulsar la opción ya activa.
 * - Soporte multitema (Claro, Oscuro y Midnight).
 * - Cierre con clic exterior y tecla Escape.
 * - Navegación accesible por teclado (Flechas Arriba/Abajo, Enter y Espacio).
 *
 * @param {Object} props
 * @param {string} props.value - ID de la opción de ordenamiento activa actual
 * @param {Function} props.onChange - Callback invocado al seleccionar o alternar dirección: (nextSortId) => void
 * @param {Array<Object>} props.categories - Categorías de ordenamiento configuradas
 * @param {Object} [props.optionsMap] - Diccionario de mapeo { [id]: { id, label, category, direction } }
 * @param {string} [props.label='Ordenar por:'] - Etiqueta descriptiva previa
 * @param {string} [props.className=''] - Clases adicionales para el contenedor exterior
 * @param {string} [props.ariaLabel='Opciones de ordenamiento']
 */
export default function SortDropdown({
  value,
  onChange,
  categories = [],
  optionsMap: customOptionsMap,
  label = 'Ordenar por:',
  className = '',
  ariaLabel = 'Ordenar registros',
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef(null);
  const triggerRef = useRef(null);
  const listboxId = useId();

  // Mapeo automático de IDs a categoría y dirección si no se provee customOptionsMap
  const optionsMap = useMemo(() => {
    if (customOptionsMap) return customOptionsMap;
    const map = {};
    for (const cat of categories) {
      if (cat.descId) {
        map[cat.descId] = {
          id: cat.descId,
          label: cat.descLabel || cat.defaultLabel,
          category: cat.id,
          direction: 'desc',
        };
      }
      if (cat.ascId) {
        map[cat.ascId] = {
          id: cat.ascId,
          label: cat.ascLabel || cat.defaultLabel,
          category: cat.id,
          direction: 'asc',
        };
      }
    }
    return map;
  }, [categories, customOptionsMap]);

  const defaultCategory = categories[0];
  const currentSort =
    optionsMap[value] ||
    (defaultCategory
      ? optionsMap[defaultCategory.defaultId || defaultCategory.descId || defaultCategory.ascId]
      : { id: value, label: value, category: '', direction: 'desc' });

  const currentDirectionText = currentSort.direction === 'asc' ? 'ascendente' : 'descendente';
  const triggerAriaLabel = `${ariaLabel}. Criterio actual: ${currentSort.label}, orden ${currentDirectionText}`;

  // Selección o alternancia direccional en el mismo espacio
  const handleSelectCategory = (cat) => {
    if (!cat) return;
    if (currentSort.category === cat.id) {
      const nextId = currentSort.direction === 'desc' ? cat.ascId : cat.descId;
      onChange(nextId);
    } else {
      onChange(cat.defaultId || cat.descId || cat.ascId);
    }
    setIsOpen(false);
    triggerRef.current?.focus();
  };

  // Cierre al hacer clic exterior
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Navegación por teclado (A11y)
  const handleKeyDown = (event) => {
    if (event.key === 'Escape') {
      if (isOpen) {
        event.preventDefault();
        setIsOpen(false);
        triggerRef.current?.focus();
      }
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
        setHighlightedIndex(0);
      } else {
        setHighlightedIndex((prev) => (prev + 1) % categories.length);
      }
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
        setHighlightedIndex(categories.length - 1);
      } else {
        setHighlightedIndex((prev) => (prev - 1 + categories.length) % categories.length);
      }
      return;
    }

    if ((event.key === 'Enter' || event.key === ' ') && isOpen) {
      event.preventDefault();
      if (highlightedIndex >= 0 && highlightedIndex < categories.length) {
        handleSelectCategory(categories[highlightedIndex]);
      }
    }
  };

  return (
    <div className={`relative ${className}`} ref={containerRef} onKeyDown={handleKeyDown}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => {
          setIsOpen((prev) => {
            const next = !prev;
            if (next) {
              const activeIdx = categories.findIndex((c) => c.id === currentSort.category);
              setHighlightedIndex(activeIdx >= 0 ? activeIdx : 0);
            }
            return next;
          });
        }}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        aria-label={triggerAriaLabel}
        className="cursor-pointer flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 shadow-sm transition-colors duration-300 hover:border-cyan-400 dark:border-[#30363d] dark:bg-[#161b22] dark:text-slate-200 dark:hover:border-cyan-400 midnight:border-cyan-800/40 midnight:bg-[#0a1120] midnight:text-cyan-100 midnight:hover:border-cyan-600"
      >
        {label && <span className="text-[10px] text-slate-400 midnight:text-cyan-600">{label}</span>}
        <span className="flex items-center gap-1.5 font-semibold text-slate-900 dark:text-white midnight:text-cyan-50">
          {currentSort.label}
          {currentSort.direction === 'asc' ? (
            <ArrowUp size={13} className="text-blue-600 dark:text-cyan-400 midnight:text-cyan-400" />
          ) : (
            <ArrowDown size={13} className="text-blue-600 dark:text-cyan-400 midnight:text-cyan-400" />
          )}
        </span>
      </button>

      {isOpen && (
        <div
          id={listboxId}
          role="listbox"
          aria-label={ariaLabel}
          className="absolute right-0 top-full z-30 mt-1.5 min-w-[220px] rounded-lg border border-slate-200 bg-white p-1.5 shadow-2xl transition-colors duration-300 dark:border-[#30363d] dark:bg-[#0d1117] midnight:border-cyan-900/40 midnight:bg-[#050B14]"
        >
          <div className="px-2.5 py-1 text-[9px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 midnight:text-cyan-600">
            Criterio de orden
          </div>
          {categories.map((cat, index) => {
            const isActive = currentSort.category === cat.id;
            const isHighlighted = highlightedIndex === index;
            const itemLabel = isActive
              ? currentSort.label
              : cat.id === 'name'
                ? cat.ascLabel
                : cat.descLabel || cat.defaultLabel;
            const isAsc = isActive && currentSort.direction === 'asc';
            const optionAriaLabel = isActive
              ? `${itemLabel}, orden ${isAsc ? 'ascendente' : 'descendente'}. Presione para alternar dirección.`
              : `${itemLabel}.`;

            return (
              <button
                key={cat.id}
                type="button"
                role="option"
                aria-selected={isActive}
                aria-label={optionAriaLabel}
                onClick={() => handleSelectCategory(cat)}
                onMouseEnter={() => setHighlightedIndex(index)}
                className={`cursor-pointer flex w-full items-center justify-between gap-3 rounded-md px-2.5 py-2 text-left text-xs transition-colors duration-200 ${
                  isActive
                    ? 'bg-blue-50 font-semibold text-blue-700 dark:bg-cyan-500/10 dark:text-cyan-300 midnight:bg-cyan-900/30 midnight:text-cyan-200'
                    : isHighlighted
                      ? 'bg-slate-100 text-slate-900 dark:bg-white/10 dark:text-white midnight:bg-cyan-900/40 midnight:text-cyan-100'
                      : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-white/5 dark:hover:text-white midnight:text-cyan-100 midnight:hover:bg-cyan-900/20'
                }`}
              >
                <span>{itemLabel}</span>
                <span className="flex items-center gap-1.5">
                  {isActive ? (
                    isAsc ? (
                      <ArrowUp size={13} className="text-blue-600 dark:text-cyan-400 midnight:text-cyan-400" />
                    ) : (
                      <ArrowDown size={13} className="text-blue-600 dark:text-cyan-400 midnight:text-cyan-400" />
                    )
                  ) : (
                    <span className="text-[11px] text-slate-300 dark:text-slate-600 midnight:text-cyan-900">⇅</span>
                  )}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
