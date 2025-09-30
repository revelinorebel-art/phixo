import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles } from 'lucide-react';

const FilterPanel = ({ onApplyFilter, isLoading }) => {
  const [selectedPresetPrompt, setSelectedPresetPrompt] = useState(null);
  const [customPrompt, setCustomPrompt] = useState('');

  const presets = [
    { name: 'Synthwave', prompt: 'Pas een levendige jaren 80 synthwave esthetiek toe met neon magenta en cyaan gloed, en subtiele scanlijnen.' },
    { name: 'Anime', prompt: 'Geef de afbeelding een levendige Japanse anime stijl, met dikke omlijningen, cel-shading en verzadigde kleuren.' },
    { name: 'Lomo', prompt: 'Pas een Lomografie-stijl cross-processing filmeffect toe met hoog contrast, oververzadigde kleuren en donkere vignettering.' },
    { name: 'Glitch', prompt: 'Transformeer de afbeelding naar een futuristische holografische projectie met digitale glitch effecten en chromatische aberratie.' },
    { name: 'Vintage', prompt: 'Geef de afbeelding een warme vintage look met zachte kleuren en een nostalgische sfeer.' },
    { name: 'Zwart-Wit', prompt: 'Converteer naar een artistieke zwart-wit foto met dramatische contrasten.' }
  ];
  
  const activePrompt = selectedPresetPrompt || customPrompt;

  const handlePresetClick = (prompt) => {
    setSelectedPresetPrompt(prompt);
    setCustomPrompt('');
  };
  
  const handleCustomChange = (e) => {
    setCustomPrompt(e.target.value);
    setSelectedPresetPrompt(null);
  };

  const handleApply = () => {
    if (activePrompt) {
      onApplyFilter(activePrompt);
    }
  };

  return (
    <Card className="bg-transparent border-none shadow-none">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Sparkles className="w-5 h-5" />
          Filters Toepassen
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          {presets.map(preset => (
            <Button
              key={preset.name}
              onClick={() => handlePresetClick(preset.prompt)}
              disabled={isLoading}
              variant={selectedPresetPrompt === preset.prompt ? "default" : "outline"}
              className={`text-sm ${selectedPresetPrompt === preset.prompt ? 'button-glow' : 'glass-effect border-white/20'}`}
            >
              {preset.name}
            </Button>
          ))}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-white">Custom Filter:</label>
          <input
            type="text"
            value={customPrompt}
            onChange={handleCustomChange}
            placeholder="Beschrijf een custom filter (bijv. 'vintage sepia effect')"
            className="w-full bg-slate-800/50 border border-white/20 text-white rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none transition input-glow"
            disabled={isLoading}
          />
        </div>
        
        {activePrompt && (
          <Button
            onClick={handleApply}
            className="w-full button-glow"
            disabled={isLoading || !activePrompt.trim()}
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Filter Toepassen
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default FilterPanel;