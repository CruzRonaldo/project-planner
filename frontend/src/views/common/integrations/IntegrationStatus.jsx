import React from 'react';
import { integrationStatuses } from '../../../constants/integrations';
import { useLanguage } from '../../../context/LanguageContext';

export default function IntegrationStatus({ status }) {
  const { t } = useLanguage();
  const details = integrationStatuses.find((item) => item.id === status) || {
    label: status,
    className: 'border-slate-200 bg-slate-50 text-slate-700',
  };
  return (
    <span className={`rounded border px-2 py-1 text-[10px] font-semibold ${details.className}`}>
      {t(`integrations.status_${status}`, details.label)}
    </span>
  );
}
