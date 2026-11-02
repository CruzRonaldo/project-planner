import React, { forwardRef, useId } from 'react';
import { inputClass, labelClass } from '../../constants/themeClasses';

// Clases base para el modo estándar multitema (limpiando mt-2 para garantizar centrado vertical exacto)
const defaultBaseInputClass = inputClass.replace(/(^|\s)mt-2(\s|$)/g, ' ').trim();

// Clases base fijas para vistas de autenticación (diseño de consola oscura no reactivo a temas globales)
const authBaseInputClass =
  'w-full rounded-xl border border-slate-800 bg-[#080E1C] px-3.5 py-3 text-sm text-slate-200 placeholder-slate-600 outline-none transition-colors focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400';

const authLabelClass = 'block mb-1.5 text-xs font-medium text-slate-300';

const renderIcon = (iconItem) => {
  if (!iconItem) return null;
  if (React.isValidElement(iconItem)) {
    return iconItem;
  }
  const IconComponent = iconItem;
  return <IconComponent size={16} />;
};

/**
 * Componente unificado de campo de texto / entrada (Input).
 * Integra etiqueta superior, soporte para variante de autenticación fija ('auth')
 * o variante estándar multitema ('default': Claro, Oscuro y Midnight),
 * icono izquierdo, contenido derecho (botones/acciones) y mensaje de error accesible (role="alert").
 *
 * @param {Object} props
 * @param {string} [props.label] - Etiqueta descriptiva superior
 * @param {string} [props.error] - Mensaje de error para validación
 * @param {string} [props.helperText] - Texto sutil de ayuda o instrucción debajo del campo
 * @param {React.ComponentType|React.ReactNode} [props.icon] - Icono vectorial Lucide opcional al inicio del campo
 * @param {React.ReactNode} [props.rightContent] - Elemento o botones de acción a la derecha
 * @param {'default'|'auth'} [props.variant='default'] - Variante estética ('auth' para aislamiento estricto de temas)
 * @param {string} [props.className] - Clases adicionales de Tailwind para el <input>
 * @param {string} [props.containerClassName] - Clases adicionales para el contenedor exterior
 * @param {boolean} [props.disabled=false] - Deshabilita el campo
 * @param {boolean} [props.required=false] - Indica obligatoriedad y añade asterisco rojo al label
 * @param {string} [props.id] - Identificador único opcional (se autogenera si se omite)
 * @param {React.Ref} [props.inputRef] - Ref directo al input HTML
 */
const Input = forwardRef(function Input(
  {
    label,
    error,
    helperText,
    icon,
    rightContent,
    variant = 'default',
    id: customId,
    className = '',
    containerClassName = '',
    disabled = false,
    required = false,
    inputRef,
    ...props
  },
  forwardedRef
) {
  const generatedId = useId();
  const inputId = customId || (label ? `input-${generatedId}` : undefined);
  const activeRef = inputRef || forwardedRef;

  const isAuth = variant === 'auth';

  const errorBorder = error
    ? isAuth
      ? 'border-red-500/80 focus:border-red-500 focus:ring-red-500'
      : 'border-red-500 focus:border-red-500 dark:border-red-500/60 dark:focus:border-red-400 midnight:border-red-500/60 midnight:focus:border-red-400'
    : '';

  const paddingLeft = icon && !className.includes('pl-') ? 'pl-10' : '';
  const paddingRight = rightContent && !className.includes('pr-') ? 'pr-10' : '';

  const baseInputClass = isAuth ? authBaseInputClass : defaultBaseInputClass;
  const currentLabelClass = isAuth ? authLabelClass : `block mb-1.5 ${labelClass}`;

  return (
    <div className={`w-full ${containerClassName}`}>
      {label && (
        <label htmlFor={inputId} className={currentLabelClass}>
          {label}
          {required && (
            <span className={`ml-1 ${isAuth ? 'text-red-400' : 'text-red-500 dark:text-red-400'}`}>
              *
            </span>
          )}
        </label>
      )}

      <div className="relative flex items-center">
        {icon && (
          <div
            className={`pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 z-10 ${
              isAuth
                ? 'text-slate-500'
                : 'text-slate-400 dark:text-slate-500 midnight:text-cyan-700'
            }`}
          >
            {renderIcon(icon)}
          </div>
        )}

        <input
          ref={activeRef}
          id={inputId}
          disabled={disabled}
          required={required}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${inputId}-error` : undefined}
          className={`${baseInputClass} ${errorBorder} ${paddingLeft} ${paddingRight} ${
            disabled ? (isAuth ? 'opacity-50 cursor-not-allowed' : 'opacity-60 cursor-not-allowed') : ''
          } ${className}`}
          {...props}
        />

        {rightContent && (
          <div className="absolute inset-y-0 right-2 flex items-center z-10">
            {rightContent}
          </div>
        )}
      </div>

      {error ? (
        <p
          id={`${inputId}-error`}
          role="alert"
          className={`mt-1 text-[11px] font-medium ${
            isAuth
              ? 'text-red-400'
              : 'text-red-600 dark:text-red-400 midnight:text-red-300'
          }`}
        >
          {error}
        </p>
      ) : helperText ? (
        <p
          className={`mt-1 text-[11px] ${
            isAuth
              ? 'text-slate-400'
              : 'text-slate-500 dark:text-slate-400 midnight:text-cyan-600'
          }`}
        >
          {helperText}
        </p>
      ) : null}
    </div>
  );
});

export default Input;
