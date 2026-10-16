// Fichier : src/utils/apiClient.ts

// URL de fallback par défaut pour la production et le dev local
const DEFAULT_BACKEND_URL = import.meta.env.DEV 
  ? 'http://localhost:205' 
  : 'https://h-design-back-off.vercel.app';

import { purgeAllSessionData } from './sessionManager';

let isHandling401 = false;

export const authFetch = async (endpoint: string, options: RequestInit = {}) => {
  // 1. CONSTRUIRE L'URL INTELLIGENTE
  let url = endpoint;
  
  if (!endpoint.startsWith('http')) {
      const cleanEndpoint = endpoint.startsWith('/') ? endpoint.substring(1) : endpoint;
      const apiPath = cleanEndpoint.startsWith('api/') ? cleanEndpoint : `api/${cleanEndpoint}`;
      const baseUrl = import.meta.env.VITE_API_URL || DEFAULT_BACKEND_URL;
      url = `${baseUrl.replace(/\/$/, '')}/${apiPath}`;
  }

  // 2. PRÉPARER LES HEADERS
  // 🛡️ OWASP: Les tokens sont dans les cookies HttpOnly, transmis via credentials: 'include'
  const token = localStorage.getItem('token');
  const headers: Record<string, string> = {
    ...options.headers as Record<string, string>,
    ...(import.meta.env.DEV ? { 'ngrok-skip-browser-warning': 'true' } : {}),
  };

  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  // 🛡️ OWASP: Ne JAMAIS injecter d'en-tête Authorization sur les routes d'authentification publiques
  const isPublicAuthRoute = 
    url.includes('/login') ||
    url.includes('/register') ||
    url.includes('/forgot-password') ||
    url.includes('/reset-password') ||
    url.includes('/resend-verification') ||
    url.includes('/verify-email');

  // Support header de secours si présent ET uniquement sur les routes privées
  if (token && token !== 'undefined' && token !== 'null' && !isPublicAuthRoute) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    let response = await fetch(url, {
      ...options,
      credentials: 'include', // 🛡️ Crucial : Envoie et reçoit les cookies HttpOnly (SameSite / Secure)
      headers,
    });

    // 🛡️ FALLBACK INTEL : Si /api/products direct renvoie 404, basculer sur /api/products/shop
    if (response.status === 404 && url.endsWith('/api/products')) {
      const fallbackUrl = `${url}/shop`;
      console.warn(`⚠️ 404 sur ${url}, fallback sur ${fallbackUrl}`);
      response = await fetch(fallbackUrl, {
        ...options,
        credentials: 'include',
        headers,
      });
    }

    if (response.status === 401 && !url.includes('/api/auth/me') && window.location.pathname !== '/login') {
      if (!isHandling401) {
        isHandling401 = true;
        console.warn("Session expirée. Déconnexion automatique et purge...");
        purgeAllSessionData();
        setTimeout(() => {
          window.location.href = '/login';
        }, 60);
      }
      return null;
    }

    return response;

  } catch (error) {
    console.error("Erreur réseau API:", error);
    throw error;
  }
};

/**
 * 🛡️ Helper sécurisé pour extraire le JSON de la réponse fetch sans crasher si c'est du HTML (ex: 404/500 Vercel)
 */
export const safeParseJson = async (response: Response | null) => {
  if (!response) return null;
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    const text = await response.text();
    console.warn(`⚠️ Réponse non-JSON reçue (${response.status}):`, text.substring(0, 150));
    throw new Error(`Le serveur a renvoyé du HTML au lieu de JSON (${response.status})`);
  }
  return response.json();
};

/**
 * Fonction dédiée à l'upload du design
 */
export const uploadDesignToServer = async (file: File | Blob): Promise<string> => {
    const formData = new FormData();
    formData.append('design', file); 

    const response = await authFetch('/products/upload-design', {
        method: 'POST',
        body: formData
    });

    if (!response || !response.ok) {
        const errorData = await safeParseJson(response).catch(() => ({})); 
        throw new Error(errorData?.message || `Erreur serveur (${response?.status})`);
    }

    const data = await safeParseJson(response);
    return data.url; 
};

// Compatibilité
const API = {
    get: (url: string) => authFetch(url, { method: 'GET' }).then(r => safeParseJson(r)),
    post: (url: string, body: any) => authFetch(url, { method: 'POST', body: JSON.stringify(body) }).then(r => safeParseJson(r)),
};

export default API;