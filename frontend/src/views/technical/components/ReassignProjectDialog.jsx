import React, { useState } from 'react';
import { ArrowLeftRight, Check } from 'lucide-react';
import ModalDialog from '../../../components/common/ModalDialog';
import MemberAvatar from './MemberAvatar';
import {
  technicalProjects,
  technicalStatuses,
  reassignmentReasons,
} from '../../../constants/technicalTeam';
import {
  getMemberFullName,
  getRequestErrorMessage,
} from '../../../utils/technicalTeam';
import {
  inputClass,
  labelClass,
  nestedClass,
  errorClass,
} from '../../../constants/themeClasses';

const headingClass = 'text-slate-900 transition-colors duration-300 dark:text-white midnight:text-cyan-50';
const mutedClass = 'text-slate-500 transition-colors duration-300 dark:text-slate-400 midnight:text-cyan-500/70';
const operationalStatuses = technicalStatuses.filter((status) => status.id !== 'offline');

/**
 * Diálogo modal para reasignar el proyecto o la dedicación operativa de un técnico.
 * Encapsula la gestión de su propio borrador y cálculo de porcentajes.
 */
export default function ReassignProjectDialog({
  member,
  projectOptions = technicalProjects,
  onSubmit,
  onClose,
}) {
  const availableProjects = Array.from(new Set([member?.project, ...projectOptions].filter(Boolean)));
  const [draft, setDraft] = useState({
    project: member?.project ?? '',
    status: member?.status === 'offline' ? 'standby' : (member?.status ?? 'active'),
    workload: member?.workload ?? 100,
    reason: reassignmentReasons[0],
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const changeField = (field) => (event) => {
    setDraft((current) => ({ ...current, [field]: event.target.value }));
    setError('');
  };

  const submitDraft = async (event) => {
    if (event?.preventDefault) event.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      await onSubmit(draft);
    } catch (submitError) {
      setError(getRequestErrorMessage(submitError));
    } finally {
      setIsSubmitting(false);
    }
  };

  const footnote = (
    <p className={`text-[10px] ${mutedClass}`}>
      La modificación se guardará en PostgreSQL y en Asignaciones Recientes.
    </p>
  );

  return (
    <ModalDialog
      isOpen={true}
      onClose={onClose}
      onSubmit={submitDraft}
      title="Reasignar Proyecto"
      subtitle="Actualiza la obra o la disponibilidad operativa del técnico."
      icon={<ArrowLeftRight size={20} />}
      submitLabel="Guardar reasignación"
      submitIcon={<Check size={15} />}
      cancelLabel="Cancelar"
      isSubmitting={isSubmitting}
      footnote={footnote}
      maxWidth="max-w-xl"
      id="reassign-project"
    >
      {member && (
        <div className={`flex items-center gap-3 p-3 ${nestedClass}`}>
          <MemberAvatar member={member} sizeClass="h-12 w-12" />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className={`font-semibold ${headingClass}`}>
                {member.area === 'architecture' ? 'Arq.' : 'Ing.'} {getMemberFullName(member)}
              </p>
              <span className="rounded bg-blue-50 px-2 py-0.5 text-[9px] font-semibold text-blue-700 transition-colors duration-300 dark:bg-blue-500/15 dark:text-blue-300 midnight:bg-blue-500/15 midnight:text-blue-300">
                {member.specialty}
              </span>
            </div>
            <p className={`mt-1 truncate text-[10px] ${mutedClass}`}>Actual: {member.project}</p>
          </div>
        </div>
      )}

      <label className={`mt-5 block ${labelClass}`}>
        Nuevo proyecto asignado <span className="text-cyan-600 dark:text-cyan-400 midnight:text-cyan-400">*</span>
        <select autoFocus required value={draft.project} onChange={changeField('project')} className={inputClass}>
          {availableProjects.map((project) => (
            <option key={project}>{project}</option>
          ))}
        </select>
      </label>

      <fieldset className="mt-5">
        <legend className={labelClass}>
          Estado operativo <span className="text-cyan-600 dark:text-cyan-400 midnight:text-cyan-400">*</span>
        </legend>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {operationalStatuses.map((status) => (
            <button
              key={status.id}
              type="button"
              aria-pressed={draft.status === status.id}
              onClick={() => {
                setDraft((current) => ({ ...current, status: status.id }));
                setError('');
              }}
              className={`flex min-w-0 items-center justify-center gap-2 rounded-lg border px-2 py-2.5 text-[11px] font-semibold transition-colors duration-300 ${
                draft.status === status.id
                  ? status.className
                  : 'border-slate-200 bg-slate-50 text-slate-500 hover:border-slate-300 dark:border-[#30363d] dark:bg-[#0d1117] dark:text-slate-400 dark:hover:border-slate-500 midnight:border-cyan-800/40 midnight:bg-[#050B14] midnight:text-cyan-500/70 midnight:hover:border-cyan-700/50'
              }`}
            >
              <span
                className={`h-2 w-2 shrink-0 rounded-full ${
                  status.id === 'active'
                    ? 'bg-emerald-500 dark:bg-emerald-400'
                    : status.id === 'standby'
                    ? 'bg-amber-500 dark:bg-amber-400'
                    : 'bg-blue-500 dark:bg-blue-400'
                }`}
              />
              {status.shortLabel}
            </button>
          ))}
        </div>
      </fieldset>

      <label className={`mt-5 block ${labelClass}`}>
        <span className="flex items-center justify-between gap-3">
          <span>
            Porcentaje de dedicación en esta obra <span className="text-cyan-600 dark:text-cyan-400 midnight:text-cyan-400">*</span>
          </span>
          <output className="rounded border border-blue-200 bg-blue-50 px-2 py-1 font-mono text-[11px] text-blue-700 transition-colors duration-300 dark:border-blue-500/25 dark:bg-blue-500/10 dark:text-blue-300 midnight:border-cyan-800/40 midnight:bg-cyan-900/30 midnight:text-cyan-300">
            {draft.workload}%
          </output>
        </span>
        <input
          type="range"
          min="0"
          max="100"
          step="5"
          value={draft.workload}
          onChange={changeField('workload')}
          className="mt-3 h-2 w-full cursor-pointer accent-blue-600 dark:accent-blue-500 midnight:accent-cyan-500"
        />
        <span className={`mt-1 flex justify-between text-[9px] ${mutedClass}`}>
          <span>0% (Sin asignación)</span>
          <span>50% (Media jornada)</span>
          <span>100% (Exclusivo)</span>
        </span>
      </label>

      <label className={`mt-5 block ${labelClass}`}>
        Motivo de la reasignación <span className="text-cyan-600 dark:text-cyan-400 midnight:text-cyan-400">*</span>
        <select required value={draft.reason} onChange={changeField('reason')} className={inputClass}>
          {reassignmentReasons.map((reason) => (
            <option key={reason}>{reason}</option>
          ))}
        </select>
      </label>

      {error && <p role="alert" className={errorClass}>{error}</p>}
    </ModalDialog>
  );
}

export { ReassignProjectDialog };
