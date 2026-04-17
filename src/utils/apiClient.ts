// Fichier : src/utils/apiClient.ts

// ✅ On utilise juste le préfixe. Le proxy Vite (vite.config.ts) fera le lien vers le port 205.
const API_BASE_URL = '/api'; 

export const authFetch = async (endpoint: string, options: RequestInit = {}) => {
  // 1. CONSTRUIRE L'URL INTELLIGENTE
  // Si l'endpoint commence déjà par http, on le laisse (ex: image externe)
  // Sinon, on s'assure qu'il commence par /api pour déclencher le proxy
  let url = endpoint;
  
  if (!endpoint.startsWith('http')) {
      // On enlève le premier slash s'il existe pour éviter //api
      const cleanEndpoint = endpoint.startsWith('/') ? endpoint.substring(1) : endpoint;
      
      // Si l'endpoint ne contient pas déjà "api/", on l'ajoute
      if (!cleanEndpoint.startsWith('api/')) {
          url = `${API_BASE_URL}/${cleanEndpoint}`;
      } else {
          url = `/${cleanEndpoint}`;
      }
  }

  // 2. PRÉPARER LES HEADERS
  const token = localStorage.getItem('token');
  const headers: Record<string, string> = {
    ...options.headers as Record<string, string>,
    // ✅ FIX #16 : Header ngrok uniquement en développement (inutile en production)
    ...(import.meta.env.DEV ? { 'ngrok-skip-browser-warning': 'true' } : {}),
  };

  // Ajout du Content-Type JSON sauf si c'est un FormData (pour les images)
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  // Ajout du Token
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    // Gestion expiration session
    if (response.status === 401 && window.location.pathname !== '/login') {
      console.warn("Session expirée. Déconnexion...");
      localStorage.removeItem('token');
      localStorage.removeItem('data');
      window.location.href = '/login';
      return null;
    }

    return response;

  } catch (error) {
    console.error("Erreur réseau:", error);
    throw error;
  }
};

/**
 * Fonction dédiée à l'upload du design
 */
export const uploadDesignToServer = async (file: File | Blob): Promise<string> => {
    const formData = new FormData();
    formData.append('design', file); 

    // ✅ On envoie juste le chemin relatif. 
    // authFetch va le transformer en "/api/products/upload-design"
    // Le proxy Vite va l'envoyer à "http://localhost:205/api/products/upload-design"
    const response = await authFetch('/products/upload-design', {
        method: 'POST',
        body: formData
    });

    if (!response || !response.ok) {
        // On lit le message d'erreur du backend si possible
        const errorData = await response?.json().catch(() => ({})); 
        throw new Error(errorData.message || `Erreur serveur (${response?.status})`);
    }

    const data = await response.json();
    return data.url; 
};

// Compatibilité pour ton ancien code
const API = {
    get: (url: string) => authFetch(url, { method: 'GET' }).then(r => r?.json()),
    post: (url: string, body: any) => authFetch(url, { method: 'POST', body: JSON.stringify(body) }).then(r => r?.json()),
};

export default API;