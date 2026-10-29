export const teamMembersCacheKey = 'project-planner-team-members-cache-v1';

function getStorage(storage) {
  if (storage) return storage;
  if (typeof window !== 'undefined') return window.localStorage;
  return null;
}

/** Acepta tanto listas DRF simples como respuestas paginadas con `results`. */
export function normalizeTeamMemberRecords(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.results)) return payload.results;
  return null;
}

export function readCachedTeamMembers(storage) {
  try {
    const raw = getStorage(storage)?.getItem(teamMembersCacheKey);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    const members = Array.isArray(parsed) ? parsed : parsed?.members;
    return Array.isArray(members) ? members : [];
  } catch {
    return [];
  }
}

export function writeCachedTeamMembers(members, storage) {
  const target = getStorage(storage);
  if (!target || !Array.isArray(members)) return false;

  try {
    target.setItem(teamMembersCacheKey, JSON.stringify({
      version: 1,
      savedAt: new Date().toISOString(),
      members,
    }));
    return true;
  } catch {
    return false;
  }
}

export function upsertCachedTeamMember(member, storage) {
  if (!member || typeof member !== 'object') return readCachedTeamMembers(storage);

  const current = readCachedTeamMembers(storage);
  const memberId = member.id ?? member.dbId ?? null;
  const memberEmail = String(member.email ?? '').trim().toLowerCase();
  const next = [
    member,
    ...current.filter((item) => {
      const itemId = item?.id ?? item?.dbId ?? null;
      const sameId = memberId !== null && String(itemId) === String(memberId);
      const sameEmail = memberEmail && String(item?.email ?? '').trim().toLowerCase() === memberEmail;
      return !sameId && !sameEmail;
    }),
  ];
  writeCachedTeamMembers(next, storage);
  return next;
}
