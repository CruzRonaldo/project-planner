// Constantes y opciones operativas para Integraciones
export const integrationStatuses = [
  { id: 'connected', label: 'Conectado', className: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-400 midnight:border-emerald-500/30 midnight:bg-emerald-500/10 midnight:text-emerald-300' },
  { id: 'partial', label: 'Parcial', className: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/25 dark:bg-amber-500/10 dark:text-amber-400 midnight:border-amber-500/30 midnight:bg-amber-500/10 midnight:text-amber-300' },
  { id: 'offline', label: 'Desconectado', className: 'border-red-200 bg-red-50 text-red-700 dark:border-red-500/25 dark:bg-red-500/10 dark:text-red-400 midnight:border-red-500/30 midnight:bg-red-500/10 midnight:text-red-300' },
];

export const syncFrequencies = ['Cada 5 min', 'Cada 10 min', 'Cada 30 min', 'Cada hora'];
