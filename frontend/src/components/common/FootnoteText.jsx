import React from 'react';

/**
 * Nota informativa al pie de formularios modales (* Campos requeridos).
 *
 * @param {Object} props
 * @param {string} [props.text='Campos requeridos'] - Mensaje explicativo
 * @param {string} [props.symbol='*'] - Símbolo de advertencia o asterisco
 * @param {string} [props.className=''] - Clases adicionales de Tailwind
 */
export default function FootnoteText({
  text = 'Campos requeridos',
  symbol = '*',
  className = '',
}) {
  return (
    <p
      className={`text-[10px] text-slate-500 transition-colors duration-300 dark:text-slate-400 midnight:text-cyan-600 ${className}`}
    >
      <span className="font-semibold text-cyan-600 dark:text-cyan-400" aria-hidden="true">
        {symbol}
      </span>{' '}
      {text}
    </p>
  );
}
