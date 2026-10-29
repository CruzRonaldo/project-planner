import React, { useId } from 'react';
import { inputClass, labelClass } from '../../constants/themeClasses';

/**
 * Componente unificado de campo de texto / entrada (Input).
 * Integra etiqueta superior, soporte nativo multitema (Claro, Oscuro y Midnight),
 * icono opcional y mensaje de error accesible (role="alert").
 *
 * @param {Object} props
 * @param {string} [props.label] - Etiqueta descriptiva superior
 * @param {string} [props.error] - Mensaje de error para validación
 * @param {string} [props.helperText] - Texto sutil de ayuda o instrucción debajo del campo
 * @param {React.ComponentType} [props.icon] - Icono vectorial Lucide opcional al inicio del campo
 * @param {string} [props.className] - Clases adicionales de Tailwind para el <input>
 * @param {string} [props.containerClassName] - Clases adicionales para el contenedor exterior
 * @param {boolean} [props.disabled=false] - Deshabilita el campo
 * @param {boolean} [props.required=false] - Indica obligatoriedad y añade asterisco rojo al label
 * @param {string} [props.id] - Identificador único opcional (se autogenera si se omite)
 */
export default function Input({
  label,
  error,
  helperText,
  icon: Icon,
  id: customId,
  className = '',
  containerClassName = '',
  disabled = false,
  required = false,
  ...props
}) {
  const generatedId = useId();
  const inputId = customId || (label ? `input-${generatedId}` : undefined);

  const errorBorder = error
    ? 'border-red-500 focus:border-red-500 dark:border-red-500/60 dark:focus:border-red-400 midnight:border-red-500/60 midnight:focus:border-red-400'
    : '';

  const paddingLeft = Icon ? 'pl-9' : '';

  return (
    <div className={`w-full ${containerClassName}`}>
      {label && (
        <label htmlFor={inputId} className={`block ${labelClass}`}>
          {label}
          {required && <span className="ml-1 text-red-500 dark:text-red-400">*</span>}
        </label>
      )}

      <div className="relative">
        {Icon && (
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 dark:text-slate-500 midnight:text-cyan-700">
            <Icon size={16} />
          </div>
        )}

        <input
          id={inputId}
          disabled={disabled}
          required={required}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${inputId}-error` : undefined}
          className={`${inputClass} ${errorBorder} ${paddingLeft} ${
            disabled ? 'opacity-60 cursor-not-allowed' : ''
          } ${className}`}
          {...props}
        />
      </div>

      {error ? (
        <p
          id={`${inputId}-error`}
          role="alert"
          className="mt-1 text-[11px] font-medium text-red-600 dark:text-red-400 midnight:text-red-300"
        >
          {error}
        </p>
      ) : helperText ? (
        <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400 midnight:text-cyan-600">
          {helperText}
        </p>
      ) : null}
    </div>
  );
}
