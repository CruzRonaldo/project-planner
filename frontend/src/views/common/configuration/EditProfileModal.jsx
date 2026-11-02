import React from 'react';
import { UserPen, CheckCircle2, AlertCircle } from 'lucide-react';
import ModalDialog from '../../../components/common/ModalDialog';
import Input from '../../../components/common/Input';

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
  return (
    <ModalDialog
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={onSubmit}
      title="Editar Perfil"
      subtitle="Actualice sus datos de identidad y contacto"
      icon={<UserPen size={20} />}
      submitLabel={isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
      cancelLabel="Cancelar"
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
            ¡Perfil Actualizado!
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 midnight:text-cyan-400">
            Sus datos han sido guardados y sincronizados correctamente en el sistema.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {error && (
            <div
              role="alert"
              className="p-2.5 rounded-lg text-xs flex items-start gap-2 bg-red-50 border border-red-200 text-red-600 dark:bg-red-500/10 dark:border-red-500/20 dark:text-red-400 midnight:bg-red-950/40 midnight:border-red-500/30"
            >
              <AlertCircle size={14} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <Input
            label="Nombre Completo / Mostrar como"
            required
            maxLength={80}
            value={form.name}
            onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
            placeholder="Ej. Carlos Mendoza"
          />

          <Input
            label="Teléfono de Contacto (Opcional)"
            type="tel"
            maxLength={30}
            value={form.phone}
            onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
            placeholder="Ej. +51 987 654 321"
          />

          <Input
            label="Correo Electrónico (Gmail, Outlook u otro)"
            type="email"
            required
            maxLength={120}
            value={form.email}
            onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
            placeholder="nombre@gmail.com"
            helperText="Se utilizará para iniciar sesión. Todo cambio de correo queda registrado en la bitácora de auditoría para el administrador."
          />
        </div>
      )}
    </ModalDialog>
  );
}
