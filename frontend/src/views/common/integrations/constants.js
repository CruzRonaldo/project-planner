import { Box, Cloud, Workflow, Zap } from 'lucide-react';

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

export const inputClass =
  'mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition-colors duration-300 focus:border-cyan-500 dark:border-[#30363d] dark:bg-[#0d1117] dark:text-white dark:focus:border-cyan-400 midnight:border-cyan-800/40 midnight:bg-[#050B14] midnight:text-cyan-50 midnight:focus:border-cyan-500';

export const cardClass =
  'rounded-xl border border-slate-200 bg-white shadow-sm transition-colors duration-300 dark:border-[#30363d] dark:bg-[#161b22] dark:shadow-[0_14px_32px_rgba(0,0,0,0.12)] midnight:border-cyan-900/30 midnight:bg-[#0a1120] midnight:shadow-none';

export const nestedClass =
  'rounded-lg border border-slate-200 bg-slate-50 transition-colors duration-300 dark:border-blue-400/25 dark:bg-[#0d1117] midnight:border-cyan-800/40 midnight:bg-[#050B14]';
