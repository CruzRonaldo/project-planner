import React, { useState } from 'react';
import { KeyRound } from 'lucide-react';
import ModalDialog from '../../../components/common/ModalDialog';
import PasswordInput from '../../../components/common/PasswordInput';
import Button from '../../../components/common/Button';
import InlineAlert from '../../../components/common/InlineAlert';
import { useLanguage } from '../../../context/LanguageContext';

/**
 * Modal de Verificación de Contraseña Actual.
 * Utilizado para confirmar acciones sensibles (como el cambio de correo electrónico)
 * replicando exactamente la vista y experiencia del paso de verificación de ChangePasswordModal.
 */
export default function ConfirmPasswordModal({
  isOpen,
  onClose,
  onConfirm,
  isSubmitting = false,
  error = '',
  setError = () => {},
  title,
  subtitle,
}) {
  const { t } = useLanguage();
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!password) {
      setError(t('configuration.enterCurrentPasswordError', 'Debe ingresar su contraseña actual.'));
      return;
    }
    onConfirm(password);
  };

  const handleClose = () => {
    setPassword('');
    setError('');
    onClose();
  };

  return (
    <ModalDialog
      isOpen={isOpen}
      onClose={handleClose}
      onSubmit={handleSubmit}
      title={title || t('configuration.changePasswordModalTitle', 'Cambiar Contraseña')}
      subtitle={subtitle || t('configuration.verifyCurrentPasswordSubtitle', 'Primero verifique su contraseña actual')}
      icon={<KeyRound size={20} />}
      showFooter={false}
      maxWidth="max-w-md"
      id="confirm-password"
    >
      <div className="space-y-4">
        {error && (
          <InlineAlert variant="error" showIcon>
            {error}
          </InlineAlert>
        )}

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-700 dark:text-slate-300 midnight:text-cyan-200">
            {t('configuration.currentPasswordLabel', 'Contraseña actual')}
          </label>
          <PasswordInput
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (error) setError('');
            }}
            required
            autoFocus
            placeholder="••••••••"
            showPasswordLabel={t('configuration.showCurrentPassword', 'Mostrar contraseña actual')}
            hidePasswordLabel={t('configuration.hideCurrentPassword', 'Ocultar contraseña actual')}
            autoComplete="current-password"
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-[#30363d] midnight:border-cyan-900/30">
          <Button variant="secondary" onClick={handleClose} disabled={isSubmitting}>
            {t('common.cancel', 'Cancelar')}
          </Button>
          <Button variant="primary" type="submit" disabled={isSubmitting}>
            {isSubmitting ? t('configuration.verifying', 'Verificando...') : t('configuration.verifyAndContinue', 'Verificar y Continuar')}
          </Button>
        </div>
      </div>
    </ModalDialog>
  );
}
