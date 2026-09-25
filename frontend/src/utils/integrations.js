import { integrationStatuses, syncFrequencies } from '../constants/integrations.js';

function normalizeText(value) {
  return String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

export function summarizeIntegrations(data) {
  const integrations = data?.integrations || [];
  return {
    active: integrations.filter((integration) => integration.status === 'connected').length,
    total: integrations.length,
    errors: integrations.reduce((total, integration) => total + (integration.errors || 0), 0),
    uptime: data?.uptime ?? 0,
  };
}

export function filterIntegrations(data, query = '') {
  const normalizedQuery = normalizeText(query);
  const integrations = data?.integrations || [];
  const activities = data?.activities || [];
  const matchedIntegrations = integrations.filter((integration) => {
    const status = integrationStatuses.find((item) => item.id === integration.status)?.label ?? '';
    const metrics = (integration.metrics || []).map((metric) => `${metric.value} ${metric.label}`).join(' ');
    return normalizeText(`${integration.name} ${integration.description} ${integration.endpoint} ${status} ${metrics}`).includes(normalizedQuery);
  });
  const matchedActivities = activities.filter((activity) => {
    const integration = integrations.find((item) => item.id === activity.integrationId);
    return normalizeText(`${integration?.name ?? ''} ${activity.title} ${activity.time} ${activity.status}`).includes(normalizedQuery);
  });
  return { integrations: matchedIntegrations, activities: matchedActivities };
}

function validateDraft(draft) {
  if (!integrationStatuses.some((status) => status.id === draft.status)) throw new Error('Selecciona un estado válido.');
  if (!syncFrequencies.includes(draft.frequency)) throw new Error('Selecciona una frecuencia válida.');
  if (!draft.endpoint?.trim()) throw new Error('Indica una carpeta, espacio o endpoint.');
  const errors = Number(draft.errors);
  if (String(draft.errors).trim() === '' || !Number.isInteger(errors) || errors < 0 || errors > 999) throw new Error('Los errores deben ser un número entero entre 0 y 999.');
  return { endpoint: draft.endpoint.trim(), frequency: draft.frequency, status: draft.status, errors };
}

export function updateIntegration(data, integrationId, draft, date = new Date()) {
  const integrations = data?.integrations || [];
  const activities = data?.activities || [];
  const integration = integrations.find((item) => item.id === integrationId);
  if (!integration) throw new Error('No se encontró la integración.');
  const validated = validateDraft(draft);
  if (validated.endpoint === integration.endpoint && validated.frequency === integration.frequency && validated.status === integration.status && validated.errors === integration.errors) return data;
  const updatedIntegration = {
    ...integration, ...validated, lastActivity: 'Ahora',
    metrics: (integration.metrics || []).map((metric) => metric.key === 'errors' ? { ...metric, value: validated.errors } : metric),
  };
  return {
    ...data,
    integrations: integrations.map((item) => item.id === integrationId ? updatedIntegration : item),
    activities: [{ id: `configuration-${date.getTime()}`, integrationId, title: 'Configuración actualizada desde Project Planner', time: 'Ahora', status: 'success' }, ...activities],
  };
}

export function testIntegration(data, integrationId, date = new Date()) {
  const integrations = data?.integrations || [];
  const activities = data?.activities || [];
  const integration = integrations.find((item) => item.id === integrationId);
  if (!integration) throw new Error('No se encontró la integración.');
  const updatedIntegration = {
    ...integration, status: 'connected', errors: 0, lastActivity: 'Ahora',
    metrics: (integration.metrics || []).map((metric) => metric.key === 'errors' ? { ...metric, value: 0 } : metric),
  };
  return {
    ...data,
    integrations: integrations.map((item) => item.id === integrationId ? updatedIntegration : item),
    activities: [{ id: `test-${date.getTime()}`, integrationId, title: 'Prueba de conexión completada correctamente', time: 'Ahora', status: 'success' }, ...activities],
  };
}
