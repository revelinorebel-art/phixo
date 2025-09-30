import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings } from 'lucide-react';

const AdjustmentPanel = ({ onApplyAdjustment, isLoading }) => {
  const [selectedPresetPrompt, setSelectedPresetPrompt] = useState(null);
  const [customPrompt, setCustomPrompt] = useState('');

  const presets = [
    { name: 'Achtergrond Vervagen', prompt: 'Pas een realistische scherptediepte-effect toe, maak de achtergrond wazig terwijl het hoofdonderwerp scherp blijft.' },
    { name: 'Details Verbeteren', prompt: 'Verbeter de scherpte en details van de afbeelding lichtjes zonder het onnatuurlijk te laten lijken.' },
    { name: 'Warmere Belichting', prompt: 'Pas de kleurtemperatuur aan om de afbeelding warmere, gouden-uur stijl belichting te geven.' },
    { name: 'Studio Licht', prompt: 'Voeg dramatische, professionele studio belichting toe aan het hoofdonderwerp.' },
    { name: 'Contrast Verhogen', prompt: 'Verhoog het contrast voor een meer dramatische en levendige uitstraling.' },
    { name: 'Kleuren Verzadigen', prompt: 'Verhoog de kleurverzadiging voor meer levendige en opvallende kleuren.' }
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
      onApplyAdjustment(activePrompt);
    }
  };

  return (
    <Card className="bg-transparent border-none shadow-none">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Settings className="w-5 h-5" />
          Professionele Aanpassingen
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
          <label className="text-sm font-medium text-white">Custom Aanpassing:</label>
          <input
            type="text"
            value={customPrompt}
            onChange={handleCustomChange}
            placeholder="Beschrijf een aanpassing (bijv. 'verander achtergrond naar een bos')"
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
            <Settings className="w-4 h-4 mr-2" />
            Aanpassing Toepassen
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default AdjustmentPanel;