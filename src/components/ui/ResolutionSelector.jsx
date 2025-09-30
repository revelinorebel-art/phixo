import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Monitor, Zap, Crown } from 'lucide-react';

const ResolutionSelector = ({ 
  selectedResolution, 
  onResolutionChange, 
  className = "",
  showCreditCost = true 
}) => {
  const resolutionOptions = [
    {
      value: '1k',
      label: '1K',
      description: '1024px',
      credits: 1,
      icon: Monitor,
      popular: false
    },
    {
      value: '2k',
      label: '2K',
      description: '2048px',
      credits: 1,
      icon: Zap,
      popular: true
    },
    {
      value: '4k',
      label: '4K',
      description: '4096px',
      credits: 2,
      icon: Crown,
      popular: false
    }
  ];

  const getDisplayValue = () => {
    const option = resolutionOptions.find(opt => opt.value === selectedResolution);
    if (!option) return '';
    
    let display = option.label;
    if (option.popular) display += ' - Populair';
    if (showCreditCost) display += ` - ${option.credits} credit${option.credits > 1 ? 's' : ''}`;
    
    return display;
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <Label htmlFor="resolution">Resolutie</Label>
      <Select value={selectedResolution} onValueChange={onResolutionChange}>
        <SelectTrigger className="input-glow">
          <SelectValue placeholder="Selecteer resolutie">
            {getDisplayValue()}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {resolutionOptions.map((option) => {
            const Icon = option.icon;
            return (
              <SelectItem key={option.value} value={option.value}>
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4" />
                  <span>
                    {option.label}
                    {option.popular && <span className="text-orange-400 ml-1">- Populair</span>}
                    {showCreditCost && <span className="text-gray-400 ml-1">- {option.credits} credit{option.credits > 1 ? 's' : ''}</span>}
                  </span>
                </div>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
    </div>
  );
};

export default ResolutionSelector;