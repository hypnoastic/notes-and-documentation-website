import React, { useEffect, useState } from 'react';
import Lottie from 'lottie-react';
import loadingAnimation from './pageAssets/loading.json'; // adjust path if needed
import './LoadingAnimation.css';

const LoadingAnimation = ({ onAnimationComplete }) => {
  const [animationDone, setAnimationDone] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimationDone(true);
      if (onAnimationComplete) {
        onAnimationComplete();
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [onAnimationComplete]);

  return (
      <div className="loading-animation-container">
        <div className="loading-content">
          <div className="loading-lottie">
            <Lottie animationData={loadingAnimation} loop={true} />
          </div>
          <h2>Loading your notes...</h2>
          <p>Please wait while we prepare your dashboard</p>
        </div>
      </div>
  );
};

export default LoadingAnimation;
