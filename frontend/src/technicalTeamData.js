export const technicalAreas = [
  { id: 'architecture', label: 'Arquitectura' },
  { id: 'structures', label: 'Estructuras' },
  { id: 'systems', label: 'Sistemas' },
];

export const technicalStatuses = [
  { id: 'active', label: 'Activo en obra', shortLabel: 'Activo', className: 'border-emerald-500/25 bg-emerald-500/10 text-emerald-400' },
  { id: 'standby', label: 'En espera', shortLabel: 'Stand-by', className: 'border-amber-500/25 bg-amber-500/10 text-amber-400' },
  { id: 'support', label: 'En apoyo', shortLabel: 'En Apoyo', className: 'border-blue-500/25 bg-blue-500/10 text-blue-400' },
  { id: 'offline', label: 'No disponible', shortLabel: 'No disponible', className: 'border-slate-500/25 bg-slate-500/10 text-slate-400' },
];

export const reassignmentReasons = [
  'Transferencia por inicio de fase de acabados e interiores',
  'Rebalanceo de carga operativa',
  'Cobertura temporal por ausencia',
  'Especialidad requerida en nuevo proyecto',
  'Cierre de actividades en proyecto anterior',
];

export const technicalSortOptions = [
  { id: 'availability-desc', label: 'Mayor disponibilidad' },
  { id: 'availability-asc', label: 'Menor disponibilidad' },
  { id: 'name', label: 'Nombre A–Z' },
  { id: 'recent', label: 'Incorporación reciente' },
];

export const technicalProjects = [
  'Sin proyecto inicial',
  'Edificio Terminal B (PRJ-2026-004)',
  'Viaducto Elevado (PRJ-2026-008)',
  'Planta Tratamiento II (PRJ-2026-011)',
  'Hospital Regional (PRJ-2026-014)',
  'Project Planner (PRJ-2026-018)',
];

const initialMembers = [
  { id: 'tech-sofia', firstNames: 'Sofía', lastNames: 'Torres', email: 'sofia.torres@empresa.com', specialty: 'Arquitecta Principal / BIM', area: 'architecture', project: technicalProjects[1], status: 'active', workload: 100, avatar: null, createdAt: '2026-01-18' },
  { id: 'tech-alejandro', firstNames: 'Alejandro', lastNames: 'Ruiz', email: 'alejandro.ruiz@empresa.com', specialty: 'Ingeniero estructural', area: 'structures', project: technicalProjects[2], status: 'active', workload: 80, avatar: null, createdAt: '2026-01-14' },
  { id: 'tech-mateo', firstNames: 'Mateo', lastNames: 'Fernández', email: 'mateo.fernandez@empresa.com', specialty: 'Diseñador urbano', area: 'architecture', project: 'Parque Central Metropolitano', status: 'standby', workload: 40, avatar: null, createdAt: '2026-01-16' },
  { id: 'tech-elena', firstNames: 'Elena', lastNames: 'Gómez', email: 'elena.gomez@empresa.com', specialty: 'Especialista BIM / Revit', area: 'architecture', project: technicalProjects[1], status: 'support', workload: 95, avatar: null, createdAt: '2026-01-15' },
  { id: 'tech-carlos', firstNames: 'Carlos', lastNames: 'Mendoza', email: 'carlos.mendoza@empresa.com', specialty: 'Ingeniero de sistemas', area: 'systems', project: technicalProjects[3], status: 'active', workload: 100, avatar: null, createdAt: '2026-01-11' },
  { id: 'tech-laura', firstNames: 'Laura', lastNames: 'Castro', email: 'laura.castro@empresa.com', specialty: 'Coordinadora de instalaciones', area: 'systems', project: 'Subestación Eléctrica', status: 'standby', workload: 20, avatar: null, createdAt: '2026-01-10' },
  { id: 'tech-andres', firstNames: 'Andrés', lastNames: 'Silva', email: 'andres.silva@empresa.com', specialty: 'Cálculo y supervisión', area: 'structures', project: technicalProjects[2], status: 'active', workload: 75, avatar: null, createdAt: '2026-01-13' },
  { id: 'tech-daniel', firstNames: 'Daniel', lastNames: 'Vargas', email: 'daniel.vargas@empresa.com', specialty: 'Estructuras metálicas', area: 'structures', project: technicalProjects[3], status: 'active', workload: 85, avatar: null, createdAt: '2026-01-12' },
  { id: 'tech-javier', firstNames: 'Javier', lastNames: 'Paredes', email: 'javier.paredes@empresa.com', specialty: 'Ingeniero civil sénior', area: 'structures', project: technicalProjects[4], status: 'active', workload: 70, avatar: null, createdAt: '2026-01-08' },
  { id: 'tech-valeria', firstNames: 'Valeria', lastNames: 'López', email: 'valeria.lopez@empresa.com', specialty: 'Diseño arquitectónico', area: 'architecture', project: 'Residencial Las Palmas', status: 'active', workload: 80, avatar: null, createdAt: '2026-01-07' },
  { id: 'tech-adriana', firstNames: 'Adriana', lastNames: 'Vega', email: 'adriana.vega@empresa.com', specialty: 'Coordinación BIM', area: 'architecture', project: 'Torre Reforma', status: 'active', workload: 90, avatar: null, createdAt: '2026-01-06' },
  { id: 'tech-camila', firstNames: 'Camila', lastNames: 'Ríos', email: 'camila.rios@empresa.com', specialty: 'Arquitectura sostenible', area: 'architecture', project: 'Centro Comercial Norte', status: 'standby', workload: 35, avatar: null, createdAt: '2026-01-05' },
  { id: 'tech-renato', firstNames: 'Renato', lastNames: 'Flores', email: 'renato.flores@empresa.com', specialty: 'Visualización arquitectónica', area: 'architecture', project: 'Residencial Las Palmas', status: 'active', workload: 65, avatar: null, createdAt: '2026-01-04' },
  { id: 'tech-lucia', firstNames: 'Lucía', lastNames: 'Navarro', email: 'lucia.navarro@empresa.com', specialty: 'Planificación urbana', area: 'architecture', project: 'Parque Central Metropolitano', status: 'offline', workload: 10, avatar: null, createdAt: '2026-01-03' },
  { id: 'tech-miguel', firstNames: 'Miguel', lastNames: 'Salas', email: 'miguel.salas@empresa.com', specialty: 'Ingeniería sísmica', area: 'structures', project: 'Torre Reforma', status: 'active', workload: 95, avatar: null, createdAt: '2026-01-02' },
  { id: 'tech-paola', firstNames: 'Paola', lastNames: 'Medina', email: 'paola.medina@empresa.com', specialty: 'Supervisión de estructuras', area: 'structures', project: technicalProjects[2], status: 'standby', workload: 45, avatar: null, createdAt: '2025-12-29' },
  { id: 'tech-patricia', firstNames: 'Patricia', lastNames: 'Luna', email: 'patricia.luna@empresa.com', specialty: 'Datos y backend', area: 'systems', project: technicalProjects[4], status: 'active', workload: 90, avatar: null, createdAt: '2026-01-09' },
  { id: 'tech-ricardo', firstNames: 'Ricardo', lastNames: 'Peña', email: 'ricardo.pena@empresa.com', specialty: 'Automatización e integraciones', area: 'systems', project: technicalProjects[5], status: 'active', workload: 85, avatar: null, createdAt: '2025-12-28' },
];

const initialAssignments = [
  { id: 'assignment-1', date: '2026-01-15', memberId: 'tech-alejandro', memberName: 'Alejandro Ruiz', memberPrefix: 'Ing.', previousProject: 'Torre Reforma', project: technicalProjects[2], status: 'active', workload: 80, reason: 'Especialidad requerida en nuevo proyecto' },
  { id: 'assignment-2', date: '2026-01-14', memberId: 'tech-sofia', memberName: 'Sofía Torres', memberPrefix: 'Arq.', previousProject: 'Residencial Las Palmas', project: technicalProjects[1], status: 'active', workload: 100, reason: 'Rebalanceo de carga operativa' },
  { id: 'assignment-3', date: '2026-01-12', memberId: 'tech-elena', memberName: 'Elena Gómez', memberPrefix: 'Arq.', previousProject: 'Centro Comercial Norte', project: technicalProjects[1], status: 'support', workload: 95, reason: 'Cobertura temporal por ausencia' },
  { id: 'assignment-4', date: '2026-01-10', memberId: 'tech-laura', memberName: 'Laura Castro', memberPrefix: 'Ing.', previousProject: technicalProjects[3], project: 'Subestación Eléctrica', status: 'standby', workload: 20, reason: 'Cierre de actividades en proyecto anterior' },
];

function cloneMember(member) {
  return { ...member };
}

function normalizeText(value) {
  return String(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

export function createTechnicalTeamData() {
  return {
    members: initialMembers.map(cloneMember),
    assignments: initialAssignments.map((assignment) => ({ ...assignment })),
  };
}

export function getMemberFullName(member) {
  return `${member.firstNames} ${member.lastNames}`.trim();
}

export function summarizeTechnicalTeam(members) {
  return members.reduce((summary, member) => {
    summary.total += 1;
    summary[member.status] += 1;
    summary.areas[member.area] += 1;
    return summary;
  }, { total: 0, active: 0, standby: 0, support: 0, offline: 0, areas: { architecture: 0, structures: 0, systems: 0 } });
}

export function filterTechnicalTeam(members, query = '', area = 'all') {
  const normalizedQuery = normalizeText(query);
  return members.filter((member) => {
    const areaLabel = technicalAreas.find((item) => item.id === member.area)?.label ?? '';
    const statusLabel = technicalStatuses.find((item) => item.id === member.status)?.label ?? '';
    const matchesQuery = normalizeText(`${getMemberFullName(member)} ${member.email} ${member.specialty} ${areaLabel} ${member.project} ${statusLabel}`).includes(normalizedQuery);
    return matchesQuery && (area === 'all' || member.area === area);
  });
}

export function sortTechnicalTeam(members, order = 'availability-desc') {
  const sorted = [...members];
  if (order === 'availability-asc') return sorted.sort((a, b) => a.workload - b.workload || getMemberFullName(a).localeCompare(getMemberFullName(b), 'es'));
  if (order === 'name') return sorted.sort((a, b) => getMemberFullName(a).localeCompare(getMemberFullName(b), 'es'));
  if (order === 'recent') return sorted.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return sorted.sort((a, b) => b.workload - a.workload || getMemberFullName(a).localeCompare(getMemberFullName(b), 'es'));
}

function escapeCsv(value) {
  const text = String(value ?? '');
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

export function buildTechnicalTeamCsv(members) {
  const header = ['Nombre', 'Correo', 'Área', 'Especialidad', 'Proyecto asignado', 'Estado', 'Dedicación'];
  const rows = members.map((member) => {
    const area = technicalAreas.find((item) => item.id === member.area)?.label ?? member.area;
    const status = technicalStatuses.find((item) => item.id === member.status)?.label ?? member.status;
    return [getMemberFullName(member), member.email, area, member.specialty, member.project, status, `${member.workload}%`].map(escapeCsv).join(',');
  });
  return [header.join(','), ...rows].join('\n');
}

export function addTechnicalMember(data, draft, date = new Date()) {
  const firstNames = draft.firstNames?.trim() ?? '';
  const lastNames = draft.lastNames?.trim() ?? '';
  const email = draft.email?.trim().toLowerCase() ?? '';
  const specialty = draft.specialty?.trim() ?? '';
  if (firstNames.length < 2) throw new Error('Ingresa los nombres del técnico.');
  if (lastNames.length < 2) throw new Error('Ingresa los apellidos del técnico.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Ingresa un correo corporativo válido.');
  if (data.members.some((member) => member.email.toLowerCase() === email)) throw new Error('Ya existe un técnico con ese correo.');
  if (specialty.length < 2) throw new Error('Ingresa la especialidad o el rol.');
  if (!technicalAreas.some((area) => area.id === draft.area)) throw new Error('Selecciona un área técnica válida.');
  if (!technicalStatuses.some((status) => status.id === draft.status)) throw new Error('Selecciona un estado de disponibilidad válido.');
  const project = draft.project?.trim() || technicalProjects[0];
  const workload = Number(draft.workload);
  if (String(draft.workload).trim() === '' || !Number.isInteger(workload) || workload < 0 || workload > 100) throw new Error('La carga inicial debe ser un número entero entre 0 y 100.');
  const localDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  const member = {
    id: `tech-${date.getTime()}-${data.members.length}`,
    firstNames, lastNames, email, specialty, area: draft.area, project,
    status: draft.status, workload, avatar: draft.avatar || null, createdAt: localDate,
  };
  const assignment = {
    id: `assignment-created-${date.getTime()}-${data.members.length}`,
    date: localDate,
    memberId: member.id,
    memberName: getMemberFullName(member),
    memberPrefix: member.area === 'architecture' ? 'Arq.' : 'Ing.',
    previousProject: '',
    project,
    status: member.status,
    workload,
    reason: 'Alta técnica e incorporación inicial',
  };
  return { ...data, members: [member, ...data.members], assignments: [assignment, ...(data.assignments ?? [])] };
}

export function reassignTechnicalMember(data, memberId, draft, date = new Date()) {
  const member = data.members.find((item) => item.id === memberId);
  if (!member) throw new Error('No se encontró al técnico seleccionado.');
  const project = draft.project?.trim() ?? '';
  if (!project) throw new Error('Selecciona el nuevo proyecto asignado.');
  if (!['active', 'standby', 'support'].includes(draft.status)) throw new Error('Selecciona un estado operativo válido.');
  const workload = Number(draft.workload);
  if (String(draft.workload).trim() === '' || !Number.isInteger(workload) || workload < 0 || workload > 100) throw new Error('La dedicación debe ser un número entero entre 0 y 100.');
  if (!reassignmentReasons.includes(draft.reason)) throw new Error('Selecciona un motivo de reasignación válido.');
  if (member.project === project && member.status === draft.status && member.workload === workload) return data;

  const localDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  const assignment = {
    id: `assignment-${date.getTime()}-${memberId}`,
    date: localDate,
    memberId,
    memberName: getMemberFullName(member),
    memberPrefix: member.area === 'architecture' ? 'Arq.' : 'Ing.',
    previousProject: member.project,
    project,
    status: draft.status,
    workload,
    reason: draft.reason,
  };
  return {
    ...data,
    members: data.members.map((item) => item.id === memberId ? { ...item, project, status: draft.status, workload } : item),
    assignments: [assignment, ...(data.assignments ?? [])],
  };
}
