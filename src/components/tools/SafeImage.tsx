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
  const [error, setError] = useState(false);

  useEffect(() => {
    setError(false);
  }, [src]);

  const getSource = () => {
    if (error || !src) return fallback;
    const cleanSrc = typeof src === 'string' ? src.trim() : '';
    if (!cleanSrc) return fallback;

    // 1. URLs absolues, Data URIs (Base64), Blob URLs
    if (cleanSrc.startsWith('http://') || cleanSrc.startsWith('https://') || cleanSrc.startsWith('data:') || cleanSrc.startsWith('blob:')) {
      if (cleanSrc.includes('res.cloudinary.com') && cleanSrc.includes('/upload/') && !cleanSrc.includes('f_auto')) {
        return cleanSrc.replace('/upload/', '/upload/f_auto,q_auto,w_800,c_limit/');
      }
      return cleanSrc;
    }

    // 2. Assets locaux Vite
    if (cleanSrc.includes('/assets/') || cleanSrc.startsWith('./') || cleanSrc.startsWith('../')) {
      return cleanSrc;
    }

    // 3. Chemins Cloudinary relatifs
    if (cleanSrc.startsWith('h-designer/') || cleanSrc.startsWith('v1')) {
      return `https://res.cloudinary.com/dwyx9e7zw/image/upload/f_auto,q_auto,w_800,c_limit/${cleanSrc}`;
    }

    // 4. Images serveur relatives standard
    return BASE_IMG_URL + cleanSrc;
  };

  return (
    <img
      src={getSource()}
      alt={alt}
      loading="eager"
      className={`w-full h-full object-cover ${className}`}
      onError={() => {
        if (!error) {
          console.warn(`⚠️ SafeImage: Erreur sur ${src}, bascule sur fallback.`);
          setError(true);
        }
      }}
      {...props}
    />
  );
};

export default SafeImage;
