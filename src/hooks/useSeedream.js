import { useState, useEffect } from 'react';
import { toast } from '@/components/ui/use-toast';
import { performSeedreamGeneration, generateCategoryPrompt } from '@/lib/seedream';
import { useAuth } from '@/contexts/AuthContext';

export const useSeedream = () => {
  const [generatedImage, setGeneratedImage] = useState(null);
  const [history, setHistory] = useState([]);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Use Auth Context for user data and Firebase hooks for credits
  const { user, userProfile, updateUserData, refreshUserData } = useAuth();
  
  // Check if user has enough credits
  const checkCredits = (amount) => {
    if (!userProfile || (userProfile.credits || 0) < amount) {
      toast({
        title: "Onvoldoende credits",
        description: `Je hebt ${amount} credit${amount > 1 ? 's' : ''} nodig voor deze actie. Je hebt nog ${userProfile?.credits || 0} credits.`,
        variant: "destructive",
      });
      return false;
    }
    return true;
  };

  // Deduct credits function using Firebase
  const deductCredits = async (amount) => {
    if (!user || !userProfile) return false;
    
    try {
      // Import the database service
      const { databaseService } = await import('@/services/databaseService');
      await databaseService.deductCredits(amount, user.uid);
      
      // Refresh user data to update credits in UI
      if (refreshUserData) {
        await refreshUserData();
      }
      
      return true;
    } catch (error) {
      console.error('Error deducting credits:', error);
      toast({
        title: "Fout bij credits aftrekken",
        description: "Er is een fout opgetreden bij het aftrekken van credits.",
        variant: "destructive",
      });
      return false;
    }
  };

  // Function to automatically save generated image to My Photos
  const saveToMyPhotos = async (imageUrl, prompt, category) => {
    if (!userProfile) return;
    
    try {
      const newPhoto = {
        id: `generated_${Date.now()}`,
        name: `${category} - ${prompt.substring(0, 30)}${prompt.length > 30 ? '...' : ''}`,
        url: imageUrl,
        date: new Date().toISOString(),
        type: 'generated',
        category: category,
        prompt: prompt
      };

      const currentPhotos = userProfile.photos || [];
      const updatedPhotos = [newPhoto, ...currentPhotos];
      
      await updateUserData({ photos: updatedPhotos });
      
      toast({
        title: "Foto opgeslagen! 📸",
        description: "Je gegenereerde afbeelding is automatisch toegevoegd aan Mijn Foto's.",
      });
    } catch (error) {
      console.error('Error saving photo:', error);
      // Don't show error toast as this is a background operation
    }
  };

  // Initialize history from localStorage
  useEffect(() => {
    
    // Load history from localStorage
    const savedHistory = localStorage.getItem('phixo_history');
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (error) {
        console.error('Error loading PHIXO history:', error);
      }
    }
  }, []);

  const callSeedreamApi = async (prompt, aspectRatio = '4:3', category = 'advertentie', imageInput = null, skipEnhancement = false, creditCost = null, objectImage = null, resolution = '1k', originalDimensions = null) => {
    // Calculate credit cost based on resolution if not explicitly provided
    if (creditCost === null) {
      creditCost = resolution === '4k' ? 2 : 1;
    }
    if (isLoading) {
      toast({
        title: "Bezig met genereren",
        description: "Er wordt al een afbeelding gegenereerd. Wacht tot deze klaar is.",
        variant: "destructive",
      });
      return;
    }

    // Check credits using Credits Context
    if (!checkCredits(creditCost)) {
      return;
    }

    setIsLoading(true);
    setError(null);
    
    // Check if user has enough credits before starting
    if (!checkCredits(creditCost)) {
      setIsLoading(false);
      return;
    }
    
    try {
      // Generate category-specific prompt only if not already enhanced
      const enhancedPrompt = skipEnhancement ? prompt : generateCategoryPrompt(category, prompt);
      
      console.log('Starting PHIXO generation with prompt:', enhancedPrompt);
      console.log('Image input provided:', imageInput ? 'Yes' : 'No');
      console.log('Credits deducted:', creditCost);
      
      let result;
      try {
        result = await performSeedreamGeneration(enhancedPrompt, aspectRatio, imageInput, objectImage, resolution, 3, originalDimensions);
      } catch (apiError) {
        console.error('API call failed:', apiError);
        result = { success: false, error: apiError.message };
      }
      
      if (result && result.success && result.imageUrl) {
        setGeneratedImage(result.imageUrl);
        
        // Add to history
        const historyItem = {
          id: Date.now(),
          prompt: prompt,
          enhancedPrompt: enhancedPrompt,
          category: category,
          aspectRatio: aspectRatio,
          resolution: resolution,
          imageUrl: result.imageUrl,
          timestamp: new Date().toISOString(),
          creditsUsed: creditCost
        };
        
        const newHistory = [historyItem, ...history.slice(0, 49)]; // Keep last 50 items
        setHistory(newHistory);
        localStorage.setItem('phixo_history', JSON.stringify(newHistory));
        
        // Deduct credits only after successful generation
        await deductCredits(creditCost);
        
        toast({
          title: "Afbeelding gegenereerd!",
          description: `Succesvol een ${category} afbeelding gemaakt. Credits resterend: ${(userProfile?.credits || 0) - creditCost}`,
        });
        
        // Automatically save to My Photos
        await saveToMyPhotos(result.imageUrl, prompt, category);
        
        return result;
      } else {
        throw new Error('Onverwacht resultaat van de API');
      }
      
    } catch (error) {
      console.error('PHIXO API Error:', error);
      setError(error.message);
      
      toast({
        title: "Generatie mislukt",
        description: `Er is een fout opgetreden bij het genereren. ${error.message || 'Onbekende fout'}`,
        variant: "destructive",
      });
      
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('phixo_history');
    toast({
      title: "Geschiedenis gewist",
      description: "Alle PHIXO geschiedenis is verwijderd.",
    });
  };

  const removeFromHistory = (imageUrl) => {
    console.log('🗑️ Removing from useSeedream history:', imageUrl);
    const updatedHistory = history.filter(item => item.imageUrl !== imageUrl);
    setHistory(updatedHistory);
    localStorage.setItem('phixo_history', JSON.stringify(updatedHistory));
    console.log('✅ Updated useSeedream history, remaining items:', updatedHistory.length);
  };



  const downloadImage = async (imageUrl, filename = 'phixo_generated_image.jpg') => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Download gestart",
        description: "De afbeelding wordt gedownload.",
      });
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: "Download mislukt",
        description: "Er is een fout opgetreden bij het downloaden van de afbeelding.",
        variant: "destructive",
      });
    }
  };

  const regenerateFromHistory = async (historyItem) => {
    return await callSeedreamApi(
      historyItem.prompt, 
      historyItem.aspectRatio, 
      historyItem.category,
      null, // imageInput
      true, // skipEnhancement
      null, // creditCost (will be calculated based on resolution)
      null, // objectImage
      historyItem.resolution || '1k', // resolution with fallback
      null // originalDimensions (not available from history)
    );
  };

  return {
    // State
    isLoading,
    generatedImage,
    history,
    credits: userProfile?.credits || 0,
    error,
    
    // Actions
    callSeedreamApi,
    clearHistory,
    removeFromHistory,
    downloadImage,
    regenerateFromHistory,
    
    // Setters
    setGeneratedImage,
    setError
  };
};