import { authFetch } from '../src/utils/apiClient';

/**
 * 🪄 Service IA pour H-designer
 * Toutes les requêtes passent désormais par le backend pour plus de sécurité 
 * et pour éviter les erreurs de quotas/modèles côté navigateur.
 */

export const getGiftAdvice = async (prompt: string): Promise<string> => {
  try {
    const response = await authFetch('/ai/gift-advice', {
      method: 'POST',
      body: JSON.stringify({ prompt })
    });

    if (!response || !response.ok) {
        throw new Error("Erreur de communication avec le serveur H-Designer");
    }

    const data = await response.json();
    return data.text || "Désolé, je n'ai pas pu générer de conseil pour le moment. Réessayez !";
  } catch (error: any) {
    console.error("AI Assistant Error:", error);
    return `Oups ! Notre atelier créatif rencontre un petit souci technique : ${error.message || "Serveur indisponible"}. Reviens plus tard ! ✨`;
  }
};

export const analyzeSales = async (orders: any[], products: any[]) => {
  // Optionnel : On peut aussi créer une route backend dédiée pour l'analyse
  // Pour l'instant, on reste sur un mock ou on appelle une route générique si besoin.
  return ["Optimisez vos stocks sur les best-sellers.", "Lancez une promotion sur les articles à faible rotation.", "Améliorez le suivi des commandes clients."];
};

// --- MOCKS POUR LE RESTE (Designs, etc.) ---
export const getDesignSuggestions = async (prompt: string): Promise<string[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([
        `${prompt} - Version Vintage`,
        `Super ${prompt} 2024`,
        `I love ${prompt}`
      ]);
    }, 1000);
  });
};

export const generateDesignImage = async (prompt: string): Promise<string> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(`https://images.unsplash.com/photo-1543332164-6e82f3555182?q=80&w=500&auto=format&fit=crop`);
    }, 1500);
  });
};