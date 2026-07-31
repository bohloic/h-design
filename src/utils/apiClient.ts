// Fichier : src/utils/apiClient.ts

// URL de fallback par défaut pour la production et le dev local
const DEFAULT_BACKEND_URL = import.meta.env.DEV 
  ? 'http://localhost:205' 
  : 'https://h-design-back-off.vercel.app';

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
  const token = localStorage.getItem('token');
  const headers: Record<string, string> = {
    ...options.headers as Record<string, string>,
    ...(import.meta.env.DEV ? { 'ngrok-skip-browser-warning': 'true' } : {}),
  };

  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    let response = await fetch(url, {
      ...options,
      headers,
    });

    // 🛡️ FALLBACK INTEL : Si /api/products direct renvoie 404, basculer sur /api/products/shop
    if (response.status === 404 && url.endsWith('/api/products')) {
      const fallbackUrl = `${url}/shop`;
      console.warn(`⚠️ 404 sur ${url}, fallback sur ${fallbackUrl}`);
      response = await fetch(fallbackUrl, {
        ...options,
        headers,
      });
    }

    if (response.status === 401 && window.location.pathname !== '/login') {
      console.warn("Session expirée. Déconnexion...");
      localStorage.removeItem('token');
      localStorage.removeItem('data');
      window.location.href = '/login';
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