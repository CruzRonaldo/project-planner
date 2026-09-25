// Constantes y opciones operativas para Gestión Operativa
export const operationalProjects = [
  'Torre Reforma (PRJ-2026-001)',
  'Puente Industrial (PRJ-2026-002)',
  'Centro Comercial Norte (PRJ-2026-003)',
  'Hospital Regional (PRJ-2026-004)',
];

export const operationTypes = [
  'Inspección técnica',
  'Mantenimiento',
  'Corrección',
  'Control de calidad',
  'Instalación',
  'Supervisión de seguridad',
];

export const operationalAreas = [
  'Arquitectura',
  'Estructuras',
  'Sistemas',
  'Instalaciones',
  'Seguridad y Calidad',
];

export const workOrderPriorities = [
  { id: 'high', label: 'Alta prioridad', className: 'border-red-200 bg-red-50 text-red-700 dark:border-red-500/25 dark:bg-red-500/10 dark:text-red-400 midnight:border-red-500/30 midnight:bg-red-500/10 midnight:text-red-300' },
  { id: 'medium', label: 'Media', className: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/25 dark:bg-amber-500/10 dark:text-amber-400 midnight:border-amber-500/30 midnight:bg-amber-500/10 midnight:text-amber-300' },
  { id: 'low', label: 'Baja', className: 'border-slate-200 bg-slate-100 text-slate-600 dark:border-slate-500/25 dark:bg-slate-500/10 dark:text-slate-400 midnight:border-cyan-800/40 midnight:bg-cyan-900/30 midnight:text-cyan-500/70' },
];

export const workOrderStatuses = [
  { id: 'in-progress', label: 'En progreso', className: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/25 dark:bg-amber-500/10 dark:text-amber-400 midnight:border-amber-500/30 midnight:bg-amber-500/10 midnight:text-amber-300' },
  { id: 'completed', label: 'Completada', className: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-400 midnight:border-emerald-500/30 midnight:bg-emerald-500/10 midnight:text-emerald-300' },
  { id: 'planned', label: 'Planificada', className: 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-500/25 dark:bg-blue-500/10 dark:text-blue-400 midnight:border-cyan-500/30 midnight:bg-cyan-500/10 midnight:text-cyan-300' },
];
