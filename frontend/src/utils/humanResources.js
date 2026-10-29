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
  const isAll =
    !status ||
    status === 'all' ||
    (Array.isArray(status) && (status.length === 0 || status.includes('all') || status.length >= personnelStatuses.length));

  return (members || []).filter((member) => {
    const statusLabel = personnelStatuses.find((item) => item.id === member.status)?.label ?? '';
    const matchesQuery = normalizeText(
      `${member.name} ${member.area} ${member.project} ${statusLabel} ${member.availability}%`
    ).includes(normalizedQuery);

    if (!matchesQuery) return false;
    if (isAll) return true;
    if (Array.isArray(status)) {
      return status.includes(member.status);
    }
    return member.status === status;
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

function getCollectionRecords(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.results)) return payload.results;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
}

function normalizeWorkflowStatus(value) {
  const normalized = normalizeText(value).replace(/[\s_-]+/g, '');
  if (['approved', 'aprobado', 'aprobada'].includes(normalized)) return 'approved';
  if (['rejected', 'rechazado', 'rechazada'].includes(normalized)) return 'rejected';
  if (['finalized', 'finalizado', 'finalizada', 'completed', 'completado'].includes(normalized)) return 'finalized';
  return 'pending';
}

function normalizePersonnelStatus(value) {
  const rawValue = value && typeof value === 'object'
    ? value.name ?? value.code ?? value.id
    : value;
  const normalized = normalizeText(rawValue).replace(/[\s_-]+/g, '');
  if (['active', 'activo', 'activoenobra'].includes(normalized)) return 'active';
  if (['support', 'apoyo', 'enapoyo'].includes(normalized)) return 'support';
  return 'standby';
}

/** Convierte la respuesta REST de incidencias al contrato estable de la vista. */
export function normalizePersonnelIncidents(payload) {
  return getCollectionRecords(payload).map((incident) => {
    const startDate = incident.start_date ?? incident.startDate ?? '';
    const endDate = incident.end_date ?? incident.endDate ?? '';
    const duration = getIncidentDuration(startDate, endDate) || {};
    const memberValue = incident.member && typeof incident.member === 'object'
      ? incident.member.id
      : incident.member;
    const backupValue = incident.backup_member && typeof incident.backup_member === 'object'
      ? incident.backup_member.id
      : incident.backup_member;

    return {
      id: incident.id,
      memberId: incident.memberId ?? memberValue ?? null,
      memberName: incident.member_name ?? incident.memberName ?? incident.member?.name ?? 'Personal sin nombre',
      type: incident.incident_type ?? incident.type ?? 'other',
      typeLabel: incident.incident_type_display ?? incident.typeLabel ?? incident.incident_type ?? incident.type ?? 'Incidencia',
      startDate,
      endDate,
      status: normalizePersonnelStatus(
        incident.resulting_status_name ?? incident.resultingStatusName ?? incident.resulting_status ?? incident.resultingStatus
      ),
      availability: Number(incident.availability ?? 0),
      backupMemberId: incident.backupMemberId ?? backupValue ?? null,
      backupMemberName: incident.backup_member_name ?? incident.backupMemberName ?? incident.backup_member?.name ?? '',
      comment: incident.reason ?? incident.comment ?? '',
      workflowStatus: normalizeWorkflowStatus(
        incident.workflow_status ?? incident.workflowStatus ?? incident.workflow_status_display
      ),
      workflowStatusLabel: incident.workflow_status_display ?? incident.workflowStatusDisplay ?? '',
      createdByName: incident.created_by_name ?? incident.createdByName ?? '',
      reviewedByName: incident.reviewed_by_name ?? incident.reviewedByName ?? '',
      reviewedAt: incident.reviewed_at ?? incident.reviewedAt ?? null,
      reviewComment: incident.review_comment ?? incident.reviewComment ?? '',
      registeredAt: String(incident.created_at ?? incident.createdAt ?? '').split('T')[0],
      updatedAt: incident.updated_at ?? incident.updatedAt ?? null,
      calendarDays: Number(incident.duration_days ?? incident.durationDays ?? duration.calendarDays ?? 0),
      businessDays: Number(incident.business_days ?? incident.businessDays ?? duration.businessDays ?? 0),
    };
  });
}

/** Convierte la bitácora persistente de Django al contrato de la tabla de RR. HH. */
export function normalizeTeamMemberHistory(payload) {
  return getCollectionRecords(payload).map((change) => ({
    id: change.id,
    date: String(change.date ?? change.created_at ?? change.createdAt ?? '').split('T')[0],
    name: change.name ?? change.member_name ?? change.memberName ?? 'Personal sin nombre',
    previousStatus: normalizePersonnelStatus(
      change.previousStatus ?? change.previous_status_name ?? change.previousStatusName ?? change.previous_status
    ),
    nextStatus: normalizePersonnelStatus(
      change.nextStatus ?? change.next_status_name ?? change.nextStatusName ?? change.next_status
    ),
    comment: change.comment ?? change.reason ?? change.description ?? 'Cambio registrado en el sistema.',
    changedByName: change.changed_by_name ?? change.changedByName ?? '',
  }));
}

export function getUpcomingIncidentAlerts(incidents = [], today = new Date(), warningDays = 7) {
  const todayAtNoon = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 12);
  const millisecondsPerDay = 1000 * 60 * 60 * 24;
  return (incidents || [])
    .filter((incident) => incident.workflowStatus === 'approved')
    .map((incident) => {
      const returnDate = new Date(`${incident.endDate}T12:00:00`);
      const daysUntilReturn = Math.ceil((returnDate - todayAtNoon) / millisecondsPerDay);
      return { ...incident, daysUntilReturn };
    })
    .filter((incident) => Number.isFinite(incident.daysUntilReturn) && incident.daysUntilReturn <= warningDays)
    .sort((left, right) => left.daysUntilReturn - right.daysUntilReturn);
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
