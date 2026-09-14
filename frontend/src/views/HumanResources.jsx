import React, { useEffect, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, Download, Pencil, RotateCcw, Save, UserRoundCog, X } from 'lucide-react';
import { buildPersonnelCsv, filterPersonnel, getIncidentDuration, personnelIncidentTypes, personnelStatuses, registerPersonnelIncident, summarizePersonnel, updatePersonnel } from './humanResourcesData';

const panelClass = 'min-w-0 overflow-hidden rounded-xl border border-[#30363d] bg-[#161b22]';
const inputClass = 'mt-2 w-full rounded-lg border border-[#30363d] bg-[#0d1117] px-3 py-2.5 text-sm text-slate-100 outline-none focus:border-cyan-400';
const pageSize = 8;

function getInitials(name) {
  return name.split(' ').filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
}

function StatusBadge({ status }) {
  const details = personnelStatuses.find((item) => item.id === status);
  return <span className={`inline-flex whitespace-nowrap rounded border px-2 py-1 text-[10px] font-semibold ${details.className}`}>{details.label}</span>;
}

function PersonnelEditor({ member, onSave, onCancel, editingProject }) {
  const [draft, setDraft] = useState({ project: member.project, status: member.status, availability: member.availability, comment: '' });
  const [error, setError] = useState('');
  const changeField = (field) => (event) => {
    setDraft((current) => ({ ...current, [field]: event.target.value }));
    setError('');
  };

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        try { onSave(member.id, draft); } catch (saveError) { setError(saveError.message); }
      }}
      className="rounded-xl border border-cyan-400/30 bg-[#161b22] p-4 sm:p-5"
      aria-labelledby="personnel-editor-title"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 id="personnel-editor-title" className="text-base font-semibold text-white">{editingProject ? 'Asignar proyecto' : 'Editar disponibilidad y estado'}</h2>
          <p className="mt-1 text-xs text-slate-400">{member.name} · {member.area}</p>
        </div>
        <button type="button" onClick={onCancel} aria-label="Cerrar edición" className="rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-white"><X size={18} /></button>
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <label className="text-xs text-slate-400">Proyecto asignado
          <input autoFocus={editingProject} required maxLength={100} value={draft.project} onChange={changeField('project')} className={inputClass} />
        </label>
        <label className="text-xs text-slate-400">Estado
          <select autoFocus={!editingProject} value={draft.status} onChange={changeField('status')} className={inputClass}>
            {personnelStatuses.map((status) => <option key={status.id} value={status.id}>{status.label}</option>)}
          </select>
        </label>
        <label className="text-xs text-slate-400">Disponibilidad (%)
          <input type="number" min="0" max="100" step="1" required value={draft.availability} onChange={changeField('availability')} className={inputClass} />
        </label>
        <label className="text-xs text-slate-400">Motivo / comentario
          <input maxLength={200} value={draft.comment} onChange={changeField('comment')} placeholder="Comentario opcional" className={inputClass} />
        </label>
      </div>
      {error && <p role="alert" className="mt-3 text-xs text-red-400">{error}</p>}
      <div className="mt-4 flex flex-wrap justify-end gap-2">
        <button type="button" onClick={onCancel} className="rounded-lg border border-[#30363d] px-4 py-2 text-xs text-slate-300 hover:bg-white/5">Cancelar</button>
        <button type="submit" className="inline-flex items-center gap-2 rounded-lg bg-cyan-400 px-4 py-2 text-xs font-semibold text-slate-950 hover:bg-cyan-300"><Save size={14} /> Guardar cambios</button>
      </div>
    </form>
  );
}

function formatDateInput(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function PersonnelIncidentDialog({ data, onSubmit, onClose }) {
  const today = new Date();
  const returnDate = new Date(today);
  returnDate.setDate(returnDate.getDate() + 1);
  const [draft, setDraft] = useState({
    memberId: data.members[0]?.id ?? '',
    type: personnelIncidentTypes[0].id,
    startDate: formatDateInput(today),
    endDate: formatDateInput(returnDate),
    status: 'standby',
    availability: 0,
    backupMemberId: '',
    comment: '',
  });
  const [error, setError] = useState('');
  const duration = getIncidentDuration(draft.startDate, draft.endDate);
  const changeField = (field) => (event) => { setDraft((current) => ({ ...current, [field]: event.target.value })); setError(''); };
  const selectedMember = data.members.find((member) => member.id === draft.memberId);

  useEffect(() => {
    const closeWithEscape = (event) => { if (event.key === 'Escape') onClose(); };
    document.addEventListener('keydown', closeWithEscape);
    return () => document.removeEventListener('keydown', closeWithEscape);
  }, [onClose]);

  return (
    <div role="presentation" onMouseDown={onClose} className="fixed inset-0 z-[90] flex items-center justify-center bg-[#020617]/85 p-3 backdrop-blur-sm sm:p-5">
      <section role="dialog" aria-modal="true" aria-labelledby="personnel-incident-title" onMouseDown={(event) => event.stopPropagation()} className="max-h-[94vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-[#303b50] bg-[#111a2d] shadow-[0_25px_90px_rgba(0,0,0,0.72)]">
        <header className="flex items-start justify-between gap-4 border-b border-[#30363d] px-4 py-4 sm:px-6">
          <div className="flex gap-3"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-cyan-400/25 bg-cyan-500/15 text-cyan-400"><CalendarDays size={20} /></span><div><h2 id="personnel-incident-title" className="text-lg font-bold text-white">Registrar Incidencia / Licencia</h2><p className="mt-1 text-xs text-slate-400">Gestiona ausencias, permisos o variaciones temporales de disponibilidad del personal.</p></div></div>
          <button type="button" onClick={onClose} aria-label="Cerrar registro de incidencia" className="rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-white"><X size={19} /></button>
        </header>

        <form onSubmit={(event) => { event.preventDefault(); try { onSubmit(draft); } catch (submitError) { setError(submitError.message); } }} className="p-4 sm:p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-[10px] font-semibold uppercase tracking-wide text-slate-300">Integrante del personal <span className="text-cyan-400">*</span><select autoFocus required value={draft.memberId} onChange={(event) => { const memberId = event.target.value; setDraft((current) => ({ ...current, memberId, backupMemberId: current.backupMemberId === memberId ? '' : current.backupMemberId })); setError(''); }} className={inputClass}>{data.members.map((member) => <option key={member.id} value={member.id}>{member.name} ({member.area})</option>)}</select></label>
            <label className="text-[10px] font-semibold uppercase tracking-wide text-slate-300">Tipo de incidencia <span className="text-cyan-400">*</span><select required value={draft.type} onChange={changeField('type')} className={inputClass}>{personnelIncidentTypes.map((type) => <option key={type.id} value={type.id}>{type.label}</option>)}</select></label>
            <label className="text-[10px] font-semibold uppercase tracking-wide text-slate-300">Fecha de inicio / desde <span className="text-cyan-400">*</span><input type="date" required value={draft.startDate} onChange={changeField('startDate')} className={inputClass} /></label>
            <label className="text-[10px] font-semibold uppercase tracking-wide text-slate-300">Fecha de retorno / hasta <span className="text-cyan-400">*</span><input type="date" required min={draft.startDate} value={draft.endDate} onChange={changeField('endDate')} className={inputClass} /></label>
          </div>

          <p className={`mt-3 flex items-center gap-2 text-[10px] ${duration ? 'text-cyan-300' : 'text-red-400'}`}><CalendarDays size={13} />{duration ? `Duración: ${duration.calendarDays} ${duration.calendarDays === 1 ? 'día calendario' : 'días calendario'} (${duration.businessDays} ${duration.businessDays === 1 ? 'día hábil' : 'días hábiles'})` : 'La fecha de retorno no puede ser anterior al inicio.'}</p>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <label className="text-[10px] font-semibold uppercase tracking-wide text-slate-300">Estado operativo resultante <span className="text-cyan-400">*</span><select required value={draft.status} onChange={changeField('status')} className={inputClass}>{personnelStatuses.map((status) => <option key={status.id} value={status.id}>{status.id === 'standby' ? 'Stand-by (Fuera de obra)' : status.id === 'support' ? 'En apoyo (Disponibilidad parcial)' : 'Activo en obra'}</option>)}</select></label>
            <label className="text-[10px] font-semibold uppercase tracking-wide text-slate-300">Disponibilidad en este periodo <span className="text-cyan-400">*</span><div className="relative"><input type="number" min="0" max="100" step="1" required value={draft.availability} onChange={changeField('availability')} className={`${inputClass} pr-9`} /><span className="absolute bottom-2.5 right-3 text-xs text-slate-500">%</span></div></label>
          </div>

          <label className="mt-5 block text-[10px] font-semibold uppercase tracking-wide text-slate-300">Técnico de respaldo / cobertura temporal <span className="normal-case text-slate-500">(opcional inteligente)</span><select value={draft.backupMemberId} onChange={changeField('backupMemberId')} className={inputClass}><option value="">Sin técnico de respaldo</option>{data.members.filter((member) => member.id !== draft.memberId).map((member) => <option key={member.id} value={member.id}>{member.name} · {member.area} · {member.project}</option>)}</select></label>

          <label className="mt-5 block text-[10px] font-semibold uppercase tracking-wide text-slate-300">Motivo / comentario detallado <span className="text-cyan-400">*</span><textarea required minLength={5} maxLength={500} rows={4} value={draft.comment} onChange={changeField('comment')} placeholder="Describe el motivo, la entrega de turnos y las coordinaciones necesarias..." className={`${inputClass} resize-y leading-relaxed`} /></label>

          {selectedMember && <p className="mt-3 text-[10px] text-slate-500">Estado actual de {selectedMember.name}: {personnelStatuses.find((status) => status.id === selectedMember.status)?.label}, {selectedMember.availability}% de disponibilidad.</p>}
          {error && <p role="alert" className="mt-4 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-400">{error}</p>}

          <footer className="mt-5 flex flex-col-reverse gap-3 border-t border-[#30363d] pt-4 sm:flex-row sm:items-center sm:justify-between"><p className="text-[10px] text-slate-500"><span className="text-cyan-400">●</span> Se actualizarán la matriz y el historial en tiempo real.</p><div className="flex justify-end gap-2"><button type="button" onClick={onClose} className="rounded-lg border border-[#30363d] px-4 py-2.5 text-xs text-slate-300 hover:bg-white/5">Cancelar</button><button type="submit" className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-blue-500"><CalendarDays size={15} /> Registrar incidencia</button></div></footer>
        </form>
      </section>
    </div>
  );
}

export default function HumanResources({ data, onChange, query = '', onQueryChange, canManage = false }) {
  const [statusFilter, setStatusFilter] = useState('all');
  const [pageSelection, setPageSelection] = useState({ query: '', status: 'all', page: 1 });
  const [editing, setEditing] = useState(null);
  const [incidentDialogOpen, setIncidentDialogOpen] = useState(false);
  const [feedback, setFeedback] = useState('');
  const summary = summarizePersonnel(data.members);
  const searchMatches = filterPersonnel(data.members, query);
  const filteredMembers = filterPersonnel(data.members, query, statusFilter);
  const totalPages = Math.max(1, Math.ceil(filteredMembers.length / pageSize));
  const page = pageSelection.query === query && pageSelection.status === statusFilter ? Math.min(pageSelection.page, totalPages) : 1;
  const visibleMembers = filteredMembers.slice((page - 1) * pageSize, page * pageSize);
  const editingMember = editing && data.members.find((member) => member.id === editing.id);
  const summaryCards = [{ id: 'all', label: 'Total personal', value: summary.total, dotClass: 'bg-slate-400' }, ...personnelStatuses.map((status) => ({ ...status, label: status.summaryLabel, value: summary[status.id] }))];

  const openEditor = (member, mode = 'status') => {
    setFeedback('');
    setEditing({ id: member.id, mode });
  };

  const saveMember = (memberId, draft) => {
    const updatedData = updatePersonnel(data, memberId, draft);
    onChange(updatedData);
    setEditing(null);
    setFeedback(updatedData === data ? 'No había cambios que guardar.' : 'Cambio aplicado en esta sesión de demostración.');
  };

  const saveIncident = (draft) => {
    const updatedData = registerPersonnelIncident(data, draft);
    const member = updatedData.members.find((item) => item.id === draft.memberId);
    onChange(updatedData);
    setIncidentDialogOpen(false);
    setEditing(null);
    setFeedback(`Incidencia registrada para ${member.name} y disponibilidad actualizada.`);
  };
  const exportMatrix = () => {
    const blob = new Blob([`\uFEFF${buildPersonnelCsv(data.members)}`], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'matriz-recursos-humanos.csv';
    link.click();
    URL.revokeObjectURL(url);
    setFeedback('Matriz de Recursos Humanos exportada correctamente.');
  };

  return (
    <main className="min-w-0 flex-1 overflow-y-auto bg-[#0d1117] p-4 text-slate-100 md:p-6 lg:p-8">
      <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-5 pb-8">
        <header className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white md:text-[28px]">Recursos Humanos y Estados</h1>
            <p className="mt-1 text-sm text-slate-400">Administración de disponibilidad y asignación del personal</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">{canManage ? <><button type="button" onClick={exportMatrix} className="inline-flex items-center gap-2 rounded-lg border border-[#30363d] bg-[#111827] px-3 py-2.5 text-xs text-slate-300 hover:border-cyan-400/30 hover:text-white"><Download size={15} /> Exportar Matriz</button><button type="button" onClick={() => { setIncidentDialogOpen(true); setFeedback(''); }} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-blue-500"><CalendarDays size={16} /> Registrar Incidencia / Licencia</button></> : <span className="w-fit rounded-md border border-[#30363d] px-2.5 py-1.5 text-[10px] text-slate-500">Vista de consulta</span>}</div>
        </header>

        <section aria-label="Resumen de personal" className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
          {summaryCards.map((card) => (
            <button key={card.id} type="button" onClick={() => setStatusFilter(card.id)} aria-pressed={statusFilter === card.id} aria-label={`${card.label}: ${card.value}`} className={`rounded-xl border bg-[#161b22] p-4 text-left transition-colors hover:border-cyan-400/50 sm:p-5 ${statusFilter === card.id && card.id !== 'all' ? 'border-cyan-400/60' : 'border-[#30363d]'}`}>
              <span className="flex items-center justify-between gap-2 text-[10px] font-semibold uppercase tracking-wide text-slate-400"><span>{card.label}</span><i className={`h-1.5 w-1.5 shrink-0 rounded-full ${card.dotClass}`} /></span>
              <strong className="mt-3 block text-3xl font-bold text-white">{card.value}</strong>
            </button>
          ))}
        </section>

        <p role="status" className={feedback ? 'text-xs text-cyan-300' : 'sr-only'}>{feedback}</p>
        {editingMember && <PersonnelEditor key={`${editing.id}-${editing.mode}`} member={editingMember} editingProject={editing.mode === 'project'} onSave={saveMember} onCancel={() => setEditing(null)} />}

        <div className="grid min-w-0 items-start gap-5 xl:grid-cols-[minmax(0,1.8fr)_minmax(280px,1fr)]">
          <section className={panelClass} aria-labelledby="personnel-assignment-title">
            <div className="flex flex-wrap items-center justify-between gap-3 px-4 pt-5 sm:px-5">
              <h2 id="personnel-assignment-title" className="text-base font-semibold text-white">Asignación de Personal</h2>
              <div className="flex items-center gap-3"><span className="inline-flex items-center gap-1.5 text-[9px] text-cyan-400"><i className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Sincronizado en tiempo real</span>{(query || statusFilter !== 'all') && <button type="button" onClick={() => { setStatusFilter('all'); onQueryChange(''); }} className="inline-flex items-center gap-1.5 text-[10px] text-cyan-400 hover:text-cyan-300"><RotateCcw size={12} /> Limpiar filtros</button>}</div>
            </div>
            <div className="mt-3 overflow-x-auto px-4 sm:px-5">
              <table className="w-full min-w-[700px] border-collapse text-left text-xs">
                <thead><tr className="border-b border-[#30363d] text-[10px] text-slate-500">
                  {['Nombre', 'Área Técnica', 'Proyecto Asignado', 'Estado', 'Disponibilidad', 'Acción'].map((label) => <th scope="col" key={label} className="px-2 py-3 font-semibold first:pl-0 last:pr-0">{label}</th>)}
                </tr></thead>
                <tbody>
                  {visibleMembers.map((member) => (
                    <tr key={member.id} className="border-b border-[#30363d]/70 last:border-b-0 hover:bg-white/[0.02]">
                      <td className="whitespace-nowrap py-3.5 pr-2 font-medium text-slate-100"><span className="flex items-center gap-2"><i className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-500/10 text-[9px] font-bold not-italic text-blue-300">{getInitials(member.name)}</i><span>{member.name}</span></span></td>
                      <td className="whitespace-nowrap px-2 py-3.5 text-[11px] text-slate-400">{member.area}</td>
                      <td className="max-w-[180px] truncate px-2 py-3.5 text-[11px] text-slate-300" title={member.project}>{member.project}</td>
                      <td className="px-2 py-3.5"><StatusBadge status={member.status} /></td>
                      <td className="px-2 py-3.5"><div className="flex min-w-[90px] items-center gap-2">
                        <div role="progressbar" aria-label={`Disponibilidad de ${member.name}`} aria-valuenow={member.availability} aria-valuemin={0} aria-valuemax={100} className="h-1 w-16 overflow-hidden rounded-full bg-[#30363d]">
                          <div className="h-full rounded-full bg-blue-400" style={{ width: `${member.availability}%` }} />
                        </div><span className="text-[10px] tabular-nums text-slate-300">{member.availability}%</span>
                      </div></td>
                      <td className="py-2 pl-2"><div className="flex gap-0.5">
                        <button type="button" onClick={() => openEditor(member)} aria-label={`Editar estado de ${member.name}`} title="Editar estado y disponibilidad" className="rounded p-1.5 text-slate-400 hover:bg-white/5 hover:text-cyan-400"><Pencil size={14} /></button>
                        <button type="button" onClick={() => openEditor(member, 'project')} aria-label={`Asignar proyecto a ${member.name}`} title="Asignar proyecto" className="rounded p-1.5 text-slate-400 hover:bg-white/5 hover:text-cyan-400"><UserRoundCog size={14} /></button>
                      </div></td>
                    </tr>
                  ))}
                  {!visibleMembers.length && <tr><td colSpan={6} className="py-12 text-center text-sm text-slate-400">No se encontró personal con estos filtros.</td></tr>}
                </tbody>
              </table>
            </div>
            <footer className="mt-2 flex flex-wrap items-center justify-between gap-3 border-t border-[#30363d] px-4 py-3 text-[10px] text-slate-500 sm:px-5">
              <span>{filteredMembers.length ? `${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, filteredMembers.length)}` : '0'} de {filteredMembers.length} integrantes</span>
              <div className="flex items-center gap-2">
                <button type="button" aria-label="Página anterior de personal" disabled={page === 1} onClick={() => setPageSelection({ query, status: statusFilter, page: page - 1 })} className="rounded border border-[#30363d] p-1 text-slate-300 hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-30"><ChevronLeft size={14} /></button>
                <span>{page} / {totalPages}</span>
                <button type="button" aria-label="Página siguiente de personal" disabled={page === totalPages} onClick={() => setPageSelection({ query, status: statusFilter, page: page + 1 })} className="rounded border border-[#30363d] p-1 text-slate-300 hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-30"><ChevronRight size={14} /></button>
              </div>
            </footer>
          </section>

          <section className={`${panelClass} p-4 sm:p-5`} aria-labelledby="team-status-title">
            <h2 id="team-status-title" className="text-base font-semibold text-white">Estado de Equipos</h2>
            <p className="mt-1 text-[10px] text-slate-500">Distribución de cuadrillas operativas</p>
            <div className="mt-5 grid grid-cols-3 gap-2">
              {personnelStatuses.map((status) => {
                const members = searchMatches.filter((member) => member.status === status.id);
                return <div key={status.id} className="min-w-0">
                  <button type="button" onClick={() => setStatusFilter(statusFilter === status.id ? 'all' : status.id)} aria-pressed={statusFilter === status.id} className={`w-full rounded-md border px-1 py-2 text-[10px] font-semibold uppercase ${status.className}`}>{status.label} <span className="ml-1 opacity-70">{members.length}</span></button>
                  <div className="mt-3 flex max-h-[380px] flex-col gap-2 overflow-y-auto">
                    {members.map((member) => <button key={member.id} type="button" onClick={() => openEditor(member)} title={`${member.name} · ${member.project}`} className="truncate rounded-md border border-[#30363d] bg-[#0d1117] px-2 py-2 text-left text-[10px] text-slate-300 hover:border-cyan-400/50 hover:text-white">{member.name}</button>)}
                    {!members.length && <p className="py-2 text-center text-[10px] text-slate-600">Sin personal</p>}
                  </div>
                </div>;
              })}
            </div>
            <button type="button" onClick={() => { setStatusFilter('all'); setFeedback('Mostrando el balance completo de carga del personal.'); }} className="mt-5 w-full border-t border-[#30363d] pt-4 text-center text-[10px] font-medium text-cyan-400 hover:text-cyan-300">Ver balance de carga completo →</button>
          </section>
        </div>

        <section className={`${panelClass} w-full`} aria-labelledby="status-history-title">
          <h2 id="status-history-title" className="px-4 pt-5 text-base font-semibold text-white sm:px-5">Historial de Cambios de Estado</h2>
          <div className="mt-3 max-h-[360px] overflow-auto px-4 pb-3 sm:px-5">
            <table className="w-full min-w-[660px] border-collapse text-left text-xs">
              <thead><tr className="border-b border-[#30363d] text-[10px] text-slate-500">
                {['Fecha', 'Miembro', 'Estado Anterior', 'Estado Nuevo', 'Motivo / Comentario'].map((label) => <th scope="col" key={label} className="px-2 py-3 font-semibold first:pl-0">{label}</th>)}
              </tr></thead>
              <tbody>{data.history.map((change) => <tr key={change.id} className="border-b border-[#30363d]/70 last:border-0">
                <td className="whitespace-nowrap py-3.5 pr-2 font-mono text-[11px] text-slate-500"><time dateTime={change.date}>{new Date(`${change.date}T12:00:00`).toLocaleDateString('es-PE', { day: '2-digit', month: 'short' })}</time></td>
                <td className="whitespace-nowrap px-2 py-3.5 text-[11px] font-medium text-slate-200">{change.name}</td>
                <td className="px-2 py-3.5"><StatusBadge status={change.previousStatus} /></td>
                <td className="px-2 py-3.5"><StatusBadge status={change.nextStatus} /></td>
                <td className="min-w-[200px] px-2 py-3.5 text-[11px] leading-relaxed text-slate-400">{change.comment}</td>
              </tr>)}</tbody>
            </table>
          </div>
        </section>
      </div>
      {incidentDialogOpen && canManage && <PersonnelIncidentDialog data={data} onSubmit={saveIncident} onClose={() => setIncidentDialogOpen(false)} />}
    </main>
  );
}
