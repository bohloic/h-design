import React, { useState, useEffect } from 'react';
import { BASE_IMG_URL } from '../images/VoirImage';

interface SafeImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallback?: string;
  className?: string;
}

/**
 * 🛡️ COMPOSANT IMAGE SÉCURISÉ & FLUIDE (STABILISATION PROD + ANIMATION)
 * - Rallume l'effet Shimmer et la transition fluide à chaque changement de `src` (Mise à jour Cloud / DB).
 * - Transition ultra-douce (Opacité 0->100% + Échelle 95->100%).
 * - Gère le basculement automatique sur un fallback propre si l'URL est corrompue.
 */
const SafeImage: React.FC<SafeImageProps> = ({ src, fallback = '/placeholder.png', className = '', alt = '', ...props }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(false);

  // ✨ REINITIALISATION FLUIDE : Réinitialise l'animation à chaque mise à jour de l'image (changement de produit, variante ou photo Cloudinary)
  useEffect(() => {
    setIsLoaded(false);
    setError(false);
  }, [src]);

  const getSource = () => {
    if (error || !src) return fallback;
    if (src.startsWith('http') || src.startsWith('data:') || src.startsWith('blob:')) return src;
    if (src.includes('/assets/') || src.startsWith('./') || src.startsWith('../')) return src;
    return BASE_IMG_URL + src;
  };

  return (
    <div className={`relative overflow-hidden bg-slate-100 dark:bg-slate-800/60 ${className}`}>
      {/* 🔮 Shimmer Effect : balayage élégant pendant le chargement */}
      {!isLoaded && !error && (
        <div className="absolute inset-0 z-10 overflow-hidden skeleton-shimmer">
          <div className="w-full h-full animate-shimmer bg-gradient-to-r from-transparent via-white/30 dark:via-white/10 to-transparent" 
               style={{ backgroundSize: '200% 100%' }} />
        </div>
      )}

      <img
        src={getSource()}
        alt={alt}
        loading="lazy"
        className={`w-full h-full object-cover smooth-image-transition ${
          isLoaded ? 'opacity-100 scale-100 blur-0' : 'opacity-0 scale-95 blur-xs'
        }`}
        onLoad={() => setIsLoaded(true)}
        onError={() => {
            console.warn(`⚠️ SafeImage: Erreur sur ${src}, bascule sur fallback.`);
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
          animation: shimmer 1.6s infinite linear;
        }
      `}</style>
    </div>
  );
};

export default SafeImage;
