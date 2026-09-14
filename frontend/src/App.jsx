import React from 'react';
import Sidebar from './components/layout/Sidebar';
import Topbar from './components/layout/Topbar';
import MobileNavigation from './components/layout/MobileNavigation';
import { LoadingScreen, LoginScreen } from './views';
import { useAppController } from './controllers';

export default function App() {
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
    allowedMobileItems,
    searchPlaceholder,
    searchValue,
    onSearchChange,
    renderActiveView,
  } = useAppController();

  // Si está autenticado: Mostramos el Dashboard completo
  if (isAuthenticated) {
    return (
      <div className="flex h-screen font-sans overflow-hidden animate-in fade-in duration-1000 transition-colors bg-slate-50 text-slate-900 dark:bg-[#0d1117] dark:text-slate-100 midnight:bg-[#050B14] midnight:text-cyan-50">
        <Sidebar
          items={allowedSidebarItems}
          activeView={activeView}
          onNavigate={setActiveView}
        />
        <div className="flex h-screen min-w-0 flex-1 flex-col overflow-hidden pb-16 lg:pb-0">
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
          />
          {renderActiveView()}
        </div>
        <MobileNavigation
          items={allowedMobileItems}
          activeView={activeView}
          onNavigate={setActiveView}
        />
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
