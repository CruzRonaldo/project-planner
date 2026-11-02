import React from 'react';
import { cardClass, nestedClass } from './constants';

export default function StatusPanel({ summary, hasActivities = false }) {
  const chartPoints = '0,78 28,62 56,84 84,54 112,31 140,70 168,59 196,47 224,51 252,29 280,39 308,14';
  const onlinePercent = summary.total > 0 ? Math.round((summary.active / summary.total) * 100) : 0;

  return (
    <aside className={`h-full p-5 ${cardClass}`} aria-labelledby="general-status-title">
      <h2
        id="general-status-title"
        className="text-base font-semibold text-slate-900 transition-colors duration-300 dark:text-white midnight:text-cyan-50"
      >
        Estado General
      </h2>

      <div className="mt-5 space-y-3">
        <div className={`${nestedClass} p-4`}>
          <p className="text-[10px] uppercase text-slate-500 transition-colors duration-300 dark:text-slate-400 midnight:text-cyan-600">
            Integraciones activas
          </p>
          <div className="mt-2 flex items-end justify-between">
            <strong className="text-2xl text-slate-900 transition-colors duration-300 dark:text-white midnight:text-cyan-50">
              {summary.active}{' '}
              <span className="text-slate-500 dark:text-slate-400 midnight:text-cyan-600">
                / {summary.total}
              </span>
            </strong>
            <span
              className={`text-[10px] ${
                summary.active > 0
                  ? 'text-emerald-600 dark:text-emerald-400 midnight:text-emerald-300'
                  : 'text-slate-500 dark:text-slate-400 midnight:text-cyan-600'
              }`}
            >
              {onlinePercent}% online
            </span>
          </div>
        </div>

        <div className={`${nestedClass} p-4`}>
          <p className="text-[10px] uppercase text-slate-500 transition-colors duration-300 dark:text-slate-400 midnight:text-cyan-600">
            Uptime general (30 días)
          </p>
          <div className="mt-2 flex items-end justify-between">
            <strong className="text-2xl text-slate-900 transition-colors duration-300 dark:text-white midnight:text-cyan-50">
              {summary.uptime > 0 ? `${summary.uptime.toFixed(1)}%` : '--'}
            </strong>
            <span
              className={`text-[10px] ${
                summary.uptime > 0
                  ? 'text-emerald-600 dark:text-emerald-400 midnight:text-emerald-300'
                  : 'text-slate-500 dark:text-slate-400 midnight:text-cyan-600'
              }`}
            >
              {summary.uptime > 0 ? 'Excelente' : 'Sin datos'}
            </span>
          </div>
        </div>

        <div className={`${nestedClass} p-4`}>
          <p className="text-[10px] uppercase text-slate-500 transition-colors duration-300 dark:text-slate-400 midnight:text-cyan-600">
            Errores (últimas 24h)
          </p>
          <div className="mt-2 flex items-end justify-between">
            <strong
              className={`text-2xl ${
                summary.errors > 0
                  ? 'text-red-600 dark:text-red-400 midnight:text-red-300'
                  : 'text-slate-900 dark:text-white midnight:text-cyan-50'
              }`}
            >
              {summary.errors}
            </strong>
            <span
              className={`text-[10px] ${
                summary.errors > 0
                  ? 'text-red-600 dark:text-red-400 midnight:text-red-300'
                  : 'text-emerald-600 dark:text-emerald-400 midnight:text-emerald-300'
              }`}
            >
              {summary.errors > 0 ? 'Requiere atención' : 'Sin incidencias'}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <h3 className="text-xs font-medium text-slate-700 transition-colors duration-300 dark:text-slate-300 midnight:text-cyan-100">
          Actividad de Peticiones (API)
        </h3>
        <div className={`mt-3 p-3 ${nestedClass}`}>
          {hasActivities ? (
            <>
              <svg
                viewBox="0 0 308 100"
                role="img"
                aria-label="Actividad de peticiones de las últimas doce horas"
                className="h-28 w-full overflow-visible text-cyan-500 transition-colors duration-300 dark:text-blue-400 midnight:text-cyan-400"
              >
                <path
                  d="M0 90H308"
                  className="stroke-slate-200 dark:stroke-[#26344a] midnight:stroke-cyan-900/40"
                  strokeWidth="1"
                />
                <polyline
                  points={chartPoints}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinejoin="round"
                />
                <polygon
                  points={`0,100 ${chartPoints} 308,100`}
                  className="fill-cyan-500/10 dark:fill-blue-500/10 midnight:fill-cyan-400/10"
                />
              </svg>
              <div className="flex justify-between text-[9px] text-slate-500 transition-colors duration-300 dark:text-slate-400 midnight:text-cyan-600">
                <span>Hace 12h</span>
                <span>Ahora</span>
              </div>
            </>
          ) : (
            <div className="flex h-28 flex-col items-center justify-center text-center">
              <p className="text-xs text-slate-500 dark:text-slate-400 midnight:text-cyan-500/70">
                Sin peticiones registradas
              </p>
              <span className="mt-1 text-[10px] text-slate-400 dark:text-slate-500 midnight:text-cyan-700">
                No hay actividad reciente en los conectores
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="mt-6">
        <h3 className="text-xs font-medium text-slate-700 transition-colors duration-300 dark:text-slate-300 midnight:text-cyan-100">
          SLA y Mantenimiento
        </h3>
        <div className="mt-3 space-y-2 text-[10px] text-slate-500 transition-colors duration-300 dark:text-slate-400 midnight:text-cyan-500/70">
          <p className="flex items-center gap-2">
            <i className="h-2 w-2 rounded-full bg-emerald-400" /> Operacional (sin incidencias)
          </p>
          <p className="flex items-center gap-2">
            <i className="h-2 w-2 rounded-full bg-amber-400" /> Rendimiento degradado
          </p>
          <p className="flex items-center gap-2">
            <i className="h-2 w-2 rounded-full bg-red-400" /> Interrupción del servicio
          </p>
        </div>
      </div>
    </aside>
  );
}
