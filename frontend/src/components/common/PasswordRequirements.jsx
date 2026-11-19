import React from 'react';
import { evaluatePassword } from '../../utils/passwordValidation';

export function PasswordRequirements({
  password = '',
  confirmPassword = '',
  currentPassword = '',
}) {
  const { rules } = evaluatePassword(password, confirmPassword, {
    currentPassword,
  });

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3 text-xs transition-colors duration-300 dark:border-slate-700 dark:bg-slate-800/60 midnight:border-cyan-800/40 midnight:bg-[#0a1120]">
      <p className="mb-2 font-semibold text-slate-700 dark:text-slate-200 midnight:text-cyan-100">
        Requisitos de la contraseña:
      </p>
      <ul className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
        {rules.map((rule) => (
          <li
            key={rule.id}
            className={`flex items-center gap-1.5 transition-colors duration-150 ${
              rule.valid
                ? 'font-medium text-emerald-600 dark:text-emerald-400 midnight:text-emerald-400'
                : 'text-slate-500 dark:text-slate-400 midnight:text-cyan-500/70'
            }`}
          >
            <span className="inline-flex h-4 w-4 shrink-0 items-center justify-center font-bold">
              {rule.valid ? '✓' : '•'}
            </span>
            <span>{rule.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}