import React from 'react';

/**
 * Formatea textos de notificaciones, bitácora y toasts flotantes eliminando:
 * - corchetes ([...])
 * - comillas simples ('...')
 * - comillas tipográficas (“...”)
 * - comillas angulares («...»)
 * - comillas dobles ("...")
 * - asteriscos (**...**)
 * y resaltando los nombres, identificadores o estados en fuente de negrita
 * adaptada con alto contraste a los 3 temas (Claro, Oscuro y Midnight).
 */
export default function FormattedAuditText({ text, className = '' }) {
  if (!text) return null;

  // Detecta patrones: 'texto', «texto», “texto”, "texto", **texto**, o [texto]
  const regex = /('([^']+)'|«([^»]+)»|“([^”]+)”|"([^"]+)"|\*\*([^*]+)\*\*|\[([^\]]+)\])/g;

  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }

    const content = match[2] || match[3] || match[4] || match[5] || match[6] || match[7];
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
