import React, { useMemo, useState } from 'react';
import {
  Folder,
  CheckSquare,
  DollarSign,
  TrendingUp,
  Calendar,
  Plus,
  ArrowRight,
} from 'lucide-react';
import KpiCard from '../../components/common/KpiCard';
import Pagination from '../../components/common/Pagination';
import { cardClass } from '../../constants/themeClasses';
import { formatMoney } from '../../utils/format';
import { getBarGeometry, getRollingWindow, legacyMonthRangeToDates } from '../../utils/gantt';
import { useLanguage } from '../../context/LanguageContext';

export default function DashboardContent({
  portfolioData,
  strategicPlanningData,
  onNavigate,
  referenceDate = new Date(),
}) {
  const { t } = useLanguage();
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

  // Distribución reactiva de Salud del Portafolio
  const healthStats = useMemo(() => {
    let healthy = 0;
    let warning = 0;
    let critical = 0;
    let stale = 0;

    const today = new Date();

    projects.forEach((p) => {
      if (p.health) {
        const h = String(p.health).toUpperCase();
        if (h === 'HEALTHY') healthy++;
        else if (h === 'WARNING') warning++;
        else if (h === 'CRITICAL') critical++;
        else if (h === 'STALE') stale++;
        else healthy++;
        return;
      }

      const status = (p.status || '').toLowerCase();
      const progress = Number(p.progress) || 0;

      let expected = 0;
      if (p.startDate && p.endDate) {
        const s = new Date(p.startDate);
        const e = new Date(p.endDate);
        if (e > s) {
          const totalDays = Math.max(1, (e - s) / (1000 * 60 * 60 * 24));
          const elapsed = Math.max(0, Math.min(totalDays, (today - s) / (1000 * 60 * 60 * 24)));
          expected = Math.round((elapsed / totalDays) * 100);
        }
      }
      const gap = expected - progress;

      if (status === 'stale' || status === 'on_hold') {
        stale++;
      } else if (status === 'risk' || gap > 25) {
        critical++;
      } else if (status === 'paused' || gap > 10) {
        warning++;
      } else {
        healthy++;
      }
    });

    const total = projects.length || 0;
    const criticalStale = critical + stale;
    const healthyPct = total > 0 ? Math.round((healthy / total) * 100) : 0;
    const warningPct = total > 0 ? Math.round((warning / total) * 100) : 0;
    const criticalPct = total > 0 ? Math.max(0, 100 - healthyPct - warningPct) : 0;

    return {
      total,
      healthy,
      warning,
      critical,
      stale,
      criticalStale,
      healthyPct,
      warningPct,
      criticalPct,
    };
  }, [projects]);

  const [alertPage, setAlertPage] = useState(1);
  const ALERTS_PER_PAGE = 5;
  const totalAlertPages = Math.max(1, Math.ceil(alerts.length / ALERTS_PER_PAGE));
  const currentAlertPage = Math.min(alertPage, totalAlertPages);
  const paginatedAlerts = useMemo(() => {
    return alerts.slice((currentAlertPage - 1) * ALERTS_PER_PAGE, currentAlertPage * ALERTS_PER_PAGE);
  }, [alerts, currentAlertPage]);

  // Ventana móvil semestral (6 meses desde el mes actual o de referencia)
  const rolling = useMemo(
    () => getRollingWindow(referenceDate, 6, 0),
    [referenceDate]
  );
  const { windowStart, windowMonths, months } = rolling;
  const isSameYear = months[0].year === months[months.length - 1].year;
  const startMonthName = t(`months.${months[0].month}`, months[0].short);
  const endMonthName = t(`months.${months[months.length - 1].month}`, months[months.length - 1].short);
  const windowLabel = isSameYear
    ? `${startMonthName} – ${endMonthName} ${months[0].year}`
    : `${startMonthName} ${months[0].year} – ${endMonthName} ${months[months.length - 1].year}`;

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

  const kpiStats = useMemo(
    () => [
      {
        title: t('dashboard.kpiActiveProjects', 'PROYECTOS ACTIVOS'),
        value: String(activeProjects.length),
        badge: t('dashboard.kpiTotalProjects', '{count} en total', { count: projects.length }),
        badgeColor:
          'text-cyan-600 bg-cyan-500/10 dark:text-cyan-400 dark:bg-cyan-400/10 midnight:text-cyan-300 midnight:bg-cyan-900/40',
        icon: Folder,
        color: 'text-cyan-600 dark:text-cyan-400 midnight:text-cyan-300',
      },
      {
        title: t('dashboard.kpiPendingMilestones', 'HITOS PENDIENTES'),
        value: String(pendingMilestones.length),
        badge: t('dashboard.kpiTotalMilestones', '{count} en total', { count: milestones.length }),
        badgeColor:
          'text-cyan-600 bg-cyan-500/10 dark:text-cyan-400 dark:bg-cyan-400/10 midnight:text-cyan-300 midnight:bg-cyan-900/40',
        icon: CheckSquare,
        color: 'text-cyan-600 dark:text-cyan-400 midnight:text-cyan-300',
      },
      {
        title: t('dashboard.kpiTotalBudget', 'PRESUPUESTO TOTAL'),
        value: formatMoney(totalBudget),
        badge:
          projects.length > 0
            ? t('dashboard.kpiUsedBudget', '{amount} usado', { amount: formatMoney(usedBudget) })
            : t('dashboard.kpiZeroUsedBudget', '$0 usado'),
        badgeColor:
          'text-emerald-600 bg-emerald-500/10 dark:text-emerald-400 dark:bg-emerald-400/10 midnight:text-emerald-300 midnight:bg-emerald-950/40',
        icon: DollarSign,
        color: 'text-cyan-600 dark:text-cyan-400 midnight:text-cyan-300',
      },
      {
        title: t('dashboard.kpiAvgProgress', 'AVANCE PROMEDIO'),
        value: `${avgProgress}%`,
        badge:
          projects.length > 0
            ? t('dashboard.kpiPrjsCount', '{count} prjs', { count: projects.length })
            : t('dashboard.kpiNoData', 'Sin datos'),
        badgeColor:
          'text-emerald-600 bg-emerald-500/10 dark:text-emerald-400 dark:bg-emerald-400/10 midnight:text-emerald-300 midnight:bg-emerald-950/40',
        icon: TrendingUp,
        color: 'text-cyan-600 dark:text-cyan-400 midnight:text-cyan-300',
      },
    ],
    [
      t,
      activeProjects.length,
      projects.length,
      pendingMilestones.length,
      milestones.length,
      totalBudget,
      usedBudget,
      avgProgress,
    ]
  );

  return (
    <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 transition-colors duration-300 bg-slate-50 dark:bg-[#0d1117] midnight:bg-[#050B14]">
      <div className="flex flex-col gap-6 pb-8">
        {/* 1. Tarjetas Superiores */}
        <section aria-label={t('dashboard.executiveSummaryAria', 'Resumen ejecutivo de proyectos')} className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
          {kpiStats.map((stat, i) => (
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
                  {t('dashboard.projectCalendarTitle', 'Calendario de Proyectos ({windowLabel})', { windowLabel })}
                </h3>
                <p className="text-xs mt-1 text-slate-500 dark:text-gray-400 midnight:text-cyan-600">
                  {t('dashboard.projectCalendarSubtitle', 'Fases operativas críticas para los próximos 6 meses')}
                </p>
              </div>
              {onNavigate && (
                <button
                  type="button"
                  onClick={() => onNavigate('planning')}
                  className="text-xs px-3 py-1.5 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30 rounded-md hover:bg-cyan-500/25 transition-colors"
                >
                  {t('dashboard.viewPlanning', 'Ver Planificación')}
                </button>
              )}
            </div>

            <div className="relative overflow-x-auto">
              <div className="min-w-[600px]">
                <div className="flex text-xs mb-4 border-b pb-2 ml-[160px] text-slate-500 dark:text-gray-500 border-slate-200 dark:border-[#30363d] midnight:border-cyan-900/30">
                  {months.map((m) => (
                    <div key={m.key} className="flex-1 text-center font-medium">
                      <span>{t(`months.${m.month}`, m.short)}</span>
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
                      {t('dashboard.noProjectsInCalendar', 'No hay proyectos registrados en el calendario')}
                    </p>
                    <p className="mt-1">
                      {t('dashboard.createProjectToView', 'Crea un proyecto en el Portafolio para visualizar sus cronogramas aquí.')}
                    </p>
                    {onNavigate && (
                      <button
                        type="button"
                        onClick={() => onNavigate('portfolio')}
                        className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-500 midnight:bg-cyan-600 midnight:hover:bg-cyan-500"
                      >
                        <Plus size={14} /> {t('dashboard.goToPortfolio', 'Ir a Portafolio')}
                      </button>
                    )}
                  </div>
                ) : visibleProjects.length === 0 ? (
                  <div className="py-12 text-center text-xs text-slate-500 dark:text-slate-400 midnight:text-cyan-500/70">
                    <Calendar size={28} className="mx-auto mb-2 opacity-40" />
                    <p className="font-medium text-slate-700 dark:text-slate-300 midnight:text-cyan-100">
                      {t('dashboard.noActiveProjectsInWindow', 'Sin proyectos activos en esta ventana temporal')}
                    </p>
                    <p className="mt-1">
                      {t('dashboard.projectsOutsideWindow', 'Los proyectos registrados están programados fuera del periodo ({windowLabel}).', { windowLabel })}
                    </p>
                    {onNavigate && (
                      <button
                        type="button"
                        onClick={() => onNavigate('planning')}
                        className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-cyan-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-cyan-500"
                      >
                        {t('dashboard.viewAnnualPlanning', 'Ver Planificación Anual')}
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {visibleProjects.slice(0, 6).map((project, i) => {
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
                        <div key={project.id || i} className="flex items-center" aria-label={t('dashboard.projectScheduleAria', 'Cronograma de {name}', { name: project.name })}>
                          <div className="w-[160px] shrink-0 pr-3">
                            <p className="truncate text-sm font-medium text-slate-900 dark:text-white midnight:text-cyan-50">
                              {project.name}
                            </p>
                            <p className="truncate text-[11px] text-slate-500 dark:text-gray-400 midnight:text-cyan-600">
                              {project.area || t('dashboard.generalArea', 'General')}
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
                                    title={t('dashboard.startedBeforeWindow', 'Inició antes de esta ventana')}
                                  >
                                    ◀
                                  </span>
                                ) : (
                                  <span />
                                )}

                                <span className="truncate text-[9px] min-w-0 font-medium">
                                  {hasProgress ? `${progressVal}%` : t('dashboard.inProgress', 'En curso')}
                                </span>

                                {isClippedRight ? (
                                  <span
                                    className="shrink-0 rounded bg-black/30 px-1 py-0.2 text-[8px] font-mono leading-none"
                                    title={t('dashboard.continuesAfterWindow', 'Continúa después de esta ventana')}
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
                {visibleProjects.length > 6 && (
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-white/5 midnight:border-cyan-900/30 flex items-center justify-between text-xs text-slate-500 dark:text-gray-400 midnight:text-cyan-600">
                    <span>
                      {t('dashboard.showingOf', 'Mostrando {shown} de {total} proyectos', {
                        shown: Math.min(6, visibleProjects.length),
                        total: visibleProjects.length,
                      })}
                    </span>
                    {onNavigate && (
                      <button
                        type="button"
                        onClick={() => onNavigate('planning')}
                        className="text-cyan-600 dark:text-cyan-400 midnight:text-cyan-300 font-semibold hover:underline"
                      >
                        {t('dashboard.viewAllInPlanning', 'Ver todos en Planificación')} →
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Alertas Ruta Crítica */}
          <div className={`${cardClass} flex flex-col justify-between p-5 md:p-6`}>
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-lg text-slate-900 dark:text-white midnight:text-cyan-100">
                    {t('dashboard.criticalAlertsTitle', 'Alertas Ruta Crítica')}
                  </h3>
                  <p className="text-xs mt-0.5 text-slate-500 dark:text-gray-400 midnight:text-cyan-600">
                    {t('dashboard.criticalAlertsSubtitle', 'Proyectos desviados que requieren supervisión')}
                  </p>
                </div>
                {alerts.length > 0 && (
                  <span className="rounded-full bg-red-500/10 px-2.5 py-1 text-xs font-bold text-red-600 dark:text-red-400 border border-red-500/20">
                    {alerts.length}
                  </span>
                )}
              </div>

              {alerts.length === 0 ? (
                <div className="py-10 text-center text-xs text-slate-500 dark:text-slate-400 midnight:text-cyan-500/70">
                  <p className="font-semibold text-emerald-600 dark:text-emerald-400 midnight:text-emerald-300">
                    {t('dashboard.noCriticalAlerts', '✓ Sin alertas críticas')}
                  </p>
                  <p className="mt-1">
                    {projects.length === 0
                      ? t('dashboard.noProjectsRiskSupervision', 'No hay proyectos en curso que requieran supervisión de riesgo.')
                      : t('dashboard.allActiveProjectsNormal', 'Todos los proyectos activos operan con normalidad.')}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {paginatedAlerts.map((project, i) => (
                    <div
                      key={project.id || project.code || i}
                      className="flex justify-between items-center p-3.5 rounded-lg border transition-colors bg-slate-50 border-slate-200 dark:bg-[#0d1117] dark:border-[#30363d]/50 midnight:bg-cyan-950/30 midnight:border-cyan-800/20"
                    >
                      <div className="min-w-0 pr-2">
                        <p className="truncate text-sm font-medium text-slate-900 dark:text-white midnight:text-cyan-50">
                          {project.name}
                        </p>
                        <p className="truncate text-xs text-slate-500 dark:text-gray-400 midnight:text-cyan-600">
                          {project.area || t('dashboard.operativeArea', 'Operativo')}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-3">
                        <span className="text-[11px] px-2 py-1 rounded font-medium bg-red-500/10 text-red-600 dark:text-red-400">
                          {project.status === 'risk'
                            ? t('dashboard.statusRisk', 'En riesgo')
                            : t('dashboard.statusPaused', 'En pausa')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {alerts.length > ALERTS_PER_PAGE && (
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-[#30363d]/40 midnight:border-cyan-900/30">
                <Pagination
                  currentPage={currentAlertPage}
                  totalPages={totalAlertPages}
                  totalItems={alerts.length}
                  pageSize={ALERTS_PER_PAGE}
                  itemLabel={t('dashboard.alertsCountLabel', 'alertas')}
                  onPageChange={setAlertPage}
                  hideOnSinglePage={true}
                  className="w-full justify-between"
                />
              </div>
            )}
          </div>
        </div>

        {/* 3. Sección Inferior (Rendimiento y Presupuesto) */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Rendimiento por Equipo / Proyectos */}
          <div className={`xl:col-span-2 ${cardClass} p-5 md:p-6 flex flex-col justify-between`}>
            <div>
              <h3 className="font-semibold text-lg mb-4 text-slate-900 dark:text-white midnight:text-cyan-100">
                {t('dashboard.progressByProjectTitle', 'Avance por Proyecto')}
              </h3>
              {projects.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-500 dark:text-slate-400 midnight:text-cyan-500/70">
                  {t('dashboard.noProjectsForProgress', 'Sin proyectos registrados para calcular métricas de avance.')}
                </div>
              ) : (
                <div className="space-y-3.5">
                  {projects.slice(0, 6).map((project, i) => {
                    const colors = [
                      'bg-cyan-400',
                      'bg-green-500',
                      'bg-orange-500',
                      'bg-purple-500',
                      'bg-blue-500',
                      'bg-emerald-400',
                    ];
                    const color = colors[i % colors.length];
                    return (
                      <div
                        key={project.id || i}
                        className="flex items-center gap-4"
                      >
                        <div className="w-[160px] shrink-0 pr-3">
                          <p className="truncate text-sm font-medium text-slate-900 dark:text-white midnight:text-cyan-50">
                            {project.name}
                          </p>
                          <p className="truncate text-[11px] text-slate-500 dark:text-gray-400 midnight:text-cyan-600">
                            {project.area || t('dashboard.generalArea', 'General')}
                          </p>
                        </div>
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

            {projects.length > 6 && (
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-white/5 midnight:border-cyan-900/30 flex items-center justify-between text-xs text-slate-500 dark:text-gray-400 midnight:text-cyan-600">
                <span>
                  {t('dashboard.showingOf', 'Mostrando {shown} de {total} proyectos', {
                    shown: Math.min(6, projects.length),
                    total: projects.length,
                  })}
                </span>
                {onNavigate && (
                  <button
                    type="button"
                    onClick={() => onNavigate('portfolio')}
                    className="text-cyan-600 dark:text-cyan-400 midnight:text-cyan-300 font-semibold hover:underline"
                  >
                    {t('dashboard.viewAllInPortfolio', 'Ver todos en Portafolio')} →
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Salud del Portafolio */}
          <div className={`${cardClass} p-5 md:p-6 flex flex-col justify-between`}>
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-lg text-slate-900 dark:text-white midnight:text-cyan-100">
                  {t('dashboard.portfolioHealthTitle', 'Salud del Portafolio')}
                </h3>
                <span className="text-xs font-mono text-slate-500 dark:text-slate-400 midnight:text-cyan-500/80">
                  {t('dashboard.auditedProjectsCount', '{count} proyectos', { count: healthStats.total })}
                </span>
              </div>

              {/* Anillo de Distribución de Salud */}
              <div className="flex justify-center items-center py-2">
                <div
                  className="relative w-44 h-44 rounded-full flex items-center justify-center shadow-lg transition-all duration-300"
                  style={{
                    background:
                      healthStats.total > 0
                        ? `conic-gradient(#10b981 0% ${healthStats.healthyPct}%, #f59e0b ${healthStats.healthyPct}% ${healthStats.healthyPct + healthStats.warningPct}%, #f43f5e ${healthStats.healthyPct + healthStats.warningPct}% 100%)`
                        : 'conic-gradient(#64748b 0% 100%, #64748b 100% 100%)',
                  }}
                >
                  <div className="w-[116px] h-[116px] rounded-full flex flex-col items-center justify-center text-center transition-colors bg-white dark:bg-[#161b22] midnight:bg-[#0a1120]">
                    <span className="text-2xl font-bold text-slate-900 dark:text-white midnight:text-cyan-50">
                      {healthStats.healthyPct}%
                    </span>
                    <span className="text-xs mt-0.5 text-emerald-600 dark:text-emerald-400 midnight:text-emerald-300 font-medium">
                      {t('dashboard.portfolioHealthyRate', 'En Plazo')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Desglose de Estado de Salud */}
              <div className="flex flex-col gap-2 mt-4 text-xs">
                <div className="flex items-center justify-between text-slate-600 dark:text-slate-300 midnight:text-cyan-100">
                  <span className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                    {t('dashboard.healthHealthy', 'En Cronograma')}
                  </span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400 midnight:text-emerald-300">
                    {healthStats.healthy} <span className="text-[10px] text-slate-400 font-normal">({healthStats.healthyPct}%)</span>
                  </span>
                </div>

                <div className="flex items-center justify-between text-slate-600 dark:text-slate-300 midnight:text-cyan-100">
                  <span className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
                    {t('dashboard.healthWarning', 'En Advertencia')}
                  </span>
                  <span className="font-semibold text-amber-600 dark:text-amber-400 midnight:text-amber-300">
                    {healthStats.warning} <span className="text-[10px] text-slate-400 font-normal">({healthStats.warningPct}%)</span>
                  </span>
                </div>

                <div className="flex items-center justify-between text-slate-600 dark:text-slate-300 midnight:text-cyan-100">
                  <span className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0" />
                    {t('dashboard.healthCritical', 'Críticos / Desviados')}
                  </span>
                  <span className="font-semibold text-rose-600 dark:text-rose-400 midnight:text-rose-300">
                    {healthStats.criticalStale} <span className="text-[10px] text-slate-400 font-normal">({healthStats.criticalPct}%)</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Acción Ejecutiva: Ir a Auditoría */}
            <button
              type="button"
              onClick={() => onNavigate && onNavigate('project-audit')}
              className="mt-5 flex items-center justify-center gap-1.5 w-full py-2.5 px-3 rounded-lg border border-slate-200 dark:border-[#30363d] midnight:border-cyan-900/40 bg-slate-50 dark:bg-white/5 midnight:bg-cyan-950/30 text-xs font-semibold text-slate-700 dark:text-slate-200 midnight:text-cyan-100 hover:bg-slate-100 dark:hover:bg-white/10 midnight:hover:bg-cyan-900/40 transition-colors duration-200"
            >
              <span>{t('dashboard.goToAudit', 'Ver Auditoría Completa')}</span>
              <ArrowRight size={14} className="text-cyan-600 dark:text-cyan-400 midnight:text-cyan-400" />
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
