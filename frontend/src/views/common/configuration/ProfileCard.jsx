import React from 'react';
import { Camera, Trash2, UserPen, KeyRound, AlertCircle } from 'lucide-react';
import Button from '../../../components/common/Button';
import ReadOnlyField from '../../../components/common/ReadOnlyField';

/**
 * Tarjeta de Perfil de Usuario:
 * Muestra fotografía/iniciales, rol, credenciales de contacto y acciones
 * de edición de perfil y actualización de contraseña.
 */
export default function ProfileCard({
  userPhoto,
  userName,
  userEmail,
  userPhone,
  currentUser,
  photoError,
  fileInputRef,
  onPhotoChange,
  onRemovePhoto,
  onOpenEditProfile,
  onOpenChangePassword,
  isSubAdmin,
}) {
  return (
    <section
      aria-labelledby="profile-card-title"
      className="border rounded-xl p-6 shadow-sm transition-colors duration-300 bg-white border-slate-200 dark:bg-[#161b22] dark:border-[#30363d] midnight:bg-[#0a1120] midnight:border-cyan-900/30"
    >
      <h2
        id="profile-card-title"
        className="text-lg font-bold mb-6 text-slate-900 dark:text-white midnight:text-cyan-100"
      >
        Perfil de Usuario
      </h2>

      {photoError && (
        <div
          role="alert"
          className="mb-4 p-3 rounded-lg flex items-center gap-2 text-xs bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400"
        >
          <AlertCircle size={15} className="shrink-0" />
          <span>{photoError}</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {/* Avatar con hover interactivo de carga */}
          <div className="relative group shrink-0">
            <div className="w-16 h-16 rounded-full border-2 overflow-hidden flex items-center justify-center text-2xl font-bold transition-all duration-300 border-slate-200 bg-slate-100 text-cyan-600 dark:border-slate-600 dark:bg-slate-800 dark:text-cyan-400 midnight:border-cyan-800 midnight:bg-cyan-900/40 midnight:text-cyan-300 shadow-sm">
              {userPhoto ? (
                <img
                  src={userPhoto}
                  alt={`Avatar de ${userName || 'Usuario'}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span>{userName?.charAt(0)?.toUpperCase() || 'U'}</span>
              )}
            </div>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              aria-label="Cambiar foto de perfil"
              className="absolute inset-0 rounded-full bg-slate-950/70 backdrop-blur-[2px] flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer shadow-lg"
            >
              <Camera size={18} className="mb-0.5 text-cyan-300" />
              <span className="text-[8px] font-bold tracking-wider uppercase text-cyan-100">Cambiar</span>
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={onPhotoChange}
              className="sr-only"
              aria-label="Seleccionar foto de perfil"
            />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-lg text-slate-900 dark:text-white midnight:text-cyan-50">
                {userName || 'Usuario'}
              </span>
            </div>
            <span className="text-sm font-medium text-cyan-600 dark:text-cyan-400 midnight:text-cyan-400 block">
              {currentUser?.roleLabel || 'Equipo Técnico'}
            </span>

            {userPhoto && (
              <button
                type="button"
                onClick={onRemovePhoto}
                className="mt-1 inline-flex items-center gap-1 text-xs text-rose-500 hover:text-rose-600 dark:text-rose-400 dark:hover:text-rose-300 midnight:text-rose-400 font-medium cursor-pointer transition-colors"
              >
                <Trash2 size={12} />
                <span>Eliminar foto</span>
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <Button
            variant="secondary"
            icon={UserPen}
            onClick={onOpenEditProfile}
          >
            Editar Perfil
          </Button>

          <Button
            variant="secondary"
            icon={KeyRound}
            onClick={onOpenChangePassword}
          >
            Cambiar Contraseña
          </Button>
        </div>
      </div>

      {/* Credenciales y estado de cuenta */}
      <div className="mt-6 pt-6 border-t border-slate-200 dark:border-[#30363d] midnight:border-cyan-900/30 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <ReadOnlyField
          label="Correo Electrónico"
          value={userEmail || currentUser?.email || currentUser?.username || 'Sin correo registrado'}
          valueClassName="truncate"
        />
        <ReadOnlyField
          label="Teléfono de Contacto"
          value={userPhone || 'No registrado'}
        />
        <ReadOnlyField
          label="Estado de Cuenta"
          value={
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400 midnight:text-emerald-300">
                Activo / En línea
              </span>
            </div>
          }
        />
      </div>

      {/* Badge para SubAdministrador */}
      {isSubAdmin && (
        <div className="mt-4 p-3 rounded-lg border border-cyan-200 bg-cyan-50 dark:border-cyan-500/30 dark:bg-cyan-950/40 midnight:border-cyan-700/50 midnight:bg-cyan-900/20">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-cyan-800 dark:text-cyan-300 midnight:text-cyan-200">
              🛡️ Privilegios Delegados de Gestión
            </span>
          </div>
          <p className="text-xs mt-1 text-slate-600 dark:text-slate-300 midnight:text-cyan-400/80">
            Usted cuenta con permisos delegados para crear y editar cronogramas e hitos de proyectos.
          </p>
        </div>
      )}
    </section>
  );
}
