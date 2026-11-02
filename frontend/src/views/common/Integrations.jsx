import React, { useEffect, useState } from 'react';
import {
  filterIntegrations,
  summarizeIntegrations,
  testIntegration,
  updateIntegration,
} from '../../utils/integrations';
import {
  updateGoogleDriveStatus,
  updateRevitStatus,
} from '../../controllers';
import api, { baseURL as apiBaseUrl } from '../../services/api';
import { makeApi } from '../../services/makeApi';
import { useToast } from '../../context/ToastContext';
import { runSafe } from '../../utils/asyncHandler';
import RevitModal from './components/RevitModal';
import {
  IntegrationCard,
  IntegrationEditor,
  IntegrationActivityList,
  StatusPanel,
  cardClass,
} from './integrations';

export { IntegrationEditor };

const googleDriveConnectUrl = `${apiBaseUrl}/integrations/google-drive/connect/`;

export default function Integrations({ data, onChange, query = '', onQueryChange }) {
  const [selectedId, setSelectedId] = useState(null);
  const { showToast } = useToast();
  const [feedback, setFeedback] = useState('');
  const [testingDrive, setTestingDrive] = useState(false);
  const [isRevitModalOpen, setIsRevitModalOpen] = useState(false);

  const summary = summarizeIntegrations(data);
  const visible = filterIntegrations(data, query);
  const selected = selectedId && data.integrations.find((integration) => integration.id === selectedId);

  const refreshGoogleDrive = async (showFeedback = true) => {
    setTestingDrive(true);
    const [response, error] = await runSafe(
      () => api.get('/integrations/google-drive/status/'),
      {
        fallbackError: 'No se pudo consultar Google Drive. Verifica que Django esté encendido.',
      }
    );
    setTestingDrive(false);

    if (error || !response?.data) {
      onChange(updateGoogleDriveStatus(data, { connected: false }));
      if (showFeedback) {
        setFeedback(
          error?.friendlyMessage || 'No se pudo consultar Google Drive. Verifica que Django esté encendido.'
        );
      }
      return false;
    }

    const driveStatus = response.data;
    onChange(updateGoogleDriveStatus(data, driveStatus));
    if (showFeedback) {
      setFeedback(
        driveStatus.connected
          ? `Google Drive conectado correctamente${driveStatus.email ? `: ${driveStatus.email}` : '.'}`
          : 'Google Drive todavía no está conectado.'
      );
    }
    return Boolean(driveStatus.connected);
  };

  const refreshRevitStatus = async () => {
    const [response, error] = await runSafe(
      () => api.get('/integrations/aps/status/'),
      {
        fallbackError: 'No se pudo consultar el estado de Autodesk APS.',
      }
    );
    if (error || !response?.data) {
      onChange(updateRevitStatus(data, { connected: false }));
    } else {
      onChange(updateRevitStatus(data, response.data));
    }
  };

  useEffect(() => {
    refreshGoogleDrive(false);
    refreshRevitStatus();
    // La comprobación inicial debe ejecutarse una sola vez al abrir la vista.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const save = (integrationId, draft) => {
    const updated = updateIntegration(data, integrationId, draft);
    onChange(updated);
    setSelectedId(null);
    showToast({
      title: 'Configuración Guardada',
      message:
        updated === data
          ? 'No había cambios que guardar.'
          : 'Configuración de integración actualizada con éxito.',
      type: 'info',
    });
  };

  const test = async (integrationId, customEndpoint) => {
    if (integrationId === 'drive') {
      await refreshGoogleDrive(true);
      return;
    }

    if (integrationId === 'make') {
      const webhookUrl = customEndpoint && customEndpoint.startsWith('http') ? customEndpoint : undefined;
      const [res, error] = await runSafe(
        () => makeApi.testConnection(webhookUrl),
        {
          showToast,
          successTitle: 'Conexión con Make Exitosa',
          successMessage: (r) => r?.message || 'El webhook de Make respondió correctamente.',
          fallbackError: 'Error de conexión con el webhook de Make.',
        }
      );
      if (!error && res) {
        onChange(testIntegration(data, integrationId));
        setSelectedId(null);
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
        <header className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 transition-colors duration-300 dark:text-white midnight:text-cyan-50 md:text-[28px]">
              Integraciones
            </h1>
            <p className="mt-1 text-sm text-slate-500 transition-colors duration-300 dark:text-slate-400 midnight:text-cyan-500/70">
              Conexiones con servicios externos y automatizaciones
            </p>
          </div>
          <span className="w-fit rounded-md border border-slate-300 px-2.5 py-1.5 text-[10px] text-slate-500 transition-colors duration-300 dark:border-[#30363d] dark:text-slate-400 midnight:border-cyan-800/40 midnight:text-cyan-600">
            Google Drive real · Otras integraciones en demostración
          </span>
        </header>

        <p
          role="status"
          className={feedback ? 'text-xs text-cyan-700 dark:text-cyan-300 midnight:text-cyan-300' : 'sr-only'}
        >
          {feedback}
        </p>

        {selected && (
          <IntegrationEditor
            key={selected.id}
            integration={selected}
            onSave={save}
            onTest={test}
            onConnect={connectGoogleDrive}
            onCancel={() => setSelectedId(null)}
            testing={selected.id === 'drive' && testingDrive}
          />
        )}

        <div className="grid min-w-0 items-start gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(280px,0.85fr)]">
          <div className="min-w-0 space-y-5">
            <section className="grid min-w-0 gap-5 md:grid-cols-2" aria-label="Servicios integrados">
              {visible.integrations.map((integration) => (
                <IntegrationCard
                  key={integration.id}
                  integration={integration}
                  onConfigure={(id) => {
                    if (id === 'revit') {
                      setIsRevitModalOpen(true);
                      setFeedback('');
                    } else {
                      setSelectedId(id);
                      setFeedback('');
                    }
                  }}
                />
              ))}
              {!visible.integrations.length && (
                <div className={`p-10 text-center text-sm text-slate-500 md:col-span-2 dark:text-slate-400 midnight:text-cyan-500/70 ${cardClass}`}>
                  No se encontraron integraciones con esa búsqueda.
                </div>
              )}
            </section>

            <IntegrationActivityList
              activities={visible.activities}
              integrations={data.integrations}
              query={query}
              onClearQuery={onQueryChange ? () => onQueryChange('') : undefined}
            />
          </div>

          <StatusPanel
            summary={summary}
            hasActivities={(data?.activities?.length ?? 0) > 0}
          />
        </div>
      </div>

      {isRevitModalOpen && (
        <RevitModal
          onClose={() => {
            setIsRevitModalOpen(false);
            refreshRevitStatus();
          }}
        />
      )}
    </main>
  );
}
