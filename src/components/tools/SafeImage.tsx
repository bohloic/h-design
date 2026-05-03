import React, { useState } from 'react';
import { BASE_IMG_URL } from '../images/VoirImage';

interface SafeImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallback?: string;
  className?: string;
}

/**
 * 🛡️ COMPOSANT IMAGE SÉCURISÉ (STABILISATION PROD)
 * - Gère l'effet Shimmer (balayage animé) pendant le chargement.
 * - Bascule sur un fallback (/placeholder.png) en cas d'erreur (404, 500, Timeout).
 * - Centralise la logique d'URL (BASE_IMG_URL).
 */
const SafeImage: React.FC<SafeImageProps> = ({ src, fallback = '/placeholder.png', className = '', alt = '', ...props }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(false);

  const getSource = () => {
    if (error || !src) return fallback;
    // Si c'est une URL absolue ou un data-uri, on l'utilise direct
    if (src.startsWith('http') || src.startsWith('data:') || src.startsWith('blob:')) return src;
    
    // ✅ CORRECTIF PROD : Si l'image vient des assets locaux (Vite), on ne préfixe pas par BASE_IMG_URL
    // En prod, les assets importés ressemblent à "/assets/name-hash.png"
    if (src.includes('/assets/') || src.startsWith('./') || src.startsWith('../')) return src;

    return BASE_IMG_URL + src;
  };

  return (
    <div className={`relative overflow-hidden bg-slate-100 dark:bg-slate-800/50 ${className}`}>
      {/* 🔮 Shimmer Effect : Visible tant que l'image n'est pas prête */}
      {!isLoaded && !error && (
        <div className="absolute inset-0 z-10 overflow-hidden">
          <div className="w-full h-full animate-shimmer bg-gradient-to-r from-transparent via-white/20 dark:via-white/5 to-transparent shadow-inner" 
               style={{ backgroundSize: '200% 100%' }} />
        </div>
      )}

      <img
        src={getSource()}
        alt={alt}
        loading="lazy"
        className={`transition-opacity duration-700 ease-in-out ${isLoaded ? 'opacity-100' : 'opacity-0'} ${className}`}
        onLoad={() => setIsLoaded(true)}
        onError={() => {
            console.warn(`⚠️ SafeImage: Erreur sur ${src}, bascule sur ${fallback}`);
            setError(true);
            setIsLoaded(true);
        }}
        {...props}
      />
      
      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-shimmer {
          animation: shimmer 1.8s infinite linear;
        }
      `}</style>
    </div>
  );
};

export default SafeImage;
