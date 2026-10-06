import React from 'react';
import Lottie from 'lottie-react';
import loadingAnimation from '../../assets/loading.json'; // Lottie animation from IconScout

const LoadingLottie = ({ size = 120 }) => (
  <Lottie animationData={loadingAnimation} style={{ width: size, height: size, pointerEvents: 'none' }} />
);

export default LoadingLottie;
