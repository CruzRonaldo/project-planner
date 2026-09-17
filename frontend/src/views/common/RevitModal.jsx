import React, { useState } from 'react';
import { Box, Eye, RotateCw, Trash2, X } from 'lucide-react';

// ─── Clases de diseño compartidas con Integrations.jsx ───────────────────────
const cardClass =
  'rounded-xl border border-slate-200 bg-white shadow-sm transition-colors duration-300 ' +
  'dark:border-[#30363d] dark:bg-[#161b22] dark:shadow-[0_14px_32px_rgba(0,0,0,0.12)] ' +
  'midnight:border-cyan-900/30 midnight:bg-[#0a1120] midnight:shadow-none';

const nestedClass =
  'rounded-lg border border-slate-200 bg-slate-50 transition-colors duration-300 ' +
  'dark:border-blue-400/25 dark:bg-[#0d1117] ' +
  'midnight:border-cyan-800/40 midnight:bg-[#050B14]';

// ─── Columnas de la tabla ─────────────────────────────────────────────────────
const TABLE_COLUMNS = [
  { key: 'name',    label: 'Nombre del Modelo',     align: 'left'  },
  { key: 'size',    label: 'Tamaño',                align: 'left'  },
  { key: 'synced',  label: 'Última Sincronización', align: 'left'  },
  { key: 'actions', label: 'Acciones',              align: 'right' },
];

// ─── Datos mock — se mostrarán tras simular la sincronización ─────────────────
const TODAY = new Date().toLocaleString('es-MX', {
  day: '2-digit', month: 'short', year: 'numeric',
  hour: '2-digit', minute: '2-digit',
});

const MOCK_MODELS = [
  { id: 1, name: 'Estructura_Edificio_Principal.rvt', size: '248 MB', synced: TODAY },
  { id: 2, name: 'Instalaciones_Electricas_v2.rvt',  size: '134 MB', synced: TODAY },
  { id: 3, name: 'Topografia_Terreno.rvt',           size:  '87 MB', synced: TODAY },
];

// ─── Sub-componente: Badge de estado ─────────────────────────────────────────
function StatusBadge({ synced }) {
  if (synced) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded border border-emerald-300 bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-700 transition-colors duration-300 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-400 midnight:border-emerald-600/30 midnight:bg-emerald-500/10 midnight:text-emerald-300">
        <i className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
        Sincronizado
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded border border-amber-300 bg-amber-50 px-2 py-1 text-[10px] font-semibold text-amber-700 transition-colors duration-300 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-400 midnight:border-amber-600/30 midnight:bg-amber-500/10 midnight:text-amber-300">
      <i className="h-1.5 w-1.5 rounded-full bg-amber-500" />
      Pendiente de configuración
    </span>
  );
}

// ─── Sub-componente: Fila de la tabla ─────────────────────────────────────────
function ModelRow({ model, onDelete }) {
  return (
    <tr className="text-slate-700 transition-colors duration-150 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-white/[0.03] midnight:text-cyan-100 midnight:hover:bg-cyan-950/40">
      {/* Nombre del modelo */}
      <td className="px-3 py-3">
        <div className="flex items-center gap-2">
          <Box size={14} className="shrink-0 text-orange-500 dark:text-orange-400 midnight:text-orange-300" />
          <span className="max-w-[280px] truncate font-medium">{model.name}</span>
        </div>
      </td>

      {/* Tamaño */}
      <td className="px-3 py-3 text-slate-500 dark:text-slate-400 midnight:text-cyan-600">
        {model.size}
      </td>

      {/* Última sincronización */}
      <td className="px-3 py-3 text-slate-500 dark:text-slate-400 midnight:text-cyan-600">
        {model.synced}
      </td>

      {/* Acciones */}
      <td className="px-3 py-3">
        <div className="flex items-center justify-end gap-1">
          {/* Ver modelo */}
          <button
            type="button"
            title="Ver modelo"
            aria-label={`Ver modelo ${model.name}`}
            className="rounded-md p-2 text-slate-500 transition-colors duration-150 hover:bg-slate-100 hover:text-cyan-600 dark:hover:bg-white/5 dark:hover:text-cyan-300 midnight:text-cyan-600 midnight:hover:bg-cyan-900/30 midnight:hover:text-cyan-200"
          >
            <Eye size={14} />
          </button>

          {/* Eliminar */}
          <button
            type="button"
            title="Eliminar modelo"
            aria-label={`Eliminar modelo ${model.name}`}
            onClick={() => onDelete(model)}
            className="rounded-md p-2 text-slate-500 transition-colors duration-150 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10 dark:hover:text-red-400 midnight:text-cyan-600 midnight:hover:bg-red-500/10 midnight:hover:text-red-300"
          >
            <Trash2 size={14} />
          </button>

        </div>
      </td>
    </tr>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────
/**
 * RevitModal
 *
 * Modal interactivo (con mock) para la integración Revit / BIM Data.
 * Simula una petición al backend con un setTimeout de 2.5 s y
 * muestra modelos de prueba al completarse.
 *
 * Props:
 *   onClose  () => void   — Cierra el modal desde Integrations.jsx.
 */
export default function RevitModal({ onClose }) {
  // ── Estado ──────────────────────────────────────────────────────────────────
  const [isSyncing, setIsSyncing]    = useState(false);
  const [hasSynced, setHasSynced]    = useState(false);
  const [models, setModels]          = useState([]);
  // null = diálogo cerrado | objeto modelo = diálogo abierto para ese modelo
  const [modelToDelete, setModelToDelete] = useState(null);


  // ── Cierre con Escape ────────────────────────────────────────────────────────
  React.useEffect(() => {
    const handleKey = (event) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  // ── Simulación de sincronización (mock de API) ───────────────────────────────
  const handleSync = () => {
    if (isSyncing) return;

    setIsSyncing(true);

    // Simula una llamada al backend de 2.5 segundos.
    // TODO: reemplazar este setTimeout por la llamada real a revitApi.sync()
    setTimeout(() => {
      setModels(MOCK_MODELS);
      setHasSynced(true);
      setIsSyncing(false);
    }, 2500);
  };

  // ── Eliminar: abrir diálogo, confirmar y cancelar ───────────────────────────
  /** Clic en la papelera → guarda el modelo y abre el diálogo custom */
  const handleDelete = (model) => setModelToDelete(model);

  /** Clic en "Eliminar" dentro del diálogo → elimina y cierra */
  const confirmDelete = () => {
    setModels((current) => current.filter((m) => m.id !== modelToDelete.id));
    setModelToDelete(null);
  };

  /** Clic en "Cancelar" o fuera del diálogo → solo cierra, sin eliminar */
  const cancelDelete = () => setModelToDelete(null);



  // ── Render ───────────────────────────────────────────────────────────────────
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
            {/* Ícono Revit — naranja para diferenciarlo de Drive (cyan) y Make (zap) */}
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
                {isSyncing
                  ? 'Conectando con Autodesk Revit…'
                  : hasSynced
                    ? `${models.length} modelo${models.length !== 1 ? 's' : ''} disponible${models.length !== 1 ? 's' : ''}`
                    : 'Sincronización de modelos BIM desde Autodesk Revit'}
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
              {/* Badge dinámico: cambia según hasSynced */}
              <StatusBadge synced={hasSynced} />
            </div>

            {/* ── Botón de acción principal ── */}
            <button
              type="button"
              disabled={isSyncing}
              onClick={handleSync}
              className="inline-flex items-center gap-2 rounded-lg bg-orange-500 px-5 py-2.5 text-xs font-semibold text-white shadow-sm transition-colors duration-300 hover:bg-orange-400 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-orange-500 dark:hover:bg-orange-400 midnight:bg-orange-600 midnight:hover:bg-orange-500"
            >
              <RotateCw size={14} className={isSyncing ? 'animate-spin' : ''} />
              {isSyncing ? 'Sincronizando…' : 'Sincronizar con Autodesk Revit'}
            </button>
          </div>

          {/* ── Tabla de modelos BIM ── */}
          <div className="mt-5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900 transition-colors duration-300 dark:text-white midnight:text-cyan-50">
                Modelos BIM sincronizados
              </h3>
              {hasSynced && models.length > 0 && (
                <span className="text-[10px] text-slate-400 dark:text-slate-500 midnight:text-cyan-700">
                  {models.length} modelo{models.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>

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

                {/* Cuerpo — tres estados posibles */}
                <tbody className="divide-y divide-slate-200 transition-colors duration-300 dark:divide-[#30363d] midnight:divide-cyan-900/30">

                  {/* Estado A: cargando */}
                  {isSyncing && (
                    <tr>
                      <td colSpan={TABLE_COLUMNS.length} className="px-3 py-10 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <RotateCw
                            size={28}
                            className="animate-spin text-orange-500 dark:text-orange-400 midnight:text-orange-300"
                          />
                          <p className="text-sm text-slate-500 dark:text-slate-400 midnight:text-cyan-500/70">
                            Conectando con Autodesk Revit…
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}

                  {/* Estado B: vacío (antes de sincronizar o tras eliminar todos) */}
                  {!isSyncing && models.length === 0 && (
                    <tr>
                      <td colSpan={TABLE_COLUMNS.length} className="px-3 py-12 text-center">
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
                  )}

                  {/* Estado C: datos mock disponibles */}
                  {!isSyncing && models.map((model) => (
                    <ModelRow
                      key={model.id}
                      model={model}
                      onDelete={handleDelete}
                    />
                  ))}

                </tbody>
              </table>
            </div>
          </div>

        </div>
        {/* ── fin cuerpo ── */}

        {/* ════════ FOOTER ════════ */}
        <footer className="flex shrink-0 items-center justify-between gap-3 border-t border-slate-200 px-5 py-3 transition-colors duration-300 dark:border-[#30363d] midnight:border-cyan-900/30">
          <p className="text-[10px] text-slate-400 transition-colors duration-300 dark:text-slate-500 midnight:text-cyan-700">
            {hasSynced
              ? 'Datos de demostración · La lógica real de Revit se conectará en la siguiente iteración.'
              : 'Integración Revit — La lógica de backend se conectará en la siguiente iteración.'}
          </p>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-300 px-4 py-2 text-xs text-slate-600 transition-colors duration-300 hover:bg-slate-50 dark:border-[#30363d] dark:text-slate-300 dark:hover:bg-white/5 midnight:border-cyan-800/40 midnight:text-cyan-200 midnight:hover:bg-cyan-900/20"
          >
            Cerrar
          </button>
        </footer>

        {/* ════════ DIÁLOGO DE CONFIRMACIÓN CUSTOM ════════
            Se monta encima del modal cuando modelToDelete tiene valor.
            z-[100] para que quede sobre el overlay del RevitModal (z-[90]). */}
        {modelToDelete && (
          <div
            role="presentation"
            onMouseDown={cancelDelete}
            className="absolute inset-0 z-[100] flex items-center justify-center rounded-2xl bg-slate-900/60 p-4 backdrop-blur-sm dark:bg-[#020617]/80 midnight:bg-[#020617]/85"
          >
            <div
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="delete-confirm-title"
              aria-describedby="delete-confirm-desc"
              onMouseDown={(e) => e.stopPropagation()}
              className={`w-full max-w-sm overflow-hidden rounded-xl shadow-[0_20px_60px_rgba(0,0,0,0.35)] ${cardClass}`}
            >
              {/* Franja roja superior — señal de acción destructiva */}
              <div className="h-1 w-full bg-red-500 dark:bg-red-600" />

              {/* Cuerpo del diálogo */}
              <div className="px-5 py-5">
                {/* Ícono de advertencia */}
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full border border-red-200 bg-red-50 text-red-600 transition-colors duration-300 dark:border-red-500/25 dark:bg-red-500/10 dark:text-red-400 midnight:border-red-700/30 midnight:bg-red-500/10 midnight:text-red-300">
                  <Trash2 size={18} />
                </div>

                <h3
                  id="delete-confirm-title"
                  className="text-sm font-bold text-slate-900 transition-colors duration-300 dark:text-white midnight:text-cyan-50"
                >
                  ¿Eliminar modelo?
                </h3>

                <p
                  id="delete-confirm-desc"
                  className="mt-2 text-xs leading-relaxed text-slate-500 transition-colors duration-300 dark:text-slate-400 midnight:text-cyan-500/70"
                >
                  Vas a eliminar{' '}
                  <strong className="font-semibold text-slate-700 dark:text-slate-200 midnight:text-cyan-100">
                    {modelToDelete.name}
                  </strong>{' '}
                  del listado. Esta acción no puede deshacerse en el mock; cuando el backend esté conectado será permanente.
                </p>

                {/* Botones */}
                <div className="mt-5 flex justify-end gap-2">
                  {/* Cancelar — neutro/gris */}
                  <button
                    type="button"
                    onClick={cancelDelete}
                    className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-medium text-slate-700 transition-colors duration-200 hover:bg-slate-100 dark:border-[#30363d] dark:text-slate-300 dark:hover:bg-white/5 midnight:border-cyan-800/40 midnight:text-cyan-200 midnight:hover:bg-cyan-900/20"
                  >
                    Cancelar
                  </button>

                  {/* Eliminar — rojo destructivo */}
                  <button
                    type="button"
                    onClick={confirmDelete}
                    className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-xs font-semibold text-white transition-colors duration-200 hover:bg-red-500 active:scale-95 dark:bg-red-600 dark:hover:bg-red-500 midnight:bg-red-700 midnight:hover:bg-red-600"
                  >
                    <Trash2 size={13} />
                    Eliminar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      </section>
    </div>
  );
}
