import React, { useState } from 'react';
import api from '../services/api';
import { Database, CheckCircle2, XCircle, Loader2, RefreshCw, Server, Cpu } from 'lucide-react';

export default function DbConnectionTest() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [isOpen, setIsOpen] = useState(false);

  const checkConnection = async () => {
    setLoading(true);
    setResult(null);
    try {
      const response = await api.get('/test-db/');
      setResult({
        success: true,
        data: response.data,
      });
    } catch (error) {
      setResult({
        success: false,
        error: error.response?.data || {
          message: error.message || 'No se pudo conectar con el servidor Backend de Django (http://127.0.0.1:8000)',
          database: { connected: false, error_detail: error.code === 'ERR_NETWORK' ? 'El servidor Django no está corriendo o CORS está bloqueando la solicitud.' : error.message }
        },
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = () => {
    setIsOpen(true);
    if (!result) {
      checkConnection();
    }
  };

  return (
    <>
      {/* Botón flotante o integrado para abrir el test */}
      <button
        onClick={handleOpen}
        type="button"
        className="fixed bottom-4 right-4 z-50 flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-cyan-400 shadow-xl backdrop-blur-md transition-all hover:scale-105"
        title="Probar Conexión Backend y Base de Datos"
      >
        <Database className="w-4 h-4 text-cyan-400" />
        <span>Test BD & Backend</span>
        {result && (
          <span className={`w-2 h-2 rounded-full ${result.success ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
        )}
      </button>

      {/* Modal de diagnóstico */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#0D1527] border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl relative text-left">
            {/* Header del Modal */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-cyan-500/10 rounded-lg text-cyan-400">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Diagnóstico de Conexión</h3>
                  <p className="text-xs text-slate-400">Frontend ⟷ Django Backend ⟷ MySQL Database</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-white text-lg font-bold p-1 leading-none"
              >
                ✕
              </button>
            </div>

            {/* Contenido del Diagnóstico */}
            <div className="py-5 space-y-4">
              {loading && (
                <div className="flex flex-col items-center justify-center py-8 gap-3">
                  <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
                  <p className="text-sm text-slate-300">Comprobando conexión con Django y MySQL...</p>
                </div>
              )}

              {!loading && result && (
                <div className="space-y-4">
                  {/* Estado Principal */}
                  <div className={`p-4 rounded-xl border flex items-start gap-3 ${
                    result.success
                      ? 'bg-green-950/20 border-green-800/60 text-green-300'
                      : 'bg-red-950/20 border-red-800/60 text-red-300'
                  }`}>
                    {result.success ? (
                      <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <div className="font-bold text-sm">
                        {result.success ? '¡Conexión Exitosa!' : 'Fallo en la Conexión'}
                      </div>
                      <p className="text-xs mt-1 text-slate-300">
                        {result.success ? result.data.message : result.error?.message}
                      </p>
                    </div>
                  </div>

                  {/* Detalles Técnicos */}
                  <div className="bg-[#080E1C] border border-slate-800/80 rounded-xl p-4 space-y-3">
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Detalles de la Arquitectura
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="bg-slate-900/50 p-2.5 rounded-lg border border-slate-800">
                        <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                          <Server className="w-3.5 h-3.5 text-cyan-400" />
                          <span>Django Backend</span>
                        </div>
                        <div className="font-semibold text-white">
                          {result.error?.message?.includes('Django no está corriendo') ? 'Desconectado 🔴' : 'Online 🟢'}
                        </div>
                        <div className="text-[10px] text-slate-500 truncate">http://127.0.0.1:8000</div>
                      </div>

                      <div className="bg-slate-900/50 p-2.5 rounded-lg border border-slate-800">
                        <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                          <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                          <span>Motor de BD</span>
                        </div>
                        <div className="font-semibold text-white">
                          {result.success ? `MySQL (${result.data.database.name})` : 'MySQL'}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {result.success ? `Latencia: ${result.data.database.latency_ms} ms` : 'Sin enlace'}
                        </div>
                      </div>
                    </div>

                    {result.success && (
                      <div className="text-[11px] text-slate-400 bg-slate-950/40 p-2.5 rounded-lg border border-slate-800/60">
                        <span className="text-cyan-400 font-mono">Versión Servidor MySQL:</span> {result.data.database.version}
                      </div>
                    )}

                    {!result.success && result.error?.database?.error_detail && (
                      <div className="text-[11px] text-red-400 bg-red-950/30 p-2.5 rounded-lg border border-red-900/40 font-mono break-words">
                        <strong>Detalle del error:</strong> {result.error.database.error_detail}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Footer con botón de reintentar */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
              >
                Cerrar
              </button>

              <button
                type="button"
                onClick={checkConnection}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)] disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span>{loading ? 'Comprobando...' : 'Reintentar Prueba'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
