// Semillas de datos simulados (Mocks) para pruebas locales de Portafolio
export { projectAreas, projectLeaders, projectStatuses } from '../constants/portfolio.js';
export {
  createProjectCode,
  getProjectDuration,
  addPortfolioProject,
  filterPortfolio,
  formatMoney,
  formatProjectTerm,
} from '../utils/portfolio.js';

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

function cloneProject(project) {
  return { ...project, members: [...project.members] };
}

export function createPortfolioData() {
  return {
    projects: initialProjects.map(cloneProject),
    changes: initialChanges.map((change) => ({ ...change })),
  };
}
