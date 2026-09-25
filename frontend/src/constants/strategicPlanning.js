// Constantes y opciones operativas para Planificación Estratégica
export const planningMonths = [
  { number: 1, short: 'Ene', label: 'Enero' },
  { number: 2, short: 'Feb', label: 'Febrero' },
  { number: 3, short: 'Mar', label: 'Marzo' },
  { number: 4, short: 'Abr', label: 'Abril' },
  { number: 5, short: 'May', label: 'Mayo' },
  { number: 6, short: 'Jun', label: 'Junio' },
  { number: 7, short: 'Jul', label: 'Julio' },
  { number: 8, short: 'Ago', label: 'Agosto' },
  { number: 9, short: 'Sep', label: 'Septiembre' },
  { number: 10, short: 'Oct', label: 'Octubre' },
  { number: 11, short: 'Nov', label: 'Noviembre' },
  { number: 12, short: 'Dic', label: 'Diciembre' },
];

export const scheduleAdjustmentReasons = [
  'Retraso por entrega de insumos estructurales',
  'Adelanto por optimización del cronograma',
  'Cambio de alcance solicitado por el cliente',
  'Reprogramación por disponibilidad del equipo',
  'Contingencia climática o normativa',
];

export const milestoneStatuses = [
  { id: 'pending', label: 'Pendiente', badge: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 midnight:bg-amber-500/10 midnight:text-amber-300' },
  { id: 'upcoming', label: 'Próximo', badge: 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 midnight:bg-cyan-500/10 midnight:text-cyan-300' },
  { id: 'completed', label: 'Completado', badge: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 midnight:bg-emerald-500/10 midnight:text-emerald-300' },
];

export const milestoneValidators = [
  'Carlos M. (Project Manager)',
  'Ana Rojas (Ingeniera Civil)',
  'Lucía Gómez (Arquitecta BIM)',
  'Javier Vega (Ingeniero Estructural)',
];
