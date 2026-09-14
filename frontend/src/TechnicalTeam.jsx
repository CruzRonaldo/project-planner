import React, { useEffect, useState } from 'react';
import { ArrowLeftRight, BriefcaseBusiness, Camera, Check, ChevronLeft, ChevronRight, Download, FolderOpen, Mail, MessageCircle, MoreVertical, UserPlus, Users, X } from 'lucide-react';
import { addTechnicalMember, buildTechnicalTeamCsv, filterTechnicalTeam, getMemberFullName, reassignTechnicalMember, reassignmentReasons, sortTechnicalTeam, summarizeTechnicalTeam, technicalAreas, technicalProjects, technicalSortOptions, technicalStatuses } from './technicalTeamData';

const inputClass = 'mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition-colors duration-300 placeholder:text-slate-400 focus:border-cyan-500 dark:border-[#30363d] dark:bg-[#0d1117] dark:text-white dark:placeholder:text-slate-600 dark:focus:border-cyan-400 midnight:border-cyan-800/40 midnight:bg-[#050B14] midnight:text-cyan-50 midnight:placeholder:text-cyan-800 midnight:focus:border-cyan-500';
const cardClass = 'rounded-xl border border-slate-200 bg-white shadow-sm transition-colors duration-300 dark:border-[#30363d] dark:bg-[#161b22] midnight:border-cyan-900/30 midnight:bg-[#0a1120]';
const nestedClass = 'rounded-lg border border-slate-200 bg-slate-50 transition-colors duration-300 dark:border-[#30363d] dark:bg-[#0d1117] midnight:border-cyan-800/40 midnight:bg-[#050B14]';
const secondaryButtonClass = 'rounded-lg border border-slate-300 px-4 py-2.5 text-xs text-slate-600 transition-colors duration-300 hover:bg-slate-50 dark:border-[#30363d] dark:text-slate-300 dark:hover:bg-white/5 midnight:border-cyan-800/40 midnight:text-cyan-200 midnight:hover:bg-cyan-900/20';
const overlayClass = 'fixed inset-0 z-[90] flex items-center justify-center bg-slate-900/40 p-3 backdrop-blur-sm transition-colors duration-300 dark:bg-[#020617]/85 midnight:bg-[#020617]/90 sm:p-5';
const dialogClass = 'max-h-[92vh] w-full overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-[0_25px_90px_rgba(15,23,42,0.18)] transition-colors duration-300 dark:border-[#30363d] dark:bg-[#161b22] dark:shadow-[0_25px_90px_rgba(0,0,0,0.65)] midnight:border-cyan-900/30 midnight:bg-[#0a1120]';
const iconBoxClass = 'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-cyan-200 bg-cyan-50 text-cyan-700 transition-colors duration-300 dark:border-cyan-400/25 dark:bg-cyan-500/15 dark:text-cyan-400 midnight:border-cyan-800/40 midnight:bg-cyan-500/15 midnight:text-cyan-300';
const closeBtnClass = 'rounded-lg p-2 text-slate-500 transition-colors duration-300 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-white midnight:text-cyan-500/70 midnight:hover:bg-cyan-900/20 midnight:hover:text-cyan-50';
const labelClass = 'text-xs text-slate-500 transition-colors duration-300 dark:text-slate-300 midnight:text-cyan-500/70';
const headingClass = 'text-slate-900 transition-colors duration-300 dark:text-white midnight:text-cyan-50';
const mutedClass = 'text-slate-500 transition-colors duration-300 dark:text-slate-400 midnight:text-cyan-500/70';
const errorClass = 'mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400 midnight:border-red-500/20 midnight:bg-red-500/10 midnight:text-red-300';
const primaryBtnClass = 'inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white transition-colors duration-300 hover:bg-blue-500 midnight:bg-cyan-600 midnight:hover:bg-cyan-500';
const pageSize = 6;
const operationalStatuses = technicalStatuses.filter((status) => status.id !== 'offline');

const areaDetails = {
  architecture: { description: 'Renders, modelado Revit y recorridos 360°', valueClass: 'text-blue-600 dark:text-blue-400 midnight:text-blue-300' },
  structures: { description: 'Modelado Revit, concreto y acero de refuerzo', valueClass: 'text-emerald-600 dark:text-emerald-400 midnight:text-emerald-300' },
  systems: { description: 'Backend, APIs, N8N y automatizaciones', valueClass: 'text-amber-600 dark:text-amber-400 midnight:text-amber-300' },
};

function getInitials(member) {
  return `${member.firstNames?.[0] ?? ''}${member.lastNames?.[0] ?? ''}`.toUpperCase();
}

function StatusBadge({ status }) {
  const details = technicalStatuses.find((item) => item.id === status);
  return <span className={`inline-flex whitespace-nowrap rounded border px-2 py-1 text-[10px] font-semibold transition-colors duration-300 ${details.className}`}>{details.shortLabel}</span>;
}

function MemberAvatar({ member, sizeClass = 'h-10 w-10' }) {
  return member.avatar
    ? <img src={member.avatar} alt={`Perfil de ${getMemberFullName(member)}`} className={`${sizeClass} shrink-0 rounded-full object-cover`} />
    : <span className={`${sizeClass} flex shrink-0 items-center justify-center rounded-full border border-cyan-200 bg-cyan-50 text-xs font-bold text-cyan-700 transition-colors duration-300 dark:border-cyan-400/25 dark:bg-cyan-500/10 dark:text-cyan-300 midnight:border-cyan-800/40 midnight:bg-cyan-500/15 midnight:text-cyan-300`}>{getInitials(member)}</span>;
}

export function AddTechnicalMemberDialog({ existingData, projectOptions = technicalProjects, onSubmit, onClose }) {
  const [draft, setDraft] = useState({ firstNames: '', lastNames: '', email: '', specialty: '', area: 'architecture', project: projectOptions[0] ?? technicalProjects[0], status: 'active', workload: 100, avatar: null });
  const [photoName, setPhotoName] = useState('');
  const [error, setError] = useState('');
  const changeField = (field) => (event) => { setDraft((current) => ({ ...current, [field]: event.target.value })); setError(''); };

  useEffect(() => {
    const closeWithEscape = (event) => { if (event.key === 'Escape') onClose(); };
    document.addEventListener('keydown', closeWithEscape);
    return () => document.removeEventListener('keydown', closeWithEscape);
  }, [onClose]);

  const selectPhoto = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!['image/png', 'image/jpeg'].includes(file.type)) { setError('La foto debe ser PNG o JPG.'); event.target.value = ''; return; }
    if (file.size > 2 * 1024 * 1024) { setError('La foto no debe superar 2 MB.'); event.target.value = ''; return; }
    const reader = new FileReader();
    reader.onload = () => { setDraft((current) => ({ ...current, avatar: String(reader.result) })); setPhotoName(file.name); setError(''); };
    reader.onerror = () => setError('No se pudo leer la foto seleccionada.');
    reader.readAsDataURL(file);
  };

  return (
    <div role="presentation" onMouseDown={onClose} className={overlayClass}>
      <section role="dialog" aria-modal="true" aria-labelledby="new-technician-title" onMouseDown={(event) => event.stopPropagation()} className={`${dialogClass} max-w-3xl`}>
        <header className="flex items-start justify-between gap-4 border-b border-slate-200 px-4 py-4 transition-colors duration-300 dark:border-[#30363d] midnight:border-cyan-900/30 sm:px-6">
          <div className="flex gap-3"><span className={iconBoxClass}><UserPlus size={21} /></span><div><h2 id="new-technician-title" className={`text-lg font-bold ${headingClass}`}>Añadir Nuevo Técnico</h2><p className={`mt-1 text-xs ${mutedClass}`}>Registra un nuevo profesional en el directorio de ingeniería, arquitectura o sistemas.</p></div></div>
          <button type="button" onClick={onClose} aria-label="Cerrar formulario" className={closeBtnClass}><X size={19} /></button>
        </header>
        <form onSubmit={(event) => { event.preventDefault(); try { onSubmit(draft); } catch (submitError) { setError(submitError.message); } }} className="p-4 sm:p-6">
          <div className={`flex flex-col gap-4 p-4 sm:flex-row sm:items-center ${nestedClass}`}>
            {draft.avatar ? <img src={draft.avatar} alt="Vista previa de la foto" className="h-16 w-16 rounded-full object-cover" /> : <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-dashed border-slate-300 text-slate-400 transition-colors duration-300 dark:border-slate-500 midnight:border-cyan-800/40 midnight:text-cyan-600"><Users size={27} /></span>}
            <div><label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition-colors duration-300 hover:border-cyan-400/50 dark:border-slate-600 dark:bg-[#161b22] dark:text-slate-200 midnight:border-cyan-800/40 midnight:bg-[#0a1120] midnight:text-cyan-100"><Camera size={15} /> Subir foto de perfil<input type="file" accept="image/png,image/jpeg" onChange={selectPhoto} className="sr-only" /></label><p className={`mt-2 text-[10px] ${mutedClass}`}>PNG o JPG (máx. 2 MB){photoName && ` · ${photoName}`}</p></div>
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <label className={labelClass}>Nombres <span className="text-cyan-600 dark:text-cyan-400 midnight:text-cyan-400">*</span><input autoFocus required maxLength={80} value={draft.firstNames} onChange={changeField('firstNames')} placeholder="Sofía Alejandra" className={inputClass} /></label>
            <label className={labelClass}>Apellidos <span className="text-cyan-600 dark:text-cyan-400 midnight:text-cyan-400">*</span><input required maxLength={80} value={draft.lastNames} onChange={changeField('lastNames')} placeholder="Torres Valdivia" className={inputClass} /></label>
            <label className={labelClass}>Correo electrónico corporativo <span className="text-cyan-600 dark:text-cyan-400 midnight:text-cyan-400">*</span><input type="email" required maxLength={120} value={draft.email} onChange={changeField('email')} placeholder="nombre@empresa.com" className={inputClass} /></label>
            <label className={labelClass}>Especialidad / Rol <span className="text-cyan-600 dark:text-cyan-400 midnight:text-cyan-400">*</span><input required maxLength={100} value={draft.specialty} onChange={changeField('specialty')} placeholder="Arquitecta Principal / BIM" className={inputClass} /></label>
            <label className={labelClass}>Área técnica <span className="text-cyan-600 dark:text-cyan-400 midnight:text-cyan-400">*</span><select required value={draft.area} onChange={changeField('area')} className={inputClass}>{technicalAreas.map((area) => <option key={area.id} value={area.id}>{area.label}</option>)}</select></label>
            <label className={labelClass}>Proyecto asignado inicial<select value={draft.project} onChange={changeField('project')} className={inputClass}>{projectOptions.map((project) => <option key={project}>{project}</option>)}</select></label>
            <label className={labelClass}>Estado de disponibilidad <span className="text-cyan-600 dark:text-cyan-400 midnight:text-cyan-400">*</span><select required value={draft.status} onChange={changeField('status')} className={inputClass}>{technicalStatuses.map((status) => <option key={status.id} value={status.id}>{status.label}</option>)}</select></label>
            <label className={labelClass}>Disponibilidad / carga inicial <span className="text-cyan-600 dark:text-cyan-400 midnight:text-cyan-400">*</span><div className="relative"><input type="number" min="0" max="100" step="1" required value={draft.workload} onChange={changeField('workload')} className={`${inputClass} pr-10`} /><span className={`absolute bottom-2.5 right-3 text-xs ${mutedClass}`}>%</span></div></label>
          </div>
          {error && <p role="alert" className={errorClass}>{error}</p>}
          <footer className="mt-5 flex flex-col-reverse gap-3 border-t border-slate-200 pt-4 transition-colors duration-300 dark:border-[#30363d] midnight:border-cyan-900/30 sm:flex-row sm:items-center sm:justify-between"><p className={`text-[10px] ${mutedClass}`}>* Campos requeridos para el alta técnica. Actualmente hay {existingData.members.length} integrantes.</p><div className="flex justify-end gap-2"><button type="button" onClick={onClose} className={secondaryButtonClass}>Cancelar</button><button type="submit" className={primaryBtnClass}><UserPlus size={15} /> Añadir al equipo</button></div></footer>
        </form>
      </section>
    </div>
  );
}

export function ReassignProjectDialog({ member, projectOptions = technicalProjects, onSubmit, onClose }) {
  const availableProjects = Array.from(new Set([member.project, ...projectOptions]));
  const [draft, setDraft] = useState({
    project: member.project,
    status: member.status === 'offline' ? 'standby' : member.status,
    workload: member.workload,
    reason: reassignmentReasons[0],
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
      <section role="dialog" aria-modal="true" aria-labelledby="reassign-project-title" onMouseDown={(event) => event.stopPropagation()} className={`${dialogClass} max-w-xl`}>
        <header className="flex items-start justify-between gap-4 border-b border-slate-200 px-4 py-4 transition-colors duration-300 dark:border-[#30363d] midnight:border-cyan-900/30 sm:px-6">
          <div className="flex gap-3"><span className={iconBoxClass}><ArrowLeftRight size={20} /></span><div><h2 id="reassign-project-title" className={`text-lg font-bold ${headingClass}`}>Reasignar Proyecto</h2><p className={`mt-1 text-xs ${mutedClass}`}>Actualiza la obra o la disponibilidad operativa del técnico.</p></div></div>
          <button type="button" onClick={onClose} aria-label="Cerrar reasignación" className={closeBtnClass}><X size={19} /></button>
        </header>
        <form onSubmit={(event) => { event.preventDefault(); try { onSubmit(draft); } catch (submitError) { setError(submitError.message); } }} className="p-4 sm:p-6">
          <div className={`flex items-center gap-3 p-3 ${nestedClass}`}>
            <MemberAvatar member={member} sizeClass="h-12 w-12" />
            <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><p className={`font-semibold ${headingClass}`}>{member.area === 'architecture' ? 'Arq.' : 'Ing.'} {getMemberFullName(member)}</p><span className="rounded bg-blue-50 px-2 py-0.5 text-[9px] font-semibold text-blue-700 transition-colors duration-300 dark:bg-blue-500/15 dark:text-blue-300 midnight:bg-blue-500/15 midnight:text-blue-300">{member.specialty}</span></div><p className={`mt-1 truncate text-[10px] ${mutedClass}`}>Actual: {member.project}</p></div>
          </div>

          <label className={`mt-5 block ${labelClass}`}>Nuevo proyecto asignado <span className="text-cyan-600 dark:text-cyan-400 midnight:text-cyan-400">*</span><select autoFocus required value={draft.project} onChange={changeField('project')} className={inputClass}>{availableProjects.map((project) => <option key={project}>{project}</option>)}</select></label>

          <fieldset className="mt-5"><legend className={labelClass}>Estado operativo <span className="text-cyan-600 dark:text-cyan-400 midnight:text-cyan-400">*</span></legend><div className="mt-2 grid grid-cols-3 gap-2">{operationalStatuses.map((status) => <button key={status.id} type="button" aria-pressed={draft.status === status.id} onClick={() => { setDraft((current) => ({ ...current, status: status.id })); setError(''); }} className={`flex min-w-0 items-center justify-center gap-2 rounded-lg border px-2 py-2.5 text-[11px] font-semibold transition-colors duration-300 ${draft.status === status.id ? status.className : 'border-slate-200 bg-slate-50 text-slate-500 hover:border-slate-300 dark:border-[#30363d] dark:bg-[#0d1117] dark:text-slate-400 dark:hover:border-slate-500 midnight:border-cyan-800/40 midnight:bg-[#050B14] midnight:text-cyan-500/70 midnight:hover:border-cyan-700/50'}`}><span className={`h-2 w-2 shrink-0 rounded-full ${status.id === 'active' ? 'bg-emerald-500 dark:bg-emerald-400' : status.id === 'standby' ? 'bg-amber-500 dark:bg-amber-400' : 'bg-blue-500 dark:bg-blue-400'}`} />{status.shortLabel}</button>)}</div></fieldset>

          <label className={`mt-5 block ${labelClass}`}><span className="flex items-center justify-between gap-3"><span>Porcentaje de dedicación en esta obra <span className="text-cyan-600 dark:text-cyan-400 midnight:text-cyan-400">*</span></span><output className="rounded border border-blue-200 bg-blue-50 px-2 py-1 font-mono text-[11px] text-blue-700 transition-colors duration-300 dark:border-blue-500/25 dark:bg-blue-500/10 dark:text-blue-300 midnight:border-cyan-800/40 midnight:bg-cyan-900/30 midnight:text-cyan-300">{draft.workload}%</output></span><input type="range" min="0" max="100" step="5" value={draft.workload} onChange={changeField('workload')} className="mt-3 h-2 w-full cursor-pointer accent-blue-600 dark:accent-blue-500 midnight:accent-cyan-500" /><span className={`mt-1 flex justify-between text-[9px] ${mutedClass}`}><span>0% (Sin asignación)</span><span>50% (Media jornada)</span><span>100% (Exclusivo)</span></span></label>

          <label className={`mt-5 block ${labelClass}`}>Motivo de la reasignación <span className="text-cyan-600 dark:text-cyan-400 midnight:text-cyan-400">*</span><select required value={draft.reason} onChange={changeField('reason')} className={inputClass}>{reassignmentReasons.map((reason) => <option key={reason}>{reason}</option>)}</select></label>

          {error && <p role="alert" className={errorClass}>{error}</p>}
          <footer className="mt-5 flex flex-col-reverse gap-3 border-t border-slate-200 pt-4 transition-colors duration-300 dark:border-[#30363d] midnight:border-cyan-900/30 sm:flex-row sm:items-center sm:justify-between"><p className={`text-[10px] ${mutedClass}`}>La modificación se registrará en Asignaciones Recientes.</p><div className="flex justify-end gap-2"><button type="button" onClick={onClose} className={secondaryButtonClass}>Cancelar</button><button type="submit" className={primaryBtnClass}><Check size={15} /> Guardar reasignación</button></div></footer>
        </form>
      </section>
    </div>
  );
}

export default function TechnicalTeam({ data, onChange, query = '', onQueryChange, canManage = false, projectOptions = [] }) {
  const [areaFilter, setAreaFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState('availability-desc');
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [reassignMemberId, setReassignMemberId] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [showAllAssignments, setShowAllAssignments] = useState(false);
  const [feedback, setFeedback] = useState('');
  const summary = summarizeTechnicalTeam(data.members);
  const members = sortTechnicalTeam(filterTechnicalTeam(data.members, query, areaFilter), sortOrder);
  const totalPages = Math.max(1, Math.ceil(members.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const visibleMembers = members.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const recentAssignments = showAllAssignments ? (data.assignments ?? []) : (data.assignments ?? []).slice(0, 4);
  const reassignMember = data.members.find((member) => member.id === reassignMemberId);
  const availableProjects = Array.from(new Set([...technicalProjects, ...projectOptions]));
  const filters = [{ id: 'all', label: 'Todos', count: summary.total }, ...technicalAreas.map((area) => ({ ...area, count: summary.areas[area.id] }))];
  const addMember = (draft) => { const updated = addTechnicalMember(data, draft); onChange(updated); setDialogOpen(false); setAreaFilter('all'); setPage(1); setFeedback(`${getMemberFullName(updated.members[0])} fue añadido al equipo técnico.`); };
  const reassignMemberToProject = (draft) => {
    const updated = reassignTechnicalMember(data, reassignMemberId, draft);
    onChange(updated);
    setReassignMemberId(null);
    setFeedback(updated === data ? `No había cambios operativos para ${getMemberFullName(reassignMember)}.` : `${getMemberFullName(reassignMember)} fue reasignado correctamente.`);
  };
  const openReassignment = (memberId) => {
    setReassignMemberId(memberId);
    setOpenMenuId(null);
    setFeedback('');
  };
  const exportReport = () => {
    const blob = new Blob([`\uFEFF${buildTechnicalTeamCsv(data.members)}`], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'equipo-tecnico.csv';
    link.click();
    URL.revokeObjectURL(url);
    setFeedback('Reporte del equipo técnico exportado correctamente.');
  };

  return (
    <main className="min-w-0 flex-1 overflow-y-auto bg-slate-50 p-4 text-slate-900 transition-colors duration-300 dark:bg-[#0d1117] dark:text-slate-100 midnight:bg-[#050B14] midnight:text-cyan-50 md:p-6 lg:p-8">
      <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-5 pb-8">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><h1 className={`text-2xl font-bold tracking-tight ${headingClass} md:text-[28px]`}>Gestión del Equipo Técnico</h1><p className={`mt-1 text-sm ${mutedClass}`}>Coordinación de equipos especializados por área técnica</p></div><div className="flex flex-wrap items-center gap-2">{canManage ? <><button type="button" onClick={exportReport} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-xs font-medium text-slate-600 transition-colors duration-300 hover:text-slate-900 dark:border-[#30363d] dark:bg-[#161b22] dark:text-slate-300 dark:hover:border-cyan-400/30 dark:hover:text-white midnight:border-cyan-800/40 midnight:bg-[#0a1120] midnight:text-cyan-200 midnight:hover:border-cyan-500/50 midnight:hover:text-cyan-50"><Download size={15} /> Exportar Nómina / Reporte</button><button type="button" onClick={() => { setDialogOpen(true); setFeedback(''); }} className={primaryBtnClass}><UserPlus size={16} /> Añadir Técnico</button></> : <span className="w-fit rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-500 transition-colors duration-300 dark:border-[#30363d] dark:bg-[#161b22] midnight:border-cyan-800/40 midnight:bg-[#0a1120]">Vista de consulta</span>}</div></header>
        <p role="status" className={feedback ? 'text-xs text-cyan-700 dark:text-cyan-300 midnight:text-cyan-300' : 'sr-only'}>{feedback}</p>
        <section className="flex flex-col gap-3 border-b border-slate-200 pb-4 transition-colors duration-300 dark:border-[#30363d] midnight:border-cyan-900/30 lg:flex-row lg:items-center lg:justify-between"><div className="flex max-w-full gap-2 overflow-x-auto pb-1">{filters.map((filter) => <button key={filter.id} type="button" onClick={() => { setAreaFilter(filter.id); setPage(1); }} aria-pressed={areaFilter === filter.id} className={`inline-flex shrink-0 items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition-colors duration-300 ${areaFilter === filter.id ? 'border-cyan-500 bg-cyan-50 text-cyan-800 dark:border-cyan-400/40 dark:bg-cyan-400/10 dark:text-white midnight:border-cyan-500 midnight:bg-cyan-500/15 midnight:text-cyan-300' : 'border-slate-200 bg-white text-slate-500 hover:border-cyan-400/40 hover:text-slate-900 dark:border-[#30363d] dark:bg-[#161b22] dark:text-slate-300 dark:hover:border-cyan-400/30 dark:hover:text-white midnight:border-cyan-900/30 midnight:bg-[#0a1120] midnight:text-cyan-500/70 midnight:hover:text-cyan-50'}`}>{filter.label}<span className={`rounded px-1.5 py-0.5 text-[9px] font-bold transition-colors duration-300 ${filter.id === 'architecture' ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 midnight:bg-blue-500/15 midnight:text-blue-300' : filter.id === 'structures' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 midnight:bg-emerald-500/15 midnight:text-emerald-300' : filter.id === 'systems' ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 midnight:bg-amber-500/15 midnight:text-amber-300' : 'bg-slate-100 text-slate-600 dark:bg-slate-700/60 dark:text-slate-300 midnight:bg-cyan-900/40 midnight:text-cyan-300'}`}>{filter.count}</span></button>)}</div><div className="flex flex-wrap items-center gap-3"><label className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-[10px] text-slate-500 transition-colors duration-300 dark:border-[#30363d] dark:bg-[#161b22] midnight:border-cyan-800/40 midnight:bg-[#0a1120]"><span>Ordenar por:</span><select value={sortOrder} onChange={(event) => { setSortOrder(event.target.value); setPage(1); }} aria-label="Ordenar equipo técnico" className="cursor-pointer bg-transparent text-xs font-medium text-slate-900 outline-none transition-colors duration-300 dark:text-slate-200 midnight:text-cyan-100">{technicalSortOptions.map((option) => <option key={option.id} value={option.id} className="bg-white dark:bg-[#161b22] midnight:bg-[#0a1120]">{option.label}</option>)}</select></label>{(query || areaFilter !== 'all') && <button type="button" onClick={() => { setAreaFilter('all'); setPage(1); onQueryChange(''); }} className="shrink-0 text-xs text-cyan-700 hover:text-cyan-600 dark:text-cyan-400 dark:hover:text-cyan-300 midnight:text-cyan-400 midnight:hover:text-cyan-300">Limpiar filtros</button>}</div></section>
        <div className="grid min-w-0 items-start gap-5 xl:grid-cols-[minmax(0,2.3fr)_minmax(260px,0.8fr)]">
          <section className="min-w-0" aria-labelledby="technical-directory-title">
            <div className="sr-only"><h2 id="technical-directory-title">Directorio Técnico</h2></div>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {visibleMembers.map((member) => <article key={member.id} className={`${cardClass} relative flex min-h-[286px] min-w-0 flex-col p-4 transition-transform hover:-translate-y-0.5 hover:border-cyan-400/40 dark:hover:border-blue-400/25 midnight:hover:border-cyan-500/50`}>
                <header className="flex min-w-0 items-start gap-3 border-b border-slate-200 pb-4 transition-colors duration-300 dark:border-[#30363d] midnight:border-cyan-900/30"><MemberAvatar member={member} sizeClass="h-11 w-11" /><div className="min-w-0 flex-1"><h3 className={`line-clamp-2 text-sm font-semibold leading-tight ${headingClass}`}>{member.area === 'architecture' ? 'Arq.' : 'Ing.'} {getMemberFullName(member)}</h3><p className={`mt-1 truncate text-[10px] ${mutedClass}`} title={member.specialty}>{member.specialty}</p></div><button type="button" onClick={() => setOpenMenuId((current) => current === member.id ? null : member.id)} aria-label={`Abrir acciones de ${getMemberFullName(member)}`} className={closeBtnClass}><MoreVertical size={15} /></button></header>
                {openMenuId === member.id && <div className="absolute right-3 top-12 z-20 w-44 rounded-lg border border-slate-200 bg-white p-1.5 shadow-2xl transition-colors duration-300 dark:border-[#30363d] dark:bg-[#0d1117] midnight:border-cyan-900/30 midnight:bg-[#050B14]">{canManage && <button type="button" onClick={() => openReassignment(member.id)} className="flex w-full items-center gap-2 rounded px-2.5 py-2 text-left text-[11px] text-slate-600 transition-colors duration-300 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-white/5 dark:hover:text-white midnight:text-cyan-100 midnight:hover:bg-cyan-900/20"><ArrowLeftRight size={13} /> Reasignar proyecto</button>}<a href={`mailto:${member.email}`} onClick={() => setOpenMenuId(null)} className="flex items-center gap-2 rounded px-2.5 py-2 text-[11px] text-slate-600 transition-colors duration-300 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-white/5 dark:hover:text-white midnight:text-cyan-100 midnight:hover:bg-cyan-900/20"><Mail size={13} /> Enviar correo</a></div>}
                <div className="mt-4"><p className={`text-[9px] font-semibold uppercase tracking-wide ${mutedClass}`}>Proyecto asignado</p><div className="mt-2 flex items-center justify-between gap-2"><p className="truncate text-xs font-semibold text-slate-800 transition-colors duration-300 dark:text-slate-200 midnight:text-cyan-100" title={member.project}>{member.project}</p><StatusBadge status={member.status} /></div></div>
                <div className="mt-5"><div className={`mb-2 flex items-center justify-between text-[10px] ${mutedClass}`}><span>Progreso de tarea</span><strong className={member.workload < 50 ? 'text-amber-600 dark:text-amber-400 midnight:text-amber-400' : 'text-blue-600 dark:text-blue-400 midnight:text-blue-400'}>{member.workload}%</strong></div><div role="progressbar" aria-label={`Progreso de ${getMemberFullName(member)}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={member.workload} className="h-1.5 overflow-hidden rounded-full bg-slate-200 transition-colors duration-300 dark:bg-[#080f1b] midnight:bg-cyan-950"><div className={`h-full rounded-full transition-colors duration-300 ${member.workload < 50 ? 'bg-amber-500' : 'bg-blue-600 dark:bg-blue-500 midnight:bg-cyan-500'}`} style={{ width: `${member.workload}%` }} /></div></div>
                <footer className="mt-auto flex items-center justify-between gap-3 border-t border-slate-200 pt-4 transition-colors duration-300 dark:border-[#30363d] midnight:border-cyan-900/30"><span className={`text-[10px] ${mutedClass}`}>Enlaces de trabajo</span><div className="flex items-center gap-1.5"><button type="button" onClick={() => setFeedback(`${getMemberFullName(member)} está asignado a ${member.project}.`)} aria-label={`Ver proyecto de ${getMemberFullName(member)}`} title="Ver proyecto asignado" className="inline-flex rounded-md border border-slate-200 bg-slate-50 p-1.5 text-slate-500 transition-colors duration-300 hover:text-cyan-600 dark:border-[#30363d] dark:bg-[#0d1117] dark:text-slate-400 dark:hover:text-cyan-400 midnight:border-cyan-800/40 midnight:bg-[#050B14] midnight:hover:text-cyan-300"><FolderOpen size={13} /></button>{canManage && <button type="button" onClick={() => openReassignment(member.id)} aria-label={`Reasignar a ${getMemberFullName(member)}`} title="Reasignar proyecto" className="inline-flex rounded-md border border-cyan-200 bg-cyan-50 p-1.5 text-cyan-700 transition-colors duration-300 hover:bg-cyan-100 dark:border-cyan-500/25 dark:bg-cyan-500/10 dark:text-cyan-400 dark:hover:bg-cyan-500/20 midnight:border-cyan-800/40 midnight:bg-cyan-900/30 midnight:text-cyan-300 midnight:hover:bg-cyan-800/50"><ArrowLeftRight size={13} /></button>}<a href={`mailto:${member.email}`} aria-label={`Escribir a ${getMemberFullName(member)}`} title={member.email} className="inline-flex rounded-md border border-blue-200 bg-blue-50 p-1.5 text-blue-700 transition-colors duration-300 hover:bg-blue-100 dark:border-blue-500/25 dark:bg-blue-500/10 dark:text-blue-400 dark:hover:bg-blue-500/20 midnight:border-blue-900/40 midnight:bg-blue-900/20 midnight:text-blue-300 midnight:hover:bg-blue-900/40"><MessageCircle size={13} /></a></div></footer>
              </article>)}
              {!visibleMembers.length && <div className={`${cardClass} p-12 text-center text-sm ${mutedClass} sm:col-span-2 xl:col-span-3`}>No se encontraron técnicos con estos filtros.</div>}
            </div>
            <footer className="mt-4 flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 text-[10px] text-slate-500 transition-colors duration-300 dark:border-[#30363d] dark:bg-[#161b22] midnight:border-cyan-900/30 midnight:bg-[#0a1120] midnight:text-cyan-600"><span>{members.length ? `${(currentPage - 1) * pageSize + 1}–${Math.min(currentPage * pageSize, members.length)}` : '0'} de {members.length} técnicos</span><div className="flex items-center gap-2"><button type="button" aria-label="Página anterior" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)} className="rounded border border-slate-200 p-1 transition-colors duration-300 hover:text-slate-900 disabled:opacity-30 dark:border-[#30363d] dark:hover:text-white midnight:border-cyan-900/30 midnight:hover:text-cyan-50"><ChevronLeft size={14} /></button><span>{currentPage} / {totalPages}</span><button type="button" aria-label="Página siguiente" disabled={currentPage === totalPages} onClick={() => setPage(currentPage + 1)} className="rounded border border-slate-200 p-1 transition-colors duration-300 hover:text-slate-900 disabled:opacity-30 dark:border-[#30363d] dark:hover:text-white midnight:border-cyan-900/30 midnight:hover:text-cyan-50"><ChevronRight size={14} /></button></div></footer>
          </section>
          <div className="space-y-5">
            <aside className={`${cardClass} p-4 sm:p-5`} aria-labelledby="area-summary-title"><div className="flex items-center justify-between gap-3"><h2 id="area-summary-title" className={`text-base font-semibold ${headingClass}`}>Resumen por Área</h2><span className="rounded bg-slate-100 px-2 py-1 text-[9px] font-semibold text-slate-600 transition-colors duration-300 dark:bg-slate-700/40 dark:text-slate-400 midnight:bg-cyan-900/30 midnight:text-cyan-500/70">{summary.total} Total</span></div><div className="mt-4 space-y-3">{technicalAreas.map((area) => <article key={area.id} className={`p-3 ${nestedClass}`}><div className="flex items-center justify-between gap-3"><h3 className={`text-xs font-medium ${headingClass}`}>{area.label}</h3><strong className={`rounded bg-white px-2 py-1 text-[10px] shadow-sm transition-colors duration-300 dark:bg-white/[0.03] dark:shadow-none midnight:bg-[#050B14] ${areaDetails[area.id].valueClass}`}>{summary.areas[area.id]} Miembros</strong></div><p className={`mt-2 text-[10px] leading-relaxed ${mutedClass}`}>{areaDetails[area.id].description}</p></article>)}</div></aside>
            <aside className={`${cardClass} p-4 sm:p-5`} aria-labelledby="recent-technicians-title"><div className="flex items-center justify-between gap-3"><div className="flex min-w-0 items-center gap-2"><BriefcaseBusiness size={17} className="shrink-0 text-cyan-600 dark:text-cyan-400 midnight:text-cyan-400" /><h2 id="recent-technicians-title" className={`truncate text-base font-semibold ${headingClass}`}>Asignaciones Recientes</h2></div><span className="whitespace-nowrap text-[9px] font-medium text-cyan-600 dark:text-cyan-400 midnight:text-cyan-400">Actualizado hoy</span></div><div className="mt-4 divide-y divide-slate-200 transition-colors duration-300 dark:divide-[#30363d] midnight:divide-cyan-900/30">{recentAssignments.map((assignment) => <article key={assignment.id} className="flex items-start gap-3 py-3 first:pt-0" title={assignment.reason}><time dateTime={assignment.date} className="flex h-9 w-9 shrink-0 flex-col items-center justify-center rounded bg-slate-100 font-mono text-[8px] uppercase text-slate-500 transition-colors duration-300 dark:bg-[#0c1422] midnight:bg-[#050B14] midnight:text-cyan-600"><strong className="text-[10px] text-slate-800 transition-colors duration-300 dark:text-slate-300 midnight:text-cyan-100">{new Date(`${assignment.date}T12:00:00`).toLocaleDateString('es-PE', { day: '2-digit' })}</strong>{new Date(`${assignment.date}T12:00:00`).toLocaleDateString('es-PE', { month: 'short' }).replace('.', '')}</time><div className="min-w-0"><p className="truncate text-xs font-semibold text-slate-800 transition-colors duration-300 dark:text-slate-200 midnight:text-cyan-100">{assignment.memberPrefix} {assignment.memberName}</p><p className={`mt-1 truncate text-[10px] ${mutedClass}`}>{assignment.project}</p></div></article>)}{!recentAssignments.length && <p className={`py-4 text-xs ${mutedClass}`}>Aún no hay movimientos registrados.</p>}</div>{(data.assignments ?? []).length > 4 && <button type="button" onClick={() => setShowAllAssignments((current) => !current)} className="mt-4 w-full border-t border-slate-200 pt-4 text-center text-[10px] font-medium text-blue-600 transition-colors duration-300 hover:text-blue-500 dark:border-[#263244] dark:text-blue-400 dark:hover:text-blue-300 midnight:border-cyan-900/30 midnight:text-cyan-400 midnight:hover:text-cyan-300">{showAllAssignments ? 'Ver menos asignaciones' : 'Ver todo el historial de asignaciones →'}</button>}</aside>
          </div>
        </div>
      </div>
      {dialogOpen && canManage && <AddTechnicalMemberDialog existingData={data} projectOptions={availableProjects} onSubmit={addMember} onClose={() => setDialogOpen(false)} />}
      {reassignMember && canManage && <ReassignProjectDialog member={reassignMember} projectOptions={availableProjects} onSubmit={reassignMemberToProject} onClose={() => setReassignMemberId(null)} />}
    </main>
  );
}
