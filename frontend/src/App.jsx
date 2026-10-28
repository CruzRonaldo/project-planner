import React from 'react';
import Sidebar from './components/layout/Sidebar';
import Topbar from './components/layout/Topbar';
import { LoadingScreen, LoginScreen } from './views';
import { useAppController } from './controllers';

export default function App() {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = React.useState(() => {
    try {
      const saved = localStorage.getItem('project_planner_sidebar_open');
      return saved !== null ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });

  const toggleDesktopSidebar = React.useCallback(() => {
    setIsDesktopSidebarOpen((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('project_planner_sidebar_open', JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  const {
    isLoading,
    isAuthenticated,
    displayedCurrentUser,
    activeView,
    setActiveView,
    users,
    handleLogin,
    handleLogout,
    handleToggleSubAdmin,
    allowedSidebarItems,
    searchPlaceholder,
    searchValue,
    onSearchChange,
    renderActiveView,
  } = useAppController();

  // Atajos de teclado para accesibilidad (A11y):
  // - Escape: cerrar menú móvil
  // - Shift + 0: alternar barra lateral en escritorio (expandir / colapsar)
  // - Shift + 1 .. 8: cambiar de vista directamente
  React.useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setMobileMenuOpen(false);
        return;
      }

      const target = event.target;
      const tagName = target?.tagName;
      const isTyping =
        tagName === 'INPUT' ||
        tagName === 'TEXTAREA' ||
        tagName === 'SELECT' ||
        target?.isContentEditable;

      if (isTyping) return;

      if (event.shiftKey) {
        const code = event.code;
        const key = event.key;

        if (
          code === 'Digit0' ||
          code === 'Numpad0' ||
          key === '0' ||
          key === '='
        ) {
          event.preventDefault();
          toggleDesktopSidebar();
          return;
        }

        const shortcutToView = {
          Digit1: 'dashboard',
          Numpad1: 'dashboard',
          Digit2: 'planning',
          Numpad2: 'planning',
          Digit3: 'portfolio',
          Numpad3: 'portfolio',
          Digit4: 'operations',
          Numpad4: 'operations',
          Digit5: 'technical-team',
          Numpad5: 'technical-team',
          Digit6: 'human-resources',
          Numpad6: 'human-resources',
          Digit7: 'integrations',
          Numpad7: 'integrations',
          // Shift + 8 queda libre para un futuro panel
          Digit9: 'configuracion',
          Numpad9: 'configuracion',
        };

        const keyFallbackMap = {
          '!': 'dashboard',
          '1': 'dashboard',
          '"': 'planning',
          '@': 'planning',
          '2': 'planning',
          '·': 'portfolio',
          '#': 'portfolio',
          '3': 'portfolio',
          '$': 'operations',
          '4': 'operations',
          '%': 'technical-team',
          '5': 'technical-team',
          '&': 'human-resources',
          '^': 'human-resources',
          '6': 'human-resources',
          '/': 'integrations',
          '7': 'integrations',
          // Shift + 9 para Configuración (en teclado ES genera ')', en US genera '(')
          ')': 'configuracion',
          '9': 'configuracion',
        };

        const targetView = shortcutToView[code] || keyFallbackMap[key];
        if (targetView) {
          event.preventDefault();
          setActiveView(targetView);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setActiveView, toggleDesktopSidebar]);

  // Cerrar automáticamente el menú móvil cuando la ventana escala a vista de escritorio (>= 768px)
  React.useEffect(() => {
    const handleResize = () => {
      if (typeof window !== 'undefined' && window.innerWidth >= 768) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Si está autenticado: Mostramos el Dashboard completo
  if (isAuthenticated) {
    return (
      <div className="flex h-screen font-sans overflow-hidden animate-in fade-in duration-1000 transition-colors bg-slate-50 text-slate-900 dark:bg-[#0d1117] dark:text-slate-100 midnight:bg-[#050B14] midnight:text-cyan-50 print:h-auto print:overflow-visible print:bg-white print:text-slate-900">
        <Sidebar
          items={allowedSidebarItems}
          activeView={activeView}
          onNavigate={setActiveView}
          isOpenMobile={mobileMenuOpen}
          onCloseMobile={() => setMobileMenuOpen(false)}
          isOpenDesktop={isDesktopSidebarOpen}
          onToggleDesktop={toggleDesktopSidebar}
        />
        <div className="flex h-screen min-w-0 flex-1 flex-col overflow-hidden pb-0 print:h-auto print:overflow-visible">
          <Topbar
            activeView={activeView}
            searchPlaceholder={searchPlaceholder}
            searchValue={searchValue}
            onSearchChange={onSearchChange}
            currentUser={displayedCurrentUser}
            users={users}
            onToggleSubAdmin={handleToggleSubAdmin}
            onLogout={handleLogout}
            onNavigate={setActiveView}
            onOpenMobileMenu={() => setMobileMenuOpen(true)}
          />
          {renderActiveView()}
        </div>
      </div>
    );
  }

  // Si no está autenticado: Mostramos Carga o Login
  return (
    <div className="min-h-screen w-full bg-[#050B14] text-slate-100 flex flex-col justify-between p-6 sm:p-10 relative overflow-hidden font-sans select-none">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#111e33_1px,transparent_1px),linear-gradient(to_bottom,#111e33_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_40%_50%,#000_70%,transparent_100%)] pointer-events-none opacity-40" />
      <div className="absolute left-[28%] top-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full border border-cyan-900/30 pointer-events-none flex items-center justify-center">
        <div className="w-[500px] h-[500px] rounded-full border border-cyan-800/30 flex items-center justify-center">
          <div className="w-[300px] h-[300px] rounded-full border border-cyan-700/20" />
        </div>
      </div>

      {isLoading ? <LoadingScreen /> : <LoginScreen onLogin={handleLogin} />}
    </div>
  );
}
