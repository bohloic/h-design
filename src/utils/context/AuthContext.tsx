import React, { createContext, useContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import { authFetch } from '../apiClient';
import { useNotificationStore } from '../../store/useNotificationStore';
import { useWishlistStore } from '../../store/useWishlistStore';
import { usePaymentStore } from '../../store/usePaymentStore';

interface UserData {
  id?: string;
  nom?: string;
  prenom?: string;
  email?: string;
  phone?: string;
  city?: string;
  address?: string;
  role?: string;
  [key: string]: any;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: UserData | null;
  loading: boolean;
  login: (token: string, userData: UserData) => void;
  logout: () => void;
  updateUser: (newData: Partial<UserData>) => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const refreshUser = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const decoded: any = jwtDecode(token);
      const response = await authFetch(`/api/users/${decoded.userId}`);
      if (response.ok) {
        const userData = await response.json();
        const { password, ...safeUser } = userData;
        setUser(safeUser);
        setIsAuthenticated(true);
        localStorage.setItem('data', JSON.stringify(safeUser));
        if (safeUser.role) {
          localStorage.setItem('role', safeUser.role);
        }
      } else if (response.status === 401) {
        logout();
      }
    } catch (error) {
      console.error("Erreur refreshUser:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  // 📡 Écoute la déconnexion cross-onglets (Admin, Dashboard, etc.)
  // Quand un autre onglet se déconnecte, celui-ci se recharge aussi immédiatement
  useEffect(() => {
    const handleStorageLogout = (e: StorageEvent) => {
      if (e.key === '__logout_event__') {
        // Un autre onglet vient de se déconnecter → on recharge cette fenêtre aussi
        window.location.href = '/login';
      }
    };
    window.addEventListener('storage', handleStorageLogout);
    return () => window.removeEventListener('storage', handleStorageLogout);
  }, []);

  const login = (token: string, userData: UserData) => {
    localStorage.setItem('token', token);
    localStorage.setItem('data', JSON.stringify(userData));
    if (userData.role) {
      localStorage.setItem('role', userData.role);
    }
    setUser(userData);
    setIsAuthenticated(true);
  };

  const logout = () => {
    // 🔐 1. Nettoyage complet du localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('data');
    localStorage.removeItem('role');
    localStorage.removeItem('cart');

    // 🧹 2. Réinitialisation de tous les stores Zustand
    useNotificationStore.getState().reset();
    useWishlistStore.getState().reset();
    usePaymentStore.getState().reset();

    // 🛒 3. Événement pour vider le panier dans App.tsx
    window.dispatchEvent(new Event('userLoggedOut'));

    // 📡 4. Synchronise la déconnexion sur TOUS les onglets/fenêtres ouverts
    //    (storage event est émis sur les autres onglets mais pas l'actuel)
    localStorage.setItem('__logout_event__', String(Date.now()));
    localStorage.removeItem('__logout_event__');

    setUser(null);
    setIsAuthenticated(false);
    
    // 🔄 5. Rechargement complet pour purger la mémoire React
    //    et s'assurer qu'aucune donnée sensible n'est plus visible
    window.location.href = '/login';
  };

  const updateUser = (newData: Partial<UserData>) => {
    setUser(prev => {
      const updated = prev ? { ...prev, ...newData } : (newData as UserData);
      localStorage.setItem('data', JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, loading, login, logout, updateUser, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
