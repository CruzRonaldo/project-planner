import React from 'react';
import ReadOnlyField from '../../../components/common/ReadOnlyField';
import { cardClass } from '../../../constants/themeClasses';

/**
 * Parámetros Globales del Proyecto (exclusivo para Administrador)
 */
export default function ProjectParametersCard() {
  return (
    <section
      aria-labelledby="project-parameters-title"
      className={`${cardClass} p-6`}
    >
      <h2
        id="project-parameters-title"
        className="text-lg font-bold mb-4 text-slate-900 dark:text-white midnight:text-cyan-100"
      >
        Parámetros del Proyecto
      </h2>
      <div className="grid grid-cols-2 gap-4">
        <ReadOnlyField label="Moneda Base" value="USD ($)" />
        <ReadOnlyField label="Año Fiscal" value="2026 (Ene - Dic)" />
        <ReadOnlyField label="Margen de Tolerancia" value="7 días calendario" />
        <ReadOnlyField label="Motor de Optimización" value="Rendimiento M²/día" />
      </div>
    </section>
  );
}
