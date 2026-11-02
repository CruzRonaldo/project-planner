import React, { useState } from 'react';
import {
  Bell,
  Lock,
  RotateCw,
  Save,
  ShieldAlert,
  Workflow,
  Zap,
} from 'lucide-react';
import ModalDialog from '../../../components/common/ModalDialog';
import Button from '../../../components/common/Button';
import Input from '../../../components/common/Input';
import Select from '../../../components/common/Select';
import { syncFrequencies, integrationStatuses } from '../../../constants/integrations';
import { makeApi } from '../../../services/makeApi';
import { runSafe } from '../../../utils/asyncHandler';
import { useToast } from '../../../context/ToastContext';
import { nestedClass } from './constants';
import IntegrationStatus from './IntegrationStatus';

const defaultTasks = [
  {
    id: 'two_factor',
    name: 'Autenticación de 2 Factores (2FA)',
    description: 'Envío de códigos OTP por correo o SMS durante el inicio de sesión.',
    icon: Lock,
    event: 'auth.two_factor',
    endpoint: '',
    enabled: true,
  },
  {
    id: 'notifications',
    name: 'Notificaciones y Asignaciones',
    description: 'Alertas en tiempo real al asignar personal técnico o modificar hitos.',
    icon: Bell,
    event: 'project.assignment',
    endpoint: '',
    enabled: true,
  },
  {
    id: 'governance',
    name: 'Gobernanza Presupuestaria ($100k)',
    description: 'Avisos automáticos cuando un proyecto iguala o supera el umbral de $100k.',
    icon: ShieldAlert,
    event: 'governance.budget_alert',
    endpoint: '',
    enabled: false,
  },
];

export default function MakeModal({
  isOpen = false,
  onClose,
  integration,
  onSave,
}) {
  const { showToast } = useToast();
  const [tasks, setTasks] = useState(() => {
    if (integration?.extraConfig?.tasks && Array.isArray(integration.extraConfig.tasks)) {
      return integration.extraConfig.tasks;
    }
    if (integration?.endpoint && integration.endpoint.startsWith('http')) {
      return defaultTasks.map((t, idx) => (idx === 0 ? { ...t, endpoint: integration.endpoint } : t));
    }
    return defaultTasks;
  });

  const [frequency, setFrequency] = useState(integration?.frequency || syncFrequencies[0]);
  const [status, setStatus] = useState(integration?.status || 'connected');
  const [testingTask, setTestingTask] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  if (!integration) return null;

  const handleTaskEndpointChange = (taskId, value) => {
    setTasks((current) =>
      current.map((task) => (task.id === taskId ? { ...task, endpoint: value } : task))
    );
  };

  const handleTaskToggle = (taskId) => {
    setTasks((current) =>
      current.map((task) => (task.id === taskId ? { ...task, enabled: !task.enabled } : task))
    );
  };

  const testSingleWebhook = async (task) => {
    const rawUrl = task.endpoint?.trim() || '';

    if (rawUrl && !rawUrl.startsWith('http://') && !rawUrl.startsWith('https://')) {
      showToast({
        title: 'URL Inválida',
        message: `El webhook de ${task.name} debe comenzar con http:// o https://.`,
        type: 'warning',
      });
      return;
    }

    setTestingTask(task.id);
    const [res, err] = await runSafe(
      () => makeApi.testConnection(rawUrl || undefined),
      {
        showToast,
        successTitle: `Webhook ${task.name} Conectado`,
        successMessage: (r) =>
          r?.message || `El escenario de Make para ${task.name} respondió con éxito.`,
        fallbackError: `No se pudo conectar con el webhook de ${task.name}.`,
      }
    );
    setTestingTask(null);

    if (!err && res) {
      setTasks((current) =>
        current.map((t) => (t.id === task.id ? { ...t, enabled: true } : t))
      );
    }
  };

  const handleSaveAll = (event) => {
    if (event) event.preventDefault();
    setIsSaving(true);

    const activeEndpoints = tasks
      .filter((t) => t.enabled && t.endpoint)
      .map((t) => t.name)
      .join(', ');

    const draft = {
      status,
      frequency,
      endpoint: activeEndpoints || tasks[0]?.endpoint || 'Escenarios / Operaciones',
      errors: 0,
      extraConfig: {
        tasks,
      },
    };

    onSave(integration.id, draft);
    setIsSaving(false);
    if (onClose) onClose();
  };

  return (
    <ModalDialog
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleSaveAll}
      title={`Configuración Multitarea de ${integration.name}`}
      subtitle="Orquestación de webhooks y agentes externos para automatizaciones del sistema."
      icon={<Workflow size={22} />}
      maxWidth="max-w-3xl"
      submitLabel="Guardar escenarios"
      submitIcon={<Save size={14} />}
      isSubmitting={isSaving}
      id="make-modal"
    >
      <div className="space-y-4 p-4 sm:p-6 overflow-y-auto max-h-[72vh]">
        {/* Resumen general y parámetros */}
        <div className={`p-4 ${nestedClass} flex flex-col md:flex-row md:items-center justify-between gap-4`}>
          <div>
            <p className="text-[10px] uppercase font-semibold text-slate-500 dark:text-slate-400 midnight:text-cyan-400/80">
              Estado general de automatización
            </p>
            <div className="mt-1.5 flex items-center gap-2">
              <IntegrationStatus status={status} />
              <span className="text-xs text-slate-600 dark:text-slate-300 midnight:text-cyan-200">
                {tasks.filter((t) => t.enabled).length} de {tasks.length} tareas activas
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div>
              <label className="text-[10px] uppercase font-semibold text-slate-500 dark:text-slate-400 midnight:text-cyan-400/80 block mb-1">
                Frecuencia
              </label>
              <Select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value)}
                options={syncFrequencies.map((f) => ({ value: f, label: f }))}
                className="text-xs py-1.5"
              />
            </div>

            <div>
              <label className="text-[10px] uppercase font-semibold text-slate-500 dark:text-slate-400 midnight:text-cyan-400/80 block mb-1">
                Estado
              </label>
              <Select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                options={integrationStatuses.map((st) => ({ value: st.id, label: st.label }))}
                className="text-xs py-1.5"
              />
            </div>
          </div>
        </div>

        {/* Lista de Webhooks / Tareas Especializadas */}
        <div className="space-y-3 pt-1">
          <h3 className="text-xs font-semibold text-slate-800 dark:text-slate-200 midnight:text-cyan-100 flex items-center gap-1.5">
            <Zap size={14} className="text-cyan-500" />
            Escenarios y Webhooks por Tarea
          </h3>

          {tasks.map((task) => {
            const TaskIcon = task.icon;
            const isTestingThis = testingTask === task.id;

            return (
              <div
                key={task.id}
                className={`p-4 rounded-xl border transition-all duration-200 ${
                  task.enabled
                    ? 'border-cyan-300/80 bg-cyan-50/40 dark:border-cyan-500/30 dark:bg-cyan-950/20 midnight:border-cyan-500/40 midnight:bg-cyan-950/30'
                    : 'border-slate-200 bg-slate-50/80 opacity-75 dark:border-[#30363d] dark:bg-[#0d1117]/80 midnight:border-cyan-900/30 midnight:bg-[#050B14]/80'
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                        task.enabled
                          ? 'bg-cyan-100 text-cyan-800 dark:bg-cyan-500/20 dark:text-cyan-300 midnight:bg-cyan-500/20 midnight:text-cyan-300'
                          : 'bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-400 midnight:bg-slate-800 midnight:text-slate-400'
                      }`}
                    >
                      <TaskIcon size={16} />
                    </span>
                    <div>
                      <h4 className="text-xs font-semibold text-slate-900 dark:text-white midnight:text-cyan-50 truncate">
                        {task.name}
                      </h4>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 midnight:text-cyan-300/80">
                        {task.description}
                      </p>
                    </div>
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <span className="text-[10px] font-medium text-slate-600 dark:text-slate-400 midnight:text-cyan-300">
                      {task.enabled ? 'Activo' : 'Inactivo'}
                    </span>
                    <input
                      type="checkbox"
                      checked={task.enabled}
                      onChange={() => handleTaskToggle(task.id)}
                      className="h-4 w-4 rounded border-slate-300 text-cyan-500 focus:ring-cyan-400 dark:border-[#30363d] dark:bg-[#0d1117] midnight:border-cyan-800/40 midnight:bg-[#050B14]"
                    />
                  </label>
                </div>

                <div className="mt-3 flex flex-col sm:flex-row items-center gap-2">
                  <Input
                    type="url"
                    placeholder="https://hook.us1.make.com/..."
                    value={task.endpoint}
                    onChange={(e) => handleTaskEndpointChange(task.id, e.target.value)}
                    containerClassName="flex-1 w-full"
                    className="text-xs py-2"
                  />
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={RotateCw}
                    isLoading={isTestingThis}
                    onClick={() => testSingleWebhook(task)}
                    className="shrink-0 w-full sm:w-auto"
                  >
                    {isTestingThis ? 'Probando...' : 'Probar Webhook'}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </ModalDialog>
  );
}
