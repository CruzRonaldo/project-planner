import React from 'react';
import { getMemberFullName } from '../../../utils/technicalTeam';

export function getInitials(member) {
  return `${member?.firstNames?.[0] ?? ''}${member?.lastNames?.[0] ?? ''}`.toUpperCase();
}

/**
 * Avatar circular accesible para miembros del equipo técnico.
 * Renderiza la fotografía si existe, o las iniciales del técnico con estilo multitema.
 */
export default function MemberAvatar({ member, sizeClass = 'h-10 w-10' }) {
  if (!member) return null;
  return member.avatar ? (
    <img
      src={member.avatar}
      alt={`Perfil de ${getMemberFullName(member)}`}
      className={`${sizeClass} shrink-0 rounded-full object-cover`}
    />
  ) : (
    <span
      className={`${sizeClass} flex shrink-0 items-center justify-center rounded-full border border-cyan-200 bg-cyan-50 text-xs font-bold text-cyan-700 transition-colors duration-300 dark:border-cyan-400/25 dark:bg-cyan-500/10 dark:text-cyan-300 midnight:border-cyan-800/40 midnight:bg-cyan-500/15 midnight:text-cyan-300`}
    >
      {getInitials(member)}
    </span>
  );
}

export { MemberAvatar };
