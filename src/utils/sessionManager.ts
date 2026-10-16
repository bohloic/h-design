/**
 * sessionManager.ts — Gestionnaire universel de session et d'assainissement d'authentification
 * ─────────────────────────────────────────────────────────────────────────────────────────────
 * Implémente le protocole de remédiation complet contre la rétention d'artefacts de session
 * (OWASP A07:2021 & CWE-613) :
 * 1. emergencyUnlockBrowser() : Déblocage immédiat console (F12)
 * 2. logoutAndPurgeBrowserData() : Déconnexion intégrale sans résidu
 * 3. sanitizeStaleAuthBeforeSubmit() : Assainissement préventif anti-token parasite
 * 4. submitPublicAuthForm() : Wrapper d'authentification publique sans fuite d'Authorization
 */

import { useNotificationStore } from '../store/useNotificationStore';
import { useWishlistStore } from '../store/useWishlistStore';
import { usePaymentStore } from '../store/usePaymentStore';

const DEFAULT_BACKEND_URL = import.meta.env.DEV 
  ? 'http://localhost:205' 
  : 'https://h-design-back-off.vercel.app';

const COMMON_APP_PATHS = ['/', '/login', '/boutique', '/personnaliser', '/personnalisation', '/checkout', '/dashboard'];

/**
 * 1. DÉPANNAGE IMMÉDIAT DANS LA CONSOLE CHROME (F12 > Console)
 * Purge totale de localStorage, sessionStorage et expiration agressive des cookies.
 */
export function emergencyUnlockBrowser() {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.clear();
    window.sessionStorage.clear();
  } catch (e) {
    console.warn("[H-Designer] Erreur localStorage.clear:", e);
  }

  // Expiration forcée de tous les cookies sur tous les chemins possibles
  clearAllCookies();

  console.info('[H-Designer] ✅ Cookies, localStorage et sessionStorage intégralement purgés.');
  window.location.replace('/login');
}

// Rendre la fonction accessible nativement dans la console des DevTools
if (typeof window !== 'undefined') {
  (window as any).emergencyUnlockBrowser = emergencyUnlockBrowser;
}

/**
 * Supprime tous les cookies accessibles côté client sur tous les chemins et sous-domaines.
 */
export const clearAllCookies = () => {
  if (typeof document === 'undefined') return;

  try {
    const cookies = document.cookie.split(';');
    const hostname = window.location.hostname;

    for (const rawCookie of cookies) {
      const eqPos = rawCookie.indexOf('=');
      const name = (eqPos > -1 ? rawCookie.slice(0, eqPos) : rawCookie).trim();
      if (!name) continue;

      for (const path of COMMON_APP_PATHS) {
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=${path}; SameSite=Lax`;
        document.cookie = `${name}=; max-age=0; path=${path}; SameSite=Lax`;
        if (hostname && hostname !== 'localhost') {
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=${path}; domain=${hostname}; SameSite=Lax`;
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=${path}; domain=.${hostname}; SameSite=Lax`;
        }
      }
    }
  } catch (err) {
    console.warn("[H-Designer] Avertissement nettoyage cookies:", err);
  }
};

/**
 * 3. GARDE PRÉVENTIVE À APPELER AU MONTAGE DE /login ET JUSTE AVANT LA SOUMISSION.
 * Évite que d'anciens jetons expirés ou corrompus ("undefined" / "null") ne fassent
 * échouer la requête d'inscription ou de connexion en boucle.
 */
export function sanitizeStaleAuthBeforeSubmit() {
  if (typeof window === 'undefined') return;

  const staleKeys = [
    'token',
    'accessToken',
    'refreshToken',
    'auth_token',
    'jwt',
    'user',
    'currentUser',
    'auth-storage',
    'session',
    'role',
    'data',
    'hdesigner_auth_draft',
  ];

  for (const key of staleKeys) {
    try {
      window.localStorage.removeItem(key);
      window.sessionStorage.removeItem(key);
    } catch (_) {}
  }

  // Nettoyage des clés dynamiques (Supabase sb-*, valeurs corrompues "undefined"/"null")
  for (const storage of [window.localStorage, window.sessionStorage]) {
    try {
      const keys = Object.keys(storage);
      for (const k of keys) {
        const val = storage.getItem(k);
        if (
          k.startsWith('sb-') ||
          k.toLowerCase().includes('auth') ||
          k.toLowerCase().includes('token') ||
          val === 'undefined' ||
          val === 'null'
        ) {
          storage.removeItem(k);
        }
      }
    } catch (_) {}
  }

  // Suppression des cookies d'authentification résiduels
  try {
    const cookies = document.cookie.split(';');
    for (const rawCookie of cookies) {
      const eqPos = rawCookie.indexOf('=');
      const name = (eqPos > -1 ? rawCookie.slice(0, eqPos) : rawCookie).trim();
      if (
        name &&
        (name.toLowerCase().includes('token') ||
          name.toLowerCase().includes('session') ||
          name.toLowerCase().includes('auth') ||
          name.startsWith('sb-'))
      ) {
        for (const path of COMMON_APP_PATHS) {
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=${path}; SameSite=Lax`;
          document.cookie = `${name}=; max-age=0; path=${path}; SameSite=Lax`;
        }
      }
    }
  } catch (_) {}
}

/**
 * 2. FONCTION DE DÉCONNEXION UNIVERSELLE PROPRE (logoutAndPurgeBrowserData)
 * Garantit qu'aucune trace personnelle ne subsiste après déconnexion.
 */
export async function logoutAndPurgeBrowserData(options: { keepCart?: boolean; keepTheme?: boolean } = { keepCart: false, keepTheme: true }) {
  if (typeof window === 'undefined') return;

  const savedCart = options?.keepCart ? window.localStorage.getItem('cart') : null;
  const savedTheme = options?.keepTheme !== false ? window.localStorage.getItem('theme') : null;

  // 1. Informer le serveur de révoquer le cookie HttpOnly (avec Clear-Site-Data)
  const baseUrl = import.meta.env.VITE_API_URL || DEFAULT_BACKEND_URL;
  try {
    await fetch(`${baseUrl.replace(/\/$/, '')}/api/logout`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (_) {
    // Poursuivre le nettoyage local même si le réseau est momentanément indisponible
  }

  // 2. Purge locale intégrale
  try {
    window.localStorage.clear();
    window.sessionStorage.clear();
  } catch (_) {}

  // Restauration d'éléments non sensibles si demandée
  if (savedTheme) {
    try { window.localStorage.setItem('theme', savedTheme); } catch (_) {}
  }
  if (savedCart) {
    try { window.localStorage.setItem('cart', savedCart); } catch (_) {}
  }

  // 3. Expiration forcée des cookies accessibles
  clearAllCookies();

  // 4. Réinitialisation des stores Zustand en mémoire
  try {
    useNotificationStore.getState().reset?.();
    useWishlistStore.getState().reset?.();
    usePaymentStore.getState().reset?.();
  } catch (_) {}

  // 5. Signal global pour réinitialiser les composants
  try {
    window.dispatchEvent(new Event('userLoggedOut'));
  } catch (_) {}

  // 6. Redirection propre sans retour arrière possible dans l'historique React
  window.location.replace('/login');
}

/**
 * Purge intégrale de toutes les données locales en mémoire et en stockage.
 * (Maintient la compatibilité avec le reste de l'application).
 */
export const purgeAllSessionData = () => {
  clearAllCookies();

  try {
    window.localStorage.clear();
    window.sessionStorage.clear();
  } catch (_) {}

  try {
    useNotificationStore.getState().reset?.();
    useWishlistStore.getState().reset?.();
    usePaymentStore.getState().reset?.();
  } catch (_) {}

  try {
    window.dispatchEvent(new Event('userLoggedOut'));
  } catch (_) {}
};

let isPurgingAndRedirecting = false;

/**
 * Exécute la purge complète et actualise la page vers la connexion.
 * Garantit qu'un seul rechargement s'exécute même en cas de clics multiples.
 */
export const triggerLoginPurgeAndRedirect = (targetUrl: string = '/login') => {
  if (isPurgingAndRedirecting) return;
  isPurgingAndRedirecting = true;

  // 1. Purge locale immédiate
  purgeAllSessionData();

  // 2. Appel serveur asynchrone non-bloquant pour invalider le cookie backend HttpOnly
  const baseUrl = import.meta.env.VITE_API_URL || DEFAULT_BACKEND_URL;
  try {
    fetch(`${baseUrl.replace(/\/$/, '')}/api/logout`, { 
      method: 'POST', 
      credentials: 'include',
      headers: { 'Cache-Control': 'no-store' }
    }).catch(() => {});
  } catch (_) {}

  // 3. Rechargement propre et direct avec remplacement d'historique
  setTimeout(() => {
    if (window.location.pathname === '/login' && !targetUrl.includes('?')) {
      window.location.reload();
    } else {
      window.location.replace(targetUrl);
    }
  }, 30);
};

/**
 * 4. WRAPPER FETCH SÉCURISÉ POUR /login ET /register
 * Garantit qu'aucun en-tête Authorization résiduel n'est envoyé lors de la connexion ou de l'inscription.
 */
export async function submitPublicAuthForm<T = any>(endpoint: string, payload: any): Promise<T> {
  // Assainir tout déchet préalable avant de soumettre
  sanitizeStaleAuthBeforeSubmit();

  // Résoudre l'URL complète
  let url = endpoint;
  if (!endpoint.startsWith('http')) {
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint.substring(1) : endpoint;
    const apiPath = cleanEndpoint.startsWith('api/') ? cleanEndpoint : `api/${cleanEndpoint}`;
    const baseUrl = import.meta.env.VITE_API_URL || DEFAULT_BACKEND_URL;
    url = `${baseUrl.replace(/\/$/, '')}/${apiPath}`;
  }

  const response = await fetch(url, {
    method: 'POST',
    credentials: 'include', // Permet de recevoir le Set-Cookie HttpOnly du backend cross-origin
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
      ...(import.meta.env.DEV ? { 'ngrok-skip-browser-warning': 'true' } : {}),
      // Ne JAMAIS injecter d'en-tête Authorization sur login/register
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || `Erreur d'authentification (${response.status})`);
  }

  return data as T;
}
