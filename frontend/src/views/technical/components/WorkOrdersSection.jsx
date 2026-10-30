import React from 'react';
import { MoreVertical } from 'lucide-react';
import Pagination from '../../../components/common/Pagination';
import { workOrderPriorities, workOrderStatuses } from '../../../constants/operations';

function PriorityBadge({ priority }) {
  const details = workOrderPriorities.find((item) => item.id === priority) || {
    label: priority,
    className: 'border-slate-200 text-slate-600',
  };
  return (
    <span className={`inline-flex whitespace-nowrap rounded border px-2 py-1 text-[9px] font-semibold ${details.className}`}>
      {details.label}
    </span>
  );
}

function OrderStatusBadge({ status }) {
  const details = workOrderStatuses.find((item) => item.id === status) || {
    label: status,
    className: 'border-slate-200 text-slate-600',
  };
  return (
    <span className={`inline-flex whitespace-nowrap rounded border px-2 py-1 text-[9px] font-semibold ${details.className}`}>
      {details.label}
    </span>
  );
}

export default function WorkOrdersSection({
  orders = [],
  ordersList = [],
  paginatedOrders = [],
  orderFilter = 'all',
  setOrderFilter,
  onViewOrder,
  safeOrderPage = 1,
  totalOrderPages = 1,
  pageSize = 6,
  onPageChange,
  hasActiveFilters = false,
  onClearFilters,
  headingClass = '',
  mutedClass = '',
  cardClass = '',
}) {
  const filterOptions = [
    { id: 'all', label: 'Todas' },
    { id: 'high', label: 'Alta prioridad' },
    { id: 'in-progress', label: 'En curso' },
  ];

  return (
    <section className={`min-w-0 overflow-hidden ${cardClass}`} aria-labelledby="work-orders-title">
      <header className="flex flex-wrap items-center justify-between gap-3 px-4 pt-5 sm:px-5">
        <div>
          <h2 id="work-orders-title" className={`text-base font-semibold ${headingClass}`}>
            Órdenes de Trabajo Activas
          </h2>
          <p className={`mt-1 text-[10px] ${mutedClass}`}>
            Últimas órdenes de operación en terreno
          </p>
        </div>
        <div className="flex gap-1 rounded-lg bg-slate-100 p-1 transition-colors duration-300 dark:bg-[#0d1117] midnight:bg-[#050B14]">
          {filterOptions.map((filter) => (
            <button
              key={filter.id}
              type="button"
              onClick={() => setOrderFilter(filter.id)}
              aria-pressed={orderFilter === filter.id}
              className={`rounded px-3 py-1.5 text-[9px] font-medium transition-colors duration-300 ${
                orderFilter === filter.id
                  ? 'bg-blue-600 text-white midnight:bg-cyan-600'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white midnight:text-cyan-500/70 midnight:hover:text-cyan-50'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </header>

      <div className="mt-3 overflow-x-auto px-4 sm:px-5">
        <table className="w-full min-w-[760px] border-collapse text-left">
          <thead>
            <tr className="border-b border-slate-200 text-[9px] uppercase text-slate-500 transition-colors duration-300 dark:border-[#30363d] midnight:border-cyan-900/30 midnight:text-cyan-600">
              {['ID', 'Proyecto', 'Tipo', 'Responsable', 'Prioridad', 'Estado', 'Acción'].map((label) => (
                <th key={label} className="px-2 py-3 font-semibold first:pl-0 last:pr-0">
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedOrders.map((order) => (
              <tr
                key={order.id}
                className="border-b border-slate-200 last:border-0 transition-colors duration-300 hover:bg-slate-50 dark:border-[#30363d]/70 dark:hover:bg-white/[0.02] midnight:border-cyan-900/30 midnight:hover:bg-cyan-900/20"
              >
                <td className={`py-3.5 pr-2 font-mono text-[10px] font-bold ${headingClass}`}>
                  {order.code}
                </td>
                <td
                  className="max-w-[150px] truncate px-2 py-3.5 text-[10px] font-medium text-cyan-700 dark:text-blue-400 midnight:text-cyan-400"
                  title={order.project}
                >
                  {order.project.split(' (')[0]}
                </td>
                <td className="px-2 py-3.5 text-[10px] text-slate-600 dark:text-slate-300 midnight:text-cyan-100">
                  {order.type}
                </td>
                <td className="px-2 py-3.5 text-[10px] text-slate-600 dark:text-slate-300 midnight:text-cyan-100">
                  {order.responsible}
                </td>
                <td className="px-2 py-3.5">
                  <PriorityBadge priority={order.priority} />
                </td>
                <td className="px-2 py-3.5">
                  <OrderStatusBadge status={order.status} />
                </td>
                <td className="py-3.5 pl-2 text-right">
                  <button
                    type="button"
                    onClick={() => onViewOrder && onViewOrder(order)}
                    aria-label={`Ver orden ${order.code}`}
                    className="rounded p-1.5 text-slate-500 transition-colors duration-300 hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-white/5 dark:hover:text-white midnight:text-cyan-500/70 midnight:hover:bg-cyan-900/20 midnight:hover:text-cyan-50"
                  >
                    <MoreVertical size={15} />
                  </button>
                </td>
              </tr>
            ))}
            {!orders.length && (
              <tr>
                <td colSpan={7} className="py-12 text-center text-sm text-slate-500 midnight:text-cyan-500/70">
                  No se encontraron órdenes con estos filtros.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <footer className="mt-2 flex flex-col gap-2 border-t border-slate-200 px-4 py-3 text-[10px] text-slate-500 transition-colors duration-300 dark:border-[#30363d] midnight:border-cyan-900/30 midnight:text-cyan-600 sm:px-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex-1">
            <Pagination
              currentPage={safeOrderPage}
              totalPages={totalOrderPages}
              totalItems={orders.length}
              pageSize={pageSize}
              itemLabel="órdenes"
              onPageChange={onPageChange}
              hideOnSinglePage={false}
            />
          </div>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={onClearFilters}
              className="shrink-0 text-cyan-700 hover:text-cyan-600 dark:text-blue-400 dark:hover:text-blue-300 midnight:text-cyan-400 midnight:hover:text-cyan-200"
            >
              Limpiar filtros
            </button>
          )}
        </div>
      </footer>
    </section>
  );
}
