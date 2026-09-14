import React, { useState, useEffect } from "react";

// Importamos las vistas
import LoadingScreen from "./views/LoadingScreen";
import LoginScreen from "./views/LoginScreen";
import DashboardContent from "./views/DashboardContent";
import StrategicPlanning from "./views/StrategicPlanning";
import { createStrategicPlanningData } from "./strategicPlanningData";
import Portfolio from "./views/Portfolio";
import { createPortfolioData } from "./portfolioData";
import RolesManagement from "./views/RolesManagement";
import HumanResources from "./views/HumanResources";
import { createHumanResourcesData } from "./views/humanResourcesData";
import Integrations from "./Integrations";
import { createIntegrationsData } from "./integrationsData";
import TechnicalTeam from "./TechnicalTeam";
import { createTechnicalTeamData } from "./technicalTeamData";
import Operations from "./Operations";
import { createOperationsData } from "./operationsData";

// Importamos los componentes de estructura (Layout)
import Sidebar from "./components/layout/Sidebar";
import Topbar from "./components/layout/Topbar";
import MobileNavigation from "./views/MobileNavigation";

const initialUsers = [
  {
    id: "usr-sistemas",
    name: "Luis Gonzales (Sistemas)",
    email: "sistemas@projectplanner.com",
    isSubAdmin: false,
    isOnline: false,
  },
  {
    id: "usr-civil",
    name: "Andrea Rojas (Civil)",
    email: "civil@projectplanner.com",
    isSubAdmin: false,
    isOnline: false,
  },
  {
    id: "usr-arquitectura",
    name: "Carlos Mendoza (Arquitectura)",
    email: "arquitectura@projectplanner.com",
    isSubAdmin: false,
    isOnline: false,
  },
];

function createNameFromEmail(email) {
  const baseName = email
    .split("@")[0]
    .replace(/[._-]+/g, " ")
    .trim();
  return (
    baseName
      .split(" ")
      .filter(Boolean)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ") || "Usuario Técnico"
  );
}

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem("project_planner_user");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem("project_planner_user") !== null;
  });
  const [activeView, setActiveView] = useState("dashboard");
  const [strategicPlanningData, setStrategicPlanningData] = useState(
    createStrategicPlanningData,
  );
  const [portfolioData, setPortfolioData] = useState(createPortfolioData);
  const [portfolioQuery, setPortfolioQuery] = useState("");
  const [humanResourcesData, setHumanResourcesData] = useState(
    createHumanResourcesData,
  );
  const [humanResourcesQuery, setHumanResourcesQuery] = useState("");
  const [integrationsData, setIntegrationsData] = useState(
    createIntegrationsData,
  );
  const [integrationsQuery, setIntegrationsQuery] = useState("");
  const [technicalTeamData, setTechnicalTeamData] = useState(
    createTechnicalTeamData,
  );
  const [technicalTeamQuery, setTechnicalTeamQuery] = useState("");
  const [operationsData, setOperationsData] = useState(createOperationsData);
  const [operationsQuery, setOperationsQuery] = useState("");

  const [users, setUsers] = useState(() => {
    try {
      const savedUsers = window.localStorage.getItem("project-planner-users");
      const parsedUsers = savedUsers ? JSON.parse(savedUsers) : null;
      // Si existen usuarios antiguos de prueba (@empresa.com), los limpiamos
      if (
        Array.isArray(parsedUsers) &&
        parsedUsers.some(
          (u) => u.email?.includes("@empresa.com") || u.id === "usr-ana",
        )
      ) {
        window.localStorage.removeItem("project-planner-users");
        return initialUsers;
      }
      return Array.isArray(parsedUsers) ? parsedUsers : initialUsers;
    } catch {
      return initialUsers;
    }
  });
  const [fontScale, setFontScale] = useState(() => {
    const savedScale = Number(
      window.localStorage.getItem("project-planner-font-scale"),
    );
    return savedScale >= 85 && savedScale <= 120 ? savedScale : 100;
  });

  const registeredCurrentUser =
    currentUser?.accountType === "user"
      ? users.find(
          (user) =>
            user.id === currentUser.id ||
            (user.email &&
              currentUser.email &&
              user.email.toLowerCase() === currentUser.email.toLowerCase()),
        )
      : null;

  const displayedCurrentUser = currentUser
    ? {
        ...currentUser,
        name: currentUser.first_name
          ? `${currentUser.first_name} ${currentUser.last_name || ""}`.trim()
          : currentUser.username ||
            registeredCurrentUser?.name ||
            currentUser.name ||
            "Usuario",
        roleLabel:
          currentUser.role === "admin" ||
          currentUser.is_superuser ||
          currentUser.accountType === "admin"
            ? "Project Manager"
            : registeredCurrentUser?.isSubAdmin
              ? "SubAdministrador"
              : "Equipo Técnico",
      }
    : null;

  const handleLogin = (userData) => {
    // Compatible tanto con la respuesta del backend como con el formato local
    const accountType =
      userData?.role === "admin" ||
      userData?.is_superuser ||
      userData?.accountType === "admin"
        ? "admin"
        : "user";
    const userToSave = {
      ...userData,
      accountType,
      name:
        userData?.username ||
        (userData?.email ? createNameFromEmail(userData.email) : "Usuario"),
    };
    try {
      localStorage.setItem("project_planner_user", JSON.stringify(userToSave));
    } catch {}
    setCurrentUser(userToSave);
    setActiveView("dashboard");
    setIsAuthenticated(true);
  };

  const handleToggleSubAdmin = (userId) => {
    setUsers((currentUsers) =>
      currentUsers.map((user) =>
        user.id === userId ? { ...user, isSubAdmin: !user.isSubAdmin } : user,
      ),
    );
  };

  const handleLogout = () => {
    try {
      localStorage.removeItem("project_planner_user");
    } catch {}
    setCurrentUser(null);
    setActiveView("dashboard");
    setIsAuthenticated(false);
  };

  const renderActiveView = () => {
    const canManage =
      displayedCurrentUser?.accountType === "admin" ||
      displayedCurrentUser?.roleLabel === "SubAdministrador";

    if (activeView === "planning") {
      return (
        <StrategicPlanning
          data={strategicPlanningData}
          onChange={setStrategicPlanningData}
          canManage={canManage}
        />
      );
    }
    if (activeView === "portfolio") {
      return (
        <Portfolio
          data={portfolioData}
          onChange={setPortfolioData}
          query={portfolioQuery}
          onQueryChange={setPortfolioQuery}
          canManage={canManage}
          currentUserName={displayedCurrentUser?.name}
        />
      );
    }
    if (activeView === "operations") {
      const projectOptions = portfolioData.projects.map(
        (project) => `${project.name} (${project.code})`,
      );
      const responsibleOptions = technicalTeamData.members.map((member) => ({
        id: member.id,
        name: `${member.firstNames} ${member.lastNames}`,
        specialty: member.specialty,
      }));
      return (
        <Operations
          data={operationsData}
          onChange={setOperationsData}
          query={operationsQuery}
          onQueryChange={setOperationsQuery}
          canManage={canManage}
          projectOptions={projectOptions}
          responsibleOptions={responsibleOptions}
        />
      );
    }
    if (activeView === "technical-team") {
      const projectOptions = portfolioData.projects.map(
        (project) => `${project.name} (${project.code})`,
      );
      return (
        <TechnicalTeam
          data={technicalTeamData}
          onChange={setTechnicalTeamData}
          query={technicalTeamQuery}
          onQueryChange={setTechnicalTeamQuery}
          canManage={canManage}
          projectOptions={projectOptions}
        />
      );
    }
    if (activeView === "human-resources") {
      return (
        <HumanResources
          data={humanResourcesData}
          onChange={setHumanResourcesData}
          query={humanResourcesQuery}
          onQueryChange={setHumanResourcesQuery}
          canManage={canManage}
        />
      );
    }
    if (activeView === "integrations") {
      return (
        <Integrations
          data={integrationsData}
          onChange={setIntegrationsData}
          query={integrationsQuery}
          onQueryChange={setIntegrationsQuery}
        />
      );
    }
    if (
      activeView === "roles" &&
      (displayedCurrentUser?.accountType === "admin" ||
        displayedCurrentUser?.role === "admin" ||
        displayedCurrentUser?.is_superuser)
    ) {
      return (
        <RolesManagement
          users={users}
          onToggleSubAdmin={handleToggleSubAdmin}
        />
      );
    }
    return <DashboardContent />;
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    window.localStorage.setItem("project-planner-users", JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    window.localStorage.setItem(
      "project-planner-font-scale",
      String(fontScale),
    );
    document.documentElement.style.fontSize = `${16 * (fontScale / 100)}px`;
  }, [fontScale]);

  // Si está autenticado: Mostramos el Dashboard completo
  if (isAuthenticated) {
    return (
      <div className="flex h-screen bg-[#0d1117] text-white font-sans overflow-hidden animate-in fade-in duration-1000">
        <Sidebar
          activeView={activeView}
          onNavigate={setActiveView}
          fontScale={fontScale}
          onFontScaleChange={setFontScale}
        />
        <div className="flex h-screen min-w-0 flex-1 flex-col overflow-hidden pb-16 lg:pb-0">
          <Topbar
            activeView={activeView}
            searchValue={
              activeView === "human-resources"
                ? humanResourcesQuery
                : activeView === "integrations"
                  ? integrationsQuery
                  : activeView === "technical-team"
                    ? technicalTeamQuery
                    : activeView === "portfolio"
                      ? portfolioQuery
                      : activeView === "operations"
                        ? operationsQuery
                        : undefined
            }
            onSearchChange={
              activeView === "human-resources"
                ? setHumanResourcesQuery
                : activeView === "integrations"
                  ? setIntegrationsQuery
                  : activeView === "technical-team"
                    ? setTechnicalTeamQuery
                    : activeView === "portfolio"
                      ? setPortfolioQuery
                      : activeView === "operations"
                        ? setOperationsQuery
                        : undefined
            }
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
