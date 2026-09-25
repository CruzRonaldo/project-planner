// Semillas de datos simulados (Mocks) para pruebas locales de Integraciones
export { integrationStatuses, syncFrequencies } from '../constants/integrations.js';
export {
  summarizeIntegrations,
  filterIntegrations,
  updateIntegration,
  testIntegration,
} from '../utils/integrations.js';

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
    id: 'make', name: 'Make (Integromat)', icon: 'automation', status: 'partial',
    description: 'Automatización de procesos y conexión con servicios de terceros.',
    endpoint: 'Escenarios / Operaciones', frequency: 'Cada 30 min', errors: 2, lastActivity: 'Hace 1 hora',
    metrics: [{ key: 'scenarios', value: 6, label: 'escenarios' }, { key: 'errors', value: 2, label: 'con error' }],
  },
];

const initialActivities = [
  { id: 'activity-1', integrationId: 'drive', title: 'Sincronización completada: Torre Reforma - Planos Fase 2', time: 'Hace 10 minutos', status: 'success' },
  { id: 'activity-2', integrationId: 'make', title: 'Escenario ejecutado: Notificación de hito cumplido', time: 'Hace 25 minutos', status: 'success' },
  { id: 'activity-3', integrationId: 'make', title: 'Error en escenario: Actualización de presupuesto', time: 'Hace 1 hora', status: 'error' },
  { id: 'activity-4', integrationId: 'revit', title: 'Procesando nuevo modelo estructural: Planta de Tratamiento', time: 'Hace 2 horas', status: 'processing' },
  { id: 'activity-5', integrationId: 'drive', title: 'Enlace de documento: Acta de Inicio - Subestación', time: 'Hace 4 horas', status: 'success' },
  { id: 'activity-6', integrationId: 'make', title: 'Escenario ejecutado: Sincronización semanal de reportes', time: 'Ayer, 6:00 PM', status: 'success' },
];

export function createIntegrationsData() {
  return {
    integrations: initialIntegrations.map((integration) => ({ ...integration, metrics: integration.metrics.map((metric) => ({ ...metric })) })),
    activities: initialActivities.map((activity) => ({ ...activity })),
    uptime: 99.84,
  };
}
