import React, { useEffect, useState, useMemo } from 'react';
import {
  filterIntegrations,
  summarizeIntegrations,
  updateIntegration,
} from '../../utils/integrations';
import {
  updateGoogleDriveStatus,
  updateRevitStatus,
} from '../../controllers';
import api, { baseURL as apiBaseUrl } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { useLanguage } from '../../context/LanguageContext';
import { runSafe } from '../../utils/asyncHandler';
import PageHeader from '../../components/common/PageHeader';
import RevitModal from './components/RevitModal';
import {
  GoogleDriveModal,
  MakeModal,
  IntegrationCard,
  IntegrationEditor,
  IntegrationActivityList,
  StatusPanel,
  cardClass,
} from './integrations/index.js';

export { IntegrationEditor };

const googleDriveConnectUrl = `${apiBaseUrl}/integrations/google-drive/connect/`;

export default function Integrations({
  data,
  onChange,
  query = '',
  onQueryChange,
  canManage,
  isAdmin,
  currentUser,
}) {
  const { t } = useLanguage();
  const [selectedId, setSelectedId] = useState(null);
  const { showToast } = useToast();
  const [feedback, setFeedback] = useState('');
  const [testingDrive, setTestingDrive] = useState(false);
  const [isRevitModalOpen, setIsRevitModalOpen] = useState(false);

  // Lógica RBAC: Únicamente los usuarios con nivel de Administrador (o PMO) pueden ver y configurar Make
  const isAdministrator = useMemo(() => {
    if (typeof isAdmin === 'boolean') return isAdmin;
    if (typeof canManage === 'boolean') return canManage;
    if (currentUser) {
      return (
        currentUser.role === 'admin' ||
        currentUser.accountType === 'admin' ||
        Boolean(currentUser.isAdmin) ||
        Boolean(currentUser.is_superuser) ||
        Boolean(currentUser.is_staff)
      );
    }
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const stored = localStorage.getItem('project_planner_user');
        if (stored) {
          const parsed = JSON.parse(stored);
          return (
            parsed?.role === 'admin' ||
            parsed?.accountType === 'admin' ||
            Boolean(parsed?.isAdmin) ||
            Boolean(parsed?.is_superuser) ||
            Boolean(parsed?.is_staff)
          );
        }
      }
    } catch {}
    // Fallback permisivo cuando se renderiza sin contexto de usuario/sesión
    return true;
  }, [isAdmin, canManage, currentUser]);

  const visibleData = useMemo(() => {
    if (isAdministrator) return data;
    return {
      ...data,
      integrations: (data?.integrations || []).filter((i) => i.id !== 'make'),
      activities: (data?.activities || []).filter((a) => a.integrationId !== 'make'),
    };
  }, [data, isAdministrator]);

  const summary = summarizeIntegrations(visibleData);
  const visible = filterIntegrations(visibleData, query);
  const selected = selectedId && visibleData.integrations.find((integration) => integration.id === selectedId);

  const refreshGoogleDrive = async (showToastFeedback = false) => {
    setTestingDrive(true);
    const [response, error] = await runSafe(
      () => api.get('/integrations/google-drive/status/'),
      {
        showToast: showToastFeedback ? showToast : undefined,
        successTitle: t('toasts.driveStatusTitle', 'Estado de Google Drive'),
        successMessage: (res) => {
          const driveStatus = res?.data;
          return driveStatus?.connected
            ? (driveStatus?.email
                ? t('toasts.driveConnectedWithEmail', `Google Drive conectado correctamente: ${driveStatus.email}`, { email: driveStatus.email })
                : t('toasts.driveConnected', 'Google Drive conectado correctamente.'))
            : t('toasts.driveNotConnected', 'Google Drive todavía no está conectado.');
        },
        fallbackError: t('toasts.driveError', 'No se pudo consultar Google Drive. Verifica que Django esté encendido.'),
      }
    );
    setTestingDrive(false);

    if (error || !response?.data) {
      onChange(updateGoogleDriveStatus(data, { connected: false }));
      return false;
    }

    const driveStatus = response.data;
    onChange(updateGoogleDriveStatus(data, driveStatus));
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

  const connectGoogleDrive = () => {
    window.open(
      googleDriveConnectUrl,
      '_blank',
      'noopener,noreferrer,width=720,height=820',
    );
    showToast({
      title: t('toasts.authStarted', 'Autorización Iniciada'),
      message: t('toasts.authStartedMsg', 'Autoriza Google Drive en la nueva pestaña y luego pulsa "Probar conexión".'),
      type: 'info',
    });
  };

  return (
    <main className="min-w-0 flex-1 overflow-y-auto bg-slate-50 p-4 text-slate-900 transition-colors duration-300 dark:bg-[#0d1117] dark:text-slate-100 midnight:bg-[#050B14] midnight:text-cyan-50 md:p-6 lg:p-8">
      <div className="flex w-full flex-col gap-5 pb-8">
        <PageHeader
          title={t('integrations.pageTitle', 'Integraciones')}
          subtitle={t('integrations.pageSubtitle', 'Conectividad con servicios externos y automatización')}
        />

        <p
          role="status"
          className="sr-only"
        >
          {feedback}
        </p>

        {/* ── Modales de Configuración Dedicados ── */}
        {selected && selected.id === 'drive' && (
          <GoogleDriveModal
            isOpen={Boolean(selected)}
            onClose={() => setSelectedId(null)}
            integration={selected}
            onConnect={connectGoogleDrive}
            onTest={() => refreshGoogleDrive(true)}
            testing={testingDrive}
          />
        )}

        {isAdministrator && selected && selected.id === 'make' && (
          <MakeModal
            isOpen={Boolean(selected)}
            onClose={() => setSelectedId(null)}
            integration={selected}
            onSave={save}
          />
        )}

        <div className="grid min-w-0 items-start gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(280px,0.85fr)]">
          <div className="min-w-0 space-y-5">
            <section className="grid min-w-0 gap-5 md:grid-cols-2" aria-label={t('integrations.integratedServicesAria', 'Servicios integrados')}>
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
                  {t('integrations.noIntegrationsFound', 'No se encontraron integraciones con esa búsqueda.')}
                </div>
              )}
            </section>

            <IntegrationActivityList
              activities={visible.activities}
              integrations={visibleData.integrations}
              query={query}
              onClearQuery={onQueryChange ? () => onQueryChange('') : undefined}
            />
          </div>

          <StatusPanel
            summary={summary}
            activities={visibleData?.activities || []}
            hasActivities={(visibleData?.activities?.length ?? 0) > 0}
          />
        </div>
      </div>

      {/* ── Modal de Revit — se monta solo cuando isRevitModalOpen es true ── */}
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
