// Fichier : src/utils/apiClient.ts

export const authFetch = async (endpoint: string, options: RequestInit = {}) => {
  // 1. CONSTRUIRE L'URL INTELLIGENTE
  let url = endpoint;
  
  if (!endpoint.startsWith('http')) {
      const cleanEndpoint = endpoint.startsWith('/') ? endpoint.substring(1) : endpoint;
      const apiPath = cleanEndpoint.startsWith('api/') ? cleanEndpoint : `api/${cleanEndpoint}`;
      const baseUrl = import.meta.env.VITE_API_URL || '';
      url = `${baseUrl}/${apiPath}`;
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