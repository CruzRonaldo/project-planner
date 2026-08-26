import React from 'react';
import { LayoutDashboard, TrendingUp, Briefcase, Zap, Users, UserCog, Code, Settings, Layers } from 'lucide-react';

export default function Sidebar() {
  return (
    <aside className="w-[260px] bg-[#10141b] border-r border-[#30363d] flex-col justify-between hidden lg:flex">
      <div>
        <div className="p-6 flex items-center gap-3 font-bold text-[15px] tracking-wide">
          <Layers className="text-cyan-400" size={22} /> PROJECT PLANNER
        </div>
        <nav className="mt-2 flex flex-col">
          <a href="#" className="flex items-center gap-4 px-6 py-3.5 text-sm text-white bg-cyan-400/10 border-l-[3px] border-cyan-400"><LayoutDashboard size={18} /> Dashboard</a>
          <a href="#" className="flex items-center gap-4 px-6 py-3.5 text-sm text-gray-400 hover:text-white hover:bg-white/5"><TrendingUp size={18} /> Planificación Estratégica</a>
          <a href="#" className="flex items-center gap-4 px-6 py-3.5 text-sm text-gray-400 hover:text-white hover:bg-white/5"><Briefcase size={18} /> Portafolio</a>
          <a href="#" className="flex items-center gap-4 px-6 py-3.5 text-sm text-gray-400 hover:text-white hover:bg-white/5"><Zap size={18} /> Gestión Operativa</a>
          <a href="#" className="flex items-center gap-4 px-6 py-3.5 text-sm text-gray-400 hover:text-white hover:bg-white/5"><Users size={18} /> Equipo Técnico</a>
          <a href="#" className="flex items-center gap-4 px-6 py-3.5 text-sm text-gray-400 hover:text-white hover:bg-white/5"><UserCog size={18} /> Recursos Humanos</a>
          <a href="#" className="flex items-center gap-4 px-6 py-3.5 text-sm text-gray-400 hover:text-white hover:bg-white/5"><Code size={18} /> Integraciones</a>
        </nav>
      </div>
      <div className="p-6">
        <a href="#" className="flex items-center gap-4 text-sm text-gray-400 hover:text-white"><Settings size={18} /> Configuración</a>
      </div>
    </aside>
  );
}