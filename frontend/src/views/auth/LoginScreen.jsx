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
import api, {
  verify2FA,
  setup2FA,
  request2FAReset,
  verify2FAReset,
} from "../../services/api";
import PasswordInput from "../../components/common/PasswordInput";

export default function LoginScreen({ onLogin }) {
  const [role, setRole] = useState("admin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Estados para modal de recuperación de contraseña
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [forgotStep, setForgotStep] = useState(1); // 1: Solicitud de código, 2: Validación y cambio
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotCode, setForgotCode] = useState("");
  const [forgotNewPassword, setForgotNewPassword] = useState("");
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState("");
  const [showForgotNewPassword, setShowForgotNewPassword] = useState(false);
  const [showForgotConfirmPassword, setShowForgotConfirmPassword] = useState(false);
  const [forgotError, setForgotError] = useState("");
  const [isSubmittingForgot, setIsSubmittingForgot] = useState(false);

  const [isContactModalOpen, setIsContactModalOpen] = useState(false);

  // Estados para Autenticación de Dos Factores (2FA / TOTP)
  const [requires2FA, setRequires2FA] = useState(false);
  const [tempUserId, setTempUserId] = useState(null);
  const [otpCode, setOtpCode] = useState('');
  const [qrCodeData, setQrCodeData] = useState(null);
  const [twoFAError, setTwoFAError] = useState('');
  const [is2FALoading, setIs2FALoading] = useState(false);
  const [isQrLoading, setIsQrLoading] = useState(false);
  const [is2FASetup, setIs2FASetup] = useState(false);
  const [isResetting2FA, setIsResetting2FA] = useState(false);
  const [recoveryCode, setRecoveryCode] = useState('');
  const [isResetLoading, setIsResetLoading] = useState(false);

  const resetForgotState = () => {
    setForgotStep(1);
    setForgotEmail("");
    setForgotCode("");
    setForgotNewPassword("");
    setForgotConfirmPassword("");
    setShowForgotNewPassword(false);
    setShowForgotConfirmPassword(false);
    setForgotError("");
    setIsSubmittingForgot(false);
  };

  const handleCloseForgotModal = () => {
    setIsForgotModalOpen(false);
    resetForgotState();
  };

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    setForgotError("");

    if (forgotStep === 1) {
      // --- PASO 1: Solicitar código OTP por correo ---
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const cleanEmail = forgotEmail.trim();
      if (!cleanEmail || !emailRegex.test(cleanEmail)) {
        setForgotError("Por favor, introduce un correo electrónico corporativo válido.");
        return;
      }

      setIsSubmittingForgot(true);
      try {
        const response = await api.post("/auth/password-reset/request/", {
          email: cleanEmail.toLowerCase(),
        });

        if (response.data?.status === "success" || response.status === 200) {
          setForgotStep(2);
        } else {
          setForgotError(response.data?.message || "No se pudo procesar la solicitud.");
        }
      } catch (err) {
        console.error("Error al solicitar código de recuperación:", err);
        const msg =
          err.response?.data?.message ||
          "No se pudo enviar el código de recuperación. Inténtalo de nuevo.";
        setForgotError(msg);
      } finally {
        setIsSubmittingForgot(false);
      }
    } else if (forgotStep === 2) {
      // --- PASO 2: Verificar código de 6 dígitos ---
      const cleanCode = forgotCode.trim();
      if (!cleanCode || cleanCode.length !== 6) {
        setForgotError("El código de verificación debe contener exactamente 6 dígitos.");
        return;
      }

      setIsSubmittingForgot(true);
      try {
        const response = await api.post("/auth/password-reset/verify-code/", {
          email: forgotEmail.trim().toLowerCase(),
          code: cleanCode,
        });

        if (response.data?.status === "success" || response.status === 200) {
          setForgotStep(3);
        } else {
          setForgotError(response.data?.message || "Código inválido o expirado.");
        }
      } catch (err) {
        console.error("Error al verificar código:", err);
        const msg =
          err.response?.data?.message ||
          "El código ingresado es incorrecto o ha expirado.";
        setForgotError(msg);
      } finally {
        setIsSubmittingForgot(false);
      }
    } else if (forgotStep === 3) {
      // --- PASO 3: Restablecer contraseña con código ya verificado ---
      if (!forgotNewPassword) {
        setForgotError("Por favor, ingresa una nueva contraseña.");
        return;
      }
      if (forgotNewPassword.length < 8) {
        setForgotError("La nueva contraseña debe tener al menos 8 caracteres.");
        return;
      }
      if (forgotNewPassword !== forgotConfirmPassword) {
        setForgotError("Las contraseñas no coinciden. Verifícalas e inténtalo nuevamente.");
        return;
      }

      setIsSubmittingForgot(true);
      try {
        const response = await api.post("/auth/password-reset/confirm/", {
          email: forgotEmail.trim().toLowerCase(),
          code: forgotCode.trim(),
          new_password: forgotNewPassword,
          confirm_password: forgotConfirmPassword,
        });

        if (response.data?.status === "success" || response.status === 200) {
          setIsForgotModalOpen(false);
          resetForgotState();
          setErrorMessage("");
          setSuccessMessage(
            response.data?.message ||
              "Tu contraseña ha sido actualizada exitosamente. Ya puedes iniciar sesión con tu nueva clave."
          );
        } else {
          setForgotError(response.data?.message || "No se pudo restablecer la contraseña.");
        }
      } catch (err) {
        console.error("Error al confirmar nueva contraseña:", err);
        const msg =
          err.response?.data?.message ||
          "No se pudo actualizar la contraseña. El código puede haber expirado.";
        setForgotError(msg);
      } finally {
        setIsSubmittingForgot(false);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    setIsLoading(true);

    try {
      const response = await api.post("/auth/login/", {
        email: email.trim(),
        password: password,
        role: role,
      });

      // Interceptar login de Administrador con 2FA requerido
      if (response.data?.requires_2fa) {
        setRequires2FA(true);
        setTempUserId(response.data.user_id);
        setIs2FASetup(Boolean(response.data.is_2fa_setup));
        setIsResetting2FA(false);
        setRecoveryCode('');
        setOtpCode('');
        setQrCodeData(null);
        setTwoFAError('');
        setIsLoading(false);
        return;
      }

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

  // Lógica de Verificación de 2FA
  const handleVerify2FA = async (e) => {
    e.preventDefault();
    setTwoFAError('');
    setIs2FALoading(true);
    try {
      const response = await verify2FA(tempUserId, otpCode.trim());
      if (response.status === 'success' || response.user) {
        const userData = response.user;
        if (rememberMe && userData) {
          localStorage.setItem('project_planner_user', JSON.stringify(userData));
        }
        if (response.access) {
          localStorage.setItem('project_planner_token', response.access);
        }
        onLogin(userData);
      } else {
        setTwoFAError(response.message || 'Código inválido. Verifica tu app de autenticación.');
      }
    } catch (error) {
      setTwoFAError(
        error.response?.data?.message || 'Código inválido o expirado. Verifica tu app de autenticación.'
      );
    } finally {
      setIs2FALoading(false);
    }
  };

  // Lógica para Configurar 2FA (obtener secreto y QR)
  const handleSetup2FA = async () => {
    if (!tempUserId) return;
    setTwoFAError('');
    setIsQrLoading(true);
    try {
      const response = await setup2FA(tempUserId);
      if (response.qr_code) {
        setQrCodeData(response.qr_code);
      } else if (response.secret) {
        setTwoFAError(`Secreto manual: ${response.secret}`);
      }
    } catch (error) {
      console.error('Error al configurar 2FA:', error);
      setTwoFAError(
        error.response?.data?.message || 'No se pudo generar el código QR de configuración.'
      );
    } finally {
      setIsQrLoading(false);
    }
  };

  // Lógica para Solicitar Restablecimiento de 2FA (envío de código por correo vía Make)
  const handleRequest2FAReset = async () => {
    if (!tempUserId) return;
    setTwoFAError('');
    setIsResetLoading(true);
    try {
      await request2FAReset(tempUserId);
      setIsResetting2FA(true);
      setRecoveryCode('');
    } catch (error) {
      console.error('Error al solicitar recuperación de 2FA:', error);
      setTwoFAError(
        error.response?.data?.message ||
          'No se pudo enviar el código de recuperación por correo. Inténtalo más tarde.'
      );
    } finally {
      setIsResetLoading(false);
    }
  };

  // Lógica para Verificar Código de Recuperación y Restablecer 2FA
  const handleVerify2FAReset = async (e) => {
    e.preventDefault();
    setTwoFAError('');
    setIsResetLoading(true);
    try {
      const response = await verify2FAReset(tempUserId, recoveryCode.trim());
      if (response.status === 'success' || response.message) {
        setRequires2FA(false);
        setIsResetting2FA(false);
        setTempUserId(null);
        setOtpCode('');
        setRecoveryCode('');
        setQrCodeData(null);
        setTwoFAError('');
        setSuccessMessage(
          '2FA restablecido exitosamente. Inicia sesión nuevamente para configurar tu nuevo celular.'
        );
      } else {
        setTwoFAError(response.message || 'Código de recuperación inválido.');
      }
    } catch (error) {
      console.error('Error al verificar código de recuperación 2FA:', error);
      setTwoFAError(
        error.response?.data?.message ||
          'Código de recuperación inválido o expirado. Inténtalo nuevamente.'
      );
    } finally {
      setIsResetLoading(false);
    }
  };

  const handleCancel2FA = () => {
    setRequires2FA(false);
    setIsResetting2FA(false);
    setTempUserId(null);
    setOtpCode('');
    setRecoveryCode('');
    setQrCodeData(null);
    setTwoFAError('');
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
          {requires2FA ? (
            /* Panel 2FA - Autenticación de Dos Factores o Recuperación */
            <div className="w-full max-w-md bg-[#0D1527]/90 backdrop-blur-md border border-slate-800/80 rounded-3xl p-8 sm:p-10 shadow-2xl animate-in fade-in zoom-in-95 duration-300">
              {isResetting2FA ? (
                /* Subpanel: Recuperación de Cuenta por Correo (Make Webhook) */
                <form onSubmit={handleVerify2FAReset} className="flex flex-col items-center gap-5">
                  <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                    <Mail className="w-7 h-7 text-cyan-400" />
                  </div>

                  <div className="text-center space-y-1">
                    <h3 className="text-xl font-bold text-white tracking-tight">
                      Recuperación de Cuenta
                    </h3>
                    <p className="text-xs text-slate-400 leading-relaxed max-w-xs">
                      Se ha enviado un código de 6 dígitos a tu correo corporativo. Ingrésalo para restablecer tu 2FA.
                    </p>
                  </div>

                  {/* Input de código de recuperación */}
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    autoComplete="one-time-code"
                    autoFocus
                    value={recoveryCode}
                    onChange={(e) => setRecoveryCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000000"
                    className="w-52 text-center text-2xl font-mono font-bold tracking-[0.75em] rounded-2xl border border-slate-700 bg-[#080E1C] px-4 py-3 text-white placeholder-slate-700 outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
                  />

                  {twoFAError && (
                    <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-xl text-xs w-full animate-in fade-in">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{twoFAError}</span>
                    </div>
                  )}

                  {/* Botón Verificar Recuperación */}
                  <button
                    type="submit"
                    disabled={recoveryCode.length !== 6 || isResetLoading}
                    className="w-full bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold py-3.5 rounded-xl transition-all shadow-[0_0_20px_rgba(34,211,238,0.4)] hover:shadow-[0_0_25px_rgba(34,211,238,0.6)] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {isResetLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                        <span>Restableciendo 2FA...</span>
                      </>
                    ) : (
                      'Verificar Código de Recuperación'
                    )}
                  </button>

                  {/* Reenviar código */}
                  <button
                    type="button"
                    onClick={handleRequest2FAReset}
                    disabled={isResetLoading}
                    className="text-xs text-cyan-400/80 hover:text-cyan-300 hover:underline transition-colors cursor-pointer"
                  >
                    ¿No recibiste el código? Reenviar
                  </button>

                  {/* Volver a TOTP */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsResetting2FA(false);
                      setRecoveryCode('');
                      setTwoFAError('');
                    }}
                    className="text-xs text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                  >
                    Volver a ingresar código TOTP
                  </button>
                </form>
              ) : (
                /* Subpanel: Verificación normal de TOTP */
                <form onSubmit={handleVerify2FA} className="flex flex-col items-center gap-5">
                  <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                    <ShieldCheck className="w-7 h-7 text-cyan-400" />
                  </div>
                  
                  <div className="text-center space-y-1">
                    <h3 className="text-xl font-bold text-white tracking-tight">
                      Autenticación de Dos Factores
                    </h3>
                    <p className="text-xs text-slate-400 leading-relaxed max-w-xs">
                      Ingresa el código de 6 dígitos generado por{" "}
                      <strong className="text-slate-300">Google Authenticator</strong> o{" "}
                      <strong className="text-slate-300">Authy</strong>.
                    </p>
                  </div>

                  {/* Código QR generado si el admin pulsa configurar */}
                  {qrCodeData && (
                    <div className="w-full bg-[#080E1C] p-4 rounded-2xl border border-cyan-500/30 flex flex-col items-center gap-2.5 animate-in fade-in duration-300">
                      <p className="text-xs font-semibold text-cyan-300 text-center">
                        Escanea este código con tu app:
                      </p>
                      <img
                        src={qrCodeData}
                        alt="QR Code"
                        className="mx-auto w-48 h-48 bg-white p-2 rounded-lg shadow-lg"
                      />
                      <button
                        type="button"
                        onClick={() => setQrCodeData(null)}
                        className="text-[11px] text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                      >
                        Ocultar código QR
                      </button>
                    </div>
                  )}

                  {/* Input de código de 6 dígitos */}
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    autoComplete="one-time-code"
                    autoFocus
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000000"
                    className="w-52 text-center text-2xl font-mono font-bold tracking-[0.75em] rounded-2xl border border-slate-700 bg-[#080E1C] px-4 py-3 text-white placeholder-slate-700 outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
                  />

                  {twoFAError && (
                    <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-xl text-xs w-full animate-in fade-in">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{twoFAError}</span>
                    </div>
                  )}

                  {/* Botón principal: Verificar Código */}
                  <button
                    type="submit"
                    disabled={otpCode.length !== 6 || is2FALoading}
                    className="w-full bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold py-3.5 rounded-xl transition-all shadow-[0_0_20px_rgba(34,211,238,0.4)] hover:shadow-[0_0_25px_rgba(34,211,238,0.6)] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {is2FALoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                        <span>Verificando...</span>
                      </>
                    ) : (
                      'Verificar Código'
                    )}
                  </button>

                  {/* Botón secundario discreto: ¿Primera vez? Configurar Autenticador (SOLO SI NO ESTÁ CONFIGURADO) */}
                  {!is2FASetup && !qrCodeData && (
                    <button
                      type="button"
                      onClick={handleSetup2FA}
                      disabled={isQrLoading}
                      className="text-xs text-cyan-400/90 hover:text-cyan-300 hover:underline transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      {isQrLoading ? (
                        <>
                          <div className="w-3 h-3 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                          <span>Generando QR...</span>
                        </>
                      ) : (
                        '¿Primera vez? Configurar Autenticador'
                      )}
                    </button>
                  )}

                  {/* Enlace de recuperación: ¿Perdiste tu dispositivo? (SOLO SI ESTÁ CONFIGURADO) */}
                  {is2FASetup && (
                    <button
                      type="button"
                      onClick={handleRequest2FAReset}
                      disabled={isResetLoading}
                      className="text-xs text-cyan-400/80 hover:text-cyan-300 hover:underline transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      {isResetLoading ? (
                        <>
                          <div className="w-3 h-3 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                          <span>Enviando código al correo...</span>
                        </>
                      ) : (
                        '¿Perdiste tu dispositivo?'
                      )}
                    </button>
                  )}

                  {/* Volver al login */}
                  <button
                    type="button"
                    onClick={handleCancel2FA}
                    className="text-xs text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                  >
                    Volver al login
                  </button>
                </form>
              )}
            </div>
          ) : (
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
                <PasswordInput
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  leftIcon={<Lock className="w-4 h-4" />}
                  className="w-full bg-[#080E1C] border border-slate-800 rounded-xl py-3 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-colors"
                />
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
                    resetForgotState();
                    setForgotEmail(email || "");
                    setForgotCode("");
                    setForgotNewPassword("");
                    setForgotConfirmPassword("");
                    setSuccessMessage("");
                    setIsForgotModalOpen(true);
                  }}
                  className="text-cyan-400 hover:text-cyan-300 hover:underline bg-transparent border-none p-0 cursor-pointer text-xs"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>

              {/* Mensaje de Éxito al restablecer contraseña */}
              {successMessage && (
                <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-3.5 rounded-xl text-xs flex items-start gap-2.5 animate-in fade-in duration-300">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
                  <span>{successMessage}</span>
                </div>
              )}

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
          )}
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
              onClick={handleCloseForgotModal}
              className="absolute top-5 right-5 text-slate-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-slate-800/60 cursor-pointer"
              aria-label="Cerrar modal de recuperación"
            >
              <X className="w-5 h-5" />
            </button>

            <form onSubmit={handleForgotSubmit} className="space-y-5">
              {/* Cabecera del modal */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 id="forgot-password-title" className="text-lg font-bold text-white">
                    {forgotStep === 1
                      ? "Recuperar Contraseña"
                      : forgotStep === 2
                      ? "Verificar Código"
                      : "Nueva Contraseña"}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {forgotStep === 1
                      ? "Paso 1 de 3: Solicitar código de verificación"
                      : forgotStep === 2
                      ? "Paso 2 de 3: Ingresar código de 6 dígitos"
                      : "Paso 3 de 3: Establecer nueva clave de acceso"}
                  </p>
                </div>
              </div>

              {/* PASO 1: Ingreso de correo corporativo */}
              {forgotStep === 1 && (
                <>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Ingresa tu correo corporativo. Te enviaremos un código numérico de 6 dígitos para restablecer tu contraseña.
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
                </>
              )}

              {/* PASO 2: Solo Código de 6 dígitos */}
              {forgotStep === 2 && (
                <>
                  <div className="bg-cyan-950/20 border border-cyan-500/20 rounded-xl p-3 text-xs text-slate-300 leading-relaxed">
                    Hemos enviado un código a <strong className="text-cyan-400">{forgotEmail}</strong>. Válido por 15 minutos.
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="forgot-code" className="text-xs font-medium text-slate-300">
                      Código de verificación (6 dígitos)
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                        <KeyRound className="w-4 h-4" />
                      </div>
                      <input
                        id="forgot-code"
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        autoComplete="off"
                        value={forgotCode}
                        onChange={(e) =>
                          setForgotCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                        }
                        placeholder="123456"
                        required
                        className="w-full bg-[#080E1C] border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-colors tracking-widest font-mono"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* PASO 3: Solo Nueva Contraseña y Confirmación */}
              {forgotStep === 3 && (
                <>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Código verificado. Ingresa y confirma tu nueva clave de acceso corporativa.
                  </p>

                  {/* Input Nueva Contraseña */}
                  <div className="space-y-1.5">
                    <label htmlFor="forgot-new-password" className="text-xs font-medium text-slate-300">
                      Nueva Contraseña
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                        <Lock className="w-4 h-4" />
                      </div>
                      <input
                        id="forgot-new-password"
                        type={showForgotNewPassword ? "text" : "password"}
                        autoComplete="new-password"
                        value={forgotNewPassword}
                        onChange={(e) => setForgotNewPassword(e.target.value)}
                        placeholder="Mínimo 8 caracteres"
                        required
                        className="w-full bg-[#080E1C] border border-slate-800 rounded-xl py-2.5 pl-10 pr-10 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => setShowForgotNewPassword(!showForgotNewPassword)}
                        aria-label={showForgotNewPassword ? "Ocultar contraseña" : "Ver contraseña"}
                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                      >
                        {showForgotNewPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Input Confirmar Contraseña */}
                  <div className="space-y-1.5">
                    <label htmlFor="forgot-confirm-password" className="text-xs font-medium text-slate-300">
                      Confirmar Nueva Contraseña
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                        <Lock className="w-4 h-4" />
                      </div>
                      <input
                        id="forgot-confirm-password"
                        type={showForgotConfirmPassword ? "text" : "password"}
                        autoComplete="new-password"
                        value={forgotConfirmPassword}
                        onChange={(e) => setForgotConfirmPassword(e.target.value)}
                        placeholder="Repite la nueva contraseña"
                        required
                        className="w-full bg-[#080E1C] border border-slate-800 rounded-xl py-2.5 pl-10 pr-10 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => setShowForgotConfirmPassword(!showForgotConfirmPassword)}
                        aria-label={showForgotConfirmPassword ? "Ocultar contraseña" : "Ver contraseña"}
                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                      >
                        {showForgotConfirmPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </>
              )}

              {/* Mensaje de error capturado del backend */}
              {forgotError && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-xl text-xs flex items-start gap-2 animate-in fade-in duration-200">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{forgotError}</span>
                </div>
              )}

              {/* Botones de acción */}
              <div className="flex gap-3 pt-2">
                {forgotStep === 1 && (
                  <button
                    type="button"
                    onClick={handleCloseForgotModal}
                    className="flex-1 bg-transparent border border-slate-700 hover:border-slate-600 text-slate-300 font-medium py-2.5 rounded-xl transition-colors text-xs cursor-pointer"
                  >
                    Cancelar
                  </button>
                )}
                {forgotStep === 2 && (
                  <button
                    type="button"
                    onClick={() => {
                      setForgotStep(1);
                      setForgotCode("");
                      setForgotError("");
                    }}
                    className="flex-1 bg-transparent border border-slate-700 hover:border-slate-600 text-slate-300 font-medium py-2.5 rounded-xl transition-colors text-xs cursor-pointer"
                  >
                    Volver
                  </button>
                )}
                {forgotStep === 3 && (
                  <button
                    type="button"
                    onClick={() => {
                      setForgotStep(2);
                      setForgotNewPassword("");
                      setForgotConfirmPassword("");
                      setForgotError("");
                    }}
                    className="flex-1 bg-transparent border border-slate-700 hover:border-slate-600 text-slate-300 font-medium py-2.5 rounded-xl transition-colors text-xs cursor-pointer"
                  >
                    Volver
                  </button>
                )}
                <button
                  type="submit"
                  disabled={isSubmittingForgot}
                  className="flex-1 bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold py-2.5 rounded-xl transition-all shadow-[0_0_15px_rgba(34,211,238,0.3)] text-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isSubmittingForgot ? (
                    <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  ) : forgotStep === 1 ? (
                    "Enviar código"
                  ) : forgotStep === 2 ? (
                    "Verificar código"
                  ) : (
                    "Restablecer Contraseña"
                  )}
                </button>
              </div>
            </form>
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
