import React, { useEffect, useState } from "react";
import { Cloud, FolderPlus } from "lucide-react";
import { useToast } from "../../context/ToastContext";
import { projectStatuses } from "../../constants/portfolio";
import { filterPortfolio } from "../../utils/portfolio";
import projectsApi from "../../services/projectsApi";
import Pagination from "../../components/common/Pagination";
import { cardClass } from "../../constants/themeClasses";
import ProjectDetail from "../projects/ProjectDetail";
import {
  ProjectCard,
  NewProjectDialog,
  EditProjectDialog,
  ConfirmDeleteDialog,
} from "./components";

export { NewProjectDialog, EditProjectDialog, ConfirmDeleteDialog, ProjectCard };

const PROJECTS_PER_PAGE = 6;
const CHANGES_PER_PAGE = 5;

const filters = [
  { id: "all", label: "Todos" },
  ...projectStatuses.map((status) => ({ id: status.id, label: status.label })),
];

export default function Portfolio({
  data,
  onChange,
  query = "",
  onQueryChange,
  canManage = false,
  isAdmin = false,
  currentUser = null,
  currentUserName = "",
}) {
  const [activeFilter, setActiveFilter] = useState("all");
  const [syncing, setSyncing] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [deletingProject, setDeletingProject] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  const [selectedDetailProject, setSelectedDetailProject] = useState(null);
  const { showToast } = useToast();
  const visible = filterPortfolio(data, query, activeFilter);
  const [projectPageSelection, setProjectPageSelection] = useState({ query: "", filter: "all", page: 1 });
  const [changePageSelection, setChangePageSelection] = useState({ query: "", page: 1 });

  const totalProjectPages = Math.max(1, Math.ceil(visible.projects.length / PROJECTS_PER_PAGE));
  const safeProjectPage =
    projectPageSelection.query === query && projectPageSelection.filter === activeFilter
      ? Math.min(projectPageSelection.page, totalProjectPages)
      : 1;
  const paginatedProjects = visible.projects.slice(
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
    try {
      const created = await projectsApi.createProject(draft);

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

      const makeInfo = created.make_notification;
      let makeMsg = "";
      if (makeInfo?.success) {
        makeMsg = " · Notificación enviada a Make.";
      } else if (makeInfo) {
        makeMsg = ` · Make: ${makeInfo.message || "No fue posible notificar"}`;
      }

      const newChange = {
        id: `change-${Date.now()}`,
        date: new Date().toISOString().split("T")[0],
        project: newProject.name,
        change: `Alta de nuevo proyecto${makeMsg}`,
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
      showToast({
        title: "¡Proyecto Creado con Éxito!",
        message: `El proyecto '${newProject.name}' (${newProject.code}) ha sido creado exitosamente.${makeMsg}`,
        type: "success",
      });
    } catch (err) {
      console.error("[Portfolio] Error al crear proyecto:", err);
      const msg =
        err.response?.data?.message ||
        (err.response?.data?.code &&
          `Código de proyecto: ${err.response.data.code[0]}`) ||
        (err.response?.data?.name &&
          `Nombre de proyecto: ${err.response.data.name[0]}`) ||
        err.message ||
        "Error de conexión con el servidor.";
      throw new Error(msg);
    }
  };

  // Actualización del proyecto conectado a DRF (PATCH) y Make
  const updateProject = async (projectId, draft) => {
    try {
      const updated = await projectsApi.updateProject(projectId, draft);

      const makeInfo = updated.make_notification;
      let makeMsg = "";
      if (makeInfo?.success) {
        makeMsg = " · Notificación enviada a Make.";
      } else if (makeInfo) {
        makeMsg = ` · Make: ${makeInfo.message || "No fue posible notificar"}`;
      }

      const newChange = {
        id: `change-${Date.now()}`,
        date: new Date().toISOString().split("T")[0],
        project: updated.name || draft.name,
        change: `Edición de proyecto${makeMsg}`,
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
      showToast({
        title: "¡Proyecto Actualizado!",
        message: `El proyecto '${updated.name || draft.name}' ha sido modificado exitosamente.${makeMsg}`,
        type: "success",
      });
    } catch (err) {
      console.error("[Portfolio] Error al actualizar proyecto:", err);
      const msg =
        err.response?.data?.message ||
        (err.response?.data?.name &&
          `Nombre de proyecto: ${err.response.data.name[0]}`) ||
        err.message ||
        "Error al guardar los cambios del proyecto.";
      throw new Error(msg);
    }
  };

  // Eliminación del proyecto conectado a DRF (DELETE) y Make
  const deleteProject = async (projectId) => {
    try {
      await projectsApi.deleteProject(projectId);
      const targetProject = (data.projects || []).find((p) => p.id === projectId);
      const projectName = targetProject ? targetProject.name : "Proyecto";

      const newChange = {
        id: `change-${Date.now()}`,
        date: new Date().toISOString().split("T")[0],
        project: projectName,
        change: "Eliminación permanente del proyecto",
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
      showToast({
        title: "Proyecto Eliminado",
        message: `El proyecto '${projectName}' ha sido eliminado exitosamente.`,
        type: "info",
      });
    } catch (err) {
      console.error("[Portfolio] Error al eliminar proyecto:", err);
      const msg =
        err.response?.data?.message ||
        err.message ||
        "Error al eliminar el proyecto.";
      throw new Error(msg);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
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
        showToast({
          title: "Proyectos Actualizados",
          message: "Los proyectos se han sincronizado exitosamente.",
          type: "info",
        });
      }
    } catch (err) {
      console.warn("[Portfolio] Error al sincronizar:", err);
      showToast({
        title: "Error de Sincronización",
        message: "No se pudo conectar con el servidor para sincronizar.",
        type: "error",
      });
    } finally {
      setSyncing(false);
    }
  };

  return (
    <main className="flex-1 overflow-y-auto bg-slate-50 p-4 text-slate-900 transition-colors duration-300 dark:bg-[#0d1117] dark:text-slate-100 midnight:bg-[#050B14] midnight:text-cyan-50 md:p-6 lg:p-8">
      <div className="mx-auto flex w-full max-w-[1500px] flex-col gap-6 pb-8">
        <section className="flex flex-col gap-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white midnight:text-cyan-50 md:text-[28px]">
                Repositorio de Proyectos
              </h1>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 midnight:text-cyan-500/70">
                Control presupuestal en tiempo real y supervisión financiera de obra
              </p>
            </div>
            {canManage && (
              <button
                type="button"
                onClick={() => setDialogOpen(true)}
                className="inline-flex w-fit items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors duration-300 hover:bg-blue-500 midnight:bg-cyan-600 midnight:hover:bg-cyan-500 shadow-sm"
              >
                <FolderPlus size={17} /> Crear Proyecto
              </button>
            )}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex max-w-full gap-2 overflow-x-auto pb-1">
              {filters.map((filter) => (
                <button
                  key={filter.id}
                  type="button"
                  onClick={() => setActiveFilter(filter.id)}
                  aria-pressed={activeFilter === filter.id}
                  className={`shrink-0 rounded-lg border px-4 py-2 text-xs font-medium transition-colors duration-300 ${activeFilter === filter.id ? "border-cyan-500 bg-cyan-50 text-cyan-800 dark:border-blue-500 dark:bg-blue-500/10 dark:text-blue-300 midnight:border-cyan-500 midnight:bg-cyan-500/15 midnight:text-cyan-300" : "border-slate-200 bg-white text-slate-500 hover:border-cyan-400/40 hover:text-slate-900 dark:border-[#30363d] dark:bg-[#161b22] dark:text-slate-400 dark:hover:text-white midnight:border-cyan-900/30 midnight:bg-[#0a1120] midnight:text-cyan-500/70 midnight:hover:text-cyan-50"}`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
            <div className="flex shrink-0 gap-3">
              {(query || activeFilter !== "all") && (
                <button
                  type="button"
                  onClick={() => {
                    setActiveFilter("all");
                    onQueryChange("");
                  }}
                  className="text-xs text-cyan-700 hover:text-cyan-600 dark:text-cyan-400 dark:hover:text-cyan-300 midnight:text-cyan-400 midnight:hover:text-cyan-200"
                >
                  Limpiar filtros
                </button>
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
                {syncing ? "Sincronizando..." : "Sincronizar"}
              </button>
            </div>
          </div>
        </section>

        <section aria-live="polite">
          {visible.projects.length ? (
            <>
              <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
                {paginatedProjects.map((project) => {
                const isProjectLeader = Boolean(
                  currentUser && (
                    (project.leaderEmail && currentUser.email && project.leaderEmail.toLowerCase() === currentUser.email.toLowerCase()) ||
                    (project.leaderId && (String(project.leaderId) === String(currentUser.id) || String(project.leaderId) === String(currentUser.db_id))) ||
                    (project.leaderName && currentUser.name && project.leaderName.toLowerCase() === currentUser.name.toLowerCase())
                  )
                );
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
                  />
                );
              })}
            </div>
            <Pagination
              currentPage={safeProjectPage}
              totalPages={totalProjectPages}
              totalItems={visible.projects.length}
              pageSize={PROJECTS_PER_PAGE}
              itemLabel="proyectos"
              onPageChange={(nextPage) => setProjectPageSelection({ query, filter: activeFilter, page: nextPage })}
              hideOnSinglePage={true}
              className="mt-6"
            />
          </>
        ) : (
            <div
              className={`${cardClass} p-10 text-center text-sm text-slate-500 midnight:text-cyan-500/70`}
            >
              No hay proyectos que coincidan con los filtros.
            </div>
          )}
        </section>

        <section className={`${cardClass} overflow-hidden p-5 md:p-6`}>
          <h2 className="text-base font-semibold text-slate-900 dark:text-white midnight:text-cyan-50">
            Historial de Cambios Reciente
          </h2>
          <p className="mt-1 text-[10px] text-slate-500 midnight:text-cyan-600">
            Altas de proyectos, notificaciones despachadas a Make y
            modificaciones presupuestales
          </p>
          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[820px] border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-[10px] text-slate-500 dark:border-[#30363d] midnight:border-cyan-900/30 midnight:text-cyan-600">
                  <th className="px-3 py-3 font-medium">Fecha</th>
                  <th className="px-3 py-3 font-medium">Proyecto</th>
                  <th className="px-3 py-3 font-medium">Cambio</th>
                  <th className="px-3 py-3 text-right font-medium">Usuario</th>
                </tr>
              </thead>
              <tbody>
                {paginatedChanges.map((change) => (
                  <tr
                    key={change.id}
                    className="border-b border-slate-200 last:border-0 dark:border-[#30363d] midnight:border-cyan-900/30"
                  >
                    <td className="whitespace-nowrap px-3 py-3 font-mono text-slate-600 dark:text-slate-300 midnight:text-cyan-100">
                      {new Date(`${change.date}T12:00:00`).toLocaleDateString(
                        "es-PE",
                        { day: "2-digit", month: "short", year: "numeric" },
                      )}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 font-medium text-cyan-700 dark:text-blue-400 midnight:text-cyan-400">
                      {change.project}
                    </td>
                    <td className="px-3 py-3 text-slate-500 dark:text-slate-400 midnight:text-cyan-500/70">
                      {change.change}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-right text-slate-600 dark:text-slate-300 midnight:text-cyan-100">
                      {change.user}
                    </td>
                  </tr>
                ))}
                {!visible.changes.length && (
                  <tr>
                    <td
                      colSpan={4}
                      className="py-10 text-center text-sm text-slate-500 midnight:text-cyan-500/70"
                    >
                      No hay cambios que coincidan con la búsqueda.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <Pagination
            currentPage={safeChangePage}
            totalPages={totalChangePages}
            totalItems={visible.changes.length}
            pageSize={CHANGES_PER_PAGE}
            itemLabel="cambios"
            onPageChange={(nextPage) => setChangePageSelection({ query, page: nextPage })}
            hideOnSinglePage={true}
            className="mt-4 border-t border-slate-200 pt-3 dark:border-[#30363d] midnight:border-cyan-900/30"
          />
        </section>
      </div>
      {dialogOpen && canManage && (
        <NewProjectDialog
          data={data}
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
    </main>
  );
}
