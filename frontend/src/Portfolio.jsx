import React, { useState } from 'react';
import { Cloud, ExternalLink } from 'lucide-react';

const projects = [
  {
    name: 'Torre Reforma',
    area: 'Edificaciones Comerciales',
    status: 'Activo',
    statusKey: 'active',
    statusClass: 'bg-blue-500/10 text-blue-400',
    progress: 78,
    barClass: 'bg-blue-500',
    used: '$936K',
    total: '$1.2M',
    term: 'Ene - Jun 2026',
    members: ['CM', 'AR', 'LG'],
  },
  {
    name: 'Puente Industrial',
    area: 'Infraestructura Vial',
    status: 'En Pausa',
    statusKey: 'paused',
    statusClass: 'bg-amber-500/10 text-amber-400',
    progress: 42,
    barClass: 'bg-amber-500',
    used: '$378K',
    total: '$900K',
    term: 'Feb - Ago 2026',
    members: ['AR', 'CM', 'JV'],
  },
  {
    name: 'Centro Comercial Norte',
    area: 'Retail & Ocio',
    status: 'Completado',
    statusKey: 'completed',
    statusClass: 'bg-slate-500/15 text-slate-300',
    progress: 100,
    barClass: 'bg-slate-300',
    used: '$1.5M',
    total: '$1.5M',
    term: 'Mar - Nov 2026',
    members: ['LG', 'CM', 'AR'],
  },
  {
    name: 'Hospital Regional',
    area: 'Equipamiento Social',
    status: 'En Riesgo',
    statusKey: 'risk',
    statusClass: 'bg-red-500/10 text-red-400',
    progress: 18,
    barClass: 'bg-red-500',
    used: '$220K',
    total: '$1.1M',
    term: 'May - Dic 2026',
    members: ['CM', 'JV', 'AR'],
  },
];

const filters = [
  { key: 'all', label: 'Todos' },
  { key: 'active', label: 'Activos' },
  { key: 'completed', label: 'Completados' },
  { key: 'paused', label: 'En Pausa' },
];

const changes = [
  { date: '24 Mar 2026', project: 'Torre Reforma', change: 'Ampliación de presupuesto fase cimentación de pilote a $200K', user: 'Carlos M.' },
  { date: '22 Mar 2026', project: 'Puente Industrial', change: 'Pausa indefinida por retraso de entrega de insumos estructurales', user: 'Ana R.' },
  { date: '20 Mar 2026', project: 'Hospital Regional', change: 'Establecido estado crítico por huelga de transporte', user: 'Carlos M.' },
  { date: '18 Mar 2026', project: 'Centro Comercial Norte', change: 'Hito completado con éxito: Limpieza de área', user: 'Lucía G.' },
  { date: '15 Mar 2026', project: 'Torre Reforma', change: 'Asignación del auditor externo Sr. Juan Montaño al proyecto', user: 'Carlos M.' },
];

function ProjectCard({ project }) {
  return (
    <article className="rounded-xl border border-blue-300/15 bg-[#111a2e] p-5 shadow-[0_14px_36px_rgba(0,0,0,0.12)]">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-white">{project.name}</h2>
          <p className="mt-1 text-[10px] text-slate-500">{project.area}</p>
        </div>
        <span className={`rounded px-2 py-1 text-[10px] font-semibold ${project.statusClass}`}>{project.status}</span>
      </header>

      <div className="mt-5">
        <div className="mb-2 flex justify-between text-[10px] text-slate-400">
          <span>Progreso General</span>
          <strong className="text-slate-200">{project.progress}%</strong>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-[#07101f]">
          <div className={`h-full rounded-full ${project.barClass}`} style={{ width: `${project.progress}%` }} />
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between border-b border-blue-200/10 pb-4">
        <div>
          <p className="text-[10px] text-slate-500">Presupuesto Usado / Total</p>
          <p className="mt-1 text-xs font-semibold text-slate-200">{project.used} <span className="px-1 text-slate-600">/</span> {project.total}</p>
        </div>
        <div className="flex -space-x-2" aria-label={`${project.members.length} integrantes`}>
          {project.members.map((member, index) => (
            <span
              key={`${member}-${index}`}
              className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-[#111a2e] bg-gradient-to-br from-slate-500 to-slate-800 text-[8px] font-bold text-white"
            >
              {member}
            </span>
          ))}
        </div>
      </div>

      <footer className="mt-4 flex items-center justify-between text-[10px] text-slate-500">
        <span>Plazo: {project.term}</span>
        <button type="button" aria-label={`Abrir ${project.name}`} className="text-blue-400 transition-colors hover:text-blue-300">
          <ExternalLink size={14} />
        </button>
      </footer>
    </article>
  );
}

export default function Portfolio() {
  const [activeFilter, setActiveFilter] = useState('all');
  const [syncing, setSyncing] = useState(false);

  const visibleProjects = activeFilter === 'all'
    ? projects
    : projects.filter((project) => project.statusKey === activeFilter);

  const handleSync = () => {
    setSyncing(true);
    window.setTimeout(() => setSyncing(false), 900);
  };

  return (
    <main className="flex-1 overflow-y-auto bg-[#080f1c] p-4 text-slate-100 md:p-6 lg:p-8">
      <div className="mx-auto flex w-full max-w-[1500px] flex-col gap-6 pb-8">
        <section className="flex flex-col gap-5">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white md:text-[28px]">Repositorio de Proyectos</h1>
            <p className="mt-1 text-sm text-slate-400">Vista consolidada de control presupuestal, estado de avance y dependencias directas</p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-2">
              {filters.map((filter) => {
                const isActive = activeFilter === filter.key;
                return (
                  <button
                    key={filter.key}
                    type="button"
                    onClick={() => setActiveFilter(filter.key)}
                    className={`rounded-lg border px-4 py-2 text-xs font-medium transition-colors ${
                      isActive
                        ? 'border-blue-500 bg-blue-500/10 text-blue-300'
                        : 'border-blue-200/10 bg-[#111a2e] text-slate-400 hover:border-blue-400/30 hover:text-white'
                    }`}
                  >
                    {filter.label}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={handleSync}
              disabled={syncing}
              className="flex items-center justify-center gap-2 self-start rounded-lg border border-blue-200/10 bg-[#111a2e] px-4 py-2 text-xs text-slate-300 transition-colors hover:border-blue-400/30 hover:text-white disabled:cursor-wait disabled:opacity-70 sm:self-auto"
            >
              <Cloud size={14} className={syncing ? 'animate-pulse text-blue-400' : ''} />
              {syncing ? 'Sincronizando...' : 'Sincronizar Drive'}
            </button>
          </div>
        </section>

        <section aria-live="polite">
          {visibleProjects.length > 0 ? (
            <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
              {visibleProjects.map((project) => <ProjectCard key={project.name} project={project} />)}
            </div>
          ) : (
            <div className="rounded-xl border border-blue-200/15 bg-[#111a2e] p-10 text-center text-sm text-slate-400">
              No hay proyectos en esta categoría.
            </div>
          )}
        </section>

        <section className="overflow-hidden rounded-xl border border-blue-300/15 bg-[#111a2e] p-5 shadow-[0_14px_36px_rgba(0,0,0,0.12)] md:p-6">
          <h2 className="text-base font-semibold text-white">Historial de Cambios Reciente</h2>
          <p className="mt-1 text-[10px] text-slate-500">Últimas modificaciones de presupuestos y reasignación de hitos</p>

          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[820px] border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-blue-200/10 text-[10px] text-slate-500">
                  <th className="px-3 py-3 font-medium">Fecha</th>
                  <th className="px-3 py-3 font-medium">Proyecto</th>
                  <th className="px-3 py-3 font-medium">Cambio</th>
                  <th className="px-3 py-3 text-right font-medium">Usuario</th>
                </tr>
              </thead>
              <tbody>
                {changes.map((change) => (
                  <tr key={`${change.date}-${change.project}`} className="border-b border-blue-200/10 last:border-0">
                    <td className="whitespace-nowrap px-3 py-3 font-mono text-slate-300">{change.date}</td>
                    <td className="whitespace-nowrap px-3 py-3 font-medium text-blue-400">{change.project}</td>
                    <td className="px-3 py-3 text-slate-400">{change.change}</td>
                    <td className="whitespace-nowrap px-3 py-3 text-right text-slate-300">{change.user}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
