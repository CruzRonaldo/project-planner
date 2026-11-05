import { useState, useEffect, useCallback, useMemo } from 'react';
import projectsApi from '../services/projectsApi';
import { mapToGanttProject } from '../utils/strategicPlanning';
import {
  createStrategicPlanningData,
  createPortfolioData,
  createOperationsData,
} from '../mocks';

/**
 * Controlador de Dominio para Portafolio, Planificación Estratégica (Gantt)
 * y Gestión Operativa.
 *
 * @param {Object} [options]
 * @param {boolean} [options.hideMocks=false] - Si es true, inicia colecciones vacías
 * @param {Function} [options.onAssignmentsLoaded] - Callback para propagar asignaciones al directorio técnico
 * @returns {Object} Estados de datos, queries de filtrado y acciones sincronizadas
 */
export function useProjectsController({
  hideMocks = false,
  onAssignmentsLoaded,
} = {}) {
  // 1. Estados de proyectos y dominios operativos
  const [strategicPlanningData, setStrategicPlanningData] = useState(() =>
    hideMocks ? { projects: [], milestones: [], adjustments: [] } : createStrategicPlanningData()
  );

  const [portfolioData, setPortfolioData] = useState(() =>
    hideMocks ? { projects: [], changes: [] } : createPortfolioData()
  );

  const [operationsData, setOperationsData] = useState(() =>
    hideMocks
      ? {
          hydrated: false,
          metrics: { inProgress: 0, completed: 0, incidents: 0, efficiency: 0 },
          orders: [],
          activities: [],
          alerts: [],
          qualityChecks: [],
        }
      : createOperationsData()
  );

  const [remoteAssignments, setRemoteAssignments] = useState([]);

  // 2. Filtros de búsqueda específicos de cada vista
  const [portfolioQuery, setPortfolioQuery] = useState('');
  const [operationsQuery, setOperationsQuery] = useState('');

  // 3. Sincronización global con la API de Django al inicializar
  useEffect(() => {
    let isMounted = true;
    const syncBackendData = async () => {
      try {
        const [
          backendProjects,
          backendMilestones,
          backendTasks,
          backendProjectChanges,
          backendAdjustments,
        ] = await Promise.all([
          projectsApi.getProjects().catch((err) => {
            console.error('Error al sincronizar proyectos de la Base de Datos:', err);
            return null;
          }),
          projectsApi.getMilestones().catch((err) => {
            console.warn('Error al sincronizar hitos de la Base de Datos:', err);
            return null;
          }),
          projectsApi.getTasks().catch((err) => {
            console.warn('Error al sincronizar tareas operativas de la Base de Datos:', err);
            return null;
          }),
          projectsApi.getProjectChangeLogs().catch((err) => {
            console.warn('Error al sincronizar historial de cambios de proyectos:', err);
            return null;
          }),
          projectsApi.getScheduleAdjustments().catch((err) => {
            console.warn('Error al sincronizar reajustes de cronograma:', err);
            return null;
          }),
        ]);

        if (!isMounted) return;

        if (Array.isArray(backendProjects) && backendProjects.length > 0) {
          const mapped = backendProjects.map((bp) => ({
            id: bp.id,
            code: bp.code,
            name: bp.name,
            area: bp.area || 'Edificaciones Comerciales',
            status: bp.status || 'planning',
            progress: bp.progress ?? 0,
            usedBudget: bp.usedBudget ?? 0,
            totalBudget: bp.totalBudget || Number(bp.budget) || 0,
            startDate: bp.startDate || bp.start_date,
            endDate: bp.endDate || bp.end_date,
            leaderId: bp.leaderId || 'carlos',
            leaderName: bp.leaderName || '',
            leaderEmail: bp.leaderEmail || '',
            driveFolder: '',
            description: bp.description || '',
            members: bp.members || ['PM'],
          }));

          const mappedChanges =
            Array.isArray(backendProjectChanges) && backendProjectChanges.length > 0
              ? backendProjectChanges.map((c) => ({
                  id: c.id,
                  date: c.date,
                  project: c.project_name || c.project_code || 'Proyecto',
                  change: c.change,
                  user: c.user,
                }))
              : [];

          setPortfolioData((prev) => ({
            ...prev,
            projects: mapped,
            changes: mappedChanges.length > 0 ? mappedChanges : prev.changes || [],
          }));

          // Sincronizar Calendario Maestro (Gantt)
          const mappedGanttProjects = mapped.map((p) => mapToGanttProject(p));

          const mappedMilestones =
            Array.isArray(backendMilestones) && backendMilestones.length > 0
              ? backendMilestones.map((bm) => ({
                  id: bm.id,
                  projectId: bm.project ?? bm.projectId,
                  title: bm.name ?? bm.title,
                  targetDate: bm.target_date ?? bm.targetDate,
                  status: (bm.status || 'pending').toLowerCase(),
                  validator: bm.validator || 'Carlos M. (Project Manager)',
                  description: bm.description || '',
                  blocking: bm.blocking !== undefined ? bm.blocking : true,
                }))
              : [];

          const mappedAdjustments =
            Array.isArray(backendAdjustments) && backendAdjustments.length > 0
              ? backendAdjustments.map((a) => ({
                  id: a.id,
                  date: a.date,
                  projectId: a.projectId ?? a.project,
                  projectName: a.projectName,
                  previousPeriod: a.previousPeriod,
                  nextPeriod: a.nextPeriod,
                  reason: a.reason,
                }))
              : [];

          setStrategicPlanningData((prev) => ({
            ...prev,
            projects: mappedGanttProjects,
            milestones: mappedMilestones.length > 0 ? mappedMilestones : prev.milestones,
            adjustments: mappedAdjustments.length > 0 ? mappedAdjustments : prev.adjustments || [],
          }));
        }

        // Sincronizar Gestión Operativa desde las Tareas de la Base de Datos
        if (Array.isArray(backendTasks) && backendTasks.length > 0) {
          const projectMap = {};
          if (Array.isArray(backendProjects)) {
            backendProjects.forEach((p) => {
              projectMap[p.id] = p.name;
              projectMap[p.code] = p.name;
            });
          }

          const statusMap = {
            DONE: 'completed',
            IN_PROGRESS: 'in-progress',
            TODO: 'planned',
            REVIEW: 'in-progress',
          };

          const mappedOrders = backendTasks.map((t) => {
            const projName =
              projectMap[t.project] ||
              (typeof t.project === 'object' && t.project?.name) ||
              'Proyecto Operativo';
            return {
              id: `order-${t.id}`,
              code: `#${100 + Number(t.id || 1)}`,
              project: projName,
              type: t.category_name ? `Inspección ${t.category_name}` : 'Operación técnica',
              title: t.title,
              area: t.category_name || 'Operaciones',
              responsible: t.assigned_to_name || 'Personal Técnico',
              startDate: t.start_date,
              endDate: t.end_date,
              priority: t.is_critical_path ? 'high' : 'medium',
              status: statusMap[t.status] || 'in-progress',
              critical: !!t.is_critical_path,
              tolerance: t.tolerance_days || 7,
              documentUrl: '',
              description: t.description || '',
              progress: t.progress ?? 0,
            };
          });

          const inProg = mappedOrders.filter((o) => o.status === 'in-progress').length;
          const comp = mappedOrders.filter((o) => o.status === 'completed').length;
          const avgEff =
            mappedOrders.length > 0
              ? Math.round(
                  (mappedOrders.reduce((acc, o) => acc + (o.progress || 0), 0) /
                    mappedOrders.length) *
                    10
                ) / 10
              : 93.4;

          setOperationsData((prev) => ({
            ...prev,
            hydrated: true,
            orders: mappedOrders,
            metrics: {
              inProgress: inProg,
              completed: comp,
              incidents: 2,
              efficiency: avgEff,
            },
            // Si no hay actividades del backend, dejar vacío — no inyectar mocks
            activities: prev.activities?.length > 0 ? prev.activities : [],
            alerts: prev.alerts?.length > 0 ? prev.alerts : [],
            qualityChecks: prev.qualityChecks?.length > 0 ? prev.qualityChecks : [],
          }));
        } else if (backendTasks !== null) {
          // El backend respondió pero no tiene tareas — marcar como hidratado con arrays vacíos
          setOperationsData((prev) => ({
            ...prev,
            hydrated: true,
            orders: prev.orders?.length > 0 ? prev.orders : [],
            metrics: prev.metrics?.inProgress !== undefined ? prev.metrics : { inProgress: 0, completed: 0, incidents: 0, efficiency: 0 },
            activities: prev.activities?.length > 0 ? prev.activities : [],
            alerts: prev.alerts?.length > 0 ? prev.alerts : [],
            qualityChecks: prev.qualityChecks?.length > 0 ? prev.qualityChecks : [],
          }));
        }
      } catch (err) {
        console.error('Error al sincronizar datos de la Base de Datos:', err);
      }
    };

    syncBackendData();
    return () => {
      isMounted = false;
    };
  }, [onAssignmentsLoaded]);

  // 4. Mantener el Calendario Maestro sincronizado si cambia Portafolio
  useEffect(() => {
    if (portfolioData?.projects && portfolioData.projects.length > 0) {
      setStrategicPlanningData((prev) => {
        let hasChanges = false;
        const updatedGantt = portfolioData.projects.map((p) => {
          const existing = prev.projects?.find(
            (ep) => String(ep.id) === String(p.id) || ep.code === p.code
          );
          const mapped = mapToGanttProject(p, existing);
          if (
            !existing ||
            existing.start !== mapped.start ||
            existing.duration !== mapped.duration ||
            existing.startDate !== mapped.startDate ||
            existing.endDate !== mapped.endDate ||
            existing.name !== mapped.name ||
            existing.area !== mapped.area ||
            existing.totalBudget !== mapped.totalBudget
          ) {
            hasChanges = true;
            return mapped;
          }
          return existing;
        });

        if (!hasChanges && updatedGantt.length === prev.projects?.length) {
          return prev;
        }

        return {
          ...prev,
          projects: updatedGantt,
        };
      });
    }
  }, [portfolioData.projects]);

  // 5. Manejar cambios en Planificación Estratégica y sincronizar Portafolio
  const handlePlanningChange = useCallback((updated) => {
    setStrategicPlanningData(updated);
    if (updated?.projects?.length) {
      setPortfolioData((prev) => {
        if (!prev?.projects?.length) return prev;
        let hasChanges = false;
        const newProjects = prev.projects.map((p) => {
          const updatedProj = updated.projects.find(
            (up) => String(up.id) === String(p.id) || up.code === p.code
          );
          if (
            updatedProj &&
            ((updatedProj.startDate && updatedProj.startDate !== p.startDate) ||
              (updatedProj.endDate && updatedProj.endDate !== p.endDate) ||
              (updatedProj.start_date && updatedProj.start_date !== p.start_date) ||
              (updatedProj.end_date && updatedProj.end_date !== p.end_date))
          ) {
            hasChanges = true;
            return {
              ...p,
              startDate: updatedProj.startDate,
              endDate: updatedProj.endDate,
              start_date: updatedProj.startDate,
              end_date: updatedProj.endDate,
              duration_months: updatedProj.duration,
            };
          }
          return p;
        });
        return hasChanges ? { ...prev, projects: newProjects } : prev;
      });
    }
  }, []);

  // 6. Opciones de proyectos compartidas (DRY para operaciones, equipo técnico y rrhh)
  const projectOptions = useMemo(() => {
    return (portfolioData?.projects || []).map(
      (project) => `${project.name} (${project.code})`
    );
  }, [portfolioData?.projects]);

  return {
    strategicPlanningData,
    setStrategicPlanningData,
    handlePlanningChange,
    portfolioData,
    setPortfolioData,
    operationsData,
    setOperationsData,
    portfolioQuery,
    setPortfolioQuery,
    operationsQuery,
    setOperationsQuery,
    projectOptions,
    remoteAssignments,
  };
}
