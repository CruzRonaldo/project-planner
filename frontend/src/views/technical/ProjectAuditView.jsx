import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ClipboardCheck,
  Download,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  AlertOctagon,
  Clock,
  Layers,
  Calendar,
  FileSpreadsheet,
  AlertCircle,
  ArrowRight,
  Search,
  X,
  UserCheck,
  FolderPlus,
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import projectsApi from '../../services/projectsApi';
import { projectStatuses } from '../../constants/portfolio';
import { isUserProject } from '../../utils/portfolio';
import {
  PageHeader,
  FilterTabBar,
  KpiCard,
  InlineAlert,
  Table,
  TableHead,
  TableRow,
  EmptyState,
  ClearFiltersButton,
  StatusBadge,
  Button,
  Pagination,
  SortDropdown,
} from '../../components/common';

export const HEALTH_LEVELS = Object.freeze({
  HEALTHY: 'HEALTHY',
  WARNING: 'WARNING',
  CRITICAL: 'CRITICAL',
  STALE: 'STALE',
});

export const PERIOD_OPTIONS = Object.freeze([
  { id: 'monthly', labelKey: 'portfolio.periodMonthly', defaultLabel: 'Mensual (30 días)', days: 30 },
  { id: 'quarterly', labelKey: 'portfolio.periodQuarterly', defaultLabel: 'Trimestral (90 días)', days: 90 },
  { id: 'semiannual', labelKey: 'portfolio.periodSemiannual', defaultLabel: 'Semestral (180 días)', days: 180 },
]);

export const auditSortCategories = Object.freeze([
  {
    id: 'budget',
    defaultId: 'budget_desc',
    defaultLabel: 'Mayor presupuesto',
    descId: 'budget_desc',
    ascId: 'budget_asc',
    descLabel: 'Mayor presupuesto',
    ascLabel: 'Menor presupuesto',
  },
  {
    id: 'name',
    defaultId: 'name_asc',
    defaultLabel: 'Nombre (A-Z)',
    descId: 'name_desc',
    ascId: 'name_asc',
    descLabel: 'Nombre (Z-A)',
    ascLabel: 'Nombre (A-Z)',
  },
  {
    id: 'progress',
    defaultId: 'progress_desc',
    defaultLabel: 'Mayor avance',
    descId: 'progress_desc',
    ascId: 'progress_asc',
    descLabel: 'Mayor avance',
    ascLabel: 'Menor avance',
  },
  {
    id: 'gap',
    defaultId: 'gap_desc',
    defaultLabel: 'Mayor desfase',
    descId: 'gap_desc',
    ascId: 'gap_asc',
    descLabel: 'Mayor desfase',
    ascLabel: 'Menor desfase',
  },
  {
    id: 'cpm',
    defaultId: 'cpm_desc',
    defaultLabel: 'Más tareas CPM vencidas',
    descId: 'cpm_desc',
    ascId: 'cpm_asc',
    descLabel: 'Más tareas CPM vencidas',
    ascLabel: 'Menos tareas CPM vencidas',
  },
]);

/**
 * Ordena la lista de proyectos auditados según el criterio seleccionado.
 * @param {Array} projects - Proyectos a ordenar
 * @param {string} sortOrder - Identificador de criterio de ordenamiento
 * @returns {Array} Nueva lista ordenada de proyectos
 */
export function sortAuditProjects(projects = [], sortOrder = 'budget_desc') {
  if (!Array.isArray(projects) || projects.length === 0) return [];
  const copy = [...projects];

  const getProgress = (p) => Number(p.actual_progress ?? p.progress ?? 0);
  const getExpected = (p) => Number(p.expected_progress ?? p.expectedProgress ?? 0);
  const getGap = (p) => Math.max(0, getExpected(p) - getProgress(p));
  const getCPM = (p) => Number(p.overdue_critical_count ?? p.overdue_critical_tasks ?? p.overdueCriticalTasks ?? 0);
  const getBudget = (p) => Number(p.budget ?? p.totalBudget ?? 0);
  const getName = (p) => String(p.name || '').toLowerCase();

  switch (sortOrder) {
    case 'budget_desc':
      return copy.sort((a, b) => getBudget(b) - getBudget(a));
    case 'budget_asc':
      return copy.sort((a, b) => getBudget(a) - getBudget(b));
    case 'name_asc':
      return copy.sort((a, b) => getName(a).localeCompare(getName(b)));
    case 'name_desc':
      return copy.sort((a, b) => getName(b).localeCompare(getName(a)));
    case 'progress_desc':
      return copy.sort((a, b) => getProgress(b) - getProgress(a));
    case 'progress_asc':
      return copy.sort((a, b) => getProgress(a) - getProgress(b));
    case 'gap_desc':
      return copy.sort((a, b) => getGap(b) - getGap(a));
    case 'gap_asc':
      return copy.sort((a, b) => getGap(a) - getGap(b));
    case 'cpm_desc':
      return copy.sort((a, b) => getCPM(b) - getCPM(a));
    case 'cpm_asc':
      return copy.sort((a, b) => getCPM(a) - getCPM(b));
    default:
      return copy;
  }
}

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
      escapeCsv(p.actual_progress ?? p.progress ?? 0),
      escapeCsv(p.expected_progress ?? p.expectedProgress ?? 0),
      escapeCsv(p.overdue_critical_count ?? p.overdue_critical_tasks ?? p.overdueCriticalTasks ?? 0),
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
 * Vista Dedicada de Auditoría Periódica de Proyectos (Pantalla Completa).
 */
export default function ProjectAuditView({
  onNavigate,
  canManage = false,
  isAdmin = false,
  currentUser = null,
  query = '',
  onQueryChange,
}) {
  const { t } = useLanguage();
  const [period, setPeriod] = useState('monthly');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [auditData, setAuditData] = useState(null);
  const [healthFilter, setHealthFilter] = useState('ALL');
  const [onlyMyProjects, setOnlyMyProjects] = useState(false);
  const [localSearch, setLocalSearch] = useState('');
  const [sortOrder, setSortOrder] = useState('budget_desc');
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 5;

  const searchQuery = query !== undefined && onQueryChange ? query : localSearch;
  const handleSearchChange = onQueryChange || setLocalSearch;

  // Al cambiar ciclo temporal, filtros o criterio de orden, reiniciar a la primera página
  useEffect(() => {
    setCurrentPage(1);
  }, [period, healthFilter, searchQuery, sortOrder, onlyMyProjects]);

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
    fetchAudit(period);
  }, [period, fetchAudit]);

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
    // Si se activa "Mis proyectos", recalcular métricas en tiempo real para sus obras
    const res = { healthy: 0, warning: 0, critical: 0, stale: 0, total: scopedProjects.length };
    scopedProjects.forEach((p) => {
      const h = String(p.health || '').toLowerCase();
      if (h in res) res[h] += 1;
    });
    return res;
  }, [auditData, onlyMyProjects, scopedProjects]);

  const filteredProjects = useMemo(() => {
    return scopedProjects.filter((p) => {
      const health = String(p.health || '').toUpperCase();
      if (healthFilter === 'CRITICAL_STALE') {
        if (health !== HEALTH_LEVELS.CRITICAL && health !== HEALTH_LEVELS.STALE) {
          return false;
        }
      } else if (healthFilter !== 'ALL') {
        if (health !== healthFilter) {
          return false;
        }
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const codeMatch = (p.code || '').toLowerCase().includes(q);
        const nameMatch = (p.name || '').toLowerCase().includes(q);
        const areaMatch = (p.area || '').toLowerCase().includes(q);
        const findingsMatch = Array.isArray(p.findings)
          ? p.findings.some((f) => String(f).toLowerCase().includes(q))
          : String(p.findings || '').toLowerCase().includes(q);

        if (!codeMatch && !nameMatch && !areaMatch && !findingsMatch) {
          return false;
        }
      }

      return true;
    });
  }, [scopedProjects, healthFilter, searchQuery]);

  const sortedProjects = useMemo(() => {
    return sortAuditProjects(filteredProjects, sortOrder);
  }, [filteredProjects, sortOrder]);

  const handleExport = () => {
    exportAuditToCsv(sortedProjects, period, t);
  };

  const periodTabs = useMemo(() => [
    { id: 'monthly', label: t('portfolio.periodMonthly', 'Mensual (30 días)') },
    { id: 'quarterly', label: t('portfolio.periodQuarterly', 'Trimestral (90 días)') },
    { id: 'semiannual', label: t('portfolio.periodSemiannual', 'Semestral (180 días)') },
  ], [t]);

  const periodLabel = useMemo(() => {
    const opt = PERIOD_OPTIONS.find((p) => p.id === period);
    return opt ? t(opt.labelKey, opt.defaultLabel) : period;
  }, [period, t]);

  const healthStatusMap = useMemo(() => ({
    [HEALTH_LEVELS.HEALTHY]: {
      label: t('portfolio.healthHealthy', 'En Cronograma'),
      className: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400 midnight:border-emerald-800/40 midnight:bg-emerald-950/40 midnight:text-emerald-300',
    },
    [HEALTH_LEVELS.WARNING]: {
      label: t('portfolio.healthWarning', 'En Advertencia'),
      className: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-400 midnight:border-amber-800/40 midnight:bg-amber-950/40 midnight:text-amber-300',
    },
    [HEALTH_LEVELS.CRITICAL]: {
      label: t('portfolio.healthCritical', 'Crítico / Desviado'),
      className: 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-400 midnight:border-rose-800/40 midnight:bg-rose-950/40 midnight:text-rose-300',
    },
    [HEALTH_LEVELS.STALE]: {
      label: t('portfolio.healthStale', 'Inactivo / Estancado'),
      className: 'border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 midnight:border-slate-800 midnight:bg-slate-900/60 midnight:text-slate-300',
    },
  }), [t]);

  const columns = [
    { label: t('portfolio.colProject', 'Proyecto'), className: 'w-[22%] text-slate-800 dark:text-slate-100 midnight:text-cyan-50 font-bold' },
    { label: t('portfolio.csvStatus', 'Estado'), className: 'w-[10%] text-slate-800 dark:text-slate-100 midnight:text-cyan-50 font-bold' },
    { label: t('portfolio.colHealth', 'Salud Operativa'), className: 'w-[14%] text-slate-800 dark:text-slate-100 midnight:text-cyan-50 font-bold' },
    { label: t('portfolio.colProgress', 'Avance Real vs Esperado'), className: 'w-[18%] text-slate-800 dark:text-slate-100 midnight:text-cyan-50 font-bold' },
    { label: t('portfolio.colCPM', 'CPM Vencidas'), className: 'w-[12%] text-slate-800 dark:text-slate-100 midnight:text-cyan-50 font-bold' },
    { label: t('portfolio.colFindings', 'Hallazgos & Bitácora'), className: 'w-[16%] text-slate-800 dark:text-slate-100 midnight:text-cyan-50 font-bold' },
    { label: t('common.actions', 'Acciones'), className: 'w-[8%] text-right text-slate-800 dark:text-slate-100 midnight:text-cyan-50 font-bold', align: 'right' },
  ];

  const totalPages = Math.max(1, Math.ceil(sortedProjects.length / PAGE_SIZE));
  const paginatedProjects = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return sortedProjects.slice(start, start + PAGE_SIZE);
  }, [sortedProjects, currentPage]);

  const hasActiveFilters = healthFilter !== 'ALL' || Boolean(searchQuery.trim()) || sortOrder !== 'budget_desc' || onlyMyProjects;

  return (
    <main className="flex-1 overflow-y-auto bg-slate-50 p-4 text-slate-900 transition-colors duration-300 dark:bg-[#0d1117] dark:text-slate-100 midnight:bg-[#050B14] midnight:text-cyan-50 md:p-6 lg:p-8">
      <div className="flex w-full flex-col gap-6 pb-8">
        
        {/* ENCABEZADO DE PÁGINA */}
        <PageHeader
          title={t('portfolio.auditModalTitle', 'Auditoría Periódica de Proyectos')}
          subtitle={t('portfolio.auditModalSubtitle', 'Análisis de salud de cronogramas, ruta crítica (CPM) y justificación de desvíos')}
        >
          <div className="flex items-center gap-2.5">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => fetchAudit(period)}
              isLoading={loading}
              icon={RefreshCw}
              title={t('portfolio.refreshAudit', 'Actualizar auditoría')}
            >
              <span className="hidden sm:inline">{t('common.refresh', 'Actualizar')}</span>
            </Button>

            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handleExport}
              disabled={loading || allProjects.length === 0}
              icon={Download}
              title={t('portfolio.exportAuditCsvTooltip', 'Exportar bitácora a formato CSV')}
            >
              <span>{t('portfolio.exportAuditCsv', 'Exportar a CSV')}</span>
            </Button>
          </div>
        </PageHeader>

        {/* SELECTOR DE CICLO Y BARRA DE FILTROS */}
        <section aria-label={t('audit.periodSelectorAria', 'Selector de ciclo de auditoría')} className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-xl border border-slate-200 dark:border-[#30363d] midnight:border-cyan-900/30 bg-white dark:bg-[#161b22] midnight:bg-[#0a1120]">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 midnight:text-cyan-600 mr-1 hidden md:inline">
              <Calendar size={14} className="inline mr-1" />
              {t('audit.periodSelectorAria', 'Ciclo de auditoría')}:
            </span>
            <FilterTabBar
              tabs={periodTabs}
              activeTab={period}
              onChange={setPeriod}
              size="md"
              ariaLabel={t('audit.periodSelectorAria', 'Ciclo de auditoría')}
            />

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

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 sm:w-64">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 midnight:text-cyan-600" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder={t('audit.searchPlaceholder', 'Buscar por código, nombre, área o hallazgo...')}
                aria-label={t('audit.searchPlaceholder', 'Buscar por código, nombre, área o hallazgo...')}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 pl-8 pr-7 py-1.5 text-xs text-slate-900 placeholder-slate-400 outline-none transition-colors focus:border-cyan-500 focus:bg-white dark:border-[#30363d] dark:bg-[#0d1117] dark:text-white dark:placeholder-slate-500 dark:focus:border-cyan-400 midnight:border-cyan-900/40 midnight:bg-[#050b14] midnight:text-cyan-50 midnight:placeholder-cyan-700/60"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => handleSearchChange('')}
                  aria-label={t('common.clear', 'Limpiar')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
                >
                  <X size={12} />
                </button>
              )}
            </div>

            <SortDropdown
              value={sortOrder}
              onChange={(nextSort) => {
                setSortOrder(nextSort);
                setCurrentPage(1);
              }}
              categories={auditSortCategories}
              label={t('common.sortBy', 'Ordenar por:')}
              buttonClassName="w-[200px]"
              ariaLabel={t('audit.sortLabel', 'Ordenar proyectos auditados')}
            />

            {hasActiveFilters && (
              <ClearFiltersButton
                onClick={() => {
                  setHealthFilter('ALL');
                  handleSearchChange('');
                  setSortOrder('budget_desc');
                }}
                label={t('audit.clearFilters', 'Restablecer')}
                showIcon
              />
            )}
          </div>
        </section>

        {/* TARJETAS INTERACTIVAS DE SALUD OPERATIVA (KPIs) */}
        <section aria-label={t('audit.healthStatus', 'Nivel de Salud')} className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          <KpiCard
            title={t('audit.kpiTotal', 'Total Auditados')}
            value={summary.total}
            icon={ClipboardCheck}
            iconColor="text-cyan-600 dark:text-cyan-400 midnight:text-cyan-300"
            badge={`${summary.total}`}
            badgeClass="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 midnight:bg-slate-900/60 midnight:text-slate-400 border border-slate-700/30"
            onClick={() => setHealthFilter('ALL')}
            isSelected={healthFilter === 'ALL'}
            ariaLabel={t('audit.filterAllAria', 'Ver todos los proyectos auditados')}
          />

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
            title={t('audit.kpiCriticalStale', 'Críticos / Estancados')}
            value={summary.critical + summary.stale}
            icon={AlertOctagon}
            iconColor="text-rose-600 dark:text-rose-400"
            badge={summary.total > 0 ? `${Math.round(((summary.critical + summary.stale) / summary.total) * 100)}%` : '0%'}
            badgeClass="bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400 midnight:bg-rose-950/40 midnight:text-rose-300 border border-rose-500/20"
            onClick={() => setHealthFilter(healthFilter === 'CRITICAL_STALE' ? 'ALL' : 'CRITICAL_STALE')}
            isSelected={healthFilter === 'CRITICAL_STALE' || healthFilter === HEALTH_LEVELS.CRITICAL || healthFilter === HEALTH_LEVELS.STALE}
            ariaLabel={t('audit.filterCriticalStaleAria', 'Filtrar proyectos críticos o estancados')}
          />
        </section>

        {/* ALERTA INLINE ANTE PROYECTOS CRÍTICOS O ESTANCADOS */}
        {(summary.critical > 0 || summary.stale > 0) && (
          <InlineAlert
            variant="warning"
            showIcon
            title={t('audit.alertCriticalTitle', 'Atención requerida en proyectos desviados')}
          >
            {t(
              'audit.alertCriticalDesc',
              'Se detectaron {critical} proyectos en estado crítico y {stale} proyectos inactivos o estancados en el período {period}. Se recomienda auditar la ruta crítica (CPM) y registrar las justificaciones correspondientes.',
              {
                critical: summary.critical,
                stale: summary.stale,
                period: periodLabel,
              }
            )}
          </InlineAlert>
        )}

        {/* ALERTA DE ERROR SI FALLA LA PETICIÓN */}
        {error && (
          <InlineAlert variant="error" showIcon title={t('common.error', 'Error')}>
            {error}
          </InlineAlert>
        )}

        {/* TABLA PRINCIPAL DE AUDITORÍA */}
        <section className="rounded-xl border border-slate-200 dark:border-[#30363d] midnight:border-cyan-900/30 overflow-hidden bg-white dark:bg-[#161b22] midnight:bg-[#0a1120] shadow-sm">
          {loading && !auditData ? (
            <div className="flex flex-col items-center justify-center p-14 text-slate-500">
              <RefreshCw size={28} className="animate-spin text-cyan-600 mb-3" />
              <p className="text-xs font-medium">{t('audit.evaluating', 'Evaluando salud de cronogramas y ruta crítica...')}</p>
            </div>
          ) : sortedProjects.length === 0 ? (
            <div className="p-10">
              <EmptyState
                icon={onlyMyProjects ? UserCheck : FileSpreadsheet}
                title={onlyMyProjects ? t('portfolio.noMyProjectsTitle', 'Sin proyectos asignados') : t('audit.noProjectsTitle', 'Sin proyectos en este segmento')}
                description={onlyMyProjects ? t('portfolio.noMyProjectsMsg', 'No tienes proyectos bajo tu liderazgo que coincidan con los filtros seleccionados.') : t('audit.noProjectsDesc', 'No hay registros que coincidan con los filtros de salud o búsqueda aplicados.')}
                action={
                  onlyMyProjects ? (
                    <div className="flex flex-wrap items-center justify-center gap-2.5">
                      {onNavigate && (
                        <button
                          type="button"
                          onClick={() => onNavigate('portfolio')}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-cyan-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-cyan-500 transition-colors"
                        >
                          <FolderPlus size={14} />
                          {t('portfolio.goToPortfolioToCreate', 'Ir al Portafolio para crear proyecto')}
                        </button>
                      )}
                      <ClearFiltersButton
                        onClick={() => {
                          setHealthFilter('ALL');
                          setOnlyMyProjects(false);
                          handleSearchChange('');
                          setSortOrder('budget_desc');
                        }}
                        label={t('portfolio.viewAllProjects', 'Ver todos los proyectos')}
                      />
                    </div>
                  ) : hasActiveFilters ? (
                    <ClearFiltersButton
                      onClick={() => {
                        setHealthFilter('ALL');
                        setOnlyMyProjects(false);
                        handleSearchChange('');
                        setSortOrder('budget_desc');
                      }}
                      label={t('audit.clearFilters', 'Restablecer filtros')}
                      showIcon
                    />
                  ) : onNavigate ? (
                    <button
                      type="button"
                      onClick={() => onNavigate('portfolio')}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-cyan-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-cyan-500 transition-colors"
                    >
                      <FolderPlus size={14} />
                      {t('portfolio.goToPortfolioToCreate', 'Ir al Portafolio para crear proyecto')}
                    </button>
                  ) : null
                }
              />
            </div>
          ) : (
            <Table>
              <TableHead columns={columns} />
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 midnight:divide-cyan-900/20">
                {paginatedProjects.map((p) => {
                  const actual = Math.min(100, Math.max(0, p.actual_progress ?? p.progress ?? 0));
                  const expected = Math.min(100, Math.max(0, p.expected_progress ?? p.expectedProgress ?? 0));
                  const isBehind = actual < expected;
                  const overdueCPM = p.overdue_critical_count ?? p.overdue_critical_tasks ?? p.overdueCriticalTasks ?? 0;
                  const normalizedHealth = String(p.health || '').toUpperCase();

                  const statusReasonsList = Array.isArray(p.status_reasons)
                    ? p.status_reasons
                    : p.status_change_reason
                    ? [{ reason: p.status_change_reason, date: p.updatedAt || '', author: p.updatedBy || '' }]
                    : [];

                  return (
                    <TableRow key={p.id || p.code} className="align-top">
                      {/* CÓDIGO, NOMBRE Y ÁREA */}
                      <td className="py-3.5 px-3">
                        <div className="flex flex-col">
                          <span className="font-mono text-[11px] font-bold text-cyan-600 dark:text-cyan-400">
                            {p.code || 'PRJ-N/A'}
                          </span>
                          <span className="font-medium text-xs text-slate-900 dark:text-white midnight:text-cyan-50 line-clamp-1">
                            {p.name}
                          </span>
                          <span className="mt-1 text-[10px] text-slate-500 dark:text-slate-400">
                            {t('portfolio.area', 'Área')}: {p.area || 'General'}
                          </span>
                        </div>
                      </td>

                      {/* ESTADO DEL PROYECTO */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <StatusBadge
                          status={p.status}
                          label={t(`statuses.${p.status}`, p.status)}
                          items={projectStatuses}
                          size="sm"
                        />
                      </td>

                      {/* NIVEL DE SALUD */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <StatusBadge
                          status={normalizedHealth}
                          statusMap={healthStatusMap}
                          size="sm"
                        />
                      </td>

                      {/* AVANCE REAL VS ESPERADO */}
                      <td className="py-3.5 px-3">
                        <div className="flex flex-col gap-1.5 min-w-[140px]">
                          <div className="flex items-center justify-between text-[11px] font-medium">
                            <span className="text-slate-700 dark:text-slate-300 midnight:text-cyan-100">
                              {t('portfolio.actual', 'Real')}: <strong className="font-bold">{actual}%</strong>
                            </span>
                            <span className={`text-[10px] ${isBehind ? 'text-amber-600 dark:text-amber-400 font-semibold' : 'text-slate-500 dark:text-slate-400'}`}>
                              {t('portfolio.expected', 'Esperado')}: {expected}%
                            </span>
                          </div>

                          {/* BARRA DUAL DE PROGRESO */}
                          <div className="relative h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700 midnight:bg-slate-800">
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
                            {expected > 0 && expected <= 100 && (
                              <div
                                title={t('audit.expectedProgressTitle', 'Avance esperado: {percent}%', { percent: expected })}
                                className="absolute top-0 bottom-0 w-1 bg-cyan-700 dark:bg-cyan-300 shadow-sm"
                                style={{ left: `calc(${expected}% - 2px)` }}
                              />
                            )}
                          </div>
                        </div>
                      </td>

                      {/* TAREAS CRÍTICAS VENCIDAS (CPM) */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
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

                      {/* HALLAZGOS & BITÁCORA */}
                      <td className="py-3.5 px-3">
                        <div className="flex flex-col gap-1.5 text-[11px]">
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

                      {/* ACCIONES: IR AL PORTAFOLIO */}
                      <td className="py-3.5 px-3 text-right whitespace-nowrap">
                        {onNavigate && (
                          <button
                            type="button"
                            onClick={() => onNavigate('portfolio', { projectId: p.id, projectCode: p.code })}
                            title={t('portfolio.goToPortfolio', 'Ir al Portafolio')}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900 dark:border-[#30363d] dark:bg-[#161b22] dark:text-slate-300 dark:hover:bg-white/5 dark:hover:text-white midnight:border-cyan-800/40 midnight:bg-[#0a1120] midnight:text-cyan-200 midnight:hover:bg-cyan-900/40 transition-colors shadow-xs"
                          >
                            <span className="hidden md:inline">{t('portfolio.goToPortfolio', 'Ir al Portafolio')}</span>
                            <ArrowRight size={13} className="shrink-0 text-cyan-600 dark:text-cyan-400" />
                          </button>
                        )}
                      </td>
                    </TableRow>
                  );
                })}
              </tbody>
            </Table>
          )}

          {/* PIE DE PÁGINA CON PAGINACIÓN ACCESIBLE Y METADATOS */}
          {sortedProjects.length > 0 && (
            <footer className="border-t border-slate-200 dark:border-[#30363d] midnight:border-cyan-900/30 bg-slate-50/60 dark:bg-white/[0.02] midnight:bg-[#070e1c] px-4 py-3 sm:px-6">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={sortedProjects.length}
                pageSize={PAGE_SIZE}
                itemLabel={t('portfolio.projectsCountLabel', 'proyectos')}
                onPageChange={setCurrentPage}
                hideOnSinglePage={false}
                className="w-full"
              />
            </footer>
          )}
        </section>
      </div>
    </main>
  );
}

export { ProjectAuditView };
