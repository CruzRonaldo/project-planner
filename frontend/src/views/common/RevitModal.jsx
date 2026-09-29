import React, { useState, useEffect, useRef } from 'react';
import { Box, Eye, RotateCw, Trash2, X, UploadCloud, Edit2, Check, XCircle } from 'lucide-react';
import ForgeViewer from '../../components/ForgeViewer';
import { revitApi } from '../../services/revitService';
import { useToast } from '../../context/ToastContext';

const cardClass =
  'rounded-xl border border-slate-200 bg-white shadow-sm transition-colors duration-300 ' +
  'dark:border-[#30363d] dark:bg-[#161b22] dark:shadow-[0_14px_32px_rgba(0,0,0,0.12)] ' +
  'midnight:border-cyan-900/30 midnight:bg-[#0a1120] midnight:shadow-none';

const nestedClass =
  'rounded-lg border border-slate-200 bg-slate-50 transition-colors duration-300 ' +
  'dark:border-blue-400/25 dark:bg-[#0d1117] ' +
  'midnight:border-cyan-800/40 midnight:bg-[#050B14]';

const TABLE_COLUMNS = [
  { key: 'name',     label: 'Nombre del Modelo',     align: 'left'  },
  { key: 'uploader', label: 'Subido por',            align: 'left'  },
  { key: 'size',     label: 'Tamaño',                align: 'left'  },
  { key: 'synced',   label: 'Última Sincronización', align: 'left'  },
  { key: 'actions',  label: 'Acciones',              align: 'right' },
];

function StatusBadge({ connected }) {
  if (connected) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded border border-emerald-300 bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-700 transition-colors duration-300 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-400 midnight:border-emerald-600/30 midnight:bg-emerald-500/10 midnight:text-emerald-300">
        <i className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
        Conectado
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded border border-amber-300 bg-amber-50 px-2 py-1 text-[10px] font-semibold text-amber-700 transition-colors duration-300 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-400 midnight:border-amber-600/30 midnight:bg-amber-500/10 midnight:text-amber-300">
      <i className="h-1.5 w-1.5 rounded-full bg-amber-500" />
      Desconectado
    </span>
  );
}

function ModelRow({ model, onDelete, onView, onRename }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(model.name);

  const handleSaveRename = async () => {
    if (editName.trim() && editName !== model.name) {
      await onRename(model.id, editName);
    }
    setIsEditing(false);
  };

  return (
    <tr className="text-slate-700 transition-colors duration-150 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-white/[0.03] midnight:text-cyan-100 midnight:hover:bg-cyan-950/40">
      <td className="px-3 py-3">
        <div className="flex items-center gap-2">
          <Box size={14} className="shrink-0 text-orange-500 dark:text-orange-400 midnight:text-orange-300" />
          {isEditing ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveRename();
                  if (e.key === 'Escape') setIsEditing(false);
                }}
                className="w-full rounded border border-slate-300 px-2 py-1 text-xs outline-none dark:border-slate-600 dark:bg-[#0d1117] midnight:border-cyan-800 midnight:bg-[#050B14]"
                autoFocus
              />
              <button onClick={handleSaveRename} className="text-emerald-500 hover:text-emerald-600"><Check size={14} /></button>
              <button onClick={() => setIsEditing(false)} className="text-red-500 hover:text-red-600"><XCircle size={14} /></button>
            </div>
          ) : (
            <span className="max-w-[200px] truncate font-medium">{model.name}</span>
          )}
        </div>
      </td>
      <td className="px-3 py-3">
        <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-1 text-[10px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300 midnight:bg-cyan-900/30 midnight:text-cyan-200">
          {model.uploaded_by_name || 'Desconocido'}
        </span>
      </td>
      <td className="px-3 py-3 text-slate-500 dark:text-slate-400 midnight:text-cyan-600">{model.size}</td>
      <td className="px-3 py-3 text-slate-500 dark:text-slate-400 midnight:text-cyan-600">{model.synced}</td>
      <td className="px-3 py-3">
        <div className="flex items-center justify-end gap-1">
          {!isEditing && (
            <button
              type="button"
              title="Renombrar modelo"
              onClick={() => setIsEditing(true)}
              className="rounded-md p-2 text-slate-500 hover:bg-slate-100 hover:text-cyan-600 dark:hover:bg-white/5 dark:hover:text-cyan-300 midnight:hover:bg-cyan-900/30"
            >
              <Edit2 size={14} />
            </button>
          )}
          <button
            type="button"
            title="Ver modelo en 3D"
            onClick={() => onView(model)}
            className="rounded-md p-2 text-slate-500 hover:bg-slate-100 hover:text-cyan-600 dark:hover:bg-white/5 dark:hover:text-cyan-300 midnight:hover:bg-cyan-900/30"
          >
            <Eye size={14} />
          </button>
          <button
            type="button"
            title="Eliminar modelo"
            onClick={() => onDelete(model)}
            className="rounded-md p-2 text-slate-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10 dark:hover:text-red-400 midnight:hover:bg-red-500/10"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </td>
    </tr>
  );
}

export default function RevitModal({ onClose }) {
  const [isConnected, setIsConnected] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [models, setModels] = useState([]);
  const [modelToDelete, setModelToDelete] = useState(null);
  const [viewingModel, setViewingModel] = useState(null);
  
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);
  const { showToast } = useToast();

  useEffect(() => {
    const handleKey = (event) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  useEffect(() => {
    checkConnectionSilently();
  }, []);

  const checkConnectionSilently = async () => {
    setIsCheckingAuth(true);
    try {
      const response = await revitApi.checkStatus();
      if (response.data?.connected) {
        setIsConnected(true);
        loadModels();
      } else {
        setIsConnected(false);
      }
    } catch (err) {
      setIsConnected(false);
    } finally {
      setIsCheckingAuth(false);
    }
  };

  const handleConnect = async () => {
    setIsCheckingAuth(true);
    try {
      // Utilizamos getToken para golpear el endpoint que genera el token explícitamente y falla con status >= 400 si hay error
      const response = await revitApi.getToken();
      if (response.data?.access_token) {
        setIsConnected(true);
        showToast({ title: 'Éxito', message: 'Conexión con Autodesk APS establecida.', type: 'success' });
        loadModels();
      } else {
        throw new Error('No se recibió el token de acceso.');
      }
    } catch (err) {
      console.error("Error detallado al conectar con APS:", err);
      console.error("Respuesta del servidor:", err.response?.data);
      showToast({ title: 'Error', message: 'Fallo al conectar con Autodesk APS. Verifica la consola para más detalles.', type: 'error' });
      setIsConnected(false);
    } finally {
      setIsCheckingAuth(false);
    }
  };

  const loadModels = async () => {
    setIsLoadingModels(true);
    try {
      const response = await revitApi.getModels();
      setModels(response.data.models || []);
    } catch (err) {
      showToast({ title: 'Error', message: 'No se pudieron cargar los modelos de la bóveda.', type: 'error' });
    } finally {
      setIsLoadingModels(false);
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsUploading(true);
    try {
      await revitApi.uploadModel(file);
      showToast({ title: 'Éxito', message: `El modelo ${file.name} se subió y agregó a la bóveda correctamente.`, type: 'success' });
      event.target.value = null;
      loadModels();
    } catch (err) {
      showToast({ title: 'Error', message: 'Error al subir y traducir el modelo.', type: 'error' });
    } finally {
      setIsUploading(false);
    }
  };

  const handleRename = async (id, newName) => {
    try {
      await revitApi.renameModel(id, newName);
      showToast({ title: 'Renombrado', message: 'El nombre del modelo ha sido actualizado.', type: 'success' });
      loadModels();
    } catch (err) {
      showToast({ title: 'Error', message: 'No se pudo renombrar el modelo.', type: 'error' });
    }
  };

  const confirmDelete = async () => {
    if (!modelToDelete) return;
    try {
      await revitApi.deleteModel(modelToDelete.id);
      showToast({ title: 'Eliminado', message: 'El modelo se ha eliminado localmente.', type: 'success' });
      setModelToDelete(null);
      loadModels();
    } catch (err) {
      showToast({ title: 'Error', message: 'No se pudo eliminar el modelo.', type: 'error' });
    }
  };

  return (
    <div
      role="presentation"
      onMouseDown={onClose}
      className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-900/40 p-3 backdrop-blur-sm transition-colors duration-300 dark:bg-[#020617]/85 midnight:bg-[#020617]/90 sm:p-5"
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="revit-modal-title"
        onMouseDown={(e) => e.stopPropagation()}
        className={`flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-slate-200 shadow-[0_25px_90px_rgba(15,23,42,0.18)] transition-colors duration-300 dark:border-[#30363d] dark:shadow-[0_25px_90px_rgba(0,0,0,0.72)] midnight:border-cyan-900/30 ${cardClass}`}
      >
        <header className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-200 px-5 py-4 transition-colors duration-300 dark:border-[#30363d] midnight:border-cyan-900/30">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-orange-200 bg-orange-50 text-orange-600 transition-colors duration-300 dark:border-orange-500/25 dark:bg-orange-500/15 dark:text-orange-400 midnight:border-orange-700/40 midnight:bg-orange-500/15 midnight:text-orange-300">
              <Box size={20} />
            </span>
            <div>
              <h2 id="revit-modal-title" className="text-base font-bold text-slate-900 transition-colors duration-300 dark:text-white midnight:text-cyan-50">
                Bóveda BIM Colaborativa (APS)
              </h2>
              <p className="mt-0.5 text-xs text-slate-500 transition-colors duration-300 dark:text-slate-400 midnight:text-cyan-500/70">
                Gestiona y visualiza modelos 3D compartidos con todo el equipo.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-500 transition-colors duration-300 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-white midnight:text-cyan-500/70 midnight:hover:bg-cyan-900/20 midnight:hover:text-cyan-50"
          >
            <X size={18} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-5">
          <div className={`flex flex-wrap items-center justify-between gap-4 rounded-lg p-4 ${nestedClass}`}>
            <div className="space-y-1">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 transition-colors duration-300 dark:text-slate-400 midnight:text-cyan-600">
                Estado de la integración
              </p>
              {isCheckingAuth ? (
                <span className="text-xs text-slate-500">Comprobando conexión...</span>
              ) : (
                <StatusBadge connected={isConnected} />
              )}
            </div>

            {!isConnected && !isCheckingAuth && (
              <button
                type="button"
                onClick={handleConnect}
                className="inline-flex items-center gap-2 rounded-lg bg-orange-500 px-5 py-2.5 text-xs font-semibold text-white shadow-sm transition-colors duration-300 hover:bg-orange-400 active:scale-95"
              >
                <RotateCw size={14} /> Conectar con Autodesk APS
              </button>
            )}
          </div>

          {isConnected && (
            <>
              <div className="mt-5 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center transition-colors dark:border-slate-700 dark:bg-[#0d1117] midnight:border-cyan-900/50 midnight:bg-cyan-950/10">
                <input 
                  type="file" 
                  accept=".rvt" 
                  style={{ display: 'none' }} 
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                />
                <div className="mx-auto flex max-w-sm flex-col items-center gap-3">
                  <div className="rounded-full bg-slate-200 p-3 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                    <UploadCloud size={24} />
                  </div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white midnight:text-cyan-50">Subir modelo a la bóveda</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Sube un archivo de Revit (.rvt). Será procesado y visible para todos los miembros del proyecto.</p>
                  <button
                    type="button"
                    disabled={isUploading}
                    onClick={() => fileInputRef.current.click()}
                    className="mt-2 inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
                  >
                    {isUploading ? <><RotateCw size={14} className="animate-spin" /> Subiendo y traduciendo...</> : 'Seleccionar archivo .rvt'}
                  </button>
                </div>
              </div>

              <div className="mt-6">
                <h3 className="mb-3 text-sm font-semibold text-slate-900 dark:text-white midnight:text-cyan-50">
                  Modelos Compartidos ({models.length})
                </h3>
                
                <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-[#30363d] midnight:border-cyan-900/40">
                  <table className="w-full min-w-[580px] text-left text-xs">
                    <thead className="bg-slate-100 text-[10px] uppercase text-slate-500 dark:bg-white/5 dark:text-slate-400 midnight:bg-cyan-950/30 midnight:text-cyan-600">
                      <tr>
                        {TABLE_COLUMNS.map((col) => (
                          <th key={col.key} className={`px-3 py-2.5 font-medium ${col.align === 'right' ? 'text-right' : ''}`}>
                            {col.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-[#30363d] midnight:divide-cyan-900/30">
                      {isLoadingModels ? (
                        <tr><td colSpan={5} className="py-8 text-center text-slate-500"><RotateCw size={24} className="mx-auto animate-spin text-orange-500" /></td></tr>
                      ) : models.length === 0 ? (
                        <tr><td colSpan={5} className="py-8 text-center text-slate-500">No hay modelos en la bóveda aún.</td></tr>
                      ) : (
                        models.map((model) => (
                          <ModelRow
                            key={model.id}
                            model={model}
                            onDelete={(m) => setModelToDelete(m)}
                            onView={setViewingModel}
                            onRename={handleRename}
                          />
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>

        <footer className="flex shrink-0 items-center justify-between gap-3 border-t border-slate-200 px-5 py-3 transition-colors duration-300 dark:border-[#30363d] midnight:border-cyan-900/30">
          <p className="text-[10px] text-slate-400 dark:text-slate-500 midnight:text-cyan-700">
            Bóveda colaborativa. Los archivos están disponibles para todos los miembros con acceso.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-300 px-4 py-2 text-xs text-slate-600 transition-colors hover:bg-slate-50 dark:border-[#30363d] dark:text-slate-300 dark:hover:bg-white/5 midnight:border-cyan-800/40 midnight:text-cyan-200"
          >
            Cerrar
          </button>
        </footer>

        {modelToDelete && (
          <div className="absolute inset-0 z-[100] flex items-center justify-center rounded-2xl bg-slate-900/60 p-4 backdrop-blur-sm dark:bg-[#020617]/80 midnight:bg-[#020617]/85">
            <div className={`w-full max-w-sm overflow-hidden rounded-xl shadow-[0_20px_60px_rgba(0,0,0,0.35)] ${cardClass}`}>
              <div className="h-1 w-full bg-red-500 dark:bg-red-600" />
              <div className="px-5 py-5">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400">
                  <Trash2 size={18} />
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">¿Eliminar modelo?</h3>
                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                  Vas a eliminar <strong className="font-semibold">{modelToDelete.name}</strong> de la bóveda.
                </p>
                <div className="mt-5 flex justify-end gap-2">
                  <button onClick={() => setModelToDelete(null)} className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:border-[#30363d] dark:text-slate-300 dark:hover:bg-white/5">Cancelar</button>
                  <button onClick={confirmDelete} className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-500">Eliminar</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {viewingModel && (
          <div className="absolute inset-0 z-[110] flex flex-col overflow-hidden rounded-2xl bg-slate-950">
            <div className="flex shrink-0 items-center justify-between border-b border-slate-800 bg-slate-900 px-4 py-3">
              <div className="flex items-center gap-2">
                <Box size={14} className="text-orange-400" />
                <span className="max-w-[400px] truncate text-xs font-medium text-slate-200">{viewingModel.name}</span>
              </div>
              <button onClick={() => setViewingModel(null)} className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-400 hover:bg-slate-800 hover:text-slate-200">← Volver</button>
            </div>
            <div className="flex-1 overflow-hidden">
              <ForgeViewer urn={viewingModel.urn} onClose={() => setViewingModel(null)} />
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
