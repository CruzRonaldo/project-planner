import React, { useRef, useState } from 'react';
import api from '../../services/api';

const sourceLabels = {
  manual: 'Manual', automatic: 'Automático',
  before_restore: 'Antes de restaurar', legacy: 'Anterior',
};

export default function BackupExportButton({ onCreated }) {
  const [open, setOpen] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const [connected, setConnected] = useState(false);
  const [database, setDatabase] = useState('');
  const [backups, setBackups] = useState([]);
  const [selected, setSelected] = useState(null);
  const [confirmation, setConfirmation] = useState('');
  const [acknowledged, setAcknowledged] = useState(false);
  const [restored, setRestored] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const options = (extra = {}) => ({
    auth: { username: username.trim(), password },
    timeout: 1500000,
    ...extra,
  });

  const close = () => {
    if (busyRef.current) return;
    setOpen(false);
    setUsername('');
    setPassword('');
    setConnected(false);
    setBackups([]);
    setDatabase('');
    setSelected(null);
    setConfirmation('');
    setAcknowledged(false);
    setError('');
    setMessage('');
    setRestored(false);
  };

  const perform = async (action) => {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setError('');
    setMessage('');
    try {
      await action();
    } catch (err) {
      let data = err.response?.data;
      if (data instanceof Blob) {
        try { data = JSON.parse(await data.text()); } catch { data = null; }
      }
      let detail = data?.detail;
      if (err.response?.status === 401) detail = 'Usuario o contraseña de Django incorrectos.';
      if (err.response?.status === 403) detail ||= 'Se requiere una cuenta de superusuario.';
      if (err.response?.status === 401 || err.response?.status === 403) setConnected(false);
      if (!err.response) {
        detail = 'No se pudo confirmar el resultado. Comprueba Django y actualiza el historial antes de repetir.';
      }
      setError((detail || 'No se pudo completar la operación.') +
        (data?.safety_backup ? ` Copia previa disponible: ${data.safety_backup}` : ''));
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  };

  const refresh = async () => {
    const { data } = await api.get('/backups/', options());
    setDatabase(data.database);
    setBackups(data.backups);
    setConnected(true);
  };

  const saveDownload = (response, fallback) => {
    const disposition = response.headers['content-disposition'] || '';
    const match = disposition.match(/filename="?([^";]+)"?/i);
    const candidate = match?.[1];
    const filename = candidate && /^project_planner_[0-9_]+_[a-f0-9]{8}\.dump$/.test(candidate)
      ? candidate : fallback;
    const url = URL.createObjectURL(response.data);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  };

  const create = () => perform(async () => {
    const response = await api.post('/backups/export/', {}, options({ responseType: 'blob' }));
    saveDownload(response, `project_planner_${Date.now()}.dump`);
    onCreated?.(`${new Date().toLocaleString('es-PE')} (Manual)`);
    setMessage('Respaldo generado en el servidor. Se ha iniciado la descarga.');
    try { await refresh(); } catch {
      setError('La copia se generó, pero no se pudo actualizar el historial. Pulsa Actualizar.');
    }
  });

  const download = (filename) => perform(async () => {
    const response = await api.get(`/backups/${encodeURIComponent(filename)}/download/`, options({ responseType: 'blob' }));
    saveDownload(response, filename);
    setMessage('Se ha iniciado la descarga del respaldo seleccionado.');
  });

  const restore = () => perform(async () => {
    if (!selected || !acknowledged || confirmation !== database) return;
    const { data } = await api.post('/backups/restore/', {
      filename: selected.filename, confirm_database: confirmation, confirm_restore: true,
    }, options());
    setRestored(true);
    setSelected(null);
    setPassword('');
    setConnected(false);
    setMessage(`${data.detail} Copia previa guardada: ${data.safety_backup}`);
  });

  const button = 'rounded-lg border border-slate-300 px-3 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-100 dark:border-slate-600 dark:hover:bg-slate-700 midnight:border-cyan-800 midnight:hover:bg-cyan-900/30';
  const input = 'w-full rounded-lg border border-slate-300 bg-white p-2 text-sm text-slate-900 dark:bg-slate-800 dark:border-slate-600 dark:text-white midnight:bg-[#0a1120] midnight:border-cyan-800 midnight:text-cyan-100';

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={button}>
        Administrar respaldos
      </button>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4">
          <section role="dialog" aria-modal="true" aria-label="Administrar respaldos" aria-busy={busy}
            className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-xl bg-white p-5 text-slate-800 shadow-xl dark:bg-slate-900 dark:text-slate-100 midnight:bg-[#050B14] midnight:text-cyan-100">
            <div className="mb-4 flex items-center justify-between gap-4">
              <h2 className="text-lg font-bold">Respaldos de PostgreSQL</h2>
              <button type="button" onClick={close} disabled={busy} className={button}>Cerrar</button>
            </div>
            {!connected && !restored && (
              <form onSubmit={(event) => { event.preventDefault(); perform(refresh); }} className="space-y-3">
                <p className="text-sm">Ingresa las credenciales de un superusuario de Django para consultar y administrar las copias.</p>
                <label className="block text-sm">Usuario
                  <input autoFocus autoComplete="username" value={username} disabled={busy} required
                    onChange={(event) => setUsername(event.target.value)} className={input} />
                </label>
                <label className="block text-sm">Contraseña
                  <input type="password" autoComplete="current-password" value={password} disabled={busy} required
                    onChange={(event) => setPassword(event.target.value)} className={input} />
                </label>
                <button type="submit" disabled={busy} className={button}>Consultar respaldos</button>
              </form>
            )}
            {error && <p role="alert" className="mt-4 rounded-lg bg-red-100 p-3 text-sm text-red-800">{error}</p>}
            {message && <p role="status" className="mt-4 rounded-lg bg-emerald-100 p-3 text-sm text-emerald-900">{message}</p>}
            {connected && !restored && (
              <>
                <p className="my-4 text-sm">Base configurada: <strong>{database}</strong></p>
                <div className="mb-4 flex flex-wrap gap-2">
                  <button type="button" disabled={busy} onClick={create} className={button}>Crear y descargar respaldo</button>
                  <button type="button" disabled={busy} onClick={() => perform(refresh)} className={button}>Actualizar historial</button>
                </div>
                <p className="mb-3 text-xs">Las copias automáticas se programan en Windows. El historial muestra las copias que realmente se han generado.</p>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead><tr className="border-b border-slate-400">
                      <th className="p-2">Fecha y archivo</th><th className="p-2">Origen</th>
                      <th className="p-2">Tamaño</th><th className="p-2">Acciones</th>
                    </tr></thead>
                    <tbody>{backups.map((backup) => (
                      <tr key={backup.filename} className="border-b border-slate-300 dark:border-slate-700">
                        <td className="p-2"><div>{new Date(backup.created_at).toLocaleString('es-PE')}</div>
                          <div className="mt-1 break-all">{backup.filename}</div></td>
                        <td className="p-2">{sourceLabels[backup.source] || backup.source}</td>
                        <td className="p-2">{(backup.size_bytes / 1024).toFixed(1)} KB</td>
                        <td className="p-2"><div className="flex gap-2">
                          <button type="button" disabled={busy} onClick={() => download(backup.filename)} className={button}>Descargar</button>
                          <button type="button" disabled={busy} onClick={() => {
                            setSelected(backup); setConfirmation(''); setAcknowledged(false); setError(''); setMessage('');
                          }} className={button}>Restaurar</button>
                        </div></td>
                      </tr>
                    ))}</tbody>
                  </table>
                  {!backups.length && <p className="py-4 text-sm">Todavía no hay respaldos en esta instalación.</p>}
                </div>
                {selected && (
                  <div className="mt-5 space-y-3 rounded-lg border border-amber-500 p-4">
                    <h3 className="font-bold">Confirmar restauración</h3>
                    <p className="break-all text-sm">Archivo: {selected.filename}</p>
                    <p className="text-sm">Se reemplazarán los datos y objetos incluidos en la copia. Los usuarios y contraseñas también volverán a ese momento. Primero se guardará un respaldo del estado actual.</p>
                    <p className="text-sm">Pausa el trabajo de los demás usuarios y no cierres esta ventana durante el proceso.</p>
                    <label className="block text-sm">Para confirmar, escribe: <strong>{database}</strong>
                      <input value={confirmation} disabled={busy} autoComplete="off"
                        onChange={(event) => setConfirmation(event.target.value)} className={input} />
                    </label>
                    <label className="flex items-start gap-2 text-sm">
                      <input type="checkbox" checked={acknowledged} disabled={busy}
                        onChange={(event) => setAcknowledged(event.target.checked)} />
                      Entiendo que los datos actuales incluidos en el respaldo serán reemplazados.
                    </label>
                    <div className="flex gap-2">
                      <button type="button" disabled={busy || !acknowledged || confirmation !== database}
                        onClick={restore} className={button}>Confirmar restauración</button>
                      <button type="button" disabled={busy} onClick={() => setSelected(null)} className={button}>Cancelar</button>
                    </div>
                  </div>
                )}
              </>
            )}
            {busy && <p role="status" className="mt-4 text-sm">Procesando. Espera a que termine antes de repetir la operación.</p>}
          </section>
        </div>
      )}
    </>
  );
}
