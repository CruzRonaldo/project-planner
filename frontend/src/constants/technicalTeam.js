// Constantes y opciones operativas para Equipo Técnico
export const technicalAreas = [
  { id: 'architecture', label: 'Arquitectura' },
  { id: 'structures', label: 'Estructuras' },
  { id: 'systems', label: 'Sistemas' },
];

export const technicalStatuses = [
  { id: 'active', label: 'Activo en obra', shortLabel: 'Activo', className: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-400 midnight:border-emerald-500/30 midnight:bg-emerald-500/10 midnight:text-emerald-300' },
  { id: 'standby', label: 'En espera', shortLabel: 'Stand-by', className: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/25 dark:bg-amber-500/10 dark:text-amber-400 midnight:border-amber-500/30 midnight:bg-amber-500/10 midnight:text-amber-300' },
  { id: 'support', label: 'En apoyo', shortLabel: 'En Apoyo', className: 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-500/25 dark:bg-blue-500/10 dark:text-blue-400 midnight:border-cyan-500/30 midnight:bg-cyan-500/10 midnight:text-cyan-300' },
  { id: 'offline', label: 'No disponible', shortLabel: 'No disponible', className: 'border-slate-200 bg-slate-100 text-slate-600 dark:border-slate-500/25 dark:bg-slate-500/10 dark:text-slate-400 midnight:border-cyan-800/40 midnight:bg-cyan-900/30 midnight:text-cyan-500/70' },
];

export const reassignmentReasons = [
  'Transferencia por inicio de fase de acabados e interiores',
  'Rebalanceo de carga operativa',
  'Cobertura temporal por ausencia',
  'Especialidad requerida en nuevo proyecto',
  'Cierre de actividades en proyecto anterior',
];

export const technicalSortOptions = [
  { id: 'availability-desc', label: 'Mayor disponibilidad' },
  { id: 'availability-asc', label: 'Menor disponibilidad' },
  { id: 'name', label: 'Nombre A–Z' },
  { id: 'recent', label: 'Incorporación reciente' },
];

export const technicalProjects = [
  'Sin proyecto inicial',
  'Edificio Terminal B (PRJ-2026-004)',
  'Viaducto Elevado (PRJ-2026-008)',
  'Planta Tratamiento II (PRJ-2026-011)',
  'Hospital Regional (PRJ-2026-014)',
  'Project Planner (PRJ-2026-018)',
];
