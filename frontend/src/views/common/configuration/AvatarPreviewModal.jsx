import React, { useRef } from 'react';
import { User, Camera, Trash2 } from 'lucide-react';
import ModalDialog from '../../../components/common/ModalDialog';
import Button from '../../../components/common/Button';
import { useLanguage } from '../../../context/LanguageContext';

/**
 * Modal de previsualización y gestión del avatar de perfil de usuario.
 * Permite visualizar la foto en tamaño ampliado y cambiarla o eliminarla.
 */
export default function AvatarPreviewModal({
  isOpen = false,
  onClose,
  userPhoto,
  userName,
  onPhotoChange,
  onRemovePhoto,
}) {
  const { t } = useLanguage();
  const fileInputRef = useRef(null);

  return (
    <ModalDialog
      isOpen={isOpen}
      onClose={onClose}
      showFooter={false}
      maxWidth="max-w-md"
      id="avatar-preview-modal"
      title={t('configuration.avatarModalTitle', 'Foto de Perfil')}
      subtitle={t('configuration.avatarModalSubtitle', 'Vista previa y gestión de su foto de perfil')}
      icon={<User size={20} />}
    >
      <div className="flex flex-col items-center text-center py-2 space-y-4">
        {/* Contenedor circular amplio para previsualización */}
        <div className="w-48 h-48 sm:w-52 sm:h-52 rounded-full border-4 border-slate-200 dark:border-slate-700 midnight:border-cyan-800/80 bg-slate-100 dark:bg-slate-800 midnight:bg-cyan-950/60 overflow-hidden shadow-xl flex items-center justify-center shrink-0">
          {userPhoto ? (
            <img
              src={userPhoto}
              alt={t('configuration.avatarAlt', 'Avatar de {name}', { name: userName || t('configuration.user', 'Usuario') })}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-6xl font-black text-cyan-600 dark:text-cyan-400 midnight:text-cyan-300 select-none">
              {userName?.charAt(0)?.toUpperCase() || 'U'}
            </span>
          )}
        </div>

        {/* Texto informativo de formatos permitidos */}
        <p className="text-xs text-slate-500 dark:text-slate-400 midnight:text-cyan-500/80 max-w-xs px-2">
          {t('configuration.avatarHint', 'Formatos permitidos: JPG, PNG o WEBP (máx. 2 MB)')}
        </p>

        {/* Botonera de acciones */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 w-full pt-2">
          <Button
            type="button"
            variant="primary"
            icon={Camera}
            onClick={() => fileInputRef.current?.click()}
            className="w-full sm:w-auto"
          >
            {userPhoto
              ? t('configuration.changePhotoModal', 'Cambiar Foto')
              : t('configuration.uploadPhotoModal', 'Subir Foto')}
          </Button>

          {userPhoto && (
            <Button
              type="button"
              variant="danger"
              icon={Trash2}
              onClick={() => {
                if (onRemovePhoto) onRemovePhoto();
              }}
              className="w-full sm:w-auto"
            >
              {t('configuration.removePhotoModal', 'Eliminar Foto')}
            </Button>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={(e) => {
              if (onPhotoChange) onPhotoChange(e);
            }}
            className="sr-only"
            aria-label={t('configuration.selectPhotoAria', 'Seleccionar foto de perfil')}
          />
        </div>
      </div>
    </ModalDialog>
  );
}
