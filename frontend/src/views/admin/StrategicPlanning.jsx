import React, { useMemo, useState, useEffect } from 'react';
import { FileDown, MoreVertical, Plus, SlidersHorizontal, Trash2 } from 'lucide-react';
import {
  GanttScheduleSection,
  ScheduleAdjustmentsSection,
  AdjustScheduleDialog,
  NewGlobalMilestoneDialog,
} from './components';
import Select from '../../components/common/Select';
import Pagination from '../../components/common/Pagination';
import PageHeader from '../../components/common/PageHeader';
import SortDropdown from '../../components/common/SortDropdown';
import { getYearOptions } from '../../utils/format';
import { useToast } from '../../context/ToastContext';
import { useLanguage } from '../../context/LanguageContext';
import { runSafe } from '../../utils/asyncHandler';
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
  milestoneSortCategories,
  milestoneSortOptionsMap,
} from '../../constants/strategicPlanning';
import {
  adjustProjectSchedule,
  createGlobalMilestone,
  formatMilestoneDate,
  sortMilestones,
} from '../../utils/strategicPlanning';
import { getBarGeometry, legacyMonthRangeToDates } from '../../utils/gantt';
import { createStrategicPlanningData } from '../../mocks/strategicPlanningData';
import TimelineAnalysisDialog from './TimelineAnalysisDialog';
import projectsApi from '../../services/projectsApi';

export { AdjustScheduleDialog, NewGlobalMilestoneDialog };

const headingClass = 'text-slate-900 transition-colors duration-300 dark:text-white midnight:text-cyan-50';
const mutedClass = 'text-slate-500 transition-colors duration-300 dark:text-slate-400 midnight:text-cyan-500/70';

const getAreaBarColorClass = (areaName = '') => {
  const normalized = areaName.toLowerCase();
  if (normalized.includes('estruct') || normalized.includes('civil')) {
    return 'bg-sky-500 dark:bg-sky-400';
  }
  if (normalized.includes('arqui')) {
    return 'bg-emerald-500 dark:bg-emerald-400';
  }
  if (normalized.includes('sistem')) {
    return 'bg-indigo-500 dark:bg-indigo-400';
  }
  return 'bg-cyan-500 dark:bg-cyan-400';
};

const getAreaBadgeColorClass = (areaName = '') => {
  const normalized = areaName.toLowerCase();
  if (normalized.includes('estruct') || normalized.includes('civil')) {
    return 'bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300 midnight:bg-cyan-950 midnight:text-cyan-400';
  }
  if (normalized.includes('arqui')) {
    return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 midnight:bg-emerald-950 midnight:text-emerald-400';
  }
  if (normalized.includes('sistem')) {
    return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300 midnight:bg-indigo-950 midnight:text-indigo-400';
  }
  return 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300 midnight:bg-cyan-950 midnight:text-cyan-400';
};

export default function StrategicPlanning({ data = createStrategicPlanningData(), onChange = () => {}, canManage = false, initialYear = null }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [milestoneDialogOpen, setMilestoneDialogOpen] = useState(false);
  const [analysisOpen, setAnalysisOpen] = useState(false);
  const [adjustingProjectId, setAdjustingProjectId] = useState(null);
  const [selectedProjectFilter, setSelectedProjectFilter] = useState('ALL');
  const [selectedYear, setSelectedYear] = useState(() => initialYear ? String(initialYear) : String(new Date().getFullYear()));
  const [milestonePage, setMilestonePage] = useState(1);
  const { showToast } = useToast();
  const { t } = useLanguage();
  const localizedMonths = useMemo(
    () => planningMonths.map((m) => t(`months.${m.number}`, m.short)),
    [t]
  );
  const projects = useMemo(() => data?.projects || [], [data]);
  const milestones = useMemo(() => data?.milestones ?? [], [data]);
  const adjustments = useMemo(() => data?.adjustments || [], [data]);

  const activeProject = useMemo(() => {
    if (selectedProjectFilter === 'ALL') return null;
    return projects.find((p) => String(p.id) === String(selectedProjectFilter)) || null;
  }, [projects, selectedProjectFilter]);

  const displayedProjects = useMemo(() => {
    const year = Number(selectedYear) || new Date().getFullYear();
    const windowStart = `${year}-01-01`;

    return projects.filter((p) => {
      if (activeProject && String(p.id) !== String(activeProject.id)) {
        return false;
      }

      const sDate = p.startDate || p.start_date;
      const eDate = p.endDate || p.end_date;
      let dates = { startDate: sDate, endDate: eDate };
      if (!dates.startDate || !dates.endDate) {
        dates = legacyMonthRangeToDates(p.start, p.duration, year);
      }

      const geom = getBarGeometry({
        startDate: dates.startDate,
        endDate: dates.endDate,
        windowStart,
        windowMonths: 12,
      });

      return geom !== null;
    });
  }, [projects, activeProject, selectedYear]);

  const [ganttPage, setGanttPage] = useState(1);
  const GANTT_PAGE_SIZE = 8;
  const totalGanttPages = Math.max(1, Math.ceil(displayedProjects.length / GANTT_PAGE_SIZE));
  const currentGanttPage = Math.min(ganttPage, totalGanttPages);
  const paginatedGanttProjects = useMemo(() => {
    return displayedProjects.slice(
      (currentGanttPage - 1) * GANTT_PAGE_SIZE,
      currentGanttPage * GANTT_PAGE_SIZE
    );
  }, [displayedProjects, currentGanttPage]);

  // Al cambiar filtros o año, reiniciar la página del Gantt
  useEffect(() => {
    setGanttPage(1);
  }, [selectedYear, selectedProjectFilter]);

  const filteredMilestones = useMemo(() => {
    if (!activeProject) return milestones;
    return milestones.filter(
      (m) =>
        String(m.projectId) === String(activeProject.id) ||
        String(m.project) === String(activeProject.id)
    );
  }, [milestones, activeProject]);

  const [milestoneSortOrder, setMilestoneSortOrder] = useState('date-asc');

  const sortedMilestones = useMemo(() => {
    return sortMilestones(filteredMilestones, milestoneSortOrder);
  }, [filteredMilestones, milestoneSortOrder]);

  const milestonePageSize = 7;
  const totalMilestonePages = Math.max(1, Math.ceil(sortedMilestones.length / milestonePageSize));
  const currentMilestonePage = Math.min(milestonePage, totalMilestonePages);
  const visibleMilestones = useMemo(() => {
    return sortedMilestones.slice(
      (currentMilestonePage - 1) * milestonePageSize,
      currentMilestonePage * milestonePageSize
    );
  }, [sortedMilestones, currentMilestonePage, milestonePageSize]);

  const displayedAdjustments = useMemo(() => {
    if (!activeProject) return adjustments;
    return adjustments.filter(
      (adj) =>
        String(adj.projectId) === String(activeProject.id) ||
        String(adj.projectId) === String(activeProject.code)
    );
  }, [adjustments, activeProject]);

  const [adjustmentPage, setAdjustmentPage] = useState(1);
  const adjustmentPageSize = 5;
  const totalAdjustmentPages = Math.max(1, Math.ceil(displayedAdjustments.length / adjustmentPageSize));
  const currentAdjustmentPage = Math.min(adjustmentPage, totalAdjustmentPages);
  const paginatedAdjustments = useMemo(() => {
    return displayedAdjustments.slice(
      (currentAdjustmentPage - 1) * adjustmentPageSize,
      currentAdjustmentPage * adjustmentPageSize
    );
  }, [displayedAdjustments, currentAdjustmentPage]);

  const targetProjectsForBudget = activeProject ? [activeProject] : displayedProjects;

  const { totalBudget, executedBudget, availableBudget, executedPct, availablePct } = useMemo(() => {
    const total = targetProjectsForBudget.reduce(
      (acc, p) => acc + (Number(p.totalBudget) || Number(p.budget) || 0),
      0
    );
    const executed = targetProjectsForBudget.reduce(
      (acc, p) => acc + (Number(p.usedBudget) || 0),
      0
    );
    const available = Math.max(0, total - executed);
    const execPct = total > 0 ? Math.min(100, Math.round((executed / total) * 100)) : 0;
    const availPct = total > 0 ? Math.max(0, 100 - execPct) : 0;
    return {
      totalBudget: total,
      executedBudget: executed,
      availableBudget: available,
      executedPct: execPct,
      availablePct: availPct,
    };
  }, [targetProjectsForBudget]);

  const areaDistribution = useMemo(() => {
    const map = {};
    targetProjectsForBudget.forEach((p) => {
      let rawArea = p.area || 'Civil';
      if (rawArea === 'Edificaciones Comerciales') {
        rawArea = 'Civil';
      }
      if (!map[rawArea]) {
        map[rawArea] = { name: rawArea, budget: 0, count: 0 };
      }
      map[rawArea].budget += Number(p.totalBudget) || Number(p.budget) || 0;
      map[rawArea].count += 1;
    });

    return Object.values(map)
      .map((item) => ({
        ...item,
        percentage: totalBudget > 0 ? Math.round((item.budget / totalBudget) * 100) : 0,
      }))
      .sort((a, b) => b.budget - a.budget);
  }, [targetProjectsForBudget, totalBudget]);

  const portfolioSummary = useMemo(() => {
    const count = targetProjectsForBudget.length;
    const avgBudget = count > 0 ? totalBudget / count : 0;
    return { count, avgBudget };
  }, [targetProjectsForBudget, totalBudget]);

  const projectSelectOptions = useMemo(() => [
    { value: 'ALL', label: `${t('strategicPlanning.allProjects', 'Todos los proyectos')} (${projects.length})` },
    ...projects.map((p) => ({
      value: p.id,
      label: `${p.code ? `${p.code} · ` : ''}${p.name}`,
    })),
  ], [projects, t]);

  const formatBudget = (amount) => {
    if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`;
    if (amount >= 1_000) return `$${(amount / 1_000).toFixed(0)}K`;
    return `$${Number(amount || 0).toLocaleString()}`;
  };

  const saveSchedule = async (draft) => {
    const updated = adjustProjectSchedule(data, draft);
    if (updated === data) {
      setDialogOpen(false);
      showToast({
        title: t('strategicPlanning.projectSchedule', 'Calendario de Proyecto'),
        message: t('strategicPlanning.noChangesToSave', 'No había cambios que guardar.'),
        type: 'info',
      });
      return;
    }

    const updatedProject = updated.projects.find((p) => String(p.id) === String(draft.projectId));
    const previousProject = projects.find((p) => String(p.id) === String(draft.projectId));

    const isBackendProject =
      typeof draft.projectId === 'number' ||
      (!isNaN(Number(draft.projectId)) && String(Number(draft.projectId)) === String(draft.projectId));

    let auditSaved = true;

    if (isBackendProject && updatedProject) {
      const [, error] = await runSafe(
        async () => {
          await projectsApi.updateProject(draft.projectId, {
            start_date: updatedProject.startDate,
            end_date: updatedProject.endDate,
            duration_months: updatedProject.duration,
          });

          if (projectsApi.createScheduleAdjustment) {
            try {
              const createdAdj = await projectsApi.createScheduleAdjustment({
                project: Number(draft.projectId),
                previousPeriod: previousProject?.period || '',
                nextPeriod: updatedProject.period,
                reason: draft.reason,
              });
              if (createdAdj?.id && updated.adjustments?.length > 0) {
                updated.adjustments[0].id = createdAdj.id;
              }
            } catch (adjErr) {
              console.warn('Reajuste de fecha aplicado pero falló el registro en auditoría remota:', adjErr);
              auditSaved = false;
            }
          }
        },
        {
          showToast,
          fallbackError: t('strategicPlanning.syncErrorMsg', 'No se pudo guardar el nuevo cronograma en el servidor. Inténtalo nuevamente.'),
          errorTitle: t('toasts.Error de Sincronización', 'Error de Sincronización'),
        }
      );

      if (error) {
        return;
      }
    }

    onChange(updated);
    setDialogOpen(false);

    showToast({
      title: t('strategicPlanning.projectSchedule', 'Calendario de Proyecto'),
      message: auditSaved
        ? t('strategicPlanning.scheduleUpdatedAudit', 'Calendario actualizado y registrado en el historial de auditoría.')
        : t('strategicPlanning.scheduleSavedAuditFailed', 'Cronograma guardado en el servidor, pero no se pudo registrar el reajuste en el historial.'),
      type: auditSaved ? 'success' : 'warning',
    });
  };

  const saveMilestone = async (draft) => {
    setMilestonePage(1);
    const targetProject = projects.find((p) => String(p.id) === String(draft.projectId));
    const projectLabel = targetProject ? ` para el proyecto '${targetProject.name}'` : '';
    const updated = createGlobalMilestone(data, draft);

    await runSafe(
      async () => {
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
      },
      {
        showToast,
        successTitle: 'Hito Creado',
        successMessage: `Hito “${updated.milestones[0].title}” registrado${projectLabel} en el calendario global.`,
        fallbackError: 'No se pudo guardar el hito en el servidor.',
      }
    );

    onChange(updated);
    setMilestoneDialogOpen(false);
  };

  const handleStatusChange = async (milestoneId, newStatus) => {
    const currentMilestone = (data?.milestones || []).find((m) => String(m.id) === String(milestoneId));
    const statusLabel = milestoneStatuses.find((s) => s.id === newStatus)?.label || newStatus;
    const titleLabel = currentMilestone ? ` “${currentMilestone.title}”` : '';
    const msg = `Estado del hito${titleLabel} actualizado a “${statusLabel}”.`;

    await runSafe(
      async () => {
        if (typeof milestoneId === 'number' || (!isNaN(Number(milestoneId)) && String(Number(milestoneId)) === String(milestoneId))) {
          await projectsApi.updateMilestone(milestoneId, { status: newStatus });
        }
      },
      {
        showToast,
        successTitle: 'Hito Actualizado',
        successMessage: msg,
        fallbackError: 'No se pudo actualizar el estado del hito en el servidor.',
      }
    );

    const updatedMilestones = (data?.milestones || []).map((m) =>
      String(m.id) === String(milestoneId) ? { ...m, status: newStatus } : m
    );
    onChange({ ...data, milestones: updatedMilestones });
  };

  const handleDeleteMilestone = async (milestoneId, title) => {
    const milestoneToDelete = (data?.milestones || []).find((m) => String(m.id) === String(milestoneId));
    const associatedProject = projects.find((p) => String(p.id) === String(milestoneToDelete?.projectId));
    const projectLabel = associatedProject ? ` del proyecto '${associatedProject.name}'` : '';
    const msg = `Hito “${title}”${projectLabel} eliminado.`;

    await runSafe(
      async () => {
        if (typeof milestoneId === 'number' || (!isNaN(Number(milestoneId)) && String(Number(milestoneId)) === String(milestoneId))) {
          await projectsApi.deleteMilestone(milestoneId);
        }
      },
      {
        showToast,
        successTitle: 'Hito Eliminado',
        successMessage: msg,
        fallbackError: 'No se pudo eliminar el hito en el servidor.',
      }
    );

    const updated = {
      ...data,
      milestones: (data?.milestones || []).filter((m) => String(m.id) !== String(milestoneId)),
    };
    onChange(updated);
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
      title: t('strategicPlanning.calendarExport', 'Exportación de Calendario'),
      message: t('strategicPlanning.pdfExportOpened', `Vista de exportación abierta para guardar o imprimir “${fileName}.pdf”.`, { fileName }),
      type: 'info',
    });
  };

  return (
    <main className="min-w-0 flex-1 overflow-y-auto bg-slate-50 p-4 text-slate-900 transition-colors duration-300 dark:bg-[#0d1117] dark:text-slate-100 midnight:bg-[#050B14] midnight:text-cyan-50 md:p-6 lg:p-8 print:bg-white print:p-0 print:overflow-visible">
      <div className="flex w-full flex-col gap-6 pb-8 print:max-w-none print:gap-4 print:pb-0">
        
        {/* ENCABEZADO FORMAL PARA EXPORTACIÓN A PDF */}
        <header className="print-header hidden print:block mb-4 border-b-2 border-slate-800 pb-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold tracking-widest text-blue-700 uppercase">PROJECT PLANNER</span>
                <span className="text-slate-300">|</span>
                <span className="text-xs text-slate-500 font-medium">{t('strategicPlanning.systemSubtitle', 'Sistema de Planificación Estratégica')}</span>
              </div>
              <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
                {activeProject
                  ? t('strategicPlanning.printProjectCalendar', `Calendario de Proyecto ${selectedYear} — ${activeProject.code ? `${activeProject.code} · ` : ''}${activeProject.name}`, {
                      year: selectedYear,
                      code: activeProject.code ? `${activeProject.code} · ` : '',
                      name: activeProject.name,
                    })
                  : t('strategicPlanning.printMasterCalendar', `Calendario Maestro de Proyectos ${selectedYear}`, { year: selectedYear })}
              </h1>
              <p className="mt-0.5 text-xs text-slate-600">
                {activeProject
                  ? t('strategicPlanning.printProjectSubtitle', `Cronograma de Ruta Crítica, Hitos Clave y Control Presupuestario (${activeProject.area})`, { area: activeProject.area })
                  : t('strategicPlanning.printMasterSubtitle', 'Cronograma Anual de Ruta Crítica, Hitos Clave y Asignación Presupuestaria')}
              </p>
            </div>
            <div className="text-right text-xs text-slate-500">
              <p><span className="font-semibold text-slate-700">{t('strategicPlanning.issueDate', 'Fecha de Emisión:')}</span> {new Date().toLocaleDateString('es-PE', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
              <p className="mt-0.5 text-[10px] text-slate-400">
                {activeProject
                  ? `${t('strategicPlanning.project', 'Proyecto')}: ${activeProject.code || activeProject.name} · ${t('strategicPlanning.associatedMilestones', 'Hitos Asociados:')} ${filteredMilestones.length}`
                  : `${t('strategicPlanning.totalProjects', 'Total Proyectos:')} ${projects.length} · ${t('strategicPlanning.totalMilestones', 'Total Hitos:')} ${milestones.length}`}
              </p>
            </div>
          </div>
        </header>

        {/* ENCABEZADO INTERACTIVO EN PANTALLA */}
        <section className="flex flex-col gap-4 no-print print:hidden">
          <PageHeader
            title={t('strategicPlanning.masterScheduleTitle', `Calendario Maestro ${selectedYear}`, { year: selectedYear })}
            subtitle={t('strategicPlanning.masterScheduleSubtitle', 'Planificación de ruta crítica y cronograma de infraestructura anual')}
          >
            {canManage && (
              <div className="flex flex-wrap items-center gap-2">
                <button type="button" onClick={() => { setAdjustingProjectId(null); setDialogOpen(true); }} className={secondaryButtonClass}>
                  <SlidersHorizontal size={15} /> {t('strategicPlanning.adjustSchedule', 'Ajustar Calendario')}
                </button>
                <button type="button" onClick={() => setAnalysisOpen(true)} className={secondaryButtonClass}>
                  <SlidersHorizontal size={15} /> {t('strategicPlanning.analyzeTimelines', 'Analizar tiempos')}
                </button>
                <button type="button" onClick={exportToPdf} className={secondaryButtonClass}>
                  <FileDown size={15} /> {t('strategicPlanning.exportPdf', 'Exportar Gantt / PDF')}
                </button>
                <button type="button" onClick={() => { setMilestoneDialogOpen(true); }} className={primaryBtnClass}>
                  <Plus size={15} /> {t('strategicPlanning.newGlobalMilestone', 'Nuevo Hito Global')}
                </button>
              </div>
            )}
          </PageHeader>

          {/* BARRA DE FILTROS SUPERIOR (PROYECTO Y AÑO) */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200/80 pt-3 dark:border-white/5 midnight:border-cyan-900/30">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className={`text-xs font-medium ${mutedClass}`}>{t('strategicPlanning.scheduleFilters', 'Filtros del cronograma:')}</span>
              
              {/* SELECTOR DE PROYECTO */}
              <Select
                value={selectedProjectFilter}
                onChange={(e) => {
                  setSelectedProjectFilter(e.target.value);
                  setMilestonePage(1);
                  setAdjustmentPage(1);
                  setGanttPage(1);
                }}
                aria-label={t('strategicPlanning.filterByProject', 'Filtrar por proyecto')}
                className="max-w-[220px] truncate"
                options={projectSelectOptions}
              />

              {/* SELECTOR DE AÑO */}
              <Select
                value={selectedYear}
                onChange={(e) => {
                  setSelectedYear(e.target.value);
                  setGanttPage(1);
                }}
                aria-label={t('strategicPlanning.selectYear', 'Seleccionar año')}
                options={getYearOptions(
                  1,
                  3,
                  (data.projects || []).map((p) => (p.startDate ? new Date(p.startDate).getFullYear() : null)).filter(Number.isFinite)
                ).map((opt) => ({
                  value: opt.value,
                  label: `${t('common.year', 'Año')} ${opt.value}`,
                }))}
              />
            </div>


          </div>
        </section>

        {/* CONTENEDOR DEL GANTT */}
        <GanttScheduleSection
          displayedProjects={paginatedGanttProjects}
          selectedYear={selectedYear}
          months={localizedMonths}
          milestones={milestones}
          canManage={canManage}
          headingClass={headingClass}
          mutedClass={mutedClass}
          cardClass={cardClass}
          onAdjustProject={(id) => {
            setAdjustingProjectId(id);
            setDialogOpen(true);
          }}
          onMilestoneClick={(m) => {
            showToast({
              title: m.title,
              message: `${formatMilestoneDate(m.targetDate)} · Estado: ${m.status}`,
              type: 'info',
            });
          }}
          formatMilestoneDate={formatMilestoneDate}
        />

        {/* PAGINACIÓN DEL CRONOGRAMA MAESTRO (GANTT) */}
        {displayedProjects.length > GANTT_PAGE_SIZE && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-[#161b22] midnight:bg-[#0a1120] border border-slate-200 dark:border-white/10 midnight:border-cyan-900/30 rounded-xl px-4 py-3 shadow-xs">
            <span className="text-xs text-slate-500 dark:text-slate-400 midnight:text-cyan-600 font-medium">
              {t('strategicPlanning.ganttPaginationSummary', 'Mostrando {from}-{to} de {total} proyectos en el cronograma', {
                from: (currentGanttPage - 1) * GANTT_PAGE_SIZE + 1,
                to: Math.min(currentGanttPage * GANTT_PAGE_SIZE, displayedProjects.length),
                total: displayedProjects.length,
              })}
            </span>
            <Pagination
              currentPage={currentGanttPage}
              totalPages={totalGanttPages}
              totalItems={displayedProjects.length}
              pageSize={GANTT_PAGE_SIZE}
              itemLabel={t('portfolio.projectsCountLabel', 'proyectos')}
              onPageChange={setGanttPage}
              hideOnSinglePage={true}
            />
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
          
          {/* HITOS GLOBALES: Aquí devolvemos el padding de p-5 md:p-6 */}
          <section className={`${cardClass} p-5 md:p-6 xl:col-span-3 flex flex-col justify-between print:border print:border-slate-300 print:shadow-none print:bg-white avoid-break`}>
            <div className="flex-1 flex flex-col">
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className={`text-base font-semibold ${headingClass}`}>{t('strategicPlanning.globalMilestones', 'Hitos Globales')}</h2>
                  <p className={`text-xs ${mutedClass} hidden print:block`}>
                    {selectedProjectFilter === 'ALL'
                      ? t('strategicPlanning.showingAllProjects', 'Mostrando todos los proyectos')
                      : t('strategicPlanning.filteredBy', `Filtrado por: ${projects.find((p) => String(p.id) === String(selectedProjectFilter))?.name || selectedProjectFilter}`, { project: projects.find((p) => String(p.id) === String(selectedProjectFilter))?.name || selectedProjectFilter })}
                  </p>
                </div>

                {/* CONTROLES DE ORDENAMIENTO E INDICADOR DE PROYECTO ACTIVO */}
                <div className="flex flex-wrap items-center gap-2.5 no-print print:hidden">
                  <SortDropdown
                    value={milestoneSortOrder}
                    onChange={(nextSort) => {
                      setMilestoneSortOrder(nextSort);
                      setMilestonePage(1);
                    }}
                    categories={milestoneSortCategories}
                    optionsMap={milestoneSortOptionsMap}
                    label={t('strategicPlanning.sort', 'Ordenar:')}
                    buttonClassName="w-[225px]"
                    ariaLabel={t('strategicPlanning.sortGlobalMilestones', 'Ordenar hitos globales')}
                  />

                  {activeProject ? (
                    <span className="shrink-0 rounded bg-blue-50 px-2.5 py-1 font-mono text-[10px] font-medium text-blue-700 dark:bg-blue-500/10 dark:text-blue-300 midnight:bg-cyan-950 midnight:text-cyan-400">
                      {activeProject.code ? `${activeProject.code} · ` : ''}{activeProject.name}
                    </span>
                  ) : (
                    <span className={`text-xs ${mutedClass}`}>
                      {filteredMilestones.length} {filteredMilestones.length === 1 ? t('strategicPlanning.milestoneRegistered', 'hito registrado') : t('strategicPlanning.milestonesRegistered', 'hitos registrados')}
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-2.5">
                {filteredMilestones.length === 0 ? (
                  <div className={`p-6 text-center text-xs text-slate-500 dark:text-slate-400 midnight:text-cyan-500/70 ${nestedClass}`}>
                    {selectedProjectFilter === 'ALL'
                      ? t('strategicPlanning.noMilestones', 'No hay hitos globales registrados.')
                      : t('strategicPlanning.noMilestonesForProject', 'No hay hitos registrados para el proyecto seleccionado.')}
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
                          <article key={milestone.id} className={`flex items-center justify-between gap-4 p-2.5 sm:p-3 ${nestedClass} print:bg-white print:border-slate-200`} title={milestone.description}>
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
                                  aria-label={t('strategicPlanning.changeMilestoneStatus', `Cambiar estado de ${milestone.title}`, { title: milestone.title })}
                                  title={t('strategicPlanning.changeMilestoneStatusTitle', 'Cambiar estado del hito')}
                                  className={`cursor-pointer rounded border border-transparent px-2 py-1 text-[10px] font-semibold transition-colors duration-300 outline-none ${status.badge} hover:border-slate-300 dark:hover:border-slate-600 no-print print:hidden`}
                                >
                                  {milestoneStatuses.map((s) => (
                                    <option key={s.id} value={s.id} className="bg-white text-slate-900 dark:bg-[#161b22] dark:text-white midnight:bg-[#0a1120] midnight:text-cyan-50">
                                      {t(`statuses.${s.id}`, s.label)}
                                    </option>
                                  ))}
                                </select>
                                <span className={`hidden print:inline-block shrink-0 rounded px-2 py-1 text-[10px] font-semibold ${status.badge}`}>
                                  {t(`statuses.${status.id}`, status.label)}
                                </span>
                              </>
                            ) : (
                              <span className={`shrink-0 rounded px-2 py-1 text-[10px] font-semibold transition-colors duration-300 ${status.badge}`}>
                                {t(`statuses.${status.id}`, status.label)}
                              </span>
                            )}
                            {canManage && (
                              <button
                                type="button"
                                onClick={() => handleDeleteMilestone(milestone.id, milestone.title)}
                                aria-label={t('strategicPlanning.deleteMilestone', `Eliminar hito ${milestone.title}`, { title: milestone.title })}
                                title={t('strategicPlanning.deleteMilestoneTitle', 'Eliminar hito')}
                                className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10 dark:hover:text-red-400 midnight:hover:bg-red-500/10 midnight:hover:text-red-400 no-print print:hidden"
                              >
                                <Trash2 size={13} />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => showToast({
                                title: milestone.title,
                                message: `${milestone.description || t('strategicPlanning.noDescription', 'Sin descripción adicional.')} (${t('strategicPlanning.responsible', 'Responsable')}: ${milestone.validator || 'PM'})`,
                                type: 'info',
                              })}
                              aria-label={t('strategicPlanning.viewMilestoneDetails', `Ver detalles de ${milestone.title}`, { title: milestone.title })}
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
                    {sortedMilestones.map((milestone) => {
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
                              {t(`statuses.${status.id}`, status.label)}
                            </span>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
            </div>

            <Pagination
              currentPage={currentMilestonePage}
              totalPages={totalMilestonePages}
              totalItems={sortedMilestones.length}
              pageSize={milestonePageSize}
              itemLabel={t('strategicPlanning.milestonesItemLabel', 'hitos')}
              onPageChange={setMilestonePage}
              hideOnSinglePage={true}
              className="mt-4 border-t border-slate-200/80 pt-3 dark:border-white/5 midnight:border-cyan-900/30"
            />
          </section>

          {/* CONTROL PRESUPUESTARIO */}
          <section className={`${cardClass} p-5 md:p-6 xl:col-span-2 flex flex-col justify-between print:border print:border-slate-300 print:shadow-none print:bg-white avoid-break`}>
            <div className="flex-1 flex flex-col">
              <div className="flex items-center justify-between">
                <h2 className={`text-base font-semibold ${headingClass}`}>{t('strategicPlanning.budgetControl', 'Control Presupuestario')}</h2>
                {activeProject && (
                  <span className="shrink-0 rounded bg-blue-50 px-2 py-0.5 font-mono text-[10px] font-medium text-blue-700 dark:bg-blue-500/10 dark:text-blue-300 midnight:bg-cyan-950 midnight:text-cyan-400">
                    {activeProject.code || activeProject.name}
                  </span>
                )}
              </div>

              <div className="flex justify-center py-5">
                <div
                  className="flex h-44 w-44 items-center justify-center rounded-full transition-colors duration-300"
                  style={{
                    background:
                      totalBudget > 0
                        ? `conic-gradient(#3978c6 0 ${availablePct}%, #10b981 ${availablePct}% 100%)`
                        : 'conic-gradient(#64748b 0% 100%, #64748b 100% 100%)',
                  }}
                >
                  <div className="flex h-[116px] w-[116px] flex-col items-center justify-center rounded-full bg-white transition-colors duration-300 dark:bg-[#161b22] midnight:bg-[#0a1120]">
                    <strong className={`text-2xl ${headingClass}`}>{formatBudget(totalBudget)}</strong>
                    <span className={`mt-1 text-xs ${mutedClass}`}>
                      {totalBudget > 0 ? t('strategicPlanning.budget', 'Presupuesto') : t('strategicPlanning.unassigned', 'Sin asignar')}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 border-b border-slate-200 pb-5 text-[10px] text-slate-500 transition-colors duration-300 dark:border-white/10 dark:text-slate-400 midnight:border-cyan-900/30 midnight:text-cyan-600">
                <span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-sm bg-[#3978c6]" /> {t('strategicPlanning.available', 'Disponible')} ({availablePct}%)</span>
                <span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-sm bg-emerald-500" /> {t('strategicPlanning.executed', 'Ejecutado')} ({executedPct}%)</span>
              </div>

              <div className="mt-5 grid grid-cols-3 gap-3">
                <div>
                  <p className={`text-[10px] ${mutedClass}`}>{t('strategicPlanning.total', 'Total')}</p>
                  <strong className={`mt-1 block text-sm ${headingClass}`}>{formatBudget(totalBudget)}</strong>
                </div>
                <div>
                  <p className={`text-[10px] ${mutedClass}`}>{t('strategicPlanning.executed', 'Ejecutado')}</p>
                  <strong className="mt-1 block text-sm text-emerald-600 transition-colors duration-300 dark:text-emerald-400 midnight:text-emerald-300">{formatBudget(executedBudget)}</strong>
                </div>
                <div>
                  <p className={`text-[10px] ${mutedClass}`}>{t('strategicPlanning.available', 'Disponible')}</p>
                  <strong className="mt-1 block text-sm text-blue-600 transition-colors duration-300 dark:text-blue-400 midnight:text-blue-400">{formatBudget(availableBudget)}</strong>
                </div>
              </div>

              {/* SEPARADOR LIMPIO */}
              <div className="my-4 border-t border-slate-200 transition-colors duration-300 dark:border-white/10 midnight:border-cyan-900/30" />

              {/* SUPERVISIÓN POR ÁREA TÉCNICA */}
              <div>
                <div className="mb-3">
                  <h3 className={`text-xs font-semibold ${headingClass}`}>
                    {t('strategicPlanning.technicalAreaDistribution', 'Distribución por Área Técnica')}
                  </h3>
                  <p className={`text-[10px] ${mutedClass}`}>
                    {t('strategicPlanning.areaDistributionSubtitle', 'Supervisión de capital por especialidad técnica')}
                  </p>
                </div>

                {activeProject ? (
                  /* DETALLE DEL PROYECTO SELECCIONADO */
                  <div className={`p-3 space-y-2.5 ${nestedClass}`}>
                    <div className="flex items-center justify-between">
                      <span className={`text-[11px] font-medium ${mutedClass}`}>
                        {t('strategicPlanning.discipline', 'Especialidad')}
                      </span>
                      <span className={`rounded px-2 py-0.5 text-[10px] font-semibold ${getAreaBadgeColorClass(activeProject.area || 'Civil')}`}>
                        {activeProject.area || 'Civil'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className={`text-[11px] font-medium ${mutedClass}`}>
                        {t('strategicPlanning.duration', 'Duración')}
                      </span>
                      <span className={`text-xs font-semibold ${headingClass}`}>
                        {activeProject.duration_months || 1} {t('strategicPlanning.months', 'meses')}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className={`text-[11px] font-medium ${mutedClass}`}>
                        {t('strategicPlanning.progress', 'Avance')}
                      </span>
                      <span className={`text-xs font-semibold ${headingClass}`}>
                        {activeProject.progress || 0}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className={`text-[11px] font-medium ${mutedClass}`}>
                        {t('strategicPlanning.executionRate', 'Tasa de Ejecución')}
                      </span>
                      <span className="text-xs font-semibold text-emerald-600 transition-colors duration-300 dark:text-emerald-400 midnight:text-emerald-300">
                        {executedPct}%
                      </span>
                    </div>
                  </div>
                ) : (
                  /* BARRAS POR ÁREA EN VISTA GENERAL */
                  <div className="space-y-3">
                    {areaDistribution.map((item) => (
                      <div key={item.name} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className={`font-medium ${headingClass}`}>
                            {item.name}{' '}
                            <span className={`font-normal text-[10px] ${mutedClass}`}>
                              ({item.count} {t('strategicPlanning.projectsCountLabel', 'prjs')})
                            </span>
                          </span>
                          <span className={`font-mono text-[11px] ${mutedClass}`}>
                            {item.percentage}% · {formatBudget(item.budget)}
                          </span>
                        </div>
                        <div className="h-2 w-full rounded-full overflow-hidden bg-slate-100 transition-colors duration-300 dark:bg-slate-800 midnight:bg-cyan-950">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${getAreaBarColorClass(item.name)}`}
                            style={{ width: `${item.percentage}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* MÉTRICAS GENERALES DE CARTERA */}
            <div className="mt-4 grid grid-cols-2 gap-2.5">
              <div className={`p-2.5 ${nestedClass}`}>
                <p className={`text-[10px] ${mutedClass}`}>
                  {t('strategicPlanning.avgBudgetPerProject', 'Presupuesto Promedio')}
                </p>
                <strong className={`mt-0.5 block text-xs font-semibold ${headingClass}`}>
                  {formatBudget(portfolioSummary.avgBudget)}
                </strong>
              </div>
              <div className={`p-2.5 ${nestedClass}`}>
                <p className={`text-[10px] ${mutedClass}`}>
                  {t('strategicPlanning.activePortfolioCount', 'Iniciativas en Cartera')}
                </p>
                <strong className={`mt-0.5 block text-xs font-semibold ${headingClass}`}>
                  {portfolioSummary.count}
                </strong>
              </div>
            </div>
          </section>
        </div>

        {/* HISTORIAL DE AUDITORÍA Y REAJUSTES DE CRONOGRAMA */}
        <ScheduleAdjustmentsSection
          displayedAdjustments={displayedAdjustments}
          paginatedAdjustments={paginatedAdjustments}
          currentPage={currentAdjustmentPage}
          totalPages={totalAdjustmentPages}
          pageSize={adjustmentPageSize}
          onPageChange={setAdjustmentPage}
          cardClass={cardClass}
          headingClass={headingClass}
          mutedClass={mutedClass}
        />
      </div>
      {dialogOpen && canManage && <AdjustScheduleDialog data={data} initialProjectId={adjustingProjectId} onSubmit={saveSchedule} onClose={() => setDialogOpen(false)} />}
      {milestoneDialogOpen && canManage && <NewGlobalMilestoneDialog data={data} onSubmit={saveMilestone} onClose={() => setMilestoneDialogOpen(false)} />}
      {analysisOpen && canManage && <TimelineAnalysisDialog projects={projects} initialProjectId={activeProject?.id} onClose={() => setAnalysisOpen(false)} />}
    </main>
  );
}
