import React, { useState } from 'react';
import { Sun, Moon, MoonStar } from 'lucide-react';

const Configuration = ({ currentUser, fontScale, setFontScale, theme, setTheme, users = [] }) => {
  const [emailNotif, setEmailNotif] = useState(true);
  const [pushNotif, setPushNotif] = useState(true);
  const [appAlerts, setAppAlerts] = useState(true);
  const [autoBackup, setAutoBackup] = useState(true);

  const isAdmin = currentUser?.accountType === 'admin';

  // Toggle adaptado a los 3 temas
  const Toggle = ({ enabled, onChange }) => (
    <div 
      className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-200 ease-in-out ${enabled ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600 midnight:bg-cyan-900/80'}`}
      onClick={() => onChange(!enabled)}
    >
      <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${enabled ? 'translate-x-5' : 'translate-x-0'}`}></div>
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
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full border-2 flex items-center justify-center text-xl font-bold transition-colors duration-300 border-slate-200 bg-slate-100 text-cyan-600 dark:border-slate-600 dark:bg-slate-800 dark:text-cyan-400 midnight:border-cyan-800 midnight:bg-cyan-900/40 midnight:text-cyan-300">
                  {currentUser?.name?.charAt(0) || 'U'}
                </div>
                <div>
                  <span className="font-semibold text-lg block text-slate-900 dark:text-white midnight:text-cyan-50">{currentUser?.name || 'Usuario'}</span>
                  <span className="text-sm text-cyan-600 dark:text-cyan-500 midnight:text-cyan-400">{currentUser?.roleLabel || 'Equipo Técnico'}</span>
                </div>
              </div>
              <button className="bg-transparent border px-4 py-2 rounded-lg text-sm font-medium transition-colors border-slate-300 text-slate-600 hover:bg-slate-50 dark:border-[#30363d] dark:text-slate-300 dark:hover:bg-white/5 midnight:border-cyan-800 midnight:text-cyan-400 midnight:hover:bg-cyan-900/20">
                Cambiar Contraseña
              </button>
            </div>
          </div>

          {/* Preferencias del Sistema */}
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

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600 dark:text-slate-300 midnight:text-cyan-100/70">Notificaciones por Correo</span>
                <Toggle enabled={emailNotif} onChange={setEmailNotif} />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600 dark:text-slate-300 midnight:text-cyan-100/70">Notificaciones Push (Móvil)</span>
                <Toggle enabled={pushNotif} onChange={setPushNotif} />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600 dark:text-slate-300 midnight:text-cyan-100/70">Alertas In-App en Tiempo Real</span>
                <Toggle enabled={appAlerts} onChange={setAppAlerts} />
              </div>
              
              {/* === SELECTOR DE TEMAS (CLARO, OSCURO, MEDIANOCHE) === */}
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center pt-4 gap-3 border-t border-slate-200 dark:border-[#30363d] midnight:border-cyan-900/30">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300 midnight:text-cyan-200">Tema de Interfaz</span>
                <div className="flex p-1 rounded-lg border transition-colors bg-slate-100 border-slate-300 dark:bg-[#0d1117] dark:border-[#30363d] midnight:bg-cyan-950 midnight:border-cyan-800/40">
                  <button 
                    onClick={() => setTheme('light')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${theme === 'light' ? 'bg-white text-slate-900 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white midnight:text-cyan-600 midnight:hover:text-cyan-400'}`}
                  >
                    <Sun size={14} /> Claro
                  </button>
                  <button 
                    onClick={() => setTheme('dark')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${theme === 'dark' ? 'bg-cyan-500 text-white shadow-md' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white midnight:text-cyan-600 midnight:hover:text-cyan-400'}`}
                  >
                    <Moon size={14} /> Oscuro
                  </button>
                  <button 
                    onClick={() => setTheme('midnight')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${theme === 'midnight' ? 'bg-cyan-600 text-white shadow-md border border-cyan-500' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white midnight:text-cyan-600 midnight:hover:text-cyan-400'}`}
                  >
                    <MoonStar size={14} /> Medianoche
                  </button>
                </div>
              </div>
              
            </div>
          </div>

          {/* Parámetros del Proyecto (SOLO ADMIN) */}
          {isAdmin && (
            <div className="border rounded-xl p-6 shadow-sm transition-colors duration-300 bg-white border-slate-200 dark:bg-[#161b22] dark:border-[#30363d] midnight:bg-[#0a1120] midnight:border-cyan-900/30">
              <h2 className="text-lg font-bold mb-6 text-slate-900 dark:text-white midnight:text-cyan-100">Parámetros del Proyecto</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm mb-1 text-slate-500 dark:text-slate-400 midnight:text-cyan-600">Moneda Base</p>
                  <p className="text-slate-900 dark:text-slate-200 midnight:text-cyan-100">USD ($)</p>
                </div>
                <div>
                  <p className="text-sm mb-1 text-slate-500 dark:text-slate-400 midnight:text-cyan-600">Año Fiscal</p>
                  <p className="text-slate-900 dark:text-slate-200 midnight:text-cyan-100">2026 (Ene - Dic)</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ================= COLUMNA DERECHA (SOLO ADMIN) ================= */}
        {isAdmin && (
          <div className="flex flex-col gap-6">
            
            {/* Gestión de Usuarios */}
            <div className="border rounded-xl p-6 shadow-sm transition-colors duration-300 bg-white border-slate-200 dark:bg-[#161b22] dark:border-[#30363d] midnight:bg-[#0a1120] midnight:border-cyan-900/30">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white midnight:text-cyan-100">Gestión de Usuarios</h2>
                <button className="bg-transparent border px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border-slate-300 text-slate-600 hover:bg-slate-50 dark:border-[#30363d] dark:text-slate-300 dark:hover:bg-white/5 midnight:border-cyan-800 midnight:text-cyan-400 midnight:hover:bg-cyan-900/20">
                  Agregar Miembro
                </button>
              </div>

              <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
                {users.map((user, index) => (
                  <div key={user.id || index} className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full border flex items-center justify-center font-bold transition-colors border-slate-200 bg-slate-100 text-slate-600 dark:border-[#30363d] dark:bg-slate-800 dark:text-slate-300 midnight:border-cyan-800 midnight:bg-cyan-900/40 midnight:text-cyan-400">
                        {user.name.charAt(0)}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-slate-900 dark:text-slate-200 midnight:text-cyan-50">{user.name}</span>
                      </div>
                    </div>
                    <span className={`px-2.5 py-1 text-xs font-medium rounded-md ${user.isOnline ? 'text-emerald-700 bg-emerald-100 dark:text-emerald-400 dark:bg-emerald-400/10 midnight:text-emerald-300 midnight:bg-emerald-500/20' : 'text-slate-600 bg-slate-200 dark:text-slate-400 dark:bg-slate-500/20 midnight:text-cyan-600 midnight:bg-cyan-900/30'}`}>
                      {user.isOnline ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Respaldo y Seguridad */}
            <div className="border rounded-xl p-6 shadow-sm transition-colors duration-300 bg-white border-slate-200 dark:bg-[#161b22] dark:border-[#30363d] midnight:bg-[#0a1120] midnight:border-cyan-900/30">
              <h2 className="text-lg font-bold mb-6 text-slate-900 dark:text-white midnight:text-cyan-100">Respaldo y Seguridad</h2>
              
              <div className="flex justify-between items-center mb-6">
                <div>
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-200 midnight:text-cyan-100/80">Último Respaldo Exitoso</p>
                </div>
                <button className="bg-transparent border px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border-slate-300 text-slate-600 hover:bg-slate-50 dark:border-[#30363d] dark:text-slate-300 dark:hover:bg-white/5 midnight:border-cyan-800 midnight:text-cyan-400 midnight:hover:bg-cyan-900/20">
                  Exportar Datos
                </button>
              </div>

              <div className="flex justify-between items-center mb-6">
                <span className="text-sm text-slate-600 dark:text-slate-300 midnight:text-cyan-100/70">Respaldo Diario Automático</span>
                <Toggle enabled={autoBackup} onChange={setAutoBackup} />
              </div>

              {/* Consola de logs */}
              <div className="p-4 rounded-lg font-mono text-xs space-y-2 mt-4 border transition-colors bg-slate-50 border-slate-200 text-slate-600 dark:bg-[#0d1117] dark:border-[#30363d] dark:text-slate-400 midnight:bg-[#050B14] midnight:border-cyan-900/40 midnight:text-cyan-600">
                <p><span className="text-emerald-600 dark:text-emerald-400 midnight:text-emerald-400">[04:00:12] SYSTEM:</span> Respaldo maestro generado con éxito (4.2MB)</p>
                <p><span className="text-cyan-600 dark:text-slate-300 midnight:text-cyan-400">[Yesterday] Carlos M:</span> Cambio de contraseña de Alejandro Ruiz</p>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
};

export default Configuration;