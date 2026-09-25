// Semillas de datos simulados (Mocks) para pruebas locales de Equipo Técnico
export {
  technicalAreas,
  technicalStatuses,
  reassignmentReasons,
  technicalSortOptions,
  technicalProjects,
} from '../constants/technicalTeam.js';

export {
  getMemberFullName,
  summarizeTechnicalTeam,
  filterTechnicalTeam,
  sortTechnicalTeam,
  buildTechnicalTeamCsv,
  addTechnicalMember,
  reassignTechnicalMember,
} from '../utils/technicalTeam.js';

import { technicalProjects } from '../constants/technicalTeam.js';

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

export function createTechnicalTeamData() {
  return {
    members: initialMembers.map(cloneMember),
    assignments: initialAssignments.map((assignment) => ({ ...assignment })),
  };
}
