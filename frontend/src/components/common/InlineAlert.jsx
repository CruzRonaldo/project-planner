import React from 'react';
import { AlertCircle, CheckCircle2, Info, AlertTriangle } from 'lucide-react';

const variantConfig = {
  error: {
    icon: AlertCircle,
    role: 'alert',
    classes:
      'border-red-200 bg-red-50 text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400 midnight:border-red-500/30 midnight:bg-red-950/40 midnight:text-red-300',
    iconColor: 'text-red-500 dark:text-red-400 midnight:text-red-400',
  },
  success: {
    icon: CheckCircle2,
    role: 'status',
    classes:
      'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400 midnight:border-emerald-500/30 midnight:bg-emerald-950/40 midnight:text-emerald-300',
    iconColor: 'text-emerald-500 dark:text-emerald-400 midnight:text-emerald-400',
  },
  info: {
    icon: Info,
    role: 'status',
    classes:
      'border-cyan-900/50 bg-cyan-950/20 text-slate-300 dark:border-cyan-900/50 dark:bg-cyan-950/20 dark:text-slate-300 midnight:border-cyan-800/40 midnight:bg-cyan-900/20 midnight:text-cyan-100',
    iconColor: 'text-cyan-500 dark:text-cyan-400 midnight:text-cyan-400',
  },
  warning: {
    icon: AlertTriangle,
    role: 'alert',
    classes:
      'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-400 midnight:border-amber-500/30 midnight:bg-amber-950/40 midnight:text-amber-300',
    iconColor: 'text-amber-500 dark:text-amber-400 midnight:text-amber-400',
  },
};

/**
 * Banner de alerta o aviso inline accesible y multitema.
 *
 * @param {Object} props
 * @param {'info'|'error'|'success'|'warning'} [props.variant='info'] - Variante de color y semántica
 * @param {string} [props.title] - Título o cabecera opcional
 * @param {React.ReactNode} props.children - Mensaje o contenido principal
 * @param {boolean} [props.showIcon=false] - Muestra el icono representativo de la variante
 * @param {React.ComponentType<{ size?: number, className?: string }>} [props.icon] - Icono personalizado que reemplaza el por defecto
 * @param {'alert'|'status'} [props.role] - Rol ARIA explícito (por defecto alert para error/warning, status para info/success)
 * @param {string} [props.className=''] - Clases adicionales de Tailwind
 */
export default function InlineAlert({
  variant = 'info',
  title,
  children,
  showIcon = false,
  icon: CustomIcon,
  role,
  className = '',
}) {
  const currentVariant = variantConfig[variant] || variantConfig.info;
  const IconComponent = CustomIcon || currentVariant.icon;
  const roleAttr = role || currentVariant.role;

  return (
    <div
      role={roleAttr}
      className={`flex items-start gap-2.5 rounded-lg border p-3 text-xs transition-colors duration-300 ${currentVariant.classes} ${className}`}
    >
      {showIcon && IconComponent && (
        <IconComponent
          size={16}
          className={`shrink-0 mt-0.5 ${currentVariant.iconColor}`}
          aria-hidden="true"
        />
      )}
      <div className="flex-1">
        {title && <span className="mb-0.5 block font-semibold leading-tight">{title}</span>}
        <div className="leading-relaxed">{children}</div>
      </div>
    </div>
  );
}
