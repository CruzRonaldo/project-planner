export const projectAreas = [
  'Edificaciones Comerciales',
  'Infraestructura Vial',
  'Retail & Ocio',
  'Equipamiento Social',
  'Vivienda Multifamiliar',
  'Logística & Producción',
];

export const projectStatuses = [
  { id: 'planning', label: 'En Planificación', className: 'bg-cyan-50 text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-400 midnight:bg-cyan-500/10 midnight:text-cyan-300', barClass: 'bg-cyan-500' },
  { id: 'active', label: 'Activo', className: 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 midnight:bg-cyan-500/10 midnight:text-cyan-300', barClass: 'bg-blue-500 midnight:bg-cyan-400' },
  { id: 'paused', label: 'En Pausa', className: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 midnight:bg-amber-500/10 midnight:text-amber-300', barClass: 'bg-amber-500' },
  { id: 'completed', label: 'Completado', className: 'bg-slate-100 text-slate-600 dark:bg-slate-500/15 dark:text-slate-300 midnight:bg-cyan-900/30 midnight:text-cyan-500/70', barClass: 'bg-slate-400 dark:bg-slate-300 midnight:bg-cyan-700' },
  { id: 'risk', label: 'En Riesgo', className: 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400 midnight:bg-red-500/10 midnight:text-red-300', barClass: 'bg-red-500' },
];

export const projectLeaders = [
  { id: 1, name: 'Carlos Mendoza', role: 'Modelador BIM / Revit' },
  { id: 2, name: 'Andrea Rojas', role: 'Calculista Estructural' },
  { id: 3, name: 'Luis Gonzales', role: 'Desarrollador Full Stack' },
];

const initialProjects = [
  { id: 'project-1', code: 'PRJ-2026-001', name: 'Torre Reforma', area: 'Edificaciones Comerciales', status: 'active', progress: 78, usedBudget: 936000, totalBudget: 1200000, startDate: '2026-01-01', endDate: '2026-06-30', leaderId: 'carlos', driveFolder: '', description: 'Edificación comercial de gran escala.', members: ['CM', 'AR', 'LG'] },
  { id: 'project-2', code: 'PRJ-2026-002', name: 'Puente Industrial', area: 'Infraestructura Vial', status: 'paused', progress: 42, usedBudget: 378000, totalBudget: 900000, startDate: '2026-02-01', endDate: '2026-08-31', leaderId: 'ana', driveFolder: '', description: 'Infraestructura vial para el corredor industrial.', members: ['AR', 'CM', 'JV'] },
  { id: 'project-3', code: 'PRJ-2026-003', name: 'Centro Comercial Norte', area: 'Retail & Ocio', status: 'completed', progress: 100, usedBudget: 1500000, totalBudget: 1500000, startDate: '2026-03-01', endDate: '2026-11-30', leaderId: 'lucia', driveFolder: '', description: 'Desarrollo comercial y espacios de entretenimiento.', members: ['LG', 'CM', 'AR'] },
  { id: 'project-4', code: 'PRJ-2026-004', name: 'Hospital Regional', area: 'Equipamiento Social', status: 'risk', progress: 18, usedBudget: 220000, totalBudget: 1100000, startDate: '2026-05-01', endDate: '2026-12-31', leaderId: 'carlos', driveFolder: '', description: 'Nuevo equipamiento hospitalario regional.', members: ['CM', 'JV', 'AR'] },
];

const initialChanges = [
  { id: 'change-1', date: '2026-03-24', project: 'Torre Reforma', change: 'Ampliación de presupuesto fase cimentación de pilote a $200K', user: 'Carlos M.' },
  { id: 'change-2', date: '2026-03-22', project: 'Puente Industrial', change: 'Pausa indefinida por retraso de entrega de insumos estructurales', user: 'Ana R.' },
  { id: 'change-3', date: '2026-03-20', project: 'Hospital Regional', change: 'Establecido estado crítico por huelga de transporte', user: 'Carlos M.' },
  { id: 'change-4', date: '2026-03-18', project: 'Centro Comercial Norte', change: 'Hito completado con éxito: Limpieza de área', user: 'Lucía G.' },
  { id: 'change-5', date: '2026-03-15', project: 'Torre Reforma', change: 'Asignación del auditor externo Sr. Juan Montaño al proyecto', user: 'Carlos M.' },
];

function normalizeText(value) {
  return String(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

function cloneProject(project) {
  return { ...project, members: [...project.members] };
}

export function createPortfolioData() {
  return { projects: initialProjects.map(cloneProject), changes: initialChanges.map((change) => ({ ...change })) };
}

export function createProjectCode(data, year = new Date().getFullYear()) {
  const prefix = `PRJ-${year}-`;
  const largest = data.projects.reduce((maximum, project) => {
    if (!project.code.startsWith(prefix)) return maximum;
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
  return name.split(' ').filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
}

function validateDriveFolder(value) {
  if (!value) return '';
  let url;
  try { url = new URL(value); } catch { throw new Error('Ingresa un enlace válido de Google Drive.'); }
  if (url.protocol !== 'https:' || !['drive.google.com', 'docs.google.com'].includes(url.hostname)) throw new Error('El enlace debe pertenecer a Google Drive.');
  return url.toString();
}

export function addPortfolioProject(data, draft, date = new Date()) {
  const code = draft.code?.trim().toUpperCase() ?? '';
  const name = draft.name?.trim() ?? '';
  const description = draft.description?.trim() ?? '';
  if (!/^PRJ-\d{4}-\d{3}$/.test(code)) throw new Error('El código debe usar el formato PRJ-AAAA-000.');
  if (data.projects.some((project) => project.code.toUpperCase() === code)) throw new Error('Ya existe un proyecto con ese código.');
  if (name.length < 3) throw new Error('Ingresa el nombre del proyecto.');
  if (!projectAreas.includes(draft.area)) throw new Error('Selecciona un área técnica válida.');
  const duration = getProjectDuration(draft.startDate, draft.endDate);
  if (!duration) throw new Error('La fecha final debe ser igual o posterior a la fecha inicial.');
  const totalBudget = Number(draft.totalBudget);
  if (String(draft.totalBudget).trim() === '' || !Number.isFinite(totalBudget) || totalBudget <= 0 || totalBudget > 1000000000000) throw new Error('Ingresa un presupuesto válido mayor que cero.');
  if (!['planning', 'active', 'paused'].includes(draft.status)) throw new Error('Selecciona un estado inicial válido.');
  const leader = projectLeaders.find((item) => item.id === draft.leaderId);
  if (!leader) throw new Error('Selecciona un líder de obra válido.');
  const driveFolder = validateDriveFolder(draft.driveFolder?.trim() ?? '');
  const project = {
    id: `project-${date.getTime()}-${data.projects.length}`, code, name, area: draft.area,
    status: draft.status, progress: 0, usedBudget: 0, totalBudget,
    startDate: draft.startDate, endDate: draft.endDate, leaderId: draft.leaderId,
    driveFolder, description, members: [formatInitials(leader.name)], duration,
  };
  const change = {
    id: `project-created-${date.getTime()}`, date: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`,
    project: name, change: `Proyecto ${code} creado con un presupuesto inicial de ${formatMoney(totalBudget)}.`, user: draft.createdBy?.trim() || leader.name,
  };
  return { projects: [project, ...data.projects], changes: [change, ...data.changes] };
}

export function filterPortfolio(data, query = '', status = 'all') {
  const normalizedQuery = normalizeText(query);
  const projects = data.projects.filter((project) => {
    const statusLabel = projectStatuses.find((item) => item.id === project.status)?.label ?? '';
    const leader = projectLeaders.find((item) => item.id === project.leaderId)?.name ?? '';
    const matchesQuery = normalizeText(`${project.code} ${project.name} ${project.area} ${statusLabel} ${leader} ${project.description}`).includes(normalizedQuery);
    return matchesQuery && (status === 'all' || project.status === status);
  });
  const changes = data.changes.filter((change) => normalizeText(`${change.project} ${change.change} ${change.user} ${change.date}`).includes(normalizedQuery));
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
