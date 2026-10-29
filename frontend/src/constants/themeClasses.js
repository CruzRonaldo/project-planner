/**
 * Tokens y clases de utilidad de diseño centralizadas para el Frontend.
 * Garantiza consistencia visual multitema (Claro, Oscuro y Midnight)
 * en modales, formularios, tarjetas y botones de toda la aplicación.
 */

export const inputClass =
  'mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition-colors duration-300 placeholder:text-slate-400 focus:border-cyan-500 dark:border-[#30363d] dark:bg-[#0d1117] dark:text-white dark:placeholder:text-slate-600 dark:focus:border-cyan-400 midnight:border-cyan-800/40 midnight:bg-[#050B14] midnight:text-cyan-50 midnight:placeholder:text-cyan-800 midnight:focus:border-cyan-500';

export const labelClass =
  'text-xs text-slate-500 transition-colors duration-300 dark:text-slate-300 midnight:text-cyan-500/70';

export const cardClass =
  'rounded-xl border border-slate-200 bg-white shadow-sm transition-colors duration-300 dark:border-[#30363d] dark:bg-[#161b22] midnight:border-cyan-900/30 midnight:bg-[#0a1120]';

export const nestedClass =
  'rounded-lg border border-slate-200 bg-slate-50 transition-colors duration-300 dark:border-[#30363d] dark:bg-[#0d1117] midnight:border-cyan-800/40 midnight:bg-[#050B14]';

export const primaryButtonClass =
  'inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white transition-colors duration-300 hover:bg-blue-500 midnight:bg-cyan-600 midnight:hover:bg-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed';

export const primaryBtnClass = primaryButtonClass;

export const secondaryButtonClass =
  'inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-xs font-medium text-slate-600 transition-colors duration-300 hover:bg-slate-50 hover:text-slate-900 dark:border-[#30363d] dark:bg-[#161b22] dark:text-slate-300 dark:hover:bg-white/5 dark:hover:text-white midnight:border-cyan-800/40 midnight:bg-[#0a1120] midnight:text-cyan-200 midnight:hover:border-cyan-700/50 midnight:hover:bg-cyan-900/30 midnight:hover:text-cyan-50 disabled:opacity-50';

export const errorClass =
  'mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 transition-colors duration-300 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400 midnight:border-red-500/20 midnight:bg-red-500/10 midnight:text-red-300';

export const iconBoxClass =
  'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-cyan-200 bg-cyan-50 text-cyan-700 transition-colors duration-300 dark:border-cyan-400/25 dark:bg-cyan-500/15 dark:text-cyan-400 midnight:border-cyan-800/40 midnight:bg-cyan-500/15 midnight:text-cyan-300';

export const closeBtnClass =
  'rounded-lg p-2 text-slate-500 transition-colors duration-300 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-white midnight:text-cyan-500/70 midnight:hover:bg-cyan-900/20 midnight:hover:text-cyan-50';
