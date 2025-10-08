import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ReactCompareSlider, ReactCompareSliderImage } from 'react-compare-slider';

import { Loader2, Download, Sparkles, Image as ImageIcon, Clock, Palette, Upload, Edit3, Wand2, Sliders, Sun, Contrast, Crop, RotateCw, Undo2, Redo2 } from 'lucide-react';
import Sidebar from '@/components/Layout/Sidebar';
import { BackgroundGradient } from '@/components/ui/background-gradient';
import LoadingAnimation from '@/components/ui/loading-animation';
import { useSeedream } from '@/hooks/useSeedream';
import { useAuth } from '@/contexts/AuthContext';
import { useImageStorage, useImageHistory } from '@/hooks/useFirebase';
import { toast } from '@/components/ui/use-toast';
import { autoSaveService } from '@/services/autoSaveService';

const FotoGenerator = () => {
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const { callSeedreamApi, isLoading, generatedImage, setGeneratedImage, clearHistory, credits } = useSeedream();
  const { user } = useAuth();
  const { uploadImage, saveGeneratedImage, isUploading } = useImageStorage();
  const { saveImageGeneration, refreshHistory, history: imageHistory } = useImageHistory();
  
  // Recent photos state (replacing hardcoded history)
  const [recentPhotos, setRecentPhotos] = useState([]);
  const [loadingRecentPhotos, setLoadingRecentPhotos] = useState(false);
  
  // Gescheiden state voor genereren en bewerken
  const [activeTab, setActiveTab] = useState('generate');
  const [generateImage, setGenerateImage] = useState(null); // Alleen voor genereren tab
  const [uploadedImage, setUploadedImage] = useState(null);
  const [editedImage, setEditedImage] = useState(null);
  const [originalImageForEdit, setOriginalImageForEdit] = useState(null);
  const [editPrompt, setEditPrompt] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editHistory, setEditHistory] = useState([]);
  const [showBeforeAfter, setShowBeforeAfter] = useState(false);
  
  // Nieuwe state voor undo/redo functionaliteit
  const [historyIndex, setHistoryIndex] = useState(0);
  const [redoStack, setRedoStack] = useState([]);

  // Load image history on component mount
  useEffect(() => {
    if (user) {
      refreshHistory();
      loadRecentPhotos();
    }
  }, [user, refreshHistory]);

  // Load recent photos from Firebase Storage via autoSaveService
  const loadRecentPhotos = async () => {
    if (!user) {
      console.log('🔍 FotoGenerator: No user authenticated, skipping photo load');
      setRecentPhotos([]);
      return;
    }

    try {
      setLoadingRecentPhotos(true);
      console.log('🔄 FotoGenerator: Loading recent photos from autoSaveService...');
      
      // Use the autoSaveService to get recent photos
      const photos = await autoSaveService.getRecentPhotos(6); // Get 6 recent photos for the grid
      console.log('✅ FotoGenerator: Loaded photos from autoSaveService:', photos.length);
      
      // Set the photos directly without adding test photos
      setRecentPhotos(photos);
    } catch (error) {
      console.error('❌ FotoGenerator: Error loading recent photos:', error);
      setRecentPhotos([]);
      toast({
        title: "Fout bij laden foto's",
        description: "Kon recente foto's niet laden. Probeer de pagina te vernieuwen.",
        variant: "destructive"
      });
    } finally {
      setLoadingRecentPhotos(false);
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast({
        title: "Prompt vereist",
        description: "Voer een beschrijving in voor je foto.",
        variant: "destructive",
      });
      return;
    }

    if (!user) {
      toast({
        title: "Inloggen vereist",
        description: "Je moet ingelogd zijn om foto's te genereren.",
        variant: "destructive",
      });
      return;
    }

    // Check credits before generating
    if (credits < 1) {
      toast({
        title: "Geen credits meer",
        description: "Je hebt niet genoeg credits om deze actie uit te voeren.",
        variant: "destructive",
      });
      return;
    }

    try {
      const result = await callSeedreamApi(prompt, aspectRatio, 'foto-generatie');
      if (result && result.imageUrl) {
        setGenerateImage(result.imageUrl);
        
        // Credits are automatically deducted in useSeedream
        
        // Save generated image using AutoSaveService
        try {
          await autoSaveService.autoSavePhoto({
            imageUrl: result.imageUrl,
            tool: 'foto-generator',
            prompt: prompt,
            metadata: {
              aspectRatio: aspectRatio,
              type: 'generated',
              timestamp: new Date().toISOString()
            }
          });
        } catch (storageError) {
          console.error('Error auto-saving generated image:', storageError);
          // Don't show error to user as the image was still generated successfully
        }
        
        // Also save using existing Firebase methods for compatibility
        try {
          const savedImageUrl = await saveGeneratedImage(result.imageUrl, prompt);
          await saveImageGeneration({
            imageUrl: savedImageUrl,
            prompt: prompt,
            aspectRatio: aspectRatio,
            type: 'generated',
            timestamp: new Date()
          });
        } catch (storageError) {
          console.error('Error saving image to Firebase:', storageError);
        }
        
        // Refresh recent photos to show the new generation
        loadRecentPhotos();
      }
    } catch (error) {
      console.error('Generation error:', error);
    }
  };

  const handleDownload = async () => {
    if (!generateImage) return;

    try {
      const response = await fetch(generateImage);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `phixo-foto-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      toast({
        title: "Download mislukt",
        description: "Er is een fout opgetreden bij het downloaden van de foto.",
        variant: "destructive",
      });
    }
  };

  // Functie om gegenereerde foto over te dragen naar bewerk tab
  const transferToEdit = (imageUrl) => {
    setOriginalImageForEdit(imageUrl);
    setEditedImage(imageUrl);
    setEditHistory([imageUrl]);
    setHistoryIndex(0);
    setRedoStack([]);
    setShowBeforeAfter(false);
    setActiveTab('edit');
  };

  // Bewerk functies
  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (file) {
      if (!user) {
        toast({
          title: "Inloggen vereist",
          description: "Je moet ingelogd zijn om afbeeldingen te uploaden.",
          variant: "destructive",
        });
        return;
      }

      try {
        // Upload to Firebase Storage
        const uploadedUrl = await uploadImage(file, `uploads/${Date.now()}-${file.name}`);
        
        setUploadedImage(uploadedUrl);
        setOriginalImageForEdit(uploadedUrl);
        setEditedImage(uploadedUrl);
        setEditHistory([uploadedUrl]);
        setHistoryIndex(0);
        setRedoStack([]);
        setShowBeforeAfter(false);

        toast({
          title: "Upload succesvol",
          description: "Je afbeelding is geüpload en klaar voor bewerking.",
        });
      } catch (error) {
        console.error('Upload error:', error);
        toast({
          title: "Upload mislukt",
          description: "Er is een fout opgetreden bij het uploaden van je afbeelding.",
          variant: "destructive",
        });
      }
    }
  };

  const handleEdit = async () => {
    if (!editPrompt.trim()) {
      toast({
        title: "Bewerkingsprompt vereist",
        description: "Voer een beschrijving in voor je bewerking.",
        variant: "destructive",
      });
      return;
    }

    if (!originalImageForEdit) {
      toast({
        title: "Geen afbeelding geselecteerd",
        description: "Selecteer eerst een afbeelding om te bewerken.",
        variant: "destructive",
      });
      return;
    }

    if (!user) {
      toast({
        title: "Inloggen vereist",
        description: "Je moet ingelogd zijn om afbeeldingen te bewerken.",
        variant: "destructive",
      });
      return;
    }

    // Check credits before editing
    if (credits < 1) {
      toast({
        title: "Geen credits meer",
        description: "Je hebt niet genoeg credits om deze actie uit te voeren.",
        variant: "destructive",
      });
      return;
    }

    setIsEditing(true);
    
    try {
      // Gebruik PHIXO API voor foto bewerking met originele foto als input
      const result = await callSeedreamApi(
        editPrompt, 
        '1:1', 
        'foto-bewerking', 
        originalImageForEdit, // Gebruik originele foto als input
        false, // skipEnhancement
        1 // creditCost
      );
      
      if (result && result.imageUrl) {
        // Credits are automatically deducted in useSeedream
        
        // Save edited image using AutoSaveService
        try {
          await autoSaveService.autoSavePhoto({
            imageUrl: result.imageUrl,
            tool: 'foto-generator',
            prompt: editPrompt,
            metadata: {
              aspectRatio: '1:1',
              type: 'edited',
              originalImage: originalImageForEdit,
              timestamp: new Date().toISOString()
            }
          });
        } catch (autoSaveError) {
          console.error('Error auto-saving edited image:', autoSaveError);
        }
        
        // Save edited image to Firebase Storage for compatibility
        try {
          const savedImageUrl = await saveGeneratedImage(result.imageUrl, editPrompt);
          
          // Clear redo stack wanneer nieuwe bewerking wordt gemaakt
          setRedoStack([]);
          
          // Update edit history met het directe resultaat
          const newHistory = [...editHistory, savedImageUrl];
          setEditHistory(newHistory);
          setHistoryIndex(newHistory.length - 1);
          setEditedImage(savedImageUrl);
          setShowBeforeAfter(true);
          
          // Save to image history
          await saveImageGeneration({
            imageUrl: savedImageUrl,
            prompt: editPrompt,
            aspectRatio: '1:1',
            type: 'edited',
            originalImage: originalImageForEdit,
            timestamp: new Date()
          });
          
          toast({
            title: "Bewerking voltooid!",
            description: "Je foto is succesvol bewerkt met PHIXO AI.",
          });
          
          // Refresh recent photos to show the new edit
          loadRecentPhotos();
        } catch (storageError) {
          console.error('Error saving edited image:', storageError);
          // Still show the result even if saving failed
          const newHistory = [...editHistory, result.imageUrl];
          setEditHistory(newHistory);
          setHistoryIndex(newHistory.length - 1);
          setEditedImage(result.imageUrl);
          setShowBeforeAfter(true);
          
          toast({
            title: "Bewerking voltooid!",
            description: "Je foto is succesvol bewerkt met PHIXO AI.",
          });
          
          // Refresh recent photos to show the new edit
          loadRecentPhotos();
        }
      } else {
        throw new Error("PHIXO bewerking mislukt - geen resultaat ontvangen");
      }
    } catch (error) {
      console.error('Edit error:', error);
      toast({
        title: "Bewerkingsfout",
        description: "Er is een fout opgetreden bij het bewerken van je foto.",
        variant: "destructive",
      });
    } finally {
      setIsEditing(false);
    }
  };

  // Nieuwe undo/redo functies
  const handleUndoEdit = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setEditedImage(editHistory[newIndex]);
      
      // Voeg huidige staat toe aan redo stack
      const currentImage = editHistory[historyIndex];
      setRedoStack(prev => [currentImage, ...prev]);
      
      // Als we teruggaan naar de originele foto, verberg de voor/na slider
      if (newIndex === 0) {
        setShowBeforeAfter(false);
      }
      
      toast({
        title: "Ongedaan gemaakt",
        description: `Teruggegaan naar versie ${newIndex + 1}`,
      });
    }
  };

  const handleRedoEdit = () => {
    if (redoStack.length > 0) {
      const [nextImage, ...remainingRedo] = redoStack;
      const newIndex = historyIndex + 1;
      
      setHistoryIndex(newIndex);
      setEditedImage(nextImage);
      setRedoStack(remainingRedo);
      setShowBeforeAfter(true);
      
      toast({
        title: "Opnieuw uitgevoerd",
        description: `Vooruit gegaan naar versie ${newIndex + 1}`,
      });
    }
  };

  const handleDownloadEdited = async () => {
    if (!editedImage) return;

    try {
      const response = await fetch(editedImage);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `phixo-bewerkt-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      toast({
        title: "Download mislukt",
        description: "Er is een fout opgetreden bij het downloaden van de foto.",
        variant: "destructive",
      });
    }
  };

  const aspectRatioOptions = [
    { value: '1:1', label: 'Vierkant (1:1)' },
    { value: '16:9', label: 'Landschap (16:9)' },
    { value: '9:16', label: 'Portret (9:16)' },
    { value: '4:3', label: 'Standaard (4:3)' },
    { value: '3:4', label: 'Portret (3:4)' }
  ];

  const promptSuggestions = [
    "Een prachtige zonsondergang over een kalm meer met bergen op de achtergrond",
    "Een gezellige koffieshop met warme verlichting en vintage decoratie",
    "Een moderne keuken met marmeren werkbladen en natuurlijk licht",
    "Een kleurrijke bloementuin in volle bloei tijdens de lente",
    "Een elegante woonkamer met minimalistische inrichting",
    "Een dromerig bos met zonnestralen die door de bomen schijnen"
  ];

  // Nieuwe undo/redo functies
  const handleUndoAdvanced = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setEditedImage(editHistory[newIndex]);
      
      // Voeg huidige staat toe aan redo stack
      const currentImage = editHistory[historyIndex];
      setRedoStack(prev => [currentImage, ...prev]);
      
      // Als we teruggaan naar de originele foto, verberg de voor/na slider
      if (newIndex === 0) {
        setShowBeforeAfter(false);
      }
      
      toast({
        title: "Ongedaan gemaakt",
        description: `Teruggegaan naar versie ${newIndex + 1}`,
      });
    }
  };

  const handleRedoAdvanced = () => {
    if (redoStack.length > 0) {
      const [nextImage, ...remainingRedo] = redoStack;
      const newIndex = historyIndex + 1;
      
      setHistoryIndex(newIndex);
      setEditedImage(nextImage);
      setRedoStack(remainingRedo);
      setShowBeforeAfter(true);
      
      toast({
        title: "Opnieuw uitgevoerd",
        description: `Vooruit gegaan naar versie ${newIndex + 1}`,
      });
    }
  };

  // Update de bestaande handleEdit functie om undo/redo state te beheren
  const handleEditAdvanced = async () => {
    if (!editPrompt.trim()) {
      toast({
        title: "Bewerkingsprompt vereist",
        description: "Voer een beschrijving in voor je bewerking.",
        variant: "destructive",
      });
      return;
    }

    if (!originalImageForEdit) {
      toast({
        title: "Geen afbeelding geselecteerd",
        description: "Selecteer eerst een afbeelding om te bewerken.",
        variant: "destructive",
      });
      return;
    }

    setIsEditing(true);
    
    try {
      // Gebruik PHIXO API voor foto bewerking met originele foto als input
      const result = await callSeedreamApi(
        editPrompt, 
        '1:1', 
        'foto-bewerking', 
        originalImageForEdit, // Gebruik originele foto als input
        false, // skipEnhancement
        1 // creditCost
      );
      
      if (result && result.imageUrl) {
        // Clear redo stack wanneer nieuwe bewerking wordt gemaakt
        setRedoStack([]);
        
        // Update edit history met het directe resultaat
        const newHistory = [...editHistory, result.imageUrl];
        setEditHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
        setEditedImage(result.imageUrl);
        setShowBeforeAfter(true);
        
        toast({
          title: "Bewerking voltooid!",
          description: "Je foto is succesvol bewerkt met PHIXO AI.",
        });
      } else {
        throw new Error("PHIXO bewerking mislukt - geen resultaat ontvangen");
      }
    } catch (error) {
      console.error('Edit error:', error);
      toast({
        title: "Bewerkingsfout",
        description: "Er is een fout opgetreden bij het bewerken van je foto.",
        variant: "destructive",
      });
    } finally {
      setIsEditing(false);
    }
  };

  // Update transferToEdit functie om undo/redo state te resetten
  const transferToEditAdvanced = (imageUrl) => {
    setOriginalImageForEdit(imageUrl);
    setEditedImage(imageUrl);
    setEditHistory([imageUrl]);
    setHistoryIndex(0);
    setRedoStack([]);
    setShowBeforeAfter(false);
    setActiveTab('edit');
  };

  // Update handleImageUpload functie om undo/redo state te resetten
  const handleImageUploadAdvanced = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageUrl = e.target.result;
        setUploadedImage(imageUrl);
        setOriginalImageForEdit(imageUrl);
        setEditedImage(imageUrl);
        setEditHistory([imageUrl]);
        setHistoryIndex(0);
        setRedoStack([]);
        setShowBeforeAfter(false);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <>
      <Helmet>
        <title>Foto Generator - phixo</title>
        <meta name="description" content="Genereer realistische foto's met PHIXO AI technologie." />
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
            {/* Header */}
            <div className="text-center mb-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="flex items-center justify-center mb-6"
              >
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-500 flex items-center justify-center mr-4">
                  <Palette className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold text-white mb-2">Foto Generator</h1>
                  <p className="text-white/70 text-lg">Genereer en bewerk foto's met AI technologie</p>
                </div>
              </motion.div>

            </div>

            <div className="flex items-center justify-center gap-4 text-sm text-white/60 mb-8">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                <span>PHIXO AI</span>
              </div>
              <div className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4" />
                <span>HD Kwaliteit</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>Credits: {credits}</span>
              </div>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 bg-white/10 backdrop-blur-sm">
                <TabsTrigger value="generate" className="data-[state=active]:bg-white/20 data-[state=active]:text-white text-white/70">
                  <Wand2 className="w-4 h-4 mr-2" />
                  Genereren
                </TabsTrigger>
                <TabsTrigger value="edit" className="data-[state=active]:bg-white/20 data-[state=active]:text-white text-white/70">
                  <Edit3 className="w-4 h-4 mr-2" />
                  Bewerken
                </TabsTrigger>
              </TabsList>
              <TabsContent value="generate" className="mt-0">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Preview Section */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="lg:col-span-2 order-1 lg:order-1"
                  >
                    <div className="mb-4">
                      <h3 className="gradient-text text-xl font-semibold flex items-center gap-2">
                        <ImageIcon className="w-5 h-5" />
                        Preview
                      </h3>
                    </div>
                    
                    <BackgroundGradient containerClassName="rounded-2xl" className="bg-slate-900/80 rounded-2xl" animate={false}>
                      <Card className="bg-transparent border-none min-h-[75vh]">
                        <CardContent className="p-6 min-h-[75vh] flex items-center justify-center relative">
                          <LoadingAnimation 
                            isVisible={isLoading} 
                            message="Genereert je foto met PHIXO AI..."
                            title="PHIXO AI"
                          />
                          
                          {generateImage ? (
                            <div className="space-y-4 w-full">
                              <div className="relative rounded-lg overflow-hidden bg-white/5">
                                <img
                                  src={generateImage}
                                  alt="Gegenereerde foto"
                                  className="w-full h-auto max-h-[70vh] object-contain"
                                />
                              </div>
                            </div>
                          ) : (
                            <div className="w-full min-h-[50vh] rounded-lg bg-white/5 border-2 border-dashed border-white/20 flex items-center justify-center">
                              <div className="text-center">
                                <ImageIcon className="w-16 h-16 text-white/40 mx-auto mb-4" />
                                <p className="text-white/60 text-lg">
                                  Je gegenereerde foto verschijnt hier
                                </p>
                                <p className="text-white/40 text-sm mt-2">
                                  Voer een prompt in en klik op "Genereer Foto"
                                </p>
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </BackgroundGradient>
                  </motion.div>

                  {/* Input Section */}
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                    className="lg:col-span-1 order-2 lg:order-2"
                  >
                    <Card className="glass-effect border-white/10">
                      <CardHeader>
                        <CardTitle className="text-white flex items-center gap-2">
                          <Sparkles className="w-5 h-5" />
                          Beschrijf je foto
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div>
                          <label className="text-white/80 text-sm font-medium mb-2 block">
                            Prompt
                          </label>
                          <Textarea
                            placeholder="Beschrijf de foto die je wilt genereren..."
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            className="bg-white/5 border-white/10 text-white placeholder:text-white/40 min-h-[120px]"
                          />
                        </div>

                        <div>
                          <label className="text-white/80 text-sm font-medium mb-2 block">
                            Beeldverhouding
                          </label>
                          <Select value={aspectRatio} onValueChange={setAspectRatio}>
                            <SelectTrigger className="bg-white/5 border-white/10 text-white">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {aspectRatioOptions.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <Button
                          onClick={handleGenerate}
                          disabled={isLoading || !prompt.trim()}
                          className="w-full button-glow h-12 text-base font-semibold"
                        >
                          {isLoading ? (
                            <>
                              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                              Genereren...
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-5 h-5 mr-2" />
                              Genereer Foto (1 credit)
                            </>
                          )}
                        </Button>

                        {/* Action buttons for generated image */}
                        {generateImage && (
                          <div className="flex gap-2">
                            <Button
                              onClick={handleDownload}
                              className="flex-1 bg-green-600 hover:bg-green-700 h-12"
                            >
                              <Download className="w-4 h-4 mr-2" />
                              Download
                            </Button>
                            <Button
                              onClick={() => transferToEdit(generateImage)}
                              className="flex-1 bg-blue-600 hover:bg-blue-700 h-12"
                            >
                              <Edit3 className="w-4 h-4 mr-2" />
                              Bewerken
                            </Button>
                          </div>
                        )}

                        {/* Prompt Suggestions */}
                        <div>
                          <label className="text-white/80 text-sm font-medium mb-3 block">
                            Inspiratie
                          </label>
                          <div className="space-y-2">
                            {promptSuggestions.map((suggestion, index) => (
                              <button
                                key={index}
                                onClick={() => setPrompt(suggestion)}
                                className="w-full text-left p-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white text-sm transition-all"
                              >
                                {suggestion}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Recente Gegenereerde Foto's */}
                        {recentPhotos && recentPhotos.length > 0 && (
                          <div>
                            <Label className="text-white/80 text-sm font-medium mb-3 block">
                              Recente Gegenereerde Foto's
                            </Label>
                            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                              {recentPhotos.slice(0, 6).map((item) => (
                                <div
                                  key={item.id}
                                  className="group cursor-pointer"
                                  onClick={() => transferToEdit(item.imageUrl)}
                                >
                                  <div className="relative rounded-lg overflow-hidden bg-white/5 aspect-square">
                                    <img
                                      src={item.imageUrl}
                                      alt={item.metadata?.prompt || 'Generated photo'}
                                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                    />
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                                  </div>
                                  <p className="text-white/60 text-xs mt-2 truncate">
                                    {item.metadata?.prompt || 'Generated photo'}
                                  </p>
                                  <div className="flex items-center justify-between mt-1">
                                    <span className="text-xs text-gray-500 px-2 py-1 bg-gray-100 rounded">
                                      {item.metadata?.aspectRatio || '1:1'}
                                    </span>
                                    <span className="text-xs text-white/40">
                                      {item.tool === 'foto-generator' ? 'Gegenereerd' : 'Bewerkt'}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                </div>

                {/* History Section */}
                {history.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                    className="mt-8"
                  >
                    <Card className="glass-effect border-white/10">
                      <CardHeader>
                        <CardTitle className="text-white flex items-center gap-2">
                          <Clock className="w-5 h-5" />
                          Recente Generaties
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                          {history.slice(0, 8).map((item) => (
                            <div
                              key={item.id}
                              className="group cursor-pointer"
                              onClick={() => setGenerateImage(item.imageUrl)}
                            >
                              <div className="relative rounded-lg overflow-hidden bg-white/5 aspect-square">
                                <img
                                  src={item.imageUrl}
                                  alt={item.prompt}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                              </div>
                              <p className="text-white/60 text-xs mt-2 truncate">
                                {item.prompt}
                              </p>
                              <span className="text-xs text-gray-500 mt-1 inline-block px-2 py-1 bg-gray-100 rounded">
                                {item.aspectRatio}
                              </span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </TabsContent>

              <TabsContent value="edit" className="mt-0">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Preview Section */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="lg:col-span-2 order-1 lg:order-1"
                  >
                    <div className="mb-4">
                      <h3 className="gradient-text text-xl font-semibold flex items-center gap-2">
                        <Edit3 className="w-5 h-5" />
                        Bewerk Preview
                      </h3>
                    </div>
                    
                    <BackgroundGradient containerClassName="rounded-2xl" className="bg-slate-900/80 rounded-2xl" animate={false}>
                      <Card className="bg-transparent border-none min-h-[75vh]">
                        <CardContent className="p-6 min-h-[75vh] flex items-center justify-center relative">
                          <LoadingAnimation 
                            isVisible={isEditing} 
                            message="Bewerkt je foto met AI..."
                            title="PHIXO AI"
                          />
                          
                          {editedImage ? (
                            <div className="space-y-4 w-full">
                              {/* Voor/Na Slider */}
                              {showBeforeAfter && originalImageForEdit ? (
                                <div className="space-y-4">
                                  <div className="flex items-center justify-center gap-4 mb-2">
                                    <span className="text-white/80 text-sm font-medium">Voor</span>
                                    <div className="flex-1 h-px bg-white/20"></div>
                                    <span className="text-white/80 text-sm font-medium">Na</span>
                                  </div>
                                  <div className="relative rounded-lg overflow-hidden bg-white/5">
                                    <ReactCompareSlider
                                      itemOne={
                                        <ReactCompareSliderImage
                                          src={originalImageForEdit}
                                          alt="Originele foto"
                                          style={{
                                            objectFit: 'contain',
                                            width: '100%',
                                            height: '100%',
                                            maxHeight: '75vh'
                                          }}
                                        />
                                      }
                                      itemTwo={
                                        <ReactCompareSliderImage
                                          src={editedImage}
                                          alt="Bewerkte foto"
                                          style={{
                                            objectFit: 'contain',
                                            width: '100%',
                                            height: '100%',
                                            maxHeight: '75vh'
                                          }}
                                        />
                                      }
                                      position={50}
                                      style={{
                                        display: 'flex',
                                        width: '100%',
                                        height: 'auto',
                                        minHeight: '400px',
                                        maxHeight: '75vh'
                                      }}
                                    />
                                  </div>
                                </div>
                              ) : (
                                <div className="relative rounded-lg overflow-hidden bg-white/5">
                                  <img
                                    src={editedImage}
                                    alt="Bewerkte foto"
                                    className="w-full h-auto max-h-[70vh] object-contain"
                                  />
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="w-full min-h-[50vh] rounded-lg bg-white/5 border-2 border-dashed border-white/20 flex items-center justify-center">
                              <div className="text-center">
                                <Upload className="w-16 h-16 text-white/40 mx-auto mb-4" />
                                <p className="text-white/60 text-lg">
                                  Upload een foto om te bewerken
                                </p>
                                <p className="text-white/40 text-sm mt-2">
                                  Ondersteunde formaten: JPG, PNG, WEBP
                                </p>
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </BackgroundGradient>
                  </motion.div>

                  {/* Input Section */}
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                    className="lg:col-span-1 order-2 lg:order-2"
                  >
                    <Card className="glass-effect border-white/10">
                      <CardHeader>
                        <CardTitle className="text-white flex items-center gap-2">
                          <Edit3 className="w-5 h-5" />
                          Foto Bewerken
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div>
                          <Label className="text-white/80 text-sm font-medium mb-2 block">
                            Upload Foto
                          </Label>
                          <Input
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="bg-white/5 border-white/10 text-white file:bg-white/10 file:text-white file:border-0 file:mr-4 file:py-2 file:px-4 file:rounded-md"
                          />
                        </div>

                        <div>
                          <Label className="text-white/80 text-sm font-medium mb-2 block">
                            Bewerkingsbeschrijving
                          </Label>
                          <Textarea
                            placeholder="Beschrijf hoe je de foto wilt bewerken..."
                            value={editPrompt}
                            onChange={(e) => setEditPrompt(e.target.value)}
                            className="bg-white/5 border-white/10 text-white placeholder:text-white/40 min-h-[120px]"
                          />
                        </div>

                        <Button
                          onClick={handleEdit}
                          disabled={isEditing || isLoading || !editPrompt.trim() || !originalImageForEdit}
                          className="w-full button-glow h-12 text-base font-semibold"
                        >
                          {(isEditing || isLoading) ? (
                            <>
                              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                              Bewerken...
                            </>
                          ) : (
                            <>
                              <Edit3 className="w-5 h-5 mr-2" />
                              Bewerk Foto (1 credit)
                            </>
                          )}
                        </Button>

                        {/* Action buttons for edited image */}
                        {editedImage && (
                          <div className="flex gap-2">
                            <Button
                              onClick={handleDownloadEdited}
                              className="flex-1 bg-green-600 hover:bg-green-700 h-12"
                            >
                              <Download className="w-4 h-4 mr-2" />
                              Download
                            </Button>
                            {historyIndex > 0 && (
                              <Button
                                onClick={handleUndoEdit}
                                variant="outline"
                                className="h-12 px-4 border-white/20 text-white hover:bg-white/10"
                                title="Ongedaan maken"
                              >
                                <Undo2 className="w-4 h-4" />
                              </Button>
                            )}
                            {redoStack.length > 0 && (
                              <Button
                                onClick={handleRedoEdit}
                                variant="outline"
                                className="h-12 px-4 border-white/20 text-white hover:bg-white/10"
                                title="Opnieuw uitvoeren"
                              >
                                <Redo2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        )}

                        {/* Quick Edit Options */}
                        <div>
                          <Label className="text-white/80 text-sm font-medium mb-3 block">
                            Snelle Bewerkingen
                          </Label>
                          <div className="grid grid-cols-2 gap-2">
                            <Button
                              onClick={() => setEditPrompt('Maak de foto helderder en scherper')}
                              variant="outline"
                              size="sm"
                              className="border-white/20 text-white hover:bg-white/10"
                            >
                              <Sun className="w-4 h-4 mr-1" />
                              Helderder
                            </Button>
                            <Button
                              onClick={() => setEditPrompt('Verhoog het contrast van de foto')}
                              variant="outline"
                              size="sm"
                              className="border-white/20 text-white hover:bg-white/10"
                            >
                              <Contrast className="w-4 h-4 mr-1" />
                              Contrast
                            </Button>
                            <Button
                              onClick={() => setEditPrompt('Pas een vintage filter toe')}
                              variant="outline"
                              size="sm"
                              className="border-white/20 text-white hover:bg-white/10"
                            >
                              <Sliders className="w-4 h-4 mr-1" />
                              Vintage
                            </Button>
                            <Button
                              onClick={() => setEditPrompt('Maak de foto artistieker en stijlvoller')}
                              variant="outline"
                              size="sm"
                              className="border-white/20 text-white hover:bg-white/10"
                            >
                              <Wand2 className="w-4 h-4 mr-1" />
                              Artistiek
                            </Button>
                          </div>
                        </div>

                        {/* Recente Gegenereerde Foto's in Edit Tab */}
                        {recentPhotos.length > 0 && (
                          <div>
                            <Label className="text-white/80 text-sm font-medium mb-3 block">
                              Recente Gegenereerde Foto's
                            </Label>
                            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                              {recentPhotos.slice(0, 6).map((item) => (
                                <div
                                  key={item.id}
                                  className="group cursor-pointer"
                                  onClick={() => transferToEdit(item.imageUrl)}
                                >
                                  <div className="relative rounded-lg overflow-hidden bg-white/5 aspect-square">
                                    <img
                                      src={item.imageUrl}
                                      alt={item.metadata?.prompt || 'Generated photo'}
                                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                    />
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                      <Edit3 className="w-6 h-6 text-white" />
                                    </div>
                                  </div>
                                  <p className="text-white/60 text-xs mt-1 truncate">
                                    {item.metadata?.prompt || 'Generated photo'}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                </div>

                {/* Edit History */}
                {editHistory.length > 1 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                    className="mt-8"
                  >
                    <Card className="glass-effect border-white/10">
                      <CardHeader>
                        <CardTitle className="text-white flex items-center gap-2">
                          <Clock className="w-5 h-5" />
                          Bewerkingsgeschiedenis
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                          {editHistory.map((imageUrl, index) => (
                            <div
                              key={index}
                              className="group cursor-pointer"
                              onClick={() => setEditedImage(imageUrl)}
                            >
                              <div className="relative rounded-lg overflow-hidden bg-white/5 aspect-square">
                                <img
                                  src={imageUrl}
                                  alt={`Bewerking ${index + 1}`}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                                {index === editHistory.length - 1 && (
                                  <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded">
                                    Huidig
                                  </div>
                                )}
                              </div>
                              <p className="text-white/60 text-xs mt-2">
                                Versie {index + 1}
                              </p>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </TabsContent>
            </Tabs>
          </motion.div>
        </main>
      </div>
    </>
  );

  return (
    <>
      <Helmet>
        <title>Foto Generator - phixo</title>
        <meta name="description" content="Genereer realistische foto's met PHIXO AI technologie." />
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
            {/* Header */}
            <div className="text-center mb-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="flex items-center justify-center mb-6"
              >
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-500 flex items-center justify-center mr-4">
                  <Palette className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold text-white mb-2">Foto Generator</h1>
                  <p className="text-white/70 text-lg">Genereer en bewerk foto's met AI technologie</p>
                </div>
              </motion.div>

            </div>

            <div className="flex items-center justify-center gap-4 text-sm text-white/60 mb-8">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                <span>PHIXO AI</span>
              </div>
              <div className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4" />
                <span>HD Kwaliteit</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>Credits: {credits}</span>
              </div>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 bg-white/10 backdrop-blur-sm">
                <TabsTrigger value="generate" className="data-[state=active]:bg-white/20 data-[state=active]:text-white text-white/70">
                  <Wand2 className="w-4 h-4 mr-2" />
                  Genereren
                </TabsTrigger>
                <TabsTrigger value="edit" className="data-[state=active]:bg-white/20 data-[state=active]:text-white text-white/70">
                  <Edit3 className="w-4 h-4 mr-2" />
                  Bewerken
                </TabsTrigger>
              </TabsList>
              <TabsContent value="generate" className="mt-0">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Preview Section */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="lg:col-span-2 order-1 lg:order-1"
                  >
                    <div className="mb-4">
                      <h3 className="gradient-text text-xl font-semibold flex items-center gap-2">
                        <ImageIcon className="w-5 h-5" />
                        Preview
                      </h3>
                    </div>
                    
                    <BackgroundGradient containerClassName="rounded-2xl" className="bg-slate-900/80 rounded-2xl" animate={false}>
                      <Card className="bg-transparent border-none min-h-[75vh]">
                        <CardContent className="p-6 min-h-[75vh] flex items-center justify-center relative">
                          <LoadingAnimation 
                            isVisible={isLoading} 
                            message="Genereert je foto met PHIXO AI..."
                            title="PHIXO AI"
                          />
                          
                          {generateImage ? (
                            <div className="space-y-4 w-full">
                              <div className="relative rounded-lg overflow-hidden bg-white/5">
                                <img
                                  src={generateImage}
                                  alt="Gegenereerde foto"
                                  className="w-full h-auto max-h-[70vh] object-contain"
                                />
                              </div>
                            </div>
                          ) : (
                            <div className="w-full min-h-[50vh] rounded-lg bg-white/5 border-2 border-dashed border-white/20 flex items-center justify-center">
                              <div className="text-center">
                                <ImageIcon className="w-16 h-16 text-white/40 mx-auto mb-4" />
                                <p className="text-white/60 text-lg">
                                  Je gegenereerde foto verschijnt hier
                                </p>
                                <p className="text-white/40 text-sm mt-2">
                                  Voer een prompt in en klik op "Genereer Foto"
                                </p>
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </BackgroundGradient>
                  </motion.div>

                  {/* Input Section */}
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                    className="lg:col-span-1 order-2 lg:order-2"
                  >
                    <Card className="glass-effect border-white/10">
                      <CardHeader>
                        <CardTitle className="text-white flex items-center gap-2">
                          <Sparkles className="w-5 h-5" />
                          Beschrijf je foto
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div>
                          <label className="text-white/80 text-sm font-medium mb-2 block">
                            Prompt
                          </label>
                          <Textarea
                            placeholder="Beschrijf de foto die je wilt genereren..."
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            className="bg-white/5 border-white/10 text-white placeholder:text-white/40 min-h-[120px]"
                          />
                        </div>

                        <div>
                          <label className="text-white/80 text-sm font-medium mb-2 block">
                            Beeldverhouding
                          </label>
                          <Select value={aspectRatio} onValueChange={setAspectRatio}>
                            <SelectTrigger className="bg-white/5 border-white/10 text-white">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {aspectRatioOptions.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <Button
                          onClick={handleGenerate}
                          disabled={isLoading || !prompt.trim()}
                          className="w-full button-glow h-12 text-base font-semibold"
                        >
                          {isLoading ? (
                            <>
                              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                              Genereren...
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-5 h-5 mr-2" />
                              Genereer Foto (1 credit)
                            </>
                          )}
                        </Button>

                        {/* Action buttons for generated image */}
                        {generateImage && (
                          <div className="flex gap-2">
                            <Button
                              onClick={handleDownload}
                              className="flex-1 bg-green-600 hover:bg-green-700 h-12"
                            >
                              <Download className="w-4 h-4 mr-2" />
                              Download
                            </Button>
                            <Button
                              onClick={() => transferToEdit(generateImage)}
                              className="flex-1 bg-blue-600 hover:bg-blue-700 h-12"
                            >
                              <Edit3 className="w-4 h-4 mr-2" />
                              Bewerken
                            </Button>
                          </div>
                        )}

                        {/* Prompt Suggestions */}
                        <div>
                          <label className="text-white/80 text-sm font-medium mb-3 block">
                            Inspiratie
                          </label>
                          <div className="space-y-2">
                            {promptSuggestions.map((suggestion, index) => (
                              <button
                                key={index}
                                onClick={() => setPrompt(suggestion)}
                                className="w-full text-left p-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white text-sm transition-all"
                              >
                                {suggestion}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Recente Gegenereerde Foto's */}
                        {recentPhotos && recentPhotos.length > 0 && (
                          <div>
                            <Label className="text-white/80 text-sm font-medium mb-3 block">
                              Recente Gegenereerde Foto's
                            </Label>
                            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                              {recentPhotos.slice(0, 6).map((item) => (
                                <div
                                  key={item.id}
                                  className="group cursor-pointer"
                                  onClick={() => transferToEdit(item.imageUrl)}
                                >
                                  <div className="relative rounded-lg overflow-hidden bg-white/5 aspect-square">
                                    <img
                                      src={item.imageUrl}
                                      alt={item.metadata?.prompt || 'Generated photo'}
                                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                    />
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                                  </div>
                                  <p className="text-white/60 text-xs mt-2 truncate">
                                    {item.metadata?.prompt || 'Generated photo'}
                                  </p>
                                  <div className="flex items-center justify-between mt-1">
                                    <span className="text-xs text-gray-500 px-2 py-1 bg-gray-100 rounded">
                                      {item.metadata?.aspectRatio || '1:1'}
                                    </span>
                                    <span className="text-xs text-white/40">
                                      {item.tool === 'foto-generator' ? 'Gegenereerd' : 'Bewerkt'}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                </div>

                {/* History Section */}
                {history.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                    className="mt-8"
                  >
                    <Card className="glass-effect border-white/10">
                      <CardHeader>
                        <CardTitle className="text-white flex items-center gap-2">
                          <Clock className="w-5 h-5" />
                          Recente Generaties
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                          {history.slice(0, 8).map((item) => (
                            <div
                              key={item.id}
                              className="group cursor-pointer"
                              onClick={() => setGenerateImage(item.imageUrl)}
                            >
                              <div className="relative rounded-lg overflow-hidden bg-white/5 aspect-square">
                                <img
                                  src={item.imageUrl}
                                  alt={item.prompt}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                              </div>
                              <p className="text-white/60 text-xs mt-2 truncate">
                                {item.prompt}
                              </p>
                              <span className="text-xs text-gray-500 mt-1 inline-block px-2 py-1 bg-gray-100 rounded">
                                {item.aspectRatio}
                              </span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </TabsContent>

              <TabsContent value="edit" className="mt-0">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Preview Section */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="lg:col-span-2 order-1 lg:order-1"
                  >
                    <div className="mb-4">
                      <h3 className="gradient-text text-xl font-semibold flex items-center gap-2">
                        <Edit3 className="w-5 h-5" />
                        Bewerk Preview
                      </h3>
                    </div>
                    
                    <BackgroundGradient containerClassName="rounded-2xl" className="bg-slate-900/80 rounded-2xl" animate={false}>
                      <Card className="bg-transparent border-none min-h-[75vh]">
                        <CardContent className="p-6 min-h-[75vh] flex items-center justify-center relative">
                          <LoadingAnimation 
                            isVisible={isEditing} 
                            message="Bewerkt je foto met AI..."
                            title="PHIXO AI"
                          />
                          
                          {editedImage ? (
                            <div className="space-y-4 w-full">
                              {/* Voor/Na Slider */}
                              {showBeforeAfter && originalImageForEdit ? (
                                <div className="space-y-4">
                                  <div className="flex items-center justify-center gap-4 mb-2">
                                    <span className="text-white/80 text-sm font-medium">Voor</span>
                                    <div className="flex-1 h-px bg-white/20"></div>
                                    <span className="text-white/80 text-sm font-medium">Na</span>
                                  </div>
                                  <div className="relative rounded-lg overflow-hidden bg-white/5">
                                    <ReactCompareSlider
                                      itemOne={
                                        <ReactCompareSliderImage
                                          src={originalImageForEdit}
                                          alt="Originele foto"
                                          style={{
                                            objectFit: 'contain',
                                            width: '100%',
                                            height: '100%',
                                            maxHeight: '75vh'
                                          }}
                                        />
                                      }
                                      itemTwo={
                                        <ReactCompareSliderImage
                                          src={editedImage}
                                          alt="Bewerkte foto"
                                          style={{
                                            objectFit: 'contain',
                                            width: '100%',
                                            height: '100%',
                                            maxHeight: '75vh'
                                          }}
                                        />
                                      }
                                      position={50}
                                      style={{
                                        display: 'flex',
                                        width: '100%',
                                        height: 'auto',
                                        minHeight: '400px',
                                        maxHeight: '75vh'
                                      }}
                                    />
                                  </div>
                                </div>
                              ) : (
                                <div className="relative rounded-lg overflow-hidden bg-white/5">
                                  <img
                                    src={editedImage}
                                    alt="Bewerkte foto"
                                    className="w-full h-auto max-h-[70vh] object-contain"
                                  />
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="w-full min-h-[50vh] rounded-lg bg-white/5 border-2 border-dashed border-white/20 flex items-center justify-center">
                              <div className="text-center">
                                <Upload className="w-16 h-16 text-white/40 mx-auto mb-4" />
                                <p className="text-white/60 text-lg">
                                  Upload een foto om te bewerken
                                </p>
                                <p className="text-white/40 text-sm mt-2">
                                  Ondersteunde formaten: JPG, PNG, WEBP
                                </p>
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </BackgroundGradient>
                  </motion.div>

                  {/* Input Section */}
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                    className="lg:col-span-1 order-2 lg:order-2"
                  >
                    <Card className="glass-effect border-white/10">
                      <CardHeader>
                        <CardTitle className="text-white flex items-center gap-2">
                          <Edit3 className="w-5 h-5" />
                          Foto Bewerken
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div>
                          <Label className="text-white/80 text-sm font-medium mb-2 block">
                            Upload Foto
                          </Label>
                          <Input
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="bg-white/5 border-white/10 text-white file:bg-white/10 file:text-white file:border-0 file:mr-4 file:py-2 file:px-4 file:rounded-md"
                          />
                        </div>

                        <div>
                          <Label className="text-white/80 text-sm font-medium mb-2 block">
                            Bewerkingsbeschrijving
                          </Label>
                          <Textarea
                            placeholder="Beschrijf hoe je de foto wilt bewerken..."
                            value={editPrompt}
                            onChange={(e) => setEditPrompt(e.target.value)}
                            className="bg-white/5 border-white/10 text-white placeholder:text-white/40 min-h-[120px]"
                          />
                        </div>

                        <Button
                          onClick={handleEdit}
                          disabled={isEditing || isLoading || !editPrompt.trim() || !originalImageForEdit}
                          className="w-full button-glow h-12 text-base font-semibold"
                        >
                          {(isEditing || isLoading) ? (
                            <>
                              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                              Bewerken...
                            </>
                          ) : (
                            <>
                              <Edit3 className="w-5 h-5 mr-2" />
                              Bewerk Foto (1 credit)
                            </>
                          )}
                        </Button>

                        {/* Action buttons for edited image */}
                        {editedImage && (
                          <div className="flex gap-2">
                            <Button
                              onClick={handleDownloadEdited}
                              className="flex-1 bg-green-600 hover:bg-green-700 h-12"
                            >
                              <Download className="w-4 h-4 mr-2" />
                              Download
                            </Button>
                            {historyIndex > 0 && (
                              <Button
                                onClick={handleUndoEdit}
                                variant="outline"
                                className="h-12 px-4 border-white/20 text-white hover:bg-white/10"
                                title="Ongedaan maken"
                              >
                                <Undo2 className="w-4 h-4" />
                              </Button>
                            )}
                            {redoStack.length > 0 && (
                              <Button
                                onClick={handleRedoEdit}
                                variant="outline"
                                className="h-12 px-4 border-white/20 text-white hover:bg-white/10"
                                title="Opnieuw uitvoeren"
                              >
                                <Redo2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        )}

                        {/* Quick Edit Options */}
                        <div>
                          <Label className="text-white/80 text-sm font-medium mb-3 block">
                            Snelle Bewerkingen
                          </Label>
                          <div className="grid grid-cols-2 gap-2">
                            <Button
                              onClick={() => setEditPrompt('Maak de foto helderder en scherper')}
                              variant="outline"
                              size="sm"
                              className="border-white/20 text-white hover:bg-white/10"
                            >
                              <Sun className="w-4 h-4 mr-1" />
                              Helderder
                            </Button>
                            <Button
                              onClick={() => setEditPrompt('Verhoog het contrast van de foto')}
                              variant="outline"
                              size="sm"
                              className="border-white/20 text-white hover:bg-white/10"
                            >
                              <Contrast className="w-4 h-4 mr-1" />
                              Contrast
                            </Button>
                            <Button
                              onClick={() => setEditPrompt('Pas een vintage filter toe')}
                              variant="outline"
                              size="sm"
                              className="border-white/20 text-white hover:bg-white/10"
                            >
                              <Sliders className="w-4 h-4 mr-1" />
                              Vintage
                            </Button>
                            <Button
                              onClick={() => setEditPrompt('Maak de foto artistieker en stijlvoller')}
                              variant="outline"
                              size="sm"
                              className="border-white/20 text-white hover:bg-white/10"
                            >
                              <Wand2 className="w-4 h-4 mr-1" />
                              Artistiek
                            </Button>
                          </div>
                        </div>

                        {/* Recente Gegenereerde Foto's in Edit Tab */}
                        {recentPhotos.length > 0 && (
                          <div>
                            <Label className="text-white/80 text-sm font-medium mb-3 block">
                              Recente Gegenereerde Foto's
                            </Label>
                            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                              {recentPhotos.slice(0, 6).map((item) => (
                                <div
                                  key={item.id}
                                  className="group cursor-pointer"
                                  onClick={() => transferToEdit(item.imageUrl)}
                                >
                                  <div className="relative rounded-lg overflow-hidden bg-white/5 aspect-square">
                                    <img
                                      src={item.imageUrl}
                                      alt={item.metadata?.prompt || 'Generated photo'}
                                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                    />
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                      <Edit3 className="w-6 h-6 text-white" />
                                    </div>
                                  </div>
                                  <p className="text-white/60 text-xs mt-1 truncate">
                                    {item.metadata?.prompt || 'Generated photo'}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                </div>

                {/* Edit History */}
                {editHistory.length > 1 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                    className="mt-8"
                  >
                    <Card className="glass-effect border-white/10">
                      <CardHeader>
                        <CardTitle className="text-white flex items-center gap-2">
                          <Clock className="w-5 h-5" />
                          Bewerkingsgeschiedenis
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                          {editHistory.map((imageUrl, index) => (
                            <div
                              key={index}
                              className="group cursor-pointer"
                              onClick={() => setEditedImage(imageUrl)}
                            >
                              <div className="relative rounded-lg overflow-hidden bg-white/5 aspect-square">
                                <img
                                  src={imageUrl}
                                  alt={`Bewerking ${index + 1}`}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                                {index === editHistory.length - 1 && (
                                  <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded">
                                    Huidig
                                  </div>
                                )}
                              </div>
                              <p className="text-white/60 text-xs mt-2">
                                Versie {index + 1}
                              </p>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </TabsContent>
            </Tabs>
          </motion.div>
        </main>
      </div>
    </>
  );
};

export default FotoGenerator;