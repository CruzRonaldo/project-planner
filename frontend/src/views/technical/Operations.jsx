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
import PageHeader from '../../components/common/PageHeader';
import { useToast } from '../../context/ToastContext';
import NewWorkOrderDialog from './components/NewWorkOrderDialog';
import WorkOrderDetailDialog from './components/WorkOrderDetailDialog';
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
  getWorkOrderDuration,
} from '../../utils/operations';
import { createOperationsData } from '../../mocks/operationsData';
import projectsApi from '../../services/projectsApi';
import { runSafe } from '../../utils/asyncHandler';

export { NewWorkOrderDialog, WorkOrderDetailDialog };

const headingClass = 'text-slate-900 transition-colors duration-300 dark:text-white midnight:text-cyan-50';
const mutedClass = 'text-slate-500 transition-colors duration-300 dark:text-slate-400 midnight:text-cyan-600';
const ORDERS_PER_PAGE = 6;

const mapCategoryToTechnicalAreaId = (category) => {
  if (!category) return 2;
  const str = String(category).toLowerCase();
  if (str.includes('arquitectura')) return 3;
  if (str.includes('civil') || str.includes('estructuras')) return 2;
  if (str.includes('sistemas') || str.includes('instalaciones')) return 1;
  return 2;
};

export default function Operations({
  data = {},
  onChange,
  query = '',
  onQueryChange,
  canManage = false,
  projectOptions = [],
  responsibleOptions = [],
  projects = [],
}) {
  const isProduction =
    import.meta.env.PROD ||
    (typeof window !== 'undefined' &&
      !['localhost', '127.0.0.1'].includes(window.location.hostname));
  const hideMocks = import.meta.env.VITE_HIDE_MOCKS === 'true' || isProduction;

  const defaultMockData = createOperationsData();

  // Detectar si el controlador ya intentó hidratar los datos (campo hydrated)
  const hasRealData = data?.hydrated === true;

  const metrics = hasRealData
    ? (data?.metrics ?? { inProgress: 0, completed: 0, incidents: 0, efficiency: 0 })
    : hideMocks
      ? { inProgress: 0, completed: 0, incidents: 0, efficiency: 0 }
      : defaultMockData.metrics;
  const ordersList = hasRealData
    ? (data?.orders ?? [])
    : hideMocks ? [] : defaultMockData.orders;
  const rawActivities = hasRealData
    ? (data?.activities ?? [])
    : hideMocks ? [] : defaultMockData.activities;
  const activitiesList = useMemo(
    () => normalizeCriticalActivities(rawActivities),
    [rawActivities]
  );
  const alertsList = hasRealData
    ? (data?.alerts ?? [])
    : hideMocks ? [] : defaultMockData.alerts;
  const qualityList = hasRealData
    ? (data?.qualityChecks ?? [])
    : hideMocks ? [] : defaultMockData.qualityChecks;

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
  const [selectedDetailOrder, setSelectedDetailOrder] = useState(null);
  const [feedback, setFeedback] = useState('');
  const { showToast } = useToast();

  const resolveProjectId = (projectStr) => {
    if (!projectStr) return projects[0]?.id || 1;
    const found = projects.find(
      (p) =>
        p.code === projectStr ||
        `${p.name} (${p.code})` === projectStr ||
        p.name === projectStr ||
        String(p.id) === String(projectStr)
    );
    return found?.id || projects[0]?.id || 1;
  };

  const handleUpdateOrderStatus = (orderId, nextStatus) => {
    const numericId = String(orderId).replace(/^order-/, '');
    const statusMap = {
      completed: 'DONE',
      'in-progress': 'IN_PROGRESS',
      planned: 'TODO',
    };
    const backendStatus = statusMap[nextStatus] || 'IN_PROGRESS';
    projectsApi
      .updateTask(numericId, {
        status: backendStatus,
        progress: nextStatus === 'completed' ? 100 : 50,
      })
      .catch(console.warn);

    const prevOrder = (ordersList || []).find((o) => o.id === orderId);
    const wasCompleted = prevOrder?.status === 'completed';
    const isNowCompleted = nextStatus === 'completed';

    const updatedOrders = (ordersList || []).map((order) =>
      order.id === orderId
        ? {
            ...order,
            status: nextStatus,
            progress: nextStatus === 'completed' ? 100 : (order.progress === 100 ? 50 : order.progress),
          }
        : order
    );

    let nextMetrics = { ...(metrics || {}) };
    if (!wasCompleted && isNowCompleted) {
      nextMetrics = {
        ...nextMetrics,
        inProgress: Math.max(0, (nextMetrics.inProgress || 0) - 1),
        completed: (nextMetrics.completed || 0) + 1,
      };
    } else if (wasCompleted && !isNowCompleted) {
      nextMetrics = {
        ...nextMetrics,
        inProgress: (nextMetrics.inProgress || 0) + 1,
        completed: Math.max(0, (nextMetrics.completed || 0) - 1),
      };
    }

    const updated = { ...(data || {}), orders: updatedOrders, metrics: nextMetrics };
    onChange(updated);
    if (selectedDetailOrder && selectedDetailOrder.id === orderId) {
      setSelectedDetailOrder((prev) => ({
        ...prev,
        status: nextStatus,
        progress: nextStatus === 'completed' ? 100 : (prev.progress === 100 ? 50 : prev.progress),
      }));
    }
    const label = nextStatus === 'completed' ? 'Completada' : 'En progreso';
    showToast({
      title: 'Orden Actualizada',
      message: `La orden fue actualizada a **${label}**.`,
      type: 'success',
    });
  };

  const handleCompleteAndNext = (currentOrderId, nextOrderId) => {
    const currentNumericId = String(currentOrderId).replace(/^order-/, '');
    const nextNumericId = String(nextOrderId).replace(/^order-/, '');

    projectsApi.updateTask(currentNumericId, { status: 'DONE', progress: 100 }).catch(console.warn);
    if (nextNumericId) {
      projectsApi.updateTask(nextNumericId, { status: 'IN_PROGRESS', progress: 15 }).catch(console.warn);
    }

    const currentOrder = (ordersList || []).find((o) => o.id === currentOrderId);
    const nextOrderObj = (ordersList || []).find((o) => o.id === nextOrderId);

    const updatedOrders = (ordersList || []).map((order) => {
      if (order.id === currentOrderId) {
        return { ...order, status: 'completed', progress: 100 };
      }
      if (order.id === nextOrderId) {
        return {
          ...order,
          status: 'in-progress',
          progress: order.progress > 0 ? order.progress : 15,
        };
      }
      return order;
    });

    const nextMetrics = {
      ...(metrics || {}),
      completed: (metrics?.completed || 0) + 1,
    };

    const updated = { ...(data || {}), orders: updatedOrders, metrics: nextMetrics };
    onChange(updated);

    if (nextOrderObj) {
      setSelectedDetailOrder({
        ...nextOrderObj,
        status: 'in-progress',
        progress: nextOrderObj.progress > 0 ? nextOrderObj.progress : 15,
      });
    } else {
      setSelectedDetailOrder(null);
    }

    showToast({
      title: 'Flujo de Tareas Actualizado',
      message: `Orden **${currentOrder?.code || ''}** completada. Se activó la siguiente orden **${nextOrderObj?.code || ''}** (${nextOrderObj?.title || ''}).`,
      type: 'success',
    });
  };

  const availableProjects = useMemo(() => {
    const fromOrders = (ordersList || []).map((order) => order.project).filter(Boolean);
    const fromProps = projectOptions.length > 0 || hideMocks ? projectOptions : operationalProjects;
    return Array.from(new Set([...fromOrders, ...fromProps]));
  }, [ordersList, projectOptions, hideMocks]);
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

  const saveOrder = async (draft) => {
    const projectId = resolveProjectId(draft.project);
    const categoryId = mapCategoryToTechnicalAreaId(draft.area);
    const foundResp = responsibleOptions.find((r) => r.name === draft.responsible);
    const assignedToId = foundResp?.dbId ?? (typeof foundResp?.id === 'number' ? foundResp.id : null);
    const duration = getWorkOrderDuration(draft.startDate, draft.endDate) || 1;

    const payload = {
      project: projectId,
      category: categoryId,
      assigned_to: assignedToId || null,
      title: draft.title,
      description: draft.description || '',
      start_date: draft.startDate,
      end_date: draft.endDate,
      duration_days: duration,
      is_critical_path: Boolean(draft.critical),
      tolerance_days: Number(draft.tolerance) || 7,
      status: 'TODO',
      progress: 0,
    };

    const [createdTask] = await runSafe(
      () => projectsApi.createTask(payload),
      {
        showToast,
        successTitle: 'Orden Emitida',
        successMessage: `Orden ${draft.title} guardada en el servidor.`,
      }
    );

    let updated;
    if (createdTask) {
      const currentOrders = data?.orders || [];
      const newOrder = {
        id: `order-${createdTask.id}`,
        code: `#${100 + Number(createdTask.id)}`,
        project: draft.project,
        type: draft.type || (createdTask.category_name ? `Inspección ${createdTask.category_name}` : 'Operación técnica'),
        title: createdTask.title || draft.title,
        area: draft.area || createdTask.category_name || 'Operaciones',
        responsible: draft.responsible || createdTask.assigned_to_name || 'Personal Técnico',
        startDate: createdTask.start_date || draft.startDate,
        endDate: createdTask.end_date || draft.endDate,
        priority: draft.priority || (createdTask.is_critical_path ? 'high' : 'medium'),
        status: 'planned',
        critical: Boolean(draft.critical),
        tolerance: Number(draft.tolerance) || 7,
        documentUrl: draft.documentUrl || '',
        description: draft.description || '',
        progress: 0,
        duration,
      };
      updated = {
        ...(data || {}),
        orders: [newOrder, ...currentOrders],
        metrics: {
          ...(data?.metrics || {}),
          inProgress: data?.metrics?.inProgress ?? 0,
        },
      };
    } else {
      updated = createWorkOrder(data, draft);
    }

    onChange(updated);
    setDialogOpen(false);
    setOrderFilter('all');
    setProjectFilter('all');
    const msg = `Orden ${updated.orders[0].code} emitida y añadida al panel operativo.`;
    setFeedback(msg);
    if (!createdTask) {
      showToast({
        title: 'Orden Emitida',
        message: msg,
        type: 'success',
      });
    }
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
          {canManage && (
            <div className="flex flex-wrap items-center gap-2">
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
            </div>
          )}
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
            availableProjects={availableProjects}
            projectFilter={projectFilter}
            setProjectFilter={setProjectFilter}
            orderFilter={orderFilter}
            setOrderFilter={setOrderFilter}
            sortOrder={sortOrder}
            onSortChange={(nextSort) => {
              setSortOrder(nextSort);
              setOrderPageSelection((prev) => ({ ...prev, page: 1 }));
            }}
            sortCategories={operationsSortCategories}
            onViewOrder={(order) => setSelectedDetailOrder(order)}
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

      {selectedDetailOrder && (
        <WorkOrderDetailDialog
          order={selectedDetailOrder}
          ordersList={ordersList}
          onClose={() => setSelectedDetailOrder(null)}
          onUpdateStatus={handleUpdateOrderStatus}
          onCompleteAndNext={handleCompleteAndNext}
          canManage={canManage}
        />
      )}
    </main>
  );
}
