import React, { useState } from 'react';
import {
  AlertCircle,
  CalendarDays,
  Check,
  Download,
  Pencil,
  RefreshCw,
  RotateCcw,
} from 'lucide-react';
import { personnelStatuses } from '../../constants/humanResources';
import {
  filterPersonnel,
  getUpcomingIncidentAlerts,
  summarizePersonnel,
  updatePersonnel,
} from '../../utils/humanResources';
import { downloadPersonnelWorkbook } from '../../utils/personnelWorkbook';
import { useToast } from '../../context/ToastContext';
import { PersonnelIncidentDialog } from './components/PersonnelIncidentDialog';
import { PersonnelEditorModal } from './components/PersonnelEditorModal';
import { IncidentActionDialog } from './components/IncidentActionDialog';
import KpiCard from '../../components/common/KpiCard';
import Button from '../../components/common/Button';
import Pagination from '../../components/common/Pagination';
import MemberAvatar from '../../components/common/MemberAvatar';

export { PersonnelIncidentDialog };

const panelClass = 'min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-colors duration-300 dark:border-[#30363d] dark:bg-[#161b22] dark:shadow-none midnight:border-cyan-900/30 midnight:bg-[#0a1120]';
const iconButtonClass = 'rounded p-1.5 text-slate-500 transition-colors duration-300 hover:bg-slate-100 hover:text-cyan-700 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-cyan-400 midnight:text-cyan-500/70 midnight:hover:bg-cyan-900/20 midnight:hover:text-cyan-300';
const pageSize = 8;
const INCIDENTS_PAGE_SIZE = 5;
const HISTORY_PAGE_SIZE = 5;

const statusThemeStyles = {
  active: {
    selected: 'border-emerald-600 bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-500/40 dark:border-emerald-400 dark:bg-emerald-500 dark:text-slate-950 dark:ring-emerald-400/50 midnight:border-emerald-400 midnight:bg-emerald-500/25 midnight:text-emerald-200 midnight:ring-2 midnight:ring-emerald-400/50',
    idle: 'border-emerald-200 bg-emerald-50/70 text-emerald-700 hover:border-emerald-300 hover:bg-emerald-100/70 dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-400 dark:hover:bg-emerald-500/15 midnight:border-emerald-500/30 midnight:bg-emerald-500/10 midnight:text-emerald-300 midnight:hover:bg-emerald-500/20',
    badgeSelected: 'bg-white/25 text-white dark:bg-slate-950/30 dark:text-slate-950 midnight:bg-emerald-400/20 midnight:text-emerald-100',
    badgeIdle: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300 midnight:bg-emerald-500/20 midnight:text-emerald-300',
    cardSelected: 'border-emerald-500 bg-emerald-50/50 ring-2 ring-emerald-500/30 dark:border-emerald-400 dark:bg-emerald-950/20 dark:ring-emerald-400/30 midnight:border-emerald-400 midnight:bg-emerald-950/30 midnight:ring-emerald-400/40',
  },
  standby: {
    selected: 'border-amber-600 bg-amber-600 text-white shadow-sm ring-2 ring-amber-500/40 dark:border-amber-400 dark:bg-amber-500 dark:text-slate-950 dark:ring-amber-400/50 midnight:border-amber-400 midnight:bg-amber-500/25 midnight:text-amber-200 midnight:ring-2 midnight:ring-amber-400/50',
    idle: 'border-amber-200 bg-amber-50/70 text-amber-700 hover:border-amber-300 hover:bg-amber-100/70 dark:border-amber-500/25 dark:bg-amber-500/10 dark:text-amber-400 dark:hover:bg-amber-500/15 midnight:border-amber-500/30 midnight:bg-amber-500/10 midnight:text-amber-300 midnight:hover:bg-amber-500/20',
    badgeSelected: 'bg-white/25 text-white dark:bg-slate-950/30 dark:text-slate-950 midnight:bg-amber-400/20 midnight:text-amber-100',
    badgeIdle: 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300 midnight:bg-amber-500/20 midnight:text-amber-300',
    cardSelected: 'border-amber-500 bg-amber-50/50 ring-2 ring-amber-500/30 dark:border-amber-400 dark:bg-amber-950/20 dark:ring-amber-400/30 midnight:border-amber-400 midnight:bg-amber-950/30 midnight:ring-amber-400/40',
  },
  support: {
    selected: 'border-blue-600 bg-blue-600 text-white shadow-sm ring-2 ring-blue-500/40 dark:border-blue-400 dark:bg-blue-500 dark:text-slate-950 dark:ring-blue-400/50 midnight:border-cyan-400 midnight:bg-cyan-500/25 midnight:text-cyan-200 midnight:ring-2 midnight:ring-cyan-400/50',
    idle: 'border-blue-200 bg-blue-50/70 text-blue-700 hover:border-blue-300 hover:bg-blue-100/70 dark:border-blue-500/25 dark:bg-blue-500/10 dark:text-blue-400 dark:hover:bg-blue-500/15 midnight:border-cyan-500/30 midnight:bg-cyan-500/10 midnight:text-cyan-300 midnight:hover:bg-cyan-500/20',
    badgeSelected: 'bg-white/25 text-white dark:bg-slate-950/30 dark:text-slate-950 midnight:bg-cyan-400/20 midnight:text-cyan-100',
    badgeIdle: 'bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-300 midnight:bg-cyan-500/20 midnight:text-cyan-300',
    cardSelected: 'border-blue-500 bg-blue-50/50 ring-2 ring-blue-500/30 dark:border-blue-400 dark:bg-blue-950/20 dark:ring-blue-400/30 midnight:border-cyan-400 midnight:bg-cyan-950/30 midnight:ring-cyan-400/40',
  },
  all: {
    cardSelected: 'border-cyan-500 bg-cyan-50/50 ring-2 ring-cyan-500/30 dark:border-cyan-400 dark:bg-cyan-950/20 dark:ring-cyan-400/30 midnight:border-cyan-400 midnight:bg-cyan-950/30 midnight:ring-cyan-400/40',
  },
};

const workflowStatuses = {
  pending: {
    label: 'Pendiente',
    className: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/25 dark:bg-amber-500/10 dark:text-amber-300',
  },
  approved: {
    label: 'Aprobada',
    className: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-300',
  },
  rejected: {
    label: 'Rechazada',
    className: 'border-red-200 bg-red-50 text-red-700 dark:border-red-500/25 dark:bg-red-500/10 dark:text-red-300',
  },
  finalized: {
    label: 'Finalizada',
    className: 'border-slate-200 bg-slate-100 text-slate-600 dark:border-slate-500/25 dark:bg-slate-500/10 dark:text-slate-300',
  },
};



function StatusBadge({ status }) {
  const details = personnelStatuses.find((item) => item.id === status) || {
    label: status || 'Sin estado',
    className: 'border-slate-200 bg-slate-100 text-slate-600 dark:border-slate-500/25 dark:bg-slate-500/10 dark:text-slate-400',
  };
  return <span className={`inline-flex whitespace-nowrap rounded border px-2 py-1 text-[10px] font-semibold ${details.className}`}>{details.label}</span>;
}

function WorkflowBadge({ status }) {
  const details = workflowStatuses[status] || workflowStatuses.pending;
  return <span className={`inline-flex whitespace-nowrap rounded border px-2 py-1 text-[10px] font-semibold ${details.className}`}>{details.label}</span>;
}

function formatDisplayDate(value, options = { day: '2-digit', month: 'short', year: 'numeric' }) {
  if (!value) return 'Sin fecha';
  const parsed = new Date(`${String(value).split('T')[0]}T12:00:00`);
  return Number.isNaN(parsed.getTime()) ? String(value) : parsed.toLocaleDateString('es-PE', options);
}

export default function HumanResources({
  data = {},
  onChange,
  onPersistMember,
  onCreateIncident,
  onTransitionIncident,
  onRefreshRecords,
  query = '',
  onQueryChange,
  canManage = false,
  projectOptions = [],
  syncLoading = false,
  syncError = '',
  syncedAt = null,
}) {
  const members = data?.members || [];
  const history = data?.history || [];
  const incidents = data?.incidents || [];
  const [selectedStatuses, setSelectedStatuses] = useState([]);
  const isAll = selectedStatuses.length === 0 || selectedStatuses.length >= personnelStatuses.length;
  const statusFilterKey = isAll ? 'all' : [...selectedStatuses].sort().join(',');

  const toggleStatus = (statusId) => {
    if (statusId === 'all') {
      setSelectedStatuses([]);
      return;
    }
    setSelectedStatuses((current) => {
      if (current.length === 0) {
        return [statusId];
      }
      let next;
      if (current.includes(statusId)) {
        next = current.filter((id) => id !== statusId);
      } else {
        next = [...current, statusId];
      }
      if (next.length === 0 || next.length >= personnelStatuses.length) {
        return [];
      }
      return next;
    });
  };

  const [pageSelection, setPageSelection] = useState({ query: '', status: 'all', page: 1 });
  const [incidentPageSelection, setIncidentPageSelection] = useState({ query: '', page: 1 });
  const [historyPageSelection, setHistoryPageSelection] = useState({ query: '', page: 1 });
  const [editing, setEditing] = useState(null);
  const [incidentDialogOpen, setIncidentDialogOpen] = useState(false);
  const [incidentAction, setIncidentAction] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [feedbackType, setFeedbackType] = useState('success');
  const [isExportingMatrix, setIsExportingMatrix] = useState(false);
  const { showToast } = useToast();
  const [isRefreshingRecords, setIsRefreshingRecords] = useState(false);
  const [refreshState, setRefreshState] = useState('idle');

  const summary = summarizePersonnel(members);
  const filteredMembers = filterPersonnel(members, query, isAll ? 'all' : selectedStatuses);
  const totalPages = Math.max(1, Math.ceil(filteredMembers.length / pageSize));
  const page = pageSelection.query === query && pageSelection.status === statusFilterKey ? Math.min(pageSelection.page, totalPages) : 1;
  const visibleMembers = filteredMembers.slice((page - 1) * pageSize, page * pageSize);
  const editingMember = editing && members.find((member) => member.id === editing.id);

  const totalIncidentPages = Math.max(1, Math.ceil(incidents.length / INCIDENTS_PAGE_SIZE));
  const safeIncidentPage =
    incidentPageSelection.query === query
      ? Math.min(incidentPageSelection.page, totalIncidentPages)
      : 1;
  const visibleIncidents = incidents.slice(
    (safeIncidentPage - 1) * INCIDENTS_PAGE_SIZE,
    safeIncidentPage * INCIDENTS_PAGE_SIZE
  );

  const totalHistoryPages = Math.max(1, Math.ceil(history.length / HISTORY_PAGE_SIZE));
  const safeHistoryPage =
    historyPageSelection.query === query
      ? Math.min(historyPageSelection.page, totalHistoryPages)
      : 1;
  const visibleHistory = history.slice(
    (safeHistoryPage - 1) * HISTORY_PAGE_SIZE,
    safeHistoryPage * HISTORY_PAGE_SIZE
  );

  const summaryCards = [
    { id: 'all', label: 'Total personal', value: summary.total, dotClass: 'bg-slate-400' },
    ...personnelStatuses.map((status) => ({ ...status, label: status.summaryLabel, value: summary[status.id] || 0 })),
  ];
  const upcomingAlerts = getUpcomingIncidentAlerts(incidents);

  const openEditor = (member, mode = 'status') => {
    if (!canManage) return;
    setFeedback('');
    setFeedbackType('success');
    setEditing({ id: member.id, mode });
  };

  const saveMember = async (memberId, draft) => {
    const previousData = data;
    const updatedData = updatePersonnel(data, memberId, draft);
    if (updatedData === data) {
      setEditing(null);
      setFeedbackType('success');
      setFeedback('No había cambios que guardar.');
      return;
    }

    onChange({ ...updatedData, history });
    try {
      if (onPersistMember) await onPersistMember(memberId, draft);
      setEditing(null);
      setFeedbackType('success');
      setFeedback('Cambio guardado correctamente en el sistema.');
      showToast({
        title: 'Personal Actualizado',
        message: 'Los datos del integrante se guardaron correctamente en el sistema.',
        type: 'success',
      });
    } catch (error) {
      onChange(previousData);
      throw error;
    }
  };

  const saveIncident = async (draft) => {
    if (!onCreateIncident) throw new Error('No se configuró la conexión para registrar incidencias.');
    await onCreateIncident(draft);
    const member = members.find((item) => item.id === draft.memberId);
    setIncidentDialogOpen(false);
    setEditing(null);
    const incidentMsg = `Incidencia registrada${member ? ` para ${member.name}` : ''} y enviada a revisión.`;
    setFeedbackType('success');
    setFeedback(incidentMsg);
    showToast({
      title: 'Incidencia Registrada',
      message: incidentMsg,
      type: 'success',
    });
  };

  const submitIncidentAction = async (incidentId, action, comment) => {
    if (!onTransitionIncident) throw new Error('No se configuró el flujo de aprobación de incidencias.');
    await onTransitionIncident(incidentId, action, comment);
    setIncidentAction(null);
    setFeedbackType('success');
    const labels = { approve: 'aprobada', reject: 'rechazada', finalize: 'finalizada' };
    const actionMsg = `Incidencia ${labels[action] || 'actualizada'} correctamente.`;
    setFeedback(actionMsg);
    showToast({
      title: 'Flujo de Incidencias',
      message: actionMsg,
      type: 'success',
    });
  };

  const refreshRecords = async () => {
    if (!onRefreshRecords || isRefreshingRecords) return;
    setIsRefreshingRecords(true);
    setRefreshState('loading');
    try {
      await onRefreshRecords();
      setRefreshState('success');
      setTimeout(() => setRefreshState('idle'), 2500);
    } catch (error) {
      setRefreshState('error');
      setTimeout(() => setRefreshState('idle'), 3500);
    } finally {
      setIsRefreshingRecords(false);
    }
  };

  const exportMatrix = async () => {
    if (isExportingMatrix) return;
    setIsExportingMatrix(true);
    setFeedback('');
    setFeedbackType('success');
    try {
      await downloadPersonnelWorkbook(members);
      const exportMsg = `Matriz de Recursos Humanos exportada en Excel con ${members.length} ${members.length === 1 ? 'integrante' : 'integrantes'}.`;
      setFeedback(exportMsg);
      showToast({
        title: 'Matriz Exportada',
        message: exportMsg,
        type: 'success',
      });
    } catch (error) {
      console.error('Error al exportar matriz de personal:', error);
      const errMsg = 'No se pudo generar el archivo Excel en este momento. Inténtalo nuevamente.';
      setFeedbackType('error');
      setFeedback(errMsg);
      showToast({
        title: 'Error de Exportación',
        message: errMsg,
        type: 'error',
      });
    } finally {
      setIsExportingMatrix(false);
    }
  };

  return (
    <main className="min-w-0 flex-1 overflow-y-auto bg-slate-50 p-4 text-slate-900 transition-colors duration-300 dark:bg-[#0d1117] dark:text-slate-100 midnight:bg-[#050B14] midnight:text-cyan-50 md:p-6 lg:p-8">
      <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-5 pb-8">
        <header className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 transition-colors duration-300 dark:text-white midnight:text-cyan-50 md:text-[28px]">Recursos Humanos y Estados</h1>
            <p className="mt-1 text-sm text-slate-500 transition-colors duration-300 dark:text-slate-400 midnight:text-cyan-500/70">Administración de disponibilidad y asignación del personal</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {onRefreshRecords && (
              <button
                type="button"
                onClick={refreshRecords}
                disabled={isRefreshingRecords || syncLoading}
                aria-label="Actualizar registros"
                className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2.5 text-xs font-medium transition-colors duration-300 disabled:cursor-wait disabled:opacity-60 bg-white dark:bg-[#161b22] midnight:bg-[#0a1120] ${
                  refreshState === 'success'
                    ? 'border-emerald-500/60 text-emerald-700 dark:border-emerald-500/40 dark:text-emerald-400 midnight:border-emerald-500/40 midnight:text-emerald-300'
                    : refreshState === 'error'
                    ? 'border-red-500/60 text-red-700 dark:border-red-500/40 dark:text-red-400 midnight:border-red-500/40 midnight:text-red-300'
                    : 'border-slate-300 text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:border-[#30363d] dark:text-slate-300 dark:hover:bg-white/5 dark:hover:text-white midnight:border-cyan-800/40 midnight:text-cyan-200 midnight:hover:border-cyan-700/50 midnight:hover:bg-cyan-900/30 midnight:hover:text-cyan-50'
                }`}
              >
                {refreshState === 'loading' && <RefreshCw size={15} className="animate-spin text-cyan-600 dark:text-cyan-400" />}
                {refreshState === 'success' && <Check size={15} className="text-emerald-600 dark:text-emerald-400 animate-in zoom-in-75 duration-200" />}
                {refreshState === 'error' && <AlertCircle size={15} className="text-red-600 dark:text-red-400 animate-in zoom-in-75 duration-200" />}
                {refreshState === 'idle' && <RefreshCw size={15} />}
                <span>{refreshState === 'loading' ? 'Actualizando...' : 'Actualizar'}</span>
              </button>
            )}
            {canManage ? (
              <>
                <Button
                  variant="secondary"
                  onClick={exportMatrix}
                  disabled={members.length === 0}
                  isLoading={isExportingMatrix}
                  icon={Download}
                >
                  {isExportingMatrix ? 'Generando Excel...' : 'Exportar Matriz'}
                </Button>
                <Button
                  variant="primary"
                  onClick={() => {
                    setIncidentDialogOpen(true);
                    setFeedback('');
                    setFeedbackType('success');
                  }}
                  icon={CalendarDays}
                >
                  Registrar Incidencia / Licencia
                </Button>
              </>
            ) : (
              <span className="w-fit rounded-md border border-slate-300 px-2.5 py-1.5 text-[10px] text-slate-500 transition-colors duration-300 dark:border-[#30363d] dark:text-slate-400 midnight:border-cyan-800/40 midnight:text-cyan-600">
                Vista de consulta
              </span>
            )}
          </div>
        </header>

        <section aria-label="Resumen de personal" className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
          {summaryCards.map((card) => {
            const isSelected = card.id === 'all' ? isAll : (!isAll && selectedStatuses.includes(card.id));
            const themeStyle = statusThemeStyles[card.id];
            return (
              <KpiCard
                key={card.id}
                title={card.label}
                value={card.value}
                dotClass={card.dotClass}
                isSelected={isSelected}
                selectedClass={themeStyle?.cardSelected}
                onClick={() => toggleStatus(card.id)}
                ariaLabel={`${card.label}: ${card.value}`}
              />
            );
          })}
        </section>

        {feedback && (
          <p role={feedbackType === 'error' ? 'alert' : 'status'} className={feedbackType === 'error' ? 'text-xs text-red-600 dark:text-red-400 midnight:text-red-300' : 'text-xs text-cyan-700 dark:text-cyan-300 midnight:text-cyan-300'}>
            {feedback}
          </p>
        )}
        {syncError && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400 midnight:text-red-300">{syncError}</p>}

        <div className="grid min-w-0 items-start gap-5 xl:grid-cols-[minmax(0,1.8fr)_minmax(280px,1fr)]">
          <section className={panelClass} aria-labelledby="personnel-assignment-title">
            <div className="flex flex-wrap items-center justify-between gap-3 px-4 pt-5 sm:px-5">
              <h2 id="personnel-assignment-title" className="text-base font-semibold text-slate-900 transition-colors duration-300 dark:text-white midnight:text-cyan-50">Asignación de Personal</h2>
              <div className="flex items-center gap-3">
                {(!syncedAt || syncLoading || syncError) && (
                  <span className="inline-flex items-center gap-1.5 text-[9px] text-cyan-700 dark:text-cyan-400 midnight:text-cyan-400">
                    <i className={`h-1.5 w-1.5 rounded-full ${syncError ? 'bg-red-400' : syncLoading ? 'bg-cyan-400 animate-pulse' : 'bg-emerald-400'}`} />
                    {syncError ? 'Error de sincronización' : syncLoading ? 'Sincronizando...' : 'Pendiente de sincronización'}
                  </span>
                )}
                {(query || !isAll) && (
                  <button type="button" onClick={() => { setSelectedStatuses([]); onQueryChange(''); }} className="inline-flex items-center gap-1.5 text-[10px] text-cyan-700 transition-colors duration-300 hover:text-cyan-600 dark:text-cyan-400 dark:hover:text-cyan-300 midnight:text-cyan-400 midnight:hover:text-cyan-200">
                    <RotateCcw size={12} /> Limpiar filtros
                  </button>
                )}
              </div>
            </div>
            <div className="mt-3 overflow-x-auto px-4 sm:px-5">
              <table className="w-full min-w-[700px] border-collapse text-left text-xs">
                <thead><tr className="border-b border-slate-200 text-[10px] text-slate-500 transition-colors duration-300 dark:border-[#30363d] midnight:border-cyan-900/30 midnight:text-cyan-600">
                  {['Nombre', 'Área Técnica', 'Proyecto Asignado', 'Estado', 'Disponibilidad', 'Acción'].map((label) => <th scope="col" key={label} className="px-2 py-3 font-semibold first:pl-0 last:pr-0">{label}</th>)}
                </tr></thead>
                <tbody>
                  {visibleMembers.map((member) => (
                    <tr key={member.id} className="border-b border-slate-200 last:border-b-0 transition-colors duration-300 hover:bg-slate-50 dark:border-[#30363d]/70 dark:hover:bg-white/[0.02] midnight:border-cyan-900/30 midnight:hover:bg-cyan-900/20">
                      <td className="whitespace-nowrap py-3.5 pr-2 font-medium text-slate-900 transition-colors duration-300 dark:text-slate-100 midnight:text-cyan-50"><span className="flex items-center gap-2"><MemberAvatar member={member} sizeClass="h-7 w-7" textClass="text-[9px]" /><span>{member.name}</span></span></td>
                      <td className="whitespace-nowrap px-2 py-3.5 text-[11px] text-slate-500 transition-colors duration-300 dark:text-slate-400 midnight:text-cyan-500/70">{member.area}</td>
                      <td className="max-w-[180px] truncate px-2 py-3.5 text-[11px] text-slate-700 transition-colors duration-300 dark:text-slate-300 midnight:text-cyan-100" title={member.project}>{member.project}</td>
                      <td className="whitespace-nowrap px-2 py-3.5"><StatusBadge status={member.status} /></td>
                      <td className="whitespace-nowrap px-2 py-3.5"><div className="flex items-center gap-2"><div className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-100 transition-colors duration-300 dark:bg-slate-800 midnight:bg-[#050B14]"><div className={`h-full ${member.availability >= 70 ? 'bg-emerald-500' : member.availability >= 30 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${member.availability}%` }} /></div><span className="font-mono text-[11px] text-slate-500 transition-colors duration-300 dark:text-slate-400 midnight:text-cyan-500/70">{member.availability}%</span></div></td>
                      <td className="whitespace-nowrap py-3.5 pl-2 text-right">
                        {canManage ? (
                          <div className="flex items-center justify-end gap-1">
                            <button type="button" onClick={() => openEditor(member, 'status')} title="Editar disponibilidad y estado" className={iconButtonClass}><Pencil size={14} /></button>
                            <button type="button" onClick={() => openEditor(member, 'project')} className="rounded border border-slate-200 px-2 py-1 text-[10px] text-slate-600 transition-colors duration-300 hover:border-cyan-400/50 hover:text-slate-900 dark:border-[#30363d] dark:text-slate-300 dark:hover:text-white midnight:border-cyan-800/40 midnight:text-cyan-200 midnight:hover:border-cyan-700/50 midnight:hover:bg-cyan-900/30 midnight:hover:text-cyan-50">Asignar</button>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-400 dark:text-slate-600 midnight:text-cyan-600">Solo lectura</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {!visibleMembers.length && <tr><td colSpan={6} className="py-12 text-center text-sm text-slate-500 dark:text-slate-400 midnight:text-cyan-500/70">No se encontró personal con estos filtros.</td></tr>}
                </tbody>
              </table>
            </div>
            <div className="border-t border-slate-200 px-4 py-3 dark:border-[#30363d] midnight:border-cyan-900/30 sm:px-5">
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                totalItems={filteredMembers.length}
                pageSize={pageSize}
                itemLabel="integrantes"
                onPageChange={(nextPage) => setPageSelection({ query, status: statusFilterKey, page: nextPage })}
              />
            </div>
          </section>

          <section className={`${panelClass} flex flex-col justify-between`} aria-labelledby="team-status-title">
            <div>
              <div className="px-4 pt-5 sm:px-5"><h2 id="team-status-title" className="text-base font-semibold text-slate-900 transition-colors duration-300 dark:text-white midnight:text-cyan-50">Estado de Equipos</h2><p className="mt-1 text-xs text-slate-500 transition-colors duration-300 dark:text-slate-400 midnight:text-cyan-500/70">Distribución rápida por disponibilidad operativa</p></div>
              <div className="mt-4 grid grid-cols-1 gap-3 px-4 sm:grid-cols-3 sm:px-5">
                {personnelStatuses.map((status) => {
                  const statusMembers = members.filter((member) => member.status === status.id);
                  const isSelected = !isAll && selectedStatuses.includes(status.id);
                  const themeStyle = statusThemeStyles[status.id];
                  return (
                    <div key={status.id} className="min-w-0">
                      <button
                        type="button"
                        onClick={() => toggleStatus(status.id)}
                        aria-pressed={isSelected}
                        className={`w-full rounded-md border px-2 py-2 text-[10px] font-semibold uppercase transition-all duration-200 flex items-center justify-between gap-1.5 ${
                          isSelected
                            ? themeStyle?.selected || status.className
                            : `${themeStyle?.idle || status.className} ${!isAll ? 'opacity-40 hover:opacity-100' : ''}`
                        }`}
                      >
                        <span className="truncate">{status.label}</span>
                        <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold ${
                          isSelected
                            ? themeStyle?.badgeSelected || 'bg-white/20 text-white'
                            : themeStyle?.badgeIdle || 'bg-black/5'
                        }`}>
                          {statusMembers.length}
                        </span>
                      </button>
                      <div className="mt-3 flex max-h-[380px] flex-col gap-2 overflow-y-auto">
                        {statusMembers.map((member) => canManage ? (
                          <button key={member.id} type="button" onClick={() => openEditor(member)} aria-label={`Editar estado de ${member.name}`} title={`${member.name} · ${member.project}`} className="truncate rounded-md border border-slate-200 bg-slate-50 px-2 py-2 text-left text-[10px] text-slate-700 transition-colors duration-300 hover:border-cyan-400/50 hover:text-slate-900 dark:border-[#30363d] dark:bg-[#0d1117] dark:text-slate-300 dark:hover:text-white midnight:border-cyan-800/40 midnight:bg-[#050B14] midnight:text-cyan-100 midnight:hover:text-cyan-50">
                            {member.name}
                          </button>
                        ) : (
                          <span key={member.id} title={`${member.name} · Vista de consulta`} className="truncate rounded-md border border-slate-200 bg-slate-50 px-2 py-2 text-left text-[10px] text-slate-700 transition-colors duration-300 dark:border-[#30363d] dark:bg-[#0d1117] dark:text-slate-300 midnight:border-cyan-800/40 midnight:bg-[#050B14] midnight:text-cyan-100">
                            {member.name}
                          </span>
                        ))}
                        {!statusMembers.length && <p className="py-2 text-center text-[10px] text-slate-400 dark:text-slate-600 midnight:text-cyan-600">Sin personal</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <footer className="mt-5 border-t border-slate-200 px-4 py-3 sm:px-5 dark:border-[#30363d] midnight:border-cyan-900/30">
              <button
                type="button"
                onClick={() => {
                  setSelectedStatuses([]);
                  setFeedback(!isAll ? 'Mostrando el balance completo de carga del personal.' : '');
                }}
                disabled={isAll}
                className={`w-full rounded py-1 text-center text-xs font-medium transition-colors duration-300 ${
                  !isAll
                    ? 'text-cyan-700 hover:text-cyan-600 dark:text-cyan-400 dark:hover:text-cyan-300 midnight:text-cyan-400 midnight:hover:text-cyan-200 underline decoration-cyan-400/40 underline-offset-4 cursor-pointer font-semibold'
                    : 'text-slate-400 dark:text-slate-500 midnight:text-cyan-600/70 cursor-default'
                }`}
              >
                {!isAll
                  ? '← Restablecer y ver balance completo'
                  : 'Ver balance de carga completo (Todos los integrantes)'}
              </button>
            </footer>
          </section>
        </div>

        {canManage && (
          <>
            <div className="grid min-w-0 items-start gap-5 xl:grid-cols-[minmax(0,1.8fr)_minmax(280px,1fr)]">
              <section className={panelClass} aria-labelledby="incidents-list-title">
                <div className="px-4 pt-5 sm:px-5">
                  <h2 id="incidents-list-title" className="text-base font-semibold text-slate-900 transition-colors duration-300 dark:text-white midnight:text-cyan-50">Incidencias y Licencias</h2>
                  <p className="mt-1 text-xs text-slate-500 transition-colors duration-300 dark:text-slate-400 midnight:text-cyan-500/70">Flujo activo de ausencias, descansos y vacaciones</p>
                </div>
                <div className="mt-3 overflow-x-auto px-4 sm:px-5">
                  <table className="w-full min-w-[700px] border-collapse text-left text-xs">
                    <thead><tr className="border-b border-slate-200 text-[10px] text-slate-500 transition-colors duration-300 dark:border-[#30363d] midnight:border-cyan-900/30 midnight:text-cyan-600">
                      {['Integrante', 'Tipo', 'Periodo / Fechas', 'Días', 'Estado Solicitud', 'Respaldo', 'Acciones'].map((label) => <th scope="col" key={label} className="px-2 py-3 font-semibold first:pl-0 last:pr-0">{label}</th>)}
                    </tr></thead>
                    <tbody>
                      {visibleIncidents.map((incident) => (
                        <tr key={incident.id} className="border-b border-slate-200 last:border-b-0 transition-colors duration-300 hover:bg-slate-50 dark:border-[#30363d]/70 dark:hover:bg-white/[0.02] midnight:border-cyan-900/30 midnight:hover:bg-cyan-900/20">
                          <td className="whitespace-nowrap py-3 pr-2 font-medium text-slate-900 transition-colors duration-300 dark:text-slate-100 midnight:text-cyan-50">{incident.memberName}</td>
                          <td className="whitespace-nowrap px-2 py-3 text-[11px] text-slate-600 transition-colors duration-300 dark:text-slate-300 midnight:text-cyan-200">{incident.typeLabel}</td>
                          <td className="whitespace-nowrap px-2 py-3 font-mono text-[11px] text-slate-500 transition-colors duration-300 dark:text-slate-400 midnight:text-cyan-600">{formatDisplayDate(incident.startDate, { day: '2-digit', month: 'short' })} → {formatDisplayDate(incident.endDate, { day: '2-digit', month: 'short' })}</td>
                          <td className="whitespace-nowrap px-2 py-3 text-[11px] text-slate-700 transition-colors duration-300 dark:text-slate-300 midnight:text-cyan-100">{incident.businessDays ?? '-'} hab / {incident.calendarDays ?? '-'} cal</td>
                          <td className="whitespace-nowrap px-2 py-3"><WorkflowBadge status={incident.workflowStatus} /></td>
                          <td className="max-w-[140px] truncate px-2 py-3 text-[11px] text-slate-500 transition-colors duration-300 dark:text-slate-400 midnight:text-cyan-600" title={incident.backupMemberName || 'Sin técnico'}>{incident.backupMemberName || 'Sin técnico'}</td>
                          <td className="whitespace-nowrap py-3 pl-2 text-right">
                            <div className="flex items-center justify-end gap-1">
                              {incident.workflowStatus === 'pending' && (
                                <>
                                  <button type="button" onClick={() => setIncidentAction({ incident, action: 'approve' })} className="rounded bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-300 dark:hover:bg-emerald-500/20 midnight:bg-emerald-500/15 midnight:text-emerald-300 midnight:hover:bg-emerald-500/25">Aprobar</button>
                                  <button type="button" onClick={() => setIncidentAction({ incident, action: 'reject' })} className="rounded bg-red-50 px-2 py-1 text-[10px] font-semibold text-red-700 hover:bg-red-100 dark:bg-red-500/10 dark:text-red-300 dark:hover:bg-red-500/20 midnight:bg-red-500/15 midnight:text-red-300 midnight:hover:bg-red-500/25">Rechazar</button>
                                </>
                              )}
                              {incident.workflowStatus === 'approved' && (
                                <button type="button" onClick={() => setIncidentAction({ incident, action: 'finalize' })} className="rounded bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 midnight:bg-cyan-900/40 midnight:text-cyan-200 midnight:hover:bg-cyan-800/50 midnight:hover:text-cyan-50">Finalizar</button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                      {!incidents.length && <tr><td colSpan={7} className="py-8 text-center text-sm text-slate-500 dark:text-slate-400 midnight:text-cyan-500/70">No hay incidencias registradas. Usa el botón superior para crear una nueva.</td></tr>}
                    </tbody>
                  </table>
                </div>
                <div className="border-t border-slate-200 px-4 py-3 dark:border-[#30363d] midnight:border-cyan-900/30 sm:px-5">
                  <Pagination
                    currentPage={safeIncidentPage}
                    totalPages={totalIncidentPages}
                    totalItems={incidents.length}
                    pageSize={INCIDENTS_PAGE_SIZE}
                    itemLabel="incidencias"
                    onPageChange={(nextPage) => setIncidentPageSelection({ query, page: nextPage })}
                    hideOnSinglePage={true}
                  />
                </div>
              </section>

              <aside className={panelClass} aria-labelledby="alerts-title">
                <div className="px-4 pt-5 sm:px-5">
                  <h2 id="alerts-title" className="text-base font-semibold text-slate-900 transition-colors duration-300 dark:text-white midnight:text-cyan-50">Próximas reincorporaciones</h2>
                  <p className="mt-1 text-xs text-slate-500 transition-colors duration-300 dark:text-slate-400 midnight:text-cyan-500/70">Alertas a 7 días y vencidas</p>
                </div>
                <div className="mt-3 flex flex-col gap-2.5 px-4 pb-5 sm:px-5">
                  {upcomingAlerts.map((alert) => (
                    <article key={alert.id} className={`rounded-lg border p-3 ${alert.isOverdue ? 'border-red-300 bg-red-50/50 dark:border-red-500/30 dark:bg-red-500/10' : 'border-amber-300 bg-amber-50/50 dark:border-amber-500/30 dark:bg-amber-500/10'}`}>
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-xs text-slate-800 dark:text-slate-200 midnight:text-cyan-100">{alert.memberName}</span>
                        <span className={`text-[10px] font-bold ${alert.isOverdue ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'}`}>{alert.isOverdue ? 'Vencida' : `${alert.daysUntilReturn}d`}</span>
                      </div>
                      <p className="mt-1 text-[11px] text-slate-600 dark:text-slate-300 midnight:text-cyan-300/80">{alert.typeLabel} · Retorno {formatDisplayDate(alert.endDate, { day: '2-digit', month: 'short' })}</p>
                    </article>
                  ))}
                  {!upcomingAlerts.length && <p className="py-4 text-center text-xs text-slate-400 dark:text-slate-600 midnight:text-cyan-600">No hay reincorporaciones pendientes a corto plazo.</p>}
                </div>
              </aside>
            </div>

            <section className={`${panelClass} w-full`} aria-labelledby="status-history-title">
              <h2 id="status-history-title" className="px-4 pt-5 text-base font-semibold text-slate-900 transition-colors duration-300 dark:text-white midnight:text-cyan-50 sm:px-5">Historial de Cambios de Estado</h2>
              <div className="mt-3 overflow-x-auto px-4 pb-3 sm:px-5">
                <table className="w-full min-w-[660px] border-collapse text-left text-xs">
                  <thead><tr className="border-b border-slate-200 text-[10px] text-slate-500 transition-colors duration-300 dark:border-[#30363d] midnight:border-cyan-900/30 midnight:text-cyan-600">
                    {['Fecha', 'Miembro', 'Estado Anterior', 'Estado Nuevo', 'Motivo / Comentario'].map((label) => <th scope="col" key={label} className="px-2 py-3 font-semibold first:pl-0">{label}</th>)}
                  </tr></thead>
                  <tbody>
                    {visibleHistory.map((change) => (
                      <tr key={change.id} className="border-b border-slate-200 last:border-0 transition-colors duration-300 dark:border-[#30363d]/70 midnight:border-cyan-900/30">
                        <td className="whitespace-nowrap py-3.5 pr-2 font-mono text-[11px] text-slate-500 transition-colors duration-300 dark:text-slate-400 midnight:text-cyan-600"><time dateTime={change.date}>{formatDisplayDate(change.date, { day: '2-digit', month: 'short' })}</time></td>
                        <td className="whitespace-nowrap px-2 py-3.5 text-[11px] font-medium text-slate-800 transition-colors duration-300 dark:text-slate-200 midnight:text-cyan-100">{change.name}</td>
                        <td className="px-2 py-3.5"><StatusBadge status={change.previousStatus} /></td>
                        <td className="px-2 py-3.5"><StatusBadge status={change.nextStatus} /></td>
                        <td className="min-w-[200px] px-2 py-3.5 text-[11px] leading-relaxed text-slate-500 transition-colors duration-300 dark:text-slate-400 midnight:text-cyan-500/70">{change.comment}{change.changedByName && <span className="mt-1 block text-[9px] text-slate-400">Por {change.changedByName}</span>}</td>
                      </tr>
                    ))}
                    {!history.length && <tr><td colSpan={5} className="py-8 text-center text-sm text-slate-500 dark:text-slate-400 midnight:text-cyan-500/70">No hay cambios de estado registrados en el historial.</td></tr>}
                  </tbody>
                </table>
              </div>
              <div className="border-t border-slate-200 px-4 py-3 dark:border-[#30363d] midnight:border-cyan-900/30 sm:px-5">
                <Pagination
                  currentPage={safeHistoryPage}
                  totalPages={totalHistoryPages}
                  totalItems={history.length}
                  pageSize={HISTORY_PAGE_SIZE}
                  itemLabel="cambios"
                  onPageChange={(nextPage) => setHistoryPageSelection({ query, page: nextPage })}
                  hideOnSinglePage={true}
                />
              </div>
            </section>
          </>
        )}
      </div>

      {editingMember && canManage && (
        <PersonnelEditorModal
          member={editingMember}
          projectOptions={projectOptions}
          editingProject={editing.mode === 'project'}
          onSave={saveMember}
          onCancel={() => setEditing(null)}
        />
      )}

      {incidentDialogOpen && canManage && (
        <PersonnelIncidentDialog
          data={data}
          onSubmit={saveIncident}
          onClose={() => setIncidentDialogOpen(false)}
        />
      )}

      {incidentAction && canManage && (
        <IncidentActionDialog
          incident={incidentAction.incident}
          action={incidentAction.action}
          onSubmit={submitIncidentAction}
          onClose={() => setIncidentAction(null)}
        />
      )}
    </main>
  );
}
