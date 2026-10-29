import React from 'react';
import { Loader2 } from 'lucide-react';
import {
  primaryBtnClass,
  secondaryButtonClass,
  closeBtnClass,
} from '../../constants/themeClasses';

/**
 * Variantes visuales para botones en toda la plataforma.
 * Compatibles de forma nativa con los temas Claro, Oscuro y Midnight.
 */
const variants = {
  primary: primaryBtnClass,
  secondary: secondaryButtonClass,
  danger:
    'inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-xs font-semibold text-white transition-colors duration-300 hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed',
  ghost:
    'inline-flex items-center justify-center gap-1.5 rounded-lg p-2 text-xs font-medium text-slate-500 transition-colors duration-300 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-white midnight:text-cyan-500/70 midnight:hover:bg-cyan-900/20 midnight:hover:text-cyan-50 disabled:opacity-50 disabled:cursor-not-allowed',
  close: closeBtnClass,
};

const sizes = {
  sm: 'px-2.5 py-1.5 text-[11px]',
  md: 'px-4 py-2.5 text-xs',
  lg: 'px-5 py-3 text-sm font-semibold',
};

/**
 * Componente unificado de botón de acción.
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - Texto o contenido del botón
 * @param {'primary'|'secondary'|'danger'|'ghost'|'close'} [props.variant='primary'] - Estilo visual
 * @param {'sm'|'md'|'lg'} [props.size] - Modificador de tamaño opcional
 * @param {React.ComponentType} [props.icon] - Icono vectorial Lucide opcional
 * @param {boolean} [props.isLoading=false] - Muestra spinner y desactiva el botón automáticamente
 * @param {boolean} [props.disabled=false] - Desactiva el botón
 * @param {'button'|'submit'|'reset'} [props.type='button'] - Tipo de botón HTML (seguro por defecto)
 * @param {Function} [props.onClick] - Manejador de clic
 * @param {string} [props.className] - Clases de Tailwind adicionales
 */
export default function Button({
  children,
  variant = 'primary',
  size,
  icon: Icon,
  isLoading = false,
  disabled = false,
  type = 'button',
  onClick,
  className = '',
  ...rest
}) {
  const baseClasses = variants[variant] || variants.primary;
  const sizeClasses = size ? sizes[size] : '';

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || isLoading}
      className={`${baseClasses} ${sizeClasses} ${className}`}
      {...rest}
    >
      {isLoading ? (
        <Loader2 size={16} className="animate-spin shrink-0" />
      ) : Icon ? (
        <Icon size={16} className="shrink-0" />
      ) : null}
      {children}
    </button>
  );
}
