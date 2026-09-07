import React, { useState } from 'react';
import { Box, Cloud, RotateCw, Save, Settings2, Workflow, X, Zap } from 'lucide-react';
import { filterIntegrations, integrationStatuses, summarizeIntegrations, syncFrequencies, testIntegration, updateIntegration } from './integrationsData';

const iconMap = { cloud: Cloud, model: Box, workflow: Workflow, automation: Zap };
const activityStyles = {
  success: { label: 'Éxito', className: 'bg-emerald-500/10 text-emerald-400' },
  error: { label: 'Error', className: 'bg-red-500/10 text-red-400' },
  processing: { label: 'En proceso', className: 'bg-blue-500/10 text-blue-400' },
};
const inputClass = 'mt-2 w-full rounded-lg border border-[#30363d] bg-[#0d1117] px-3 py-2.5 text-sm text-white outline-none focus:border-cyan-400';

function IntegrationStatus({ status }) {
  const details = integrationStatuses.find((item) => item.id === status);
  return <span className={`rounded border px-2 py-1 text-[10px] font-semibold ${details.className}`}>{details.label}</span>;
}

function IntegrationCard({ integration, onConfigure }) {
  const Icon = iconMap[integration.icon];
  return (
    <article className="flex min-h-[225px] min-w-0 flex-col rounded-xl border border-[#30363d] bg-[#161b22] p-5 shadow-[0_14px_32px_rgba(0,0,0,0.12)]">
      <header className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-500/25 text-blue-300"><Icon size={20} /></span>
          <h2 className="truncate text-base font-semibold text-white">{integration.name}</h2>
        </div>
        <IntegrationStatus status={integration.status} />
      </header>
      <p className="mt-4 min-h-10 text-xs leading-relaxed text-slate-400">{integration.description}</p>
      <div className="mt-4 grid grid-cols-2 gap-4">
        {integration.metrics.map((metric) => <div key={metric.key}>
          <strong className={`text-base ${metric.key === 'errors' && Number(metric.value) > 0 ? 'text-red-400' : 'text-cyan-400'}`}>{metric.value}</strong>
          <p className="mt-0.5 text-[10px] text-slate-500">{metric.label}</p>
        </div>)}
      </div>
      <footer className="mt-auto flex items-end justify-between gap-3 pt-4">
        <span className="text-[10px] text-slate-500">Actividad: {integration.lastActivity}</span>
        <button type="button" onClick={() => onConfigure(integration.id)} aria-label={`Configurar ${integration.name}`} className="inline-flex items-center gap-2 rounded-lg bg-blue-500/25 px-4 py-2 text-xs font-semibold text-blue-100 transition-colors hover:bg-blue-500/35"><Settings2 size={14} /> Configurar</button>
      </footer>
    </article>
  );
}

export function IntegrationEditor({ integration, onSave, onTest, onCancel }) {
  const [draft, setDraft] = useState({ status: integration.status, endpoint: integration.endpoint, frequency: integration.frequency, errors: integration.errors });
  const [error, setError] = useState('');
  const changeField = (field) => (event) => { setDraft((current) => ({ ...current, [field]: event.target.value })); setError(''); };
  return (
    <form onSubmit={(event) => { event.preventDefault(); try { onSave(integration.id, draft); } catch (saveError) { setError(saveError.message); } }} className="rounded-xl border border-cyan-400/30 bg-[#161b22] p-4 sm:p-5" aria-labelledby="integration-editor-title">
      <div className="flex items-start justify-between gap-3">
        <div><h2 id="integration-editor-title" className="text-base font-semibold text-white">Configurar {integration.name}</h2><p className="mt-1 text-xs text-slate-400">Ajustes locales de demostración; no se envían credenciales.</p></div>
        <button type="button" onClick={onCancel} aria-label="Cerrar configuración" className="rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-white"><X size={18} /></button>
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <label className="text-xs text-slate-400">Estado<select value={draft.status} onChange={changeField('status')} className={inputClass}>{integrationStatuses.map((status) => <option key={status.id} value={status.id}>{status.label}</option>)}</select></label>
        <label className="text-xs text-slate-400">Carpeta / endpoint<input autoFocus required maxLength={120} value={draft.endpoint} onChange={changeField('endpoint')} className={inputClass} /></label>
        <label className="text-xs text-slate-400">Frecuencia<select value={draft.frequency} onChange={changeField('frequency')} className={inputClass}>{syncFrequencies.map((frequency) => <option key={frequency}>{frequency}</option>)}</select></label>
        <label className="text-xs text-slate-400">Errores recientes<input type="number" min="0" max="999" step="1" required value={draft.errors} onChange={changeField('errors')} className={inputClass} /></label>
      </div>
      {error && <p role="alert" className="mt-3 text-xs text-red-400">{error}</p>}
      <div className="mt-4 flex flex-wrap justify-end gap-2">
        <button type="button" onClick={() => onTest(integration.id)} className="inline-flex items-center gap-2 rounded-lg border border-[#30363d] px-4 py-2 text-xs text-slate-300 hover:border-blue-400/50 hover:text-white"><RotateCw size={14} /> Probar conexión</button>
        <button type="submit" className="inline-flex items-center gap-2 rounded-lg bg-cyan-400 px-4 py-2 text-xs font-semibold text-slate-950 hover:bg-cyan-300"><Save size={14} /> Guardar</button>
      </div>
    </form>
  );
}

function StatusPanel({ summary }) {
  const chartPoints = '0,78 28,62 56,84 84,54 112,31 140,70 168,59 196,47 224,51 252,29 280,39 308,14';
  return (
    <aside className="h-full rounded-xl border border-[#30363d] bg-[#161b22] p-5" aria-labelledby="general-status-title">
      <h2 id="general-status-title" className="text-base font-semibold text-white">Estado General</h2>
      <div className="mt-5 space-y-3">
        <div className="rounded-lg border border-blue-400/25 bg-[#0d1117] p-4"><p className="text-[10px] uppercase text-slate-500">Integraciones activas</p><div className="mt-2 flex items-end justify-between"><strong className="text-2xl text-white">{summary.active} <span className="text-slate-500">/ {summary.total}</span></strong><span className="text-[10px] text-emerald-400">{Math.round((summary.active / summary.total) * 100)}% online</span></div></div>
        <div className="rounded-lg border border-blue-400/25 bg-[#0d1117] p-4"><p className="text-[10px] uppercase text-slate-500">Uptime general (30 días)</p><div className="mt-2 flex items-end justify-between"><strong className="text-2xl text-white">{summary.uptime.toFixed(2)}<span className="text-sm">%</span></strong><span className="text-[10px] text-emerald-400">Excelente</span></div></div>
        <div className="rounded-lg border border-blue-400/25 bg-[#0d1117] p-4"><p className="text-[10px] uppercase text-slate-500">Errores (últimas 24h)</p><div className="mt-2 flex items-end justify-between"><strong className="text-2xl text-red-400">{summary.errors}</strong><span className="text-[10px] text-red-400">Make.com</span></div></div>
      </div>
      <div className="mt-6"><h3 className="text-xs font-medium text-slate-300">Actividad de Peticiones (API)</h3><div className="mt-3 rounded-lg border border-blue-400/25 bg-[#0d1117] p-3">
        <svg viewBox="0 0 308 100" role="img" aria-label="Actividad de peticiones de las últimas doce horas" className="h-28 w-full overflow-visible">
          <path d="M0 90H308" stroke="#26344a" strokeWidth="1" /><polyline points={chartPoints} fill="none" stroke="#60a5fa" strokeWidth="2" strokeLinejoin="round" /><polygon points={`0,100 ${chartPoints} 308,100`} fill="rgba(59,130,246,0.08)" />
        </svg><div className="flex justify-between text-[9px] text-slate-600"><span>Hace 12h</span><span>Ahora</span></div>
      </div></div>
      <div className="mt-6"><h3 className="text-xs font-medium text-slate-300">SLA y Mantenimiento</h3><div className="mt-3 space-y-2 text-[10px] text-slate-400">
        <p className="flex items-center gap-2"><i className="h-2 w-2 rounded-full bg-emerald-400" /> Operacional (sin incidencias)</p><p className="flex items-center gap-2"><i className="h-2 w-2 rounded-full bg-amber-400" /> Rendimiento degradado</p><p className="flex items-center gap-2"><i className="h-2 w-2 rounded-full bg-red-400" /> Interrupción del servicio</p>
      </div></div>
    </aside>
  );
}

export default function Integrations({ data, onChange, query = '', onQueryChange }) {
  const [selectedId, setSelectedId] = useState(null);
  const [feedback, setFeedback] = useState('');
  const summary = summarizeIntegrations(data);
  const visible = filterIntegrations(data, query);
  const selected = selectedId && data.integrations.find((integration) => integration.id === selectedId);
  const save = (integrationId, draft) => {
    const updated = updateIntegration(data, integrationId, draft);
    onChange(updated); setSelectedId(null); setFeedback(updated === data ? 'No había cambios que guardar.' : 'Configuración actualizada durante esta sesión.');
  };
  const test = (integrationId) => { onChange(testIntegration(data, integrationId)); setSelectedId(null); setFeedback('Prueba local completada. La integración se marcó como conectada.'); };
  return (
    <main className="min-w-0 flex-1 overflow-y-auto bg-[#0d1117] p-4 text-slate-100 md:p-6 lg:p-8">
      <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-5 pb-8">
        <header className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between"><div><h1 className="text-2xl font-bold tracking-tight text-white md:text-[28px]">Integraciones</h1><p className="mt-1 text-sm text-slate-400">Conexiones con servicios externos y automatizaciones</p></div><span className="w-fit rounded-md border border-[#30363d] px-2.5 py-1.5 text-[10px] text-slate-500">Datos de demostración · Sin credenciales</span></header>
        <p role="status" className={feedback ? 'text-xs text-cyan-300' : 'sr-only'}>{feedback}</p>
        {selected && <IntegrationEditor key={selected.id} integration={selected} onSave={save} onTest={test} onCancel={() => setSelectedId(null)} />}
        <div className="grid min-w-0 items-start gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(280px,0.85fr)]">
          <div className="min-w-0 space-y-5">
            <section className="grid min-w-0 gap-5 md:grid-cols-2" aria-label="Servicios integrados">
              {visible.integrations.map((integration) => <IntegrationCard key={integration.id} integration={integration} onConfigure={(id) => { setSelectedId(id); setFeedback(''); }} />)}
              {!visible.integrations.length && <div className="rounded-xl border border-[#30363d] bg-[#161b22] p-10 text-center text-sm text-slate-400 md:col-span-2">No se encontraron integraciones con esa búsqueda.</div>}
            </section>
            <section className="overflow-hidden rounded-xl border border-[#30363d] bg-[#161b22] p-4 sm:p-5" aria-labelledby="integration-activity-title">
              <div className="flex flex-wrap items-center justify-between gap-3"><h2 id="integration-activity-title" className="text-base font-semibold text-white">Registro de Actividad de Integraciones</h2>{query && <button type="button" onClick={() => onQueryChange('')} className="text-[10px] text-cyan-400 hover:text-cyan-300">Limpiar búsqueda</button>}</div>
              <div className="mt-4 space-y-2">
                {visible.activities.map((item) => { const integration = data.integrations.find((entry) => entry.id === item.integrationId); const Icon = iconMap[integration.icon]; const status = activityStyles[item.status]; return <article key={item.id} className="flex items-center gap-3 rounded-lg border border-blue-400/20 bg-[#0d1117] px-3 py-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-blue-500/20 text-blue-300"><Icon size={15} /></span><div className="min-w-0 flex-1"><h3 className="truncate text-xs font-semibold text-slate-200">{integration.name} — {item.title}</h3><p className="mt-1 text-[10px] text-slate-500">{item.time}</p></div><span className={`shrink-0 rounded px-2 py-1 text-[9px] font-semibold ${status.className}`}>{status.label}</span>
                </article>; })}
                {!visible.activities.length && <p className="py-8 text-center text-sm text-slate-400">No hay actividad que coincida con la búsqueda.</p>}
              </div>
            </section>
          </div>
          <StatusPanel summary={summary} />
        </div>
      </div>
    </main>
  );
}
