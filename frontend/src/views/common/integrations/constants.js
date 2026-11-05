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
