import React, { useEffect, useState } from 'react';
import { Activity, AlertTriangle, BarChart3, CheckCircle2, ClipboardCheck, Download, MoreVertical, Plus, ShieldCheck, X, Zap } from 'lucide-react';
import { buildWorkOrdersCsv, createWorkOrder, filterWorkOrders, getWorkOrderDuration, operationalAreas, operationalProjects, operationTypes, workOrderPriorities, workOrderStatuses } from '../../mocks/operationsData';

const inputClass = 'mt-2 w-full rounded-lg border border-[#30363d] bg-[#0b1424] px-3 py-2.5 text-sm text-white outline-none placeholder:text-slate-600 focus:border-cyan-400';
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

export function NewWorkOrderDialog({ projectOptions, responsibleOptions, onSubmit, onClose }) {
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
    <div role="presentation" onMouseDown={onClose} className="fixed inset-0 z-[90] flex items-center justify-center bg-[#020617]/85 p-3 backdrop-blur-sm sm:p-5">
      <section role="dialog" aria-modal="true" aria-labelledby="new-work-order-title" onMouseDown={(event) => event.stopPropagation()} className="max-h-[94vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-[#303b50] bg-[#111a2d] shadow-[0_25px_90px_rgba(0,0,0,0.72)]">
        <header className="flex items-start justify-between gap-4 border-b border-[#30363d] px-4 py-4 sm:px-6"><div className="flex gap-3"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-cyan-400/25 bg-cyan-500/15 text-cyan-400"><Zap size={20} /></span><div><h2 id="new-work-order-title" className="text-lg font-bold text-white">Nueva Orden de Trabajo</h2><p className="mt-1 text-xs text-slate-400">Emite una orden técnica de terreno, asigna responsables y fija su ruta crítica.</p></div></div><button type="button" onClick={onClose} aria-label="Cerrar nueva orden" className="rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-white"><X size={19} /></button></header>
        <form onSubmit={(event) => { event.preventDefault(); try { onSubmit(draft); } catch (submitError) { setError(submitError.message); } }} className="p-4 sm:p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-xs text-slate-300">Proyecto asociado <span className="text-cyan-400">*</span><select autoFocus required value={draft.project} onChange={changeField('project')} className={inputClass}>{projectOptions.map((project) => <option key={project}>{project}</option>)}</select></label>
            <label className="text-xs text-slate-300">Tipo de operación <span className="text-cyan-400">*</span><select required value={draft.type} onChange={changeField('type')} className={inputClass}>{operationTypes.map((type) => <option key={type}>{type}</option>)}</select></label>
          </div>
          <label className="mt-4 block text-xs text-slate-300">Título de la tarea / orden <span className="text-cyan-400">*</span><input required maxLength={120} value={draft.title} onChange={changeField('title')} placeholder="Vaciado de losa Nivel 4 - Sector Norte" className={inputClass} /></label>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="text-xs text-slate-300">Área técnica <span className="text-cyan-400">*</span><select required value={draft.area} onChange={changeField('area')} className={inputClass}>{operationalAreas.map((area) => <option key={area}>{area}</option>)}</select></label>
            <label className="text-xs text-slate-300">Responsable asignado <span className="text-cyan-400">*</span><select required value={draft.responsible} onChange={changeField('responsible')} className={inputClass}>{responsibleOptions.map((member) => <option key={member.id} value={member.name}>{member.name} ({member.specialty})</option>)}</select></label>
            <label className="text-xs text-slate-300">Fecha de inicio <span className="text-cyan-400">*</span><input type="date" required value={draft.startDate} onChange={changeField('startDate')} className={inputClass} /></label>
            <label className="text-xs text-slate-300">Fecha de fin / límite <span className="text-cyan-400">*</span><input type="date" required min={draft.startDate} value={draft.endDate} onChange={changeField('endDate')} className={inputClass} />{duration && <span className="mt-2 block text-[10px] text-cyan-400">Duración estimada: {duration} {duration === 1 ? 'día' : 'días'}</span>}</label>
            <label className="text-xs text-slate-300">Nivel de prioridad <span className="text-cyan-400">*</span><select required value={draft.priority} onChange={changeField('priority')} className={inputClass}>{workOrderPriorities.map((priority) => <option key={priority.id} value={priority.id}>{priority.label}</option>)}</select></label>
            <fieldset><legend className="text-xs text-slate-300">Parámetro de ruta crítica</legend><div className="mt-2 flex min-h-11 items-center justify-between gap-3 rounded-lg border border-[#30363d] bg-[#0b1424] px-3"><label className="flex cursor-pointer items-center gap-2 text-[11px] text-slate-200"><input type="checkbox" checked={draft.critical} onChange={(event) => setDraft((current) => ({ ...current, critical: event.target.checked }))} className="accent-blue-500" /> Tarea en ruta crítica</label><label className="flex items-center gap-2 text-[10px] text-slate-500">Tolerancia:<input type="number" min="0" max="30" step="1" value={draft.tolerance} onChange={changeField('tolerance')} aria-label="Tolerancia en días" className="w-12 rounded border border-[#30363d] bg-[#111a2d] px-2 py-1 text-center text-white outline-none" /> días</label></div></fieldset>
          </div>
          <label className="mt-4 block text-xs text-slate-300">Documento o plano vinculado (Google Drive)<input type="url" maxLength={300} value={draft.documentUrl} onChange={changeField('documentUrl')} placeholder="https://drive.google.com/drive/folders/..." className={inputClass} /></label>
          <label className="mt-4 block text-xs text-slate-300">Descripción e instrucciones de terreno <span className="text-cyan-400">*</span><textarea required minLength={10} maxLength={600} rows={4} value={draft.description} onChange={changeField('description')} placeholder="Detalla verificaciones, entregables y criterios de aceptación..." className={`${inputClass} resize-y leading-relaxed`} /></label>
          {error && <p role="alert" className="mt-4 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-400">{error}</p>}
          <footer className="mt-5 flex flex-col-reverse gap-3 border-t border-[#30363d] pt-4 sm:flex-row sm:items-center sm:justify-between"><p className="text-[10px] text-slate-500">* Campos obligatorios para emitir la orden operativa.</p><div className="flex justify-end gap-2"><button type="button" onClick={onClose} className="rounded-lg border border-[#30363d] px-4 py-2.5 text-xs text-slate-300 hover:bg-white/5">Cancelar</button><button type="submit" className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-blue-500"><Download size={15} /> Emitir Orden de Trabajo</button></div></footer>
        </form>
      </section>
    </div>
  );
}

export default function Operations({ data, onChange, query = '', onQueryChange, canManage = false, projectOptions = [], responsibleOptions = [] }) {
  const [projectFilter, setProjectFilter] = useState('all');
  const [orderFilter, setOrderFilter] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [feedback, setFeedback] = useState('');
  const availableProjects = Array.from(new Set([...operationalProjects, ...projectOptions]));
  const orders = filterWorkOrders(data.orders, query, orderFilter, projectFilter);
  const metricCards = [
    { label: 'Tareas en progreso', value: data.metrics.inProgress, note: '+4 hoy', icon: Activity, color: 'text-blue-400', badge: 'bg-blue-500/10 text-blue-400' },
    { label: 'Tareas completadas', value: data.metrics.completed, note: '92% Ratio', icon: CheckCircle2, color: 'text-emerald-400', badge: 'bg-emerald-500/10 text-emerald-400' },
    { label: 'Incidencias abiertas', value: data.metrics.incidents, note: '1 Crítica', icon: AlertTriangle, color: 'text-red-400', badge: 'bg-red-500/10 text-red-400' },
    { label: 'Eficiencia operativa', value: `${data.metrics.efficiency}%`, note: '+1.5%', icon: BarChart3, color: 'text-cyan-400', badge: 'bg-emerald-500/10 text-emerald-400' },
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
    const blob = new Blob([`\uFEFF${buildWorkOrdersCsv(data.orders)}`], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'reporte-operativo-diario.csv';
    link.click();
    URL.revokeObjectURL(url);
    setFeedback('Reporte operativo diario exportado correctamente.');
  };

  return (
    <main className="min-w-0 flex-1 overflow-y-auto bg-[#0d1117] p-4 text-slate-100 md:p-6 lg:p-8">
      <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-5 pb-8">
        <header className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between"><div><h1 className="text-2xl font-bold tracking-tight text-white md:text-[28px]">Gestión Operativa de Campo</h1><p className="mt-1 text-sm text-slate-400">Control de tareas activas, órdenes de trabajo críticas y aseguramiento de calidad</p></div><div className="flex flex-wrap items-center gap-2"><select value={projectFilter} onChange={(event) => setProjectFilter(event.target.value)} aria-label="Filtrar por proyecto operativo" className="rounded-lg border border-[#30363d] bg-[#111827] px-3 py-2.5 text-xs text-slate-200 outline-none"><option value="all">Todos los proyectos</option>{availableProjects.map((project) => <option key={project}>{project}</option>)}</select>{canManage && <><button type="button" onClick={exportReport} className="inline-flex items-center gap-2 rounded-lg border border-[#30363d] bg-[#111827] px-3 py-2.5 text-xs text-slate-300 hover:text-white"><ClipboardCheck size={15} /> Generar Reporte Diario</button><button type="button" onClick={() => { setDialogOpen(true); setFeedback(''); }} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-blue-500"><Plus size={16} /> Nueva Orden de Trabajo</button></>}</div></header>
        <p role="status" className={feedback ? 'text-xs text-cyan-300' : 'sr-only'}>{feedback}</p>

        <section aria-label="Resumen operativo" className="grid grid-cols-2 gap-3 xl:grid-cols-4">{metricCards.map((card) => { const Icon = card.icon; return <article key={card.label} className="rounded-xl border border-[#263244] bg-[#111a2b] p-4 sm:p-5"><div className="flex items-start justify-between gap-3"><p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{card.label}</p><span className={`rounded-lg border border-[#30363d] bg-[#0b1424] p-2 ${card.color}`}><Icon size={16} /></span></div><div className="mt-4 flex items-end justify-between gap-3"><strong className="text-3xl font-bold text-white">{card.value}</strong><span className={`rounded px-2 py-1 text-[10px] font-semibold ${card.badge}`}>{card.note}</span></div></article>; })}</section>

        <section className="overflow-hidden rounded-xl border border-[#263244] bg-[#111a2b] p-4 sm:p-5" aria-labelledby="critical-schedule-title"><div className="flex flex-wrap items-start justify-between gap-3"><div><h2 id="critical-schedule-title" className="text-base font-semibold text-white">Cronograma de Actividades Críticas</h2><p className="mt-1 text-[10px] text-slate-500">Seguimiento temporal y avance real de entregables clave</p></div><div className="flex gap-3 text-[9px] text-slate-400"><span><i className="mr-1 inline-block h-2 w-2 bg-blue-500" /> En tiempo</span><span><i className="mr-1 inline-block h-2 w-2 bg-emerald-500" /> Acelerada</span><span><i className="mr-1 inline-block h-2 w-2 bg-purple-500" /> Programada</span></div></div><div className="mt-5 overflow-x-auto"><div className="min-w-[780px]"><div className="grid grid-cols-[230px_1fr_90px] border-b border-[#263244] pb-2"><span className="text-[9px] text-slate-500">Actividad / Obra</span><div className="grid grid-cols-6">{months.map((month) => <span key={month} className="text-center text-[9px] text-slate-500">{month}</span>)}</div><span className="text-right text-[9px] text-slate-500">Avance total</span></div><div className="space-y-4 pt-4">{data.activities.map((activity) => <article key={activity.id} className="grid grid-cols-[230px_1fr_90px] items-center"><div><h3 className="text-xs font-semibold text-white">{activity.name}</h3><p className="mt-1 text-[9px] text-slate-500">{activity.project}</p></div><div className="relative h-7 rounded bg-[#09111f]" style={{ backgroundImage: 'linear-gradient(to right, rgba(100,136,186,.14) 1px, transparent 1px)', backgroundSize: '16.6667% 100%' }}><div className="absolute inset-y-0 flex items-center justify-center rounded px-2 text-[9px] font-semibold text-white" style={{ left: `${((activity.start - 1) / 6) * 100}%`, width: `${(activity.duration / 6) * 100}%`, backgroundColor: activity.color }}><span className="truncate">{activity.period}</span></div></div><div className="pl-5"><strong className="block text-right text-[10px]" style={{ color: activity.color }}>{activity.progress}%</strong><div className="mt-2 h-1 overflow-hidden rounded bg-[#09111f]"><div className="h-full" style={{ width: `${activity.progress}%`, backgroundColor: activity.color }} /></div></div></article>)}</div></div></div></section>

        <div className="grid min-w-0 items-start gap-5 xl:grid-cols-[minmax(0,2.2fr)_minmax(270px,0.8fr)]">
          <section className="min-w-0 overflow-hidden rounded-xl border border-[#263244] bg-[#111a2b]" aria-labelledby="work-orders-title"><header className="flex flex-wrap items-center justify-between gap-3 px-4 pt-5 sm:px-5"><div><h2 id="work-orders-title" className="text-base font-semibold text-white">Órdenes de Trabajo Activas</h2><p className="mt-1 text-[10px] text-slate-500">Últimas órdenes de operación en terreno</p></div><div className="flex gap-1 rounded-lg bg-[#0b1424] p-1">{[{ id: 'all', label: 'Todas' }, { id: 'high', label: 'Alta prioridad' }, { id: 'in-progress', label: 'En curso' }].map((filter) => <button key={filter.id} type="button" onClick={() => setOrderFilter(filter.id)} aria-pressed={orderFilter === filter.id} className={`rounded px-3 py-1.5 text-[9px] font-medium ${orderFilter === filter.id ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}>{filter.label}</button>)}</div></header><div className="mt-3 overflow-x-auto px-4 sm:px-5"><table className="w-full min-w-[760px] border-collapse text-left"><thead><tr className="border-b border-[#263244] text-[9px] uppercase text-slate-500">{['ID', 'Proyecto', 'Tipo', 'Responsable', 'Prioridad', 'Estado', 'Acción'].map((label) => <th key={label} className="px-2 py-3 font-semibold first:pl-0 last:pr-0">{label}</th>)}</tr></thead><tbody>{orders.map((order) => <tr key={order.id} className="border-b border-[#263244]/70 last:border-0 hover:bg-white/[0.02]"><td className="py-3.5 pr-2 font-mono text-[10px] font-bold text-white">{order.code}</td><td className="max-w-[150px] truncate px-2 py-3.5 text-[10px] font-medium text-blue-400" title={order.project}>{order.project.split(' (')[0]}</td><td className="px-2 py-3.5 text-[10px] text-slate-300">{order.type}</td><td className="px-2 py-3.5 text-[10px] text-slate-300">{order.responsible}</td><td className="px-2 py-3.5"><PriorityBadge priority={order.priority} /></td><td className="px-2 py-3.5"><OrderStatusBadge status={order.status} /></td><td className="py-3.5 pl-2 text-right"><button type="button" onClick={() => setFeedback(`${order.code}: ${order.title}. ${order.description}`)} aria-label={`Ver orden ${order.code}`} className="rounded p-1.5 text-slate-500 hover:bg-white/5 hover:text-white"><MoreVertical size={15} /></button></td></tr>)}{!orders.length && <tr><td colSpan={7} className="py-12 text-center text-sm text-slate-500">No se encontraron órdenes con estos filtros.</td></tr>}</tbody></table></div><footer className="mt-2 flex items-center justify-between border-t border-[#263244] px-4 py-3 text-[10px] text-slate-500 sm:px-5"><span>Mostrando {orders.length} de {data.orders.length} órdenes</span>{(query || projectFilter !== 'all' || orderFilter !== 'all') && <button type="button" onClick={() => { setOrderFilter('all'); setProjectFilter('all'); onQueryChange(''); }} className="text-blue-400 hover:text-blue-300">Limpiar filtros</button>}</footer></section>

          <div className="space-y-5"><aside className="rounded-xl border border-[#263244] bg-[#111a2b] p-4 sm:p-5" aria-labelledby="operation-alerts-title"><div className="flex items-center justify-between gap-3"><h2 id="operation-alerts-title" className="text-sm font-semibold text-white">Alertas Críticas de Operación</h2><span className="rounded bg-red-500/10 px-2 py-1 text-[9px] font-semibold text-red-400">{data.alerts.length} Urgentes</span></div><div className="mt-4 space-y-3">{data.alerts.map((alert) => <article key={alert.id} className={`rounded-lg border p-3 ${alert.level === 'critical' ? 'border-red-500/20 bg-red-500/5' : 'border-amber-500/20 bg-amber-500/5'}`}><div className="flex items-start justify-between gap-3"><div><h3 className="text-[10px] font-semibold text-slate-200"><i className={`mr-2 inline-block h-2 w-2 rounded-full ${alert.level === 'critical' ? 'bg-red-500' : 'bg-amber-500'}`} />{alert.title}</h3><p className="mt-1 pl-4 text-[9px] text-slate-500">{alert.project}</p></div><button type="button" onClick={() => setFeedback(`Alerta seleccionada: ${alert.title}`)} className={`rounded border px-2 py-1 text-[9px] font-semibold ${alert.level === 'critical' ? 'border-red-500/25 text-red-400' : 'border-amber-500/25 text-amber-400'}`}>{alert.level === 'critical' ? 'Atender' : 'Revisar'}</button></div></article>)}</div></aside><aside className="rounded-xl border border-[#263244] bg-[#111a2b] p-4 sm:p-5" aria-labelledby="quality-title"><div className="flex items-center justify-between gap-3"><h2 id="quality-title" className="text-sm font-semibold text-white">Aseguramiento de Calidad</h2><span className="text-[9px] text-slate-500">Norma ISO-9001</span></div><div className="mt-4 space-y-3">{data.qualityChecks.map((check) => <article key={check.id} className="flex items-center justify-between gap-3 rounded-lg border border-[#263244] bg-[#0b1424] p-3"><p className="flex items-center gap-2 text-[10px] text-slate-300"><ShieldCheck size={13} className={check.status === 'Aprobada' ? 'text-emerald-400' : 'text-amber-400'} />{check.title}</p><span className={`rounded px-2 py-1 text-[9px] font-semibold ${check.status === 'Aprobada' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>{check.status}</span></article>)}</div></aside></div>
        </div>
      </div>
      {dialogOpen && canManage && <NewWorkOrderDialog projectOptions={availableProjects} responsibleOptions={responsibleOptions} onSubmit={saveOrder} onClose={() => setDialogOpen(false)} />}
    </main>
  );
}
