import React, { useState, useEffect } from 'react';

// Importamos los componentes del flujo de inicio
import LoadingScreen from './LoadingScreen';
import LoginScreen from './LoginScreen';

// Importamos los componentes del Dashboard
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import DashboardContent from './DashboardContent';
import StrategicPlanning from './StrategicPlanning';
import Portfolio from './Portfolio';
import MobileNavigation from './MobileNavigation';

export default function App() {
  // Estados de nuestra aplicación
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false); // <-- ¡NUESTRO NUEVO ESTADO!
  const [activeView, setActiveView] = useState('dashboard');

  const renderActiveView = () => {
    if (activeView === 'planning') return <StrategicPlanning />;
    if (activeView === 'portfolio') return <Portfolio />;
    return <DashboardContent />;
  };
  
  useEffect(() => {
    // Simula una carga de 2.5 segundos antes de mostrar el login
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  // =========================================================
  // SI ESTÁ AUTENTICADO: MOSTRAMOS EL DASHBOARD
  // =========================================================
  if (isAuthenticated) {
    return (
      <div className="flex h-screen bg-[#0d1117] text-white font-sans overflow-hidden animate-in fade-in duration-1000">
        <Sidebar activeView={activeView} onNavigate={setActiveView} />
        <div className="flex h-screen min-w-0 flex-1 flex-col overflow-hidden pb-16 lg:pb-0">
          <Topbar activeView={activeView} />
          {renderActiveView()}
        </div>
        <MobileNavigation activeView={activeView} onNavigate={setActiveView} />
      </div>
    );
  }

  // =========================================================
  // SI NO ESTÁ AUTENTICADO: MOSTRAMOS CARGA O LOGIN
  // =========================================================
  return (
    <div className="min-h-screen w-full bg-[#050B14] text-slate-100 flex flex-col justify-between p-6 sm:p-10 relative overflow-hidden font-sans select-none">
      
      {/* Rejilla de fondo */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#111e33_1px,transparent_1px),linear-gradient(to_bottom,#111e33_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_40%_50%,#000_70%,transparent_100%)] pointer-events-none opacity-40" />
      
      {/* Radar de círculos concéntricos */}
      <div className="absolute left-[28%] top-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full border border-cyan-900/30 pointer-events-none flex items-center justify-center">
        <div className="w-[500px] h-[500px] rounded-full border border-cyan-800/30 flex items-center justify-center">
          <div className="w-[300px] h-[300px] rounded-full border border-cyan-700/20" />
        </div>
      </div>

      {/* Magia Condicional Modificada */}
      {isLoading ? (
        <LoadingScreen />
      ) : (
        // Le pasamos la función al LoginScreen para que sepa cuándo entrar
        <LoginScreen onLogin={() => setIsAuthenticated(true)} />
      )}
      
    </div>
  );
}
