import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  ExternalLink,
  File as FileIcon,
  Folder,
  FolderPlus,
  Pencil,
  RotateCw,
  Trash2,
  Upload,
} from 'lucide-react';
import api from '../../../services/api';
import { runSafe } from '../../../utils/asyncHandler';
import { inputClass, nestedClass } from './constants';

function formatFileSize(bytes) {
  if (bytes === null || bytes === undefined) return 'Carpeta';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function GoogleDriveFileManager({ connected }) {
  const [files, setFiles] = useState([]);
  const [folderStack, setFolderStack] = useState([]);
  const [folderName, setFolderName] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [working, setWorking] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const currentFolder = folderStack[folderStack.length - 1] || null;

  const loadFolder = async (folder = null, navigation = 'initial') => {
    if (!connected) return;

    setError('');
    const [response, err] = await runSafe(
      () =>
        api.get('/integrations/google-drive/files/', {
          params: folder?.id ? { folder_id: folder.id } : {},
        }),
      {
        setLoading,
        fallbackError: 'No se pudieron cargar los archivos de Google Drive.',
      }
    );

    if (err) {
      setError(err.friendlyMessage);
      setMessage('');
      return;
    }

    const result = response.data;
    setFiles(result.files || []);

    if (navigation === 'initial') {
      setFolderStack([result.current_folder]);
    } else if (navigation === 'push') {
      setFolderStack((current) => [...current, result.current_folder]);
    } else if (navigation === 'back') {
      setFolderStack((current) => [...current.slice(0, -2), result.current_folder]);
    }
  };

  useEffect(() => {
    if (connected) {
      loadFolder();
    } else {
      setFiles([]);
      setFolderStack([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connected]);

  const refreshCurrentFolder = async (showFeedback = true) => {
    setError('');
    const [response, err] = await runSafe(
      () =>
        api.get('/integrations/google-drive/files/', {
          params: currentFolder?.id ? { folder_id: currentFolder.id } : {},
        }),
      {
        setLoading,
        fallbackError: 'No se pudo actualizar el contenido de Google Drive.',
      }
    );

    if (err) {
      setError(err.friendlyMessage);
      setMessage('');
      return;
    }

    setFiles(response.data.files || []);
    if (showFeedback) setMessage('Contenido actualizado.');
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

    setError('');
    const [, err] = await runSafe(
      () =>
        api.post('/integrations/google-drive/folders/', {
          name: cleanName,
          parent_id: currentFolder?.id,
        }),
      {
        setLoading: setWorking,
        fallbackError: 'No se pudo crear la carpeta de Google Drive.',
      }
    );

    if (err) {
      setError(err.friendlyMessage);
      setMessage('');
      return;
    }

    setFolderName('');
    setMessage(`Carpeta "${cleanName}" creada correctamente.`);
    await refreshCurrentFolder(false);
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

    setError('');
    const [, err] = await runSafe(
      () =>
        api.post('/integrations/google-drive/upload/', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        }),
      {
        setLoading: setWorking,
        fallbackError: 'No se pudo subir el archivo a Google Drive.',
      }
    );

    if (err) {
      setError(err.friendlyMessage);
      setMessage('');
      return;
    }

    setMessage(`Archivo "${selectedFile.name}" subido correctamente.`);
    setSelectedFile(null);
    await refreshCurrentFolder(false);
  };

  const renameDriveItem = async (item) => {
    const newName = window.prompt('Nuevo nombre:', item.name)?.trim();
    if (!newName || newName === item.name) return;

    setError('');
    const [, err] = await runSafe(
      () =>
        api.patch(`/integrations/google-drive/files/${item.id}/`, {
          name: newName,
        }),
      {
        setLoading: setWorking,
        fallbackError: 'No se pudo cambiar el nombre del elemento.',
      }
    );

    if (err) {
      setError(err.friendlyMessage);
      setMessage('');
      return;
    }

    setMessage('Nombre actualizado correctamente.');
    await refreshCurrentFolder(false);
  };

  const deleteDriveItem = async (item) => {
    const confirmed = window.confirm(
      `¿Deseas enviar "${item.name}" a la papelera de Google Drive?`
    );
    if (!confirmed) return;

    setError('');
    const [, err] = await runSafe(
      () => api.delete(`/integrations/google-drive/files/${item.id}/`),
      {
        setLoading: setWorking,
        fallbackError: 'No se pudo eliminar el elemento de Google Drive.',
      }
    );

    if (err) {
      setError(err.friendlyMessage);
      setMessage('');
      return;
    }

    setMessage(`"${item.name}" fue enviado a la papelera.`);
    await refreshCurrentFolder(false);
  };

  if (!connected) {
    return (
      <div
        className={`mt-4 p-4 text-xs text-slate-500 dark:text-slate-400 midnight:text-cyan-500/70 ${nestedClass}`}
      >
        Conecta Google Drive para administrar carpetas y archivos.
      </div>
    );
  }

  return (
    <section className={`mt-4 overflow-hidden p-4 ${nestedClass}`} aria-labelledby="drive-files-title">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h3
            id="drive-files-title"
            className="text-sm font-semibold text-slate-900 dark:text-white midnight:text-cyan-50"
          >
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
            className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-2 text-[11px] text-slate-600 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-40 dark:border-[#30363d] dark:text-slate-300 dark:hover:text-white midnight:border-cyan-800/40 midnight:text-cyan-200 midnight:hover:border-cyan-700/50 midnight:hover:bg-cyan-900/30 midnight:hover:text-cyan-50"
          >
            <ArrowLeft size={13} /> Atrás
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={() => refreshCurrentFolder(true)}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-2 text-[11px] text-slate-600 hover:text-slate-900 disabled:opacity-50 dark:border-[#30363d] dark:text-slate-300 dark:hover:text-white midnight:border-cyan-800/40 midnight:text-cyan-200 midnight:hover:border-cyan-700/50 midnight:hover:bg-cyan-900/30 midnight:hover:text-cyan-50"
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

      {error && (
        <p role="alert" className="mt-3 text-xs text-red-600 dark:text-red-400 midnight:text-red-300">
          {error}
        </p>
      )}
      {message && (
        <p role="status" className="mt-3 text-xs text-emerald-600 dark:text-emerald-400 midnight:text-emerald-300">
          {message}
        </p>
      )}

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
              <tr>
                <td colSpan="4" className="px-3 py-8 text-center text-slate-500">
                  Cargando archivos...
                </td>
              </tr>
            )}
            {!loading &&
              files.map((item) => (
                <tr key={item.id} className="text-slate-700 dark:text-slate-300 midnight:text-cyan-100">
                  <td className="px-3 py-3">
                    <button
                      type="button"
                      disabled={!item.is_folder}
                      onClick={() => item.is_folder && loadFolder(item, 'push')}
                      className={`flex max-w-[300px] items-center gap-2 text-left ${
                        item.is_folder ? 'hover:text-cyan-600 dark:hover:text-cyan-300' : 'cursor-default'
                      }`}
                    >
                      {item.is_folder ? (
                        <Folder size={16} className="shrink-0 text-amber-500" />
                      ) : (
                        <FileIcon size={16} className="shrink-0 text-cyan-500" />
                      )}
                      <span className="truncate">{item.name}</span>
                    </button>
                  </td>
                  <td className="px-3 py-3 text-slate-500 dark:text-slate-400 midnight:text-cyan-600">
                    {formatFileSize(item.size)}
                  </td>
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
              <tr>
                <td colSpan="4" className="px-3 py-8 text-center text-slate-500 dark:text-slate-400 midnight:text-cyan-600">
                  Esta carpeta está vacía.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
