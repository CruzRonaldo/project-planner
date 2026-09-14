import React, { useEffect, useState } from 'react';
import { Check, FileDown, Flag, Minus, MoreVertical, Plus, SlidersHorizontal, X } from 'lucide-react';
import { adjustProjectSchedule, createGlobalMilestone, createStrategicPlanningData, formatMilestoneDate, formatPlanningPeriod, milestoneStatuses, milestoneValidators, planningMonths, scheduleAdjustmentReasons } from './strategicPlanningData';

const months = planningMonths.map((month) => month.short);

function formatDateInput(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function AdjustScheduleDialog({ data, initialProjectId, onSubmit, onClose }) {
  const initialProject = data.projects.find((project) => project.id === initialProjectId) ?? data.projects[1] ?? data.projects[0];
  const [draft, setDraft] = useState({ projectId: initialProject?.id ?? '', start: initialProject?.start ?? 1, duration: initialProject?.duration ?? 1, reason: scheduleAdjustmentReasons[0] });
  const [error, setError] = useState('');
  const selectedProject = data.projects.find((project) => project.id === draft.projectId);
  const start = Number(draft.start);
  const duration = Number(draft.duration);
  const maxDuration = Math.max(1, 13 - start);
  const previewPeriod = formatPlanningPeriod(start, duration);

  useEffect(() => {
    const closeWithEscape = (event) => { if (event.key === 'Escape') onClose(); };
    document.addEventListener('keydown', closeWithEscape);
    return () => document.removeEventListener('keydown', closeWithEscape);
  }, [onClose]);

  const selectProject = (event) => {
    const project = data.projects.find((item) => item.id === event.target.value);
    setDraft((current) => ({ ...current, projectId: project.id, start: project.start, duration: project.duration }));
    setError('');
  };
  const selectStart = (event) => {
    const nextStart = Number(event.target.value);
    setDraft((current) => ({ ...current, start: nextStart, duration: Math.min(Number(current.duration), 13 - nextStart) }));
    setError('');
  };
  const changeDuration = (amount) => {
    setDraft((current) => ({ ...current, duration: Math.max(1, Math.min(13 - Number(current.start), Number(current.duration) + amount)) }));
    setError('');
  };

  return (
    <div role="presentation" onMouseDown={onClose} className="fixed inset-0 z-[90] flex items-center justify-center bg-[#020617]/85 p-3 backdrop-blur-sm sm:p-5">
      <section role="dialog" aria-modal="true" aria-labelledby="adjust-schedule-title" onMouseDown={(event) => event.stopPropagation()} className="max-h-[94vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-[#303b50] bg-[#111a2d] shadow-[0_25px_90px_rgba(0,0,0,0.72)]">
        <header className="flex items-start justify-between gap-4 border-b border-[#30363d] px-4 py-4 sm:px-6">
          <div className="flex gap-3"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-cyan-400/25 bg-cyan-500/15 text-cyan-400"><SlidersHorizontal size={20} /></span><div><h2 id="adjust-schedule-title" className="text-lg font-bold text-white">Ajustar Calendario de Proyecto</h2><p className="mt-1 text-xs text-slate-400">Modifica la ventana de meses y plazos en el diagrama de Gantt.</p></div></div>
          <button type="button" onClick={onClose} aria-label="Cerrar ajuste de calendario" className="rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-white"><X size={19} /></button>
        </header>

        <form onSubmit={(event) => { event.preventDefault(); try { onSubmit(draft); } catch (submitError) { setError(submitError.message); } }} className="p-4 sm:p-6">
          <label className="block text-[10px] font-semibold uppercase tracking-wide text-slate-300">Proyecto a reprogramar <span className="text-red-400">*</span><select autoFocus required value={draft.projectId} onChange={selectProject} className="mt-2 w-full rounded-lg border border-[#30363d] bg-[#0d1628] px-3 py-3 text-sm text-white outline-none focus:border-cyan-400">{data.projects.map((project) => <option key={project.id} value={project.id}>{project.name} — {project.area}</option>)}</select></label>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <label className="text-[10px] font-semibold uppercase tracking-wide text-slate-300">Mes de inicio <span className="text-red-400">*</span><select required value={draft.start} onChange={selectStart} className="mt-2 w-full rounded-lg border border-[#30363d] bg-[#0d1628] px-3 py-3 text-sm text-white outline-none focus:border-cyan-400">{planningMonths.map((month) => <option key={month.number} value={month.number}>{month.label}</option>)}</select></label>
            <fieldset><legend className="text-[10px] font-semibold uppercase tracking-wide text-slate-300">Duración total <span className="text-red-400">*</span></legend><div className="mt-2 grid grid-cols-[42px_1fr_42px] overflow-hidden rounded-lg border border-[#30363d] bg-[#0d1628]"><button type="button" onClick={() => changeDuration(-1)} disabled={duration <= 1} aria-label="Reducir duración" className="flex items-center justify-center border-r border-[#30363d] text-slate-400 hover:bg-white/5 hover:text-white disabled:opacity-30"><Minus size={15} /></button><output className="flex min-h-11 items-center justify-center px-3 text-sm font-semibold text-white">{duration} {duration === 1 ? 'Mes' : 'Meses'} <span className="ml-1 text-[10px] font-normal text-slate-500">({previewPeriod.split(' (')[0]})</span></output><button type="button" onClick={() => changeDuration(1)} disabled={duration >= maxDuration} aria-label="Aumentar duración" className="flex items-center justify-center border-l border-[#30363d] text-slate-400 hover:bg-white/5 hover:text-white disabled:opacity-30"><Plus size={15} /></button></div></fieldset>
          </div>

          <section className="mt-5 rounded-xl border border-[#30363d] bg-[#0b1628] p-4" aria-labelledby="schedule-preview-title"><div className="flex items-center justify-between gap-3"><h3 id="schedule-preview-title" className="text-xs font-medium text-slate-400">Vista previa del cronograma resultante:</h3><span className="rounded border border-emerald-500/20 bg-emerald-500/10 px-2 py-1 text-[9px] font-semibold text-emerald-400">Ruta Crítica Activa</span></div><div className="mt-4 min-w-[420px]"><div className="grid grid-cols-12">{months.map((month) => <span key={month} className="text-center text-[9px] text-slate-500">{month}</span>)}</div><div className="relative mt-2 h-9 overflow-hidden rounded-md border border-blue-200/10 bg-[#09111f]" style={{ backgroundImage: 'linear-gradient(to right, rgba(100, 136, 186, .15) 1px, transparent 1px)', backgroundSize: '8.333333% 100%' }}><div className="absolute inset-y-1 flex items-center justify-center rounded-md px-2 text-[10px] font-bold text-white" style={{ left: `${((start - 1) / 12) * 100}%`, width: `${(duration / 12) * 100}%`, backgroundColor: selectedProject?.color }}><span className="truncate">{previewPeriod}</span></div></div></div></section>

          <label className="mt-5 block text-[10px] font-semibold uppercase tracking-wide text-slate-300">Motivo del reajuste / historial de auditoría <span className="text-red-400">*</span><select required value={draft.reason} onChange={(event) => { setDraft((current) => ({ ...current, reason: event.target.value })); setError(''); }} className="mt-2 w-full rounded-lg border border-[#30363d] bg-[#0d1628] px-3 py-3 text-sm text-white outline-none focus:border-cyan-400">{scheduleAdjustmentReasons.map((reason) => <option key={reason}>{reason}</option>)}</select></label>

          {error && <p role="alert" className="mt-4 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-400">{error}</p>}
          <footer className="mt-5 flex flex-col-reverse gap-3 border-t border-[#30363d] pt-4 sm:flex-row sm:items-center sm:justify-between"><p className="text-[10px] text-slate-500"><span className="text-cyan-400">●</span> Se actualizará el Gantt general y quedará registro del cambio.</p><div className="flex justify-end gap-2"><button type="button" onClick={onClose} className="rounded-lg border border-[#30363d] px-4 py-2.5 text-xs text-slate-300 hover:bg-white/5">Cancelar</button><button type="submit" className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-blue-500"><Check size={15} /> Guardar ajustes</button></div></footer>
        </form>
      </section>
    </div>
  );
}

export function NewGlobalMilestoneDialog({ data, onSubmit, onClose }) {
  const [draft, setDraft] = useState({
    projectId: data.projects[0]?.id ?? '',
    status: 'pending',
    title: '',
    targetDate: formatDateInput(new Date()),
    validator: milestoneValidators[0],
    description: '',
    blocking: true,
  });
  const [error, setError] = useState('');
  const changeField = (field) => (event) => { setDraft((current) => ({ ...current, [field]: event.target.value })); setError(''); };

  useEffect(() => {
    const closeWithEscape = (event) => { if (event.key === 'Escape') onClose(); };
    document.addEventListener('keydown', closeWithEscape);
    return () => document.removeEventListener('keydown', closeWithEscape);
  }, [onClose]);

  return (
    <div role="presentation" onMouseDown={onClose} className="fixed inset-0 z-[90] flex items-center justify-center bg-[#020617]/85 p-3 backdrop-blur-sm sm:p-5">
      <section role="dialog" aria-modal="true" aria-labelledby="new-global-milestone-title" onMouseDown={(event) => event.stopPropagation()} className="max-h-[94vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-[#303b50] bg-[#111a2d] shadow-[0_25px_90px_rgba(0,0,0,0.72)]">
        <header className="flex items-start justify-between gap-4 border-b border-[#30363d] px-4 py-4 sm:px-6"><div className="flex gap-3"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-cyan-400/25 bg-cyan-500/15 text-cyan-400"><Flag size={20} /></span><div><h2 id="new-global-milestone-title" className="text-lg font-bold text-white">Nuevo Hito Global</h2><p className="mt-1 text-xs text-slate-400">Define una entrega crítica, auditoría o fase clave en el calendario anual.</p></div></div><button type="button" onClick={onClose} aria-label="Cerrar nuevo hito" className="rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-white"><X size={19} /></button></header>
        <form onSubmit={(event) => { event.preventDefault(); try { onSubmit(draft); } catch (submitError) { setError(submitError.message); } }} className="p-4 sm:p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-xs text-slate-300">Proyecto asociado <span className="text-cyan-400">*</span><select autoFocus required value={draft.projectId} onChange={changeField('projectId')} className="mt-2 w-full rounded-lg border border-[#30363d] bg-[#0d1628] px-3 py-2.5 text-sm text-white outline-none focus:border-cyan-400">{data.projects.map((project) => <option key={project.id} value={project.id}>{project.name} ({project.code})</option>)}</select></label>
            <label className="text-xs text-slate-300">Estado inicial <span className="text-cyan-400">*</span><select required value={draft.status} onChange={changeField('status')} className="mt-2 w-full rounded-lg border border-[#30363d] bg-[#0d1628] px-3 py-2.5 text-sm text-white outline-none focus:border-cyan-400">{milestoneStatuses.map((status) => <option key={status.id} value={status.id}>{status.label}</option>)}</select></label>
          </div>
          <label className="mt-4 block text-xs text-slate-300">Nombre del hito / entrega crítica <span className="text-cyan-400">*</span><input required maxLength={120} value={draft.title} onChange={changeField('title')} placeholder="Entrega Cimentación y Pilotes Estructurales" className="mt-2 w-full rounded-lg border border-[#30363d] bg-[#0d1628] px-3 py-2.5 text-sm text-white outline-none placeholder:text-slate-600 focus:border-cyan-400" /></label>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="text-xs text-slate-300">Fecha límite programada <span className="text-cyan-400">*</span><input type="date" required value={draft.targetDate} onChange={changeField('targetDate')} className="mt-2 w-full rounded-lg border border-[#30363d] bg-[#0d1628] px-3 py-2.5 text-sm text-white outline-none focus:border-cyan-400" /></label>
            <label className="text-xs text-slate-300">Responsable de validación <span className="text-cyan-400">*</span><select required value={draft.validator} onChange={changeField('validator')} className="mt-2 w-full rounded-lg border border-[#30363d] bg-[#0d1628] px-3 py-2.5 text-sm text-white outline-none focus:border-cyan-400">{milestoneValidators.map((validator) => <option key={validator}>{validator}</option>)}</select></label>
          </div>
          <label className="mt-4 block text-xs text-slate-300">Descripción y entregables clave <span className="text-cyan-400">*</span><textarea required minLength={10} maxLength={600} rows={4} value={draft.description} onChange={changeField('description')} placeholder="Describe los criterios de aprobación, documentos y entregables..." className="mt-2 w-full resize-y rounded-lg border border-[#30363d] bg-[#0d1628] px-3 py-2.5 text-sm leading-relaxed text-white outline-none placeholder:text-slate-600 focus:border-cyan-400" /></label>
          <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-lg border border-[#30363d] bg-[#0b1628] p-3"><input type="checkbox" checked={draft.blocking} onChange={(event) => setDraft((current) => ({ ...current, blocking: event.target.checked }))} className="mt-0.5 accent-blue-500" /><span><strong className="block text-xs font-medium text-slate-200">Hito bloqueante</strong><small className="mt-1 block text-[10px] leading-relaxed text-slate-500">Detiene el cronograma si no se valida en la fecha objetivo y activa la ruta crítica.</small></span></label>
          {error && <p role="alert" className="mt-4 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-400">{error}</p>}
          <footer className="mt-5 flex flex-col-reverse gap-3 border-t border-[#30363d] pt-4 sm:flex-row sm:items-center sm:justify-between"><p className="text-[10px] text-slate-500">* Campos requeridos para dar de alta el hito.</p><div className="flex justify-end gap-2"><button type="button" onClick={onClose} className="rounded-lg border border-[#30363d] px-4 py-2.5 text-xs text-slate-300 hover:bg-white/5">Cancelar</button><button type="submit" className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-blue-500"><Plus size={15} /> Registrar Hito Global</button></div></footer>
        </form>
      </section>
    </div>
  );
}

export default function StrategicPlanning({ data = createStrategicPlanningData(), onChange = () => {}, canManage = false }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [milestoneDialogOpen, setMilestoneDialogOpen] = useState(false);
  const [adjustingProjectId, setAdjustingProjectId] = useState(null);
  const [feedback, setFeedback] = useState('');
  const projects = data.projects;
  const milestones = data.milestones ?? [];
  const saveSchedule = (draft) => {
    const updated = adjustProjectSchedule(data, draft);
    onChange(updated);
    setDialogOpen(false);
    setFeedback(updated === data ? 'No había cambios que guardar.' : 'Calendario actualizado y registrado en el historial de auditoría.');
  };
  const saveMilestone = (draft) => {
    const updated = createGlobalMilestone(data, draft);
    onChange(updated);
    setMilestoneDialogOpen(false);
    setFeedback(`Hito “${updated.milestones[0].title}” registrado en el calendario global.`);
  };
  const exportGantt = () => {
    window.print();
    setFeedback('Vista de impresión abierta. Selecciona “Guardar como PDF” para exportar el Gantt.');
  };

  return (
    <main className="flex-1 overflow-y-auto bg-[#0b1628] p-4 text-slate-100 md:p-6 lg:p-8">
      <div className="mx-auto flex w-full max-w-[1500px] flex-col gap-6 pb-8">
        <section className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white md:text-[28px]">Calendario Maestro 2026</h1>
            <p className="mt-1 text-sm text-slate-400">Planificación de ruta crítica y cronograma de infraestructura anual</p>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start">
            {canManage && <><button type="button" onClick={() => { setAdjustingProjectId(null); setDialogOpen(true); setFeedback(''); }} className="inline-flex items-center gap-2 rounded-lg border border-[#30363d] bg-[#111827] px-3 py-2.5 text-xs font-medium text-slate-300 hover:border-cyan-400/30 hover:text-white"><SlidersHorizontal size={15} /> Ajustar Calendario</button><button type="button" onClick={exportGantt} className="inline-flex items-center gap-2 rounded-lg border border-[#30363d] bg-[#111827] px-3 py-2.5 text-xs font-medium text-slate-300 hover:border-cyan-400/30 hover:text-white"><FileDown size={15} /> Exportar Gantt / PDF</button><button type="button" onClick={() => { setMilestoneDialogOpen(true); setFeedback(''); }} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-blue-500"><Plus size={15} /> Nuevo Hito Global</button></>}
            <label className="flex items-center gap-3 rounded-lg border border-blue-400/25 bg-blue-500/10 px-3 py-2 text-xs font-medium text-blue-300">
              <span>Año</span>
              <select
                defaultValue="2026"
                aria-label="Seleccionar año"
                className="cursor-pointer bg-transparent text-blue-300 outline-none"
              >
                <option className="bg-[#111f36]" value="2025">2025</option>
                <option className="bg-[#111f36]" value="2026">2026</option>
                <option className="bg-[#111f36]" value="2027">2027</option>
              </select>
            </label>
          </div>
        </section>

        <p role="status" className={feedback ? 'text-xs text-cyan-300' : 'sr-only'}>{feedback}</p>

        <section className="overflow-hidden rounded-2xl border border-blue-300/20 bg-[#111f36] shadow-[0_18px_45px_rgba(0,0,0,0.12)]">
          <div className="overflow-x-auto p-5 md:p-6">
            <div className="min-w-[820px]">
              <div className="grid grid-cols-[220px_1fr] border-b border-blue-200/20 pb-3">
                <div />
                <div className="grid grid-cols-12">
                  {months.map((month) => (
                    <span key={month} className="text-center text-[11px] font-medium text-slate-400">{month}</span>
                  ))}
                </div>
              </div>

              <div className="space-y-4 pt-4">
                {projects.map((project) => (
                  <div key={project.name} className="grid min-h-11 grid-cols-[220px_1fr] items-center">
                    <div className="pr-5">
                      <p className="text-sm font-semibold text-slate-100">{project.name}</p>
                      <p className="mt-0.5 text-[10px] text-slate-500">{project.area}</p>
                    </div>

                    <div
                      className="relative h-8 rounded-md"
                      style={{
                        backgroundImage: 'linear-gradient(to right, rgba(100, 136, 186, .12) 1px, transparent 1px)',
                        backgroundSize: '8.333333% 100%',
                      }}
                    >
                      <div
                        className="absolute top-0 flex h-8 items-center rounded-md px-3 text-[10px] font-bold text-white shadow-sm"
                        style={{
                          left: `${((project.start - 1) / 12) * 100}%`,
                          width: `${(project.duration / 12) * 100}%`,
                          backgroundColor: project.color,
                        }}
                      >
                        <span className="flex-1 truncate text-center">{project.period}</span>
                        {canManage && <button type="button" onClick={() => { setAdjustingProjectId(project.id); setDialogOpen(true); setFeedback(''); }} aria-label={`Ajustar calendario de ${project.name}`} title="Ajustar calendario" className="ml-2 shrink-0 rounded p-1 text-white/80 hover:bg-black/15 hover:text-white"><SlidersHorizontal size={11} /></button>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
          <section className="rounded-2xl border border-blue-300/20 bg-[#111f36] p-5 shadow-[0_18px_45px_rgba(0,0,0,0.12)] md:p-6 xl:col-span-3">
            <h2 className="mb-5 text-base font-semibold text-white">Hitos Globales</h2>
            <div className="space-y-2.5">
              {milestones.map((milestone) => {
                const status = milestoneStatuses.find((item) => item.id === milestone.status);
                return (
                <article key={milestone.id} className="flex items-center justify-between gap-4 rounded-lg border border-blue-200/15 bg-[#0b182c] px-4 py-3" title={milestone.description}>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-100">{milestone.title}</h3>
                    <p className="mt-0.5 text-[10px] text-slate-500">{formatMilestoneDate(milestone.targetDate)}</p>
                  </div>
                  <div className="flex items-center gap-2"><span className={`shrink-0 rounded px-2 py-1 text-[10px] font-semibold ${status.badge}`}>{status.label}</span><button type="button" onClick={() => setFeedback(`${milestone.title}: ${milestone.description} Responsable: ${milestone.validator}.`)} aria-label={`Ver detalles de ${milestone.title}`} className="rounded p-1 text-slate-500 hover:bg-white/5 hover:text-white"><MoreVertical size={14} /></button></div>
                </article>
              ); })}
            </div>
          </section>

          <section className="rounded-2xl border border-blue-300/20 bg-[#111f36] p-5 shadow-[0_18px_45px_rgba(0,0,0,0.12)] md:p-6 xl:col-span-2">
            <h2 className="text-base font-semibold text-white">Control Presupuestario</h2>

            <div className="flex justify-center py-5">
              <div
                className="flex h-36 w-36 items-center justify-center rounded-full"
                style={{ background: 'conic-gradient(#3978c6 0 55%, #244d86 55% 85%, #263b59 85% 100%)' }}
              >
                <div className="flex h-[94px] w-[94px] flex-col items-center justify-center rounded-full bg-[#111f36]">
                  <strong className="text-xl text-white">$4.2M</strong>
                  <span className="mt-1 text-[10px] text-slate-500">Presupuesto</span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 border-b border-blue-200/15 pb-5 text-[10px] text-slate-400">
              <span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-sm bg-[#263b59]" /> Disponible (55%)</span>
              <span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-sm bg-[#3978c6]" /> Ejecutado (30%)</span>
              <span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-sm bg-[#244d86]" /> Comprometido (15%)</span>
            </div>

            <div className="mt-5 grid grid-cols-3 gap-3">
              <div>
                <p className="text-[10px] text-slate-500">Total</p>
                <strong className="mt-1 block text-sm text-white">$4.2M</strong>
              </div>
              <div>
                <p className="text-[10px] text-slate-500">Ejecutado</p>
                <strong className="mt-1 block text-sm text-emerald-400">$1.8M</strong>
              </div>
              <div>
                <p className="text-[10px] text-slate-500">Disponible</p>
                <strong className="mt-1 block text-sm text-blue-400">$2.4M</strong>
              </div>
            </div>
          </section>
        </div>
      </div>
      {dialogOpen && canManage && <AdjustScheduleDialog data={data} initialProjectId={adjustingProjectId} onSubmit={saveSchedule} onClose={() => setDialogOpen(false)} />}
      {milestoneDialogOpen && canManage && <NewGlobalMilestoneDialog data={data} onSubmit={saveMilestone} onClose={() => setMilestoneDialogOpen(false)} />}
    </main>
  );
}
