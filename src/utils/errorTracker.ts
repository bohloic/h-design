/**
 * 🛰️ Module de surveillance des erreurs et logging client (Error Tracking)
 * Compatible avec Sentry, LogRocket, GlitchTip ou journalisation locale/serveur.
 */

interface ErrorContext {
  tags?: Record<string, string>;
  extra?: Record<string, any>;
  user?: {
    id?: string | number;
    email?: string;
  };
}

class ErrorTracker {
  private isInitialized = false;
  private dsn: string | null = null;
  private environment: string = 'development';

  public init(config?: { dsn?: string; environment?: string }) {
    if (this.isInitialized) return;

    this.dsn = config?.dsn || (import.meta as any).env?.VITE_SENTRY_DSN || null;
    this.environment = config?.environment || (import.meta as any).env?.MODE || 'development';
    this.isInitialized = true;

    // 1. Capture globale des erreurs JavaScript non gérées
    if (typeof window !== 'undefined') {
      window.addEventListener('error', (event) => {
        this.captureException(event.error || new Error(event.message), {
          extra: {
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno,
          },
        });
      });

      // 2. Capture des rejets de Promesses non interceptés
      window.addEventListener('unhandledrejection', (event) => {
        const error = event.reason instanceof Error ? event.reason : new Error(String(event.reason));
        this.captureException(error, {
          extra: { type: 'UnhandledPromiseRejection' },
        });
      });

      // 3. Liaison avec le GlobalErrorBoundary React
      (window as any).__reportClientError = (error: Error, errorInfo?: any) => {
        this.captureException(error, { extra: errorInfo });
      };

      if (this.environment !== 'production') {
        console.log(`🛡️ [ErrorTracker] Initialisé en mode ${this.environment}`);
      }
    }
  }

  /**
   * Enregistre une exception avec contexte additionnel
   */
  public captureException(error: Error, context?: ErrorContext) {
    const errorPayload = {
      name: error?.name || 'Error',
      message: error?.message || 'Erreur inconnue',
      stack: error?.stack,
      url: typeof window !== 'undefined' ? window.location.href : '',
      timestamp: new Date().toISOString(),
      environment: this.environment,
      ...context,
    };

    // Si Sentry SDK externe est chargé sur la page (window.Sentry)
    if (typeof window !== 'undefined' && (window as any).Sentry?.captureException) {
      (window as any).Sentry.captureException(error, { extra: context });
      return;
    }

    // Affichage formaté en console
    if (this.environment !== 'production') {
      console.groupCollapsed(`🚨 [ErrorTracker] ${errorPayload.name}: ${errorPayload.message}`);
      console.error(error);
      if (context) console.info('Context:', context);
      console.groupEnd();
    } else {
      // En production, envoi télémétrie ou journalisation discrète
      try {
        if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
          const blob = new Blob([JSON.stringify(errorPayload)], { type: 'application/json' });
          // Possibilité de pointer vers un endpoint de collecte interne
          // navigator.sendBeacon('/api/logs/client-errors', blob);
        }
      } catch (e) {
        // Ignorer silencieusement pour ne pas créer d'erreur dans l'erreur
      }
    }
  }

  /**
   * Enregistre un message ou avertissement applicatif
   */
  public captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info', context?: ErrorContext) {
    if (typeof window !== 'undefined' && (window as any).Sentry?.captureMessage) {
      (window as any).Sentry.captureMessage(message, level);
    } else if (this.environment !== 'production') {
      console.warn(`[ErrorTracker] [${level.toUpperCase()}] ${message}`, context);
    }
  }
}

export const errorTracker = new ErrorTracker();
