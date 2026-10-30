import React, { useState, useEffect, useRef } from 'react';
import {
  Sun,
  Moon,
  MoonStar,
  KeyRound,
  Users,
  ArrowRight,
  X,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Lock,
  Camera,
  Trash2,
  UserPen,
  ShieldAlert,
  RotateCw,
  Clock,
} from 'lucide-react';
import projectsApi from '../../services/projectsApi';
import FormattedAuditText from '../../components/common/FormattedAuditText';

// Toggle independiente adaptado a los 3 temas y accesible
const Toggle = ({ enabled, onChange, label = 'Alternar ajuste' }) => (
  <button
    type="button"
    role="switch"
    aria-checked={enabled}
    aria-label={label}
    onClick={() => onChange(!enabled)}
    className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-cyan-500/40 ${
      enabled
        ? 'bg-emerald-500'
        : 'bg-slate-300 dark:bg-slate-600 midnight:bg-cyan-900/80'
    }`}
  >
    <div
      className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${
        enabled ? 'translate-x-5' : 'translate-x-0'
      }`}
    />
  </button>
);

const Configuration = ({
  currentUser,
  onUpdateCurrentUser,
  onSessionTokenChange,
  fontScale,
  setFontScale,
  theme,
  setTheme,
  users = [],
  onAddMember,
}) => {
  const [localUsers, setLocalUsers] = useState(users);

  useEffect(() => {
    setLocalUsers(users);
  }, [users]);

  // Estado de Perfil y Avatar estilo Discord
  const fileInputRef = useRef(null);
  const [userPhoto, setUserPhoto] = useState(currentUser?.photo || currentUser?.avatar || null);
  const [userName, setUserName] = useState(currentUser?.name || '');
  const [userPhone, setUserPhone] = useState(currentUser?.phone || '');
  const [userEmail, setUserEmail] = useState(currentUser?.email || '');
  const [photoError, setPhotoError] = useState('');

  // Sincronizar estado cuando cambie currentUser externamente
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

  // Bitácora de Auditoría para Administradores
  const [auditLogs, setAuditLogs] = useState([]);
  const [loadingAuditLogs, setLoadingAuditLogs] = useState(false);

  // Modales interactivos
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [passwordStep, setPasswordStep] = useState('current');
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);

  const [autoBackup, setAutoBackup] = useState(() => {
    try {
      const saved = localStorage.getItem('project_planner_auto_backup');
      return saved !== null ? saved === 'true' : true;
    } catch {
      return true;
    }
  });
  const [lastBackup, setLastBackup] = useState(() => {
    try {
      return localStorage.getItem('project_planner_last_backup') || 'Hoy a las 04:00 AM (Automático)';
    } catch {
      return 'Hoy a las 04:00 AM (Automático)';
    }
  });

  const updatePreference = (key, setter) => (val) => {
    setter(val);
    try {
      localStorage.setItem(key, String(val));
    } catch {
      // Ignorar error de almacenamiento
    }
  };

  const getActiveUser = () => {
    if (currentUser) return currentUser;
    try {
      return JSON.parse(localStorage.getItem('project_planner_user') || '{}');
    } catch {
      return {};
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
      setShowCurrentPassword(false);
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
      // Intentar actualizar vía API directamente para capturar validaciones de backend si el correo ya existe
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

  const handleExportData = () => {
    const now = new Date();
    const exportPayload = {
      sistema: 'Project Planner Enterprise',
      version: '2.0.0',
      fechaExportacion: now.toISOString(),
      solicitadoPor: currentUser?.name || currentUser?.username || 'Administrador',
      preferencias: {
        idioma: 'Español (ES)',
        zonaHoraria: 'GMT-5 (Lima)',
        tema: theme,
        escalaFuente: `${fontScale}%`,
        respaldoAutomatico: autoBackup,
      },
      usuarios: localUsers.map((u) => ({
        id: u.id,
        nombre: u.name,
        email: u.email,
        estado: u.isOnline ? 'Activo' : 'Inactivo',
      })),
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportPayload, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `backup_project_planner_${now.toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    const formattedDate = `Hoy a las ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} (Manual)`;
    setLastBackup(formattedDate);
    try {
      localStorage.setItem('project_planner_last_backup', formattedDate);
    } catch {
      // Ignorar error de almacenamiento
    }
  };

  const isAdmin =
    currentUser?.accountType === 'admin' ||
    currentUser?.isAdmin ||
    currentUser?.role === 'admin' ||
    Boolean(currentUser?.is_superuser);
  const isSubAdmin = currentUser?.roleLabel === 'SubAdministrador' || currentUser?.isSubAdmin;

  const fetchAuditLogs = async () => {
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
  };

  useEffect(() => {
    if (isAdmin) {
      fetchAuditLogs();
    }
  }, [isAdmin]);

  // Tarjeta de Preferencias del Sistema (Idiomas, Fuente, Notificaciones, Temas)
  const renderPreferencesCard = () => (
    <div className="border rounded-xl p-6 shadow-sm transition-colors duration-300 bg-white border-slate-200 dark:bg-[#161b22] dark:border-[#30363d] midnight:bg-[#0a1120] midnight:border-cyan-900/30">
      <h2 className="text-lg font-bold mb-6 text-slate-900 dark:text-white midnight:text-cyan-100">Preferencias del Sistema</h2>
      
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <p className="text-sm mb-1 text-slate-500 dark:text-slate-400 midnight:text-cyan-600">Idioma</p>
          <p className="text-slate-900 dark:text-slate-200 midnight:text-cyan-100">Español (ES)</p>
        </div>
        <div>
          <p className="text-sm mb-1 text-slate-500 dark:text-slate-400 midnight:text-cyan-600">Zona Horaria</p>
          <p className="text-slate-900 dark:text-slate-200 midnight:text-cyan-100">GMT-5 (Lima)</p>
        </div>
      </div>

      {/* Widget Tamaño de Letra */}
      <div className="rounded-lg p-5 mb-6 border transition-colors duration-300 bg-slate-50 border-slate-200 dark:bg-[#0d1117] dark:border-[#30363d] midnight:bg-[#050B14] midnight:border-cyan-900/40">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-serif text-lg font-bold text-cyan-600 dark:text-cyan-400 midnight:text-cyan-500">T</span>
          <h3 className="text-sm font-medium text-slate-900 dark:text-white midnight:text-cyan-100">Tamaño de letra</h3>
        </div>
        <p className="text-xs mb-4 text-slate-500 dark:text-slate-400 midnight:text-cyan-600/70">Ajusta toda la interfaz sin modificar el logo.</p>
        
        <div className="flex items-center gap-3 mb-4">
          <button 
            onClick={() => setFontScale(prev => Math.max(85, prev - 5))}
            className="w-10 h-10 rounded-lg border flex items-center justify-center text-xl transition-colors border-slate-300 text-slate-600 hover:bg-slate-200 dark:border-[#30363d] dark:text-slate-300 dark:hover:bg-white/5 midnight:border-cyan-800 midnight:text-cyan-400 midnight:hover:bg-cyan-900/40"
          >−</button>
          <div className="flex-1 h-10 rounded-lg border flex items-center justify-center font-bold transition-colors border-cyan-200 bg-cyan-50 text-cyan-700 dark:border-cyan-400/30 dark:bg-cyan-500/10 dark:text-cyan-400 midnight:border-cyan-500/50 midnight:bg-cyan-900/20 midnight:text-cyan-300">
            {fontScale}%
          </div>
          <button 
            onClick={() => setFontScale(prev => Math.min(120, prev + 5))}
            className="w-10 h-10 rounded-lg border flex items-center justify-center text-xl transition-colors border-slate-300 text-slate-600 hover:bg-slate-200 dark:border-[#30363d] dark:text-slate-300 dark:hover:bg-white/5 midnight:border-cyan-800 midnight:text-cyan-400 midnight:hover:bg-cyan-900/40"
          >+</button>
        </div>
        
        <input 
          type="range" 
          min="85" max="120" step="5"
          value={fontScale}
          onChange={(e) => setFontScale(Number(e.target.value))}
          className="w-full h-1 rounded-lg appearance-none cursor-pointer accent-cyan-500 mb-4 bg-slate-300 dark:bg-slate-600 midnight:bg-cyan-900"
        />
        
        <button 
          onClick={() => setFontScale(100)}
          className="w-full text-xs flex items-center justify-center gap-2 transition-colors text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white midnight:text-cyan-600 midnight:hover:text-cyan-300"
        >
          ↻ Restablecer al 100%
        </button>
      </div>

      {/* === SELECTOR DE TEMAS (CLARO, OSCURO, MEDIANOCHE) === */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center pt-2 gap-3 border-t border-slate-200 dark:border-[#30363d] midnight:border-cyan-900/30">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300 midnight:text-cyan-200">Tema de Interfaz</span>
          <div className="grid grid-cols-3 w-full sm:w-80 gap-1 p-1 rounded-lg border transition-colors bg-slate-100 border-slate-300 dark:bg-[#0d1117] dark:border-[#30363d] midnight:bg-cyan-950 midnight:border-cyan-800/40">
            <button 
              type="button"
              onClick={() => setTheme('light')}
              className={`flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium border transition-all ${
                theme === 'light' 
                  ? 'bg-white text-slate-900 shadow-sm border-slate-200' 
                  : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white midnight:text-cyan-600 midnight:hover:text-cyan-400 border-transparent'
              }`}
            >
              <Sun size={14} className="shrink-0" /> <span>Claro</span>
            </button>
            <button 
              type="button"
              onClick={() => setTheme('dark')}
              className={`flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium border transition-all ${
                theme === 'dark' 
                  ? 'bg-cyan-500 text-white shadow-md border-cyan-400' 
                  : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white midnight:text-cyan-600 midnight:hover:text-cyan-400 border-transparent'
              }`}
            >
              <Moon size={14} className="shrink-0" /> <span>Oscuro</span>
            </button>
            <button 
              type="button"
              onClick={() => setTheme('midnight')}
              className={`flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium border transition-all ${
                theme === 'midnight' 
                  ? 'bg-cyan-600 text-white shadow-md border-cyan-500' 
                  : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white midnight:text-cyan-600 midnight:hover:text-cyan-400 border-transparent'
              }`}
            >
              <MoonStar size={14} className="shrink-0" /> <span>Medianoche</span>
            </button>
          </div>
        </div>
      </div>
  );

  return (
    <div className="p-6 sm:p-10 h-full overflow-y-auto w-full transition-colors duration-300 bg-slate-50 dark:bg-[#0d1117] midnight:bg-[#050B14]">
      
      {/* Cabecera */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 transition-colors duration-300 text-slate-900 dark:text-white midnight:text-cyan-50">Configuración del Sistema</h1>
        <p className="transition-colors duration-300 text-slate-500 dark:text-slate-400 midnight:text-cyan-500/70">Gestione las preferencias del sistema, perfiles de usuarios y directivas de seguridad global.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
        
        {/* ================= COLUMNA IZQUIERDA ================= */}
        <div className="flex flex-col gap-6">
          
          {/* Perfil de Usuario */}
          <div className="border rounded-xl p-6 shadow-sm transition-colors duration-300 bg-white border-slate-200 dark:bg-[#161b22] dark:border-[#30363d] midnight:bg-[#0a1120] midnight:border-cyan-900/30">
            <h2 className="text-lg font-bold mb-6 text-slate-900 dark:text-white midnight:text-cyan-100">Perfil de Usuario</h2>

            {photoError && (
              <div className="mb-4 p-3 rounded-lg flex items-center gap-2 text-xs bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400">
                <AlertCircle size={15} className="shrink-0" />
                <span>{photoError}</span>
              </div>
            )}

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                {/* Avatar interactivo estilo Discord */}
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

                  {/* Hover Overlay estilo Discord */}
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
                    onChange={handlePhotoChange}
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
                  
                  {/* Botón sutil para eliminar foto cuando existe */}
                  {userPhoto && (
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      className="mt-1 inline-flex items-center gap-1 text-xs text-rose-500 hover:text-rose-600 dark:text-rose-400 dark:hover:text-rose-300 midnight:text-rose-400 font-medium cursor-pointer transition-colors"
                    >
                      <Trash2 size={12} />
                      <span>Eliminar foto</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => {
                    setProfileEditForm({
                      name: userName || currentUser?.name || '',
                      phone: userPhone || currentUser?.phone || '',
                      email: userEmail || currentUser?.email || '',
                    });
                    setProfileError('');
                    setProfileSuccess(false);
                    setIsProfileModalOpen(true);
                  }}
                  className="bg-transparent border px-3.5 py-2 rounded-lg text-sm font-medium transition-colors border-slate-300 text-slate-700 hover:bg-slate-50 dark:border-[#30363d] dark:text-slate-300 dark:hover:bg-white/5 midnight:border-cyan-800 midnight:text-cyan-300 midnight:hover:bg-cyan-900/20 cursor-pointer inline-flex items-center gap-1.5"
                >
                  <UserPen size={14} />
                  <span>Editar Perfil</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setPasswordStep('current');
                    setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
                    setShowCurrentPassword(false);
                    setShowNewPassword(false);
                    setShowConfirmPassword(false);
                    setPasswordError('');
                    setPasswordSuccess(false);
                    setIsPasswordModalOpen(true);
                  }}
                  className="bg-transparent border px-3.5 py-2 rounded-lg text-sm font-medium transition-colors border-slate-300 text-slate-700 hover:bg-slate-50 dark:border-[#30363d] dark:text-slate-300 dark:hover:bg-white/5 midnight:border-cyan-800 midnight:text-cyan-300 midnight:hover:bg-cyan-900/20 cursor-pointer inline-flex items-center gap-1.5"
                >
                  <KeyRound size={14} />
                  <span>Cambiar Contraseña</span>
                </button>
              </div>
            </div>

            {/* Credenciales y estado de cuenta */}
            <div className="mt-6 pt-6 border-t border-slate-200 dark:border-[#30363d] midnight:border-cyan-900/30 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 midnight:text-cyan-600">Correo Electrónico</p>
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200 midnight:text-cyan-100 truncate">
                  {userEmail || currentUser?.email || currentUser?.username || 'Sin correo registrado'}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 midnight:text-cyan-600">Teléfono de Contacto</p>
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200 midnight:text-cyan-100">
                  {userPhone || 'No registrado'}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 midnight:text-cyan-600">Estado de Cuenta</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400 midnight:text-emerald-300">Activo / En línea</span>
                </div>
              </div>
            </div>

            {/* Badge distintivo para SubAdministrador */}
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
          </div>

          {/* Parámetros Globales del Proyecto (SOLO ADMIN - Conforme a project_planner_architecture.pdf) */}
          {isAdmin && (
            <div className="border rounded-xl p-6 shadow-sm transition-colors duration-300 bg-white border-slate-200 dark:bg-[#161b22] dark:border-[#30363d] midnight:bg-[#0a1120] midnight:border-cyan-900/30">
              <h2 className="text-lg font-bold mb-4 text-slate-900 dark:text-white midnight:text-cyan-100">Parámetros del Proyecto</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs mb-1 text-slate-500 dark:text-slate-400 midnight:text-cyan-600">Moneda Base</p>
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-200 midnight:text-cyan-100">USD ($)</p>
                </div>
                <div>
                  <p className="text-xs mb-1 text-slate-500 dark:text-slate-400 midnight:text-cyan-600">Año Fiscal</p>
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-200 midnight:text-cyan-100">2026 (Ene - Dic)</p>
                </div>
                <div>
                  <p className="text-xs mb-1 text-slate-500 dark:text-slate-400 midnight:text-cyan-600">Margen de Tolerancia</p>
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-200 midnight:text-cyan-100">7 días calendario</p>
                </div>
                <div>
                  <p className="text-xs mb-1 text-slate-500 dark:text-slate-400 midnight:text-cyan-600">Motor de Optimización</p>
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-200 midnight:text-cyan-100">Rendimiento M²/día</p>
                </div>
              </div>
            </div>
          )}

          {/* Acceso a Equipo Técnico (SOLO ADMIN - Centralizado según Arquitectura 2.4 y 2.5) */}
          {isAdmin && (
            <div className="border rounded-xl p-6 shadow-sm transition-colors duration-300 bg-white border-slate-200 dark:bg-[#161b22] dark:border-[#30363d] midnight:bg-[#0a1120] midnight:border-cyan-900/30">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-600 dark:text-cyan-400 midnight:text-cyan-300 flex items-center justify-center">
                  <Users size={20} />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white midnight:text-cyan-100">
                    Directorio y Equipo Técnico
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 midnight:text-cyan-500/80">
                    Módulos 2.4 y 2.5 de Arquitectura
                  </p>
                </div>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 midnight:text-cyan-100/70 mb-4 leading-relaxed">
                El alta de especialistas, asignación a proyectos, áreas técnicas (Arquitectura, Estructuras, Sistemas) y disponibilidad se gestionan centralizadamente en la nómina técnica.
              </p>
              <a
                href="/technical-team"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-colors shadow-sm cursor-pointer"
              >
                <span>Gestionar Nómina en Equipo Técnico</span>
                <ArrowRight size={14} />
              </a>
            </div>
          )}

          {/* Para Técnico / No-Admin: Tarjeta de Seguridad y Asignación Operativa */}
          {!isAdmin && (
            <div className="border rounded-xl p-6 shadow-sm transition-colors duration-300 bg-white border-slate-200 dark:bg-[#161b22] dark:border-[#30363d] midnight:bg-[#0a1120] midnight:border-cyan-900/30">
              <h2 className="text-lg font-bold mb-4 text-slate-900 dark:text-white midnight:text-cyan-100">Seguridad y Políticas</h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-600 dark:text-slate-400 midnight:text-cyan-100/70">Nivel de Acceso</span>
                  <span className="font-semibold text-slate-900 dark:text-slate-200 midnight:text-cyan-100">
                    {currentUser?.roleLabel || 'Equipo Técnico'}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-600 dark:text-slate-400 midnight:text-cyan-100/70">Autenticación</span>
                  <span className="text-xs font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 midnight:bg-cyan-900/30 midnight:text-cyan-300">
                    Token JWT Seguro
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-600 dark:text-slate-400 midnight:text-cyan-100/70">Asignación Operativa</span>
                  <span className="text-xs font-medium text-cyan-600 dark:text-cyan-400 midnight:text-cyan-300">
                    {currentUser?.area || currentUser?.technicalArea || 'Especialista Técnico'}
                  </span>
                </div>
                <div className="pt-3 border-t border-slate-200 dark:border-[#30363d] midnight:border-cyan-900/30 flex items-center justify-between text-xs">
                  <span className="text-slate-500 dark:text-slate-400 midnight:text-cyan-600">Sesión actual</span>
                  <span className="text-emerald-600 dark:text-emerald-400 midnight:text-emerald-300 font-medium">Activa en este dispositivo</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ================= COLUMNA DERECHA ================= */}
        <div className="flex flex-col gap-6">
          {/* Preferencias del Sistema (Disponible para todos) */}
          {renderPreferencesCard()}

          {/* Respaldo y Seguridad (SOLO ADMIN - Gobernanza global) */}
          {isAdmin && (
            <div className="border rounded-xl p-6 shadow-sm transition-colors duration-300 bg-white border-slate-200 dark:bg-[#161b22] dark:border-[#30363d] midnight:bg-[#0a1120] midnight:border-cyan-900/30">
              <h2 className="text-lg font-bold mb-6 text-slate-900 dark:text-white midnight:text-cyan-100">Respaldo y Seguridad</h2>
              
              <div className="flex justify-between items-center mb-6">
                <div>
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-200 midnight:text-cyan-100/80">Último Respaldo Exitoso</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 midnight:text-cyan-500/80 mt-0.5">{lastBackup}</p>
                </div>
                <button
                  type="button"
                  onClick={handleExportData}
                  className="bg-transparent border px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border-slate-300 text-slate-600 hover:bg-slate-50 dark:border-[#30363d] dark:text-slate-300 dark:hover:bg-white/5 midnight:border-cyan-800 midnight:text-cyan-400 midnight:hover:bg-cyan-900/20 cursor-pointer"
                >
                  Exportar Datos
                </button>
              </div>

              <div className="flex justify-between items-center mb-6">
                <span className="text-sm text-slate-600 dark:text-slate-300 midnight:text-cyan-100/70">Respaldo Diario Automático</span>
                <Toggle enabled={autoBackup} onChange={updatePreference('project_planner_auto_backup', setAutoBackup)} />
              </div>

              {/* Consola de estado del sistema */}
              <div className="p-4 rounded-lg font-mono text-xs space-y-2 mt-4 border transition-colors bg-slate-50 border-slate-200 text-slate-600 dark:bg-[#0d1117] dark:border-[#30363d] dark:text-slate-400 midnight:bg-[#050B14] midnight:border-cyan-900/40 midnight:text-cyan-600">
                <p><span className="font-bold text-emerald-600 dark:text-emerald-400 midnight:text-emerald-400">SISTEMA ·</span> Servicio de respaldo y persistencia activo.</p>
                <p><span className="font-bold text-cyan-600 dark:text-cyan-400 midnight:text-cyan-400">SESIÓN ·</span> Conexión activa para <strong className="font-bold text-slate-900 dark:text-white midnight:text-cyan-100">{currentUser?.name || currentUser?.username || 'Administrador'}</strong> ({currentUser?.roleLabel || 'Admin'}).</p>
                <p><span className="font-bold text-slate-600 dark:text-slate-300 midnight:text-cyan-400">SEGURIDAD ·</span> Políticas de control de acceso y tokens verificados.</p>
              </div>
            </div>
          )}

          {/* Bitácora de Auditoría de Seguridad (SOLO ADMIN) */}
          {isAdmin && (
            <div className="border rounded-xl p-6 shadow-sm transition-colors duration-300 bg-white border-slate-200 dark:bg-[#161b22] dark:border-[#30363d] midnight:bg-[#0a1120] midnight:border-cyan-900/30">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-600 dark:text-cyan-400 midnight:text-cyan-300 flex items-center justify-center">
                    <ShieldAlert size={20} />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900 dark:text-white midnight:text-cyan-100">
                      Bitácora de Auditoría
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 midnight:text-cyan-500/80">
                      Supervisión de cambios de correo, contraseñas y accesos
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={fetchAuditLogs}
                  disabled={loadingAuditLogs}
                  title="Actualizar bitácora"
                  className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 dark:border-[#30363d] dark:hover:bg-white/5 midnight:border-cyan-800 midnight:hover:bg-cyan-900/20 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white midnight:text-cyan-400 transition-colors cursor-pointer"
                >
                  <RotateCw size={14} className={loadingAuditLogs ? 'animate-spin' : ''} />
                </button>
              </div>

              {auditLogs.length === 0 ? (
                <div className="text-center py-6 border rounded-lg border-dashed border-slate-200 dark:border-[#30363d] midnight:border-cyan-900/40 text-xs text-slate-500 dark:text-slate-400 midnight:text-cyan-600">
                  <Clock size={20} className="mx-auto mb-2 opacity-50" />
                  No hay eventos de auditoría registrados recientemente.
                </div>
              ) : (
                <div className="max-h-64 overflow-y-auto space-y-2.5 pr-1 divide-y divide-slate-100 dark:divide-[#30363d]/50 midnight:divide-cyan-900/20">
                  {auditLogs.map((log) => (
                    <div key={log.id} className="pt-2.5 first:pt-0 flex items-start justify-between gap-3 text-xs">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-800 dark:text-slate-200 midnight:text-cyan-100 truncate">
                            {log.userName}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-50 border border-cyan-200 text-cyan-700 dark:bg-cyan-500/10 dark:border-cyan-500/20 dark:text-cyan-300 midnight:bg-cyan-950 midnight:border-cyan-800/40 midnight:text-cyan-400 font-mono">
                            {log.actionDisplay || log.action}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 dark:text-slate-300 midnight:text-cyan-300/80 mt-0.5 break-words">
                          <FormattedAuditText text={log.description} />
                        </p>
                      </div>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 midnight:text-cyan-600 shrink-0 whitespace-nowrap">
                        {log.dateFormatted || log.createdAt}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* MODAL: CAMBIAR CONTRASEÑA */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="w-full max-w-md rounded-2xl border p-6 shadow-2xl relative animate-in zoom-in-95 duration-200 transition-colors bg-white border-slate-200 dark:bg-[#161b22] dark:border-[#30363d] midnight:bg-[#0a1120] midnight:border-cyan-900/50"
            role="dialog"
            aria-modal="true"
            aria-labelledby="change-password-title"
          >
            <button
              type="button"
              onClick={() => setIsPasswordModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white midnight:hover:text-cyan-300 transition-colors cursor-pointer"
              aria-label="Cerrar modal"
            >
              <X size={18} />
            </button>

            {passwordSuccess ? (
              <div className="text-center py-4 space-y-4">
                <div className="mx-auto w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 flex items-center justify-center shadow-sm">
                  <CheckCircle2 size={28} />
                </div>
                <h3 id="change-password-title" className="text-lg font-bold text-slate-900 dark:text-white midnight:text-cyan-50">
                  ¡Contraseña Actualizada!
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 midnight:text-cyan-400 leading-relaxed">
                  Su contraseña ha sido modificada satisfactoriamente. Sus credenciales han sido sincronizadas en el sistema de seguridad.
                </p>
                <button
                  type="button"
                  onClick={() => setIsPasswordModalOpen(false)}
                  className="w-full mt-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold py-2.5 rounded-lg text-xs transition-colors cursor-pointer"
                >
                  Aceptar y Volver
                </button>
              </div>
            ) : (
              <form
                onSubmit={passwordStep === 'current' ? handleCurrentPasswordVerify : handlePasswordSubmit}
                className="space-y-4"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-600 dark:text-cyan-400 midnight:text-cyan-300 flex items-center justify-center">
                    <KeyRound size={20} />
                  </div>
                  <div>
                    <h3 id="change-password-title" className="text-base font-bold text-slate-900 dark:text-white midnight:text-cyan-50">
                      Cambiar Contraseña
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 midnight:text-cyan-500/80">
                      {passwordStep === 'current'
                        ? 'Primero verifique su contraseña actual'
                        : 'Ingrese y confirme su nueva clave de acceso'}
                    </p>
                  </div>
                </div>

                {passwordStep === 'current' && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-700 dark:text-slate-300 midnight:text-cyan-200">
                      Contraseña actual
                    </label>
                    <div className="relative">
                      <input
                        type={showCurrentPassword ? 'text' : 'password'}
                        value={passwordForm.currentPassword}
                        onChange={(e) => setPasswordForm((prev) => ({ ...prev, currentPassword: e.target.value }))}
                        required
                        autoFocus
                        placeholder="••••••••"
                        className="w-full rounded-lg border px-3 py-2 text-xs transition-colors pr-10 bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-cyan-500 dark:bg-[#0d1117] dark:border-[#30363d] dark:text-white dark:placeholder-slate-500 dark:focus:border-cyan-400 midnight:bg-[#050B14] midnight:border-cyan-900/60 midnight:text-cyan-100"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        aria-label={showCurrentPassword ? 'Ocultar contraseña actual' : 'Mostrar contraseña actual'}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 midnight:hover:text-cyan-300 cursor-pointer"
                      >
                        {showCurrentPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </div>
                )}

                {passwordStep === 'new' && (
                  <>
                    <div className="flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 size={14} className="shrink-0" />
                      <span>Contraseña actual verificada</span>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-slate-700 dark:text-slate-300 midnight:text-cyan-200">
                        Nueva contraseña
                      </label>
                      <div className="relative">
                        <input
                          type={showNewPassword ? 'text' : 'password'}
                          value={passwordForm.newPassword}
                          onChange={(e) => setPasswordForm((prev) => ({ ...prev, newPassword: e.target.value }))}
                          required
                          autoFocus
                          placeholder="Mínimo 6 caracteres"
                          className="w-full rounded-lg border px-3 py-2 text-xs transition-colors pr-10 bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-cyan-500 dark:bg-[#0d1117] dark:border-[#30363d] dark:text-white dark:placeholder-slate-500 dark:focus:border-cyan-400 midnight:bg-[#050B14] midnight:border-cyan-900/60 midnight:text-cyan-100"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          aria-label={showNewPassword ? 'Ocultar nueva contraseña' : 'Mostrar nueva contraseña'}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 midnight:hover:text-cyan-300 cursor-pointer"
                        >
                          {showNewPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-slate-700 dark:text-slate-300 midnight:text-cyan-200">
                        Repetir nueva contraseña
                      </label>
                      <div className="relative">
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          value={passwordForm.confirmPassword}
                          onChange={(e) => setPasswordForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                          required
                          placeholder="Repita la nueva contraseña"
                          className="w-full rounded-lg border px-3 py-2 text-xs transition-colors pr-10 bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-cyan-500 dark:bg-[#0d1117] dark:border-[#30363d] dark:text-white dark:placeholder-slate-500 dark:focus:border-cyan-400 midnight:bg-[#050B14] midnight:border-cyan-900/60 midnight:text-cyan-100"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          aria-label={showConfirmPassword ? 'Ocultar confirmación de contraseña' : 'Mostrar confirmación de contraseña'}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 midnight:hover:text-cyan-300 cursor-pointer"
                        >
                          {showConfirmPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      </div>
                    </div>
                  </>
                )}

                {passwordError && (
                  <div className="p-2.5 rounded-lg text-xs flex items-start gap-2 bg-red-50 border border-red-200 text-red-600 dark:bg-red-500/10 dark:border-red-500/20 dark:text-red-400 midnight:bg-red-950/40 midnight:border-red-500/30">
                    <AlertCircle size={14} className="shrink-0 mt-0.5" />
                    <span>{passwordError}</span>
                  </div>
                )}

                <div className="flex gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (passwordStep === 'new') {
                        setPasswordStep('current');
                        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
                        setPasswordError('');
                        setShowNewPassword(false);
                        setShowConfirmPassword(false);
                      } else {
                        setIsPasswordModalOpen(false);
                      }
                    }}
                    className="flex-1 bg-transparent border border-slate-300 text-slate-600 hover:bg-slate-50 dark:border-[#30363d] dark:text-slate-300 dark:hover:bg-white/5 midnight:border-cyan-800 midnight:text-cyan-400 py-2 rounded-lg text-xs font-medium cursor-pointer transition-colors"
                  >
                    {passwordStep === 'new' ? 'Volver' : 'Cancelar'}
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingPassword}
                    className="flex-1 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold py-2 rounded-lg text-xs transition-colors cursor-pointer shadow-sm disabled:opacity-60 disabled:cursor-wait"
                  >
                    {isSubmittingPassword
                      ? (passwordStep === 'current' ? 'Verificando...' : 'Actualizando...')
                      : (passwordStep === 'current' ? 'Verificar y Continuar' : 'Actualizar Clave')}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Modal de Edición de Perfil */}
      {isProfileModalOpen && (
        <div
          role="presentation"
          onMouseDown={() => setIsProfileModalOpen(false)}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-profile-title"
            onMouseDown={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl border p-6 shadow-2xl transition-colors duration-300 bg-white border-slate-200 dark:bg-[#161b22] dark:border-[#30363d] midnight:bg-[#0a1120] midnight:border-cyan-900/40"
          >
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-[#30363d] midnight:border-cyan-900/30">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-600 dark:text-cyan-400 midnight:text-cyan-300 flex items-center justify-center">
                  <UserPen size={20} />
                </div>
                <div>
                  <h3 id="edit-profile-title" className="text-base font-bold text-slate-900 dark:text-white midnight:text-cyan-50">
                    Editar Perfil
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 midnight:text-cyan-500/80">
                    Actualice sus datos de identidad y contacto
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsProfileModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:text-slate-400 dark:hover:text-white midnight:hover:text-cyan-300 transition-colors p-1 rounded-md"
              >
                <X size={18} />
              </button>
            </div>

            {profileSuccess ? (
              <div className="py-6 flex flex-col items-center text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                  <CheckCircle2 size={28} />
                </div>
                <h4 className="text-base font-bold text-slate-900 dark:text-white midnight:text-cyan-50">
                  ¡Perfil Actualizado!
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 midnight:text-cyan-400">
                  Sus datos han sido guardados y sincronizados correctamente en el sistema.
                </p>
              </div>
            ) : (
              <form onSubmit={handleProfileSubmit} className="mt-5 space-y-4">
                {profileError && (
                  <div className="p-2.5 rounded-lg text-xs flex items-start gap-2 bg-red-50 border border-red-200 text-red-600 dark:bg-red-500/10 dark:border-red-500/20 dark:text-red-400 midnight:bg-red-950/40 midnight:border-red-500/30">
                    <AlertCircle size={14} className="shrink-0 mt-0.5" />
                    <span>{profileError}</span>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300 midnight:text-cyan-200">
                    Nombre Completo / Mostrar como <span className="text-cyan-600 dark:text-cyan-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={80}
                    value={profileEditForm.name}
                    onChange={(e) => setProfileEditForm((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="Ej. Carlos Mendoza"
                    className="w-full rounded-lg border px-3 py-2 text-xs transition-colors bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-cyan-500 dark:bg-[#0d1117] dark:border-[#30363d] dark:text-white dark:placeholder-slate-500 dark:focus:border-cyan-400 midnight:bg-[#050B14] midnight:border-cyan-900/60 midnight:text-cyan-100"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300 midnight:text-cyan-200">
                    Teléfono de Contacto (Opcional)
                  </label>
                  <input
                    type="tel"
                    maxLength={30}
                    value={profileEditForm.phone}
                    onChange={(e) => setProfileEditForm((prev) => ({ ...prev, phone: e.target.value }))}
                    placeholder="Ej. +51 987 654 321"
                    className="w-full rounded-lg border px-3 py-2 text-xs transition-colors bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-cyan-500 dark:bg-[#0d1117] dark:border-[#30363d] dark:text-white dark:placeholder-slate-500 dark:focus:border-cyan-400 midnight:bg-[#050B14] midnight:border-cyan-900/60 midnight:text-cyan-100"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300 midnight:text-cyan-200">
                    Correo Electrónico (Gmail, Outlook u otro) <span className="text-cyan-600 dark:text-cyan-400">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    maxLength={120}
                    value={profileEditForm.email}
                    onChange={(e) => setProfileEditForm((prev) => ({ ...prev, email: e.target.value }))}
                    placeholder="nombre@gmail.com"
                    className="w-full rounded-lg border px-3 py-2 text-xs transition-colors bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-cyan-500 dark:bg-[#0d1117] dark:border-[#30363d] dark:text-white dark:placeholder-slate-500 dark:focus:border-cyan-400 midnight:bg-[#050B14] midnight:border-cyan-900/60 midnight:text-cyan-100"
                  />
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 midnight:text-cyan-600">
                    Se utilizará para iniciar sesión. Todo cambio de correo queda registrado en la bitácora de auditoría para el administrador.
                  </p>
                </div>

                <div className="flex gap-2.5 pt-3 border-t border-slate-200 dark:border-[#30363d] midnight:border-cyan-900/30">
                  <button
                    type="button"
                    onClick={() => setIsProfileModalOpen(false)}
                    className="flex-1 bg-transparent border border-slate-300 text-slate-600 hover:bg-slate-50 dark:border-[#30363d] dark:text-slate-300 dark:hover:bg-white/5 midnight:border-cyan-800 midnight:text-cyan-400 py-2 rounded-lg text-xs font-medium cursor-pointer transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingProfile}
                    className="flex-1 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold py-2 rounded-lg text-xs transition-colors cursor-pointer shadow-sm disabled:opacity-60"
                  >
                    {isSubmittingProfile ? 'Guardando...' : 'Guardar Cambios'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Configuration;
