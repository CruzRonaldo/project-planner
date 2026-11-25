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
 * Mantiene la sincronización estricta entre la URL real del navegador y las vistas declaradas
 * en NAVIGATION_ITEMS. Protege las rutas mediante validación RBAC según el rol del usuario,
 * redirigiendo automáticamente a /login si no hay sesión o a /dashboard si se intenta
 * acceder a una sección restringida.
 *
 * @param {Object} [options] - Parámetros de navegación y sesión.
 * @param {Object|null} [options.currentUser=null] - Usuario activo en sesión para verificar permisos de acceso.
 * @param {boolean} [options.isAuthenticated=false] - Indica si existe una sesión verificada.
 * @param {boolean} [options.isInitializing=false] - Indica si la sesión está en proceso de validación inicial con el servidor.
 * @returns {{
 *   normalizedPath: string,
 *   activeView: string,
 *   setActiveView: (target: string) => void,
 *   allowedSidebarItems: Array<Object>,
 *   allowedMobileItems: Array<Object>,
 *   searchPlaceholder: string,
 *   hasAccess: (viewId: string) => boolean
 * }} Propiedades de enrutamiento, guardias y metadatos de interfaz.
 */
export function useNavigationController({
  currentUser = null,
  isAuthenticated = false,
  isInitializing = false,
} = {}) {
  const location = useLocation();
  const navigate = useNavigate();

  // 1. Ruta normalizada del navegador (sin slash final salvo en raíz)
  const normalizedPath = useMemo(() => {
    const rawPath = location?.pathname || '/';
    return rawPath.replace(/\/$/, '') || '/';
  }, [location?.pathname]);

  // 2. Derivar activeView a partir de la URL real
  const activeView = useMemo(() => {
    if (normalizedPath === '/login') return 'login';
    if (normalizedPath === '/' || normalizedPath === '/dashboard') return 'dashboard';
    const matched = NAVIGATION_ITEMS.find(
      (item) => item.path === normalizedPath || (item.aliases && item.aliases.includes(normalizedPath))
    );
    return matched ? matched.id : 'dashboard';
  }, [normalizedPath]);

  // 3. Navegación declarativa por URL con guardia de permisos (RBAC) y soporte de opciones/estado
  const setActiveView = useCallback(
    (target, options) => {
      const navOptions = options?.state
        ? options
        : options && typeof options === 'object'
        ? { state: options }
        : undefined;

      if (target === 'login') {
        navigate('/login', navOptions);
        return;
      }
      const item = NAVIGATION_ITEMS.find(
        (n) => n.id === target || n.path === target || (n.aliases && (n.aliases.includes(target) || n.aliases.includes(`/${target}`)))
      );
      if (item) {
        if (hasViewAccess(item.id, currentUser)) {
          navigate(item.path, navOptions);
        } else {
          navigate('/dashboard', { replace: true });
        }
      } else {
        navigate('/dashboard', navOptions);
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
