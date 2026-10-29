import React, { useState } from 'react';
import { CalendarDays } from 'lucide-react';
import ModalDialog from '../../../components/common/ModalDialog';
import { personnelStatuses, personnelIncidentTypes } from '../../../constants/humanResources';
import { getIncidentDuration } from '../../../utils/humanResources';

const inputClass = 'mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition-colors duration-300 focus:border-cyan-500 dark:border-[#30363d] dark:bg-[#0d1117] dark:text-slate-100 dark:focus:border-cyan-400 midnight:border-cyan-800/40 midnight:bg-[#050B14] midnight:text-cyan-50 midnight:focus:border-cyan-500';

function formatDateInput(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

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
  return error?.message || 'No se pudo guardar la incidencia en el sistema.';
}

export function PersonnelIncidentDialog({ data = {}, onSubmit, onClose, isOpen = true }) {
  const members = data?.members || [];
  const today = new Date();
  const returnDate = new Date(today);
  returnDate.setDate(returnDate.getDate() + 1);

  const [draft, setDraft] = useState({
    memberId: members[0]?.id ?? '',
    type: personnelIncidentTypes[0].id,
    startDate: formatDateInput(today),
    endDate: formatDateInput(returnDate),
    status: 'standby',
    availability: 0,
    backupMemberId: '',
    comment: '',
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const duration = getIncidentDuration(draft.startDate, draft.endDate);
  const selectedMember = members.find((member) => member.id === draft.memberId);

  const changeField = (field) => (event) => {
    setDraft((current) => ({ ...current, [field]: event.target.value }));
    setError('');
  };

  const submitDraft = async () => {
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
    <p className="text-[11px] text-slate-500 dark:text-slate-400 midnight:text-cyan-600">
      <span className="text-cyan-600 dark:text-cyan-400 font-bold">●</span> Se registrará en el sistema como pendiente. El estado del integrante cambiará únicamente cuando se apruebe.
    </p>
  );

  return (
    <ModalDialog
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={submitDraft}
      title="Registrar Incidencia / Licencia"
      subtitle="Gestiona ausencias, permisos o variaciones temporales de disponibilidad del personal."
      icon={<CalendarDays size={20} />}
      submitLabel="Registrar incidencia"
      cancelLabel="Cancelar"
      isSubmitting={isSubmitting}
      submitDisabled={!duration}
      submitButtonClass="bg-blue-600 hover:bg-blue-500 midnight:bg-cyan-600 midnight:hover:bg-cyan-500"
      footnote={footnote}
      maxWidth="max-w-3xl"
      id="personnel-incident"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <label className="text-[10px] font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300 midnight:text-cyan-200">
          Integrante del personal <span className="text-cyan-600 dark:text-cyan-400">*</span>
          <select
            autoFocus
            required
            value={draft.memberId}
            onChange={(event) => {
              const memberId = event.target.value;
              setDraft((current) => ({
                ...current,
                memberId,
                backupMemberId: current.backupMemberId === memberId ? '' : current.backupMemberId,
              }));
              setError('');
            }}
            className={inputClass}
          >
            {members.length === 0 && <option value="">Sin personal registrado</option>}
            {members.map((member) => (
              <option key={member.id} value={member.id}>
                {member.name} ({member.area})
              </option>
            ))}
          </select>
        </label>

        <label className="text-[10px] font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300 midnight:text-cyan-200">
          Tipo de incidencia <span className="text-cyan-600 dark:text-cyan-400">*</span>
          <select required value={draft.type} onChange={changeField('type')} className={inputClass}>
            {personnelIncidentTypes.map((type) => (
              <option key={type.id} value={type.id}>
                {type.label}
              </option>
            ))}
          </select>
        </label>

        <label className="text-[10px] font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300 midnight:text-cyan-200">
          Fecha de inicio / desde <span className="text-cyan-600 dark:text-cyan-400">*</span>
          <input
            type="date"
            required
            value={draft.startDate}
            onChange={changeField('startDate')}
            className={inputClass}
          />
        </label>

        <label className="text-[10px] font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300 midnight:text-cyan-200">
          Fecha de retorno / hasta <span className="text-cyan-600 dark:text-cyan-400">*</span>
          <input
            type="date"
            required
            min={draft.startDate}
            value={draft.endDate}
            onChange={changeField('endDate')}
            className={inputClass}
          />
        </label>
      </div>

      <p className={`flex items-center gap-2 text-[11px] ${duration ? 'text-cyan-700 dark:text-cyan-300 midnight:text-cyan-300' : 'text-red-600 dark:text-red-400'}`}>
        <CalendarDays size={13} />
        {duration
          ? `Duración: ${duration.calendarDays} ${duration.calendarDays === 1 ? 'día calendario' : 'días calendario'} (${duration.businessDays} ${duration.businessDays === 1 ? 'día hábil' : 'días hábiles'})`
          : 'La fecha de retorno no puede ser anterior al inicio.'}
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
        <label className="text-[10px] font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300 midnight:text-cyan-200">
          Estado operativo resultante <span className="text-cyan-600 dark:text-cyan-400">*</span>
          <select required value={draft.status} onChange={changeField('status')} className={inputClass}>
            {personnelStatuses.map((status) => (
              <option key={status.id} value={status.id}>
                {status.id === 'standby'
                  ? 'Stand-by (Fuera de obra)'
                  : status.id === 'support'
                    ? 'En apoyo (Disponibilidad parcial)'
                    : 'Activo en obra'}
              </option>
            ))}
          </select>
        </label>

        <label className="text-[10px] font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300 midnight:text-cyan-200">
          Disponibilidad en este periodo <span className="text-cyan-600 dark:text-cyan-400">*</span>
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
      </div>

      <label className="block text-[10px] font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300 midnight:text-cyan-200">
        Técnico de respaldo / cobertura temporal <span className="normal-case text-slate-500 midnight:text-cyan-600">(opcional inteligente)</span>
        <select value={draft.backupMemberId} onChange={changeField('backupMemberId')} className={inputClass}>
          <option value="">Sin técnico de respaldo</option>
          {members
            .filter((member) => member.id !== draft.memberId)
            .map((member) => (
              <option key={member.id} value={member.id}>
                {member.name} · {member.area} · {member.project}
              </option>
            ))}
        </select>
      </label>

      <label className="block text-[10px] font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300 midnight:text-cyan-200">
        Motivo / comentario detallado <span className="text-cyan-600 dark:text-cyan-400">*</span>
        <textarea
          required
          minLength={5}
          maxLength={500}
          rows={3}
          value={draft.comment}
          onChange={changeField('comment')}
          placeholder="Describe el motivo, la entrega de turnos y las coordinaciones necesarias..."
          className={`${inputClass} resize-y leading-relaxed`}
        />
      </label>

      {selectedMember && (
        <p className="text-[10px] text-slate-500 dark:text-slate-400 midnight:text-cyan-600">
          Estado actual de {selectedMember.name}: {personnelStatuses.find((status) => status.id === selectedMember.status)?.label}, {selectedMember.availability}% de disponibilidad.
        </p>
      )}

      {error && (
        <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400 midnight:border-red-500/20 midnight:bg-red-500/10 midnight:text-red-300">
          {error}
        </p>
      )}
    </ModalDialog>
  );
}

export default PersonnelIncidentDialog;
