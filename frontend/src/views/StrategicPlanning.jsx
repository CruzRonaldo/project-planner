import React from 'react';

const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

const projects = [
  {
    name: 'Torre Reforma',
    area: 'Edificaciones Comerciales',
    period: 'Ene - Jun (6 Meses)',
    start: 1,
    duration: 6,
    color: '#24559a',
  },
  {
    name: 'Puente Industrial',
    area: 'Infraestructura Vial',
    period: 'Feb - Ago (7 Meses)',
    start: 2,
    duration: 7,
    color: '#2bc55f',
  },
  {
    name: 'Centro Comercial Norte',
    area: 'Retail & Ocio',
    period: 'Mar - Nov (9 Meses)',
    start: 3,
    duration: 9,
    color: '#a679ed',
  },
  {
    name: 'Residencial Las Palmas',
    area: 'Vivienda Multifamiliar',
    period: 'Abr - Sep (6 Meses)',
    start: 4,
    duration: 6,
    color: '#568fdf',
  },
  {
    name: 'Hospital Regional',
    area: 'Equipamiento Social',
    period: 'May - Dic (8 Meses)',
    start: 5,
    duration: 8,
    color: '#ff9800',
  },
  {
    name: 'Nave Industrial',
    area: 'Logística & Producción',
    period: 'Jul - Dic (6 Meses)',
    start: 7,
    duration: 6,
    color: '#2bc55f',
  },
];

const milestones = [
  { title: 'Entrega Cimentación', date: 'Programado para el 15 Mar', status: 'Completado', badge: 'bg-emerald-500/10 text-emerald-400' },
  { title: 'Revisión Estructural', date: 'Programado para el 30 May', status: 'Próximo', badge: 'bg-blue-500/10 text-blue-400' },
  { title: 'Inauguración Fase 1', date: 'Programado para el 15 Jul', status: 'Pendiente', badge: 'bg-amber-500/10 text-amber-400' },
  { title: 'Auditoría Presupuestal', date: 'Programado para el 01 Sep', status: 'Pendiente', badge: 'bg-slate-700/50 text-slate-400' },
  { title: 'Cierre Anual', date: 'Programado para el 15 Dic', status: 'Pendiente', badge: 'bg-slate-700/50 text-slate-400' },
];

export default function StrategicPlanning() {
  return (
    <main className="flex-1 overflow-y-auto bg-[#0b1628] p-4 text-slate-100 md:p-6 lg:p-8">
      <div className="mx-auto flex w-full max-w-[1500px] flex-col gap-6 pb-8">
        <section className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white md:text-[28px]">Calendario Maestro 2026</h1>
            <p className="mt-1 text-sm text-slate-400">Planificación de ruta crítica y cronograma de infraestructura anual</p>
          </div>

          <label className="flex items-center gap-3 self-start rounded-lg border border-blue-400/25 bg-blue-500/10 px-3 py-2 text-xs font-medium text-blue-300">
            <span>Año</span>
            <select
              defaultValue="2026"
              aria-label="Seleccionar año"
              className="cursor-pointer bg-transparent text-blue-300 outline-none"
            >
              <option className="bg-[#111f36]" value="2025">2025</option>
              <option className="bg-[#111f36]" value="2026">2026</option>
              <option className="bg-[#111f36]" value="2027">2027</option>
            </select>
          </label>
        </section>

        <section className="overflow-hidden rounded-2xl border border-blue-300/20 bg-[#111f36] shadow-[0_18px_45px_rgba(0,0,0,0.12)]">
          <div className="overflow-x-auto p-5 md:p-6">
            <div className="min-w-[820px]">
              <div className="grid grid-cols-[220px_1fr] border-b border-blue-200/20 pb-3">
                <div />
                <div className="grid grid-cols-12">
                  {months.map((month) => (
                    <span key={month} className="text-center text-[11px] font-medium text-slate-400">{month}</span>
                  ))}
                </div>
              </div>

              <div className="space-y-4 pt-4">
                {projects.map((project) => (
                  <div key={project.name} className="grid min-h-11 grid-cols-[220px_1fr] items-center">
                    <div className="pr-5">
                      <p className="text-sm font-semibold text-slate-100">{project.name}</p>
                      <p className="mt-0.5 text-[10px] text-slate-500">{project.area}</p>
                    </div>

                    <div
                      className="relative h-8 rounded-md"
                      style={{
                        backgroundImage: 'linear-gradient(to right, rgba(100, 136, 186, .12) 1px, transparent 1px)',
                        backgroundSize: '8.333333% 100%',
                      }}
                    >
                      <div
                        className="absolute top-0 flex h-8 items-center rounded-md px-3 text-[10px] font-bold text-white shadow-sm"
                        style={{
                          left: `${((project.start - 1) / 12) * 100}%`,
                          width: `${(project.duration / 12) * 100}%`,
                          backgroundColor: project.color,
                        }}
                      >
                        <span className="truncate">{project.period}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
          <section className="rounded-2xl border border-blue-300/20 bg-[#111f36] p-5 shadow-[0_18px_45px_rgba(0,0,0,0.12)] md:p-6 xl:col-span-3">
            <h2 className="mb-5 text-base font-semibold text-white">Hitos Globales</h2>
            <div className="space-y-2.5">
              {milestones.map((milestone) => (
                <article key={milestone.title} className="flex items-center justify-between gap-4 rounded-lg border border-blue-200/15 bg-[#0b182c] px-4 py-3">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-100">{milestone.title}</h3>
                    <p className="mt-0.5 text-[10px] text-slate-500">{milestone.date}</p>
                  </div>
                  <span className={`shrink-0 rounded px-2 py-1 text-[10px] font-semibold ${milestone.badge}`}>{milestone.status}</span>
                </article>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-blue-300/20 bg-[#111f36] p-5 shadow-[0_18px_45px_rgba(0,0,0,0.12)] md:p-6 xl:col-span-2">
            <h2 className="text-base font-semibold text-white">Control Presupuestario</h2>

            <div className="flex justify-center py-5">
              <div
                className="flex h-36 w-36 items-center justify-center rounded-full"
                style={{ background: 'conic-gradient(#3978c6 0 55%, #244d86 55% 85%, #263b59 85% 100%)' }}
              >
                <div className="flex h-[94px] w-[94px] flex-col items-center justify-center rounded-full bg-[#111f36]">
                  <strong className="text-xl text-white">$4.2M</strong>
                  <span className="mt-1 text-[10px] text-slate-500">Presupuesto</span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 border-b border-blue-200/15 pb-5 text-[10px] text-slate-400">
              <span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-sm bg-[#263b59]" /> Disponible (55%)</span>
              <span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-sm bg-[#3978c6]" /> Ejecutado (30%)</span>
              <span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-sm bg-[#244d86]" /> Comprometido (15%)</span>
            </div>

            <div className="mt-5 grid grid-cols-3 gap-3">
              <div>
                <p className="text-[10px] text-slate-500">Total</p>
                <strong className="mt-1 block text-sm text-white">$4.2M</strong>
              </div>
              <div>
                <p className="text-[10px] text-slate-500">Ejecutado</p>
                <strong className="mt-1 block text-sm text-emerald-400">$1.8M</strong>
              </div>
              <div>
                <p className="text-[10px] text-slate-500">Disponible</p>
                <strong className="mt-1 block text-sm text-blue-400">$2.4M</strong>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
