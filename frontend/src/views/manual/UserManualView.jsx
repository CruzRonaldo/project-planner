import React, { useState, useMemo, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  BookOpen,
  Search,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Printer,
  Maximize2,
  X,
  ShieldAlert,
  Info,
  CheckCircle2,
  Sparkles,
  Command,
  Menu,
} from 'lucide-react';
import { getManualSections, getSectionById } from './manualSections';
import { usePlatform } from '../../hooks/usePlatform';
import { useLanguage } from '../../context/LanguageContext';

export default function UserManualView({
  onNavigate,
  isAdmin = false,
  initialQuery = '',
}) {
  const { lang, t } = useLanguage();
  const [selectedSectionId, setSelectedSectionId] = useState('intro');
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [roleFilter, setRoleFilter] = useState('all'); // 'all' | 'admin' | 'user'
  const [zoomedImage, setZoomedImage] = useState(null);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const contentContainerRef = useRef(null);
  const searchInputRef = useRef(null);
  const { isMac, isMobile, formatShortcut } = usePlatform();

  const localizedSections = useMemo(() => getManualSections(lang, t), [lang, t]);

  // Si cambia la búsqueda desde el Topbar global
  useEffect(() => {
    if (initialQuery !== undefined) {
      setSearchQuery(initialQuery);
    }
  }, [initialQuery]);

  // Filtrado de capítulos por texto y por rol con RBAC estricto
  const filteredSections = useMemo(() => {
    return localizedSections.filter((section) => {
      // Bloqueo RBAC: si el usuario no es admin, jamás ve capítulos exclusivos de admin
      if (!isAdmin && section.roleRequired === 'admin') return false;

      // Filtro de rol en UI
      if (roleFilter === 'admin' && section.roleRequired !== 'admin') return false;
      if (roleFilter === 'user' && section.roleRequired === 'admin') return false;

      // Filtro de búsqueda
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const inTitle = section.title.toLowerCase().includes(q);
      const inShort = section.shortTitle.toLowerCase().includes(q);
      const inSummary = section.summary.toLowerCase().includes(q);
      const inContent = (section.content || '').toLowerCase().includes(q);
      return inTitle || inShort || inSummary || inContent;
    });
  }, [localizedSections, searchQuery, roleFilter, isAdmin]);

  // Si un usuario no admin tenía el filtro 'admin', forzar a 'all'
  useEffect(() => {
    if (!isAdmin && roleFilter === 'admin') {
      setRoleFilter('all');
    }
  }, [isAdmin, roleFilter]);

  // Resolución de sección activa protegida contra accesos directos no autorizados
  const currentSection = useMemo(() => {
    const sec = getSectionById(selectedSectionId, lang, t);
    if (!isAdmin && sec.roleRequired === 'admin') {
      return localizedSections[0]; // Redirección forzosa al índice general
    }
    return sec;
  }, [selectedSectionId, isAdmin, lang, t, localizedSections]);

  // Navegación secuencial acotada estrictamente a los capítulos autorizados para el rol
  const currentIndex = useMemo(() => {
    return filteredSections.findIndex((s) => s.id === currentSection.id);
  }, [filteredSections, currentSection]);

  const prevSection = useMemo(() => {
    return currentIndex > 0 ? filteredSections[currentIndex - 1] : null;
  }, [filteredSections, currentIndex]);

  const nextSection = useMemo(() => {
    return currentIndex >= 0 && currentIndex < filteredSections.length - 1
      ? filteredSections[currentIndex + 1]
      : null;
  }, [filteredSections, currentIndex]);

  // Atajos de teclado internos:
  // - Flecha Izquierda / Derecha: Anterior / Siguiente capítulo (cuando no se está en un input)
  // - Escape: Cerrar Lightbox de imagen o cerrar Drawer móvil
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (zoomedImage && event.key === 'Escape') {
        setZoomedImage(null);
        return;
      }

      if (isMobileDrawerOpen && event.key === 'Escape') {
        setIsMobileDrawerOpen(false);
        return;
      }

      const tagName = event.target?.tagName;
      const isInput = tagName === 'INPUT' || tagName === 'TEXTAREA';
      if (isInput) return;

      if (event.key === 'ArrowLeft' && prevSection) {
        event.preventDefault();
        setSelectedSectionId(prevSection.id);
        setIsMobileDrawerOpen(false);
        contentContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
      } else if (event.key === 'ArrowRight' && nextSection) {
        event.preventDefault();
        setSelectedSectionId(nextSection.id);
        setIsMobileDrawerOpen(false);
        contentContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [zoomedImage, isMobileDrawerOpen, prevSection, nextSection]);

  // Desplazar al inicio al cambiar de capítulo con guardia RBAC
  const handleSelectSection = (id) => {
    const target = getSectionById(id, lang, t);
    if (!isAdmin && target.roleRequired === 'admin') {
      return;
    }
    setSelectedSectionId(id);
    setIsMobileDrawerOpen(false);
    contentContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="relative flex flex-1 min-w-0 h-[calc(100vh-60px)] overflow-hidden bg-slate-50 dark:bg-[#0d1117] midnight:bg-[#050B14] transition-colors">
      
      {/* OVERLAY PARA MÓVIL (Índice de Capítulos Off-canvas) */}
      {isMobileDrawerOpen && (
        <div
          role="presentation"
          onClick={() => setIsMobileDrawerOpen(false)}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300 animate-in fade-in lg:hidden"
        />
      )}

      {/* ============================================================ */}
      {/* BARRA LATERAL DEL MANUAL (Índice de Capítulos y Filtros) */}
      {/* ============================================================ */}
      <aside
        id="manual-sidebar"
        aria-label={t('manual.sidebarAria', 'Índice de capítulos del manual')}
        className={`fixed inset-y-0 left-0 z-50 lg:static lg:z-auto w-80 max-w-[85vw] shrink-0 border-r border-slate-200 dark:border-[#30363d] midnight:border-cyan-900/40 bg-white dark:bg-[#161b22] midnight:bg-[#080E1C] flex flex-col h-full shadow-2xl lg:shadow-none transition-transform duration-300 ease-in-out print:hidden ${
          isMobileDrawerOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        
        {/* Cabecera del Panel de Documentación */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 midnight:border-cyan-900/30">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
                <BookOpen size={18} />
              </div>
              <div>
                <h1 className="text-sm font-bold text-slate-900 dark:text-slate-100 midnight:text-cyan-50">
                  {t('manual.pageTitle', 'Manual de Usuario')}
                </h1>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 midnight:text-cyan-400/80">
                  {t('manual.systemDocs', 'Documentación del Sistema')}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handlePrint}
                title={t('manual.printChapter', 'Imprimir o Exportar PDF de este capítulo')}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 midnight:text-cyan-400 midnight:hover:bg-cyan-950 transition-colors cursor-pointer"
              >
                <Printer size={16} />
              </button>
              <button
                type="button"
                onClick={() => setIsMobileDrawerOpen(false)}
                aria-label={t('manual.closeIndex', 'Cerrar índice')}
                title={t('manual.closeIndexAria', 'Cerrar índice de capítulos')}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 midnight:text-cyan-400 midnight:hover:bg-cyan-950 transition-colors lg:hidden cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Buscador de capítulos */}
          <div className="relative flex items-center mb-3">
            <Search size={14} className="absolute left-3 text-slate-400 midnight:text-cyan-500" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('manual.searchPlaceholder', 'Buscar contenido o atajos...')}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg bg-slate-100 dark:bg-slate-900 midnight:bg-[#0a1120] border border-slate-200 dark:border-slate-700 midnight:border-cyan-800/40 text-slate-900 dark:text-slate-100 midnight:text-cyan-50 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label={t('manual.clearSearch', 'Limpiar búsqueda')}
                className="absolute right-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* Selector de Rol (Control de Acceso RBAC: Solo administradores visualizan la columna Admin) */}
          {isAdmin ? (
            <div className="flex rounded-lg p-0.5 bg-slate-100 dark:bg-slate-900 midnight:bg-[#0a1120] border border-slate-200 dark:border-slate-800 text-[11px]">
              <button
                type="button"
                onClick={() => setRoleFilter('all')}
                className={`flex-1 py-1 rounded-md font-medium transition-all cursor-pointer ${
                  roleFilter === 'all'
                    ? 'bg-white dark:bg-slate-800 midnight:bg-cyan-950 text-cyan-600 dark:text-cyan-400 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
                }`}
              >
                {t('manual.filterRoleAll', 'Todos los roles')}
              </button>
              <button
                type="button"
                onClick={() => setRoleFilter('user')}
                className={`flex-1 py-1 rounded-md font-medium transition-all cursor-pointer ${
                  roleFilter === 'user'
                    ? 'bg-white dark:bg-slate-800 midnight:bg-cyan-950 text-cyan-600 dark:text-cyan-400 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
                }`}
              >
                {t('manual.filterRoleTechnical', 'Solo Técnico')}
              </button>
              <button
                type="button"
                onClick={() => setRoleFilter('admin')}
                className={`flex-1 py-1 rounded-md font-medium transition-all cursor-pointer ${
                  roleFilter === 'admin'
                    ? 'bg-white dark:bg-slate-800 midnight:bg-cyan-950 text-cyan-600 dark:text-cyan-400 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
                }`}
              >
                {t('manual.filterRoleAdmin', 'Solo Administrador')}
              </button>
            </div>
          ) : (
            <div className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-900 midnight:bg-[#0a1120] border border-slate-200 dark:border-slate-800 text-[11px] flex items-center justify-between text-slate-500 dark:text-slate-400">
              <span>{t('manual.operationalGuides', 'Guías operativas:')}</span>
              <span className="font-semibold text-cyan-600 dark:text-cyan-400">{t('common.technicalTeam', 'Equipo Técnico')}</span>
            </div>
          )}
        </div>

        {/* Lista de Capítulos */}
        <nav className="flex-1 overflow-y-auto p-2 space-y-1">
          {filteredSections.map((sec) => {
            const Icon = sec.icon;
            const isSelected = sec.id === selectedSectionId;
            return (
              <button
                key={sec.id}
                type="button"
                onClick={() => handleSelectSection(sec.id)}
                className={`w-full flex items-start gap-3 p-2.5 rounded-xl text-left transition-all cursor-pointer group ${
                  isSelected
                    ? 'bg-cyan-50 dark:bg-cyan-950/40 midnight:bg-cyan-950/60 border border-cyan-500/30 text-cyan-700 dark:text-cyan-300 shadow-sm'
                    : 'text-slate-700 dark:text-slate-300 midnight:text-cyan-100/70 hover:bg-slate-100 dark:hover:bg-slate-800/60 midnight:hover:bg-cyan-900/20'
                }`}
              >
                <div
                  className={`mt-0.5 p-1.5 rounded-lg shrink-0 transition-colors ${
                    isSelected
                      ? 'bg-cyan-500 text-white dark:bg-cyan-500/30 dark:text-cyan-300'
                      : 'bg-slate-200/60 dark:bg-slate-800 midnight:bg-cyan-900/40 text-slate-500 dark:text-slate-400 group-hover:text-cyan-500'
                  }`}
                >
                  <Icon size={16} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <span className="text-xs font-semibold truncate">
                      {sec.number !== '0' ? `${sec.number}. ` : ''}{sec.shortTitle}
                    </span>
                    {sec.roleRequired === 'admin' && (
                      <span className="shrink-0 text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                        Admin
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 midnight:text-cyan-400/60 line-clamp-1">
                    {sec.summary}
                  </p>
                </div>
              </button>
            );
          })}
          {!filteredSections.length && (
            <div className="p-6 text-center text-xs text-slate-400">
              {t('manual.noResults', 'No se encontraron capítulos para esa búsqueda.')}
            </div>
          )}
        </nav>

      </aside>

      {/* ============================================================ */}
      {/* ÁREA CENTRAL DE LECTURA (Markdown renderizado en alta calidad) */}
      {/* ============================================================ */}
      <main
        ref={contentContainerRef}
        className="flex-1 min-w-0 h-full overflow-y-auto px-4 py-6 sm:px-6 sm:py-8 md:px-12 md:py-10 print:overflow-visible print:p-0"
      >
        {/* BARRA SUPERIOR MÓVIL / TABLET (Acceso rápido al índice y acciones) */}
        <div className="lg:hidden sticky top-0 z-30 -mx-4 sm:-mx-6 -mt-6 sm:-mt-8 mb-6 px-4 py-2.5 bg-white/95 dark:bg-[#161b22]/95 midnight:bg-[#080E1C]/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 midnight:border-cyan-900/40 flex items-center justify-between gap-3 shadow-xs print:hidden">
          <button
            type="button"
            onClick={() => setIsMobileDrawerOpen(true)}
            aria-label={t('manual.closeIndexAria', 'Abrir índice de capítulos')}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 border border-cyan-500/30 text-xs font-semibold cursor-pointer active:scale-95 transition-all"
          >
            <Menu size={16} />
            <span>{t('manual.chapters', 'Capítulos')}</span>
            <span className="ml-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-700 dark:text-cyan-300">
              {currentSection.number !== '0' ? `Cap. ${currentSection.number}` : 'Intro'}
            </span>
          </button>

          <span className="text-xs font-medium text-slate-700 dark:text-slate-300 midnight:text-cyan-100/90 truncate max-w-[170px] sm:max-w-xs">
            {currentSection.shortTitle}
          </span>

          <button
            type="button"
            onClick={handlePrint}
            title={t('manual.printChapter', 'Imprimir o Exportar PDF')}
            aria-label={t('manual.printChapter', 'Imprimir capítulo')}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white midnight:text-cyan-400"
          >
            <Printer size={16} />
          </button>
        </div>

        <div className="max-w-4xl mx-auto space-y-8">
          
          {/* Banner de Salto Rápido al Módulo en Sistema (Acceso directo contextual protegido por RBAC) */}
          {currentSection.targetModule && onNavigate && (currentSection.roleRequired !== 'admin' || isAdmin) && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-gradient-to-r from-cyan-500/10 via-cyan-500/5 to-transparent border border-cyan-500/30 shadow-sm print:hidden">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-cyan-500 text-slate-950">
                  <Sparkles size={20} />
                </div>
                <div>
                  <h2 className="text-xs font-bold text-slate-900 dark:text-slate-100 midnight:text-cyan-50 uppercase tracking-wider">
                    {t('manual.directAccess', 'Acceso Directo al Sistema')}
                  </h2>
                  <p className="text-xs text-slate-600 dark:text-slate-300 midnight:text-cyan-200/90">
                    {t('manual.directAccessDesc', 'Puedes ir a este módulo directamente o usar su atajo de teclado:')}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onNavigate(currentSection.targetModule)}
                className="shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-md transition-all cursor-pointer"
              >
                <span>{t('manual.goToView', 'Ir a la vista')}</span>
                {currentSection.moduleShortcut && (
                  <kbd className="px-1.5 py-0.5 rounded bg-slate-950/20 text-[10px] font-mono">
                    {formatShortcut(currentSection.moduleShortcut)}
                  </kbd>
                )}
                <ExternalLink size={14} />
              </button>
            </div>
          )}

          {/* Renderizador de Contenido Markdown con Tailwind Typography & GFM */}
          <article className="prose dark:prose-invert max-w-none text-slate-800 dark:text-slate-200 midnight:text-cyan-50 leading-relaxed font-sans">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                h1: ({ node, children, ...props }) => (
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-950 dark:text-white midnight:text-cyan-50 tracking-tight pb-3 border-b border-slate-200 dark:border-slate-800 midnight:border-cyan-900/50 mt-2 mb-6" {...props}>
                    {children}
                  </h1>
                ),
                h2: ({ node, children, ...props }) => (
                  <h2 className="text-lg sm:text-xl font-bold text-cyan-700 dark:text-cyan-300 midnight:text-cyan-300 mt-8 mb-4 flex items-center gap-2 border-b border-slate-200/60 dark:border-slate-800/60 pb-1.5" {...props}>
                    {children}
                  </h2>
                ),
                h3: ({ node, children, ...props }) => (
                  <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 midnight:text-cyan-100 mt-6 mb-2" {...props}>
                    {children}
                  </h3>
                ),
                p: ({ node, children, ...props }) => (
                  <p className="mb-4 leading-relaxed text-sm sm:text-base text-slate-700 dark:text-slate-300 midnight:text-cyan-100/90" {...props}>
                    {children}
                  </p>
                ),
                strong: ({ node, children, ...props }) => (
                  <strong className="font-bold text-slate-950 dark:text-white midnight:text-cyan-50" {...props}>
                    {children}
                  </strong>
                ),
                ul: ({ node, children, ...props }) => (
                  <ul className="my-4 ml-6 list-disc space-y-1.5 text-sm sm:text-base marker:text-cyan-600 dark:marker:text-cyan-400" {...props}>
                    {children}
                  </ul>
                ),
                ol: ({ node, children, ...props }) => (
                  <ol className="my-4 ml-6 list-decimal space-y-2 text-sm sm:text-base font-medium marker:text-cyan-600 dark:marker:text-cyan-400" {...props}>
                    {children}
                  </ol>
                ),
                li: ({ node, children, ...props }) => (
                  <li className="leading-relaxed pl-1" {...props}>
                    {children}
                  </li>
                ),
                blockquote: ({ node, children, ...props }) => (
                  <aside className="my-4 p-4 rounded-xl border-l-4 border-cyan-500 bg-cyan-500/10 text-xs sm:text-sm text-slate-700 dark:text-slate-200 midnight:text-cyan-200/90 shadow-sm" {...props}>
                    {children}
                  </aside>
                ),
                table: ({ node, children, ...props }) => (
                  <div className="my-6 overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 midnight:border-cyan-900/50 shadow-sm">
                    <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800 midnight:divide-cyan-900/50 text-xs sm:text-sm text-left" {...props}>
                      {children}
                    </table>
                  </div>
                ),
                thead: ({ node, children, ...props }) => (
                  <thead className="bg-slate-100 dark:bg-slate-900 midnight:bg-cyan-950 text-slate-900 dark:text-slate-100 midnight:text-cyan-50 font-bold" {...props}>
                    {children}
                  </thead>
                ),
                th: ({ node, children, ...props }) => (
                  <th className="px-4 py-2.5 font-bold" {...props}>
                    {children}
                  </th>
                ),
                td: ({ node, children, ...props }) => (
                  <td className="px-4 py-2.5 border-t border-slate-200 dark:border-slate-800 midnight:border-cyan-900/40 text-slate-700 dark:text-slate-300" {...props}>
                    {children}
                  </td>
                ),
                code: ({ node, className: codeClass, children, ...props }) => {
                  return (
                    <code
                      className="px-1.5 py-0.5 rounded bg-slate-200/70 dark:bg-slate-800 midnight:bg-cyan-950/80 border border-slate-300 dark:border-slate-700/80 midnight:border-cyan-800/60 font-mono text-xs text-cyan-700 dark:text-cyan-300 midnight:text-cyan-300 font-semibold"
                      {...props}
                    >
                      {children}
                    </code>
                  );
                },
                // Renderizado interactivo de imágenes con botón de zoom y Lightbox
                img: ({ node, src, alt, ...props }) => {
                  // Normalizar rutas relativas del manual (../assets/manual/ -> /assets/manual/)
                  const normalizedSrc = (src || '').replace(/^(\.\.\/)+assets\/manual\//, '/assets/manual/');
                  return (
                    <figure className="my-8 flex flex-col items-center">
                      <div
                        onClick={() => setZoomedImage({ src: normalizedSrc, alt: alt || '' })}
                        className="relative group cursor-zoom-in rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 midnight:border-cyan-900/60 shadow-xl bg-slate-900/40"
                      >
                        <img
                          src={normalizedSrc}
                          alt={alt || 'Captura de pantalla del sistema'}
                          className="max-h-[500px] w-auto object-contain transition-transform duration-300 group-hover:scale-[1.01]"
                          loading="lazy"
                          {...props}
                        />
                        <div
                          className="pointer-events-none absolute inset-0 bg-slate-950/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white text-xs font-bold backdrop-blur-[2px]"
                        >
                          <div className="px-3 py-1.5 rounded-lg bg-slate-950/80 border border-white/20 flex items-center gap-1.5 shadow-lg">
                            <Maximize2 size={14} />
                            <span>{t('manual.zoomImageAria', 'Ampliar imagen')}</span>
                          </div>
                        </div>
                      </div>
                      {alt && (
                        <figcaption className="text-xs text-slate-500 dark:text-slate-400 midnight:text-cyan-400/80 mt-2.5 text-center italic max-w-2xl">
                          {alt}
                        </figcaption>
                      )}
                    </figure>
                  );
                },
                a: ({ node, href, children, ...props }) => {
                  // Manejar enlaces internos hacia otros capítulos del manual con protección RBAC
                  if (href && href.startsWith('./') && href.endsWith('.md')) {
                    const targetFile = href.replace('./', '');
                    const matched = localizedSections.find((s) => s.filename === targetFile);
                    if (matched) {
                      if (!isAdmin && matched.roleRequired === 'admin') {
                        return (
                          <span
                            className="inline-flex items-center gap-1.5 text-slate-400 dark:text-slate-500 line-through cursor-not-allowed select-none opacity-60"
                            title={t('manual.restrictedAccess', 'Acceso restringido: Requiere rol de Administrador')}
                          >
                            <span>{children}</span>
                            <span className="text-[9px] font-sans no-underline font-bold px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-amber-600 dark:text-amber-400">
                              {t('manual.onlyAdmin', 'Solo Admin')}
                            </span>
                          </span>
                        );
                      }
                      return (
                        <button
                          type="button"
                          onClick={() => handleSelectSection(matched.id)}
                          className="text-cyan-600 dark:text-cyan-400 font-semibold underline underline-offset-2 hover:text-cyan-500 cursor-pointer"
                        >
                          {children}
                        </button>
                      );
                    }
                  }
                  return (
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-cyan-600 dark:text-cyan-400 font-semibold underline underline-offset-2 hover:text-cyan-500"
                      {...props}
                    >
                      {children}
                    </a>
                  );
                },
              }}
            >
              {currentSection.content || 'Contenido en preparación...'}
            </ReactMarkdown>
          </article>

          {/* ============================================================ */}
          {/* BARRA DE NAVEGACIÓN INFERIOR (Anterior / Siguiente) */}
          {/* ============================================================ */}
          <div className="pt-8 mt-12 border-t border-slate-200 dark:border-slate-800 midnight:border-cyan-900/40 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 print:hidden">
            {prevSection ? (
              <button
                type="button"
                onClick={() => handleSelectSection(prevSection.id)}
                className="flex items-center justify-center sm:justify-start gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 midnight:border-cyan-900/50 hover:bg-slate-100 dark:hover:bg-slate-800 midnight:hover:bg-cyan-950 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
              >
                <ChevronLeft size={16} />
                <span className="truncate">{t('manual.prevChapter', 'Capítulo anterior')}: {prevSection.shortTitle}</span>
              </button>
            ) : <div className="hidden sm:block" />}

            {nextSection && (
              <button
                type="button"
                onClick={() => handleSelectSection(nextSection.id)}
                className="flex items-center justify-center sm:justify-start gap-2 px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition-all shadow-md cursor-pointer sm:ml-auto"
              >
                <span className="truncate">{t('manual.nextChapter', 'Capítulo siguiente')}: {nextSection.shortTitle}</span>
                <ChevronRight size={16} />
              </button>
            )}
          </div>
        </div>
      </main>

      {/* ============================================================ */}
      {/* MODAL LIGHTBOX DE IMAGEN EN PANTALLA COMPLETA */}
      {/* ============================================================ */}
      {zoomedImage && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setZoomedImage(null)}
          className="fixed inset-0 z-[100] bg-slate-950/85 backdrop-blur-md flex flex-col items-center justify-center p-4 sm:p-8 animate-in fade-in duration-200"
        >
          <div className="relative max-w-6xl max-h-[90vh] flex flex-col items-center">
            <button
              type="button"
              onClick={() => setZoomedImage(null)}
              className="absolute -top-12 right-0 p-2 rounded-full bg-slate-800/80 hover:bg-slate-700 text-white transition-colors cursor-pointer"
              title={t('manual.closeZoomAria', 'Cerrar (Esc)')}
              aria-label={t('manual.closeZoomAria', 'Cerrar ampliación')}
            >
              <X size={20} />
            </button>
            <img
              src={zoomedImage.src}
              alt={zoomedImage.alt}
              className="max-h-[80vh] w-auto rounded-2xl border border-slate-700 shadow-2xl object-contain"
              onClick={(e) => e.stopPropagation()}
            />
            {zoomedImage.alt && (
              <p className="text-xs text-slate-300 text-center mt-3 max-w-3xl">
                {zoomedImage.alt}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
