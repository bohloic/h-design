import React from 'react';
import LoadingLottie from './LoadingLottie';

/**
 * Centralised loading spinner component.
 * Utilise l'animation Lottie définie dans `assets/loading.json` via `LoadingLottie`.
 * `size` définit la taille en pixels (largeur/hauteur) – la même valeur est appliquée
 * aux deux dimensions pour garder le ratio de l'animation.
 * `className` permet d'ajouter des styles supplémentaires (ex. animation spin,
 * couleur via CSS custom property `--theme-primary`).
 */
const LoadingSpinner = ({ size = 48, className = '' }) => (
  <LoadingLottie size={size} className={className} />
);

export default LoadingSpinner;
