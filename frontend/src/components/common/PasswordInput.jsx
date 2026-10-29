import React, { useRef, useState } from 'react';
import { Eye, EyeOff, X } from 'lucide-react';
import Input from './Input';

/**
 * Campo de contraseña reutilizable para todo el proyecto.
 * Construido sobre el componente estándar <Input />, añade:
 * - Botón de alternancia de visibilidad (Ojo / Eye / EyeOff).
 * - Botón de limpieza rápida (X) que se activa dinámicamente al escribir.
 * - Soporte para icono lateral izquierdo (ej. Lock en LoginScreen).
 */
export default function PasswordInput({
  value = '',
  onChange,
  onClear,
  placeholder = '••••••••',
  className = '',
  disabled = false,
  showClear = true,
  autoComplete = 'current-password',
  leftIcon = null,
  showPasswordLabel = 'Ver contraseña',
  hidePasswordLabel = 'Ocultar contraseña',
  label,
  error,
  helperText,
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
  const paddingRightClass = showClear && hasContent ? 'pr-16' : 'pr-9';
  const paddingLeftClass = leftIcon ? 'pl-10' : '';

  const rightActions = (
    <div className="flex items-center gap-0.5 text-slate-400">
      {showClear && hasContent && !disabled && (
        <button
          type="button"
          tabIndex={-1}
          onClick={handleClear}
          aria-label="Borrar contraseña"
          title="Borrar contraseña"
          className="rounded p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
        >
          <X size={15} />
        </button>
      )}
      <button
        type="button"
        tabIndex={-1}
        onClick={() => setVisible((prev) => !prev)}
        aria-label={visible ? hidePasswordLabel : showPasswordLabel}
        title={visible ? hidePasswordLabel : showPasswordLabel}
        className="rounded p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
      >
        {visible ? <EyeOff size={15} /> : <Eye size={15} />}
      </button>
    </div>
  );

  return (
    <div className="relative w-full">
      {leftIcon && (
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500 z-10">
          {leftIcon}
        </div>
      )}
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
        rightContent={rightActions}
        className={`${paddingLeftClass} ${paddingRightClass} ${className}`}
        {...rest}
      />
    </div>
  );
}
