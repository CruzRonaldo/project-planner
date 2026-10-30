import React, { useMemo } from 'react';
import {
  Folder,
  CheckSquare,
  DollarSign,
  TrendingUp,
  Calendar,
  Plus,
} from 'lucide-react';
import KpiCard from '../../components/common/KpiCard';
import { cardClass } from '../../constants/themeClasses';
import { formatMoney } from '../../utils/format';
import { getBarGeometry, getRollingWindow, legacyMonthRangeToDates } from '../../utils/gantt';

export default function DashboardContent({
  portfolioData,
  strategicPlanningData,
  onNavigate,
  referenceDate = new Date(),
}) {
  const projects = portfolioData?.projects || [];
  const milestones = strategicPlanningData?.milestones || [];

  const activeProjects = projects.filter((p) => p.status === 'active');
  const pendingMilestones = milestones.filter(
    (m) => m.status === 'pending' || m.status === 'upcoming'
  );
  const totalBudget = projects.reduce(
    (acc, p) => acc + (Number(p.totalBudget) || Number(p.budget) || 0),
    0
  );
  const usedBudget = projects.reduce(
    (acc, p) => acc + (Number(p.usedBudget) || 0),
    0
  );
  const avgProgress =
    projects.length > 0
      ? Math.round(
          projects.reduce((acc, p) => acc + (Number(p.progress) || 0), 0) /
            projects.length
        )
      : 0;



  // Alertas de proyectos en riesgo o pausados
  const alerts = projects.filter(
    (p) => p.status === 'risk' || p.status === 'paused'
  );

  // Ventana móvil semestral (6 meses desde el mes actual o de referencia)
  const rolling = useMemo(
    () => getRollingWindow(referenceDate, 6, 0),
    [referenceDate]
  );
  const { windowStart, windowMonths, months } = rolling;
  const isSameYear = months[0].year === months[months.length - 1].year;
  const windowLabel = isSameYear
    ? `${months[0].short} – ${months[months.length - 1].short} ${months[0].year}`
    : `${months[0].short} ${months[0].year} – ${months[months.length - 1].short} ${months[months.length - 1].year}`;

  const colors = [
    '#0ea5e9',
    '#10b981',
    '#f59e0b',
    '#8b5cf6',
    '#3b82f6',
  ];

  const visibleProjects = useMemo(() => {
    return projects
      .map((project, idx) => {
        const sDate = project.startDate || project.start_date;
        const eDate = project.endDate || project.end_date;
        let dates = { startDate: sDate, endDate: eDate };
        if (!dates.startDate || !dates.endDate) {
          dates = legacyMonthRangeToDates(project.start, project.duration, months[0].year);
        }

        const geom = getBarGeometry({
          startDate: dates.startDate,
          endDate: dates.endDate,
          windowStart,
          windowMonths,
        });

        if (!geom) return null;

        const barColor = project.color || colors[idx % colors.length];

        return {
          ...project,
          geom,
          barColor,
        };
      })
      .filter(Boolean);
  }, [projects, windowStart, windowMonths, months]);

  return (
    <main className="flex-1 overflow-y-auto p-4 md:p-6 transition-colors duration-300 bg-slate-50 dark:bg-[#0d1117] midnight:bg-[#050B14]">
      <div className="flex flex-col gap-6 pb-8">
        {/* 1. Tarjetas Superiores */}
        <section aria-label="Resumen ejecutivo de proyectos" className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
          {[
            {
              title: 'PROYECTOS ACTIVOS',
              value: String(activeProjects.length),
              badge: `${projects.length} en total`,
              badgeColor:
                'text-cyan-600 bg-cyan-500/10 dark:text-cyan-400 dark:bg-cyan-400/10 midnight:text-cyan-300 midnight:bg-cyan-900/40',
              icon: Folder,
              color: 'text-cyan-600 dark:text-cyan-400 midnight:text-cyan-300',
            },
            {
              title: 'HITOS PENDIENTES',
              value: String(pendingMilestones.length),
              badge: `${milestones.length} en total`,
              badgeColor:
                'text-cyan-600 bg-cyan-500/10 dark:text-cyan-400 dark:bg-cyan-400/10 midnight:text-cyan-300 midnight:bg-cyan-900/40',
              icon: CheckSquare,
              color: 'text-cyan-600 dark:text-cyan-400 midnight:text-cyan-300',
            },
            {
              title: 'PRESUPUESTO TOTAL',
              value: formatMoney(totalBudget),
              badge:
                projects.length > 0
                  ? `${formatMoney(usedBudget)} usado`
                  : '$0 usado',
              badgeColor:
                'text-emerald-600 bg-emerald-500/10 dark:text-emerald-400 dark:bg-emerald-400/10 midnight:text-emerald-300 midnight:bg-emerald-950/40',
              icon: DollarSign,
              color: 'text-cyan-600 dark:text-cyan-400 midnight:text-cyan-300',
            },
            {
              title: 'AVANCE PROMEDIO',
              value: `${avgProgress}%`,
              badge: projects.length > 0 ? `${projects.length} prjs` : 'Sin datos',
              badgeColor:
                'text-emerald-600 bg-emerald-500/10 dark:text-emerald-400 dark:bg-emerald-400/10 midnight:text-emerald-300 midnight:bg-emerald-950/40',
              icon: TrendingUp,
              color: 'text-cyan-600 dark:text-cyan-400 midnight:text-cyan-300',
            },
          ].map((stat, i) => (
            <KpiCard
              key={stat.title || i}
              title={stat.title}
              value={stat.value}
              badge={stat.badge}
              badgeClass={stat.badgeColor}
              icon={stat.icon}
              iconColor={stat.color}
            />
          ))}
        </section>

        {/* 2. Sección Media (Gantt y Alertas) */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Calendario Gantt */}
          <div className={`xl:col-span-2 ${cardClass} p-5 md:p-6`}>
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="font-semibold text-lg text-slate-900 dark:text-white midnight:text-cyan-100">
                  Calendario de Proyectos ({windowLabel})
                </h3>
                <p className="text-xs mt-1 text-slate-500 dark:text-gray-400 midnight:text-cyan-600">
                  Fases operativas críticas para los próximos 6 meses
                </p>
              </div>
              {onNavigate && (
                <button
                  type="button"
                  onClick={() => onNavigate('planning')}
                  className="text-xs px-3 py-1.5 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30 rounded-md hover:bg-cyan-500/25 transition-colors"
                >
                  Ver Planificación
                </button>
              )}
            </div>

            <div className="relative overflow-x-auto">
              <div className="min-w-[600px]">
                <div className="flex text-xs mb-4 border-b pb-2 ml-[160px] text-slate-500 dark:text-gray-500 border-slate-200 dark:border-[#30363d] midnight:border-cyan-900/30">
                  {months.map((m) => (
                    <div key={m.key} className="flex-1 text-center font-medium">
                      <span>{m.short}</span>
                      {m.year !== months[0].year && (
                        <span className="ml-0.5 text-[10px] opacity-75 font-mono">'{String(m.year).slice(2)}</span>
                      )}
                    </div>
                  ))}
                </div>

                {projects.length === 0 ? (
                  <div className="py-12 text-center text-xs text-slate-500 dark:text-slate-400 midnight:text-cyan-500/70">
                    <Calendar size={28} className="mx-auto mb-2 opacity-40" />
                    <p className="font-medium text-slate-700 dark:text-slate-300 midnight:text-cyan-100">
                      No hay proyectos registrados en el calendario
                    </p>
                    <p className="mt-1">
                      Crea un proyecto en el Portafolio para visualizar sus cronogramas aquí.
                    </p>
                    {onNavigate && (
                      <button
                        type="button"
                        onClick={() => onNavigate('portfolio')}
                        className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-500 midnight:bg-cyan-600 midnight:hover:bg-cyan-500"
                      >
                        <Plus size={14} /> Ir a Portafolio
                      </button>
                    )}
                  </div>
                ) : visibleProjects.length === 0 ? (
                  <div className="py-12 text-center text-xs text-slate-500 dark:text-slate-400 midnight:text-cyan-500/70">
                    <Calendar size={28} className="mx-auto mb-2 opacity-40" />
                    <p className="font-medium text-slate-700 dark:text-slate-300 midnight:text-cyan-100">
                      Sin proyectos activos en esta ventana temporal
                    </p>
                    <p className="mt-1">
                      Los proyectos registrados están programados fuera del periodo ({windowLabel}).
                    </p>
                    {onNavigate && (
                      <button
                        type="button"
                        onClick={() => onNavigate('planning')}
                        className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-cyan-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-cyan-500"
                      >
                        Ver Planificación Anual
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {visibleProjects.slice(0, 5).map((project, i) => {
                      const { geom, barColor } = project;
                      const isClippedLeft = Boolean(geom.clippedLeft);
                      const isClippedRight = Boolean(geom.clippedRight);

                      const roundedClass = isClippedLeft && isClippedRight
                        ? 'rounded-none border-x-2 border-dashed border-slate-800/40 dark:border-white/80 midnight:border-cyan-300/80'
                        : isClippedLeft
                          ? 'rounded-r-md rounded-l-none border-l-2 border-dashed border-slate-800/40 dark:border-white/80 midnight:border-cyan-300/80'
                          : isClippedRight
                            ? 'rounded-l-md rounded-r-none border-r-2 border-dashed border-slate-800/40 dark:border-white/80 midnight:border-cyan-300/80'
                            : 'rounded-md';

                      const hasProgress = project.progress !== undefined && project.progress !== null && !isNaN(Number(project.progress));
                      const progressVal = Math.min(100, Math.max(0, Number(project.progress) || 0));

                      return (
                        <div key={project.id || i} className="flex items-center" aria-label={`Cronograma de ${project.name}`}>
                          <div className="w-[160px] shrink-0 pr-3">
                            <p className="truncate text-sm font-medium text-slate-900 dark:text-white midnight:text-cyan-50">
                              {project.name}
                            </p>
                            <p className="truncate text-[11px] text-slate-500 dark:text-gray-400 midnight:text-cyan-600">
                              {project.area || 'General'}
                            </p>
                          </div>
                          <div className="flex-1 relative h-7 rounded bg-slate-100 dark:bg-[#0d1117] midnight:bg-cyan-950/50">
                            {/* Cuadrícula de 6 columnas */}
                            <div className="absolute inset-0 grid grid-cols-6 divide-x divide-slate-200/60 dark:divide-white/5 midnight:divide-cyan-900/20">
                              {Array.from({ length: 6 }).map((_, colIdx) => (
                                <div key={colIdx} className="h-full w-full" />
                              ))}
                            </div>

                            {/* Barra del proyecto con geometría calculada */}
                            <div
                              className={`absolute inset-y-0.5 flex items-center shadow-sm overflow-hidden min-w-0 ${roundedClass}`}
                              style={{
                                left: `${geom.leftPct}%`,
                                width: `${geom.widthPct}%`,
                                backgroundColor: barColor,
                              }}
                            >
                              {/* Relleno interno de avance */}
                              <div
                                className="absolute inset-y-0 left-0 bg-black/15 dark:bg-black/25 pointer-events-none"
                                style={{ width: `${progressVal}%` }}
                              />

                              {/* Texto y flechas de continuación */}
                              <div className="relative z-10 flex items-center justify-between w-full px-1.5 text-[10px] font-bold text-white min-w-0 gap-0.5">
                                {isClippedLeft ? (
                                  <span
                                    className="shrink-0 rounded bg-black/30 px-1 py-0.2 text-[8px] font-mono leading-none"
                                    title="Inició antes de esta ventana"
                                  >
                                    ◀
                                  </span>
                                ) : (
                                  <span />
                                )}

                                <span className="truncate text-[9px] min-w-0 font-medium">
                                  {hasProgress ? `${progressVal}%` : 'En curso'}
                                </span>

                                {isClippedRight ? (
                                  <span
                                    className="shrink-0 rounded bg-black/30 px-1 py-0.2 text-[8px] font-mono leading-none"
                                    title="Continúa después de esta ventana"
                                  >
                                    ▶
                                  </span>
                                ) : (
                                  <span />
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Alertas Ruta Crítica */}
          <div className={`${cardClass} p-5 md:p-6`}>
            <h3 className="font-semibold text-lg mb-6 text-slate-900 dark:text-white midnight:text-cyan-100">
              Alertas Ruta Crítica
            </h3>
            {alerts.length === 0 ? (
              <div className="py-10 text-center text-xs text-slate-500 dark:text-slate-400 midnight:text-cyan-500/70">
                <p className="font-semibold text-emerald-600 dark:text-emerald-400 midnight:text-emerald-300">
                  ✓ Sin alertas críticas
                </p>
                <p className="mt-1">
                  {projects.length === 0
                    ? 'No hay proyectos en curso que requieran supervisión de riesgo.'
                    : 'Todos los proyectos activos operan con normalidad.'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {alerts.map((project, i) => (
                  <div
                    key={project.id || i}
                    className="flex justify-between items-center p-3.5 rounded-lg border transition-colors bg-slate-50 border-slate-200 dark:bg-[#0d1117] dark:border-[#30363d]/50 midnight:bg-cyan-950/30 midnight:border-cyan-800/20"
                  >
                    <div className="min-w-0 pr-2">
                      <p className="truncate text-sm font-medium text-slate-900 dark:text-white midnight:text-cyan-50">
                        {project.name}
                      </p>
                      <p className="truncate text-xs text-slate-500 dark:text-gray-400 midnight:text-cyan-600">
                        {project.area || 'Operativo'}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <span className="text-[11px] px-2 py-1 rounded font-medium bg-red-500/10 text-red-600 dark:text-red-400">
                        {project.status === 'risk' ? 'En riesgo' : 'En pausa'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 3. Sección Inferior (Rendimiento y Presupuesto) */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Rendimiento por Equipo / Proyectos */}
          <div className={`xl:col-span-2 ${cardClass} p-5 md:p-6`}>
            <h3 className="font-semibold text-lg mb-6 text-slate-900 dark:text-white midnight:text-cyan-100">
              Avance por Proyecto
            </h3>
            {projects.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-500 dark:text-slate-400 midnight:text-cyan-500/70">
                Sin proyectos registrados para calcular métricas de avance.
              </div>
            ) : (
              <div className="space-y-6">
                {projects.slice(0, 4).map((project, i) => {
                  const colors = [
                    'bg-cyan-400',
                    'bg-green-500',
                    'bg-orange-500',
                    'bg-purple-500',
                  ];
                  const color = colors[i % colors.length];
                  return (
                    <div
                      key={project.id || i}
                      className="flex items-center gap-4"
                    >
                      <span className="w-36 truncate text-sm text-slate-600 dark:text-gray-300 midnight:text-cyan-200">
                        {project.name}
                      </span>
                      <div className="flex-1 h-2.5 rounded-full overflow-hidden bg-slate-200 dark:bg-[#0d1117] midnight:bg-cyan-950">
                        <div
                          className={`h-full ${color} rounded-full transition-all duration-500`}
                          style={{ width: `${project.progress || 0}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium w-12 text-right text-slate-900 dark:text-white midnight:text-cyan-50">
                        {project.progress || 0}%
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Control Presupuestario */}
          <div className={`${cardClass} p-5 md:p-6`}>
            <h3 className="font-semibold text-lg mb-6 text-slate-900 dark:text-white midnight:text-cyan-100">
              Control Presupuestario
            </h3>
            <div className="flex justify-center items-center py-2">
              <div
                className="relative w-40 h-40 rounded-full flex items-center justify-center shadow-lg"
                style={{
                  background:
                    totalBudget > 0
                      ? 'conic-gradient(#22d3ee 0% 55%, #22c55e 55% 85%, #f97316 85% 100%)'
                      : 'conic-gradient(#64748b 0% 100%, #64748b 100% 100%)',
                }}
              >
                <div className="w-[120px] h-[120px] rounded-full flex flex-col items-center justify-center text-center transition-colors bg-white dark:bg-[#161b22] midnight:bg-[#0a1120]">
                  <span className="text-2xl font-bold text-slate-900 dark:text-white midnight:text-cyan-50">
                    {formatMoney(totalBudget)}
                  </span>
                  <span className="text-xs mt-1 text-slate-500 dark:text-gray-400 midnight:text-cyan-600">
                    {totalBudget > 0 ? 'Asignado' : 'Sin asignar'}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex justify-center flex-wrap gap-4 mt-8 text-[11px] text-slate-500 dark:text-gray-400 midnight:text-cyan-400/80">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400"></span> Total: {formatMoney(totalBudget)}
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-green-500"></span> Usado: {formatMoney(usedBudget)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
