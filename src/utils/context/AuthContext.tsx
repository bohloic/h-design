import React, { createContext, useContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import { authFetch } from '../apiClient';

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
    setUser(userData);
    setIsAuthenticated(true);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('data');
    setUser(null);
    setIsAuthenticated(false);
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
