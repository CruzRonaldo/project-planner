import React from 'react';
import { History } from 'lucide-react';
import Pagination from '../../../components/common/Pagination';
import {
  SectionCardHeader,
  Table,
  TableHead,
  TableRow,
  EmptyState,
} from '../../../components/common';

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
      <header className="border-b border-slate-200 px-4 py-4 dark:border-[#30363d] midnight:border-cyan-900/30 sm:px-6">
        <SectionCardHeader
          icon={History}
          iconContainerClass="bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 midnight:bg-cyan-500/15 midnight:text-cyan-300"
          title="Historial de Reajustes de Cronograma"
          subtitle="Registro de modificaciones de plazos, prórrogas y motivos de gobernanza"
        >
          <span className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-600 dark:border-[#30363d] dark:bg-[#0d1117] dark:text-slate-300 midnight:border-cyan-800/40 midnight:bg-[#050B14] midnight:text-cyan-300">
            {displayedAdjustments.length} {displayedAdjustments.length === 1 ? 'registro' : 'registros'}
          </span>
        </SectionCardHeader>
      </header>

      <Table className="min-w-[700px] border-collapse">
        <TableHead
          columns={[
            { label: 'Fecha', className: 'px-4 py-3 sm:px-6' },
            { label: 'Proyecto', className: 'px-4 py-3 sm:px-6' },
            { label: 'Periodo Anterior', className: 'px-4 py-3 sm:px-6' },
            { label: 'Nuevo Periodo', className: 'px-4 py-3 sm:px-6' },
            { label: 'Motivo del Reajuste', className: 'px-4 py-3 sm:px-6' },
          ]}
        />
        <tbody>
          {paginatedAdjustments.map((adj) => (
            <TableRow
              key={adj.id}
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
            </TableRow>
          ))}
          {!displayedAdjustments.length && (
            <TableRow>
              <td colSpan={5} className="py-8 text-center text-xs text-slate-500 dark:text-slate-400 midnight:text-cyan-500/70">
                <EmptyState description="No hay reajustes de cronograma registrados en este ejercicio." />
              </td>
            </TableRow>
          )}
        </tbody>
      </Table>
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
