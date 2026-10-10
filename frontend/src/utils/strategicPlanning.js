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

export function mapToGanttProject(p, existing = null) {
  const areaColors = {
    'Arquitectura': '#24559a',
    'Edificaciones Comerciales': '#24559a',
    'Estructuras': '#2bc55f',
    'Infraestructura Vial': '#2bc55f',
    'Civil': '#2bc55f',
    'Sistemas': '#a679ed',
    'Retail & Ocio': '#a679ed',
    'Vivienda Multifamiliar': '#568fdf',
    'Equipamiento Social': '#ff9800',
    'Logística & Producción': '#2bc55f',
  };

  const sDateStr = p.startDate || p.start_date;
  const eDateStr = p.endDate || p.end_date;

  let start = existing?.start ?? 1;
  let duration = existing?.duration ?? 3;

  if (!existing?.start && sDateStr) {
    const parsedStart = new Date(`${sDateStr.slice(0, 10)}T00:00:00`);
    if (!isNaN(parsedStart.getTime())) {
      start = parsedStart.getMonth() + 1;
    }
  }

  if (!existing?.duration && eDateStr) {
    const parsedEnd = new Date(`${eDateStr.slice(0, 10)}T00:00:00`);
    if (!isNaN(parsedEnd.getTime())) {
      const endMonth = parsedEnd.getMonth() + 1;
      if (parsedEnd.getFullYear() === 2026) {
        duration = Math.max(1, endMonth - start + 1);
      } else if (parsedEnd.getFullYear() > 2026) {
        duration = Math.max(1, 13 - start);
      }
    }
  } else if (!existing?.duration && p.duration_months) {
    duration = Number(p.duration_months);
  }

  start = Math.max(1, Math.min(12, start));
  duration = Math.max(1, Math.min(13 - start, duration));

  const totalBudget = Number(p.totalBudget ?? p.budget ?? 0);
  const usedBudget = Number(p.usedBudget ?? 0);
  const isAbove100k = totalBudget > 100000;

  return {
    id: p.id,
    code: p.code || 'PRJ-2026',
    name: p.name,
    area: p.area || 'Edificaciones Comerciales',
    start,
    duration,
    period: formatPlanningPeriod(start, duration),
    color: existing?.color || areaColors[p.area] || '#24559a',
    totalBudget,
    budget: totalBudget,
    usedBudget,
    status: p.status || 'planning',
    startDate: sDateStr,
    endDate: eDateStr,
    isAbove100k,
    approvalType: isAbove100k ? 'Revisión por Comité Directivo' : 'Aprobación Líder Técnico',
  };
}

export function createGlobalMilestone(data, draft, date = new Date()) {
  const projects = data?.projects || [];
  const milestones = data?.milestones || [];
  const project = projects.find((item) => String(item.id) === String(draft.projectId));
  const title = draft.title?.trim() ?? '';
  const description = draft.description?.trim() ?? '';
  if (!project) throw new Error('Selecciona un proyecto asociado válido.');
  if (!milestoneStatuses.some((status) => status.id === draft.status)) throw new Error('Selecciona un estado inicial válido.');
  if (title.length < 3) throw new Error('Ingresa el nombre del hito o entrega crítica.');
  if (!formatMilestoneDate(draft.targetDate)) throw new Error('Selecciona una fecha límite válida.');
  if (!milestoneValidators.includes(draft.validator)) throw new Error('Selecciona un responsable de validación válido.');
  if (description.length < 10) throw new Error('Describe los entregables clave del hito.');
  const milestone = {
    id: draft.id || `milestone-${date.getTime()}-${milestones.length}`,
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
  const project = projects.find((item) => String(item.id) === String(draft.projectId));
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
    projects: projects.map((item) => String(item.id) === String(project.id) ? { ...item, start, duration, period: nextPeriod } : item),
    adjustments: [adjustment, ...adjustments],
  };
}

