import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, ShieldAlert } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class GlobalErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("🔥 [GlobalErrorBoundary] Erreur non gérée capturée :", error, errorInfo);
    this.setState({ errorInfo });

    // Intégration future Sentry / Error Tracker
    if (typeof window !== 'undefined' && (window as any).__reportClientError) {
      (window as any).__reportClientError(error, errorInfo);
    }
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#0F0F11] text-slate-900 dark:text-slate-100 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white dark:bg-[#1A1A1D] rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-100 dark:border-white/5 text-center space-y-6">
            
            {/* Icône d'alerte */}
            <div className="w-20 h-20 rounded-full mx-auto flex items-center justify-center bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800/40">
              <AlertTriangle size={36} />
            </div>

            {/* Message utilisateur */}
            <div className="space-y-2">
              <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                Oups ! Un imprévu est survenu
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                Notre atelier numérique a rencontré une difficulté momentanée. Vos données enregistrées restent en sécurité.
              </p>
            </div>

            {/* Actions de récupération */}
            <div className="space-y-3 pt-2">
              <button
                onClick={this.handleReload}
                style={{ backgroundColor: 'var(--theme-primary, #dc2626)' }}
                className="w-full text-white py-3.5 px-4 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg hover:opacity-95 transition-all active:scale-[0.98] cursor-pointer"
              >
                <RefreshCw size={18} />
                <span>Recharger la page</span>
              </button>

              <button
                onClick={this.handleGoHome}
                className="w-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 py-3 px-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all cursor-pointer"
              >
                <Home size={18} />
                <span>Retour à l'accueil</span>
              </button>
            </div>

            {/* Détails techniques (visibles en dev ou au clic) */}
            {import.meta.env.DEV && this.state.error && (
              <details className="text-left mt-4 p-3 bg-slate-50 dark:bg-black/30 rounded-xl text-xs text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-white/5">
                <summary className="font-bold cursor-pointer text-amber-600">
                  Détails techniques (Mode Dev)
                </summary>
                <pre className="mt-2 overflow-x-auto whitespace-pre-wrap font-mono text-[11px] text-red-600 dark:text-red-400">
                  {this.state.error.toString()}
                  {"\n"}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}

            <div className="pt-2 border-t border-slate-100 dark:border-white/5 flex items-center justify-center gap-2 text-xs text-slate-400">
              <ShieldAlert size={14} />
              <span>H-designer — Système de Résilience Active</span>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default GlobalErrorBoundary;
