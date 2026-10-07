import React from 'react';
import LoadingLottie from './LoadingLottie';

interface LoadingSpinnerProps {
  size?: number;
  className?: string;
}

/**
 * Centralised loading spinner component.
 * Utilise l'animation Lottie via `LoadingLottie`.
 */
const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = 48, className = '' }) => (
  <LoadingLottie size={size} className={className} />
);

export default LoadingSpinner;
