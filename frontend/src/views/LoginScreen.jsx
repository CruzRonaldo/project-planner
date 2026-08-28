import React, { useState } from 'react';
import logoEmpresa from '../assets/logoempresa1.png';
import { ShieldCheck, User, Mail, Lock, Eye, EyeOff, LayoutGrid } from 'lucide-react';

export default function LoginScreen({ onLogin }) {
    const [role, setRole] = useState('admin');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(true);

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log({ role, email, password, rememberMe });

        // Llama a la función aquí para "entrar" al sistema
        onLogin();
    };

    return (
        <>
            {/* Header: Logo superior */}
            <header className="relative z-10 flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-700">
                <div className="bg-cyan-500 p-2 rounded-lg text-slate-950 flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.5)]">
                    <LayoutGrid className="w-5 h-5" />
                </div>
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
                        Planifique hitos, supervise presupuestos en tiempo real, asigne tareas críticas y dirija a sus equipos técnicos con la herramienta de ingeniería de proyectos más avanzada.
                    </p>
                </div>

                {/* Columna Derecha: Tarjeta de Login */}
                <div className="lg:col-span-6 flex justify-center lg:justify-end">
                    <div className="w-full max-w-md bg-[#0D1527]/90 backdrop-blur-md border border-slate-800/80 rounded-3xl p-8 sm:p-10 shadow-2xl relative pt-20 mt-24">

                        {/* Contenedor del Logo elevado */}
                        <div className="absolute -top-32 left-1/2 -translate-x-1/2 flex justify-center items-center pointer-events-none drop-shadow-[0_20px_35px_rgba(0,0,0,0.95)]">
                            <div
                                style={{ clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' }}
                                className="w-44 h-44 flex items-center justify-center bg-transparent"
                            >
                                <img
                                    src={logoEmpresa}
                                    alt="Logo LS Empresa"
                                    className="w-full h-full object-cover scale-105"
                                />
                            </div>
                        </div>

                        <div className="space-y-1 mb-8 text-left">
                            <h3 className="text-2xl font-bold text-white tracking-tight">Iniciar Sesión</h3>
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
                                        onClick={() => setRole('admin')}
                                        className={`text-left p-3.5 rounded-2xl border transition-all relative ${role === 'admin'
                                            ? 'border-cyan-400 bg-cyan-950/20 shadow-[0_0_15px_rgba(6,182,212,0.15)]'
                                            : 'border-slate-800 bg-[#121C33]/50 hover:border-slate-700'
                                            }`}
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="bg-cyan-500/20 p-2 rounded-xl text-cyan-400">
                                                <ShieldCheck className="w-5 h-5" />
                                            </div>
                                            {role === 'admin' && (
                                                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee]" />
                                            )}
                                        </div>
                                        <div className="font-bold text-sm text-white">ADMIN</div>
                                        <div className="text-xs font-semibold text-cyan-400 mb-1">Project Manager</div>
                                        <div className="text-[10px] text-slate-400 leading-snug">
                                            Control total del sistema, gestión de proyectos, presupuestos y equipos
                                        </div>
                                    </button>

                                    {/* Tarjeta Usuario */}
                                    <button
                                        type="button"
                                        onClick={() => setRole('user')}
                                        className={`text-left p-3.5 rounded-2xl border transition-all relative ${role === 'user'
                                            ? 'border-cyan-400 bg-cyan-950/20 shadow-[0_0_15px_rgba(6,182,212,0.15)]'
                                            : 'border-slate-800 bg-[#121C33]/50 hover:border-slate-700'
                                            }`}
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="bg-slate-800 p-2 rounded-xl text-slate-400">
                                                <User className="w-5 h-5" />
                                            </div>
                                            {role === 'user' && (
                                                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee]" />
                                            )}
                                        </div>
                                        <div className="font-bold text-sm text-white">USUARIO</div>
                                        <div className="text-xs font-semibold text-slate-300 mb-1">Equipo Técnico</div>
                                        <div className="text-[10px] text-slate-400 leading-snug">
                                            Acceso a proyectos asignados, documentación y estado del equipo
                                        </div>
                                    </button>

                                </div>
                            </div>

                            {/* Input Email */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-slate-300">Correo electrónico</label>
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
                                <label className="text-xs font-medium text-slate-300">Contraseña</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                                        <Lock className="w-4 h-4" />
                                    </div>
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        required
                                        className="w-full bg-[#080E1C] border border-slate-800 rounded-xl py-3 pl-10 pr-10 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-colors"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300"
                                    >
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
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
                                <a href="#" className="text-cyan-400 hover:text-cyan-300 hover:underline">
                                    ¿Olvidaste tu contraseña?
                                </a>
                            </div>

                            {/* Botón Submit */}
                            <button
                                type="submit"
                                className="w-full bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold py-3.5 rounded-xl transition-all shadow-[0_0_20px_rgba(34,211,238,0.4)] hover:shadow-[0_0_25px_rgba(34,211,238,0.6)] cursor-pointer"
                            >
                                Iniciar Sesión
                            </button>

                        </form>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="relative z-10 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-4 pt-6 border-t border-slate-900/60 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div>v2.0 — Sistema Integral de Planificación</div>
                <div>
                    ¿Necesitas acceso?{' '}
                    <a href="#" className="text-cyan-400 hover:underline">
                        Contacta al administrador del sistema
                    </a>
                </div>
                <div>© 2026</div>
            </footer>
        </>
    );
}
