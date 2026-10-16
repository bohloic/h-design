import React from 'react';
import ReactDOM from 'react-dom/client';
import './src/index.css';
import App from './App';
import GlobalErrorBoundary from './src/components/tools/GlobalErrorBoundary';
import { errorTracker } from './src/utils/errorTracker';

// Initialisation du tracker d'erreurs (Sentry / Monitoring client)
errorTracker.init();

// 🛡️ 1. Bouclier anti-bruit pour les extensions de navigateur (MetaMask, DevTools, contentscript.js)
// Empêche les avertissements de fuites de listeners et de flux fermés d'extensions tierces
if (typeof window !== 'undefined') {
  const isExtensionNoise = (msg: unknown): boolean => {
    if (!msg) return false;
    const str = typeof msg === 'string' ? msg : (msg instanceof Error ? `${msg.message} ${msg.stack || ''}` : String(msg));
    const lower = str.toLowerCase();
    return (
      lower.includes('objectmultiplex') ||
      lower.includes('orphaned data') ||
      lower.includes('maxlistenersexceededwarning') ||
      lower.includes('close listeners added') ||
      lower.includes('end listeners added') ||
      lower.includes('listeners added') ||
      lower.includes('emitter.setmaxlisteners()') ||
      lower.includes('app-init-liveness') ||
      lower.includes('background-liveness') ||
      lower.includes('contentscript.js') ||
      lower.includes('chrome-extension://') ||
      lower.includes('moz-extension://') ||
      lower.includes('message channel closed') ||
      lower.includes('asynchronous response')
    );
  };

  const shouldFilterArgs = (...args: any[]): boolean => {
    return args.some(arg => isExtensionNoise(arg));
  };

  // Intercepte les rejets de promesses non gérées des extensions tierces
  window.addEventListener('unhandledrejection', (event) => {
    const errorMsg = event?.reason?.message || String(event?.reason || '');
    if (isExtensionNoise(errorMsg)) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  });

  // Intercepte les erreurs globales issues des contentscripts d'extensions
  window.addEventListener('error', (event) => {
    const errorMsg = event?.message || String(event?.error?.message || '');
    const filename = event?.filename || '';
    if (isExtensionNoise(errorMsg) || filename.includes('contentscript.js')) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  }, true);

  // Filtre les warnings émis par contentscript.js dans la console
  const origWarn = console.warn;
  console.warn = (...args: any[]) => {
    if (shouldFilterArgs(...args)) return;
    origWarn.apply(console, args);
  };

  // Filtre les erreurs de flux et de listeners émis par contentscript.js dans la console
  const origError = console.error;
  console.error = (...args: any[]) => {
    if (shouldFilterArgs(...args)) return;
    origError.apply(console, args);
  };

  // Filtre les logs de debug orphelins émis par contentscript.js dans la console
  const origLog = console.log;
  console.log = (...args: any[]) => {
    if (shouldFilterArgs(...args)) return;
    origLog.apply(console, args);
  };
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <GlobalErrorBoundary>
      <App />
    </GlobalErrorBoundary>
  </React.StrictMode>
);
