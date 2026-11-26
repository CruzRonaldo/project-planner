import React, { useEffect, useRef, useState } from 'react';
import { Database, RefreshCw, Download, RotateCcw } from 'lucide-react';
import api from '../../services/api';
import ModalDialog from './ModalDialog';
import Button from './Button';
import { useLanguage } from '../../context/LanguageContext';
import { useToast } from '../../context/ToastContext';

/**
 * Sub-modal de confirmación segura para la restauración destructiva de PostgreSQL.
 * Se presenta de forma aislada para evitar desplazamientos de diseño en el modal principal.
 */
function ConfirmRestoreDialog({
  isOpen,
  backup,
  database,
  onConfirm,
  onClose,
  isRestoring,
}) {
  const { t } = useLanguage();
  const [confirmation, setConfirmation] = useState('');
  const [acknowledged, setAcknowledged] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setConfirmation('');
      setAcknowledged(false);
    }
  }, [isOpen]);

  if (!isOpen || !backup) return null;

  const isConfirmed = acknowledged && confirmation.trim() === database?.trim();

  return (
    <ModalDialog
      isOpen={isOpen}
      onClose={onClose}
      title={t('backup.confirmRestoreTitle', 'Confirmar Restauración')}
      subtitle={backup.filename}
      icon={<RotateCcw size={22} className="text-cyan-600 dark:text-cyan-400 midnight:text-cyan-300" />}
      maxWidth="max-w-full sm:max-w-xl md:max-w-2xl"
      showFooter={false}
      id="confirm-restore-dialog"
    >
      <div className="space-y-5 p-4 sm:p-6 md:p-8 text-sm">
        <div className="p-4 sm:p-5 rounded-2xl border transition-colors duration-300 bg-slate-50 border-slate-200 text-slate-700 dark:bg-[#0d1117] dark:border-[#30363d] dark:text-slate-300 midnight:bg-[#050B14] midnight:border-cyan-900/50 midnight:text-cyan-100/90 space-y-3 text-xs sm:text-sm leading-relaxed">
          <div className="flex items-center gap-2.5 text-slate-900 dark:text-white midnight:text-cyan-50">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-cyan-100 text-cyan-700 dark:bg-cyan-950/60 dark:text-cyan-400 midnight:bg-cyan-900/40 midnight:text-cyan-300">
              <RotateCcw size={16} />
            </span>
            <h3 className="font-bold text-sm sm:text-base">
              {t('backup.restoreWarningTitle', 'Restauración de Base de Datos')}
            </h3>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 midnight:text-cyan-100/80 leading-relaxed">
            {t('backup.restoreWarningText', 'Se reemplazarán los datos y objetos incluidos en la copia. Los usuarios y contraseñas también volverán a ese momento. Primero se guardará un respaldo preventivo del estado actual.')}
          </p>
          <div className="pt-2 border-t border-slate-200/80 dark:border-[#30363d]/80 midnight:border-cyan-900/40 text-xs sm:text-sm font-medium text-cyan-700 dark:text-cyan-400 midnight:text-cyan-300">
            {t('backup.pauseNotice', 'Pausa el trabajo de los demás usuarios y no cierres esta ventana durante el proceso.')}
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="confirm-db-input" className="block text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 midnight:text-cyan-200">
            {t('backup.typeToConfirm', `Para confirmar, escribe: ${database}`, { database })}
          </label>
          <input
            id="confirm-db-input"
            value={confirmation}
            disabled={isRestoring}
            autoComplete="off"
            placeholder={database}
            onChange={(e) => setConfirmation(e.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm sm:text-base text-slate-900 dark:bg-slate-800 dark:border-slate-600 dark:text-white midnight:bg-[#0a1120] midnight:border-cyan-800 midnight:text-cyan-100 focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 outline-none transition-all"
          />
        </div>

        <label className="flex items-start gap-3 text-xs sm:text-sm text-slate-700 dark:text-slate-300 midnight:text-cyan-100/90 cursor-pointer pt-1 select-none">
          <input
            type="checkbox"
            checked={acknowledged}
            disabled={isRestoring}
            onChange={(e) => setAcknowledged(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500 dark:border-slate-600 dark:bg-slate-800 midnight:border-cyan-800 midnight:bg-[#0a1120]"
          />
          <span>{t('backup.acknowledgeCheckbox', 'Entiendo que los datos actuales incluidos en el respaldo serán reemplazados.')}</span>
        </label>

        <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4 border-t border-slate-200 dark:border-[#30363d] midnight:border-cyan-900/40">
          <Button
            variant="secondary"
            disabled={isRestoring}
            onClick={onClose}
            className="w-full sm:w-auto"
          >
            {t('common.cancel', 'Cancelar')}
          </Button>
          <Button
            variant="primary"
            disabled={isRestoring || !isConfirmed}
            isLoading={isRestoring}
            onClick={() => onConfirm(confirmation)}
            className="w-full sm:w-auto bg-cyan-600 hover:bg-cyan-500 midnight:bg-cyan-600 midnight:hover:bg-cyan-500"
          >
            {t('backup.confirmRestoreBtn', 'Confirmar restauración')}
          </Button>
        </div>
      </div>
    </ModalDialog>
  );
}

/**
 * Botón y Modal de Administración de Respaldos de PostgreSQL.
 * Diseñado con barra de herramientas fija y contenedor de scroll exclusivo para la tabla.
 */
export default function BackupExportButton({ onCreated }) {
  const { t } = useLanguage();
  const { showToast } = useToast();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const [connected, setConnected] = useState(false);
  const [database, setDatabase] = useState('');
  const [backups, setBackups] = useState([]);
  const [selected, setSelected] = useState(null);

  const getSourceLabel = (source) => {
    switch (source) {
      case 'manual':
        return t('backup.sourceManual', 'Manual');
      case 'automatic':
        return t('backup.sourceAutomatic', 'Automático');
      case 'before_restore':
        return t('backup.sourceBeforeRestore', 'Antes de restaurar');
      case 'legacy':
        return t('backup.sourceLegacy', 'Anterior');
      default:
        return source;
    }
  };

  const formatBackupSize = (sizeBytes) => {
    if (sizeBytes >= 1024 * 1024) {
      return `${(sizeBytes / (1024 * 1024)).toFixed(2)} MB`;
    }
    return `${(sizeBytes / 1024).toFixed(1)} KB`;
  };

  const close = () => {
    if (busyRef.current) return;
    setOpen(false);
    setConnected(false);
    setBackups([]);
    setDatabase('');
    setSelected(null);
  };

  const perform = async (action, silentError = false) => {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    try {
      await action();
    } catch (err) {
      let data = err.response?.data;
      if (data instanceof Blob) {
        try {
          data = JSON.parse(await data.text());
        } catch {
          data = null;
        }
      }
      let detail = data?.detail;

      if (!err.response) {
        detail = t('backup.connectionError', 'No se logró conectar con la base de datos o el servidor.');
      } else if (err.response.status === 401) {
        detail = data?.detail || t('backup.sessionExpired', 'Sesión expirada o no autorizada.');
      } else if (err.response.status === 403) {
        detail = data?.detail || t('backup.unauthorized', 'No tienes permisos para realizar esta acción.');
      } else if (err.response.status >= 500) {
        detail = data?.detail || t('backup.serverError', 'No se pudo completar la operación en la base de datos.');
      }

      if (err.response?.status === 401 || err.response?.status === 403) {
        setConnected(false);
      }

      const fullMessage = (detail || t('backup.genericError', 'No se pudo completar la operación.')) +
        (data?.safety_backup ? ` Copia previa disponible: ${data.safety_backup}` : '');

      if (!silentError) {
        showToast({
          title: t('common.error', 'Error'),
          message: fullMessage,
          type: 'error',
          duration: 7000,
        });
      }
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  };

  const refresh = async () => {
    const { data } = await api.get('/backups/');
    const backupList = Array.isArray(data.backups) ? data.backups : [];
    setDatabase(data.database);
    setBackups(backupList);
    setConnected(true);
    if (backupList.length > 0 && onCreated) {
      const latestBackup = backupList.reduce((newest, item) =>
        new Date(item.created_at) > new Date(newest.created_at) ? item : newest
      , backupList[0]);
      onCreated(`${new Date(latestBackup.created_at).toLocaleString('es-PE')} (${getSourceLabel(latestBackup.source)})`);
    }
  };

  useEffect(() => {
    if (open && !connected) {
      perform(refresh);
    }
  }, [open]);

  const saveDownload = (response, fallback) => {
    const disposition = response.headers['content-disposition'] || '';
    const match = disposition.match(/filename="?([^";]+)"?/i);
    const candidate = match?.[1];
    const filename = candidate && /^project_planner_[0-9_]+_[a-f0-9]{8}\.dump$/.test(candidate)
      ? candidate : fallback;
    const url = URL.createObjectURL(response.data);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  };

  const create = () => perform(async () => {
    const response = await api.post('/backups/export/', {}, { responseType: 'blob' });
    saveDownload(response, `project_planner_${Date.now()}.dump`);
    try {
      await refresh();
    } catch {
      // Sincronización secundaria silenciosa
    }
    showToast({
      title: t('toasts.backupExported', 'Respaldo Generado'),
      message: t('backup.downloadStarted', 'Se ha iniciado la descarga del respaldo seleccionado.'),
      type: 'success',
    });
  });

  const download = (filename) => perform(async () => {
    const response = await api.get('/backups/' + encodeURIComponent(filename) + '/download/', { responseType: 'blob' });
    saveDownload(response, filename);
    showToast({
      title: t('backup.download', 'Descargar Respaldo'),
      message: t('backup.downloadStarted', 'Se ha iniciado la descarga del respaldo seleccionado.'),
      type: 'info',
    });
  });

  const handleConfirmRestore = (confirmationText) => perform(async () => {
    if (!selected || confirmationText !== database) return;
    const { data } = await api.post('/backups/restore/', {
      filename: selected.filename,
      confirm_database: confirmationText,
      confirm_restore: true,
    });
    setSelected(null);
    close();
    showToast({
      title: t('toasts.restoreSuccess', 'Restauración Completada'),
      message: `${data.detail} Copia previa guardada: ${data.safety_backup}`,
      type: 'success',
      duration: 8000,
    });
  });

  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        {t('backup.manageBackups', 'Administrar respaldos')}
      </Button>

      {/* Modal Principal de Respaldos de PostgreSQL */}
      <ModalDialog
        isOpen={open}
        onClose={close}
        title={t('backup.postgresBackupsTitle', 'Respaldos de PostgreSQL')}
        subtitle={t('backup.historyNotice', 'Las copias automáticas se ejecutan según la programación del servidor. El historial muestra las copias que realmente se han generado.')}
        icon={<Database size={22} className="text-cyan-600 dark:text-cyan-400 midnight:text-cyan-400" />}
        maxWidth="max-w-full sm:max-w-2xl md:max-w-4xl lg:max-w-5xl xl:max-w-6xl"
        showFooter={false}
        id="postgres-backups-modal"
      >
        <div className="flex flex-col gap-4 p-4 sm:p-6 md:p-8" aria-busy={busy}>
          {!connected ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-500 dark:text-slate-400">
              <RefreshCw size={24} className="animate-spin text-cyan-600 dark:text-cyan-400" />
              <span className="text-xs font-medium">{t('backup.loadingBackups', 'Cargando respaldos...')}</span>
            </div>
          ) : (
            <>
              {/* Barra de herramientas Fija y Responsiva */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0 pb-1">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 midnight:text-cyan-200">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block shrink-0" />
                    {t('backup.configuredDatabase', `Base configurada: ${database}`, { database })}
                  </span>
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full sm:w-auto">
                  <Button
                    variant="primary"
                    disabled={busy}
                    isLoading={busy}
                    onClick={create}
                    icon={Download}
                    className="w-full sm:w-auto bg-cyan-600 hover:bg-cyan-500 midnight:bg-cyan-600 midnight:hover:bg-cyan-500"
                  >
                    {t('backup.createAndDownload', 'Crear y descargar respaldo')}
                  </Button>
                  <Button
                    variant="secondary"
                    disabled={busy}
                    onClick={() => perform(refresh)}
                    icon={RefreshCw}
                    className="w-full sm:w-auto"
                  >
                    {t('backup.refreshHistory', 'Actualizar historial')}
                  </Button>
                </div>
              </div>

              {/* Contenedor con SCROLL EXCLUSIVO para la tabla de respaldos (Adaptable a resolución) */}
              <div className="overflow-x-auto overflow-y-auto max-h-[320px] sm:max-h-[440px] md:max-h-[520px] lg:max-h-[620px] rounded-xl border border-slate-200 dark:border-[#30363d] midnight:border-cyan-900/50 shadow-inner">
                <table className="w-full min-w-[560px] sm:min-w-full text-left text-xs sm:text-sm">
                  <thead className="sticky top-0 z-10 bg-slate-100 dark:bg-[#1c2128] midnight:bg-[#071322] shadow-xs">
                    <tr className="border-b border-slate-300 dark:border-[#30363d] text-slate-700 dark:text-slate-200 midnight:text-cyan-100">
                      <th className="p-3 sm:p-3.5 font-semibold">{t('backup.colDateAndFile', 'Fecha y archivo')}</th>
                      <th className="p-3 sm:p-3.5 font-semibold">{t('backup.colSource', 'Origen')}</th>
                      <th className="p-3 sm:p-3.5 font-semibold">{t('backup.colSize', 'Tamaño')}</th>
                      <th className="p-3 sm:p-3.5 font-semibold text-right pr-4 sm:pr-5">{t('backup.colActions', 'Acciones')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-[#30363d]">
                    {backups.map((backup) => (
                      <tr key={backup.filename} className="hover:bg-slate-50 dark:hover:bg-white/5 midnight:hover:bg-cyan-950/20 transition-colors">
                        <td className="p-3 sm:p-3.5">
                          <div className="font-semibold text-slate-900 dark:text-white midnight:text-cyan-100">
                            {new Date(backup.created_at).toLocaleString('es-PE')}
                          </div>
                          <div className="mt-0.5 break-all text-slate-500 dark:text-slate-400 text-[11px] font-mono">
                            {backup.filename}
                          </div>
                        </td>
                        <td className="p-3 sm:p-3.5">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                            backup.source === 'automatic'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 midnight:bg-cyan-950 midnight:text-cyan-300 border border-emerald-200 dark:border-emerald-800/50'
                              : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 midnight:bg-cyan-900/20 midnight:text-cyan-400 border border-slate-200 dark:border-slate-700'
                          }`}>
                            {getSourceLabel(backup.source)}
                          </span>
                        </td>
                        <td className="p-3 sm:p-3.5 text-slate-600 dark:text-slate-300 font-mono">
                          {formatBackupSize(backup.size_bytes)}
                        </td>
                        <td className="p-3 sm:p-3.5 text-right pr-4 sm:pr-5">
                          <div className="inline-flex items-center gap-2">
                            <Button
                              variant="secondary"
                              size="sm"
                              disabled={busy}
                              onClick={() => download(backup.filename)}
                              icon={Download}
                            >
                              {t('backup.download', 'Descargar')}
                            </Button>
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => setSelected(backup)}
                              className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-cyan-300/80 bg-cyan-50/70 px-2.5 py-1.5 text-xs font-medium text-cyan-800 shadow-xs hover:bg-cyan-100 dark:border-cyan-800/60 dark:bg-cyan-950/40 dark:text-cyan-300 dark:hover:bg-cyan-900/50 midnight:border-cyan-700/60 midnight:bg-cyan-900/30 midnight:text-cyan-200 midnight:hover:bg-cyan-800/50 disabled:opacity-50 transition-colors"
                            >
                              <RotateCcw size={13} />
                              <span>{t('backup.restore', 'Restaurar')}</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {!backups.length && (
                  <p className="py-12 text-center text-sm text-slate-500 dark:text-slate-400">
                    {t('backup.noBackupsYet', 'Todavía no hay respaldos en esta instalación.')}
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      </ModalDialog>

      {/* Sub-modal Aislado de Confirmación de Restauración (Evita romper el diseño de la tabla) */}
      <ConfirmRestoreDialog
        isOpen={Boolean(selected)}
        backup={selected}
        database={database}
        onConfirm={handleConfirmRestore}
        onClose={() => setSelected(null)}
        isRestoring={busy}
      />
    </>
  );
}
