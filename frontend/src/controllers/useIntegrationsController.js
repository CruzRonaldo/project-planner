import { useState, useEffect, useCallback } from 'react';
import api, { baseURL as apiBaseUrl } from '../services/api';
import { makeApi } from '../services/makeApi';
import { createIntegrationsData } from '../mocks';
import { runSafe } from '../utils/asyncHandler';
import {
  updateIntegration,
  testIntegration,
} from '../utils/integrations';

/**
 * Plantilla de integraciones para modo producción / sin datos simulados.
 */
export function createEmptyIntegrations() {
  return {
    integrations: [
      {
        id: 'drive',
        name: 'Google Drive',
        icon: 'cloud',
        status: 'offline',
        description: 'Sincronización de documentación y planos en la nube.',
        endpoint: 'Carpeta /Project Planner',
        frequency: 'Cada 10 min',
        errors: 0,
        lastActivity: 'Sin actividad',
        metrics: [
          { key: 'files', value: 0, label: 'archivos' },
          { key: 'projects', value: 0, label: 'proyectos' },
        ],
      },
      {
        id: 'revit',
        name: 'Revit / BIM Data',
        icon: 'model',
        status: 'offline',
        description: 'Importación de datos de modelado 3D BIM.',
        endpoint: 'BIM 360 / Modelos',
        frequency: 'Cada hora',
        errors: 0,
        lastActivity: 'Sin actividad',
        metrics: [
          { key: 'models', value: 0, label: 'modelos' },
          { key: 'sync', value: '-', label: 'última sync' },
        ],
      },
      {
        id: 'make',
        name: 'Make (Integromat)',
        icon: 'automation',
        status: 'offline',
        description: 'Automatización de procesos y conexión con servicios de terceros.',
        endpoint: 'Escenarios / Operaciones',
        frequency: 'Cada 30 min',
        errors: 0,
        lastActivity: 'Sin actividad',
        metrics: [
          { key: 'scenarios', value: 0, label: 'escenarios' },
          { key: 'errors', value: 0, label: 'con error' },
        ],
      },
    ],
    activities: [],
    uptime: 0,
  };
}

export function formatRelativeTime(dateString) {
  if (!dateString) return 'Nunca';
  try {
    const rtf = new Intl.RelativeTimeFormat('es', { numeric: 'auto' });
    const date = new Date(dateString);
    const diffInSeconds = (date.getTime() - Date.now()) / 1000;
    const absDiff = Math.abs(diffInSeconds);

    if (absDiff < 60) return 'hace un momento';
    if (absDiff < 3600) return rtf.format(Math.round(diffInSeconds / 60), 'minute');
    if (absDiff < 86400) return rtf.format(Math.round(diffInSeconds / 3600), 'hour');
    if (absDiff < 2592000) return rtf.format(Math.round(diffInSeconds / 86400), 'day');
    if (absDiff < 31536000) return rtf.format(Math.round(diffInSeconds / 2592000), 'month');
    return rtf.format(Math.round(diffInSeconds / 31536000), 'year');
  } catch {
    return 'Reciente';
  }
}

export function updateGoogleDriveStatus(data, driveStatus) {
  const connected = Boolean(driveStatus?.connected);
  const displayName = driveStatus?.display_name || '';
  const email = driveStatus?.email || '';

  return {
    ...data,
    integrations: (data?.integrations || []).map((integration) => {
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

export function updateRevitStatus(data, revitStatus) {
  const connected = Boolean(revitStatus?.connected);
  const totalModels = revitStatus?.total_models || 0;
  const lastSync = formatRelativeTime(revitStatus?.last_sync);

  return {
    ...data,
    integrations: (data?.integrations || []).map((integration) => {
      if (integration.id !== 'revit') return integration;

      return {
        ...integration,
        status: connected ? 'connected' : 'offline',
        description: connected
          ? 'Conectado a la Bóveda BIM colaborativa.'
          : 'Autodesk APS (Revit) todavía no ha sido configurado.',
        lastActivity: connected ? lastSync : 'Sin conexión',
        metrics: [
          {
            key: 'models',
            value: totalModels,
            label: totalModels === 1 ? 'modelo activo' : 'modelos activos',
          },
          {
            key: 'api',
            value: connected ? 'Activa' : 'Pendiente',
            label: 'Estado API',
          },
        ],
      };
    }),
  };
}

/**
 * Controlador de Dominio para Servicios Externos e Integraciones
 * (Google Drive, Make / Integromat y Autodesk Revit APS).
 *
 * @param {Object} [options]
 * @param {boolean} [options.hideMocks=false] - Inicia colecciones vacías en producción
 * @param {Function} [options.showToast] - Disparador de notificaciones Toast
 * @returns {Object} Estados y operaciones de conectores externos
 */
export function useIntegrationsController({
  hideMocks = false,
  showToast,
} = {}) {
  const [integrationsData, setIntegrationsData] = useState(() =>
    hideMocks ? createEmptyIntegrations() : createIntegrationsData()
  );
  const [integrationsQuery, setIntegrationsQuery] = useState('');
  const [feedback, setFeedback] = useState('');
  const [testingDrive, setTestingDrive] = useState(false);
  const [testingMake, setTestingMake] = useState(false);

  // 1. Refrescar estado de Google Drive
  const refreshGoogleDrive = useCallback(async (withFeedback = false) => {
    setTestingDrive(true);
    const [response, error] = await runSafe(
      () => api.get('/integrations/google-drive/status/'),
      {
        showToast: withFeedback && showToast ? showToast : undefined,
        successTitle: 'Estado de Google Drive',
        successMessage: (res) => {
          const driveStatus = res?.data;
          return driveStatus?.connected
            ? `Google Drive conectado correctamente${driveStatus?.email ? `: ${driveStatus.email}` : '.'}`
            : 'Google Drive todavía no está conectado.';
        },
        fallbackError: 'No se pudo consultar Google Drive. Verifica que Django esté encendido.',
      }
    );
    setTestingDrive(false);

    if (error || !response?.data) {
      setIntegrationsData((prev) => updateGoogleDriveStatus(prev, { connected: false }));
      if (withFeedback) {
        setFeedback(error?.friendlyMessage || 'No se pudo conectar con Google Drive.');
      }
      return false;
    }

    const driveStatus = response.data;
    setIntegrationsData((prev) => updateGoogleDriveStatus(prev, driveStatus));
    if (withFeedback) {
      setFeedback(
        driveStatus.connected
          ? `Google Drive conectado correctamente${driveStatus.email ? `: ${driveStatus.email}` : '.'}`
          : 'Google Drive todavía no está conectado.'
      );
    }
    return Boolean(driveStatus.connected);
  }, [showToast]);

  // 2. Refrescar estado de Autodesk Revit APS
  const refreshRevitStatus = useCallback(async () => {
    const [response, error] = await runSafe(
      () => api.get('/integrations/aps/status/'),
      {
        fallbackError: 'No se pudo consultar el estado de Autodesk APS.',
      }
    );

    if (error || !response?.data) {
      setIntegrationsData((prev) => updateRevitStatus(prev, { connected: false }));
      return false;
    }

    setIntegrationsData((prev) => updateRevitStatus(prev, response.data));
    return Boolean(response.data.connected);
  }, []);

  // 3. Probar conexión con Make (Integromat)
  const testMakeConnection = useCallback(async (customEndpoint) => {
    setTestingMake(true);
    const webhookUrl = customEndpoint && customEndpoint.startsWith('http') ? customEndpoint : undefined;
    const [response, error] = await runSafe(
      () => makeApi.testConnection(webhookUrl),
      {
        showToast,
        successTitle: 'Conexión con Make Exitosa',
        successMessage: (res) => res?.message || 'El webhook de Make respondió correctamente.',
        fallbackError: 'Error de conexión con el webhook de Make.',
      }
    );
    setTestingMake(false);

    if (error) {
      return false;
    }

    setIntegrationsData((prev) => testIntegration(prev, 'make'));
    return true;
  }, [showToast]);

  // 4. Disparar un evento hacia Make (para notificaciones, asignaciones, 2FA, etc.)
  const triggerMakeEvent = useCallback(async (event, payload = {}, webhookUrl = '') => {
    const [response, error] = await runSafe(
      () => makeApi.triggerEvent(event, payload, webhookUrl),
      {
        fallbackError: `No se pudo enviar el evento '${event}' hacia Make.`,
      }
    );
    return [response, error];
  }, []);

  // 5. Guardar configuración de una integración
  const saveIntegrationConfig = useCallback((integrationId, draft) => {
    setIntegrationsData((prev) => {
      const updated = updateIntegration(prev, integrationId, draft);
      if (showToast) {
        showToast({
          title: 'Configuración Guardada',
          message: updated === prev ? 'No había cambios que guardar.' : 'Configuración de integración actualizada con éxito.',
          type: 'info',
        });
      }
      return updated;
    });
  }, [showToast]);

  // 6. Probar integración genérica (local / sesión)
  const testLocalIntegration = useCallback((integrationId) => {
    setIntegrationsData((prev) => testIntegration(prev, integrationId));
    if (showToast) {
      showToast({
        title: 'Prueba Completada',
        message: 'La integración se marcó como conectada en la sesión actual.',
        type: 'info',
      });
    }
  }, [showToast]);

  // 7. Enlace para iniciar OAuth de Google Drive
  const googleDriveConnectUrl = `${apiBaseUrl}/integrations/google-drive/connect/`;
  const connectGoogleDrive = useCallback(() => {
    if (typeof window !== 'undefined') {
      window.open(googleDriveConnectUrl, '_blank', 'noopener,noreferrer');
      if (showToast) {
        showToast({
          title: 'Autorización Iniciada',
          message: 'Autoriza Google Drive en la nueva pestaña y luego pulsa "Probar conexión".',
          type: 'info',
        });
      }
    }
  }, [googleDriveConnectUrl, showToast]);

  // Verificación inicial de conectores al montar
  useEffect(() => {
    refreshGoogleDrive(false);
    refreshRevitStatus();
  }, [refreshGoogleDrive, refreshRevitStatus]);

  return {
    integrationsData,
    setIntegrationsData,
    integrationsQuery,
    setIntegrationsQuery,
    feedback,
    setFeedback,
    testingDrive,
    testingMake,
    refreshGoogleDrive,
    refreshRevitStatus,
    testMakeConnection,
    triggerMakeEvent,
    saveIntegrationConfig,
    testLocalIntegration,
    connectGoogleDrive,
    googleDriveConnectUrl,
  };
}
