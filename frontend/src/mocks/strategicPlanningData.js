export const planningMonths = [
  { number: 1, short: 'Ene', label: 'Enero' },
  { number: 2, short: 'Feb', label: 'Febrero' },
  { number: 3, short: 'Mar', label: 'Marzo' },
  { number: 4, short: 'Abr', label: 'Abril' },
  { number: 5, short: 'May', label: 'Mayo' },
  { number: 6, short: 'Jun', label: 'Junio' },
  { number: 7, short: 'Jul', label: 'Julio' },
  { number: 8, short: 'Ago', label: 'Agosto' },
  { number: 9, short: 'Sep', label: 'Septiembre' },
  { number: 10, short: 'Oct', label: 'Octubre' },
  { number: 11, short: 'Nov', label: 'Noviembre' },
  { number: 12, short: 'Dic', label: 'Diciembre' },
];

export const scheduleAdjustmentReasons = [
  'Retraso por entrega de insumos estructurales',
  'Adelanto por optimización del cronograma',
  'Cambio de alcance solicitado por el cliente',
  'Reprogramación por disponibilidad del equipo',
  'Contingencia climática o normativa',
];

export const milestoneStatuses = [
  { id: 'pending', label: 'Pendiente', badge: 'bg-amber-500/10 text-amber-400' },
  { id: 'upcoming', label: 'Próximo', badge: 'bg-blue-500/10 text-blue-400' },
  { id: 'completed', label: 'Completado', badge: 'bg-emerald-500/10 text-emerald-400' },
];

export const milestoneValidators = [
  'Carlos M. (Project Manager)',
  'Ana Rojas (Ingeniera Civil)',
  'Lucía Gómez (Arquitecta BIM)',
  'Javier Vega (Ingeniero Estructural)',
];

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

export function formatPlanningPeriod(start, duration) {
  const startMonth = planningMonths[start - 1];
  const endMonth = planningMonths[start + duration - 2];
  if (!startMonth || !endMonth) return '';
  return `${startMonth.short} - ${endMonth.short} (${duration} ${duration === 1 ? 'Mes' : 'Meses'})`;
}

export function createStrategicPlanningData() {
  return {
    projects: initialProjects.map((project) => ({ ...project })),
    milestones: initialMilestones.map((milestone) => ({ ...milestone })),
    adjustments: [],
  };
}

export function formatMilestoneDate(targetDate) {
  const date = new Date(`${targetDate}T12:00:00`);
  if (Number.isNaN(date.getTime())) return '';
  const month = new Intl.DateTimeFormat('es-PE', { month: 'short' }).format(date).replace('.', '');
  return `Programado para el ${String(date.getDate()).padStart(2, '0')} ${month.charAt(0).toUpperCase()}${month.slice(1)}`;
}

export function createGlobalMilestone(data, draft, date = new Date()) {
  const project = data.projects.find((item) => item.id === draft.projectId);
  const title = draft.title?.trim() ?? '';
  const description = draft.description?.trim() ?? '';
  if (!project) throw new Error('Selecciona un proyecto asociado válido.');
  if (!milestoneStatuses.some((status) => status.id === draft.status)) throw new Error('Selecciona un estado inicial válido.');
  if (title.length < 3) throw new Error('Ingresa el nombre del hito o entrega crítica.');
  if (!formatMilestoneDate(draft.targetDate)) throw new Error('Selecciona una fecha límite válida.');
  if (!milestoneValidators.includes(draft.validator)) throw new Error('Selecciona un responsable de validación válido.');
  if (description.length < 10) throw new Error('Describe los entregables clave del hito.');
  const milestone = {
    id: `milestone-${date.getTime()}-${data.milestones.length}`,
    projectId: project.id,
    title,
    targetDate: draft.targetDate,
    status: draft.status,
    validator: draft.validator,
    description,
    blocking: Boolean(draft.blocking),
  };
  return { ...data, milestones: [milestone, ...data.milestones] };
}

export function adjustProjectSchedule(data, draft, date = new Date()) {
  const project = data.projects.find((item) => item.id === draft.projectId);
  if (!project) throw new Error('Selecciona un proyecto válido.');
  const start = Number(draft.start);
  const duration = Number(draft.duration);
  if (!Number.isInteger(start) || start < 1 || start > 12) throw new Error('Selecciona un mes de inicio válido.');
  if (!Number.isInteger(duration) || duration < 1 || duration > 12) throw new Error('La duración debe ser un número entero entre 1 y 12 meses.');
  if (start + duration - 1 > 12) throw new Error('El cronograma ajustado no puede superar diciembre.');
  if (!scheduleAdjustmentReasons.includes(draft.reason)) throw new Error('Selecciona un motivo de reajuste válido.');
  if (project.start === start && project.duration === duration) return data;

  const nextPeriod = formatPlanningPeriod(start, duration);
  const localDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  const adjustment = {
    id: `schedule-adjustment-${date.getTime()}-${project.id}`,
    date: localDate,
    projectId: project.id,
    projectName: project.name,
    previousPeriod: project.period,
    nextPeriod,
    reason: draft.reason,
  };
  return {
    ...data,
    projects: data.projects.map((item) => item.id === project.id ? { ...item, start, duration, period: nextPeriod } : item),
    adjustments: [adjustment, ...(data.adjustments ?? [])],
  };
}
