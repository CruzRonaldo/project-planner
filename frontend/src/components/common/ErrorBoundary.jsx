import React from 'react';
import { AlertTriangle } from 'lucide-react';
import Button from './Button';

/**
 * Error Boundary global: captura errores de renderizado de los componentes
 * hijos y renderiza un fallback controlado en lugar de dejar la aplicación
 * sin montar (pantalla en blanco).
 *
 * Nota: no captura errores asíncronos; para esos se requiere try/catch o
 * manejo de promesas rechazadas (unhandledrejection).
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // TODO: integrar con servicio de observabilidad (logs/telemetría) y/o Toast global.
    console.error('[ErrorBoundary] Error capturado durante render:', error, errorInfo);
  }

  handleReset = () => {
    if (typeof this.props.onReset === 'function') {
      this.props.onReset();
    }
    this.setState({ hasError: false });
  };

  render() {
    const { hasError } = this.state;
    const {
      children,
      fallback,
      title = 'Error inesperado',
      message = 'Ocurrió un problema inesperado al mostrar la vista. Puedes intentar recuperarla o regresar al inicio.',
      homeUrl = '/',
    } = this.props;

    if (!hasError) {
      return children;
    }

    if (fallback) {
      return fallback({ reset: this.handleReset });
    }

    return (
      <main
        role="alert"
        aria-live="assertive"
        className="min-h-screen w-full flex flex-col items-center justify-center gap-4 p-6 text-center select-none bg-[var(--app-bg,#0d1117)] text-[var(--app-fg,#f1f5f9)] transition-colors duration-300"
      >
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-500/20 bg-amber-500/10 text-amber-500 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-400 midnight:border-cyan-500/30 midnight:bg-cyan-500/10 midnight:text-cyan-400">
          <AlertTriangle size={28} aria-hidden="true" />
        </div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 midnight:text-cyan-50">
          {title}
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 midnight:text-cyan-400/80 max-w-md">
          {message}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 mt-2">
          <Button
            variant="secondary"
            onClick={() => {
              window.location.href = homeUrl;
            }}
          >
            Volver al inicio
          </Button>
          <Button variant="primary" onClick={this.handleReset}>
            Reintentar vista
          </Button>
        </div>
      </main>
    );
  }
}
