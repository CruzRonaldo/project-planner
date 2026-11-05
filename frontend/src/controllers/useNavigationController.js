import { useMemo, useCallback, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  hasViewAccess,
  getSearchPlaceholder,
  getAllowedSidebarItems,
  getAllowedMobileItems,
  NAVIGATION_ITEMS,
} from '../config/navigation.config';

/**
 * Controlador especializado en Enrutamiento, Navegación URL y Control de Acceso (RBAC).
 * Desacopla la resolución de vista activa, historial del navegador y guardias de ruta
 * frente al resto de la aplicación.
 *
 * @param {Object} [options]
 * @param {Object|null} [options.currentUser=null] - Usuario activo para validar permisos de acceso
 * @param {boolean} [options.isAuthenticated=false] - Indica si existe una sesión válida
 * @param {boolean} [options.isInitializing=false] - Indica si la sesión está en proceso de validación inicial
 * @returns {Object} Vista activa, navegador, listas de menú autorizadas y placeholder de búsqueda
 */
export function useNavigationController({
  currentUser = null,
  isAuthenticated = false,
  isInitializing = false,
} = {}) {
  let location = { pathname: '/' };
  let navigate = () => {};

  try {
    location = useLocation();
    navigate = useNavigate();
  } catch {
    // Fallback tolerante para entornos SSR o pruebas unitarias sin <BrowserRouter>
  }

  // 1. Ruta normalizada del navegador (sin slash final salvo en raíz)
  const normalizedPath = useMemo(() => {
    const rawPath = location?.pathname || '/';
    return rawPath.replace(/\/$/, '') || '/';
  }, [location?.pathname]);

  // 2. Derivar activeView a partir de la URL real
  const activeView = useMemo(() => {
    if (normalizedPath === '/login') return 'login';
    if (normalizedPath === '/' || normalizedPath === '/dashboard') return 'dashboard';
    const matched = NAVIGATION_ITEMS.find((item) => item.path === normalizedPath);
    return matched ? matched.id : 'dashboard';
  }, [normalizedPath]);

  // 3. Navegación declarativa por URL con guardia de permisos (RBAC)
  const setActiveView = useCallback(
    (target) => {
      if (target === 'login') {
        navigate('/login');
        return;
      }
      const item = NAVIGATION_ITEMS.find(
        (n) => n.id === target || n.path === target
      );
      if (item) {
        if (hasViewAccess(item.id, currentUser)) {
          navigate(item.path);
        } else {
          navigate('/dashboard', { replace: true });
        }
      } else {
        navigate('/dashboard');
      }
    },
    [currentUser, navigate]
  );

  // 4. Guardia automática de sincronización de rutas y sesión
  useEffect(() => {
    if (isInitializing) return;

    if (!isAuthenticated) {
      if (normalizedPath !== '/login') {
        navigate('/login', { replace: true });
      }
    } else {
      if (normalizedPath === '/login' || normalizedPath === '/') {
        navigate('/dashboard', { replace: true });
      } else if (!hasViewAccess(activeView, currentUser)) {
        navigate('/dashboard', { replace: true });
      }
    }
  }, [
    isInitializing,
    isAuthenticated,
    normalizedPath,
    activeView,
    currentUser,
    navigate,
  ]);

  // 5. Elementos de navegación autorizados según rol
  const allowedSidebarItems = useMemo(() => {
    return getAllowedSidebarItems(currentUser);
  }, [currentUser]);

  const allowedMobileItems = useMemo(() => {
    return getAllowedMobileItems(currentUser);
  }, [currentUser]);

  // 6. Placeholder contextual de búsqueda según la vista actual
  const searchPlaceholder = useMemo(() => {
    return getSearchPlaceholder(activeView);
  }, [activeView]);

  return {
    normalizedPath,
    activeView,
    setActiveView,
    allowedSidebarItems,
    allowedMobileItems,
    searchPlaceholder,
    hasAccess: (viewId) => hasViewAccess(viewId, currentUser),
  };
}
