import { technicalAreas, technicalProjects, technicalStatuses, reassignmentReasons } from '../constants/technicalTeam.js';

function normalizeText(value) {
  return String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

export function getMemberFullName(member) {
  return `${member?.firstNames || ''} ${member?.lastNames || ''}`.trim();
}

export function summarizeTechnicalTeam(members = []) {
  return (members || []).reduce(
    (summary, member) => {
      summary.total += 1;
      if (summary[member.status] !== undefined) summary[member.status] += 1;
      if (summary.areas[member.area] !== undefined) summary.areas[member.area] += 1;
      return summary;
    },
    { total: 0, active: 0, standby: 0, support: 0, offline: 0, areas: { architecture: 0, structures: 0, systems: 0 } }
  );
}

export function filterTechnicalTeam(members = [], query = '', area = 'all') {
  const normalizedQuery = normalizeText(query);
  return (members || []).filter((member) => {
    const areaLabel = technicalAreas.find((item) => item.id === member.area)?.label ?? '';
    const statusLabel = technicalStatuses.find((item) => item.id === member.status)?.label ?? '';
    const matchesQuery = normalizeText(`${getMemberFullName(member)} ${member.email} ${member.specialty} ${areaLabel} ${member.project} ${statusLabel}`).includes(normalizedQuery);
    return matchesQuery && (area === 'all' || member.area === area);
  });
}

export function sortTechnicalTeam(members = [], order = 'availability-desc') {
  const sorted = [...(members || [])];
  if (order === 'availability-asc') return sorted.sort((a, b) => a.workload - b.workload || getMemberFullName(a).localeCompare(getMemberFullName(b), 'es'));
  if (order === 'name') return sorted.sort((a, b) => getMemberFullName(a).localeCompare(getMemberFullName(b), 'es'));
  if (order === 'recent') return sorted.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  return sorted.sort((a, b) => b.workload - a.workload || getMemberFullName(a).localeCompare(getMemberFullName(b), 'es'));
}

function escapeCsv(value) {
  const text = String(value ?? '');
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

export function buildTechnicalTeamCsv(members = []) {
  const header = ['Nombre', 'Correo', 'Área', 'Especialidad', 'Proyecto asignado', 'Estado', 'Dedicación'];
  const rows = (members || []).map((member) => {
    const area = technicalAreas.find((item) => item.id === member.area)?.label ?? member.area;
    const status = technicalStatuses.find((item) => item.id === member.status)?.label ?? member.status;
    return [getMemberFullName(member), member.email, area, member.specialty, member.project, status, `${member.workload}%`].map(escapeCsv).join(',');
  });
  return [header.join(','), ...rows].join('\n');
}

export function addTechnicalMember(data, draft, date = new Date()) {
  const members = data?.members || [];
  const assignments = data?.assignments || [];
  const firstNames = draft.firstNames?.trim() ?? '';
  const lastNames = draft.lastNames?.trim() ?? '';
  const email = draft.email?.trim().toLowerCase() ?? '';
  const specialty = draft.specialty?.trim() ?? '';
  if (firstNames.length < 2) throw new Error('Ingresa los nombres del técnico.');
  if (lastNames.length < 2) throw new Error('Ingresa los apellidos del técnico.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Ingresa un correo corporativo válido.');
  if (members.some((member) => member.email?.toLowerCase() === email)) throw new Error('Ya existe un técnico con ese correo.');
  if (specialty.length < 2) throw new Error('Ingresa la especialidad o el rol.');
  if (!technicalAreas.some((area) => area.id === draft.area)) throw new Error('Selecciona un área técnica válida.');
  if (!technicalStatuses.some((status) => status.id === draft.status)) throw new Error('Selecciona un estado de disponibilidad válido.');
  const project = draft.project?.trim() || technicalProjects[0];
  const workload = Number(draft.workload);
  if (String(draft.workload).trim() === '' || !Number.isInteger(workload) || workload < 0 || workload > 100) throw new Error('La carga inicial debe ser un número entero entre 0 y 100.');
  const localDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  const member = {
    id: `tech-${date.getTime()}-${members.length}`,
    firstNames, lastNames, email, specialty, area: draft.area, project,
    status: draft.status, workload, avatar: draft.avatar || null, createdAt: localDate,
  };
  const assignment = {
    id: `assignment-created-${date.getTime()}-${members.length}`,
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
  return { ...data, members: [member, ...members], assignments: [assignment, ...assignments] };
}

export function reassignTechnicalMember(data, memberId, draft, date = new Date()) {
  const members = data?.members || [];
  const assignments = data?.assignments || [];
  const member = members.find((item) => item.id === memberId);
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
    members: members.map((item) => item.id === memberId ? { ...item, project, status: draft.status, workload } : item),
    assignments: [assignment, ...assignments],
  };
}
