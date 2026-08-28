import React from 'react';
import { Search, Bell } from 'lucide-react';

export default function Topbar() {
  return (
    <header className="flex justify-between items-center px-6 py-4 bg-[#0d1117] border-b border-[#30363d]">
      <div className="flex items-center bg-[#161b22] px-4 py-2.5 rounded-lg border border-[#30363d] w-full max-w-md">
        <Search size={18} className="text-gray-400" />
        <input type="text" placeholder="Buscar proyectos, hitos o equipos..." className="bg-transparent border-none outline-none text-sm ml-3 w-full text-white placeholder-gray-500" />
      </div>
      <div className="flex items-center gap-6">
        <button className="text-gray-400 hover:text-white relative">
          <Bell size={20} />
          <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gray-600 overflow-hidden">
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
