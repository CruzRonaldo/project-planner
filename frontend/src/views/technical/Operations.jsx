import React, { useState, useMemo } from 'react';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  ClipboardCheck,
  Plus,
} from 'lucide-react';
import KpiCard from '../../components/common/KpiCard';
import Button from '../../components/common/Button';
import Select from '../../components/common/Select';
import PageHeader from '../../components/common/PageHeader';
import { useToast } from '../../context/ToastContext';
import NewWorkOrderDialog from './components/NewWorkOrderDialog';
import CriticalScheduleSection from './components/CriticalScheduleSection';
import WorkOrdersSection from './components/WorkOrdersSection';
import OperationsSidebar from './components/OperationsSidebar';
import { cardClass, nestedClass } from '../../constants/themeClasses';
import { operationalProjects } from '../../constants/operations';
import {
  buildWorkOrdersCsv,
  createWorkOrder,
  filterWorkOrders,
  normalizeCriticalActivities,
  sortWorkOrders,
  operationsSortCategories,
} from '../../utils/operations';
import { createOperationsData } from '../../mocks/operationsData';

export { NewWorkOrderDialog };

const headingClass = 'text-slate-900 transition-colors duration-300 dark:text-white midnight:text-cyan-50';
const mutedClass = 'text-slate-500 transition-colors duration-300 dark:text-slate-400 midnight:text-cyan-600';
const ORDERS_PER_PAGE = 6;

export default function Operations({
  data = {},
  onChange,
  query = '',
  onQueryChange,
  canManage = false,
  projectOptions = [],
  responsibleOptions = [],
}) {
  const isProduction =
    import.meta.env.PROD ||
    (typeof window !== 'undefined' &&
      !['localhost', '127.0.0.1'].includes(window.location.hostname));
  const hideMocks = import.meta.env.VITE_HIDE_MOCKS === 'true' || isProduction;

  const defaultMockData = createOperationsData();
  const metrics =
    data?.metrics && (data.metrics.inProgress > 0 || data.metrics.completed > 0)
      ? data.metrics
      : hideMocks
        ? { inProgress: 0, completed: 0, incidents: 0, efficiency: 0 }
        : defaultMockData.metrics;
  const ordersList =
    data?.orders && data.orders.length > 0
      ? data.orders
      : hideMocks
        ? []
        : defaultMockData.orders;
  const rawActivities =
    data?.activities && data.activities.length > 0
      ? data.activities
      : hideMocks
        ? []
        : defaultMockData.activities;
  const activitiesList = useMemo(
    () => normalizeCriticalActivities(rawActivities),
    [rawActivities]
  );
  const alertsList =
    data?.alerts && data.alerts.length > 0
      ? data.alerts
      : hideMocks
        ? []
        : defaultMockData.alerts;
  const qualityList =
    data?.qualityChecks && data.qualityChecks.length > 0
      ? data.qualityChecks
      : hideMocks
        ? []
        : defaultMockData.qualityChecks;

  const [projectFilter, setProjectFilter] = useState('all');
  const [orderFilter, setOrderFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState('prio_desc');
  const [orderPageSelection, setOrderPageSelection] = useState({
    query: '',
    orderFilter: 'all',
    projectFilter: 'all',
    sort: 'prio_desc',
    page: 1,
  });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [feedback, setFeedback] = useState('');
  const { showToast } = useToast();

  const baseProjects = projectOptions.length > 0 || hideMocks ? projectOptions : operationalProjects;
  const availableProjects = Array.from(new Set(baseProjects));
  const orders = filterWorkOrders(ordersList, query, orderFilter, projectFilter);
  const sortedOrders = sortWorkOrders(orders, sortOrder);

  const totalOrderPages = Math.max(1, Math.ceil(sortedOrders.length / ORDERS_PER_PAGE));
  const safeOrderPage =
    orderPageSelection.query === query &&
    orderPageSelection.orderFilter === orderFilter &&
    orderPageSelection.projectFilter === projectFilter &&
    orderPageSelection.sort === sortOrder
      ? Math.min(orderPageSelection.page, totalOrderPages)
      : 1;
  const paginatedOrders = sortedOrders.slice((safeOrderPage - 1) * ORDERS_PER_PAGE, safeOrderPage * ORDERS_PER_PAGE);

  const metricCards = [
    {
      label: 'Tareas en progreso',
      value: metrics.inProgress,
      note: metrics.inProgress > 0 ? `${metrics.inProgress} activas` : 'Sin tareas',
      icon: Activity,
      color: 'text-blue-600 dark:text-blue-400 midnight:text-cyan-400',
      badge: 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 midnight:bg-cyan-500/10 midnight:text-cyan-300',
    },
    {
      label: 'Tareas completadas',
      value: metrics.completed,
      note: metrics.completed > 0 ? `${metrics.completed} finalizadas` : 'Sin registros',
      icon: CheckCircle2,
      color: 'text-emerald-600 dark:text-emerald-400 midnight:text-emerald-300',
      badge: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 midnight:bg-emerald-500/10 midnight:text-emerald-300',
    },
    {
      label: 'Incidencias abiertas',
      value: metrics.incidents,
      note: metrics.incidents > 0 ? `${metrics.incidents} alertas` : 'Sin incidencias',
      icon: AlertTriangle,
      color: 'text-red-600 dark:text-red-400 midnight:text-red-300',
      badge: 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400 midnight:bg-red-500/10 midnight:text-red-300',
    },
    {
      label: 'Eficiencia operativa',
      value: `${metrics.efficiency}%`,
      note: metrics.efficiency > 0 ? 'En rango' : 'Sin métricas',
      icon: BarChart3,
      color: 'text-cyan-600 dark:text-cyan-400 midnight:text-cyan-400',
      badge: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 midnight:bg-emerald-500/10 midnight:text-emerald-300',
    },
  ];

  const saveOrder = (draft) => {
    const updated = createWorkOrder(data, draft);
    onChange(updated);
    setDialogOpen(false);
    setOrderFilter('all');
    setProjectFilter('all');
    const msg = `Orden ${updated.orders[0].code} emitida y añadida al panel operativo.`;
    setFeedback(msg);
    showToast({
      title: 'Orden Emitida',
      message: msg,
      type: 'success',
    });
  };

  const exportReport = () => {
    const blob = new Blob([`\uFEFF${buildWorkOrdersCsv(ordersList)}`], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'reporte-operativo-diario.csv';
    link.click();
    URL.revokeObjectURL(url);
    const msg = 'Reporte operativo diario exportado correctamente.';
    setFeedback(msg);
    showToast({
      title: 'Reporte Exportado',
      message: msg,
      type: 'info',
    });
  };

  return (
    <main className="min-w-0 flex-1 overflow-y-auto bg-slate-50 p-4 text-slate-900 transition-colors duration-300 dark:bg-[#0d1117] dark:text-slate-100 midnight:bg-[#050B14] midnight:text-cyan-50 md:p-6 lg:p-8">
      <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-5 pb-8">
        <PageHeader
          title="Gestión Operativa de Campo"
          subtitle="Control de tareas activas, órdenes de trabajo críticas y aseguramiento de calidad"
        >
          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={projectFilter}
              onChange={(event) => setProjectFilter(event.target.value)}
              aria-label="Filtrar por proyecto operativo"
              className="py-2.5"
              options={[
                { value: 'all', label: 'Todos los proyectos' },
                ...availableProjects.map((project) => ({ value: project, label: project })),
              ]}
            />
            {canManage && (
              <>
                <Button variant="secondary" onClick={exportReport} icon={ClipboardCheck}>
                  Generar Reporte Diario
                </Button>
                <Button
                  variant="primary"
                  onClick={() => {
                    setDialogOpen(true);
                    setFeedback('');
                  }}
                  icon={Plus}
                >
                  Nueva Orden de Trabajo
                </Button>
              </>
            )}
          </div>
        </PageHeader>

        <p role="status" className={feedback ? 'text-xs text-cyan-700 dark:text-cyan-300 midnight:text-cyan-300' : 'sr-only'}>
          {feedback}
        </p>

        <section aria-label="Resumen operativo" className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          {metricCards.map((card) => (
            <KpiCard
              key={card.label}
              title={card.label}
              value={card.value}
              icon={card.icon}
              iconColor={card.color}
              badge={card.note}
              badgeClass={card.badge}
            />
          ))}
        </section>

        <CriticalScheduleSection
          activitiesList={activitiesList}
          headingClass={headingClass}
          mutedClass={mutedClass}
          cardClass={cardClass}
        />

        <div className="grid min-w-0 items-start gap-5 xl:grid-cols-[minmax(0,2.2fr)_minmax(270px,0.8fr)]">
          <WorkOrdersSection
            orders={orders}
            ordersList={ordersList}
            paginatedOrders={paginatedOrders}
            orderFilter={orderFilter}
            setOrderFilter={setOrderFilter}
            sortOrder={sortOrder}
            onSortChange={(nextSort) => {
              setSortOrder(nextSort);
              setOrderPageSelection((prev) => ({ ...prev, page: 1 }));
            }}
            sortCategories={operationsSortCategories}
            onViewOrder={(order) => setFeedback(`${order.code}: ${order.title}. ${order.description}`)}
            safeOrderPage={safeOrderPage}
            totalOrderPages={totalOrderPages}
            pageSize={ORDERS_PER_PAGE}
            onPageChange={(nextPage) => setOrderPageSelection({ query, orderFilter, projectFilter, page: nextPage })}
            hasActiveFilters={Boolean(query || projectFilter !== 'all' || orderFilter !== 'all')}
            onClearFilters={() => {
              setOrderFilter('all');
              setProjectFilter('all');
              onQueryChange('');
            }}
            headingClass={headingClass}
            mutedClass={mutedClass}
            cardClass={cardClass}
          />

          <OperationsSidebar
            alertsList={alertsList}
            qualityList={qualityList}
            onSelectAlert={(alert) => setFeedback(`Alerta seleccionada: ${alert.title}`)}
            headingClass={headingClass}
            cardClass={cardClass}
            nestedClass={nestedClass}
          />
        </div>
      </div>

      {dialogOpen && canManage && (
        <NewWorkOrderDialog
          projectOptions={availableProjects}
          responsibleOptions={responsibleOptions}
          onSubmit={saveOrder}
          onClose={() => setDialogOpen(false)}
        />
      )}
    </main>
  );
}
