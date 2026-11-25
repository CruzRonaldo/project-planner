import { integrationStatuses, syncFrequencies } from '../constants/integrations.js';

function normalizeText(value) {
  return String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

export function summarizeIntegrations(data) {
  const integrations = data?.integrations || [];
  const activities = data?.activities || [];
  const connected = integrations.filter((i) => i.status === 'connected').length;
  const partial = integrations.filter((i) => i.status === 'partial').length;
  const offline = integrations.filter((i) => i.status !== 'connected' && i.status !== 'partial').length;
  const total = integrations.length;
  const errors = integrations.reduce((tot, i) => tot + (i.errors || 0), 0);

  let uptime = 0;
  if (typeof data?.uptime === 'number' && data.uptime > 0) {
    uptime = data.uptime;
  } else {
    const errorCount = activities.filter((a) => a.status === 'error').length;
    const successCount = activities.filter((a) => a.status === 'success').length;
    const totalWithStatus = errorCount + successCount;

    if (totalWithStatus > 0) {
      uptime = Math.round(((totalWithStatus - errorCount) / totalWithStatus) * 1000) / 10;
    } else if (total > 0 && (connected > 0 || partial > 0)) {
      uptime = Math.round(((connected + partial * 0.5) / total) * 1000) / 10;
    }
  }

  return {
    active: connected,
    total,
    errors,
    uptime,
    connected,
    partial,
    offline,
  };
}

/**
 * Calcula los 12 puntos SVG (x,y) para el gráfico de actividad de las últimas 12 horas.
 */
export function computeActivityChartPoints(activities, width = 308, height = 100) {
  if (!activities || activities.length === 0) return '';

  const stepX = width / 11;
  const buckets = new Array(12).fill(0);
  const lastIndex = Math.max(1, activities.length - 1);

  activities.forEach((activity, index) => {
    const time = String(activity?.time || '').toLowerCase();

    if (
      time.includes('ahora') ||
      time.includes('hace un momento') ||
      time.includes('minuto') ||
      time.includes('min')
    ) {
      const minutesMatch = time.match(/(\d+)\s*(?:min|minuto)/);
      const minutes = minutesMatch ? Number(minutesMatch[1]) : 0;
      if (minutes > 30) {
        buckets[10] += 1;
      } else {
        buckets[11] += 1;
      }
    } else if (time.includes('1 hora') || time.includes('1h')) {
      buckets[9] += 1;
    } else if (time.includes('2 horas') || time.includes('2h')) {
      buckets[8] += 1;
    } else if (time.includes('4 horas') || time.includes('4h')) {
      buckets[6] += 1;
    } else if (time.includes('ayer')) {
      buckets[1] += 1;
    } else {
      const fallbackBucket = Math.min(
        11,
        Math.max(0, Math.round((1 - index / lastIndex) * 11))
      );
      buckets[fallbackBucket] += 1;
    }
  });

  const scaleY = height / 100;
  const points = [];
  for (let i = 0; i < 12; i += 1) {
    const x = Math.round(i * stepX);
    const count = buckets[i];
    const y = Math.max(
      Math.round(15 * scaleY),
      Math.round((85 - Math.min(count, 4) * 18) * scaleY)
    );
    points.push(`${x},${y}`);
  }

  return points.join(' ');
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
  const validFrequencies = [...syncFrequencies, 'Tiempo real'];
  if (!integrationStatuses.some((status) => status.id === draft.status)) throw new Error('Selecciona un estado válido.');
  if (!validFrequencies.includes(draft.frequency)) throw new Error('Selecciona una frecuencia válida.');
  if (!draft.endpoint?.trim()) throw new Error('Indica una carpeta, espacio o endpoint.');
  const errors = Number(draft.errors);
  if (String(draft.errors).trim() === '' || !Number.isInteger(errors) || errors < 0 || errors > 999) throw new Error('Los errores deben ser un número entero entre 0 y 999.');
  return {
    endpoint: draft.endpoint.trim(),
    frequency: draft.frequency,
    status: draft.status,
    errors,
    ...(draft.extraConfig ? { extraConfig: draft.extraConfig } : {}),
    ...(Array.isArray(draft.metrics) ? { metrics: draft.metrics } : {}),
  };
}

export function updateIntegration(data, integrationId, draft, date = new Date()) {
  const integrations = data?.integrations || [];
  const activities = data?.activities || [];
  const integration = integrations.find((item) => item.id === integrationId);
  if (!integration) throw new Error('No se encontró la integración.');
  const validated = validateDraft(draft);
  const metricsUnchanged =
    !validated.metrics ||
    JSON.stringify(validated.metrics) === JSON.stringify(integration.metrics);
  if (
    validated.endpoint === integration.endpoint &&
    validated.frequency === integration.frequency &&
    validated.status === integration.status &&
    validated.errors === integration.errors &&
    JSON.stringify(validated.extraConfig) === JSON.stringify(integration.extraConfig) &&
    metricsUnchanged
  ) return data;
  const updatedIntegration = {
    ...integration,
    ...validated,
    lastActivity: 'Ahora',
    metrics: validated.metrics
      ? validated.metrics
      : (integration.metrics || []).map((metric) => metric.key === 'errors' ? { ...metric, value: validated.errors } : metric),
  };
  return {
    ...data,
    integrations: integrations.map((item) => item.id === integrationId ? updatedIntegration : item),
    activities: [{ id: `configuration-${date.getTime()}`, integrationId, title: 'Configuración actualizada desde Project Planner', time: 'Ahora', status: 'success' }, ...activities].slice(0, 30),
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
    activities: [{ id: `test-${date.getTime()}`, integrationId, title: 'Prueba de conexión completada correctamente', time: 'Ahora', status: 'success' }, ...activities].slice(0, 30),
  };
}
