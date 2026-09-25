import React, { useState } from 'react';
import { Box, Cloud, RotateCw, Save, Settings2, Workflow, X, Zap } from 'lucide-react';
import { integrationStatuses, syncFrequencies } from '../../constants/integrations';
import {
  filterIntegrations,
  summarizeIntegrations,
  testIntegration,
  updateIntegration,
} from '../../utils/integrations';
import { makeApi } from '../../services/makeApi';
import { useToast } from '../../context/ToastContext';


const iconMap = { cloud: Cloud, model: Box, workflow: Workflow, automation: Zap };
const activityStyles = {
  success: { label: 'Éxito', className: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 midnight:bg-emerald-500/10 midnight:text-emerald-300' },
  error: { label: 'Error', className: 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400 midnight:bg-red-500/10 midnight:text-red-300' },
  processing: { label: 'En proceso', className: 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 midnight:bg-cyan-500/10 midnight:text-cyan-300' },
};
const inputClass = 'mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition-colors duration-300 focus:border-cyan-500 dark:border-[#30363d] dark:bg-[#0d1117] dark:text-white dark:focus:border-cyan-400 midnight:border-cyan-800/40 midnight:bg-[#050B14] midnight:text-cyan-50 midnight:focus:border-cyan-500';
const cardClass = 'rounded-xl border border-slate-200 bg-white shadow-sm transition-colors duration-300 dark:border-[#30363d] dark:bg-[#161b22] dark:shadow-[0_14px_32px_rgba(0,0,0,0.12)] midnight:border-cyan-900/30 midnight:bg-[#0a1120] midnight:shadow-none';
const nestedClass = 'rounded-lg border border-slate-200 bg-slate-50 transition-colors duration-300 dark:border-blue-400/25 dark:bg-[#0d1117] midnight:border-cyan-800/40 midnight:bg-[#050B14]';

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

export function IntegrationEditor({ integration, onSave, onTest, onCancel }) {
  const [draft, setDraft] = useState({ status: integration.status, endpoint: integration.endpoint, frequency: integration.frequency, errors: integration.errors });
  const [error, setError] = useState('');
  const changeField = (field) => (event) => { setDraft((current) => ({ ...current, [field]: event.target.value })); setError(''); };
  return (
    <form onSubmit={(event) => { event.preventDefault(); try { onSave(integration.id, draft); } catch (saveError) { setError(saveError.message); } }} className={`p-4 sm:p-5 ${cardClass} border-cyan-300 dark:border-cyan-400/30 midnight:border-cyan-500/30`} aria-labelledby="integration-editor-title">
      <div className="flex items-start justify-between gap-3">
        <div><h2 id="integration-editor-title" className="text-base font-semibold text-slate-900 transition-colors duration-300 dark:text-white midnight:text-cyan-50">Configurar {integration.name}</h2><p className="mt-1 text-xs text-slate-500 transition-colors duration-300 dark:text-slate-400 midnight:text-cyan-500/70">Ajustes locales de demostración; no se envían credenciales.</p></div>
        <button type="button" onClick={onCancel} aria-label="Cerrar configuración" className="rounded-lg p-2 text-slate-500 transition-colors duration-300 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-white midnight:text-cyan-500/70 midnight:hover:bg-cyan-900/20 midnight:hover:text-cyan-50"><X size={18} /></button>
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <label className="text-xs text-slate-500 transition-colors duration-300 dark:text-slate-400 midnight:text-cyan-500/70">Estado<select value={draft.status} onChange={changeField('status')} className={inputClass}>{integrationStatuses.map((status) => <option key={status.id} value={status.id}>{status.label}</option>)}</select></label>
        <label className="text-xs text-slate-500 transition-colors duration-300 dark:text-slate-400 midnight:text-cyan-500/70">Carpeta / endpoint<input autoFocus required maxLength={120} value={draft.endpoint} onChange={changeField('endpoint')} className={inputClass} /></label>
        <label className="text-xs text-slate-500 transition-colors duration-300 dark:text-slate-400 midnight:text-cyan-500/70">Frecuencia<select value={draft.frequency} onChange={changeField('frequency')} className={inputClass}>{syncFrequencies.map((frequency) => <option key={frequency}>{frequency}</option>)}</select></label>
        <label className="text-xs text-slate-500 transition-colors duration-300 dark:text-slate-400 midnight:text-cyan-500/70">Errores recientes<input type="number" min="0" max="999" step="1" required value={draft.errors} onChange={changeField('errors')} className={inputClass} /></label>
      </div>
      {error && <p role="alert" className="mt-3 text-xs text-red-600 dark:text-red-400 midnight:text-red-300">{error}</p>}
      <div className="mt-4 flex flex-wrap justify-end gap-2">
        <button type="button" onClick={() => onTest(integration.id, draft.endpoint)} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-xs text-slate-600 transition-colors duration-300 hover:border-cyan-400/50 hover:text-slate-900 dark:border-[#30363d] dark:text-slate-300 dark:hover:text-white midnight:border-cyan-800/40 midnight:text-cyan-200 midnight:hover:text-cyan-50"><RotateCw size={14} /> Probar conexión</button>
        <button type="submit" className="inline-flex items-center gap-2 rounded-lg bg-cyan-500 px-4 py-2 text-xs font-semibold text-white transition-colors duration-300 hover:bg-cyan-400 dark:bg-cyan-400 dark:text-slate-950 dark:hover:bg-cyan-300 midnight:bg-cyan-500 midnight:text-slate-950 midnight:hover:bg-cyan-400"><Save size={14} /> Guardar</button>
      </div>

    </form>
  );
}

function StatusPanel({ summary, hasActivities = false }) {
  const chartPoints = '0,78 28,62 56,84 84,54 112,31 140,70 168,59 196,47 224,51 252,29 280,39 308,14';
  const onlinePercent = summary.total > 0 ? Math.round((summary.active / summary.total) * 100) : 0;
  return (
    <aside className={`h-full p-5 ${cardClass}`} aria-labelledby="general-status-title">
      <h2 id="general-status-title" className="text-base font-semibold text-slate-900 transition-colors duration-300 dark:text-white midnight:text-cyan-50">Estado General</h2>
      <div className="mt-5 space-y-3">
        <div className={`${nestedClass} p-4`}>
          <p className="text-[10px] uppercase text-slate-500 transition-colors duration-300 dark:text-slate-400 midnight:text-cyan-600">Integraciones activas</p>
          <div className="mt-2 flex items-end justify-between">
            <strong className="text-2xl text-slate-900 transition-colors duration-300 dark:text-white midnight:text-cyan-50">
              {summary.active} <span className="text-slate-500 dark:text-slate-400 midnight:text-cyan-600">/ {summary.total}</span>
            </strong>
            <span className={`text-[10px] ${summary.active > 0 ? 'text-emerald-600 dark:text-emerald-400 midnight:text-emerald-300' : 'text-slate-500 dark:text-slate-400 midnight:text-cyan-600'}`}>
              {onlinePercent}% online
            </span>
          </div>
        </div>
        <div className={`${nestedClass} p-4`}>
          <p className="text-[10px] uppercase text-slate-500 transition-colors duration-300 dark:text-slate-400 midnight:text-cyan-600">Uptime general (30 días)</p>
          <div className="mt-2 flex items-end justify-between">
            <strong className="text-2xl text-slate-900 transition-colors duration-300 dark:text-white midnight:text-cyan-50">
              {summary.uptime > 0 ? `${summary.uptime.toFixed(1)}%` : '--'}
            </strong>
            <span className={`text-[10px] ${summary.uptime > 0 ? 'text-emerald-600 dark:text-emerald-400 midnight:text-emerald-300' : 'text-slate-500 dark:text-slate-400 midnight:text-cyan-600'}`}>
              {summary.uptime > 0 ? 'Excelente' : 'Sin datos'}
            </span>
          </div>
        </div>
        <div className={`${nestedClass} p-4`}>
          <p className="text-[10px] uppercase text-slate-500 transition-colors duration-300 dark:text-slate-400 midnight:text-cyan-600">Errores (últimas 24h)</p>
          <div className="mt-2 flex items-end justify-between">
            <strong className={`text-2xl ${summary.errors > 0 ? 'text-red-600 dark:text-red-400 midnight:text-red-300' : 'text-slate-900 dark:text-white midnight:text-cyan-50'}`}>
              {summary.errors}
            </strong>
            <span className={`text-[10px] ${summary.errors > 0 ? 'text-red-600 dark:text-red-400 midnight:text-red-300' : 'text-emerald-600 dark:text-emerald-400 midnight:text-emerald-300'}`}>
              {summary.errors > 0 ? 'Requiere atención' : 'Sin incidencias'}
            </span>
          </div>
        </div>
      </div>
      <div className="mt-6">
        <h3 className="text-xs font-medium text-slate-700 transition-colors duration-300 dark:text-slate-300 midnight:text-cyan-100">Actividad de Peticiones (API)</h3>
        <div className={`mt-3 p-3 ${nestedClass}`}>
          {hasActivities ? (
            <>
              <svg viewBox="0 0 308 100" role="img" aria-label="Actividad de peticiones de las últimas doce horas" className="h-28 w-full overflow-visible text-cyan-500 transition-colors duration-300 dark:text-blue-400 midnight:text-cyan-400">
                <path d="M0 90H308" className="stroke-slate-200 dark:stroke-[#26344a] midnight:stroke-cyan-900/40" strokeWidth="1" />
                <polyline points={chartPoints} fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
                <polygon points={`0,100 ${chartPoints} 308,100`} className="fill-cyan-500/10 dark:fill-blue-500/10 midnight:fill-cyan-400/10" />
              </svg>
              <div className="flex justify-between text-[9px] text-slate-500 transition-colors duration-300 dark:text-slate-400 midnight:text-cyan-600">
                <span>Hace 12h</span>
                <span>Ahora</span>
              </div>
            </>
          ) : (
            <div className="flex h-28 flex-col items-center justify-center text-center">
              <p className="text-xs text-slate-500 dark:text-slate-400 midnight:text-cyan-500/70">Sin peticiones registradas</p>
              <span className="mt-1 text-[10px] text-slate-400 dark:text-slate-500 midnight:text-cyan-700">No hay actividad reciente en los conectores</span>
            </div>
          )}
        </div>
      </div>
      <div className="mt-6">
        <h3 className="text-xs font-medium text-slate-700 transition-colors duration-300 dark:text-slate-300 midnight:text-cyan-100">SLA y Mantenimiento</h3>
        <div className="mt-3 space-y-2 text-[10px] text-slate-500 transition-colors duration-300 dark:text-slate-400 midnight:text-cyan-500/70">
          <p className="flex items-center gap-2"><i className="h-2 w-2 rounded-full bg-emerald-400" /> Operacional (sin incidencias)</p>
          <p className="flex items-center gap-2"><i className="h-2 w-2 rounded-full bg-amber-400" /> Rendimiento degradado</p>
          <p className="flex items-center gap-2"><i className="h-2 w-2 rounded-full bg-red-400" /> Interrupción del servicio</p>
        </div>
      </div>
    </aside>
  );
}

export default function Integrations({ data, onChange, query = '', onQueryChange }) {
  const [selectedId, setSelectedId] = useState(null);
  const { showToast } = useToast();
  const summary = summarizeIntegrations(data);
  const visible = filterIntegrations(data, query);
  const selected = selectedId && data.integrations.find((integration) => integration.id === selectedId);

  const save = (integrationId, draft) => {
    const updated = updateIntegration(data, integrationId, draft);
    onChange(updated);
    setSelectedId(null);
    showToast({
      title: 'Configuración Guardada',
      message: updated === data ? 'No había cambios que guardar.' : 'Configuración de integración actualizada con éxito.',
      type: 'info',
    });
  };

  const test = async (integrationId, customEndpoint) => {
    if (integrationId === 'make') {
      try {
        const webhookUrl = customEndpoint && customEndpoint.startsWith('http') ? customEndpoint : undefined;
        const res = await makeApi.testConnection(webhookUrl);
        onChange(testIntegration(data, integrationId));
        setSelectedId(null);
        showToast({
          title: 'Conexión con Make Exitosa',
          message: res.data?.message || 'El webhook de Make respondió correctamente.',
          type: 'success',
        });
      } catch (err) {
        const errorMsg = err.response?.data?.data?.message || err.response?.data?.message || err.message;
        showToast({
          title: 'Error de Conexión con Make',
          message: errorMsg,
          type: 'error',
        });
      }
      return;
    }
    onChange(testIntegration(data, integrationId));
    setSelectedId(null);
    showToast({
      title: 'Prueba Completada',
      message: 'La integración se marcó como conectada en la sesión actual.',
      type: 'info',
    });
  };

  return (
    <main className="min-w-0 flex-1 overflow-y-auto bg-slate-50 p-4 text-slate-900 transition-colors duration-300 dark:bg-[#0d1117] dark:text-slate-100 midnight:bg-[#050B14] midnight:text-cyan-50 md:p-6 lg:p-8">
      <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-5 pb-8">
        <header className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between"><div><h1 className="text-2xl font-bold tracking-tight text-slate-900 transition-colors duration-300 dark:text-white midnight:text-cyan-50 md:text-[28px]">Integraciones</h1><p className="mt-1 text-sm text-slate-500 transition-colors duration-300 dark:text-slate-400 midnight:text-cyan-500/70">Conexiones con servicios externos y automatizaciones</p></div><span className="w-fit rounded-md border border-slate-300 px-2.5 py-1.5 text-[10px] text-slate-500 transition-colors duration-300 dark:border-[#30363d] dark:text-slate-400 midnight:border-cyan-800/40 midnight:text-cyan-600">Datos de demostración · Sin credenciales</span></header>
        {selected && <IntegrationEditor key={selected.id} integration={selected} onSave={save} onTest={test} onCancel={() => setSelectedId(null)} />}
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
          <StatusPanel summary={summary} hasActivities={(data?.activities?.length ?? 0) > 0} />
        </div>
      </div>
    </main>
  );
}
