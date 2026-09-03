import React, { useState } from 'react';
import { LayoutDashboard, TrendingUp, Briefcase, Zap, Users, UserCog, Code, Settings, Layers, Minus, Plus, RotateCcw, Type } from 'lucide-react';

const mainItems = [
  { id: 'dashboard', label: 'Inicio', icon: LayoutDashboard, enabled: true },
  { id: 'planning', label: 'Planificación Estratégica', icon: TrendingUp, enabled: true },
  { id: 'portfolio', label: 'Portafolio', icon: Briefcase, enabled: true },
  { id: 'operations', label: 'Gestión Operativa', icon: Zap },
  { id: 'technical-team', label: 'Equipo Técnico', icon: Users, enabled: false },
  { id: 'human-resources', label: 'Recursos Humanos', icon: UserCog, enabled: true },
  { id: 'integrations', label: 'Integraciones', icon: Code },
];

export default function Sidebar({ activeView, onNavigate, fontScale, onFontScaleChange }) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const decreaseFont = () => onFontScaleChange((current) => Math.max(85, current - 5));
  const increaseFont = () => onFontScaleChange((current) => Math.min(120, current + 5));
  const handleNavigation = (item) => {
    if (item.enabled) {
      setSettingsOpen(false);
      onNavigate(item.id);
    }
  };

  return (
    <aside className="relative w-[260px] bg-[#10141b] border-r border-[#30363d] flex-col justify-between hidden lg:flex">
      <div>
        <div className="p-6 flex items-center gap-3 font-bold text-[15px] tracking-wide">
          <Layers className="text-cyan-400" size={22} /> PROJECT PLANNER
        </div>
        <nav className="mt-2 flex flex-col">
          {mainItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;

            return (
              <button
                key={item.id}
                type="button"
                disabled={item.enabled === false}
                onClick={() => handleNavigation(item)}
                aria-current={isActive ? 'page' : undefined}
                className={`flex w-full items-center gap-4 border-l-[3px] px-6 py-3.5 text-left text-sm transition-colors ${
                  isActive
                    ? 'border-cyan-400 bg-cyan-400/10 text-white'
                    : 'border-transparent text-gray-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
      <div className="relative p-6">
        {settingsOpen && (
          <section className="absolute bottom-full left-4 right-4 mb-3 overflow-hidden rounded-xl border border-slate-700 bg-[#111a29] p-3 shadow-[0_18px_50px_rgba(0,0,0,0.5)]">
            <div className="border-b border-slate-800 px-1 pb-3">
              <div className="flex items-center gap-2">
                <Type size={15} className="text-cyan-400" />
                <h2 className="text-xs font-semibold text-white">Tamaño de letra</h2>
              </div>
              <p className="mt-1 text-[10px] leading-relaxed text-slate-500">Ajusta toda la interfaz sin modificar el logo.</p>
            </div>
            <div className="mt-3">
              <div className="grid grid-cols-[40px_1fr_40px] items-center gap-2">
                <button type="button" onClick={decreaseFont} disabled={fontScale <= 85} aria-label="Disminuir tamaño de letra" className="flex h-10 items-center justify-center rounded-lg border border-slate-700 bg-[#0b1425] text-slate-300 hover:border-cyan-400/40 hover:text-white disabled:cursor-not-allowed disabled:opacity-35">
                  <Minus size={16} />
                </button>
                <div className="rounded-lg border border-cyan-400/25 bg-cyan-400/10 px-2 py-2.5 text-center text-xs font-bold text-cyan-300">{fontScale}%</div>
                <button type="button" onClick={increaseFont} disabled={fontScale >= 120} aria-label="Aumentar tamaño de letra" className="flex h-10 items-center justify-center rounded-lg border border-slate-700 bg-[#0b1425] text-slate-300 hover:border-cyan-400/40 hover:text-white disabled:cursor-not-allowed disabled:opacity-35">
                  <Plus size={16} />
                </button>
              </div>
              <input
                type="range"
                min="85"
                max="120"
                step="5"
                value={fontScale}
                onChange={(event) => onFontScaleChange(Number(event.target.value))}
                aria-label="Porcentaje del tamaño de letra"
                className="mt-3 w-full cursor-pointer accent-cyan-400"
              />
              <button type="button" onClick={() => onFontScaleChange(100)} className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-[10px] font-medium text-slate-400 hover:bg-white/5 hover:text-white">
                <RotateCcw size={13} /> Restablecer al 100%
              </button>
            </div>
          </section>
        )}
        <button type="button" onClick={() => setSettingsOpen((current) => !current)} aria-expanded={settingsOpen} className="flex w-full items-center gap-4 text-sm text-gray-400 hover:text-white"><Settings size={18} /> Configuración</button>
      </div>
    </aside>
  );
}
