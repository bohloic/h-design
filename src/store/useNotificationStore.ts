import { create } from 'zustand';

const BASE_URL = 'http://localhost:205/api'; // Ajustez si nécessaire

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
      const response = await fetch(`${BASE_URL}/notifications`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
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
    // Cette fonction peut rester pour des notifications purement locales/éphémères si besoin.
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

    // Optimiste
    set((state) => ({
      notifications: state.notifications.map((n) => 
        String(n.id) === String(id) ? { ...n, is_read: true } : n
      )
    }));

    try {
      await fetch(`${BASE_URL}/notifications/${id}/read`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
    } catch (error) {
      console.error("Erreur markAsRead:", error);
    }
  },

  markAllAsRead: async () => {
    // Implémentation simple : boucle sur les non lues
    const unread = get().notifications.filter(n => !n.is_read);
    for (const n of unread) {
      await get().markAsRead(String(n.id));
    }
  },

  removeNotification: async (id) => {
    const token = localStorage.getItem('token');
    if (!token) {
      set((state) => ({ notifications: state.notifications.filter((n) => String(n.id) !== String(id)) }));
      return;
    }

    try {
      const resp = await fetch(`${BASE_URL}/notifications/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (resp.ok) {
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
