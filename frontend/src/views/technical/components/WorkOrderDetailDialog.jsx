import React, { useMemo } from 'react';
import {
  FileText,
  User,
  Calendar,
  Building2,
  Layers,
  AlertTriangle,
  ExternalLink,
  CheckCircle2,
  Clock,
  RotateCcw,
  ArrowRight,
} from 'lucide-react';
import ModalDialog from '../../../components/common/ModalDialog';
import StatusBadge from '../../../components/common/StatusBadge';
import FormattedAuditText from '../../../components/common/FormattedAuditText';
import {
  labelClass,
  nestedClass,
} from '../../../constants/themeClasses';
import {
  workOrderPriorities,
  workOrderStatuses,
} from '../../../constants/operations';
import { getWorkOrderDuration } from '../../../utils/operations';

/**
 * Modal interactivo para visualizar el detalle técnico completo de una orden de trabajo,
 * verificar su ruta crítica, planos en Google Drive y actualizar su estado operativo.
 *
 * @param {Object} props
 * @param {Object} props.order - Datos completos de la orden de trabajo
 * @param {Function} props.onClose - Cierra el diálogo
 * @param {Array<Object>} [props.ordersList=[]] - Lista completa de órdenes para detectar continuidad
 * @param {Function} [props.onUpdateStatus] - Callback para alternar estado (orderId, newStatus)
 * @param {Function} [props.onCompleteAndNext] - Callback para completar la actual e iniciar la siguiente (currentId, nextId)
 * @param {boolean} [props.canManage=false] - Permiso para mutar estado
 */
export default function WorkOrderDetailDialog({
  order,
  ordersList = [],
  onClose,
  onUpdateStatus,
  onCompleteAndNext,
  canManage = false,
}) {
  if (!order) return null;

  const durationDays = getWorkOrderDuration(order.startDate, order.endDate);
  const isCompleted = order.status === 'completed';
  const hasDriveLink = Boolean(order.documentUrl && order.documentUrl.trim());

  // Detectar inteligentemente si existe una siguiente orden en cola para este trabajador o proyecto
  const nextOrder = useMemo(() => {
    if (!ordersList || ordersList.length === 0 || !order) return null;
    const candidates = ordersList.filter(
      (candidate) => candidate.id !== order.id && candidate.status !== 'completed'
    );
    // 1. Mismo responsable y mismo proyecto
    const sameBoth = candidates.find(
      (c) =>
        c.responsible &&
        c.responsible === order.responsible &&
        c.project &&
        (c.project === order.project || c.project.split(' (')[0] === order.project.split(' (')[0])
    );
    if (sameBoth) return { ...sameBoth, matchReason: 'Mismo responsable y proyecto' };

    // 2. Mismo responsable en otro proyecto
    const sameResponsible = candidates.find(
      (c) => c.responsible && c.responsible === order.responsible
    );
    if (sameResponsible) return { ...sameResponsible, matchReason: `Mismo responsable (${order.responsible})` };

    // 3. Mismo proyecto con otro responsable
    const sameProject = candidates.find(
      (c) =>
        c.project &&
        (c.project === order.project || c.project.split(' (')[0] === order.project.split(' (')[0])
    );
    if (sameProject) return { ...sameProject, matchReason: `Mismo proyecto (${order.project.split(' (')[0]})` };

    return null;
  }, [ordersList, order]);

  const handleToggleComplete = () => {
    if (onUpdateStatus) {
      const nextStatus = isCompleted ? 'in-progress' : 'completed';
      onUpdateStatus(order.id, nextStatus);
    }
  };

  return (
    <ModalDialog
      isOpen={true}
      onClose={onClose}
      showFooter={false}
      title={`Orden ${order.code}: ${order.title}`}
      subtitle={`${order.project} • ${order.area}`}
      icon={<FileText size={20} />}
      maxWidth="max-w-2xl"
    >
      <div className="space-y-4">
        {/* Cabecera de estado, prioridad y ruta crítica */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 rounded-lg border border-slate-200 bg-slate-50/70 p-3 transition-colors duration-300 dark:border-[#30363d] dark:bg-[#0d1117] midnight:border-cyan-800/40 midnight:bg-[#050B14]">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs font-bold text-slate-900 dark:text-cyan-400 midnight:text-cyan-300">
              {order.code}
            </span>
            <StatusBadge status={order.priority} items={workOrderPriorities} size="sm" />
            <StatusBadge status={order.status} items={workOrderStatuses} size="sm" />
          </div>

          {order.critical && (
            <div className="flex items-center gap-1.5 rounded-full bg-red-100 px-2.5 py-1 text-[10px] font-bold text-red-700 dark:bg-red-950/40 dark:text-red-400 midnight:bg-red-950/60 midnight:text-red-300">
              <AlertTriangle size={12} />
              <span>Ruta Crítica Activa</span>
            </div>
          )}
        </div>

        {/* Ficha técnica en cuadrícula */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {/* Proyecto */}
          <div className={`p-3 ${nestedClass}`}>
            <span className={`flex items-center gap-1.5 ${labelClass}`}>
              <Building2 size={13} />
              Proyecto Asociado
            </span>
            <p className="mt-1 text-xs font-semibold text-slate-800 dark:text-slate-100 midnight:text-cyan-50">
              {order.project}
            </p>
          </div>

          {/* Responsable */}
          <div className={`p-3 ${nestedClass}`}>
            <span className={`flex items-center gap-1.5 ${labelClass}`}>
              <User size={13} />
              Responsable de Campo
            </span>
            <p className="mt-1 text-xs font-semibold text-slate-800 dark:text-slate-100 midnight:text-cyan-50">
              {order.responsible || 'Sin responsable asignado'}
            </p>
          </div>

          {/* Área técnica y tipo */}
          <div className={`p-3 ${nestedClass}`}>
            <span className={`flex items-center gap-1.5 ${labelClass}`}>
              <Layers size={13} />
              Especialidad y Tipo
            </span>
            <p className="mt-1 text-xs font-semibold text-slate-800 dark:text-slate-100 midnight:text-cyan-50">
              {order.type} <span className="font-normal text-slate-500 dark:text-slate-400">({order.area})</span>
            </p>
          </div>

          {/* Periodo y Duración */}
          <div className={`p-3 ${nestedClass}`}>
            <span className={`flex items-center gap-1.5 ${labelClass}`}>
              <Calendar size={13} />
              Plazo de Ejecución
            </span>
            <p className="mt-1 text-xs font-semibold text-slate-800 dark:text-slate-100 midnight:text-cyan-50">
              {order.startDate || '—'} → {order.endDate || '—'}
              {durationDays ? (
                <span className="ml-1.5 font-normal text-cyan-600 dark:text-cyan-400">
                  ({durationDays} {durationDays === 1 ? 'día' : 'días'})
                </span>
              ) : null}
            </p>
          </div>
        </div>

        {/* Progreso y Tolerancia de Holgura */}
        <div className={`p-3.5 ${nestedClass}`}>
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-slate-700 dark:text-slate-200 midnight:text-cyan-100">
              Avance Estimado
            </span>
            <span className="font-bold text-cyan-700 dark:text-cyan-400 midnight:text-cyan-300">
              {order.progress ?? (isCompleted ? 100 : 0)}%
            </span>
          </div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800 midnight:bg-cyan-950/80">
            <div
              className={`h-full transition-all duration-500 ${
                isCompleted
                  ? 'bg-emerald-500'
                  : 'bg-gradient-to-r from-cyan-500 to-blue-600'
              }`}
              style={{ width: `${Math.min(100, Math.max(0, order.progress ?? (isCompleted ? 100 : 0)))}%` }}
            />
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 midnight:text-cyan-500/80">
            <span>Tolerancia de holgura técnica:</span>
            <span className="font-semibold">{order.tolerance ?? 0} días hábiles</span>
          </div>
        </div>

        {/* Instrucciones de Terreno */}
        <div className={`p-3.5 ${nestedClass}`}>
          <span className={`block font-medium ${labelClass}`}>
            Instrucciones y Especificaciones de Campo
          </span>
          <div className="mt-1.5 text-xs leading-relaxed text-slate-700 dark:text-slate-300 midnight:text-cyan-100/90 whitespace-pre-line">
            <FormattedAuditText text={order.description || 'Sin instrucciones adicionales registradas.'} />
          </div>
        </div>

        {/* Plano o Documento Vinculado */}
        <div className={`flex flex-wrap items-center justify-between gap-3 p-3 ${nestedClass}`}>
          <div className="min-w-0">
            <span className={`block ${labelClass}`}>Documentación / Plano de Ingeniería</span>
            <span className="truncate text-xs text-slate-600 dark:text-slate-400 midnight:text-cyan-500/90">
              {hasDriveLink ? 'Enlace a Google Drive verificado' : 'Sin enlace a Google Drive'}
            </span>
          </div>
          {hasDriveLink ? (
            <a
              href={order.documentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-cyan-300 bg-cyan-50 px-3 py-1.5 text-xs font-semibold text-cyan-700 transition-colors hover:bg-cyan-100 dark:border-cyan-500/30 dark:bg-cyan-500/10 dark:text-cyan-300 dark:hover:bg-cyan-500/20 midnight:border-cyan-700 midnight:bg-cyan-900/30 midnight:text-cyan-300"
            >
              <span>Abrir en Drive</span>
              <ExternalLink size={13} />
            </a>
          ) : (
            <span className="text-[11px] italic text-slate-400 dark:text-slate-500">
              No adjunto
            </span>
          )}
        </div>

        {/* Siguiente tarea en cola si existe */}
        {nextOrder && (
          <div className="rounded-lg border border-cyan-200/80 bg-cyan-50/60 p-3 transition-colors duration-300 dark:border-cyan-500/25 dark:bg-cyan-950/20 midnight:border-cyan-800/40 midnight:bg-cyan-950/30">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 font-bold text-cyan-800 dark:text-cyan-300 midnight:text-cyan-200">
                <ArrowRight size={13} />
                Siguiente tarea en cola ({nextOrder.matchReason})
              </span>
              <span className="font-mono text-[11px] font-bold text-cyan-700 dark:text-cyan-400">
                {nextOrder.code}
              </span>
            </div>
            <p className="mt-1 text-xs font-semibold text-slate-800 dark:text-slate-100 midnight:text-cyan-50 truncate">
              {nextOrder.title} <span className="font-normal text-slate-500 text-[11px]">({nextOrder.type})</span>
            </p>
          </div>
        )}

        {/* Acciones del pie del modal */}
        <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3 border-t border-slate-200 pt-3 dark:border-[#30363d] midnight:border-cyan-900/40">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100 dark:border-[#30363d] dark:bg-[#161b22] dark:text-slate-300 dark:hover:bg-white/5 midnight:border-cyan-800/40 midnight:bg-[#0a1120] midnight:text-cyan-200"
          >
            Cerrar Ficha
          </button>

          {canManage && (
            <div className="flex flex-wrap items-center gap-2">
              {/* Si hay siguiente orden y esta orden NO está completada */}
              {nextOrder && !isCompleted && onCompleteAndNext ? (
                <>
                  <button
                    type="button"
                    onClick={handleToggleComplete}
                    className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-emerald-600 bg-emerald-50 px-3.5 py-2 text-xs font-semibold text-emerald-700 transition-colors hover:bg-emerald-100 dark:border-emerald-500/40 dark:bg-emerald-950/30 dark:text-emerald-300 dark:hover:bg-emerald-900/40"
                  >
                    <CheckCircle2 size={14} />
                    <span>Solo completar</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onCompleteAndNext(order.id, nextOrder.id)}
                    className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-blue-500 midnight:bg-cyan-600 midnight:hover:bg-cyan-500"
                  >
                    <CheckCircle2 size={14} />
                    <span>Completar y pasar a siguiente</span>
                    <ArrowRight size={14} />
                  </button>
                </>
              ) : isCompleted ? (
                <>
                  <button
                    type="button"
                    onClick={handleToggleComplete}
                    className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-amber-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-amber-500 dark:bg-amber-500 dark:hover:bg-amber-400"
                  >
                    <RotateCcw size={14} />
                    <span>Reabrir Orden</span>
                  </button>

                  {nextOrder && onCompleteAndNext && (
                    <button
                      type="button"
                      onClick={() => onCompleteAndNext(order.id, nextOrder.id)}
                      className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-blue-500 midnight:bg-cyan-600 midnight:hover:bg-cyan-500"
                    >
                      <span>Iniciar siguiente ({nextOrder.code})</span>
                      <ArrowRight size={14} />
                    </button>
                  )}
                </>
              ) : (
                <button
                  type="button"
                  onClick={handleToggleComplete}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-400"
                >
                  <CheckCircle2 size={14} />
                  <span>Marcar como Completada</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </ModalDialog>
  );
}
