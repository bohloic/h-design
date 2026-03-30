import React, { createContext, useContext, useState, useEffect } from 'react';

// 1. Définition du format de nos données
interface ThemeContextType {
  activeCollection: any | null;
  themeColor: string;
  themeMode: 'light' | 'dark';
  toggleThemeMode: () => void;
  refreshTheme: () => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType>({
  activeCollection: null,
  themeColor: '#1E3A8A',
  themeMode: 'dark',
  toggleThemeMode: () => {},
  refreshTheme: async () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeCollection, setActiveCollection] = useState<any | null>(null);
  const [themeColor, setThemeColor] = useState<string>('#1E3A8A');
  const [themeMode, setThemeMode] = useState<'light' | 'dark'>('dark');

  // Initialize theme mode on mount
  useEffect(() => {
    const savedMode = localStorage.getItem('hdesigner_theme_mode');
    if (savedMode === 'light' || savedMode === 'dark') {
      setThemeMode(savedMode);
      if (savedMode === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } else {
      // 🌓 DÉTECTION AUTOMATIQUE (System Preference)
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const initialMode = prefersDark ? 'dark' : 'light';
      
      setThemeMode(initialMode);
      if (initialMode === 'dark') {
          document.documentElement.classList.add('dark');
      } else {
          document.documentElement.classList.remove('dark');
      }
    }
  }, []);

  const toggleThemeMode = () => {
    setThemeMode((prevMode) => {
      const newMode = prevMode === 'dark' ? 'light' : 'dark';
      localStorage.setItem('hdesigner_theme_mode', newMode);
      if (newMode === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      return newMode;
    });
  };

  const fetchActiveTheme = async () => {
    try {
      // 🕵️ On ajoute un timestamp (?t=...) et 'no-store' pour forcer le navigateur
      // à ignorer le cache et récupérer la version la plus RÉCENTE sur le serveur.
      const response = await fetch(`/api/collections/active?t=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      if (response.ok) {
        const data = await response.json();
        
        if (data) {
          const config = typeof data.ui_config === 'string' ? JSON.parse(data.ui_config) : data.ui_config;
          data.ui_config = config;
          
          setActiveCollection(data);

          if (config?.primary_color) {
            setThemeColor(config.primary_color);
            document.documentElement.style.setProperty('--theme-primary', config.primary_color);
          }
        } else {
           setActiveCollection(null);
           setThemeColor('#1E3A8A');
           document.documentElement.style.setProperty('--theme-primary', '#1E3A8A');
        }
      }
    } catch (error) {
      console.error("Erreur de chargement du thème", error);
    }
  };

  useEffect(() => {
    // 1. Chargement initial
    fetchActiveTheme();

    // 2. Synchronisation automatique (Polling) toutes les 15 secondes
    // Cela permet de mettre à jour la bannière pour TOUS les utilisateurs sans actualiser
    const interval = setInterval(() => {
      fetchActiveTheme();
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  return (
    <ThemeContext.Provider value={{ activeCollection, themeColor, themeMode, toggleThemeMode, refreshTheme: fetchActiveTheme }}>
      {/* Le reste de ton site s'affiche en dessous */}
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);