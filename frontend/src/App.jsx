import React, { useEffect, useState } from 'react';

// Vistas
import LoadingScreen from './views/LoadingScreen';
import LoginScreen from './views/LoginScreen';
import DashboardContent from './views/DashboardContent';
import StrategicPlanning from './views/StrategicPlanning';
import Portfolio from './views/Portfolio';
import TechnicalTeam from './views/TechnicalTeam';
import OperationalManagement from './views/OperationalManagement';

// Componentes del layout
import Sidebar from './components/layout/Sidebar';
import Topbar from './components/layout/Topbar';
import DbConnectionTest from './components/DbConnectionTest';
import MobileNavigation from './views/MobileNavigation';

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeView, setActiveView] = useState('dashboard');

  // Relaciona cada identificador del menú con su pantalla
  const viewComponents = {
  dashboard: <DashboardContent />,
  planning: <StrategicPlanning />,
  portfolio: <Portfolio />,
  operations: <OperationalManagement />,
  'technical-team': <TechnicalTeam />,
};

  // Si no encuentra una pantalla, muestra el inicio
  const activeContent =
    viewComponents[activeView] || <DashboardContent />;

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  // =========================================================
  // USUARIO AUTENTICADO
  // =========================================================
  if (isAuthenticated) {
    return (
      <div className="flex h-screen overflow-hidden bg-[#0d1117] font-sans text-white animate-in fade-in duration-1000">
        {/* Menú lateral */}
        <Sidebar
          activeView={activeView}
          onNavigate={setActiveView}
        />

        {/* Contenido principal */}
        <div className="flex h-screen min-w-0 flex-1 flex-col overflow-hidden pb-16 lg:pb-0">
          <Topbar activeView={activeView} />

          {activeContent}
        </div>

        {/* Navegación para celulares */}
        <MobileNavigation
          activeView={activeView}
          onNavigate={setActiveView}
        />

        {/* Prueba de conexión */}
        <DbConnectionTest />
      </div>
    );
  }

  // =========================================================
  // USUARIO NO AUTENTICADO
  // =========================================================
  return (
    <div className="relative flex min-h-screen w-full select-none flex-col justify-between overflow-hidden bg-[#050B14] p-6 font-sans text-slate-100 sm:p-10">
      {/* Rejilla del fondo */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#111e33_1px,transparent_1px),linear-gradient(to_bottom,#111e33_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-40 [mask-image:radial-gradient(ellipse_60%_50%_at_40%_50%,#000_70%,transparent_100%)]" />

      {/* Radar de círculos */}
      <div className="pointer-events-none absolute left-[28%] top-1/2 flex h-[700px] w-[700px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-cyan-900/30">
        <div className="flex h-[500px] w-[500px] items-center justify-center rounded-full border border-cyan-800/30">
          <div className="h-[300px] w-[300px] rounded-full border border-cyan-700/20" />
        </div>
      </div>

      {/* Pantalla de carga o inicio de sesión */}
      {isLoading ? (
        <LoadingScreen />
      ) : (
        <LoginScreen
          onLogin={() => setIsAuthenticated(true)}
        />
      )}

      <DbConnectionTest />
    </div>
  );
}