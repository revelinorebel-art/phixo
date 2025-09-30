import React from 'react';

const PhixoLogo = ({ className = "", size = "default" }) => {
  const sizeClasses = {
    small: "h-8",
    default: "h-10", 
    large: "h-12"
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Camera Aperture Icon */}
      <div className={`${sizeClasses[size]} aspect-square`}>
        <svg 
          viewBox="0 0 100 100" 
          className="w-full h-full"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Outer circle */}
          <circle cx="50" cy="50" r="48" fill="none" stroke="url(#gradient1)" strokeWidth="2"/>
          
          {/* Aperture blades */}
          <g>
            {/* Blade 1 - Purple */}
            <path d="M50 10 L70 30 L50 50 L30 30 Z" fill="#8B5CF6" opacity="0.9"/>
            
            {/* Blade 2 - Blue */}
            <path d="M70 30 L90 50 L70 70 L50 50 Z" fill="#3B82F6" opacity="0.9"/>
            
            {/* Blade 3 - Cyan */}
            <path d="M70 70 L50 90 L30 70 L50 50 Z" fill="#06B6D4" opacity="0.9"/>
            
            {/* Blade 4 - Green */}
            <path d="M30 70 L10 50 L30 30 L50 50 Z" fill="#10B981" opacity="0.9"/>
            
            {/* Blade 5 - Teal (top right) */}
            <path d="M50 10 L90 50 L70 30 Z" fill="#14B8A6" opacity="0.8"/>
            
            {/* Blade 6 - Blue-green (bottom right) */}
            <path d="M90 50 L50 90 L70 70 Z" fill="#0891B2" opacity="0.8"/>
            
            {/* Blade 7 - Purple-blue (bottom left) */}
            <path d="M50 90 L10 50 L30 70 Z" fill="#7C3AED" opacity="0.8"/>
            
            {/* Blade 8 - Indigo (top left) */}
            <path d="M10 50 L50 10 L30 30 Z" fill="#6366F1" opacity="0.8"/>
          </g>
          
          {/* Center circle */}
          <circle cx="50" cy="50" r="12" fill="url(#centerGradient)" stroke="white" strokeWidth="1"/>
          
          {/* Gradients */}
          <defs>
            <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#8B5CF6"/>
              <stop offset="25%" stopColor="#3B82F6"/>
              <stop offset="50%" stopColor="#06B6D4"/>
              <stop offset="75%" stopColor="#10B981"/>
              <stop offset="100%" stopColor="#8B5CF6"/>
            </linearGradient>
            
            <radialGradient id="centerGradient" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#F8FAFC"/>
              <stop offset="100%" stopColor="#E2E8F0"/>
            </radialGradient>
          </defs>
        </svg>
      </div>
      
      {/* PHIXO Text */}
      <div className="text-white font-bold tracking-wide">
        <span className={`
          ${size === 'small' ? 'text-lg' : size === 'large' ? 'text-2xl' : 'text-xl'}
          bg-gradient-to-r from-white via-purple-200 to-white bg-clip-text text-transparent
        `}>
          PHIXO
        </span>
      </div>
    </div>
  );
};

export default PhixoLogo;