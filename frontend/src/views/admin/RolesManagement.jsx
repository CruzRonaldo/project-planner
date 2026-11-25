import React, { useState, useMemo } from 'react';
import {
  ShieldCheck,
  Shield,
  ShieldAlert,
  Users,
  Wifi,
  WifiOff,
  Search,
  X,
  AlertTriangle,
  Lock,
  UserX,
  ArrowLeft,
} from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import { useLanguage } from '../../context/LanguageContext';

const cardClass =
  'rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 dark:border-[#30363d] dark:bg-[#161b22] dark:shadow-none midnight:border-cyan-900/30 midnight:bg-[#0a1120]';

function getInitials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase();
}

function UserAvatar({ user }) {
  const [hasError, setHasError] = useState(false);
  const avatarUrl = user?.avatar || user?.photo;

  if (avatarUrl && !hasError) {
    return (
      <img
        src={avatarUrl}
        alt={user.name || 'Avatar'}
        onError={() => setHasError(true)}
        className="h-11 w-11 shrink-0 rounded-2xl object-cover border border-cyan-200/50 shadow-sm dark:border-cyan-400/20 midnight:border-cyan-800/40"
      />
    );
  }

  return (
    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-cyan-200 bg-cyan-50 text-xs font-bold text-cyan-700 shadow-sm transition-colors duration-300 dark:border-cyan-400/20 dark:bg-cyan-500/10 dark:text-cyan-300 midnight:border-cyan-800/40 midnight:bg-cyan-500/15 midnight:text-cyan-300">
      {getInitials(user?.name)}
    </span>
  );
}

export default function RolesManagement({
  users = [],
  onToggleSubAdmin,
  currentUser = null,
  isAdmin = true,
  isSubAdmin = false,
  onNavigate = null,
}) {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');

  const effectiveIsAdmin = isAdmin;
  const effectiveIsSubAdmin = isSubAdmin && !effectiveIsAdmin;
  const isUnauthorized = !effectiveIsAdmin && !effectiveIsSubAdmin && (isAdmin === false && isSubAdmin === false);

  // Conteo de usuarios por rol y estado de conexión
  const adminCount = users.filter((user) => user.isAdmin).length;
  const subAdminCount = users.filter((user) => user.isSubAdmin).length;
  const technicalCount = users.filter((user) => !user.isAdmin && !user.isSubAdmin).length;
  const onlineCount = users.filter((user) => user.isOnline).length;

  // Filtrado reactivo de usuarios según búsqueda y filtro seleccionado
  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      if (selectedFilter === 'admins' && !user.isAdmin) return false;
      if (selectedFilter === 'subadmins' && !user.isSubAdmin) return false;
      if (selectedFilter === 'technical' && (user.isAdmin || user.isSubAdmin)) return false;
      if (selectedFilter === 'online' && !user.isOnline) return false;

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchName = user.name?.toLowerCase().includes(query);
        const matchEmail = user.email?.toLowerCase().includes(query);
        const matchUsername = user.username?.toLowerCase().includes(query);
        const roleLabel = user.isAdmin
          ? 'administrador admin principal'
          : user.isSubAdmin
            ? 'subadministrador subadmin'
            : 'equipo tecnico miembro';
        const matchRole = roleLabel.includes(query);

        if (!matchName && !matchEmail && !matchUsername && !matchRole) {
          return false;
        }
      }
      return true;
    });
  }, [users, selectedFilter, searchQuery]);

  // Mensaje explicativo para restricciones de SubAdministrador
  const getSubAdminRestrictionReason = (targetUser) => {
    const isSelf =
      currentUser &&
      (targetUser.id === currentUser.id ||
        targetUser.email === currentUser.email ||
        (currentUser.username && targetUser.username === currentUser.username));

    if (isSelf) {
      return t('rolesManagement.subAdminRestrictedSelf', 'No puedes modificar tu propio estado ni rol');
    }
    if (targetUser.isAdmin || targetUser.isSubAdmin) {
      return t(
        'rolesManagement.subAdminRestrictedAdmin',
        'Solo el Administrador Principal puede gestionar administradores o subadministradores'
      );
    }
    return t(
      'rolesManagement.subAdminRestrictedPromote',
      'Solo el Administrador Principal puede ascender miembros técnicos a Subadministrador'
    );
  };

  // Estado de bloqueo si el usuario no es ni Administrador ni Subadministrador
  if (isUnauthorized) {
    return (
      <main className="flex w-full flex-1 flex-col items-center justify-center p-6 text-center text-slate-900 transition-colors duration-300 dark:text-slate-100 midnight:text-cyan-50">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-rose-200 bg-rose-50 text-rose-600 dark:border-rose-900/40 dark:bg-rose-950/20 dark:text-rose-400 midnight:border-rose-800/40 midnight:bg-rose-950/30">
          <ShieldAlert size={32} />
        </div>
        <h2 className="mt-4 text-xl font-bold">
          {t('rolesManagement.unauthorizedTitle', 'Acceso Restringido')}
        </h2>
        <p className="mt-2 max-w-md text-sm text-slate-500 dark:text-slate-400 midnight:text-cyan-500/70">
          {t('rolesManagement.unauthorizedDesc', 'Esta sección es exclusiva para Administradores y Subadministradores del sistema.')}
        </p>
        <button
          type="button"
          onClick={() => onNavigate && onNavigate('dashboard')}
          className="mt-6 inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50 dark:border-[#30363d] dark:bg-[#161b22] dark:text-slate-200 dark:hover:bg-[#21262d] midnight:border-cyan-800/40 midnight:bg-[#0a1120] midnight:text-cyan-300"
        >
          <ArrowLeft size={16} />
          {t('rolesManagement.backToDashboard', 'Volver al Inicio')}
        </button>
      </main>
    );
  }

  return (
    <main className="flex-1 w-full overflow-y-auto bg-slate-50 p-4 text-slate-900 transition-colors duration-300 dark:bg-[#0d1117] dark:text-slate-100 midnight:bg-[#050B14] midnight:text-cyan-50 sm:p-6 lg:p-8">
      <div className="flex w-full flex-col space-y-6">
        {/* Cabecera con título e indicador de permisos */}
        <PageHeader
          title={t('rolesManagement.title', 'Administración de roles')}
          subtitle={t('rolesManagement.subtitle', 'Gestiona el permiso de SubAdministrador y revisa el estado de cada usuario.')}
          className="mb-0"
        >
          {effectiveIsSubAdmin ? (
            <span className="inline-flex w-fit items-center gap-2 rounded-xl border border-amber-300/40 bg-amber-500/10 px-3.5 py-2 text-xs font-semibold text-amber-700 transition-colors duration-300 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-300 midnight:border-amber-800/40 midnight:bg-amber-500/15 midnight:text-amber-300 shadow-sm">
              <ShieldAlert size={16} />
              {t('rolesManagement.supervisionBadge', 'Modo Supervisión (SubAdministrador)')}
            </span>
          ) : (
            <span className="inline-flex w-fit items-center gap-2 rounded-xl border border-cyan-200 bg-cyan-50 px-3.5 py-2 text-xs font-semibold text-cyan-700 transition-colors duration-300 dark:border-cyan-400/20 dark:bg-cyan-400/10 dark:text-cyan-300 midnight:border-cyan-800/40 midnight:bg-cyan-500/15 midnight:text-cyan-300 shadow-sm">
              <ShieldCheck size={16} />
              {t('rolesManagement.adminExclusiveAccess', 'Acceso exclusivo del Administrador')}
            </span>
          )}
        </PageHeader>

        {/* Notificación informativa contextual para SubAdministradores */}
        {effectiveIsSubAdmin && (
          <div className="flex items-start gap-3 rounded-2xl border border-amber-400/30 bg-amber-500/10 p-4 text-xs text-amber-900 transition-colors duration-300 dark:border-amber-400/20 dark:bg-amber-950/20 dark:text-amber-200 midnight:border-amber-500/30 midnight:bg-amber-950/30 midnight:text-amber-300 shadow-sm">
            <AlertTriangle className="h-5 w-5 shrink-0 text-amber-500 mt-0.5" />
            <div className="space-y-1">
              <strong className="block text-sm font-semibold">
                {t('rolesManagement.supervisionNoticeTitle', 'Modo de Auditoría y Consulta de Roles')}
              </strong>
              <p className="leading-relaxed opacity-90">
                {t(
                  'rolesManagement.supervisionNoticeDesc',
                  'Como SubAdministrador tienes acceso de lectura y supervisión a este directorio. Por políticas de seguridad, solo el Administrador Principal puede ascender miembros técnicos a Subadministrador o modificar roles de administración.'
                )}
              </p>
            </div>
          </div>
        )}

        {/* Tarjetas KPI de resumen */}
        <section
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
          aria-label={t('rolesManagement.summaryAriaLabel', 'Resumen de usuarios y roles')}
        >
          <article className={cardClass}>
            <div className="flex items-center justify-between text-slate-500 transition-colors duration-300 dark:text-slate-400 midnight:text-cyan-600">
              <span className="text-[11px] font-bold uppercase tracking-wider">
                {t('rolesManagement.users', 'Usuarios')}
              </span>
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 midnight:text-cyan-400">
                <Users size={18} />
              </span>
            </div>
            <strong className="mt-3 block text-2xl font-bold text-slate-900 transition-colors duration-300 dark:text-white midnight:text-cyan-50">
              {users.length}
            </strong>
            <span className="mt-1 block text-xs text-slate-400 dark:text-slate-500 midnight:text-cyan-600">
              {t('rolesManagement.totalRegisteredAccounts', 'Cuentas en el sistema')}
            </span>
          </article>

          <article className={cardClass}>
            <div className="flex items-center justify-between text-slate-500 transition-colors duration-300 dark:text-slate-400 midnight:text-cyan-600">
              <span className="text-[11px] font-bold uppercase tracking-wider">
                {t('rolesManagement.activeAdmins', 'Administradores')}
              </span>
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 midnight:text-cyan-400">
                <Shield size={18} />
              </span>
            </div>
            <strong className="mt-3 block text-2xl font-bold text-slate-900 transition-colors duration-300 dark:text-white midnight:text-cyan-50">
              {adminCount}
            </strong>
            <span className="mt-1 block text-xs text-slate-400 dark:text-slate-500 midnight:text-cyan-600">
              {t('rolesManagement.mainAdminDesc', 'Control total del sistema')}
            </span>
          </article>

          <article className={cardClass}>
            <div className="flex items-center justify-between text-slate-500 transition-colors duration-300 dark:text-slate-400 midnight:text-cyan-600">
              <span className="text-[11px] font-bold uppercase tracking-wider">
                {t('rolesManagement.subAdmins', 'SubAdministradores')}
              </span>
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400 midnight:text-violet-300">
                <ShieldCheck size={18} />
              </span>
            </div>
            <strong className="mt-3 block text-2xl font-bold text-slate-900 transition-colors duration-300 dark:text-white midnight:text-cyan-50">
              {subAdminCount}
            </strong>
            <span className="mt-1 block text-xs text-slate-400 dark:text-slate-500 midnight:text-cyan-600">
              {t('rolesManagement.subAdminDesc', 'Supervisión delegada')}
            </span>
          </article>

          <article className={cardClass}>
            <div className="flex items-center justify-between text-slate-500 transition-colors duration-300 dark:text-slate-400 midnight:text-cyan-600">
              <span className="text-[11px] font-bold uppercase tracking-wider">
                {t('rolesManagement.online', 'En línea')}
              </span>
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 midnight:text-emerald-300">
                <Wifi size={18} />
              </span>
            </div>
            <strong className="mt-3 block text-2xl font-bold text-slate-900 transition-colors duration-300 dark:text-white midnight:text-cyan-50">
              {onlineCount}
            </strong>
            <span className="mt-1 block text-xs text-slate-400 dark:text-slate-500 midnight:text-cyan-600">
              {t('rolesManagement.onlineSessionsDesc', 'Sesiones activas recientes')}
            </span>
          </article>
        </section>

        {/* Barra de herramientas: Búsqueda y Filtros por Rol */}
        <section className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-colors duration-300 dark:border-[#30363d] dark:bg-[#161b22] dark:shadow-none midnight:border-cyan-900/30 midnight:bg-[#0a1120] lg:flex-row lg:items-center lg:justify-between">
          {/* Input de Búsqueda */}
          <div className="relative flex-1">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 midnight:text-cyan-600"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('rolesManagement.searchPlaceholder', 'Buscar por nombre, correo, usuario o rol...')}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-9 text-xs font-medium text-slate-900 transition-colors placeholder:text-slate-400 focus:border-cyan-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500/20 dark:border-[#30363d] dark:bg-[#0d1117] dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-cyan-400 dark:focus:bg-[#161b22] midnight:border-cyan-900/40 midnight:bg-[#050B14] midnight:text-cyan-100 midnight:placeholder:text-cyan-700"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 midnight:text-cyan-600 midnight:hover:text-cyan-400"
                aria-label={t('rolesManagement.clearFilters', 'Restablecer filtros')}
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Filtros rápidos por Rol */}
          <div className="flex flex-wrap items-center gap-1.5" role="tablist">
            {[
              { id: 'all', label: t('rolesManagement.filterAll', 'Todos'), count: users.length },
              { id: 'admins', label: t('rolesManagement.filterAdmins', 'Administradores'), count: adminCount },
              { id: 'subadmins', label: t('rolesManagement.filterSubAdmins', 'SubAdministradores'), count: subAdminCount },
              { id: 'technical', label: t('rolesManagement.filterTechnical', 'Equipo Técnico'), count: technicalCount },
              { id: 'online', label: t('rolesManagement.filterOnline', 'En línea'), count: onlineCount },
            ].map((tab) => {
              const isActive = selectedFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setSelectedFilter(tab.id)}
                  className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all duration-200 ${
                    isActive
                      ? 'bg-cyan-500 text-white shadow-sm dark:bg-cyan-400 dark:text-slate-950 midnight:bg-cyan-500 midnight:text-slate-950'
                      : 'border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 dark:border-[#30363d] dark:bg-[#0d1117] dark:text-slate-400 dark:hover:bg-[#21262d] midnight:border-cyan-900/40 midnight:bg-[#050B14] midnight:text-cyan-500/70 midnight:hover:bg-cyan-900/30'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`rounded-full px-1.5 py-0.2 text-[10px] ${
                      isActive
                        ? 'bg-white/20 text-white dark:bg-slate-950/20 dark:text-slate-950 midnight:bg-slate-950/20 midnight:text-slate-950 font-bold'
                        : 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400 midnight:bg-cyan-900/40 midnight:text-cyan-400'
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Listado central de usuarios del sistema */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-colors duration-300 dark:border-[#30363d] dark:bg-[#161b22] dark:shadow-none midnight:border-cyan-900/30 midnight:bg-[#0a1120]">
          <header className="flex flex-col gap-2 border-b border-slate-200 px-5 py-4 transition-colors duration-300 dark:border-[#30363d] midnight:border-cyan-900/30 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div>
              <h2 className="text-base font-bold text-slate-900 transition-colors duration-300 dark:text-white midnight:text-cyan-50">
                {t('rolesManagement.systemUsers', 'Usuarios del sistema')}
              </h2>
              <p className="mt-0.5 text-xs text-slate-500 transition-colors duration-300 dark:text-slate-400 midnight:text-cyan-500/70">
                {t('rolesManagement.systemUsersDesc', 'Activa o desactiva el rol de SubAdministrador para cada integrante.')}
              </p>
            </div>
            <span className="text-xs font-medium text-slate-400 dark:text-slate-500 midnight:text-cyan-600">
              {t('rolesManagement.showingCount', `Mostrando ${filteredUsers.length} de ${users.length} usuarios`, {
                count: filteredUsers.length,
                total: users.length,
              })}
            </span>
          </header>

          {filteredUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500 midnight:bg-cyan-950/40 midnight:text-cyan-600">
                <UserX size={24} />
              </div>
              <p className="mt-3 text-sm font-semibold text-slate-900 dark:text-white midnight:text-cyan-100">
                {t('rolesManagement.noResults', 'No se encontraron usuarios coincidentes')}
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 midnight:text-cyan-600">
                {t('rolesManagement.noResultsDesc', 'Prueba ajustando los términos de búsqueda o los filtros seleccionados.')}
              </p>
              {(searchQuery || selectedFilter !== 'all') && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedFilter('all');
                  }}
                  className="mt-4 rounded-xl border border-slate-300 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 dark:border-[#30363d] dark:bg-[#0d1117] dark:text-slate-200 dark:hover:bg-[#21262d] midnight:border-cyan-800/40 midnight:bg-[#050B14] midnight:text-cyan-300"
                >
                  {t('rolesManagement.clearFilters', 'Restablecer filtros')}
                </button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-slate-200 dark:divide-[#30363d] midnight:divide-cyan-900/30">
              {filteredUsers.map((user) => {
                const isSelf =
                  currentUser &&
                  (user.id === currentUser.id ||
                    user.email === currentUser.email ||
                    (currentUser.username && user.username === currentUser.username));

                const restrictionReason = effectiveIsSubAdmin ? getSubAdminRestrictionReason(user) : '';

                return (
                  <article
                    key={user.id}
                    className="grid gap-4 p-4 transition-colors duration-200 hover:bg-slate-50/70 dark:hover:bg-white/[0.02] midnight:hover:bg-cyan-900/15 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center sm:px-6 sm:py-4"
                  >
                    {/* Información del usuario y avatar */}
                    <div className="flex min-w-0 items-center gap-3.5">
                      <div className="relative shrink-0">
                        <UserAvatar user={user} />
                        <span
                          className={`absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white dark:border-[#161b22] midnight:border-[#0a1120] ${
                            user.isOnline ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600 midnight:bg-cyan-950'
                          }`}
                          title={user.isOnline ? t('rolesManagement.online', 'En línea') : t('rolesManagement.offline', 'Desconectado')}
                        />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="truncate text-sm font-bold text-slate-900 transition-colors duration-300 dark:text-white midnight:text-cyan-50">
                            {user.name}
                          </h3>
                          {isSelf && (
                            <span className="rounded-full bg-cyan-100 px-2 py-0.5 text-[9px] font-bold text-cyan-800 dark:bg-cyan-950/60 dark:text-cyan-300 midnight:bg-cyan-900/50 midnight:text-cyan-300">
                              Tú
                            </span>
                          )}
                        </div>
                        <p className="mt-0.5 truncate text-xs text-slate-500 transition-colors duration-300 dark:text-slate-400 midnight:text-cyan-500/70">
                          {user.email}
                        </p>
                        <span
                          className={`mt-1 inline-flex items-center gap-1.5 text-[11px] font-medium ${
                            user.isOnline
                              ? 'text-emerald-600 dark:text-emerald-400 midnight:text-emerald-300'
                              : 'text-slate-400 dark:text-slate-500 midnight:text-cyan-600'
                          }`}
                        >
                          {user.isOnline ? <Wifi size={12} /> : <WifiOff size={12} />}
                          {user.isOnline ? t('rolesManagement.online', 'En línea') : t('rolesManagement.offline', 'Desconectado')}
                        </span>
                      </div>
                    </div>

                    {/* Contenedor responsivo: en móvil distribuye el rol a la izquierda y la acción a la otra esquina (derecha), en escritorio se disuelve con sm:contents */}
                    <div className="flex flex-wrap items-end justify-between gap-3 pt-2.5 border-t border-slate-100 dark:border-[#30363d]/40 sm:border-0 sm:pt-0 sm:contents">
                      {/* Columna de Rol actual */}
                      <div className="sm:min-w-36 sm:text-right">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 midnight:text-cyan-600">
                          {t('rolesManagement.currentRole', 'Rol actual')}
                        </p>
                        <div className="mt-1 flex items-center gap-1.5 sm:justify-end">
                          {user.isAdmin ? (
                            <span className="inline-flex items-center gap-1 rounded-lg border border-cyan-400/30 bg-cyan-400/10 px-2.5 py-1 text-xs font-bold text-cyan-700 dark:text-cyan-300 midnight:text-cyan-300 shadow-sm">
                              <ShieldCheck size={13} />
                              {t('rolesManagement.admin', 'Administrador')}
                            </span>
                          ) : user.isSubAdmin ? (
                            <span className="inline-flex items-center gap-1 rounded-lg border border-violet-400/30 bg-violet-400/10 px-2.5 py-1 text-xs font-semibold text-violet-700 dark:text-violet-300 midnight:text-violet-300 shadow-sm">
                              <Shield size={13} />
                              {t('rolesManagement.subAdmin', 'SubAdministrador')}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 dark:border-[#30363d] dark:bg-[#0d1117] dark:text-slate-300 midnight:border-cyan-900/40 midnight:bg-[#050B14] midnight:text-cyan-200">
                              <Users size={13} />
                              {t('rolesManagement.technicalTeam', 'Equipo Técnico')}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Columna de Acciones de Control de Rol: Toggle Switch Moderno */}
                      <div className="flex justify-end sm:justify-end ml-auto sm:ml-0">
                        {user.isAdmin ? (
                          <span className="flex min-w-[140px] items-center justify-center gap-1.5 rounded-full border border-cyan-400/40 bg-cyan-400/10 px-3.5 py-1.5 text-[10px] font-bold text-cyan-700 dark:text-cyan-300 midnight:text-cyan-300 shadow-sm">
                            <ShieldCheck size={13} /> {t('rolesManagement.mainAdmin', 'Admin Principal')}
                          </span>
                        ) : effectiveIsSubAdmin ? (
                          /* Si quien visualiza es SubAdministrador: controles bloqueados con indicador claro y tooltip */
                          <div className="flex flex-col items-end gap-1.5">
                            <div className="flex items-center gap-3">
                              <span
                                className={`inline-flex min-w-[84px] items-center gap-1.5 text-xs font-semibold opacity-70 transition-colors ${
                                  user.isSubAdmin
                                    ? 'text-cyan-600 dark:text-cyan-400 midnight:text-cyan-300'
                                    : 'text-slate-400 dark:text-slate-500 midnight:text-cyan-700'
                                }`}
                              >
                                <Lock size={12} className="opacity-80 shrink-0" />
                                {user.isSubAdmin ? t('rolesManagement.enabled', 'Activado') : t('rolesManagement.disabled', 'Desactivado')}
                              </span>

                              <button
                                type="button"
                                role="switch"
                                disabled
                                title={restrictionReason}
                                aria-label={t('rolesManagement.subAdminToggleAriaLabel', `Rol de SubAdministrador para ${user.name}`, {
                                  name: user.name,
                                })}
                                aria-checked={user.isSubAdmin}
                                className={`relative inline-flex h-6 w-11 shrink-0 cursor-not-allowed items-center rounded-full opacity-50 transition-colors duration-200 ease-in-out ${
                                  user.isSubAdmin
                                    ? 'bg-cyan-500 shadow-sm shadow-cyan-500/25'
                                    : 'bg-slate-300 dark:bg-[#30363d] midnight:bg-cyan-950/80 border border-slate-300 dark:border-slate-700 midnight:border-cyan-800/60'
                                }`}
                              >
                                <span
                                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition duration-200 ease-in-out ${
                                    user.isSubAdmin ? 'translate-x-[22px]' : 'translate-x-[2px]'
                                  }`}
                                />
                              </button>
                            </div>
                            <span
                              className="max-w-[220px] truncate text-[9px] text-slate-400 dark:text-slate-500 midnight:text-cyan-700"
                              title={restrictionReason}
                            >
                              {restrictionReason}
                            </span>
                          </div>
                        ) : (
                          /* Si quien visualiza es Administrador Principal: control interactivo activo con switch deslizante */
                          <div className="flex items-center gap-3">
                            <span
                              className={`inline-flex min-w-[84px] items-center gap-1.5 text-xs font-semibold transition-colors ${
                                user.isSubAdmin
                                  ? 'text-cyan-600 dark:text-cyan-400 midnight:text-cyan-300'
                                  : 'text-slate-400 dark:text-slate-500 midnight:text-cyan-700'
                              }`}
                            >
                              <span
                                className={`h-2 w-2 rounded-full transition-colors ${
                                  user.isSubAdmin
                                    ? 'bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.8)]'
                                    : 'bg-slate-400 dark:bg-slate-600'
                                }`}
                              />
                              {user.isSubAdmin ? t('rolesManagement.enabled', 'Activado') : t('rolesManagement.disabled', 'Desactivado')}
                            </span>

                            <button
                              type="button"
                              role="switch"
                              aria-label={t('rolesManagement.subAdminToggleAriaLabel', `Rol de SubAdministrador para ${user.name}`, {
                                name: user.name,
                              })}
                              aria-checked={user.isSubAdmin}
                              onClick={() => onToggleSubAdmin && onToggleSubAdmin(user.id)}
                              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-cyan-500/40 focus:ring-offset-2 dark:focus:ring-offset-[#161b22] midnight:focus:ring-offset-[#0a1120] ${
                                user.isSubAdmin
                                  ? 'bg-cyan-500 shadow-sm shadow-cyan-500/25'
                                  : 'bg-slate-300 dark:bg-[#30363d] midnight:bg-cyan-950/80 border border-slate-300 dark:border-slate-700 midnight:border-cyan-800/60'
                              }`}
                            >
                              <span
                                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                                  user.isSubAdmin ? 'translate-x-[22px]' : 'translate-x-[2px]'
                                }`}
                              />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
