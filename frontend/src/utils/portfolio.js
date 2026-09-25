import { projectAreas, projectLeaders, projectStatuses } from '../constants/portfolio.js';

function normalizeText(value) {
  return String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

export function createProjectCode(data, year = new Date().getFullYear()) {
  const prefix = `PRJ-${year}-`;
  const projects = data?.projects || [];
  const largest = projects.reduce((maximum, project) => {
    if (!project.code?.startsWith(prefix)) return maximum;
    const sequence = Number(project.code.slice(prefix.length));
    return Number.isInteger(sequence) ? Math.max(maximum, sequence) : maximum;
  }, 0);
  return `${prefix}${String(largest + 1).padStart(3, '0')}`;
}

export function getProjectDuration(startDate, endDate) {
  const start = new Date(`${startDate}T12:00:00`);
  const end = new Date(`${endDate}T12:00:00`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) return null;
  return Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24 * 30.4375)));
}

function formatInitials(name) {
  return (name || '').split(' ').filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
}

function validateDriveFolder(value) {
  if (!value) return '';
  let url;
  try { url = new URL(value); } catch { throw new Error('Ingresa un enlace válido de Google Drive.'); }
  if (url.protocol !== 'https:' || !['drive.google.com', 'docs.google.com'].includes(url.hostname)) throw new Error('El enlace debe pertenecer a Google Drive.');
  return url.toString();
}

export function addPortfolioProject(data, draft, date = new Date()) {
  const projects = data?.projects || [];
  const changes = data?.changes || [];
  const code = draft.code?.trim().toUpperCase() ?? '';
  const name = draft.name?.trim() ?? '';
  const description = draft.description?.trim() ?? '';
  if (!/^PRJ-\d{4}-\d{3}$/.test(code)) throw new Error('El código debe usar el formato PRJ-AAAA-000.');
  if (projects.some((project) => project.code?.toUpperCase() === code)) throw new Error('Ya existe un proyecto con ese código.');
  if (name.length < 3) throw new Error('Ingresa el nombre del proyecto.');
  if (!projectAreas.includes(draft.area)) throw new Error('Selecciona un área técnica válida.');
  const duration = getProjectDuration(draft.startDate, draft.endDate);
  if (!duration) throw new Error('La fecha final debe ser igual o posterior a la fecha inicial.');
  const totalBudget = Number(draft.totalBudget);
  if (String(draft.totalBudget).trim() === '' || !Number.isFinite(totalBudget) || totalBudget <= 0 || totalBudget > 1000000000000) throw new Error('Ingresa un presupuesto válido mayor que cero.');
  if (!['planning', 'active', 'paused'].includes(draft.status)) throw new Error('Selecciona un estado inicial válido.');
  const leader = projectLeaders.find((item) => item.id === draft.leaderId || String(item.id) === String(draft.leaderId) || (draft.leaderId === 'carlos' && item.id === 1) || (draft.leaderId === 'ana' && item.id === 2) || (draft.leaderId === 'lucia' && item.id === 3));
  if (!leader) throw new Error('Selecciona un líder de obra válido.');
  const driveFolder = validateDriveFolder(draft.driveFolder?.trim() ?? '');
  const project = {
    id: `project-${date.getTime()}-${projects.length}`, code, name, area: draft.area,
    status: draft.status, progress: 0, usedBudget: 0, totalBudget,
    startDate: draft.startDate, endDate: draft.endDate, leaderId: draft.leaderId,
    driveFolder, description, members: [formatInitials(leader.name)], duration,
  };
  const change = {
    id: `project-created-${date.getTime()}`, date: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`,
    project: name, change: `Proyecto ${code} creado con un presupuesto inicial de ${formatMoney(totalBudget)}.`, user: draft.createdBy?.trim() || leader.name,
  };
  return { projects: [project, ...projects], changes: [change, ...changes] };
}

export function filterPortfolio(data, query = '', status = 'all') {
  const normalizedQuery = normalizeText(query);
  const projects = (data?.projects || []).filter((project) => {
    const statusLabel = projectStatuses.find((item) => item.id === project.status)?.label ?? '';
    const leader = projectLeaders.find((item) => item.id === project.leaderId || (project.leaderId === 'carlos' && item.id === 1) || (project.leaderId === 'ana' && item.id === 2) || (project.leaderId === 'lucia' && item.id === 3))?.name ?? '';
    const matchesQuery = normalizeText(`${project.code} ${project.name} ${project.area} ${statusLabel} ${leader} ${project.description}`).includes(normalizedQuery);
    return matchesQuery && (status === 'all' || project.status === status);
  });
  const changes = (data?.changes || []).filter((change) => normalizeText(`${change.project} ${change.change} ${change.user} ${change.date}`).includes(normalizedQuery));
  return { projects, changes };
}

export function formatMoney(value) {
  if (value >= 1000000) return `$${Number((value / 1000000).toFixed(2))}M`;
  if (value >= 1000) return `$${Number((value / 1000).toFixed(1))}K`;
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
}

export function formatProjectTerm(startDate, endDate) {
  const start = new Date(`${startDate}T12:00:00`);
  const end = new Date(`${endDate}T12:00:00`);
  const month = new Intl.DateTimeFormat('es-PE', { month: 'short' });
  return `${start.getDate()} ${month.format(start)} ${start.getFullYear()} - ${end.getDate()} ${month.format(end)} ${end.getFullYear()}`;
}
