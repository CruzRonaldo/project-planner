export const operationalProjects = [
  'Torre Reforma (PRJ-2026-001)',
  'Puente Industrial (PRJ-2026-002)',
  'Centro Comercial Norte (PRJ-2026-003)',
  'Hospital Regional (PRJ-2026-004)',
];

export const operationTypes = ['Inspección técnica', 'Mantenimiento', 'Corrección', 'Control de calidad', 'Instalación', 'Supervisión de seguridad'];
export const operationalAreas = ['Arquitectura', 'Estructuras', 'Sistemas', 'Instalaciones', 'Seguridad y Calidad'];
export const workOrderPriorities = [
  { id: 'high', label: 'Alta prioridad', className: 'border-red-200 bg-red-50 text-red-700 dark:border-red-500/25 dark:bg-red-500/10 dark:text-red-400 midnight:border-red-500/30 midnight:bg-red-500/10 midnight:text-red-300' },
  { id: 'medium', label: 'Media', className: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/25 dark:bg-amber-500/10 dark:text-amber-400 midnight:border-amber-500/30 midnight:bg-amber-500/10 midnight:text-amber-300' },
  { id: 'low', label: 'Baja', className: 'border-slate-200 bg-slate-100 text-slate-600 dark:border-slate-500/25 dark:bg-slate-500/10 dark:text-slate-400 midnight:border-cyan-800/40 midnight:bg-cyan-900/30 midnight:text-cyan-500/70' },
];
export const workOrderStatuses = [
  { id: 'in-progress', label: 'En progreso', className: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/25 dark:bg-amber-500/10 dark:text-amber-400 midnight:border-amber-500/30 midnight:bg-amber-500/10 midnight:text-amber-300' },
  { id: 'completed', label: 'Completada', className: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-400 midnight:border-emerald-500/30 midnight:bg-emerald-500/10 midnight:text-emerald-300' },
  { id: 'planned', label: 'Planificada', className: 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-500/25 dark:bg-blue-500/10 dark:text-blue-400 midnight:border-cyan-500/30 midnight:bg-cyan-500/10 midnight:text-cyan-300' },
];

const initialOrders = [
  { id: 'order-104', code: '#104', project: operationalProjects[0], type: 'Inspección técnica', title: 'Inspección de cimentación', area: 'Estructuras', responsible: 'Sofía Torres', startDate: '2026-02-18', endDate: '2026-02-25', priority: 'high', status: 'in-progress', critical: true, tolerance: 3, documentUrl: '', description: 'Verificar compactación y prueba de revenimiento antes del vertido.', progress: 85 },
  { id: 'order-105', code: '#105', project: operationalProjects[1], type: 'Mantenimiento', title: 'Mantenimiento de juntas', area: 'Estructuras', responsible: 'Alejandro Ruiz', startDate: '2026-02-15', endDate: '2026-02-22', priority: 'medium', status: 'completed', critical: false, tolerance: 2, documentUrl: '', description: 'Mantenimiento preventivo de juntas estructurales.', progress: 100 },
  { id: 'order-106', code: '#106', project: operationalProjects[2], type: 'Corrección', title: 'Corrección de acabados', area: 'Arquitectura', responsible: 'Mateo Fernández', startDate: '2026-03-01', endDate: '2026-03-14', priority: 'low', status: 'planned', critical: false, tolerance: 5, documentUrl: '', description: 'Corregir observaciones de acabados del nivel comercial.', progress: 20 },
  { id: 'order-107', code: '#107', project: 'Subestación Eléctrica', type: 'Control de calidad', title: 'Tendido de media tensión', area: 'Instalaciones', responsible: 'Laura Castro', startDate: '2026-02-20', endDate: '2026-02-27', priority: 'high', status: 'in-progress', critical: true, tolerance: 1, documentUrl: '', description: 'Verificar tendido y certificación del cableado de media tensión.', progress: 60 },
];

const criticalActivities = [
  { id: 'activity-1', name: 'Cimentación Pilotes', project: 'Viaducto Elevado · Fase 1', start: 1, duration: 3, period: 'Ene - Mar (85% Completado)', progress: 85, color: '#3b82f6' },
  { id: 'activity-2', name: 'Montaje Estructura', project: 'Torre Reforma · Niveles 12-18', start: 2, duration: 4, period: 'Feb - May (60% Completado)', progress: 60, color: '#10b981' },
  { id: 'activity-3', name: 'Tender Red Eléctrica', project: 'Subestación Eléctrica Principal', start: 3, duration: 4, period: 'Mar - Jun (20% Completado)', progress: 20, color: '#a855f7' },
];

const alerts = [
  { id: 'alert-1', title: 'Falla en piloteo / estructura', project: 'Puente Industrial · Hace 1h', level: 'critical' },
  { id: 'alert-2', title: 'Pendiente aprobación de planos MEP', project: 'Subestación Eléctrica · Hace 4h', level: 'warning' },
];

const qualityChecks = [
  { id: 'quality-1', title: 'Prueba de resistencia concreto', status: 'Aprobada' },
  { id: 'quality-2', title: 'Inspección de soldadura de acero', status: 'Aprobada' },
  { id: 'quality-3', title: 'Certificación aislamiento cables', status: 'Pendiente' },
];

export function createOperationsData() {
  return {
    metrics: { inProgress: 18, completed: 142, incidents: 3, efficiency: 94.2 },
    orders: initialOrders.map((order) => ({ ...order })),
    activities: criticalActivities.map((activity) => ({ ...activity })),
    alerts: alerts.map((alert) => ({ ...alert })),
    qualityChecks: qualityChecks.map((check) => ({ ...check })),
  };
}

function normalizeText(value) {
  return String(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

export function getWorkOrderDuration(startDate, endDate) {
  const start = new Date(`${startDate}T12:00:00`);
  const end = new Date(`${endDate}T12:00:00`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) return null;
  return Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)));
}

export function filterWorkOrders(orders, query = '', filter = 'all', project = 'all') {
  const normalizedQuery = normalizeText(query);
  return orders.filter((order) => {
    const matchesQuery = normalizeText(`${order.code} ${order.project} ${order.type} ${order.title} ${order.area} ${order.responsible} ${order.description}`).includes(normalizedQuery);
    const matchesFilter = filter === 'all' || (filter === 'high' && order.priority === 'high') || (filter === 'in-progress' && order.status === 'in-progress');
    const matchesProject = project === 'all' || order.project === project;
    return matchesQuery && matchesFilter && matchesProject;
  });
}

function validateDocumentUrl(value) {
  if (!value) return '';
  let url;
  try { url = new URL(value); } catch { throw new Error('Ingresa un enlace válido para el documento o plano.'); }
  if (url.protocol !== 'https:' || !['drive.google.com', 'docs.google.com'].includes(url.hostname)) throw new Error('El documento debe usar un enlace de Google Drive.');
  return url.toString();
}

export function createWorkOrder(data, draft, date = new Date()) {
  const project = draft.project?.trim() ?? '';
  const title = draft.title?.trim() ?? '';
  const responsible = draft.responsible?.trim() ?? '';
  const description = draft.description?.trim() ?? '';
  if (!project) throw new Error('Selecciona un proyecto asociado.');
  if (!operationTypes.includes(draft.type)) throw new Error('Selecciona un tipo de operación válido.');
  if (title.length < 3) throw new Error('Ingresa el título de la tarea u orden.');
  if (!operationalAreas.includes(draft.area)) throw new Error('Selecciona un área técnica válida.');
  if (!responsible) throw new Error('Selecciona un responsable asignado.');
  const duration = getWorkOrderDuration(draft.startDate, draft.endDate);
  if (!duration) throw new Error('La fecha límite debe ser igual o posterior a la fecha de inicio.');
  if (!workOrderPriorities.some((priority) => priority.id === draft.priority)) throw new Error('Selecciona un nivel de prioridad válido.');
  const tolerance = Number(draft.tolerance);
  if (String(draft.tolerance).trim() === '' || !Number.isInteger(tolerance) || tolerance < 0 || tolerance > 30) throw new Error('La tolerancia debe ser un número entero entre 0 y 30 días.');
  if (description.length < 10) throw new Error('Describe las instrucciones de terreno con mayor detalle.');
  const documentUrl = validateDocumentUrl(draft.documentUrl?.trim() ?? '');
  const largestCode = data.orders.reduce((largest, order) => Math.max(largest, Number(order.code.replace('#', '')) || 0), 0);
  const order = {
    id: `order-${date.getTime()}-${data.orders.length}`,
    code: `#${largestCode + 1}`,
    project,
    type: draft.type,
    title,
    area: draft.area,
    responsible,
    startDate: draft.startDate,
    endDate: draft.endDate,
    priority: draft.priority,
    status: 'in-progress',
    critical: Boolean(draft.critical),
    tolerance,
    documentUrl,
    description,
    progress: 0,
    duration,
  };
  return {
    ...data,
    metrics: { ...data.metrics, inProgress: data.metrics.inProgress + 1 },
    orders: [order, ...data.orders],
  };
}

function escapeCsv(value) {
  const text = String(value ?? '');
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

export function buildWorkOrdersCsv(orders) {
  const header = ['ID', 'Proyecto', 'Tipo', 'Título', 'Área', 'Responsable', 'Prioridad', 'Estado', 'Inicio', 'Límite'];
  const rows = orders.map((order) => [order.code, order.project, order.type, order.title, order.area, order.responsible, order.priority, order.status, order.startDate, order.endDate].map(escapeCsv).join(','));
  return [header.join(','), ...rows].join('\n');
}
