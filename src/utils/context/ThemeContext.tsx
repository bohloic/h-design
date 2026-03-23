import React, { createContext, useContext, useState, useEffect } from 'react';

// 1. Définition du format de nos données
interface ThemeContextType {
  activeCollection: any | null;
  themeColor: string;
}

const ThemeContext = createContext<ThemeContextType>({
  activeCollection: null,
  themeColor: '#dc2626', // Rouge H-designer par défaut
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeCollection, setActiveCollection] = useState<any | null>(null);
  const [themeColor, setThemeColor] = useState<string>('#dc2626'); // Couleur par défaut

  useEffect(() => {
    const fetchActiveTheme = async () => {
      try {
        // Pas besoin de authFetch ici, tout le monde doit voir le design du site !
        const response = await fetch('/api/collections/active');
        if (response.ok) {
          const data = await response.json();
          
          if (data) {
            // Nettoyage de la configuration UI (JSON)
            const config = typeof data.ui_config === 'string' ? JSON.parse(data.ui_config) : data.ui_config;
            data.ui_config = config;
            
            setActiveCollection(data);

            // 🪄 LA MAGIE CSS : On injecte la couleur globalement dans la page
            if (config?.primary_color) {
              setThemeColor(config.primary_color);
              document.documentElement.style.setProperty('--theme-primary', config.primary_color);
            }
          } else {
             // S'il n'y a pas de collection, on s'assure de remettre la couleur par défaut
             document.documentElement.style.setProperty('--theme-primary', '#dc2626');
          }
        }
      } catch (error) {
        console.error("Erreur de chargement du thème", error);
      }
    };

    fetchActiveTheme();
  }, []);

  return (
    <ThemeContext.Provider value={{ activeCollection, themeColor }}>
      
      {/* 🖼️ AFFICHAGE AUTOMATIQUE DE LA BANNIÈRE TOUT EN HAUT DU SITE */}
      {activeCollection?.ui_config?.banner_url && (
        <div className="w-full bg-slate-900 flex items-center justify-center overflow-hidden h-12 sm:h-16 relative z-50">
          <img 
            src={activeCollection.ui_config.banner_url} 
            alt={`Thème ${activeCollection.name}`} 
            className="w-full h-full object-cover opacity-90"
          />
          {/* Optionnel : Un petit texte par dessus l'image */}
          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
             <span className="text-white font-bold text-sm sm:text-base tracking-widest uppercase">
                {activeCollection.name}
             </span>
          </div>
        </div>
      )}

      {/* Le reste de ton site s'affiche en dessous */}
      {children}

    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);