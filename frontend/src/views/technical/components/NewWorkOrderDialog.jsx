import React, { useState } from 'react';
import { Download, Zap } from 'lucide-react';
import ModalDialog from '../../../components/common/ModalDialog';
import Input from '../../../components/common/Input';
import {
  inputClass,
  labelClass,
  nestedClass,
  errorClass,
} from '../../../constants/themeClasses';
import {
  operationalAreas,
  operationTypes,
  workOrderPriorities,
} from '../../../constants/operations';
import { getWorkOrderDuration } from '../../../utils/operations';
import { formatDateInput } from '../../../utils/format';

/**
 * Diálogo modal para la emisión y configuración de una nueva Orden de Trabajo.
 * Extraído como componente modular del módulo técnico.
 */
export default function NewWorkOrderDialog({
  projectOptions = [],
  responsibleOptions = [],
  onSubmit,
  onClose,
}) {
  const today = new Date();
  const endDate = new Date(today);
  endDate.setDate(endDate.getDate() + 7);

  const [draft, setDraft] = useState({
    project: projectOptions[0] ?? '',
    type: operationTypes[0],
    title: '',
    area: operationalAreas[1],
    responsible: responsibleOptions[0]?.name ?? '',
    startDate: formatDateInput(today),
    endDate: formatDateInput(endDate),
    priority: 'high',
    critical: true,
    tolerance: 3,
    documentUrl: '',
    description: '',
  });
  const [error, setError] = useState('');
  const duration = getWorkOrderDuration(draft.startDate, draft.endDate);

  const changeField = (field) => (event) => {
    setDraft((current) => ({ ...current, [field]: event.target.value }));
    setError('');
  };

  const submitDraft = () => {
    try {
      onSubmit(draft);
    } catch (submitError) {
      setError(submitError.message);
    }
  };

  const footnote = (
    <p className="text-[10px] text-slate-500 midnight:text-cyan-600">
      * Campos obligatorios para emitir la orden operativa.
    </p>
  );

  return (
    <ModalDialog
      isOpen={true}
      onClose={onClose}
      onSubmit={submitDraft}
      title="Nueva Orden de Trabajo"
      subtitle="Emite una orden técnica de terreno, asigna responsables y fija su ruta crítica."
      icon={<Zap size={20} />}
      submitLabel="Emitir Orden de Trabajo"
      submitIcon={<Download size={15} />}
      cancelLabel="Cancelar"
      submitButtonClass="bg-blue-600 hover:bg-blue-500 midnight:bg-cyan-600 midnight:hover:bg-cyan-500"
      footnote={footnote}
      maxWidth="max-w-3xl"
      id="new-work-order"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <label className={labelClass}>
          Proyecto asociado <span className="text-cyan-600 dark:text-cyan-400 midnight:text-cyan-400">*</span>
          <select autoFocus required value={draft.project} onChange={changeField('project')} className={inputClass}>
            {projectOptions.length === 0 && <option value="">Sin proyectos registrados</option>}
            {projectOptions.map((project) => (
              <option key={project} value={project}>
                {project}
              </option>
            ))}
          </select>
        </label>
        <label className={labelClass}>
          Tipo de operación <span className="text-cyan-600 dark:text-cyan-400 midnight:text-cyan-400">*</span>
          <select required value={draft.type} onChange={changeField('type')} className={inputClass}>
            {operationTypes.map((type) => (
              <option key={type}>{type}</option>
            ))}
          </select>
        </label>
      </div>

      <Input
        label="Título de la tarea / orden"
        required
        maxLength={120}
        value={draft.title}
        onChange={changeField('title')}
        placeholder="Vaciado de losa Nivel 4 - Sector Norte"
        containerClassName="mt-4"
      />

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className={labelClass}>
          Área técnica <span className="text-cyan-600 dark:text-cyan-400 midnight:text-cyan-400">*</span>
          <select required value={draft.area} onChange={changeField('area')} className={inputClass}>
            {operationalAreas.map((area) => (
              <option key={area}>{area}</option>
            ))}
          </select>
        </label>
        <label className={labelClass}>
          Responsable asignado <span className="text-cyan-600 dark:text-cyan-400 midnight:text-cyan-400">*</span>
          <select required value={draft.responsible} onChange={changeField('responsible')} className={inputClass}>
            {responsibleOptions.length === 0 && <option value="">Sin técnicos registrados</option>}
            {responsibleOptions.map((member) => (
              <option key={member.id} value={member.name}>
                {member.name} ({member.specialty})
              </option>
            ))}
          </select>
        </label>
        <label className={labelClass}>
          Fecha de inicio <span className="text-cyan-600 dark:text-cyan-400 midnight:text-cyan-400">*</span>
          <input type="date" required value={draft.startDate} onChange={changeField('startDate')} className={inputClass} />
        </label>
        <label className={labelClass}>
          Fecha de fin / límite <span className="text-cyan-600 dark:text-cyan-400 midnight:text-cyan-400">*</span>
          <input
            type="date"
            required
            min={draft.startDate}
            value={draft.endDate}
            onChange={changeField('endDate')}
            className={inputClass}
          />
          {duration && (
            <span className="mt-2 block text-[10px] text-cyan-700 dark:text-cyan-400 midnight:text-cyan-400">
              Duración estimada: {duration} {duration === 1 ? 'día' : 'días'}
            </span>
          )}
        </label>
        <label className={labelClass}>
          Nivel de prioridad <span className="text-cyan-600 dark:text-cyan-400 midnight:text-cyan-400">*</span>
          <select required value={draft.priority} onChange={changeField('priority')} className={inputClass}>
            {workOrderPriorities.map((priority) => (
              <option key={priority.id} value={priority.id}>
                {priority.label}
              </option>
            ))}
          </select>
        </label>
        <fieldset>
          <legend className={labelClass}>Parámetro de ruta crítica</legend>
          <div className={`mt-2 flex min-h-11 items-center justify-between gap-3 px-3 ${nestedClass}`}>
            <label className="flex cursor-pointer items-center gap-2 text-[11px] text-slate-700 dark:text-slate-200 midnight:text-cyan-100">
              <input
                type="checkbox"
                checked={draft.critical}
                onChange={(event) => setDraft((current) => ({ ...current, critical: event.target.checked }))}
                className="accent-cyan-500"
              />{' '}
              Tarea en ruta crítica
            </label>
            <label className="flex items-center gap-2 text-[10px] text-slate-500 midnight:text-cyan-600">
              Tolerancia:
              <input
                type="number"
                min="0"
                max="30"
                step="1"
                value={draft.tolerance}
                onChange={changeField('tolerance')}
                aria-label="Tolerancia en días"
                className="w-12 rounded border border-slate-300 bg-white px-2 py-1 text-center text-slate-900 outline-none transition-colors duration-300 dark:border-[#30363d] dark:bg-[#161b22] dark:text-white midnight:border-cyan-800/40 midnight:bg-[#0a1120] midnight:text-cyan-50"
              />{' '}
              días
            </label>
          </div>
        </fieldset>
      </div>

      <Input
        type="url"
        label="Documento o plano vinculado (Google Drive)"
        maxLength={300}
        value={draft.documentUrl}
        onChange={changeField('documentUrl')}
        placeholder="https://drive.google.com/drive/folders/..."
        containerClassName="mt-4"
      />

      <label className={`mt-4 block ${labelClass}`}>
        Descripción e instrucciones de terreno <span className="text-cyan-600 dark:text-cyan-400 midnight:text-cyan-400">*</span>
        <textarea
          required
          minLength={10}
          maxLength={600}
          rows={4}
          value={draft.description}
          onChange={changeField('description')}
          placeholder="Detalla verificaciones, entregables y criterios de aceptación..."
          className={`${inputClass} resize-y leading-relaxed`}
        />
      </label>

      {error && (
        <p role="alert" className={errorClass}>
          {error}
        </p>
      )}
    </ModalDialog>
  );
}

export { NewWorkOrderDialog };
