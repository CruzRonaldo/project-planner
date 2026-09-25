// Semillas de datos simulados (Mocks) para pruebas locales de Planificación Estratégica
export {
  planningMonths,
  scheduleAdjustmentReasons,
  milestoneStatuses,
  milestoneValidators,
} from '../constants/strategicPlanning.js';

export {
  formatPlanningPeriod,
  formatMilestoneDate,
  createGlobalMilestone,
  adjustProjectSchedule,
} from '../utils/strategicPlanning.js';

import { milestoneValidators } from '../constants/strategicPlanning.js';
import { formatPlanningPeriod } from '../utils/strategicPlanning.js';

const initialProjects = [
  { id: 'planning-torre', code: 'PRJ-2026-001', name: 'Torre Reforma', area: 'Edificaciones Comerciales', start: 1, duration: 6, color: '#24559a' },
  { id: 'planning-puente', code: 'PRJ-2026-002', name: 'Puente Industrial', area: 'Infraestructura Vial', start: 2, duration: 7, color: '#2bc55f' },
  { id: 'planning-centro', code: 'PRJ-2026-003', name: 'Centro Comercial Norte', area: 'Retail & Ocio', start: 3, duration: 9, color: '#a679ed' },
  { id: 'planning-residencial', code: 'PRJ-2026-004', name: 'Residencial Las Palmas', area: 'Vivienda Multifamiliar', start: 4, duration: 6, color: '#568fdf' },
  { id: 'planning-hospital', code: 'PRJ-2026-005', name: 'Hospital Regional', area: 'Equipamiento Social', start: 5, duration: 8, color: '#ff9800' },
  { id: 'planning-nave', code: 'PRJ-2026-006', name: 'Nave Industrial', area: 'Logística & Producción', start: 7, duration: 6, color: '#2bc55f' },
].map((project) => ({ ...project, period: formatPlanningPeriod(project.start, project.duration) }));

const initialMilestones = [
  { id: 'milestone-1', projectId: 'planning-torre', title: 'Entrega Cimentación', targetDate: '2026-03-15', status: 'completed', validator: milestoneValidators[0], description: 'Entrega y validación de la cimentación principal.', blocking: true },
  { id: 'milestone-2', projectId: 'planning-puente', title: 'Revisión Estructural', targetDate: '2026-05-30', status: 'upcoming', validator: milestoneValidators[3], description: 'Revisión integral de cálculos y planos estructurales.', blocking: true },
  { id: 'milestone-3', projectId: 'planning-centro', title: 'Inauguración Fase 1', targetDate: '2026-07-15', status: 'pending', validator: milestoneValidators[2], description: 'Entrega operativa de la primera fase del proyecto.', blocking: true },
  { id: 'milestone-4', projectId: 'planning-hospital', title: 'Auditoría Presupuestal', targetDate: '2026-09-01', status: 'pending', validator: milestoneValidators[0], description: 'Auditoría del presupuesto comprometido y ejecutado.', blocking: false },
  { id: 'milestone-5', projectId: 'planning-nave', title: 'Cierre Anual', targetDate: '2026-12-15', status: 'pending', validator: milestoneValidators[0], description: 'Cierre de entregables y consolidación anual.', blocking: false },
];

export function createStrategicPlanningData() {
  return {
    projects: initialProjects.map((project) => ({ ...project })),
    milestones: initialMilestones.map((milestone) => ({ ...milestone })),
    adjustments: [],
  };
}
