import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();
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
    localStorage.removeItem('token');
    localStorage.removeItem('data');
    localStorage.removeItem('role');
    
    // 🧹 Réinitialisation de tous les stores Zustand
    useNotificationStore.getState().reset();
    useWishlistStore.getState().reset();
    usePaymentStore.getState().reset();

    // 🛒 Déclenchement d'un événement pour vider le panier dans App.tsx
    window.dispatchEvent(new Event('userLoggedOut'));

    setUser(null);
    setIsAuthenticated(false);
    // Redirection fluide sans rechargement
    navigate('/login'); 
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
