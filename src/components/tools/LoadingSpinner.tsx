import React from 'react';
import LoadingLottie from './LoadingLottie';

interface LoadingSpinnerProps {
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Composant universel de chargement Lottie.
 * Utilise l'animation installée dans `assets/loading.json` via `LoadingLottie`.
 * S'adapte dynamiquement au thème du site.
 */
const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = 80, className = '', style = {} }) => (
  <LoadingLottie size={size} className={className} style={style} />
);

export default LoadingSpinner;
