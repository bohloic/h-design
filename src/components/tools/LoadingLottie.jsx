import React from 'react';
import { Loader2 } from 'lucide-react';

const LoadingLottie = ({ size = 120, className = '' }) => (
  <div className={`flex items-center justify-center ${className}`}>
    <Loader2 className="animate-spin text-amber-500" style={{ width: size, height: size, pointerEvents: 'none' }} />
  </div>
);

export default LoadingLottie;
