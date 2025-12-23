
import { GoogleGenAI } from "@google/genai";

import { Product, Order } from "../typesAdmin";
import { Type } from "lucide-react";

const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;

export const getGiftAdvice = async (prompt: string): Promise<string> => {
  try {
    // Fixed: Always use a named parameter for apiKey and obtain it exclusively from process.env.API_KEY
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
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

/**
 * Analyses sales data using Gemini AI to provide strategic tips.
 * Compliant with @google/genai latest SDK standards.
 */
export const analyzeSales = async (orders: Order[], products: Product[]) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `
    En tant qu'analyste de boutique de vêtements, analyse les données suivantes:
    Produits: ${JSON.stringify(products.map(p => ({ name: p.name, stock: p.stock })))}
    Ventes récentes: ${JSON.stringify(orders.map(o => ({ total: o.total, date: o.date })))}
    
    Fournis 3 conseils stratégiques courts (max 20 mots chacun) pour augmenter le chiffre d'affaires.
  `;

  try {
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
    
    // Access .text property directly (it's a getter, not a method)
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
