import {
  LayoutDashboard,
  TrendingUp,
  Briefcase,
  Zap,
  Users,
  UserCog,
  Code,
} from 'lucide-react';

export const USER_ROLES = {
  ADMIN: 'admin',
  USER: 'user',
};

export const NAVIGATION_ITEMS = [
  {
    id: 'dashboard',
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
    id: 'roles',
    label: 'Gestión de Roles',
    mobileLabel: 'Roles',
    icon: UserCog,
    roles: [USER_ROLES.ADMIN],
    category: 'admin',
    searchPlaceholder: 'Buscar usuarios, correos o roles...',
    enabled: true,
    showInSidebar: false,
    showInMobile: false,
  },
];

export function hasViewAccess(viewId, user) {
  const item = NAVIGATION_ITEMS.find((nav) => nav.id === viewId);
  if (!item) return false;

  const isAdmin =
    user?.accountType === USER_ROLES.ADMIN ||
    user?.role === USER_ROLES.ADMIN ||
    Boolean(user?.is_superuser);

  if (item.roles.includes(USER_ROLES.ADMIN) && !item.roles.includes(USER_ROLES.USER)) {
    return isAdmin;
  }

  return true;
}

export function getSearchPlaceholder(viewId) {
  const item = NAVIGATION_ITEMS.find((nav) => nav.id === viewId);
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
