import {
  planningMonths,
  scheduleAdjustmentReasons,
  milestoneStatuses,
  milestoneValidators,
} from '../constants/strategicPlanning.js';

export function formatPlanningPeriod(start, duration) {
  const startMonth = planningMonths[start - 1];
  const endMonth = planningMonths[start + duration - 2];
  if (!startMonth || !endMonth) return '';
  return `${startMonth.short} - ${endMonth.short} (${duration} ${duration === 1 ? 'Mes' : 'Meses'})`;
}

export function formatMilestoneDate(targetDate) {
  if (!targetDate) return '';
  const date = new Date(`${targetDate}T12:00:00`);
  if (Number.isNaN(date.getTime())) return '';
  const month = new Intl.DateTimeFormat('es-PE', { month: 'short' }).format(date).replace('.', '');
  return `Programado para el ${String(date.getDate()).padStart(2, '0')} ${month.charAt(0).toUpperCase()}${month.slice(1)}`;
}

export function createGlobalMilestone(data, draft, date = new Date()) {
  const projects = data?.projects || [];
  const milestones = data?.milestones || [];
  const project = projects.find((item) => item.id === draft.projectId);
  const title = draft.title?.trim() ?? '';
  const description = draft.description?.trim() ?? '';
  if (!project) throw new Error('Selecciona un proyecto asociado válido.');
  if (!milestoneStatuses.some((status) => status.id === draft.status)) throw new Error('Selecciona un estado inicial válido.');
  if (title.length < 3) throw new Error('Ingresa el nombre del hito o entrega crítica.');
  if (!formatMilestoneDate(draft.targetDate)) throw new Error('Selecciona una fecha límite válida.');
  if (!milestoneValidators.includes(draft.validator)) throw new Error('Selecciona un responsable de validación válido.');
  if (description.length < 10) throw new Error('Describe los entregables clave del hito.');
  const milestone = {
    id: `milestone-${date.getTime()}-${milestones.length}`,
    projectId: project.id,
    title,
    targetDate: draft.targetDate,
    status: draft.status,
    validator: draft.validator,
    description,
    blocking: Boolean(draft.blocking),
  };
  return { ...data, milestones: [milestone, ...milestones] };
}

export function adjustProjectSchedule(data, draft, date = new Date()) {
  const projects = data?.projects || [];
  const adjustments = data?.adjustments || [];
  const project = projects.find((item) => item.id === draft.projectId);
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
    projects: projects.map((item) => item.id === project.id ? { ...item, start, duration, period: nextPeriod } : item),
    adjustments: [adjustment, ...adjustments],
  };
}
