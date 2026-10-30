import React, { useState } from 'react';
import { Calculator } from 'lucide-react';
import ModalDialog from '../../components/common/ModalDialog';
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
  const [projectId, setProjectId] = useState(
    String(initialProjectId || projects[0]?.id || '')
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  const calculate = async () => {
    if (loading) return;

    if (!/^\d+$/.test(projectId)) {
      setResult(null);
      setError('Selecciona un proyecto guardado en Django.');
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
          : 'No se pudo calcular la propuesta. Revisa la conexión y vuelve a intentarlo.'
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
      title="Análisis de tiempos"
      subtitle="Dependencias, trabajo paralelo y responsables"
      icon={<Calculator size={20} />}
      submitLabel="Calcular propuesta"
      cancelLabel="Cerrar"
      id="timeline-analysis"
      maxWidth="max-w-5xl"
    >
      <label className={`block ${labelClass}`}>
        Proyecto

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
            Selecciona un proyecto
          </option>

          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </select>
      </label>

      <p className="text-xs">
        Esta simulación analiza el plan completo. Calcula una propuesta
        y conserva las fechas guardadas.
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
              ? 'Recalculando propuesta. Se muestra el resultado anterior mientras termina la consulta.'
              : result.message}
          </p>

          {result.status === 'ok' && (
            <>
              <dl
                className={`grid gap-3 p-4 text-sm sm:grid-cols-3 ${nestedClass}`}
              >
                <div>
                  <dt>Plazo del proyecto guardado</dt>
                  <dd className="font-bold">
                    {result.original_duration_days} días calendario
                  </dd>
                </div>

                <div>
                  <dt>Plazo con dependencias y responsables</dt>
                  <dd className="font-bold">
                    {result.scheduled_duration_days} días calendario
                  </dd>
                </div>

                <div>
                  <dt>Fin propuesto</dt>
                  <dd className="font-bold">
                    {result.proposed_end_date}
                  </dd>
                </div>

                <div>
                  <dt>Margen frente al plazo guardado</dt>
                  <dd className="font-bold">
                    {result.days_saved} días
                  </dd>
                </div>

                <div>
                  <dt>Exceso sobre el plazo guardado</dt>
                  <dd className="font-bold">
                    {result.delay_days} días
                  </dd>
                </div>

                <div>
                  <dt>
                    Mínimo por dependencias, sin conflictos de responsables
                  </dt>
                  <dd className="font-bold">
                    {result.dependency_duration_days} días
                  </dd>
                </div>
              </dl>

              <p className="text-xs">
                La ruta crítica y la holgura se calculan por
                dependencias. La espera adicional muestra el efecto
                de los responsables compartidos.
              </p>

              <div className="max-h-80 overflow-auto rounded border border-slate-400/30">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr>
                      {[
                        'Tarea',
                        'Responsable',
                        'Inicio propuesto',
                        'Fin propuesto',
                        'Holgura por dependencias',
                        'Espera adicional',
                        'Crítica por dependencias',
                      ].map((label) => (
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
                          {task.slack_days} días
                        </td>

                        <td className="p-3">
                          {task.resource_delay_days} días
                        </td>

                        <td className="p-3">
                          {task.is_critical_path ? 'Sí' : 'No'}
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
              <strong>Datos por completar</strong>

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
              Supuestos y límites del cálculo
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