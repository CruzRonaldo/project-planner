import React, { useState } from 'react';
import { CheckCircle2, XCircle, Clock } from 'lucide-react';
import ModalDialog from '../../../components/common/ModalDialog';

const inputClass = 'mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition-colors duration-300 focus:border-cyan-500 dark:border-[#30363d] dark:bg-[#0d1117] dark:text-slate-100 dark:focus:border-cyan-400 midnight:border-cyan-800/40 midnight:bg-[#050B14] midnight:text-cyan-50 midnight:focus:border-cyan-500';

const actionConfig = {
  approve: {
    title: 'Aprobar Incidencia',
    verb: 'Aprobar',
    help: 'Al aprobar, se aplicarán el estado y la disponibilidad indicados al integrante.',
    icon: <CheckCircle2 size={20} className="text-emerald-500" />,
    btnClass: 'bg-emerald-600 hover:bg-emerald-500 text-white',
  },
  reject: {
    title: 'Rechazar Incidencia',
    verb: 'Rechazar',
    help: 'Indica el motivo del rechazo para que quede registrado en el historial de auditoría.',
    icon: <XCircle size={20} className="text-red-500" />,
    btnClass: 'bg-red-600 hover:bg-red-500 text-white',
  },
  finalize: {
    title: 'Finalizar Incidencia',
    verb: 'Finalizar',
    help: 'Al finalizar, el integrante recuperará su estado operativo previo según las reglas del sistema.',
    icon: <Clock size={20} className="text-blue-500" />,
    btnClass: 'bg-blue-600 hover:bg-blue-500 text-white',
  },
};

function getRequestErrorMessage(error) {
  const responseData = error?.response?.data;
  if (typeof responseData?.message === 'string') return responseData.message;
  if (typeof responseData?.detail === 'string') return responseData.detail;
  return error?.message || 'No se pudo procesar la acción en el sistema.';
}

export function IncidentActionDialog({ incident, action, onSubmit, onClose, isOpen = true }) {
  if (!incident) return null;

  const config = actionConfig[action] || actionConfig.approve;
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitAction = async () => {
    if (action === 'reject' && comment.trim().length < 5) {
      setError('Escribe un motivo de rechazo de al menos 5 caracteres.');
      return;
    }
    setError('');
    setIsSubmitting(true);
    try {
      await onSubmit(incident.id, action, comment);
    } catch (submitError) {
      setError(getRequestErrorMessage(submitError));
    } finally {
      setIsSubmitting(false);
    }
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
      cancelLabel="Cancelar"
      isSubmitting={isSubmitting}
      submitButtonClass={config.btnClass}
      maxWidth="max-w-lg"
      id="incident-action"
    >
      <p className="text-xs text-slate-600 dark:text-slate-300 midnight:text-cyan-200">
        {config.help}
      </p>

      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 midnight:text-cyan-200 pt-2">
        {action === 'reject' ? 'Motivo del rechazo' : 'Comentario u observaciones'} {action === 'reject' && <span className="text-red-500">*</span>}
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
              ? 'Explica detalladamente por qué se rechaza la solicitud...'
              : 'Comentario opcional para el registro de auditoría...'
          }
          className={`${inputClass} resize-none`}
        />
      </label>

      {error && (
        <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400">
          {error}
        </p>
      )}
    </ModalDialog>
  );
}

export default IncidentActionDialog;
