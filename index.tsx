import React from 'react';
import ReactDOM from 'react-dom/client';
import './src/index.css';
import App from './App';
import { triggerLoginPurgeAndRedirect } from './src/utils/sessionManager';

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

  // 🛡️ 2. Intercepteur global : sur n'importe quel bouton ou lien de connexion cliqué,
  // purge automatiquement tous les cookies, sessionStorage et localStorage, puis actualise la page.
  document.addEventListener('click', (e) => {
    // Si on est déjà sur la page d'authentification, ne pas intercepter les interactions internes (bascule d'onglets, formulaire)
    if (window.location.pathname === '/login' || window.location.pathname.startsWith('/login/')) return;

    const target = (e.target as HTMLElement)?.closest('a, button');
    if (!target) return;
    const href = target.getAttribute('href');
    const text = (target.textContent || '').trim().toLowerCase();
    
    // Détection de tout lien ou bouton menant à la connexion
    if (
      href === '/login' ||
      href?.startsWith('/login?') ||
      target.getAttribute('data-action') === 'login' ||
      ((text === 'connexion' || text === 'se connecter' || text.includes('changer de compte')) && (target.tagName === 'A' || target.tagName === 'BUTTON'))
    ) {
      // Si ce n'est pas le bouton de soumission du formulaire de login lui-même
      if (target.getAttribute('type') === 'submit') return;

      e.preventDefault();
      e.stopPropagation();
      triggerLoginPurgeAndRedirect(href || '/login');
    }
  }, true);
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
