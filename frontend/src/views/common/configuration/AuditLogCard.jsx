import React from 'react';
import { ShieldAlert, RotateCw, Clock } from 'lucide-react';
import FormattedAuditText from '../../../components/common/FormattedAuditText';

/**
 * Tarjeta de Bitácora de Auditoría de Seguridad (exclusivo para Administrador)
 */
export default function AuditLogCard({
  auditLogs = [],
  loadingAuditLogs = false,
  onRefresh,
}) {
  return (
    <section
      aria-labelledby="audit-log-title"
      className="border rounded-xl p-6 shadow-sm transition-colors duration-300 bg-white border-slate-200 dark:bg-[#161b22] dark:border-[#30363d] midnight:bg-[#0a1120] midnight:border-cyan-900/30"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-600 dark:text-cyan-400 midnight:text-cyan-300 flex items-center justify-center">
            <ShieldAlert size={20} />
          </div>
          <div>
            <h2
              id="audit-log-title"
              className="text-base font-bold text-slate-900 dark:text-white midnight:text-cyan-100"
            >
              Bitácora de Auditoría
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 midnight:text-cyan-500/80">
              Supervisión de cambios de correo, contraseñas y accesos
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          disabled={loadingAuditLogs}
          title="Actualizar bitácora"
          aria-label="Actualizar bitácora de auditoría"
          className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 dark:border-[#30363d] dark:hover:bg-white/5 midnight:border-cyan-800 midnight:hover:bg-cyan-900/20 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white midnight:text-cyan-400 midnight:hover:text-cyan-200 transition-colors cursor-pointer"
        >
          <RotateCw size={14} className={loadingAuditLogs ? 'animate-spin' : ''} />
        </button>
      </div>

      {auditLogs.length === 0 ? (
        <div className="text-center py-6 border rounded-lg border-dashed border-slate-200 dark:border-[#30363d] midnight:border-cyan-900/40 text-xs text-slate-500 dark:text-slate-400 midnight:text-cyan-600">
          <Clock size={20} className="mx-auto mb-2 opacity-50" />
          No hay eventos de auditoría registrados recientemente.
        </div>
      ) : (
        <div className="max-h-64 overflow-y-auto space-y-2.5 pr-1 divide-y divide-slate-100 dark:divide-[#30363d]/50 midnight:divide-cyan-900/20">
          {auditLogs.map((log) => (
            <div key={log.id} className="pt-2.5 first:pt-0 flex items-start justify-between gap-3 text-xs">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-800 dark:text-slate-200 midnight:text-cyan-100 truncate">
                    {log.userName}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-50 border border-cyan-200 text-cyan-700 dark:bg-cyan-500/10 dark:border-cyan-500/20 dark:text-cyan-300 midnight:bg-cyan-950 midnight:border-cyan-800/40 midnight:text-cyan-400 font-mono">
                    {log.actionDisplay || log.action}
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 midnight:text-cyan-300/80 mt-0.5 break-words">
                  <FormattedAuditText text={log.description} />
                </p>
              </div>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 midnight:text-cyan-600 shrink-0 whitespace-nowrap">
                {log.dateFormatted || log.createdAt}
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
