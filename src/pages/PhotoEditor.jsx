import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Helmet } from 'react-helmet';
import { ReactCompareSlider, ReactCompareSliderImage } from 'react-compare-slider';
// import { useAuth } from '@/contexts/AuthContext'; // Temporarily disabled for testing
import { useCredits } from '@/contexts/CreditsContext';
import { toast } from '@/components/ui/use-toast';
import Sidebar from '@/components/Layout/Sidebar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BackgroundGradient } from '@/components/ui/background-gradient';
import LoadingAnimation from '@/components/ui/loading-animation';
import { 
  ArrowLeft, Sparkles, Download, Undo, Redo, Wand2, Scissors,
  Paintbrush, Sun, Home, Utensils, ShoppingBag, Camera, X, FileUp
} from 'lucide-react';
// useAIApi removed - only using Replicate/Nano Banana
import useNanoBanana from '@/hooks/useNanoBanana';
    

const PhotoEditor = () => {
  const { photoId } = useParams();
  // Mock user profile for testing without Firebase
  const userProfile = { name: 'Test User' };
  const authLoading = false;
  const { credits } = useCredits();
  const navigate = useNavigate();

  const [photo, setPhoto] = useState(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [addWatermark, setAddWatermark] = useState(false);
  const [prompt, setPrompt] = useState('');
  // selectedAI removed - only using Nano Banana (Replicate)

  const [isCleared, setIsCleared] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [photoDimensions, setPhotoDimensions] = useState({ width: 0, height: 0, aspectRatio: 1 });
  const [isInitializing, setIsInitializing] = useState(true);
  


  const initialImageUrl = useMemo(() => 
    photo?.url || null,
    [photo]
  );

  // useAIApi removed - only using Nano Banana (Replicate)
  const { 
    isLoading: isNanoBananaLoading, 
    resultImageUrl: nanoBananaResultUrl, 
    callNanoBananaApi, 
    undo: nanoBananaUndo, 
    redo: nanoBananaRedo, 
    canUndo: nanoBananaCanUndo, 
    canRedo: nanoBananaCanRedo, 
    originalImageUrl: nanoBananaOriginalUrl 
  } = useNanoBanana(initialImageUrl, photoId);



  // Clear project
  const handleClearProject = () => {
    setIsCleared(true);
    setPrompt('');
    localStorage.removeItem(`project_${photoId}`);
    toast({
      title: "Project gewist",
      description: "Je kunt nu een nieuwe foto uploaden.",
    });
  };

  // Load initial state and saved prompt
  useEffect(() => {
    if (!authLoading && userProfile && !isCleared) {
      // Load photo
      const foundPhoto = userProfile.photos?.find(p => p.id === photoId);
      if (foundPhoto) {
        setPhoto(foundPhoto);
      } else if (photoId) {
        const storedPhoto = localStorage.getItem(`photo_${photoId}`);
        if (storedPhoto) {
          setPhoto(JSON.parse(storedPhoto));
        } else {
          setPhoto({
            id: photoId,
            name: 'test-photo.jpg',
            date: new Date().toISOString(),
            url: 'https://via.placeholder.com/800x600/4F46E5/FFFFFF?text=Test+Photo'
          });
        }
      }
      
      // Load saved prompt
      if (photoId) {
        const savedProjectData = localStorage.getItem(`project_${photoId}`);
        if (savedProjectData) {
          try {
            const projectState = JSON.parse(savedProjectData);
            if (projectState?.prompt) {
              setPrompt(projectState.prompt);
            }
          } catch (error) {
            console.error('Error loading project state:', error);
          }
        }
      }
      
      setPageLoading(false);
    }
  }, [photoId, userProfile, authLoading, isCleared]);

  // Simple save function without useCallback
  const saveProjectState = () => {
    if (photo && !isCleared && photoId) {
      const projectState = {
        photo,
        prompt,
        timestamp: Date.now()
      };
      localStorage.setItem(`project_${photoId}`, JSON.stringify(projectState));
    }
  };
      
  useEffect(() => {
    if(!pageLoading && !photo) {
      toast({
        title: "Foto niet gevonden",
        description: "De gevraagde foto kon niet worden gevonden. Je wordt teruggestuurd.",
        variant: "destructive"
      });
      navigate('/my-photos');
    }
  }, [pageLoading, photo, navigate]);



  // Detect photo dimensions when photo is loaded
  useEffect(() => {
    if (photo?.url) {
      const img = new Image();
      img.onload = () => {
        const aspectRatio = img.naturalWidth / img.naturalHeight;
        setPhotoDimensions({
          width: img.naturalWidth,
          height: img.naturalHeight,
          aspectRatio: aspectRatio
        });
      };
      img.src = photo.url;
    }
  }, [photo?.url]);

  // Only using Nano Banana (Replicate) - optimized variables with useMemo
  const currentIsLoading = useMemo(() => isNanoBananaLoading, [isNanoBananaLoading]);
  const currentResultImageUrl = useMemo(() => nanoBananaResultUrl, [nanoBananaResultUrl]);
  const currentOriginalImageUrl = useMemo(() => nanoBananaOriginalUrl, [nanoBananaOriginalUrl]);
  const currentCanUndo = useMemo(() => nanoBananaCanUndo, [nanoBananaCanUndo]);
  const currentCanRedo = useMemo(() => nanoBananaCanRedo, [nanoBananaCanRedo]);
  const currentUndo = useMemo(() => nanoBananaUndo, [nanoBananaUndo]);
  const currentRedo = useMemo(() => nanoBananaRedo, [nanoBananaRedo]);

  // Memoized UI text to prevent unnecessary re-renders
  const promptLabelText = useMemo(() => {
    const baseText = "Beschrijf wat je wilt veranderen";
    const hasEditedImage = currentResultImageUrl && currentResultImageUrl !== currentOriginalImageUrl;
    return hasEditedImage ? `${baseText} (bewerk opnieuw)` : baseText;
  }, [currentResultImageUrl, currentOriginalImageUrl]);

  const promptPlaceholder = useMemo(() => {
    const hasEditedImage = currentResultImageUrl && currentResultImageUrl !== currentOriginalImageUrl;
    return hasEditedImage 
      ? "Beschrijf de volgende bewerking die je wilt toepassen..." 
      : "bv. 'Verander de achtergrond naar een zonnig strand'";
      }, [currentResultImageUrl, currentOriginalImageUrl]);





  const handleApiCall = async (operation, params) => {
    const result = await callNanoBananaApi(params.prompt, params);
    // Clear the prompt field after successful editing to encourage iterative editing
    if (result && result.success) {
      setPrompt('');
    }
  };



  const handleFileUpload = async (file) => {
        if (file.size > 10 * 1024 * 1024) {
          toast({ 
            title: "Bestand te groot", 
            description: "Selecteer een bestand kleiner dan 10MB.", 
            variant: "destructive" 
          });
          return;
        }

        const reader = new FileReader();
        reader.onload = async (e) => {
          try {
            const base64Data = e.target.result;
            
            // Upload to proxy server
            const uploadResponse = await fetch('http://localhost:3001/api/upload-image', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                imageData: base64Data,
                fileName: file.name
              })
            });

            if (!uploadResponse.ok) {
              throw new Error('Upload failed');
            }

            const uploadResult = await uploadResponse.json();
            
            if (uploadResult.success && uploadResult.imageUrl) {
              const newPhoto = {
                id: photoId,
                name: file.name,
                date: new Date().toISOString(),
                url: uploadResult.imageUrl,
              };
              
              setPhoto(newPhoto);
              setIsCleared(false);
              localStorage.setItem(`photo_${photoId}`, JSON.stringify(newPhoto));
              
              toast({
                title: "Foto geüpload!",
                description: "Je kunt nu beginnen met bewerken.",
              });
            }
          } catch (error) {
            console.error('Upload error:', error);
            toast({
              title: "Upload mislukt",
              description: "Er is een fout opgetreden bij het uploaden.",
              variant: "destructive",
            });
          }
        };
    reader.readAsDataURL(file);
  };

  // Drag and drop handlers
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleDownload = () => {
    if (!currentResultImageUrl) return;
    fetch(currentResultImageUrl)
      .then(response => response.blob())
      .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `${photo.name}_edited_phixo.jpg`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        toast({ title: "Download gestart!", description: "Je bewerkte foto wordt gedownload." });
      })
      .catch(() => toast({ title: "Download mislukt", description: "Kon de afbeelding niet downloaden.", variant: "destructive" }));
  };


  if (pageLoading || authLoading || !photo) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 ml-72 p-8 flex items-center justify-center">
          <div className="text-center flex flex-col items-center gap-4">
            <Sparkles className="w-12 h-12 text-purple-400 animate-pulse"/>
            <p className="text-lg text-white">Editor laden, een moment geduld...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Foto Bewerken: {photo?.name} - phixo</title>
        <meta name="description" content={`Bewerk en optimaliseer '${photo?.name}' met krachtige AI-tools.`} />
      </Helmet>
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 ml-72 p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="lg:col-span-2 flex flex-col relative">
            <div className="flex items-center justify-between mb-4">
              <Link to="/my-photos" className="inline-flex items-center gap-2 text-purple-400 hover:text-purple-300 transition-colors">
                <ArrowLeft className="w-4 h-4" />
                Terug naar Mijn Foto's
              </Link>
              <div className="flex items-center gap-2">
                <Button onClick={currentUndo} disabled={!currentCanUndo || currentIsLoading} variant="outline" size="icon" className="border-white/20 hover:bg-white/10 w-10 h-10"><Undo className="w-4 h-4"/></Button>
                <Button onClick={currentRedo} disabled={!currentCanRedo || currentIsLoading} variant="outline" size="icon" className="border-white/20 hover:bg-white/10 w-10 h-10"><Redo className="w-4 h-4"/></Button>
              </div>
            </div>
                
                <div className="flex items-center justify-between mb-4">
                  <h3 className="gradient-text text-xl font-semibold">Preview</h3>
                  {!isCleared && (
                    <Button 
                      onClick={handleClearProject}
                      variant="outline" 
                      size="sm"
                      className="border-red-500/50 text-red-400 hover:bg-red-500/10 hover:border-red-400"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Clear
                    </Button>
                  )}
                </div>
                
                <BackgroundGradient containerClassName="flex flex-col rounded-2xl min-h-[75vh] w-fit mx-auto" className="bg-slate-900/80 rounded-2xl flex flex-col w-fit" animate={false}>
                  <Card className="bg-transparent border-none flex flex-col h-full w-fit">
                    <CardContent className="flex items-center justify-center relative p-0 min-h-[75vh] w-fit">
                      {isCleared ? (
                        <div 
                          className={`flex flex-col items-center justify-center min-h-[75vh] min-w-[600px] border-2 border-dashed rounded-xl transition-colors ${
                            dragActive ? 'border-purple-400 bg-purple-400/10' : 'border-white/30 hover:border-purple-400/50'
                          }`}
                          onDragEnter={handleDrag}
                          onDragLeave={handleDrag}
                          onDragOver={handleDrag}
                          onDrop={handleDrop}
                        >
                          <FileUp className={`w-16 h-16 mb-4 ${dragActive ? 'text-purple-400' : 'text-white/50'}`} />
                          <h3 className="text-xl font-semibold text-white mb-2">
                            {dragActive ? 'Laat je foto hier vallen' : 'Sleep een foto hierheen'}
                          </h3>
                          <p className="text-white/70 text-center mb-4">
                            Of klik om een bestand te selecteren
                          </p>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                            className="hidden"
                            id="file-upload"
                          />
                          <Button 
                            onClick={() => document.getElementById('file-upload')?.click()}
                            className="bg-purple-600 hover:bg-purple-700"
                          >
                            Selecteer Foto
                          </Button>
                        </div>
                      ) : (
                        <>
                          <LoadingAnimation 
                            isVisible={currentIsLoading}
                            message="PHIXO is aan het werk..."
                            className="z-20"
                          />
                          
                          {currentOriginalImageUrl && currentResultImageUrl && (
                            <div className="relative">
                              <ReactCompareSlider
                                itemOne={<ReactCompareSliderImage src={currentOriginalImageUrl} alt="Originele afbeelding" style={{objectFit: 'contain', width: '100%', height: '100%', maxHeight: '75vh'}} />}
                                itemTwo={<ReactCompareSliderImage src={currentResultImageUrl} alt="Bewerkte afbeelding" style={{objectFit: 'contain', width: '100%', height: '100%', maxHeight: '75vh'}} />}
                                className="rounded-xl overflow-hidden"
                                style={{
                                  display: 'flex',
                                  width: 'auto',
                                  height: '75vh',
                                  maxWidth: '90vw',
                                  aspectRatio: 'auto'
                                }}
                              />

                            </div>
                          )}
                        </>
                      )}
                    </CardContent>
                  </Card>
                </BackgroundGradient>
                

              </motion.div>

              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="lg:col-span-1 flex flex-col">
                {!isCleared ? (
                  <Card className="glass-effect border-white/10 flex-grow flex flex-col">
                    <CardHeader>
                      <CardTitle className="text-white text-2xl flex items-center gap-2">
                        <Sparkles className="w-6 h-6 text-purple-400"/> 
                        PHIXO AI Editor ✨
                      </CardTitle>

                  </CardHeader>
                  <CardContent className="flex-grow flex flex-col">
                      <Tabs defaultValue="prompt" className="w-full flex-grow flex flex-col">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="prompt">Vrije Invoer</TabsTrigger>
                            <TabsTrigger value="tools">Snelle Tools</TabsTrigger>
                        </TabsList>
                        <TabsContent value="prompt" className="flex-grow mt-4">
                            <div className="space-y-4 h-full flex flex-col">
                                <div>
                                  <Label htmlFor="prompt">Beschrijf wat je wilt veranderen</Label>
                                </div>
                                <Textarea id="prompt" value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="bv. 'Verander de achtergrond naar een zonnig strand'" className="min-h-[120px] max-h-[200px] input-glow resize-none" spellCheck={true} lang="nl"/>
                                <Button onClick={() => handleApiCall('generative_edit', { prompt, toastMessage: "Vrije invoer bewerking" })} disabled={currentIsLoading || !prompt} className="w-full button-glow">
                                    <Wand2 className="w-4 h-4 mr-2"/> Genereer met PHIXO
                                </Button>
                            </div>
                        </TabsContent>
                        <TabsContent value="tools" className="flex-grow mt-4 overflow-y-auto pr-2">
                            <div className="space-y-4">
                               <Button onClick={() => handleApiCall('generative_edit', {prompt: "Verbeter de belichting en het contrast van de afbeelding voor een professionele, heldere uitstraling", toastMessage: 'Licht & Contrast'})} disabled={currentIsLoading} variant="outline" className="w-full justify-start border-white/20 hover:bg-white/10">
                                  <Sun className="w-4 h-4 mr-3" /> Licht & Contrast
                                </Button>
                               <Button onClick={() => handleApiCall('generative_edit', {prompt: "Verwijder de achtergrond en maak deze transparant. Geef een PNG terug.", toastMessage: 'Verwijder Achtergrond'})} disabled={currentIsLoading} variant="outline" className="w-full justify-start border-white/20 hover:bg-white/10">
                                  <Scissors className="w-4 h-4 mr-3" /> Verwijder Achtergrond
                                </Button>
                               <Button onClick={() => handleApiCall('generative_edit', {prompt: "Vervang de achtergrond met een professionele, onscherpe studio-achtergrond in grijstinten.", toastMessage: 'Vervang Achtergrond'})} disabled={currentIsLoading} variant="outline" className="w-full justify-start border-white/20 hover:bg-white/10">
                                  <Paintbrush className="w-4 h-4 mr-3" /> Vervang Achtergrond
                                </Button>
                              <Separator className="my-4"/>
                              <div className="flex items-center justify-between pt-2">
                                <Label htmlFor="watermark" className="flex items-center gap-2">Watermerk Toevoegen</Label>
                                <Switch id="watermark" checked={addWatermark} onCheckedChange={setAddWatermark} />
                              </div>
                            </div>
                        </TabsContent>

                      </Tabs>
                      
                      <div className="mt-auto pt-6">
                          <p className="text-center text-sm text-white/70 mb-4">Elke bewerking kost 1 credit. Resterend: <span className="font-bold text-purple-400">{credits}</span></p>
                          <Button onClick={handleDownload} disabled={currentIsLoading || currentResultImageUrl === currentOriginalImageUrl} className="w-full button-glow">
                              <Download className="w-4 h-4 mr-2"/> Download Bewerking
                          </Button>
                      </div>
                  </CardContent>
                </Card>
                ) : (
                  <Card className="glass-effect border-white/10 flex-grow flex flex-col">
                    <CardContent className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <Sparkles className="w-12 h-12 text-purple-400 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-white mb-2">Upload een foto</h3>
                        <p className="text-white/70">Upload een foto om te beginnen met bewerken</p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </motion.div>
            </main>
          </div>
        </>
      );
    };

    export default PhotoEditor;
