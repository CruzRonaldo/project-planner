import {
  LayoutDashboard,
  TrendingUp,
  Briefcase,
  Zap,
  Users,
  UserCog,
  Code,
  Settings,
  BookOpen,
  ShieldCheck,
  ClipboardCheck,
} from 'lucide-react';

export const USER_ROLES = {
  ADMIN: 'admin',
  SUBADMIN: 'subadmin',
  USER: 'user',
};

export const NAVIGATION_ITEMS = [
  {
    id: 'dashboard',
    path: '/dashboard',
    label: 'Inicio',
    mobileLabel: 'Inicio',
    icon: LayoutDashboard,
    roles: [USER_ROLES.ADMIN, USER_ROLES.USER],
    category: 'common',
    searchPlaceholder: 'Buscar proyectos, hitos o equipos...',
    enabled: true,
    showInSidebar: true,
    showInMobile: true,
  },
  {
    id: 'planning',
    path: '/planning',
    label: 'Planificación Estratégica',
    mobileLabel: 'Planificación',
    icon: TrendingUp,
    roles: [USER_ROLES.ADMIN, USER_ROLES.USER],
    category: 'admin',
    searchPlaceholder: 'Buscar en planificación maestra...',
    enabled: true,
    showInSidebar: true,
    showInMobile: true,
  },
  {
    id: 'portfolio',
    path: '/portfolio',
    label: 'Portafolio',
    mobileLabel: 'Portafolio',
    icon: Briefcase,
    roles: [USER_ROLES.ADMIN, USER_ROLES.USER],
    category: 'technical',
    searchPlaceholder: 'Buscar por nombre de proyecto, líder, etiquetas...',
    enabled: true,
    showInSidebar: true,
    showInMobile: true,
  },
  {
    id: 'operations',
    path: '/operations',
    label: 'Gestión Operativa',
    mobileLabel: 'Operaciones',
    icon: Zap,
    roles: [USER_ROLES.ADMIN, USER_ROLES.USER],
    category: 'technical',
    searchPlaceholder: 'Buscar órdenes de trabajo, tareas o alertas...',
    enabled: true,
    showInSidebar: true,
    showInMobile: true,
  },
  {
    id: 'technical-team',
    path: '/technical-team',
    label: 'Equipo Técnico',
    mobileLabel: 'Equipo',
    icon: Users,
    roles: [USER_ROLES.ADMIN, USER_ROLES.USER],
    category: 'technical',
    searchPlaceholder: 'Buscar técnico, área, especialidad o proyecto...',
    enabled: true,
    showInSidebar: true,
    showInMobile: true,
  },
  {
    id: 'human-resources',
    path: '/human-resources',
    label: 'Recursos Humanos',
    mobileLabel: 'RR. HH.',
    icon: UserCog,
    roles: [USER_ROLES.ADMIN, USER_ROLES.USER],
    category: 'human-resources',
    searchPlaceholder: 'Buscar personal, disponibilidad o estados...',
    enabled: true,
    showInSidebar: true,
    showInMobile: true,
  },
  {
    id: 'integrations',
    path: '/integrations',
    label: 'Integraciones',
    mobileLabel: 'Integrar',
    icon: Code,
    roles: [USER_ROLES.ADMIN, USER_ROLES.USER],
    category: 'common',
    searchPlaceholder: 'Buscar integración, actividad o estado...',
    enabled: true,
    showInSidebar: true,
    showInMobile: true,
  },
  {
    id: 'manual',
    path: '/manual',
    label: 'Manual de Usuario',
    mobileLabel: 'Manual',
    icon: BookOpen,
    roles: [USER_ROLES.ADMIN, USER_ROLES.USER],
    category: 'common',
    searchPlaceholder: 'Buscar en el manual de usuario o atajos...',
    enabled: true,
    showInSidebar: true,
    showInMobile: true,
  },
  {
    id: 'project-audit',
    path: '/project-audit',
    aliases: ['/auditoria', '/audit', 'auditoria', 'audit'],
    label: 'Auditoría de Proyectos',
    mobileLabel: 'Auditoría',
    icon: ClipboardCheck,
    roles: [USER_ROLES.ADMIN, USER_ROLES.USER],
    category: 'technical',
    searchPlaceholder: 'Buscar en auditoría de proyectos...',
    enabled: true,
    showInSidebar: true,
    showInMobile: true,
  },
  {
    id: 'roles',
    path: '/role-management',
    aliases: ['/roles', '/roles-management', 'role-management', 'roles-management'],
    label: 'Gestión de Roles',
    mobileLabel: 'Roles',
    icon: ShieldCheck,
    roles: [USER_ROLES.ADMIN, USER_ROLES.SUBADMIN],
    category: 'admin',
    searchPlaceholder: 'Buscar usuarios, correos o roles...',
    enabled: true,
    showInSidebar: false,
    showInMobile: false,
  },
  {
    id: 'configuracion',
    path: '/configuracion',
    label: 'Configuración',
    mobileLabel: 'Config',
    icon: Settings,
    roles: [USER_ROLES.ADMIN, USER_ROLES.USER],
    category: 'common',
    searchPlaceholder: 'Buscar en configuración...',
    enabled: true,
    showInSidebar: false,
    showInMobile: false,
  },
];

export function hasViewAccess(viewId, user) {
  const item = NAVIGATION_ITEMS.find(
    (nav) => nav.id === viewId || (nav.aliases && (nav.aliases.includes(viewId) || nav.aliases.includes(`/${viewId}`)))
  );
  if (!item) return false;

  const isAdmin =
    user?.accountType === USER_ROLES.ADMIN ||
    user?.role === USER_ROLES.ADMIN ||
    Boolean(user?.is_superuser);

  const isSubAdmin =
    user?.roleLabel === 'SubAdministrador' ||
    user?.role === USER_ROLES.SUBADMIN ||
    user?.role === 'subadmin' ||
    Boolean(user?.isSubAdmin);

  if (item.roles && !item.roles.includes(USER_ROLES.USER)) {
    if (item.roles.includes(USER_ROLES.ADMIN) && item.roles.includes(USER_ROLES.SUBADMIN)) {
      return isAdmin || isSubAdmin;
    }
    if (item.roles.includes(USER_ROLES.ADMIN)) {
      return isAdmin;
    }
    if (item.roles.includes(USER_ROLES.SUBADMIN)) {
      return isSubAdmin;
    }
    return false;
  }

  return true;
}

export function getSearchPlaceholder(viewId) {
  const item = NAVIGATION_ITEMS.find(
    (nav) => nav.id === viewId || (nav.aliases && (nav.aliases.includes(viewId) || nav.aliases.includes(`/${viewId}`)))
  );
  return item?.searchPlaceholder || 'Buscar proyectos, hitos o equipos...';
}

export function getAllowedSidebarItems(user) {
  return NAVIGATION_ITEMS.filter(
    (item) => item.showInSidebar && hasViewAccess(item.id, user)
  );
}

export function getAllowedMobileItems(user) {
  return NAVIGATION_ITEMS.filter(
    (item) => item.showInMobile && hasViewAccess(item.id, user)
  );
}

export function getViewIdFromPath(pathname) {
  const normalized = pathname.replace(/\/$/, '') || '/';
  if (normalized === '/' || normalized === '/dashboard') return 'dashboard';
  const matched = NAVIGATION_ITEMS.find(
    (item) => item.path === normalized || (item.aliases && item.aliases.includes(normalized))
  );
  return matched ? matched.id : 'dashboard';
}

export function getPathFromViewId(viewId) {
  const item = NAVIGATION_ITEMS.find(
    (n) => n.id === viewId || (n.aliases && (n.aliases.includes(viewId) || n.aliases.includes(`/${viewId}`)))
  );
  return item ? item.path : '/dashboard';
}
