import React, { useEffect, useState } from 'react';
import { Flag, Plus } from 'lucide-react';
import ModalDialog from '../../../components/common/ModalDialog';
import { FootnoteText, InlineAlert } from '../../../components/common';
import { runSafe } from '../../../utils/asyncHandler';
import { useLanguage } from '../../../context/LanguageContext';
import {
  inputClass,
  nestedClass,
} from '../../../constants/themeClasses';
import {
  milestoneStatuses,
  milestoneValidators,
} from '../../../constants/strategicPlanning';
import { formatDateInput } from '../../../utils/format';

const headingClass = 'text-slate-900 transition-colors duration-300 dark:text-white midnight:text-cyan-50';
const mutedClass = 'text-slate-500 transition-colors duration-300 dark:text-slate-400 midnight:text-cyan-500/70';

/**
 * Modal para registrar un nuevo hito global en el calendario anual de proyectos.
 *
 * @param {Object} props
 * @param {Object} props.data - Datos que incluyen la lista de proyectos (data.projects)
 * @param {Function} props.onSubmit - Callback con los datos del nuevo hito
 * @param {Function} props.onClose - Cierra el diálogo
 */
export default function NewGlobalMilestoneDialog({ data, onSubmit, onClose }) {
  const { t } = useLanguage();
  const [draft, setDraft] = useState({
    projectId: data.projects[0]?.id ?? '',
    status: 'pending',
    title: '',
    targetDate: formatDateInput(new Date()),
    validator: milestoneValidators[0],
    description: '',
    blocking: true,
  });
  const [error, setError] = useState('');

  const changeField = (field) => (event) => {
    setDraft((current) => ({ ...current, [field]: event.target.value }));
    setError('');
  };

  useEffect(() => {
    const closeWithEscape = (event) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', closeWithEscape);
    return () => document.removeEventListener('keydown', closeWithEscape);
  }, [onClose]);

  const footnote = (
    <FootnoteText text={t('strategicPlanning.requiredFieldsNotice', 'Campos requeridos para dar de alta el hito.')} />
  );

  const handleSubmit = async () => {
    setError('');
    await runSafe(
      () => onSubmit(draft),
      {
        onError: (_submitError, message) => setError(message),
      }
    );
  };

  return (
    <ModalDialog
      isOpen={true}
      onClose={onClose}
      onSubmit={handleSubmit}
      title={t('strategicPlanning.newGlobalMilestone', 'Nuevo Hito Global')}
      subtitle={t('strategicPlanning.newMilestoneSubtitle', 'Define una entrega crítica, auditoría o fase clave en el calendario anual.')}
      icon={<Flag size={20} />}
      submitLabel={t('strategicPlanning.registerGlobalMilestone', 'Registrar Hito Global')}
      submitIcon={<Plus size={15} />}
      cancelLabel={t('common.cancel', 'Cancelar')}
      submitButtonClass="bg-blue-600 hover:bg-blue-500 midnight:bg-cyan-600 midnight:hover:bg-cyan-500"
      footnote={footnote}
      maxWidth="max-w-2xl"
      id="new-global-milestone"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <label className={`text-xs ${mutedClass}`}>
          {t('strategicPlanning.associatedProject', 'Proyecto asociado')}{' '}
          <span className="text-cyan-600 dark:text-cyan-400 midnight:text-cyan-400">*</span>
          <select autoFocus required value={draft.projectId} onChange={changeField('projectId')} className={inputClass}>
            {data.projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name} ({project.code})
              </option>
            ))}
          </select>
        </label>
        <label className={`text-xs ${mutedClass}`}>
          {t('strategicPlanning.initialStatus', 'Estado inicial')}{' '}
          <span className="text-cyan-600 dark:text-cyan-400 midnight:text-cyan-400">*</span>
          <select required value={draft.status} onChange={changeField('status')} className={inputClass}>
            {milestoneStatuses.map((status) => (
              <option key={status.id} value={status.id}>
                {t(`statuses.${status.id}`, status.label)}
              </option>
            ))}
          </select>
          <small className={`mt-1 block text-[10px] ${mutedClass}`}>
            {t('strategicPlanning.recommendedPending', 'Recomendado: “Pendiente” (amarillo) para entregas programadas.')}
          </small>
        </label>
      </div>

      <label className={`mt-4 block text-xs ${mutedClass}`}>
        {t('strategicPlanning.milestoneName', 'Nombre del hito / entrega crítica')}{' '}
        <span className="text-cyan-600 dark:text-cyan-400 midnight:text-cyan-400">*</span>
        <input
          required
          maxLength={120}
          value={draft.title}
          onChange={changeField('title')}
          placeholder={t('strategicPlanning.milestoneNamePlaceholder', 'Entrega Cimentación y Pilotes Estructurales')}
          className={inputClass}
        />
      </label>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className={`text-xs ${mutedClass}`}>
          {t('strategicPlanning.targetDate', 'Fecha límite programada')}{' '}
          <span className="text-cyan-600 dark:text-cyan-400 midnight:text-cyan-400">*</span>
          <input type="date" required value={draft.targetDate} onChange={changeField('targetDate')} className={inputClass} />
        </label>
        <label className={`text-xs ${mutedClass}`}>
          {t('strategicPlanning.validationResponsible', 'Responsable de validación')}{' '}
          <span className="text-cyan-600 dark:text-cyan-400 midnight:text-cyan-400">*</span>
          <select required value={draft.validator} onChange={changeField('validator')} className={inputClass}>
            {milestoneValidators.map((validator) => (
              <option key={validator}>{validator}</option>
            ))}
          </select>
        </label>
      </div>

      <label className={`mt-4 block text-xs ${mutedClass}`}>
        {t('strategicPlanning.descriptionDeliverables', 'Descripción y entregables clave')}{' '}
        <span className="text-cyan-600 dark:text-cyan-400 midnight:text-cyan-400">*</span>
        <textarea
          required
          minLength={10}
          maxLength={600}
          rows={4}
          value={draft.description}
          onChange={changeField('description')}
          placeholder={t('strategicPlanning.descriptionPlaceholder', 'Describe los criterios de aprobación, documentos y entregables...')}
          className={`${inputClass} resize-y leading-relaxed`}
        />
      </label>

      <label className={`mt-4 flex cursor-pointer items-start gap-3 p-3 ${nestedClass}`}>
        <input
          type="checkbox"
          checked={draft.blocking}
          onChange={(event) => setDraft((current) => ({ ...current, blocking: event.target.checked }))}
          className="mt-0.5 accent-blue-600 dark:accent-blue-500 midnight:accent-cyan-500"
        />
        <span>
          <strong className={`block text-xs font-medium ${headingClass}`}>
            {t('strategicPlanning.blockingMilestone', 'Hito bloqueante')}
          </strong>
          <small className={`mt-1 block text-[10px] leading-relaxed ${mutedClass}`}>
            {t('strategicPlanning.blockingMilestoneDesc', 'Detiene el cronograma si no se valida en la fecha objetivo y activa la ruta crítica.')}
          </small>
        </span>
      </label>

      {error && <InlineAlert variant="error" className="mt-4">{error}</InlineAlert>}
    </ModalDialog>
  );
}
