import { GoogleGenAI, Type } from "@google/genai";
import { Product, Order } from "../typesAdmin";

// 1. On récupère la clé avec la bonne syntaxe Vite
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';

// 2. On crée une seule instance globale avec la BONNE variable
const ai = new GoogleGenAI({ apiKey: API_KEY });

export const getGiftAdvice = async (prompt: string): Promise<string> => {
  try {
    // Plus besoin de recréer l'instance "ai" ici
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Tu es le Lutin Assistant de la boutique de Noël. Réponds en français de manière chaleureuse et festive. L'utilisateur cherche un conseil cadeau ou un look de Noël. Voici sa demande : ${prompt}. Propose 2-3 idées précises.`,
      config: {
        temperature: 0.8,
        systemInstruction: "Tu es un expert en mode festive. Ton ton est joyeux, utilise des emojis de Noël 🎄🎅✨."
      }
    });
    return response.text || "Désolé, j'ai mangé trop de sablés de Noël, je n'arrive pas à réfléchir. Réessaye !";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Oups ! La magie de Noël rencontre un petit souci technique. Reviens plus tard !";
  }
};

export const analyzeSales = async (orders: Order[], products: Product[]) => {
  const prompt = `
    En tant qu'analyste de boutique de vêtements, analyse les données suivantes:
    Produits: ${JSON.stringify(products.map(p => ({ name: p.name, stock: p.stock })))}
    Ventes récentes: ${JSON.stringify(orders.map(o => ({ total: o.total, date: o.date })))}
    
    Fournis 3 conseils stratégiques courts (max 20 mots chacun) pour augmenter le chiffre d'affaires.
  `;

  try {
    // Plus besoin de recréer l'instance "ai" ici non plus
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: { 
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            tips: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Array of 3 strategic tips"
            }
          },
          required: ["tips"]
        }
      }
    });
    
    const text = response.text;
    if (!text) {
      return ["Optimisez vos stocks sur les best-sellers.", "Lancez une promotion sur les articles à faible rotation.", "Améliorez le suivi des commandes clients."];
    }
    
    const data = JSON.parse(text.trim());
    return (data.tips || []) as string[];
  } catch (error) {
    console.error("AI Error:", error);
    return ["Optimisez vos stocks sur les best-sellers.", "Lancez une promotion sur les articles à faible rotation.", "Améliorez le suivi des commandes clients."];
  }
};

// ... Garde tes mocks en dessous sans les modifier ...
export const getDesignSuggestions = async (prompt: string): Promise<string[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([
        `${prompt} - Version Vintage`,
        `Super ${prompt} 2024`,
        `I love ${prompt}`,
        `Keep Calm and ${prompt}`
      ]);
    }, 1000);
  });
};

export const generateDesignImage = async (prompt: string): Promise<string> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(`https://source.unsplash.com/random/500x500/?${encodeURIComponent(prompt)}`);
    }, 1500);
  });
};