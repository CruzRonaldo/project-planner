import React, { useEffect, useState } from 'react';
import { Check, FileDown, Flag, Minus, MoreVertical, Plus, SlidersHorizontal, X } from 'lucide-react';
import { adjustProjectSchedule, createGlobalMilestone, createStrategicPlanningData, formatMilestoneDate, formatPlanningPeriod, milestoneStatuses, milestoneValidators, planningMonths, scheduleAdjustmentReasons } from './strategicPlanningData';

const inputClass = 'mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition-colors duration-300 placeholder:text-slate-400 focus:border-cyan-500 dark:border-[#30363d] dark:bg-[#0d1117] dark:text-white dark:placeholder:text-slate-600 dark:focus:border-cyan-400 midnight:border-cyan-800/40 midnight:bg-[#050B14] midnight:text-cyan-50 midnight:placeholder:text-cyan-800 midnight:focus:border-cyan-500';
const cardClass = 'rounded-2xl border border-slate-200 bg-white shadow-sm transition-colors duration-300 dark:border-[#30363d] dark:bg-[#161b22] dark:shadow-[0_18px_45px_rgba(0,0,0,0.12)] midnight:border-cyan-900/30 midnight:bg-[#0a1120]';
const nestedClass = 'rounded-lg border border-slate-200 bg-slate-50 transition-colors duration-300 dark:border-[#30363d] dark:bg-[#0d1117] midnight:border-cyan-800/40 midnight:bg-[#050B14]';
const overlayClass = 'fixed inset-0 z-[90] flex items-center justify-center bg-slate-900/40 p-3 backdrop-blur-sm transition-colors duration-300 dark:bg-[#020617]/85 midnight:bg-[#020617]/90 sm:p-5';
const dialogClass = 'max-h-[94vh] w-full overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-[0_25px_90px_rgba(15,23,42,0.18)] transition-colors duration-300 dark:border-[#30363d] dark:bg-[#161b22] dark:shadow-[0_25px_90px_rgba(0,0,0,0.72)] midnight:border-cyan-900/30 midnight:bg-[#0a1120]';
const iconBoxClass = 'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-cyan-200 bg-cyan-50 text-cyan-700 transition-colors duration-300 dark:border-cyan-400/25 dark:bg-cyan-500/15 dark:text-cyan-400 midnight:border-cyan-800/40 midnight:bg-cyan-500/15 midnight:text-cyan-300';
const closeBtnClass = 'rounded-lg p-2 text-slate-500 transition-colors duration-300 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-white midnight:text-cyan-500/70 midnight:hover:bg-cyan-900/20 midnight:hover:text-cyan-50';
const labelClass = 'text-[10px] font-semibold uppercase tracking-wide text-slate-500 transition-colors duration-300 dark:text-slate-300 midnight:text-cyan-500/70';
const headingClass = 'text-slate-900 transition-colors duration-300 dark:text-white midnight:text-cyan-50';
const mutedClass = 'text-slate-500 transition-colors duration-300 dark:text-slate-400 midnight:text-cyan-500/70';
const errorClass = 'mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400 midnight:border-red-500/20 midnight:bg-red-500/10 midnight:text-red-300';
const primaryBtnClass = 'inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white transition-colors duration-300 hover:bg-blue-500 midnight:bg-cyan-600 midnight:hover:bg-cyan-500';
const secondaryButtonClass = 'inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-xs font-medium text-slate-600 transition-colors duration-300 hover:text-slate-900 dark:border-[#30363d] dark:bg-[#161b22] dark:text-slate-300 dark:hover:border-cyan-400/30 dark:hover:text-white midnight:border-cyan-800/40 midnight:bg-[#0a1120] midnight:text-cyan-200 midnight:hover:border-cyan-500/50 midnight:hover:text-cyan-50';

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
    <div role="presentation" onMouseDown={onClose} className={overlayClass}>
      <section role="dialog" aria-modal="true" aria-labelledby="adjust-schedule-title" onMouseDown={(event) => event.stopPropagation()} className={`${dialogClass} max-w-2xl`}>
        <header className="flex items-start justify-between gap-4 border-b border-slate-200 px-4 py-4 transition-colors duration-300 dark:border-[#30363d] midnight:border-cyan-900/30 sm:px-6">
          <div className="flex gap-3"><span className={iconBoxClass}><SlidersHorizontal size={20} /></span><div><h2 id="adjust-schedule-title" className={`text-lg font-bold ${headingClass}`}>Ajustar Calendario de Proyecto</h2><p className={`mt-1 text-xs ${mutedClass}`}>Modifica la ventana de meses y plazos en el diagrama de Gantt.</p></div></div>
          <button type="button" onClick={onClose} aria-label="Cerrar ajuste de calendario" className={closeBtnClass}><X size={19} /></button>
        </header>

        <form onSubmit={(event) => { event.preventDefault(); try { onSubmit(draft); } catch (submitError) { setError(submitError.message); } }} className="p-4 sm:p-6">
          <label className={`block ${labelClass}`}>Proyecto a reprogramar <span className="text-red-500 dark:text-red-400 midnight:text-red-400">*</span><select autoFocus required value={draft.projectId} onChange={selectProject} className={inputClass}>{data.projects.map((project) => <option key={project.id} value={project.id}>{project.name} — {project.area}</option>)}</select></label>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <label className={labelClass}>Mes de inicio <span className="text-red-500 dark:text-red-400 midnight:text-red-400">*</span><select required value={draft.start} onChange={selectStart} className={inputClass}>{planningMonths.map((month) => <option key={month.number} value={month.number}>{month.label}</option>)}</select></label>
            <fieldset><legend className={labelClass}>Duración total <span className="text-red-500 dark:text-red-400 midnight:text-red-400">*</span></legend><div className={`mt-2 flex h-11 items-center justify-between gap-2 overflow-hidden px-1 ${nestedClass}`}><button type="button" onClick={() => changeDuration(-1)} disabled={duration <= 1} aria-label="Reducir duración" className="flex h-full w-10 items-center justify-center rounded text-slate-500 hover:bg-slate-200 hover:text-slate-900 disabled:opacity-30 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-white midnight:text-cyan-500/70 midnight:hover:bg-cyan-900/30 midnight:hover:text-cyan-50"><Minus size={15} /></button><output className={`flex items-center justify-center text-sm font-semibold ${headingClass}`}>{duration} {duration === 1 ? 'Mes' : 'Meses'} <span className={`ml-1 text-[10px] font-normal ${mutedClass}`}>({previewPeriod.split(' (')[0]})</span></output><button type="button" onClick={() => changeDuration(1)} disabled={duration >= maxDuration} aria-label="Aumentar duración" className="flex h-full w-10 items-center justify-center rounded text-slate-500 hover:bg-slate-200 hover:text-slate-900 disabled:opacity-30 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-white midnight:text-cyan-500/70 midnight:hover:bg-cyan-900/30 midnight:hover:text-cyan-50"><Plus size={15} /></button></div></fieldset>
          </div>

          <section className={`mt-5 p-4 ${nestedClass}`} aria-labelledby="schedule-preview-title"><div className="flex items-center justify-between gap-3"><h3 id="schedule-preview-title" className={`text-xs font-medium ${mutedClass}`}>Vista previa del cronograma resultante:</h3><span className="rounded border border-emerald-200 bg-emerald-50 px-2 py-1 text-[9px] font-semibold text-emerald-700 transition-colors duration-300 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400 midnight:border-emerald-500/20 midnight:bg-emerald-500/10 midnight:text-emerald-300">Ruta Crítica Activa</span></div><div className="mt-4 min-w-[420px]"><div className="grid grid-cols-12">{months.map((month) => <span key={month} className={`text-center text-[9px] ${mutedClass}`}>{month}</span>)}</div>
          
          <div className="relative mt-2 h-9 overflow-hidden rounded-md border border-slate-200 bg-slate-50 transition-colors duration-300 dark:border-[#30363d] dark:bg-[#0d1117] midnight:border-cyan-800/40 midnight:bg-[#050B14]">
            {/* CUADRÍCULA DE LÍNEAS NATIVAS */}
            <div className="absolute inset-0 grid grid-cols-12 divide-x divide-slate-200 transition-colors duration-300 dark:divide-[#30363d] midnight:divide-cyan-800/40">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="h-full"></div>
              ))}
            </div>

            <div className="absolute inset-y-1 flex items-center justify-center rounded-md px-2 text-[10px] font-bold text-white shadow-sm transition-all duration-300" style={{ left: `${((start - 1) / 12) * 100}%`, width: `${(duration / 12) * 100}%`, backgroundColor: selectedProject?.color }}><span className="truncate">{previewPeriod}</span></div>
          </div></div></section>

          <label className={`mt-5 block ${labelClass}`}>Motivo del reajuste / historial de auditoría <span className="text-red-500 dark:text-red-400 midnight:text-red-400">*</span><select required value={draft.reason} onChange={(event) => { setDraft((current) => ({ ...current, reason: event.target.value })); setError(''); }} className={inputClass}>{scheduleAdjustmentReasons.map((reason) => <option key={reason}>{reason}</option>)}</select></label>

          {error && <p role="alert" className={errorClass}>{error}</p>}
          <footer className="mt-5 flex flex-col-reverse gap-3 border-t border-slate-200 pt-4 transition-colors duration-300 dark:border-[#30363d] midnight:border-cyan-900/30 sm:flex-row sm:items-center sm:justify-between"><p className={`text-[10px] ${mutedClass}`}><span className="text-cyan-600 dark:text-cyan-400 midnight:text-cyan-400">●</span> Se actualizará el Gantt general y quedará registro del cambio.</p><div className="flex justify-end gap-2"><button type="button" onClick={onClose} className="rounded-lg border border-slate-300 px-4 py-2.5 text-xs text-slate-600 transition-colors duration-300 hover:bg-slate-50 dark:border-[#30363d] dark:text-slate-300 dark:hover:bg-white/5 midnight:border-cyan-800/40 midnight:text-cyan-200 midnight:hover:bg-cyan-900/20">Cancelar</button><button type="submit" className={primaryBtnClass}><Check size={15} /> Guardar ajustes</button></div></footer>
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
    <div role="presentation" onMouseDown={onClose} className={overlayClass}>
      <section role="dialog" aria-modal="true" aria-labelledby="new-global-milestone-title" onMouseDown={(event) => event.stopPropagation()} className={`${dialogClass} max-w-2xl`}>
        <header className="flex items-start justify-between gap-4 border-b border-slate-200 px-4 py-4 transition-colors duration-300 dark:border-[#30363d] midnight:border-cyan-900/30 sm:px-6"><div className="flex gap-3"><span className={iconBoxClass}><Flag size={20} /></span><div><h2 id="new-global-milestone-title" className={`text-lg font-bold ${headingClass}`}>Nuevo Hito Global</h2><p className={`mt-1 text-xs ${mutedClass}`}>Define una entrega crítica, auditoría o fase clave en el calendario anual.</p></div></div><button type="button" onClick={onClose} aria-label="Cerrar nuevo hito" className={closeBtnClass}><X size={19} /></button></header>
        <form onSubmit={(event) => { event.preventDefault(); try { onSubmit(draft); } catch (submitError) { setError(submitError.message); } }} className="p-4 sm:p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className={`text-xs ${mutedClass}`}>Proyecto asociado <span className="text-cyan-600 dark:text-cyan-400 midnight:text-cyan-400">*</span><select autoFocus required value={draft.projectId} onChange={changeField('projectId')} className={inputClass}>{data.projects.map((project) => <option key={project.id} value={project.id}>{project.name} ({project.code})</option>)}</select></label>
            <label className={`text-xs ${mutedClass}`}>Estado inicial <span className="text-cyan-600 dark:text-cyan-400 midnight:text-cyan-400">*</span><select required value={draft.status} onChange={changeField('status')} className={inputClass}>{milestoneStatuses.map((status) => <option key={status.id} value={status.id}>{status.label}</option>)}</select></label>
          </div>
          <label className={`mt-4 block text-xs ${mutedClass}`}>Nombre del hito / entrega crítica <span className="text-cyan-600 dark:text-cyan-400 midnight:text-cyan-400">*</span><input required maxLength={120} value={draft.title} onChange={changeField('title')} placeholder="Entrega Cimentación y Pilotes Estructurales" className={inputClass} /></label>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className={`text-xs ${mutedClass}`}>Fecha límite programada <span className="text-cyan-600 dark:text-cyan-400 midnight:text-cyan-400">*</span><input type="date" required value={draft.targetDate} onChange={changeField('targetDate')} className={inputClass} /></label>
            <label className={`text-xs ${mutedClass}`}>Responsable de validación <span className="text-cyan-600 dark:text-cyan-400 midnight:text-cyan-400">*</span><select required value={draft.validator} onChange={changeField('validator')} className={inputClass}>{milestoneValidators.map((validator) => <option key={validator}>{validator}</option>)}</select></label>
          </div>
          <label className={`mt-4 block text-xs ${mutedClass}`}>Descripción y entregables clave <span className="text-cyan-600 dark:text-cyan-400 midnight:text-cyan-400">*</span><textarea required minLength={10} maxLength={600} rows={4} value={draft.description} onChange={changeField('description')} placeholder="Describe los criterios de aprobación, documentos y entregables..." className={`${inputClass} resize-y leading-relaxed`} /></label>
          <label className={`mt-4 flex cursor-pointer items-start gap-3 p-3 ${nestedClass}`}><input type="checkbox" checked={draft.blocking} onChange={(event) => setDraft((current) => ({ ...current, blocking: event.target.checked }))} className="mt-0.5 accent-blue-600 dark:accent-blue-500 midnight:accent-cyan-500" /><span><strong className={`block text-xs font-medium ${headingClass}`}>Hito bloqueante</strong><small className={`mt-1 block text-[10px] leading-relaxed ${mutedClass}`}>Detiene el cronograma si no se valida en la fecha objetivo y activa la ruta crítica.</small></span></label>
          {error && <p role="alert" className={errorClass}>{error}</p>}
          <footer className="mt-5 flex flex-col-reverse gap-3 border-t border-slate-200 pt-4 transition-colors duration-300 dark:border-[#30363d] midnight:border-cyan-900/30 sm:flex-row sm:items-center sm:justify-between"><p className={`text-[10px] ${mutedClass}`}>* Campos requeridos para dar de alta el hito.</p><div className="flex justify-end gap-2"><button type="button" onClick={onClose} className="rounded-lg border border-slate-300 px-4 py-2.5 text-xs text-slate-600 transition-colors duration-300 hover:bg-slate-50 dark:border-[#30363d] dark:text-slate-300 dark:hover:bg-white/5 midnight:border-cyan-800/40 midnight:text-cyan-200 midnight:hover:bg-cyan-900/20">Cancelar</button><button type="submit" className={primaryBtnClass}><Plus size={15} /> Registrar Hito Global</button></div></footer>
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
    <main className="min-w-0 flex-1 overflow-y-auto bg-slate-50 p-4 text-slate-900 transition-colors duration-300 dark:bg-[#0d1117] dark:text-slate-100 midnight:bg-[#050B14] midnight:text-cyan-50 md:p-6 lg:p-8">
      <div className="mx-auto flex w-full max-w-[1500px] flex-col gap-6 pb-8">
        <section className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className={`text-2xl font-bold tracking-tight ${headingClass} md:text-[28px]`}>Calendario Maestro 2026</h1>
            <p className={`mt-1 text-sm ${mutedClass}`}>Planificación de ruta crítica y cronograma de infraestructura anual</p>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start">
            {canManage && <><button type="button" onClick={() => { setAdjustingProjectId(null); setDialogOpen(true); setFeedback(''); }} className={secondaryButtonClass}><SlidersHorizontal size={15} /> Ajustar Calendario</button><button type="button" onClick={exportGantt} className={secondaryButtonClass}><FileDown size={15} /> Exportar Gantt / PDF</button><button type="button" onClick={() => { setMilestoneDialogOpen(true); setFeedback(''); }} className={primaryBtnClass}><Plus size={15} /> Nuevo Hito Global</button></>}
            <label className="flex items-center gap-3 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-medium text-blue-700 transition-colors duration-300 dark:border-blue-400/25 dark:bg-blue-500/10 dark:text-blue-300 midnight:border-blue-900/40 midnight:bg-blue-900/20 midnight:text-blue-300">
              <span>Año</span>
              <select
                defaultValue="2026"
                aria-label="Seleccionar año"
                className="cursor-pointer bg-transparent outline-none"
              >
                <option className="bg-white dark:bg-[#111f36] midnight:bg-[#0a1120]" value="2025">2025</option>
                <option className="bg-white dark:bg-[#111f36] midnight:bg-[#0a1120]" value="2026">2026</option>
                <option className="bg-white dark:bg-[#111f36] midnight:bg-[#0a1120]" value="2027">2027</option>
              </select>
            </label>
          </div>
        </section>

        <p role="status" className={feedback ? 'text-xs text-cyan-700 dark:text-cyan-300 midnight:text-cyan-300' : 'sr-only'}>{feedback}</p>

        {/* CONTENEDOR DEL GANTT: Le agregamos overflow-hidden para no romper las esquinas redondeadas */}
        <section className={`${cardClass} overflow-hidden p-0 md:p-0`}>
          <div className="overflow-x-auto p-5 md:p-6">
            <div className="min-w-[820px]">
              <div className="grid grid-cols-[220px_1fr] border-b border-slate-200 pb-3 transition-colors duration-300 dark:border-white/10 midnight:border-cyan-900/30">
                <div />
                <div className="grid grid-cols-12">
                  {months.map((month) => (
                    <span key={month} className={`text-center text-[11px] font-medium ${mutedClass}`}>{month}</span>
                  ))}
                </div>
              </div>

              <div className="space-y-4 pt-4">
                {projects.map((project) => (
                  <div key={project.name} className="grid min-h-11 grid-cols-[220px_1fr] items-center">
                    <div className="pr-5">
                      <p className={`text-sm font-semibold ${headingClass}`}>{project.name}</p>
                      <p className={`mt-0.5 text-[10px] ${mutedClass}`}>{project.area}</p>
                    </div>

                    <div className="relative h-8 rounded-md bg-slate-50 transition-colors duration-300 dark:bg-[#080f1b] midnight:bg-cyan-950/30">
                      
                      {/* CUADRÍCULA DE LÍNEAS NATIVAS */}
                      <div className="absolute inset-0 grid grid-cols-12 divide-x divide-slate-200 transition-colors duration-300 dark:divide-white/5 midnight:divide-cyan-900/30">
                        {Array.from({ length: 12 }).map((_, i) => (
                          <div key={i} className="h-full w-full"></div>
                        ))}
                      </div>

                      <div
                        className="absolute top-0 flex h-8 items-center rounded-md px-3 text-[10px] font-bold text-white shadow-sm transition-all duration-300"
                        style={{
                          left: `${((project.start - 1) / 12) * 100}%`,
                          width: `${(project.duration / 12) * 100}%`,
                          backgroundColor: project.color,
                        }}
                      >
                        <span className="flex-1 truncate text-center">{project.period}</span>
                        {canManage && <button type="button" onClick={() => { setAdjustingProjectId(project.id); setDialogOpen(true); setFeedback(''); }} aria-label={`Ajustar calendario de ${project.name}`} title="Ajustar calendario" className="ml-2 shrink-0 rounded p-1 text-white/80 transition-colors hover:bg-black/15 hover:text-white"><SlidersHorizontal size={11} /></button>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
          
          {/* HITOS GLOBALES: Aquí devolvemos el padding de p-5 md:p-6 */}
          <section className={`${cardClass} p-5 md:p-6 xl:col-span-3`}>
            <h2 className={`mb-5 text-base font-semibold ${headingClass}`}>Hitos Globales</h2>
            <div className="space-y-2.5">
              {milestones.map((milestone) => {
                const status = milestoneStatuses.find((item) => item.id === milestone.status);
                return (
                <article key={milestone.id} className={`flex items-center justify-between gap-4 p-3 ${nestedClass}`} title={milestone.description}>
                  <div>
                    <h3 className={`text-sm font-semibold ${headingClass}`}>{milestone.title}</h3>
                    <p className={`mt-0.5 text-[10px] ${mutedClass}`}>{formatMilestoneDate(milestone.targetDate)}</p>
                  </div>
                  <div className="flex items-center gap-2"><span className={`shrink-0 rounded px-2 py-1 text-[10px] font-semibold transition-colors duration-300 ${status.badge}`}>{status.label}</span><button type="button" onClick={() => setFeedback(`${milestone.title}: ${milestone.description} Responsable: ${milestone.validator}.`)} aria-label={`Ver detalles de ${milestone.title}`} className={closeBtnClass}><MoreVertical size={14} /></button></div>
                </article>
              ); })}
            </div>
          </section>

          {/* CONTROL PRESUPUESTARIO: Aquí también devolvemos el padding de p-5 md:p-6 */}
          <section className={`${cardClass} p-5 md:p-6 xl:col-span-2`}>
            <h2 className={`text-base font-semibold ${headingClass}`}>Control Presupuestario</h2>

            <div className="flex justify-center py-5">
              <div
                className="flex h-36 w-36 items-center justify-center rounded-full transition-colors duration-300"
                style={{ background: 'conic-gradient(#3978c6 0 55%, #244d86 55% 85%, #263b59 85% 100%)' }}
              >
                <div className="flex h-[94px] w-[94px] flex-col items-center justify-center rounded-full bg-white transition-colors duration-300 dark:bg-[#161b22] midnight:bg-[#0a1120]">
                  <strong className={`text-xl ${headingClass}`}>$4.2M</strong>
                  <span className={`mt-1 text-[10px] ${mutedClass}`}>Presupuesto</span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 border-b border-slate-200 pb-5 text-[10px] text-slate-500 transition-colors duration-300 dark:border-white/10 dark:text-slate-400 midnight:border-cyan-900/30 midnight:text-cyan-600">
              <span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-sm bg-[#263b59]" /> Disponible (55%)</span>
              <span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-sm bg-[#3978c6]" /> Ejecutado (30%)</span>
              <span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-sm bg-[#244d86]" /> Comprometido (15%)</span>
            </div>

            <div className="mt-5 grid grid-cols-3 gap-3">
              <div>
                <p className={`text-[10px] ${mutedClass}`}>Total</p>
                <strong className={`mt-1 block text-sm ${headingClass}`}>$4.2M</strong>
              </div>
              <div>
                <p className={`text-[10px] ${mutedClass}`}>Ejecutado</p>
                <strong className="mt-1 block text-sm text-emerald-600 transition-colors duration-300 dark:text-emerald-400 midnight:text-emerald-300">$1.8M</strong>
              </div>
              <div>
                <p className={`text-[10px] ${mutedClass}`}>Disponible</p>
                <strong className="mt-1 block text-sm text-blue-600 transition-colors duration-300 dark:text-blue-400 midnight:text-blue-400">$2.4M</strong>
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
