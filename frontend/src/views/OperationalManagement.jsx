import React from 'react';
import {
  Activity,
  AlertCircle,
  CheckCircle2,
  ClipboardList,
  Plus,
  TrendingUp,
} from 'lucide-react';

const statistics = [
  {
    title: 'Tareas en progreso',
    value: '18',
    badge: '+4 hoy',
    badgeClass: 'bg-blue-500/15 text-blue-400',
    iconClass: 'bg-blue-500/15 text-blue-400',
    icon: Activity,
  },
  {
    title: 'Tareas completadas',
    value: '142',
    badge: '92% Rate',
    badgeClass: 'bg-emerald-500/15 text-emerald-400',
    iconClass: 'bg-blue-500/15 text-blue-400',
    icon: CheckCircle2,
  },
  {
    title: 'Incidencias abiertas',
    value: '3',
    badge: '1 crítica',
    badgeClass: 'bg-red-500/15 text-red-400',
    iconClass: 'bg-blue-500/15 text-blue-400',
    icon: AlertCircle,
  },
  {
    title: 'Eficiencia operativa',
    value: '94.2%',
    badge: '+1.5%',
    badgeClass: 'bg-emerald-500/15 text-emerald-400',
    iconClass: 'bg-blue-500/15 text-blue-400',
    icon: TrendingUp,
  },
];

const activities = [
  {
    name: 'Cimentación Pilotes',
    project: 'Viaducto Elevado',
    period: 'Ene - Mar (85% completado)',
    left: '0%',
    width: '48%',
    color: 'bg-[#28599a]',
    textColor: 'text-white',
  },
  {
    name: 'Montaje Estructura',
    project: 'Torre Reforma',
    period: 'Feb - May (60% completado)',
    left: '18%',
    width: '58%',
    color: 'bg-emerald-500',
    textColor: 'text-slate-950',
  },
  {
    name: 'Tender Red Eléctrica',
    project: 'Subestación Eléctrica',
    period: 'Mar - Jun (20% completado)',
    left: '35%',
    width: '62%',
    color: 'bg-violet-400',
    textColor: 'text-slate-950',
  },
];

const workOrders = [
  {
    id: '#104',
    project: 'Torre Reforma',
    type: 'Inspección',
    responsible: 'Sofía Torres',
    priority: 'Alta',
    priorityClass: 'text-red-400',
    status: 'En progreso',
    statusClass: 'bg-amber-500/15 text-amber-400',
  },
  {
    id: '#105',
    project: 'Puente Vial',
    type: 'Mantenimiento',
    responsible: 'Alejandro Ruiz',
    priority: 'Media',
    priorityClass: 'text-amber-400',
    status: 'Completada',
    statusClass: 'bg-emerald-500/15 text-emerald-400',
  },
  {
    id: '#106',
    project: 'Terminal B',
    type: 'Construcción',
    responsible: 'Mateo Fernández',
    priority: 'Baja',
    priorityClass: 'text-slate-400',
    status: 'Pendiente',
    statusClass: 'bg-slate-500/15 text-slate-300',
  },
];

const alerts = [
  {
    title: 'Retraso en Pilotaje estructural',
    description: 'Puente Industrial · Hace 1 h',
    color: 'bg-red-500',
  },
  {
    title: 'Pendiente aprobación de planos MEP',
    description: 'Subestación Eléctrica · Hace 4 h',
    color: 'bg-amber-500',
  },
];

const qualityChecks = [
  {
    name: 'Prueba de resistencia concreto',
    status: 'Aprobado',
    statusClass: 'bg-emerald-500/15 text-emerald-400',
  },
  {
    name: 'Inspección de soldadura de acero',
    status: 'Aprobado',
    statusClass: 'bg-emerald-500/15 text-emerald-400',
  },
  {
    name: 'Certificación de aislamiento cables',
    status: 'Pendiente',
    statusClass: 'bg-slate-500/15 text-slate-300',
  },
];

export default function OperationalManagement() {
  return (
    <main className="flex-1 overflow-y-auto bg-[#09172a] p-4 text-slate-100 md:p-6 lg:p-8">
      <div className="mx-auto w-full max-w-[1500px] pb-8">
        {/* Encabezado */}
        <section className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white md:text-[28px]">
              Gestión Operativa de Campo
            </h1>

            <p className="mt-1 text-sm text-slate-400">
              Control de tareas activas, órdenes de trabajo críticas y
              verificación de aseguramiento de calidad
            </p>
          </div>

          <button
            type="button"
            className="flex items-center justify-center gap-2 self-start rounded-lg border border-blue-400/25 bg-[#101f3a] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:border-blue-400/50 hover:bg-[#162a4c]"
          >
            <Plus size={16} />

            Nueva orden
          </button>
        </section>

        {/* Tarjetas estadísticas */}
        <section className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 2xl:grid-cols-4">
          {statistics.map((statistic) => {
            const Icon = statistic.icon;

            return (
              <article
                key={statistic.title}
                className="rounded-xl border border-blue-400/25 bg-[#101f3a] p-5 shadow-[0_14px_32px_rgba(1,8,20,0.16)]"
              >
                <header className="flex items-center justify-between gap-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                    {statistic.title}
                  </p>

                  <div
                    className={`rounded-lg p-2 ${statistic.iconClass}`}
                  >
                    <Icon size={18} />
                  </div>
                </header>

                <div className="mt-4 flex items-end justify-between gap-4">
                  <strong className="text-3xl font-bold text-white">
                    {statistic.value}
                  </strong>

                  <span
                    className={`rounded px-2 py-1 text-[11px] font-semibold ${statistic.badgeClass}`}
                  >
                    {statistic.badge}
                  </span>
                </div>
              </article>
            );
          })}
        </section>

        {/* Cronograma */}
        <section className="mt-6 rounded-xl border border-blue-400/25 bg-[#101f3a] p-5 shadow-[0_14px_32px_rgba(1,8,20,0.16)] md:p-6">
          <h2 className="text-lg font-semibold text-white">
            Cronograma de Actividades Críticas
          </h2>

          <p className="mt-1 text-xs text-slate-500">
            Seguimiento temporal y avance real de entregables clave de
            infraestructura
          </p>

          <div className="mt-6 overflow-x-auto">
            <div className="min-w-[780px]">
              {/* Meses */}
              <div className="grid grid-cols-[210px_1fr] border-b border-blue-300/20 pb-3">
                <div />

                <div className="grid grid-cols-6">
                  {['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'].map(
                    (month) => (
                      <span
                        key={month}
                        className="text-center text-[11px] font-medium text-slate-400"
                      >
                        {month}
                      </span>
                    ),
                  )}
                </div>
              </div>

              {/* Actividades */}
              <div className="space-y-5 pt-5">
                {activities.map((activity) => (
                  <article
                    key={activity.name}
                    className="grid min-h-11 grid-cols-[210px_1fr] items-center"
                  >
                    <div className="pr-5">
                      <h3 className="text-sm font-semibold text-slate-100">
                        {activity.name}
                      </h3>

                      <p className="mt-0.5 text-[10px] text-slate-500">
                        {activity.project}
                      </p>
                    </div>

                    <div
                      className="relative h-8 rounded-md"
                      style={{
                        backgroundImage:
                          'linear-gradient(to right, rgba(100,136,186,.13) 1px, transparent 1px)',
                        backgroundSize: '16.666666% 100%',
                      }}
                    >
                      <div
                        className={`absolute top-0 flex h-8 items-center rounded-md px-3 text-[10px] font-bold shadow-sm ${activity.color} ${activity.textColor}`}
                        style={{
                          left: activity.left,
                          width: activity.width,
                        }}
                      >
                        <span className="truncate">
                          {activity.period}
                        </span>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Sección inferior */}
        <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.7fr)_minmax(300px,1fr)]">
          {/* Tabla de órdenes */}
          <section className="overflow-hidden rounded-xl border border-blue-400/25 bg-[#101f3a] p-5 shadow-[0_14px_32px_rgba(1,8,20,0.16)] md:p-6">
            <header className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-lg font-semibold text-white">
                Órdenes de Trabajo Activas
              </h2>

              <p className="text-xs text-slate-500">
                Últimas órdenes de operación
              </p>
            </header>

            <div className="mt-5 overflow-x-auto">
              <table className="w-full min-w-[700px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-blue-300/20 text-[11px] text-slate-500">
                    <th className="px-3 py-3 font-medium">ID</th>
                    <th className="px-3 py-3 font-medium">Proyecto</th>
                    <th className="px-3 py-3 font-medium">Tipo</th>
                    <th className="px-3 py-3 font-medium">
                      Responsable
                    </th>
                    <th className="px-3 py-3 font-medium">
                      Prioridad
                    </th>
                    <th className="px-3 py-3 text-right font-medium">
                      Estado
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {workOrders.map((order) => (
                    <tr
                      key={order.id}
                      className="border-b border-blue-300/15 last:border-0"
                    >
                      <td className="whitespace-nowrap px-3 py-4 font-mono text-xs text-slate-300">
                        {order.id}
                      </td>

                      <td className="whitespace-nowrap px-3 py-4 text-xs font-semibold text-blue-400">
                        {order.project}
                      </td>

                      <td className="whitespace-nowrap px-3 py-4 text-xs text-slate-400">
                        {order.type}
                      </td>

                      <td className="px-3 py-4 text-xs text-slate-300">
                        {order.responsible}
                      </td>

                      <td
                        className={`whitespace-nowrap px-3 py-4 text-xs font-semibold ${order.priorityClass}`}
                      >
                        {order.priority}
                      </td>

                      <td className="whitespace-nowrap px-3 py-4 text-right">
                        <span
                          className={`rounded px-2 py-1 text-[10px] font-semibold ${order.statusClass}`}
                        >
                          {order.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Panel derecho */}
          <aside className="flex flex-col gap-6">
            {/* Alertas */}
            <section className="rounded-xl border border-blue-400/25 bg-[#101f3a] p-5 shadow-[0_14px_32px_rgba(1,8,20,0.16)]">
              <h2 className="text-lg font-semibold text-white">
                Alertas Críticas de Operación
              </h2>

              <div className="mt-4 space-y-3">
                {alerts.map((alert) => (
                  <article
                    key={alert.title}
                    className="flex items-start gap-3 rounded-lg border border-blue-400/25 bg-[#081629] p-4"
                  >
                    <span
                      className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${alert.color}`}
                    />

                    <div>
                      <h3 className="text-sm font-semibold text-slate-100">
                        {alert.title}
                      </h3>

                      <p className="mt-1 text-[11px] text-slate-500">
                        {alert.description}
                      </p>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            {/* Calidad */}
            <section className="rounded-xl border border-blue-400/25 bg-[#101f3a] p-5 shadow-[0_14px_32px_rgba(1,8,20,0.16)]">
              <h2 className="text-lg font-semibold text-white">
                Aseguramiento de Calidad
              </h2>

              <div className="mt-4 space-y-4">
                {qualityChecks.map((check) => (
                  <article
                    key={check.name}
                    className="flex items-center justify-between gap-4"
                  >
                    <p className="text-xs text-slate-300">
                      {check.name}
                    </p>

                    <span
                      className={`shrink-0 rounded px-2 py-1 text-[10px] font-semibold ${check.statusClass}`}
                    >
                      {check.status}
                    </span>
                  </article>
                ))}
              </div>
            </section>

            {/* Resumen adicional */}
            <section className="rounded-xl border border-blue-400/25 bg-gradient-to-r from-blue-600/20 to-cyan-500/10 p-5">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-blue-500/15 p-2 text-blue-400">
                  <ClipboardList size={20} />
                </div>

                <div>
                  <h2 className="text-sm font-semibold text-white">
                    Operación actualizada
                  </h2>

                  <p className="mt-1 text-[11px] text-slate-400">
                    Última sincronización realizada hace 5 minutos
                  </p>
                </div>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}