// Fichier : src/utils/apiClient.ts

export const authFetch = async (url: string, options: RequestInit = {}) => {
  // 1. Récupérer le token actuel
  const token = localStorage.getItem('token');

  // 2. Préparer les headers (en gardant ceux existants s'il y en a)
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers as Record<string, string>,
  };

  // 3. Ajouter le token si il existe
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    // 4. Lancer la requête
    const response = await fetch(url, {
      ...options,
      headers,
    });

    // 5. LE GARDIEN : Si on reçoit une erreur 401 (Non autorisé / Token périmé)
    if (response.status === 401) {
      console.warn("Session expirée. Déconnexion...");
      
      // A. On supprime le vieux token
      localStorage.removeItem('token');
      
      // B. On redirige vers la page de login
      // window.location.href force un rechargement total, ce qui nettoie la mémoire
      window.location.href = '/login'; 
      
      return null; // On arrête tout ici
    }

    return response;

  } catch (error) {
    console.error("Erreur réseau :", error);
    throw error;
  }
};