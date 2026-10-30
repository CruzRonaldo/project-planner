import React from 'react';
import { History } from 'lucide-react';
import Pagination from '../../../components/common/Pagination';

export default function ScheduleAdjustmentsSection({
  displayedAdjustments = [],
  paginatedAdjustments = [],
  currentPage = 1,
  totalPages = 1,
  pageSize = 5,
  onPageChange = () => {},
  cardClass = '',
  headingClass = '',
  mutedClass = '',
}) {
  return (
    <section
      className={`min-w-0 overflow-hidden ${cardClass} print:border print:border-slate-300 print:shadow-none print:bg-white avoid-break`}
      aria-labelledby="audit-history-title"
    >
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-4 dark:border-[#30363d] midnight:border-cyan-900/30 sm:px-6">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 midnight:bg-cyan-500/15 midnight:text-cyan-300">
            <History size={16} />
          </div>
          <div>
            <h2 id="audit-history-title" className={`text-base font-semibold ${headingClass}`}>
              Historial de Reajustes de Cronograma
            </h2>
            <p className={`mt-0.5 text-xs ${mutedClass}`}>
              Registro de modificaciones de plazos, prórrogas y motivos de gobernanza
            </p>
          </div>
        </div>
        <span className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-600 dark:border-[#30363d] dark:bg-[#0d1117] dark:text-slate-300 midnight:border-cyan-800/40 midnight:bg-[#050B14] midnight:text-cyan-300">
          {displayedAdjustments.length} {displayedAdjustments.length === 1 ? 'registro' : 'registros'}
        </span>
      </header>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[700px] border-collapse text-left text-xs">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/75 text-[11px] font-semibold text-slate-500 dark:border-[#30363d] dark:bg-[#0d1117]/60 dark:text-slate-400 midnight:border-cyan-900/30 midnight:bg-[#050B14]/80 midnight:text-cyan-500">
              <th className="px-4 py-3 sm:px-6">Fecha</th>
              <th className="px-4 py-3 sm:px-6">Proyecto</th>
              <th className="px-4 py-3 sm:px-6">Periodo Anterior</th>
              <th className="px-4 py-3 sm:px-6">Nuevo Periodo</th>
              <th className="px-4 py-3 sm:px-6">Motivo del Reajuste</th>
            </tr>
          </thead>
          <tbody>
            {paginatedAdjustments.map((adj) => (
              <tr
                key={adj.id}
                className="border-b border-slate-200 last:border-0 transition-colors hover:bg-slate-50/50 dark:border-[#30363d] dark:hover:bg-white/[0.02] midnight:border-cyan-900/30 midnight:hover:bg-cyan-900/20"
              >
                <td className="whitespace-nowrap px-4 py-3 font-mono text-slate-600 dark:text-slate-300 midnight:text-cyan-100 sm:px-6">
                  {new Date(`${adj.date}T12:00:00`).toLocaleDateString('es-PE', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })}
                </td>
                <td className="whitespace-nowrap px-4 py-3 font-medium text-cyan-700 dark:text-blue-400 midnight:text-cyan-400 sm:px-6">
                  {adj.projectName}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-slate-400 line-through dark:text-slate-500 midnight:text-cyan-600 sm:px-6">
                  {adj.previousPeriod}
                </td>
                <td className="whitespace-nowrap px-4 py-3 font-semibold text-emerald-600 dark:text-emerald-400 midnight:text-emerald-300 sm:px-6">
                  {adj.nextPeriod}
                </td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-300 midnight:text-cyan-200/90 sm:px-6">
                  {adj.reason}
                </td>
              </tr>
            ))}
            {!displayedAdjustments.length && (
              <tr>
                <td colSpan={5} className="py-8 text-center text-xs text-slate-500 dark:text-slate-400 midnight:text-cyan-500/70">
                  No hay reajustes de cronograma registrados en este ejercicio.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="border-t border-slate-200 px-4 py-3 dark:border-[#30363d] midnight:border-cyan-900/30 sm:px-6">
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={displayedAdjustments.length}
          pageSize={pageSize}
          itemLabel="reajustes"
          onPageChange={onPageChange}
          hideOnSinglePage={true}
        />
      </div>
    </section>
  );
}
