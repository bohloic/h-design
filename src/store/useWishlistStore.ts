import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Product } from '../../types';

interface WishlistState {
  items: any[];
  addItem: (item: any) => void;
  removeItem: (id: string | number) => void;
  toggleItem: (item: any) => void;
  clearWishlist: () => void;
  isInWishlist: (id: string | number) => boolean;
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: [],
      
      addItem: (item) => set((state) => {
        if (state.items.find(i => i.id === item.id)) return state;
        return { items: [...state.items, item] };
      }),
      
      removeItem: (id) => set((state) => ({
        items: state.items.filter(i => String(i.id) !== String(id))
      })),
      
      toggleItem: (item) => set((state) => {
        const exists = state.items.find(i => String(i.id) === String(item.id));
        if (exists) {
          return { items: state.items.filter(i => String(i.id) !== String(item.id)) };
        } else {
          return { items: [...state.items, item] };
        }
      }),
      
      clearWishlist: () => set({ items: [] }),
      
      isInWishlist: (id) => {
        return get().items.some(i => String(i.id) === String(id));
      }
    }),
    {
      name: 'wishlist-storage', // nom de la clé dans le localStorage
    }
  )
);
