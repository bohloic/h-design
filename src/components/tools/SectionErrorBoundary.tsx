import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  fallbackMessage?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * 🛡️ Error Boundary granulaire (SectionErrorBoundary)
 * Empêche le plantage d'un composant secondaire ou d'un outil isolé (Canvas, Chatbot, Avis)
 * de faire tomber l'ensemble de l'interface ou du panier.
 */
export class SectionErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.warn('⚠️ [SectionErrorBoundary] Erreur interceptée au niveau de la section :', error, errorInfo);
    if (typeof window !== 'undefined' && (window as any).__reportClientError) {
      (window as any).__reportClientError(error, errorInfo);
    }
  }

  handleRetry = () => {
    if (this.props.onReset) {
      this.props.onReset();
    }
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full p-4 my-2 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-200 flex flex-col items-center justify-center text-center space-y-3">
          <div className="p-2 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400">
            <AlertCircle size={22} />
          </div>
          <div>
            <h4 className="font-semibold text-sm">
              {this.props.fallbackTitle || 'Composant temporairement indisponible'}
            </h4>
            <p className="text-xs text-amber-800/80 dark:text-amber-300/70 mt-1 max-w-sm">
              {this.props.fallbackMessage || "Une erreur s'est produite lors de l'affichage de ce module."}
            </p>
          </div>
          <button
            onClick={this.handleRetry}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-medium transition-colors shadow-sm"
          >
            <RefreshCw size={12} />
            Réessayer ce module
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default SectionErrorBoundary;
