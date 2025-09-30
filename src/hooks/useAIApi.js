import { useState, useCallback, useEffect, useRef } from 'react';
    import { toast } from '@/components/ui/use-toast';
    import { useAuth } from '@/contexts/AuthContext';
    // Vertex AI removed - using only Replicate/Nano Banana

    const useAIApi = (initialImageUrl, photoId) => {
        const { userProfile, updateUserData } = useAuth();
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

        const callApi = useCallback(async (operation, params) => {
            if (!userProfile || userProfile.credits < 1) {
                toast({ title: "Onvoldoende credits", description: "Je hebt geen credits meer om bewerkingen uit te voeren.", variant: "destructive" });
                return { success: false };
            }

            setIsLoading(true);
            setError(null);
            
            const operationDescription = params.toastMessage || operation;
            toast({
                title: "AI is aan het werk... 🧠",
                description: `Bezig met uitvoeren van: "${operationDescription}"`,
            });

            try {
                const response = await fetch(resultImageUrl);
                const blob = await response.blob();
                const reader = new FileReader();
                await new Promise((resolve, reject) => {
                  reader.onload = resolve;
                  reader.onerror = reject;
                  reader.readAsDataURL(blob);
                });
                const base64String = reader.result.split(',')[1];
                const mimeType = blob.type;
                
                // Vertex AI removed - this hook is now disabled
                throw new Error("Vertex AI is uitgeschakeld. Gebruik Nano Banana (Replicate) in plaats daarvan.");

            } catch (apiError) {
                console.error('AI API Error:', apiError);
                const errorMessage = apiError.message || "Er is een onbekende fout opgetreden.";
                setError(errorMessage);
                toast({
                    title: "Bewerking Mislukt 😢",
                    description: errorMessage,
                    variant: "destructive",
                });
                return { success: false };
            } finally {
                setIsLoading(false);
            }
        }, [history, currentHistoryIndex, resultImageUrl, userProfile, updateUserData]);

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
            }
        }, [currentHistoryIndex, history.length]);
        
        const canUndo = currentHistoryIndex > 0;
        const canRedo = currentHistoryIndex < history.length - 1;

        return {
            isLoading,
            error,
            resultImageUrl,
            callApi,
            undo,
            redo,
            canUndo,
            canRedo,
            originalImageUrl: history[0],
        };
    };

    export default useAIApi;
