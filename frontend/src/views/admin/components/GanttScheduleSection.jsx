import React from 'react';
import { SlidersHorizontal, Flag } from 'lucide-react';

export default function GanttScheduleSection({
  displayedProjects = [],
  months = [],
  milestones = [],
  canManage = false,
  headingClass = '',
  mutedClass = '',
  cardClass = '',
  onAdjustProject = () => {},
  onMilestoneClick = () => {},
  formatMilestoneDate = () => '',
}) {
  return (
    <section className={`${cardClass} overflow-hidden p-0 md:p-0 print:border print:border-slate-300 print:shadow-none print:bg-white avoid-break`}>
      <div className="overflow-x-auto p-5 md:p-6 print:p-3 print:overflow-visible">
        <div className="min-w-[820px] print:min-w-full">
          <div className="grid grid-cols-[220px_1fr] border-b border-slate-200 pb-3 transition-colors duration-300 dark:border-white/10 midnight:border-cyan-900/30">
            <div />
            <div className="grid grid-cols-12">
              {months.map((month) => (
                <span key={month} className={`text-center text-[11px] font-medium ${mutedClass}`}>{month}</span>
              ))}
            </div>
          </div>

          <div className="space-y-4 pt-4">
            {displayedProjects.length === 0 ? (
              <div className="py-10 text-center text-xs text-slate-500 dark:text-slate-400 midnight:text-cyan-500/70">
                No hay proyectos registrados en el calendario anual para la selección actual.
              </div>
            ) : (
              displayedProjects.map((project) => {
                const projectBudget = Number(project.totalBudget) || Number(project.budget) || 0;
                const isAbove100k = projectBudget > 100000;
                const projectMilestones = milestones.filter(
                  (m) => String(m.projectId) === String(project.id) || String(m.project) === String(project.id)
                );

                return (
                  <div key={project.name} className="grid min-h-12 grid-cols-[220px_1fr] items-center">
                    <div className="pr-5">
                      <div className="flex items-center gap-1.5">
                        <p className={`text-sm font-semibold truncate ${headingClass}`}>{project.name}</p>
                        {project.code && (
                          <span className="shrink-0 rounded bg-slate-100 px-1 py-0.5 font-mono text-[9px] text-slate-600 dark:bg-slate-800 dark:text-slate-400 midnight:bg-cyan-950 midnight:text-cyan-400">
                            {project.code}
                          </span>
                        )}
                      </div>
                      <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                        <p className={`text-[10px] ${mutedClass}`}>{project.area}</p>
                        {isAbove100k ? (
                          <span
                            className="inline-flex items-center rounded border border-amber-300 bg-amber-50 px-1.5 py-0.2 text-[8px] font-semibold text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300 midnight:border-amber-500/30 midnight:bg-amber-500/10 midnight:text-amber-300"
                            title="Presupuesto > $100k: Requiere revisión y dictamen por Comité Directivo"
                          >
                            Comité (&gt;$100k)
                          </span>
                        ) : (
                          <span
                            className="inline-flex items-center rounded border border-blue-200 bg-blue-50 px-1.5 py-0.2 text-[8px] font-semibold text-blue-700 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-300 midnight:border-cyan-500/30 midnight:bg-cyan-500/10 midnight:text-cyan-300"
                            title="Presupuesto ≤ $100k: Aprobación directa por Líder Técnico"
                          >
                            Líder (≤$100k)
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="relative h-9 rounded-md bg-slate-50 transition-colors duration-300 dark:bg-[#080f1b] midnight:bg-cyan-950/30">
                      {/* CUADRÍCULA DE LÍNEAS NATIVAS */}
                      <div className="absolute inset-0 grid grid-cols-12 divide-x divide-slate-200 transition-colors duration-300 dark:divide-white/5 midnight:divide-cyan-900/30">
                        {Array.from({ length: 12 }).map((_, i) => (
                          <div key={i} className="h-full w-full"></div>
                        ))}
                      </div>

                      {/* BARRA PRINCIPAL DEL PROYECTO */}
                      <div
                        className="absolute inset-y-0.5 flex items-center rounded-md px-3 text-[10px] font-bold text-white shadow-sm transition-all duration-300"
                        style={{
                          left: `${((project.start - 1) / 12) * 100}%`,
                          width: `${(project.duration / 12) * 100}%`,
                          backgroundColor: project.color,
                        }}
                      >
                        <span className="flex-1 truncate text-center">{project.period}</span>
                        {canManage && (
                          <button
                            type="button"
                            onClick={() => onAdjustProject(project.id)}
                            aria-label={`Ajustar calendario de ${project.name}`}
                            title="Ajustar calendario"
                            className="ml-2 shrink-0 rounded p-1 text-white/80 transition-colors hover:bg-black/15 hover:text-white no-print print:hidden"
                          >
                            <SlidersHorizontal size={11} />
                          </button>
                        )}
                      </div>

                      {/* HITOS ASOCIADOS EN EL CRONOGRAMA */}
                      {projectMilestones.map((m) => {
                        const mDate = new Date(`${m.targetDate}T00:00:00`);
                        const mMonth = !isNaN(mDate.getTime()) ? mDate.getMonth() + 1 : project.start;
                        const mDay = !isNaN(mDate.getTime()) ? mDate.getDate() : 15;
                        const leftPct = Math.min(98, Math.max(2, (((mMonth - 1) + (mDay / 31)) / 12) * 100));
                        const mStatus = (m.status || '').toLowerCase();
                        const isDone = mStatus === 'completed';
                        const isUp = mStatus === 'upcoming' || mStatus === 'in_progress';
                        const markerBg = isDone
                          ? 'bg-emerald-500 border-white text-white'
                          : isUp
                            ? 'bg-blue-500 border-white text-white'
                            : 'bg-amber-500 border-white text-white';

                        return (
                          <div
                            key={m.id}
                            className="group absolute -top-1.5 z-20 flex -translate-x-1/2 flex-col items-center cursor-pointer"
                            style={{ left: `${leftPct}%` }}
                            onClick={() => onMilestoneClick(m)}
                          >
                            <span
                              aria-label={`Hito: ${m.title}`}
                              className={`flex h-5 w-5 items-center justify-center rounded-full border-2 shadow-md transition-transform duration-150 group-hover:scale-125 ${markerBg}`}
                            >
                              <Flag size={9} className="fill-current" />
                            </span>
                            <div className="pointer-events-none absolute bottom-full mb-1.5 hidden flex-col items-center rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1 text-[10px] text-white shadow-xl transition-all group-hover:flex z-30 whitespace-nowrap dark:border-slate-600 dark:bg-slate-800">
                              <span className="font-semibold">{m.title}</span>
                              <span className="text-[9px] text-slate-300">{formatMilestoneDate(m.targetDate)}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
