// Semillas de datos simulados (Mocks) para pruebas locales de Gestión Operativa
export {
  operationalProjects,
  operationTypes,
  operationalAreas,
  workOrderPriorities,
  workOrderStatuses,
} from '../constants/operations.js';

export {
  getWorkOrderDuration,
  filterWorkOrders,
  createWorkOrder,
  buildWorkOrdersCsv,
} from '../utils/operations.js';

import { operationalProjects } from '../constants/operations.js';

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
