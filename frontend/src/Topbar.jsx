import React from 'react';
import { Search } from 'lucide-react';
import ProfileControls from './ProfileControls';

export default function Topbar({ activeView, currentUser, users, onToggleSubAdmin, onLogout, onNavigate, searchValue, onSearchChange }) {
  const placeholders = {
    dashboard: 'Buscar proyectos, hitos o equipos...',
    planning: 'Buscar en planificación maestra...',
    portfolio: 'Buscar por nombre de proyecto, líder, etiquetas...',
    roles: 'Buscar usuarios, correos o roles...',
    'human-resources': 'Buscar personal, disponibilidad o estados...',
  };
  const placeholder = placeholders[activeView] ?? placeholders.dashboard;

  return (
    <header className="flex items-center justify-between gap-3 border-b border-[#30363d] bg-[#0d1117] px-3 py-3 sm:gap-6 sm:px-6 sm:py-4">
      <div className="flex min-w-0 flex-1 items-center rounded-lg border border-[#30363d] bg-[#161b22] px-3 py-2.5 sm:max-w-md sm:px-4">
        <Search size={18} className="shrink-0 text-gray-400" />
        <input key={activeView} type="text" placeholder={placeholder} aria-label={placeholder} value={searchValue} onChange={onSearchChange ? (event) => onSearchChange(event.target.value) : undefined} className="ml-3 min-w-0 w-full bg-transparent text-sm text-white placeholder-gray-500 outline-none" />
      </div>
      <ProfileControls
        currentUser={currentUser}
        users={users}
        onToggleSubAdmin={onToggleSubAdmin}
        onLogout={onLogout}
        onNavigate={onNavigate}
      />
    </header>
  );
}
