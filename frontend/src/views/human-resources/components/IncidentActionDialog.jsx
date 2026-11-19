import React, { useState, useMemo } from 'react';
import { CheckCircle2, XCircle, Clock } from 'lucide-react';
import ModalDialog from '../../../components/common/ModalDialog';
import InlineAlert from '../../../components/common/InlineAlert';
import { useLanguage } from '../../../context/LanguageContext';
import { runSafe } from '../../../utils/asyncHandler';

const inputClass = 'mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition-colors duration-300 focus:border-cyan-500 dark:border-[#30363d] dark:bg-[#0d1117] dark:text-slate-100 dark:focus:border-cyan-400 midnight:border-cyan-800/40 midnight:bg-[#050B14] midnight:text-cyan-50 midnight:focus:border-cyan-500';

export function IncidentActionDialog({ incident, action, onSubmit, onClose, isOpen = true }) {
  const { t } = useLanguage();
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const actionConfig = useMemo(() => ({
    approve: {
      title: t('humanResources.approveTitle', 'Aprobar Incidencia'),
      verb: t('humanResources.approveVerb', 'Aprobar'),
      help: t('humanResources.approveHelp', 'Al aprobar, se aplicarán el estado y la disponibilidad indicados al integrante.'),
      icon: <CheckCircle2 size={20} className="text-emerald-500" />,
      btnClass: 'bg-emerald-600 hover:bg-emerald-500 text-white',
    },
    reject: {
      title: t('humanResources.rejectTitle', 'Rechazar Incidencia'),
      verb: t('humanResources.rejectVerb', 'Rechazar'),
      help: t('humanResources.rejectHelp', 'Indica el motivo del rechazo para que quede registrado en el historial de auditoría.'),
      icon: <XCircle size={20} className="text-red-500" />,
      btnClass: 'bg-red-600 hover:bg-red-500 text-white',
    },
    finalize: {
      title: t('humanResources.finalizeTitle', 'Finalizar Incidencia'),
      verb: t('humanResources.finalizeVerb', 'Finalizar'),
      help: t('humanResources.finalizeHelp', 'Al finalizar, el integrante recuperará su estado operativo previo según las reglas del sistema.'),
      icon: <Clock size={20} className="text-blue-500" />,
      btnClass: 'bg-blue-600 hover:bg-blue-500 text-white',
    },
  }), [t]);

  if (!incident) return null;

  const config = actionConfig[action] || actionConfig.approve;

  const submitAction = async () => {
    if (action === 'reject' && comment.trim().length < 5) {
      setError(t('humanResources.rejectErrorMin', 'Escribe un motivo de rechazo de al menos 5 caracteres.'));
      return;
    }
    setError('');
    await runSafe(
      () => onSubmit(incident.id, action, comment),
      {
        setLoading: setIsSubmitting,
        onError: (_err, message) => setError(message),
      }
    );
  };

  return (
    <ModalDialog
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={submitAction}
      title={config.title}
      subtitle={`${incident.memberName} · ${incident.typeLabel}`}
      icon={config.icon}
      submitLabel={config.verb}
      cancelLabel={t('common.cancel', 'Cancelar')}
      isSubmitting={isSubmitting}
      submitButtonClass={config.btnClass}
      maxWidth="max-w-lg"
      id="incident-action"
    >
      <p className="text-xs text-slate-600 dark:text-slate-300 midnight:text-cyan-200">
        {config.help}
      </p>

      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 midnight:text-cyan-200 pt-2">
        {action === 'reject' ? t('humanResources.rejectReason', 'Motivo del rechazo') : t('humanResources.commentOrObs', 'Comentario u observaciones')} {action === 'reject' && <span className="text-red-500">*</span>}
        <textarea
          rows={3}
          required={action === 'reject'}
          value={comment}
          onChange={(event) => {
            setComment(event.target.value);
            setError('');
          }}
          placeholder={
            action === 'reject'
              ? t('humanResources.rejectPlaceholder', 'Explica detalladamente por qué se rechaza la solicitud...')
              : t('humanResources.commentPlaceholder', 'Comentario opcional para el registro de auditoría...')
          }
          className={`${inputClass} resize-none`}
        />
      </label>

      {error && (
        <InlineAlert variant="error">
          {error}
        </InlineAlert>
      )}
    </ModalDialog>
  );
}

export default IncidentActionDialog;
