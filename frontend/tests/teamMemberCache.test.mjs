import assert from 'node:assert/strict';
import test from 'node:test';
import {
  normalizeTeamMemberRecords,
  readCachedTeamMembers,
  teamMembersCacheKey,
  upsertCachedTeamMember,
  writeCachedTeamMembers,
} from '../src/utils/teamMemberCache.js';

function createStorage() {
  const values = new Map();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  };
}

test('normaliza respuestas simples y paginadas sin convertir errores en una lista vacía', () => {
  const members = [{ id: 1 }, { id: 2 }];
  assert.equal(normalizeTeamMemberRecords(members), members);
  assert.equal(normalizeTeamMemberRecords({ results: members }), members);
  assert.equal(normalizeTeamMemberRecords({ count: 2 }), null);
  assert.equal(normalizeTeamMemberRecords(null), null);
});

test('conserva la última lista válida para recuperarla después de recargar', () => {
  const storage = createStorage();
  const members = [{ id: 1, email: 'sofia@empresa.com' }];

  assert.equal(writeCachedTeamMembers(members, storage), true);
  assert.deepEqual(readCachedTeamMembers(storage), members);
  assert.ok(storage.getItem(teamMembersCacheKey));
});

test('incorpora inmediatamente un técnico persistido sin duplicarlo', () => {
  const storage = createStorage();
  writeCachedTeamMembers([{ id: 1, email: 'sofia@empresa.com' }], storage);

  upsertCachedTeamMember({ id: 2, email: 'nuevo@empresa.com' }, storage);
  upsertCachedTeamMember({ id: 2, email: 'NUEVO@empresa.com', availability: 80 }, storage);

  assert.deepEqual(readCachedTeamMembers(storage), [
    { id: 2, email: 'NUEVO@empresa.com', availability: 80 },
    { id: 1, email: 'sofia@empresa.com' },
  ]);
});
