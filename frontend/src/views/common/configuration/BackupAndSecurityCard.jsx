import React, { useEffect, useState } from 'react';
import BackupExportButton from '../../../components/common/BackupExportButton';
import { cardClass } from '../../../constants/themeClasses';
import { useLanguage } from '../../../context/LanguageContext';
import { useToast } from '../../../context/ToastContext';
import api from '../../../services/api';

/**
 * Tarjeta de Respaldo y Seguridad de Base de Datos (exclusivo para Administrador)
 */
export default function BackupAndSecurityCard({
  lastBackup,
  setLastBackup,
  currentUser,
}) {
  const { t } = useLanguage();
  const { showToast } = useToast();
  const [autoBackupEnabled, setAutoBackupEnabled] = useState(true);
  const [isToggling, setIsToggling] = useState(false);

  useEffect(() => {
    let isMounted = true;
    api.get('/backups/')
      .then((res) => {
        if (!isMounted) return;
        if (typeof res.data?.auto_backup_enabled === 'boolean') {
          setAutoBackupEnabled(res.data.auto_backup_enabled);
        }
        const backupList = Array.isArray(res.data?.backups) ? res.data.backups : [];
        if (backupList.length > 0 && setLastBackup) {
          const latestBackup = backupList.reduce((newest, item) =>
            new Date(item.created_at) > new Date(newest.created_at) ? item : newest
          , backupList[0]);
          const sourceLabel = latestBackup.source === 'automatic'
            ? t('backup.sourceAutomatic', 'Automático')
            : latestBackup.source === 'safety_pre_restore'
            ? t('backup.sourceSafety', 'Seguridad')
            : t('backup.sourceManual', 'Manual');
          setLastBackup(`${new Date(latestBackup.created_at).toLocaleString('es-PE')} (${sourceLabel})`);
        }
      })
      .catch((err) => {
        console.warn('No se pudo obtener la configuración de respaldos:', err);
      });
    return () => {
      isMounted = false;
    };
  }, [setLastBackup, t]);

  const handleToggleAutoBackup = async () => {
    if (isToggling) return;
    const targetState = !autoBackupEnabled;
    setIsToggling(true);
    try {
      const res = await api.post('/backups/toggle-auto/', { enabled: targetState });
      const newState = typeof res.data?.auto_backup_enabled === 'boolean'
        ? res.data.auto_backup_enabled
        : targetState;
      setAutoBackupEnabled(newState);
      showToast({
        title: t('toasts.Operación Exitosa', 'Operación Exitosa'),
        message: newState
          ? t('configuration.autoBackupEnabledToast', 'El respaldo diario automático ha sido activado.')
          : t('configuration.autoBackupDisabledToast', 'El respaldo diario automático ha sido pausado.'),
        type: 'success',
      });
    } catch (err) {
      console.error('Error al alternar respaldo automático:', err);
      showToast({
        title: t('common.error', 'Error'),
        message: t('configuration.toggleAutoBackupError', 'No se pudo actualizar el estado del respaldo automático.'),
        type: 'error',
      });
    } finally {
      setIsToggling(false);
    }
  };

  return (
    <section
      aria-labelledby="backup-security-title"
      className={`${cardClass} p-6`}
    >
      <h2
        id="backup-security-title"
        className="text-lg font-bold mb-6 text-slate-900 dark:text-white midnight:text-cyan-100"
      >
        {t('configuration.backupAndSecurityTitle', 'Respaldo y Seguridad')}
      </h2>

      <div className="flex justify-between items-center mb-6">
        <div>
          <p className="text-sm font-medium text-slate-700 dark:text-slate-200 midnight:text-cyan-100/80">
            {t('configuration.lastBackupGenerated', 'Último respaldo generado en esta pantalla')}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 midnight:text-cyan-500/80 mt-0.5">
            {lastBackup}
          </p>
        </div>
        <div>
          <BackupExportButton onCreated={setLastBackup} currentUser={currentUser} />
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <p className="text-sm font-medium text-slate-700 dark:text-slate-200 midnight:text-cyan-100/80">
            {t('configuration.automaticDailyBackup', 'Respaldo diario automático')}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 midnight:text-cyan-500/80 mt-0.5">
            {autoBackupEnabled
              ? t('configuration.scheduledAt8AM', 'Programado a las 8:00 AM')
              : t('configuration.scheduledPaused', 'Programación pausada')}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border transition-colors ${
              autoBackupEnabled
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 midnight:bg-cyan-950 midnight:text-cyan-400 border-emerald-200 dark:border-emerald-800 midnight:border-cyan-800'
                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 midnight:bg-slate-900/80 midnight:text-cyan-600 border-slate-300 dark:border-slate-700 midnight:border-cyan-900/40'
            }`}
          >
            {autoBackupEnabled ? t('common.active', 'Activo') : t('common.paused', 'Pausado')}
          </span>

          <button
            type="button"
            role="switch"
            aria-label={t('configuration.toggleAutoBackupAria', 'Alternar respaldo diario automático')}
            aria-checked={autoBackupEnabled}
            disabled={isToggling}
            onClick={handleToggleAutoBackup}
            className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-cyan-500/40 focus:ring-offset-2 dark:focus:ring-offset-[#161b22] midnight:focus:ring-offset-[#0a1120] ${
              isToggling ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'
            } ${
              autoBackupEnabled
                ? 'bg-cyan-600 dark:bg-cyan-500 shadow-sm shadow-cyan-500/25'
                : 'bg-slate-300 dark:bg-[#30363d] midnight:bg-cyan-950/80 border border-slate-300 dark:border-slate-700 midnight:border-cyan-800/60'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                autoBackupEnabled ? 'translate-x-[22px]' : 'translate-x-[2px]'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Consola de estado del sistema */}
      <div className="p-4 rounded-lg font-mono text-xs space-y-2 mt-4 border transition-colors bg-slate-50 border-slate-200 text-slate-600 dark:bg-[#0d1117] dark:border-[#30363d] dark:text-slate-400 midnight:bg-[#050B14] midnight:border-cyan-900/40 midnight:text-cyan-600">
        <p>
          <span className="font-bold text-emerald-600 dark:text-emerald-400 midnight:text-emerald-400">
            {t('configuration.systemTag', 'SISTEMA ·')}
          </span>{' '}
          {t('configuration.manualExportDesc', 'Exportación manual de la base de datos en formato .dump.')}
        </p>
        <p>
          <span className="font-bold text-cyan-600 dark:text-cyan-400 midnight:text-cyan-400">
            {t('configuration.sessionTag', 'SESIÓN ·')}
          </span>{' '}
          {t('configuration.activeConnectionFor', 'Conexión activa para')}{' '}
          <strong className="font-bold text-slate-900 dark:text-white midnight:text-cyan-100">
            {currentUser?.name || currentUser?.username || t('configuration.administrator', 'Administrador')}
          </strong>{' '}
          ({currentUser?.roleLabel || t('configuration.admin', 'Admin')}).
        </p>
        <p>
          <span className="font-bold text-slate-600 dark:text-slate-300 midnight:text-cyan-400">
            {t('configuration.securityTag', 'SEGURIDAD ·')}
          </span>{' '}
          {t('configuration.securityValidationDesc', 'Acceso exclusivo para Superadministrador. Registros auditados con SHA-256.')}
        </p>
      </div>
    </section>
  );
}
