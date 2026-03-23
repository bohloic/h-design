import React from 'react';
import { Star } from 'lucide-react';

/**
 * 1. Séparateur Simple 
 * Légèrement teinté avec la couleur du thème
 */
export const Separator = () => {
  return (
    <hr 
        className="my-12 border-t transition-colors duration-500" 
        style={{ borderColor: 'color-mix(in srgb, var(--theme-primary) 15%, #e2e8f0)' }}
    />
  );
};

/**
 * 2. Séparateur Dégradé
 * Utilise un dégradé allant vers la couleur du thème (en transparence)
 */
export const GradientSeparator = () => {
  return (
    <div 
        className="my-16 h-px w-full opacity-60" 
        style={{ 
            background: 'linear-gradient(to right, transparent, color-mix(in srgb, var(--theme-primary) 50%, transparent), transparent)' 
        }}
    />
  );
};

/**
 * 3. Séparateur avec Libellé ou Icône
 * Le contenu central prend la couleur pleine du thème
 */
export const LabeledSeparator = ({ label }) => {
  return (
    <div className="relative flex py-12 items-center">
      {/* Ligne de gauche teintée */}
      <div 
        className="flex-grow border-t" 
        style={{ borderColor: 'color-mix(in srgb, var(--theme-primary) 20%, #e2e8f0)' }}
      ></div>
      
      {/* Contenu du milieu DYNAMIQUE */}
      <span 
        className="flex-shrink-0 mx-4 text-sm font-black uppercase tracking-[0.2em] flex items-center gap-2 transition-colors duration-500"
        style={{ color: 'var(--theme-primary)' }}
      >
        {label ? label : <Star size={16} fill="currentColor" className="animate-pulse" />}
      </span>

      {/* Ligne de droite teintée */}
      <div 
        className="flex-grow border-t" 
        style={{ borderColor: 'color-mix(in srgb, var(--theme-primary) 20%, #e2e8f0)' }}
      ></div>
    </div>
  );
};