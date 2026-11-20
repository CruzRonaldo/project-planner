import {
  KeyRound,
  LayoutDashboard,
  Briefcase,
  Users,
  Code,
  Settings,
  ShieldCheck,
  HelpCircle,
  BookOpen,
  Webhook,
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
    title: 'Dashboard y Planificación Estratégica',
    shortTitle: 'Dashboard & Gantt',
    filename: '02-dashboard-y-planificacion.md',
    icon: LayoutDashboard,
    category: 'operaciones',
    roleRequired: 'all',
    targetModule: 'planning',
    moduleShortcut: 'Shift + 2',
    summary: 'Supervisión de KPIs, cronograma Gantt dinámico, reprogramación y regla de gobernanza >$100k.',
  },
  {
    id: '03-portafolio',
    number: '3',
    title: 'Portafolio de Proyectos y Ficha Técnica',
    shortTitle: 'Portafolio & Obra',
    filename: '03-portafolio-y-operaciones.md',
    icon: Briefcase,
    category: 'proyectos',
    roleRequired: 'all',
    targetModule: 'portfolio',
    moduleShortcut: 'Shift + 3',
    summary: 'Creación y filtro de proyectos, asignación de líderes técnicos y control de órdenes operativas.',
  },
  {
    id: '04-personal',
    number: '4',
    title: 'Equipo Técnico y Recursos Humanos',
    shortTitle: 'Personal & Nómina',
    filename: '04-equipo-tecnico-y-recursos-humanos.md',
    icon: Users,
    category: 'rrhh',
    roleRequired: 'all',
    targetModule: 'technical-team',
    moduleShortcut: 'Shift + 5',
    summary: 'Directorio de ingenieros, matriz de disponibilidad, carga laboral e historial de incidencias.',
  },
  {
    id: '05-integraciones',
    number: '5',
    title: 'Integraciones Externas y Servicios',
    shortTitle: 'Conectores Cloud',
    filename: '05-integraciones.md',
    icon: Code,
    category: 'integraciones',
    roleRequired: 'all',
    targetModule: 'integrations',
    moduleShortcut: 'Shift + 7',
    summary: 'Conexión con Autodesk Revit/APS, sincronización con Google Drive y automatizaciones Make.',
  },
  {
    id: '06-configuracion',
    number: '6',
    title: 'Configuración y Seguridad Personal',
    shortTitle: 'Perfil y Claves',
    filename: '06-configuracion-y-seguridad.md',
    icon: Settings,
    category: 'seguridad',
    roleRequired: 'all',
    targetModule: 'configuracion',
    moduleShortcut: 'Shift + 9',
    summary: 'Personalización de temas (Claro/Oscuro/Medianoche), escala de fuente y cambio seguro de contraseña.',
  },
  {
    id: '07-administracion',
    number: '7',
    title: 'Administración, Roles y Respaldos',
    shortTitle: 'Roles & PostgreSQL',
    filename: '07-administracion-y-respaldos.md',
    icon: ShieldCheck,
    category: 'admin',
    roleRequired: 'admin',
    targetModule: 'roles',
    moduleShortcut: null,
    summary: 'Promoción de Subadministradores, auditoría de eventos y respaldos PostgreSQL con sumas SHA-256.',
  },
  {
    id: '08-soporte',
    number: '8',
    title: 'Resolución de Problemas y Soporte',
    shortTitle: 'Soporte y FAQs',
    filename: '08-solucion-de-problemas.md',
    icon: HelpCircle,
    category: 'soporte',
    roleRequired: 'all',
    targetModule: null,
    moduleShortcut: null,
    summary: 'Matriz de resolución rápida de errores, escalamiento por niveles y buenas prácticas de seguridad.',
  },
  {
    id: '09-make-webhooks',
    number: '9',
    title: 'Automatizaciones y Webhooks con Make',
    shortTitle: 'Make & Webhooks',
    filename: '09-configuracion-make.md',
    icon: Webhook,
    category: 'integraciones',
    roleRequired: 'admin',
    targetModule: 'integrations',
    moduleShortcut: null,
    summary: 'Arquitectura de Django Signals, despacho asíncrono con transaction.on_commit y configuración de escenarios en Make.',
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
