// Constantes y opciones operativas para Portafolio de Proyectos
export const projectAreas = [
  'Edificaciones Comerciales',
  'Infraestructura Vial',
  'Retail & Ocio',
  'Equipamiento Social',
  'Vivienda Multifamiliar',
  'Logística & Producción',
];

export const projectStatuses = [
  { id: 'planning', label: 'En Planificación', className: 'bg-cyan-50 text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-400 midnight:bg-cyan-500/10 midnight:text-cyan-300', barClass: 'bg-cyan-500' },
  { id: 'active', label: 'Activo', className: 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 midnight:bg-cyan-500/10 midnight:text-cyan-300', barClass: 'bg-blue-500 midnight:bg-cyan-400' },
  { id: 'paused', label: 'En Pausa', className: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 midnight:bg-amber-500/10 midnight:text-amber-300', barClass: 'bg-amber-500' },
  { id: 'completed', label: 'Completado', className: 'bg-slate-100 text-slate-600 dark:bg-slate-500/15 dark:text-slate-300 midnight:bg-cyan-900/30 midnight:text-cyan-500/70', barClass: 'bg-slate-400 dark:bg-slate-300 midnight:bg-cyan-700' },
  { id: 'risk', label: 'En Riesgo', className: 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400 midnight:bg-red-500/10 midnight:text-red-300', barClass: 'bg-red-500' },
];

export const projectLeaders = [
  { id: 'carlos', name: 'Carlos M.', role: 'Project Manager' },
  { id: 'ana', name: 'Ana Rojas', role: 'Ingeniera Civil' },
  { id: 'lucia', name: 'Lucía Gómez', role: 'Arquitecta BIM' },
  { id: 'javier', name: 'Javier Vega', role: 'Ingeniero Estructural' },
  { id: 1, name: 'Carlos Mendoza', role: 'Modelador BIM / Revit' },
  { id: 2, name: 'Andrea Rojas', role: 'Calculista Estructural' },
  { id: 3, name: 'Luis Gonzales', role: 'Desarrollador Full Stack' },
];
