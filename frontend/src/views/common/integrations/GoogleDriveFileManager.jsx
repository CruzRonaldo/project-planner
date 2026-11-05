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
import { useToast } from '../../../context/ToastContext';
import Button from '../../../components/common/Button';
import Input from '../../../components/common/Input';
import { nestedClass } from './constants';

function formatFileSize(bytes) {
  if (bytes === null || bytes === undefined) return 'Carpeta';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function GoogleDriveFileManager({ connected }) {
  const { showToast } = useToast();
  const [files, setFiles] = useState([]);
  const [folderStack, setFolderStack] = useState([]);
  const [folderName, setFolderName] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [working, setWorking] = useState(false);

  const currentFolder = folderStack[folderStack.length - 1] || null;

  const loadFolder = async (folder = null, navigation = 'initial') => {
    if (!connected) return;

    const [response, err] = await runSafe(
      () =>
        api.get('/integrations/google-drive/files/', {
          params: folder?.id ? { folder_id: folder.id } : {},
        }),
      {
        setLoading,
        showToast,
        fallbackError: 'No se pudieron cargar los archivos de Google Drive.',
      }
    );

    if (err || !response?.data) return;

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
    const [response, err] = await runSafe(
      () =>
        api.get('/integrations/google-drive/files/', {
          params: currentFolder?.id ? { folder_id: currentFolder.id } : {},
        }),
      {
        setLoading,
        showToast: showFeedback ? showToast : undefined,
        successTitle: 'Bóveda Actualizada',
        successMessage: 'El contenido de la carpeta se actualizó con éxito.',
        fallbackError: 'No se pudo actualizar el contenido de Google Drive.',
      }
    );

    if (!err && response?.data) {
      setFiles(response.data.files || []);
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
      showToast({
        title: 'Nombre Requerido',
        message: 'Escribe un nombre para la carpeta.',
        type: 'warning',
      });
      return;
    }

    const [, err] = await runSafe(
      () =>
        api.post('/integrations/google-drive/folders/', {
          name: cleanName,
          parent_id: currentFolder?.id,
        }),
      {
        setLoading: setWorking,
        showToast,
        successTitle: 'Carpeta Creada',
        successMessage: `Carpeta "${cleanName}" creada correctamente.`,
        fallbackError: 'No se pudo crear la carpeta de Google Drive.',
      }
    );

    if (!err) {
      setFolderName('');
      await refreshCurrentFolder(false);
    }
  };

  const uploadDriveFile = async () => {
    if (!selectedFile) {
      showToast({
        title: 'Archivo Requerido',
        message: 'Selecciona un archivo para subir a Google Drive.',
        type: 'warning',
      });
      return;
    }

    const formData = new FormData();
    formData.append('file', selectedFile);
    if (currentFolder?.id) {
      formData.append('folder_id', currentFolder.id);
    }

    const [, err] = await runSafe(
      () =>
        api.post('/integrations/google-drive/upload/', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        }),
      {
        setLoading: setWorking,
        showToast,
        successTitle: 'Archivo Subido',
        successMessage: `"${selectedFile.name}" subido con éxito a Google Drive.`,
        fallbackError: 'No se pudo subir el archivo a Google Drive.',
      }
    );

    if (!err) {
      setSelectedFile(null);
      await refreshCurrentFolder(false);
    }
  };

  const renameDriveItem = async (item) => {
    const newName = window.prompt('Nuevo nombre:', item.name)?.trim();
    if (!newName || newName === item.name) return;

    const [, err] = await runSafe(
      () =>
        api.patch(`/integrations/google-drive/files/${item.id}/`, {
          name: newName,
        }),
      {
        setLoading: setWorking,
        showToast,
        successTitle: 'Elemento Renombrado',
        successMessage: `Se actualizó el nombre a "${newName}".`,
        fallbackError: 'No se pudo cambiar el nombre del elemento.',
      }
    );

    if (!err) {
      await refreshCurrentFolder(false);
    }
  };

  const deleteDriveItem = async (item) => {
    const confirmed = window.confirm(
      `¿Deseas enviar "${item.name}" a la papelera de Google Drive?`
    );
    if (!confirmed) return;

    const [, err] = await runSafe(
      () => api.delete(`/integrations/google-drive/files/${item.id}/`),
      {
        setLoading: setWorking,
        showToast,
        successTitle: 'Elemento Eliminado',
        successMessage: `"${item.name}" fue enviado a la papelera.`,
        fallbackError: 'No se pudo eliminar el elemento de Google Drive.',
      }
    );

    if (!err) {
      await refreshCurrentFolder(false);
    }
  };

  if (!connected) {
    return (
      <div
        className={`mt-4 p-4 text-xs text-slate-500 dark:text-slate-400 midnight:text-cyan-400/80 ${nestedClass}`}
      >
        Conecta Google Drive para administrar carpetas y archivos de la bóveda.
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
          <p className="mt-1 truncate text-[10px] text-slate-500 dark:text-slate-400 midnight:text-cyan-300/80">
            {folderStack.map((folder) => folder.name).join(' / ') || 'Project Planner'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            icon={ArrowLeft}
            disabled={loading || folderStack.length <= 1}
            onClick={goBack}
          >
            Atrás
          </Button>
          <Button
            variant="secondary"
            size="sm"
            icon={RotateCw}
            isLoading={loading}
            onClick={() => refreshCurrentFolder(true)}
          >
            Actualizar
          </Button>
        </div>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <div className="flex gap-2 items-center">
          <Input
            value={folderName}
            maxLength={200}
            onChange={(event) => setFolderName(event.target.value)}
            placeholder="Nombre de la carpeta"
            containerClassName="flex-1"
            className="text-xs py-2"
          />
          <Button
            variant="primary"
            size="sm"
            icon={FolderPlus}
            isLoading={working}
            onClick={createDriveFolder}
            className="shrink-0"
          >
            Crear
          </Button>
        </div>

        <div className="flex min-w-0 gap-2 items-center">
          <label className="flex min-w-0 flex-1 cursor-pointer items-center rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-600 dark:border-[#30363d] dark:bg-[#0d1117] dark:text-slate-300 midnight:border-cyan-800/40 midnight:bg-[#050B14] midnight:text-cyan-200">
            <span className="truncate">
              {selectedFile?.name || 'Seleccionar archivo local'}
            </span>
            <input
              type="file"
              className="sr-only"
              onChange={(event) => setSelectedFile(event.target.files?.[0] || null)}
            />
          </label>
          <Button
            variant="primary"
            size="sm"
            icon={Upload}
            isLoading={working}
            disabled={!selectedFile}
            onClick={uploadDriveFile}
            className="shrink-0"
          >
            Subir
          </Button>
        </div>
      </div>

      <div className="mt-4 overflow-x-auto rounded-lg border border-slate-200 dark:border-[#30363d] midnight:border-cyan-900/40">
        <table className="w-full min-w-[620px] text-left text-xs">
          <thead className="bg-slate-100 text-[10px] uppercase text-slate-500 dark:bg-white/5 dark:text-slate-400 midnight:bg-cyan-950/30 midnight:text-cyan-400">
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
                <td colSpan="4" className="px-3 py-8 text-center text-slate-500 dark:text-slate-400 midnight:text-cyan-300/80">
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
                        item.is_folder ? 'hover:text-cyan-600 dark:hover:text-cyan-300 midnight:hover:text-cyan-300' : 'cursor-default'
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
                  <td className="px-3 py-3 text-slate-500 dark:text-slate-400 midnight:text-cyan-300/80">
                    {formatFileSize(item.size)}
                  </td>
                  <td className="px-3 py-3 text-slate-500 dark:text-slate-400 midnight:text-cyan-300/80">
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
                          className="rounded-md p-2 text-slate-500 hover:bg-slate-100 hover:text-cyan-600 dark:hover:bg-white/5 midnight:text-cyan-400 midnight:hover:bg-cyan-900/30 midnight:hover:text-cyan-200"
                        >
                          <ExternalLink size={14} />
                        </a>
                      )}
                      <button
                        type="button"
                        disabled={working}
                        title="Cambiar nombre"
                        onClick={() => renameDriveItem(item)}
                        className="rounded-md p-2 text-slate-500 hover:bg-slate-100 hover:text-cyan-600 disabled:opacity-40 dark:hover:bg-white/5 midnight:text-cyan-400 midnight:hover:bg-cyan-900/30 midnight:hover:text-cyan-200"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        type="button"
                        disabled={working}
                        title="Eliminar"
                        onClick={() => deleteDriveItem(item)}
                        className="rounded-md p-2 text-slate-500 hover:bg-red-50 hover:text-red-600 disabled:opacity-40 dark:hover:bg-red-500/10 midnight:text-cyan-400 midnight:hover:bg-red-500/20 midnight:hover:text-red-300"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            {!loading && files.length === 0 && (
              <tr>
                <td colSpan="4" className="px-3 py-8 text-center text-slate-500 dark:text-slate-400 midnight:text-cyan-400/80">
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
