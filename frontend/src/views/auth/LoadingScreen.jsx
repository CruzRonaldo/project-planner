import React from 'react';
import logoEmpresa from '../../assets/logoempresa1.png';

export default function LoadingScreen() {
  return (
    <div className="relative z-10 flex-1 flex flex-col items-center justify-center gap-8 animate-in fade-in duration-1000">
      
      {/* Logo animado */}
      <div className="relative drop-shadow-[0_0_35px_rgba(6,182,212,0.4)]">
        <div className="absolute inset-0 bg-cyan-500 blur-[50px] opacity-20 animate-pulse" />
        <div 
          style={{ clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' }}
          className="h-[160px] w-[160px] flex items-center justify-center bg-transparent animate-pulse"
        >
          <img 
            src={logoEmpresa} 
            alt="Logo LS Empresa" 
            className="w-full h-full object-cover scale-105"
          />
        </div>
      </div>

      {/* Texto y Barra de progreso */}
      <div className="flex flex-col items-center gap-4">
        <span className="text-cyan-400 font-bold tracking-[0.3em] uppercase text-xs sm:text-sm animate-pulse">
          Inicializando Entorno...
        </span>
        
        {/* Barra de progreso estilo Cyber/Tech con movimiento horizontal activo */}
        <div className="w-56 sm:w-64 h-1.5 bg-slate-800/80 rounded-full overflow-hidden relative backdrop-blur-sm border border-cyan-900/40 shadow-inner">
          <style>{`
            @keyframes loadingTrack {
              0% { transform: translateX(0%); }
              100% { transform: translateX(100%); }
            }
          `}</style>
          <div 
            className="h-full w-1/2 bg-gradient-to-r from-cyan-500 via-cyan-300 to-cyan-400 rounded-full shadow-[0_0_12px_#22d3ee] animate-loading-bar" 
            style={{ animation: 'loadingTrack 1.2s cubic-bezier(0.4, 0, 0.2, 1) infinite alternate' }} 
          />
        </div>
      </div>

    </div>
  );
}
