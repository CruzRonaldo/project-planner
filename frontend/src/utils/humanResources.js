import { personnelStatuses, personnelIncidentTypes } from '../constants/humanResources.js';

export function summarizePersonnel(members = []) {
  return (members || []).reduce(
    (summary, member) => ({
      ...summary,
      total: summary.total + 1,
      [member.status]: (summary[member.status] || 0) + 1,
    }),
    { total: 0, active: 0, standby: 0, support: 0 }
  );
}

function normalizeText(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export function filterPersonnel(members = [], query = '', status = 'all') {
  const normalizedQuery = normalizeText(query);
  return (members || []).filter((member) => {
    const statusLabel = personnelStatuses.find((item) => item.id === member.status)?.label ?? '';
    const matchesQuery = normalizeText(
      `${member.name} ${member.area} ${member.project} ${statusLabel} ${member.availability}%`
    ).includes(normalizedQuery);
    return matchesQuery && (status === 'all' || member.status === status);
  });
}

function escapeCsv(value) {
  const text = String(value ?? '');
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

export function buildPersonnelCsv(members = []) {
  const header = ['Nombre', 'Área técnica', 'Proyecto asignado', 'Estado', 'Disponibilidad'];
  const rows = (members || []).map((member) => {
    const status = personnelStatuses.find((item) => item.id === member.status)?.label ?? member.status;
    return [member.name, member.area, member.project, status, `${member.availability}%`].map(escapeCsv).join(',');
  });
  return [header.join(','), ...rows].join('\n');
}

export function updatePersonnel(data, memberId, draft, date = new Date()) {
  const member = data?.members?.find((item) => item.id === memberId);
  const availability = Number(draft.availability);
  if (!member) throw new Error('No se encontró el integrante.');
  if (!personnelStatuses.some((status) => status.id === draft.status)) throw new Error('Selecciona un estado válido.');
  if (String(draft.availability).trim() === '' || !Number.isInteger(availability) || availability < 0 || availability > 100) {
    throw new Error('La disponibilidad debe ser un número entero entre 0 y 100.');
  }
  const project = draft.project.trim();
  if (!project) throw new Error('Indica un proyecto o escribe Ninguno.');
  if (member.status === draft.status && member.project === project && member.availability === availability) return data;

  const updatedMember = { ...member, project, status: draft.status, availability };
  const details = [
    member.project !== project && `Proyecto: ${member.project} → ${project}.`,
    member.availability !== availability && `Disponibilidad: ${member.availability}% → ${availability}%.`,
    member.status !== draft.status && 'Cambio de estado.',
  ].filter(Boolean).join(' ');
  const localDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  const historyList = data?.history || [];
  const change = {
    id: `change-${date.getTime()}-${historyList.length}`,
    date: localDate,
    name: member.name,
    previousStatus: member.status,
    nextStatus: draft.status,
    comment: [draft.comment?.trim(), details].filter(Boolean).join(' '),
  };
  return {
    ...data,
    members: (data?.members || []).map((item) => item.id === memberId ? updatedMember : item),
    history: [change, ...historyList],
    incidents: data?.incidents ?? [],
  };
}

export function getIncidentDuration(startDate, endDate) {
  const start = new Date(`${startDate}T12:00:00`);
  const end = new Date(`${endDate}T12:00:00`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) return null;
  const millisecondsPerDay = 1000 * 60 * 60 * 24;
  const calendarDays = Math.max(1, Math.round((end - start) / millisecondsPerDay));
  let businessDays = 0;
  const limit = start.getTime() === end.getTime() ? new Date(end.getTime() + millisecondsPerDay) : end;
  for (const current = new Date(start); current < limit; current.setDate(current.getDate() + 1)) {
    if (current.getDay() !== 0 && current.getDay() !== 6) businessDays += 1;
  }
  return { calendarDays, businessDays };
}

export function registerPersonnelIncident(data, draft, date = new Date()) {
  const members = data?.members || [];
  const member = members.find((item) => item.id === draft.memberId);
  if (!member) throw new Error('Selecciona un integrante del personal válido.');
  const incidentType = personnelIncidentTypes.find((item) => item.id === draft.type);
  if (!incidentType) throw new Error('Selecciona un tipo de incidencia válido.');
  const duration = getIncidentDuration(draft.startDate, draft.endDate);
  if (!duration) throw new Error('La fecha de retorno debe ser igual o posterior a la fecha de inicio.');
  if (!personnelStatuses.some((status) => status.id === draft.status)) throw new Error('Selecciona un estado operativo válido.');
  const availability = Number(draft.availability);
  if (String(draft.availability).trim() === '' || !Number.isInteger(availability) || availability < 0 || availability > 100) {
    throw new Error('La disponibilidad debe ser un número entero entre 0 y 100.');
  }
  const backupMember = draft.backupMemberId ? members.find((item) => item.id === draft.backupMemberId) : null;
  if (draft.backupMemberId && !backupMember) throw new Error('Selecciona un técnico de respaldo válido.');
  if (backupMember?.id === member.id) throw new Error('El integrante no puede ser su propio respaldo.');
  const comment = draft.comment?.trim() ?? '';
  if (comment.length < 5) throw new Error('Detalla el motivo o comentario de la incidencia.');

  const localDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  const incident = {
    id: `incident-${date.getTime()}-${member.id}`,
    registeredAt: localDate,
    memberId: member.id,
    memberName: member.name,
    type: incidentType.id,
    typeLabel: incidentType.label,
    startDate: draft.startDate,
    endDate: draft.endDate,
    status: draft.status,
    availability,
    backupMemberId: backupMember?.id ?? '',
    backupMemberName: backupMember?.name ?? '',
    comment,
    ...duration,
  };
  const coverage = backupMember ? ` Cobertura temporal: ${backupMember.name}.` : '';
  const historyList = data?.history || [];
  const change = {
    id: `incident-change-${date.getTime()}-${historyList.length}`,
    date: localDate,
    name: member.name,
    previousStatus: member.status,
    nextStatus: draft.status,
    comment: `${incidentType.label}: ${draft.startDate} al ${draft.endDate}. ${comment}${coverage}`,
  };
  return {
    ...data,
    members: members.map((item) => item.id === member.id ? { ...item, status: draft.status, availability } : item),
    history: [change, ...historyList],
    incidents: [incident, ...(data?.incidents ?? [])],
  };
}
