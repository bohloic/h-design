import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type PaymentMethodType = 'Carte' | 'Espèces' | 'Mobile Money' | null;

interface PaymentState {
  preferredMethod: PaymentMethodType;
  savedCard: {
    cardNumber: string;
    expiryDate: string;
    cardHolder: string;
  } | null;
  setPreferredMethod: (method: PaymentMethodType) => void;
  saveCard: (card: { cardNumber: string; expiryDate: string; cardHolder: string }) => void;
  removeCard: () => void;
}

export const usePaymentStore = create<PaymentState>()(
  persist(
    (set) => ({
      preferredMethod: null,
      savedCard: null,
      
      setPreferredMethod: (method) => set({ preferredMethod: method }),
      
      saveCard: (card) => set({ 
        savedCard: card,
        preferredMethod: 'Mobile Money' // Si on ajoute une carte, on préfère le paiement en ligne
      }),
      
      removeCard: () => set({ savedCard: null })
    }),
    {
      name: 'payment-preferences'
    }
  )
);
