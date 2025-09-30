import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Crop } from 'lucide-react';

const CropPanel = ({ onApplyCrop, onSetAspect, isLoading, isCropping }) => {
  const [activeAspect, setActiveAspect] = useState('free');
  
  const handleAspectChange = (aspect, value) => {
    setActiveAspect(aspect);
    onSetAspect(value);
  }

  const aspects = [
    { name: 'free', value: undefined, label: 'Vrij' },
    { name: '1:1', value: 1 / 1, label: '1:1' },
    { name: '16:9', value: 16 / 9, label: '16:9' },
    { name: '4:3', value: 4 / 3, label: '4:3' },
    { name: '3:2', value: 3 / 2, label: '3:2' }
  ];

  return (
    <Card className="bg-transparent border-none shadow-none">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Crop className="w-5 h-5" />
          Afbeelding Bijsnijden
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-gray-400">
          Klik en sleep op de afbeelding om een bijsnijdgebied te selecteren.
        </p>
        
        <div className="space-y-2">
          <label className="text-sm font-medium text-white">Beeldverhouding:</label>
          <div className="grid grid-cols-3 gap-2">
            {aspects.map(({ name, value, label }) => (
              <Button
                key={name}
                onClick={() => handleAspectChange(name, value)}
                disabled={isLoading}
                variant={activeAspect === name ? "default" : "outline"}
                className={`text-sm ${activeAspect === name ? 'button-glow' : 'glass-effect border-white/20'}`}
              >
                {label}
              </Button>
            ))}
          </div>
        </div>

        <Button
          onClick={onApplyCrop}
          disabled={isLoading || !isCropping}
          className="w-full button-glow"
        >
          <Crop className="w-4 h-4 mr-2" />
          Bijsnijden Toepassen
        </Button>
      </CardContent>
    </Card>
  );
};

export default CropPanel;