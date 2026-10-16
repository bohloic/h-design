import React, { createContext, useContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import { authFetch } from '../apiClient';
import { useNotificationStore } from '../../store/useNotificationStore';
import { useWishlistStore } from '../../store/useWishlistStore';
import { purgeAllSessionData, logoutAndPurgeBrowserData } from '../sessionManager';

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
    const storedToken = localStorage.getItem('token');
    
    // 🛡️ Si aucun jeton n'est stocké, l'utilisateur est un simple visiteur non connecté
    // Inutile d'appeler /api/auth/me et d'inonder la console d'erreurs 401 !
    if (!storedToken) {
      setIsAuthenticated(false);
      setUser(null);
      setLoading(false);
      return;
    }

    // 🛡️ Si le jeton stocké est déjà expiré ou invalide, purge immédiate sans requête inutile
    try {
      const decoded: any = jwtDecode(storedToken);
      if (decoded?.exp && decoded.exp * 1000 < Date.now()) {
        purgeAllSessionData();
        setIsAuthenticated(false);
        setUser(null);
        setLoading(false);
        return;
      }
    } catch {
      purgeAllSessionData();
      setIsAuthenticated(false);
      setUser(null);
      setLoading(false);
      return;
    }

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
        // Le serveur a rejeté la session (401 Unauthorized ou token expiré)
        // On purge les données invalides sans laisser de session fantôme !
        localStorage.removeItem('token');
        localStorage.removeItem('data');
        localStorage.removeItem('role');
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch (error) {
      // Erreur réseau (offline)
      const storedData = localStorage.getItem('data');
      if (storedToken && storedData) {
        try {
          setUser(JSON.parse(storedData));
          setIsAuthenticated(true);
        } catch {
          setIsAuthenticated(false);
          setUser(null);
        }
      } else {
        setIsAuthenticated(false);
        setUser(null);
      }
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
    let tokenStr: string | null = null;
    let finalUserData: UserData | null = null;

    if (typeof tokenOrUser === 'string') {
      tokenStr = tokenOrUser;
      finalUserData = possibleUserData || null;
    } else {
      finalUserData = tokenOrUser;
      tokenStr = (possibleUserData as any) || null;
    }

    if (tokenStr) {
      localStorage.setItem('token', tokenStr);
    }

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
    setUser(null);
    setIsAuthenticated(false);
    
    // 🔐 Révocation serveur + purge totale client (cookies, storage) + redirection /login
    await logoutAndPurgeBrowserData({ keepCart: false, keepTheme: true });
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
