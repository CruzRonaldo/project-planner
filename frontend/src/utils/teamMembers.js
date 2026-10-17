const AREA_ALIASES = {
  arquitectura: 'architecture',
  architecture: 'architecture',
  arquitecto: 'architecture',
  arquitecta: 'architecture',
  estructuras: 'structures',
  estructura: 'structures',
  structures: 'structures',
  civil: 'structures',
  sistemas: 'systems',
  sistema: 'systems',
  systems: 'systems',
};

const AREA_LABELS = {
  architecture: 'Arquitectura',
  structures: 'Estructuras',
  systems: 'Sistemas',
};

function normalizeText(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function getRelatedValue(value, property) {
  return value && typeof value === 'object' ? value[property] : value;
}

function getRelatedId(value, explicitId) {
  if (explicitId !== undefined && explicitId !== null) return explicitId;
  if (value && typeof value === 'object') return value.id ?? null;
  if (typeof value === 'number') return value;
  if (typeof value === 'string' && /^\d+$/.test(value.trim())) return Number(value);
  return null;
}

function normalizePercentage(value, fallback = 0) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(100, Math.max(0, Math.round(parsed)));
}

function normalizeAreaCode(value) {
  const normalized = normalizeText(getRelatedValue(value, 'name'));
  if (AREA_ALIASES[normalized]) return AREA_ALIASES[normalized];

  if (normalized.includes('arquitect')) return 'architecture';
  if (normalized.includes('estruct') || normalized.includes('civil')) return 'structures';
  if (normalized.includes('sistem')) return 'systems';

  return normalized.replace(/\s+/g, '-') || 'systems';
}

function getAreaName(member, areaCode) {
  const rawArea = member.technical_area_name
    ?? getRelatedValue(member.technical_area, 'name')
    ?? member.area_name;
  return String(rawArea ?? AREA_LABELS[areaCode] ?? 'Sin área').trim();
}

function getNames(member) {
  const firstNames = String(member.first_name ?? member.firstNames ?? '').trim();
  const lastNames = String(member.last_name ?? member.lastNames ?? '').trim();
  const fullName = String(member.full_name ?? member.name ?? `${firstNames} ${lastNames}`).trim();

  if (firstNames || lastNames) return { firstNames, lastNames, fullName };

  const parts = fullName.split(/\s+/).filter(Boolean);
  return {
    firstNames: parts.shift() ?? '',
    lastNames: parts.join(' '),
    fullName,
  };
}

function getProject(member, includeCode) {
  const relation = member.project && typeof member.project === 'object' ? member.project : null;
  const name = String(member.project_name ?? relation?.name ?? '').trim();
  const code = String(member.project_code ?? relation?.code ?? '').trim();

  if (!name) return includeCode ? 'Sin proyecto inicial' : 'Ninguno';
  if (includeCode && code && !name.includes(code)) return `${name} (${code})`;
  return name;
}

function getStatusValue(member) {
  return member.status_name
    ?? getRelatedValue(member.status, 'name')
    ?? member.status_code
    ?? member.status;
}

function getStableId(member, prefix) {
  const id = member.dbId ?? member.id;
  if (id === undefined || id === null || id === '') return `${prefix}-unknown`;
  return `${prefix}-db-${id}`;
}

/**
 * Convierte los nombres usados por Django y por las vistas al estado canónico
 * que comparten Equipo Técnico y Recursos Humanos.
 */
export function normalizeTeamStatus(value, isActive = true) {
  if (value && typeof value === 'object') {
    isActive = value.is_active ?? value.isActive ?? isActive;
    value = value.status_name ?? getRelatedValue(value.status, 'name') ?? value.name ?? value.status;
  }
  if (isActive === false) return 'offline';

  const normalized = normalizeText(value).replace(/[\s_-]+/g, '');
  if (['active', 'activo', 'activoenobra'].includes(normalized)) return 'active';
  if (['standby', 'enespera', 'fueradeobra'].includes(normalized)) return 'standby';
  if (['support', 'apoyo', 'enapoyo'].includes(normalized)) return 'support';
  if (['offline', 'nodisponible', 'inactive', 'inactivo'].includes(normalized)) return 'offline';
  return 'offline';
}

/** Mapea un registro TeamMember de Django al contrato visual de Equipo Técnico. */
export function mapTeamMemberToTechnical(member = {}) {
  const names = getNames(member);
  const area = normalizeAreaCode(
    member.technical_area_name ?? member.technical_area ?? member.area_name ?? member.area
  );
  const allocation = member.allocation_percentage
    ?? member.allocationPercentage
    ?? member.workload
    ?? member.availability;

  return {
    id: getStableId(member, 'tech'),
    dbId: member.dbId ?? member.id ?? null,
    technicalAreaId: getRelatedId(member.technical_area, member.technical_area_id),
    statusId: getRelatedId(member.status, member.status_id),
    projectId: getRelatedId(member.project, member.project_id),
    firstNames: names.firstNames,
    lastNames: names.lastNames,
    email: String(member.email ?? '').trim().toLowerCase(),
    specialty: String(member.role_name ?? getRelatedValue(member.role, 'name') ?? member.specialty ?? 'Sin especialidad').trim(),
    area,
    project: getProject(member, true),
    status: normalizeTeamStatus(getStatusValue(member), member.is_active),
    workload: normalizePercentage(allocation),
    avatar: member.avatar ?? member.photo ?? member.profile_photo ?? null,
    createdAt: String(member.created_at ?? member.createdAt ?? '').split('T')[0],
  };
}

/** Mapea el mismo TeamMember de Django al contrato visual de Recursos Humanos. */
export function mapTeamMemberToHumanResources(member = {}) {
  const names = getNames(member);
  const areaCode = normalizeAreaCode(
    member.technical_area_name ?? member.technical_area ?? member.area_name ?? member.area
  );
  const normalizedStatus = normalizeTeamStatus(getStatusValue(member), member.is_active);
  const availability = member.availability
    ?? member.allocation_percentage
    ?? member.allocationPercentage
    ?? member.workload;

  return {
    id: getStableId(member, 'hr'),
    dbId: member.dbId ?? member.id ?? null,
    technicalAreaId: getRelatedId(member.technical_area, member.technical_area_id),
    statusId: getRelatedId(member.status, member.status_id),
    projectId: getRelatedId(member.project, member.project_id),
    name: names.fullName,
    email: String(member.email ?? '').trim().toLowerCase(),
    area: getAreaName(member, areaCode),
    project: getProject(member, false),
    // La vista de RR. HH. dispone de Activo, Stand-by y Apoyo. Un integrante
    // inactivo se presenta como Stand-by sin alterar el estado real del backend.
    status: normalizedStatus === 'offline' ? 'standby' : normalizedStatus,
    availability: normalizePercentage(availability),
  };
}

export { normalizeAreaCode, normalizePercentage };
