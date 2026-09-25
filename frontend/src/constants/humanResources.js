// Constantes visuales y opciones operativas para Recursos Humanos
export const personnelStatuses = [
  {
    id: 'active',
    label: 'Activo',
    summaryLabel: 'Activos',
    className: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-400 midnight:border-emerald-500/30 midnight:bg-emerald-500/10 midnight:text-emerald-300',
    dotClass: 'bg-emerald-400',
  },
  {
    id: 'standby',
    label: 'Stand-by',
    summaryLabel: 'Stand-by',
    className: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/25 dark:bg-amber-500/10 dark:text-amber-400 midnight:border-amber-500/30 midnight:bg-amber-500/10 midnight:text-amber-300',
    dotClass: 'bg-amber-400',
  },
  {
    id: 'support',
    label: 'Apoyo',
    summaryLabel: 'En apoyo',
    className: 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-500/25 dark:bg-blue-500/10 dark:text-blue-400 midnight:border-cyan-500/30 midnight:bg-cyan-500/10 midnight:text-cyan-300',
    dotClass: 'bg-blue-400 midnight:bg-cyan-400',
  },
];

export const personnelIncidentTypes = [
  { id: 'vacation', label: 'Vacaciones programadas' },
  { id: 'medical-leave', label: 'Descanso médico' },
  { id: 'paid-leave', label: 'Licencia con goce' },
  { id: 'unpaid-leave', label: 'Licencia sin goce' },
  { id: 'personal-permission', label: 'Permiso personal' },
  { id: 'training', label: 'Capacitación externa' },
];
