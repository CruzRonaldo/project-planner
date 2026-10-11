import React from 'react';

/**
 * Formatea textos de notificaciones y bitácora eliminando corchetes ([...]),
 * comillas simples ('...'), comillas angulares («...») o asteriscos (**...**),
 * y resaltando los nombres, correos o identificadores en fuente de negrita
 * perfectamente adaptada a los 3 temas (Claro, Oscuro y Medianoche).
 */
export default function FormattedAuditText({ text, className = '' }) {
  if (!text) return null;

  // Detecta patrones: 'texto', «texto», **texto**, o [texto]
  const regex = /('([^']+)'|«([^»]+)»|\*\*([^*]+)\*\*|\[([^\]]+)\])/g;

  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }

    const content = match[2] || match[3] || match[4] || match[5];
    parts.push(
      <strong
        key={match.index}
        className="font-bold text-slate-900 dark:text-white midnight:text-cyan-100 transition-colors"
      >
        {content}
      </strong>
    );
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return <span className={className}>{parts}</span>;
}
