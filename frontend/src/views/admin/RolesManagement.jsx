import React from 'react';
import { ShieldCheck, UserCog, Users, Wifi, WifiOff } from 'lucide-react';

const cardClass = 'rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-colors duration-300 dark:border-[#30363d] dark:bg-[#161b22] dark:shadow-none midnight:border-cyan-900/30 midnight:bg-[#0a1120]';

function getInitials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase();
}

export default function RolesManagement({ users, onToggleSubAdmin }) {
  const subAdminCount = users.filter((user) => user.isSubAdmin).length;
  const onlineCount = users.filter((user) => user.isOnline).length;

  return (
    <main className="flex-1 overflow-y-auto bg-slate-50 p-4 text-slate-900 transition-colors duration-300 dark:bg-[#0d1117] dark:text-slate-100 midnight:bg-[#050B14] midnight:text-cyan-50 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-cyan-700 dark:text-cyan-400 midnight:text-cyan-400">
              <UserCog size={21} />
              <span className="text-[10px] font-semibold uppercase tracking-[0.18em]">Control de acceso</span>
            </div>
            <h1 className="mt-2 text-2xl font-bold text-slate-900 transition-colors duration-300 dark:text-white midnight:text-cyan-50 sm:text-3xl">Administración de roles</h1>
            <p className="mt-1 text-sm text-slate-500 transition-colors duration-300 dark:text-slate-400 midnight:text-cyan-500/70">Gestiona el permiso de SubAdministrador y revisa el estado de cada usuario.</p>
          </div>
          <span className="inline-flex w-fit items-center gap-2 rounded-lg border border-cyan-200 bg-cyan-50 px-3 py-2 text-xs font-semibold text-cyan-700 transition-colors duration-300 dark:border-cyan-400/20 dark:bg-cyan-400/10 dark:text-cyan-300 midnight:border-cyan-800/40 midnight:bg-cyan-500/15 midnight:text-cyan-300">
            <ShieldCheck size={16} /> Acceso exclusivo del Administrador
          </span>
        </header>

        <section className="mb-6 grid gap-4 sm:grid-cols-3" aria-label="Resumen de usuarios y roles">
          <article className={cardClass}>
            <div className="flex items-center justify-between text-slate-500 transition-colors duration-300 dark:text-slate-400 midnight:text-cyan-600">
              <span className="text-[10px] font-semibold uppercase tracking-wider">Usuarios</span>
              <Users size={18} className="text-cyan-600 dark:text-cyan-400 midnight:text-cyan-400" />
            </div>
            <strong className="mt-3 block text-2xl text-slate-900 transition-colors duration-300 dark:text-white midnight:text-cyan-50">{users.length}</strong>
          </article>
          <article className={cardClass}>
            <div className="flex items-center justify-between text-slate-500 transition-colors duration-300 dark:text-slate-400 midnight:text-cyan-600">
              <span className="text-[10px] font-semibold uppercase tracking-wider">SubAdministradores</span>
              <ShieldCheck size={18} className="text-violet-600 dark:text-violet-400 midnight:text-cyan-400" />
            </div>
            <strong className="mt-3 block text-2xl text-slate-900 transition-colors duration-300 dark:text-white midnight:text-cyan-50">{subAdminCount}</strong>
          </article>
          <article className={cardClass}>
            <div className="flex items-center justify-between text-slate-500 transition-colors duration-300 dark:text-slate-400 midnight:text-cyan-600">
              <span className="text-[10px] font-semibold uppercase tracking-wider">En línea</span>
              <Wifi size={18} className="text-emerald-600 dark:text-emerald-400 midnight:text-emerald-300" />
            </div>
            <strong className="mt-3 block text-2xl text-slate-900 transition-colors duration-300 dark:text-white midnight:text-cyan-50">{onlineCount}</strong>
          </article>
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-colors duration-300 dark:border-[#30363d] dark:bg-[#161b22] dark:shadow-none midnight:border-cyan-900/30 midnight:bg-[#0a1120]">
          <header className="border-b border-slate-200 px-4 py-4 transition-colors duration-300 dark:border-[#30363d] midnight:border-cyan-900/30 sm:px-6">
            <h2 className="text-base font-semibold text-slate-900 transition-colors duration-300 dark:text-white midnight:text-cyan-50">Usuarios del sistema</h2>
            <p className="mt-1 text-xs text-slate-500 transition-colors duration-300 dark:text-slate-400 midnight:text-cyan-500/70">Activa o desactiva el rol de SubAdministrador para cada integrante.</p>
          </header>

          <div className="divide-y divide-slate-200 dark:divide-[#30363d] midnight:divide-cyan-900/30">
            {users.map((user) => (
              <article key={user.id} className="grid gap-4 p-4 transition-colors duration-300 hover:bg-slate-50 dark:hover:bg-white/[0.02] midnight:hover:bg-cyan-900/20 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center sm:px-6 sm:py-5">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-cyan-200 bg-cyan-50 text-xs font-bold text-cyan-700 transition-colors duration-300 dark:border-cyan-400/20 dark:bg-cyan-500/10 dark:text-cyan-300 midnight:border-cyan-800/40 midnight:bg-cyan-500/15 midnight:text-cyan-300">
                    {getInitials(user.name)}
                  </span>
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-semibold text-slate-900 transition-colors duration-300 dark:text-white midnight:text-cyan-50">{user.name}</h3>
                    <p className="mt-0.5 truncate text-[11px] text-slate-500 transition-colors duration-300 dark:text-slate-400 midnight:text-cyan-500/70">{user.email}</p>
                    <span className={`mt-1.5 inline-flex items-center gap-1.5 text-[10px] font-medium ${user.isOnline ? 'text-emerald-600 dark:text-emerald-400 midnight:text-emerald-300' : 'text-slate-500 midnight:text-cyan-600'}`}>
                      {user.isOnline ? <Wifi size={12} /> : <WifiOff size={12} />}
                      {user.isOnline ? 'En línea' : 'Desconectado'}
                    </span>
                  </div>
                </div>

                <div className="sm:min-w-36 sm:text-right">
                  <p className="text-[10px] uppercase tracking-wide text-slate-500 transition-colors duration-300 midnight:text-cyan-600">Rol actual</p>
                  <p className={`mt-1 text-xs font-semibold ${user.isSubAdmin ? 'text-cyan-700 dark:text-cyan-400 midnight:text-cyan-400' : 'text-slate-600 dark:text-slate-300 midnight:text-cyan-100'}`}>
                    {user.isSubAdmin ? 'SubAdministrador' : 'Equipo Técnico'}
                  </p>
                </div>

                <button
                  type="button"
                  role="switch"
                  aria-label={`Rol de SubAdministrador para ${user.name}`}
                  aria-checked={user.isSubAdmin}
                  onClick={() => onToggleSubAdmin(user.id)}
                  className={`flex min-w-[136px] items-center justify-between gap-3 rounded-full border px-2 py-1.5 text-[10px] font-semibold transition-colors duration-300 ${
                    user.isSubAdmin
                      ? 'border-cyan-400/40 bg-cyan-400/10 text-cyan-700 dark:text-cyan-300 midnight:text-cyan-300'
                      : 'border-slate-300 bg-slate-100 text-slate-500 dark:border-[#30363d] dark:bg-[#0d1117] dark:text-slate-400 midnight:border-cyan-800/40 midnight:bg-[#050B14] midnight:text-cyan-500/70'
                  }`}
                >
                  <span className={`h-5 w-5 rounded-full transition-colors duration-300 ${user.isSubAdmin ? 'bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.55)]' : 'bg-slate-400 dark:bg-slate-600 midnight:bg-cyan-900'}`} />
                  <span>{user.isSubAdmin ? 'Activado' : 'Desactivado'}</span>
                </button>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
