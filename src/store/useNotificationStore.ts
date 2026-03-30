import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type NotificationType = 'info' | 'success' | 'warning' | 'error';

export interface Notification {
  id: string;
  userId?: string;
  title: string;
  message: string;
  date: string;
  type: NotificationType;
  read: boolean;
  link?: string;
}

interface NotificationState {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id' | 'date' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: (userId?: string) => void;
  removeNotification: (id: string) => void;
  getUnreadCount: (userId?: string) => number;
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      notifications: [],
      addNotification: (notification) => set((state) => ({
        notifications: [
          {
            ...notification,
            id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            date: new Date().toISOString(),
            read: false,
          },
          ...state.notifications,
        ],
      })),
      markAsRead: (id) => set((state) => ({
        notifications: state.notifications.map((n) => n.id === id ? { ...n, read: true } : n)
      })),
      markAllAsRead: (userId?: string) => set((state) => ({
        notifications: state.notifications.map((n) => {
          if (userId && n.userId && String(n.userId) !== String(userId)) return n;
          return { ...n, read: true };
        })
      })),
      removeNotification: (id) => set((state) => ({
        notifications: state.notifications.filter((n) => n.id !== id)
      })),
      getUnreadCount: (userId?: string) => {
        return get().notifications.filter((n) => {
          if (!n.read) {
            if (!userId) return !n.userId; 
            return !n.userId || String(n.userId) === String(userId);
          }
          return false;
        }).length;
      },
    }),
    {
      name: 'hdesign-notifications',
    }
  )
);
