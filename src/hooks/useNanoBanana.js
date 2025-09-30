import { useState, useCallback, useEffect } from 'react';
import { toast } from '@/components/ui/use-toast';
import { performNanoBananaEdit, uploadImageForNanoBanana } from '@/lib/nano-banana';
import { performSeedreamGeneration } from '@/lib/seedream';
import { useAuth } from '@/contexts/AuthContext';

const useNanoBanana = (initialImageUrl, photoId) => {
    const { user, userProfile } = useAuth();
    
    // Get credits from userProfile
    const credits = userProfile?.credits || 0;
    
    // Check if user has enough credits
    const checkCredits = (amount) => {
        if (!userProfile || credits < amount) {
            return false;
        }
        return true;
    };

    // Deduct credits function using Firebase
    const deductCredits = async (amount) => {
        if (!user || !userProfile) return false;
        
        try {
            const { databaseService } = await import('@/services/databaseService');
            await databaseService.deductCredits(user.uid, amount);
            return true;
        } catch (error) {
            console.error('Error deducting credits:', error);
            return false;
        }
    };
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    
    const [history, setHistory] = useState([]);
    const [currentHistoryIndex, setCurrentHistoryIndex] = useState(-1);

    useEffect(() => {
        if (initialImageUrl) {
            setHistory([initialImageUrl]);
            setCurrentHistoryIndex(0);
        }
    }, [initialImageUrl]);

    const resultImageUrl = history[currentHistoryIndex] || initialImageUrl;

    const callNanoBananaApi = useCallback(async (prompt, params = {}) => {
        if (!checkCredits(1)) {
            toast({ 
                title: "Onvoldoende credits", 
                description: "Je hebt niet genoeg credits om deze bewerking uit te voeren.",
                variant: "destructive",
            });
            return;
        }

        setIsLoading(true);
        setError(null);
        
        const operationDescription = params.toastMessage || 'PHIXO bewerking';
        toast({
            title: "PHIXO AI is aan het werk... ✨",
            description: `Bezig met uitvoeren van: "${operationDescription}"`,
        });

        try {
            // Use baseImage if provided (for masking), otherwise use current result image
            let baseImageUrl = params.baseImage || resultImageUrl;
            let imageInputArray = [baseImageUrl];
            
            // Add any additional images from params
            if (params.additionalImages && Array.isArray(params.additionalImages)) {
                imageInputArray = [baseImageUrl, ...params.additionalImages];
            }
            
            console.log(`Using ${imageInputArray.length} images for Nano Banana edit:`, imageInputArray);
            
            // Add hotspot coordinates to prompt if provided with improved precision
            let enhancedPrompt = prompt;
            if (params.hotspot) {
                enhancedPrompt = `${prompt} (please enhance the specific area at position x=${params.hotspot.x}, y=${params.hotspot.y} while preserving the rest of the image)`;
                console.log('Enhanced prompt with precise hotspot coordinates:', enhancedPrompt);
            }
            
            const result = await performNanoBananaEdit(
                enhancedPrompt, 
                imageInputArray, 
                params.outputFormat || 'jpg',
                3, // retries
                params.hotspot // pass hotspot coordinates
            );
            
            if (!result.success || !result.imageUrl) {
                throw new Error("Nano Banana heeft geen geldig afbeeldingsresultaat teruggegeven.");
            }

            const newImageUrl = result.imageUrl;

            // Voeg het nieuwe resultaat toe aan de geschiedenis
            const newHistory = history.slice(0, currentHistoryIndex + 1);
            newHistory.push(newImageUrl);
            setHistory(newHistory);
            setCurrentHistoryIndex(newHistory.length - 1);
            
            // Deduct credits
            await deductCredits(1);

            toast({
                title: "PHIXO bewerking geslaagd! ✨",
                description: `Operatie "${operationDescription}" succesvol uitgevoerd.`,
            });
            
            return { success: true, newUrl: newImageUrl, data: result.data };

        } catch (apiError) {
            console.error('Nano Banana API Error:', apiError);
            
            // Geen fallback naar andere AI-modellen, alleen Nano Banana gebruiken
            if (apiError.message.includes('veiligheidsfilters') || 
                apiError.message.includes('IMAGE_SAFETY') || 
                apiError.message.includes('SENSITIVE_CONTENT_DETECTED') ||
                apiError.message.includes('E005') ||
                apiError.message.includes('flagged as sensitive')) {
                
                console.log('Nano Banana veiligheidsfilter geactiveerd, geen fallback gebruiken');
                
                const errorMessage = "De afbeelding werd geweigerd door de veiligheidsfilters van Nano Banana. Probeer een andere prompt of afbeelding.";
                setError(errorMessage);
                
                toast({
                    title: "Nano Banana bewerking mislukt 😢",
                    description: "De afbeelding werd geweigerd door veiligheidsfilters. Probeer een andere prompt of afbeelding.",
                    variant: "destructive",
                });
                
                return { success: false };
            }
            
            // Provide more user-friendly error messages
            let userFriendlyMessage = "Er is een onbekende fout opgetreden.";
            let errorTitle = "PHIXO bewerking mislukt 😢";
            
            if (apiError.message.includes('timeout') || apiError.message.includes('fetch')) {
                userFriendlyMessage = "Verbinding met de server is verloren. Controleer je internetverbinding en probeer opnieuw.";
                errorTitle = "Verbindingsfout 🌐";
            } else if (apiError.message.includes('proxy server')) {
                userFriendlyMessage = "De Nano Banana service is momenteel niet beschikbaar. Probeer het later opnieuw.";
                errorTitle = "Service niet beschikbaar 🔧";
            } else if (apiError.message.includes('credits') || apiError.message.includes('insufficient')) {
                userFriendlyMessage = "Je hebt onvoldoende credits voor deze bewerking.";
                errorTitle = "Onvoldoende credits 💳";
            } else if (apiError.message.includes('E005') || apiError.message.includes('sensitive')) {
                userFriendlyMessage = "De content werd als gevoelig gemarkeerd. Probeer een andere prompt of afbeelding.";
                errorTitle = "Content geweigerd 🚫";
            } else {
                userFriendlyMessage = apiError.message || "Er is een onbekende fout opgetreden.";
            }
            
            setError(userFriendlyMessage);
            toast({
                title: errorTitle,
                description: userFriendlyMessage,
                variant: "destructive",
            });
            return { success: false };
        } finally {
            setIsLoading(false);
        }
    }, [history, currentHistoryIndex, resultImageUrl, credits, deductCredits, checkCredits]);

    const undo = useCallback(() => {
        if (currentHistoryIndex > 0) {
            setCurrentHistoryIndex(prevIndex => prevIndex - 1);
            toast({
                title: "Actie ongedaan gemaakt",
                description: "Terug naar vorige staat.",
            });
        }
    }, [currentHistoryIndex]);

    const redo = useCallback(() => {
        if (currentHistoryIndex < history.length - 1) {
            setCurrentHistoryIndex(prevIndex => prevIndex + 1);
            toast({
                title: "Actie opnieuw uitgevoerd",
                description: "Vooruit naar volgende staat.",
            });
        }
    }, [currentHistoryIndex, history.length]);
    
    const canUndo = currentHistoryIndex > 0;
    const canRedo = currentHistoryIndex < history.length - 1;

    return {
        isLoading,
        error,
        resultImageUrl,
        callNanoBananaApi,
        undo,
        redo,
        canUndo,
        canRedo,
        originalImageUrl: history[0],
        credits,
    };
};

export default useNanoBanana;