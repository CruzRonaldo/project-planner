import React, { useEffect, useMemo, useState } from "react";
import { Cloud, FolderPlus, ClipboardCheck, UserCheck } from "lucide-react";
import { useToast } from "../../context/ToastContext";
import { useLanguage } from "../../context/LanguageContext";
import { runSafe } from "../../utils/asyncHandler";
import { projectStatuses } from "../../constants/portfolio";
import { filterPortfolio, sortPortfolioProjects, portfolioSortCategories, isUserProject } from "../../utils/portfolio";
import projectsApi from "../../services/projectsApi";
import Pagination from "../../components/common/Pagination";
import {
  PageHeader,
  EmptyState,
  ClearFiltersButton,
  SortDropdown,
  Table,
  TableHead,
  TableRow,
} from "../../components/common";
import { cardClass } from "../../constants/themeClasses";
import ProjectDetail from "../projects/ProjectDetail";
import {
  ProjectCard,
  NewProjectDialog,
  EditProjectDialog,
  ConfirmDeleteDialog,
  PeriodicProjectAuditModal,
} from "./components";

export { NewProjectDialog, EditProjectDialog, ConfirmDeleteDialog, ProjectCard, PeriodicProjectAuditModal };

const PROJECTS_PER_PAGE = 6;
const CHANGES_PER_PAGE = 5;

function getMakeNotificationMessage(makeInfo, t) {
  if (!makeInfo) return '';
  if (makeInfo.success) {
    return ` · ${t('toasts.makeNotificationSent', 'Notificación enviada a Make.')}`;
  }
  const detail = makeInfo.message
    ? t(`toasts.${makeInfo.message}`, makeInfo.message)
    : t('toasts.makeCouldNotNotify', 'No fue posible notificar');
  return ` · Make: ${detail}`;
}

function formatChangeDescription(text, t) {
  if (!text || typeof text !== 'string') return text;
  return text
    .replace(/Alta de nuevo proyecto|New project registration/g, t('portfolio.changeProjectCreated', 'Alta de nuevo proyecto'))
    .replace(/Edición de proyecto|Project edit/g, t('portfolio.changeProjectUpdated', 'Edición de proyecto'))
    .replace(/Eliminación permanente del proyecto|Permanent project deletion/g, t('portfolio.changeProjectDeleted', 'Eliminación permanente del proyecto'))
    .replace(/Notificación enviada a Make\.|Notification dispatched to Make\./g, t('toasts.makeNotificationSent', 'Notificación enviada a Make.'))
    .replace(
      /No se ha configurado ninguna URL de webhook para Make\.|No webhook URL has been configured for Make\./g,
      t('toasts.No se ha configurado ninguna URL de webhook para Make.', 'No se ha configurado ninguna URL de webhook para Make.')
    );
}

export default function Portfolio({
  data,
  onChange,
  query = "",
  onQueryChange,
  canManage = false,
  isAdmin = false,
  currentUser = null,
  currentUserName = "",
  highlightedProjectId = null,
  onClearHighlight = null,
}) {
  const { t, lang } = useLanguage();
  const filters = useMemo(() => [
    { id: "all", label: t('portfolio.all', 'Todos') },
    ...projectStatuses.map((status) => ({
      id: status.id,
      label: t(`statuses.${status.id}`, status.label),
    })),
  ], [t]);
  const [activeFilter, setActiveFilter] = useState("all");
  const [syncing, setSyncing] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [deletingProject, setDeletingProject] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  const [selectedDetailProject, setSelectedDetailProject] = useState(null);
  const { showToast } = useToast();
  const [sortOrder, setSortOrder] = useState('budget_desc');
  const [onlyMyProjects, setOnlyMyProjects] = useState(false);

  const myProjectsCount = useMemo(() => {
    return (data?.projects || []).filter((p) => isUserProject(p, currentUser)).length;
  }, [data?.projects, currentUser]);

  const visible = filterPortfolio(data, query, activeFilter);
  const scopedProjects = useMemo(() => {
    if (!onlyMyProjects) return visible.projects;
    return visible.projects.filter((p) => isUserProject(p, currentUser));
  }, [visible.projects, onlyMyProjects, currentUser]);
  const sortedProjects = sortPortfolioProjects(scopedProjects, sortOrder);
  const [projectPageSelection, setProjectPageSelection] = useState({ query: "", filter: "all", scope: "all", sort: "budget_desc", page: 1 });
  const [changePageSelection, setChangePageSelection] = useState({ query: "", page: 1 });
  const [activeHighlightId, setActiveHighlightId] = useState(null);

  // Efecto reactivo para resaltado luminoso temporal y posicionamiento directo de proyecto
  useEffect(() => {
    if (!highlightedProjectId || !data?.projects?.length) return;

    const target = data.projects.find(
      (p) =>
        String(p.id) === String(highlightedProjectId) ||
        p.code === highlightedProjectId ||
        p.name === highlightedProjectId
    );
    if (!target) return;

    // Asegurar visibilidad: limpiar filtros restrictivos si ocultan el proyecto objetivo
    let nextFilter = activeFilter;
    if (activeFilter !== 'all' && target.status !== activeFilter) {
      nextFilter = 'all';
      setActiveFilter('all');
    }

    let nextScope = onlyMyProjects ? 'my' : 'all';
    if (onlyMyProjects && !isUserProject(target, currentUser)) {
      nextScope = 'all';
      setOnlyMyProjects(false);
    }

    let nextQuery = query;
    if (query) {
      const qNorm = (query || '').toLowerCase().trim();
      const matchesTarget =
        (target.name || '').toLowerCase().includes(qNorm) ||
        (target.code || '').toLowerCase().includes(qNorm);
      if (!matchesTarget) {
        nextQuery = '';
        if (onQueryChange) onQueryChange('');
      }
    }

    setActiveHighlightId(target.id);

    // Calcular la página correspondiente en la lista ordenada
    const allMatching = (data?.projects || []).filter((p) => {
      if (nextFilter !== 'all' && p.status !== nextFilter) return false;
      if (nextScope === 'my' && !isUserProject(p, currentUser)) return false;
      if (nextQuery) {
        const qNorm = nextQuery.toLowerCase().trim();
        return (
          (p.name || '').toLowerCase().includes(qNorm) ||
          (p.code || '').toLowerCase().includes(qNorm)
        );
      }
      return true;
    });
    const sorted = sortPortfolioProjects(allMatching, sortOrder);
    const targetIdx = sorted.findIndex((p) => p.id === target.id);
    if (targetIdx >= 0) {
      const targetPage = Math.floor(targetIdx / PROJECTS_PER_PAGE) + 1;
      setProjectPageSelection({
        query: nextQuery,
        filter: nextFilter,
        scope: nextScope,
        sort: sortOrder,
        page: targetPage,
      });
    }

    // Scroll suave hacia la tarjeta del proyecto con halo de resplandor
    const scrollTimer = setTimeout(() => {
      const cardEl =
        document.getElementById(`project-card-${target.id}`) ||
        document.getElementById(`project-card-${target.code}`) ||
        document.querySelector(`[data-project-code="${target.code}"]`);
      if (cardEl) {
        cardEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 150);

    // Apagar la luz luminosa suavemente tras un breve tiempo (2.0 segundos)
    const clearTimer = setTimeout(() => {
      setActiveHighlightId(null);
      if (onClearHighlight) onClearHighlight();
    }, 2000);

    return () => {
      clearTimeout(scrollTimer);
      clearTimeout(clearTimer);
    };
  }, [highlightedProjectId, data?.projects]);

  const totalProjectPages = Math.max(1, Math.ceil(sortedProjects.length / PROJECTS_PER_PAGE));
  const safeProjectPage =
    projectPageSelection.query === query &&
    projectPageSelection.filter === activeFilter &&
    projectPageSelection.scope === (onlyMyProjects ? 'my' : 'all') &&
    projectPageSelection.sort === sortOrder
      ? Math.min(projectPageSelection.page, totalProjectPages)
      : 1;
  const paginatedProjects = sortedProjects.slice(
    (safeProjectPage - 1) * PROJECTS_PER_PAGE,
    safeProjectPage * PROJECTS_PER_PAGE
  );

  const totalChangePages = Math.max(1, Math.ceil(visible.changes.length / CHANGES_PER_PAGE));
  const safeChangePage =
    changePageSelection.query === query
      ? Math.min(changePageSelection.page, totalChangePages)
      : 1;
  const paginatedChanges = visible.changes.slice(
    (safeChangePage - 1) * CHANGES_PER_PAGE,
    safeChangePage * CHANGES_PER_PAGE
  );

  // Sincronizar proyectos y colaboradores reales de la base de datos al montar
  useEffect(() => {
    let isMounted = true;
    const fetchBackendProjects = async () => {
      try {
        const [backendProjects, members] = await Promise.all([
          projectsApi.getProjects(),
          projectsApi.getTeamMembers().catch(() => []),
        ]);

        if (isMounted && Array.isArray(members) && members.length > 0) {
          setTeamMembers(members);
        }

        if (
          isMounted &&
          Array.isArray(backendProjects)
        ) {
          const mapped = backendProjects.map((bp) => ({
            id: bp.id,
            code: bp.code,
            name: bp.name,
            area: bp.area || "Edificaciones Comerciales",
            status: bp.status || "planning",
            progress: bp.progress ?? 0,
            usedBudget: bp.usedBudget ?? 0,
            totalBudget: bp.totalBudget || Number(bp.budget) || 0,
            startDate: bp.startDate || bp.start_date,
            endDate: bp.endDate || bp.end_date,
            leaderId: bp.leaderId || "carlos",
            leaderName: bp.leaderName || "",
            leaderEmail: bp.leaderEmail || "",
            driveFolder: "",
            description: bp.description || "",
            members: bp.members || ["PM"],
          }));

          onChange((currentData) => {
            const baseData =
              typeof currentData === "function"
                ? currentData(data)
                : currentData || data;
            return {
              ...baseData,
              projects: mapped,
            };
          });
        }
      } catch (err) {
        console.warn("[Portfolio] Usando datos locales de proyectos:", err);
      }
    };

    fetchBackendProjects();
    return () => {
      isMounted = false;
    };
  }, []);

  // Creación del proyecto conectado a DRF y Make
  const createProject = async (draft) => {
    const [created, error] = await runSafe(
      () => projectsApi.createProject(draft),
      {
        showToast,
        successTitle: t('toasts.projectCreatedTitle', '¡Proyecto Creado con Éxito!'),
        successMessage: (res) => {
          const makeMsg = getMakeNotificationMessage(res?.make_notification, t);
          const pName = res?.name || draft.name;
          const pCode = res?.code || draft.code;
          return t(
            'toasts.projectCreatedMessage',
            "El proyecto '{name}' ({code}) ha sido creado exitosamente.{makeMsg}",
            { name: pName, code: pCode, makeMsg }
          );
        },
        fallbackError: t('toasts.projectCreateError', 'Error de conexión con el servidor al crear el proyecto.'),
      }
    );

    if (error || !created) {
      throw new Error(error?.friendlyMessage || error?.message || "Error al procesar la creación del proyecto");
    }

    const makeMsg = getMakeNotificationMessage(created.make_notification, t);

    const newProject = {
      id: created.id || `project-${Date.now()}`,
      code: created.code || draft.code,
      name: created.name || draft.name,
      area: created.area || draft.area,
      status: created.status || draft.status,
      progress: created.progress ?? 0,
      usedBudget: created.usedBudget ?? 0,
      totalBudget: created.totalBudget || Number(draft.totalBudget),
      startDate: created.startDate || draft.startDate,
      endDate: created.endDate || draft.endDate,
      leaderId: draft.leaderId || "carlos",
      driveFolder: draft.driveFolder || "",
      description: created.description || draft.description,
      members: created.members || ["PM"],
    };

    const newChange = {
      id: `change-${Date.now()}`,
      date: new Date().toISOString().split("T")[0],
      project: newProject.name,
      change: `${t('portfolio.changeProjectCreated', 'Alta de nuevo proyecto')}${makeMsg}`,
      user: currentUserName || "Admin",
    };

    onChange((currentData) => {
      const base =
        typeof currentData === "function"
          ? currentData(data)
          : currentData || data;
      const currentProjects = base.projects || [];
      const currentChanges = base.changes || [];
      return {
        ...base,
        projects: [
          newProject,
          ...currentProjects.filter((p) => p.code !== newProject.code),
        ],
        changes: [newChange, ...currentChanges],
      };
    });

    setDialogOpen(false);
    setActiveFilter("all");
  };

  // Actualización del proyecto conectado a DRF (PATCH) y Make
  const updateProject = async (projectId, draft) => {
    const [updated, error] = await runSafe(
      () => projectsApi.updateProject(projectId, draft),
      {
        showToast,
        successTitle: t('toasts.projectUpdatedTitle', '¡Proyecto Actualizado!'),
        successMessage: (res) => {
          const makeMsg = getMakeNotificationMessage(res?.make_notification, t);
          return t(
            'toasts.projectUpdatedMessage',
            "El proyecto '{name}' ha sido modificado exitosamente.{makeMsg}",
            { name: res?.name || draft.name, makeMsg }
          );
        },
        fallbackError: t('toasts.projectUpdateError', 'Error al guardar los cambios del proyecto.'),
      }
    );

    if (error || !updated) {
      throw new Error(error?.friendlyMessage || error?.message || "Error al actualizar el proyecto.");
    }

    const makeMsg = getMakeNotificationMessage(updated.make_notification, t);

    const newChange = {
      id: `change-${Date.now()}`,
      date: new Date().toISOString().split("T")[0],
      project: updated.name || draft.name,
      change: `${t('portfolio.changeProjectUpdated', 'Edición de proyecto')}${makeMsg}`,
      user: currentUserName || "Admin",
    };

    onChange((currentData) => {
      const base =
        typeof currentData === "function"
          ? currentData(data)
          : currentData || data;
      const currentProjects = base.projects || [];
      const currentChanges = base.changes || [];
      return {
        ...base,
        projects: currentProjects.map((p) =>
          p.id === projectId || p.code === updated.code
            ? {
                ...p,
                name: updated.name || draft.name,
                area: updated.area || draft.area,
                status: updated.status || draft.status,
                totalBudget: updated.totalBudget || Number(draft.totalBudget),
                startDate: updated.startDate || draft.startDate,
                endDate: updated.endDate || draft.endDate,
                leaderId: draft.leaderId || p.leaderId,
                driveFolder: draft.driveFolder !== undefined ? draft.driveFolder : p.driveFolder,
                description: updated.description || draft.description,
              }
            : p
        ),
        changes: [newChange, ...currentChanges],
      };
    });

    setEditingProject(null);
  };

  // Eliminación del proyecto conectado a DRF (DELETE) y Make
  const deleteProject = async (projectId) => {
    const targetProject = (data.projects || []).find((p) => p.id === projectId);
    const projectName = targetProject ? targetProject.name : "Proyecto";

    const [, error] = await runSafe(
      () => projectsApi.deleteProject(projectId),
      {
        showToast,
        successTitle: t('toasts.projectDeletedTitle', 'Proyecto Eliminado'),
        successMessage: t('toasts.projectDeletedMessage', "El proyecto '{name}' ha sido eliminado exitosamente.", { name: projectName }),
        fallbackError: t('toasts.projectDeleteError', 'Error al eliminar el proyecto.'),
      }
    );

    if (error) {
      throw new Error(error?.friendlyMessage || error?.message || "Error al eliminar el proyecto.");
    }

    const newChange = {
      id: `change-${Date.now()}`,
      date: new Date().toISOString().split("T")[0],
      project: projectName,
      change: t('portfolio.changeProjectDeleted', 'Eliminación permanente del proyecto'),
      user: currentUserName || "Admin",
    };

    onChange((currentData) => {
      const base =
        typeof currentData === "function"
          ? currentData(data)
          : currentData || data;
      const currentProjects = base.projects || [];
      const currentChanges = base.changes || [];
      return {
        ...base,
        projects: currentProjects.filter((p) => p.id !== projectId),
        changes: [newChange, ...currentChanges],
      };
    });

    setDeletingProject(null);
  };

  const handleSync = async () => {
    await runSafe(
      async () => {
        const [backendProjects, members] = await Promise.all([
          projectsApi.getProjects(),
          projectsApi.getTeamMembers().catch(() => []),
        ]);

        if (Array.isArray(members) && members.length > 0) {
          setTeamMembers(members);
        }

        if (Array.isArray(backendProjects)) {
          const mapped = backendProjects.map((bp) => ({
            id: bp.id,
            code: bp.code,
            name: bp.name,
            area: bp.area || "Edificaciones Comerciales",
            status: bp.status || "planning",
            progress: bp.progress ?? 0,
            usedBudget: bp.usedBudget ?? 0,
            totalBudget: bp.totalBudget || Number(bp.budget) || 0,
            startDate: bp.startDate || bp.start_date,
            endDate: bp.endDate || bp.end_date,
            leaderId: bp.leaderId || "carlos",
            leaderName: bp.leaderName || "",
            leaderEmail: bp.leaderEmail || "",
            driveFolder: "",
            description: bp.description || "",
            members: bp.members || ["PM"],
          }));

          onChange((currentData) => {
            const base =
              typeof currentData === "function"
                ? currentData(data)
                : currentData || data;
            return {
              ...base,
              projects: mapped,
            };
          });
        }
      },
      {
        setLoading: setSyncing,
        showToast,
        successTitle: t('toasts.projectsSynced', "Proyectos Actualizados"),
        successMessage: t('toasts.projectsSyncedMsg', "Los proyectos se han sincronizado exitosamente."),
        fallbackError: t('toasts.syncErrorMsg', "No se pudo conectar con el servidor para sincronizar."),
      }
    );
  };

  return (
    <main className="flex-1 overflow-y-auto bg-slate-50 p-4 text-slate-900 transition-colors duration-300 dark:bg-[#0d1117] dark:text-slate-100 midnight:bg-[#050B14] midnight:text-cyan-50 md:p-6 lg:p-8">
      <div className="flex w-full flex-col gap-6 pb-8">
        <section className="flex flex-col gap-5">
          <PageHeader
            title={t("portfolio.title", "Repositorio de Proyectos")}
            subtitle={t("portfolio.subtitle", "Control presupuestal en tiempo real y supervisión financiera de obra")}
          >
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setIsAuditModalOpen(true)}
                className="inline-flex w-fit items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-700 transition-colors duration-300 hover:bg-slate-100 hover:text-slate-900 dark:border-[#30363d] dark:bg-[#161b22] dark:text-slate-300 dark:hover:bg-white/5 dark:hover:text-white midnight:border-cyan-800/40 midnight:bg-[#0a1120] midnight:text-cyan-200 midnight:hover:bg-cyan-900/40 shadow-sm"
              >
                <ClipboardCheck size={17} /> {t("portfolio.periodicAuditBtn", "Auditoría Periódica")}
              </button>
              {canManage && (
                <button
                  type="button"
                  onClick={() => setDialogOpen(true)}
                  className="inline-flex w-fit items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors duration-300 hover:bg-blue-500 midnight:bg-cyan-600 midnight:hover:bg-cyan-500 shadow-sm"
                >
                  <FolderPlus size={17} /> {t("portfolio.createProject", "Crear Proyecto")}
                </button>
              )}
            </div>
          </PageHeader>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Chip Conmutador de Ámbito: Mis Proyectos */}
              <button
                type="button"
                onClick={() => setOnlyMyProjects(!onlyMyProjects)}
                aria-pressed={onlyMyProjects}
                aria-label={t('portfolio.filterMyProjectsAria', 'Filtrar por mis proyectos asignados')}
                className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all duration-200 ${
                  onlyMyProjects
                    ? 'border-cyan-500 bg-cyan-500/10 text-cyan-700 shadow-sm dark:border-blue-500 dark:bg-blue-500/15 dark:text-blue-300 midnight:border-cyan-500 midnight:bg-cyan-500/20 midnight:text-cyan-200'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900 dark:border-[#30363d] dark:bg-[#161b22] dark:text-slate-400 dark:hover:border-slate-600 dark:hover:text-slate-200 midnight:border-cyan-900/40 midnight:bg-[#0a1120] midnight:text-cyan-400/80 midnight:hover:text-cyan-200'
                }`}
              >
                <UserCheck size={13} className={onlyMyProjects ? 'text-cyan-600 dark:text-blue-400 midnight:text-cyan-400' : 'opacity-70'} />
                <span>{t('portfolio.myProjectsScope', 'Mis proyectos')}</span>
                <span
                  className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                    onlyMyProjects
                      ? 'bg-cyan-600 text-white dark:bg-blue-600 midnight:bg-cyan-500'
                      : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 midnight:bg-cyan-950 midnight:text-cyan-300'
                  }`}
                >
                  {myProjectsCount}
                </span>
              </button>

              {/* Separador vertical sutil */}
              <div className="hidden h-5 w-px bg-slate-200 dark:bg-[#30363d] midnight:bg-cyan-900/40 sm:block" />

              {/* Píldoras de filtro por estado */}
              <div className="flex max-w-full gap-2 overflow-x-auto pb-1">
                {filters.map((filter) => (
                  <button
                    key={filter.id}
                    type="button"
                    onClick={() => setActiveFilter(filter.id)}
                    aria-pressed={activeFilter === filter.id}
                    className={`shrink-0 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors duration-200 ${
                      activeFilter === filter.id
                        ? 'border-cyan-500 bg-cyan-50 text-cyan-800 dark:border-blue-500 dark:bg-blue-500/10 dark:text-blue-300 midnight:border-cyan-500 midnight:bg-cyan-500/15 midnight:text-cyan-300'
                        : 'border-slate-200 bg-white text-slate-500 hover:border-cyan-400/40 hover:text-slate-900 dark:border-[#30363d] dark:bg-[#161b22] dark:text-slate-400 dark:hover:text-white midnight:border-cyan-900/30 midnight:bg-[#0a1120] midnight:text-cyan-500/70 midnight:hover:text-cyan-50'
                    }`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex flex-wrap items-center shrink-0 gap-3">
              <SortDropdown
                value={sortOrder}
                onChange={(nextSort) => {
                  setSortOrder(nextSort);
                  setProjectPageSelection((prev) => ({ ...prev, page: 1 }));
                }}
                categories={portfolioSortCategories}
                label="Ordenar:"
                buttonClassName="w-[225px]"
                ariaLabel={t("portfolio.sortLabel", "Ordenar proyectos del portafolio")}
              />
              {(query || activeFilter !== "all" || onlyMyProjects) && (
                <ClearFiltersButton
                  onClick={() => {
                    setActiveFilter("all");
                    setOnlyMyProjects(false);
                    onQueryChange("");
                  }}
                />
              )}
              <button
                type="button"
                onClick={handleSync}
                disabled={syncing}
                className="flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs text-slate-600 transition-colors duration-300 hover:border-cyan-400/40 hover:text-slate-900 disabled:cursor-wait disabled:opacity-70 dark:border-[#30363d] dark:bg-[#161b22] dark:text-slate-300 dark:hover:text-white midnight:border-cyan-800/40 midnight:bg-[#0a1120] midnight:text-cyan-200 midnight:hover:bg-cyan-900/30 midnight:hover:text-cyan-50"
              >
                <Cloud
                  size={14}
                  className={
                    syncing
                      ? "animate-pulse text-cyan-600 dark:text-blue-400 midnight:text-cyan-400"
                      : ""
                  }
                />
                {syncing ? t("portfolio.syncing", "Sincronizando...") : t("portfolio.sync", "Sincronizar")}
              </button>
            </div>
          </div>
        </section>

        <section aria-live="polite">
          {scopedProjects.length ? (
            <>
              <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
                {paginatedProjects.map((project) => {
                const isProjectLeader = isUserProject(project, currentUser);
                const canEditProject = isAdmin || canManage || isProjectLeader;
                const canDeleteProject = isAdmin;

                return (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    onEdit={canEditProject ? () => setEditingProject(project) : undefined}
                    onDelete={canDeleteProject ? () => setDeletingProject(project) : undefined}
                    onOpenMeetings={() => setSelectedDetailProject(project)}
                    canManage={canEditProject}
                    isAdmin={isAdmin}
                    isProjectLeader={isProjectLeader}
                    isHighlighted={String(activeHighlightId) === String(project.id) || activeHighlightId === project.code}
                  />
                );
              })}
            </div>
            <Pagination
              currentPage={safeProjectPage}
              totalPages={totalProjectPages}
              totalItems={scopedProjects.length}
              pageSize={PROJECTS_PER_PAGE}
              itemLabel={t('portfolio.projectsCountLabel', 'proyectos')}
              onPageChange={(nextPage) => setProjectPageSelection({ query, filter: activeFilter, scope: onlyMyProjects ? 'my' : 'all', sort: sortOrder, page: nextPage })}
              hideOnSinglePage={true}
              className="mt-6"
            />
          </>
        ) : onlyMyProjects ? (
          <EmptyState
            title={t('portfolio.noMyProjectsTitle', 'Sin proyectos asignados')}
            description={t('portfolio.noMyProjectsMsg', 'No tienes proyectos bajo tu liderazgo que coincidan con los filtros seleccionados.')}
            className={`${cardClass} p-10 text-sm`}
            action={
              <button
                type="button"
                onClick={() => {
                  setOnlyMyProjects(false);
                  setActiveFilter('all');
                }}
                className="rounded-lg bg-cyan-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-cyan-500 dark:bg-blue-600 dark:hover:bg-blue-500 midnight:bg-cyan-600 midnight:hover:bg-cyan-500"
              >
                {t('portfolio.viewAllProjects', 'Ver todos los proyectos')}
              </button>
            }
          />
        ) : (
            <EmptyState
              description={t("portfolio.noProjectsDesc", "No hay proyectos que coincidan con los filtros.")}
              className={`${cardClass} p-10 text-sm`}
            />
          )}
        </section>

        <section className={`${cardClass} overflow-hidden p-5 md:p-6`}>
          <h2 className="text-base font-semibold text-slate-900 dark:text-white midnight:text-cyan-50">
            {t("portfolio.recentChanges", "Historial de Cambios Reciente")}
          </h2>
          <p className="mt-1 text-[10px] text-slate-500 midnight:text-cyan-600">
            {t('portfolio.recentChangesSubtitle', 'Altas de proyectos, notificaciones despachadas a Make y modificaciones presupuestales')}
          </p>
          <div className="mt-5">
            <Table className="min-w-[820px] border-collapse">
              <TableHead
                columns={[
                  { label: t('portfolio.colDate', 'Fecha'), className: "px-3 py-3 font-medium" },
                  { label: t('portfolio.colProject', 'Proyecto'), className: "px-3 py-3 font-medium" },
                  { label: t('portfolio.colChange', 'Cambio'), className: "px-3 py-3 font-medium" },
                  { label: t('portfolio.colUser', 'Usuario'), align: "right", className: "px-3 py-3 font-medium" },
                ]}
              />
              <tbody>
                {paginatedChanges.map((change) => (
                  <TableRow
                    key={change.id}
                  >
                    <td className="whitespace-nowrap px-3 py-3 font-mono text-slate-600 dark:text-slate-300 midnight:text-cyan-100">
                      {new Date(`${change.date}T12:00:00`).toLocaleDateString(
                        lang === 'en' ? 'en-US' : 'es-PE',
                        { day: "2-digit", month: "short", year: "numeric" },
                      )}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 font-medium text-cyan-700 dark:text-blue-400 midnight:text-cyan-400">
                      {change.project}
                    </td>
                    <td className="px-3 py-3 text-slate-500 dark:text-slate-400 midnight:text-cyan-500/70">
                      {formatChangeDescription(change.change, t)}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-right text-slate-600 dark:text-slate-300 midnight:text-cyan-100">
                      {change.user}
                    </td>
                  </TableRow>
                ))}
                {!visible.changes.length && (
                  <TableRow>
                    <td
                      colSpan={4}
                      className="py-10 text-center text-sm text-slate-500 midnight:text-cyan-500/70"
                    >
                      {t('portfolio.noMatchingChanges', 'No hay cambios que coincidan con la búsqueda.')}
                    </td>
                  </TableRow>
                )}
              </tbody>
            </Table>
          </div>
          <Pagination
            currentPage={safeChangePage}
            totalPages={totalChangePages}
            totalItems={visible.changes.length}
            pageSize={CHANGES_PER_PAGE}
            itemLabel={t('portfolio.changesCountLabel', 'cambios')}
            onPageChange={(nextPage) => setChangePageSelection({ query, page: nextPage })}
            hideOnSinglePage={true}
            className="mt-4 border-t border-slate-200 pt-3 dark:border-[#30363d] midnight:border-cyan-900/30"
          />
        </section>
      </div>
      {dialogOpen && canManage && (
        <NewProjectDialog
          data={data}
          currentUser={currentUser}
          currentUserName={currentUserName}
          onSubmit={createProject}
          onClose={() => setDialogOpen(false)}
          teamMembers={teamMembers}
        />
      )}
      {editingProject && (
        <EditProjectDialog
          project={editingProject}
          onSubmit={updateProject}
          onClose={() => setEditingProject(null)}
          teamMembers={teamMembers}
          isAdmin={isAdmin}
          currentUser={currentUser}
          currentUserName={currentUserName}
        />
      )}
      {deletingProject && isAdmin && (
        <ConfirmDeleteDialog
          project={deletingProject}
          onConfirm={deleteProject}
          onClose={() => setDeletingProject(null)}
        />
      )}
      {selectedDetailProject && (
        <ProjectDetail
          project={selectedDetailProject}
          isOpen={Boolean(selectedDetailProject)}
          onClose={() => setSelectedDetailProject(null)}
          canManage={canManage}
          isAdmin={isAdmin}
          currentUser={currentUser}
        />
      )}
      <PeriodicProjectAuditModal
        isOpen={isAuditModalOpen}
        onClose={() => setIsAuditModalOpen(false)}
        currentUser={currentUser}
        onCreateProject={canManage ? () => {
          setIsAuditModalOpen(false);
          setDialogOpen(true);
        } : undefined}
      />
    </main>
  );
}
