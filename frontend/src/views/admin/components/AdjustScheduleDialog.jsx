import React, { useState } from 'react';
import { Check, SlidersHorizontal } from 'lucide-react';
import ModalDialog from '../../../components/common/ModalDialog';
import {
  errorClass,
  inputClass,
  labelClass,
  nestedClass,
} from '../../../constants/themeClasses';
import { scheduleAdjustmentReasons } from '../../../constants/strategicPlanning';
import { formatSchedulePeriod } from '../../../utils/strategicPlanning';

const mutedClass = 'text-slate-500 transition-colors duration-300 dark:text-slate-400 midnight:text-cyan-500/70';

/**
 * Modal para reprogramar el calendario de un proyecto con fechas completas.
 *
 * @param {Object} props
 * @param {Object} props.data - Datos de planificación estratégica (data.projects)
 * @param {string|number} [props.initialProjectId] - Proyecto preseleccionado
 * @param {Function} props.onSubmit - Callback con los datos del ajuste
 * @param {Function} props.onClose - Cierra el diálogo
 */
export default function AdjustScheduleDialog({ data, initialProjectId, onSubmit, onClose }) {
  const initialProject =
    data.projects.find((project) => String(project.id) === String(initialProjectId)) ??
    data.projects[0];

  const [draft, setDraft] = useState({
    projectId: initialProject?.id ?? '',
    startDate: initialProject?.startDate || initialProject?.start_date || '',
    endDate: initialProject?.endDate || initialProject?.end_date || '',
    reason: scheduleAdjustmentReasons[0],
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const changeField = (field) => (event) => {
    setDraft((current) => ({ ...current, [field]: event.target.value }));
    setError('');
  };

  const selectProject = (event) => {
    const project = data.projects.find((item) => String(item.id) === String(event.target.value));
    setDraft((current) => ({
      ...current,
      projectId: project?.id ?? '',
      startDate: project?.startDate || project?.start_date || '',
      endDate: project?.endDate || project?.end_date || '',
    }));
    setError('');
  };

  const handleSubmit = async () => {
    if (saving) return;
    setSaving(true);
    setError('');
    try {
      await onSubmit(draft);
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalDialog
      isOpen
      onClose={onClose}
      onSubmit={handleSubmit}
      isSubmitting={saving}
      title="Ajustar Calendario de Proyecto"
      subtitle="Selecciona fechas completas, incluso de años diferentes."
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

        <div className="grid gap-4 sm:grid-cols-2">
          <label className={labelClass}>
            Fecha de inicio <span className="text-red-500 dark:text-red-400 midnight:text-red-400">*</span>
            <input
              required
              type="date"
              min="0001-01-01"
              max="9999-12-31"
              value={draft.startDate}
              onChange={changeField('startDate')}
              className={inputClass}
            />
          </label>
          <label className={labelClass}>
            Fecha de fin <span className="text-red-500 dark:text-red-400 midnight:text-red-400">*</span>
            <input
              required
              type="date"
              min={draft.startDate || '0001-01-01'}
              max="9999-12-31"
              value={draft.endDate}
              onChange={changeField('endDate')}
              className={inputClass}
            />
          </label>
        </div>

        <p className={`p-4 text-sm ${nestedClass}`}>
          Vista previa del cronograma resultante: {formatSchedulePeriod(draft.startDate, draft.endDate) || 'Selecciona un rango válido.'}
        </p>

        <label className={`block ${labelClass}`}>
          Motivo del reajuste <span className="text-red-500 dark:text-red-400 midnight:text-red-400">*</span>
          <select required value={draft.reason} onChange={changeField('reason')} className={inputClass}>
            {scheduleAdjustmentReasons.map((reason) => (
              <option key={reason} value={reason}>
                {reason}
              </option>
            ))}
          </select>
        </label>

        <p className={`text-xs ${mutedClass}`}>
          Las fechas se guardan en Django. El resumen de ajustes de esta pantalla corresponde a la sesión actual.
        </p>
      </fieldset>

      {error && <p role="alert" className={errorClass}>{error}</p>}
    </ModalDialog>
  );
}
