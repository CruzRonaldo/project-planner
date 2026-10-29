import React, { forwardRef } from 'react';

/**
 * Estilos base multitema para el elemento <select> nativo (Claro, Oscuro y Midnight).
 */
export const defaultSelectClass =
  'cursor-pointer rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-700 outline-none transition-colors duration-300 dark:border-[#30363d] dark:bg-[#161b22] dark:text-slate-200 midnight:border-cyan-800/40 midnight:bg-[#0a1120] midnight:text-cyan-100';

export const defaultOptionClass =
  'bg-white text-slate-900 dark:bg-[#161b22] dark:text-white midnight:bg-[#0a1120] midnight:text-cyan-50';

/**
 * Componente Select nativo unificado con soporte multitema.
 * Permite pasar un arreglo `options` ([{ value, label, disabled }]) o elementos `children` directos.
 *
 * @param {Object} props
 * @param {Array<{value: string|number, label: string, disabled?: boolean, className?: string}>} [props.options]
 * @param {React.ReactNode} [props.children]
 * @param {string} [props.className]
 * @param {React.Ref} [props.selectRef]
 */
const Select = forwardRef(function Select(
  { options, children, className = '', selectRef, ...props },
  ref
) {
  const activeRef = selectRef || ref;

  return (
    <select
      ref={activeRef}
      className={`${defaultSelectClass} ${className}`.trim()}
      {...props}
    >
      {options
        ? options.map((option) => (
            <option
              key={option.value}
              value={option.value}
              disabled={option.disabled}
              className={option.className || defaultOptionClass}
            >
              {option.label}
            </option>
          ))
        : children}
    </select>
  );
});

export default Select;
