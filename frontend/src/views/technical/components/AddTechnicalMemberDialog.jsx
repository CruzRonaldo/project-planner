import React, { useEffect, useState } from 'react';
import { Camera, UserPlus, Users } from 'lucide-react';
import ModalDialog from '../../../components/common/ModalDialog';
import PasswordInput from '../../../components/common/PasswordInput';
import {
  technicalAreas,
  technicalProjects,
  technicalStatuses,
} from '../../../constants/technicalTeam';
import { getRequestErrorMessage } from '../../../utils/technicalTeam';
import {
  inputClass,
  labelClass,
  nestedClass,
  errorClass,
} from '../../../constants/themeClasses';

const mutedClass = 'text-slate-500 transition-colors duration-300 dark:text-slate-400 midnight:text-cyan-500/70';

/**
 * Diálogo modal para registrar un nuevo integrante en el equipo técnico.
 * Encapsula la gestión de su propio borrador de formulario y la carga de fotografía.
 */
export default function AddTechnicalMemberDialog({
  existingData,
  projectOptions = technicalProjects,
  onSubmit,
  onClose,
}) {
  const [draft, setDraft] = useState({
    firstNames: '',
    lastNames: '',
    email: '',
    password: '',
    passwordConfirm: '',
    specialty: '',
    area: 'architecture',
    project: projectOptions[0] ?? technicalProjects[0],
    status: 'active',
    workload: 100,
    avatar: null,
  });
  const [photoName, setPhotoName] = useState('');
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

  useEffect(() => {
    const closeWithEscape = (event) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', closeWithEscape);
    return () => document.removeEventListener('keydown', closeWithEscape);
  }, [onClose]);

  const selectPhoto = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!['image/png', 'image/jpeg'].includes(file.type)) {
      setError('La foto debe ser PNG o JPG.');
      event.target.value = '';
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError('La foto no debe superar 2 MB.');
      event.target.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setDraft((current) => ({ ...current, avatar: String(reader.result) }));
      setPhotoName(file.name);
      setError('');
    };
    reader.onerror = () => setError('No se pudo leer la foto seleccionada.');
    reader.readAsDataURL(file);
  };

  const membersCount = existingData?.members?.length ?? 0;
  const footnote = (
    <p className={`text-[10px] ${mutedClass}`}>
      * Campos requeridos para el alta técnica. Actualmente hay {membersCount} integrantes.
    </p>
  );

  return (
    <ModalDialog
      isOpen={true}
      onClose={onClose}
      onSubmit={submitDraft}
      title="Añadir Nuevo Técnico"
      subtitle="Registra un nuevo profesional en el directorio de ingeniería, arquitectura o sistemas."
      icon={<UserPlus size={21} />}
      submitLabel="Añadir al equipo"
      submitIcon={<UserPlus size={15} />}
      cancelLabel="Cancelar"
      isSubmitting={isSubmitting}
      footnote={footnote}
      maxWidth="max-w-3xl"
      id="new-technician"
    >
      <div className={`flex flex-col gap-4 p-4 sm:flex-row sm:items-center ${nestedClass}`}>
        {draft.avatar ? (
          <img src={draft.avatar} alt="Vista previa de la foto" className="h-16 w-16 rounded-full object-cover" />
        ) : (
          <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-dashed border-slate-300 text-slate-400 transition-colors duration-300 dark:border-slate-500 midnight:border-cyan-800/40 midnight:text-cyan-600">
            <Users size={27} />
          </span>
        )}
        <div>
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition-colors duration-300 hover:border-cyan-400/50 dark:border-slate-600 dark:bg-[#161b22] dark:text-slate-200 midnight:border-cyan-800/40 midnight:bg-[#0a1120] midnight:text-cyan-100">
            <Camera size={15} /> Subir foto de perfil
            <input type="file" accept="image/png,image/jpeg" onChange={selectPhoto} className="sr-only" />
          </label>
          <p className={`mt-2 text-[10px] ${mutedClass}`}>PNG o JPG (máx. 2 MB){photoName && ` · ${photoName}`}</p>
        </div>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <label className={labelClass}>
          Nombres <span className="text-cyan-600 dark:text-cyan-400 midnight:text-cyan-400">*</span>
          <input
            autoFocus
            required
            maxLength={80}
            value={draft.firstNames}
            onChange={changeField('firstNames')}
            placeholder="Sofía Alejandra"
            className={inputClass}
          />
        </label>
        <label className={labelClass}>
          Apellidos <span className="text-cyan-600 dark:text-cyan-400 midnight:text-cyan-400">*</span>
          <input
            required
            maxLength={80}
            value={draft.lastNames}
            onChange={changeField('lastNames')}
            placeholder="Torres Valdivia"
            className={inputClass}
          />
        </label>
        <label className={labelClass}>
          Correo electrónico corporativo <span className="text-cyan-600 dark:text-cyan-400 midnight:text-cyan-400">*</span>
          <input
            type="email"
            required
            maxLength={120}
            value={draft.email}
            onChange={changeField('email')}
            placeholder="nombre@empresa.com"
            className={inputClass}
          />
        </label>
        <label className={labelClass}>
          Contraseña inicial <span className="text-cyan-600 dark:text-cyan-400 midnight:text-cyan-400">*</span>
          <div className="mt-2">
            <PasswordInput
              required
              minLength={8}
              maxLength={128}
              autoComplete="new-password"
              value={draft.password}
              onChange={changeField('password')}
              placeholder="Mínimo 8 caracteres"
              className={`${inputClass} !mt-0`}
            />
          </div>
        </label>
        <label className={labelClass}>
          Confirmar contraseña <span className="text-cyan-600 dark:text-cyan-400 midnight:text-cyan-400">*</span>
          <div className="mt-2">
            <PasswordInput
              required
              minLength={8}
              maxLength={128}
              autoComplete="new-password"
              value={draft.passwordConfirm}
              onChange={changeField('passwordConfirm')}
              placeholder="Repita la contraseña"
              className={`${inputClass} !mt-0`}
              showPasswordLabel="Ver confirmación de contraseña"
              hidePasswordLabel="Ocultar confirmación de contraseña"
            />
          </div>
        </label>
        <label className={labelClass}>
          Especialidad / Rol <span className="text-cyan-600 dark:text-cyan-400 midnight:text-cyan-400">*</span>
          <input
            required
            maxLength={100}
            value={draft.specialty}
            onChange={changeField('specialty')}
            placeholder="Arquitecta Principal / BIM"
            className={inputClass}
          />
        </label>
        <label className={labelClass}>
          Área técnica <span className="text-cyan-600 dark:text-cyan-400 midnight:text-cyan-400">*</span>
          <select required value={draft.area} onChange={changeField('area')} className={inputClass}>
            {technicalAreas.map((area) => (
              <option key={area.id} value={area.id}>
                {area.label}
              </option>
            ))}
          </select>
        </label>
        <label className={labelClass}>
          Proyecto asignado inicial
          <select value={draft.project} onChange={changeField('project')} className={inputClass}>
            {projectOptions.map((project) => (
              <option key={project}>{project}</option>
            ))}
          </select>
        </label>
        <label className={labelClass}>
          Estado de disponibilidad <span className="text-cyan-600 dark:text-cyan-400 midnight:text-cyan-400">*</span>
          <select required value={draft.status} onChange={changeField('status')} className={inputClass}>
            {technicalStatuses.map((status) => (
              <option key={status.id} value={status.id}>
                {status.label}
              </option>
            ))}
          </select>
        </label>
        <label className={labelClass}>
          Disponibilidad / carga inicial <span className="text-cyan-600 dark:text-cyan-400 midnight:text-cyan-400">*</span>
          <div className="relative">
            <input
              type="number"
              min="0"
              max="100"
              step="1"
              required
              value={draft.workload}
              onChange={changeField('workload')}
              className={`${inputClass} pr-10`}
            />
            <span className={`absolute bottom-2.5 right-3 text-xs ${mutedClass}`}>%</span>
          </div>
        </label>
      </div>

      {error && <p role="alert" className={errorClass}>{error}</p>}
    </ModalDialog>
  );
}

export { AddTechnicalMemberDialog };
