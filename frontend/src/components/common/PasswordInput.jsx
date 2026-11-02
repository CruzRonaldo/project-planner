import React, { useRef, useState } from 'react';
import { Eye, EyeOff, X } from 'lucide-react';
import Input from './Input';

/**
 * Campo de contraseña reutilizable para todo el proyecto.
 * Construido directamente sobre el componente unificado <Input />, añade:
 * - Botón de alternancia de visibilidad (Ojo / Eye / EyeOff).
 * - Botón de limpieza rápida (X) activado dinámicamente al escribir.
 * - Soporte para icono lateral izquierdo (ej. Lock).
 * - Soporte para variante 'auth' con aislamiento total frente a temas globales.
 * - Dimensiones y centrado simétrico y parejo de iconos y botones de acción.
 *
 * @param {Object} props
 * @param {string} [props.value=''] - Valor actual del campo
 * @param {Function} [props.onChange] - Manejador de cambio
 * @param {Function} [props.onClear] - Manejador opcional para limpiar el campo
 * @param {string} [props.placeholder='••••••••'] - Placeholder
 * @param {string} [props.className=''] - Clases Tailwind adicionales para el <input>
 * @param {string} [props.containerClassName=''] - Clases para el contenedor externo
 * @param {boolean} [props.disabled=false] - Deshabilita el campo
 * @param {boolean} [props.showClear=true] - Habilita el botón de limpieza X
 * @param {string} [props.autoComplete='current-password'] - Atributo autocomplete
 * @param {React.ReactNode|React.ComponentType} [props.leftIcon=null] - Icono izquierdo (alias de icon)
 * @param {React.ReactNode|React.ComponentType} [props.icon=null] - Icono izquierdo
 * @param {string} [props.showPasswordLabel='Ver contraseña'] - Texto accesible para mostrar clave
 * @param {string} [props.hidePasswordLabel='Ocultar contraseña'] - Texto accesible para ocultar clave
 * @param {'default'|'auth'} [props.variant='default'] - Variante estética ('auth' para Login/Auth sin respuesta a temas)
 */
export default function PasswordInput({
  value = '',
  onChange,
  onClear,
  placeholder = '••••••••',
  className = '',
  containerClassName = '',
  disabled = false,
  showClear = true,
  autoComplete = 'current-password',
  leftIcon = null,
  icon = null,
  showPasswordLabel = 'Ver contraseña',
  hidePasswordLabel = 'Ocultar contraseña',
  label,
  error,
  helperText,
  variant = 'default',
  id,
  required = false,
  ...rest
}) {
  const [visible, setVisible] = useState(false);
  const inputRef = useRef(null);

  const handleClear = (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (onClear) {
      onClear();
    } else if (onChange) {
      onChange({ target: { value: '' } });
    }
    inputRef.current?.focus();
  };

  const hasContent = Boolean(value && String(value).length > 0);
  const canClear = showClear && hasContent && !disabled;
  const isAuth = variant === 'auth';

  const actionBtnBase =
    'h-7 w-7 flex items-center justify-center rounded-md transition-colors cursor-pointer select-none focus:outline-none focus-visible:ring-1 focus-visible:ring-cyan-500';

  const actionBtnTheme = isAuth
    ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 active:bg-slate-800'
    : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800/60 midnight:text-cyan-500/80 midnight:hover:text-cyan-200 midnight:hover:bg-cyan-900/30 active:opacity-75';

  const actionBtnClass = `${actionBtnBase} ${actionBtnTheme}`;

  const rightActions = (
    <div className="flex items-center gap-1">
      {canClear && (
        <button
          type="button"
          tabIndex={-1}
          onClick={handleClear}
          aria-label="Borrar contraseña"
          title="Borrar contraseña"
          className={actionBtnClass}
        >
          <X size={16} />
        </button>
      )}
      <button
        type="button"
        tabIndex={-1}
        onClick={() => setVisible((prev) => !prev)}
        aria-label={visible ? hidePasswordLabel : showPasswordLabel}
        title={visible ? hidePasswordLabel : showPasswordLabel}
        className={actionBtnClass}
      >
        {visible ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  );

  const resolvedIcon = icon || leftIcon;
  const paddingRightClass = className.includes('pr-')
    ? ''
    : canClear
    ? 'pr-20'
    : 'pr-11';

  return (
    <Input
      inputRef={inputRef}
      type={visible ? 'text' : 'password'}
      value={value}
      onChange={onChange}
      disabled={disabled}
      placeholder={placeholder}
      autoComplete={autoComplete}
      label={label}
      error={error}
      helperText={helperText}
      required={required}
      id={id}
      icon={resolvedIcon}
      variant={variant}
      containerClassName={containerClassName}
      rightContent={rightActions}
      className={`${paddingRightClass} ${className}`.trim()}
      {...rest}
    />
  );
}
