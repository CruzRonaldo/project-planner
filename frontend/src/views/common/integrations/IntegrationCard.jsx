import React from 'react';
import { Settings2 } from 'lucide-react';
import Button from '../../../components/common/Button';
import { cardClass, iconMap, resolveLastActivity } from './constants';
import IntegrationStatus from './IntegrationStatus';
import { useLanguage } from '../../../context/LanguageContext';

export default function IntegrationCard({ integration, onConfigure }) {
  const { t } = useLanguage();
  const Icon = iconMap[integration.icon];

  const resolveMetricValue = (val) => {
    if (typeof val !== 'string') return val;
    const lower = val.toLowerCase();
    if (lower === 'activa' || lower === 'activo' || lower === 'active') {
      return t('integrations.val_active', 'Activa');
    }
    if (lower === 'pendiente' || lower === 'pending') {
      return t('integrations.val_pending', 'Pendiente');
    }
    return val;
  };

  const resolveMetricLabel = (metric) => {
    if (metric.key === 'api') {
      return metric.label === 'Google Drive API'
        ? t('integrations.metric_drive_api', 'Google Drive API')
        : t('integrations.metric_api', 'Estado API');
    }
    if (metric.key === 'account') {
      return metric.value === 1
        ? t('integrations.metric_account', 'cuenta conectada')
        : t('integrations.metric_account_plural', 'cuentas conectadas');
    }
    if (metric.key === 'models') {
      return metric.value === 1
        ? t('integrations.metric_models_singular', 'modelo activo')
        : t('integrations.metric_models', 'modelos activos');
    }
    return t(`integrations.metric_${metric.key}`, metric.label);
  };

  return (
    <article className={`flex min-h-[225px] min-w-0 flex-col p-5 ${cardClass}`}>
      <header className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-cyan-50 text-cyan-700 transition-colors duration-300 dark:bg-blue-500/25 dark:text-blue-300 midnight:bg-cyan-500/20 midnight:text-cyan-300">
            {Icon && <Icon size={20} />}
          </span>
          <h2 className="truncate text-base font-semibold text-slate-900 transition-colors duration-300 dark:text-white midnight:text-cyan-50">
            {integration.name}
          </h2>
        </div>
        <IntegrationStatus status={integration.status} />
      </header>

      <p className="mt-4 min-h-10 text-xs leading-relaxed text-slate-500 transition-colors duration-300 dark:text-slate-400 midnight:text-cyan-300/80">
        {t(`integrations.desc_${integration.id}`, integration.description)}
      </p>

      <div className="mt-4 grid grid-cols-2 gap-4">
        {integration.metrics.map((metric) => (
          <div key={metric.key}>
            <strong
              className={`text-base ${
                metric.key === 'errors' && Number(metric.value) > 0
                  ? 'text-red-600 dark:text-red-400 midnight:text-red-300'
                  : 'text-cyan-600 dark:text-cyan-400 midnight:text-cyan-400'
              }`}
            >
              {resolveMetricValue(metric.value)}
            </strong>
            <p className="mt-0.5 text-[10px] text-slate-500 transition-colors duration-300 dark:text-slate-400 midnight:text-cyan-400/80">
              {resolveMetricLabel(metric)}
            </p>
          </div>
        ))}
      </div>

      <footer className="mt-auto flex items-end justify-between gap-3 pt-4">
        <span className="text-[10px] text-slate-500 transition-colors duration-300 dark:text-slate-400 midnight:text-cyan-400/80">
          {t('integrations.activity', 'Actividad')}: {resolveLastActivity(integration.lastActivity, t)}
        </span>
        <Button
          variant="primary"
          size="sm"
          icon={Settings2}
          onClick={() => onConfigure(integration.id)}
          aria-label={t('integrations.configureIntegration', 'Configurar {name}', { name: integration.name })}
        >
          {t('integrations.configure', 'Configurar')}
        </Button>
      </footer>
    </article>
  );
}
