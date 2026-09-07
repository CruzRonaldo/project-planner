import React, { useEffect, useRef, useState } from 'react';
import { Bell, ChevronDown, LogOut, ShieldCheck } from 'lucide-react';

const notifications = [
  { id: 1, title: 'Hito próximo', detail: 'Revisión estructural programada para hoy.', time: 'Hace 10 min' },
  { id: 2, title: 'Presupuesto actualizado', detail: 'Torre Reforma recibió una actualización.', time: 'Hace 1 h' },
  { id: 3, title: 'Nuevo integrante', detail: 'Se añadió un usuario al equipo técnico.', time: 'Ayer' },
];

function getInitials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase();
}

export default function ProfileControls({ currentUser, onLogout, onNavigate }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const controlsRef = useRef(null);
  const isAdmin = currentUser?.accountType === 'admin';

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (controlsRef.current && !controlsRef.current.contains(event.target)) {
        setMenuOpen(false);
        setNotificationsOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setMenuOpen(false);
        setNotificationsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const openNotifications = () => {
    setMenuOpen(false);
    setNotificationsOpen((current) => !current);
  };

  return (
    <>
      <div ref={controlsRef} className="relative flex shrink-0 items-center gap-3 sm:gap-5">
        <button type="button" onClick={openNotifications} aria-label="Notificaciones" className="relative rounded-lg p-2 text-gray-400 hover:bg-white/5 hover:text-white">
          <Bell size={20} />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500" />
        </button>

        <button
          type="button"
          onClick={() => {
            setNotificationsOpen(false);
            setMenuOpen((current) => !current);
          }}
          aria-expanded={menuOpen}
          aria-label="Abrir menú de usuario"
          className="flex items-center gap-2 rounded-xl p-1.5 text-left transition-colors hover:bg-white/5 sm:gap-3"
        >
          {isAdmin ? (
            <span className="h-8 w-8 overflow-hidden rounded-full bg-gray-600 sm:h-9 sm:w-9">
              <img src="https://i.pravatar.cc/150?img=11" alt="Perfil de Carlos M." className="h-full w-full object-cover" />
            </span>
          ) : (
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-cyan-500/15 text-[10px] font-bold text-cyan-300 sm:h-9 sm:w-9">
              {getInitials(currentUser?.name)}
            </span>
          )}
          <span className="hidden flex-col sm:flex">
            <strong className="max-w-32 truncate text-sm font-semibold text-white">{currentUser?.name}</strong>
            <span className="text-xs text-gray-400">{currentUser?.roleLabel}</span>
          </span>
          <ChevronDown size={15} className={`hidden text-slate-500 transition-transform sm:block ${menuOpen ? 'rotate-180' : ''}`} />
        </button>

        {menuOpen && (
          <div className="absolute right-0 top-[calc(100%+10px)] z-[70] w-64 overflow-hidden rounded-xl border border-slate-700 bg-[#111a29] p-2 shadow-[0_18px_50px_rgba(0,0,0,0.5)]">
            <div className="border-b border-slate-800 px-3 py-3">
              <p className="text-sm font-semibold text-white">{currentUser?.name}</p>
              <p className="mt-0.5 truncate text-[11px] text-slate-500">{currentUser?.email}</p>
              <span className="mt-2 inline-flex rounded bg-cyan-500/10 px-2 py-1 text-[10px] font-semibold text-cyan-400">{currentUser?.roleLabel}</span>
            </div>

            <button type="button" onClick={openNotifications} className="mt-2 flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm text-slate-300 hover:bg-white/5 hover:text-white">
              <span className="flex items-center gap-3"><Bell size={17} /> Notificaciones</span>
              <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-[9px] font-bold text-white">3</span>
            </button>

            {isAdmin && (
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  onNavigate('roles');
                }}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-300 hover:bg-white/5 hover:text-white"
              >
                <ShieldCheck size={17} /> Roles y permisos
              </button>
            )}

            <div className="my-2 border-t border-slate-800" />
            <button type="button" onClick={onLogout} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300">
              <LogOut size={17} /> Cerrar sesión
            </button>
          </div>
        )}

        {notificationsOpen && (
          <section className="absolute right-0 top-[calc(100%+10px)] z-[70] w-[min(330px,calc(100vw-24px))] overflow-hidden rounded-xl border border-slate-700 bg-[#111a29] shadow-[0_18px_50px_rgba(0,0,0,0.5)]">
            <header className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
              <h2 className="text-sm font-semibold text-white">Notificaciones</h2>
              <span className="text-[10px] text-cyan-400">3 nuevas</span>
            </header>
            <div className="divide-y divide-slate-800">
              {notifications.map((notification) => (
                <article key={notification.id} className="px-4 py-3 hover:bg-white/[0.03]">
                  <div className="flex gap-3">
                    <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-cyan-400" />
                    <div>
                      <h3 className="text-xs font-semibold text-slate-200">{notification.title}</h3>
                      <p className="mt-1 text-[11px] leading-relaxed text-slate-400">{notification.detail}</p>
                      <span className="mt-1.5 block text-[9px] text-slate-600">{notification.time}</span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}
      </div>

    </>
  );
}
