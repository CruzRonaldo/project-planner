import React from 'react';
import { activityStyles, cardClass, iconMap, nestedClass } from './constants';

export default function IntegrationActivityList({
  activities = [],
  integrations = [],
  query = '',
  onClearQuery,
}) {
  return (
    <section className={`overflow-hidden p-4 sm:p-5 ${cardClass}`} aria-labelledby="integration-activity-title">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2
          id="integration-activity-title"
          className="text-base font-semibold text-slate-900 transition-colors duration-300 dark:text-white midnight:text-cyan-50"
        >
          Registro de Actividad de Integraciones
        </h2>
        {query && onClearQuery && (
          <button
            type="button"
            onClick={onClearQuery}
            className="text-[10px] text-cyan-700 transition-colors duration-300 hover:text-cyan-600 dark:text-cyan-400 dark:hover:text-cyan-300 midnight:text-cyan-400 midnight:hover:text-cyan-200"
          >
            Limpiar búsqueda
          </button>
        )}
      </div>

      <div className="mt-4 space-y-2">
        {activities.map((item) => {
          const integration = integrations.find((entry) => entry.id === item.integrationId) || {};
          const Icon = iconMap[integration.icon];
          const status = activityStyles[item.status] || {
            label: item.status,
            className: 'bg-slate-100 text-slate-700',
          };

          return (
            <article key={item.id} className={`flex items-center gap-3 px-3 py-3 ${nestedClass}`}>
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-cyan-50 text-cyan-700 transition-colors duration-300 dark:bg-blue-500/20 dark:text-blue-300 midnight:bg-cyan-500/20 midnight:text-cyan-300">
                {Icon && <Icon size={15} />}
              </span>
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-xs font-semibold text-slate-800 transition-colors duration-300 dark:text-slate-200 midnight:text-cyan-100">
                  {integration.name} — {item.title}
                </h3>
                <p className="mt-1 text-[10px] text-slate-500 transition-colors duration-300 dark:text-slate-400 midnight:text-cyan-600">
                  {item.time}
                </p>
              </div>
              <span className={`shrink-0 rounded px-2 py-1 text-[9px] font-semibold ${status.className}`}>
                {status.label}
              </span>
            </article>
          );
        })}

        {!activities.length && (
          <p className="py-8 text-center text-sm text-slate-500 dark:text-slate-400 midnight:text-cyan-500/70">
            No hay actividad que coincida con la búsqueda.
          </p>
        )}
      </div>
    </section>
  );
}
