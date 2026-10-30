import React from 'react';
import { ShieldCheck } from 'lucide-react';

export default function OperationsSidebar({
  alertsList = [],
  qualityList = [],
  onSelectAlert,
  headingClass = '',
  cardClass = '',
  nestedClass = '',
}) {
  return (
    <div className="space-y-5">
      {/* Alertas Críticas de Operación */}
      <aside className={`${cardClass} p-4 sm:p-5`} aria-labelledby="operation-alerts-title">
        <div className="flex items-center justify-between gap-3">
          <h2 id="operation-alerts-title" className={`text-sm font-semibold ${headingClass}`}>
            Alertas Críticas de Operación
          </h2>
          <span className="rounded bg-red-50 px-2 py-1 text-[9px] font-semibold text-red-700 dark:bg-red-500/10 dark:text-red-400 midnight:bg-red-500/10 midnight:text-red-300">
            {alertsList.length} Urgentes
          </span>
        </div>

        <div className="mt-4 space-y-3">
          {alertsList.map((alert) => (
            <article
              key={alert.id}
              className={`rounded-lg border p-3 ${
                alert.level === 'critical'
                  ? 'border-red-200 bg-red-50 dark:border-red-500/20 dark:bg-red-500/5 midnight:border-red-500/20 midnight:bg-red-500/5'
                  : 'border-amber-200 bg-amber-50 dark:border-amber-500/20 dark:bg-amber-500/5 midnight:border-amber-500/20 midnight:bg-amber-500/5'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-[10px] font-semibold text-slate-800 dark:text-slate-200 midnight:text-cyan-100">
                    <i
                      className={`mr-2 inline-block h-2 w-2 rounded-full ${
                        alert.level === 'critical' ? 'bg-red-500' : 'bg-amber-500'
                      }`}
                    />
                    {alert.title}
                  </h3>
                  <p className="mt-1 pl-4 text-[9px] text-slate-500 midnight:text-cyan-600">
                    {alert.project}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onSelectAlert && onSelectAlert(alert)}
                  className={`rounded border px-2 py-1 text-[9px] font-semibold ${
                    alert.level === 'critical'
                      ? 'border-red-200 text-red-700 dark:border-red-500/25 dark:text-red-400 midnight:text-red-300'
                      : 'border-amber-200 text-amber-700 dark:border-amber-500/25 dark:text-amber-400 midnight:text-amber-300'
                  }`}
                >
                  {alert.level === 'critical' ? 'Atender' : 'Revisar'}
                </button>
              </div>
            </article>
          ))}
          {!alertsList.length && (
            <p className="py-4 text-center text-xs text-slate-500 dark:text-slate-400 midnight:text-cyan-500/70">
              Sin alertas operativas activas.
            </p>
          )}
        </div>
      </aside>

      {/* Aseguramiento de Calidad */}
      <aside className={`${cardClass} p-4 sm:p-5`} aria-labelledby="quality-title">
        <div className="flex items-center justify-between gap-3">
          <h2 id="quality-title" className={`text-sm font-semibold ${headingClass}`}>
            Aseguramiento de Calidad
          </h2>
          <span className="text-[9px] text-slate-500 midnight:text-cyan-600">Norma ISO-9001</span>
        </div>

        <div className="mt-4 space-y-3">
          {qualityList.map((check) => (
            <article key={check.id} className={`flex items-center justify-between gap-3 p-3 ${nestedClass}`}>
              <p className="flex items-center gap-2 text-[10px] text-slate-700 dark:text-slate-300 midnight:text-cyan-100">
                <ShieldCheck
                  size={13}
                  className={
                    check.status === 'Aprobada'
                      ? 'text-emerald-600 dark:text-emerald-400 midnight:text-emerald-300'
                      : 'text-amber-600 dark:text-amber-400 midnight:text-amber-300'
                  }
                />
                {check.title}
              </p>
              <span
                className={`rounded px-2 py-1 text-[9px] font-semibold ${
                  check.status === 'Aprobada'
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 midnight:bg-emerald-500/10 midnight:text-emerald-300'
                    : 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 midnight:bg-amber-500/10 midnight:text-amber-300'
                }`}
              >
                {check.status}
              </span>
            </article>
          ))}
          {!qualityList.length && (
            <p className="py-4 text-center text-xs text-slate-500 dark:text-slate-400 midnight:text-cyan-500/70">
              Sin controles de calidad registrados.
            </p>
          )}
        </div>
      </aside>
    </div>
  );
}
