import React, { useMemo, useState } from 'react';
import { Calculator } from 'lucide-react';
import ModalDialog from '../../components/common/ModalDialog';
import { useLanguage } from '../../context/LanguageContext';
import {
  errorClass,
  inputClass,
  labelClass,
  nestedClass,
} from '../../constants/themeClasses';
import api from '../../services/api';

export default function TimelineAnalysisDialog({
  projects,
  initialProjectId,
  onClose,
}) {
  const { t } = useLanguage();
  const [projectId, setProjectId] = useState(
    String(initialProjectId || projects[0]?.id || '')
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  const tableHeaders = useMemo(() => [
    t('strategicPlanning.task', 'Tarea'),
    t('strategicPlanning.responsible', 'Responsable'),
    t('strategicPlanning.proposedStart', 'Inicio propuesto'),
    t('strategicPlanning.proposedEnd', 'Fin propuesto'),
    t('strategicPlanning.dependencySlack', 'Holgura por dependencias'),
    t('strategicPlanning.additionalWait', 'Espera adicional'),
    t('strategicPlanning.criticalByDependencies', 'Crítica por dependencias'),
  ], [t]);

  const calculate = async () => {
    if (loading) return;

    if (!/^\d+$/.test(projectId)) {
      setResult(null);
      setError(t('strategicPlanning.selectDjangoProject', 'Selecciona un proyecto guardado en Django.'));
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await api.get(
        `/projects/${projectId}/optimize/`
      );

      setResult(response.data);
    } catch (failure) {
      setResult(null);
      setError(
        typeof failure.response?.data?.detail === 'string'
          ? failure.response.data.detail
          : t('strategicPlanning.cannotCalculateProposal', 'No se pudo calcular la propuesta. Revisa la conexión y vuelve a intentarlo.')
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalDialog
      isOpen
      onClose={onClose}
      onSubmit={calculate}
      isSubmitting={loading}
      submitDisabled={!projectId}
      title={t('strategicPlanning.timelineAnalysisTitle', 'Análisis de tiempos')}
      subtitle={t('strategicPlanning.timelineAnalysisSubtitle', 'Dependencias, trabajo paralelo y responsables')}
      icon={<Calculator size={20} />}
      submitLabel={t('strategicPlanning.calculateProposal', 'Calcular propuesta')}
      cancelLabel={t('common.close', 'Cerrar')}
      id="timeline-analysis"
      maxWidth="max-w-5xl"
    >
      <label className={`block ${labelClass}`}>
        {t('strategicPlanning.projectField', 'Proyecto')}

        <select
          required
          value={projectId}
          disabled={loading}
          className={inputClass}
          onChange={(event) => {
            setProjectId(event.target.value);
            setResult(null);
            setError('');
          }}
        >
          <option value="" disabled>
            {t('strategicPlanning.selectAProject', 'Selecciona un proyecto')}
          </option>

          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </select>
      </label>

      <p className="text-xs">
        {t('strategicPlanning.timelineAnalysisDesc', 'Esta simulación analiza el plan completo. Calcula una propuesta y conserva las fechas guardadas.')}
      </p>

      {error && (
        <p role="alert" className={errorClass}>
          {error}
        </p>
      )}

      {result && (
        <div
          className="space-y-4"
          aria-live="polite"
          aria-busy={loading}
        >
          <p className={`p-3 text-sm ${nestedClass}`}>
            {loading
              ? t('strategicPlanning.recalculatingProposal', 'Recalculando propuesta. Se muestra el resultado anterior mientras termina la consulta.')
              : result.message}
          </p>

          {result.status === 'ok' && (
            <>
              <dl
                className={`grid gap-3 p-4 text-sm sm:grid-cols-3 ${nestedClass}`}
              >
                <div>
                  <dt>{t('strategicPlanning.savedProjectDuration', 'Plazo del proyecto guardado')}</dt>
                  <dd className="font-bold">
                    {t('strategicPlanning.calendarDays', `${result.original_duration_days} días calendario`, { count: result.original_duration_days })}
                  </dd>
                </div>

                <div>
                  <dt>{t('strategicPlanning.durationWithDependencies', 'Plazo con dependencias y responsables')}</dt>
                  <dd className="font-bold">
                    {t('strategicPlanning.calendarDays', `${result.scheduled_duration_days} días calendario`, { count: result.scheduled_duration_days })}
                  </dd>
                </div>

                <div>
                  <dt>{t('strategicPlanning.proposedEnd', 'Fin propuesto')}</dt>
                  <dd className="font-bold">
                    {result.proposed_end_date}
                  </dd>
                </div>

                <div>
                  <dt>{t('strategicPlanning.marginAgainstSaved', 'Margen frente al plazo guardado')}</dt>
                  <dd className="font-bold">
                    {t('strategicPlanning.days', `${result.days_saved} días`, { count: result.days_saved })}
                  </dd>
                </div>

                <div>
                  <dt>{t('strategicPlanning.excessOverSaved', 'Exceso sobre el plazo guardado')}</dt>
                  <dd className="font-bold">
                    {t('strategicPlanning.days', `${result.delay_days} días`, { count: result.delay_days })}
                  </dd>
                </div>

                <div>
                  <dt>
                    {t('strategicPlanning.minByDependencies', 'Mínimo por dependencias, sin conflictos de responsables')}
                  </dt>
                  <dd className="font-bold">
                    {t('strategicPlanning.days', `${result.dependency_duration_days} días`, { count: result.dependency_duration_days })}
                  </dd>
                </div>
              </dl>

              <p className="text-xs">
                {t('strategicPlanning.criticalPathExplanation', 'La ruta crítica y la holgura se calculan por dependencias. La espera adicional muestra el efecto de los responsables compartidos.')}
              </p>

              <div className="max-h-80 overflow-auto rounded border border-slate-400/30">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr>
                      {tableHeaders.map((label) => (
                        <th
                          key={label}
                          className="whitespace-nowrap p-3"
                        >
                          {label}
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody>
                    {result.tasks.map((task) => (
                      <tr
                        key={task.task_id}
                        className="border-t border-slate-400/20"
                      >
                        <td className="p-3">
                          {task.title}
                        </td>

                        <td className="p-3">
                          {task.assigned_to_name}
                        </td>

                        <td className="whitespace-nowrap p-3">
                          {task.start_date}
                        </td>

                        <td className="whitespace-nowrap p-3">
                          {task.end_date}
                        </td>

                        <td className="p-3">
                          {t('strategicPlanning.days', `${task.slack_days} días`, { count: task.slack_days })}
                        </td>

                        <td className="p-3">
                          {t('strategicPlanning.days', `${task.resource_delay_days} días`, { count: task.resource_delay_days })}
                        </td>

                        <td className="p-3">
                          {task.is_critical_path ? t('strategicPlanning.yes', 'Sí') : t('strategicPlanning.no', 'No')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {result.warnings?.length > 0 && (
            <div className={`p-3 text-xs ${nestedClass}`}>
              <strong>{t('strategicPlanning.incompleteData', 'Datos por completar')}</strong>

              <ul className="mt-2 list-disc pl-5">
                {result.warnings.map((warning, index) => (
                  <li key={index}>
                    {warning}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <details className="text-xs">
            <summary className="cursor-pointer font-semibold">
              {t('strategicPlanning.assumptionsAndLimits', 'Supuestos y límites del cálculo')}
            </summary>

            <ul className="mt-2 list-disc space-y-1 pl-5">
              {result.assumptions.map((item) => (
                <li key={item}>
                  {item}
                </li>
              ))}
            </ul>
          </details>
        </div>
      )}
    </ModalDialog>
  );
}