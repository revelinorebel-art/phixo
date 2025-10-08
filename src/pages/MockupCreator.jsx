import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Helmet } from 'react-helmet';
import { Link, useNavigate } from 'react-router-dom';
import { Layers, Sparkles, ArrowLeft, FileUp, Wand2, Lightbulb, Download, BookOpen, Loader2, X, RefreshCw, Edit3, Undo, Redo, Image } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

import useNanoBanana from '@/hooks/useNanoBanana';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';
import Sidebar from '@/components/Layout/Sidebar';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ReactCompareSlider, ReactCompareSliderImage } from 'react-compare-slider';
import { BackgroundGradient } from '@/components/ui/background-gradient';
import LoadingAnimation from '@/components/ui/loading-animation';
import { getCategoryPromptSuggestions } from '@/lib/nano-banana';
import { getAspectRatioOptions } from '@/lib/seedream';
import ResolutionSelector from '@/components/ui/ResolutionSelector';
import { autoSaveService } from '@/services/autoSaveService';

const MockupCreator = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // State for iterative editing - must be defined before useNanoBanana
  const [isEditingMode, setIsEditingMode] = useState(false);
  const [showEditAnimation, setShowEditAnimation] = useState(false);
  const [baseGeneratedImage, setBaseGeneratedImage] = useState(null);
  const [originalImages, setOriginalImages] = useState(null);
  const [isInitialLoading, setIsInitialLoading] = useState(false);
  
  // Initialize with baseGeneratedImage for dynamic input images
  const {
    isLoading,
    resultImageUrl: generatedImage,
    callNanoBananaApi,
    undo,
    redo,
    canUndo,
    canRedo,
    originalImageUrl,
    credits
  } = useNanoBanana(baseGeneratedImage, 'mockup-creator');
  
  // State for multiple images (up to 4)
  const [images, setImages] = useState({
    image1: { file: null, preview: null, selected: true },
    image2: { file: null, preview: null, selected: true },
    image3: { file: null, preview: null, selected: true },
    image4: { file: null, preview: null, selected: true }
  });
  
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState('1:1'); // Changed default to 1:1
  const [resolution, setResolution] = useState('1k');
  
  // Drag & Drop state
  const [draggedOver, setDraggedOver] = useState(null);
  
  // Recent photos state
  const [recentPhotos, setRecentPhotos] = useState([]);
  const [loadingRecentPhotos, setLoadingRecentPhotos] = useState(false);
  const [draggedPhoto, setDraggedPhoto] = useState(null);

  // Get uploaded images count
  const getUploadedImagesCount = () => {
    return Object.values(images).filter(img => img.file !== null).length;
  };

  // Get all uploaded files for processing
  const getUploadedFiles = () => {
    return Object.values(images)
      .filter(img => img.file !== null && img.selected)
      .map(img => img.file);
  };
  
  // Get count of selected images
  const getSelectedImagesCount = () => {
    return Object.values(images).filter(img => img.file !== null && img.selected).length;
  };

  // Get first uploaded image preview for comparison slider
  const getFirstImagePreview = () => {
    const firstImage = Object.values(images).find(img => img.preview !== null);
    return firstImage ? firstImage.preview : null;
  };

  // Load recent photos from autoSaveService
  const loadRecentPhotos = async () => {
    if (!user) {
      setRecentPhotos([]);
      return;
    }

    try {
      setLoadingRecentPhotos(true);
      console.log('🔄 MockupCreator: Loading recent photos...');
      
      const photos = await autoSaveService.getRecentPhotos(8); // Load 8 recent photos
      console.log('✅ MockupCreator: Loaded photos:', photos.length);
      
      setRecentPhotos(photos);
    } catch (error) {
      console.error('❌ MockupCreator: Error loading recent photos:', error);
      setRecentPhotos([]);
    } finally {
      setLoadingRecentPhotos(false);
    }
  };

  // Load recent photos when component mounts or user changes
  useEffect(() => {
    loadRecentPhotos();
  }, [user]);

  // Handle file upload for specific image slot
  const handleFileChange = (event, imageKey) => {
    const file = event.target.files[0];
    if (file) {
      processFile(file, imageKey);
    }
  };

  // Process file (used by both file input and drag & drop)
  const processFile = (file, imageKey) => {
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Ongeldig bestand",
        description: "Selecteer alleen afbeeldingsbestanden.",
        variant: "destructive"
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      toast({
        title: "Bestand te groot",
        description: "Selecteer een afbeelding kleiner dan 10MB.",
        variant: "destructive"
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setImages(prev => ({
        ...prev,
        [imageKey]: {
          file: file,
          preview: e.target.result,
          selected: prev[imageKey].selected
        }
      }));
    };
    reader.readAsDataURL(file);
  };

  // Drag & Drop event handlers
  const handleDragOver = (e, imageKey) => {
    e.preventDefault();
    e.stopPropagation();
    setDraggedOver(imageKey);
  };

  const handleDragLeave = (e, imageKey) => {
    e.preventDefault();
    e.stopPropagation();
    // Only clear if we're leaving the actual drop zone
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setDraggedOver(null);
    }
  };

  const handleDrop = async (e, imageKey) => {
    e.preventDefault();
    e.stopPropagation();
    setDraggedOver(null);

    try {
      // Check if it's a photo being dragged from recent photos
      if (draggedPhoto) {
        console.log('🔄 Dropping recent photo:', draggedPhoto.name);
        
        // Validate photo data
        if (!draggedPhoto.url) {
          throw new Error('Foto URL ontbreekt');
        }
        
        await processPhotoFromUrl(draggedPhoto.url, imageKey);
        setDraggedPhoto(null);
        return;
      }

      // Handle file drop
      const files = Array.from(e.dataTransfer.files);
      if (files.length === 0) {
        toast({
          title: "Geen bestanden gevonden",
          description: "Sleep een afbeelding naar dit gebied.",
          variant: "destructive"
        });
        return;
      }

      if (files.length > 1) {
        toast({
          title: "Te veel bestanden",
          description: "Sleep slechts één afbeelding tegelijk.",
          variant: "destructive"
        });
        return;
      }

      const file = files[0];
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Ongeldig bestandstype",
          description: "Sleep alleen afbeeldingen (JPG, PNG, etc.).",
          variant: "destructive"
        });
        return;
      }

      console.log('🔄 Processing dropped file:', file.name);
      processFile(file, imageKey);
      
    } catch (error) {
      console.error('❌ Error in handleDrop:', error);
      toast({
        title: "Fout bij slepen",
        description: error.message || "Er is een fout opgetreden bij het slepen van de foto.",
        variant: "destructive"
      });
      
      // Clean up drag state
      setDraggedPhoto(null);
    }
  };

  // Handle drag start for recent photos
  const handlePhotoDragStart = (e, photo) => {
    try {
      console.log('🔄 Starting drag for photo:', photo.name);
      
      // Validate photo data
      if (!photo || !photo.url) {
        console.error('❌ Invalid photo data for drag:', photo);
        toast({
          title: "Fout bij slepen",
          description: "Deze foto kan niet gesleept worden.",
          variant: "destructive"
        });
        e.preventDefault();
        return;
      }
      
      setDraggedPhoto(photo);
      e.dataTransfer.effectAllowed = 'copy';
      
      // Add visual feedback
      e.target.style.opacity = '0.7';
      
    } catch (error) {
      console.error('❌ Error in handlePhotoDragStart:', error);
      e.preventDefault();
    }
  };

  const handlePhotoDragEnd = (e) => {
    try {
      console.log('🔄 Ending drag operation');
      setDraggedPhoto(null);
      
      // Reset visual feedback
      if (e && e.target) {
        e.target.style.opacity = '1';
      }
      
    } catch (error) {
      console.error('❌ Error in handlePhotoDragEnd:', error);
      // Always clean up drag state even if there's an error
      setDraggedPhoto(null);
    }
  };

  // Process photo from URL (for drag & drop from recent photos)
  const processPhotoFromUrl = async (photoUrl, imageKey) => {
    try {
      console.log('🔄 Processing photo from URL:', photoUrl);
      
      let response;
      let blob;
      
      // For Firebase Storage URLs, use our proxy server to avoid CORS issues
      if (photoUrl.includes('firebasestorage.googleapis.com')) {
        console.log('🔄 Detected Firebase Storage URL, using proxy...');
        try {
          const proxyUrl = `http://localhost:3001/api/fetch-image?url=${encodeURIComponent(photoUrl)}`;
          response = await fetch(proxyUrl);
          
          if (response.ok) {
            blob = await response.blob();
            
            // Validate blob size and type
            if (blob.size === 0) {
              throw new Error('Proxy returned empty image data');
            }
            
            if (!blob.type.startsWith('image/')) {
              console.warn('⚠️ Proxy returned non-image content type:', blob.type);
              // Still proceed as it might be a valid image
            }
            
            console.log('✅ Firebase proxy fetch successful:', blob.size, 'bytes, type:', blob.type);
          } else {
            const errorText = await response.text().catch(() => 'Unknown error');
            throw new Error(`Proxy server error (${response.status}): ${errorText}`);
          }
        } catch (proxyError) {
          console.error('❌ Firebase Storage proxy fetch failed:', proxyError.message);
          
          // Show specific error message for proxy issues
          toast({
            title: "Proxy server probleem",
            description: `Kan Firebase Storage afbeelding niet ophalen via proxy: ${proxyError.message}`,
            variant: "destructive"
          });
          
          throw proxyError; // Re-throw to trigger fallback
        }
      } else {
        // For other URLs, try direct fetch first
        try {
          response = await fetch(photoUrl, {
            mode: 'cors',
            credentials: 'omit'
          });
          
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          
          blob = await response.blob();
          
          // Validate blob
          if (blob.size === 0) {
            throw new Error('Received empty image data');
          }
          
          if (!blob.type.startsWith('image/')) {
            console.warn('⚠️ Non-image content type received:', blob.type);
          }
          
          console.log('✅ Direct fetch successful:', blob.size, 'bytes, type:', blob.type);
          
        } catch (fetchError) {
          console.error('❌ Direct fetch failed:', fetchError.message);
          
          // Check if it's a CORS error
          if (fetchError.name === 'TypeError' && fetchError.message.includes('CORS')) {
            toast({
              title: "CORS probleem",
              description: "Kan afbeelding niet laden vanwege CORS-beperkingen. Probeer de afbeelding eerst te downloaden.",
              variant: "destructive"
            });
          } else {
            toast({
              title: "Afbeelding laden mislukt",
              description: `Kan afbeelding niet ophalen: ${fetchError.message}`,
              variant: "destructive"
            });
          }
          
          throw fetchError;
        }
      }
      
      // Create a File object from the blob
      const file = new File([blob], 'recent-photo.jpg', { 
        type: blob.type || 'image/jpeg',
        lastModified: Date.now()
      });
      
      console.log('✅ Created file from blob:', file.size, 'bytes');
      
      // For Firebase Storage URLs, set the preview to use the proxy URL
      const previewUrl = photoUrl.includes('firebasestorage.googleapis.com') 
        ? `http://localhost:3001/api/fetch-image?url=${encodeURIComponent(photoUrl)}`
        : URL.createObjectURL(blob);
      
      // Set the image with the correct preview URL
      setImages(prev => ({
        ...prev,
        [imageKey]: {
          file: file,
          preview: previewUrl,
          selected: prev[imageKey].selected
        }
      }));
      
      toast({
        title: "Foto toegevoegd",
        description: "Recente foto is succesvol toegevoegd aan de upload area.",
      });
      
    } catch (error) {
      console.error('❌ Error processing photo from URL:', error);
      
      // Don't show duplicate toast if we already showed one for specific errors
      const isSpecificError = error.message.includes('Proxy server error') || 
                             error.message.includes('HTTP') ||
                             error.message.includes('CORS');
      
      if (!isSpecificError) {
        toast({
          title: "Foto verwerking mislukt",
          description: `Kan foto niet verwerken: ${error.message}`,
          variant: "destructive"
        });
      }
      
      // Fallback: try canvas-based approach for CORS-protected images
      try {
        console.log('🔄 Trying canvas fallback method...');
        
        // Create an image element to load the photo
        const img = document.createElement('img');
        img.crossOrigin = 'anonymous'; // Enable CORS
        
        // Create a promise to handle image loading
        const imageLoadPromise = new Promise((resolve, reject) => {
          img.onload = () => {
            try {
              console.log('✅ Image loaded for canvas:', img.naturalWidth, 'x', img.naturalHeight);
              
              // Create a canvas to convert the image to blob
              const canvas = document.createElement('canvas');
              const ctx = canvas.getContext('2d');
              
              // Set canvas dimensions to match image
              canvas.width = img.naturalWidth || img.width;
              canvas.height = img.naturalHeight || img.height;
              
              // Draw the image on canvas
              ctx.drawImage(img, 0, 0);
              
              // Convert canvas to blob
              canvas.toBlob((blob) => {
                if (blob && blob.size > 0) {
                  console.log('✅ Canvas conversion successful:', blob.size, 'bytes');
                  resolve(blob);
                } else {
                  reject(new Error('Failed to convert image to blob or blob is empty'));
                }
              }, 'image/jpeg', 0.9);
            } catch (canvasError) {
              console.error('Canvas processing error:', canvasError);
              reject(canvasError);
            }
          };
          
          img.onerror = (error) => {
            console.error('Image load error:', error);
            reject(new Error('Failed to load image from URL'));
          };
        });
        
        // Start loading the image
        img.src = photoUrl;
        
        // Wait for the image to load and convert to blob
        const blob = await imageLoadPromise;
        
        // Create a File object from the blob
        const file = new File([blob], 'recent-photo.jpg', { type: 'image/jpeg' });
        
        // For Firebase Storage URLs, set the preview to use the proxy URL
        const previewUrl = photoUrl.includes('firebasestorage.googleapis.com') 
          ? `http://localhost:3001/api/fetch-image?url=${encodeURIComponent(photoUrl)}`
          : URL.createObjectURL(blob);
        
        // Set the image with the correct preview URL
        setImages(prev => ({
          ...prev,
          [imageKey]: {
            file: file,
            preview: previewUrl,
            selected: prev[imageKey].selected
          }
        }));
        
        toast({
          title: "Foto toegevoegd",
          description: "Recente foto is succesvol toegevoegd aan de upload area.",
        });
        
      } catch (fallbackError) {
        console.error('❌ Canvas fallback method also failed:', fallbackError);
        
        toast({
          title: "Canvas fallback mislukt",
          description: `Canvas methode werkte niet: ${fallbackError.message}. Probeer de afbeelding handmatig te uploaden.`,
          variant: "destructive"
        });
        
        // Final fallback: Create a placeholder file that can be processed by FileReader
        try {
          console.log('🔄 Creating placeholder file as final fallback...');
          
          // Create a minimal 100x100 pixel placeholder image
          const canvas = document.createElement('canvas');
          canvas.width = 100;
          canvas.height = 100;
          const ctx = canvas.getContext('2d');
          
          // Create a simple placeholder design
          ctx.fillStyle = '#f0f0f0';
          ctx.fillRect(0, 0, 100, 100);
          ctx.fillStyle = '#666';
          ctx.font = '12px Arial';
          ctx.textAlign = 'center';
          ctx.fillText('Image', 50, 45);
          ctx.fillText('Loading', 50, 60);
          
          const placeholderBlob = await new Promise(resolve => {
            canvas.toBlob(resolve, 'image/jpeg', 0.9);
          });
          
          const file = new File([placeholderBlob], 'recent-photo.jpg', { type: 'image/jpeg' });
          
          // Set the image with proxied URL for preview if it's a Firebase Storage URL
          const previewUrl = photoUrl.includes('firebasestorage.googleapis.com') 
            ? `http://localhost:3001/api/fetch-image?url=${encodeURIComponent(photoUrl)}`
            : photoUrl;
          
          setImages(prev => ({
            ...prev,
            [imageKey]: {
              file: file,
              preview: previewUrl, // Use proxied URL for Firebase Storage
              selected: false
            }
          }));
          
          toast({
            title: "Foto toegevoegd",
            description: "Recente foto is toegevoegd (preview mode). De originele afbeelding wordt getoond maar een placeholder wordt gebruikt voor bewerking.",
            variant: "default"
          });
          
        } catch (finalError) {
          console.error('All fallback methods failed:', finalError);
          toast({
            title: "Fout bij toevoegen foto",
            description: "Kon de foto niet toevoegen. Probeer het opnieuw of upload de foto handmatig.",
            variant: "destructive"
          });
        }
      }
    }
  };

  // Remove image from specific slot
  const removeImage = (imageKey) => {
    setImages(prev => ({
      ...prev,
      [imageKey]: { file: null, preview: null, selected: prev[imageKey].selected }
    }));
  };
  
  // Toggle selection of an image for processing
  const toggleImageSelection = (imageKey) => {
    setImages(prev => ({
      ...prev,
      [imageKey]: { 
        ...prev[imageKey],
        selected: !prev[imageKey].selected 
      }
    }));
  };

  // Reset to start fresh with new images
  const handleReset = () => {
    setImages({
      image1: { file: null, preview: null, selected: true },
      image2: { file: null, preview: null, selected: true },
      image3: { file: null, preview: null, selected: true },
      image4: { file: null, preview: null, selected: true }
    });
    setIsEditingMode(false);
    setBaseGeneratedImage(null);
    setOriginalImages(null);
    setPrompt('');
    toast({
      title: "Reset voltooid",
      description: "Je kunt nu opnieuw beginnen met nieuwe afbeeldingen."
    });
  };
  
  // Restore original images from before editing
  const handleRestoreOriginalImages = () => {
    if (originalImages) {
      // Behoud de selected state van de huidige afbeeldingen
      const updatedImages = {};
      
      Object.entries(originalImages).forEach(([key, image]) => {
        updatedImages[key] = {
          ...image,
          selected: images[key].selected
        };
      });
      
      setImages(updatedImages);
      toast({
        title: "Originele afbeeldingen hersteld",
        description: "De oorspronkelijke afbeeldingen zijn teruggezet."
      });
    }
  };



  // Get image reference text for prompts


  const handleGenerate = async () => {
    const uploadedFiles = getUploadedFiles();
    const uploadedCount = getUploadedImagesCount();
    
    if (!prompt) {
      toast({ 
        title: "Onvolledige invoer", 
        description: "Geef een prompt op voor de mockup generatie.", 
        variant: "destructive" 
      });
      return;
    }
    
    const requiredCredits = resolution === '4k' ? 2 : 1;
    if (credits < requiredCredits) {
      toast({ 
        title: "Onvoldoende credits", 
        description: `Je hebt ${requiredCredits} credit${requiredCredits > 1 ? 's' : ''} nodig voor een mockup. Koop meer credits.`, 
        variant: "destructive" 
      });
      navigate('/subscription');
      return;
    }

    try {
      // Show processing start notification with PHIXO magic message
      setTimeout(() => {
        toast({
          title: "PHIXO is doing its magic... ✨",
          description: isEditingMode 
            ? `Bezig met aanpassen van je mockup met ${uploadedCount} afbeelding${uploadedCount > 1 ? 'en' : ''}`
            : `Bezig met genereren van je mockup met ${uploadedCount} afbeelding${uploadedCount > 1 ? 'en' : ''}`
        });
      }, 100);
      
      console.log(`${isEditingMode ? 'Editing' : 'Starting'} mockup generation with ${uploadedCount} images`);
      
      // Use only the user's prompt without any additional generated text
      const mockupPrompt = prompt;
      
      console.log('Using user prompt:', mockupPrompt);
      
      if (isEditingMode) {
        // Show animation for editing
        setShowEditAnimation(true);
        
        // For editing mode, use the useNanoBanana hook for proper undo/redo support
        const uploadedFiles = getUploadedFiles();
        
        // Only process selected images
        const selectedFiles = [];
        Object.entries(images).forEach(([key, image]) => {
          if (image.file && image.selected) {
            selectedFiles.push(image.file);
          }
        });
        
        console.log(`Editing with ${selectedFiles.length} selected uploads`);
        
        // Convert selected files to data URLs for Nano Banana
        const additionalImages = [];
        if (selectedFiles.length > 0) {
          // Filter out invalid files and validate before processing
          const validFiles = selectedFiles.filter(file => {
            if (!file) {
              console.warn('Skipping null/undefined file');
              return false;
            }
            if (!(file instanceof File) && !(file instanceof Blob)) {
              console.warn('Skipping invalid file object:', file);
              return false;
            }
            return true;
          });
          
          if (validFiles.length > 0) {
            const imageDataUrls = await Promise.all(validFiles.map(file => {
              return new Promise((resolve, reject) => {
                try {
                  const reader = new FileReader();
                  reader.onload = () => resolve(reader.result);
                  reader.onerror = (error) => {
                    console.error('FileReader error:', error);
                    reject(error);
                  };
                  reader.readAsDataURL(file);
                } catch (error) {
                  console.error('Error creating FileReader:', error);
                  reject(error);
                }
              });
            }));
            additionalImages.push(...imageDataUrls);
          }
        }
        
        // Use the hook's callNanoBananaApi for proper history management
        const editResult = await callNanoBananaApi(mockupPrompt, {
          additionalImages: additionalImages,
          toastMessage: selectedFiles.length > 0 
            ? `Mockup aanpassen met ${selectedFiles.length} nieuwe afbeelding${selectedFiles.length > 1 ? 'en' : ''}` 
            : "Mockup aanpassen met alleen tekst"
        });
        
        // Auto-save the edited mockup if successful
        if (editResult && editResult.success && editResult.imageUrl) {
          await autoSaveMockup(editResult.imageUrl, mockupPrompt);
        }
        
        // Hide animation after completion
        setShowEditAnimation(false);
        
        // Clear only the files that were used in the edit, but keep upload functionality available
        const updatedImages = { ...images };
        Object.entries(images).forEach(([key, image]) => {
          if (image.file && image.selected) {
            updatedImages[key] = { file: null, preview: null, selected: true };
          }
        });
        setImages(updatedImages);
      } else {
         // For initial generation, use direct API call and then set up for editing
         setIsInitialLoading(true);
         
         try {
           const uploadedFiles = getUploadedFiles();
           
           // Convert all uploaded images to data URLs (if any)
         const imageDataUrls = uploadedFiles.length > 0 ? await Promise.all(
           uploadedFiles
             .filter(file => {
               if (!file) {
                 console.warn('Skipping null/undefined file');
                 return false;
               }
               if (!(file instanceof File) && !(file instanceof Blob)) {
                 console.warn('Skipping invalid file object:', file);
                 return false;
               }
               return true;
             })
             .map(file => {
               return new Promise((resolve, reject) => {
                 try {
                   const reader = new FileReader();
                   reader.onload = () => resolve(reader.result);
                   reader.onerror = (error) => {
                     console.error('FileReader error:', error);
                     reject(error);
                   };
                   reader.readAsDataURL(file);
                 } catch (error) {
                   console.error('Error creating FileReader:', error);
                   reject(error);
                 }
               });
             })
         ) : [];
         
         console.log(`Verwerken van ${imageDataUrls.length} afbeeldingen voor mockup generatie (alleen-tekst: ${imageDataUrls.length === 0})`);
           
           // Import and call the Nano Banana API directly for initial generation
           const { performNanoBananaEdit } = await import('@/lib/nano-banana');
           
           const result = await performNanoBananaEdit(
             mockupPrompt, 
             imageDataUrls, // Nu sturen we alle afbeeldingen
             'jpg',
             3 // retries
           );
           
           if (!result.success || !result.imageUrl) {
             throw new Error("Nano Banana heeft geen geldig afbeeldingsresultaat teruggegeven.");
           }
           
           // Set up for editing mode
           setBaseGeneratedImage(result.imageUrl);
           setOriginalImages({...images});
           setIsEditingMode(true);
           
           // Auto-save the generated mockup
           await autoSaveMockup(result.imageUrl, mockupPrompt);
           
           // Credits are automatically deducted in useNanoBanana
           
           // Show success toast
           const selectedCount = getSelectedImagesCount();
            toast({
              title: "Mockup gegenereerd!",
              description: selectedCount > 0 
                ? `Mockup succesvol gegenereerd met ${selectedCount} geselecteerde afbeelding${selectedCount > 1 ? 'en' : ''}` 
                : "Mockup succesvol gegenereerd met alleen tekst",
            });
         } finally {
           setIsInitialLoading(false);
         }
       }
      
      // Show success notification
      toast({
        title: "PHIXO bewerking geslaagd! ✨",
        description: isEditingMode 
          ? `Je mockup is succesvol aangepast met ${getSelectedImagesCount()} geselecteerde afbeelding${getSelectedImagesCount() > 1 ? 'en' : ''}!`
          : `Je mockup met ${getSelectedImagesCount()} geselecteerde afbeelding${getSelectedImagesCount() > 1 ? 'en' : ''} is succesvol gegenereerd!`
      });
      
      // Clear the prompt after successful generation
      setPrompt('');
      
    } catch (error) {
      console.error('Mockup generation failed:', error);
      // Error notification is already handled by useSeedream hook
    }
  };

  const showPromptSuggestions = () => {
    const suggestions = isEditingMode ? [
      "Vervang afbeelding 2 en plaats het nieuwe logo in de rechterbovenhoek.",
      "Gebruik afbeelding 1 en voeg deze toe aan de linkerkant van de compositie.",
      "Plaats afbeelding 3 op de voorgrond en maak het groter dan de andere elementen.",
      "Integreer afbeelding 4 in de achtergrond met zachte belichting.",
      "Verwijder het huidige logo en vervang het door afbeelding 1."
    ] : [
      "Combineer alle producten op een moderne eettafel.",
      "Plaats alle items in een stijlvolle woonkamer setting.",
      "Creëer een productfoto met alle items op een marmeren oppervlak.",
      "Integreer alle elementen in een professionele studio setup.",
      "Maak een lifestyle foto met alle producten in gebruik."
    ];

    toast({
      title: "💡 Prompt Suggesties",
      description: (
        <ul className="list-disc pl-5 space-y-1 mt-2">
          {suggestions.map((suggestion, index) => (
            <li key={index}>{suggestion}</li>
          ))}
        </ul>
      ),
      duration: 10000,
    });
  };
  
  // Automatisch opslaan van gegenereerde mockup
  const autoSaveMockup = async (imageUrl, mockupPrompt) => {
    try {
      const selectedCount = getSelectedImagesCount();
      const photoData = {
        imageUrl: imageUrl,
        tool: 'mockup-creator',
        prompt: mockupPrompt,
        metadata: {
          aspectRatio: aspectRatio,
          resolution: resolution,
          selectedImagesCount: selectedCount,
          editingMode: isEditingMode
        }
      };

      const result = await autoSaveService.autoSavePhoto(photoData);
      
      if (result && result.success) {
        console.log('Mockup automatically saved:', result.firebaseUrl);
      }
    } catch (error) {
      console.error('Auto-save error:', error);
      // Don't show error toast for auto-save failures to avoid interrupting user flow
    }
  };

  const handleDownload = async () => {
    if (!generatedImage) return;
    
    try {
      // Fetch the image as a blob to force download
      const response = await fetch(generatedImage);
      const blob = await response.blob();
      
      // Create object URL from blob
      const url = window.URL.createObjectURL(blob);
      
      // Create download link
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `mockup_phixo_${Date.now()}.jpg`;
      document.body.appendChild(a);
      a.click();
      
      // Cleanup
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      toast({ title: "Download gestart!", description: "Je mockup wordt gedownload." });
    } catch (error) {
      console.error('Download error:', error);
      toast({ 
        title: "Download mislukt", 
        description: "Er is een fout opgetreden bij het downloaden.",
        variant: "destructive"
      });
    }
  };

  // Render upload slots dynamically
  const renderUploadSlots = () => {
    return Object.entries(images).map(([key, image], index) => {
      const isDraggedOver = draggedOver === key;
      
      return (
        <div 
          key={key}
          className={`relative p-4 border-2 border-dashed ${
            isDraggedOver
              ? 'border-purple-500 bg-purple-500/10 scale-105'
              : image.file && image.selected 
                ? 'border-purple-500' 
                : 'border-white/20'
          } rounded-2xl text-center cursor-pointer hover:border-purple-500/50 hover:bg-white/5 transition-all ${
            image.file && !image.selected ? 'opacity-60' : ''
          }`}
          onClick={() => !image.file && document.getElementById(`${key}-upload`).click()}
          onDragOver={(e) => handleDragOver(e, key)}
          onDragLeave={(e) => handleDragLeave(e, key)}
          onDrop={(e) => handleDrop(e, key)}
        >
          <input 
            id={`${key}-upload`} 
            type="file" 
            accept="image/*" 
            className="hidden" 
            onChange={(e) => handleFileChange(e, key)} 
          />
          
          {image.file ? (
            <div className="relative">
              <img 
                alt={`Upload ${index + 1}`} 
                src={image.preview} 
                className={`w-full h-32 object-cover rounded-lg bg-gray-900/50 ${
                  image.selected ? 'ring-2 ring-purple-500' : ''
                }`}
              />
              <div className="absolute top-0 right-0 flex gap-1 m-1">
                <Button
                  variant={image.selected ? "default" : "outline"}
                  size="sm"
                  className={`w-6 h-6 p-0 rounded-full ${
                    image.selected 
                      ? 'bg-purple-500 hover:bg-purple-600' 
                      : 'bg-gray-800/70 border-white/30 hover:bg-gray-700'
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleImageSelection(key);
                  }}
                >
                  {image.selected ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 6 6 18"></path>
                      <path d="m6 6 12 12"></path>
                    </svg>
                  )}
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  className="w-6 h-6 p-0 rounded-full"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeImage(key);
                  }}
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
              {/* Drag overlay for existing images */}
              {isDraggedOver && (
                <div className="absolute inset-0 bg-purple-500 bg-opacity-20 rounded-lg flex items-center justify-center">
                  <div className="text-purple-300 font-medium text-sm">
                    Vervang afbeelding
                  </div>
                </div>
              )}
              <div className="flex justify-between items-center mt-2">
                <p className="text-xs text-white/70">Afbeelding {index + 1}</p>
                <p className="text-xs text-white/70">{image.selected ? 'Geselecteerd' : 'Uitgesloten'}</p>
              </div>
            </div>
          ) : (
            <>
              <FileUp className={`w-8 h-8 mx-auto mb-2 transition-colors ${
                isDraggedOver ? 'text-purple-300' : 'text-purple-400'
              }`} />
              <p className={`font-semibold text-sm transition-colors ${
                isDraggedOver ? 'text-purple-300' : 'text-white'
              }`}>
                {isDraggedOver 
                  ? 'Laat afbeelding los om te uploaden'
                  : isEditingMode ? `Vervang/Voeg toe ${index + 1}` : `Upload Afbeelding ${index + 1}`
                }
              </p>
              <p className={`text-xs mt-1 transition-colors ${
                isDraggedOver ? 'text-purple-400' : 'text-white/50'
              }`}>
                {isDraggedOver 
                  ? 'Sleep & drop of klik om te selecteren'
                  : index === 0 && !isEditingMode ? 'Verplicht' : 'Optioneel'
                }
              </p>
            </>
          )}
        </div>
      );
    });
  };

  return (
    <>
      <Helmet>
        <title>Mockup Creator - phixo</title>
        <meta name="description" content="Creëer realistische mockups met AI." />
      </Helmet>
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 ml-72 p-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-6xl mx-auto"
          >
            <div className="flex justify-between items-center mb-6">
              <Link to="/new-project" className="inline-flex items-center gap-2 text-purple-400 hover:text-purple-300 transition-colors">
                <ArrowLeft className="w-4 h-4" />
                Terug naar projectkeuze
              </Link>
              <Link to="/mockup-tutorial" className="inline-flex items-center gap-2 text-orange-400 hover:text-orange-300 transition-colors">
                <BookOpen className="w-4 h-4" />
                Tutorial: Beste Resultaten
              </Link>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
              <Card className="glass-effect border-white/10 xl:col-span-1">
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-xl bg-gradient-to-r from-teal-500 to-green-500 flex items-center justify-center">
                      {isEditingMode ? <Edit3 className="w-8 h-8 text-white" /> : <Layers className="w-8 h-8 text-white" />}
                    </div>
                    <div>
                      <CardTitle className="text-3xl font-bold gradient-text">
                        {isEditingMode ? 'Bewerk Mockup' : 'Mockup Creator'}
                      </CardTitle>
                      <CardDescription className="text-white/70 text-base">
                        {isEditingMode 
                          ? 'Vervang afbeeldingen en pas je mockup aan'
                          : 'Combineer tot 4 afbeeldingen in één mockup'
                        }
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {isEditingMode && (
                    <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Edit3 className="w-4 h-4 text-blue-400" />
                          <span className="text-sm font-medium text-blue-400">Bewerkingsmodus</span>
                        </div>
                        {originalImages && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={handleRestoreOriginalImages}
                            className="text-xs border-blue-500/30 hover:bg-blue-500/10 text-blue-400"
                          >
                            <RefreshCw className="w-3 h-3 mr-1" />
                            Herstel originele afbeeldingen
                          </Button>
                        )}
                      </div>
                      <p className="text-xs text-white/70">
                        Je kunt nu individuele afbeeldingen vervangen en je mockup verder aanpassen.
                      </p>
                    </div>
                  )}
                  
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <Label>Afbeeldingen ({getUploadedImagesCount()}/4)</Label>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-white/50">
                          {isEditingMode ? 'Vervang of voeg toe' : 'Minimaal 1, maximaal 4'}
                        </span>
                        {getUploadedImagesCount() > 0 && (
                          <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-1 rounded-full">
                            {getSelectedImagesCount()} geselecteerd
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {renderUploadSlots()}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <Label htmlFor="prompt">
                          {isEditingMode 
                            ? 'Beschrijf hoe je de mockup wilt aanpassen'
                            : 'Beschrijf hoe de afbeeldingen gecombineerd moeten worden'
                          }
                        </Label>
                        <Button variant="ghost" size="sm" onClick={showPromptSuggestions} className="text-purple-400 hover:text-purple-300">
                          <Lightbulb className="w-4 h-4 mr-1" />
                          Suggesties
                        </Button>
                      </div>
                      <Textarea 
                        id="prompt" 
                        value={prompt} 
                        onChange={(e) => setPrompt(e.target.value)} 
                        placeholder={isEditingMode 
                          ? "bv. 'Vervang afbeelding 2 en plaats het logo in de rechterbovenhoek'"
                          : "bv. 'Plaats alle producten op een moderne eettafel met natuurlijk licht'"
                        }
                        className="input-glow"
                        rows={3}
                        spellCheck={true}
                        lang="nl"
                      />
                      

                    </div>

                  <div className="space-y-2">
                    <Label htmlFor="aspect-ratio">Beeldverhouding</Label>
                    <Select value={aspectRatio} onValueChange={setAspectRatio}>
                      <SelectTrigger className="input-glow">
                        <SelectValue placeholder="Selecteer beeldverhouding" />
                      </SelectTrigger>
                      <SelectContent>
                        {getAspectRatioOptions().map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <ResolutionSelector
                    selectedResolution={resolution}
                    onResolutionChange={setResolution}
                    className="pt-2"
                  />

                  <div className="pt-4 border-t border-white/10 space-y-3">
                    <p className="text-sm text-white/70">
                      Deze actie kost <span className="font-bold text-white">{resolution === '4k' ? '2' : '1'}</span> credit{resolution === '4k' ? 's' : ''}. 
                      Je hebt er <span className="font-bold text-purple-400">{credits}</span>.
                    </p>
                    
                    <div className="flex gap-2">
                      <Button 
                        onClick={handleGenerate} 
                        disabled={isLoading || isInitialLoading || (!isEditingMode && getSelectedImagesCount() === 0) || !prompt} 
                        className="flex-1 button-glow h-12 text-base"
                      >
                        {(isLoading || isInitialLoading) ? (
                          <>
                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                            {isEditingMode ? 'Aanpassen...' : 'Genereren...'}
                          </>
                        ) : (
                          <>
                            <Wand2 className="w-5 h-5 mr-2" />
                            {isEditingMode 
                              ? `Pas Aan ${getSelectedImagesCount() > 0 ? `(${getSelectedImagesCount()} geselecteerd)` : ''}`
                              : `Genereer Mockup (${getSelectedImagesCount()} geselecteerd)`
                            }
                          </>
                        )}
                      </Button>
                      
                      {isEditingMode && (
                        <Button 
                          onClick={handleReset}
                          variant="outline"
                          className="h-12 px-4"
                          disabled={isLoading}
                        >
                          <RefreshCw className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-effect border-white/10 flex flex-col xl:col-span-2">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-teal-400" />
                    {isEditingMode ? 'Bewerk je Mockup' : 'Mockup Resultaat'}
                  </CardTitle>
                  <CardDescription>
                    {isEditingMode 
                      ? 'Pas je bestaande mockup aan door afbeeldingen te vervangen of nieuwe instructies te geven'
                      : 'Je gegenereerde mockup verschijnt hier'
                    }
                  </CardDescription>
                </CardHeader>
                <CardContent className="relative">
                  {!generatedImage && !isLoading && !isInitialLoading ? (
                    <div className="flex flex-col items-center justify-center h-96 text-center">
                      <Layers className="w-16 h-16 text-white/30 mb-4" />
                      <p className="text-white/50 text-lg">Upload afbeeldingen en genereer je eerste mockup</p>
                    </div>
                  ) : (isLoading || isInitialLoading || showEditAnimation) ? (
                    <div className="h-96">
                      <LoadingAnimation 
                        isVisible={true}
                        title="PHIXO is doing its magic... ✨"
                        message={`${isEditingMode 
                          ? `Bezig met aanpassen van je mockup met ${getUploadedImagesCount()} afbeelding${getUploadedImagesCount() > 1 ? 'en' : ''}`
                          : `Bezig met genereren van je mockup met ${getUploadedImagesCount()} afbeelding${getUploadedImagesCount() > 1 ? 'en' : ''}`
                        } • Credits resterend: ${credits > 0 ? credits - (resolution === '4k' ? 2 : 1) : 0}`}
                        className="h-full"
                      />
                    </div>
                  ) : (
                    <div className="relative">
                      {generatedImage && (
                        <div className="space-y-4">
                          {isEditingMode && originalImageUrl ? (
                            <ReactCompareSlider
                              itemOne={<ReactCompareSliderImage src={originalImageUrl} alt="Originele mockup" style={{objectFit: 'contain', width: '100%', height: '100%', maxHeight: '75vh'}} />}
                              itemTwo={<ReactCompareSliderImage src={generatedImage} alt="Bewerkte mockup" style={{objectFit: 'contain', width: '100%', height: '100%', maxHeight: '75vh'}} />}
                              className="rounded-xl overflow-hidden"
                            />
                          ) : (
                            <motion.img 
                              src={generatedImage} 
                              alt="Generated mockup" 
                              className="w-full h-auto rounded-xl shadow-2xl"
                              style={{maxHeight: '75vh', objectFit: 'contain'}}
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ duration: 0.5 }}
                            />
                          )}
                          
                          <motion.div 
                            className="flex gap-3 justify-center flex-wrap"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                          >
                            <Button onClick={handleDownload} className="button-glow">
                              <Download className="w-4 h-4 mr-2" />
                              Download
                            </Button>
                            
                            {/* Undo/Redo knoppen */}
                            <div className="flex gap-2">
                              <Button 
                                onClick={undo} 
                                disabled={!canUndo || isLoading} 
                                variant="outline" 
                                size="icon" 
                                className="border-white/20 hover:bg-white/10 w-10 h-10"
                                title="Ongedaan maken"
                              >
                                <Undo className="w-4 h-4"/>
                              </Button>
                              <Button 
                                onClick={redo} 
                                disabled={!canRedo || isLoading} 
                                variant="outline" 
                                size="icon" 
                                className="border-white/20 hover:bg-white/10 w-10 h-10"
                                title="Opnieuw doen"
                              >
                                <Redo className="w-4 h-4"/>
                              </Button>
                            </div>
                            
                            {isEditingMode && (
                              <Button onClick={handleReset} variant="outline" className="border-white/20 hover:bg-white/10">
                                <RefreshCw className="w-4 h-4 mr-2" />
                                Opnieuw Beginnen
                              </Button>
                            )}
                          </motion.div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Recent Photos Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="mt-8"
            >
              <Card className="glass-effect border-white/10">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Image className="w-5 h-5 text-purple-400" />
                    Recente Foto's
                  </CardTitle>
                  <CardDescription>
                    Sleep foto's naar de upload gebieden om ze te gebruiken in je mockup
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingRecentPhotos ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-white/50 mr-2" />
                      <span className="text-white/60">Foto's laden...</span>
                    </div>
                  ) : recentPhotos.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
                      {recentPhotos.map((photo) => (
                        <motion.div
                          key={photo.id}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="relative group cursor-grab active:cursor-grabbing"
                          draggable
                          onDragStart={(e) => handlePhotoDragStart(e, photo)}
                          onDragEnd={handlePhotoDragEnd}
                        >
                          <div className="relative overflow-hidden rounded-lg bg-gray-900/50 aspect-square">
                            <img
                              src={photo.url}
                              alt={photo.name}
                              className="w-full h-full object-cover transition-transform group-hover:scale-110"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                              <div className="absolute bottom-2 left-2 right-2">
                                <p className="text-white text-xs font-medium truncate">
                                  {photo.name}
                                </p>
                                <p className="text-white/70 text-xs">
                                  {new Date(photo.createdAt).toLocaleDateString('nl-NL')}
                                </p>
                              </div>
                            </div>
                            {/* Drag indicator */}
                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <div className="bg-purple-500 text-white text-xs px-2 py-1 rounded-full">
                                Sleep
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Image className="w-12 h-12 mx-auto mb-4 text-white/30" />
                      <p className="text-white/60 mb-2">Geen recente foto's gevonden</p>
                      <p className="text-white/40 text-sm">
                        Bewerk eerst foto's in andere tools om ze hier te zien verschijnen
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </main>
      </div>
    </>
  );
};

export default MockupCreator;
