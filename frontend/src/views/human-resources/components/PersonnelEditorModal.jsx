import React, { useState } from 'react';
import { Briefcase, UserRoundCog } from 'lucide-react';
import ModalDialog from '../../../components/common/ModalDialog';
import { personnelStatuses } from '../../../constants/humanResources';

const inputClass = 'mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition-colors duration-300 focus:border-cyan-500 dark:border-[#30363d] dark:bg-[#0d1117] dark:text-slate-100 dark:focus:border-cyan-400 midnight:border-cyan-800/40 midnight:bg-[#050B14] midnight:text-cyan-50 midnight:focus:border-cyan-500';

function getRequestErrorMessage(error) {
  const responseData = error?.response?.data;
  if (typeof responseData?.message === 'string') return responseData.message;
  if (typeof responseData?.detail === 'string') return responseData.detail;
  if (responseData && typeof responseData === 'object') {
    const messages = Object.values(responseData).flatMap((value) =>
      Array.isArray(value) ? value : [value]
    );
    if (messages.length) return messages.join(' ');
  }
  return error?.message || 'No se pudo guardar el cambio en el sistema.';
}

export function PersonnelEditorModal({
  member,
  projectOptions = [],
  onSave,
  onCancel,
  editingProject = false,
  isOpen = true,
}) {
  if (!member) return null;

  const [draft, setDraft] = useState({
    project: member.project,
    status: member.status,
    availability: member.availability,
    comment: '',
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const availableProjects = Array.from(
    new Set(['Ninguno', member.project, ...projectOptions].filter(Boolean))
  );

  const changeField = (field) => (event) => {
    setDraft((current) => ({ ...current, [field]: event.target.value }));
    setError('');
  };

  const submitDraft = async () => {
    setError('');
    setIsSubmitting(true);
    try {
      await onSave(member.id, draft);
    } catch (saveError) {
      setError(getRequestErrorMessage(saveError));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ModalDialog
      isOpen={isOpen}
      onClose={onCancel}
      onSubmit={submitDraft}
      title={editingProject ? 'Asignar Proyecto' : 'Editar Disponibilidad y Estado'}
      subtitle={`${member.name} · ${member.area}`}
      icon={editingProject ? <Briefcase size={20} /> : <UserRoundCog size={20} />}
      submitLabel="Guardar cambios"
      cancelLabel="Cancelar"
      isSubmitting={isSubmitting}
      maxWidth="max-w-xl"
      id="personnel-editor"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <label className="text-xs text-slate-600 dark:text-slate-300 midnight:text-cyan-200">
          Proyecto asignado <span className="text-cyan-600 dark:text-cyan-400">*</span>
          <select
            autoFocus={editingProject}
            required
            value={draft.project}
            onChange={changeField('project')}
            className={inputClass}
          >
            {availableProjects.map((project) => (
              <option key={project} value={project}>
                {project}
              </option>
            ))}
          </select>
        </label>

        <label className="text-xs text-slate-600 dark:text-slate-300 midnight:text-cyan-200">
          Estado operativo <span className="text-cyan-600 dark:text-cyan-400">*</span>
          <select
            autoFocus={!editingProject}
            value={draft.status}
            onChange={changeField('status')}
            className={inputClass}
          >
            {personnelStatuses.map((status) => (
              <option key={status.id} value={status.id}>
                {status.label}
              </option>
            ))}
          </select>
        </label>

        <label className="text-xs text-slate-600 dark:text-slate-300 midnight:text-cyan-200">
          Disponibilidad (%) <span className="text-cyan-600 dark:text-cyan-400">*</span>
          <div className="relative">
            <input
              type="number"
              min="0"
              max="100"
              step="1"
              required
              value={draft.availability}
              onChange={changeField('availability')}
              className={`${inputClass} pr-9`}
            />
            <span className="absolute bottom-2.5 right-3 text-xs text-slate-500">%</span>
          </div>
        </label>

        <label className="text-xs text-slate-600 dark:text-slate-300 midnight:text-cyan-200">
          Motivo / Comentario <span className="text-slate-400 font-normal">(opcional)</span>
          <input
            maxLength={200}
            value={draft.comment}
            onChange={changeField('comment')}
            placeholder="Comentario sobre el cambio"
            className={inputClass}
          />
        </label>
      </div>

      {error && (
        <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400 midnight:border-red-500/20 midnight:bg-red-500/10 midnight:text-red-300">
          {error}
        </p>
      )}
    </ModalDialog>
  );
}

export default PersonnelEditorModal;
