import React from 'react';
import { KeyRound, CheckCircle2 } from 'lucide-react';
import ModalDialog from '../../../components/common/ModalDialog';
import PasswordInput from '../../../components/common/PasswordInput';
import Button from '../../../components/common/Button';
import InlineAlert from '../../../components/common/InlineAlert';
import { useLanguage } from '../../../context/LanguageContext';

/**
 * Modal de Cambio de Contraseña en dos pasos:
 * Paso 1: Verificación de clave actual.
 * Paso 2: Ingreso y confirmación de nueva clave.
 */
export default function ChangePasswordModal({
  isOpen,
  onClose,
  step,
  setStep,
  form,
  setForm,
  error,
  setError,
  success,
  isSubmitting,
  onVerifyCurrent,
  onSubmitNewPassword,
}) {
  const { t } = useLanguage();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (step === 'current') {
      onVerifyCurrent(e);
    } else {
      onSubmitNewPassword(e);
    }
  };

  return (
    <ModalDialog
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleSubmit}
      title={t('configuration.changePasswordModalTitle', 'Cambiar Contraseña')}
      subtitle={
        step === 'current'
          ? t('configuration.verifyCurrentPasswordSubtitle', 'Primero verifique su contraseña actual')
          : t('configuration.enterNewPasswordSubtitle', 'Ingrese y confirme su nueva clave de acceso')
      }
      icon={<KeyRound size={20} />}
      showFooter={false}
      maxWidth="max-w-md"
      id="change-password"
    >
      {success ? (
        <div className="text-center py-4 space-y-4">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 flex items-center justify-center shadow-sm">
            <CheckCircle2 size={28} />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white midnight:text-cyan-50">
            {t('configuration.passwordUpdatedTitle', '¡Contraseña Actualizada!')}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 midnight:text-cyan-400 leading-relaxed">
            {t('configuration.passwordUpdatedDesc', 'Su contraseña fue modificada correctamente. Las demás sesiones abiertas con esta cuenta fueron cerradas.')}
          </p>
          <Button
            variant="primary"
            className="w-full mt-3"
            onClick={onClose}
          >
            {t('configuration.acceptAndBack', 'Aceptar y Volver')}
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {step === 'current' && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300 midnight:text-cyan-200">
                {t('configuration.currentPasswordLabel', 'Contraseña actual')}
              </label>
              <PasswordInput
                value={form.currentPassword}
                onChange={(e) => setForm((prev) => ({ ...prev, currentPassword: e.target.value }))}
                required
                autoFocus
                placeholder="••••••••"
                showPasswordLabel={t('configuration.showCurrentPassword', 'Mostrar contraseña actual')}
                hidePasswordLabel={t('configuration.hideCurrentPassword', 'Ocultar contraseña actual')}
              />
            </div>
          )}

          {step === 'new' && (
            <>
              <div className="flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 size={14} className="shrink-0" />
                <span>{t('configuration.currentPasswordVerified', 'Contraseña actual verificada')}</span>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300 midnight:text-cyan-200">
                  {t('configuration.newPasswordLabel', 'Nueva contraseña')}
                </label>
                <PasswordInput
                  value={form.newPassword}
                  onChange={(e) => setForm((prev) => ({ ...prev, newPassword: e.target.value }))}
                  required
                  autoFocus
                  placeholder={t('configuration.newPasswordPlaceholder', 'Mínimo 6 caracteres')}
                  autoComplete="new-password"
                  showPasswordLabel={t('configuration.showNewPassword', 'Mostrar nueva contraseña')}
                  hidePasswordLabel={t('configuration.hideNewPassword', 'Ocultar nueva contraseña')}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300 midnight:text-cyan-200">
                  {t('configuration.confirmNewPasswordLabel', 'Repetir nueva contraseña')}
                </label>
                <PasswordInput
                  value={form.confirmPassword}
                  onChange={(e) => setForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                  required
                  placeholder={t('configuration.confirmNewPasswordPlaceholder', 'Repita la nueva contraseña')}
                  autoComplete="new-password"
                  showPasswordLabel={t('configuration.showConfirmPassword', 'Mostrar confirmación de contraseña')}
                  hidePasswordLabel={t('configuration.hideConfirmPassword', 'Ocultar confirmación de contraseña')}
                />
              </div>
            </>
          )}

          {error && (
            <InlineAlert variant="error" showIcon>
              {error}
            </InlineAlert>
          )}

          <div className="flex gap-2.5 pt-3 border-t border-slate-200 dark:border-[#30363d] midnight:border-cyan-900/30">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => {
                if (step === 'new') {
                  setStep('current');
                  setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
                  setError('');
                } else {
                  onClose();
                }
              }}
            >
              {step === 'new' ? t('common.back', 'Volver') : t('common.cancel', 'Cancelar')}
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="flex-1"
              isLoading={isSubmitting}
            >
              {isSubmitting
                ? (step === 'current' ? t('configuration.verifying', 'Verificando...') : t('configuration.updating', 'Actualizando...'))
                : (step === 'current' ? t('configuration.verifyAndContinue', 'Verificar y Continuar') : t('configuration.updatePassword', 'Actualizar Clave'))}
            </Button>
          </div>
        </div>
      )}
    </ModalDialog>
  );
}
