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
  const isExtensionNoise = (msg: string) => {
    return (
      msg.includes('message channel closed') ||
      msg.includes('asynchronous response') ||
      msg.includes('ObjectMultiplex') ||
      msg.includes('MaxListenersExceededWarning') ||
      msg.includes('app-init-liveness') ||
      msg.includes('background-liveness') ||
      msg.includes('contentscript.js')
    );
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

  // Filtre les warnings de fuite de listeners émis par contentscript.js dans la console
  const origWarn = console.warn;
  console.warn = (...args: any[]) => {
    const combined = args.map(a => (typeof a === 'string' ? a : (a?.message || ''))).join(' ');
    if (isExtensionNoise(combined)) return;
    origWarn.apply(console, args);
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
