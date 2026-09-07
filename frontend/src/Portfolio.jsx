import React, { useEffect, useState } from 'react';
import { CalendarDays, Cloud, ExternalLink, FolderPlus, Save, X } from 'lucide-react';
import { addPortfolioProject, createProjectCode, filterPortfolio, formatMoney, formatProjectTerm, getProjectDuration, projectAreas, projectLeaders, projectStatuses } from './portfolioData';

const inputClass = 'mt-2 w-full rounded-lg border border-[#30363d] bg-[#0d1117] px-3 py-2.5 text-sm text-white outline-none placeholder:text-slate-600 focus:border-cyan-400';
const filters = [{ id: 'all', label: 'Todos' }, ...projectStatuses.map((status) => ({ id: status.id, label: status.label }))];

function statusDetails(status) {
  return projectStatuses.find((item) => item.id === status);
}

function isoDate(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function ProjectCard({ project }) {
  const status = statusDetails(project.status);
  return (
    <article className="rounded-xl border border-blue-300/15 bg-[#111a2e] p-5 shadow-[0_14px_36px_rgba(0,0,0,0.12)]">
      <header className="flex items-start justify-between gap-4"><div className="min-w-0"><p className="mb-1 text-[9px] font-semibold uppercase tracking-wider text-blue-400">{project.code}</p><h2 className="truncate text-base font-semibold text-white">{project.name}</h2><p className="mt-1 text-[10px] text-slate-500">{project.area}</p></div><span className={`shrink-0 rounded px-2 py-1 text-[10px] font-semibold ${status.className}`}>{status.label}</span></header>
      <div className="mt-5"><div className="mb-2 flex justify-between text-[10px] text-slate-400"><span>Progreso General</span><strong className="text-slate-200">{project.progress}%</strong></div><div className="h-1.5 overflow-hidden rounded-full bg-[#07101f]"><div className={`h-full rounded-full ${status.barClass}`} style={{ width: `${project.progress}%` }} /></div></div>
      <div className="mt-5 flex items-center justify-between border-b border-blue-200/10 pb-4"><div><p className="text-[10px] text-slate-500">Presupuesto Usado / Total</p><p className="mt-1 text-xs font-semibold text-slate-200">{formatMoney(project.usedBudget)} <span className="px-1 text-slate-600">/</span> {formatMoney(project.totalBudget)}</p></div><div className="flex -space-x-2" aria-label={`${project.members.length} integrantes`}>{project.members.map((member, index) => <span key={`${member}-${index}`} className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-[#111a2e] bg-gradient-to-br from-slate-500 to-slate-800 text-[8px] font-bold text-white">{member}</span>)}</div></div>
      <footer className="mt-4 flex items-center justify-between gap-3 text-[10px] text-slate-500"><span className="truncate" title={formatProjectTerm(project.startDate, project.endDate)}>Plazo: {formatProjectTerm(project.startDate, project.endDate)}</span>{project.driveFolder ? <a href={project.driveFolder} target="_blank" rel="noreferrer" aria-label={`Abrir carpeta de ${project.name}`} className="shrink-0 text-blue-400 hover:text-blue-300"><ExternalLink size={14} /></a> : <span className="shrink-0">Sin carpeta Drive</span>}</footer>
    </article>
  );
}

export function NewProjectDialog({ data, currentUserName, onSubmit, onClose }) {
  const now = new Date();
  const end = new Date(now); end.setMonth(end.getMonth() + 6);
  const [draft, setDraft] = useState({ code: createProjectCode(data, now.getFullYear()), area: projectAreas[0], name: '', startDate: isoDate(now), endDate: isoDate(end), totalBudget: '', status: 'planning', leaderId: 'carlos', driveFolder: '', description: '', createdBy: currentUserName });
  const [error, setError] = useState('');
  const changeField = (field) => (event) => { setDraft((current) => ({ ...current, [field]: event.target.value })); setError(''); };
  const duration = getProjectDuration(draft.startDate, draft.endDate);

  useEffect(() => {
    const closeWithEscape = (event) => { if (event.key === 'Escape') onClose(); };
    document.addEventListener('keydown', closeWithEscape);
    return () => document.removeEventListener('keydown', closeWithEscape);
  }, [onClose]);

  return (
    <div role="presentation" onMouseDown={onClose} className="fixed inset-0 z-[90] flex items-center justify-center bg-black/75 p-3 backdrop-blur-sm sm:p-5">
      <section role="dialog" aria-modal="true" aria-labelledby="new-project-title" onMouseDown={(event) => event.stopPropagation()} className="max-h-[94vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-[#30363d] bg-[#111a29] shadow-[0_25px_90px_rgba(0,0,0,0.65)]">
        <header className="flex items-start justify-between gap-4 border-b border-[#30363d] px-4 py-4 sm:px-6"><div className="flex gap-3"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-blue-400/25 bg-blue-500/15 text-blue-400"><FolderPlus size={21} /></span><div><h2 id="new-project-title" className="text-lg font-bold text-white">Crear Nuevo Proyecto</h2><p className="mt-1 text-xs text-slate-400">Define los parámetros maestros, cronograma y presupuesto de la obra.</p></div></div><button type="button" onClick={onClose} aria-label="Cerrar formulario" className="rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-white"><X size={19} /></button></header>
        <form onSubmit={(event) => { event.preventDefault(); try { onSubmit(draft); } catch (submitError) { setError(submitError.message); } }} className="p-4 sm:p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-xs text-slate-300">Código del proyecto <span className="text-cyan-400">*</span><div className="relative"><input readOnly value={draft.code} className={`${inputClass} pr-28 text-slate-400`} /><span className="absolute bottom-2.5 right-2 rounded bg-blue-500/15 px-2 py-1 text-[9px] text-blue-300">Autogenerado</span></div></label>
            <label className="text-xs text-slate-300">Área técnica <span className="text-cyan-400">*</span><select required value={draft.area} onChange={changeField('area')} className={inputClass}>{projectAreas.map((area) => <option key={area}>{area}</option>)}</select></label>
            <label className="text-xs text-slate-300 sm:col-span-2">Nombre del proyecto <span className="text-cyan-400">*</span><input autoFocus required maxLength={120} value={draft.name} onChange={changeField('name')} placeholder="Torre Reforma Corporativa" className={inputClass} /></label>
            <label className="text-xs text-slate-300">Fecha de inicio <span className="text-cyan-400">*</span><input type="date" required value={draft.startDate} onChange={changeField('startDate')} className={inputClass} /></label>
            <label className="text-xs text-slate-300">Fecha final estimada <span className="text-cyan-400">*</span><input type="date" required value={draft.endDate} onChange={changeField('endDate')} className={inputClass} /></label>
            <p className={`-mt-2 flex items-center gap-1.5 text-[10px] sm:col-span-2 ${duration ? 'text-cyan-400' : 'text-red-400'}`}><CalendarDays size={12} /> {duration ? `Duración calculada: ${duration} ${duration === 1 ? 'mes' : 'meses'}` : 'La fecha final debe ser posterior a la inicial.'}</p>
            <label className="text-xs text-slate-300">Presupuesto estimado (USD) <span className="text-cyan-400">*</span><input type="number" min="1" max="1000000000000" step="1000" required value={draft.totalBudget} onChange={changeField('totalBudget')} placeholder="1200000" className={inputClass} /></label>
            <label className="text-xs text-slate-300">Estado inicial <span className="text-cyan-400">*</span><select required value={draft.status} onChange={changeField('status')} className={inputClass}>{projectStatuses.filter((status) => ['planning', 'active', 'paused'].includes(status.id)).map((status) => <option key={status.id} value={status.id}>{status.label}</option>)}</select></label>
            <label className="text-xs text-slate-300">Líder de obra <span className="text-cyan-400">*</span><select required value={draft.leaderId} onChange={changeField('leaderId')} className={inputClass}>{projectLeaders.map((leader) => <option key={leader.id} value={leader.id}>{leader.name} · {leader.role}</option>)}</select></label>
            <label className="text-xs text-slate-300">Carpeta de Google Drive<input type="url" maxLength={300} value={draft.driveFolder} onChange={changeField('driveFolder')} placeholder="https://drive.google.com/drive/folders/..." className={inputClass} /></label>
            <label className="text-xs text-slate-300 sm:col-span-2">Descripción / alcance<textarea rows="4" maxLength={1000} value={draft.description} onChange={changeField('description')} placeholder="Describe brevemente el alcance del proyecto..." className={`${inputClass} resize-y`} /></label>
          </div>
          {error && <p role="alert" className="mt-4 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-400">{error}</p>}
          <footer className="mt-5 flex flex-col-reverse gap-3 border-t border-[#30363d] pt-4 sm:flex-row sm:items-center sm:justify-between"><p className="text-[10px] text-slate-500">* Campos requeridos. Los datos se conservan durante esta sesión.</p><div className="flex justify-end gap-2"><button type="button" onClick={onClose} className="rounded-lg border border-[#30363d] px-4 py-2.5 text-xs text-slate-300 hover:bg-white/5">Cancelar</button><button type="submit" className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-blue-500"><Save size={15} /> Crear Proyecto</button></div></footer>
        </form>
      </section>
    </div>
  );
}

export default function Portfolio({ data, onChange, query = '', onQueryChange, canManage = false, currentUserName = '' }) {
  const [activeFilter, setActiveFilter] = useState('all');
  const [syncing, setSyncing] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [feedback, setFeedback] = useState('');
  const visible = filterPortfolio(data, query, activeFilter);

  const createProject = (draft) => {
    const updated = addPortfolioProject(data, draft);
    onChange(updated); setDialogOpen(false); setActiveFilter('all'); setFeedback(`${updated.projects[0].name} fue creado correctamente.`);
  };
  const handleSync = () => { setSyncing(true); window.setTimeout(() => setSyncing(false), 900); };

  return (
    <main className="flex-1 overflow-y-auto bg-[#080f1c] p-4 text-slate-100 md:p-6 lg:p-8">
      <div className="mx-auto flex w-full max-w-[1500px] flex-col gap-6 pb-8">
        <section className="flex flex-col gap-5"><div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><h1 className="text-2xl font-bold tracking-tight text-white md:text-[28px]">Repositorio de Proyectos</h1><p className="mt-1 text-sm text-slate-400">Vista consolidada de control presupuestal, estado de avance y dependencias directas</p></div>{canManage && <button type="button" onClick={() => { setDialogOpen(true); setFeedback(''); }} className="inline-flex w-fit items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-500"><FolderPlus size={17} /> Crear Proyecto</button>}</div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div className="flex max-w-full gap-2 overflow-x-auto pb-1">{filters.map((filter) => <button key={filter.id} type="button" onClick={() => setActiveFilter(filter.id)} aria-pressed={activeFilter === filter.id} className={`shrink-0 rounded-lg border px-4 py-2 text-xs font-medium transition-colors ${activeFilter === filter.id ? 'border-blue-500 bg-blue-500/10 text-blue-300' : 'border-blue-200/10 bg-[#111a2e] text-slate-400 hover:border-blue-400/30 hover:text-white'}`}>{filter.label}</button>)}</div><div className="flex shrink-0 gap-3">{(query || activeFilter !== 'all') && <button type="button" onClick={() => { setActiveFilter('all'); onQueryChange(''); }} className="text-xs text-cyan-400 hover:text-cyan-300">Limpiar filtros</button>}<button type="button" onClick={handleSync} disabled={syncing} className="flex items-center justify-center gap-2 rounded-lg border border-blue-200/10 bg-[#111a2e] px-4 py-2 text-xs text-slate-300 hover:border-blue-400/30 hover:text-white disabled:cursor-wait disabled:opacity-70"><Cloud size={14} className={syncing ? 'animate-pulse text-blue-400' : ''} />{syncing ? 'Sincronizando...' : 'Sincronizar Drive'}</button></div></div>
        </section>
        <p role="status" className={feedback ? 'text-xs text-cyan-300' : 'sr-only'}>{feedback}</p>
        <section aria-live="polite">{visible.projects.length ? <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">{visible.projects.map((project) => <ProjectCard key={project.id} project={project} />)}</div> : <div className="rounded-xl border border-blue-200/15 bg-[#111a2e] p-10 text-center text-sm text-slate-400">No hay proyectos que coincidan con los filtros.</div>}</section>
        <section className="overflow-hidden rounded-xl border border-blue-300/15 bg-[#111a2e] p-5 shadow-[0_14px_36px_rgba(0,0,0,0.12)] md:p-6"><h2 className="text-base font-semibold text-white">Historial de Cambios Reciente</h2><p className="mt-1 text-[10px] text-slate-500">Altas de proyectos, modificaciones presupuestales y reasignaciones</p><div className="mt-5 overflow-x-auto"><table className="w-full min-w-[820px] border-collapse text-left text-xs"><thead><tr className="border-b border-blue-200/10 text-[10px] text-slate-500"><th className="px-3 py-3 font-medium">Fecha</th><th className="px-3 py-3 font-medium">Proyecto</th><th className="px-3 py-3 font-medium">Cambio</th><th className="px-3 py-3 text-right font-medium">Usuario</th></tr></thead><tbody>{visible.changes.map((change) => <tr key={change.id} className="border-b border-blue-200/10 last:border-0"><td className="whitespace-nowrap px-3 py-3 font-mono text-slate-300">{new Date(`${change.date}T12:00:00`).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })}</td><td className="whitespace-nowrap px-3 py-3 font-medium text-blue-400">{change.project}</td><td className="px-3 py-3 text-slate-400">{change.change}</td><td className="whitespace-nowrap px-3 py-3 text-right text-slate-300">{change.user}</td></tr>)}{!visible.changes.length && <tr><td colSpan={4} className="py-10 text-center text-sm text-slate-400">No hay cambios que coincidan con la búsqueda.</td></tr>}</tbody></table></div></section>
      </div>
      {dialogOpen && canManage && <NewProjectDialog data={data} currentUserName={currentUserName} onSubmit={createProject} onClose={() => setDialogOpen(false)} />}
    </main>
  );
}
