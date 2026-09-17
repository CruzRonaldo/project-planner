import React, { useEffect, useState } from "react";
import {
  CalendarDays,
  Cloud,
  ExternalLink,
  FolderPlus,
  Pencil,
  Save,
  Trash2,
  X,
} from "lucide-react";
import { useToast } from "../../context/ToastContext";
import {
  createProjectCode,
  filterPortfolio,
  formatMoney,
  formatProjectTerm,
  getProjectDuration,
  projectAreas,
  projectLeaders,
  projectStatuses,
} from "../../mocks/portfolioData";
import projectsApi from "../../services/projectsApi";

const inputClass =
  "mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition-colors duration-300 placeholder:text-slate-400 focus:border-cyan-500 dark:border-[#30363d] dark:bg-[#0d1117] dark:text-white dark:placeholder:text-slate-600 dark:focus:border-cyan-400 midnight:border-cyan-800/40 midnight:bg-[#050B14] midnight:text-cyan-50 midnight:placeholder:text-cyan-800 midnight:focus:border-cyan-500";
const cardClass =
  "rounded-xl border border-slate-200 bg-white shadow-sm transition-colors duration-300 dark:border-[#30363d] dark:bg-[#161b22] midnight:border-cyan-900/30 midnight:bg-[#0a1120]";
const secondaryButtonClass =
  "rounded-lg border border-slate-300 px-4 py-2.5 text-xs text-slate-600 transition-colors duration-300 hover:bg-slate-50 dark:border-[#30363d] dark:text-slate-300 dark:hover:bg-white/5 midnight:border-cyan-800/40 midnight:text-cyan-200 midnight:hover:bg-cyan-900/20";
const filters = [
  { id: "all", label: "Todos" },
  ...projectStatuses.map((status) => ({ id: status.id, label: status.label })),
];

function statusDetails(status) {
  return (
    projectStatuses.find((item) => item.id === status) || {
      id: status,
      label: status,
      className:
        "bg-slate-100 text-slate-600 dark:bg-slate-500/15 dark:text-slate-300 midnight:bg-cyan-900/30 midnight:text-cyan-500/70",
      barClass: "bg-cyan-500",
    }
  );
}

function isoDate(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function ProjectCard({ project, onEdit, onDelete, canManage }) {
  const status = statusDetails(project.status);
  return (
    <article className={`${cardClass} p-5`}>
      <header className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="mb-1 text-[9px] font-semibold uppercase tracking-wider text-cyan-700 dark:text-blue-400 midnight:text-cyan-400">
            {project.code}
          </p>
          <h2 className="truncate text-base font-semibold text-slate-900 dark:text-white midnight:text-cyan-50">
            {project.name}
          </h2>
          <p className="mt-1 text-[10px] text-slate-500 midnight:text-cyan-600">
            {project.area}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span
            className={`rounded px-2 py-1 text-[10px] font-semibold ${status.className}`}
          >
            {status.label}
          </span>
          {canManage && onEdit && (
            <button
              type="button"
              onClick={() => onEdit(project)}
              aria-label={`Editar ${project.name}`}
              className="rounded-lg border border-slate-200 p-1.5 text-slate-400 transition-colors hover:border-cyan-400/50 hover:bg-cyan-50 hover:text-cyan-700 dark:border-[#30363d] dark:text-slate-400 dark:hover:bg-cyan-500/10 dark:hover:text-cyan-400 midnight:border-cyan-800/40 midnight:text-cyan-500/70 midnight:hover:bg-cyan-900/30 midnight:hover:text-cyan-300"
              title="Editar proyecto"
            >
              <Pencil size={13} />
            </button>
          )}
          {canManage && onDelete && (
            <button
              type="button"
              onClick={() => onDelete(project)}
              aria-label={`Eliminar ${project.name}`}
              className="rounded-lg border border-slate-200 p-1.5 text-slate-400 transition-colors hover:border-red-400/50 hover:bg-red-50 hover:text-red-600 dark:border-[#30363d] dark:text-slate-400 dark:hover:bg-red-500/10 dark:hover:text-red-400 midnight:border-cyan-800/40 midnight:text-cyan-500/70 midnight:hover:bg-red-900/30 midnight:hover:text-red-300"
              title="Eliminar proyecto"
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
      </header>
      <div className="mt-5">
        <div className="mb-2 flex justify-between text-[10px] text-slate-500 dark:text-slate-400 midnight:text-cyan-500/70">
          <span>Progreso General</span>
          <strong className="text-slate-800 dark:text-slate-200 midnight:text-cyan-100">
            {project.progress}%
          </strong>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-[#0d1117] midnight:bg-cyan-950">
          <div
            className={`h-full rounded-full ${status.barClass}`}
            style={{ width: `${project.progress}%` }}
          />
        </div>
      </div>
      <div className="mt-5 flex items-center justify-between border-b border-slate-200 pb-4 dark:border-[#30363d] midnight:border-cyan-900/30">
        <div>
          <p className="text-[10px] text-slate-500 midnight:text-cyan-600">
            Presupuesto Usado / Total
          </p>
          <p className="mt-1 text-xs font-semibold text-slate-800 dark:text-slate-200 midnight:text-cyan-100">
            {formatMoney(project.usedBudget)}{" "}
            <span className="px-1 text-slate-400 midnight:text-cyan-800">
              /
            </span>{" "}
            {formatMoney(project.totalBudget)}
          </p>
        </div>
        <div
          className="flex -space-x-2"
          aria-label={`${(project.members || []).length} integrantes`}
        >
          {(project.members || []).map((member, index) => (
            <span
              key={`${member}-${index}`}
              className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-gradient-to-br from-slate-400 to-slate-600 text-[8px] font-bold text-white dark:border-[#161b22] midnight:border-[#0a1120]"
            >
              {member}
            </span>
          ))}
        </div>
      </div>
      <footer className="mt-4 flex items-center justify-between gap-3 text-[10px] text-slate-500 midnight:text-cyan-600">
        <span
          className="truncate"
          title={formatProjectTerm(project.startDate, project.endDate)}
        >
          Plazo: {formatProjectTerm(project.startDate, project.endDate)}
        </span>
        {project.driveFolder ? (
          <a
            href={project.driveFolder}
            target="_blank"
            rel="noreferrer"
            aria-label={`Abrir carpeta de ${project.name}`}
            className="shrink-0 text-cyan-700 hover:text-cyan-600 dark:text-blue-400 dark:hover:text-blue-300 midnight:text-cyan-400 midnight:hover:text-cyan-200"
          >
            <ExternalLink size={14} />
          </a>
        ) : (
          <span className="shrink-0">Sin carpeta Drive</span>
        )}
      </footer>
    </article>
  );
}

export function NewProjectDialog({ data, currentUserName, onSubmit, onClose }) {
  const now = new Date();
  const end = new Date(now);
  end.setMonth(end.getMonth() + 6);
  const [draft, setDraft] = useState({
    code: createProjectCode(data, now.getFullYear()),
    area: projectAreas[0],
    name: "",
    startDate: isoDate(now),
    endDate: isoDate(end),
    totalBudget: "",
    status: "planning",
    leaderId: "carlos",
    driveFolder: "",
    description: "",
    createdBy: currentUserName,
  });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const changeField = (field) => (event) => {
    setDraft((current) => ({ ...current, [field]: event.target.value }));
    setError("");
  };
  const duration = getProjectDuration(draft.startDate, draft.endDate);

  useEffect(() => {
    const closeWithEscape = (event) => {
      if (event.key === "Escape" && !isSubmitting) onClose();
    };
    document.addEventListener("keydown", closeWithEscape);
    return () => document.removeEventListener("keydown", closeWithEscape);
  }, [onClose, isSubmitting]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");
    try {
      await onSubmit(draft);
    } catch (submitError) {
      setError(
        submitError.message || "Error al procesar la creación del proyecto",
      );
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="presentation"
      onMouseDown={() => !isSubmitting && onClose()}
      className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-900/40 p-3 backdrop-blur-sm transition-colors duration-300 dark:bg-black/75 midnight:bg-[#020617]/90 sm:p-5"
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-project-title"
        onMouseDown={(event) => event.stopPropagation()}
        className="max-h-[94vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-[0_25px_90px_rgba(15,23,42,0.18)] transition-colors duration-300 dark:border-[#30363d] dark:bg-[#161b22] dark:shadow-[0_25px_90px_rgba(0,0,0,0.65)] midnight:border-cyan-900/30 midnight:bg-[#0a1120]"
      >
        <header className="flex items-start justify-between gap-4 border-b border-slate-200 px-4 py-4 transition-colors duration-300 dark:border-[#30363d] midnight:border-cyan-900/30 sm:px-6">
          <div className="flex gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-cyan-200 bg-cyan-50 text-cyan-700 transition-colors duration-300 dark:border-blue-400/25 dark:bg-blue-500/15 dark:text-blue-400 midnight:border-cyan-800/40 midnight:bg-cyan-500/15 midnight:text-cyan-300">
              <FolderPlus size={21} />
            </span>
            <div>
              <h2
                id="new-project-title"
                className="text-lg font-bold text-slate-900 dark:text-white midnight:text-cyan-50"
              >
                Crear Nuevo Proyecto
              </h2>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 midnight:text-cyan-500/70">
                Define los parámetros maestros, cronograma y presupuesto de la obra.
              </p>
            </div>
          </div>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onClose}
            aria-label="Cerrar formulario"
            className="rounded-lg p-2 text-slate-500 transition-colors duration-300 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-white midnight:text-cyan-500/70 midnight:hover:bg-cyan-900/20 midnight:hover:text-cyan-50"
          >
            <X size={19} />
          </button>
        </header>
        <form onSubmit={handleSubmit} className="p-4 sm:p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-xs text-slate-500 dark:text-slate-300 midnight:text-cyan-500/70">
              Código del proyecto{" "}
              <span className="text-cyan-600 dark:text-cyan-400 midnight:text-cyan-400">
                *
              </span>
              <div className="relative">
                <input
                  readOnly
                  value={draft.code}
                  className={`${inputClass} pr-28 text-slate-500 dark:text-slate-400 midnight:text-cyan-600`}
                />
                <span className="absolute bottom-2.5 right-2 rounded bg-cyan-50 px-2 py-1 text-[9px] text-cyan-700 dark:bg-blue-500/15 dark:text-blue-300 midnight:bg-cyan-500/15 midnight:text-cyan-300">
                  Autogenerado
                </span>
              </div>
            </label>
            <label className="text-xs text-slate-500 dark:text-slate-300 midnight:text-cyan-500/70">
              Área técnica{" "}
              <span className="text-cyan-600 dark:text-cyan-400 midnight:text-cyan-400">
                *
              </span>
              <select
                required
                value={draft.area}
                onChange={changeField("area")}
                className={inputClass}
              >
                {projectAreas.map((area) => (
                  <option key={area}>{area}</option>
                ))}
              </select>
            </label>
            <label className="text-xs text-slate-500 dark:text-slate-300 midnight:text-cyan-500/70 sm:col-span-2">
              Nombre del proyecto{" "}
              <span className="text-cyan-600 dark:text-cyan-400 midnight:text-cyan-400">
                *
              </span>
              <input
                autoFocus
                required
                maxLength={120}
                value={draft.name}
                onChange={changeField("name")}
                placeholder="Torre Corporativa Platinum"
                className={inputClass}
              />
            </label>
            <label className="text-xs text-slate-500 dark:text-slate-300 midnight:text-cyan-500/70">
              Fecha de inicio{" "}
              <span className="text-cyan-600 dark:text-cyan-400 midnight:text-cyan-400">
                *
              </span>
              <input
                type="date"
                required
                value={draft.startDate}
                onChange={changeField("startDate")}
                className={inputClass}
              />
            </label>
            <label className="text-xs text-slate-500 dark:text-slate-300 midnight:text-cyan-500/70">
              Fecha final estimada{" "}
              <span className="text-cyan-600 dark:text-cyan-400 midnight:text-cyan-400">
                *
              </span>
              <input
                type="date"
                required
                value={draft.endDate}
                onChange={changeField("endDate")}
                className={inputClass}
              />
            </label>
            <p
              className={`-mt-2 flex items-center gap-1.5 text-[10px] sm:col-span-2 ${duration ? "text-cyan-700 dark:text-cyan-400 midnight:text-cyan-400" : "text-red-600 dark:text-red-400 midnight:text-red-300"}`}
            >
              <CalendarDays size={12} />{" "}
              {duration
                ? `Duración calculada: ${duration} ${duration === 1 ? "mes" : "meses"}`
                : "La fecha final debe ser posterior a la inicial."}
            </p>
            <label className="text-xs text-slate-500 dark:text-slate-300 midnight:text-cyan-500/70">
              Presupuesto estimado (USD){" "}
              <span className="text-cyan-600 dark:text-cyan-400 midnight:text-cyan-400">
                *
              </span>
              <input
                type="number"
                min="0"
                max="1000000000000"
                step="any"
                required
                value={draft.totalBudget}
                onKeyDown={(e) => {
                  // Bloquear explícitamente caracteres de notación científica (+, -, e, E)
                  if (["e", "E", "+", "-"].includes(e.key)) {
                    e.preventDefault();
                  }
                }}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === "" || /^\d*\.?\d*$/.test(val)) {
                    changeField("totalBudget")(e);
                  }
                }}
                onPaste={(e) => {
                  const paste = e.clipboardData.getData("text");
                  if (!/^\d*\.?\d*$/.test(paste)) {
                    e.preventDefault();
                  }
                }}
                placeholder="1500000"
                className={inputClass}
              />
            </label>
            <label className="text-xs text-slate-500 dark:text-slate-300 midnight:text-cyan-500/70">
              Estado inicial{" "}
              <span className="text-cyan-600 dark:text-cyan-400 midnight:text-cyan-400">
                *
              </span>
              <select
                required
                value={draft.status}
                onChange={changeField("status")}
                className={inputClass}
              >
                {projectStatuses
                  .filter((status) =>
                    ["planning", "active", "paused", "risk"].includes(status.id),
                  )
                  .map((status) => (
                    <option key={status.id} value={status.id}>
                      {status.label}
                    </option>
                  ))}
              </select>
            </label>
            <label className="text-xs text-slate-500 dark:text-slate-300 midnight:text-cyan-500/70">
              Líder de obra{" "}
              <span className="text-cyan-600 dark:text-cyan-400 midnight:text-cyan-400">
                *
              </span>
              <select
                required
                value={draft.leaderId}
                onChange={changeField("leaderId")}
                className={inputClass}
              >
                {projectLeaders.map((leader) => (
                  <option key={leader.id} value={leader.id}>
                    {leader.name} · {leader.role}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs text-slate-500 dark:text-slate-300 midnight:text-cyan-500/70">
              Carpeta de Google Drive
              <input
                type="url"
                maxLength={300}
                value={draft.driveFolder}
                onChange={changeField("driveFolder")}
                placeholder="https://drive.google.com/drive/folders/..."
                className={inputClass}
              />
            </label>
            <label className="text-xs text-slate-500 dark:text-slate-300 midnight:text-cyan-500/70 sm:col-span-2">
              Descripción / alcance
              <textarea
                rows="4"
                maxLength={1000}
                value={draft.description}
                onChange={changeField("description")}
                placeholder="Describe brevemente el alcance del proyecto..."
                className={`${inputClass} resize-y`}
              />
            </label>
          </div>
          {error && (
            <p
              role="alert"
              className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400 midnight:border-red-500/20 midnight:bg-red-500/10 midnight:text-red-300"
            >
              {error}
            </p>
          )}
          <footer className="mt-5 flex flex-col-reverse gap-3 border-t border-slate-200 pt-4 transition-colors duration-300 dark:border-[#30363d] midnight:border-cyan-900/30 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[10px] text-slate-500 midnight:text-cyan-600">
              * Campos requeridos para el alta y seguimiento del proyecto.
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={onClose}
                className={secondaryButtonClass}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white transition-colors duration-300 hover:bg-blue-500 disabled:opacity-50 midnight:bg-cyan-600 midnight:hover:bg-cyan-500"
              >
                {isSubmitting ? (
                  <>
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Creando proyecto...
                  </>
                ) : (
                  <>
                    <Save size={15} /> Crear Proyecto
                  </>
                )}
              </button>
            </div>
          </footer>
        </form>
      </section>
    </div>
  );
}

export function EditProjectDialog({ project, onSubmit, onClose }) {
  const [draft, setDraft] = useState({
    name: project.name || "",
    area: project.area || projectAreas[0],
    startDate: project.startDate || "",
    endDate: project.endDate || "",
    totalBudget: project.totalBudget ?? "",
    status: project.status || "planning",
    leaderId: project.leaderId || "carlos",
    driveFolder: project.driveFolder || "",
    description: project.description || "",
  });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const changeField = (field) => (event) => {
    setDraft((current) => ({ ...current, [field]: event.target.value }));
    setError("");
  };

  const handleBudgetChange = (event) => {
    const raw = event.target.value;
    const clean = raw.replace(/[^0-9.]/g, "");
    setDraft((current) => ({ ...current, totalBudget: clean }));
    setError("");
  };

  const handleKeyDownBudget = (e) => {
    if (["e", "E", "+", "-"].includes(e.key)) {
      e.preventDefault();
    }
  };

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    const numericBudget = Number(draft.totalBudget);
    if (!draft.totalBudget || isNaN(numericBudget) || numericBudget <= 0) {
      setError("El presupuesto total debe ser un monto mayor a 0.");
      return;
    }
    if (new Date(draft.endDate) < new Date(draft.startDate)) {
      setError("La fecha de entrega debe ser posterior a la fecha de inicio.");
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(project.id, {
        ...draft,
        totalBudget: numericBudget,
      });
    } catch (submitError) {
      setError(submitError.message);
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <section
        className={`w-full max-w-2xl overflow-hidden ${cardClass} border-cyan-400/40 shadow-2xl animate-in zoom-in-95 duration-200`}
      >
        <header className="flex items-center justify-between border-b border-slate-200 p-4 transition-colors duration-300 dark:border-[#30363d] midnight:border-cyan-900/30">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-50 text-cyan-600 dark:bg-cyan-500/10 dark:text-cyan-400 midnight:bg-cyan-500/20 midnight:text-cyan-300">
              <Pencil size={18} />
            </span>
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-white midnight:text-cyan-50">
                Editar Proyecto
              </h2>
              <p className="text-xs text-slate-500 midnight:text-cyan-600">
                Código: <span className="font-semibold text-cyan-600 dark:text-cyan-400">{project.code}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar ventana"
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-slate-300 midnight:text-cyan-600 midnight:hover:bg-cyan-900/40 midnight:hover:text-cyan-300"
          >
            <X size={18} />
          </button>
        </header>

        <form onSubmit={submit} className="p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-xs text-slate-500 dark:text-slate-300 midnight:text-cyan-500/70 sm:col-span-2">
              Nombre del proyecto{" "}
              <span className="text-cyan-600 dark:text-cyan-400 midnight:text-cyan-400">*</span>
              <input
                required
                maxLength={80}
                value={draft.name}
                onChange={changeField("name")}
                placeholder="Ej. Torre Mirador Fase 2"
                className={inputClass}
              />
            </label>

            <label className="text-xs text-slate-500 dark:text-slate-300 midnight:text-cyan-500/70">
              Área técnica{" "}
              <span className="text-cyan-600 dark:text-cyan-400 midnight:text-cyan-400">*</span>
              <select
                value={draft.area}
                onChange={changeField("area")}
                className={inputClass}
              >
                {projectAreas.map((area) => (
                  <option key={area} value={area}>
                    {area}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-xs text-slate-500 dark:text-slate-300 midnight:text-cyan-500/70">
              Presupuesto total (S/){" "}
              <span className="text-cyan-600 dark:text-cyan-400 midnight:text-cyan-400">*</span>
              <input
                type="number"
                min="0"
                step="any"
                required
                value={draft.totalBudget}
                onKeyDown={handleKeyDownBudget}
                onChange={handleBudgetChange}
                placeholder="Ej. 1500000"
                className={inputClass}
              />
            </label>

            <label className="text-xs text-slate-500 dark:text-slate-300 midnight:text-cyan-500/70">
              Fecha de inicio{" "}
              <span className="text-cyan-600 dark:text-cyan-400 midnight:text-cyan-400">*</span>
              <input
                type="date"
                required
                value={draft.startDate}
                onChange={changeField("startDate")}
                className={inputClass}
              />
            </label>

            <label className="text-xs text-slate-500 dark:text-slate-300 midnight:text-cyan-500/70">
              Fecha de entrega estimada{" "}
              <span className="text-cyan-600 dark:text-cyan-400 midnight:text-cyan-400">*</span>
              <input
                type="date"
                required
                value={draft.endDate}
                onChange={changeField("endDate")}
                className={inputClass}
              />
            </label>

            <label className="text-xs text-slate-500 dark:text-slate-300 midnight:text-cyan-500/70">
              Estado operativo{" "}
              <span className="text-cyan-600 dark:text-cyan-400 midnight:text-cyan-400">*</span>
              <select
                value={draft.status}
                onChange={changeField("status")}
                className={inputClass}
              >
                {projectStatuses.map((status) => (
                  <option key={status.id} value={status.id}>
                    {status.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-xs text-slate-500 dark:text-slate-300 midnight:text-cyan-500/70">
              Líder de obra{" "}
              <span className="text-cyan-600 dark:text-cyan-400 midnight:text-cyan-400">*</span>
              <select
                required
                value={draft.leaderId}
                onChange={changeField("leaderId")}
                className={inputClass}
              >
                {projectLeaders.map((leader) => (
                  <option key={leader.id} value={leader.id}>
                    {leader.name} · {leader.role}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-xs text-slate-500 dark:text-slate-300 midnight:text-cyan-500/70 sm:col-span-2">
              Carpeta de Google Drive
              <input
                type="url"
                maxLength={300}
                value={draft.driveFolder}
                onChange={changeField("driveFolder")}
                placeholder="https://drive.google.com/drive/folders/..."
                className={inputClass}
              />
            </label>

            <label className="text-xs text-slate-500 dark:text-slate-300 midnight:text-cyan-500/70 sm:col-span-2">
              Descripción / alcance
              <textarea
                rows="3"
                maxLength={1000}
                value={draft.description}
                onChange={changeField("description")}
                placeholder="Describe brevemente el alcance del proyecto..."
                className={`${inputClass} resize-y`}
              />
            </label>
          </div>

          {error && (
            <p
              role="alert"
              className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400 midnight:border-red-500/20 midnight:bg-red-500/10 midnight:text-red-300"
            >
              {error}
            </p>
          )}

          <footer className="mt-5 flex flex-col-reverse gap-3 border-t border-slate-200 pt-4 transition-colors duration-300 dark:border-[#30363d] midnight:border-cyan-900/30 sm:flex-row sm:items-center sm:justify-end">
            <div className="flex justify-end gap-2">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={onClose}
                className={secondaryButtonClass}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 rounded-lg bg-cyan-600 px-4 py-2.5 text-xs font-semibold text-white transition-colors duration-300 hover:bg-cyan-500 disabled:opacity-50 midnight:bg-cyan-600 midnight:hover:bg-cyan-500"
              >
                {isSubmitting ? (
                  <>
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save size={15} /> Guardar Cambios
                  </>
                )}
              </button>
            </div>
          </footer>
        </form>
      </section>
    </div>
  );
}

export function ConfirmDeleteDialog({ project, onConfirm, onClose }) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");

  const handleConfirm = async () => {
    setError("");
    setIsDeleting(true);
    try {
      await onConfirm(project.id);
    } catch (err) {
      setError(err.message || "Error al eliminar el proyecto.");
      setIsDeleting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <section
        className={`w-full max-w-md overflow-hidden ${cardClass} border-red-500/30 shadow-2xl animate-in zoom-in-95 duration-200`}
      >
        <header className="flex items-center justify-between border-b border-slate-200 p-4 dark:border-[#30363d] midnight:border-cyan-900/30">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400 midnight:bg-red-500/20 midnight:text-red-300">
              <Trash2 size={18} />
            </span>
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-white midnight:text-cyan-50">
                Confirmar Eliminación
              </h2>
              <p className="text-xs text-slate-500 midnight:text-cyan-600">
                {project.code}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar ventana"
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-slate-300 midnight:text-cyan-600 midnight:hover:bg-cyan-900/40 midnight:hover:text-cyan-300"
          >
            <X size={18} />
          </button>
        </header>

        <div className="p-5">
          <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300 midnight:text-cyan-200/80">
            ¿Estás seguro de que deseas eliminar permanentemente el proyecto{" "}
            <strong className="text-slate-900 dark:text-white midnight:text-cyan-50">
              {project.name}
            </strong>
            ?
          </p>
          <p className="mt-2 text-xs leading-relaxed text-amber-600 dark:text-amber-400 midnight:text-amber-300">
            ⚠️ Esta acción es irreversible y eliminará las tareas, hitos y datos asociados en el sistema.
          </p>

          {error && (
            <p
              role="alert"
              className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400 midnight:border-red-500/20 midnight:bg-red-500/10 midnight:text-red-300"
            >
              {error}
            </p>
          )}

          <footer className="mt-6 flex justify-end gap-2 border-t border-slate-200 pt-4 dark:border-[#30363d] midnight:border-cyan-900/30">
            <button
              type="button"
              disabled={isDeleting}
              onClick={onClose}
              className={secondaryButtonClass}
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={isDeleting}
              onClick={handleConfirm}
              className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-xs font-semibold text-white transition-colors duration-300 hover:bg-red-500 disabled:opacity-50"
            >
              {isDeleting ? (
                <>
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Eliminando...
                </>
              ) : (
                <>
                  <Trash2 size={14} /> Eliminar Proyecto
                </>
              )}
            </button>
          </footer>
        </div>
      </section>
    </div>
  );
}

export default function Portfolio({
  data,
  onChange,
  query = "",
  onQueryChange,
  canManage = false,
  currentUserName = "",
}) {
  const [activeFilter, setActiveFilter] = useState("all");
  const [syncing, setSyncing] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [deletingProject, setDeletingProject] = useState(null);
  const { showToast } = useToast();
  const visible = filterPortfolio(data, query, activeFilter);

  // Sincronizar proyectos reales de la base de datos MySQL al montar
  useEffect(() => {
    let isMounted = true;
    const fetchBackendProjects = async () => {
      try {
        const backendProjects = await projectsApi.getProjects();
        if (
          isMounted &&
          Array.isArray(backendProjects) &&
          backendProjects.length > 0
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
            leaderId: "carlos",
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
      const backendProjects = await projectsApi.getProjects();
      if (Array.isArray(backendProjects) && backendProjects.length > 0) {
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
          leaderId: "carlos",
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
                className="flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs text-slate-600 transition-colors duration-300 hover:border-cyan-400/40 hover:text-slate-900 disabled:cursor-wait disabled:opacity-70 dark:border-[#30363d] dark:bg-[#161b22] dark:text-slate-300 dark:hover:text-white midnight:border-cyan-800/40 midnight:bg-[#0a1120] midnight:text-cyan-200 midnight:hover:text-cyan-50"
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
            <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
              {visible.projects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onEdit={setEditingProject}
                  onDelete={setDeletingProject}
                  canManage={canManage}
                />
              ))}
            </div>
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
                {visible.changes.map((change) => (
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
        </section>
      </div>
      {dialogOpen && canManage && (
        <NewProjectDialog
          data={data}
          currentUserName={currentUserName}
          onSubmit={createProject}
          onClose={() => setDialogOpen(false)}
        />
      )}
      {editingProject && canManage && (
        <EditProjectDialog
          project={editingProject}
          onSubmit={updateProject}
          onClose={() => setEditingProject(null)}
        />
      )}
      {deletingProject && canManage && (
        <ConfirmDeleteDialog
          project={deletingProject}
          onConfirm={deleteProject}
          onClose={() => setDeletingProject(null)}
        />
      )}
    </main>
  );
}
