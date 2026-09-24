import React from 'react';
import {
  Folder,
  CheckSquare,
  DollarSign,
  TrendingUp,
  Calendar,
  Plus,
} from 'lucide-react';

export default function DashboardContent({
  portfolioData,
  strategicPlanningData,
  onNavigate,
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

  const formatMoney = (amount) => {
    if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`;
    if (amount >= 1_000) return `$${(amount / 1_000).toFixed(0)}K`;
    return `$${Number(amount || 0).toLocaleString()}`;
  };

  // Alertas de proyectos en riesgo o pausados
  const alerts = projects.filter(
    (p) => p.status === 'risk' || p.status === 'paused'
  );

  // Meses del primer semestre para la vista de Gantt
  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'];

  return (
    <main className="flex-1 overflow-y-auto p-4 md:p-6 transition-colors duration-300 bg-slate-50 dark:bg-[#0d1117] midnight:bg-[#050B14]">
      <div className="flex flex-col gap-6 pb-8">
        {/* 1. Tarjetas Superiores */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
          {[
            {
              title: 'PROYECTOS ACTIVOS',
              value: String(activeProjects.length),
              badge: `${projects.length} en total`,
              badgeColor:
                'text-cyan-600 bg-cyan-500/10 dark:text-cyan-400 dark:bg-cyan-400/10',
              icon: Folder,
              color: 'text-cyan-600 dark:text-cyan-400',
            },
            {
              title: 'HITOS PENDIENTES',
              value: String(pendingMilestones.length),
              badge: `${milestones.length} en total`,
              badgeColor:
                'text-cyan-600 bg-cyan-500/10 dark:text-cyan-400 dark:bg-cyan-400/10',
              icon: CheckSquare,
              color: 'text-cyan-600 dark:text-cyan-400',
            },
            {
              title: 'PRESUPUESTO TOTAL',
              value: formatMoney(totalBudget),
              badge:
                projects.length > 0
                  ? `${formatMoney(usedBudget)} usado`
                  : '$0 usado',
              badgeColor: 'text-green-600 bg-green-500/10 dark:text-green-400',
              icon: DollarSign,
              color: 'text-cyan-600 dark:text-cyan-400',
            },
            {
              title: 'AVANCE PROMEDIO',
              value: `${avgProgress}%`,
              badge: projects.length > 0 ? `${projects.length} prjs` : 'Sin datos',
              badgeColor: 'text-green-600 bg-green-500/10 dark:text-green-400',
              icon: TrendingUp,
              color: 'text-cyan-600 dark:text-cyan-400',
            },
          ].map((stat, i) => (
            <div
              key={i}
              className="border p-5 rounded-xl flex flex-col gap-4 shadow-sm transition-colors duration-300 bg-white border-slate-200 dark:bg-[#161b22] dark:border-[#30363d] midnight:bg-[#0a1120] midnight:border-cyan-900/30"
            >
              <div className="flex justify-between items-center text-[11px] font-bold tracking-wider text-slate-500 dark:text-gray-400 midnight:text-cyan-600">
                <span>{stat.title}</span>
                <div className="p-1.5 rounded-md border transition-colors bg-slate-100 border-slate-200 dark:bg-[#0d1117] dark:border-[#30363d] midnight:bg-cyan-950 midnight:border-cyan-800/40">
                  <stat.icon size={16} className={stat.color} />
                </div>
              </div>
              <div className="flex justify-between items-end">
                <h2 className="text-3xl font-bold text-slate-900 dark:text-white midnight:text-cyan-50">
                  {stat.value}
                </h2>
                <span
                  className={`text-xs px-2 py-1 rounded font-medium ${stat.badgeColor}`}
                >
                  {stat.badge}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* 2. Sección Media (Gantt y Alertas) */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Calendario Gantt */}
          <div className="xl:col-span-2 border rounded-xl p-5 md:p-6 shadow-sm transition-colors duration-300 bg-white border-slate-200 dark:bg-[#161b22] dark:border-[#30363d] midnight:bg-[#0a1120] midnight:border-cyan-900/30">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="font-semibold text-lg text-slate-900 dark:text-white midnight:text-cyan-100">
                  Calendario de Proyectos 2026
                </h3>
                <p className="text-xs mt-1 text-slate-500 dark:text-gray-400 midnight:text-cyan-600">
                  Fases operativas críticas por trimestre
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
                  {months.map((mes) => (
                    <div key={mes} className="flex-1 text-center">
                      {mes}
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
                ) : (
                  <div className="space-y-5">
                    {projects.slice(0, 5).map((project, i) => {
                      const colors = [
                        'bg-cyan-400',
                        'bg-green-500',
                        'bg-orange-500',
                        'bg-[#b388ff]',
                        'bg-blue-500',
                      ];
                      const bg = colors[i % colors.length];
                      return (
                        <div key={project.id || i} className="flex items-center">
                          <div className="w-[160px] shrink-0 pr-2">
                            <p className="truncate text-sm font-medium text-slate-900 dark:text-white midnight:text-cyan-50">
                              {project.name}
                            </p>
                            <p className="truncate text-[11px] text-slate-500 dark:text-gray-400 midnight:text-cyan-600">
                              {project.area || 'General'}
                            </p>
                          </div>
                          <div className="flex-1 relative h-7 rounded bg-slate-100 dark:bg-[#0d1117] midnight:bg-cyan-950/50">
                            <div
                              className={`absolute h-full ${bg} rounded flex items-center justify-center text-xs font-bold text-slate-900 px-2 shadow-sm whitespace-nowrap overflow-hidden`}
                              style={{
                                left: `${(i * 15) % 40}%`,
                                width: `${Math.max(30, project.progress || 40)}%`,
                              }}
                            >
                              {project.progress ? `${project.progress}%` : 'En curso'}
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
          <div className="border rounded-xl p-5 md:p-6 shadow-sm transition-colors duration-300 bg-white border-slate-200 dark:bg-[#161b22] dark:border-[#30363d] midnight:bg-[#0a1120] midnight:border-cyan-900/30">
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
          <div className="xl:col-span-2 border rounded-xl p-5 md:p-6 shadow-sm transition-colors duration-300 bg-white border-slate-200 dark:bg-[#161b22] dark:border-[#30363d] midnight:bg-[#0a1120] midnight:border-cyan-900/30">
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
          <div className="border rounded-xl p-5 md:p-6 shadow-sm transition-colors duration-300 bg-white border-slate-200 dark:bg-[#161b22] dark:border-[#30363d] midnight:bg-[#0a1120] midnight:border-cyan-900/30">
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
