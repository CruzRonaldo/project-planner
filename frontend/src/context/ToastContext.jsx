import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);

  const hideToast = useCallback(() => {
    setToast(null);
  }, []);

  const showToast = useCallback(({ title, message, type = 'success', duration = 5000 }) => {
    setToast({
      id: Date.now(),
      title,
      message,
      type,
      duration,
    });
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      setToast(null);
    }, toast.duration || 5000);
    return () => clearTimeout(timer);
  }, [toast]);

  const value = useMemo(() => ({ showToast, hideToast }), [showToast, hideToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toast && <ToastContainer toast={toast} onClose={hideToast} />}
    </ToastContext.Provider>
  );
}

function ToastContainer({ toast, onClose }) {
  const isError = toast.type === 'error';
  const isInfo = toast.type === 'info';

  const borderColor = isError
    ? 'border-red-500/30 dark:border-red-500/30 midnight:border-red-500/40'
    : isInfo
    ? 'border-cyan-500/30 dark:border-cyan-500/30 midnight:border-cyan-500/40'
    : 'border-emerald-500/30 dark:border-emerald-500/30 midnight:border-cyan-500/40';

  const iconBg = isError
    ? 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400 midnight:bg-red-500/20 midnight:text-red-300'
    : isInfo
    ? 'bg-cyan-50 text-cyan-600 dark:bg-cyan-500/10 dark:text-cyan-400 midnight:bg-cyan-500/20 midnight:text-cyan-300'
    : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 midnight:bg-cyan-500/15 midnight:text-cyan-300 shadow-sm';

  const progressBarColor = isError
    ? 'bg-red-500'
    : isInfo
    ? 'bg-gradient-to-r from-blue-500 via-cyan-400 to-cyan-500'
    : 'bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500';

  const durationMs = toast.duration || 5000;

  return (
    <>
      <style>{`
        @keyframes globalToastCountdown {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
      <div
        role="status"
        aria-live="polite"
        className="fixed top-6 left-1/2 -translate-x-1/2 z-[120] w-[min(540px,calc(100vw-2rem))] animate-in fade-in slide-in-from-top-6 duration-300 drop-shadow-2xl pointer-events-auto"
      >
        <div
          className={`relative overflow-hidden rounded-2xl border ${borderColor} bg-white/95 p-4 shadow-[0_20px_60px_rgba(0,0,0,0.18)] backdrop-blur-md dark:bg-[#111a29]/95 dark:shadow-[0_20px_60px_rgba(0,0,0,0.7)] midnight:bg-[#07111e]/95`}
        >
          {/* Barra de progreso de tiempo animada */}
          <div className="absolute top-0 left-0 h-1 w-full bg-slate-100 dark:bg-slate-800 midnight:bg-cyan-950/60">
            <div
              key={toast.id}
              className={`h-full ${progressBarColor}`}
              style={{
                animation: `globalToastCountdown ${durationMs}ms linear forwards`,
              }}
            />
          </div>

          <div className="flex items-start gap-3.5 pt-1">
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconBg}`}
            >
              {isError ? (
                <AlertCircle size={22} />
              ) : isInfo ? (
                <Info size={22} />
              ) : (
                <CheckCircle2 size={22} />
              )}
            </div>

            <div className="min-w-0 flex-1 pr-1">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white midnight:text-cyan-50">
                {toast.title}
              </h4>
              <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-300 midnight:text-cyan-200/80">
                {toast.message}
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-slate-300 midnight:text-cyan-600 midnight:hover:bg-cyan-900/40 midnight:hover:text-cyan-300"
              aria-label="Cerrar notificación"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast debe ser utilizado dentro de un ToastProvider');
  }
  return context;
}

export default ToastContext;
