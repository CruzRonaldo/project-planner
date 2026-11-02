import React from 'react';
import { Cloud, RotateCw, ShieldCheck } from 'lucide-react';
import ModalDialog from '../../../components/common/ModalDialog';
import Button from '../../../components/common/Button';
import IntegrationStatus from './IntegrationStatus';
import GoogleDriveFileManager from './GoogleDriveFileManager';
import { nestedClass } from './constants';

export default function GoogleDriveModal({
  isOpen = false,
  onClose,
  integration,
  onConnect,
  onTest,
  testing = false,
}) {
  if (!integration) return null;

  const isConnected = integration.status === 'connected';

  return (
    <ModalDialog
      isOpen={isOpen}
      onClose={onClose}
      title={`Configuración de ${integration.name}`}
      subtitle="Bóveda documental para planos, especificaciones y archivos de proyectos."
      icon={<Cloud size={22} />}
      maxWidth="max-w-5xl"
      showFooter={false}
      id="google-drive-modal"
    >
      <div className="space-y-4 p-4 sm:p-6 overflow-y-auto max-h-[75vh]">
        {/* Cabecera de Estado y Conexión OAuth */}
        <div className={`p-4 ${nestedClass} flex flex-col md:flex-row md:items-center justify-between gap-4`}>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 midnight:text-cyan-100">
                Estado de la Bóveda:
              </span>
              <IntegrationStatus status={integration.status} />
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 midnight:text-cyan-300">
              Cuenta vinculada:{' '}
              <strong className="text-slate-800 dark:text-slate-200 midnight:text-cyan-200">
                {integration.endpoint || 'Sin cuenta autorizada'}
              </strong>
            </p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 midnight:text-cyan-400/80">
              Última verificación: {integration.lastActivity}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              icon={RotateCw}
              isLoading={testing}
              onClick={() => onTest(integration.id)}
            >
              {testing ? 'Comprobando...' : 'Probar conexión'}
            </Button>

            <Button
              variant="primary"
              size="sm"
              icon={ShieldCheck}
              onClick={onConnect}
            >
              {isConnected ? 'Reautorizar Google Drive' : 'Conectar Google Drive'}
            </Button>
          </div>
        </div>

        {/* Explorador de Archivos de Google Drive */}
        <div className="pt-2">
          <GoogleDriveFileManager connected={isConnected} />
        </div>
      </div>
    </ModalDialog>
  );
}
