import React from 'react';
import { Search, Bell } from 'lucide-react';

export default function Topbar({ activeView }) {
 const placeholders = {
  dashboard: 'Buscar proyectos, hitos o equipos...',
  planning: 'Buscar en planificación maestra...',
  portfolio: 'Buscar por nombre de proyecto, líder, etiquetas...',
  operations: 'Buscar órdenes de trabajo, tareas o alertas...',
  'technical-team': 'Buscar ingenieros, arquitectos o proyectos...',
};
  const placeholder = placeholders[activeView] ?? placeholders.dashboard;

  return (
    <header className="flex items-center justify-between gap-3 border-b border-[#30363d] bg-[#0d1117] px-3 py-3 sm:gap-6 sm:px-6 sm:py-4">
      <div className="flex min-w-0 flex-1 items-center rounded-lg border border-[#30363d] bg-[#161b22] px-3 py-2.5 sm:max-w-md sm:px-4">
        <Search size={18} className="shrink-0 text-gray-400" />
        <input type="text" placeholder={placeholder} className="ml-3 min-w-0 w-full bg-transparent text-sm text-white placeholder-gray-500 outline-none" />
      </div>
      <div className="flex shrink-0 items-center gap-3 sm:gap-6">
        <button className="text-gray-400 hover:text-white relative">
          <Bell size={20} />
          <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 overflow-hidden rounded-full bg-gray-600 sm:h-9 sm:w-9">
            <img src="https://i.pravatar.cc/150?img=11" alt="Perfil" className="w-full h-full object-cover" />
          </div>
          <div className="hidden sm:flex flex-col">
            <span className="text-sm font-semibold text-white">Carlos M.</span>
            <span className="text-xs text-gray-400">Project Manager</span>
          </div>
        </div>
      </div>
    </header>
  );
}
