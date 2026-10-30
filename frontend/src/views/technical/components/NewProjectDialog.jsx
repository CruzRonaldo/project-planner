import React, { useEffect, useState } from "react";
import { CalendarDays, FolderPlus, Save } from "lucide-react";
import ModalDialog from "../../../components/common/ModalDialog";
import {
  projectAreas,
  projectLeaders,
  projectStatuses,
} from "../../../constants/portfolio";
import {
  createProjectCode,
  getProjectDuration,
} from "../../../utils/portfolio";
import { inputClass } from "../../../constants/themeClasses";

function isoDate(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export default function NewProjectDialog({
  data,
  currentUserName,
  onSubmit,
  onClose,
  teamMembers = [],
}) {
  const leadersList =
    teamMembers.length > 0
      ? teamMembers.map((m) => ({
          id: m.id,
          name: m.full_name,
          role: m.role_name,
        }))
      : projectLeaders;

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
    leaderId: leadersList[0]?.id || 1,
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

  const footnote = (
    <p className="text-[10px] text-slate-500 midnight:text-cyan-600">
      * Campos requeridos para el alta y seguimiento del proyecto.
    </p>
  );

  return (
    <ModalDialog
      isOpen={true}
      onClose={onClose}
      onSubmit={handleSubmit}
      title="Crear Nuevo Proyecto"
      subtitle="Define los parámetros maestros, cronograma y presupuesto de la obra."
      icon={<FolderPlus size={21} />}
      submitLabel="Crear Proyecto"
      submitIcon={<Save size={15} />}
      cancelLabel="Cancelar"
      isSubmitting={isSubmitting}
      submitButtonClass="bg-blue-600 hover:bg-blue-500 midnight:bg-cyan-600 midnight:hover:bg-cyan-500"
      footnote={footnote}
      maxWidth="max-w-3xl"
      id="new-project"
    >
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
            {leadersList.map((leader) => (
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
    </ModalDialog>
  );
}

export { NewProjectDialog };
