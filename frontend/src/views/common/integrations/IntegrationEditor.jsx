import React, { useState } from 'react';
import { Cloud, RotateCw, Save, X } from 'lucide-react';
import { integrationStatuses, syncFrequencies } from '../../../constants/integrations';
import { cardClass, inputClass, nestedClass } from './constants';
import IntegrationStatus from './IntegrationStatus';
import GoogleDriveFileManager from './GoogleDriveFileManager';

export default function IntegrationEditor({
  integration,
  onSave,
  onTest,
  onConnect,
  onCancel,
  testing = false,
}) {
  const isGoogleDrive = integration.id === 'drive';
  const [draft, setDraft] = useState({
    status: integration.status,
    endpoint: integration.endpoint,
    frequency: integration.frequency,
    errors: integration.errors,
  });
  const [error, setError] = useState('');

  const changeField = (field) => (event) => {
    setDraft((current) => ({
      ...current,
      [field]: event.target.value,
    }));
    setError('');
  };

  const submit = (event) => {
    event.preventDefault();
    if (isGoogleDrive) return;

    try {
      onSave(integration.id, draft);
    } catch (saveError) {
      setError(saveError.message);
    }
  };

  return (
    <form
      onSubmit={submit}
      className={`p-4 sm:p-5 ${cardClass} border-cyan-300 dark:border-cyan-400/30 midnight:border-cyan-500/30`}
      aria-labelledby="integration-editor-title"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2
            id="integration-editor-title"
            className="text-base font-semibold text-slate-900 transition-colors duration-300 dark:text-white midnight:text-cyan-50"
          >
            Configurar {integration.name}
          </h2>
          <p className="mt-1 text-xs text-slate-500 transition-colors duration-300 dark:text-slate-400 midnight:text-cyan-500/70">
            {isGoogleDrive
              ? 'Estado consultado directamente desde Google Drive mediante Django.'
              : 'Ajustes locales de demostración; no se envían credenciales.'}
          </p>
        </div>
        <button
          type="button"
          onClick={onCancel}
          aria-label="Cerrar configuración"
          className="rounded-lg p-2 text-slate-500 transition-colors duration-300 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-white midnight:text-cyan-500/70 midnight:hover:bg-cyan-900/20 midnight:hover:text-cyan-50"
        >
          <X size={18} />
        </button>
      </div>

      {isGoogleDrive ? (
        <>
          <div className={`mt-4 grid gap-3 p-4 sm:grid-cols-2 ${nestedClass}`}>
            <div>
              <p className="text-[10px] uppercase text-slate-500 dark:text-slate-400 midnight:text-cyan-600">
                Estado
              </p>
              <div className="mt-2">
                <IntegrationStatus status={integration.status} />
              </div>
            </div>
            <div>
              <p className="text-[10px] uppercase text-slate-500 dark:text-slate-400 midnight:text-cyan-600">
                Cuenta autorizada
              </p>
              <p className="mt-2 break-all text-xs font-medium text-slate-800 dark:text-slate-200 midnight:text-cyan-100">
                {integration.endpoint || 'Sin cuenta conectada'}
              </p>
            </div>
          </div>
          <GoogleDriveFileManager connected={integration.status === 'connected'} />
        </>
      ) : (
        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <label className="text-xs text-slate-500 transition-colors duration-300 dark:text-slate-400 midnight:text-cyan-500/70">
            Estado
            <select value={draft.status} onChange={changeField('status')} className={inputClass}>
              {integrationStatuses.map((statusItem) => (
                <option key={statusItem.id} value={statusItem.id}>
                  {statusItem.label}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs text-slate-500 transition-colors duration-300 dark:text-slate-400 midnight:text-cyan-500/70">
            Carpeta / endpoint
            <input
              autoFocus
              required
              maxLength={120}
              value={draft.endpoint}
              onChange={changeField('endpoint')}
              className={inputClass}
            />
          </label>
          <label className="text-xs text-slate-500 transition-colors duration-300 dark:text-slate-400 midnight:text-cyan-500/70">
            Frecuencia
            <select value={draft.frequency} onChange={changeField('frequency')} className={inputClass}>
              {syncFrequencies.map((frequency) => (
                <option key={frequency}>{frequency}</option>
              ))}
            </select>
          </label>
          <label className="text-xs text-slate-500 transition-colors duration-300 dark:text-slate-400 midnight:text-cyan-500/70">
            Errores recientes
            <input
              type="number"
              min="0"
              max="999"
              step="1"
              required
              value={draft.errors}
              onChange={changeField('errors')}
              className={inputClass}
            />
          </label>
        </div>
      )}

      {error && (
        <p role="alert" className="mt-3 text-xs text-red-600 dark:text-red-400 midnight:text-red-300">
          {error}
        </p>
      )}

      <div className="mt-4 flex flex-wrap justify-end gap-2">
        {isGoogleDrive && (
          <button
            type="button"
            onClick={onConnect}
            className="inline-flex items-center gap-2 rounded-lg bg-cyan-500 px-4 py-2 text-xs font-semibold text-white transition-colors duration-300 hover:bg-cyan-400 dark:bg-cyan-400 dark:text-slate-950 dark:hover:bg-cyan-300 midnight:bg-cyan-500 midnight:text-slate-950 midnight:hover:bg-cyan-400"
          >
            <Cloud size={14} />
            {integration.status === 'connected' ? 'Reautorizar Google Drive' : 'Conectar Google Drive'}
          </button>
        )}
        <button
          type="button"
          disabled={testing}
          onClick={() => onTest(integration.id, draft.endpoint)}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-xs text-slate-600 transition-colors duration-300 hover:border-cyan-400/50 hover:text-slate-900 disabled:cursor-wait disabled:opacity-60 dark:border-[#30363d] dark:text-slate-300 dark:hover:text-white midnight:border-cyan-800/40 midnight:text-cyan-200 midnight:hover:text-cyan-50"
        >
          <RotateCw size={14} className={testing ? 'animate-spin' : ''} />
          {testing ? 'Comprobando...' : 'Probar conexión'}
        </button>
        {!isGoogleDrive && (
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-lg bg-cyan-500 px-4 py-2 text-xs font-semibold text-white transition-colors duration-300 hover:bg-cyan-400 dark:bg-cyan-400 dark:text-slate-950 dark:hover:bg-cyan-300 midnight:bg-cyan-500 midnight:text-slate-950 midnight:hover:bg-cyan-400"
          >
            <Save size={14} /> Guardar
          </button>
        )}
      </div>
    </form>
  );
}
