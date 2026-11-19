import React from 'react';
import ReadOnlyField from '../../../components/common/ReadOnlyField';
import { cardClass } from '../../../constants/themeClasses';
import { useLanguage } from '../../../context/LanguageContext';

/**
 * Parámetros Globales del Proyecto (exclusivo para Administrador)
 */
export default function ProjectParametersCard() {
  const { t } = useLanguage();

  return (
    <section
      aria-labelledby="project-parameters-title"
      className={`${cardClass} p-6`}
    >
      <h2
        id="project-parameters-title"
        className="text-lg font-bold mb-4 text-slate-900 dark:text-white midnight:text-cyan-100"
      >
        {t('configuration.projectParametersTitle', 'Parámetros del Proyecto')}
      </h2>
      <div className="grid grid-cols-2 gap-4">
        <ReadOnlyField
          label={t('configuration.baseCurrency', 'Moneda Base')}
          value={t('configuration.baseCurrencyValue', 'USD ($)')}
        />
        <ReadOnlyField
          label={t('configuration.fiscalYear', 'Año Fiscal')}
          value={t('configuration.fiscalYearValue', '2026 (Ene - Dic)')}
        />
        <ReadOnlyField
          label={t('configuration.toleranceMargin', 'Margen de Tolerancia')}
          value={t('configuration.toleranceMarginValue', '7 días calendario')}
        />
        <ReadOnlyField
          label={t('configuration.optimizationEngine', 'Motor de Optimización')}
          value={t('configuration.optimizationEngineValue', 'Rendimiento M²/día')}
        />
      </div>
    </section>
  );
}
