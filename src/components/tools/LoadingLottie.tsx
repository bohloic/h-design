import React from 'react';
import { Lottie } from 'lottie-react';
import loadingAnimation from '../../../assets/loading.json';

interface LoadingLottieProps {
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

const LoadingLottie: React.FC<LoadingLottieProps> = ({ size = 120, className = '', style = {} }) => (
  <div 
    className={`flex items-center justify-center ${className}`}
    style={{
      filter: 'drop-shadow(0 0 10px color-mix(in srgb, var(--theme-primary, #ea580c) 40%, transparent))',
      ...style
    }}
  >
    <div style={{ width: size, height: size }} className="relative flex items-center justify-center">
      <Lottie 
        src={loadingAnimation} 
        loop={true} 
        autoplay={true}
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  </div>
);

export default LoadingLottie;
