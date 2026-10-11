import React, { useState } from "react";
import logoEmpresa from "../../assets/logoempresa1.png";
import {
  ShieldCheck,
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  X,
  KeyRound,
  CheckCircle2,
  Phone,
  Clock,
  Headphones,
} from "lucide-react";
import api from "../../services/api";

export default function LoginScreen({ onLogin }) {
  const [role, setRole] = useState("admin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Estados para modales interactivos
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSubmitted, setForgotSubmitted] = useState(false);
  const [forgotError, setForgotError] = useState("");
  const [isSubmittingForgot, setIsSubmittingForgot] = useState(false);

  const [isContactModalOpen, setIsContactModalOpen] = useState(false);

  const handleForgotSubmit = (e) => {
    e.preventDefault();
    setForgotError("");

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!forgotEmail.trim() || !emailRegex.test(forgotEmail.trim())) {
      setForgotError("Por favor, introduce un correo electrónico corporativo válido.");
      return;
    }

    setIsSubmittingForgot(true);
    // Simular envío de enlace de restablecimiento seguro
    setTimeout(() => {
      setIsSubmittingForgot(false);
      setForgotSubmitted(true);
    }, 600);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setIsLoading(true);

    try {
      const response = await api.post("/auth/login/", {
        email: email.trim(),
        password: password,
        role: role,
      });

      if (response.data.status === "success") {
        const userData = response.data.user;
        if (rememberMe) {
          localStorage.setItem(
            "project_planner_user",
            JSON.stringify(userData),
          );
        }
        // Llamamos a la función del padre pasando los datos reales del usuario
        onLogin(userData);
      }
    } catch (error) {
      console.error("Error al iniciar sesión:", error);
      if (
        error.response &&
        error.response.data &&
        error.response.data.message
      ) {
        setErrorMessage(error.response.data.message);
      } else if (error.request) {
        setErrorMessage(
          "No se pudo conectar con el servidor Django. Asegúrese de que esté corriendo en el puerto 8000.",
        );
      } else {
        setErrorMessage("Ocurrió un error inesperado al iniciar sesión.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Header: Logo superior */}
      <header className="relative z-10 flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-700">
        <img
          src={logoEmpresa}
          alt="Logo empresa"
          className="w-9 h-9 object-contain drop-shadow-[0_0_8px_rgba(6,182,212,0.5)]"
        />
        <span className="font-extrabold tracking-wider text-white text-sm sm:text-base">
          PROJECT PLANNER
        </span>
      </header>

      {/* Contenido central */}
      <main className="relative z-10 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center my-auto py-8 animate-in fade-in duration-1000">
        {/* Columna Izquierda: Presentación */}
        <div className="lg:col-span-6 space-y-6">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white uppercase">
            Project Planner
          </h1>
          <h2 className="text-xl sm:text-2xl font-semibold text-cyan-400">
            Gestión y Optimización de Proyectos
          </h2>
          <p className="text-slate-400 text-sm sm:text-base leading-relaxed max-w-lg">
            Planifique hitos, supervise presupuestos en tiempo real, asigne
            tareas críticas y dirija a sus equipos técnicos con la herramienta
            de ingeniería de proyectos más avanzada.
          </p>
        </div>

        {/* Columna Derecha: Tarjeta de Login */}
        <div className="lg:col-span-6 flex flex-col items-center lg:items-center">
          {/* Contenedor del Logo elevado */}
          <div className="flex justify-center items-center mb-6 drop-shadow-[0_15px_30px_rgba(0,0,0,0.9)]">
            <div
              style={{
                clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)",
              }}
              className="w-36 h-36 flex items-center justify-center bg-transparent"
            >
              <img
                src={logoEmpresa}
                alt="Logo LS Empresa"
                className="w-full h-full object-contain"
              />
            </div>
          </div>
          <div className="w-full max-w-md bg-[#0D1527]/90 backdrop-blur-md border border-slate-800/80 rounded-3xl p-8 sm:p-10 shadow-2xl relative ">
            <div className="space-y-1 mb-8 text-left">
              <h3 className="text-2xl font-bold text-white tracking-tight">
                Iniciar Sesión
              </h3>
              <p className="text-xs text-slate-400 tracking-wide uppercase">
                Bienvenido al sistema PROJECT PLANNER
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Selección de Rol */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">
                  Seleccione su rol
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {/* Tarjeta Admin */}
                  <button
                    type="button"
                    onClick={() => setRole("admin")}
                    className={`text-left p-3.5 rounded-2xl border transition-all relative ${
                      role === "admin"
                        ? "border-cyan-400 bg-cyan-950/20 shadow-[0_0_15px_rgba(6,182,212,0.15)]"
                        : "border-slate-800 bg-[#121C33]/50 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="bg-cyan-500/20 p-2 rounded-xl text-cyan-400">
                        <ShieldCheck className="w-5 h-5" />
                      </div>
                      {role === "admin" && (
                        <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee]" />
                      )}
                    </div>
                    <div className="font-bold text-sm text-white">ADMIN</div>
                    <div className="text-xs font-semibold text-cyan-400 mb-1">
                      Project Manager
                    </div>
                    <div className="text-[10px] text-slate-400 leading-snug">
                      Control total del sistema, gestión de proyectos,
                      presupuestos y equipos
                    </div>
                  </button>

                  {/* Tarjeta Usuario */}
                  <button
                    type="button"
                    onClick={() => setRole("user")}
                    className={`text-left p-3.5 rounded-2xl border transition-all relative ${
                      role === "user"
                        ? "border-cyan-400 bg-cyan-950/20 shadow-[0_0_15px_rgba(6,182,212,0.15)]"
                        : "border-slate-800 bg-[#121C33]/50 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="bg-slate-800 p-2 rounded-xl text-slate-400">
                        <User className="w-5 h-5" />
                      </div>
                      {role === "user" && (
                        <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee]" />
                      )}
                    </div>
                    <div className="font-bold text-sm text-white">USUARIO</div>
                    <div className="text-xs font-semibold text-slate-300 mb-1">
                      Equipo Técnico
                    </div>
                    <div className="text-[10px] text-slate-400 leading-snug">
                      Acceso a proyectos asignados, documentación y estado del
                      equipo
                    </div>
                  </button>
                </div>
              </div>

              {/* Input Email */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">
                  Correo electrónico
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nombre@empresa.com"
                    required
                    className="w-full bg-[#080E1C] border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-colors"
                  />
                </div>
              </div>

              {/* Input Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">
                  Contraseña
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full bg-[#080E1C] border border-slate-800 rounded-xl py-3 pl-10 pr-10 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Ocultar contraseña" : "Ver contraseña"}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Recordarme y Link */}
              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center gap-2 text-slate-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-800 bg-[#080E1C] text-cyan-500 accent-cyan-500 focus:ring-0 cursor-pointer"
                  />
                  <span>Recordarme</span>
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setForgotEmail(email || "");
                    setForgotSubmitted(false);
                    setForgotError("");
                    setIsForgotModalOpen(true);
                  }}
                  className="text-cyan-400 hover:text-cyan-300 hover:underline bg-transparent border-none p-0 cursor-pointer text-xs"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>

              {/* Mensaje de Error si las credenciales o rol fallan */}
              {errorMessage && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3.5 rounded-xl text-xs flex items-start gap-2.5 animate-in fade-in duration-300">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Botón Submit */}
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold py-3.5 rounded-xl transition-all shadow-[0_0_20px_rgba(34,211,238,0.4)] hover:shadow-[0_0_25px_rgba(34,211,238,0.6)] cursor-pointer flex items-center justify-center gap-2 ${
                  isLoading ? "opacity-70 cursor-not-allowed" : ""
                }`}
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    <span>Verificando credenciales...</span>
                  </>
                ) : (
                  "Iniciar Sesión"
                )}
              </button>
            </form>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-4 pt-6 border-t border-slate-900/60 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div>v2.0 — Sistema Integral de Planificación</div>
        <div>
          ¿Necesitas acceso?{" "}
          <button
            type="button"
            onClick={() => setIsContactModalOpen(true)}
            className="text-cyan-400 hover:underline bg-transparent border-none p-0 cursor-pointer inline text-[11px]"
          >
            Contacta al administrador del sistema
          </button>
        </div>
        <div>© 2026</div>
      </footer>

      {/* MODAL: RECUPERACIÓN DE CONTRASEÑA */}
      {isForgotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="w-full max-w-md bg-[#0D1527] border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative animate-in zoom-in-95 duration-200"
            role="dialog"
            aria-modal="true"
            aria-labelledby="forgot-password-title"
          >
            <button
              type="button"
              onClick={() => setIsForgotModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-slate-800/60 cursor-pointer"
              aria-label="Cerrar modal de recuperación"
            >
              <X className="w-5 h-5" />
            </button>

            {forgotSubmitted ? (
              <div className="text-center py-4 space-y-4">
                <div className="mx-auto w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <h3 id="forgot-password-title" className="text-xl font-bold text-white">
                  Instrucciones Enviadas
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Hemos enviado las instrucciones para restablecer el acceso a{" "}
                  <strong className="text-cyan-400">{forgotEmail}</strong>. Revisa tu bandeja de entrada o spam.
                </p>
                <button
                  type="button"
                  onClick={() => setIsForgotModalOpen(false)}
                  className="w-full mt-4 bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold py-3 rounded-xl transition-all shadow-[0_0_15px_rgba(34,211,238,0.3)] text-sm cursor-pointer"
                >
                  Regresar al inicio de sesión
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotSubmit} className="space-y-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center">
                    <KeyRound className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 id="forgot-password-title" className="text-lg font-bold text-white">
                      Recuperar Contraseña
                    </h3>
                    <p className="text-xs text-slate-400">
                      Restablecimiento de credenciales de usuario
                    </p>
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  Ingresa tu correo corporativo. Te enviaremos un enlace seguro para generar una nueva clave de acceso.
                </p>

                <div className="space-y-1.5">
                  <label htmlFor="forgot-email" className="text-xs font-medium text-slate-300">
                    Correo electrónico corporativo
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      id="forgot-email"
                      type="email"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="nombre@empresa.com"
                      required
                      className="w-full bg-[#080E1C] border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-colors"
                    />
                  </div>
                </div>

                {forgotError && (
                  <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-xl text-xs flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{forgotError}</span>
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsForgotModalOpen(false)}
                    className="flex-1 bg-transparent border border-slate-700 hover:border-slate-600 text-slate-300 font-medium py-2.5 rounded-xl transition-colors text-xs cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingForgot}
                    className="flex-1 bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold py-2.5 rounded-xl transition-all shadow-[0_0_15px_rgba(34,211,238,0.3)] text-xs flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isSubmittingForgot ? (
                      <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      "Enviar enlace"
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* MODAL: CONTACTO CON EL ADMINISTRADOR */}
      {isContactModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="w-full max-w-lg bg-[#0D1527] border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative animate-in zoom-in-95 duration-200"
            role="dialog"
            aria-modal="true"
            aria-labelledby="contact-admin-title"
          >
            <button
              type="button"
              onClick={() => setIsContactModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-slate-800/60 cursor-pointer"
              aria-label="Cerrar modal de contacto"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center">
                <Headphones className="w-5 h-5" />
              </div>
              <div>
                <h3 id="contact-admin-title" className="text-lg font-bold text-white">
                  Soporte y Administración
                </h3>
                <p className="text-xs text-slate-400">
                  Canales de atención para gestión de cuentas y accesos
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed mb-5">
              Si requieres acceso al sistema, asignación de proyectos o desbloqueo de perfil, comunícate con la administración general de Project Planner:
            </p>

            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-3.5 p-3 rounded-xl bg-[#080E1C] border border-slate-800/80">
                <Mail className="w-4 h-4 text-cyan-400 shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="text-[10px] text-slate-500 font-semibold uppercase">Soporte</div>
                  <div className="text-xs font-medium text-slate-200">soporte.ti.empresa@gmail.com</div>
                </div>
              </div>

              <div className="flex items-center gap-3.5 p-3 rounded-xl bg-[#080E1C] border border-slate-800/80">
                <Phone className="w-4 h-4 text-cyan-400 shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="text-[10px] text-slate-500 font-semibold uppercase">Central Telefónica TI</div>
                  <div className="text-xs font-medium text-slate-200">+51 XXX XXX XXX</div>
                </div>
              </div>

              <div className="flex items-center gap-3.5 p-3 rounded-xl bg-[#080E1C] border border-slate-800/80">
                <Clock className="w-4 h-4 text-cyan-400 shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="text-[10px] text-slate-500 font-semibold uppercase">Horario de Operaciones</div>
                  <div className="text-xs font-medium text-slate-200">Lunes a Viernes</div>
                </div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-cyan-950/20 border border-cyan-500/20 text-[11px] text-cyan-300 mb-6 leading-relaxed">
              <strong>Nota de Seguridad:</strong> Todo nuevo usuario requiere aprobación del administrador antes de ser dado de alta en los módulos operativos.
            </div>

            <button
              type="button"
              onClick={() => setIsContactModalOpen(false)}
              className="w-full bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold py-3 rounded-xl transition-all shadow-[0_0_15px_rgba(34,211,238,0.3)] text-xs cursor-pointer"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </>
  );
}
