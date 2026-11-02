import React, { useState, useEffect, useRef, useCallback } from 'react';
import projectsApi from '../../services/projectsApi';
import {
  ProfileCard,
  PreferencesCard,
  ProjectParametersCard,
  TechnicalTeamCard,
  SecurityPoliciesCard,
  BackupAndSecurityCard,
  AuditLogCard,
  EditProfileModal,
  ChangePasswordModal,
} from './configuration';

/**
 * Vista unificada de Configuración del Sistema.
 * Orquestador principal modularizado con componentes accesibles y multitema.
 */
export default function Configuration({
  currentUser,
  onUpdateCurrentUser,
  onSessionTokenChange,
  fontScale,
  setFontScale,
  theme,
  setTheme,
  users = [],
  onAddMember,
}) {
  const [, setLocalUsers] = useState(users);

  useEffect(() => {
    setLocalUsers(users);
  }, [users]);

  // Estado de Perfil y Fotografía
  const fileInputRef = useRef(null);
  const [userPhoto, setUserPhoto] = useState(currentUser?.photo || currentUser?.avatar || null);
  const [userName, setUserName] = useState(currentUser?.name || '');
  const [userPhone, setUserPhone] = useState(currentUser?.phone || '');
  const [userEmail, setUserEmail] = useState(currentUser?.email || '');
  const [photoError, setPhotoError] = useState('');

  useEffect(() => {
    setUserPhoto(currentUser?.photo || currentUser?.avatar || null);
    setUserName(currentUser?.name || '');
    setUserPhone(currentUser?.phone || '');
    setUserEmail(currentUser?.email || '');
  }, [currentUser]);

  // Modal de edición de perfil
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profileEditForm, setProfileEditForm] = useState({
    name: currentUser?.name || '',
    phone: currentUser?.phone || '',
    email: currentUser?.email || '',
  });
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [isSubmittingProfile, setIsSubmittingProfile] = useState(false);

  // Modal de cambio de contraseña
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [passwordStep, setPasswordStep] = useState('current');
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);

  // Bitácora de Auditoría y Respaldo
  const [auditLogs, setAuditLogs] = useState([]);
  const [loadingAuditLogs, setLoadingAuditLogs] = useState(false);
  const [lastBackup, setLastBackup] = useState(
    'Aún no se ha generado un respaldo desde esta pantalla.'
  );

  const getActiveUser = () => {
    if (currentUser) return currentUser;
    try {
      return JSON.parse(localStorage.getItem('project_planner_user') || '{}');
    } catch {
      return {};
    }
  };

  const isAdmin =
    currentUser?.accountType === 'admin' ||
    currentUser?.isAdmin ||
    currentUser?.role === 'admin' ||
    Boolean(currentUser?.is_superuser);
  const isSubAdmin = currentUser?.roleLabel === 'SubAdministrador' || currentUser?.isSubAdmin;

  const fetchAuditLogs = useCallback(async () => {
    if (!isAdmin) return;
    setLoadingAuditLogs(true);
    try {
      const res = await projectsApi.getAuditLogs();
      if (res && res.logs) {
        setAuditLogs(res.logs);
      }
    } catch (err) {
      console.warn('Error cargando bitácora de auditoría:', err);
    } finally {
      setLoadingAuditLogs(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    if (isAdmin) {
      fetchAuditLogs();
    }
  }, [isAdmin, fetchAuditLogs]);

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
      setPhotoError('La foto debe ser en formato PNG, JPG o WEBP.');
      e.target.value = '';
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setPhotoError('La foto no debe superar los 2 MB.');
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64Data = String(reader.result);
      setUserPhoto(base64Data);
      setPhotoError('');

      if (onUpdateCurrentUser) {
        onUpdateCurrentUser({ photo: base64Data, avatar: base64Data });
      } else {
        try {
          const stored = JSON.parse(localStorage.getItem('project_planner_user') || '{}');
          stored.photo = base64Data;
          stored.avatar = base64Data;
          localStorage.setItem('project_planner_user', JSON.stringify(stored));
        } catch {}
      }
    };
    reader.onerror = () => {
      setPhotoError('No se pudo procesar la imagen seleccionada.');
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleRemovePhoto = () => {
    setUserPhoto(null);
    setPhotoError('');

    if (onUpdateCurrentUser) {
      onUpdateCurrentUser({ photo: null, avatar: null });
    } else {
      try {
        const stored = JSON.parse(localStorage.getItem('project_planner_user') || '{}');
        delete stored.photo;
        delete stored.avatar;
        localStorage.setItem('project_planner_user', JSON.stringify(stored));
      } catch {}
    }
  };

  const handleCurrentPasswordVerify = async (e) => {
    e.preventDefault();
    setPasswordError('');

    if (!passwordForm.currentPassword) {
      setPasswordError('Debe ingresar su contraseña actual.');
      return;
    }

    setIsSubmittingPassword(true);
    try {
      const activeUser = getActiveUser();
      const identifier = activeUser?.email || activeUser?.username;

      await projectsApi.verifyCurrentPassword({
        identifier,
        userId: activeUser?.id,
        currentPassword: passwordForm.currentPassword,
      });

      setPasswordStep('new');
      setPasswordError('');
    } catch (err) {
      console.error('Error al verificar contraseña:', err);
      const msg =
        err.response?.data?.message ||
        (err.response?.data?.error ? String(err.response.data.error) : null) ||
        err.message ||
        'La contraseña actual no es correcta. Puede intentarlo nuevamente.';
      setPasswordError(msg);
    } finally {
      setIsSubmittingPassword(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordError('');

    if (!passwordForm.currentPassword) {
      setPasswordError('Debe ingresar su contraseña actual.');
      return;
    }
    if (!passwordForm.newPassword || passwordForm.newPassword.length < 6) {
      setPasswordError('La nueva contraseña debe contener al menos 6 caracteres.');
      return;
    }
    if (passwordForm.newPassword === passwordForm.currentPassword) {
      setPasswordError('La nueva contraseña no puede ser idéntica a la contraseña actual.');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('La confirmación de la contraseña no coincide.');
      return;
    }

    setIsSubmittingPassword(true);
    try {
      const activeUser = getActiveUser();
      const identifier = activeUser?.email || activeUser?.username;
      const result = await projectsApi.changePassword({
        identifier,
        userId: activeUser?.id,
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
        confirmPassword: passwordForm.confirmPassword,
      });

      if (result?.session_token && onSessionTokenChange) {
        onSessionTokenChange(result.session_token);
      }

      setPasswordSuccess(true);
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (err) {
      console.error('Error al cambiar contraseña:', err);
      const msg =
        err.response?.data?.message ||
        (err.response?.data?.error ? String(err.response.data.error) : null) ||
        err.message ||
        'Error al cambiar la contraseña. Verifique que la contraseña actual sea la correcta.';
      setPasswordError(msg);
    } finally {
      setIsSubmittingPassword(false);
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileError('');

    const trimmedName = profileEditForm.name.trim();
    if (!trimmedName) {
      setProfileError('El nombre no puede estar vacío.');
      return;
    }

    const trimmedEmail = profileEditForm.email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!trimmedEmail) {
      setProfileError('El correo electrónico no puede estar vacío.');
      return;
    }
    if (!emailRegex.test(trimmedEmail)) {
      setProfileError('Ingrese un formato de correo electrónico válido (ej. usuario@gmail.com).');
      return;
    }

    setIsSubmittingProfile(true);
    const updatedPhone = profileEditForm.phone.trim();

    try {
      const activeUser = currentUser || {};
      const activeId = activeUser.db_id || activeUser.id;
      const activeIdentifier = activeUser.email || activeUser.username;

      if (projectsApi.updateProfile) {
        await projectsApi.updateProfile({
          userId: activeId,
          identifier: activeIdentifier,
          name: trimmedName,
          email: trimmedEmail,
          phone: updatedPhone,
          photo: userPhoto,
        });
      }

      setUserName(trimmedName);
      setUserPhone(updatedPhone);
      setUserEmail(trimmedEmail);

      if (onUpdateCurrentUser) {
        onUpdateCurrentUser({ name: trimmedName, phone: updatedPhone, email: trimmedEmail });
      } else {
        try {
          const stored = JSON.parse(localStorage.getItem('project_planner_user') || '{}');
          stored.name = trimmedName;
          stored.phone = updatedPhone;
          stored.email = trimmedEmail;
          localStorage.setItem('project_planner_user', JSON.stringify(stored));
        } catch {}
      }

      setProfileSuccess(true);
      setTimeout(() => {
        setProfileSuccess(false);
        setIsProfileModalOpen(false);
      }, 1200);
    } catch (err) {
      console.error('Error al actualizar perfil:', err);
      const msg =
        err.response?.data?.message ||
        (err.response?.data?.error ? String(err.response.data.error) : null) ||
        err.message ||
        'Error al guardar el perfil. Verifique los datos e intente nuevamente.';
      setProfileError(msg);
    } finally {
      setIsSubmittingProfile(false);
    }
  };

  const handleOpenEditProfile = () => {
    setProfileEditForm({
      name: userName || currentUser?.name || '',
      phone: userPhone || currentUser?.phone || '',
      email: userEmail || currentUser?.email || '',
    });
    setProfileError('');
    setProfileSuccess(false);
    setIsProfileModalOpen(true);
  };

  const handleOpenChangePassword = () => {
    setPasswordStep('current');
    setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setPasswordError('');
    setPasswordSuccess(false);
    setIsPasswordModalOpen(true);
  };

  return (
    <div className="p-6 sm:p-10 h-full overflow-y-auto w-full transition-colors duration-300 bg-slate-50 dark:bg-[#0d1117] midnight:bg-[#050B14]">
      {/* Cabecera */}
      <header className="mb-8">
        <h1 className="text-3xl font-bold mb-2 transition-colors duration-300 text-slate-900 dark:text-white midnight:text-cyan-50">
          Configuración del Sistema
        </h1>
        <p className="transition-colors duration-300 text-slate-500 dark:text-slate-400 midnight:text-cyan-500/70">
          Gestione las preferencias del sistema, perfiles de usuarios y directivas de seguridad global.
        </p>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
        {/* Columna Izquierda */}
        <div className="flex flex-col gap-6">
          <ProfileCard
            userPhoto={userPhoto}
            userName={userName}
            userEmail={userEmail}
            userPhone={userPhone}
            currentUser={currentUser}
            photoError={photoError}
            fileInputRef={fileInputRef}
            onPhotoChange={handlePhotoChange}
            onRemovePhoto={handleRemovePhoto}
            onOpenEditProfile={handleOpenEditProfile}
            onOpenChangePassword={handleOpenChangePassword}
            isSubAdmin={isSubAdmin}
          />

          {isAdmin && <ProjectParametersCard />}
          {isAdmin && <TechnicalTeamCard />}
          {!isAdmin && <SecurityPoliciesCard currentUser={currentUser} />}
        </div>

        {/* Columna Derecha */}
        <div className="flex flex-col gap-6">
          <PreferencesCard
            fontScale={fontScale}
            setFontScale={setFontScale}
            theme={theme}
            setTheme={setTheme}
          />

          {isAdmin && (
            <BackupAndSecurityCard
              lastBackup={lastBackup}
              setLastBackup={setLastBackup}
              currentUser={currentUser}
            />
          )}

          {isAdmin && (
            <AuditLogCard
              auditLogs={auditLogs}
              loadingAuditLogs={loadingAuditLogs}
              onRefresh={fetchAuditLogs}
            />
          )}
        </div>
      </div>

      {/* Modales */}
      <EditProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        onSubmit={handleProfileSubmit}
        form={profileEditForm}
        setForm={setProfileEditForm}
        error={profileError}
        success={profileSuccess}
        isSubmitting={isSubmittingProfile}
      />

      <ChangePasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        step={passwordStep}
        setStep={setPasswordStep}
        form={passwordForm}
        setForm={setPasswordForm}
        error={passwordError}
        setError={setPasswordError}
        success={passwordSuccess}
        isSubmitting={isSubmittingPassword}
        onVerifyCurrent={handleCurrentPasswordVerify}
        onSubmitNewPassword={handlePasswordSubmit}
      />
    </div>
  );
}
