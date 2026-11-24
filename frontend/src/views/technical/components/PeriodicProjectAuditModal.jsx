import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ClipboardCheck,
  Download,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  AlertOctagon,
  Clock,
  Activity,
  Layers,
  Calendar,
  X,
  FileSpreadsheet,
  AlertCircle,
  UserCheck,
  FolderPlus,
} from 'lucide-react';
import { useLanguage } from '../../../context/LanguageContext';
import projectsApi from '../../../services/projectsApi';
import ModalDialog from '../../../components/common/ModalDialog';
import Table, { TableHead, TableRow } from '../../../components/common/Table';
import KpiCard from '../../../components/common/KpiCard';
import InlineAlert from '../../../components/common/InlineAlert';
import EmptyState from '../../../components/common/EmptyState';
import { isUserProject } from '../../../utils/portfolio';

const HEALTH_LEVELS = Object.freeze({
  HEALTHY: 'HEALTHY',
  WARNING: 'WARNING',
  CRITICAL: 'CRITICAL',
  STALE: 'STALE',
});

const PERIOD_OPTIONS = Object.freeze([
  { id: 'monthly', labelKey: 'portfolio.periodMonthly', defaultLabel: 'Mensual (30 días)', days: 30 },
  { id: 'quarterly', labelKey: 'portfolio.periodQuarterly', defaultLabel: 'Trimestral (90 días)', days: 90 },
  { id: 'semiannual', labelKey: 'portfolio.periodSemiannual', defaultLabel: 'Semestral (180 días)', days: 180 },
]);

/**
 * Genera y descarga un archivo CSV estructurado con la auditoría de proyectos.
 * @param {Array} projects - Proyectos auditados
 * @param {string} period - Período seleccionado
 * @param {Function} t - Función de traducción
 */
export function exportAuditToCsv(projects = [], period = 'monthly', t = (k, f) => f) {
  if (!Array.isArray(projects) || projects.length === 0) return;

  const headers = [
    t('portfolio.csvCode', 'Código'),
    t('portfolio.csvProject', 'Nombre del Proyecto'),
    t('portfolio.csvStatus', 'Estado'),
    t('portfolio.csvHealth', 'Nivel de Salud'),
    t('portfolio.csvActualProgress', 'Avance Real (%)'),
    t('portfolio.csvExpectedProgress', 'Avance Esperado (%)'),
    t('portfolio.csvOverdueTasks', 'Tareas Críticas Vencidas (CPM)'),
    t('portfolio.csvFindings', 'Hallazgos de Auditoría'),
    t('portfolio.csvStatusReasons', 'Motivos de Cambio de Estado'),
  ];

  const escapeCsv = (str) => {
    if (str === null || str === undefined) return '""';
    const clean = String(str).replace(/"/g, '""');
    return `"${clean}"`;
  };

  const rows = projects.map((p) => {
    const findingsStr = Array.isArray(p.findings)
      ? p.findings.join('; ')
      : p.findings || '';

    let reasonsStr = '';
    if (Array.isArray(p.status_reasons)) {
      reasonsStr = p.status_reasons
        .map((r) => (typeof r === 'object' ? `${r.date || ''} [${r.author || 'Sistema'}]: ${r.reason || ''}` : String(r)))
        .join('; ');
    } else if (p.status_change_reason) {
      reasonsStr = p.status_change_reason;
    }

    return [
      escapeCsv(p.code || ''),
      escapeCsv(p.name || ''),
      escapeCsv(t(`statuses.${p.status}`, p.status || '')),
      escapeCsv(p.health || ''),
      escapeCsv(p.progress ?? 0),
      escapeCsv(p.expected_progress ?? p.expectedProgress ?? 0),
      escapeCsv(p.overdue_critical_tasks ?? p.overdueCriticalTasks ?? 0),
      escapeCsv(findingsStr),
      escapeCsv(reasonsStr),
    ].join(',');
  });

  const csvContent = '\uFEFF' + [headers.map(escapeCsv).join(','), ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const dateStr = new Date().toISOString().slice(0, 10);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `auditoria-proyectos-${period}-${dateStr}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Modal Analítico e Interactivo de Auditoría Periódica de Proyectos.
 */
export default function PeriodicProjectAuditModal({
  isOpen,
  onClose,
  onNavigate,
  onCreateProject = null,
  currentUser = null,
}) {
  const { t } = useLanguage();
  const [period, setPeriod] = useState('monthly');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [auditData, setAuditData] = useState(null);
  const [healthFilter, setHealthFilter] = useState('ALL');
  const [onlyMyProjects, setOnlyMyProjects] = useState(false);

  const fetchAudit = useCallback(
    async (selectedPeriod) => {
      setLoading(true);
      setError('');
      try {
        const data = await projectsApi.getPeriodicAudit(selectedPeriod);
        setAuditData(data || null);
      } catch (err) {
        console.error('Error al obtener la auditoría periódica:', err);
        setError(
          err.response?.data?.error ||
            err.message ||
            t('portfolio.auditFetchError', 'No se pudo cargar la auditoría periódica de proyectos.')
        );
      } finally {
        setLoading(false);
      }
    },
    [t]
  );

  useEffect(() => {
    if (isOpen) {
      fetchAudit(period);
    }
  }, [isOpen, period, fetchAudit]);

  const allProjects = useMemo(() => {
    return Array.isArray(auditData?.projects) ? auditData.projects : [];
  }, [auditData]);

  const myProjectsCount = useMemo(() => {
    return allProjects.filter((p) => isUserProject(p, currentUser)).length;
  }, [allProjects, currentUser]);

  const scopedProjects = useMemo(() => {
    if (!onlyMyProjects) return allProjects;
    return allProjects.filter((p) => isUserProject(p, currentUser));
  }, [allProjects, onlyMyProjects, currentUser]);

  const summary = useMemo(() => {
    if (!auditData) {
      return { healthy: 0, warning: 0, critical: 0, stale: 0, total: 0 };
    }
    if (!onlyMyProjects) {
      return {
        healthy: auditData.summary?.healthy ?? 0,
        warning: auditData.summary?.warning ?? 0,
        critical: auditData.summary?.critical ?? 0,
        stale: auditData.summary?.stale ?? 0,
        total: auditData.summary?.total ?? auditData.projects?.length ?? 0,
      };
    }
    const res = { healthy: 0, warning: 0, critical: 0, stale: 0, total: scopedProjects.length };
    scopedProjects.forEach((p) => {
      const h = String(p.health || '').toLowerCase();
      if (h in res) res[h] += 1;
    });
    return res;
  }, [auditData, onlyMyProjects, scopedProjects]);

  const filteredProjects = useMemo(() => {
    if (healthFilter === 'ALL') return scopedProjects;
    return scopedProjects.filter((p) => String(p.health).toUpperCase() === healthFilter);
  }, [scopedProjects, healthFilter]);

  const handleExport = () => {
    exportAuditToCsv(allProjects, period, t);
  };

  const getHealthBadge = (health) => {
    const normalized = String(health || '').toUpperCase();
    switch (normalized) {
      case HEALTH_LEVELS.HEALTHY:
        return (
          <span className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-semibold border text-emerald-700 bg-emerald-50 border-emerald-200 dark:text-emerald-400 dark:bg-emerald-500/10 dark:border-emerald-500/20 midnight:text-emerald-300 midnight:bg-emerald-950/40 midnight:border-emerald-800/40">
            <CheckCircle2 size={13} className="shrink-0 text-emerald-600 dark:text-emerald-400" />
            {t('portfolio.healthHealthy', 'En Cronograma')}
          </span>
        );
      case HEALTH_LEVELS.WARNING:
        return (
          <span className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-semibold border text-amber-700 bg-amber-50 border-amber-200 dark:text-amber-400 dark:bg-amber-500/10 dark:border-amber-500/20 midnight:text-amber-300 midnight:bg-amber-950/40 midnight:border-amber-800/40">
            <AlertTriangle size={13} className="shrink-0 text-amber-600 dark:text-amber-400" />
            {t('portfolio.healthWarning', 'En Advertencia')}
          </span>
        );
      case HEALTH_LEVELS.CRITICAL:
        return (
          <span className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-semibold border text-rose-700 bg-rose-50 border-rose-200 dark:text-rose-400 dark:bg-rose-500/10 dark:border-rose-500/20 midnight:text-rose-300 midnight:bg-rose-950/40 midnight:border-rose-800/40">
            <AlertOctagon size={13} className="shrink-0 text-rose-600 dark:text-rose-400" />
            {t('portfolio.healthCritical', 'Crítico / Desviado')}
          </span>
        );
      case HEALTH_LEVELS.STALE:
      default:
        return (
          <span className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-semibold border text-slate-700 bg-slate-100 border-slate-200 dark:text-slate-300 dark:bg-slate-800 dark:border-slate-700 midnight:text-slate-300 midnight:bg-slate-900/60 midnight:border-slate-800">
            <Clock size={13} className="shrink-0 text-slate-500 dark:text-slate-400" />
            {t('portfolio.healthStale', 'Inactivo / Estancado')}
          </span>
        );
    }
  };

  const columns = [
    { label: t('portfolio.colProject', 'Proyecto'), className: 'w-[28%]' },
    { label: t('portfolio.colHealth', 'Salud Operativa'), className: 'w-[16%]' },
    { label: t('portfolio.colProgress', 'Avance Real vs Esperado'), className: 'w-[20%]' },
    { label: t('portfolio.colCPM', 'CPM Vencidas'), className: 'w-[12%]' },
    { label: t('portfolio.colFindings', 'Hallazgos & Bitácora'), className: 'w-[24%]' },
  ];

  return (
    <ModalDialog
      isOpen={isOpen}
      onClose={onClose}
      title={t('portfolio.auditModalTitle', 'Auditoría Periódica de Proyectos')}
      subtitle={t('portfolio.auditModalSubtitle', 'Análisis de salud de cronogramas, ruta crítica (CPM) y justificación de desvíos')}
      icon={<ClipboardCheck size={22} />}
      maxWidth="max-w-6xl"
      showFooter={false}
      id="periodic-project-audit"
    >
      <div className="flex flex-col gap-5">
        {/* Barra superior de controles: Selector segmentado y botones de acción */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-1 border-b border-slate-200 dark:border-[#30363d] midnight:border-cyan-900/30">
          <div className="flex flex-wrap items-center gap-2">
            {/* Selector Segmentado de Período */}
            <div className="inline-flex rounded-xl p-1 bg-slate-100 dark:bg-[#0d1117] midnight:bg-[#050b14] border border-slate-200 dark:border-[#30363d] midnight:border-cyan-900/30">
              {PERIOD_OPTIONS.map((opt) => {
                const active = period === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setPeriod(opt.id)}
                    className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-200 ${
                      active
                        ? 'bg-white text-slate-900 shadow-sm dark:bg-[#161b22] dark:text-white midnight:bg-cyan-950/70 midnight:text-cyan-200 midnight:border midnight:border-cyan-700/50'
                        : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white midnight:text-cyan-600 midnight:hover:text-cyan-300'
                    }`}
                  >
                    <Calendar size={13} className={active ? 'text-cyan-600 dark:text-cyan-400' : 'opacity-60'} />
                    <span>{t(opt.labelKey, opt.defaultLabel)}</span>
                  </button>
                );
              })}
            </div>

            {/* Chip Conmutador de Ámbito: Mis Proyectos */}
            <button
              type="button"
              onClick={() => setOnlyMyProjects(!onlyMyProjects)}
              aria-pressed={onlyMyProjects}
              aria-label={t('portfolio.filterMyProjectsAria', 'Filtrar por mis proyectos asignados')}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all duration-200 ${
                onlyMyProjects
                  ? 'border-cyan-500 bg-cyan-500/10 text-cyan-700 shadow-sm dark:border-blue-500 dark:bg-blue-500/15 dark:text-blue-300 midnight:border-cyan-500 midnight:bg-cyan-500/20 midnight:text-cyan-200'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900 dark:border-[#30363d] dark:bg-[#0d1117] dark:text-slate-400 dark:hover:border-slate-600 dark:hover:text-slate-200 midnight:border-cyan-900/40 midnight:bg-[#050b14] midnight:text-cyan-400/80 midnight:hover:text-cyan-200'
              }`}
            >
              <UserCheck size={13} className={onlyMyProjects ? 'text-cyan-600 dark:text-blue-400 midnight:text-cyan-400' : 'opacity-70'} />
              <span>{t('portfolio.myProjectsScope', 'Mis proyectos')}</span>
              <span
                className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                  onlyMyProjects
                    ? 'bg-cyan-600 text-white dark:bg-blue-600 midnight:bg-cyan-500'
                    : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 midnight:bg-cyan-950 midnight:text-cyan-300'
                }`}
              >
                {myProjectsCount}
              </span>
            </button>
          </div>

          {/* Acciones: Refrescar y Exportar CSV */}
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              type="button"
              onClick={() => fetchAudit(period)}
              disabled={loading}
              title={t('portfolio.refreshAudit', 'Actualizar auditoría')}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:border-[#30363d] dark:bg-[#161b22] dark:text-slate-300 dark:hover:bg-white/5 midnight:border-cyan-800/40 midnight:bg-[#0a1120] midnight:text-cyan-200 midnight:hover:bg-cyan-900/30 transition-colors disabled:opacity-50"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin text-cyan-600' : ''} />
              <span className="hidden sm:inline">{t('common.refresh', 'Actualizar')}</span>
            </button>

            <button
              type="button"
              onClick={handleExport}
              disabled={loading || allProjects.length === 0}
              title={t('portfolio.exportAuditCsvTooltip', 'Exportar bitácora a formato CSV')}
              className="inline-flex items-center gap-1.5 rounded-lg border border-cyan-500/30 bg-cyan-50 px-3 py-1.5 text-xs font-semibold text-cyan-700 hover:bg-cyan-100 dark:border-cyan-400/30 dark:bg-cyan-500/10 dark:text-cyan-300 dark:hover:bg-cyan-500/20 midnight:border-cyan-700/50 midnight:bg-cyan-950/60 midnight:text-cyan-200 midnight:hover:bg-cyan-900/40 transition-colors disabled:opacity-50"
            >
              <Download size={14} />
              <span>{t('portfolio.exportAuditCsv', 'Exportar a CSV')}</span>
            </button>
          </div>
        </div>

        {/* Tarjetas KPI de Resumen Semántico */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <KpiCard
            title={t('portfolio.kpiHealthy', 'En Cronograma')}
            value={summary.healthy}
            icon={CheckCircle2}
            iconColor="text-emerald-600 dark:text-emerald-400"
            badge={summary.total > 0 ? `${Math.round((summary.healthy / summary.total) * 100)}%` : '0%'}
            badgeClass="bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 midnight:bg-emerald-950/40 midnight:text-emerald-300 border border-emerald-500/20"
            onClick={() => setHealthFilter(healthFilter === HEALTH_LEVELS.HEALTHY ? 'ALL' : HEALTH_LEVELS.HEALTHY)}
            isSelected={healthFilter === HEALTH_LEVELS.HEALTHY}
            ariaLabel={t('portfolio.filterHealthyAria', 'Filtrar proyectos en cronograma')}
          />

          <KpiCard
            title={t('portfolio.kpiWarning', 'En Advertencia')}
            value={summary.warning}
            icon={AlertTriangle}
            iconColor="text-amber-600 dark:text-amber-400"
            badge={summary.total > 0 ? `${Math.round((summary.warning / summary.total) * 100)}%` : '0%'}
            badgeClass="bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 midnight:bg-amber-950/40 midnight:text-amber-300 border border-amber-500/20"
            onClick={() => setHealthFilter(healthFilter === HEALTH_LEVELS.WARNING ? 'ALL' : HEALTH_LEVELS.WARNING)}
            isSelected={healthFilter === HEALTH_LEVELS.WARNING}
            ariaLabel={t('portfolio.filterWarningAria', 'Filtrar proyectos en advertencia')}
          />

          <KpiCard
            title={t('portfolio.kpiCritical', 'Crítico / Desviado')}
            value={summary.critical}
            icon={AlertOctagon}
            iconColor="text-rose-600 dark:text-rose-400"
            badge={summary.total > 0 ? `${Math.round((summary.critical / summary.total) * 100)}%` : '0%'}
            badgeClass="bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400 midnight:bg-rose-950/40 midnight:text-rose-300 border border-rose-500/20"
            onClick={() => setHealthFilter(healthFilter === HEALTH_LEVELS.CRITICAL ? 'ALL' : HEALTH_LEVELS.CRITICAL)}
            isSelected={healthFilter === HEALTH_LEVELS.CRITICAL}
            ariaLabel={t('portfolio.filterCriticalAria', 'Filtrar proyectos críticos')}
          />

          <KpiCard
            title={t('portfolio.kpiStale', 'Inactivo / Estancado')}
            value={summary.stale}
            icon={Clock}
            iconColor="text-slate-500 dark:text-slate-400"
            badge={summary.total > 0 ? `${Math.round((summary.stale / summary.total) * 100)}%` : '0%'}
            badgeClass="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 midnight:bg-slate-900/60 midnight:text-slate-400 border border-slate-700/30"
            onClick={() => setHealthFilter(healthFilter === HEALTH_LEVELS.STALE ? 'ALL' : HEALTH_LEVELS.STALE)}
            isSelected={healthFilter === HEALTH_LEVELS.STALE}
            ariaLabel={t('portfolio.filterStaleAria', 'Filtrar proyectos inactivos o estancados')}
          />
        </div>

        {error && (
          <InlineAlert variant="error" className="w-full">
            {error}
          </InlineAlert>
        )}

        {/* Tabla Analítica de Proyectos */}
        <div className="rounded-xl border border-slate-200 dark:border-[#30363d] midnight:border-cyan-900/30 overflow-hidden bg-white dark:bg-[#161b22] midnight:bg-[#0a1120]">
          {loading && !auditData ? (
            <div className="flex flex-col items-center justify-center p-12 text-slate-500">
              <RefreshCw size={26} className="animate-spin text-cyan-600 mb-3" />
              <p className="text-xs font-medium">{t('portfolio.evaluatingAudit', 'Evaluando salud de cronogramas y ruta crítica...')}</p>
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="p-8">
              <EmptyState
                icon={onlyMyProjects ? UserCheck : FileSpreadsheet}
                title={onlyMyProjects ? t('portfolio.noMyProjectsTitle', 'Sin proyectos asignados') : t('portfolio.noAuditProjectsTitle', 'Sin proyectos en este segmento')}
                description={onlyMyProjects ? t('portfolio.noMyProjectsMsg', 'No tienes proyectos bajo tu liderazgo que coincidan con los filtros seleccionados.') : t('portfolio.noAuditProjectsDesc', 'No hay registros que coincidan con el filtro de salud seleccionado.')}
                action={
                  onlyMyProjects ? (
                    <div className="flex flex-wrap items-center justify-center gap-2.5">
                      {(onCreateProject || onNavigate) && (
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            if (onCreateProject) {
                              onCreateProject();
                            } else if (onNavigate) {
                              onNavigate('portfolio');
                            }
                          }}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-cyan-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-cyan-500 transition-colors"
                        >
                          <FolderPlus size={14} />
                          {t('portfolio.goToPortfolioToCreate', 'Ir al Portafolio para crear proyecto')}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setOnlyMyProjects(false);
                          setHealthFilter('ALL');
                        }}
                        className="rounded-lg border border-slate-300 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-[#30363d] dark:bg-[#161b22] dark:text-slate-300 dark:hover:bg-[#21262d] transition-colors"
                      >
                        {t('portfolio.viewAllProjects', 'Ver todos los proyectos')}
                      </button>
                    </div>
                  ) : healthFilter !== 'ALL' ? (
                    <button
                      type="button"
                      onClick={() => {
                        setOnlyMyProjects(false);
                        setHealthFilter('ALL');
                      }}
                      className="rounded-lg bg-cyan-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-cyan-500 transition-colors"
                    >
                      {t('portfolio.viewAllProjects', 'Ver todos los proyectos')}
                    </button>
                  ) : (onCreateProject || onNavigate) ? (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        if (onCreateProject) {
                          onCreateProject();
                        } else if (onNavigate) {
                          onNavigate('portfolio');
                        }
                      }}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-cyan-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-cyan-500 transition-colors"
                    >
                      <FolderPlus size={14} />
                      {t('portfolio.goToPortfolioToCreate', 'Ir al Portafolio para crear proyecto')}
                    </button>
                  ) : undefined
                }
              />
            </div>
          ) : (
            <Table>
              <TableHead columns={columns} />
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 midnight:divide-cyan-900/20">
                {filteredProjects.map((p) => {
                  const actual = Math.min(100, Math.max(0, p.progress ?? 0));
                  const expected = Math.min(100, Math.max(0, p.expected_progress ?? p.expectedProgress ?? 0));
                  const isBehind = actual < expected;
                  const overdueCPM = p.overdue_critical_tasks ?? p.overdueCriticalTasks ?? 0;

                  const statusReasonsList = Array.isArray(p.status_reasons)
                    ? p.status_reasons
                    : p.status_change_reason
                    ? [{ reason: p.status_change_reason, date: p.updatedAt || '', author: p.updatedBy || '' }]
                    : [];

                  return (
                    <TableRow key={p.id || p.code} className="align-top">
                      {/* Código, Nombre y Estado */}
                      <td className="py-3 px-3">
                        <div className="flex flex-col">
                          <span className="font-mono text-[11px] font-bold text-cyan-600 dark:text-cyan-400">
                            {p.code || 'PRJ-N/A'}
                          </span>
                          <span className="font-medium text-xs text-slate-900 dark:text-white midnight:text-cyan-50 line-clamp-1">
                            {p.name}
                          </span>
                          <span className="mt-1 text-[10px] text-slate-500 dark:text-slate-400">
                            {t('portfolio.area', 'Área')}: {p.area || 'General'} ·{' '}
                            <span className="capitalize">{t(`statuses.${p.status}`, p.status)}</span>
                          </span>
                        </div>
                      </td>

                      {/* Salud Operativa */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        {getHealthBadge(p.health)}
                      </td>

                      {/* Avance Real vs Esperado */}
                      <td className="py-3 px-3">
                        <div className="flex flex-col gap-1.5 min-w-[140px]">
                          <div className="flex items-center justify-between text-[11px] font-medium">
                            <span className="text-slate-700 dark:text-slate-300 midnight:text-cyan-100">
                              {t('portfolio.actual', 'Real')}: <strong className="font-bold">{actual}%</strong>
                            </span>
                            <span className={`text-[10px] ${isBehind ? 'text-amber-600 dark:text-amber-400 font-semibold' : 'text-slate-500 dark:text-slate-400'}`}>
                              {t('portfolio.expected', 'Esperado')}: {expected}%
                            </span>
                          </div>

                          {/* Barra dual de progreso */}
                          <div className="relative h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700 midnight:bg-slate-800">
                            {/* Barra de progreso real */}
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${
                                actual >= expected
                                  ? 'bg-emerald-500'
                                  : actual >= expected * 0.75
                                  ? 'bg-amber-500'
                                  : 'bg-rose-500'
                              }`}
                              style={{ width: `${actual}%` }}
                            />
                            {/* Marcador del esperado si difiere */}
                            {expected > 0 && expected <= 100 && (
                              <div
                                title={`${t('portfolio.expectedProgressTitle', 'Avance esperado')}: ${expected}%`}
                                className="absolute top-0 bottom-0 w-1 bg-cyan-700 dark:bg-cyan-300 shadow-sm"
                                style={{ left: `calc(${expected}% - 2px)` }}
                              />
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Tareas Críticas Vencidas (CPM) */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        {overdueCPM > 0 ? (
                          <span className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-bold text-rose-700 bg-rose-50 border border-rose-300/60 dark:text-rose-400 dark:bg-rose-500/10 dark:border-rose-500/30">
                            <AlertCircle size={13} className="shrink-0" />
                            {overdueCPM} {overdueCPM === 1 ? t('portfolio.overdueSingular', 'crítica') : t('portfolio.overduePlural', 'críticas')}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
                            <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
                            {t('portfolio.cpmOk', 'Al día (0)')}
                          </span>
                        )}
                      </td>

                      {/* Hallazgos & Motivos de Estado */}
                      <td className="py-3 px-3">
                        <div className="flex flex-col gap-1.5 text-[11px]">
                          {/* Hallazgos detectados por la auditoría */}
                          {Array.isArray(p.findings) && p.findings.length > 0 ? (
                            <ul className="space-y-0.5">
                              {p.findings.map((finding, idx) => (
                                <li
                                  key={idx}
                                  className="flex items-start gap-1 text-slate-700 dark:text-slate-300 midnight:text-cyan-100/90 leading-tight"
                                >
                                  <span className="text-amber-500 leading-none mt-0.5">•</span>
                                  <span>{finding}</span>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <span className="text-slate-400 dark:text-slate-500 italic text-[10px]">
                              {t('portfolio.noFindings', 'Sin anomalías de cronograma')}
                            </span>
                          )}

                          {/* Motivo registrado de cambio de estado */}
                          {statusReasonsList.length > 0 && (
                            <div className="mt-1 rounded bg-slate-50 p-1.5 text-[10px] text-slate-600 dark:bg-[#0d1117] dark:text-slate-400 midnight:bg-cyan-950/30 midnight:text-cyan-300/90 border border-slate-200/60 dark:border-slate-800 midnight:border-cyan-900/30">
                              <span className="font-semibold block text-slate-700 dark:text-slate-300">
                                {t('portfolio.statusReasonHeading', 'Justificación registrada')}:
                              </span>
                              {statusReasonsList.slice(0, 2).map((item, i) => (
                                <p key={i} className="line-clamp-2 mt-0.5 italic">
                                  "{typeof item === 'object' ? item.reason : item}"
                                </p>
                              ))}
                            </div>
                          )}
                        </div>
                      </td>
                    </TableRow>
                  );
                })}
              </tbody>
            </Table>
          )}
        </div>

        {/* Pie informativo y botón de cierre */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-200 dark:border-[#30363d] midnight:border-cyan-900/30 text-xs text-slate-500 dark:text-slate-400">
          <span>
            {t('portfolio.auditSummaryCount', 'Mostrando {count} de {total} proyectos evaluados.', {
              count: filteredProjects.length,
              total: allProjects.length,
            })}
          </span>
          <div className="flex items-center gap-2">
            {onNavigate && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onNavigate('portfolio');
                }}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:border-[#30363d] dark:bg-[#161b22] dark:text-slate-300 dark:hover:bg-white/5 midnight:border-cyan-800/40 midnight:bg-[#0a1120] midnight:text-cyan-200"
              >
                {t('portfolio.goToPortfolio', 'Ir al Portafolio')}
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg bg-cyan-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-cyan-500 transition-colors"
            >
              {t('common.close', 'Cerrar')}
            </button>
          </div>
        </div>
      </div>
    </ModalDialog>
  );
}

export { PeriodicProjectAuditModal };
