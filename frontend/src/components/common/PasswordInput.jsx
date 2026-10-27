import React, { useRef, useState } from 'react';
import { Eye, EyeOff, X } from 'lucide-react';

/**
 * Campo de contraseña reutilizable para todo el proyecto.
 * Incluye:
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

  return (
    <div className="relative w-full">
      {leftIcon && (
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
          {leftIcon}
        </div>
      )}
      <input
        ref={inputRef}
        type={visible ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        disabled={disabled}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className={`${className} ${paddingLeftClass} ${paddingRightClass}`}
        {...rest}
      />
      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5 text-slate-400">
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
          aria-label={visible ? 'Ocultar contraseña' : 'Ver contraseña'}
          title={visible ? 'Ocultar contraseña' : 'Ver contraseña'}
          className="rounded p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
        >
          {visible ? <EyeOff size={15} /> : <Eye size={15} />}
        </button>
      </div>
    </div>
  );
}
