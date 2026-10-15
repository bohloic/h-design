import React, { createContext, useContext, useState, useEffect } from 'react';

// 1. Définition du format de nos données
interface ThemeContextType {
  activeCollection: any | null;
  themeColor: string;
  themeMode: 'light' | 'dark';
  theme: 'light' | 'dark'; // Alias de compatibilité pour themeMode
  toggleThemeMode: () => void;
  toggleTheme: () => void; // Alias de compatibilité pour toggleThemeMode
  refreshTheme: () => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType>({
  activeCollection: null,
  themeColor: '#1E3A8A',
  themeMode: 'light',
  theme: 'light',
  toggleThemeMode: () => {},
  toggleTheme: () => {},
  refreshTheme: async () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeCollection, setActiveCollection] = useState<any | null>(null);
  const [themeColor, setThemeColor] = useState<string>('#1E3A8A');
  const [themeMode, setThemeMode] = useState<'light' | 'dark'>('light');

  // Mode clair exclusif : suppression permanente du mode sombre
  useEffect(() => {
    localStorage.removeItem('hdesigner_theme_mode');
    document.documentElement.classList.remove('dark');
  }, []);

  const toggleThemeMode = () => {
    // Mode sombre supprimé : maintien strict du mode clair
    setThemeMode('light');
    document.documentElement.classList.remove('dark');
  };

  const fetchActiveTheme = async () => {
    try {
      const baseUrl = import.meta.env.VITE_API_URL || '';
      const response = await fetch(`${baseUrl}/api/collections/active?t=${Date.now()}`, {
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
    fetchActiveTheme();

    const interval = setInterval(() => {
      fetchActiveTheme();
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  return (
    <ThemeContext.Provider value={{ 
      activeCollection, 
      themeColor, 
      themeMode, 
      theme: themeMode,
      toggleThemeMode, 
      toggleTheme: toggleThemeMode,
      refreshTheme: fetchActiveTheme 
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);