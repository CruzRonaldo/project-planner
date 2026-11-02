import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { USER_ROLES } from '../config/navigation.config';
import { projectsApi } from '../services/projectsApi';
import { useCrossTabListener } from '../utils/useCrossTabListener';

/**
 * Genera un nombre presentable a partir del correo si no se proporciona uno explícito.
 * @param {string} email
 * @returns {string}
 */
export function createNameFromEmail(email) {
  if (!email || typeof email !== 'string') return 'Usuario Técnico';
  const baseName = email
    .split('@')[0]
    .replace(/[._-]+/g, ' ')
    .trim();
  return (
    baseName
      .split(' ')
      .filter(Boolean)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ') || 'Usuario Técnico'
  );
}

/**
 * Controlador especializado en Autenticación, Sesión y Perfil de Usuario.
 * Desacopla la lógica de identidad, 2FA, validación de token y permisos del controlador general.
 *
 * @param {Object} [options]
 * @param {Array} [options.users=[]] - Lista del directorio de usuarios para resolver roles complementarios
 * @param {Function} [options.setUsers] - Despachador opcional para actualizar el usuario dentro del directorio
 * @param {Function} [options.onSessionExpired] - Callback opcional al invalidarse la sesión
 * @returns {Object} Estado de autenticación, usuario formateado y métodos de sesión
 */
export function useAuthController({
  users = [],
  setUsers,
  onSessionExpired,
} = {}) {
  let navigate = null;
  try {
    navigate = useNavigate();
  } catch {
    navigate = () => {};
  }

  // Estado de carga inicial: true mientras se valida la sesión persistida con el backend
  const [isInitializing, setIsInitializing] = useState(() => {
    try {
      const saved = localStorage.getItem('project_planner_user');
      if (!saved || saved === 'null' || saved === 'undefined') return false;
      const parsed = JSON.parse(saved);
      return Boolean(parsed && typeof parsed === 'object');
    } catch {
      return false;
    }
  });

  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('project_planner_user');
      if (!saved || saved === 'null' || saved === 'undefined') return null;
      const parsed = JSON.parse(saved);
      return parsed && typeof parsed === 'object' ? parsed : null;
    } catch {
      return null;
    }
  });

  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    try {
      const saved = localStorage.getItem('project_planner_user');
      if (!saved || saved === 'null' || saved === 'undefined') return false;
      const parsed = JSON.parse(saved);
      return Boolean(parsed && typeof parsed === 'object');
    } catch {
      return false;
    }
  });

  const [sessionToken, setSessionToken] = useState(() => {
    try {
      return (
        localStorage.getItem('project_planner_session_token') ||
        currentUser?.session_token ||
        null
      );
    } catch {
      return null;
    }
  });

  // Vincula el usuario en sesión con el registro del directorio para leer estados como isSubAdmin
  const registeredCurrentUser = useMemo(() => {
    if (currentUser?.accountType !== USER_ROLES.USER) return null;
    return (
      users.find(
        (user) =>
          user.id === currentUser.id ||
          (user.email &&
            currentUser.email &&
            user.email.toLowerCase() === currentUser.email.toLowerCase())
      ) || null
    );
  }, [currentUser, users]);

  // Usuario enriquecido con fotos, roles legibles y valores por defecto tolerantes
  const displayedCurrentUser = useMemo(() => {
    if (!currentUser) return null;
    return {
      ...currentUser,
      photo:
        currentUser.photo ||
        currentUser.avatar ||
        registeredCurrentUser?.avatar ||
        registeredCurrentUser?.photo ||
        null,
      phone: currentUser.phone || registeredCurrentUser?.phone || '',
      name:
        currentUser.name ||
        (currentUser.first_name
          ? `${currentUser.first_name} ${currentUser.last_name || ''}`.trim()
          : currentUser.username ||
            registeredCurrentUser?.name ||
            'Usuario'),
      roleLabel:
        currentUser.role === USER_ROLES.ADMIN ||
        currentUser.is_superuser ||
        currentUser.accountType === USER_ROLES.ADMIN
          ? 'Project Manager'
          : registeredCurrentUser?.isSubAdmin
            ? 'SubAdministrador'
            : 'Equipo Técnico',
    };
  }, [currentUser, registeredCurrentUser]);

  const isAdmin =
    displayedCurrentUser?.accountType === USER_ROLES.ADMIN ||
    displayedCurrentUser?.role === USER_ROLES.ADMIN ||
    Boolean(displayedCurrentUser?.is_superuser);

  const isSubAdmin =
    displayedCurrentUser?.roleLabel === 'SubAdministrador' ||
    Boolean(registeredCurrentUser?.isSubAdmin);

  const canManage = isAdmin || isSubAdmin;

  // Limpieza segura del almacenamiento local y estados en memoria
  const clearLocalSession = useCallback(() => {
    try {
      localStorage.removeItem('project_planner_user');
      localStorage.removeItem('project_planner_token');
      localStorage.removeItem('project_planner_session_token');
    } catch {}

    setCurrentUser(null);
    setIsAuthenticated(false);
    setSessionToken(null);
    if (onSessionExpired) {
      onSessionExpired();
    }
    navigate?.('/login', { replace: true });
  }, [navigate, onSessionExpired]);

  // Actualización del Session Token emitido por el backend
  const handleSessionTokenChange = useCallback((newSessionToken) => {
    if (!newSessionToken) return;

    let storedUser = null;
    try {
      localStorage.setItem('project_planner_session_token', newSessionToken);
      storedUser = JSON.parse(localStorage.getItem('project_planner_user') || 'null');
      if (storedUser) {
        localStorage.setItem(
          'project_planner_user',
          JSON.stringify({ ...storedUser, session_token: newSessionToken })
        );
      }
    } catch {}

    setSessionToken(newSessionToken);
    setCurrentUser((previousUser) => {
      const activeUser = previousUser || storedUser;
      return activeUser ? { ...activeUser, session_token: newSessionToken } : previousUser;
    });
  }, []);

  // Inicio de sesión exitoso
  const handleLogin = useCallback(
    (userData) => {
      const accountType =
        userData?.role === USER_ROLES.ADMIN ||
        userData?.is_superuser ||
        userData?.accountType === USER_ROLES.ADMIN
          ? USER_ROLES.ADMIN
          : USER_ROLES.USER;

      const identifier = (userData?.email || userData?.username || '').toLowerCase();
      let cachedProfile = null;
      try {
        const raw = localStorage.getItem(`project_planner_profile_${identifier}`);
        if (raw) cachedProfile = JSON.parse(raw);
      } catch {}

      const userPhoto =
        userData?.photo ||
        userData?.avatar ||
        cachedProfile?.photo ||
        cachedProfile?.avatar ||
        null;
      const userPhone = userData?.phone || cachedProfile?.phone || '';

      const userToSave = {
        ...userData,
        accountType,
        photo: userPhoto,
        avatar: userPhoto,
        phone: userPhone,
        name:
          userData?.name ||
          cachedProfile?.name ||
          (userData?.first_name
            ? `${userData.first_name} ${userData.last_name || ''}`.trim()
            : userData?.username ||
              (userData?.email ? createNameFromEmail(userData.email) : 'Usuario')),
      };

      try {
        localStorage.setItem('project_planner_user', JSON.stringify(userToSave));
        if (userData?.session_token) {
          localStorage.setItem('project_planner_session_token', userData.session_token);
          setSessionToken(userData.session_token);
        }
        if (identifier) {
          localStorage.setItem(
            `project_planner_profile_${identifier}`,
            JSON.stringify({
              photo: userPhoto,
              avatar: userPhoto,
              phone: userPhone,
              name: userToSave.name,
            })
          );
        }
      } catch {}

      setCurrentUser(userToSave);
      setIsAuthenticated(true);
      navigate?.('/dashboard');
    },
    [navigate]
  );

  // Cierre de sesión manual
  const handleLogout = useCallback(() => {
    // 1. Notificar al backend de forma asíncrona sin bloquear la UI
    if (currentUser?.username || currentUser?.email) {
      projectsApi
        .logoutUser({
          username: currentUser.username,
          email: currentUser.email,
        })
        .catch(() => {});
    }

    // 2. Limpieza inmediata del almacenamiento local y estados
    try {
      localStorage.removeItem('project-planner-users');
    } catch {}
    clearLocalSession();
  }, [clearLocalSession, currentUser]);

  // Actualización de datos del perfil del usuario activo (Foto, teléfono, nombre)
  const handleUpdateCurrentUser = useCallback(
    async (updatedData) => {
      let resolvedUser = null;
      setCurrentUser((prev) => {
        const merged = { ...prev, ...updatedData };
        resolvedUser = merged;
        try {
          localStorage.setItem('project_planner_user', JSON.stringify(merged));
          const identifier = (merged.email || merged.username || '').toLowerCase();
          if (identifier) {
            localStorage.setItem(
              `project_planner_profile_${identifier}`,
              JSON.stringify({
                photo: merged.photo,
                avatar: merged.avatar,
                phone: merged.phone,
                name: merged.name,
              })
            );
          }
        } catch (err) {
          console.error('Error saving user to localStorage:', err);
        }
        return merged;
      });

      // Guardar en la Base de Datos mediante API de Django
      const targetUser = resolvedUser || currentUser;
      if (targetUser) {
        const activeId = targetUser.db_id || targetUser.id;
        const activeIdentifier = targetUser.email || targetUser.username;
        try {
          await projectsApi.updateProfile({
            userId: activeId,
            identifier: activeIdentifier,
            name: updatedData.name,
            email: updatedData.email,
            photo: updatedData.photo !== undefined ? updatedData.photo : targetUser.photo,
            phone: updatedData.phone !== undefined ? updatedData.phone : targetUser.phone,
          });
        } catch (err) {
          console.warn('Sincronización de perfil en BD:', err);
        }
      }

      // Si se proporcionó despachador setUsers, sincronizar también el directorio local
      if (
        setUsers &&
        (updatedData.name ||
          updatedData.email ||
          updatedData.photo !== undefined ||
          updatedData.avatar !== undefined ||
          updatedData.phone !== undefined)
      ) {
        setUsers((prevUsers) => {
          const nextUsers = prevUsers.map((u) => {
            if (
              (currentUser?.id && u.id === currentUser.id) ||
              (currentUser?.email &&
                u.email &&
                u.email.toLowerCase() === currentUser.email.toLowerCase()) ||
              (currentUser?.username &&
                u.username &&
                u.username.toLowerCase() === currentUser.username.toLowerCase())
            ) {
              return {
                ...u,
                ...(updatedData.name ? { name: updatedData.name } : {}),
                ...(updatedData.email ? { email: updatedData.email } : {}),
                ...(updatedData.photo !== undefined
                  ? { avatar: updatedData.photo, photo: updatedData.photo }
                  : {}),
                ...(updatedData.phone !== undefined ? { phone: updatedData.phone } : {}),
              };
            }
            return u;
          });
          try {
            localStorage.setItem('project-planner-users', JSON.stringify(nextUsers));
          } catch {}
          return nextUsers;
        });
      }
    },
    [currentUser, setUsers]
  );

  // Sincronización de sesión en tiempo real entre múltiples pestañas (Cross-Tab Session Sync)
  useCrossTabListener('project_planner_user', (newValue) => {
    if (!newValue) {
      // Sesión cerrada o removida en otra pestaña
      clearLocalSession();
    } else {
      // Sesión cambiada/iniciada en otra pestaña
      try {
        const updatedUser = JSON.parse(newValue);
        if (updatedUser && typeof updatedUser === 'object') {
          setCurrentUser(updatedUser);
          setIsAuthenticated(true);
        }
      } catch {
        clearLocalSession();
      }
    }
  });

  // Latido periódico de validación de sesión (Heartbeat contra Django)
  useEffect(() => {
    if (!isAuthenticated) return undefined;

    let isActive = true;
    const validateCurrentSession = async () => {
      try {
        await projectsApi.validateSession();
      } catch (error) {
        const statusCode = error?.response?.status;
        if (isActive && (statusCode === 401 || statusCode === 403)) {
          clearLocalSession();
        }
      } finally {
        if (isActive) setIsInitializing(false);
      }
    };

    validateCurrentSession();
    const intervalId = window.setInterval(validateCurrentSession, 15000);
    const handleFocus = () => validateCurrentSession();
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') validateCurrentSession();
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      isActive = false;
      window.clearInterval(intervalId);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [clearLocalSession, isAuthenticated, sessionToken, currentUser?.session_token]);

  return {
    isInitializing,
    isAuthenticated,
    sessionToken,
    currentUser,
    displayedCurrentUser,
    registeredCurrentUser,
    isAdmin,
    isSubAdmin,
    canManage,
    handleLogin,
    handleLogout,
    clearLocalSession,
    handleUpdateCurrentUser,
    handleSessionTokenChange,
  };
}
