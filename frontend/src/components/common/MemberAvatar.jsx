import React from 'react';

/**
 * Extrae las iniciales de un integrante, tolerando objetos de Equipo Técnico,
 * objetos de Recursos Humanos o cadenas directas.
 */
export function getInitials(member) {
  if (!member) return '';
  if (typeof member === 'string') {
    return member
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toUpperCase();
  }
  const name =
    (member.firstNames
      ? `${member.firstNames} ${member.lastNames || ''}`
      : member.name || member.full_name || ''
    ).trim();

  if (name) {
    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toUpperCase();
  }
  return `${member.firstNames?.[0] ?? ''}${member.lastNames?.[0] ?? ''}`.toUpperCase();
}

/**
 * Avatar circular accesible y multitema para miembros de equipo y personal.
 * Renderiza la fotografía si existe, o las iniciales del integrante.
 */
export default function MemberAvatar({
  member,
  sizeClass = 'h-10 w-10',
  className = '',
  textClass = 'text-xs',
}) {
  if (!member) return null;
  const fullName =
    typeof member === 'string'
      ? member
      : (member.firstNames
          ? `${member.firstNames} ${member.lastNames || ''}`
          : member.name || member.full_name || ''
        ).trim();

  if (member.avatar) {
    return (
      <img
        src={member.avatar}
        alt={`Perfil de ${fullName}`}
        className={`${sizeClass} shrink-0 rounded-full object-cover ${className}`}
      />
    );
  }

  return (
    <span
      className={`${sizeClass} flex shrink-0 items-center justify-center rounded-full border border-cyan-200 bg-cyan-50 font-bold text-cyan-700 transition-colors duration-300 dark:border-cyan-400/25 dark:bg-cyan-500/10 dark:text-cyan-300 midnight:border-cyan-800/40 midnight:bg-cyan-500/15 midnight:text-cyan-300 ${textClass} ${className}`}
      title={fullName}
      aria-label={fullName}
    >
      {getInitials(member)}
    </span>
  );
}

export { MemberAvatar };
