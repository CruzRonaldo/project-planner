import assert from 'node:assert/strict';
import test from 'node:test';
import {
  mapTeamMemberToHumanResources,
  mapTeamMemberToTechnical,
  normalizeTeamStatus,
} from '../src/utils/teamMembers.js';

const backendMember = {
  id: 42,
  first_name: 'Sofía',
  last_name: 'Torres',
  full_name: 'Sofía Torres',
  email: 'SOFIA.TORRES@EMPRESA.COM',
  role: 3,
  role_name: 'Arquitecta Principal / BIM',
  technical_area: 1,
  technical_area_name: 'Arquitectura',
  status: 1,
  status_name: 'Active',
  project: 9,
  project_name: 'Edificio Terminal B',
  project_code: 'PRJ-2026-004',
  availability: 65,
  allocation_percentage: 80,
  is_active: true,
  created_at: '2026-09-05T15:30:00-05:00',
};

test('normaliza los nombres de estado usados por Django y las vistas', () => {
  assert.equal(normalizeTeamStatus('Active'), 'active');
  assert.equal(normalizeTeamStatus('Activo en obra'), 'active');
  assert.equal(normalizeTeamStatus('Stand-by'), 'standby');
  assert.equal(normalizeTeamStatus('En espera'), 'standby');
  assert.equal(normalizeTeamStatus('Support'), 'support');
  assert.equal(normalizeTeamStatus('En apoyo'), 'support');
  assert.equal(normalizeTeamStatus({ name: 'Support' }), 'support');
  assert.equal(normalizeTeamStatus('No disponible'), 'offline');
  assert.equal(normalizeTeamStatus('Active', false), 'offline');
});

test('mapea TeamMember al contrato de Equipo Técnico sin mutar el origen', () => {
  const original = structuredClone(backendMember);
  const mapped = mapTeamMemberToTechnical(backendMember);

  assert.deepEqual(mapped, {
    id: 'tech-db-42',
    dbId: 42,
    technicalAreaId: 1,
    statusId: 1,
    projectId: 9,
    firstNames: 'Sofía',
    lastNames: 'Torres',
    email: 'sofia.torres@empresa.com',
    specialty: 'Arquitecta Principal / BIM',
    area: 'architecture',
    project: 'Edificio Terminal B (PRJ-2026-004)',
    status: 'active',
    workload: 80,
    avatar: null,
    createdAt: '2026-09-05',
  });
  assert.deepEqual(backendMember, original);
});

test('mapea el mismo TeamMember al contrato de Recursos Humanos', () => {
  const mapped = mapTeamMemberToHumanResources(backendMember);

  assert.deepEqual(mapped, {
    id: 'hr-db-42',
    dbId: 42,
    technicalAreaId: 1,
    statusId: 1,
    projectId: 9,
    name: 'Sofía Torres',
    email: 'sofia.torres@empresa.com',
    area: 'Arquitectura',
    project: 'Edificio Terminal B',
    status: 'active',
    availability: 65,
  });
});

test('tolera relaciones anidadas, proyecto vacío y porcentajes fuera de rango', () => {
  const source = {
    id: 7,
    full_name: 'Luis Paredes',
    email: 'luis@empresa.com',
    role: { name: 'Ingeniero civil' },
    technical_area: { name: 'Civil' },
    status: { name: 'Support' },
    project: null,
    availability: -5,
    allocation_percentage: 120,
    is_active: false,
  };

  const technical = mapTeamMemberToTechnical(source);
  const humanResources = mapTeamMemberToHumanResources(source);

  assert.equal(technical.area, 'structures');
  assert.equal(technical.project, 'Sin proyecto inicial');
  assert.equal(technical.status, 'offline');
  assert.equal(technical.workload, 100);
  assert.equal(humanResources.area, 'Civil');
  assert.equal(humanResources.project, 'Ninguno');
  assert.equal(humanResources.status, 'standby');
  assert.equal(humanResources.availability, 0);
});
