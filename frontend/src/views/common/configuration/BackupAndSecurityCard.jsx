import React from 'react';
import BackupExportButton from '../../../components/common/BackupExportButton';

/**
 * Tarjeta de Respaldo y Seguridad de Base de Datos (exclusivo para Administrador)
 */
export default function BackupAndSecurityCard({
  lastBackup,
  setLastBackup,
  currentUser,
}) {
  return (
    <section
      aria-labelledby="backup-security-title"
      className="border rounded-xl p-6 shadow-sm transition-colors duration-300 bg-white border-slate-200 dark:bg-[#161b22] dark:border-[#30363d] midnight:bg-[#0a1120] midnight:border-cyan-900/30"
    >
      <h2
        id="backup-security-title"
        className="text-lg font-bold mb-6 text-slate-900 dark:text-white midnight:text-cyan-100"
      >
        Respaldo y Seguridad
      </h2>

      <div className="flex justify-between items-center mb-6">
        <div>
          <p className="text-sm font-medium text-slate-700 dark:text-slate-200 midnight:text-cyan-100/80">
            Último respaldo generado en esta pantalla
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 midnight:text-cyan-500/80 mt-0.5">
            {lastBackup}
          </p>
        </div>
        <div title="Exportar Datos">
          <BackupExportButton onCreated={setLastBackup} currentUser={currentUser} />
        </div>
      </div>

      <div className="flex justify-between items-center mb-6">
        <span className="text-sm text-slate-600 dark:text-slate-300 midnight:text-cyan-100/70">
          Respaldo diario automático
        </span>
        <span className="text-xs text-slate-500 dark:text-slate-400 midnight:text-cyan-500/80">
          Programado a las 8:00 AM
        </span>
      </div>

      {/* Consola de estado del sistema */}
      <div className="p-4 rounded-lg font-mono text-xs space-y-2 mt-4 border transition-colors bg-slate-50 border-slate-200 text-slate-600 dark:bg-[#0d1117] dark:border-[#30363d] dark:text-slate-400 midnight:bg-[#050B14] midnight:border-cyan-900/40 midnight:text-cyan-600">
        <p>
          <span className="font-bold text-emerald-600 dark:text-emerald-400 midnight:text-emerald-400">
            SISTEMA ·
          </span>{' '}
          Exportación manual de la base de datos en formato .dump.
        </p>
        <p>
          <span className="font-bold text-cyan-600 dark:text-cyan-400 midnight:text-cyan-400">
            SESIÓN ·
          </span>{' '}
          Conexión activa para{' '}
          <strong className="font-bold text-slate-900 dark:text-white midnight:text-cyan-100">
            {currentUser?.name || currentUser?.username || 'Administrador'}
          </strong>{' '}
          ({currentUser?.roleLabel || 'Admin'}).
        </p>
        <p>
          <span className="font-bold text-slate-600 dark:text-slate-300 midnight:text-cyan-400">
            SEGURIDAD ·
          </span>{' '}
          La exportación requiere validar las credenciales del administrador con la sesión activa.
        </p>
      </div>
    </section>
  );
}
