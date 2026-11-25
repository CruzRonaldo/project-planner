import React from 'react';
import EmptyState from '../../../components/common/EmptyState';
import { cardClass, nestedClass } from './constants';
import { useLanguage } from '../../../context/LanguageContext';
import { computeActivityChartPoints } from '../../../utils/integrations';

export default function StatusPanel({ summary, activities = [], hasActivities = false }) {
  const { t } = useLanguage();
  const chartPoints =
    computeActivityChartPoints(activities) ||
    '0,85 28,85 56,85 84,85 112,85 140,85 168,85 196,85 224,85 252,85 280,85 308,85';
  const onlinePercent =
    summary.total > 0
      ? Math.round(((summary.active + (summary.partial || 0) * 0.5) / summary.total) * 100)
      : 0;

  const uptimeColorClass =
    summary.uptime >= 95
      ? 'text-emerald-600 dark:text-emerald-400 midnight:text-emerald-300'
      : summary.uptime >= 70
        ? 'text-amber-600 dark:text-amber-400 midnight:text-amber-300'
        : summary.uptime > 0
          ? 'text-red-600 dark:text-red-400 midnight:text-red-300'
          : 'text-slate-500 dark:text-slate-400 midnight:text-cyan-600';

  const uptimeLabel =
    summary.uptime > 0
      ? summary.uptime >= 95
        ? t('integrations.uptimeExcellent', 'Excelente')
        : summary.uptime >= 70
          ? t('integrations.uptimeGood', 'Operativo')
          : t('integrations.requiresAttention', 'Requiere atención')
      : t('integrations.noData', 'Sin datos');

  return (
    <aside className={`h-full p-5 ${cardClass}`} aria-labelledby="general-status-title">
      <h2
        id="general-status-title"
        className="text-base font-semibold text-slate-900 transition-colors duration-300 dark:text-white midnight:text-cyan-50"
      >
        {t('integrations.statusPanelTitle', 'Estado General')}
      </h2>

      <div className="mt-5 space-y-3">
        <div className={`${nestedClass} p-4`}>
          <p className="text-[10px] uppercase text-slate-500 transition-colors duration-300 dark:text-slate-400 midnight:text-cyan-600">
            {t('integrations.activeIntegrations', 'Integraciones activas')}
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
            {t('integrations.generalUptime', 'Uptime general (30 días)')}
          </p>
          <div className="mt-2 flex items-end justify-between">
            <strong className="text-2xl text-slate-900 transition-colors duration-300 dark:text-white midnight:text-cyan-50">
              {summary.uptime > 0 ? `${summary.uptime.toFixed(1)}%` : '--'}
            </strong>
            <span className={`text-[10px] ${uptimeColorClass}`}>
              {uptimeLabel}
            </span>
          </div>
        </div>

        <div className={`${nestedClass} p-4`}>
          <p className="text-[10px] uppercase text-slate-500 transition-colors duration-300 dark:text-slate-400 midnight:text-cyan-600">
            {t('integrations.recentErrors', 'Errores (últimas 24h)')}
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
              {summary.errors > 0 ? t('integrations.requiresAttention', 'Requiere atención') : t('integrations.noIncidents', 'Sin incidencias')}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <h3 className="text-xs font-medium text-slate-700 transition-colors duration-300 dark:text-slate-300 midnight:text-cyan-100">
          {t('integrations.apiActivityTitle', 'Actividad de Peticiones (API)')}
        </h3>
        <div className={`mt-3 p-3 ${nestedClass}`}>
          {hasActivities ? (
            <>
              <svg
                viewBox="0 0 308 100"
                role="img"
                aria-label={t('integrations.apiChartAria', 'Actividad de peticiones de las últimas doce horas')}
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
                <span>{t('integrations.twelveHoursAgo', 'Hace 12h')}</span>
                <span>{t('integrations.now', 'Ahora')}</span>
              </div>
            </>
          ) : (
            <EmptyState
              title={t('integrations.noRequestsTitle', 'Sin peticiones registradas')}
              description={t('integrations.noRequestsDesc', 'No hay actividad reciente en los conectores')}
              className="h-28 flex flex-col items-center justify-center py-0"
            />
          )}
        </div>
      </div>

      <div className="mt-6">
        <h3 className="text-xs font-medium text-slate-700 transition-colors duration-300 dark:text-slate-300 midnight:text-cyan-100">
          {t('integrations.slaTitle', 'SLA y Mantenimiento')}
        </h3>
        <div className="mt-3 space-y-2 text-[10px] text-slate-500 transition-colors duration-300 dark:text-slate-400 midnight:text-cyan-500/70">
          <p className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-2">
              <i className="h-2 w-2 rounded-full bg-emerald-400" /> {t('integrations.slaOperational', 'Operacional (sin incidencias)')}
            </span>
            <span className="font-semibold text-slate-700 dark:text-slate-200 midnight:text-cyan-100">
              {summary.connected ?? summary.active ?? 0}
            </span>
          </p>
          <p className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-2">
              <i className="h-2 w-2 rounded-full bg-amber-400" /> {t('integrations.slaDegraded', 'Rendimiento degradado')}
            </span>
            <span className="font-semibold text-slate-700 dark:text-slate-200 midnight:text-cyan-100">
              {summary.partial ?? 0}
            </span>
          </p>
          <p className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-2">
              <i className="h-2 w-2 rounded-full bg-red-400" /> {t('integrations.slaOutage', 'Interrupción del servicio')}
            </span>
            <span className="font-semibold text-slate-700 dark:text-slate-200 midnight:text-cyan-100">
              {summary.offline ?? 0}
            </span>
          </p>
        </div>
      </div>
    </aside>
  );
}
