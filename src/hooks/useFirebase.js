import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { databaseService } from '../services/databaseService';
import { storageService } from '../services/storageService';
import { useToast } from '@/components/ui/use-toast';

// Hook for credits management
export const useCredits = () => {
  const { user, userProfile, refreshUserData } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const deductCredits = useCallback(async (amount) => {
    if (!user) {
      throw new Error('User must be authenticated');
    }

    setLoading(true);
    try {
      const result = await databaseService.deductCredits(amount);
      await refreshUserData(); // Refresh user data to update credits
      return result;
    } catch (error) {
      toast({
        title: "Credits fout",
        description: error.message,
        variant: "destructive"
      });
      throw error;
    } finally {
      setLoading(false);
    }
  }, [user, refreshUserData, toast]);

  const addCredits = useCallback(async (amount, reason = 'manual') => {
    if (!user) {
      throw new Error('User must be authenticated');
    }

    setLoading(true);
    try {
      const result = await databaseService.addCredits(amount, reason);
      await refreshUserData(); // Refresh user data to update credits
      toast({
        title: "Credits toegevoegd",
        description: `${amount} credits zijn toegevoegd aan je account.`
      });
      return result;
    } catch (error) {
      toast({
        title: "Credits fout",
        description: error.message,
        variant: "destructive"
      });
      throw error;
    } finally {
      setLoading(false);
    }
  }, [user, refreshUserData, toast]);

  const getCreditHistory = useCallback(async (limit = 50) => {
    if (!user) return [];

    try {
      return await databaseService.getCreditHistory(user.uid, limit);
    } catch (error) {
      console.error('Error fetching credit history:', error);
      return [];
    }
  }, [user]);

  return {
    credits: userProfile?.credits || 0,
    totalCreditsUsed: userProfile?.totalCreditsUsed || 0,
    deductCredits,
    addCredits,
    getCreditHistory,
    loading,
    hasCredits: (amount = 1) => (userProfile?.credits || 0) >= amount
  };
};

// Hook for image storage
export const useImageStorage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const uploadImage = useCallback(async (file) => {
    if (!user) {
      throw new Error('User must be authenticated');
    }

    // Validate file
    const validation = storageService.validateImageFile(file);
    if (!validation.isValid) {
      const errorMessage = validation.errors.join(', ');
      toast({
        title: "Ongeldige afbeelding",
        description: errorMessage,
        variant: "destructive"
      });
      throw new Error(errorMessage);
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      const result = await storageService.uploadImage(file, (progress) => {
        setUploadProgress(progress);
      });

      toast({
        title: "Upload succesvol",
        description: "Je afbeelding is succesvol geüpload."
      });

      return result;
    } catch (error) {
      toast({
        title: "Upload mislukt",
        description: error.message,
        variant: "destructive"
      });
      throw error;
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  }, [user, toast]);

  const saveGeneratedImage = useCallback(async (imageUrl, prompt) => {
    if (!user) {
      throw new Error('User must be authenticated');
    }

    try {
      const result = await storageService.uploadGeneratedImage(imageUrl, prompt, user.uid);
      
      toast({
        title: "Afbeelding opgeslagen",
        description: "Je gegenereerde afbeelding is opgeslagen in je gallerij."
      });

      return result;
    } catch (error) {
      toast({
        title: "Opslaan mislukt",
        description: error.message,
        variant: "destructive"
      });
      throw error;
    }
  }, [user, toast]);

  const deleteImage = useCallback(async (imagePath) => {
    if (!user) {
      throw new Error('User must be authenticated');
    }

    try {
      await storageService.deleteImage(imagePath);
      
      toast({
        title: "Afbeelding verwijderd",
        description: "De afbeelding is succesvol verwijderd."
      });

      return true;
    } catch (error) {
      toast({
        title: "Verwijderen mislukt",
        description: error.message,
        variant: "destructive"
      });
      throw error;
    }
  }, [user, toast]);

  const getUserImages = useCallback(async () => {
    if (!user) return [];

    try {
      return await storageService.getUserImages(user.uid);
    } catch (error) {
      console.error('Error fetching user images:', error);
      toast({
        title: "Fout bij ophalen afbeeldingen",
        description: error.message,
        variant: "destructive"
      });
      return [];
    }
  }, [user, toast]);

  return {
    uploadImage,
    saveGeneratedImage,
    deleteImage,
    getUserImages,
    uploading,
    uploadProgress,
    validateFile: storageService.validateImageFile.bind(storageService),
    fileToBase64: storageService.fileToBase64.bind(storageService)
  };
};

// Hook for image generation history
export const useImageHistory = () => {
  const { user } = useAuth();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  const saveImageGeneration = useCallback(async (imageData) => {
    if (!user) {
      throw new Error('User must be authenticated');
    }

    try {
      const result = await databaseService.saveImageGeneration(imageData, user.uid);
      
      // Update local history
      setHistory(prev => [result, ...prev]);
      
      return result;
    } catch (error) {
      console.error('Error saving image generation:', error);
      throw error;
    }
  }, [user]);

  const loadHistory = useCallback(async (limit = 20) => {
    if (!user) {
      setHistory([]);
      return;
    }

    setLoading(true);
    try {
      const historyData = await databaseService.getImageHistory(user.uid, limit);
      setHistory(historyData);
    } catch (error) {
      console.error('Error loading image history:', error);
      setHistory([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  return {
    history,
    loading,
    saveImageGeneration,
    refreshHistory: loadHistory
  };
};

// Hook for user analytics
export const useUserAnalytics = () => {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);

  const loadAnalytics = useCallback(async () => {
    if (!user) {
      setAnalytics(null);
      return;
    }

    setLoading(true);
    try {
      const analyticsData = await databaseService.getUserAnalytics(user.uid);
      setAnalytics(analyticsData);
    } catch (error) {
      console.error('Error loading analytics:', error);
      setAnalytics(null);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  return {
    analytics,
    loading,
    refreshAnalytics: loadAnalytics
  };
};

// Hook for subscription management (for future Stripe integration)
export const useSubscription = () => {
  const { user, userProfile } = useAuth();
  const { toast } = useToast();

  const updateSubscription = useCallback(async (subscriptionData) => {
    if (!user) {
      throw new Error('User must be authenticated');
    }

    try {
      await databaseService.updateSubscription(subscriptionData, user.uid);
      
      toast({
        title: "Abonnement bijgewerkt",
        description: "Je abonnement is succesvol bijgewerkt."
      });

      return true;
    } catch (error) {
      toast({
        title: "Abonnement update mislukt",
        description: error.message,
        variant: "destructive"
      });
      throw error;
    }
  }, [user, toast]);

  const getSubscription = useCallback(async () => {
    if (!user) return null;

    try {
      return await databaseService.getSubscription(user.uid);
    } catch (error) {
      console.error('Error fetching subscription:', error);
      return null;
    }
  }, [user]);

  return {
    subscription: userProfile?.subscription || null,
    updateSubscription,
    getSubscription,
    isPro: userProfile?.subscription?.plan === 'pro',
    isActive: userProfile?.subscription?.status === 'active'
  };
};