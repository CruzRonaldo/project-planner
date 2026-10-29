import React, { useEffect, useState } from 'react';
import { AlertTriangle, CalendarDays, Check, ChevronLeft, ChevronRight, Download, Pencil, RefreshCw, RotateCcw, Save, UserRoundCog, X } from 'lucide-react';
import { personnelStatuses, personnelIncidentTypes } from '../../constants/humanResources';
import {
  filterPersonnel,
  getUpcomingIncidentAlerts,
  getIncidentDuration,
  registerPersonnelIncident,
  summarizePersonnel,
  updatePersonnel,
} from '../../utils/humanResources';
import { downloadPersonnelWorkbook } from '../../utils/personnelWorkbook';

const panelClass = 'min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-colors duration-300 dark:border-[#30363d] dark:bg-[#161b22] dark:shadow-none midnight:border-cyan-900/30 midnight:bg-[#0a1120]';
const inputClass = 'mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition-colors duration-300 focus:border-cyan-500 dark:border-[#30363d] dark:bg-[#0d1117] dark:text-slate-100 dark:focus:border-cyan-400 midnight:border-cyan-800/40 midnight:bg-[#050B14] midnight:text-cyan-50 midnight:focus:border-cyan-500';
const iconButtonClass = 'rounded p-1.5 text-slate-500 transition-colors duration-300 hover:bg-slate-100 hover:text-cyan-700 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-cyan-400 midnight:text-cyan-500/70 midnight:hover:bg-cyan-900/20 midnight:hover:text-cyan-300';
const secondaryButtonClass = 'rounded-lg border border-slate-300 px-4 py-2 text-xs text-slate-600 transition-colors duration-300 hover:bg-slate-50 dark:border-[#30363d] dark:text-slate-300 dark:hover:bg-white/5 midnight:border-cyan-800/40 midnight:text-cyan-200 midnight:hover:bg-cyan-900/20';
const pageSize = 8;

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

function getInitials(name) {
  return name.split(' ').filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
}

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

function getRequestErrorMessage(error) {
  const responseData = error?.response?.data;
  if (typeof responseData?.message === 'string') return responseData.message;
  if (typeof responseData?.detail === 'string') return responseData.detail;
  if (responseData && typeof responseData === 'object') {
    const messages = Object.values(responseData).flatMap((value) =>
      Array.isArray(value) ? value : [value]
    );
    if (messages.length) return messages.join(' ');
  }
  return error?.message || 'No se pudo guardar el cambio en la base de datos.';
}

function PersonnelEditor({ member, projectOptions = [], onSave, onCancel, editingProject }) {
  const [draft, setDraft] = useState({ project: member.project, status: member.status, availability: member.availability, comment: '' });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const availableProjects = Array.from(new Set(['Ninguno', member.project, ...projectOptions].filter(Boolean)));
  const changeField = (field) => (event) => {
    setDraft((current) => ({ ...current, [field]: event.target.value }));
    setError('');
  };

  const submitDraft = async (event) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      await onSave(member.id, draft);
    } catch (saveError) {
      setError(getRequestErrorMessage(saveError));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={submitDraft}
      className={`${panelClass} border-cyan-300 p-4 sm:p-5 dark:border-cyan-400/30 midnight:border-cyan-500/30`}
      aria-labelledby="personnel-editor-title"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 id="personnel-editor-title" className="text-base font-semibold text-slate-900 transition-colors duration-300 dark:text-white midnight:text-cyan-50">{editingProject ? 'Asignar proyecto' : 'Editar disponibilidad y estado'}</h2>
          <p className="mt-1 text-xs text-slate-500 transition-colors duration-300 dark:text-slate-400 midnight:text-cyan-500/70">{member.name} · {member.area}</p>
        </div>
        <button type="button" onClick={onCancel} aria-label="Cerrar edición" className="rounded-lg p-2 text-slate-500 transition-colors duration-300 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-white midnight:text-cyan-500/70 midnight:hover:bg-cyan-900/20 midnight:hover:text-cyan-50"><X size={18} /></button>
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <label className="text-xs text-slate-500 transition-colors duration-300 dark:text-slate-400 midnight:text-cyan-500/70">Proyecto asignado
          <select autoFocus={editingProject} required value={draft.project} onChange={changeField('project')} className={inputClass}>
            {availableProjects.map((project) => <option key={project} value={project}>{project}</option>)}
          </select>
        </label>
        <label className="text-xs text-slate-500 transition-colors duration-300 dark:text-slate-400 midnight:text-cyan-500/70">Estado
          <select autoFocus={!editingProject} value={draft.status} onChange={changeField('status')} className={inputClass}>
            {personnelStatuses.map((status) => <option key={status.id} value={status.id}>{status.label}</option>)}
          </select>
        </label>
        <label className="text-xs text-slate-500 transition-colors duration-300 dark:text-slate-400 midnight:text-cyan-500/70">Disponibilidad (%)
          <input type="number" min="0" max="100" step="1" required value={draft.availability} onChange={changeField('availability')} className={inputClass} />
        </label>
        <label className="text-xs text-slate-500 transition-colors duration-300 dark:text-slate-400 midnight:text-cyan-500/70">Motivo / comentario
          <input maxLength={200} value={draft.comment} onChange={changeField('comment')} placeholder="Comentario opcional" className={inputClass} />
        </label>
      </div>
      {error && <p role="alert" className="mt-3 text-xs text-red-600 dark:text-red-400 midnight:text-red-300">{error}</p>}
      <div className="mt-4 flex flex-wrap justify-end gap-2">
        <button type="button" onClick={onCancel} disabled={isSubmitting} className={secondaryButtonClass}>Cancelar</button>
        <button type="submit" disabled={isSubmitting} className="inline-flex items-center gap-2 rounded-lg bg-cyan-500 px-4 py-2 text-xs font-semibold text-white transition-colors duration-300 hover:bg-cyan-400 disabled:cursor-wait disabled:opacity-60 dark:bg-cyan-400 dark:text-slate-950 dark:hover:bg-cyan-300 midnight:bg-cyan-500 midnight:text-slate-950 midnight:hover:bg-cyan-400"><Save size={14} /> {isSubmitting ? 'Guardando...' : 'Guardar cambios'}</button>
      </div>
    </form>
  );
}

function formatDateInput(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function PersonnelIncidentDialog({ data = {}, onSubmit, onClose }) {
  const members = data?.members || [];
  const today = new Date();
  const returnDate = new Date(today);
  returnDate.setDate(returnDate.getDate() + 1);
  const [draft, setDraft] = useState({
    memberId: members[0]?.id ?? '',
    type: personnelIncidentTypes[0].id,
    startDate: formatDateInput(today),
    endDate: formatDateInput(returnDate),
    status: 'standby',
    availability: 0,
    backupMemberId: '',
    comment: '',
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const duration = getIncidentDuration(draft.startDate, draft.endDate);
  const changeField = (field) => (event) => { setDraft((current) => ({ ...current, [field]: event.target.value })); setError(''); };
  const selectedMember = members.find((member) => member.id === draft.memberId);

  useEffect(() => {
    const closeWithEscape = (event) => { if (event.key === 'Escape') onClose(); };
    document.addEventListener('keydown', closeWithEscape);
    return () => document.removeEventListener('keydown', closeWithEscape);
  }, [onClose]);

  const submitDraft = async (event) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      await onSubmit(draft);
    } catch (submitError) {
      setError(getRequestErrorMessage(submitError));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div role="presentation" onMouseDown={onClose} className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-900/40 p-3 backdrop-blur-sm transition-colors duration-300 dark:bg-[#020617]/85 midnight:bg-[#020617]/90 sm:p-5">
      <section role="dialog" aria-modal="true" aria-labelledby="personnel-incident-title" onMouseDown={(event) => event.stopPropagation()} className="max-h-[94vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-[0_25px_90px_rgba(15,23,42,0.18)] transition-colors duration-300 dark:border-[#303b50] dark:bg-[#111a2d] dark:shadow-[0_25px_90px_rgba(0,0,0,0.72)] midnight:border-cyan-900/30 midnight:bg-[#0a1120]">
        <header className="flex items-start justify-between gap-4 border-b border-slate-200 px-4 py-4 transition-colors duration-300 dark:border-[#30363d] midnight:border-cyan-900/30 sm:px-6">
          <div className="flex gap-3"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-cyan-200 bg-cyan-50 text-cyan-700 transition-colors duration-300 dark:border-cyan-400/25 dark:bg-cyan-500/15 dark:text-cyan-400 midnight:border-cyan-800/40 midnight:bg-cyan-500/15 midnight:text-cyan-300"><CalendarDays size={20} /></span><div><h2 id="personnel-incident-title" className="text-lg font-bold text-slate-900 transition-colors duration-300 dark:text-white midnight:text-cyan-50">Registrar Incidencia / Licencia</h2><p className="mt-1 text-xs text-slate-500 transition-colors duration-300 dark:text-slate-400 midnight:text-cyan-500/70">Gestiona ausencias, permisos o variaciones temporales de disponibilidad del personal.</p></div></div>
          <button type="button" onClick={onClose} aria-label="Cerrar registro de incidencia" className="rounded-lg p-2 text-slate-500 transition-colors duration-300 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-white midnight:text-cyan-500/70 midnight:hover:bg-cyan-900/20 midnight:hover:text-cyan-50"><X size={19} /></button>
        </header>

        <form onSubmit={submitDraft} className="p-4 sm:p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-[10px] font-semibold uppercase tracking-wide text-slate-600 transition-colors duration-300 dark:text-slate-300 midnight:text-cyan-200">Integrante del personal <span className="text-cyan-600 dark:text-cyan-400 midnight:text-cyan-400">*</span><select autoFocus required value={draft.memberId} onChange={(event) => { const memberId = event.target.value; setDraft((current) => ({ ...current, memberId, backupMemberId: current.backupMemberId === memberId ? '' : current.backupMemberId })); setError(''); }} className={inputClass}>{members.length === 0 && <option value="">Sin personal registrado</option>}{members.map((member) => <option key={member.id} value={member.id}>{member.name} ({member.area})</option>)}</select></label>
            <label className="text-[10px] font-semibold uppercase tracking-wide text-slate-600 transition-colors duration-300 dark:text-slate-300 midnight:text-cyan-200">Tipo de incidencia <span className="text-cyan-600 dark:text-cyan-400 midnight:text-cyan-400">*</span><select required value={draft.type} onChange={changeField('type')} className={inputClass}>{personnelIncidentTypes.map((type) => <option key={type.id} value={type.id}>{type.label}</option>)}</select></label>
            <label className="text-[10px] font-semibold uppercase tracking-wide text-slate-600 transition-colors duration-300 dark:text-slate-300 midnight:text-cyan-200">Fecha de inicio / desde <span className="text-cyan-600 dark:text-cyan-400 midnight:text-cyan-400">*</span><input type="date" required value={draft.startDate} onChange={changeField('startDate')} className={inputClass} /></label>
            <label className="text-[10px] font-semibold uppercase tracking-wide text-slate-600 transition-colors duration-300 dark:text-slate-300 midnight:text-cyan-200">Fecha de retorno / hasta <span className="text-cyan-600 dark:text-cyan-400 midnight:text-cyan-400">*</span><input type="date" required min={draft.startDate} value={draft.endDate} onChange={changeField('endDate')} className={inputClass} /></label>
          </div>

          <p className={`mt-3 flex items-center gap-2 text-[10px] ${duration ? 'text-cyan-700 dark:text-cyan-300 midnight:text-cyan-300' : 'text-red-600 dark:text-red-400 midnight:text-red-300'}`}><CalendarDays size={13} />{duration ? `Duración: ${duration.calendarDays} ${duration.calendarDays === 1 ? 'día calendario' : 'días calendario'} (${duration.businessDays} ${duration.businessDays === 1 ? 'día hábil' : 'días hábiles'})` : 'La fecha de retorno no puede ser anterior al inicio.'}</p>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <label className="text-[10px] font-semibold uppercase tracking-wide text-slate-600 transition-colors duration-300 dark:text-slate-300 midnight:text-cyan-200">Estado operativo resultante <span className="text-cyan-600 dark:text-cyan-400 midnight:text-cyan-400">*</span><select required value={draft.status} onChange={changeField('status')} className={inputClass}>{personnelStatuses.map((status) => <option key={status.id} value={status.id}>{status.id === 'standby' ? 'Stand-by (Fuera de obra)' : status.id === 'support' ? 'En apoyo (Disponibilidad parcial)' : 'Activo en obra'}</option>)}</select></label>
            <label className="text-[10px] font-semibold uppercase tracking-wide text-slate-600 transition-colors duration-300 dark:text-slate-300 midnight:text-cyan-200">Disponibilidad en este periodo <span className="text-cyan-600 dark:text-cyan-400 midnight:text-cyan-400">*</span><div className="relative"><input type="number" min="0" max="100" step="1" required value={draft.availability} onChange={changeField('availability')} className={`${inputClass} pr-9`} /><span className="absolute bottom-2.5 right-3 text-xs text-slate-500">%</span></div></label>
          </div>

          <label className="mt-5 block text-[10px] font-semibold uppercase tracking-wide text-slate-600 transition-colors duration-300 dark:text-slate-300 midnight:text-cyan-200">Técnico de respaldo / cobertura temporal <span className="normal-case text-slate-500 midnight:text-cyan-600">(opcional inteligente)</span><select value={draft.backupMemberId} onChange={changeField('backupMemberId')} className={inputClass}><option value="">Sin técnico de respaldo</option>{members.filter((member) => member.id !== draft.memberId).map((member) => <option key={member.id} value={member.id}>{member.name} · {member.area} · {member.project}</option>)}</select></label>

          <label className="mt-5 block text-[10px] font-semibold uppercase tracking-wide text-slate-600 transition-colors duration-300 dark:text-slate-300 midnight:text-cyan-200">Motivo / comentario detallado <span className="text-cyan-600 dark:text-cyan-400 midnight:text-cyan-400">*</span><textarea required minLength={5} maxLength={500} rows={4} value={draft.comment} onChange={changeField('comment')} placeholder="Describe el motivo, la entrega de turnos y las coordinaciones necesarias..." className={`${inputClass} resize-y leading-relaxed`} /></label>

          {selectedMember && <p className="mt-3 text-[10px] text-slate-500 transition-colors duration-300 dark:text-slate-400 midnight:text-cyan-600">Estado actual de {selectedMember.name}: {personnelStatuses.find((status) => status.id === selectedMember.status)?.label}, {selectedMember.availability}% de disponibilidad.</p>}
          {error && <p role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 transition-colors duration-300 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400 midnight:border-red-500/20 midnight:bg-red-500/10 midnight:text-red-300">{error}</p>}

          <footer className="mt-5 flex flex-col-reverse gap-3 border-t border-slate-200 pt-4 transition-colors duration-300 dark:border-[#30363d] midnight:border-cyan-900/30 sm:flex-row sm:items-center sm:justify-between"><p className="text-[10px] text-slate-500 transition-colors duration-300 dark:text-slate-400 midnight:text-cyan-600"><span className="text-cyan-600 dark:text-cyan-400 midnight:text-cyan-400">●</span> Se guardará en PostgreSQL como pendiente. El estado del integrante cambiará únicamente cuando se apruebe.</p><div className="flex justify-end gap-2"><button type="button" onClick={onClose} disabled={isSubmitting} className={`${secondaryButtonClass} py-2.5`}>Cancelar</button><button type="submit" disabled={isSubmitting} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white transition-colors duration-300 hover:bg-blue-500 disabled:cursor-wait disabled:opacity-60 midnight:bg-cyan-600 midnight:hover:bg-cyan-500"><CalendarDays size={15} /> {isSubmitting ? 'Guardando...' : 'Registrar incidencia'}</button></div></footer>
        </form>
      </section>
    </div>
  );
}

function IncidentActionDialog({ incident, action, onSubmit, onClose }) {
  const actionLabels = {
    approve: { title: 'Aprobar incidencia', verb: 'Aprobar', help: 'Al aprobar, se aplicarán el estado y la disponibilidad indicados al integrante.' },
    reject: { title: 'Rechazar incidencia', verb: 'Rechazar', help: 'Indica el motivo del rechazo para que quede registrado en el historial.' },
    finalize: { title: 'Finalizar incidencia', verb: 'Finalizar', help: 'Al finalizar, el integrante recuperará su estado operativo según las reglas del sistema.' },
  };
  const details = actionLabels[action] || actionLabels.approve;
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const closeWithEscape = (event) => { if (event.key === 'Escape') onClose(); };
    document.addEventListener('keydown', closeWithEscape);
    return () => document.removeEventListener('keydown', closeWithEscape);
  }, [onClose]);

  const submitAction = async (event) => {
    event.preventDefault();
    if (action === 'reject' && comment.trim().length < 5) {
      setError('Escribe un motivo de rechazo de al menos 5 caracteres.');
      return;
    }
    setError('');
    setIsSubmitting(true);
    try {
      await onSubmit(incident.id, action, comment);
    } catch (submitError) {
      setError(getRequestErrorMessage(submitError));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div role="presentation" onMouseDown={onClose} className="fixed inset-0 z-[95] flex items-center justify-center bg-slate-900/40 p-3 backdrop-blur-sm dark:bg-[#020617]/85 midnight:bg-[#020617]/90">
      <section role="dialog" aria-modal="true" aria-labelledby="incident-action-title" onMouseDown={(event) => event.stopPropagation()} className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-[0_25px_90px_rgba(15,23,42,0.18)] dark:border-[#303b50] dark:bg-[#111a2d] midnight:border-cyan-900/30 midnight:bg-[#0a1120]">
        <header className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4 dark:border-[#30363d] midnight:border-cyan-900/30">
          <div><h2 id="incident-action-title" className="text-lg font-bold text-slate-900 dark:text-white midnight:text-cyan-50">{details.title}</h2><p className="mt-1 text-xs text-slate-500 dark:text-slate-400 midnight:text-cyan-500/70">{incident.memberName} · {incident.typeLabel}</p></div>
          <button type="button" onClick={onClose} aria-label="Cerrar acción" className={iconButtonClass}><X size={18} /></button>
        </header>
        <form onSubmit={submitAction} className="p-5">
          <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300 midnight:text-cyan-100">{details.help}</p>
          <label className="mt-4 block text-[10px] font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300 midnight:text-cyan-200">Comentario {action === 'reject' ? '*' : '(opcional)'}
            <textarea autoFocus={action === 'reject'} required={action === 'reject'} minLength={action === 'reject' ? 5 : undefined} maxLength={500} rows={3} value={comment} onChange={(event) => { setComment(event.target.value); setError(''); }} className={`${inputClass} resize-y`} placeholder={action === 'reject' ? 'Explica por qué se rechaza la solicitud...' : 'Añade una observación para la bitácora...'} />
          </label>
          {error && <p role="alert" className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400">{error}</p>}
          <footer className="mt-5 flex justify-end gap-2"><button type="button" onClick={onClose} disabled={isSubmitting} className={secondaryButtonClass}>Cancelar</button><button type="submit" disabled={isSubmitting} className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold text-white disabled:cursor-wait disabled:opacity-60 ${action === 'reject' ? 'bg-red-600 hover:bg-red-500' : 'bg-blue-600 hover:bg-blue-500 midnight:bg-cyan-600 midnight:hover:bg-cyan-500'}`}>{action === 'reject' ? <X size={14} /> : <Check size={14} />} {isSubmitting ? 'Guardando...' : details.verb}</button></footer>
        </form>
      </section>
    </div>
  );
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
  const [statusFilter, setStatusFilter] = useState('all');
  const [pageSelection, setPageSelection] = useState({ query: '', status: 'all', page: 1 });
  const [editing, setEditing] = useState(null);
  const [incidentDialogOpen, setIncidentDialogOpen] = useState(false);
  const [incidentAction, setIncidentAction] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [feedbackType, setFeedbackType] = useState('success');
  const [isExportingMatrix, setIsExportingMatrix] = useState(false);
  const [isRefreshingRecords, setIsRefreshingRecords] = useState(false);
  const summary = summarizePersonnel(members);
  const searchMatches = filterPersonnel(members, query);
  const filteredMembers = filterPersonnel(members, query, statusFilter);
  const totalPages = Math.max(1, Math.ceil(filteredMembers.length / pageSize));
  const page = pageSelection.query === query && pageSelection.status === statusFilter ? Math.min(pageSelection.page, totalPages) : 1;
  const visibleMembers = filteredMembers.slice((page - 1) * pageSize, page * pageSize);
  const editingMember = editing && members.find((member) => member.id === editing.id);
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
    // La bitácora visible siempre proviene del backend; solo el integrante se
    // actualiza de forma optimista mientras Django confirma el cambio.
    onChange({ ...updatedData, history });
    try {
      if (onPersistMember) await onPersistMember(memberId, draft);
      setEditing(null);
      setFeedbackType('success');
      setFeedback('Cambio guardado correctamente en PostgreSQL.');
    } catch (error) {
      onChange(previousData);
      throw error;
    }
  };

  const saveIncident = async (draft) => {
    // Reutiliza las validaciones de fechas, disponibilidad, respaldo y motivo,
    // pero no aplica cambios locales: la solicitud nace pendiente en PostgreSQL.
    registerPersonnelIncident(data, draft);
    if (!onCreateIncident) throw new Error('No se configuró la conexión para registrar incidencias.');
    await onCreateIncident(draft);
    const member = members.find((item) => item.id === draft.memberId);
    setIncidentDialogOpen(false);
    setEditing(null);
    setFeedbackType('success');
    setFeedback(`Incidencia registrada${member ? ` para ${member.name}` : ''} y enviada a revisión.`);
  };

  const submitIncidentAction = async (incidentId, action, comment) => {
    if (!onTransitionIncident) throw new Error('No se configuró el flujo de aprobación de incidencias.');
    await onTransitionIncident(incidentId, action, comment);
    setIncidentAction(null);
    setFeedbackType('success');
    const labels = { approve: 'aprobada', reject: 'rechazada', finalize: 'finalizada' };
    setFeedback(`Incidencia ${labels[action] || 'actualizada'} correctamente.`);
  };

  const refreshRecords = async () => {
    if (!onRefreshRecords || isRefreshingRecords) return;
    setIsRefreshingRecords(true);
    setFeedback('');
    try {
      await onRefreshRecords();
      setFeedbackType('success');
      setFeedback('Incidencias e historial actualizados desde PostgreSQL.');
    } catch (error) {
      setFeedbackType('error');
      setFeedback(getRequestErrorMessage(error));
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
      setFeedback(`Matriz de Recursos Humanos exportada en Excel con ${members.length} ${members.length === 1 ? 'integrante' : 'integrantes'}.`);
    } catch (error) {
      setFeedbackType('error');
      setFeedback(`No se pudo generar el Excel. ${error?.message || 'Inténtalo nuevamente.'}`);
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
            {onRefreshRecords && <button type="button" onClick={refreshRecords} disabled={isRefreshingRecords || syncLoading} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-xs text-slate-600 transition-colors duration-300 hover:border-cyan-400/40 hover:text-slate-900 disabled:cursor-wait disabled:opacity-60 dark:border-[#30363d] dark:bg-[#111827] dark:text-slate-300 dark:hover:border-cyan-400/30 dark:hover:text-white midnight:border-cyan-800/40 midnight:bg-[#0a1120] midnight:text-cyan-200"><RefreshCw size={15} className={isRefreshingRecords ? 'animate-spin' : ''} /> Actualizar</button>}
            {canManage ? <><button type="button" onClick={exportMatrix} disabled={isExportingMatrix || members.length === 0} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-xs text-slate-600 transition-colors duration-300 hover:border-cyan-400/40 hover:text-slate-900 disabled:cursor-wait disabled:opacity-60 dark:border-[#30363d] dark:bg-[#111827] dark:text-slate-300 dark:hover:border-cyan-400/30 dark:hover:text-white midnight:border-cyan-800/40 midnight:bg-[#0a1120] midnight:text-cyan-200 midnight:hover:text-cyan-50"><Download size={15} /> {isExportingMatrix ? 'Generando Excel...' : 'Exportar Matriz'}</button><button type="button" onClick={() => { setIncidentDialogOpen(true); setFeedback(''); setFeedbackType('success'); }} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white transition-colors duration-300 hover:bg-blue-500 midnight:bg-cyan-600 midnight:hover:bg-cyan-500"><CalendarDays size={16} /> Registrar Incidencia / Licencia</button></> : <span className="w-fit rounded-md border border-slate-300 px-2.5 py-1.5 text-[10px] text-slate-500 transition-colors duration-300 dark:border-[#30363d] dark:text-slate-400 midnight:border-cyan-800/40 midnight:text-cyan-600">Vista de consulta</span>}
          </div>
        </header>

        <section aria-label="Resumen de personal" className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
          {summaryCards.map((card) => (
            <button key={card.id} type="button" onClick={() => setStatusFilter(card.id)} aria-pressed={statusFilter === card.id} aria-label={`${card.label}: ${card.value}`} className={`rounded-xl border bg-white p-4 text-left shadow-sm transition-colors duration-300 hover:border-cyan-400/50 sm:p-5 dark:bg-[#161b22] dark:shadow-none midnight:bg-[#0a1120] ${statusFilter === card.id && card.id !== 'all' ? 'border-cyan-500 dark:border-cyan-400/60 midnight:border-cyan-400/50' : 'border-slate-200 dark:border-[#30363d] midnight:border-cyan-900/30'}`}>
              <span className="flex items-center justify-between gap-2 text-[10px] font-semibold uppercase tracking-wide text-slate-500 transition-colors duration-300 dark:text-slate-400 midnight:text-cyan-600"><span>{card.label}</span><i className={`h-1.5 w-1.5 shrink-0 rounded-full ${card.dotClass}`} /></span>
              <strong className="mt-3 block text-3xl font-bold text-slate-900 transition-colors duration-300 dark:text-white midnight:text-cyan-50">{card.value}</strong>
            </button>
          ))}
        </section>

        <p role={feedbackType === 'error' ? 'alert' : 'status'} className={feedback ? (feedbackType === 'error' ? 'text-xs text-red-600 dark:text-red-400 midnight:text-red-300' : 'text-xs text-cyan-700 dark:text-cyan-300 midnight:text-cyan-300') : 'sr-only'}>{feedback}</p>
        {syncLoading && <p className="text-xs text-slate-500 dark:text-slate-400 midnight:text-cyan-500/70">Sincronizando personal con PostgreSQL...</p>}
        {syncError && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400 midnight:text-red-300">{syncError}</p>}
        {editingMember && canManage && <PersonnelEditor key={`${editing.id}-${editing.mode}`} member={editingMember} projectOptions={projectOptions} editingProject={editing.mode === 'project'} onSave={saveMember} onCancel={() => setEditing(null)} />}

        <div className="grid min-w-0 items-start gap-5 xl:grid-cols-[minmax(0,1.8fr)_minmax(280px,1fr)]">
          <section className={panelClass} aria-labelledby="personnel-assignment-title">
            <div className="flex flex-wrap items-center justify-between gap-3 px-4 pt-5 sm:px-5">
              <h2 id="personnel-assignment-title" className="text-base font-semibold text-slate-900 transition-colors duration-300 dark:text-white midnight:text-cyan-50">Asignación de Personal</h2>
              <div className="flex items-center gap-3"><span className="inline-flex items-center gap-1.5 text-[9px] text-cyan-700 dark:text-cyan-400 midnight:text-cyan-400"><i className={`h-1.5 w-1.5 rounded-full ${syncError ? 'bg-red-400' : 'bg-emerald-400'}`} /> {syncError ? 'Error de sincronización' : syncedAt ? 'Sincronizado con PostgreSQL' : syncLoading ? 'Sincronizando...' : 'Pendiente de sincronización'}</span>{(query || statusFilter !== 'all') && <button type="button" onClick={() => { setStatusFilter('all'); onQueryChange(''); }} className="inline-flex items-center gap-1.5 text-[10px] text-cyan-700 transition-colors duration-300 hover:text-cyan-600 dark:text-cyan-400 dark:hover:text-cyan-300 midnight:text-cyan-400 midnight:hover:text-cyan-200"><RotateCcw size={12} /> Limpiar filtros</button>}</div>
            </div>
            <div className="mt-3 overflow-x-auto px-4 sm:px-5">
              <table className="w-full min-w-[700px] border-collapse text-left text-xs">
                <thead><tr className="border-b border-slate-200 text-[10px] text-slate-500 transition-colors duration-300 dark:border-[#30363d] midnight:border-cyan-900/30 midnight:text-cyan-600">
                  {['Nombre', 'Área Técnica', 'Proyecto Asignado', 'Estado', 'Disponibilidad', 'Acción'].map((label) => <th scope="col" key={label} className="px-2 py-3 font-semibold first:pl-0 last:pr-0">{label}</th>)}
                </tr></thead>
                <tbody>
                  {visibleMembers.map((member) => (
                    <tr key={member.id} className="border-b border-slate-200 last:border-b-0 transition-colors duration-300 hover:bg-slate-50 dark:border-[#30363d]/70 dark:hover:bg-white/[0.02] midnight:border-cyan-900/30 midnight:hover:bg-cyan-900/20">
                      <td className="whitespace-nowrap py-3.5 pr-2 font-medium text-slate-900 transition-colors duration-300 dark:text-slate-100 midnight:text-cyan-50"><span className="flex items-center gap-2"><i className="flex h-7 w-7 items-center justify-center rounded-full bg-cyan-50 text-[9px] font-bold not-italic text-cyan-700 transition-colors duration-300 dark:bg-blue-500/10 dark:text-blue-300 midnight:bg-cyan-500/15 midnight:text-cyan-300">{getInitials(member.name)}</i><span>{member.name}</span></span></td>
                      <td className="whitespace-nowrap px-2 py-3.5 text-[11px] text-slate-500 transition-colors duration-300 dark:text-slate-400 midnight:text-cyan-500/70">{member.area}</td>
                      <td className="max-w-[180px] truncate px-2 py-3.5 text-[11px] text-slate-700 transition-colors duration-300 dark:text-slate-300 midnight:text-cyan-100" title={member.project}>{member.project}</td>
                      <td className="px-2 py-3.5"><StatusBadge status={member.status} /></td>
                      <td className="px-2 py-3.5"><div className="flex min-w-[90px] items-center gap-2">
                        <div role="progressbar" aria-label={`Disponibilidad de ${member.name}`} aria-valuenow={member.availability} aria-valuemin={0} aria-valuemax={100} className="h-1 w-16 overflow-hidden rounded-full bg-slate-200 transition-colors duration-300 dark:bg-[#30363d] midnight:bg-cyan-900/50">
                          <div className="h-full rounded-full bg-cyan-500 dark:bg-blue-400 midnight:bg-cyan-400" style={{ width: `${member.availability}%` }} />
                        </div><span className="text-[10px] tabular-nums text-slate-600 transition-colors duration-300 dark:text-slate-300 midnight:text-cyan-200">{member.availability}%</span>
                      </div></td>
                      <td className="py-2 pl-2"><div className="flex gap-0.5">
                        {canManage ? <><button type="button" onClick={() => openEditor(member)} aria-label={`Editar estado de ${member.name}`} title="Editar estado y disponibilidad" className={iconButtonClass}><Pencil size={14} /></button>
                        <button type="button" onClick={() => openEditor(member, 'project')} aria-label={`Asignar proyecto a ${member.name}`} title="Asignar proyecto" className={iconButtonClass}><UserRoundCog size={14} /></button></> : <span className="px-2 text-[10px] text-slate-400">Consulta</span>}
                      </div></td>
                    </tr>
                  ))}
                  {!visibleMembers.length && <tr><td colSpan={6} className="py-12 text-center text-sm text-slate-500 dark:text-slate-400 midnight:text-cyan-500/70">No se encontró personal con estos filtros.</td></tr>}
                </tbody>
              </table>
            </div>
            <footer className="mt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-4 py-3 text-[10px] text-slate-500 transition-colors duration-300 dark:border-[#30363d] dark:text-slate-400 midnight:border-cyan-900/30 midnight:text-cyan-600 sm:px-5">
              <span>{filteredMembers.length ? `${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, filteredMembers.length)}` : '0'} de {filteredMembers.length} integrantes</span>
              <div className="flex items-center gap-2">
                <button type="button" aria-label="Página anterior de personal" disabled={page === 1} onClick={() => setPageSelection({ query, status: statusFilter, page: page - 1 })} className="rounded border border-slate-300 p-1 text-slate-600 transition-colors duration-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-30 dark:border-[#30363d] dark:text-slate-300 dark:hover:bg-white/5 midnight:border-cyan-800/40 midnight:text-cyan-200 midnight:hover:bg-cyan-900/20"><ChevronLeft size={14} /></button>
                <span>{page} / {totalPages}</span>
                <button type="button" aria-label="Página siguiente de personal" disabled={page === totalPages} onClick={() => setPageSelection({ query, status: statusFilter, page: page + 1 })} className="rounded border border-slate-300 p-1 text-slate-600 transition-colors duration-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-30 dark:border-[#30363d] dark:text-slate-300 dark:hover:bg-white/5 midnight:border-cyan-800/40 midnight:text-cyan-200 midnight:hover:bg-cyan-900/20"><ChevronRight size={14} /></button>
              </div>
            </footer>
          </section>

          <section className={`${panelClass} p-4 sm:p-5`} aria-labelledby="team-status-title">
            <h2 id="team-status-title" className="text-base font-semibold text-slate-900 transition-colors duration-300 dark:text-white midnight:text-cyan-50">Estado de Equipos</h2>
            <p className="mt-1 text-[10px] text-slate-500 transition-colors duration-300 dark:text-slate-400 midnight:text-cyan-600">Distribución de cuadrillas operativas</p>
            <div className="mt-5 grid grid-cols-3 gap-2">
              {personnelStatuses.map((status) => {
                const members = searchMatches.filter((member) => member.status === status.id);
                return <div key={status.id} className="min-w-0">
                  <button type="button" onClick={() => setStatusFilter(statusFilter === status.id ? 'all' : status.id)} aria-pressed={statusFilter === status.id} className={`w-full rounded-md border px-1 py-2 text-[10px] font-semibold uppercase ${status.className}`}>{status.label} <span className="ml-1 opacity-70">{members.length}</span></button>
                  <div className="mt-3 flex max-h-[380px] flex-col gap-2 overflow-y-auto">
                    {members.map((member) => canManage
                      ? <button key={member.id} type="button" onClick={() => openEditor(member)} aria-label={`Editar estado de ${member.name}`} title={`${member.name} · ${member.project}`} className="truncate rounded-md border border-slate-200 bg-slate-50 px-2 py-2 text-left text-[10px] text-slate-700 transition-colors duration-300 hover:border-cyan-400/50 hover:text-slate-900 dark:border-[#30363d] dark:bg-[#0d1117] dark:text-slate-300 dark:hover:text-white midnight:border-cyan-800/40 midnight:bg-[#050B14] midnight:text-cyan-100 midnight:hover:text-cyan-50">{member.name}</button>
                      : <span key={member.id} title={`${member.name} · Vista de consulta`} className="truncate rounded-md border border-slate-200 bg-slate-50 px-2 py-2 text-left text-[10px] text-slate-700 transition-colors duration-300 dark:border-[#30363d] dark:bg-[#0d1117] dark:text-slate-300 midnight:border-cyan-800/40 midnight:bg-[#050B14] midnight:text-cyan-100">{member.name}</span>)}
                    {!members.length && <p className="py-2 text-center text-[10px] text-slate-400 dark:text-slate-600 midnight:text-cyan-600">Sin personal</p>}
                  </div>
                </div>;
              })}
            </div>
            <button type="button" onClick={() => { setStatusFilter('all'); setFeedback('Mostrando el balance completo de carga del personal.'); }} className="mt-5 w-full border-t border-slate-200 pt-4 text-center text-[10px] font-medium text-cyan-700 transition-colors duration-300 hover:text-cyan-600 dark:border-[#30363d] dark:text-cyan-400 dark:hover:text-cyan-300 midnight:border-cyan-900/30 midnight:text-cyan-400 midnight:hover:text-cyan-200">Ver balance de carga completo →</button>
          </section>
        </div>

        {canManage && <>
        <div className="grid min-w-0 items-start gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(280px,0.75fr)]">
          <section className={`${panelClass} w-full`} aria-labelledby="personnel-incidents-title">
            <div className="flex flex-wrap items-start justify-between gap-3 px-4 pt-5 sm:px-5">
              <div><h2 id="personnel-incidents-title" className="text-base font-semibold text-slate-900 dark:text-white midnight:text-cyan-50">Incidencias y Licencias</h2><p className="mt-1 text-[10px] text-slate-500 dark:text-slate-400 midnight:text-cyan-600">Solicitudes persistidas y flujo de aprobación del personal</p></div>
              <span className="rounded-md border border-slate-200 px-2 py-1 text-[10px] text-slate-500 dark:border-[#30363d] dark:text-slate-400 midnight:border-cyan-800/40 midnight:text-cyan-500/70">{incidents.length} {incidents.length === 1 ? 'registro' : 'registros'}</span>
            </div>
            <div className="mt-3 max-h-[440px] overflow-auto px-4 pb-3 sm:px-5">
              <table className="w-full min-w-[860px] border-collapse text-left text-xs">
                <thead><tr className="border-b border-slate-200 text-[10px] text-slate-500 dark:border-[#30363d] midnight:border-cyan-900/30 midnight:text-cyan-600">
                  {['Integrante', 'Tipo', 'Periodo', 'Resultado', 'Flujo', 'Cobertura', 'Acciones'].map((label) => <th scope="col" key={label} className="px-2 py-3 font-semibold first:pl-0 last:pr-0">{label}</th>)}
                </tr></thead>
                <tbody>
                  {incidents.map((incident) => (
                    <tr key={incident.id} className="border-b border-slate-200 last:border-0 dark:border-[#30363d]/70 midnight:border-cyan-900/30">
                      <td className="whitespace-nowrap py-3.5 pr-2"><strong className="block text-[11px] text-slate-800 dark:text-slate-200 midnight:text-cyan-100">{incident.memberName}</strong><span className="mt-0.5 block max-w-[180px] truncate text-[9px] text-slate-500 dark:text-slate-400" title={incident.comment}>{incident.comment}</span></td>
                      <td className="px-2 py-3.5 text-[11px] text-slate-600 dark:text-slate-300 midnight:text-cyan-200">{incident.typeLabel}</td>
                      <td className="whitespace-nowrap px-2 py-3.5 text-[10px] text-slate-500 dark:text-slate-400 midnight:text-cyan-500/70"><time dateTime={incident.startDate}>{formatDisplayDate(incident.startDate, { day: '2-digit', month: 'short' })}</time> – <time dateTime={incident.endDate}>{formatDisplayDate(incident.endDate, { day: '2-digit', month: 'short' })}</time><span className="mt-1 block">{incident.calendarDays} {incident.calendarDays === 1 ? 'día' : 'días'}</span></td>
                      <td className="px-2 py-3.5"><StatusBadge status={incident.status} /><span className="ml-2 text-[10px] text-slate-500 dark:text-slate-400">{incident.availability}%</span></td>
                      <td className="px-2 py-3.5"><WorkflowBadge status={incident.workflowStatus} />{incident.reviewComment && <span className="mt-1 block max-w-[150px] truncate text-[9px] text-slate-500" title={incident.reviewComment}>{incident.reviewComment}</span>}</td>
                      <td className="max-w-[150px] truncate px-2 py-3.5 text-[10px] text-slate-500 dark:text-slate-400" title={incident.backupMemberName || 'Sin cobertura'}>{incident.backupMemberName || 'Sin cobertura'}</td>
                      <td className="py-3.5 pl-2">
                        {canManage && incident.workflowStatus === 'pending' && <div className="flex gap-1"><button type="button" onClick={() => setIncidentAction({ incident, action: 'approve' })} className="rounded-md border border-emerald-200 px-2 py-1.5 text-[9px] font-semibold text-emerald-700 hover:bg-emerald-50 dark:border-emerald-500/25 dark:text-emerald-300 dark:hover:bg-emerald-500/10">Aprobar</button><button type="button" onClick={() => setIncidentAction({ incident, action: 'reject' })} className="rounded-md border border-red-200 px-2 py-1.5 text-[9px] font-semibold text-red-700 hover:bg-red-50 dark:border-red-500/25 dark:text-red-300 dark:hover:bg-red-500/10">Rechazar</button></div>}
                        {canManage && incident.workflowStatus === 'approved' && <button type="button" onClick={() => setIncidentAction({ incident, action: 'finalize' })} className="rounded-md border border-blue-200 px-2 py-1.5 text-[9px] font-semibold text-blue-700 hover:bg-blue-50 dark:border-blue-500/25 dark:text-blue-300 dark:hover:bg-blue-500/10">Finalizar</button>}
                        {(!canManage || ['rejected', 'finalized'].includes(incident.workflowStatus)) && <span className="text-[9px] text-slate-400">Sin acciones</span>}
                      </td>
                    </tr>
                  ))}
                  {!incidents.length && <tr><td colSpan={7} className="py-10 text-center text-sm text-slate-500 dark:text-slate-400 midnight:text-cyan-500/70">No hay incidencias o licencias registradas.</td></tr>}
                </tbody>
              </table>
            </div>
          </section>

          <aside className={`${panelClass} p-4 sm:p-5`} aria-labelledby="incident-alerts-title">
            <div className="flex items-center justify-between gap-3"><h2 id="incident-alerts-title" className="text-sm font-semibold text-slate-900 dark:text-white midnight:text-cyan-50">Próximas reincorporaciones</h2><AlertTriangle size={16} className={upcomingAlerts.length ? 'text-amber-500' : 'text-emerald-500'} /></div>
            <p className="mt-1 text-[10px] text-slate-500 dark:text-slate-400 midnight:text-cyan-600">Alertas de incidencias aprobadas a 7 días o vencidas</p>
            <div className="mt-4 space-y-2">
              {upcomingAlerts.map((incident) => <article key={incident.id} className={`rounded-lg border p-3 ${incident.daysUntilReturn < 0 ? 'border-red-200 bg-red-50 dark:border-red-500/20 dark:bg-red-500/5' : 'border-amber-200 bg-amber-50 dark:border-amber-500/20 dark:bg-amber-500/5'}`}><h3 className="text-[11px] font-semibold text-slate-800 dark:text-slate-200 midnight:text-cyan-100">{incident.memberName}</h3><p className="mt-1 text-[10px] text-slate-500 dark:text-slate-400">{incident.typeLabel} · {formatDisplayDate(incident.endDate)}</p><strong className={`mt-2 block text-[10px] ${incident.daysUntilReturn < 0 ? 'text-red-700 dark:text-red-300' : 'text-amber-700 dark:text-amber-300'}`}>{incident.daysUntilReturn < 0 ? `Vencida hace ${Math.abs(incident.daysUntilReturn)} ${Math.abs(incident.daysUntilReturn) === 1 ? 'día' : 'días'}` : incident.daysUntilReturn === 0 ? 'Reincorporación hoy' : `Reincorporación en ${incident.daysUntilReturn} ${incident.daysUntilReturn === 1 ? 'día' : 'días'}`}</strong></article>)}
              {!upcomingAlerts.length && <p className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-[10px] text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/5 dark:text-emerald-300">No hay reincorporaciones próximas ni incidencias vencidas.</p>}
            </div>
          </aside>
        </div>

        <section className={`${panelClass} w-full`} aria-labelledby="status-history-title">
          <h2 id="status-history-title" className="px-4 pt-5 text-base font-semibold text-slate-900 transition-colors duration-300 dark:text-white midnight:text-cyan-50 sm:px-5">Historial de Cambios de Estado</h2>
          <div className="mt-3 max-h-[360px] overflow-auto px-4 pb-3 sm:px-5">
            <table className="w-full min-w-[660px] border-collapse text-left text-xs">
              <thead><tr className="border-b border-slate-200 text-[10px] text-slate-500 transition-colors duration-300 dark:border-[#30363d] midnight:border-cyan-900/30 midnight:text-cyan-600">
                {['Fecha', 'Miembro', 'Estado Anterior', 'Estado Nuevo', 'Motivo / Comentario'].map((label) => <th scope="col" key={label} className="px-2 py-3 font-semibold first:pl-0">{label}</th>)}
              </tr></thead>
              <tbody>
                {history.map((change) => <tr key={change.id} className="border-b border-slate-200 last:border-0 transition-colors duration-300 dark:border-[#30363d]/70 midnight:border-cyan-900/30">
                  <td className="whitespace-nowrap py-3.5 pr-2 font-mono text-[11px] text-slate-500 transition-colors duration-300 dark:text-slate-400 midnight:text-cyan-600"><time dateTime={change.date}>{formatDisplayDate(change.date, { day: '2-digit', month: 'short' })}</time></td>
                  <td className="whitespace-nowrap px-2 py-3.5 text-[11px] font-medium text-slate-800 transition-colors duration-300 dark:text-slate-200 midnight:text-cyan-100">{change.name}</td>
                  <td className="px-2 py-3.5"><StatusBadge status={change.previousStatus} /></td>
                  <td className="px-2 py-3.5"><StatusBadge status={change.nextStatus} /></td>
                  <td className="min-w-[200px] px-2 py-3.5 text-[11px] leading-relaxed text-slate-500 transition-colors duration-300 dark:text-slate-400 midnight:text-cyan-500/70">{change.comment}{change.changedByName && <span className="mt-1 block text-[9px] text-slate-400">Por {change.changedByName}</span>}</td>
                </tr>)}
                {!history.length && <tr><td colSpan={5} className="py-8 text-center text-sm text-slate-500 dark:text-slate-400 midnight:text-cyan-500/70">No hay cambios de estado registrados en el historial.</td></tr>}
              </tbody>
            </table>
          </div>
        </section>
        </>}
      </div>
      {incidentDialogOpen && canManage && <PersonnelIncidentDialog data={data} onSubmit={saveIncident} onClose={() => setIncidentDialogOpen(false)} />}
      {incidentAction && canManage && <IncidentActionDialog incident={incidentAction.incident} action={incidentAction.action} onSubmit={submitIncidentAction} onClose={() => setIncidentAction(null)} />}
    </main>
  );
}
