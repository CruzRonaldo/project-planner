import React from 'react';
import { Folder, CheckSquare, DollarSign, TrendingUp } from 'lucide-react';

export default function DashboardContent() {
  return (
    <main className="flex-1 overflow-y-auto p-4 md:p-6">
      <div className="flex flex-col gap-6 pb-8">
        
        {/* 1. Tarjetas Superiores */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
          {[
            { title: 'PROYECTOS ACTIVOS', value: '12', badge: '+3', badgeColor: 'text-cyan-400 bg-cyan-400/10', icon: Folder, color: 'text-cyan-400' },
            { title: 'HITOS PENDIENTES', value: '28', badge: '-5', badgeColor: 'text-cyan-400 bg-cyan-400/10', icon: CheckSquare, color: 'text-cyan-400' },
            { title: 'PRESUPUESTO TOTAL', value: '$4.2M', badge: '+12%', badgeColor: 'text-green-400 bg-green-500/10', icon: DollarSign, color: 'text-cyan-400' },
            { title: 'OPTIMIZACIÓN PROMEDIO', value: '18%', badge: '+4%', badgeColor: 'text-green-400 bg-green-500/10', icon: TrendingUp, color: 'text-cyan-400' }
          ].map((stat, i) => (
            <div key={i} className="bg-[#161b22] border border-[#30363d] p-5 rounded-xl flex flex-col gap-4 shadow-sm">
              <div className="flex justify-between items-center text-[11px] text-gray-400 font-bold tracking-wider">
                <span>{stat.title}</span>
                <div className="p-1.5 bg-[#0d1117] rounded-md border border-[#30363d]">
                  <stat.icon size={16} className={stat.color} />
                </div>
              </div>
              <div className="flex justify-between items-end">
                <h2 className="text-3xl font-bold text-white">{stat.value}</h2>
                <span className={`text-xs px-2 py-1 rounded font-medium ${stat.badgeColor}`}>{stat.badge}</span>
              </div>
            </div>
          ))}
        </div>

        {/* 2. Sección Media (Gantt y Alertas) */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Calendario Gantt */}
          <div className="xl:col-span-2 bg-[#161b22] border border-[#30363d] rounded-xl p-5 md:p-6 shadow-sm">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="font-semibold text-lg text-white">Calendario de Proyectos 2026</h3>
                <p className="text-xs text-gray-400 mt-1">Fases operativas críticas por trimestre</p>
              </div>
              <button className="text-xs px-3 py-1.5 bg-cyan-400/10 text-cyan-400 border border-cyan-400/30 rounded-md hover:bg-cyan-400/20 transition-colors">Vista Semestral</button>
            </div>
            
            <div className="relative overflow-x-auto">
              <div className="min-w-[600px]">
                <div className="flex text-xs text-gray-500 mb-4 border-b border-[#30363d] pb-2 ml-[160px]">
                  {['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'].map((mes) => (
                    <div key={mes} className="flex-1 text-center">{mes}</div>
                  ))}
                </div>
                <div className="space-y-5">
                  {[
                    { title: 'Viaducto Elevado', sub: 'Infraestructura Civil', left: '33.3%', width: '66.6%', bg: 'bg-cyan-400', time: '4 Meses' },
                    { title: 'Subestación Eléctrica', sub: 'Sistemas de Potencia', left: '66.6%', width: '50%', bg: 'bg-green-500', time: '3 Meses' },
                    { title: 'Planta Tratamiento II', sub: 'Hidráulica & Ambiental', left: '83.3%', width: '16.7%', bg: 'bg-orange-500', time: '4 Meses' },
                    { title: 'Edificio Terminal B', sub: 'Edificaciones', left: '50%', width: '50%', bg: 'bg-[#b388ff]', time: '6 Meses' }
                  ].map((task, i) => (
                    <div key={i} className="flex items-center">
                      <div className="w-[160px] shrink-0">
                        <p className="text-sm font-medium text-white">{task.title}</p>
                        <p className="text-[11px] text-gray-400">{task.sub}</p>
                      </div>
                      <div className="flex-1 relative h-7 bg-[#0d1117] rounded">
                        <div className={`absolute h-full ${task.bg} rounded flex items-center justify-center text-xs font-bold text-black px-2 shadow-sm whitespace-nowrap overflow-hidden`} style={{ left: task.left, width: task.width }}>
                          {task.time}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Alertas Ruta Crítica */}
          <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-5 md:p-6 shadow-sm">
            <h3 className="font-semibold text-lg text-white mb-6">Alertas Ruta Crítica</h3>
            <div className="space-y-3">
              {[
                { title: 'Cimentación Pilotes', sub: 'Viaducto Elevado', status: 'En riesgo', days: '3d', color: 'red' },
                { title: 'Pruebas de Aislamiento', sub: 'Subestación Eléctrica', status: 'En tiempo', days: '12d', color: 'green' },
                { title: 'Suministro de Tubería', sub: 'Planta Tratamiento II', status: 'Retrasado', days: '1d', color: 'orange' }
              ].map((alert, i) => (
                <div key={i} className="flex justify-between items-center bg-[#0d1117] p-3.5 rounded-lg border border-[#30363d]/50">
                  <div>
                    <p className="text-sm font-medium text-white">{alert.title}</p>
                    <p className="text-xs text-gray-400">{alert.sub}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-[11px] px-2 py-1 rounded font-medium bg-${alert.color}-500/10 text-${alert.color}-400`}>
                      {alert.status}
                    </span>
                    <span className="text-xs text-gray-400 font-mono">{alert.days}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 3. Sección Inferior (Rendimiento y Presupuesto) */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Rendimiento por Equipo */}
          <div className="xl:col-span-2 bg-[#161b22] border border-[#30363d] rounded-xl p-5 md:p-6 shadow-sm">
            <h3 className="font-semibold text-lg text-white mb-6">Rendimiento por Equipo</h3>
            <div className="space-y-6">
              {[
                { name: 'Infraestructura', pct: '94%', color: 'bg-cyan-400' },
                { name: 'Sistemas Eléctricos', pct: '88%', color: 'bg-green-500' },
                { name: 'Equipo de Estructuras', pct: '76%', color: 'bg-orange-500' }
              ].map((team, i) => (
                <div key={i} className="flex items-center gap-4">
                  <span className="w-36 text-sm text-gray-300">{team.name}</span>
                  <div className="flex-1 h-2.5 bg-[#0d1117] rounded-full overflow-hidden">
                    <div className={`h-full ${team.color} rounded-full`} style={{ width: team.pct }}></div>
                  </div>
                  <span className="text-sm font-medium w-10 text-right">{team.pct}</span>
                </div>
              ))}
            </div>
          </div>
          
          {/* Control Presupuestario */}
          <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-5 md:p-6 shadow-sm">
            <h3 className="font-semibold text-lg text-white mb-6">Control Presupuestario</h3>
            <div className="flex justify-center items-center py-2">
              <div className="relative w-40 h-40 rounded-full flex items-center justify-center shadow-lg" style={{ background: 'conic-gradient(#22d3ee 0% 55%, #22c55e 55% 85%, #f97316 85% 100%)' }}>
                <div className="w-[120px] h-[120px] bg-[#161b22] rounded-full flex flex-col items-center justify-center text-center">
                  <span className="text-2xl font-bold text-white">$4.2M</span>
                  <span className="text-xs text-gray-400 mt-1">Asignado</span>
                </div>
              </div>
            </div>
            <div className="flex justify-center flex-wrap gap-4 mt-8 text-[11px] text-gray-400">
              <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-cyan-400"></span> Civiles (55%)</div>
              <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-green-500"></span> Equipos (30%)</div>
              <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span> Otros (15%)</div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}