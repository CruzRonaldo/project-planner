import React from 'react';
import { getBarGeometry } from '../../../utils/gantt';

const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'];

export default function CriticalScheduleSection({
  activitiesList = [],
  referenceDate = new Date(),
  headingClass = '',
  mutedClass = '',
  cardClass = '',
}) {
  const currentYear = referenceDate.getFullYear();
  const windowStart = `${currentYear}-01-01`;
  const windowMonths = 6;

  return (
    <section className={`${cardClass} overflow-hidden p-4 sm:p-5`} aria-labelledby="critical-schedule-title">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="critical-schedule-title" className={`text-base font-semibold ${headingClass}`}>
            Cronograma de Actividades Críticas
          </h2>
          <p className={`mt-1 text-[10px] ${mutedClass}`}>
            Seguimiento temporal y avance real de entregables clave
          </p>
        </div>
        <div className={`flex gap-3 text-[9px] ${mutedClass}`}>
          <span><i className="mr-1 inline-block h-2 w-2 bg-blue-500" /> En tiempo</span>
          <span><i className="mr-1 inline-block h-2 w-2 bg-emerald-500" /> Acelerada</span>
          <span><i className="mr-1 inline-block h-2 w-2 bg-purple-500" /> Programada</span>
        </div>
      </div>

      <div className="mt-5 overflow-x-auto">
        <div className="min-w-[780px]">
          <div className="grid grid-cols-[230px_1fr_90px] border-b border-slate-200 pb-2 transition-colors duration-300 dark:border-[#30363d] midnight:border-cyan-900/30">
            <span className="text-[9px] text-slate-500 midnight:text-cyan-600">Actividad / Obra</span>
            <div className="grid grid-cols-6">
              {months.map((month) => (
                <span key={month} className="text-center text-[9px] text-slate-500 midnight:text-cyan-600">
                  {month}
                </span>
              ))}
            </div>
            <span className="text-right text-[9px] text-slate-500 midnight:text-cyan-600">Avance total</span>
          </div>

          <div className="space-y-4 pt-4">
            {activitiesList.map((activity) => {
              const geom = getBarGeometry({
                startDate: activity.startDate,
                endDate: activity.endDate,
                windowStart,
                windowMonths,
              }) || {
                leftPct: Math.max(0, ((Number(activity.start || 1) - 1) / windowMonths) * 100),
                widthPct: Math.max(5, (Number(activity.duration || 1) / windowMonths) * 100),
                clippedLeft: false,
                clippedRight: false,
              };

              const isClippedLeft = Boolean(geom.clippedLeft);
              const isClippedRight = Boolean(geom.clippedRight);

              const roundedClass = isClippedLeft && isClippedRight
                ? 'rounded-none border-x-2 border-dashed border-slate-800/40 dark:border-white/80 midnight:border-cyan-300/80'
                : isClippedLeft
                  ? 'rounded-r rounded-l-none border-l-2 border-dashed border-slate-800/40 dark:border-white/80 midnight:border-cyan-300/80'
                  : isClippedRight
                    ? 'rounded-l rounded-r-none border-r-2 border-dashed border-slate-800/40 dark:border-white/80 midnight:border-cyan-300/80'
                    : 'rounded';

              return (
                <article key={activity.id} className="grid grid-cols-[230px_1fr_90px] items-center">
                  <div>
                    <h3 className={`text-xs font-semibold ${headingClass}`}>{activity.name}</h3>
                    <p className="mt-1 text-[9px] text-slate-500 midnight:text-cyan-600">{activity.project}</p>
                  </div>
                  <div
                    className="relative h-7 rounded bg-slate-100 transition-colors duration-300 dark:bg-[#0d1117] midnight:bg-cyan-950/50"
                    style={{
                      backgroundImage: 'linear-gradient(to right, rgba(100,136,186,.14) 1px, transparent 1px)',
                      backgroundSize: '16.6667% 100%',
                    }}
                  >
                    <div
                      className={`absolute inset-y-0 flex items-center justify-center px-2 text-[9px] font-semibold text-white min-w-0 ${roundedClass}`}
                      style={{
                        left: `${geom.leftPct}%`,
                        width: `${geom.widthPct}%`,
                        backgroundColor: activity.color,
                      }}
                    >
                      <span className="truncate min-w-0 flex items-center justify-center gap-1">
                        {isClippedLeft && (
                          <span
                            className="shrink-0 rounded bg-black/25 dark:bg-black/40 px-1 py-0.5 text-[8px] font-mono leading-none text-white"
                            title={`Inició antes de ${currentYear}`}
                          >
                            ◀
                          </span>
                        )}
                        <span className="truncate">{activity.period}</span>
                        {isClippedRight && (
                          <span
                            className="shrink-0 rounded bg-black/25 dark:bg-black/40 px-1 py-0.5 text-[8px] font-mono leading-none text-white"
                            title={`Continúa en el siguiente periodo`}
                          >
                            ▶
                          </span>
                        )}
                      </span>
                    </div>
                  </div>
                  <div className="pl-5">
                    <strong className="block text-right text-[10px]" style={{ color: activity.color }}>
                      {activity.progress}%
                    </strong>
                    <div className="mt-2 h-1 overflow-hidden rounded bg-slate-200 dark:bg-[#0d1117] midnight:bg-cyan-950">
                      <div
                        className="h-full"
                        style={{ width: `${activity.progress}%`, backgroundColor: activity.color }}
                      />
                    </div>
                  </div>
                </article>
              );
            })}
            {!activitiesList.length && (
              <p className="py-8 text-center text-xs text-slate-500 dark:text-slate-400 midnight:text-cyan-500/70">
                No hay actividades críticas registradas.
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
