import { Box, Cloud, Workflow, Zap } from 'lucide-react';
export {
  inputClass,
  cardClass,
  nestedClass,
} from '../../../constants/themeClasses';

export const iconMap = {
  cloud: Cloud,
  model: Box,
  workflow: Workflow,
  automation: Zap,
};

export const activityStyles = {
  success: {
    label: 'Éxito',
    className:
      'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 midnight:bg-emerald-500/10 midnight:text-emerald-300',
  },
  error: {
    label: 'Error',
    className:
      'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400 midnight:bg-red-500/10 midnight:text-red-300',
  },
  processing: {
    label: 'En proceso',
    className:
      'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 midnight:bg-cyan-500/10 midnight:text-cyan-300',
  },
};

export const resolveLastActivity = (act, t) => {
  if (!act || act === 'Sin actividad') return t('integrations.noActivity', 'Sin actividad');
  if (act === 'Sin conexión') return t('integrations.noConnection', 'Sin conexión');
  if (act === 'Verificado ahora') return t('integrations.verifiedNow', 'Verificado ahora');
  if (typeof act === 'string' && (act === 'Nunca' || act.toLowerCase() === 'nunca' || act.toLowerCase() === 'never')) {
    return t('integrations.never', 'Nunca');
  }
  if (typeof act === 'string' && (act.toLowerCase() === 'hace un momento' || act.toLowerCase() === 'just now')) {
    return t('integrations.justNow', 'Hace un momento');
  }
  if (typeof act === 'string' && (act.toLowerCase() === 'reciente' || act.toLowerCase() === 'recent')) {
    return t('integrations.recent', 'Reciente');
  }
  if (act === 'Hace 10 minutos') return t('integrations.tenMinutesAgo', 'Hace 10 minutos');
  if (act === 'Hace 1 hora') return t('integrations.oneHourAgo', 'Hace 1 hora');
  if (act === 'Hace 2 horas') return t('integrations.twoHoursAgo', 'Hace 2 horas');
  if (act === 'Ahora') return t('integrations.now', 'Ahora');
  return act;
};

