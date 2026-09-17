import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  Box,
  Cloud,
  ExternalLink,
  File as FileIcon,
  Folder,
  FolderPlus,
  Pencil,
  RotateCw,
  Save,
  Settings2,
  Trash2,
  Upload,
  Workflow,
  X,
  Zap,
} from 'lucide-react';
import { filterIntegrations, integrationStatuses, summarizeIntegrations, syncFrequencies, testIntegration, updateIntegration } from '../../mocks/integrationsData';
import api from '../../services/api';
import { makeApi } from '../../services/makeApi';


const iconMap = { cloud: Cloud, model: Box, workflow: Workflow, automation: Zap };
const activityStyles = {
  success: { label: 'Éxito', className: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 midnight:bg-emerald-500/10 midnight:text-emerald-300' },
  error: { label: 'Error', className: 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400 midnight:bg-red-500/10 midnight:text-red-300' },
  processing: { label: 'En proceso', className: 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 midnight:bg-cyan-500/10 midnight:text-cyan-300' },
};
const inputClass = 'mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition-colors duration-300 focus:border-cyan-500 dark:border-[#30363d] dark:bg-[#0d1117] dark:text-white dark:focus:border-cyan-400 midnight:border-cyan-800/40 midnight:bg-[#050B14] midnight:text-cyan-50 midnight:focus:border-cyan-500';
const cardClass = 'rounded-xl border border-slate-200 bg-white shadow-sm transition-colors duration-300 dark:border-[#30363d] dark:bg-[#161b22] dark:shadow-[0_14px_32px_rgba(0,0,0,0.12)] midnight:border-cyan-900/30 midnight:bg-[#0a1120] midnight:shadow-none';
const nestedClass = 'rounded-lg border border-slate-200 bg-slate-50 transition-colors duration-300 dark:border-blue-400/25 dark:bg-[#0d1117] midnight:border-cyan-800/40 midnight:bg-[#050B14]';

const apiBaseUrl = (
  import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api'
).replace(/\/$/, '');

const googleDriveConnectUrl = `${apiBaseUrl}/integrations/google-drive/connect/`;

function updateGoogleDriveStatus(data, driveStatus) {
  const connected = Boolean(driveStatus.connected);
  const displayName = driveStatus.display_name || '';
  const email = driveStatus.email || '';

  return {
    ...data,
    integrations: data.integrations.map((integration) => {
      if (integration.id !== 'drive') return integration;

      return {
        ...integration,
        status: connected ? 'connected' : 'offline',
        description: connected
          ? `Google Drive conectado como ${displayName || email}.`
          : 'Google Drive todavía no ha sido autorizado.',
        endpoint: connected ? email : 'Sin cuenta conectada',
        errors: 0,
        lastActivity: connected ? 'Verificado ahora' : 'Sin conexión',
        metrics: [
          {
            key: 'account',
            value: connected ? 1 : 0,
            label: connected ? 'cuenta conectada' : 'cuentas conectadas',
          },
          {
            key: 'api',
            value: connected ? 'Activa' : 'Pendiente',
            label: 'Google Drive API',
          },
        ],
      };
    }),
  };
}

function IntegrationStatus({ status }) {
  const details = integrationStatuses.find((item) => item.id === status);
  return <span className={`rounded border px-2 py-1 text-[10px] font-semibold ${details.className}`}>{details.label}</span>;
}

function IntegrationCard({ integration, onConfigure }) {
  const Icon = iconMap[integration.icon];
  return (
    <article className={`flex min-h-[225px] min-w-0 flex-col p-5 ${cardClass}`}>
      <header className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-cyan-50 text-cyan-700 transition-colors duration-300 dark:bg-blue-500/25 dark:text-blue-300 midnight:bg-cyan-500/20 midnight:text-cyan-300"><Icon size={20} /></span>
          <h2 className="truncate text-base font-semibold text-slate-900 transition-colors duration-300 dark:text-white midnight:text-cyan-50">{integration.name}</h2>
        </div>
        <IntegrationStatus status={integration.status} />
      </header>
      <p className="mt-4 min-h-10 text-xs leading-relaxed text-slate-500 transition-colors duration-300 dark:text-slate-400 midnight:text-cyan-500/70">{integration.description}</p>
      <div className="mt-4 grid grid-cols-2 gap-4">
        {integration.metrics.map((metric) => <div key={metric.key}>
          <strong className={`text-base ${metric.key === 'errors' && Number(metric.value) > 0 ? 'text-red-600 dark:text-red-400 midnight:text-red-300' : 'text-cyan-600 dark:text-cyan-400 midnight:text-cyan-400'}`}>{metric.value}</strong>
          <p className="mt-0.5 text-[10px] text-slate-500 transition-colors duration-300 dark:text-slate-400 midnight:text-cyan-600">{metric.label}</p>
        </div>)}
      </div>
      <footer className="mt-auto flex items-end justify-between gap-3 pt-4">
        <span className="text-[10px] text-slate-500 transition-colors duration-300 dark:text-slate-400 midnight:text-cyan-600">Actividad: {integration.lastActivity}</span>
        <button type="button" onClick={() => onConfigure(integration.id)} aria-label={`Configurar ${integration.name}`} className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white transition-colors duration-300 hover:bg-slate-800 dark:bg-blue-500/25 dark:text-blue-100 dark:hover:bg-blue-500/35 midnight:bg-cyan-500/20 midnight:text-cyan-100 midnight:hover:bg-cyan-500/30"><Settings2 size={14} /> Configurar</button>
      </footer>
    </article>
  );
}

function formatFileSize(bytes) {
  if (bytes === null || bytes === undefined) return 'Carpeta';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function GoogleDriveFileManager({ connected }) {
  const [files, setFiles] = useState([]);
  const [folderStack, setFolderStack] = useState([]);
  const [folderName, setFolderName] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [working, setWorking] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const currentFolder = folderStack[folderStack.length - 1] || null;

  const showRequestError = (requestError, fallback) => {
    setError(requestError.response?.data?.message || fallback);
    setMessage('');
  };

  const loadFolder = async (folder = null, navigation = 'initial') => {
    if (!connected) return;

    setLoading(true);
    setError('');

    try {
      const response = await api.get('/integrations/google-drive/files/', {
        params: folder?.id ? { folder_id: folder.id } : {},
      });
      const result = response.data;

      setFiles(result.files || []);

      if (navigation === 'initial') {
        setFolderStack([result.current_folder]);
      } else if (navigation === 'push') {
        setFolderStack((current) => [...current, result.current_folder]);
      } else if (navigation === 'back') {
        setFolderStack((current) => [
          ...current.slice(0, -2),
          result.current_folder,
        ]);
      }
    } catch (requestError) {
      showRequestError(
        requestError,
        'No se pudieron cargar los archivos de Google Drive.',
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (connected) {
      loadFolder();
    } else {
      setFiles([]);
      setFolderStack([]);
    }
    // Se vuelve a cargar cuando cambia el estado real de la conexión.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connected]);

  const refreshCurrentFolder = async (showFeedback = true) => {
    setLoading(true);
    setError('');

    try {
      const response = await api.get('/integrations/google-drive/files/', {
        params: currentFolder?.id ? { folder_id: currentFolder.id } : {},
      });
      setFiles(response.data.files || []);
      if (showFeedback) setMessage('Contenido actualizado.');
    } catch (requestError) {
      showRequestError(
        requestError,
        'No se pudo actualizar el contenido de Google Drive.',
      );
    } finally {
      setLoading(false);
    }
  };

  const goBack = async () => {
    if (folderStack.length <= 1) return;
    const previousFolder = folderStack[folderStack.length - 2];
    await loadFolder(previousFolder, 'back');
  };

  const createDriveFolder = async () => {
    const cleanName = folderName.trim();

    if (!cleanName) {
      setError('Escribe un nombre para la carpeta.');
      return;
    }

    setWorking(true);
    setError('');

    try {
      await api.post('/integrations/google-drive/folders/', {
        name: cleanName,
        parent_id: currentFolder?.id,
      });
      setFolderName('');
      setMessage(`Carpeta “${cleanName}” creada correctamente.`);
      await refreshCurrentFolder(false);
    } catch (requestError) {
      showRequestError(
        requestError,
        'No se pudo crear la carpeta de Google Drive.',
      );
    } finally {
      setWorking(false);
    }
  };

  const uploadDriveFile = async () => {
    if (!selectedFile) {
      setError('Selecciona un archivo para subir.');
      return;
    }

    const formData = new FormData();
    formData.append('file', selectedFile);

    if (currentFolder?.id) {
      formData.append('folder_id', currentFolder.id);
    }

    setWorking(true);
    setError('');

    try {
      await api.post('/integrations/google-drive/upload/', formData);
      setMessage(`Archivo “${selectedFile.name}” subido correctamente.`);
      setSelectedFile(null);
      await refreshCurrentFolder(false);
    } catch (requestError) {
      showRequestError(
        requestError,
        'No se pudo subir el archivo a Google Drive.',
      );
    } finally {
      setWorking(false);
    }
  };

  const renameDriveItem = async (item) => {
    const newName = window.prompt('Nuevo nombre:', item.name)?.trim();

    if (!newName || newName === item.name) return;

    setWorking(true);
    setError('');

    try {
      await api.patch(`/integrations/google-drive/files/${item.id}/`, {
        name: newName,
      });
      setMessage('Nombre actualizado correctamente.');
      await refreshCurrentFolder(false);
    } catch (requestError) {
      showRequestError(
        requestError,
        'No se pudo cambiar el nombre del elemento.',
      );
    } finally {
      setWorking(false);
    }
  };

  const deleteDriveItem = async (item) => {
    const confirmed = window.confirm(
      `¿Deseas enviar “${item.name}” a la papelera de Google Drive?`,
    );

    if (!confirmed) return;

    setWorking(true);
    setError('');

    try {
      await api.delete(`/integrations/google-drive/files/${item.id}/`);
      setMessage(`“${item.name}” fue enviado a la papelera.`);
      await refreshCurrentFolder(false);
    } catch (requestError) {
      showRequestError(
        requestError,
        'No se pudo eliminar el elemento de Google Drive.',
      );
    } finally {
      setWorking(false);
    }
  };

  if (!connected) {
    return (
      <div className={`mt-4 p-4 text-xs text-slate-500 dark:text-slate-400 midnight:text-cyan-500/70 ${nestedClass}`}>
        Conecta Google Drive para administrar carpetas y archivos.
      </div>
    );
  }

  return (
    <section className={`mt-4 overflow-hidden p-4 ${nestedClass}`} aria-labelledby="drive-files-title">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h3 id="drive-files-title" className="text-sm font-semibold text-slate-900 dark:text-white midnight:text-cyan-50">
            Archivos de Project Planner
          </h3>
          <p className="mt-1 truncate text-[10px] text-slate-500 dark:text-slate-400 midnight:text-cyan-600">
            {folderStack.map((folder) => folder.name).join(' / ') || 'Project Planner'}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={loading || folderStack.length <= 1}
            onClick={goBack}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-2 text-[11px] text-slate-600 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-40 dark:border-[#30363d] dark:text-slate-300 dark:hover:text-white midnight:border-cyan-800/40 midnight:text-cyan-200"
          >
            <ArrowLeft size={13} /> Atrás
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={() => refreshCurrentFolder(true)}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-2 text-[11px] text-slate-600 hover:text-slate-900 disabled:opacity-50 dark:border-[#30363d] dark:text-slate-300 dark:hover:text-white midnight:border-cyan-800/40 midnight:text-cyan-200"
          >
            <RotateCw size={13} className={loading ? 'animate-spin' : ''} /> Actualizar
          </button>
        </div>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <div className="flex gap-2">
          <input
            value={folderName}
            maxLength={200}
            onChange={(event) => setFolderName(event.target.value)}
            placeholder="Nombre de la carpeta"
            className={`${inputClass} mt-0 min-w-0 flex-1`}
          />
          <button
            type="button"
            disabled={working}
            onClick={createDriveFolder}
            className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-cyan-500 px-3 py-2 text-[11px] font-semibold text-slate-950 hover:bg-cyan-400 disabled:opacity-50"
          >
            <FolderPlus size={14} /> Crear
          </button>
        </div>

        <div className="flex min-w-0 gap-2">
          <label className="flex min-w-0 flex-1 cursor-pointer items-center rounded-lg border border-slate-300 bg-white px-3 py-2 text-[11px] text-slate-600 dark:border-[#30363d] dark:bg-[#0d1117] dark:text-slate-300 midnight:border-cyan-800/40 midnight:bg-[#050B14] midnight:text-cyan-200">
            <span className="truncate">
              {selectedFile?.name || 'Seleccionar archivo'}
            </span>
            <input
              type="file"
              className="sr-only"
              onChange={(event) => setSelectedFile(event.target.files?.[0] || null)}
            />
          </label>
          <button
            type="button"
            disabled={working || !selectedFile}
            onClick={uploadDriveFile}
            className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-cyan-500 px-3 py-2 text-[11px] font-semibold text-slate-950 hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Upload size={14} /> Subir
          </button>
        </div>
      </div>

      {error && <p role="alert" className="mt-3 text-xs text-red-600 dark:text-red-400 midnight:text-red-300">{error}</p>}
      {message && <p role="status" className="mt-3 text-xs text-emerald-600 dark:text-emerald-400 midnight:text-emerald-300">{message}</p>}

      <div className="mt-4 overflow-x-auto rounded-lg border border-slate-200 dark:border-[#30363d] midnight:border-cyan-900/40">
        <table className="w-full min-w-[620px] text-left text-xs">
          <thead className="bg-slate-100 text-[10px] uppercase text-slate-500 dark:bg-white/5 dark:text-slate-400 midnight:bg-cyan-950/30 midnight:text-cyan-600">
            <tr>
              <th className="px-3 py-2 font-medium">Nombre</th>
              <th className="px-3 py-2 font-medium">Tamaño</th>
              <th className="px-3 py-2 font-medium">Modificado</th>
              <th className="px-3 py-2 text-right font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-[#30363d] midnight:divide-cyan-900/30">
            {loading && (
              <tr><td colSpan="4" className="px-3 py-8 text-center text-slate-500">Cargando archivos...</td></tr>
            )}
            {!loading && files.map((item) => (
              <tr key={item.id} className="text-slate-700 dark:text-slate-300 midnight:text-cyan-100">
                <td className="px-3 py-3">
                  <button
                    type="button"
                    disabled={!item.is_folder}
                    onClick={() => item.is_folder && loadFolder(item, 'push')}
                    className={`flex max-w-[300px] items-center gap-2 text-left ${item.is_folder ? 'hover:text-cyan-600 dark:hover:text-cyan-300' : 'cursor-default'}`}
                  >
                    {item.is_folder ? <Folder size={16} className="shrink-0 text-amber-500" /> : <FileIcon size={16} className="shrink-0 text-cyan-500" />}
                    <span className="truncate">{item.name}</span>
                  </button>
                </td>
                <td className="px-3 py-3 text-slate-500 dark:text-slate-400 midnight:text-cyan-600">{formatFileSize(item.size)}</td>
                <td className="px-3 py-3 text-slate-500 dark:text-slate-400 midnight:text-cyan-600">
                  {item.modified_time ? new Date(item.modified_time).toLocaleString() : '—'}
                </td>
                <td className="px-3 py-3">
                  <div className="flex justify-end gap-1">
                    {item.web_view_link && (
                      <a
                        href={item.web_view_link}
                        target="_blank"
                        rel="noreferrer"
                        title="Abrir en Google Drive"
                        className="rounded-md p-2 text-slate-500 hover:bg-slate-100 hover:text-cyan-600 dark:hover:bg-white/5 midnight:text-cyan-600 midnight:hover:bg-cyan-900/30 midnight:hover:text-cyan-200"
                      >
                        <ExternalLink size={14} />
                      </a>
                    )}
                    <button
                      type="button"
                      disabled={working}
                      title="Cambiar nombre"
                      onClick={() => renameDriveItem(item)}
                      className="rounded-md p-2 text-slate-500 hover:bg-slate-100 hover:text-cyan-600 disabled:opacity-40 dark:hover:bg-white/5 midnight:text-cyan-600 midnight:hover:bg-cyan-900/30 midnight:hover:text-cyan-200"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      type="button"
                      disabled={working}
                      title="Eliminar"
                      onClick={() => deleteDriveItem(item)}
                      className="rounded-md p-2 text-slate-500 hover:bg-red-50 hover:text-red-600 disabled:opacity-40 dark:hover:bg-red-500/10 midnight:text-cyan-600 midnight:hover:bg-red-500/10 midnight:hover:text-red-300"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!loading && files.length === 0 && (
              <tr><td colSpan="4" className="px-3 py-8 text-center text-slate-500 dark:text-slate-400 midnight:text-cyan-600">Esta carpeta está vacía.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function IntegrationEditor({
  integration,
  onSave,
  onTest,
  onConnect,
  onCancel,
  testing = false,
}) {
  const isGoogleDrive = integration.id === 'drive';
  const [draft, setDraft] = useState({
    status: integration.status,
    endpoint: integration.endpoint,
    frequency: integration.frequency,
    errors: integration.errors,
  });
  const [error, setError] = useState('');

  const changeField = (field) => (event) => {
    setDraft((current) => ({
      ...current,
      [field]: event.target.value,
    }));
    setError('');
  };

  const submit = (event) => {
    event.preventDefault();

    if (isGoogleDrive) return;

    try {
      onSave(integration.id, draft);
    } catch (saveError) {
      setError(saveError.message);
    }
  };

  return (
    <form
      onSubmit={submit}
      className={`p-4 sm:p-5 ${cardClass} border-cyan-300 dark:border-cyan-400/30 midnight:border-cyan-500/30`}
      aria-labelledby="integration-editor-title"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2
            id="integration-editor-title"
            className="text-base font-semibold text-slate-900 transition-colors duration-300 dark:text-white midnight:text-cyan-50"
          >
            Configurar {integration.name}
          </h2>
          <p className="mt-1 text-xs text-slate-500 transition-colors duration-300 dark:text-slate-400 midnight:text-cyan-500/70">
            {isGoogleDrive
              ? 'Estado consultado directamente desde Google Drive mediante Django.'
              : 'Ajustes locales de demostración; no se envían credenciales.'}
          </p>
        </div>
        <button
          type="button"
          onClick={onCancel}
          aria-label="Cerrar configuración"
          className="rounded-lg p-2 text-slate-500 transition-colors duration-300 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-white midnight:text-cyan-500/70 midnight:hover:bg-cyan-900/20 midnight:hover:text-cyan-50"
        >
          <X size={18} />
        </button>
      </div>

      {isGoogleDrive ? (
        <>
          <div className={`mt-4 grid gap-3 p-4 sm:grid-cols-2 ${nestedClass}`}>
            <div>
              <p className="text-[10px] uppercase text-slate-500 dark:text-slate-400 midnight:text-cyan-600">
                Estado
              </p>
              <div className="mt-2">
                <IntegrationStatus status={integration.status} />
              </div>
            </div>
            <div>
              <p className="text-[10px] uppercase text-slate-500 dark:text-slate-400 midnight:text-cyan-600">
                Cuenta autorizada
              </p>
              <p className="mt-2 break-all text-xs font-medium text-slate-800 dark:text-slate-200 midnight:text-cyan-100">
                {integration.endpoint || 'Sin cuenta conectada'}
              </p>
            </div>
          </div>
          <GoogleDriveFileManager connected={integration.status === 'connected'} />
        </>
      ) : (
        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <label className="text-xs text-slate-500 transition-colors duration-300 dark:text-slate-400 midnight:text-cyan-500/70">
            Estado
            <select value={draft.status} onChange={changeField('status')} className={inputClass}>
              {integrationStatuses.map((statusItem) => (
                <option key={statusItem.id} value={statusItem.id}>
                  {statusItem.label}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs text-slate-500 transition-colors duration-300 dark:text-slate-400 midnight:text-cyan-500/70">
            Carpeta / endpoint
            <input
              autoFocus
              required
              maxLength={120}
              value={draft.endpoint}
              onChange={changeField('endpoint')}
              className={inputClass}
            />
          </label>
          <label className="text-xs text-slate-500 transition-colors duration-300 dark:text-slate-400 midnight:text-cyan-500/70">
            Frecuencia
            <select value={draft.frequency} onChange={changeField('frequency')} className={inputClass}>
              {syncFrequencies.map((frequency) => (
                <option key={frequency}>{frequency}</option>
              ))}
            </select>
          </label>
          <label className="text-xs text-slate-500 transition-colors duration-300 dark:text-slate-400 midnight:text-cyan-500/70">
            Errores recientes
            <input
              type="number"
              min="0"
              max="999"
              step="1"
              required
              value={draft.errors}
              onChange={changeField('errors')}
              className={inputClass}
            />
          </label>
        </div>
      )}

      {error && (
        <p role="alert" className="mt-3 text-xs text-red-600 dark:text-red-400 midnight:text-red-300">
          {error}
        </p>
      )}

      <div className="mt-4 flex flex-wrap justify-end gap-2">
        {isGoogleDrive && (
          <button
            type="button"
            onClick={onConnect}
            className="inline-flex items-center gap-2 rounded-lg bg-cyan-500 px-4 py-2 text-xs font-semibold text-white transition-colors duration-300 hover:bg-cyan-400 dark:bg-cyan-400 dark:text-slate-950 dark:hover:bg-cyan-300 midnight:bg-cyan-500 midnight:text-slate-950 midnight:hover:bg-cyan-400"
          >
            <Cloud size={14} />
            {integration.status === 'connected' ? 'Reautorizar Google Drive' : 'Conectar Google Drive'}
          </button>
        )}
        <button
          type="button"
          disabled={testing}
          onClick={() => onTest(integration.id, draft.endpoint)}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-xs text-slate-600 transition-colors duration-300 hover:border-cyan-400/50 hover:text-slate-900 disabled:cursor-wait disabled:opacity-60 dark:border-[#30363d] dark:text-slate-300 dark:hover:text-white midnight:border-cyan-800/40 midnight:text-cyan-200 midnight:hover:text-cyan-50"
        >
          <RotateCw size={14} className={testing ? 'animate-spin' : ''} />
          {testing ? 'Comprobando...' : 'Probar conexión'}
        </button>
        {!isGoogleDrive && (
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-lg bg-cyan-500 px-4 py-2 text-xs font-semibold text-white transition-colors duration-300 hover:bg-cyan-400 dark:bg-cyan-400 dark:text-slate-950 dark:hover:bg-cyan-300 midnight:bg-cyan-500 midnight:text-slate-950 midnight:hover:bg-cyan-400"
          >
            <Save size={14} /> Guardar
          </button>
        )}

      </div>

    </form>
  );
}

function StatusPanel({ summary }) {
  const chartPoints = '0,78 28,62 56,84 84,54 112,31 140,70 168,59 196,47 224,51 252,29 280,39 308,14';
  return (
    <aside className={`h-full p-5 ${cardClass}`} aria-labelledby="general-status-title">
      <h2 id="general-status-title" className="text-base font-semibold text-slate-900 transition-colors duration-300 dark:text-white midnight:text-cyan-50">Estado General</h2>
      <div className="mt-5 space-y-3">
        <div className={`${nestedClass} p-4`}><p className="text-[10px] uppercase text-slate-500 transition-colors duration-300 dark:text-slate-400 midnight:text-cyan-600">Integraciones activas</p><div className="mt-2 flex items-end justify-between"><strong className="text-2xl text-slate-900 transition-colors duration-300 dark:text-white midnight:text-cyan-50">{summary.active} <span className="text-slate-500 dark:text-slate-400 midnight:text-cyan-600">/ {summary.total}</span></strong><span className="text-[10px] text-emerald-600 dark:text-emerald-400 midnight:text-emerald-300">{Math.round((summary.active / summary.total) * 100)}% online</span></div></div>
        <div className={`${nestedClass} p-4`}><p className="text-[10px] uppercase text-slate-500 transition-colors duration-300 dark:text-slate-400 midnight:text-cyan-600">Uptime general (30 días)</p><div className="mt-2 flex items-end justify-between"><strong className="text-2xl text-slate-900 transition-colors duration-300 dark:text-white midnight:text-cyan-50">{summary.uptime.toFixed(2)}<span className="text-sm">%</span></strong><span className="text-[10px] text-emerald-600 dark:text-emerald-400 midnight:text-emerald-300">Excelente</span></div></div>
        <div className={`${nestedClass} p-4`}><p className="text-[10px] uppercase text-slate-500 transition-colors duration-300 dark:text-slate-400 midnight:text-cyan-600">Errores (últimas 24h)</p><div className="mt-2 flex items-end justify-between"><strong className="text-2xl text-red-600 dark:text-red-400 midnight:text-red-300">{summary.errors}</strong><span className="text-[10px] text-red-600 dark:text-red-400 midnight:text-red-300">Make.com</span></div></div>
      </div>
      <div className="mt-6"><h3 className="text-xs font-medium text-slate-700 transition-colors duration-300 dark:text-slate-300 midnight:text-cyan-100">Actividad de Peticiones (API)</h3><div className={`mt-3 p-3 ${nestedClass}`}>
        <svg viewBox="0 0 308 100" role="img" aria-label="Actividad de peticiones de las últimas doce horas" className="h-28 w-full overflow-visible text-cyan-500 transition-colors duration-300 dark:text-blue-400 midnight:text-cyan-400">
          <path d="M0 90H308" className="stroke-slate-200 dark:stroke-[#26344a] midnight:stroke-cyan-900/40" strokeWidth="1" /><polyline points={chartPoints} fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" /><polygon points={`0,100 ${chartPoints} 308,100`} className="fill-cyan-500/10 dark:fill-blue-500/10 midnight:fill-cyan-400/10" />
        </svg><div className="flex justify-between text-[9px] text-slate-500 transition-colors duration-300 dark:text-slate-400 midnight:text-cyan-600"><span>Hace 12h</span><span>Ahora</span></div>
      </div></div>
      <div className="mt-6"><h3 className="text-xs font-medium text-slate-700 transition-colors duration-300 dark:text-slate-300 midnight:text-cyan-100">SLA y Mantenimiento</h3><div className="mt-3 space-y-2 text-[10px] text-slate-500 transition-colors duration-300 dark:text-slate-400 midnight:text-cyan-500/70">
        <p className="flex items-center gap-2"><i className="h-2 w-2 rounded-full bg-emerald-400" /> Operacional (sin incidencias)</p><p className="flex items-center gap-2"><i className="h-2 w-2 rounded-full bg-amber-400" /> Rendimiento degradado</p><p className="flex items-center gap-2"><i className="h-2 w-2 rounded-full bg-red-400" /> Interrupción del servicio</p>
      </div></div>
    </aside>
  );
}

export default function Integrations({ data, onChange, query = '', onQueryChange }) {
  const [selectedId, setSelectedId] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [testingDrive, setTestingDrive] = useState(false);
  const summary = summarizeIntegrations(data);
  const visible = filterIntegrations(data, query);
  const selected = selectedId && data.integrations.find((integration) => integration.id === selectedId);

  const refreshGoogleDrive = async (showFeedback = true) => {
    try {
      const response = await api.get('/integrations/google-drive/status/');
      const driveStatus = response.data;

      onChange(updateGoogleDriveStatus(data, driveStatus));

      if (showFeedback) {
        setFeedback(
          driveStatus.connected
            ? `Google Drive conectado correctamente${driveStatus.email ? `: ${driveStatus.email}` : '.'}`
            : 'Google Drive todavía no está conectado.',
        );
      }

      return Boolean(driveStatus.connected);
    } catch (requestError) {
      onChange(updateGoogleDriveStatus(data, { connected: false }));

      if (showFeedback) {
        setFeedback(
          requestError.response?.data?.message
            || 'No se pudo consultar Google Drive. Verifica que Django esté encendido.',
        );
      }

      return false;
    }
  };

  useEffect(() => {
    refreshGoogleDrive(false);
    // La comprobación inicial debe ejecutarse una sola vez al abrir la vista.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const save = (integrationId, draft) => {
    const updated = updateIntegration(data, integrationId, draft);
    onChange(updated); setSelectedId(null); setFeedback(updated === data ? 'No había cambios que guardar.' : 'Configuración actualizada durante esta sesión.');
  };

  const test = async (integrationId, customEndpoint) => {
    // Prueba real de Google Drive contra el backend
    if (integrationId === 'drive') {
      setTestingDrive(true);
      await refreshGoogleDrive(true);
      setTestingDrive(false);
      return;
    }

    // Prueba real de Make vía webhook
    if (integrationId === 'make') {
      try {
        setFeedback('Verificando conexión con el servicio de Make...');
        const webhookUrl = customEndpoint && customEndpoint.startsWith('http') ? customEndpoint : undefined;
        const res = await makeApi.testConnection(webhookUrl);
        onChange(testIntegration(data, integrationId));
        setSelectedId(null);
        setFeedback(res.data?.message || 'Conexión con Make completada con éxito.');
      } catch (err) {
        const errorMsg = err.response?.data?.data?.message || err.response?.data?.message || err.message;
        setFeedback(`Make: ${errorMsg}`);
      }
      return;
    }

    // Prueba local genérica para el resto de integraciones
    onChange(testIntegration(data, integrationId));
    setSelectedId(null);
    setFeedback('Prueba local completada. La integración se marcó como conectada.');
  };

  const connectGoogleDrive = () => {
    window.open(
      googleDriveConnectUrl,
      '_blank',
      'noopener,noreferrer,width=720,height=820',
    );
    setFeedback(
      'Autoriza Google Drive en la nueva pestaña y luego pulsa "Probar conexión".',
    );
  };

  return (
    <main className="min-w-0 flex-1 overflow-y-auto bg-slate-50 p-4 text-slate-900 transition-colors duration-300 dark:bg-[#0d1117] dark:text-slate-100 midnight:bg-[#050B14] midnight:text-cyan-50 md:p-6 lg:p-8">
      <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-5 pb-8">
        <header className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between"><div><h1 className="text-2xl font-bold tracking-tight text-slate-900 transition-colors duration-300 dark:text-white midnight:text-cyan-50 md:text-[28px]">Integraciones</h1><p className="mt-1 text-sm text-slate-500 transition-colors duration-300 dark:text-slate-400 midnight:text-cyan-500/70">Conexiones con servicios externos y automatizaciones</p></div><span className="w-fit rounded-md border border-slate-300 px-2.5 py-1.5 text-[10px] text-slate-500 transition-colors duration-300 dark:border-[#30363d] dark:text-slate-400 midnight:border-cyan-800/40 midnight:text-cyan-600">Google Drive real · Otras integraciones en demostración</span></header>
        <p role="status" className={feedback ? 'text-xs text-cyan-700 dark:text-cyan-300 midnight:text-cyan-300' : 'sr-only'}>{feedback}</p>
        {selected && <IntegrationEditor key={selected.id} integration={selected} onSave={save} onTest={test} onConnect={connectGoogleDrive} onCancel={() => setSelectedId(null)} testing={selected.id === 'drive' && testingDrive} />}
        <div className="grid min-w-0 items-start gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(280px,0.85fr)]">
          <div className="min-w-0 space-y-5">
            <section className="grid min-w-0 gap-5 md:grid-cols-2" aria-label="Servicios integrados">
              {visible.integrations.map((integration) => <IntegrationCard key={integration.id} integration={integration} onConfigure={(id) => { setSelectedId(id); setFeedback(''); }} />)}
              {!visible.integrations.length && <div className={`p-10 text-center text-sm text-slate-500 md:col-span-2 dark:text-slate-400 midnight:text-cyan-500/70 ${cardClass}`}>No se encontraron integraciones con esa búsqueda.</div>}
            </section>
            <section className={`overflow-hidden p-4 sm:p-5 ${cardClass}`} aria-labelledby="integration-activity-title">
              <div className="flex flex-wrap items-center justify-between gap-3"><h2 id="integration-activity-title" className="text-base font-semibold text-slate-900 transition-colors duration-300 dark:text-white midnight:text-cyan-50">Registro de Actividad de Integraciones</h2>{query && <button type="button" onClick={() => onQueryChange('')} className="text-[10px] text-cyan-700 transition-colors duration-300 hover:text-cyan-600 dark:text-cyan-400 dark:hover:text-cyan-300 midnight:text-cyan-400 midnight:hover:text-cyan-200">Limpiar búsqueda</button>}</div>
              <div className="mt-4 space-y-2">
                {visible.activities.map((item) => { const integration = data.integrations.find((entry) => entry.id === item.integrationId); const Icon = iconMap[integration.icon]; const status = activityStyles[item.status]; return <article key={item.id} className={`flex items-center gap-3 px-3 py-3 ${nestedClass}`}>
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-cyan-50 text-cyan-700 transition-colors duration-300 dark:bg-blue-500/20 dark:text-blue-300 midnight:bg-cyan-500/20 midnight:text-cyan-300"><Icon size={15} /></span><div className="min-w-0 flex-1"><h3 className="truncate text-xs font-semibold text-slate-800 transition-colors duration-300 dark:text-slate-200 midnight:text-cyan-100">{integration.name} — {item.title}</h3><p className="mt-1 text-[10px] text-slate-500 transition-colors duration-300 dark:text-slate-400 midnight:text-cyan-600">{item.time}</p></div><span className={`shrink-0 rounded px-2 py-1 text-[9px] font-semibold ${status.className}`}>{status.label}</span>
                </article>; })}
                {!visible.activities.length && <p className="py-8 text-center text-sm text-slate-500 dark:text-slate-400 midnight:text-cyan-500/70">No hay actividad que coincida con la búsqueda.</p>}
              </div>
            </section>
          </div>
          <StatusPanel summary={summary} />
        </div>
      </div>
    </main>
  );
}
