import React from 'react';
import { Sparkles } from 'lucide-react';

const LoadingAnimation = ({ 
  isVisible = true, 
  message = 'Bewerkt je afbeelding...', 
  title = 'PHIXO AI',
  className = '' 
}) => {
  if (!isVisible) return null;

  return (
    <div className={`absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-10 rounded-xl ${className}`}>
      <div className="text-center">
        <div className="relative mb-6 flex justify-center">
          {/* Outer rotating ring */}
          <div className="w-16 h-16 border-4 border-purple-400/30 border-t-purple-400 rounded-full animate-spin"></div>
          {/* Inner pulsing circle - perfectly centered */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-gradient-to-r from-purple-400 to-blue-400 rounded-full animate-pulse flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-white animate-bounce" />
          </div>
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-bold text-white">{title}</h3>
          <p className="text-purple-300 animate-pulse">
            {message}
          </p>
          <div className="flex justify-center items-center space-x-2 mt-3">
            <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
            <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
            <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoadingAnimation;