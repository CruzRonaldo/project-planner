import React, { useState } from 'react';
import { Lock, Pencil, Save } from 'lucide-react';
import ModalDialog from '../../../components/common/ModalDialog';
import {
  projectAreas,
  projectLeaders,
  projectStatuses,
} from '../../../constants/portfolio';
import { inputClass } from '../../../constants/themeClasses';

export default function EditProjectDialog({
  project,
  onSubmit,
  onClose,
  teamMembers = [],
  isAdmin = false,
}) {
  const leadersList =
    teamMembers.length > 0
      ? teamMembers.map((m) => ({
          id: m.id,
          name: m.full_name,
          role: m.role_name,
        }))
      : projectLeaders;

  const [draft, setDraft] = useState({
    name: project.name || '',
    area: project.area || projectAreas[0],
    startDate: project.startDate || '',
    endDate: project.endDate || '',
    totalBudget: project.totalBudget ?? '',
    status: project.status || 'planning',
    leaderId: project.leaderId || leadersList[0]?.id || 1,
    driveFolder: project.driveFolder || '',
    description: project.description || '',
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const changeField = (field) => (event) => {
    setDraft((current) => ({ ...current, [field]: event.target.value }));
    setError('');
  };

  const handleBudgetChange = (event) => {
    const raw = event.target.value;
    const clean = raw.replace(/[^0-9.]/g, '');
    setDraft((current) => ({ ...current, totalBudget: clean }));
    setError('');
  };

  const handleKeyDownBudget = (e) => {
    if (['e', 'E', '+', '-'].includes(e.key)) {
      e.preventDefault();
    }
  };

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    const numericBudget = !isAdmin
      ? Number(project.totalBudget ?? 0)
      : Number(draft.totalBudget);

    if (
      isAdmin &&
      (!draft.totalBudget || isNaN(numericBudget) || numericBudget <= 0)
    ) {
      setError('El presupuesto total debe ser un monto mayor a 0.');
      return;
    }
    if (new Date(draft.endDate) < new Date(draft.startDate)) {
      setError('La fecha de entrega debe ser posterior a la fecha de inicio.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(project.id, {
        ...draft,
        leaderId: !isAdmin
          ? project.leaderId || draft.leaderId
          : draft.leaderId,
        totalBudget: numericBudget,
      });
    } catch (submitError) {
      setError(submitError.message);
      setIsSubmitting(false);
    }
  };

  return (
    <ModalDialog
      isOpen={true}
      onClose={onClose}
      onSubmit={submit}
      title="Editar Proyecto"
      subtitle={
        <span>
          Código:{' '}
          <span className="font-semibold text-cyan-600 dark:text-cyan-400">
            {project.code}
          </span>
        </span>
      }
      icon={<Pencil size={18} />}
      submitLabel="Guardar Cambios"
      submitIcon={<Save size={15} />}
      cancelLabel="Cancelar"
      isSubmitting={isSubmitting}
      submitButtonClass="bg-cyan-600 hover:bg-cyan-500 midnight:bg-cyan-600 midnight:hover:bg-cyan-500"
      maxWidth="max-w-2xl"
      id="edit-project"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-xs text-slate-500 dark:text-slate-300 midnight:text-cyan-500/70 sm:col-span-2">
          Nombre del proyecto{' '}
          <span className="text-cyan-600 dark:text-cyan-400 midnight:text-cyan-400">
            *
          </span>
          <input
            required
            maxLength={80}
            value={draft.name}
            onChange={changeField('name')}
            placeholder="Ej. Torre Mirador Fase 2"
            className={inputClass}
          />
        </label>

        <label className="text-xs text-slate-500 dark:text-slate-300 midnight:text-cyan-500/70">
          Área técnica{' '}
          <span className="text-cyan-600 dark:text-cyan-400 midnight:text-cyan-400">
            *
          </span>
          <select
            value={draft.area}
            onChange={changeField('area')}
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
          <span className="flex items-center justify-between">
            <span>
              Presupuesto total (S/){' '}
              <span className="text-cyan-600 dark:text-cyan-400 midnight:text-cyan-400">
                *
              </span>
            </span>
            {!isAdmin && (
              <span
                title="Presupuesto protegido: Para modificar el monto establecido, debes solicitar autorización al Administrador."
                className="cursor-help text-slate-400 transition-colors hover:text-amber-500 dark:text-slate-500 dark:hover:text-amber-400"
              >
                <Lock size={13} />
              </span>
            )}
          </span>
          <input
            type="number"
            min="0"
            step="any"
            required
            disabled={!isAdmin}
            title={
              !isAdmin
                ? 'Presupuesto protegido: Para modificar el monto establecido, debes solicitar autorización al Administrador.'
                : undefined
            }
            value={draft.totalBudget}
            onKeyDown={handleKeyDownBudget}
            onChange={handleBudgetChange}
            placeholder="Ej. 1500000"
            className={`${inputClass} ${
              !isAdmin
                ? 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-500 dark:border-[#30363d] dark:bg-[#161b22] dark:text-slate-400 midnight:bg-cyan-950/40'
                : ''
            }`}
          />
        </label>

        <label className="text-xs text-slate-500 dark:text-slate-300 midnight:text-cyan-500/70">
          Fecha de inicio{' '}
          <span className="text-cyan-600 dark:text-cyan-400 midnight:text-cyan-400">
            *
          </span>
          <input
            type="date"
            required
            value={draft.startDate}
            onChange={changeField('startDate')}
            className={inputClass}
          />
        </label>

        <label className="text-xs text-slate-500 dark:text-slate-300 midnight:text-cyan-500/70">
          Fecha de entrega estimada{' '}
          <span className="text-cyan-600 dark:text-cyan-400 midnight:text-cyan-400">
            *
          </span>
          <input
            type="date"
            required
            value={draft.endDate}
            onChange={changeField('endDate')}
            className={inputClass}
          />
        </label>

        <label className="text-xs text-slate-500 dark:text-slate-300 midnight:text-cyan-500/70">
          Estado operativo{' '}
          <span className="text-cyan-600 dark:text-cyan-400 midnight:text-cyan-400">
            *
          </span>
          <select
            value={draft.status}
            onChange={changeField('status')}
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
          <span className="flex items-center justify-between">
            <span>
              Líder de obra{' '}
              <span className="text-cyan-600 dark:text-cyan-400 midnight:text-cyan-400">
                *
              </span>
            </span>
            {!isAdmin && (
              <span
                title="La reasignación de jefatura es gestionada exclusivamente por el Administrador."
                className="cursor-help text-slate-400 transition-colors hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 midnight:text-cyan-500/70 midnight:hover:text-cyan-300"
              >
                <Lock size={13} />
              </span>
            )}
          </span>
          <select
            required
            disabled={!isAdmin}
            title={
              !isAdmin
                ? 'La reasignación de jefatura es gestionada exclusivamente por el Administrador.'
                : undefined
            }
            value={draft.leaderId}
            onChange={changeField('leaderId')}
            className={`${inputClass} ${
              !isAdmin
                ? 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-500 dark:border-[#30363d] dark:bg-[#161b22] dark:text-slate-400 midnight:bg-cyan-950/40'
                : ''
            }`}
          >
            {leadersList.map((leader) => (
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
            onChange={changeField('driveFolder')}
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
            onChange={changeField('description')}
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

export { EditProjectDialog };
