import React, { useEffect, useRef, useState } from 'react';

// URL del endpoint Django que genera el token de solo lectura.
// El Client Secret nunca llega al navegador — Django lo gestiona internamente.
import { baseURL } from '../services/api'; // Ajusta la ruta relativa si es necesario (ej. '../services/api' o '../../services/api')
const TOKEN_ENDPOINT = `${baseURL}/integrations/aps/token/`;

/**
 * ForgeViewer
 *
 * Inicializa el Autodesk Platform Services Viewer 3D (v7) en un div contenedor.
 * Solicita el access_token al backend Django y carga el modelo por su URN.
 *
 * Props:
 *   urn      {string}  URN base64 URL-safe del modelo ya traducido en APS.
 *                      No incluir el prefijo 'urn:' — el componente lo agrega.
 *   onClose  {func}    Callback para que el padre cierre este visor.
 */
export default function ForgeViewer({ urn, onClose }) {
  const containerRef = useRef(null);   // div donde se monta el WebGL
  const viewerRef    = useRef(null);   // instancia del GuiViewer3D

  // 'idle' | 'token' | 'init' | 'loading' | 'ready' | 'error'
  const [phase, setPhase]     = useState('idle');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!urn || !containerRef.current) return;

    // Bandera de cancelación: si el componente se desmonta antes de que
    // el visor termine de cargar, evitamos actualizar el estado.
    let cancelled = false;

    const initViewer = async () => {
      try {
        // ── 1. Pedir el token al backend ──────────────────────────────────
        setPhase('token');
        const res = await fetch(TOKEN_ENDPOINT);
        if (!res.ok) throw new Error(`Token endpoint respondió ${res.status}`);
        const { access_token, expires_in } = await res.json();

        if (cancelled) return;

        // ── 2. Inicializar el SDK de Autodesk ─────────────────────────────
        setPhase('init');
        const options = {
          env: 'AutodeskProduction',
          getAccessToken: (callback) => {
            // APS llamará a esta función cuando el token esté por expirar
            callback(access_token, expires_in);
          },
        };

        await new Promise((resolve, reject) => {
          window.Autodesk.Viewing.Initializer(options, resolve, reject);
        });

        if (cancelled) return;

        // ── 3. Crear la instancia del Viewer en el contenedor ─────────────
        const viewer = new window.Autodesk.Viewing.GuiViewer3D(
          containerRef.current,
          { extensions: ['Autodesk.DefaultTools.NavTools'] },
        );
        viewer.start();
        viewerRef.current = viewer;

        // ── 4. Cargar el documento por URN ────────────────────────────────
        setPhase('loading');
        const documentId = `urn:${urn}`;

        await new Promise((resolve, reject) => {
          window.Autodesk.Viewing.Document.load(
            documentId,
            (doc) => {
              const defaultGeometry = doc.getRoot().getDefaultGeometry();
              viewer.loadDocumentNode(doc, defaultGeometry);
              resolve();
            },
            (errorCode, errorMessage) => {
              reject(new Error(`Error cargando documento (${errorCode}): ${errorMessage}`));
            },
          );
        });

        if (cancelled) return;
        setPhase('ready');

      } catch (err) {
        if (cancelled) return;
        console.error('[ForgeViewer] Error al inicializar el visor:', err);
        setPhase('error');
        setErrorMsg(
          err.message ||
          'No se pudo inicializar el visor. Verifica que el URN sea válido y que el modelo esté traducido en APS.',
        );
      }
    };

    initViewer();

    // ── Limpieza: destruir el viewer al desmontar ─────────────────────────
    return () => {
      cancelled = true;
      if (viewerRef.current) {
        viewerRef.current.finish();
        viewerRef.current = null;
      }
      // Permite reinicializar el SDK en la próxima montura
      if (window.Autodesk?.Viewing) {
        window.Autodesk.Viewing.shutdown();
      }
    };
  }, [urn]);

  // ── Textos de estado por fase ──────────────────────────────────────────────
  const phaseLabel = {
    idle:    'Preparando...',
    token:   'Autenticando con Autodesk...',
    init:    'Iniciando motor de visualización 3D...',
    loading: 'Cargando modelo BIM...',
  };

  return (
    <div className="relative flex h-full min-h-[480px] w-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-slate-950 dark:border-[#30363d] midnight:border-cyan-900/30">

      {/* ── Panel de estado: visible durante carga y en caso de error ── */}
      {phase !== 'ready' && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 bg-slate-950/90 px-6">
          {phase !== 'error' ? (
            <>
              {/* Spinner naranja — mismo color que el botón de Revit */}
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-orange-500/30 border-t-orange-500" />
              <p className="text-center text-sm text-slate-400">
                {phaseLabel[phase] ?? 'Cargando...'}
              </p>
            </>
          ) : (
            <>
              <div className="flex h-12 w-12 items-center justify-center rounded-full border border-red-500/30 bg-red-500/10 text-red-400">
                {/* Ícono X simple en SVG para no depender de lucide en este punto */}
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </div>
              <p className="max-w-sm text-center text-sm text-red-400">{errorMsg}</p>
              <button
                type="button"
                onClick={onClose}
                className="mt-2 rounded-lg border border-slate-600 px-5 py-2 text-xs text-slate-300 transition-colors hover:bg-slate-800 hover:text-white"
              >
                Cerrar
              </button>
            </>
          )}
        </div>
      )}

      {/* ── Botón cerrar siempre visible ── */}
      <button
        type="button"
        onClick={onClose}
        aria-label="Cerrar visor 3D"
        title="Cerrar visor"
        className="absolute right-3 top-3 z-20 flex h-8 w-8 items-center justify-center rounded-lg bg-slate-800/80 text-slate-300 transition-colors hover:bg-slate-700 hover:text-white"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>

      {/* ── Contenedor del Viewer — Autodesk lo llena con WebGL ── */}
      <div ref={containerRef} className="h-full w-full" />
    </div>
  );
}
