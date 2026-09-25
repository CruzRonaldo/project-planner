import React, { useEffect, useState } from 'react';
import { Activity, AlertTriangle, BarChart3, CheckCircle2, ClipboardCheck, Download, MoreVertical, Plus, ShieldCheck, X, Zap } from 'lucide-react';
import {
  operationalAreas,
  operationalProjects,
  operationTypes,
  workOrderPriorities,
  workOrderStatuses,
} from '../../constants/operations';
import {
  buildWorkOrdersCsv,
  createWorkOrder,
  filterWorkOrders,
  getWorkOrderDuration,
} from '../../utils/operations';

const inputClass = 'mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition-colors duration-300 placeholder:text-slate-400 focus:border-cyan-500 dark:border-[#30363d] dark:bg-[#0d1117] dark:text-white dark:placeholder:text-slate-600 dark:focus:border-cyan-400 midnight:border-cyan-800/40 midnight:bg-[#050B14] midnight:text-cyan-50 midnight:placeholder:text-cyan-800 midnight:focus:border-cyan-500';
const cardClass = 'rounded-xl border border-slate-200 bg-white shadow-sm transition-colors duration-300 dark:border-[#30363d] dark:bg-[#161b22] dark:shadow-none midnight:border-cyan-900/30 midnight:bg-[#0a1120]';
const nestedClass = 'rounded-lg border border-slate-200 bg-slate-50 transition-colors duration-300 dark:border-[#30363d] dark:bg-[#0d1117] midnight:border-cyan-800/40 midnight:bg-[#050B14]';
const secondaryButtonClass = 'rounded-lg border border-slate-300 px-4 py-2.5 text-xs text-slate-600 transition-colors duration-300 hover:bg-slate-50 dark:border-[#30363d] dark:text-slate-300 dark:hover:bg-white/5 midnight:border-cyan-800/40 midnight:text-cyan-200 midnight:hover:bg-cyan-900/20';
const labelClass = 'text-xs text-slate-500 transition-colors duration-300 dark:text-slate-300 midnight:text-cyan-500/70';
const headingClass = 'text-slate-900 transition-colors duration-300 dark:text-white midnight:text-cyan-50';
const mutedClass = 'text-slate-500 transition-colors duration-300 dark:text-slate-400 midnight:text-cyan-600';
const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'];

function formatDateInput(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function PriorityBadge({ priority }) {
  const details = workOrderPriorities.find((item) => item.id === priority);
  return <span className={`inline-flex whitespace-nowrap rounded border px-2 py-1 text-[9px] font-semibold ${details.className}`}>{details.label}</span>;
}

function OrderStatusBadge({ status }) {
  const details = workOrderStatuses.find((item) => item.id === status);
  return <span className={`inline-flex whitespace-nowrap rounded border px-2 py-1 text-[9px] font-semibold ${details.className}`}>{details.label}</span>;
}

export function NewWorkOrderDialog({ projectOptions = [], responsibleOptions = [], onSubmit, onClose }) {
  const today = new Date();
  const endDate = new Date(today);
  endDate.setDate(endDate.getDate() + 7);
  const [draft, setDraft] = useState({
    project: projectOptions[0] ?? '', type: operationTypes[0], title: '', area: operationalAreas[1],
    responsible: responsibleOptions[0]?.name ?? '', startDate: formatDateInput(today), endDate: formatDateInput(endDate),
    priority: 'high', critical: true, tolerance: 3, documentUrl: '', description: '',
  });
  const [error, setError] = useState('');
  const duration = getWorkOrderDuration(draft.startDate, draft.endDate);
  const changeField = (field) => (event) => { setDraft((current) => ({ ...current, [field]: event.target.value })); setError(''); };

  useEffect(() => {
    const closeWithEscape = (event) => { if (event.key === 'Escape') onClose(); };
    document.addEventListener('keydown', closeWithEscape);
    return () => document.removeEventListener('keydown', closeWithEscape);
  }, [onClose]);

  return (
    <div role="presentation" onMouseDown={onClose} className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-900/40 p-3 backdrop-blur-sm transition-colors duration-300 dark:bg-[#020617]/85 midnight:bg-[#020617]/90 sm:p-5">
      <section role="dialog" aria-modal="true" aria-labelledby="new-work-order-title" onMouseDown={(event) => event.stopPropagation()} className="max-h-[94vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-[0_25px_90px_rgba(15,23,42,0.18)] transition-colors duration-300 dark:border-[#30363d] dark:bg-[#161b22] dark:shadow-[0_25px_90px_rgba(0,0,0,0.72)] midnight:border-cyan-900/30 midnight:bg-[#0a1120]">
        <header className="flex items-start justify-between gap-4 border-b border-slate-200 px-4 py-4 transition-colors duration-300 dark:border-[#30363d] midnight:border-cyan-900/30 sm:px-6"><div className="flex gap-3"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-cyan-200 bg-cyan-50 text-cyan-700 transition-colors duration-300 dark:border-cyan-400/25 dark:bg-cyan-500/15 dark:text-cyan-400 midnight:border-cyan-800/40 midnight:bg-cyan-500/15 midnight:text-cyan-300"><Zap size={20} /></span><div><h2 id="new-work-order-title" className="text-lg font-bold text-slate-900 dark:text-white midnight:text-cyan-50">Nueva Orden de Trabajo</h2><p className="mt-1 text-xs text-slate-500 dark:text-slate-400 midnight:text-cyan-500/70">Emite una orden técnica de terreno, asigna responsables y fija su ruta crítica.</p></div></div><button type="button" onClick={onClose} aria-label="Cerrar nueva orden" className="rounded-lg p-2 text-slate-500 transition-colors duration-300 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-white midnight:text-cyan-500/70 midnight:hover:bg-cyan-900/20 midnight:hover:text-cyan-50"><X size={19} /></button></header>
        <form onSubmit={(event) => { event.preventDefault(); try { onSubmit(draft); } catch (submitError) { setError(submitError.message); } }} className="p-4 sm:p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className={labelClass}>Proyecto asociado <span className="text-cyan-600 dark:text-cyan-400 midnight:text-cyan-400">*</span><select autoFocus required value={draft.project} onChange={changeField('project')} className={inputClass}>{projectOptions.length === 0 && <option value="">Sin proyectos registrados</option>}{projectOptions.map((project) => <option key={project} value={project}>{project}</option>)}</select></label>
            <label className={labelClass}>Tipo de operación <span className="text-cyan-600 dark:text-cyan-400 midnight:text-cyan-400">*</span><select required value={draft.type} onChange={changeField('type')} className={inputClass}>{operationTypes.map((type) => <option key={type}>{type}</option>)}</select></label>
          </div>
          <label className={`mt-4 block ${labelClass}`}>Título de la tarea / orden <span className="text-cyan-600 dark:text-cyan-400 midnight:text-cyan-400">*</span><input required maxLength={120} value={draft.title} onChange={changeField('title')} placeholder="Vaciado de losa Nivel 4 - Sector Norte" className={inputClass} /></label>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className={labelClass}>Área técnica <span className="text-cyan-600 dark:text-cyan-400 midnight:text-cyan-400">*</span><select required value={draft.area} onChange={changeField('area')} className={inputClass}>{operationalAreas.map((area) => <option key={area}>{area}</option>)}</select></label>
            <label className={labelClass}>Responsable asignado <span className="text-cyan-600 dark:text-cyan-400 midnight:text-cyan-400">*</span><select required value={draft.responsible} onChange={changeField('responsible')} className={inputClass}>{responsibleOptions.length === 0 && <option value="">Sin técnicos registrados</option>}{responsibleOptions.map((member) => <option key={member.id} value={member.name}>{member.name} ({member.specialty})</option>)}</select></label>
            <label className={labelClass}>Fecha de inicio <span className="text-cyan-600 dark:text-cyan-400 midnight:text-cyan-400">*</span><input type="date" required value={draft.startDate} onChange={changeField('startDate')} className={inputClass} /></label>
            <label className={labelClass}>Fecha de fin / límite <span className="text-cyan-600 dark:text-cyan-400 midnight:text-cyan-400">*</span><input type="date" required min={draft.startDate} value={draft.endDate} onChange={changeField('endDate')} className={inputClass} />{duration && <span className="mt-2 block text-[10px] text-cyan-700 dark:text-cyan-400 midnight:text-cyan-400">Duración estimada: {duration} {duration === 1 ? 'día' : 'días'}</span>}</label>
            <label className={labelClass}>Nivel de prioridad <span className="text-cyan-600 dark:text-cyan-400 midnight:text-cyan-400">*</span><select required value={draft.priority} onChange={changeField('priority')} className={inputClass}>{workOrderPriorities.map((priority) => <option key={priority.id} value={priority.id}>{priority.label}</option>)}</select></label>
            <fieldset><legend className={labelClass}>Parámetro de ruta crítica</legend><div className={`mt-2 flex min-h-11 items-center justify-between gap-3 px-3 ${nestedClass}`}><label className="flex cursor-pointer items-center gap-2 text-[11px] text-slate-700 dark:text-slate-200 midnight:text-cyan-100"><input type="checkbox" checked={draft.critical} onChange={(event) => setDraft((current) => ({ ...current, critical: event.target.checked }))} className="accent-cyan-500" /> Tarea en ruta crítica</label><label className="flex items-center gap-2 text-[10px] text-slate-500 midnight:text-cyan-600">Tolerancia:<input type="number" min="0" max="30" step="1" value={draft.tolerance} onChange={changeField('tolerance')} aria-label="Tolerancia en días" className="w-12 rounded border border-slate-300 bg-white px-2 py-1 text-center text-slate-900 outline-none transition-colors duration-300 dark:border-[#30363d] dark:bg-[#161b22] dark:text-white midnight:border-cyan-800/40 midnight:bg-[#0a1120] midnight:text-cyan-50" /> días</label></div></fieldset>
          </div>
          <label className={`mt-4 block ${labelClass}`}>Documento o plano vinculado (Google Drive)<input type="url" maxLength={300} value={draft.documentUrl} onChange={changeField('documentUrl')} placeholder="https://drive.google.com/drive/folders/..." className={inputClass} /></label>
          <label className={`mt-4 block ${labelClass}`}>Descripción e instrucciones de terreno <span className="text-cyan-600 dark:text-cyan-400 midnight:text-cyan-400">*</span><textarea required minLength={10} maxLength={600} rows={4} value={draft.description} onChange={changeField('description')} placeholder="Detalla verificaciones, entregables y criterios de aceptación..." className={`${inputClass} resize-y leading-relaxed`} /></label>
          {error && <p role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 transition-colors duration-300 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400 midnight:border-red-500/20 midnight:bg-red-500/10 midnight:text-red-300">{error}</p>}
          <footer className="mt-5 flex flex-col-reverse gap-3 border-t border-slate-200 pt-4 transition-colors duration-300 dark:border-[#30363d] midnight:border-cyan-900/30 sm:flex-row sm:items-center sm:justify-between"><p className="text-[10px] text-slate-500 midnight:text-cyan-600">* Campos obligatorios para emitir la orden operativa.</p><div className="flex justify-end gap-2"><button type="button" onClick={onClose} className={secondaryButtonClass}>Cancelar</button><button type="submit" className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white transition-colors duration-300 hover:bg-blue-500 midnight:bg-cyan-600 midnight:hover:bg-cyan-500"><Download size={15} /> Emitir Orden de Trabajo</button></div></footer>
        </form>
      </section>
    </div>
  );
}

export default function Operations({ data = {}, onChange, query = '', onQueryChange, canManage = false, projectOptions = [], responsibleOptions = [] }) {
  const isProduction =
    import.meta.env.PROD ||
    (typeof window !== 'undefined' &&
      !['localhost', '127.0.0.1'].includes(window.location.hostname));
  const hideMocks = import.meta.env.VITE_HIDE_MOCKS === 'true' || isProduction;

  const metrics = data?.metrics || { inProgress: 0, completed: 0, incidents: 0, efficiency: 0 };
  const ordersList = data?.orders || [];
  const activitiesList = data?.activities || [];
  const alertsList = data?.alerts || [];
  const qualityList = data?.qualityChecks || [];

  const [projectFilter, setProjectFilter] = useState('all');
  const [orderFilter, setOrderFilter] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [feedback, setFeedback] = useState('');
  const baseProjects = projectOptions.length > 0 || hideMocks ? projectOptions : operationalProjects;
  const availableProjects = Array.from(new Set(baseProjects));
  const orders = filterWorkOrders(ordersList, query, orderFilter, projectFilter);
  const metricCards = [
    { label: 'Tareas en progreso', value: metrics.inProgress, note: metrics.inProgress > 0 ? `${metrics.inProgress} activas` : 'Sin tareas', icon: Activity, color: 'text-blue-600 dark:text-blue-400 midnight:text-cyan-400', badge: 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 midnight:bg-cyan-500/10 midnight:text-cyan-300' },
    { label: 'Tareas completadas', value: metrics.completed, note: metrics.completed > 0 ? `${metrics.completed} finalizadas` : 'Sin registros', icon: CheckCircle2, color: 'text-emerald-600 dark:text-emerald-400 midnight:text-emerald-300', badge: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 midnight:bg-emerald-500/10 midnight:text-emerald-300' },
    { label: 'Incidencias abiertas', value: metrics.incidents, note: metrics.incidents > 0 ? `${metrics.incidents} alertas` : 'Sin incidencias', icon: AlertTriangle, color: 'text-red-600 dark:text-red-400 midnight:text-red-300', badge: 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400 midnight:bg-red-500/10 midnight:text-red-300' },
    { label: 'Eficiencia operativa', value: `${metrics.efficiency}%`, note: metrics.efficiency > 0 ? 'En rango' : 'Sin métricas', icon: BarChart3, color: 'text-cyan-600 dark:text-cyan-400 midnight:text-cyan-400', badge: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 midnight:bg-emerald-500/10 midnight:text-emerald-300' },
  ];

  const saveOrder = (draft) => {
    const updated = createWorkOrder(data, draft);
    onChange(updated);
    setDialogOpen(false);
    setOrderFilter('all');
    setProjectFilter('all');
    setFeedback(`Orden ${updated.orders[0].code} emitida y añadida al panel operativo.`);
  };
  const exportReport = () => {
    const blob = new Blob([`\uFEFF${buildWorkOrdersCsv(ordersList)}`], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'reporte-operativo-diario.csv';
    link.click();
    URL.revokeObjectURL(url);
    setFeedback('Reporte operativo diario exportado correctamente.');
  };

  return (
    <main className="min-w-0 flex-1 overflow-y-auto bg-slate-50 p-4 text-slate-900 transition-colors duration-300 dark:bg-[#0d1117] dark:text-slate-100 midnight:bg-[#050B14] midnight:text-cyan-50 md:p-6 lg:p-8">
      <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-5 pb-8">
        <header className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between"><div><h1 className={`text-2xl font-bold tracking-tight ${headingClass} md:text-[28px]`}>Gestión Operativa de Campo</h1><p className={`mt-1 text-sm ${mutedClass}`}>Control de tareas activas, órdenes de trabajo críticas y aseguramiento de calidad</p></div><div className="flex flex-wrap items-center gap-2"><select value={projectFilter} onChange={(event) => setProjectFilter(event.target.value)} aria-label="Filtrar por proyecto operativo" className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-xs text-slate-700 outline-none transition-colors duration-300 dark:border-[#30363d] dark:bg-[#161b22] dark:text-slate-200 midnight:border-cyan-800/40 midnight:bg-[#0a1120] midnight:text-cyan-100"><option value="all">Todos los proyectos</option>{availableProjects.map((project) => <option key={project}>{project}</option>)}</select>{canManage && <><button type="button" onClick={exportReport} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-xs text-slate-600 transition-colors duration-300 hover:text-slate-900 dark:border-[#30363d] dark:bg-[#161b22] dark:text-slate-300 dark:hover:text-white midnight:border-cyan-800/40 midnight:bg-[#0a1120] midnight:text-cyan-200 midnight:hover:text-cyan-50"><ClipboardCheck size={15} /> Generar Reporte Diario</button><button type="button" onClick={() => { setDialogOpen(true); setFeedback(''); }} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white transition-colors duration-300 hover:bg-blue-500 midnight:bg-cyan-600 midnight:hover:bg-cyan-500"><Plus size={16} /> Nueva Orden de Trabajo</button></>}</div></header>
        <p role="status" className={feedback ? 'text-xs text-cyan-700 dark:text-cyan-300 midnight:text-cyan-300' : 'sr-only'}>{feedback}</p>

        <section aria-label="Resumen operativo" className="grid grid-cols-2 gap-3 xl:grid-cols-4">{metricCards.map((card) => { const Icon = card.icon; return <article key={card.label} className={`${cardClass} p-4 sm:p-5`}><div className="flex items-start justify-between gap-3"><p className={`text-[10px] font-semibold uppercase tracking-wide ${mutedClass}`}>{card.label}</p><span className={`rounded-lg border border-slate-200 bg-slate-50 p-2 transition-colors duration-300 dark:border-[#30363d] dark:bg-[#0d1117] midnight:border-cyan-800/40 midnight:bg-[#050B14] ${card.color}`}><Icon size={16} /></span></div><div className="mt-4 flex items-end justify-between gap-3"><strong className={`text-3xl font-bold ${headingClass}`}>{card.value}</strong><span className={`rounded px-2 py-1 text-[10px] font-semibold ${card.badge}`}>{card.note}</span></div></article>; })}</section>

        <section className={`${cardClass} overflow-hidden p-4 sm:p-5`} aria-labelledby="critical-schedule-title"><div className="flex flex-wrap items-start justify-between gap-3"><div><h2 id="critical-schedule-title" className={`text-base font-semibold ${headingClass}`}>Cronograma de Actividades Críticas</h2><p className={`mt-1 text-[10px] ${mutedClass}`}>Seguimiento temporal y avance real de entregables clave</p></div><div className={`flex gap-3 text-[9px] ${mutedClass}`}><span><i className="mr-1 inline-block h-2 w-2 bg-blue-500" /> En tiempo</span><span><i className="mr-1 inline-block h-2 w-2 bg-emerald-500" /> Acelerada</span><span><i className="mr-1 inline-block h-2 w-2 bg-purple-500" /> Programada</span></div></div><div className="mt-5 overflow-x-auto"><div className="min-w-[780px]"><div className="grid grid-cols-[230px_1fr_90px] border-b border-slate-200 pb-2 transition-colors duration-300 dark:border-[#30363d] midnight:border-cyan-900/30"><span className="text-[9px] text-slate-500 midnight:text-cyan-600">Actividad / Obra</span><div className="grid grid-cols-6">{months.map((month) => <span key={month} className="text-center text-[9px] text-slate-500 midnight:text-cyan-600">{month}</span>)}</div><span className="text-right text-[9px] text-slate-500 midnight:text-cyan-600">Avance total</span></div><div className="space-y-4 pt-4">{activitiesList.map((activity) => <article key={activity.id} className="grid grid-cols-[230px_1fr_90px] items-center"><div><h3 className={`text-xs font-semibold ${headingClass}`}>{activity.name}</h3><p className="mt-1 text-[9px] text-slate-500 midnight:text-cyan-600">{activity.project}</p></div><div className="relative h-7 rounded bg-slate-100 transition-colors duration-300 dark:bg-[#0d1117] midnight:bg-cyan-950/50" style={{ backgroundImage: 'linear-gradient(to right, rgba(100,136,186,.14) 1px, transparent 1px)', backgroundSize: '16.6667% 100%' }}><div className="absolute inset-y-0 flex items-center justify-center rounded px-2 text-[9px] font-semibold text-white" style={{ left: `${((activity.start - 1) / 6) * 100}%`, width: `${(activity.duration / 6) * 100}%`, backgroundColor: activity.color }}><span className="truncate">{activity.period}</span></div></div><div className="pl-5"><strong className="block text-right text-[10px]" style={{ color: activity.color }}>{activity.progress}%</strong><div className="mt-2 h-1 overflow-hidden rounded bg-slate-200 dark:bg-[#0d1117] midnight:bg-cyan-950"><div className="h-full" style={{ width: `${activity.progress}%`, backgroundColor: activity.color }} /></div></div></article>)}{!activitiesList.length && <p className="py-8 text-center text-xs text-slate-500 dark:text-slate-400 midnight:text-cyan-500/70">No hay actividades críticas registradas.</p>}</div></div></div></section>

        <div className="grid min-w-0 items-start gap-5 xl:grid-cols-[minmax(0,2.2fr)_minmax(270px,0.8fr)]">
          <section className={`min-w-0 overflow-hidden ${cardClass}`} aria-labelledby="work-orders-title"><header className="flex flex-wrap items-center justify-between gap-3 px-4 pt-5 sm:px-5"><div><h2 id="work-orders-title" className={`text-base font-semibold ${headingClass}`}>Órdenes de Trabajo Activas</h2><p className={`mt-1 text-[10px] ${mutedClass}`}>Últimas órdenes de operación en terreno</p></div><div className="flex gap-1 rounded-lg bg-slate-100 p-1 transition-colors duration-300 dark:bg-[#0d1117] midnight:bg-[#050B14]">{[{ id: 'all', label: 'Todas' }, { id: 'high', label: 'Alta prioridad' }, { id: 'in-progress', label: 'En curso' }].map((filter) => <button key={filter.id} type="button" onClick={() => setOrderFilter(filter.id)} aria-pressed={orderFilter === filter.id} className={`rounded px-3 py-1.5 text-[9px] font-medium transition-colors duration-300 ${orderFilter === filter.id ? 'bg-blue-600 text-white midnight:bg-cyan-600' : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white midnight:text-cyan-500/70 midnight:hover:text-cyan-50'}`}>{filter.label}</button>)}</div></header><div className="mt-3 overflow-x-auto px-4 sm:px-5"><table className="w-full min-w-[760px] border-collapse text-left"><thead><tr className="border-b border-slate-200 text-[9px] uppercase text-slate-500 transition-colors duration-300 dark:border-[#30363d] midnight:border-cyan-900/30 midnight:text-cyan-600">{['ID', 'Proyecto', 'Tipo', 'Responsable', 'Prioridad', 'Estado', 'Acción'].map((label) => <th key={label} className="px-2 py-3 font-semibold first:pl-0 last:pr-0">{label}</th>)}</tr></thead><tbody>{orders.map((order) => <tr key={order.id} className="border-b border-slate-200 last:border-0 transition-colors duration-300 hover:bg-slate-50 dark:border-[#30363d]/70 dark:hover:bg-white/[0.02] midnight:border-cyan-900/30 midnight:hover:bg-cyan-900/20"><td className={`py-3.5 pr-2 font-mono text-[10px] font-bold ${headingClass}`}>{order.code}</td><td className="max-w-[150px] truncate px-2 py-3.5 text-[10px] font-medium text-cyan-700 dark:text-blue-400 midnight:text-cyan-400" title={order.project}>{order.project.split(' (')[0]}</td><td className="px-2 py-3.5 text-[10px] text-slate-600 dark:text-slate-300 midnight:text-cyan-100">{order.type}</td><td className="px-2 py-3.5 text-[10px] text-slate-600 dark:text-slate-300 midnight:text-cyan-100">{order.responsible}</td><td className="px-2 py-3.5"><PriorityBadge priority={order.priority} /></td><td className="px-2 py-3.5"><OrderStatusBadge status={order.status} /></td><td className="py-3.5 pl-2 text-right"><button type="button" onClick={() => setFeedback(`${order.code}: ${order.title}. ${order.description}`)} aria-label={`Ver orden ${order.code}`} className="rounded p-1.5 text-slate-500 transition-colors duration-300 hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-white/5 dark:hover:text-white midnight:text-cyan-500/70 midnight:hover:bg-cyan-900/20 midnight:hover:text-cyan-50"><MoreVertical size={15} /></button></td></tr>)}{!orders.length && <tr><td colSpan={7} className="py-12 text-center text-sm text-slate-500 midnight:text-cyan-500/70">No se encontraron órdenes con estos filtros.</td></tr>}</tbody></table></div><footer className="mt-2 flex items-center justify-between border-t border-slate-200 px-4 py-3 text-[10px] text-slate-500 transition-colors duration-300 dark:border-[#30363d] midnight:border-cyan-900/30 midnight:text-cyan-600 sm:px-5"><span>Mostrando {orders.length} de {ordersList.length} órdenes</span>{(query || projectFilter !== 'all' || orderFilter !== 'all') && <button type="button" onClick={() => { setOrderFilter('all'); setProjectFilter('all'); onQueryChange(''); }} className="text-cyan-700 hover:text-cyan-600 dark:text-blue-400 dark:hover:text-blue-300 midnight:text-cyan-400 midnight:hover:text-cyan-200">Limpiar filtros</button>}</footer></section>

        <div className="space-y-5"><aside className={`${cardClass} p-4 sm:p-5`} aria-labelledby="operation-alerts-title"><div className="flex items-center justify-between gap-3"><h2 id="operation-alerts-title" className={`text-sm font-semibold ${headingClass}`}>Alertas Críticas de Operación</h2><span className="rounded bg-red-50 px-2 py-1 text-[9px] font-semibold text-red-700 dark:bg-red-500/10 dark:text-red-400 midnight:bg-red-500/10 midnight:text-red-300">{alertsList.length} Urgentes</span></div><div className="mt-4 space-y-3">{alertsList.map((alert) => <article key={alert.id} className={`rounded-lg border p-3 ${alert.level === 'critical' ? 'border-red-200 bg-red-50 dark:border-red-500/20 dark:bg-red-500/5 midnight:border-red-500/20 midnight:bg-red-500/5' : 'border-amber-200 bg-amber-50 dark:border-amber-500/20 dark:bg-amber-500/5 midnight:border-amber-500/20 midnight:bg-amber-500/5'}`}><div className="flex items-start justify-between gap-3"><div><h3 className="text-[10px] font-semibold text-slate-800 dark:text-slate-200 midnight:text-cyan-100"><i className={`mr-2 inline-block h-2 w-2 rounded-full ${alert.level === 'critical' ? 'bg-red-500' : 'bg-amber-500'}`} />{alert.title}</h3><p className="mt-1 pl-4 text-[9px] text-slate-500 midnight:text-cyan-600">{alert.project}</p></div><button type="button" onClick={() => setFeedback(`Alerta seleccionada: ${alert.title}`)} className={`rounded border px-2 py-1 text-[9px] font-semibold ${alert.level === 'critical' ? 'border-red-200 text-red-700 dark:border-red-500/25 dark:text-red-400 midnight:text-red-300' : 'border-amber-200 text-amber-700 dark:border-amber-500/25 dark:text-amber-400 midnight:text-amber-300'}`}>{alert.level === 'critical' ? 'Atender' : 'Revisar'}</button></div></article>)}{!alertsList.length && <p className="py-4 text-center text-xs text-slate-500 dark:text-slate-400 midnight:text-cyan-500/70">Sin alertas operativas activas.</p>}</div></aside><aside className={`${cardClass} p-4 sm:p-5`} aria-labelledby="quality-title"><div className="flex items-center justify-between gap-3"><h2 id="quality-title" className={`text-sm font-semibold ${headingClass}`}>Aseguramiento de Calidad</h2><span className="text-[9px] text-slate-500 midnight:text-cyan-600">Norma ISO-9001</span></div><div className="mt-4 space-y-3">{qualityList.map((check) => <article key={check.id} className={`flex items-center justify-between gap-3 p-3 ${nestedClass}`}><p className="flex items-center gap-2 text-[10px] text-slate-700 dark:text-slate-300 midnight:text-cyan-100"><ShieldCheck size={13} className={check.status === 'Aprobada' ? 'text-emerald-600 dark:text-emerald-400 midnight:text-emerald-300' : 'text-amber-600 dark:text-amber-400 midnight:text-amber-300'} />{check.title}</p><span className={`rounded px-2 py-1 text-[9px] font-semibold ${check.status === 'Aprobada' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 midnight:bg-emerald-500/10 midnight:text-emerald-300' : 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 midnight:bg-amber-500/10 midnight:text-amber-300'}`}>{check.status}</span></article>)}{!qualityList.length && <p className="py-4 text-center text-xs text-slate-500 dark:text-slate-400 midnight:text-cyan-500/70">Sin controles de calidad registrados.</p>}</div></aside></div>
        </div>
      </div>
      {dialogOpen && canManage && <NewWorkOrderDialog projectOptions={availableProjects} responsibleOptions={responsibleOptions} onSubmit={saveOrder} onClose={() => setDialogOpen(false)} />}
    </main>
  );
}
