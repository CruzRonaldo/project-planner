import React, { useMemo, useState } from 'react';
import { FileDown, Flag, History, MoreVertical, Plus, SlidersHorizontal, Trash2 } from 'lucide-react';
import AdjustScheduleDialog from './components/AdjustScheduleDialog';
import NewGlobalMilestoneDialog from './components/NewGlobalMilestoneDialog';
import Select from '../../components/common/Select';
import Pagination from '../../components/common/Pagination';
import { getYearOptions } from '../../utils/format';
import { useToast } from '../../context/ToastContext';
import {
  cardClass,
  closeBtnClass,
  nestedClass,
  primaryBtnClass,
  secondaryButtonClass,
} from '../../constants/themeClasses';
import {
  planningMonths,
  milestoneStatuses,
} from '../../constants/strategicPlanning';
import {
  adjustProjectSchedule,
  createGlobalMilestone,
  formatMilestoneDate,
} from '../../utils/strategicPlanning';
import { createStrategicPlanningData } from '../../mocks/strategicPlanningData';
import projectsApi from '../../services/projectsApi';

export { AdjustScheduleDialog, NewGlobalMilestoneDialog };

const headingClass = 'text-slate-900 transition-colors duration-300 dark:text-white midnight:text-cyan-50';
const mutedClass = 'text-slate-500 transition-colors duration-300 dark:text-slate-400 midnight:text-cyan-500/70';

const months = planningMonths.map((month) => month.short);

export default function StrategicPlanning({ data = createStrategicPlanningData(), onChange = () => {}, canManage = false }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [milestoneDialogOpen, setMilestoneDialogOpen] = useState(false);
  const [adjustingProjectId, setAdjustingProjectId] = useState(null);
  const [selectedProjectFilter, setSelectedProjectFilter] = useState('ALL');
  const [selectedYear, setSelectedYear] = useState(() => String(new Date().getFullYear()));
  const [milestonePage, setMilestonePage] = useState(1);
  const { showToast } = useToast();
  const projects = useMemo(() => data?.projects || [], [data]);
  const milestones = useMemo(() => data?.milestones ?? [], [data]);
  const adjustments = useMemo(() => data?.adjustments || [], [data]);

  const activeProject = useMemo(() => {
    if (selectedProjectFilter === 'ALL') return null;
    return projects.find((p) => String(p.id) === String(selectedProjectFilter)) || null;
  }, [projects, selectedProjectFilter]);

  const displayedProjects = useMemo(() => {
    if (!activeProject) return projects;
    return projects.filter((p) => String(p.id) === String(activeProject.id));
  }, [projects, activeProject]);

  const filteredMilestones = useMemo(() => {
    if (!activeProject) return milestones;
    return milestones.filter(
      (m) =>
        String(m.projectId) === String(activeProject.id) ||
        String(m.project) === String(activeProject.id)
    );
  }, [milestones, activeProject]);

  const milestonePageSize = 5;
  const totalMilestonePages = Math.max(1, Math.ceil(filteredMilestones.length / milestonePageSize));
  const currentMilestonePage = Math.min(milestonePage, totalMilestonePages);
  const visibleMilestones = useMemo(() => {
    return filteredMilestones.slice(
      (currentMilestonePage - 1) * milestonePageSize,
      currentMilestonePage * milestonePageSize
    );
  }, [filteredMilestones, currentMilestonePage]);

  const displayedAdjustments = useMemo(() => {
    if (!activeProject) return adjustments;
    return adjustments.filter((adj) => String(adj.projectId) === String(activeProject.id));
  }, [adjustments, activeProject]);

  const targetProjectsForBudget = activeProject ? [activeProject] : projects;

  const totalBudget = targetProjectsForBudget.reduce(
    (acc, p) => acc + (Number(p.totalBudget) || Number(p.budget) || 0),
    0
  );
  const executedBudget = targetProjectsForBudget.reduce(
    (acc, p) => acc + (Number(p.usedBudget) || 0),
    0
  );
  const availableBudget = Math.max(0, totalBudget - executedBudget);
  const executedPct = totalBudget > 0 ? Math.min(100, Math.round((executedBudget / totalBudget) * 100)) : 0;
  const availablePct = totalBudget > 0 ? Math.max(0, 100 - executedPct) : 0;

  const formatBudget = (amount) => {
    if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`;
    if (amount >= 1_000) return `$${(amount / 1_000).toFixed(0)}K`;
    return `$${Number(amount || 0).toLocaleString()}`;
  };

  const saveSchedule = async (draft) => {
    try {
      const startMonth = Number(draft.start);
      const duration = Number(draft.duration);
      const endMonth = Math.min(12, startMonth + duration - 1);
      const startDateStr = `2026-${String(startMonth).padStart(2, '0')}-01`;
      const endDateStr = `2026-${String(endMonth).padStart(2, '0')}-28`;

      if (typeof draft.projectId === 'number' || (!isNaN(Number(draft.projectId)) && String(Number(draft.projectId)) === String(draft.projectId))) {
        await projectsApi.updateProject(draft.projectId, {
          start_date: startDateStr,
          end_date: endDateStr,
          duration_months: duration,
        });
      }
    } catch (apiErr) {
      console.warn('Reajuste registrado localmente:', apiErr);
    }
    const updated = adjustProjectSchedule(data, draft);
    onChange(updated);
    setDialogOpen(false);
    const msg = updated === data ? 'No había cambios que guardar.' : 'Calendario actualizado y registrado en el historial de auditoría.';
    showToast({
      title: 'Calendario de Proyecto',
      message: msg,
      type: updated === data ? 'info' : 'success',
    });
  };
  const saveMilestone = async (draft) => {
    setMilestonePage(1);
    try {
      const createdBackend = await projectsApi.createMilestone({
        projectId: draft.projectId,
        title: draft.title,
        description: draft.description,
        targetDate: draft.targetDate,
        status: draft.status,
      });
      if (createdBackend?.id) {
        draft.id = createdBackend.id;
      }
    } catch (apiErr) {
      console.warn('Hito registrado localmente:', apiErr);
    }
    const updated = createGlobalMilestone(data, draft);
    onChange(updated);
    setMilestoneDialogOpen(false);
    const targetProject = projects.find((p) => String(p.id) === String(draft.projectId));
    const projectLabel = targetProject ? ` para el proyecto '${targetProject.name}'` : '';
    const msg = `Hito “${updated.milestones[0].title}” registrado${projectLabel} en el calendario global.`;
    showToast({
      title: 'Hito Creado',
      message: msg,
      type: 'success',
    });
  };

  const handleStatusChange = async (milestoneId, newStatus) => {
    try {
      if (typeof milestoneId === 'number' || (!isNaN(Number(milestoneId)) && String(Number(milestoneId)) === String(milestoneId))) {
        await projectsApi.updateMilestone(milestoneId, { status: newStatus });
      }
    } catch (err) {
      console.warn('Error al actualizar estado del hito en backend:', err);
    }
    const updatedMilestones = (data?.milestones || []).map((m) =>
      String(m.id) === String(milestoneId) ? { ...m, status: newStatus } : m
    );
    const updated = { ...data, milestones: updatedMilestones };
    onChange(updated);
    const currentMilestone = (data?.milestones || []).find((m) => String(m.id) === String(milestoneId));
    const statusLabel = milestoneStatuses.find((s) => s.id === newStatus)?.label || newStatus;
    const titleLabel = currentMilestone ? ` “${currentMilestone.title}”` : '';
    const msg = `Estado del hito${titleLabel} actualizado a “${statusLabel}”.`;
    showToast({
      title: 'Hito Actualizado',
      message: msg,
      type: 'info',
    });
  };

  const handleDeleteMilestone = async (milestoneId, title) => {
    try {
      if (typeof milestoneId === 'number' || (!isNaN(Number(milestoneId)) && String(Number(milestoneId)) === String(milestoneId))) {
        await projectsApi.deleteMilestone(milestoneId);
      }
    } catch (err) {
      console.warn('Error al eliminar hito en backend:', err);
    }
    const milestoneToDelete = (data?.milestones || []).find((m) => String(m.id) === String(milestoneId));
    const associatedProject = projects.find((p) => String(p.id) === String(milestoneToDelete?.projectId));
    const projectLabel = associatedProject ? ` del proyecto '${associatedProject.name}'` : '';
    const updated = {
      ...data,
      milestones: (data?.milestones || []).filter((m) => String(m.id) !== String(milestoneId)),
    };
    onChange(updated);
    const msg = `Hito “${title}”${projectLabel} eliminado.`;
    showToast({
      title: 'Hito Eliminado',
      message: msg,
      type: 'info',
    });
  };

  const exportToPdf = () => {
    const todayStr = new Date().toISOString().split('T')[0];
    const originalTitle = document.title;
    let fileName = `Calendario_Maestro_Proyectos_2026_${todayStr}`;

    if (activeProject) {
      const slug = (activeProject.code || activeProject.name || 'Proyecto')
        .trim()
        .replace(/\s+/g, '_')
        .replace(/[^a-zA-Z0-9_-]/g, '');
      fileName = `Calendario_${slug}_${todayStr}`;
    }

    document.title = fileName;

    const restoreTitle = () => {
      document.title = originalTitle;
      window.removeEventListener('afterprint', restoreTitle);
    };

    window.addEventListener('afterprint', restoreTitle);
    window.print();

    setTimeout(restoreTitle, 3000);
    showToast({
      title: 'Exportación de Calendario',
      message: `Vista de exportación abierta para guardar o imprimir “${fileName}.pdf”.`,
      type: 'info',
    });
  };

  return (
    <main className="min-w-0 flex-1 overflow-y-auto bg-slate-50 p-4 text-slate-900 transition-colors duration-300 dark:bg-[#0d1117] dark:text-slate-100 midnight:bg-[#050B14] midnight:text-cyan-50 md:p-6 lg:p-8 print:bg-white print:p-0 print:overflow-visible">
      <div className="mx-auto flex w-full max-w-[1500px] flex-col gap-6 pb-8 print:max-w-none print:gap-4 print:pb-0">
        
        {/* ENCABEZADO FORMAL PARA EXPORTACIÓN A PDF */}
        <header className="print-header hidden print:block mb-4 border-b-2 border-slate-800 pb-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold tracking-widest text-blue-700 uppercase">PROJECT PLANNER</span>
                <span className="text-slate-300">|</span>
                <span className="text-xs text-slate-500 font-medium">Sistema de Planificación Estratégica</span>
              </div>
              <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
                {activeProject
                  ? `Calendario de Proyecto 2026 — ${activeProject.code ? `${activeProject.code} · ` : ''}${activeProject.name}`
                  : 'Calendario Maestro de Proyectos 2026'}
              </h1>
              <p className="mt-0.5 text-xs text-slate-600">
                {activeProject
                  ? `Cronograma de Ruta Crítica, Hitos Clave y Control Presupuestario (${activeProject.area})`
                  : 'Cronograma Anual de Ruta Crítica, Hitos Clave y Asignación Presupuestaria'}
              </p>
            </div>
            <div className="text-right text-xs text-slate-500">
              <p><span className="font-semibold text-slate-700">Fecha de Emisión:</span> {new Date().toLocaleDateString('es-PE', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
              <p className="mt-0.5 text-[10px] text-slate-400">
                {activeProject
                  ? `Proyecto: ${activeProject.code || activeProject.name} · Hitos Asociados: ${filteredMilestones.length}`
                  : `Total Proyectos: ${projects.length} · Total Hitos: ${milestones.length}`}
              </p>
            </div>
          </div>
        </header>

        {/* ENCABEZADO INTERACTIVO EN PANTALLA */}
        <section className="flex flex-col gap-4 no-print print:hidden">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className={`text-2xl font-bold tracking-tight ${headingClass} md:text-[28px]`}>Calendario Maestro 2026</h1>
              <p className={`mt-1 text-sm ${mutedClass}`}>Planificación de ruta crítica y cronograma de infraestructura anual</p>
            </div>

            {canManage && (
              <div className="flex flex-wrap items-center gap-2">
                <button type="button" onClick={() => { setAdjustingProjectId(null); setDialogOpen(true); }} className={secondaryButtonClass}>
                  <SlidersHorizontal size={15} /> Ajustar Calendario
                </button>
                <button type="button" onClick={exportToPdf} className={secondaryButtonClass}>
                  <FileDown size={15} /> Exportar Gantt / PDF
                </button>
                <button type="button" onClick={() => { setMilestoneDialogOpen(true); }} className={primaryBtnClass}>
                  <Plus size={15} /> Nuevo Hito Global
                </button>
              </div>
            )}
          </div>

          {/* BARRA DE FILTROS SUPERIOR (PROYECTO Y AÑO) */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200/80 pt-3 dark:border-white/5 midnight:border-cyan-900/30">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className={`text-xs font-medium ${mutedClass}`}>Filtros del cronograma:</span>
              
              {/* SELECTOR DE PROYECTO */}
              <Select
                value={selectedProjectFilter}
                onChange={(e) => { setSelectedProjectFilter(e.target.value); setMilestonePage(1); }}
                aria-label="Filtrar por proyecto"
                className="max-w-[220px] truncate"
                options={[
                  { value: 'ALL', label: `Todos los proyectos (${projects.length})` },
                  ...projects.map((p) => ({
                    value: p.id,
                    label: `${p.code ? `${p.code} · ` : ''}${p.name}`,
                  })),
                ]}
              />

              {/* SELECTOR DE AÑO */}
              <Select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                aria-label="Seleccionar año"
                options={getYearOptions(
                  1,
                  3,
                  (data.projects || []).map((p) => (p.startDate ? new Date(p.startDate).getFullYear() : null)).filter(Number.isFinite)
                )}
              />
            </div>


          </div>
        </section>

        {/* CONTENEDOR DEL GANTT */}
        <section className={`${cardClass} overflow-hidden p-0 md:p-0 print:border print:border-slate-300 print:shadow-none print:bg-white avoid-break`}>
          <div className="overflow-x-auto p-5 md:p-6 print:p-3 print:overflow-visible">
            <div className="min-w-[820px] print:min-w-full">
              <div className="grid grid-cols-[220px_1fr] border-b border-slate-200 pb-3 transition-colors duration-300 dark:border-white/10 midnight:border-cyan-900/30">
                <div />
                <div className="grid grid-cols-12">
                  {months.map((month) => (
                    <span key={month} className={`text-center text-[11px] font-medium ${mutedClass}`}>{month}</span>
                  ))}
                </div>
              </div>

              <div className="space-y-4 pt-4">
                {displayedProjects.length === 0 ? (
                  <div className="py-10 text-center text-xs text-slate-500 dark:text-slate-400 midnight:text-cyan-500/70">
                    No hay proyectos registrados en el calendario anual para la selección actual.
                  </div>
                ) : (
                  displayedProjects.map((project) => {
                    const projectBudget = Number(project.totalBudget) || Number(project.budget) || 0;
                    const isAbove100k = projectBudget > 100000;
                    const projectMilestones = milestones.filter(
                      (m) => String(m.projectId) === String(project.id) || String(m.project) === String(project.id)
                    );

                    return (
                    <div key={project.name} className="grid min-h-12 grid-cols-[220px_1fr] items-center">
                      <div className="pr-5">
                        <div className="flex items-center gap-1.5">
                          <p className={`text-sm font-semibold truncate ${headingClass}`}>{project.name}</p>
                          {project.code && (
                            <span className="shrink-0 rounded bg-slate-100 px-1 py-0.5 font-mono text-[9px] text-slate-600 dark:bg-slate-800 dark:text-slate-400 midnight:bg-cyan-950 midnight:text-cyan-400">
                              {project.code}
                            </span>
                          )}
                        </div>
                        <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                          <p className={`text-[10px] ${mutedClass}`}>{project.area}</p>
                          {isAbove100k ? (
                            <span
                              className="inline-flex items-center rounded border border-amber-300 bg-amber-50 px-1.5 py-0.2 text-[8px] font-semibold text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300 midnight:border-amber-500/30 midnight:bg-amber-500/10 midnight:text-amber-300"
                              title="Presupuesto > $100k: Requiere revisión y dictamen por Comité Directivo"
                            >
                              Comité (&gt;$100k)
                            </span>
                          ) : (
                            <span
                              className="inline-flex items-center rounded border border-blue-200 bg-blue-50 px-1.5 py-0.2 text-[8px] font-semibold text-blue-700 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-300 midnight:border-cyan-500/30 midnight:bg-cyan-500/10 midnight:text-cyan-300"
                              title="Presupuesto ≤ $100k: Aprobación directa por Líder Técnico"
                            >
                              Líder (≤$100k)
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="relative h-9 rounded-md bg-slate-50 transition-colors duration-300 dark:bg-[#080f1b] midnight:bg-cyan-950/30">
                        {/* CUADRÍCULA DE LÍNEAS NATIVAS */}
                        <div className="absolute inset-0 grid grid-cols-12 divide-x divide-slate-200 transition-colors duration-300 dark:divide-white/5 midnight:divide-cyan-900/30">
                          {Array.from({ length: 12 }).map((_, i) => (
                            <div key={i} className="h-full w-full"></div>
                          ))}
                        </div>

                        {/* BARRA PRINCIPAL DEL PROYECTO */}
                        <div
                          className="absolute inset-y-0.5 flex items-center rounded-md px-3 text-[10px] font-bold text-white shadow-sm transition-all duration-300"
                          style={{
                            left: `${((project.start - 1) / 12) * 100}%`,
                            width: `${(project.duration / 12) * 100}%`,
                            backgroundColor: project.color,
                          }}
                        >
                          <span className="flex-1 truncate text-center">{project.period}</span>
                          {canManage && <button type="button" onClick={() => { setAdjustingProjectId(project.id); setDialogOpen(true); }} aria-label={`Ajustar calendario de ${project.name}`} title="Ajustar calendario" className="ml-2 shrink-0 rounded p-1 text-white/80 transition-colors hover:bg-black/15 hover:text-white no-print print:hidden"><SlidersHorizontal size={11} /></button>}
                        </div>

                        {/* HITOS ASOCIADOS EN EL CRONOGRAMA */}
                        {projectMilestones.map((m) => {
                          const mDate = new Date(`${m.targetDate}T00:00:00`);
                          const mMonth = !isNaN(mDate.getTime()) ? mDate.getMonth() + 1 : project.start;
                          const mDay = !isNaN(mDate.getTime()) ? mDate.getDate() : 15;
                          const leftPct = Math.min(98, Math.max(2, (((mMonth - 1) + (mDay / 31)) / 12) * 100));
                          const mStatus = (m.status || '').toLowerCase();
                          const isDone = mStatus === 'completed';
                          const isUp = mStatus === 'upcoming' || mStatus === 'in_progress';
                          const markerBg = isDone ? 'bg-emerald-500 border-white text-white' : isUp ? 'bg-blue-500 border-white text-white' : 'bg-amber-500 border-white text-white';

                          return (
                            <div
                              key={m.id}
                              className="group absolute -top-1.5 z-20 flex -translate-x-1/2 flex-col items-center cursor-pointer"
                              style={{ left: `${leftPct}%` }}
                              onClick={() => showToast({ title: m.title, message: `${formatMilestoneDate(m.targetDate)} · Estado: ${m.status}`, type: 'info' })}
                            >
                              <span
                                aria-label={`Hito: ${m.title}`}
                                className={`flex h-5 w-5 items-center justify-center rounded-full border-2 shadow-md transition-transform duration-150 group-hover:scale-125 ${markerBg}`}
                              >
                                <Flag size={9} className="fill-current" />
                              </span>
                              <div className="pointer-events-none absolute bottom-full mb-1.5 hidden flex-col items-center rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1 text-[10px] text-white shadow-xl transition-all group-hover:flex z-30 whitespace-nowrap dark:border-slate-600 dark:bg-slate-800">
                                <span className="font-semibold">{m.title}</span>
                                <span className="text-[9px] text-slate-300">{formatMilestoneDate(m.targetDate)}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ); })
                )}
              </div>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
          
          {/* HITOS GLOBALES: Aquí devolvemos el padding de p-5 md:p-6 */}
          <section className={`${cardClass} p-5 md:p-6 xl:col-span-3 print:border print:border-slate-300 print:shadow-none print:bg-white avoid-break`}>
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className={`text-base font-semibold ${headingClass}`}>Hitos Globales</h2>
                <p className={`text-xs ${mutedClass} hidden print:block`}>
                  {selectedProjectFilter === 'ALL'
                    ? 'Mostrando todos los proyectos'
                    : `Filtrado por: ${projects.find((p) => String(p.id) === String(selectedProjectFilter))?.name || selectedProjectFilter}`}
                </p>
              </div>

              {/* INDICADOR DE PROYECTO ACTIVO (SINCRONIZADO CON EL CRONOGRAMA SUPERIOR) */}
              <div className="no-print print:hidden">
                {activeProject ? (
                  <span className="shrink-0 rounded bg-blue-50 px-2.5 py-1 font-mono text-[10px] font-medium text-blue-700 dark:bg-blue-500/10 dark:text-blue-300 midnight:bg-cyan-950 midnight:text-cyan-400">
                    {activeProject.code ? `${activeProject.code} · ` : ''}{activeProject.name}
                  </span>
                ) : (
                  <span className={`text-xs ${mutedClass}`}>
                    {milestones.length} {milestones.length === 1 ? 'hito registrado' : 'hitos registrados'}
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-2.5">
              {filteredMilestones.length === 0 ? (
                <div className={`p-6 text-center text-xs text-slate-500 dark:text-slate-400 midnight:text-cyan-500/70 ${nestedClass}`}>
                  {selectedProjectFilter === 'ALL'
                    ? 'No hay hitos globales registrados.'
                    : 'No hay hitos registrados para el proyecto seleccionado.'}
                </div>
              ) : (
                <>
                  <div className="space-y-2.5 print:hidden">
                    {visibleMilestones.map((milestone) => {
                      const status = milestoneStatuses.find((item) => item.id === (milestone.status || '').toLowerCase()) || milestoneStatuses[0];
                      const associatedProject = projects.find(
                        (p) => String(p.id) === String(milestone.projectId || milestone.project)
                      );
                      return (
                        <article key={milestone.id} className={`flex items-center justify-between gap-4 p-3 ${nestedClass} print:bg-white print:border-slate-200`} title={milestone.description}>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className={`text-sm font-semibold truncate ${headingClass}`}>{milestone.title}</h3>
                              {(associatedProject?.code || milestone.project_code) && (
                                <span className="shrink-0 rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[9px] text-slate-600 dark:bg-slate-800 dark:text-slate-400 midnight:bg-cyan-950 midnight:text-cyan-400 print:bg-slate-100 print:text-slate-700">
                                  {associatedProject?.code || milestone.project_code}
                                </span>
                              )}
                              {associatedProject?.name && (
                                <span className={`text-[10px] truncate ${mutedClass} hidden sm:inline-block print:inline-block`}>
                                  · {associatedProject.name}
                                </span>
                              )}
                            </div>
                            <p className={`mt-0.5 text-[10px] ${mutedClass}`}>{formatMilestoneDate(milestone.targetDate)}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            {canManage ? (
                              <>
                                <select
                                  value={(milestone.status || 'pending').toLowerCase()}
                                  onChange={(e) => handleStatusChange(milestone.id, e.target.value)}
                                  aria-label={`Cambiar estado de ${milestone.title}`}
                                  title="Cambiar estado del hito"
                                  className={`cursor-pointer rounded border border-transparent px-2 py-1 text-[10px] font-semibold transition-colors duration-300 outline-none ${status.badge} hover:border-slate-300 dark:hover:border-slate-600 no-print print:hidden`}
                                >
                                  {milestoneStatuses.map((s) => (
                                    <option key={s.id} value={s.id} className="bg-white text-slate-900 dark:bg-[#161b22] dark:text-white midnight:bg-[#0a1120] midnight:text-cyan-50">
                                      {s.label}
                                    </option>
                                  ))}
                                </select>
                                <span className={`hidden print:inline-block shrink-0 rounded px-2 py-1 text-[10px] font-semibold ${status.badge}`}>
                                  {status.label}
                                </span>
                              </>
                            ) : (
                              <span className={`shrink-0 rounded px-2 py-1 text-[10px] font-semibold transition-colors duration-300 ${status.badge}`}>
                                {status.label}
                              </span>
                            )}
                            {canManage && (
                              <button
                                type="button"
                                onClick={() => handleDeleteMilestone(milestone.id, milestone.title)}
                                aria-label={`Eliminar hito ${milestone.title}`}
                                title="Eliminar hito"
                                className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10 dark:hover:text-red-400 midnight:hover:bg-red-500/10 midnight:hover:text-red-400 no-print print:hidden"
                              >
                                <Trash2 size={13} />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => showToast({
                                title: milestone.title,
                                message: `${milestone.description || 'Sin descripción adicional.'} (Responsable: ${milestone.validator || 'PM'})`,
                                type: 'info',
                              })}
                              aria-label={`Ver detalles de ${milestone.title}`}
                              className={`${closeBtnClass} no-print print:hidden`}
                            >
                              <MoreVertical size={14} />
                            </button>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                  <div className="hidden print:block space-y-2.5">
                    {filteredMilestones.map((milestone) => {
                      const status = milestoneStatuses.find((item) => item.id === (milestone.status || '').toLowerCase()) || milestoneStatuses[0];
                      const associatedProject = projects.find(
                        (p) => String(p.id) === String(milestone.projectId || milestone.project)
                      );
                      return (
                        <article key={milestone.id} className={`flex items-center justify-between gap-4 p-3 ${nestedClass} print:bg-white print:border-slate-200`}>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className={`text-sm font-semibold truncate ${headingClass}`}>{milestone.title}</h3>
                              {(associatedProject?.code || milestone.project_code) && (
                                <span className="shrink-0 rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[9px] text-slate-600 print:bg-slate-100 print:text-slate-700">
                                  {associatedProject?.code || milestone.project_code}
                                </span>
                              )}
                              {associatedProject?.name && (
                                <span className={`text-[10px] truncate ${mutedClass} print:inline-block`}>
                                  · {associatedProject.name}
                                </span>
                              )}
                            </div>
                            <p className={`mt-0.5 text-[10px] ${mutedClass}`}>{formatMilestoneDate(milestone.targetDate)}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`shrink-0 rounded px-2 py-1 text-[10px] font-semibold ${status.badge}`}>
                              {status.label}
                            </span>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

            <Pagination
              currentPage={currentMilestonePage}
              totalPages={totalMilestonePages}
              totalItems={filteredMilestones.length}
              pageSize={milestonePageSize}
              itemLabel="hitos"
              onPageChange={setMilestonePage}
              hideOnSinglePage={true}
              className="mt-4 border-t border-slate-200/80 pt-3 dark:border-white/5 midnight:border-cyan-900/30"
            />
          </section>

          {/* CONTROL PRESUPUESTARIO */}
          <section className={`${cardClass} p-5 md:p-6 xl:col-span-2 print:border print:border-slate-300 print:shadow-none print:bg-white avoid-break`}>
            <div className="flex items-center justify-between">
              <h2 className={`text-base font-semibold ${headingClass}`}>Control Presupuestario</h2>
              {activeProject && (
                <span className="shrink-0 rounded bg-blue-50 px-2 py-0.5 font-mono text-[10px] font-medium text-blue-700 dark:bg-blue-500/10 dark:text-blue-300 midnight:bg-cyan-950 midnight:text-cyan-400">
                  {activeProject.code || activeProject.name}
                </span>
              )}
            </div>

            <div className="flex justify-center py-5">
              <div
                className="flex h-36 w-36 items-center justify-center rounded-full transition-colors duration-300"
                style={{
                  background:
                    totalBudget > 0
                      ? `conic-gradient(#3978c6 0 ${availablePct}%, #10b981 ${availablePct}% 100%)`
                      : 'conic-gradient(#64748b 0% 100%, #64748b 100% 100%)',
                }}
              >
                <div className="flex h-[94px] w-[94px] flex-col items-center justify-center rounded-full bg-white transition-colors duration-300 dark:bg-[#161b22] midnight:bg-[#0a1120]">
                  <strong className={`text-xl ${headingClass}`}>{formatBudget(totalBudget)}</strong>
                  <span className={`mt-1 text-[10px] ${mutedClass}`}>
                    {totalBudget > 0 ? 'Presupuesto' : 'Sin asignar'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 border-b border-slate-200 pb-5 text-[10px] text-slate-500 transition-colors duration-300 dark:border-white/10 dark:text-slate-400 midnight:border-cyan-900/30 midnight:text-cyan-600">
              <span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-sm bg-[#3978c6]" /> Disponible ({availablePct}%)</span>
              <span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-sm bg-emerald-500" /> Ejecutado ({executedPct}%)</span>
            </div>

            <div className="mt-5 grid grid-cols-3 gap-3">
              <div>
                <p className={`text-[10px] ${mutedClass}`}>Total</p>
                <strong className={`mt-1 block text-sm ${headingClass}`}>{formatBudget(totalBudget)}</strong>
              </div>
              <div>
                <p className={`text-[10px] ${mutedClass}`}>Ejecutado</p>
                <strong className="mt-1 block text-sm text-emerald-600 transition-colors duration-300 dark:text-emerald-400 midnight:text-emerald-300">{formatBudget(executedBudget)}</strong>
              </div>
              <div>
                <p className={`text-[10px] ${mutedClass}`}>Disponible</p>
                <strong className="mt-1 block text-sm text-blue-600 transition-colors duration-300 dark:text-blue-400 midnight:text-blue-400">{formatBudget(availableBudget)}</strong>
              </div>
            </div>
          </section>
        </div>

        {/* HISTORIAL DE AUDITORÍA Y REAJUSTES DE CRONOGRAMA */}
        <section
          className={`min-w-0 overflow-hidden ${cardClass} print:border print:border-slate-300 print:shadow-none print:bg-white avoid-break`}
          aria-labelledby="audit-history-title"
        >
          <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-4 dark:border-[#30363d] midnight:border-cyan-900/30 sm:px-6">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 midnight:bg-cyan-500/15 midnight:text-cyan-300">
                <History size={16} />
              </div>
              <div>
                <h2 id="audit-history-title" className={`text-base font-semibold ${headingClass}`}>
                  Historial de Reajustes de Cronograma
                </h2>
                <p className={`mt-0.5 text-xs ${mutedClass}`}>
                  Registro de modificaciones de plazos, prórrogas y motivos de gobernanza
                </p>
              </div>
            </div>
            <span className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-600 dark:border-[#30363d] dark:bg-[#0d1117] dark:text-slate-300 midnight:border-cyan-800/40 midnight:bg-[#050B14] midnight:text-cyan-300">
              {displayedAdjustments.length} {displayedAdjustments.length === 1 ? 'registro' : 'registros'}
            </span>
          </header>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/75 text-[11px] font-semibold text-slate-500 dark:border-[#30363d] dark:bg-[#0d1117]/60 dark:text-slate-400 midnight:border-cyan-900/30 midnight:bg-[#050B14]/80 midnight:text-cyan-500">
                  <th className="px-4 py-3 sm:px-6">Fecha</th>
                  <th className="px-4 py-3 sm:px-6">Proyecto</th>
                  <th className="px-4 py-3 sm:px-6">Periodo Anterior</th>
                  <th className="px-4 py-3 sm:px-6">Nuevo Periodo</th>
                  <th className="px-4 py-3 sm:px-6">Motivo del Reajuste</th>
                </tr>
              </thead>
              <tbody>
                {displayedAdjustments.map((adj) => (
                  <tr
                    key={adj.id}
                    className="border-b border-slate-200 last:border-0 transition-colors hover:bg-slate-50/50 dark:border-[#30363d] dark:hover:bg-white/[0.02] midnight:border-cyan-900/30 midnight:hover:bg-cyan-900/20"
                  >
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-slate-600 dark:text-slate-300 midnight:text-cyan-100 sm:px-6">
                      {new Date(`${adj.date}T12:00:00`).toLocaleDateString('es-PE', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 font-medium text-cyan-700 dark:text-blue-400 midnight:text-cyan-400 sm:px-6">
                      {adj.projectName}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-400 line-through dark:text-slate-500 midnight:text-cyan-600 sm:px-6">
                      {adj.previousPeriod}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 font-semibold text-emerald-600 dark:text-emerald-400 midnight:text-emerald-300 sm:px-6">
                      {adj.nextPeriod}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300 midnight:text-cyan-200/90 sm:px-6">
                      {adj.reason}
                    </td>
                  </tr>
                ))}
                {!displayedAdjustments.length && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-xs text-slate-500 dark:text-slate-400 midnight:text-cyan-500/70">
                      No hay reajustes de cronograma registrados en este ejercicio.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
      {dialogOpen && canManage && <AdjustScheduleDialog data={data} initialProjectId={adjustingProjectId} onSubmit={saveSchedule} onClose={() => setDialogOpen(false)} />}
      {milestoneDialogOpen && canManage && <NewGlobalMilestoneDialog data={data} onSubmit={saveMilestone} onClose={() => setMilestoneDialogOpen(false)} />}
    </main>
  );
}
