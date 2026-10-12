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
    try {
      // 🛡️ OWASP: On vérifie l'identité directement via le cookie HttpOnly sur le backend
      const response = await authFetch('/api/auth/me');
      if (response && response.ok) {
        const data = await response.json();
        const userData = data.user || data;
        const { password, ...safeUser } = userData;
        setUser(safeUser);
        setIsAuthenticated(true);
        localStorage.setItem('data', JSON.stringify(safeUser));
        if (safeUser.role) {
          localStorage.setItem('role', safeUser.role);
        }
      } else {
        // Non connecté / Session expirée
        setIsAuthenticated(false);
        setUser(null);
      }
    } catch (error) {
      console.warn("Vérification session:", error);
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  // 📡 Écoute la déconnexion cross-onglets (Admin, Dashboard, etc.)
  useEffect(() => {
    const handleStorageLogout = (e: StorageEvent) => {
      if (e.key === '__logout_event__') {
        window.location.href = '/login';
      }
    };
    window.addEventListener('storage', handleStorageLogout);
    return () => window.removeEventListener('storage', handleStorageLogout);
  }, []);

  const login = (tokenOrUser: any, possibleUserData?: UserData) => {
    const finalUserData = possibleUserData || tokenOrUser;
    // 🛡️ OWASP: Strictement AUCUN token dans le localStorage !
    localStorage.removeItem('token');
    if (finalUserData) {
      localStorage.setItem('data', JSON.stringify(finalUserData));
      if (finalUserData.role) {
        localStorage.setItem('role', finalUserData.role);
      }
      setUser(finalUserData);
      setIsAuthenticated(true);
    }
  };

  const logout = async () => {
    // 🔐 1. Révoquer la session côté serveur (Suppression du Cookie HttpOnly)
    try {
      await authFetch('/api/logout', { method: 'POST' });
    } catch (err) {
      console.warn("Erreur déconnexion backend:", err);
    }

    // 🔐 2. Nettoyage complet du localStorage & sessionStorage
    localStorage.removeItem('token');
    localStorage.removeItem('data');
    localStorage.removeItem('role');
    localStorage.removeItem('cart');
    sessionStorage.removeItem('hdesigner_checkout_draft');
    sessionStorage.removeItem('hdesigner_auth_email');

    // 🧹 3. Réinitialisation de tous les stores Zustand
    useNotificationStore.getState().reset();
    useWishlistStore.getState().reset();
    usePaymentStore.getState().reset();

    // 🛒 4. Événement pour vider le panier dans App.tsx
    window.dispatchEvent(new Event('userLoggedOut'));

    // 📡 5. Synchronise la déconnexion sur TOUS les onglets/fenêtres ouverts
    localStorage.setItem('__logout_event__', String(Date.now()));
    localStorage.removeItem('__logout_event__');

    setUser(null);
    setIsAuthenticated(false);
    
    // 🔄 6. Rechargement complet
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
