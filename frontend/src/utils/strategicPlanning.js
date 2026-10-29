import {
  planningMonths,
  scheduleAdjustmentReasons,
  milestoneStatuses,
  milestoneValidators,
} from '../constants/strategicPlanning.js';
import { getProjectDuration } from './portfolio.js';

export function formatPlanningPeriod(start, duration) {
  const startMonth = planningMonths[start - 1];
  const endMonth = planningMonths[start + duration - 2];
  if (!startMonth || !endMonth) return '';
  return `${startMonth.short} - ${endMonth.short} (${duration} ${duration === 1 ? 'Mes' : 'Meses'})`;
}

export function parsePlanningDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split('-').map(Number);
  if (year < 1 || month < 1 || month > 12 || day < 1) return null;
  const date = new Date(0);
  date.setUTCFullYear(year, month - 1, day);
  date.setUTCHours(0, 0, 0, 0);
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day ? date : null;
}

export function validateScheduleDates(startDate, endDate) {
  const start = parsePlanningDate(startDate);
  const end = parsePlanningDate(endDate);
  if (!start || !end) throw new Error('Selecciona fechas de inicio y fin válidas.');
  if (end < start) throw new Error('La fecha final no puede ser anterior a la fecha de inicio.');
  return { start, end };
}

export function formatSchedulePeriod(startDate, endDate) {
  try {
    const { start, end } = validateScheduleDates(startDate, endDate);
    const format = new Intl.DateTimeFormat('es-PE', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' });
    return `${format.format(start)} — ${format.format(end)}`;
  } catch {
    return '';
  }
}

export function planningDatePosition(value, year, inclusiveEnd = false) {
  const date = parsePlanningDate(value);
  if (!date || date.getUTCFullYear() !== Number(year)) return null;
  const month = date.getUTCMonth();
  const monthEnd = new Date(date);
  monthEnd.setUTCMonth(month + 1, 0);
  return ((month + (date.getUTCDate() - (inclusiveEnd ? 0 : 1)) / monthEnd.getUTCDate()) / 12) * 100;
}

export function projectYearBar(project, year) {
  const startDate = project.startDate || project.start_date;
  const endDate = project.endDate || project.end_date;
  try {
    validateScheduleDates(startDate, endDate);
    const yearStart = `${String(year).padStart(4, '0')}-01-01`;
    const yearEnd = `${String(year).padStart(4, '0')}-12-31`;
    if (endDate < yearStart || startDate > yearEnd) return null;
    const left = planningDatePosition(startDate < yearStart ? yearStart : startDate, year);
    const right = planningDatePosition(endDate > yearEnd ? yearEnd : endDate, year, true);
    return { left, width: right - left };
  } catch {
    return null;
  }
}

export function formatMilestoneDate(targetDate) {
  const date = parsePlanningDate(targetDate);
  if (!date) return '';
  const month = new Intl.DateTimeFormat('es-PE', { month: 'short', timeZone: 'UTC' }).format(date).replace('.', '');
  return `Programado para el ${String(date.getUTCDate()).padStart(2, '0')} ${month.charAt(0).toUpperCase()}${month.slice(1)} ${date.getUTCFullYear()}`;
}

export function mapToGanttProject(p, existing = null) {
  const areaColors = {
    'Arquitectura': '#24559a', 'Edificaciones Comerciales': '#24559a',
    'Estructuras': '#2bc55f', 'Infraestructura Vial': '#2bc55f', 'Civil': '#2bc55f',
    'Sistemas': '#a679ed', 'Retail & Ocio': '#a679ed', 'Vivienda Multifamiliar': '#568fdf',
    'Equipamiento Social': '#ff9800', 'Logística & Producción': '#2bc55f',
  };
  const startDate = p.startDate ?? p.start_date ?? '';
  const endDate = p.endDate ?? p.end_date ?? '';
  const start = parsePlanningDate(startDate);
  const end = parsePlanningDate(endDate);
  const duration = start && end && end >= start
    ? (end.getUTCFullYear() - start.getUTCFullYear()) * 12 + end.getUTCMonth() - start.getUTCMonth() + 1 : 0;
  const totalBudget = Number(p.totalBudget ?? p.budget ?? 0);
  const isAbove100k = totalBudget > 100000;
  return {
    ...p, id: p.id, code: p.code || '', name: p.name, area: p.area || 'Edificaciones Comerciales',
    start: start ? start.getUTCMonth() + 1 : 0, duration,
    period: formatSchedulePeriod(startDate, endDate) || 'Sin fechas válidas',
    color: existing?.color || p.color || areaColors[p.area] || '#24559a',
    totalBudget, budget: totalBudget, usedBudget: Number(p.usedBudget ?? 0),
    status: p.status || 'planning', startDate, endDate, start_date: startDate, end_date: endDate, isAbove100k,
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
  const project = projects.find((item) => String(item.id) === String(draft.projectId));
  if (!project) throw new Error('Selecciona un proyecto válido.');
  validateScheduleDates(draft.startDate, draft.endDate);
  if (!scheduleAdjustmentReasons.includes(draft.reason)) throw new Error('Selecciona un motivo de reajuste válido.');
  if ((project.startDate || project.start_date) === draft.startDate && (project.endDate || project.end_date) === draft.endDate) return data;
  const updated = mapToGanttProject({ ...project, startDate: draft.startDate, endDate: draft.endDate }, project);
  return {
    ...data,
    projects: projects.map((item) => String(item.id) === String(project.id) ? updated : item),
    adjustments: [{
      id: `schedule-adjustment-${date.getTime()}-${project.id}`,
      date: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`,
      projectId: project.id, projectName: project.name, previousPeriod: project.period,
      nextPeriod: updated.period, reason: draft.reason,
    }, ...(data?.adjustments || [])],
  };
}

export async function persistProjectSchedule(data, draft, saveProject) {
  const updated = adjustProjectSchedule(data, draft);
  if (updated === data) return data;
  if (!/^\d+$/.test(String(draft.projectId))) {
    throw new Error('Este proyecto no está guardado en Django. Recarga los datos del servidor.');
  }
  try {
    await saveProject(draft.projectId, { start_date: draft.startDate, end_date: draft.endDate });
  } catch {
    throw new Error('No se pudo guardar el calendario. Revisa la conexión y los permisos e inténtalo nuevamente.');
  }
  return updated;
}

export function syncPortfolioSchedule(portfolio, scheduleProjects) {
  let changed = false;
  const projects = (portfolio.projects || []).map((project) => {
    const scheduled = scheduleProjects.find((item) => String(item.id) === String(project.id));
    if (!scheduled || !formatSchedulePeriod(scheduled.startDate, scheduled.endDate) ||
      ((project.startDate || project.start_date) === scheduled.startDate && (project.endDate || project.end_date) === scheduled.endDate)) return project;
    changed = true;
    return {
      ...project, startDate: scheduled.startDate, endDate: scheduled.endDate,
      start_date: scheduled.startDate, end_date: scheduled.endDate,
      duration: getProjectDuration(scheduled.startDate, scheduled.endDate),
    };
  });
  return changed ? { ...portfolio, projects } : portfolio;
}
