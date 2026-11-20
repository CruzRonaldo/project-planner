import React from 'react';
import { UserPen, CheckCircle2 } from 'lucide-react';
import ModalDialog from '../../../components/common/ModalDialog';
import Input from '../../../components/common/Input';
import InlineAlert from '../../../components/common/InlineAlert';
import { useLanguage } from '../../../context/LanguageContext';
import { sanitizePhoneInput } from '../../../utils/phoneValidation';

/**
 * Modal de Edición de Perfil de Usuario con validación accesible.
 */
export default function EditProfileModal({
  isOpen,
  onClose,
  onSubmit,
  form,
  setForm,
  error,
  success,
  isSubmitting,
}) {
  const { t } = useLanguage();

  return (
    <ModalDialog
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={onSubmit}
      title={t('configuration.editProfileModalTitle', 'Editar Perfil')}
      subtitle={t('configuration.editProfileModalSubtitle', 'Actualice sus datos de identidad y contacto')}
      icon={<UserPen size={20} />}
      submitLabel={isSubmitting ? t('configuration.saving', 'Guardando...') : t('configuration.saveChanges', 'Guardar Cambios')}
      cancelLabel={t('common.cancel', 'Cancelar')}
      isSubmitting={isSubmitting}
      showFooter={!success}
      maxWidth="max-w-md"
      id="edit-profile"
    >
      {success ? (
        <div className="py-6 flex flex-col items-center text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
            <CheckCircle2 size={28} />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white midnight:text-cyan-50">
            {t('configuration.profileUpdatedTitle', '¡Perfil Actualizado!')}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 midnight:text-cyan-400">
            {t('configuration.profileUpdatedDesc', 'Sus datos han sido guardados y sincronizados correctamente en el sistema.')}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {error && (
            <InlineAlert variant="error" showIcon>
              {error}
            </InlineAlert>
          )}

          <Input
            label={t('configuration.fullNameLabel', 'Nombre Completo / Mostrar como')}
            required
            maxLength={80}
            value={form.name}
            onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
            placeholder={t('configuration.fullNamePlaceholder', 'Ej. Carlos Mendoza')}
          />

          <Input
            label={t('configuration.phoneOptionalLabel', 'Teléfono de Contacto (Opcional)')}
            type="tel"
            maxLength={20}
            value={form.phone}
            onChange={(e) => setForm((prev) => ({ ...prev, phone: sanitizePhoneInput(e.target.value) }))}
            placeholder={t('configuration.phonePlaceholder', 'Ej. +51 987 654 321')}
            helperText={t('configuration.phoneHelperText', '9 dígitos para Perú (ej. 987 654 321) o formato internacional (+51...)')}
          />

          <Input
            label={t('configuration.emailInputLabel', 'Correo Electrónico (Gmail, Outlook u otro)')}
            type="email"
            required
            maxLength={120}
            value={form.email}
            onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
            placeholder={t('configuration.emailPlaceholder', 'nombre@gmail.com')}
            helperText={t('configuration.emailHelperText', 'Se utilizará para iniciar sesión. Al modificarlo, las demás sesiones activas serán cerradas automáticamente por seguridad.')}
          />
        </div>
      )}
    </ModalDialog>
  );
}
