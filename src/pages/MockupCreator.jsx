import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Helmet } from 'react-helmet';
import { Link, useNavigate } from 'react-router-dom';
import { Layers, Sparkles, ArrowLeft, FileUp, Wand2, Lightbulb, Download, BookOpen, Loader2, X, RefreshCw, Edit3, Undo, Redo } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useCredits } from '@/contexts/CreditsContext';
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

const MockupCreator = () => {
  const { user } = useAuth();
  const { credits, checkCredits, deductCredits } = useCredits();
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
    originalImageUrl
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

  const handleDrop = (e, imageKey) => {
    e.preventDefault();
    e.stopPropagation();
    setDraggedOver(null);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      const file = files[0];
      processFile(file, imageKey);
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
    if (!checkCredits(requiredCredits)) {
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
          const imageDataUrls = await Promise.all(selectedFiles.map(file => {
            return new Promise((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => resolve(reader.result);
              reader.onerror = reject;
              reader.readAsDataURL(file);
            });
          }));
          additionalImages.push(...imageDataUrls);
        }
        
        // Use the hook's callNanoBananaApi for proper history management
        await callNanoBananaApi(mockupPrompt, {
          additionalImages: additionalImages,
          toastMessage: selectedFiles.length > 0 
            ? `Mockup aanpassen met ${selectedFiles.length} nieuwe afbeelding${selectedFiles.length > 1 ? 'en' : ''}` 
            : "Mockup aanpassen met alleen tekst"
        });
        
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
         const imageDataUrls = uploadedFiles.length > 0 ? await Promise.all(uploadedFiles.map(file => {
           return new Promise((resolve, reject) => {
             const reader = new FileReader();
             reader.onload = () => resolve(reader.result);
             reader.onerror = reject;
             reader.readAsDataURL(file);
           });
         })) : [];
         
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
           
           // Deduct credits
           await deductCredits(1);
           
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
          </motion.div>
        </main>
      </div>
    </>
  );
};

export default MockupCreator;
