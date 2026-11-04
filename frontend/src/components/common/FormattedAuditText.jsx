import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

/**
 * Componente para renderizado de Markdown estándar con Tailwind CSS y soporte GFM.
 * Renderiza encabezados, negritas, bloques de código, listas y tablas con estilos
 * adaptados a temas oscuros y burbujas de chat.
 */
export default function FormattedAuditText({
  text,
  className = '',
  strongClassName = 'font-bold text-inherit transition-colors',
}) {
  if (!text) return null;

  return (
    <div
      className={`prose prose-invert max-w-none text-slate-200 text-sm leading-relaxed whitespace-normal break-words ${className}`.trim()}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ node, children, ...props }) => (
            <h1 className="text-base font-bold text-slate-100 mt-3 mb-2 border-b border-slate-800 pb-1" {...props}>
              {children}
            </h1>
          ),
          h2: ({ node, children, ...props }) => (
            <h2 className="text-sm font-bold text-slate-100 mt-2.5 mb-1.5 text-cyan-200" {...props}>
              {children}
            </h2>
          ),
          h3: ({ node, children, ...props }) => (
            <h3 className="text-sm font-semibold text-cyan-300 mt-2 mb-1" {...props}>
              {children}
            </h3>
          ),
          h4: ({ node, children, ...props }) => (
            <h4 className="text-xs font-semibold text-slate-200 mt-1.5 mb-0.5" {...props}>
              {children}
            </h4>
          ),
          strong: ({ node, children, ...props }) => (
            <strong className={strongClassName} {...props}>
              {children}
            </strong>
          ),
          p: ({ node, children, ...props }) => (
            <p className="mb-2 last:mb-0 leading-relaxed" {...props}>
              {children}
            </p>
          ),
          ul: ({ node, children, ...props }) => (
            <ul className="my-2 ml-4 list-disc space-y-1 text-slate-200 marker:text-cyan-400" {...props}>
              {children}
            </ul>
          ),
          ol: ({ node, children, ...props }) => (
            <ol className="my-2 ml-4 list-decimal space-y-1 text-slate-200 marker:text-cyan-400 font-medium" {...props}>
              {children}
            </ol>
          ),
          li: ({ node, children, ...props }) => (
            <li className="leading-relaxed pl-1" {...props}>
              {children}
            </li>
          ),
          pre: ({ node, children, ...props }) => (
            <pre
              className="my-2.5 p-3 rounded-lg bg-slate-950/90 border border-slate-800 overflow-x-auto text-xs font-mono text-cyan-300 shadow-inner"
              {...props}
            >
              {children}
            </pre>
          ),
          code: ({ node, className: codeClass, children, ...props }) => {
            const hasLang = /language-(\w+)/.exec(codeClass || '');
            const isMultiLine = typeof children === 'string' && children.includes('\n');
            if (!hasLang && !isMultiLine) {
              return (
                <code
                  className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 font-mono text-[11px] text-cyan-300 font-medium"
                  {...props}
                >
                  {children}
                </code>
              );
            }
            return (
              <code className={`font-mono text-xs text-slate-200 block ${codeClass || ''}`} {...props}>
                {children}
              </code>
            );
          },
          blockquote: ({ node, children, ...props }) => (
            <blockquote
              className="my-2 border-l-2 border-cyan-500/60 pl-3 italic text-slate-300 bg-slate-900/40 py-1 rounded-r text-xs"
              {...props}
            >
              {children}
            </blockquote>
          ),
          table: ({ node, children, ...props }) => (
            <div className="my-2.5 overflow-x-auto rounded border border-slate-800">
              <table className="min-w-full divide-y divide-slate-800 text-xs text-left" {...props}>
                {children}
              </table>
            </div>
          ),
          th: ({ node, children, ...props }) => (
            <th className="px-2.5 py-1.5 bg-slate-900 font-semibold text-slate-200" {...props}>
              {children}
            </th>
          ),
          td: ({ node, children, ...props }) => (
            <td className="px-2.5 py-1.5 border-t border-slate-800 text-slate-300" {...props}>
              {children}
            </td>
          ),
          a: ({ node, children, ...props }) => (
            <a
              className="text-cyan-400 hover:text-cyan-300 underline underline-offset-2 transition-colors"
              target="_blank"
              rel="noopener noreferrer"
              {...props}
            >
              {children}
            </a>
          ),
          hr: ({ node, ...props }) => <hr className="my-2.5 border-slate-800" {...props} />,
        }}
      >
        {text}
      </ReactMarkdown>
    </div>
  );
}
