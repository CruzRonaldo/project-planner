// Semillas de datos simulados (Mocks) para pruebas locales de Recursos Humanos
export { personnelStatuses, personnelIncidentTypes } from '../constants/humanResources.js';
export {
  summarizePersonnel,
  filterPersonnel,
  buildPersonnelCsv,
  updatePersonnel,
  getIncidentDuration,
  registerPersonnelIncident,
} from '../utils/humanResources.js';

const initialPersonnel = [
  { id: 'hr-sofia', name: 'Sofía Torres', area: 'Arquitectura', project: 'Edificio Terminal B', status: 'active', availability: 100 },
  { id: 'hr-alejandro', name: 'Alejandro Ruiz', area: 'Estructuras', project: 'Viaducto Elevado', status: 'active', availability: 80 },
  { id: 'hr-mateo', name: 'Mateo Fernández', area: 'Arquitectura', project: 'En espera', status: 'standby', availability: 20 },
  { id: 'hr-elena', name: 'Elena Gómez', area: 'Arquitectura', project: 'Edificio Terminal B', status: 'support', availability: 50 },
  { id: 'hr-carlos', name: 'Carlos Mendoza', area: 'Sistemas', project: 'Planta Tratamiento II', status: 'active', availability: 100 },
  { id: 'hr-laura', name: 'Laura Castro', area: 'Sistemas', project: 'Ninguno', status: 'standby', availability: 10 },
  { id: 'hr-andres', name: 'Andrés Silva', area: 'Estructuras', project: 'Viaducto Elevado', status: 'support', availability: 40 },
  { id: 'hr-patricia', name: 'Patricia Luna', area: 'Sistemas', project: 'Integración Make Backend', status: 'active', availability: 90 },
  { id: 'hr-valeria', name: 'Valeria López', area: 'Arquitectura', project: 'Torre Reforma', status: 'active', availability: 85 },
  { id: 'hr-daniel', name: 'Daniel Vargas', area: 'Estructuras', project: 'Puente Industrial', status: 'active', availability: 100 },
  { id: 'hr-camila', name: 'Camila Ríos', area: 'Sistemas', project: 'Project Planner', status: 'active', availability: 75 },
  { id: 'hr-jorge', name: 'Jorge Salas', area: 'Instalaciones', project: 'Hospital Regional', status: 'active', availability: 80 },
  { id: 'hr-adriana', name: 'Adriana Vega', area: 'Arquitectura', project: 'Residencial Las Palmas', status: 'active', availability: 100 },
  { id: 'hr-miguel', name: 'Miguel Paredes', area: 'Estructuras', project: 'Nave Industrial', status: 'active', availability: 90 },
  { id: 'hr-lucia', name: 'Lucía Navarro', area: 'Instalaciones', project: 'Subestación Eléctrica', status: 'active', availability: 85 },
  { id: 'hr-ricardo', name: 'Ricardo Peña', area: 'Sistemas', project: 'Project Planner', status: 'active', availability: 95 },
  { id: 'hr-fernanda', name: 'Fernanda Ortiz', area: 'Arquitectura', project: 'En espera', status: 'standby', availability: 30 },
  { id: 'hr-oscar', name: 'Óscar Molina', area: 'Estructuras', project: 'Ninguno', status: 'standby', availability: 25 },
];

const initialHistory = [
  { id: 'history-1', date: '2026-01-16', name: 'Mateo Fernández', previousStatus: 'active', nextStatus: 'standby', comment: 'Fase de diseño completada.' },
  { id: 'history-2', date: '2026-01-15', name: 'Elena Gómez', previousStatus: 'standby', nextStatus: 'support', comment: 'Refuerzo en modelado arquitectónico.' },
  { id: 'history-3', date: '2026-01-14', name: 'Andrés Silva', previousStatus: 'active', nextStatus: 'support', comment: 'Asignación temporal al Viaducto Elevado.' },
  { id: 'history-4', date: '2026-01-11', name: 'Patricia Luna', previousStatus: 'standby', nextStatus: 'active', comment: 'Inicio de sprint de integración.' },
  { id: 'history-5', date: '2026-01-09', name: 'Laura Castro', previousStatus: 'active', nextStatus: 'standby', comment: 'A la espera de aprobación del proyecto.' },
];

export function createHumanResourcesData() {
  return {
    members: initialPersonnel.map((member) => ({ ...member })),
    history: initialHistory.map((change) => ({ ...change })),
    incidents: [],
  };
}
