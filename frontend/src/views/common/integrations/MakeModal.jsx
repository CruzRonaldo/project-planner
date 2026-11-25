import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  Bell,
  Info,
  Lock,
  MoreHorizontal,
  RotateCw,
  Save,
  Workflow,
  Zap,
} from 'lucide-react';
import ModalDialog from '../../../components/common/ModalDialog';
import Button from '../../../components/common/Button';
import Input from '../../../components/common/Input';
import { makeApi } from '../../../services/makeApi';
import { runSafe } from '../../../utils/asyncHandler';
import { useToast } from '../../../context/ToastContext';
import { useLanguage } from '../../../context/LanguageContext';
import { nestedClass } from './constants';
import IntegrationStatus from './IntegrationStatus';

const taskIconMap = {
  two_factor: Lock,
  notifications: Bell,
};

const resolveTaskIcon = (task) => {
  if (task && (typeof task.icon === 'function' || typeof task.icon === 'object')) {
    return task.icon;
  }
  return (task && taskIconMap[task.id]) || Workflow;
};

const VALID_TASK_IDS = new Set(['two_factor', 'notifications']);

const normalizeTasksWithIcons = (rawTasks) => {
  const filtered = Array.isArray(rawTasks)
    ? rawTasks.filter((t) => t && VALID_TASK_IDS.has(t.id))
    : [];

  if (filtered.length === 0) {
    return defaultTasks.map((tItem) => ({
      ...tItem,
      api_token: '',
      has_api_token: false,
      clear_api_token: false,
      usage: null,
    }));
  }

  const taskMap = new Map(filtered.map((t) => [t.id, t]));
  const fullTasks = defaultTasks.map((defTask) => {
    const existing = taskMap.get(defTask.id);
    if (!existing) return defTask;
    return {
      ...defTask,
      ...existing,
      icon: resolveTaskIcon(existing),
    };
  });

  return fullTasks.map((t) => ({
    ...t,
    api_token: t.api_token || '',
    has_api_token: Boolean(t.has_api_token),
    clear_api_token: Boolean(t.clear_api_token),
    usage: t.usage || null,
    icon: resolveTaskIcon(t),
  }));
};

const defaultTasks = [
  {
    id: 'two_factor',
    name: 'Autenticación de 2 Factores (2FA)',
    description: 'Envío de códigos OTP por correo o SMS durante el inicio de sesión.',
    icon: Lock,
    event: 'auth.two_factor',
    endpoint: '',
    enabled: true,
    api_token: '',
    has_api_token: false,
    clear_api_token: false,
    usage: null,
  },
  {
    id: 'notifications',
    name: 'Notificaciones y Asignaciones',
    description: 'Alertas y notificaciones internas del sistema (seguridad, personal, hitos e incidentes).',
    icon: Bell,
    event: 'project.assignment',
    endpoint: '',
    enabled: true,
    api_token: '',
    has_api_token: false,
    clear_api_token: false,
    usage: null,
  },
];

const computeMakeStatus = (taskList) => {
  const list = Array.isArray(taskList) ? taskList : [];
  const enabledTasks = list.filter((tItem) => Boolean(tItem.enabled ?? true));
  const configuredTasks = enabledTasks.filter((tItem) => Boolean(tItem.endpoint?.trim()));
  if (enabledTasks.length === 0) return 'offline';
  if (configuredTasks.length === 0) return 'offline';
  if (configuredTasks.length === enabledTasks.length) return 'connected';
  return 'partial';
};

export default function MakeModal({
  isOpen = false,
  onClose,
  integration,
  onSave,
}) {
  const { t } = useLanguage();
  const { showToast } = useToast();
  const [tasks, setTasks] = useState(() => {
    if (integration?.extraConfig?.tasks && Array.isArray(integration.extraConfig.tasks)) {
      return normalizeTasksWithIcons(integration.extraConfig.tasks);
    }
    if (integration?.endpoint && integration.endpoint.startsWith('http')) {
      return defaultTasks.map((tItem, idx) => (idx === 0 ? { ...tItem, endpoint: integration.endpoint } : tItem));
    }
    return defaultTasks;
  });

  const [expandedTokenTaskId, setExpandedTokenTaskId] = useState(null);
  const [testingTask, setTestingTask] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (integration?.extraConfig?.tasks && Array.isArray(integration.extraConfig.tasks)) {
      setTasks(normalizeTasksWithIcons(integration.extraConfig.tasks));
    } else if (integration?.endpoint && integration.endpoint.startsWith('http')) {
      setTasks(defaultTasks.map((tItem, idx) => (idx === 0 ? { ...tItem, endpoint: integration.endpoint } : tItem)));
    }
    setExpandedTokenTaskId(null);
  }, [integration, isOpen]);

  useEffect(() => {
    if (!isOpen || typeof window === 'undefined') return undefined;
    let active = true;
    const syncStatus = async () => {
      const [res, err] = await runSafe(() => makeApi.getStatus());
      if (!active || err || !res || !Array.isArray(res.tasks)) return;
      setTasks((current) =>
        current.map((tItem) => {
          const remoteTask = res.tasks.find((r) => r.id === tItem.id);
          if (!remoteTask) return tItem;
          return {
            ...tItem,
            usage: remoteTask.usage ?? tItem.usage ?? null,
            has_api_token: Boolean(remoteTask.has_api_token),
          };
        })
      );
    };
    syncStatus();
    return () => {
      active = false;
    };
  }, [isOpen]);

  if (!integration) return null;

  const computedStatus = computeMakeStatus(tasks);
  const enabledTasks = tasks.filter((taskItem) => Boolean(taskItem.enabled ?? true));
  const activeCount = enabledTasks.filter((taskItem) => Boolean(taskItem.endpoint?.trim())).length;
  const totalCount = enabledTasks.length;

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

  const handleTaskTokenChange = (taskId, value) => {
    setTasks((current) =>
      current.map((task) =>
        task.id === taskId
          ? {
              ...task,
              api_token: value,
              clear_api_token: value.trim() ? false : task.clear_api_token,
            }
          : task
      )
    );
  };

  const handleTaskTokenClear = (taskId) => {
    setTasks((current) =>
      current.map((task) =>
        task.id === taskId
          ? {
              ...task,
              api_token: '',
              has_api_token: false,
              clear_api_token: true,
              usage: null,
            }
          : task
      )
    );
  };

  const testSingleWebhook = async (task) => {
    const rawUrl = task.endpoint?.trim() || '';
    const taskName = t(`integrations.makeTask_${task.id}_name`, task.name);

    if (rawUrl && !rawUrl.startsWith('http://') && !rawUrl.startsWith('https://')) {
      showToast({
        title: t('integrations.invalidUrlTitle', 'URL Inválida'),
        message: t('integrations.invalidUrlMsg', 'El webhook de {name} debe comenzar con http:// o https://.', {
          name: taskName,
        }),
        type: 'warning',
      });
      return;
    }

    setTestingTask(task.id);
    const [res, err] = await runSafe(
      () => makeApi.testConnection(rawUrl || undefined),
      {
        showToast,
        successTitle: t('integrations.webhookConnectedTitle', 'Webhook {name} Conectado', { name: taskName }),
        successMessage: (r) =>
          r?.message ||
          t('integrations.webhookConnectedMsg', 'El escenario de Make para {name} respondió con éxito.', {
            name: taskName,
          }),
        fallbackError: t('integrations.webhookConnectError', 'No se pudo conectar con el webhook de {name}.', {
          name: taskName,
        }),
      }
    );
    setTestingTask(null);

    if (!err && res) {
      setTasks((current) =>
        current.map((tItem) => (tItem.id === task.id ? { ...tItem, enabled: true } : tItem))
      );
    }
  };

  const handleSaveAll = async (event) => {
    if (event) event.preventDefault();
    setIsSaving(true);

    const primaryUrl =
      tasks.find((tItem) => tItem.enabled && tItem.endpoint?.trim())?.endpoint?.trim() ||
      tasks.find((tItem) => tItem.endpoint?.trim())?.endpoint?.trim() ||
      '';

    const activeEndpoints = tasks
      .filter((tItem) => tItem.enabled && tItem.endpoint?.trim())
      .map((tItem) => tItem.name)
      .join(', ');

    const serializedTasks = tasks.map((tItem) => {
      const { icon: _icon, usage: _usage, has_api_token: _hasToken, ...rest } = tItem;
      const trimmedTaskToken = (tItem.api_token || '').trim();
      const taskPayload = {
        ...rest,
        endpoint: (tItem.endpoint || '').trim(),
        enabled: Boolean(tItem.enabled ?? true),
      };
      if (tItem.clear_api_token) {
        taskPayload.api_token = '';
        taskPayload.clear_api_token = true;
      } else if (trimmedTaskToken) {
        taskPayload.api_token = trimmedTaskToken;
        taskPayload.preserve_api_token = false;
      } else if (tItem.has_api_token) {
        taskPayload.api_token = '';
        taskPayload.preserve_api_token = true;
      } else {
        taskPayload.api_token = '';
      }
      return taskPayload;
    });

    const savePayload = {
      webhook_url: primaryUrl,
      status: computedStatus,
      frequency: 'Tiempo real',
      tasks: serializedTasks,
    };

    const [, saveErr] = await runSafe(
      () => makeApi.saveConfig(savePayload),
      {
        showToast,
        successTitle: t('toasts.Escenarios Guardados', 'Escenarios Guardados'),
        successMessage: t('integrations.makeConfigSaved', 'Configuración de Make persistida correctamente.'),
        fallbackError: t('integrations.makeConfigSaveError', 'Error al persistir en el servidor.'),
      }
    );

    let finalTasks = tasks.map((tItem) => ({
      ...tItem,
      api_token: '',
      has_api_token: tItem.clear_api_token
        ? false
        : Boolean((tItem.api_token || '').trim()) || Boolean(tItem.has_api_token),
      clear_api_token: false,
    }));

    if (!saveErr) {
      const [statusRes, statusErr] = await runSafe(() => makeApi.getStatus());
      if (!statusErr && statusRes && Array.isArray(statusRes.tasks)) {
        finalTasks = finalTasks.map((tItem) => {
          const remoteTask = statusRes.tasks.find((r) => r.id === tItem.id);
          if (!remoteTask) return tItem;
          return {
            ...tItem,
            usage: remoteTask.usage ?? null,
            has_api_token: Boolean(remoteTask.has_api_token),
          };
        });
        setTasks(finalTasks);
      }
    }

    const sanitizedDraftTasks = finalTasks.map(({ icon: _icon, api_token: _token, clear_api_token: _clear, ...rest }) => rest);

    const activeTasksCount = finalTasks.filter(
      (tItem) => Boolean(tItem.enabled ?? true) && Boolean(tItem.endpoint?.trim())
    ).length;
    const errorTasksCount = finalTasks.filter(
      (tItem) =>
        Boolean(tItem.enabled ?? true) &&
        Boolean(tItem.endpoint?.trim()) &&
        Boolean(tItem.usage?.is_paused || tItem.usage?.error)
    ).length;

    const draft = {
      status: computedStatus,
      frequency: 'Tiempo real',
      endpoint: primaryUrl || activeEndpoints || 'Escenarios / Operaciones',
      errors: errorTasksCount,
      metrics: [
        { key: 'scenarios', value: activeTasksCount, label: 'escenarios' },
        { key: 'errors', value: errorTasksCount, label: 'con error' },
      ],
      extraConfig: {
        tasks: sanitizedDraftTasks,
        primaryUrl,
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
      title={t('integrations.configMake', 'Configuración Multitarea de {name}', { name: integration.name })}
      subtitle={t('integrations.makeSubtitle', 'Orquestación de webhooks y agentes externos para automatizaciones del sistema.')}
      icon={<Workflow size={22} />}
      maxWidth="max-w-3xl"
      submitLabel={t('integrations.saveScenarios', 'Guardar escenarios')}
      submitIcon={<Save size={14} />}
      isSubmitting={isSaving}
      id="make-modal"
    >
      <div className="space-y-4 p-4 sm:p-6 overflow-y-auto max-h-[72vh]">
        {/* Resumen general y modo de ejecución */}
        <div className={`p-4 ${nestedClass} flex flex-col md:flex-row md:items-center justify-between gap-4`}>
          <div>
            <p className="text-[10px] uppercase font-semibold text-slate-500 dark:text-slate-400 midnight:text-cyan-400/80">
              {t('integrations.automationGeneralStatus', 'Estado general de automatización')}
            </p>
            <div className="mt-1.5 flex items-center gap-2">
              <IntegrationStatus status={computedStatus} />
              <span className="text-xs text-slate-600 dark:text-slate-300 midnight:text-cyan-200">
                {t('integrations.activeTasksCount', '{active} de {total} tareas configuradas', {
                  active: activeCount,
                  total: totalCount,
                })}
              </span>
            </div>
          </div>

          <div className="flex items-center">
            <span className="inline-flex items-center rounded-md border border-slate-200 bg-slate-100/80 px-2.5 py-1 text-[11px] font-medium text-slate-600 dark:border-[#30363d] dark:bg-[#161b22] dark:text-slate-300 midnight:border-cyan-800/40 midnight:bg-[#0a1628] midnight:text-cyan-300">
              {t('integrations.modeRealtime', 'Modo: Tiempo real por evento')}
            </span>
          </div>
        </div>

        {/* Lista de Webhooks / Tareas Especializadas */}
        <div className="space-y-3 pt-1">
          <h3 className="text-xs font-semibold text-slate-800 dark:text-slate-200 midnight:text-cyan-100 flex items-center gap-1.5">
            <Zap size={14} className="text-cyan-500" />
            {t('integrations.activeScenarios', 'Escenarios Activos')}
          </h3>

          {tasks.some((taskItem) => !taskItem.enabled) && (
            <div className="flex items-start gap-2.5 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs">
              <AlertTriangle size={16} className="shrink-0 mt-0.5 text-amber-500" />
              <div>
                <p className="font-semibold">{t('integrations.warningTitle', 'Advertencia de Notificaciones')}</p>
                <p className="text-[11px] opacity-90">{t('integrations.makeDeactivationWarning', 'Hay tareas o escenarios desactivados. Los eventos asociados no se enviarán a Make ni a los canales de correo externos.')}</p>
              </div>
            </div>
          )}

          {tasks.map((task) => {
            const TaskIcon = resolveTaskIcon(task);
            const taskName = t(`integrations.makeTask_${task.id}_name`, task.name);
            const isTestingThis = testingTask === task.id;
            const isTokenExpanded = expandedTokenTaskId === task.id;
            const taskUsage = task.usage;
            const isPaused = Boolean(taskUsage?.is_paused);
            const hasTaskUsage = Boolean(
              taskUsage?.configured && (Number(taskUsage?.limit) > 0 || isPaused)
            );
            const taskUsagePercent = Math.max(0, Math.min(100, Number(taskUsage?.percent) || 0));
            const taskUsageBarColor =
              isPaused || taskUsagePercent <= 5
                ? 'bg-rose-500'
                : taskUsagePercent <= 20
                ? 'bg-amber-500'
                : 'bg-cyan-500';
            const taskUsageBarWidth = isPaused && taskUsagePercent === 0 ? 100 : taskUsagePercent;
            const hasConfiguredOrTypedToken =
              Boolean((task.has_api_token || (task.api_token && task.api_token.trim())) && !task.clear_api_token);
            const tokenSettingsLabel = t('integrations.taskTokenSettingsAria', 'Ajustes de token para {name}', {
              name: taskName,
            });

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
                        {taskName}
                      </h4>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 midnight:text-cyan-300/80">
                        {t(`integrations.makeTask_${task.id}_desc`, task.description)}
                      </p>
                    </div>
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <span className="text-[10px] font-medium text-slate-600 dark:text-slate-400 midnight:text-cyan-300">
                      {task.enabled ? t('integrations.active', 'Activo') : t('integrations.inactive', 'Inactivo')}
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
                  <div className="flex items-center gap-1.5 w-full sm:w-auto shrink-0">
                    <Button
                      variant="secondary"
                      size="sm"
                      icon={RotateCw}
                      isLoading={isTestingThis}
                      onClick={() => testSingleWebhook(task)}
                      className="shrink-0 flex-1 sm:flex-initial"
                    >
                      {isTestingThis ? t('integrations.testing', 'Probando...') : t('integrations.testWebhook', 'Probar Webhook')}
                    </Button>
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedTokenTaskId((prev) => (prev === task.id ? null : task.id))
                      }
                      title={tokenSettingsLabel}
                      aria-label={tokenSettingsLabel}
                      aria-expanded={isTokenExpanded}
                      className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 transition-colors hover:border-slate-300 hover:bg-slate-100 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 dark:border-[#30363d] dark:bg-[#161b22] dark:text-slate-500 dark:hover:border-slate-600 dark:hover:bg-[#1f2937] dark:hover:text-slate-300 midnight:border-cyan-800/40 midnight:bg-[#0a1628] midnight:text-cyan-400/70 midnight:hover:border-cyan-600/50 midnight:hover:bg-cyan-950/40 midnight:hover:text-cyan-200"
                    >
                      <MoreHorizontal size={16} />
                    </button>
                  </div>
                </div>

                {/* Barra de monitoreo de créditos específica de esta tarea */}
                {hasTaskUsage && (
                  <div className="mt-3 pt-2.5 border-t border-slate-200/70 dark:border-[#30363d]/70 midnight:border-cyan-900/30 space-y-1.5">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                      <span className="font-medium text-slate-700 dark:text-slate-300 midnight:text-cyan-200">
                        {t('integrations.creditsAvailable', 'Créditos disponibles')}:{' '}
                        <span
                          className={`font-semibold ${
                            isPaused || taskUsagePercent <= 5
                              ? 'text-rose-600 dark:text-rose-400'
                              : 'text-slate-900 dark:text-white midnight:text-cyan-50'
                          }`}
                        >
                          {taskUsage.percent}%
                        </span>
                      </span>
                      <span
                        className={`text-[11px] ${
                          isPaused
                            ? 'font-medium text-rose-600 dark:text-rose-400'
                            : 'text-slate-500 dark:text-slate-400 midnight:text-cyan-400/80'
                        }`}
                      >
                        ({Number(taskUsage.available ?? 0).toLocaleString()} / {Number(taskUsage.limit ?? 0).toLocaleString()} {t('integrations.operations', 'ops')})
                        {isPaused && (
                          <>
                            {' - '}
                            {t('integrations.accountPaused', 'Cuenta pausada en Make por límite excedido ({used} ops)', {
                              used: taskUsage.used ?? 0,
                            })}
                          </>
                        )}
                      </span>
                    </div>
                    <div
                      className={`h-1.5 w-full overflow-hidden rounded-full ${
                        isPaused
                          ? 'bg-rose-200 dark:bg-rose-950/70'
                          : 'bg-slate-200 dark:bg-slate-800 midnight:bg-cyan-950'
                      }`}
                      role="progressbar"
                      aria-valuenow={taskUsagePercent}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label={`${t('integrations.creditsAvailable', 'Créditos disponibles')} - ${taskName}`}
                    >
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${taskUsageBarColor}`}
                        style={{ width: `${taskUsageBarWidth}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Sub-panel colapsable de API Token específico para esta tarea */}
                {isTokenExpanded && (
                  <div className={`mt-3 p-3.5 ${nestedClass} space-y-2.5`}>
                    {((task.has_api_token && !task.clear_api_token) || hasConfiguredOrTypedToken) && (
                      <div className="flex items-center justify-between gap-2">
                        {task.has_api_token && !task.clear_api_token ? (
                          <span className="inline-flex items-center rounded-md border border-slate-200 bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600 dark:border-[#30363d] dark:bg-[#161b22] dark:text-slate-300 midnight:border-cyan-800/40 midnight:bg-[#0a1628] midnight:text-cyan-300">
                            {t('integrations.apiTokenConfigured', 'Token configurado')}
                          </span>
                        ) : (
                          <span />
                        )}
                        {hasConfiguredOrTypedToken && (
                          <button
                            type="button"
                            onClick={() => handleTaskTokenClear(task.id)}
                            className="text-[11px] font-medium text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 transition-colors"
                          >
                            {t('integrations.clearApiToken', 'Eliminar token')}
                          </button>
                        )}
                      </div>
                    )}
                    <Input
                      id={`make-task-token-${task.id}`}
                      type="password"
                      label={t('integrations.makeTaskApiTokenLabel', 'Make API Token (Opcional)')}
                      value={task.api_token || ''}
                      onChange={(e) => handleTaskTokenChange(task.id, e.target.value)}
                      placeholder={
                        task.has_api_token && !task.clear_api_token
                          ? t(
                              'integrations.makeApiTokenStoredPlaceholder',
                              'Token configurado en el servidor (ingresa uno nuevo para reemplazar)'
                            )
                          : t('integrations.makeApiTokenPlaceholder', 'Ingresa tu token de API de Make')
                      }
                      className="text-xs py-2"
                    />
                    <div className="flex items-start gap-2 text-[11px] text-slate-500 dark:text-slate-400 midnight:text-cyan-300/80">
                      <Info size={14} className="shrink-0 mt-0.5 text-slate-400 dark:text-slate-500 midnight:text-cyan-400/70" />
                      <p>
                        {t(
                          'integrations.makeTaskApiTokenHelp',
                          'Opcional: Token para consultar el saldo de operaciones de la cuenta de Make vinculada a esta tarea.'
                        )}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </ModalDialog>
  );
}
