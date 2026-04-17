import { create } from 'zustand';
import { authFetch } from '../utils/apiClient';

// ✅ FIX #3 : Plus de BASE_URL hardcodée. On utilise authFetch qui gère
// automatiquement le token, le proxy Vite en dev, et l'URL en production.

export type NotificationType = 'info' | 'success' | 'warning' | 'error';

export interface Notification {
  id: string;
  user_id?: string | number;
  title: string;
  message: string;
  created_at: string;
  type: NotificationType;
  is_read: boolean;
  link?: string;
}

interface NotificationState {
  notifications: Notification[];
  isLoading: boolean;
  fetchNotifications: () => Promise<void>;
  addNotification: (notification: Omit<Notification, 'id' | 'created_at' | 'is_read'>) => void;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  removeNotification: (id: string) => Promise<void>;
  getUnreadCount: () => number;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  isLoading: false,

  fetchNotifications: async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    set({ isLoading: true });
    try {
      const response = await authFetch('/notifications');
      if (response && response.ok) {
        const data = await response.json();
        set({ notifications: data });
      }
    } catch (error) {
      console.error("Erreur fetch notifications:", error);
    } finally {
      set({ isLoading: false });
    }
  },

  addNotification: (notification) => {
    // Note: Dans le nouveau système, l'admin ajoute via le backend.
    // Cette fonction reste pour des notifications purement locales/éphémères.
    const newNotif: Notification = {
      ...notification,
      id: `local-${Date.now()}`,
      created_at: new Date().toISOString(),
      is_read: false,
    };
    set((state) => ({ notifications: [newNotif, ...state.notifications] }));
  },

  markAsRead: async (id) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    // Mise à jour optimiste (UI réactive avant la réponse serveur)
    set((state) => ({
      notifications: state.notifications.map((n) =>
        String(n.id) === String(id) ? { ...n, is_read: true } : n
      )
    }));

    try {
      await authFetch(`/notifications/${id}/read`, { method: 'PUT' });
    } catch (error) {
      console.error("Erreur markAsRead:", error);
    }
  },

  markAllAsRead: async () => {
    const unread = get().notifications.filter(n => !n.is_read);
    for (const n of unread) {
      await get().markAsRead(String(n.id));
    }
  },

  removeNotification: async (id) => {
    const token = localStorage.getItem('token');
    if (!token) {
      // Suppression locale uniquement si pas de token
      set((state) => ({ notifications: state.notifications.filter((n) => String(n.id) !== String(id)) }));
      return;
    }

    try {
      const resp = await authFetch(`/notifications/${id}`, { method: 'DELETE' });
      if (resp && resp.ok) {
        set((state) => ({ notifications: state.notifications.filter((n) => String(n.id) !== String(id)) }));
      }
    } catch (error) {
      console.error("Erreur suppression notif:", error);
    }
  },

  getUnreadCount: () => {
    return get().notifications.filter((n) => !n.is_read).length;
  },
}));
