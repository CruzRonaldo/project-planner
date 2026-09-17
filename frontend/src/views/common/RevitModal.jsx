import React from 'react';
import { Box, RotateCw, X } from 'lucide-react';

// ─── Clases de diseño compartidas con Integrations.jsx ───────────────────────
const cardClass =
  'rounded-xl border border-slate-200 bg-white shadow-sm transition-colors duration-300 ' +
  'dark:border-[#30363d] dark:bg-[#161b22] dark:shadow-[0_14px_32px_rgba(0,0,0,0.12)] ' +
  'midnight:border-cyan-900/30 midnight:bg-[#0a1120] midnight:shadow-none';

const nestedClass =
  'rounded-lg border border-slate-200 bg-slate-50 transition-colors duration-300 ' +
  'dark:border-blue-400/25 dark:bg-[#0d1117] ' +
  'midnight:border-cyan-800/40 midnight:bg-[#050B14]';

// ─── Columnas de la tabla de modelos ─────────────────────────────────────────
const TABLE_COLUMNS = [
  { key: 'name',     label: 'Nombre del Modelo',      align: 'left'  },
  { key: 'size',     label: 'Tamaño',                 align: 'left'  },
  { key: 'synced',   label: 'Última Sincronización',  align: 'left'  },
  { key: 'actions',  label: 'Acciones',               align: 'right' },
];

// ─── Componente principal ─────────────────────────────────────────────────────
/**
 * RevitModal
 *
 * Esqueleto visual de la integración Revit / BIM Data.
 * Por ahora no tiene lógica de backend; solo muestra la UI.
 *
 * Props:
 *   onClose  () => void   — Cierra el modal desde el padre (Integrations.jsx).
 */
export default function RevitModal({ onClose }) {
  // Cierra el modal al pulsar Escape
  React.useEffect(() => {
    const handleKey = (event) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  return (
    /* ── Overlay oscuro con blur ── */
    <div
      role="presentation"
      onMouseDown={onClose}
      className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-900/40 p-3 backdrop-blur-sm transition-colors duration-300 dark:bg-[#020617]/85 midnight:bg-[#020617]/90 sm:p-5"
    >
      {/* ── Contenedor del modal ── */}
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="revit-modal-title"
        onMouseDown={(e) => e.stopPropagation()}
        className={`flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-slate-200 shadow-[0_25px_90px_rgba(15,23,42,0.18)] transition-colors duration-300 dark:border-[#30363d] dark:shadow-[0_25px_90px_rgba(0,0,0,0.72)] midnight:border-cyan-900/30 ${cardClass}`}
      >

        {/* ════════ HEADER ════════ */}
        <header className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-200 px-5 py-4 transition-colors duration-300 dark:border-[#30363d] midnight:border-cyan-900/30">
          <div className="flex items-center gap-3">
            {/* Ícono Revit — naranja/amber para diferenciarlo de Drive (cyan) y Make (zap) */}
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-orange-200 bg-orange-50 text-orange-600 transition-colors duration-300 dark:border-orange-500/25 dark:bg-orange-500/15 dark:text-orange-400 midnight:border-orange-700/40 midnight:bg-orange-500/15 midnight:text-orange-300">
              <Box size={20} />
            </span>
            <div>
              <h2
                id="revit-modal-title"
                className="text-base font-bold text-slate-900 transition-colors duration-300 dark:text-white midnight:text-cyan-50"
              >
                Configurar Revit / BIM Data
              </h2>
              <p className="mt-0.5 text-xs text-slate-500 transition-colors duration-300 dark:text-slate-400 midnight:text-cyan-500/70">
                Sincronización de modelos BIM desde Autodesk Revit · Solo UI por ahora
              </p>
            </div>
          </div>

          {/* Botón cerrar */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar configuración de Revit"
            className="rounded-lg p-2 text-slate-500 transition-colors duration-300 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-white midnight:text-cyan-500/70 midnight:hover:bg-cyan-900/20 midnight:hover:text-cyan-50"
          >
            <X size={18} />
          </button>
        </header>

        {/* ════════ CUERPO (scrollable) ════════ */}
        <div className="flex-1 overflow-y-auto px-5 py-5">

          {/* ── Fila de estado + botón principal ── */}
          <div className={`flex flex-wrap items-center justify-between gap-4 rounded-lg p-4 ${nestedClass}`}>
            <div className="space-y-1">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 transition-colors duration-300 dark:text-slate-400 midnight:text-cyan-600">
                Estado de la integración
              </p>
              {/* Badge de estado — Pendiente hasta conectar el backend */}
              <span className="inline-flex items-center gap-1.5 rounded border border-amber-300 bg-amber-50 px-2 py-1 text-[10px] font-semibold text-amber-700 transition-colors duration-300 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-400 midnight:border-amber-600/30 midnight:bg-amber-500/10 midnight:text-amber-300">
                <i className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                Pendiente de configuración
              </span>
            </div>

            {/* ── Botón de acción principal ── */}
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-lg bg-orange-500 px-5 py-2.5 text-xs font-semibold text-white shadow-sm transition-colors duration-300 hover:bg-orange-400 active:scale-95 dark:bg-orange-500 dark:hover:bg-orange-400 midnight:bg-orange-600 midnight:hover:bg-orange-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RotateCw size={14} />
              Sincronizar con Autodesk Revit
            </button>
          </div>

          {/* ── Tabla de modelos BIM ── */}
          <div className="mt-5">
            <h3 className="mb-3 text-sm font-semibold text-slate-900 transition-colors duration-300 dark:text-white midnight:text-cyan-50">
              Modelos BIM sincronizados
            </h3>

            <div className="overflow-x-auto rounded-lg border border-slate-200 transition-colors duration-300 dark:border-[#30363d] midnight:border-cyan-900/40">
              <table className="w-full min-w-[580px] text-left text-xs">

                {/* Cabecera */}
                <thead className="bg-slate-100 text-[10px] uppercase text-slate-500 transition-colors duration-300 dark:bg-white/5 dark:text-slate-400 midnight:bg-cyan-950/30 midnight:text-cyan-600">
                  <tr>
                    {TABLE_COLUMNS.map((col) => (
                      <th
                        key={col.key}
                        className={`px-3 py-2.5 font-medium ${col.align === 'right' ? 'text-right' : ''}`}
                      >
                        {col.label}
                      </th>
                    ))}
                  </tr>
                </thead>

                {/* Cuerpo vacío — estado inicial */}
                <tbody className="divide-y divide-slate-200 transition-colors duration-300 dark:divide-[#30363d] midnight:divide-cyan-900/30">
                  <tr>
                    <td
                      colSpan={TABLE_COLUMNS.length}
                      className="px-3 py-12 text-center"
                    >
                      {/* Ilustración vacía */}
                      <div className="flex flex-col items-center gap-3">
                        <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-400 transition-colors duration-300 dark:bg-white/5 dark:text-slate-500 midnight:bg-cyan-950/30 midnight:text-cyan-700">
                          <Box size={24} />
                        </span>
                        <p className="text-sm font-medium text-slate-500 transition-colors duration-300 dark:text-slate-400 midnight:text-cyan-500/70">
                          No hay modelos sincronizados aún
                        </p>
                        <p className="max-w-xs text-[11px] text-slate-400 transition-colors duration-300 dark:text-slate-500 midnight:text-cyan-700">
                          Presiona &ldquo;Sincronizar con Autodesk Revit&rdquo; para importar tus modelos BIM.
                        </p>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

        </div>
        {/* ── fin cuerpo ── */}

        {/* ════════ FOOTER ════════ */}
        <footer className="flex shrink-0 items-center justify-between gap-3 border-t border-slate-200 px-5 py-3 transition-colors duration-300 dark:border-[#30363d] midnight:border-cyan-900/30">
          <p className="text-[10px] text-slate-400 transition-colors duration-300 dark:text-slate-500 midnight:text-cyan-700">
            Integración Revit — Esqueleto UI · La lógica de backend se conectará en la siguiente iteración.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-300 px-4 py-2 text-xs text-slate-600 transition-colors duration-300 hover:bg-slate-50 dark:border-[#30363d] dark:text-slate-300 dark:hover:bg-white/5 midnight:border-cyan-800/40 midnight:text-cyan-200 midnight:hover:bg-cyan-900/20"
          >
            Cerrar
          </button>
        </footer>

      </section>
    </div>
  );
}

