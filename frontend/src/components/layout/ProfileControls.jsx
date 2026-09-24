import React, { useEffect, useRef, useState } from 'react';
import { Bell, ChevronDown, LogOut, ShieldCheck } from 'lucide-react';
import projectsApi from '../../services/projectsApi';

const isProduction =
  import.meta.env.PROD ||
  (typeof window !== 'undefined' &&
    !['localhost', '127.0.0.1'].includes(window.location.hostname));
const hideMocks = import.meta.env.VITE_HIDE_MOCKS === 'true' || isProduction;

const defaultNotifications = [
  { id: 'notif-milestone-1', title: 'Hito próximo', detail: 'Revisión estructural programada para hoy.', time: 'Hace 10 min', unread: false },
  { id: 'notif-budget-1', title: 'Presupuesto actualizado', detail: 'Torre Reforma recibió una actualización.', time: 'Hace 1 h', unread: false },
  { id: 'notif-team-1', title: 'Nuevo integrante', detail: 'Se añadió un usuario al equipo técnico.', time: 'Ayer', unread: false },
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
  const [notificationsList, setNotificationsList] = useState(() => (hideMocks ? [] : defaultNotifications));
  const [readIds, setReadIds] = useState(() => {
    try {
      const saved = localStorage.getItem('project_planner_read_notifs');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const controlsRef = useRef(null);
  const isAdmin = currentUser?.accountType === 'admin';

  // Sincronizar notificaciones reales del usuario desde el backend
  useEffect(() => {
    let isMounted = true;
    const fetchNotifications = async () => {
      if (!currentUser) return;
      try {
        const data = await projectsApi.getNotifications({
          username: currentUser.username,
          email: currentUser.email,
        });
        if (isMounted && Array.isArray(data)) {
          if (hideMocks) {
            setNotificationsList(data);
          } else {
            setNotificationsList(data.length > 0 ? data : defaultNotifications);
          }
        }
      } catch (err) {
        console.error('Error al cargar notificaciones:', err);
      }
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [currentUser]);

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

  const markAsRead = (id) => {
    if (!readIds.includes(id)) {
      const nextRead = [...readIds, id];
      setReadIds(nextRead);
      try {
        localStorage.setItem(
          'project_planner_read_notifs',
          JSON.stringify(nextRead)
        );
      } catch {}
    }
  };

  const markAllAsRead = () => {
    const allIds = notificationsList.map((n) => n.id);
    const nextRead = Array.from(new Set([...readIds, ...allIds]));
    setReadIds(nextRead);
    try {
      localStorage.setItem(
        'project_planner_read_notifs',
        JSON.stringify(nextRead)
      );
    } catch {}
  };

  const handleNotificationClick = (notification) => {
    markAsRead(notification.id);
    if (notification.type === 'project_assignment' || notification.projectId) {
      setNotificationsOpen(false);
      if (onNavigate) {
        onNavigate('portfolio');
      }
    }
  };

  const unreadCount = notificationsList.filter(
    (n) => n.unread && !readIds.includes(n.id)
  ).length;

  return (
    <>
      <div ref={controlsRef} className="relative flex shrink-0 items-center gap-3 sm:gap-5">
        
        {/* BOTÓN DE NOTIFICACIONES */}
        <button 
          type="button" 
          onClick={openNotifications} 
          aria-label="Notificaciones" 
          className="relative rounded-lg p-2 transition-colors duration-200 text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-white midnight:text-cyan-500/70 midnight:hover:bg-cyan-900/20 midnight:hover:text-cyan-300"
        >
          <Bell size={20} />
          {unreadCount > 0 && (
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)] animate-pulse" />
          )}
        </button>

        {/* BOTÓN DE PERFIL */}
        <button
          type="button"
          onClick={() => {
            setNotificationsOpen(false);
            setMenuOpen((current) => !current);
          }}
          aria-expanded={menuOpen}
          aria-label="Abrir menú de usuario"
          className="flex items-center gap-2 rounded-xl p-1.5 text-left transition-colors duration-200 hover:bg-slate-100 dark:hover:bg-white/5 midnight:hover:bg-cyan-900/20 sm:gap-3"
        >
          {isAdmin ? (
            <span className="h-8 w-8 overflow-hidden rounded-full bg-slate-200 dark:bg-gray-600 midnight:bg-cyan-900/40 sm:h-9 sm:w-9">
              <img src="https://i.pravatar.cc/150?img=11" alt="Perfil de Carlos M." className="h-full w-full object-cover" />
            </span>
          ) : (
            <span className="flex h-8 w-8 items-center justify-center rounded-full text-[10px] font-bold sm:h-9 sm:w-9 bg-cyan-100 text-cyan-700 dark:bg-cyan-500/15 dark:text-cyan-300 midnight:bg-cyan-500/20 midnight:text-cyan-300">
              {getInitials(currentUser?.name)}
            </span>
          )}
          <span className="hidden flex-col sm:flex">
            <strong className="max-w-32 truncate text-sm font-semibold transition-colors duration-200 text-slate-900 dark:text-white midnight:text-cyan-50">
              {currentUser?.name}
            </strong>
            <span className="text-xs transition-colors duration-200 text-slate-500 dark:text-gray-400 midnight:text-cyan-500/70">
              {currentUser?.roleLabel}
            </span>
          </span>
          <ChevronDown size={15} className={`hidden transition-transform duration-200 sm:block text-slate-400 dark:text-slate-500 midnight:text-cyan-500/50 ${menuOpen ? 'rotate-180' : ''}`} />
        </button>

        {/* MENÚ DESPLEGABLE DE PERFIL */}
        {menuOpen && (
          <div className="absolute right-0 top-[calc(100%+10px)] z-[70] w-64 overflow-hidden rounded-xl border shadow-[0_18px_50px_rgba(0,0,0,0.5)] transition-colors duration-300 bg-white border-slate-200 dark:bg-[#111a29] dark:border-slate-700 midnight:bg-[#0a1120] midnight:border-cyan-900/50">
            <div className="border-b px-3 py-3 border-slate-100 dark:border-slate-800 midnight:border-cyan-900/30">
              <p className="text-sm font-semibold text-slate-900 dark:text-white midnight:text-cyan-50">{currentUser?.name}</p>
              <p className="mt-0.5 truncate text-[11px] text-slate-500 dark:text-slate-500 midnight:text-cyan-500/70">{currentUser?.email}</p>
              <span className="mt-2 inline-flex rounded px-2 py-1 text-[10px] font-semibold bg-cyan-50 text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-400 midnight:bg-cyan-500/20 midnight:text-cyan-300">
                {currentUser?.roleLabel}
              </span>
            </div>

            <button type="button" onClick={openNotifications} className="mt-2 flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm transition-colors duration-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-white/5 dark:hover:text-white midnight:text-cyan-100/70 midnight:hover:bg-cyan-900/30 midnight:hover:text-cyan-50">
              <span className="flex items-center gap-3"><Bell size={17} /> Notificaciones</span>
              {unreadCount > 0 && (
                <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-[9px] font-bold text-white shadow-sm">{unreadCount}</span>
              )}
            </button>

            {isAdmin && (
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  onNavigate('roles');
                }}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors duration-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-white/5 dark:hover:text-white midnight:text-cyan-100/70 midnight:hover:bg-cyan-900/30 midnight:hover:text-cyan-50"
              >
                <ShieldCheck size={17} /> Roles y permisos
              </button>
            )}

            <div className="my-2 border-t border-slate-100 dark:border-slate-800 midnight:border-cyan-900/30" />
            
            <button type="button" onClick={onLogout} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors duration-200 text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-500/10 dark:hover:text-red-300 midnight:text-rose-400 midnight:hover:bg-rose-500/10 midnight:hover:text-rose-300">
              <LogOut size={17} /> Cerrar sesión
            </button>
          </div>
        )}

        {/* MENÚ DESPLEGABLE DE NOTIFICACIONES */}
        {notificationsOpen && (
          <section className="absolute right-0 top-[calc(100%+10px)] z-[70] w-[min(340px,calc(100vw-24px))] overflow-hidden rounded-xl border shadow-[0_18px_50px_rgba(0,0,0,0.5)] transition-colors duration-300 bg-white border-slate-200 dark:bg-[#111a29] dark:border-slate-700 midnight:bg-[#0a1120] midnight:border-cyan-900/50">
            <header className="flex items-center justify-between border-b px-4 py-3 border-slate-100 dark:border-slate-800 midnight:border-cyan-900/30">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white midnight:text-cyan-50">Notificaciones</h2>
              <div className="flex items-center gap-2">
                {unreadCount > 0 ? (
                  <>
                    <span className="text-[10px] font-medium text-cyan-600 dark:text-cyan-400 midnight:text-cyan-400">
                      {unreadCount} {unreadCount === 1 ? 'nueva' : 'nuevas'}
                    </span>
                    <button
                      type="button"
                      onClick={markAllAsRead}
                      className="text-[10px] text-slate-400 hover:text-slate-600 dark:text-slate-400 dark:hover:text-white midnight:text-cyan-400/80 transition-colors"
                      title="Marcar todas como leídas"
                    >
                      (Leídas)
                    </button>
                  </>
                ) : (
                  <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500">
                    Al día
                  </span>
                )}
              </div>
            </header>
            <div className="max-h-[360px] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 midnight:divide-cyan-900/30">
              {notificationsList.map((notification) => {
                const isUnread = notification.unread && !readIds.includes(notification.id);
                return (
                  <article
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`px-4 py-3 transition-colors duration-200 hover:bg-slate-50 dark:hover:bg-white/[0.03] midnight:hover:bg-cyan-900/20 cursor-pointer ${
                      isUnread ? 'bg-cyan-50/50 dark:bg-cyan-950/20' : ''
                    }`}
                  >
                    <div className="flex gap-3">
                      <span
                        className={`mt-1 h-2 w-2 shrink-0 rounded-full ${
                          isUnread
                            ? 'bg-cyan-500 dark:bg-cyan-400 midnight:bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.6)] animate-pulse'
                            : 'bg-slate-300 dark:bg-slate-700 midnight:bg-slate-700'
                        }`}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <h3 className="text-xs font-semibold text-slate-800 dark:text-slate-200 midnight:text-cyan-100">
                            {notification.title}
                          </h3>
                          {notification.type === 'project_assignment' && (
                            <span className="shrink-0 rounded bg-cyan-100 px-1.5 py-0.5 text-[9px] font-bold text-cyan-800 dark:bg-cyan-900/40 dark:text-cyan-300">
                              Líder
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400 midnight:text-cyan-500/70">
                          {notification.detail}
                        </p>
                        <div className="mt-1.5 flex items-center justify-between text-[9px] text-slate-400 dark:text-slate-600 midnight:text-cyan-500/50">
                          <span>{notification.time}</span>
                          {notification.type === 'project_assignment' && (
                            <span className="text-cyan-600 dark:text-cyan-400 font-medium">Ver en Portafolio →</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
              {!notificationsList.length && (
                <div className="py-8 px-4 text-center">
                  <Bell className="mx-auto h-7 w-7 text-slate-300 dark:text-slate-600 midnight:text-cyan-800 mb-2 opacity-50" />
                  <p className="text-xs font-medium text-slate-600 dark:text-slate-300 midnight:text-cyan-200">
                    No tienes notificaciones
                  </p>
                  <p className="mt-1 text-[10px] text-slate-400 dark:text-slate-500 midnight:text-cyan-600">
                    Todas las novedades de proyectos aparecerán aquí
                  </p>
                </div>
              )}
            </div>
          </section>
        )}
      </div>
    </>
  );
}
