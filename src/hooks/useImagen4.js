import { useState, useCallback } from 'react';
import { toast } from '@/components/ui/use-toast';
import { useCredits } from '@/contexts/CreditsContext';

const useImagen4 = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [generatedImage, setGeneratedImage] = useState(null);
  const [error, setError] = useState(null);
  const [history, setHistory] = useState([]);
  const { credits, checkCredits, deductCredits } = useCredits();

  const generateImage = useCallback(async (prompt, aspectRatio = '1:1') => {
    // Check credits first
    if (!await checkCredits(1)) {
      toast({
        title: "Onvoldoende credits",
        description: "Je hebt niet genoeg credits om deze bewerking uit te voeren.",
        variant: "destructive",
      });
      return { success: false };
    }

    setIsLoading(true);
    setError(null);

    try {
      toast({
        title: "Google Imagen-4 aan het werk... 🎨",
        description: "Je foto wordt gegenereerd met de nieuwste AI-technologie...",
      });

      // Call the proxy server for Google Imagen-4
      const response = await fetch('/api/imagen4-generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: prompt,
          aspectRatio: aspectRatio,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success || !result.imageUrl) {
        throw new Error(result.error || 'Onverwacht resultaat van Google Imagen-4');
      }

      setGeneratedImage(result.imageUrl);
      
      // Add to history
      const historyItem = {
        id: Date.now(),
        prompt: prompt,
        aspectRatio: aspectRatio,
        imageUrl: result.imageUrl,
        timestamp: new Date().toISOString(),
        model: 'google/imagen-4'
      };
      
      const newHistory = [historyItem, ...history.slice(0, 49)]; // Keep last 50 items
      setHistory(newHistory);
      localStorage.setItem('imagen4_history', JSON.stringify(newHistory));

      // Deduct credits
      await deductCredits(1);

      toast({
        title: "Foto succesvol gegenereerd! ✨",
        description: "Je realistische foto is klaar met Google Imagen-4.",
      });

      return { success: true, imageUrl: result.imageUrl };

    } catch (error) {
      console.error('Google Imagen-4 Error:', error);
      setError(error.message);
      
      let errorTitle = "Generatie mislukt";
      let errorDescription = error.message || "Er is een fout opgetreden bij het genereren van de foto.";
      
      // Handle specific error types
      if (error.message.includes('veiligheidsfilters') || error.message.includes('SAFETY')) {
        errorTitle = "Foto geweigerd door veiligheidsfilters";
        errorDescription = "Google Imagen-4 heeft je prompt geweigerd vanwege veiligheidsredenen. Probeer een andere beschrijving.";
      } else if (error.message.includes('credits')) {
        errorTitle = "Onvoldoende credits";
        errorDescription = "Je hebt niet genoeg credits om deze bewerking uit te voeren.";
      } else if (error.message.includes('timeout')) {
        errorTitle = "Time-out fout";
        errorDescription = "De bewerking duurde te lang. Probeer het opnieuw.";
      }
      
      toast({
        title: errorTitle,
        description: errorDescription,
        variant: "destructive",
      });

      return { success: false };
    } finally {
      setIsLoading(false);
    }
  }, [credits, checkCredits, deductCredits, history]);

  const clearHistory = useCallback(() => {
    setHistory([]);
    localStorage.removeItem('imagen4_history');
  }, []);

  const loadHistory = useCallback(() => {
    try {
      const savedHistory = localStorage.getItem('imagen4_history');
      if (savedHistory) {
        setHistory(JSON.parse(savedHistory));
      }
    } catch (error) {
      console.error('Error loading Imagen-4 history:', error);
    }
  }, []);

  return {
    generateImage,
    isLoading,
    generatedImage,
    setGeneratedImage,
    error,
    history,
    clearHistory,
    loadHistory
  };
};

export default useImagen4;