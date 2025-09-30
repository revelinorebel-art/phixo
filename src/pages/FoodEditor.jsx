import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Helmet } from 'react-helmet';
import { Link, useNavigate, useParams } from 'react-router-dom';
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
  Keyboard
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
import { useCredits } from '@/contexts/CreditsContext';
import { getCategoryPromptSuggestions, getAspectRatioOptions } from '@/lib/seedream';
import ResolutionSelector from '@/components/ui/ResolutionSelector';

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

  const { 
    generatedImage, 
    isLoading, 
    callSeedreamApi 
  } = useSeedream();

  const { credits, checkCredits } = useCredits();

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

    if (!checkCredits(1)) {
      toast({
        title: "Onvoldoende credits",
        description: "Je hebt meer credits nodig om deze functie te gebruiken.",
        variant: "destructive"
      });
      return;
    }

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
                        <span className="text-white/70">Nieuw project</span>
                        <kbd className="px-2 py-1 bg-white/10 rounded text-sm">Ctrl + N</kbd>
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Preview Column */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="lg:col-span-2 order-1 lg:order-1 flex flex-col relative"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="gradient-text text-xl font-semibold">Preview</h3>
                  {(filePreview || generatedImage) && (
                    <Button 
                      onClick={handleClear}
                      variant="outline" 
                      size="sm"
                      className="border-red-500/50 text-red-400 hover:bg-red-500/10 hover:border-red-400"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Nieuw project
                    </Button>
                  )}
                </div>
                
                <BackgroundGradient containerClassName="flex flex-col rounded-2xl min-h-[75vh] w-fit mx-auto" className="bg-slate-900/80 rounded-2xl flex flex-col w-fit" animate={false}>
                  <Card className="bg-transparent border-none flex flex-col h-full w-fit">
                    <CardContent className="flex items-center justify-center relative p-0 min-h-[75vh] w-fit">
                      {isCleared ? (
                        <div className="flex flex-col items-center justify-center min-h-[75vh] min-w-[600px] border-2 border-dashed rounded-xl transition-colors border-white/30 hover:border-orange-400/50">
                          <FileUp className="w-16 h-16 mb-4 text-white/50" />
                          <h3 className="text-xl font-semibold text-white mb-2">
                            Upload een nieuwe foodfoto
                          </h3>
                          <p className="text-white/70 text-center mb-4">
                            Ga terug naar de uploader om een nieuwe foto te selecteren
                          </p>
                          <Button onClick={() => navigate('/food-uploader')} className="button-glow">
                            <Upload className="w-4 h-4 mr-2" />
                            Naar Uploader
                          </Button>
                        </div>
                      ) : (
                        <>
                          <LoadingAnimation 
                            isVisible={isLoading}
                            message="Je foodfoto wordt getransformeerd ✨"
                            className="z-20"
                          />
                          
                          {filePreview && generatedImage && (
                            <ReactCompareSlider
                              itemOne={<ReactCompareSliderImage src={filePreview} alt="Originele foto" style={{objectFit: 'contain', width: '100%', height: '100%', maxHeight: '75vh'}} />}
                              itemTwo={<ReactCompareSliderImage src={generatedImage} alt="AI getransformeerde foto" style={{objectFit: 'contain', width: '100%', height: '100%', maxHeight: '75vh'}} />}
                              className="rounded-xl overflow-hidden"
                              style={{
                                display: 'flex',
                                width: 'auto',
                                height: '75vh',
                                maxWidth: '90vw',
                                aspectRatio: 'auto'
                              }}
                            />
                          )}
                          
                          {filePreview && !generatedImage && (
                            <div 
                              style={{
                                display: 'flex',
                                width: 'auto',
                                height: '75vh',
                                maxWidth: '90vw',
                                aspectRatio: 'auto',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                              className="rounded-xl overflow-hidden"
                            >
                              <img 
                                src={filePreview} 
                                alt="Geüploade foto" 
                                style={{
                                  objectFit: 'contain',
                                  width: '100%',
                                  height: '100%',
                                  maxHeight: '75vh'
                                }}
                                className="rounded-xl"
                              />
                            </div>
                          )}
                        </>
                      )}
                    </CardContent>
                  </Card>
                </BackgroundGradient>
              </motion.div>

              {/* Controls Column */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="order-2 lg:order-2 space-y-6"
              >
                {/* Prompt Section */}
                <BackgroundGradient containerClassName="rounded-2xl" className="bg-slate-900/80 rounded-2xl" animate={false}>
                  <Card className="bg-transparent border-none">
                    <CardHeader>
                      <CardTitle className="text-white text-xl flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-amber-500 rounded-lg flex items-center justify-center">
                          <ChefHat className="w-5 h-5 text-white" />
                        </div>
                        Beschrijving
                      </CardTitle>
                      <CardDescription>
                        Beschrijf hoe je je foodfoto wilt transformeren
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Textarea
                          placeholder="Bijvoorbeeld: Maak deze pizza er professioneler uitzien met perfecte belichting en garnering..."
                          value={prompt}
                          onChange={(e) => setPrompt(e.target.value)}
                          className="min-h-[100px] bg-white/5 border-white/10 text-white placeholder:text-white/50 focus:border-orange-500/50"
                        />
                      </div>
                      
                      <div className="flex gap-2">
                        <Button 
                          onClick={handlePromptSuggestion}
                          variant="outline" 
                          size="sm"
                          className="border-white/20 hover:bg-white/10 text-white/70 hover:text-white"
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

                {/* Action Buttons */}
                <div className="space-y-3">
                  <Button 
                    onClick={handleGenerate}
                    disabled={!uploadedImage || !prompt.trim() || isLoading}
                    className="w-full button-glow h-12 text-base"
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <span>Genereren...</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5" />
                        Transformeer Foodfoto
                      </div>
                    )}
                  </Button>

                  {generatedImage && (
                    <Button 
                      onClick={handleDownload}
                      variant="outline"
                      className="w-full border-white/20 hover:bg-white/10 text-white"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download Resultaat
                    </Button>
                  )}
                </div>
              </motion.div>
            </div>
          </motion.div>
        </main>
      </div>
    </>
  );
};

export default FoodEditor;