import React, { useState, useEffect } from 'react';

// Importamos los componentes del flujo de inicio
import LoadingScreen from './LoadingScreen';
import LoginScreen from './LoginScreen';

// Importamos los componentes del Dashboard
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import DashboardContent from './DashboardContent';
import StrategicPlanning from './StrategicPlanning';
import { createStrategicPlanningData } from './strategicPlanningData';
import Portfolio from './Portfolio';
import { createPortfolioData } from './portfolioData';
import MobileNavigation from './MobileNavigation';
import RolesManagement from './RolesManagement';
import HumanResources from './HumanResources';
import { createHumanResourcesData } from './humanResourcesData';
import Integrations from './Integrations';
import { createIntegrationsData } from './integrationsData';
import TechnicalTeam from './TechnicalTeam';
import { createTechnicalTeamData } from './technicalTeamData';
import Operations from './Operations';
import { createOperationsData } from './operationsData';

import Configuration from './Configuration';


const initialUsers = [
  { id: 'usr-ana', name: 'Ana Rojas', email: 'ana.rojas@empresa.com', isSubAdmin: false, isOnline: true },
  { id: 'usr-luis', name: 'Luis Mendoza', email: 'luis.mendoza@empresa.com', isSubAdmin: false, isOnline: false },
  { id: 'usr-maria', name: 'María Torres', email: 'maria.torres@empresa.com', isSubAdmin: false, isOnline: true },
  { id: 'usr-diego', name: 'Diego Ramos', email: 'diego.ramos@empresa.com', isSubAdmin: false, isOnline: false },
];

function createNameFromEmail(email) {
  const baseName = email.split('@')[0].replace(/[._-]+/g, ' ').trim();
  return baseName
    .split(' ')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ') || 'Usuario Técnico';
}

export default function App() {
  // Estados de nuestra aplicación
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false); // <-- ¡NUESTRO NUEVO ESTADO!
  const [activeView, setActiveView] = useState('dashboard');
  const [strategicPlanningData, setStrategicPlanningData] = useState(createStrategicPlanningData);
  const [portfolioData, setPortfolioData] = useState(createPortfolioData);
  const [portfolioQuery, setPortfolioQuery] = useState('');
  const [humanResourcesData, setHumanResourcesData] = useState(createHumanResourcesData);
  const [humanResourcesQuery, setHumanResourcesQuery] = useState('');
  const [integrationsData, setIntegrationsData] = useState(createIntegrationsData);
  const [integrationsQuery, setIntegrationsQuery] = useState('');
  const [technicalTeamData, setTechnicalTeamData] = useState(createTechnicalTeamData);
  const [technicalTeamQuery, setTechnicalTeamQuery] = useState('');
  const [operationsData, setOperationsData] = useState(createOperationsData);
  const [operationsQuery, setOperationsQuery] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState(() => {
    try {
      const savedUsers = window.localStorage.getItem('project-planner-users');
      const parsedUsers = savedUsers ? JSON.parse(savedUsers) : null;
      return Array.isArray(parsedUsers) ? parsedUsers : initialUsers;
    } catch {
      return initialUsers;
    }
  });
  const [fontScale, setFontScale] = useState(() => {
    const savedScale = Number(window.localStorage.getItem('project-planner-font-scale'));
    return savedScale >= 85 && savedScale <= 120 ? savedScale : 100;
  });

  const [theme, setTheme] = useState(() => {
    return window.localStorage.getItem("project-planner-theme") || "dark";
  });

  const registeredCurrentUser = currentUser?.accountType === 'user'
    ? users.find((user) => user.id === currentUser.id)
    : null;

  const displayedCurrentUser = currentUser
    ? {
      ...currentUser,
      name: registeredCurrentUser?.name ?? currentUser.name,
      roleLabel: currentUser.accountType === 'admin'
        ? 'Project Manager'
        : registeredCurrentUser?.isSubAdmin
          ? 'SubAdministrador'
          : 'Equipo Técnico',
    }
    : null;

  const handleLogin = ({ role, email }) => {
    const normalizedEmail = email.trim().toLowerCase();

    if (role === 'admin') {
      setCurrentUser({
        id: 'admin-carlos',
        name: 'Carlos M.',
        email: normalizedEmail,
        accountType: 'admin',
      });
    } else {
      let registeredUser = users.find((user) => user.email.toLowerCase() === normalizedEmail);

      if (!registeredUser) {
        registeredUser = {
          id: `usr-${Date.now()}`,
          name: createNameFromEmail(normalizedEmail),
          email: normalizedEmail,
          isSubAdmin: false,
          isOnline: true,
        };
        setUsers((currentUsers) => [...currentUsers, registeredUser]);
      } else {
        setUsers((currentUsers) => currentUsers.map((user) => (
          user.id === registeredUser.id ? { ...user, isOnline: true } : user
        )));
      }

      setCurrentUser({
        id: registeredUser.id,
        name: registeredUser.name,
        email: registeredUser.email,
        accountType: 'user',
      });
    }

    setActiveView('dashboard');
    setIsAuthenticated(true);
  };

  const handleToggleSubAdmin = (userId) => {
    setUsers((currentUsers) => currentUsers.map((user) => (
      user.id === userId ? { ...user, isSubAdmin: !user.isSubAdmin } : user
    )));
  };

  const handleLogout = () => {
    if (currentUser?.accountType === 'user') {
      setUsers((currentUsers) => currentUsers.map((user) => (
        user.id === currentUser.id ? { ...user, isOnline: false } : user
      )));
    }

    setCurrentUser(null);
    setActiveView('dashboard');
    setIsAuthenticated(false);
  };

  const renderActiveView = () => {
    if (activeView === 'planning') {
      const canManage = displayedCurrentUser?.accountType === 'admin' || displayedCurrentUser?.roleLabel === 'SubAdministrador';
      return <StrategicPlanning data={strategicPlanningData} onChange={setStrategicPlanningData} canManage={canManage} />;
    }
    if (activeView === 'portfolio') {
      const canManage = displayedCurrentUser?.accountType === 'admin' || displayedCurrentUser?.roleLabel === 'SubAdministrador';
      return <Portfolio data={portfolioData} onChange={setPortfolioData} query={portfolioQuery} onQueryChange={setPortfolioQuery} canManage={canManage} currentUserName={displayedCurrentUser?.name} />;
    }
    if (activeView === 'operations') {
      const canManage = displayedCurrentUser?.accountType === 'admin' || displayedCurrentUser?.roleLabel === 'SubAdministrador';
      const projectOptions = portfolioData.projects.map((project) => `${project.name} (${project.code})`);
      const responsibleOptions = technicalTeamData.members.map((member) => ({ id: member.id, name: `${member.firstNames} ${member.lastNames}`, specialty: member.specialty }));
      return <Operations data={operationsData} onChange={setOperationsData} query={operationsQuery} onQueryChange={setOperationsQuery} canManage={canManage} projectOptions={projectOptions} responsibleOptions={responsibleOptions} />;
    }
    if (activeView === 'technical-team') {
      const canManage = displayedCurrentUser?.accountType === 'admin' || displayedCurrentUser?.roleLabel === 'SubAdministrador';
      const projectOptions = portfolioData.projects.map((project) => `${project.name} (${project.code})`);
      return <TechnicalTeam data={technicalTeamData} onChange={setTechnicalTeamData} query={technicalTeamQuery} onQueryChange={setTechnicalTeamQuery} canManage={canManage} projectOptions={projectOptions} />;
    }
    if (activeView === 'human-resources') {
      const canManage = displayedCurrentUser?.accountType === 'admin' || displayedCurrentUser?.roleLabel === 'SubAdministrador';
      return <HumanResources data={humanResourcesData} onChange={setHumanResourcesData} query={humanResourcesQuery} onQueryChange={setHumanResourcesQuery} canManage={canManage} />;
    }
    if (activeView === 'integrations') {
      return <Integrations data={integrationsData} onChange={setIntegrationsData} query={integrationsQuery} onQueryChange={setIntegrationsQuery} />;
    }
    if (activeView === 'configuracion') {
      return (
        <Configuration
          currentUser={displayedCurrentUser}
          fontScale={fontScale}
          setFontScale={setFontScale}
          users={users}
          theme={theme}
          setTheme={setTheme}
        />
      );
    }
    if (activeView === 'roles' && displayedCurrentUser?.accountType === 'admin') {
      return <RolesManagement users={users} onToggleSubAdmin={handleToggleSubAdmin} />;
    }
    return <DashboardContent />;
  };

  useEffect(() => {
    // Simula una carga de 2.5 segundos antes de mostrar el login
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    window.localStorage.setItem('project-planner-users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    window.localStorage.setItem('project-planner-font-scale', String(fontScale));
    document.documentElement.style.fontSize = `${16 * (fontScale / 100)}px`;
  }, [fontScale]);

  useEffect(() => {
    window.localStorage.setItem("project-planner-theme", theme);
    const root = document.documentElement;
    root.classList.remove('light', 'dark', 'midnight');
    root.classList.add(theme);
    root.style.colorScheme = theme === 'light' ? 'light' : 'dark';
  }, [theme]);

  // =========================================================
  // SI ESTÁ AUTENTICADO: MOSTRAMOS EL DASHBOARD
  // =========================================================
  if (isAuthenticated) {
    return (
      <div className="flex h-screen font-sans overflow-hidden animate-in fade-in duration-1000 transition-colors bg-slate-50 text-slate-900 dark:bg-[#0d1117] dark:text-slate-100 midnight:bg-[#050B14] midnight:text-cyan-50">
        <Sidebar
          activeView={activeView}
          onNavigate={setActiveView}
          fontScale={fontScale}
          onFontScaleChange={setFontScale}
        />
        <div className="flex h-screen min-w-0 flex-1 flex-col overflow-hidden pb-16 lg:pb-0">
          <Topbar
            activeView={activeView}
            searchValue={activeView === 'human-resources' ? humanResourcesQuery : activeView === 'integrations' ? integrationsQuery : activeView === 'technical-team' ? technicalTeamQuery : activeView === 'portfolio' ? portfolioQuery : activeView === 'operations' ? operationsQuery : undefined}
            onSearchChange={activeView === 'human-resources' ? setHumanResourcesQuery : activeView === 'integrations' ? setIntegrationsQuery : activeView === 'technical-team' ? setTechnicalTeamQuery : activeView === 'portfolio' ? setPortfolioQuery : activeView === 'operations' ? setOperationsQuery : undefined}
            currentUser={displayedCurrentUser}
            users={users}
            onToggleSubAdmin={handleToggleSubAdmin}
            onLogout={handleLogout}
            onNavigate={setActiveView}
          />
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
        <LoginScreen onLogin={handleLogin} />
      )}

    </div>
  );
}
