import {
  KeyRound,
  LayoutDashboard,
  TrendingUp,
  Briefcase,
  Zap,
  Users,
  UserCog,
  Code,
  ClipboardCheck,
  Settings,
  ShieldCheck,
  HelpCircle,
  BookOpen,
  Webhook,
  Bell,
} from 'lucide-react';

// Carga en caliente/compilación de todos los archivos .md canónicos del manual
const rawMarkdownFiles = import.meta.glob('../../content/manual/**/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
});

export function getMarkdownContent(filename, lang = 'es') {
  const entries = Object.entries(rawMarkdownFiles);

  // 1º Coincidencia en /${lang}/${filename}
  const langMatch = entries.find(([path]) => path.endsWith(`/${lang}/${filename}`));
  if (langMatch) return langMatch[1];

  // 2º Fallback a /es/${filename}
  const esMatch = entries.find(([path]) => path.endsWith(`/es/${filename}`));
  if (esMatch) return esMatch[1];

  // 3º Fallback a /${filename}
  const rootMatch = entries.find(([path]) => path.endsWith(`/${filename}`));
  if (rootMatch) return rootMatch[1];

  return '';
}

const BASE_SECTIONS = [
  {
    id: 'intro',
    number: '0',
    title: 'Índice y Estructura General',
    shortTitle: 'Índice General',
    filename: 'README.md',
    icon: BookOpen,
    category: 'general',
    roleRequired: 'all',
    targetModule: null,
    moduleShortcut: null,
    summary: 'Estructura modular del manual, roles autorizados, convenciones y metodología Docs-as-Code.',
  },
  {
    id: '01-acceso',
    number: '1',
    title: 'Acceso y Navegación del Sistema',
    shortTitle: 'Acceso y 2FA',
    filename: '01-acceso-y-navegacion.md',
    icon: KeyRound,
    category: 'seguridad',
    roleRequired: 'all',
    targetModule: 'login',
    moduleShortcut: null,
    summary: 'Inicio de sesión, selección de roles, autenticación de dos factores (TOTP) y atajos de teclado.',
  },
  {
    id: '02-dashboard',
    number: '2',
    title: 'Panel de Control (Dashboard)',
    shortTitle: 'Dashboard',
    filename: '02-panel-de-control-dashboard.md',
    icon: LayoutDashboard,
    category: 'operaciones',
    roleRequired: 'all',
    targetModule: 'dashboard',
    moduleShortcut: 'Shift + 1',
    summary: 'Supervisión de KPIs ejecutivos, calendario resumido de 6 meses, alertas críticas y salud de portafolio.',
  },
  {
    id: '03-planificacion',
    number: '3',
    title: 'Planificación Estratégica y Cronograma Gantt',
    shortTitle: 'Gantt & Hitos',
    filename: '03-planificacion-estrategica.md',
    icon: TrendingUp,
    category: 'operaciones',
    roleRequired: 'all',
    targetModule: 'planning',
    moduleShortcut: 'Shift + 2',
    summary: 'Cronograma Gantt interactivo, reprogramación de calendario, hitos globales y regla de gobernanza >$100k.',
  },
  {
    id: '04-portafolio',
    number: '4',
    title: 'Portafolio y Repositorio de Proyectos',
    shortTitle: 'Portafolio',
    filename: '04-portafolio-de-proyectos.md',
    icon: Briefcase,
    category: 'proyectos',
    roleRequired: 'all',
    targetModule: 'portfolio',
    moduleShortcut: 'Shift + 3',
    summary: 'Creación de proyectos, tarjetas de estado, distintivo "Tu Liderazgo", Google Drive y salas Jitsi Meet.',
  },
  {
    id: '05-operaciones',
    number: '5',
    title: 'Gestión Operativa y Órdenes de Trabajo',
    shortTitle: 'Operaciones & CPM',
    filename: '05-gestion-operativa.md',
    icon: Zap,
    category: 'proyectos',
    roleRequired: 'all',
    targetModule: 'operations',
    moduleShortcut: 'Shift + 4',
    summary: 'Ficha técnica de obra, emisión de órdenes de trabajo, control de horas y cálculo de Ruta Crítica (CPM).',
  },
  {
    id: '06-equipo-tecnico',
    number: '6',
    title: 'Directorio de Equipo Técnico',
    shortTitle: 'Equipo Técnico',
    filename: '06-equipo-tecnico.md',
    icon: Users,
    category: 'rrhh',
    roleRequired: 'all',
    targetModule: 'technical-team',
    moduleShortcut: 'Shift + 5',
    summary: 'Directorio de ingenieros y especialistas, disponibilidad, reasignación departamental y baja auditada.',
  },
  {
    id: '07-recursos-humanos',
    number: '7',
    title: 'Recursos Humanos, Carga Laboral e Incidencias',
    shortTitle: 'Recursos Humanos',
    filename: '07-recursos-humanos.md',
    icon: UserCog,
    category: 'rrhh',
    roleRequired: 'all',
    targetModule: 'human-resources',
    moduleShortcut: 'Shift + 6',
    summary: 'Matriz de asignación de carga laboral, registro y resolución de incidencias y exportación a Excel.',
  },
  {
    id: '08-integraciones',
    number: '8',
    title: 'Integraciones Externas y Servicios',
    shortTitle: 'Integraciones',
    filename: '08-integraciones-servicios.md',
    icon: Code,
    category: 'integraciones',
    roleRequired: 'all',
    targetModule: 'integrations',
    moduleShortcut: 'Shift + 7',
    summary: 'Conexión con Make (Integromat), repositorio documental en Google Drive y visor 3D Autodesk BIM/APS.',
  },
  {
    id: '09-auditoria-periodica',
    number: '9',
    title: 'Auditoría Periódica de Proyectos',
    shortTitle: 'Auditoría CPM',
    filename: '09-auditoria-periodica.md',
    icon: ClipboardCheck,
    category: 'auditoria',
    roleRequired: 'all',
    targetModule: 'project-audit',
    moduleShortcut: 'Shift + 9',
    summary: 'Inspección de desviaciones, ciclos 30/90/180 días, ordenación por más CPM vencidas, CSV y acceso directo.',
  },
  {
    id: '10-roles',
    number: '10',
    title: 'Gestión de Roles y Permisos (RBAC)',
    shortTitle: 'Roles de Usuario',
    filename: '10-gestion-roles.md',
    icon: ShieldCheck,
    category: 'admin',
    roleRequired: 'admin',
    targetModule: 'roles',
    moduleShortcut: null,
    summary: 'Administración de cuentas de usuario, asignación de perfiles (Admin, Subadmin, User) y bitácora RBAC.',
  },
  {
    id: '11-configuracion',
    number: '11',
    title: 'Configuración, Perfil y Seguridad Personal',
    shortTitle: 'Configuración',
    filename: '11-configuracion-y-seguridad.md',
    icon: Settings,
    category: 'seguridad',
    roleRequired: 'all',
    targetModule: 'configuracion',
    moduleShortcut: null,
    summary: 'Preferencias visuales, temas (Claro/Oscuro/Medianoche), escala de fuente, 2FA y respaldos PostgreSQL SHA-256.',
  },
  {
    id: '12-notificaciones',
    number: '12',
    title: 'Control y Centro de Notificaciones',
    shortTitle: 'Notificaciones',
    filename: '12-control-de-notificaciones.md',
    icon: Bell,
    category: 'sistema',
    roleRequired: 'all',
    targetModule: null,
    moduleShortcut: null,
    summary: 'Arquitectura multicanal de alertas (Toasts instantáneos, centro in-app en barra superior y Webhooks).',
  },
  {
    id: '13-make-webhooks',
    number: '13',
    title: 'Automatizaciones y Webhooks con Make',
    shortTitle: 'Make & Webhooks',
    filename: '13-configuracion-make.md',
    icon: Webhook,
    category: 'integraciones',
    roleRequired: 'admin',
    targetModule: 'integrations',
    moduleShortcut: null,
    summary: 'Arquitectura de Django Signals, despacho asíncrono con transaction.on_commit y escenarios en Make.',
  },
  {
    id: '14-soporte',
    number: '14',
    title: 'Resolución de Problemas y Soporte',
    shortTitle: 'Soporte y FAQs',
    filename: '14-solucion-de-problemas.md',
    icon: HelpCircle,
    category: 'soporte',
    roleRequired: 'all',
    targetModule: null,
    moduleShortcut: null,
    summary: 'Matriz de resolución rápida de errores, escalamiento por niveles y buenas prácticas operativas.',
  },
];

export function getManualSections(lang = 'es', t = null) {
  const hasT = typeof t === 'function';
  return BASE_SECTIONS.map((section) => ({
    ...section,
    title: hasT ? t(`manual.sections.${section.id}.title`, section.title) : section.title,
    shortTitle: hasT ? t(`manual.sections.${section.id}.shortTitle`, section.shortTitle) : section.shortTitle,
    summary: hasT ? t(`manual.sections.${section.id}.summary`, section.summary) : section.summary,
    content: getMarkdownContent(section.filename, lang),
  }));
}

export const MANUAL_SECTIONS = getManualSections('es');

export function getSectionById(id, lang = 'es', t = null) {
  const sections = getManualSections(lang, t);
  return sections.find((sec) => sec.id === id) || sections[0];
}
