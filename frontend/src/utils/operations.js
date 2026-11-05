import { operationTypes, operationalAreas, workOrderPriorities } from '../constants/operations.js';
import { legacyMonthRangeToDates } from './gantt.js';

function normalizeText(value) {
  return String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

export function getWorkOrderDuration(startDate, endDate) {
  const start = new Date(`${startDate}T12:00:00`);
  const end = new Date(`${endDate}T12:00:00`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) return null;
  return Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)));
}

export function filterWorkOrders(orders = [], query = '', filter = 'all', project = 'all') {
  const normalizedQuery = normalizeText(query);
  return (orders || []).filter((order) => {
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
  const orders = data?.orders || [];
  const largestCode = orders.reduce((largest, order) => Math.max(largest, Number(order.code?.replace('#', '')) || 0), 0);
  const order = {
    id: `order-${date.getTime()}-${orders.length}`,
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
    metrics: { ...(data?.metrics || {}), inProgress: ((data?.metrics?.inProgress) || 0) + 1 },
    orders: [order, ...orders],
  };
}

function escapeCsv(value) {
  const text = String(value ?? '');
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

export function buildWorkOrdersCsv(orders = []) {
  const header = ['ID', 'Proyecto', 'Tipo', 'Título', 'Área', 'Responsable', 'Prioridad', 'Estado', 'Inicio', 'Límite'];
  const rows = (orders || []).map((order) => [order.code, order.project, order.type, order.title, order.area, order.responsible, order.priority, order.status, order.startDate, order.endDate].map(escapeCsv).join(','));
  return [header.join(','), ...rows].join('\n');
}

/**
 * Normaliza actividades críticas para el cronograma de operaciones.
 * DEUDA TÉCNICA: Si el backend añade endpoints con startDate/endDate reales para actividades,
 * se usarán de forma nativa. Mientras tanto, si solo existen start y duration numéricos,
 * se genera el rango ISO usando el año actual como puente.
 *
 * @param {Array} activities - Lista de actividades
 * @param {number} [year=new Date().getFullYear()] - Año de referencia
 * @returns {Array} Actividades normalizadas con startDate y endDate garantizados sin mutar el origen
 */
export function normalizeCriticalActivities(activities = [], year = new Date().getFullYear()) {
  return (activities || []).map((activity) => {
    const sDate = activity.startDate || activity.start_date;
    const eDate = activity.endDate || activity.end_date;

    let startDate = sDate ? String(sDate).slice(0, 10) : null;
    let endDate = eDate ? String(eDate).slice(0, 10) : null;

    if (!startDate && !endDate && activity.start) {
      const bridge = legacyMonthRangeToDates(activity.start, activity.duration, year);
      startDate = bridge.startDate;
      endDate = bridge.endDate;
    }

    return {
      ...activity,
      startDate,
      endDate,
    };
  });
}

const priorityWeight = { high: 3, medium: 2, low: 1 };

export const operationsSortCategories = [
  {
    id: 'priority',
    defaultId: 'prio_desc',
    defaultLabel: 'Alta prioridad primero',
    descId: 'prio_desc',
    ascId: 'prio_asc',
    descLabel: 'Alta prioridad primero',
    ascLabel: 'Baja prioridad primero',
  },
  {
    id: 'due_date',
    defaultId: 'due_asc',
    defaultLabel: 'Fecha más próxima',
    descId: 'due_desc',
    ascId: 'due_asc',
    descLabel: 'Fecha más lejana',
    ascLabel: 'Fecha más próxima',
  },
  {
    id: 'title',
    defaultId: 'title_asc',
    defaultLabel: 'Título (A-Z)',
    descId: 'title_desc',
    ascId: 'title_asc',
    descLabel: 'Título (Z-A)',
    ascLabel: 'Título (A-Z)',
  },
];

export function sortWorkOrders(orders = [], sortOrder = 'prio_desc') {
  if (!Array.isArray(orders) || orders.length === 0) return [];
  const copy = [...orders];

  switch (sortOrder) {
    case 'prio_desc':
      return copy.sort((a, b) => (priorityWeight[b.priority] || 0) - (priorityWeight[a.priority] || 0));
    case 'prio_asc':
      return copy.sort((a, b) => (priorityWeight[a.priority] || 0) - (priorityWeight[b.priority] || 0));
    case 'due_asc':
      return copy.sort((a, b) => new Date(a.endDate || '9999-12-31') - new Date(b.endDate || '9999-12-31'));
    case 'due_desc':
      return copy.sort((a, b) => new Date(b.endDate || '1970-01-01') - new Date(a.endDate || '1970-01-01'));
    case 'title_asc':
      return copy.sort((a, b) => String(a.title || '').localeCompare(String(b.title || ''), 'es'));
    case 'title_desc':
      return copy.sort((a, b) => String(b.title || '').localeCompare(String(a.title || ''), 'es'));
    default:
      return copy;
  }
}
