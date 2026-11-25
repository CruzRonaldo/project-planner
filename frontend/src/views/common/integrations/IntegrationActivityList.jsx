import React from 'react';
import { ClearFiltersButton, EmptyState, Pagination, Select, SortDropdown } from '../../../components/common';
import { activityStyles, cardClass, iconMap, nestedClass } from './constants';
import { useLanguage } from '../../../context/LanguageContext';

const STATUS_WEIGHT_ERROR_FIRST = {
  error: 0,
  processing: 1,
  success: 2,
};

const STATUS_WEIGHT_SUCCESS_FIRST = {
  success: 0,
  processing: 1,
  error: 2,
};

/**
 * Categorías de ordenamiento disponibles para el registro de actividad de integraciones.
 */
export const activitySortCategories = [
  {
    id: 'date',
    defaultId: 'activity-date-desc',
    defaultLabel: 'Más recientes',
    descId: 'activity-date-desc',
    ascId: 'activity-date-asc',
    descLabel: 'Más recientes',
    ascLabel: 'Más antiguas',
  },
  {
    id: 'status',
    defaultId: 'activity-status-desc',
    defaultLabel: 'Errores primero',
    descId: 'activity-status-desc',
    ascId: 'activity-status-asc',
    descLabel: 'Errores primero',
    ascLabel: 'Exitosas primero',
  },
];

/**
 * Extrae una marca temporal numérica (ms) para ordenar actividades con timestamps ISO o relativos.
 *
 * @param {Object} item - Registro de actividad
 * @param {number} [index=0] - Índice original como desempate determinista
 * @returns {number}
 */
export function getActivityTimestamp(item, index = 0) {
  if (item?.timestamp) {
    const t = new Date(item.timestamp).getTime();
    if (!Number.isNaN(t)) return t;
  }
  if (item?.created_at) {
    const t = new Date(item.created_at).getTime();
    if (!Number.isNaN(t)) return t;
  }
  if (typeof item?.id === 'string') {
    const match = item.id.match(/\d{10,}/);
    if (match) {
      const t = Number(match[0]);
      if (!Number.isNaN(t) && t > 1000000000) return t;
    }
  }
  const timeStr = String(item?.time || '').toLowerCase();
  if (timeStr.includes('ahora') || timeStr.includes('momento')) {
    return Date.now() - index * 1000;
  }
  const minMatch = timeStr.match(/(\d+)\s*(?:min|minuto)/);
  if (minMatch) {
    return Date.now() - Number(minMatch[1]) * 60 * 1000;
  }
  const hrMatch = timeStr.match(/(\d+)\s*(?:h|hora)/);
  if (hrMatch) {
    return Date.now() - Number(hrMatch[1]) * 3600 * 1000;
  }
  if (timeStr.includes('ayer')) {
    return Date.now() - 24 * 3600 * 1000 - index * 60000;
  }
  return Date.now() - (index + 1) * 3600 * 1000;
}

/**
 * Filtra actividades por conexión y aplica el criterio de ordenamiento seleccionado.
 *
 * @param {Array<Object>} [activities=[]]
 * @param {Object} [options]
 * @param {string} [options.connectionFilter='ALL']
 * @param {string} [options.sortOrder='activity-date-desc']
 * @returns {Array<Object>}
 */
export function filterAndSortActivities(
  activities = [],
  { connectionFilter = 'ALL', sortOrder = 'activity-date-desc' } = {}
) {
  const filtered =
    connectionFilter && connectionFilter !== 'ALL'
      ? activities.filter((item) => item.integrationId === connectionFilter)
      : activities;

  // Precalcula timestamp e índice una sola vez para mantener el comparador consistente
  const indexed = filtered.map((item, index) => ({
    item,
    index,
    timestamp: getActivityTimestamp(item, index),
  }));

  indexed.sort((a, b) => {
    if (sortOrder === 'activity-date-asc') {
      return a.timestamp - b.timestamp || a.index - b.index;
    }
    if (sortOrder === 'activity-status-desc') {
      const weightA = STATUS_WEIGHT_ERROR_FIRST[a.item?.status] ?? 3;
      const weightB = STATUS_WEIGHT_ERROR_FIRST[b.item?.status] ?? 3;
      return weightA - weightB || b.timestamp - a.timestamp || a.index - b.index;
    }
    if (sortOrder === 'activity-status-asc') {
      const weightA = STATUS_WEIGHT_SUCCESS_FIRST[a.item?.status] ?? 3;
      const weightB = STATUS_WEIGHT_SUCCESS_FIRST[b.item?.status] ?? 3;
      return weightA - weightB || b.timestamp - a.timestamp || a.index - b.index;
    }
    return b.timestamp - a.timestamp || a.index - b.index;
  });

  return indexed.map((entry) => entry.item);
}

/**
 * Lista paginada, filtrable por conexión y ordenable del registro de actividad de integraciones.
 */
export default function IntegrationActivityList({
  activities = [],
  integrations = [],
  query = '',
  onClearQuery,
}) {
  const { t } = useLanguage();
  const [connectionFilter, setConnectionFilter] = React.useState('ALL');
  const [sortOrder, setSortOrder] = React.useState('activity-date-desc');
  const [currentPage, setCurrentPage] = React.useState(1);
  const pageSize = 5;

  React.useEffect(() => {
    setCurrentPage(1);
  }, [query, activities.length, connectionFilter, sortOrder]);

  const connectionOptions = React.useMemo(
    () => [
      { value: 'ALL', label: t('integrations.allConnections', 'Todas las conexiones') },
      ...integrations.map((integration) => ({
        value: integration.id,
        label: integration.name,
      })),
    ],
    [integrations, t]
  );

  const processedActivities = React.useMemo(
    () => filterAndSortActivities(activities, { connectionFilter, sortOrder }),
    [activities, connectionFilter, sortOrder]
  );

  const totalPages = Math.ceil(processedActivities.length / pageSize) || 1;
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = (safeCurrentPage - 1) * pageSize;
  const visibleActivities = processedActivities.slice(startIndex, startIndex + pageSize);

  const hasActiveFilters =
    Boolean(query) || connectionFilter !== 'ALL' || sortOrder !== 'activity-date-desc';

  const handleClearFilters = () => {
    setConnectionFilter('ALL');
    setSortOrder('activity-date-desc');
    setCurrentPage(1);
    if (onClearQuery) {
      onClearQuery();
    }
  };

  return (
    <section className={`overflow-hidden p-4 sm:p-5 ${cardClass}`} aria-labelledby="integration-activity-title">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2
          id="integration-activity-title"
          className="text-base font-semibold text-slate-900 transition-colors duration-300 dark:text-white midnight:text-cyan-50"
        >
          {t('integrations.activityListTitle', 'Registro de Actividad de Integraciones')}
        </h2>
        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={connectionFilter}
            onChange={(event) => {
              setConnectionFilter(event.target.value);
              setCurrentPage(1);
            }}
            aria-label={t('integrations.filterByConnectionAria', 'Filtrar actividades por conexión')}
            className="w-full py-2 text-xs sm:w-auto sm:min-w-[175px]"
            options={connectionOptions}
          />
          <SortDropdown
            value={sortOrder}
            onChange={(nextSort) => {
              setSortOrder(nextSort);
              setCurrentPage(1);
            }}
            categories={activitySortCategories}
            label={t('common.sortBy', 'Ordenar por:')}
            className="w-full sm:w-auto"
            buttonClassName="w-full sm:min-w-[205px]"
            ariaLabel={t('integrations.sortActivitiesAria', 'Ordenar actividades de integración')}
          />
          <ClearFiltersButton
            onClick={handleClearFilters}
            label={t('integrations.clearFilter', 'Limpiar filtro')}
            disabled={!hasActiveFilters}
            showIcon
          />
        </div>
      </div>

      <div className="mt-4 space-y-2">
        {visibleActivities.map((item) => {
          const integration = integrations.find((entry) => entry.id === item.integrationId) || {};
          const Icon = iconMap[integration.icon];
          const status = activityStyles[item.status] || {
            label: item.status,
            className: 'bg-slate-100 text-slate-700',
          };

          return (
            <article key={item.id} className={`flex items-center gap-3 px-3 py-3 ${nestedClass}`}>
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-cyan-50 text-cyan-700 transition-colors duration-300 dark:bg-blue-500/20 dark:text-blue-300 midnight:bg-cyan-500/20 midnight:text-cyan-300">
                {Icon && <Icon size={15} />}
              </span>
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-xs font-semibold text-slate-800 transition-colors duration-300 dark:text-slate-200 midnight:text-cyan-100">
                  {integration.name} — {item.title}
                </h3>
                <p className="mt-1 text-[10px] text-slate-500 transition-colors duration-300 dark:text-slate-400 midnight:text-cyan-600">
                  {item.time}
                </p>
              </div>
              <span className={`shrink-0 rounded px-2 py-1 text-[9px] font-semibold ${status.className}`}>
                {t(`integrations.activityStatus_${item.status}`, status.label)}
              </span>
            </article>
          );
        })}

        {!processedActivities.length && (
          <EmptyState description={t('integrations.noActivities', 'No hay actividad que coincida con la búsqueda.')} />
        )}
      </div>

      {processedActivities.length > 0 && (
        <div className="mt-4 pt-2 border-t border-slate-100 dark:border-slate-800/80 midnight:border-cyan-900/30">
          <Pagination
            currentPage={safeCurrentPage}
            totalPages={totalPages}
            totalItems={processedActivities.length}
            pageSize={pageSize}
            itemLabel={t('integrations.activitiesLabel', 'actividades')}
            onPageChange={setCurrentPage}
            hideOnSinglePage={true}
          />
        </div>
      )}
    </section>
  );
}
