import React from 'react';
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

const ZoomPanel = ({
  zoom,
  onZoomChange,
  onReset,
  minZoom = 1,
  maxZoom = 8,
  step = 0.1
}) => {
  const handleSliderChange = (e) => {
    onZoomChange(parseFloat(e.target.value));
  };
  
  const handleZoomIn = () => {
    onZoomChange(Math.min(maxZoom, zoom + step));
  };

  const handleZoomOut = () => {
    onZoomChange(Math.max(minZoom, zoom - step));
  };

  return (
    <div className="flex items-center gap-2 bg-gray-900/50 border border-gray-700/80 rounded-lg p-2 backdrop-blur-sm animate-fade-in">
      <Button 
        onClick={handleZoomOut} 
        disabled={zoom <= minZoom} 
        variant="ghost"
        size="sm"
        className="p-2 rounded-md hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" 
        aria-label="Zoom out"
      >
        <ZoomOut className="w-4 h-4 text-gray-300" />
      </Button>
      
      <input
        type="range"
        min={minZoom}
        max={maxZoom}
        step={step}
        value={zoom}
        onChange={handleSliderChange}
        className="w-32 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
        aria-label="Zoom slider"
      />
      
      <Button 
        onClick={handleZoomIn} 
        disabled={zoom >= maxZoom} 
        variant="ghost"
        size="sm"
        className="p-2 rounded-md hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" 
        aria-label="Zoom in"
      >
        <ZoomIn className="w-4 h-4 text-gray-300" />
      </Button>
      
      <div className="w-px h-6 bg-gray-600 mx-1"></div>
      
      <span className="text-sm font-mono w-16 text-center text-gray-300 select-none" aria-live="polite">
        {Math.round(zoom * 100)}%
      </span>
      
      <Button 
        onClick={onReset} 
        disabled={zoom === 1} 
        variant="ghost"
        size="sm"
        className="p-2 rounded-md hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" 
        aria-label="Reset zoom"
      >
        <RotateCcw className="w-4 h-4 text-gray-300" />
      </Button>
    </div>
  );
};

export default ZoomPanel;