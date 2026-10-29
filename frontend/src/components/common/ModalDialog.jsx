import React, { useEffect } from 'react';
import { Loader2, X } from 'lucide-react';

/**
 * Componente modal base reutilizable para el sistema.
 * Implementa el patrón de composición (Wrapper / Compound component):
 * - Fondo desenfocado (backdrop-blur-sm) con cierre por clic exterior.
 * - Accesibilidad completa WAI-ARIA (role="dialog", aria-modal="true", Escape para cerrar).
 * - Cabecera corporativa estandarizada (icono temático, título, subtítulo y botón X).
 * - Soporte multitema ergonómico (Claro, Oscuro y Midnight).
 * - Pie de página responsive mobile-first: botones apilados en móvil y horizontales en escritorio.
 */
export default function ModalDialog({
  isOpen = true,
  onClose,
  onSubmit,
  title,
  subtitle,
  icon,
  children,
  submitLabel = 'Guardar cambios',
  submitIcon = null,
  cancelLabel = 'Cancelar',
  isSubmitting = false,
  submitDisabled = false,
  maxWidth = 'max-w-2xl',
  submitButtonClass = '',
  footnote = null,
  showFooter = true,
  id = 'modal-dialog',
}) {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && !isSubmitting && onClose) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (event) => {
    event.preventDefault();
    if (onSubmit && !isSubmitting && !submitDisabled) {
      onSubmit(event);
    }
  };

  const titleId = `${id}-title`;

  return (
    <div
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isSubmitting && onClose) {
          onClose();
        }
      }}
      className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-900/40 p-3 sm:p-5 backdrop-blur-sm transition-colors duration-300 dark:bg-black/70 midnight:bg-black/80 animate-in fade-in"
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onMouseDown={(event) => event.stopPropagation()}
        className={`w-full ${maxWidth} max-h-[92vh] flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_25px_90px_rgba(15,23,42,0.18)] transition-colors duration-300 dark:border-[#30363d] dark:bg-[#161b22] dark:shadow-[0_25px_90px_rgba(0,0,0,0.65)] midnight:border-cyan-900/30 midnight:bg-[#0a1120] animate-in zoom-in-95 duration-150`}
      >
        {/* Cabecera estándar del diálogo */}
        <header className="flex items-start justify-between gap-4 border-b border-slate-200 px-4 py-4 sm:px-6 transition-colors duration-300 dark:border-[#30363d] midnight:border-cyan-900/30 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            {icon && (
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-cyan-200 bg-cyan-50 text-cyan-700 transition-colors duration-300 dark:border-cyan-400/25 dark:bg-cyan-500/15 dark:text-cyan-400 midnight:border-cyan-800/40 midnight:bg-cyan-500/15 midnight:text-cyan-300">
                {icon}
              </span>
            )}
            <div className="min-w-0">
              <h2
                id={titleId}
                className="text-base sm:text-lg font-bold text-slate-900 truncate transition-colors duration-300 dark:text-white midnight:text-cyan-50"
              >
                {title}
              </h2>
              {subtitle && (
                <p className="mt-0.5 text-xs text-slate-500 transition-colors duration-300 dark:text-slate-400 midnight:text-cyan-500/70 truncate">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              aria-label="Cerrar ventana"
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors duration-200 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-white midnight:text-cyan-500/70 midnight:hover:bg-cyan-900/20 midnight:hover:text-cyan-50 shrink-0 disabled:opacity-50"
            >
              <X size={19} />
            </button>
          )}
        </header>

        {/* Formulario / Contenedor principal con scroll independiente */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden min-h-0">
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            {children}
          </div>

          {/* Pie de página responsive */}
          {showFooter && (
            <footer className="border-t border-slate-200 px-4 py-3.5 sm:px-6 transition-colors duration-300 dark:border-[#30363d] midnight:border-cyan-900/30 bg-white dark:bg-[#161b22] midnight:bg-[#0a1120] shrink-0">
              <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3">
                {footnote ? (
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 midnight:text-cyan-600/80">
                    {footnote}
                  </div>
                ) : (
                  <div />
                )}
                <div className="flex flex-col-reverse sm:flex-row gap-2.5 sm:justify-end">
                  {onClose && (
                    <button
                      type="button"
                      onClick={onClose}
                      disabled={isSubmitting}
                      className="w-full sm:w-auto rounded-lg border border-slate-300 px-4 py-2.5 text-xs font-medium text-slate-700 transition-colors duration-200 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-50 dark:border-[#30363d] dark:text-slate-300 dark:hover:bg-white/5 dark:hover:text-white midnight:border-cyan-800/40 midnight:text-cyan-200 midnight:hover:border-cyan-700/50 midnight:hover:bg-cyan-900/30 midnight:hover:text-cyan-50"
                    >
                      {cancelLabel}
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={isSubmitting || submitDisabled}
                    className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-xs font-semibold text-white transition-colors duration-200 disabled:cursor-wait disabled:opacity-60 ${
                      submitButtonClass ||
                      'bg-cyan-600 hover:bg-cyan-500 dark:bg-cyan-500 dark:text-slate-950 dark:hover:bg-cyan-400 midnight:bg-cyan-500 midnight:text-slate-950 midnight:hover:bg-cyan-400'
                    }`}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        <span>Guardando...</span>
                      </>
                    ) : (
                      <>
                        {submitIcon}
                        <span>{submitLabel}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </footer>
          )}
        </form>
      </section>
    </div>
  );
}
