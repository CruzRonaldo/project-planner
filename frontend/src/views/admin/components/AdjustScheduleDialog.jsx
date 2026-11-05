import React, { useState } from 'react';
import { Check, Minus, Plus, SlidersHorizontal } from 'lucide-react';
import ModalDialog from '../../../components/common/ModalDialog';
import InlineAlert from '../../../components/common/InlineAlert';
import { runSafe } from '../../../utils/asyncHandler';
import {
  inputClass,
  labelClass,
  nestedClass,
} from '../../../constants/themeClasses';
import {
  planningMonths,
  scheduleAdjustmentReasons,
} from '../../../constants/strategicPlanning';
import { formatPlanningPeriod } from '../../../utils/strategicPlanning';

const headingClass =
  'text-slate-900 transition-colors duration-300 dark:text-white midnight:text-cyan-50';
const mutedClass =
  'text-slate-500 transition-colors duration-300 dark:text-slate-400 midnight:text-cyan-500/70';

const months = planningMonths.map((month) => month.short);

/**
 * Modal interactivo para reprogramar el calendario de un proyecto
 * con selector de mes, controles de duración (+/-), simulación en tiempo real
 * del diagrama de Gantt e historial de auditoría técnica.
 *
 * @param {Object} props
 * @param {Object} props.data - Datos de planificación estratégica (data.projects)
 * @param {string|number} [props.initialProjectId] - Proyecto preseleccionado
 * @param {Function} props.onSubmit - Callback con los datos del ajuste: ({ projectId, start, duration, reason }) => Promise<void> | void
 * @param {Function} props.onClose - Cierra el diálogo
 */
export default function AdjustScheduleDialog({ data, initialProjectId, onSubmit, onClose }) {
  const initialProject =
    data.projects.find((project) => String(project.id) === String(initialProjectId)) ??
    data.projects[1] ??
    data.projects[0];

  const [draft, setDraft] = useState({
    projectId: initialProject?.id ?? '',
    start: initialProject?.start ?? 1,
    duration: initialProject?.duration ?? 1,
    reason: scheduleAdjustmentReasons[0],
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const selectedProject = data.projects.find((project) => String(project.id) === String(draft.projectId));
  const start = Number(draft.start);
  const duration = Number(draft.duration);
  const maxDuration = Math.max(1, 13 - start);
  const previewPeriod = formatPlanningPeriod(start, duration);

  const selectProject = (event) => {
    const project = data.projects.find((item) => String(item.id) === String(event.target.value));
    if (project) {
      setDraft((current) => ({
        ...current,
        projectId: project.id,
        start: project.start ?? 1,
        duration: project.duration ?? 1,
      }));
    }
    setError('');
  };

  const selectStart = (event) => {
    const nextStart = Number(event.target.value);
    setDraft((current) => ({
      ...current,
      start: nextStart,
      duration: Math.min(Number(current.duration), 13 - nextStart),
    }));
    setError('');
  };

  const changeDuration = (amount) => {
    setDraft((current) => ({
      ...current,
      duration: Math.max(1, Math.min(13 - Number(current.start), Number(current.duration) + amount)),
    }));
    setError('');
  };

  const handleSubmit = async () => {
    if (saving) return;
    setError('');
    await runSafe(
      () => onSubmit(draft),
      {
        setLoading: setSaving,
        onError: (_err, message) => setError(message),
      }
    );
  };

  return (
    <ModalDialog
      isOpen
      onClose={onClose}
      onSubmit={handleSubmit}
      isSubmitting={saving}
      title="Ajustar Calendario de Proyecto"
      subtitle="Modifica la ventana de meses y plazos en el diagrama de Gantt."
      icon={<SlidersHorizontal size={20} />}
      submitLabel="Guardar ajustes"
      submitIcon={<Check size={15} />}
      id="adjust-schedule"
      maxWidth="max-w-2xl"
    >
      <fieldset disabled={saving} className="space-y-4">
        <label className={`block ${labelClass}`}>
          Proyecto a reprogramar <span className="text-red-500 dark:text-red-400 midnight:text-red-400">*</span>
          <select autoFocus required value={draft.projectId} onChange={selectProject} className={inputClass}>
            {data.projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name} — {project.area}
              </option>
            ))}
          </select>
        </label>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className={labelClass}>
            Mes de inicio <span className="text-red-500 dark:text-red-400 midnight:text-red-400">*</span>
            <select required value={draft.start} onChange={selectStart} className={inputClass}>
              {planningMonths.map((month) => (
                <option key={month.number} value={month.number}>
                  {month.label}
                </option>
              ))}
            </select>
          </label>

          <fieldset>
            <legend className={labelClass}>
              Duración total <span className="text-red-500 dark:text-red-400 midnight:text-red-400">*</span>
            </legend>
            <div className={`mt-2 flex h-11 items-center justify-between gap-2 overflow-hidden px-1 ${nestedClass}`}>
              <button
                type="button"
                onClick={() => changeDuration(-1)}
                disabled={duration <= 1}
                aria-label="Reducir duración"
                className="flex h-full w-10 items-center justify-center rounded text-slate-500 hover:bg-slate-200 hover:text-slate-900 disabled:opacity-30 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-white midnight:text-cyan-500/70 midnight:hover:bg-cyan-900/30 midnight:hover:text-cyan-50"
              >
                <Minus size={15} />
              </button>
              <output className={`flex items-center justify-center text-sm font-semibold ${headingClass}`}>
                {duration} {duration === 1 ? 'Mes' : 'Meses'}{' '}
                <span className={`ml-1 text-[10px] font-normal ${mutedClass}`}>
                  ({previewPeriod.split(' (')[0]})
                </span>
              </output>
              <button
                type="button"
                onClick={() => changeDuration(1)}
                disabled={duration >= maxDuration}
                aria-label="Aumentar duración"
                className="flex h-full w-10 items-center justify-center rounded text-slate-500 hover:bg-slate-200 hover:text-slate-900 disabled:opacity-30 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-white midnight:text-cyan-500/70 midnight:hover:bg-cyan-900/30 midnight:hover:text-cyan-50"
              >
                <Plus size={15} />
              </button>
            </div>
          </fieldset>
        </div>

        {/* Vista previa interactiva en tiempo real del diagrama de Gantt */}
        <section className={`mt-5 p-4 ${nestedClass}`} aria-labelledby="schedule-preview-title">
          <div className="flex items-center justify-between gap-3">
            <h3 id="schedule-preview-title" className={`text-xs font-medium ${mutedClass}`}>
              Vista previa del cronograma resultante:
            </h3>
            <span className="rounded border border-emerald-200 bg-emerald-50 px-2 py-1 text-[9px] font-semibold text-emerald-700 transition-colors duration-300 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400 midnight:border-emerald-500/20 midnight:bg-emerald-500/10 midnight:text-emerald-300">
              Ruta Crítica Activa
            </span>
          </div>

          <div className="mt-4 min-w-[420px] overflow-x-auto">
            <div className="grid grid-cols-12">
              {months.map((month) => (
                <span key={month} className={`text-center text-[9px] ${mutedClass}`}>
                  {month}
                </span>
              ))}
            </div>

            <div className="relative mt-2 h-9 overflow-hidden rounded-md border border-slate-200 bg-slate-50 transition-colors duration-300 dark:border-[#30363d] dark:bg-[#0d1117] midnight:border-cyan-800/40 midnight:bg-[#050B14]">
              {/* Cuadrícula de líneas de mes nativas */}
              <div className="absolute inset-0 grid grid-cols-12 divide-x divide-slate-200 transition-colors duration-300 dark:divide-[#30363d] midnight:divide-cyan-800/40">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div key={i} className="h-full" />
                ))}
              </div>

              {/* Barra interactiva coloreada con el color real del proyecto */}
              <div
                className="absolute inset-y-1 flex items-center justify-center rounded-md px-2 text-[10px] font-bold text-white shadow-sm transition-all duration-300"
                style={{
                  left: `${((start - 1) / 12) * 100}%`,
                  width: `${(duration / 12) * 100}%`,
                  backgroundColor: selectedProject?.color || '#24559a',
                }}
              >
                <span className="truncate">{previewPeriod}</span>
              </div>
            </div>
          </div>
        </section>

        <label className={`block ${labelClass}`}>
          Motivo del reajuste / historial de auditoría <span className="text-red-500 dark:text-red-400 midnight:text-red-400">*</span>
          <select
            required
            value={draft.reason}
            onChange={(e) => {
              setDraft((current) => ({ ...current, reason: e.target.value }));
              setError('');
            }}
            className={inputClass}
          >
            {scheduleAdjustmentReasons.map((reason) => (
              <option key={reason} value={reason}>
                {reason}
              </option>
            ))}
          </select>
        </label>

        <p className={`text-[10px] ${mutedClass}`}>
          <span className="text-cyan-600 dark:text-cyan-400 midnight:text-cyan-400">●</span> Se actualizará el Gantt general y quedará registro del cambio en el historial de auditoría.
        </p>
      </fieldset>

      {error && <InlineAlert variant="error" className="mt-4">{error}</InlineAlert>}
    </ModalDialog>
  );
}
