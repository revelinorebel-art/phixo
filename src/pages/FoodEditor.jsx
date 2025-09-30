import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Helmet } from 'react-helmet';
import { ReactCompareSlider, ReactCompareSliderImage } from 'react-compare-slider';
import { 
  ChefHat, 
  Upload, 
  Sparkles, 
  Download, 
  History, 
  ArrowLeft,
  Camera,
  Utensils,
  Coffee,
  Cake,
  Lightbulb,
  FileUp,
  Wand2,
  ImageIcon,
  X,
  Keyboard,
  Cloud,
  Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';
import Sidebar from '@/components/Layout/Sidebar';
import { BackgroundGradient } from '@/components/ui/background-gradient';
import LoadingAnimation from '@/components/ui/loading-animation';
import { useSeedream } from '@/hooks/useSeedream';
import { getCategoryPromptSuggestions, getAspectRatioOptions } from '@/lib/seedream';
import ResolutionSelector from '@/components/ui/ResolutionSelector';
import { uploadEditedPhoto } from '@/services/storageService';

const FoodEditor = () => {
  const navigate = useNavigate();
  const { photoId } = useParams();
  const [uploadedImage, setUploadedImage] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState('original');
  const [resolution, setResolution] = useState('1024x1024');
  const [originalImageDimensions, setOriginalImageDimensions] = useState(null);
  const [originalAspectRatio, setOriginalAspectRatio] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [isCleared, setIsCleared] = useState(false);
  
  // Firebase Storage state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedToStorage, setUploadedToStorage] = useState(false);

  const { 
    generatedImage, 
    isLoading, 
    callSeedreamApi,
    credits
  } = useSeedream();

  // Load photo data from localStorage
  useEffect(() => {
    if (photoId) {
      const photoData = localStorage.getItem(`food_photo_${photoId}`);
      if (photoData) {
        const photo = JSON.parse(photoData);
        setFilePreview(photo.url);
        // For uploaded photos, we need to fetch the image as a File object for API calls
        fetch(photo.url)
          .then(response => response.blob())
          .then(blob => {
            const file = new File([blob], photo.name, { type: blob.type });
            setUploadedImage(file);
          })
          .catch(error => {
            console.error('Error loading photo:', error);
            toast({
              title: "Fout bij laden foto",
              description: "Kon de foto niet laden. Probeer opnieuw.",
              variant: "destructive"
            });
          });
      } else {
        toast({
          title: "Foto niet gevonden",
          description: "De opgevraagde foto kon niet worden gevonden.",
          variant: "destructive"
        });
        navigate('/food-uploader');
      }
    }
  }, [photoId, navigate]);

  // Watch for generatedImage changes to auto-upload to Firebase Storage
  useEffect(() => {
    if (generatedImage && !isUploading && !uploadedToStorage) {
      uploadEditedPhotoToStorage(generatedImage).catch(error => {
        console.error('Auto-upload to Firebase failed:', error);
      });
    }
  }, [generatedImage, isUploading, uploadedToStorage]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'Enter':
            e.preventDefault();
            if (!isLoading && uploadedImage && prompt.trim()) {
              handleGenerate();
            }
            break;
          case 'k':
            e.preventDefault();
            setShowShortcuts(!showShortcuts);
            break;
          case 'h':
            e.preventDefault();
            setShowHistory(!showHistory);
            break;
          case 'n':
            e.preventDefault();
            handleClear();
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isLoading, uploadedImage, prompt, showShortcuts, showHistory]);

  const detectImageDimensions = (file) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const width = img.naturalWidth;
        const height = img.naturalHeight;
        const aspectRatio = width / height;
        
        let aspectRatioString;
        if (Math.abs(aspectRatio - 1) < 0.01) {
          aspectRatioString = '1:1';
        } else if (Math.abs(aspectRatio - 4/3) < 0.01) {
          aspectRatioString = '4:3';
        } else if (Math.abs(aspectRatio - 3/4) < 0.01) {
          aspectRatioString = '3:4';
        } else if (Math.abs(aspectRatio - 16/9) < 0.01) {
          aspectRatioString = '16:9';
        } else if (Math.abs(aspectRatio - 9/16) < 0.01) {
          aspectRatioString = '9:16';
        } else {
          aspectRatioString = `${width}:${height}`;
        }
        
        resolve({
          width,
          height,
          aspectRatio,
          aspectRatioString
        });
      };
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  };

  // Upload edited photo to Firebase Storage
  const uploadEditedPhotoToStorage = async (imageUrl) => {
    try {
      setIsUploading(true);
      setUploadProgress(0);
      setUploadedToStorage(false);

      // Convert URL to blob
      const response = await fetch(imageUrl);
      const blob = await response.blob();

      // Create metadata
      const metadata = {
        category: 'foodfoto',
        prompt: prompt,
        aspectRatio: aspectRatio,
        resolution: resolution,
        originalFileName: uploadedImage?.name || 'unknown',
        editedAt: new Date().toISOString()
      };

      // Upload to Firebase Storage
      const result = await uploadEditedPhoto(blob, metadata, (progress) => {
        setUploadProgress(progress);
      });

      setUploadedToStorage(true);
      
      toast({
        title: "Opgeslagen in Firebase! 🔥",
        description: `Foto opgeslagen als: ${result.fileName}`,
      });

      return result;
    } catch (error) {
      console.error('Upload to Firebase Storage failed:', error);
      toast({
        title: "Upload fout",
        description: "Kon foto niet opslaan in Firebase Storage.",
        variant: "destructive"
      });
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast({
        title: "Prompt vereist",
        description: "Voer een beschrijving in voor je foodfoto.",
        variant: "destructive"
      });
      return;
    }

    if (!uploadedImage) {
      toast({
        title: "Afbeelding vereist",
        description: "Upload eerst een foodfoto om te transformeren.",
        variant: "destructive"
      });
      return;
    }

    if (credits < 1) {
      toast({
        title: "Onvoldoende credits",
        description: "Je hebt meer credits nodig om deze functie te gebruiken.",
        variant: "destructive"
      });
      return;
    }

    // Reset upload status for new generation
    setUploadedToStorage(false);

    toast({
      title: "PHIXO AI is aan het werk... ✨",
      description: "Bezig met transformeren van je foodfoto met PHIXO",
    });

    try {
      console.log('Using original user prompt unchanged:', prompt);
      console.log('Using uploaded image for transformation:', uploadedImage ? 'Yes' : 'No');
      
      await callSeedreamApi(prompt, aspectRatio, 'foodfoto', uploadedImage, true, null, null, resolution, originalImageDimensions);
      
      toast({
        title: "PHIXO bewerking geslaagd! ✨",
        description: "Je foodfoto is succesvol getransformeerd met PHIXO."
      });
    } catch (error) {
      console.error('Generation error:', error);
    }
  };

  const handlePromptSuggestion = () => {
    const categorySuggestions = getCategoryPromptSuggestions('foodfoto');
    setSuggestions(categorySuggestions);
  };

  const applySuggestion = (suggestion) => {
    setPrompt(suggestion);
    setSuggestions([]);
  };

  const handleClear = () => {
    setFilePreview(null);
    setUploadedImage(null);
    setPrompt('');
    setIsCleared(true);
    navigate('/food-uploader');
  };

  const handleDownload = () => {
    if (generatedImage) {
      const link = document.createElement('a');
      link.href = generatedImage;
      link.download = `phixo-food-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Download gestart!",
        description: "Je getransformeerde foodfoto wordt gedownload."
      });
    }
  };

  return (
    <>
      <Helmet>
        <title>Food Editor - phixo</title>
        <meta name="description" content="Transformeer je foodfoto's naar culinaire meesterwerken met AI-technologie." />
      </Helmet>

      <div className="flex min-h-screen">
        <Sidebar />
        
        <main className="flex-1 ml-72 p-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-7xl mx-auto"
          >
            <div className="flex items-center justify-between mb-8">
              <Button 
                variant="ghost" 
                onClick={() => navigate('/food-uploader')}
                className="text-white/70 hover:text-white"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Nieuwe foodfoto
              </Button>
              <div className="flex items-center gap-4">
                <span className="text-white/70">Credits: {credits}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowShortcuts(!showShortcuts)}
                  className="border-white/20 hover:bg-white/10"
                >
                  <Keyboard className="w-4 h-4 mr-2" />
                  Sneltoetsen
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowHistory(!showHistory)}
                  className="border-white/20 hover:bg-white/10"
                >
                  <History className="w-4 h-4 mr-2" />
                  Geschiedenis
                </Button>
              </div>
            </div>

            <div className="text-center mb-12">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 flex items-center justify-center pulse-glow"
              >
                <ChefHat className="w-10 h-10 text-white" />
              </motion.div>
              <h1 className="text-4xl font-bold gradient-text mb-4">Food Editor</h1>
              <p className="text-white/70 text-lg max-w-2xl mx-auto">
                Transformeer je foodfoto's naar culinaire meesterwerken met PHIXO AI
              </p>
            </div>

            {/* Shortcuts Modal */}
            <AnimatePresence>
              {showShortcuts && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                  onClick={() => setShowShortcuts(false)}
                >
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="bg-slate-900 rounded-2xl p-6 max-w-md w-full border border-white/10"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-semibold text-white">Sneltoetsen</h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowShortcuts(false)}
                        className="text-white/70 hover:text-white"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-white/70">Genereren</span>
                        <kbd className="px-2 py-1 bg-white/10 rounded text-sm">Ctrl + Enter</kbd>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-white/70">Sneltoetsen</span>
                        <kbd className="px-2 py-1 bg-white/10 rounded text-sm">Ctrl + K</kbd>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-white/70">Geschiedenis</span>
                        <kbd className="px-2 py-1 bg-white/10 rounded text-sm">Ctrl + H</kbd>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-white/70">Nieuwe foto</span>
                        <kbd className="px-2 py-1 bg-white/10 rounded text-sm">Ctrl + N</kbd>
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="grid lg:grid-cols-3 gap-8">
              {/* Left Column - Controls */}
              <div className="lg:col-span-1 space-y-6">
                {/* Prompt Input */}
                <BackgroundGradient containerClassName="rounded-2xl" className="bg-slate-900/80 rounded-2xl" animate={false}>
                  <Card className="bg-transparent border-none">
                    <CardHeader>
                      <CardTitle className="text-white text-lg flex items-center gap-2">
                        <Wand2 className="w-5 h-5" />
                        Transformatie Prompt
                      </CardTitle>
                      <CardDescription className="text-white/60">
                        Beschrijf hoe je je foodfoto wilt transformeren
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Textarea
                          placeholder="Bijvoorbeeld: Maak van deze pizza een gourmet gerecht met verse kruiden en een elegante presentatie..."
                          value={prompt}
                          onChange={(e) => setPrompt(e.target.value)}
                          className="bg-white/5 border-white/10 text-white placeholder:text-white/40 min-h-[120px] resize-none"
                          onKeyDown={(e) => {
                            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                              e.preventDefault();
                              if (!isLoading && uploadedImage && prompt.trim()) {
                                handleGenerate();
                              }
                            }
                          }}
                        />
                      </div>

                      <div className="flex gap-2">
                        <Button
                          onClick={handleGenerate}
                          disabled={isLoading || !uploadedImage || !prompt.trim()}
                          className="flex-1 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white border-0"
                        >
                          {isLoading ? (
                            <>
                              <LoadingAnimation className="w-4 h-4 mr-2" />
                              Transformeren...
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-4 h-4 mr-2" />
                              Transformeer
                            </>
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={handlePromptSuggestion}
                          className="border-white/20 hover:bg-white/10 text-white"
                        >
                          <Lightbulb className="w-4 h-4 mr-2" />
                          Suggesties
                        </Button>
                      </div>

                      {suggestions.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="space-y-2"
                        >
                          <Label className="text-white/70 text-sm">Klik op een suggestie:</Label>
                          <div className="space-y-2 max-h-40 overflow-y-auto">
                            {suggestions.map((suggestion, index) => (
                              <motion.button
                                key={index}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.05 }}
                                onClick={() => applySuggestion(suggestion)}
                                className="w-full text-left p-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-orange-500/30 transition-all text-white/80 hover:text-white text-sm"
                              >
                                {suggestion}
                              </motion.button>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </CardContent>
                  </Card>
                </BackgroundGradient>

                {/* Settings */}
                <BackgroundGradient containerClassName="rounded-2xl" className="bg-slate-900/80 rounded-2xl" animate={false}>
                  <Card className="bg-transparent border-none">
                    <CardHeader>
                      <CardTitle className="text-white text-lg">Instellingen</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label className="text-white/70 mb-2 block">Aspect Ratio</Label>
                        <Select value={aspectRatio} onValueChange={setAspectRatio}>
                          <SelectTrigger className="bg-white/5 border-white/10 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {getAspectRatioOptions(originalAspectRatio).map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <ResolutionSelector
                        value={resolution}
                        onChange={setResolution}
                        aspectRatio={aspectRatio}
                        originalDimensions={originalImageDimensions}
                      />
                    </CardContent>
                  </Card>
                </BackgroundGradient>
              </div>

              {/* Right Column - Preview */}
              <div className="lg:col-span-2">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3, duration: 0.6 }}
                  className="space-y-6"
                >
                  {/* Image Preview */}
                  <BackgroundGradient containerClassName="rounded-2xl" className="bg-slate-900/80 rounded-2xl" animate={false}>
                    <Card className="bg-transparent border-none">
                      <CardHeader>
                        <CardTitle className="text-white text-lg flex items-center gap-2">
                          <ImageIcon className="w-5 h-5" />
                          Voorbeeld
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="relative">
                          {filePreview && generatedImage ? (
                            <div className="relative">
                              <ReactCompareSlider
                                itemOne={<ReactCompareSliderImage src={filePreview} alt="Originele foodfoto" />}
                                itemTwo={<ReactCompareSliderImage src={generatedImage} alt="Getransformeerde foodfoto" />}
                                className="rounded-xl overflow-hidden"
                              />
                              
                              {/* Storage Upload Status */}
                              {(isUploading || uploadedToStorage) && (
                                <div className="absolute top-4 right-4 bg-black/80 backdrop-blur-sm rounded-lg p-3 flex items-center gap-2">
                                  {isUploading ? (
                                    <>
                                      <Cloud className="w-4 h-4 text-blue-400 animate-pulse" />
                                      <span className="text-white text-sm">Uploaden... {uploadProgress}%</span>
                                    </>
                                  ) : uploadedToStorage ? (
                                    <>
                                      <Check className="w-4 h-4 text-green-400" />
                                      <span className="text-white text-sm">Opgeslagen ☁️</span>
                                    </>
                                  ) : null}
                                </div>
                              )}
                            </div>
                          ) : filePreview ? (
                            <div className="relative">
                              <img 
                                src={filePreview} 
                                alt="Geüploade foodfoto" 
                                className="w-full h-auto rounded-xl"
                              />
                              <div className="absolute inset-0 bg-black/20 rounded-xl flex items-center justify-center">
                                <div className="text-center text-white">
                                  <ChefHat className="w-12 h-12 mx-auto mb-4 opacity-80" />
                                  <p className="text-lg font-medium">Klaar voor transformatie</p>
                                  <p className="text-sm opacity-70">Voer een prompt in en klik op Transformeer</p>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="aspect-video bg-white/5 rounded-xl border-2 border-dashed border-white/20 flex items-center justify-center">
                              <div className="text-center text-white/60">
                                <Upload className="w-12 h-12 mx-auto mb-4" />
                                <p>Upload een foodfoto om te beginnen</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </BackgroundGradient>

                  {/* Action Buttons */}
                  <div className="flex gap-4">
                    <Button
                      variant="outline"
                      onClick={handleClear}
                      className="border-white/20 hover:bg-white/10 text-white"
                    >
                      <FileUp className="w-4 h-4 mr-2" />
                      Nieuwe Foto
                    </Button>
                    {generatedImage && (
                      <Button
                        onClick={handleDownload}
                        className="w-full border-white/20 hover:bg-white/10 text-white"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download Resultaat
                      </Button>
                    )}
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </main>
      </div>
    </>
  );
};

export default FoodEditor;