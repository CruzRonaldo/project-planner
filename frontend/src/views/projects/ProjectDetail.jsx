import React, { useState, useEffect, useCallback } from 'react';
import {
  Video,
  Plus,
  Clock,
  User,
  X,
  RefreshCw,
  Sparkles,
  Info,
} from 'lucide-react';
import projectsApi from '../../services/projectsApi';
import { useToast } from '../../context/ToastContext';

/**
 * Componente ProjectDetail / Detalle del Proyecto y Videoconferencias
 * Permite visualizar el detalle del proyecto, listar sus reuniones virtuales
 * y gestionar la creación de nuevas salas (restringido a Administradores).
 */
export default function ProjectDetail({
  project,
  isOpen = true,
  onClose,
  canManage = true,
  user = null,
  currentUser = null,
  isAdmin = false,
}) {
  const { showToast } = useToast();
  const [meetings, setMeetings] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Formulario rápido para nueva videollamada
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Identificar el usuario actual desde prop o desde localStorage
  const activeUser = user || currentUser || (() => {
    try {
      const stored = typeof window !== 'undefined' ? localStorage.getItem('project_planner_user') : null;
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  })();

  // Validación estricta de permisos de Administrador
  const isUserAdmin =
    Boolean(isAdmin) ||
    activeUser?.role === 'admin' ||
    activeUser?.accountType === 'admin' ||
    Boolean(activeUser?.is_superuser) ||
    Boolean(activeUser?.is_staff);

  const fetchMeetings = useCallback(async () => {
    if (!project?.id) return;
    setIsLoading(true);
    try {
      const data = await projectsApi.getMeetings(project.id);
      setMeetings(Array.isArray(data) ? data : (data?.results || []));
    } catch (err) {
      console.error('Error al cargar reuniones del proyecto:', err);
    } finally {
      setIsLoading(false);
    }
  }, [project?.id]);

  useEffect(() => {
    if (project?.id && isOpen) {
      fetchMeetings();
    }
  }, [project?.id, isOpen, fetchMeetings]);

  const handleCreateMeeting = async (e) => {
    if (e) e.preventDefault();
    if (!isUserAdmin || !project?.id) return;

    setIsSubmitting(true);
    try {
      const titleToCreate = newTitle.trim() || `Coordinación - ${project.name}`;
      const created = await projectsApi.createMeeting({
        project: project.id,
        title: titleToCreate,
      });

      showToast({
        title: 'Videollamada lista',
        message: `La sala "${created.title}" se generó correctamente con Jitsi Meet.`,
        type: 'success',
      });

      setNewTitle('');
      setIsCreating(false);
      await fetchMeetings();

      // Abrir inmediatamente la sala en nueva pestaña nativa
      if (created?.meeting_url) {
        window.open(created.meeting_url, '_blank');
      }
    } catch (error) {
      console.error('Error creando videollamada:', error);
      showToast({
        title: 'Error al generar sala',
        message: error.response?.data?.detail || 'No se pudo generar la sala de videoconferencia.',
        type: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !project) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/75 p-3 sm:p-5 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="relative flex max-h-[90vh] w-full max-w-4xl flex-col rounded-2xl border border-slate-200 bg-white shadow-2xl transition-colors dark:border-[#30363d] dark:bg-[#161b22] midnight:border-cyan-900/40 midnight:bg-[#0a1120] overflow-hidden">
        {/* Header del Detalle */}
        <header className="flex shrink-0 items-start justify-between border-b border-slate-200 p-5 dark:border-[#30363d] midnight:border-cyan-900/40">
          <div className="min-w-0 pr-4">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="rounded bg-cyan-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-cyan-800 dark:bg-cyan-900/40 dark:text-cyan-300 midnight:bg-cyan-900/50 midnight:text-cyan-200">
                {project.code || 'PROYECTO'}
              </span>
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 midnight:text-cyan-500/70">
                {project.area || 'Área Técnica'}
              </span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white midnight:text-cyan-50 truncate">
              {project.name}
            </h2>
            {project.description && (
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 midnight:text-cyan-400 line-clamp-2">
                {project.description}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={fetchMeetings}
              disabled={isLoading}
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200 midnight:text-cyan-500 midnight:hover:bg-cyan-900/30"
              title="Actualizar reuniones"
            >
              <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
            </button>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200 midnight:text-cyan-500 midnight:hover:bg-cyan-900/30"
                title="Cerrar ventana"
              >
                <X size={18} />
              </button>
            )}
          </div>
        </header>

        {/* Cuerpo del Detalle */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* Sección de Resumen Compacto */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 dark:border-[#30363d] dark:bg-[#0d1117] midnight:border-cyan-900/30 midnight:bg-[#050B14]">
              <span className="text-[10px] text-slate-500 midnight:text-cyan-500/70">Estado</span>
              <p className="mt-1 text-xs font-semibold capitalize text-slate-800 dark:text-slate-200 midnight:text-cyan-100">
                {project.status || 'En curso'}
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 dark:border-[#30363d] dark:bg-[#0d1117] midnight:border-cyan-900/30 midnight:bg-[#050B14]">
              <span className="text-[10px] text-slate-500 midnight:text-cyan-500/70">Progreso</span>
              <p className="mt-1 text-xs font-semibold text-slate-800 dark:text-slate-200 midnight:text-cyan-100">
                {project.progress ?? 0}%
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 dark:border-[#30363d] dark:bg-[#0d1117] midnight:border-cyan-900/30 midnight:bg-[#050B14]">
              <span className="text-[10px] text-slate-500 midnight:text-cyan-500/70">Presupuesto</span>
              <p className="mt-1 text-xs font-semibold text-slate-800 dark:text-slate-200 midnight:text-cyan-100 truncate">
                ${project.totalBudget ? Number(project.totalBudget).toLocaleString() : '0.00'}
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 dark:border-[#30363d] dark:bg-[#0d1117] midnight:border-cyan-900/30 midnight:bg-[#050B14]">
              <span className="text-[10px] text-slate-500 midnight:text-cyan-500/70">Videollamadas</span>
              <p className="mt-1 text-xs font-semibold text-cyan-600 dark:text-cyan-400 midnight:text-cyan-300">
                {meetings.length} activas
              </p>
            </div>
          </div>

          {/* Encabezado y Acción: Videollamadas */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-100 text-cyan-700 dark:bg-cyan-500/15 dark:text-cyan-400 midnight:bg-cyan-900/40 midnight:text-cyan-300">
                <Video size={16} />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white midnight:text-cyan-50">
                  Salas de Videoconferencia (Jitsi Meet)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 midnight:text-cyan-500/70">
                  Comunícate con el equipo técnico sin límites y de forma segura.
                </p>
              </div>
            </div>

            {/* Restricción por Rol: Solo administradores pueden crear salas */}
            {isUserAdmin && !isCreating && (
              <button
                type="button"
                onClick={() => setIsCreating(true)}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-cyan-600/20 transition-all hover:from-cyan-500 hover:to-blue-500 hover:shadow-cyan-600/30"
              >
                <Video size={14} />
                <span>Nueva Videollamada</span>
              </button>
            )}
          </div>

          {/* Formulario Inline para Crear Videollamada (Solo Administradores) */}
          {isUserAdmin && isCreating && (
            <form
              onSubmit={handleCreateMeeting}
              className="rounded-xl border border-cyan-500/30 bg-cyan-500/5 p-4 transition-all duration-200 space-y-3 dark:border-cyan-500/20 dark:bg-cyan-500/10 midnight:border-cyan-800/40 midnight:bg-cyan-950/30"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-cyan-800 dark:text-cyan-300 midnight:text-cyan-200">
                  Configurar Nueva Sala Jitsi
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setIsCreating(false);
                    setNewTitle('');
                  }}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X size={14} />
                </button>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder={`Ej. Coordinación Estructural - ${project.code || ''}`}
                  className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 outline-none transition-colors focus:border-cyan-500 dark:border-[#30363d] dark:bg-[#0d1117] dark:text-white dark:focus:border-cyan-400 midnight:border-cyan-800/40 midnight:bg-[#050B14] midnight:text-cyan-50"
                  autoFocus
                />
                <div className="flex items-center gap-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-cyan-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-cyan-500 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw size={13} className="animate-spin" />
                        <span>Generando...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles size={13} />
                        <span>Crear Sala</span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsCreating(false)}
                    className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100 dark:border-[#30363d] dark:text-slate-300 dark:hover:bg-slate-800 midnight:border-cyan-800/40 midnight:text-cyan-300"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* Listado de Reuniones del Proyecto */}
          <div className="space-y-2.5">
            {meetings.length > 0 && (
              <div className="mb-4 p-4 rounded-xl bg-cyan-950/20 border border-cyan-900/50 flex items-start gap-3 text-sm text-slate-300 shadow-sm">
                <Info className="w-5 h-5 text-cyan-500 shrink-0 mt-0.5"/>
                <div>
                  <span className="text-cyan-100 font-medium block mb-1">Optimización de red y duración de sesiones</span>
                  <p className="leading-relaxed">
                    Para garantizar la estabilidad del servicio, las sesiones operan en ciclos continuos de 95 minutos. Si la transmisión concluye automáticamente al llegar al límite, simplemente haz clic de nuevo en <strong className="text-white font-semibold">Entrar a Sala</strong> para reiniciar la reunión al instante manteniendo el mismo enlace.
                  </p>
                </div>
              </div>
            )}
            {isLoading && meetings.length === 0 ? (
              <div className="flex items-center justify-center py-10 text-xs text-slate-400">
                <RefreshCw size={16} className="animate-spin mr-2" />
                <span>Consultando salas activas...</span>
              </div>
            ) : meetings.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center dark:border-[#30363d] midnight:border-cyan-900/40">
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500 midnight:bg-cyan-950 midnight:text-cyan-600">
                  <Video size={20} />
                </div>
                <h4 className="mt-3 text-xs font-medium text-slate-800 dark:text-slate-200 midnight:text-cyan-100">
                  No hay videollamadas registradas
                </h4>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 midnight:text-cyan-500/70 max-w-sm mx-auto">
                  {isUserAdmin
                    ? 'Crea una sala de reunión instantánea para que los ingenieros y técnicos puedan coordinar avances en vivo.'
                    : 'Aún no se han generado videollamadas para este proyecto.'}
                </p>
                {isUserAdmin && (
                  <button
                    type="button"
                    onClick={() => setIsCreating(true)}
                    className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-3 py-1.5 text-xs font-medium text-cyan-700 hover:bg-cyan-500/20 dark:text-cyan-300 midnight:text-cyan-300"
                  >
                    <Plus size={13} />
                    <span>Iniciar primera videollamada</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-2.5">
                {meetings.map((meeting) => (
                  <div
                    key={meeting.id}
                    className="group flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:border-cyan-500/40 hover:shadow-md dark:border-[#30363d] dark:bg-[#0d1117] dark:hover:border-cyan-500/40 midnight:border-cyan-900/30 midnight:bg-[#050B14] midnight:hover:border-cyan-500/50"
                  >
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white midnight:text-cyan-50 truncate">
                          {meeting.title}
                        </h4>
                        <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-mono text-slate-600 dark:bg-slate-800 dark:text-slate-400 midnight:bg-cyan-950 midnight:text-cyan-400">
                          {meeting.room_name}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-[10px] text-slate-500 dark:text-slate-400 midnight:text-cyan-500/70">
                        <span className="flex items-center gap-1">
                          <Clock size={12} />
                          {meeting.created_at
                            ? new Date(meeting.created_at).toLocaleString('es-PE', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : 'Reciente'}
                        </span>
                        {meeting.created_by_name && (
                          <span className="flex items-center gap-1">
                            <User size={12} />
                            {meeting.created_by_name}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center shrink-0">
                      <a
                        href={meeting.meeting_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
                      >
                        <Video className="w-4 h-4" />
                        Entrar a Sala
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
