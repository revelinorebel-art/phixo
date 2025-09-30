import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from '@/components/ui/use-toast';

const CreditsContext = createContext();

export const useCredits = () => {
  const context = useContext(CreditsContext);
  if (!context) {
    throw new Error('useCredits must be used within a CreditsProvider');
  }
  return context;
};

export const CreditsProvider = ({ children }) => {
  const [credits, setCredits] = useState(100); // Default credits
  const [isLoading, setIsLoading] = useState(false);

  // Initialize credits from localStorage
  useEffect(() => {
    const savedCredits = localStorage.getItem('phixo_credits');
    if (savedCredits) {
      setCredits(parseInt(savedCredits, 10));
    }
  }, []);

  // Update localStorage whenever credits change
  useEffect(() => {
    localStorage.setItem('phixo_credits', credits.toString());
  }, [credits]);

  const deductCredits = (amount = 1) => {
    if (credits < amount) {
      toast({
        title: "Geen credits meer",
        description: "Je hebt niet genoeg credits om deze actie uit te voeren.",
        variant: "destructive",
      });
      return false;
    }

    const newCredits = credits - amount;
    setCredits(newCredits);
    
    toast({
      title: "Credit gebruikt",
      description: `${amount} credit${amount > 1 ? 's' : ''} gebruikt. Resterend: ${newCredits}`,
    });
    
    return true;
  };

  const addCredits = (amount) => {
    const newCredits = credits + amount;
    setCredits(newCredits);
    toast({
      title: "Credits toegevoegd",
      description: `${amount} credits toegevoegd. Totaal: ${newCredits}`,
    });
  };

  const resetCredits = () => {
    setCredits(100);
    toast({
      title: "Credits gereset",
      description: "Credits zijn gereset naar 100.",
    });
  };

  const checkCredits = (amount = 1) => {
    return credits >= amount;
  };

  const value = {
    credits,
    isLoading,
    setIsLoading,
    deductCredits,
    addCredits,
    resetCredits,
    checkCredits,
    setCredits
  };

  return (
    <CreditsContext.Provider value={value}>
      {children}
    </CreditsContext.Provider>
  );
};

export default CreditsContext;