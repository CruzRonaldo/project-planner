import React from 'react';
import { ExternalLink, Pencil, Trash2, Video } from 'lucide-react';
import { projectStatuses } from '../../../constants/portfolio';
import { formatMoney, formatProjectTerm } from '../../../utils/portfolio';
import { cardClass } from '../../../constants/themeClasses';

export function statusDetails(status) {
  return (
    projectStatuses.find((item) => item.id === status) || {
      id: status,
      label: status,
      className:
        'bg-slate-100 text-slate-600 dark:bg-slate-500/15 dark:text-slate-300 midnight:bg-cyan-900/30 midnight:text-cyan-500/70',
      barClass: 'bg-cyan-500',
    }
  );
}

export default function ProjectCard({
  project,
  onEdit,
  onDelete,
  onOpenMeetings,
  canManage = false,
  isProjectLeader = false,
}) {
  const status = statusDetails(project.status);
  return (
    <article className={`${cardClass} p-5`}>
      <header className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="mb-1 flex items-center gap-2">
            <p className="text-[9px] font-semibold uppercase tracking-wider text-cyan-700 dark:text-blue-400 midnight:text-cyan-400">
              {project.code}
            </p>
            {isProjectLeader && (
              <span className="rounded bg-cyan-100 px-1.5 py-0.5 text-[9px] font-semibold text-cyan-800 dark:bg-cyan-900/40 dark:text-cyan-300 midnight:bg-cyan-900/50 midnight:text-cyan-200">
                Tu Liderazgo
              </span>
            )}
          </div>
          <h2 className="truncate text-base font-semibold text-slate-900 dark:text-white midnight:text-cyan-50">
            {project.name}
          </h2>
          <p className="mt-1 text-[10px] text-slate-500 midnight:text-cyan-600">
            {project.area}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span
            className={`rounded px-2 py-1 text-[10px] font-semibold ${status.className}`}
          >
            {status.label}
          </span>
          {onOpenMeetings && (
            <button
              type="button"
              onClick={() => onOpenMeetings(project)}
              aria-label={`Videollamadas de ${project.name}`}
              className="rounded-lg border border-slate-200 p-1.5 text-slate-400 transition-colors hover:border-cyan-400/50 hover:bg-cyan-50 hover:text-cyan-700 dark:border-[#30363d] dark:text-slate-400 dark:hover:bg-cyan-500/10 dark:hover:text-cyan-400 midnight:border-cyan-800/40 midnight:text-cyan-500/70 midnight:hover:bg-cyan-900/30 midnight:hover:text-cyan-300"
              title="Salas de Videoconferencia (Jitsi Meet)"
            >
              <Video size={13} />
            </button>
          )}
          {onEdit && (
            <button
              type="button"
              onClick={() => onEdit(project)}
              aria-label={`Editar ${project.name}`}
              className="rounded-lg border border-slate-200 p-1.5 text-slate-400 transition-colors hover:border-cyan-400/50 hover:bg-cyan-50 hover:text-cyan-700 dark:border-[#30363d] dark:text-slate-400 dark:hover:bg-cyan-500/10 dark:hover:text-cyan-400 midnight:border-cyan-800/40 midnight:text-cyan-500/70 midnight:hover:bg-cyan-900/30 midnight:hover:text-cyan-300"
              title="Editar proyecto"
            >
              <Pencil size={13} />
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              onClick={() => onDelete(project)}
              aria-label={`Eliminar ${project.name}`}
              className="rounded-lg border border-slate-200 p-1.5 text-slate-400 transition-colors hover:border-red-400/50 hover:bg-red-50 hover:text-red-600 dark:border-[#30363d] dark:text-slate-400 dark:hover:bg-red-500/10 dark:hover:text-red-400 midnight:border-cyan-800/40 midnight:text-cyan-500/70 midnight:hover:bg-red-900/30 midnight:hover:text-red-300"
              title="Eliminar proyecto (Solo Administrador)"
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
      </header>
      <div className="mt-5">
        <div className="mb-2 flex justify-between text-[10px] text-slate-500 dark:text-slate-400 midnight:text-cyan-500/70">
          <span>Progreso General</span>
          <strong className="text-slate-800 dark:text-slate-200 midnight:text-cyan-100">
            {project.progress}%
          </strong>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-[#0d1117] midnight:bg-cyan-950">
          <div
            className={`h-full rounded-full ${status.barClass}`}
            style={{ width: `${project.progress}%` }}
          />
        </div>
      </div>
      <div className="mt-5 flex items-center justify-between border-b border-slate-200 pb-4 dark:border-[#30363d] midnight:border-cyan-900/30">
        <div>
          <p className="text-[10px] text-slate-500 midnight:text-cyan-600">
            Presupuesto Usado / Total
          </p>
          <p className="mt-1 text-xs font-semibold text-slate-800 dark:text-slate-200 midnight:text-cyan-100">
            {formatMoney(project.usedBudget)}{' '}
            <span className="px-1 text-slate-400 midnight:text-cyan-800">/</span>{' '}
            {formatMoney(project.totalBudget)}
          </p>
        </div>
        <div
          className="flex -space-x-2"
          aria-label={`${(project.members || []).length} integrantes`}
        >
          {(project.members || []).map((member, index) => (
            <span
              key={`${member}-${index}`}
              className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-gradient-to-br from-slate-400 to-slate-600 text-[8px] font-bold text-white dark:border-[#161b22] midnight:border-[#0a1120]"
            >
              {member}
            </span>
          ))}
        </div>
      </div>
      <footer className="mt-4 flex items-center justify-between gap-3 text-[10px] text-slate-500 midnight:text-cyan-600">
        <span
          className="truncate"
          title={formatProjectTerm(project.startDate, project.endDate)}
        >
          Plazo: {formatProjectTerm(project.startDate, project.endDate)}
        </span>
        <div className="flex items-center gap-3 shrink-0">
          {onOpenMeetings && (
            <button
              type="button"
              onClick={() => onOpenMeetings(project)}
              className="inline-flex items-center gap-1 font-medium text-cyan-700 hover:text-cyan-600 dark:text-blue-400 dark:hover:text-blue-300 midnight:text-cyan-400 midnight:hover:text-cyan-200"
              title="Abrir salas de videoconferencia"
            >
              <Video size={13} />
              <span>Videollamada</span>
            </button>
          )}
          {project.driveFolder ? (
            <a
              href={project.driveFolder}
              target="_blank"
              rel="noreferrer"
              aria-label={`Abrir carpeta de ${project.name}`}
              className="shrink-0 text-cyan-700 hover:text-cyan-600 dark:text-blue-400 dark:hover:text-blue-300 midnight:text-cyan-400 midnight:hover:text-cyan-200"
            >
              <ExternalLink size={14} />
            </a>
          ) : (
            <span className="shrink-0">Sin carpeta Drive</span>
          )}
        </div>
      </footer>
    </article>
  );
}
