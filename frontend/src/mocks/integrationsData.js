export const integrationStatuses = [
  { id: 'connected', label: 'Conectado', className: 'border-emerald-500/25 bg-emerald-500/10 text-emerald-400' },
  { id: 'partial', label: 'Parcial', className: 'border-amber-500/25 bg-amber-500/10 text-amber-400' },
  { id: 'offline', label: 'Desconectado', className: 'border-red-500/25 bg-red-500/10 text-red-400' },
];

export const syncFrequencies = ['Cada 5 min', 'Cada 10 min', 'Cada 30 min', 'Cada hora'];

const initialIntegrations = [
  {
    id: 'drive', name: 'Google Drive', icon: 'cloud', status: 'connected',
    description: 'Sincronización de documentación de proyectos. Enlace automático de planos, informes y actas.',
    endpoint: 'Carpeta /Project Planner', frequency: 'Cada 10 min', errors: 0, lastActivity: 'Hace 10 minutos',
    metrics: [{ key: 'files', value: 245, label: 'archivos sincronizados' }, { key: 'projects', value: 12, label: 'proyectos vinculados' }],
  },
  {
    id: 'revit', name: 'Revit / BIM Data', icon: 'model', status: 'connected',
    description: 'Importación de datos de modelado 3D, estructuras de concreto y acero.',
    endpoint: 'BIM 360 / Modelos', frequency: 'Cada hora', errors: 0, lastActivity: 'Hace 2 horas',
    metrics: [{ key: 'models', value: 8, label: 'modelos activos' }, { key: 'sync', value: 'hace 2h', label: 'última sync' }],
  },
  {
    id: 'n8n', name: 'N8N', icon: 'workflow', status: 'connected',
    description: 'Motor de automatización de workflows. Gestión de flujos de datos entre módulos.',
    endpoint: 'Workflows / Producción', frequency: 'Cada 5 min', errors: 0, lastActivity: 'Hace 25 minutos',
    metrics: [{ key: 'workflows', value: 15, label: 'workflows activos' }, { key: 'paused', value: 3, label: 'en pausa' }],
  },
  {
    id: 'make', name: 'Make (Integromat)', icon: 'automation', status: 'partial',
    description: 'Automatización de procesos y conexión con servicios de terceros.',
    endpoint: 'Escenarios / Operaciones', frequency: 'Cada 30 min', errors: 2, lastActivity: 'Hace 1 hora',
    metrics: [{ key: 'scenarios', value: 6, label: 'escenarios' }, { key: 'errors', value: 2, label: 'con error' }],
  },
];

const initialActivities = [
  { id: 'activity-1', integrationId: 'drive', title: 'Sincronización completada: Torre Reforma - Planos Fase 2', time: 'Hace 10 minutos', status: 'success' },
  { id: 'activity-2', integrationId: 'n8n', title: 'Workflow ejecutado: Notificación de hito cumplido', time: 'Hace 25 minutos', status: 'success' },
  { id: 'activity-3', integrationId: 'make', title: 'Error en escenario: Actualización de presupuesto', time: 'Hace 1 hora', status: 'error' },
  { id: 'activity-4', integrationId: 'revit', title: 'Procesando nuevo modelo estructural: Planta de Tratamiento', time: 'Hace 2 horas', status: 'processing' },
  { id: 'activity-5', integrationId: 'drive', title: 'Enlace de documento: Acta de Inicio - Subestación', time: 'Hace 4 horas', status: 'success' },
  { id: 'activity-6', integrationId: 'n8n', title: 'Workflow ejecutado: Sincronización semanal de reportes', time: 'Ayer, 6:00 PM', status: 'success' },
];

function normalizeText(value) {
  return String(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

export function createIntegrationsData() {
  return {
    integrations: initialIntegrations.map((integration) => ({ ...integration, metrics: integration.metrics.map((metric) => ({ ...metric })) })),
    activities: initialActivities.map((activity) => ({ ...activity })),
    uptime: 99.84,
  };
}

export function summarizeIntegrations(data) {
  return {
    active: data.integrations.filter((integration) => integration.status === 'connected').length,
    total: data.integrations.length,
    errors: data.integrations.reduce((total, integration) => total + integration.errors, 0),
    uptime: data.uptime,
  };
}

export function filterIntegrations(data, query = '') {
  const normalizedQuery = normalizeText(query);
  const matchedIntegrations = data.integrations.filter((integration) => {
    const status = integrationStatuses.find((item) => item.id === integration.status)?.label ?? '';
    const metrics = integration.metrics.map((metric) => `${metric.value} ${metric.label}`).join(' ');
    return normalizeText(`${integration.name} ${integration.description} ${integration.endpoint} ${status} ${metrics}`).includes(normalizedQuery);
  });
  const activities = data.activities.filter((activity) => {
    const integration = data.integrations.find((item) => item.id === activity.integrationId);
    return normalizeText(`${integration?.name ?? ''} ${activity.title} ${activity.time} ${activity.status}`).includes(normalizedQuery);
  });
  return { integrations: matchedIntegrations, activities };
}

function validateDraft(draft) {
  if (!integrationStatuses.some((status) => status.id === draft.status)) throw new Error('Selecciona un estado válido.');
  if (!syncFrequencies.includes(draft.frequency)) throw new Error('Selecciona una frecuencia válida.');
  if (!draft.endpoint.trim()) throw new Error('Indica una carpeta, espacio o endpoint.');
  const errors = Number(draft.errors);
  if (String(draft.errors).trim() === '' || !Number.isInteger(errors) || errors < 0 || errors > 999) throw new Error('Los errores deben ser un número entero entre 0 y 999.');
  return { endpoint: draft.endpoint.trim(), frequency: draft.frequency, status: draft.status, errors };
}

export function updateIntegration(data, integrationId, draft, date = new Date()) {
  const integration = data.integrations.find((item) => item.id === integrationId);
  if (!integration) throw new Error('No se encontró la integración.');
  const validated = validateDraft(draft);
  if (validated.endpoint === integration.endpoint && validated.frequency === integration.frequency && validated.status === integration.status && validated.errors === integration.errors) return data;
  const updatedIntegration = {
    ...integration, ...validated, lastActivity: 'Ahora',
    metrics: integration.metrics.map((metric) => metric.key === 'errors' ? { ...metric, value: validated.errors } : metric),
  };
  return {
    ...data,
    integrations: data.integrations.map((item) => item.id === integrationId ? updatedIntegration : item),
    activities: [{ id: `configuration-${date.getTime()}`, integrationId, title: 'Configuración actualizada desde Project Planner', time: 'Ahora', status: 'success' }, ...data.activities],
  };
}

export function testIntegration(data, integrationId, date = new Date()) {
  const integration = data.integrations.find((item) => item.id === integrationId);
  if (!integration) throw new Error('No se encontró la integración.');
  const updatedIntegration = {
    ...integration, status: 'connected', errors: 0, lastActivity: 'Ahora',
    metrics: integration.metrics.map((metric) => metric.key === 'errors' ? { ...metric, value: 0 } : metric),
  };
  return {
    ...data,
    integrations: data.integrations.map((item) => item.id === integrationId ? updatedIntegration : item),
    activities: [{ id: `test-${date.getTime()}`, integrationId, title: 'Prueba de conexión completada correctamente', time: 'Ahora', status: 'success' }, ...data.activities],
  };
}
