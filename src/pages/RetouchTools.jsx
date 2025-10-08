import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/components/ui/use-toast';
import Sidebar from '@/components/Layout/Sidebar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { BackgroundGradient } from '@/components/ui/background-gradient';
import LoadingAnimation from '@/components/ui/loading-animation';
import FilterPanel from '@/components/ui/filter-panel';
import AdjustmentPanel from '@/components/ui/adjustment-panel';
import ZoomPanel from '@/components/ui/zoom-panel';
import { 
  ArrowLeft, Upload, Brush, X, Wand2, Download, Sparkles, Settings, Undo, Redo, Target, Eye,
  Maximize, XCircle
} from 'lucide-react';
import useNanoBanana from '@/hooks/useNanoBanana';
import { dataURLtoFile, fileToDataURL, urlToBase64ViaProxy } from '@/lib/image-utils';
import { autoSaveService } from '@/services/autoSaveService';

const RetouchTools = () => {
  const navigate = useNavigate();
  const [photo, setPhoto] = useState(null);
  
  // Nieuwe state voor uitgebreide functies
  const [activeTab, setActiveTab] = useState('retouch');

  // Initialize useNanoBanana hook with initial image
  const { 
    isLoading: currentIsLoading, 
    resultImageUrl, 
    callNanoBananaApi, 
    undo, 
    redo, 
    canUndo, 
    canRedo 
  } = useNanoBanana(photo?.url);
  
  // Retouch state
  const [editHotspot, setEditHotspot] = useState(null);
  const [displayHotspot, setDisplayHotspot] = useState(null);
  const [retouchPrompt, setRetouchPrompt] = useState('');
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [isComparing, setIsComparing] = useState(false);
  
  // Vergrootfunctie state
  const [isEnlarged, setIsEnlarged] = useState(false);
  
  // Refs voor Retouch
  const panStartRef = useRef({ x: 0, y: 0 });
  const clickStartRef = useRef(null);
  const imageContainerRef = useRef(null);
  
  const fileInputRef = useRef(null);
  const imgRef = useRef(null);

  // Get current image to display (either edited result or original)
  const currentImage = resultImageUrl || photo?.url;

  // Helper functie om file naar base64 te converteren
  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
    });
  };

  // File upload handler
  const handleFileUpload = async (file) => {
    if (!file) return;

    try {
      const url = URL.createObjectURL(file);
      const base64 = await fileToBase64(file);
      
      setPhoto({
        file,
        url,
        base64,
        name: file.name
      });
      
      toast({
        title: "Foto geüpload",
        description: "Je kunt nu beginnen met retoucheren",
      });
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload fout",
        description: "Er ging iets mis bij het uploaden van de foto.",
        variant: "destructive",
      });
    }
  };

  // Download functie
  const handleDownload = async () => {
    if (!currentImage) return;
    
    try {
      // Eerst de afbeelding ophalen als blob
      const response = await fetch(currentImage);
      const blob = await response.blob();
      
      // Creëer een object URL voor de blob
      const blobUrl = URL.createObjectURL(blob);
      
      // Creëer een download link en forceer download
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `retouch-result-${Date.now()}.png`;
      link.style.display = 'none';
      document.body.appendChild(link);
      
      // Forceer klik en verwijder daarna
      link.click();
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(blobUrl); // Maak geheugen vrij
      }, 100);
      
      // Sla de foto automatisch op
      if (photo && currentImage && currentImage !== photo.url) {
        await saveRetouchedPhoto(currentImage, 'Download bewerkte foto', 'download');
      }
      
      toast({
        title: "Foto gedownload! 📥",
        description: "De bewerkte foto is gedownload en automatisch opgeslagen.",
      });
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: "Download fout",
        description: "Er ging iets mis bij het downloaden van de foto.",
        variant: "destructive",
      });
    }
  };
  
  // Functie om de foto vergroot te bekijken
  const handleEnlarge = () => {
    setIsEnlarged(true);
  };
  
  // Functie om de vergrote weergave te sluiten
  const handleCloseEnlarged = () => {
    setIsEnlarged(false);
  };
  
  // Automatische opslag functie
  const autoSaveRetouchedPhoto = async (imageUrl, prompt, editType = 'retouch') => {
    if (!imageUrl || imageUrl === photo?.url) return;
    
    try {
      await autoSaveService.autoSavePhoto({
        imageUrl: imageUrl,
        tool: 'retouch-tools',
        prompt: prompt || 'Foto bewerking',
        metadata: {
          editType: editType,
          originalImage: photo?.url,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Error auto-saving retouched photo:', error);
      // Don't show error to user, continue with localStorage fallback
    }
  };

  // Functie om bewerking op te slaan (gebruikt autoSaveService)
  const saveRetouchedPhoto = async (imageUrl, prompt, editType = 'manual') => {
    if (!imageUrl || imageUrl === photo?.url) return;
    
    try {
      // Auto-save via service (Firebase Storage + database)
      await autoSaveRetouchedPhoto(imageUrl, prompt, editType);
      
      toast({
        title: "Foto opgeslagen! 📸",
        description: "Je bewerkte foto is automatisch opgeslagen.",
      });
    } catch (error) {
      console.error('Error saving photo:', error);
      toast({
        title: "Opslaan mislukt",
        description: "Er is een fout opgetreden bij het opslaan van de foto.",
        variant: "destructive",
      });
    }
  };

  // Filter functies - simplified to use useNanoBanana hook
  const handleApplyFilter = async (prompt) => {
    if (!photo) return;

    try {
      // Use current result image as base, or original photo if no edits yet
      let baseImage;
      
      if (resultImageUrl && resultImageUrl !== photo.url) {
        // Convert current result to base64 for API
        baseImage = await urlToBase64ViaProxy(resultImageUrl);
      } else {
        // Use original photo base64
        baseImage = photo.base64;
      }

      const result = await callNanoBananaApi(prompt, {
        toastMessage: 'Filter toepassen',
        baseImage: baseImage
      });
      
      // Als de filter succesvol is toegepast, automatisch opslaan
      if (result && result.success && result.imageUrl) {
        await autoSaveRetouchedPhoto(result.imageUrl, prompt, 'filter');
      }
    } catch (error) {
      console.error('Error applying filter:', error);
      toast({
        title: "Filter fout",
        description: "Kon de filter niet toepassen. Probeer opnieuw.",
        variant: "destructive",
      });
    }
  };

  // Adjustment functies - simplified to use useNanoBanana hook
  const handleApplyAdjustment = async (prompt) => {
    if (!photo) return;

    try {
      // Use current result image as base, or original photo if no edits yet
      let baseImage;
      
      if (resultImageUrl && resultImageUrl !== photo.url) {
        // Convert current result to base64 for API
        baseImage = await urlToBase64ViaProxy(resultImageUrl);
      } else {
        // Use original photo base64
        baseImage = photo.base64;
      }

      const result = await callNanoBananaApi(prompt, {
        toastMessage: 'Aanpassing toepassen',
        baseImage: baseImage
      });
      
      // Als de aanpassing succesvol is toegepast, automatisch opslaan
      if (result && result.success && result.imageUrl) {
        await autoSaveRetouchedPhoto(result.imageUrl, prompt, 'adjustment');
      }
    } catch (error) {
      console.error('Error applying adjustment:', error);
      toast({
        title: "Aanpassing fout",
        description: "Kon de aanpassing niet toepassen. Probeer opnieuw.",
        variant: "destructive",
      });
    }
  };



  // Retouch functies
  const resetZoomAndPan = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handleZoomChange = (newZoom) => {
    const container = imageContainerRef.current;
    const img = imgRef.current;
    if (!container || !img) {
      setZoom(newZoom);
      return;
    }

    const { clientWidth: containerWidth, clientHeight: containerHeight } = container;
    const { clientWidth: imgWidth, clientHeight: imgHeight } = img;

    const prevZoom = zoom;
    const centerX = containerWidth / 2;
    const centerY = containerHeight / 2;
    
    const imagePointX = (centerX - pan.x) / prevZoom;
    const imagePointY = (centerY - pan.y) / prevZoom;
    
    let newPanX = centerX - imagePointX * newZoom;
    let newPanY = centerY - imagePointY * newZoom;

    const zoomedWidth = imgWidth * newZoom;
    const zoomedHeight = imgHeight * newZoom;

    const minPanX = containerWidth - zoomedWidth;
    const minPanY = containerHeight - zoomedHeight;

    if (zoomedWidth > containerWidth) {
      newPanX = Math.max(minPanX, Math.min(0, newPanX));
    } else {
      newPanX = (containerWidth - zoomedWidth) / 2;
    }

    if (zoomedHeight > containerHeight) {
      newPanY = Math.max(minPanY, Math.min(0, newPanY));
    } else {
      newPanY = (containerHeight - zoomedHeight) / 2;
    }

    setZoom(newZoom);
    setPan({ x: newPanX, y: newPanY });
  };

  const handleHotspotSelect = (e) => {
    const img = imgRef.current;
    const container = imageContainerRef.current;

    if (!img || !container || activeTab !== 'retouch') return;

    // Get bounding boxes relative to the viewport
    const imgRect = img.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();

    // Check if the click is outside the image's visible area
    if (
        e.clientX < imgRect.left || e.clientX > imgRect.right ||
        e.clientY < imgRect.top || e.clientY > imgRect.bottom
    ) {
        // Clicked on the letterboxed area, so we ignore it.
        return;
    }

    // Calculate click position relative to the container for the visual hotspot
    const displayX = e.clientX - containerRect.left;
    const displayY = e.clientY - containerRect.top;
    setDisplayHotspot({ x: displayX, y: displayY });

    // Calculate click position relative to the image element itself
    const clickXOnImg = e.clientX - imgRect.left;
    const clickYOnImg = e.clientY - imgRect.top;

    // Convert these coordinates to original, full-resolution image pixel coordinates
    const { naturalWidth, naturalHeight } = img;
    const scaleX = naturalWidth / imgRect.width;
    const scaleY = naturalHeight / imgRect.height;
    
    const originalX = Math.round(clickXOnImg * scaleX);
    const originalY = Math.round(clickYOnImg * scaleY);

    setEditHotspot({ x: originalX, y: originalY });
  };

  const handleRetouchMouseDown = (e) => {
    if (activeTab !== 'retouch' || isComparing) return;
    e.preventDefault();
    clickStartRef.current = { x: e.clientX, y: e.clientY };
    if (zoom > 1) {
        panStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
        setIsPanning(true);
    }
  };

  const handleRetouchMouseMove = (e) => {
    if (!isPanning || !imageContainerRef.current || !imgRef.current) return;

    const container = imageContainerRef.current;
    const img = imgRef.current;

    let newPanX = e.clientX - panStartRef.current.x;
    let newPanY = e.clientY - panStartRef.current.y;
    
    const zoomedWidth = img.clientWidth * zoom;
    const zoomedHeight = img.clientHeight * zoom;

    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;
    
    if (zoomedWidth > containerWidth) {
      const minPanX = containerWidth - zoomedWidth;
      newPanX = Math.max(minPanX, Math.min(0, newPanX));
    } else {
      newPanX = pan.x;
    }

    if (zoomedHeight > containerHeight) {
      const minPanY = containerHeight - zoomedHeight;
      newPanY = Math.max(minPanY, Math.min(0, newPanY));
    } else {
      newPanY = pan.y;
    }

    setPan({ x: newPanX, y: newPanY });
  };

  const handleRetouchMouseUp = (e) => {
    if (activeTab !== 'retouch') return;
    
    if (clickStartRef.current) {
        const dx = e.clientX - clickStartRef.current.x;
        const dy = e.clientY - clickStartRef.current.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < 5) {
            handleHotspotSelect(e);
        }
    }

    setIsPanning(false);
    clickStartRef.current = null;
  };

  const handleRetouchMouseLeave = () => {
    if (isPanning) {
        setIsPanning(false);
        clickStartRef.current = null;
    }
  };

  const handleRetouch = async () => {
    if (!photo || !retouchPrompt.trim() || !editHotspot) {
      toast({
        title: "Retouch fout",
        description: "Selecteer een punt op de afbeelding en voer een beschrijving in",
        variant: "destructive",
      });
      return;
    }

    try {
      // Use current result image as base, or original photo if no edits yet
      let baseImage;
      
      if (resultImageUrl && resultImageUrl !== photo?.url) {
        // Convert current result to base64 for API
        baseImage = await urlToBase64ViaProxy(resultImageUrl);
      } else {
        // Use original photo base64
        baseImage = photo.base64;
      }

      const result = await callNanoBananaApi(retouchPrompt, {
        toastMessage: 'Retouch toepassen',
        baseImage: baseImage,
        hotspot: editHotspot
      });

      if (result && result.success) {
        setEditHotspot(null);
        setDisplayHotspot(null);
        
        // Automatisch opslaan
        if (result.imageUrl) {
          await autoSaveRetouchedPhoto(result.imageUrl, retouchPrompt, 'retouch');
        }
        
        setRetouchPrompt('');
      }
    } catch (error) {
      console.error('Error applying retouch:', error);
      toast({
        title: "Retouch fout",
        description: "Kon de retouch niet toepassen. Probeer opnieuw.",
        variant: "destructive",
      });
    }
  };

  // Effect voor zoom reset bij tab change
  useEffect(() => {
    if (activeTab !== 'retouch') {
        resetZoomAndPan();
    }
  }, [activeTab]);

  return (
    <>
    <div className="flex h-screen bg-gradient-to-b from-background to-background/80 overflow-hidden">
      <Helmet>
        <title>Retouch Tools - phixo</title>
        <meta name="description" content="Bewerk specifieke delen van je foto's met precisie retouch tools." />
      </Helmet>
      
      {/* Vergrote foto modal */}
      {isEnlarged && currentImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
          <div className="relative w-full h-full max-w-[90vw] max-h-[90vh] flex items-center justify-center">
            <img 
              src={currentImage} 
              alt="Vergrote foto" 
              className="max-w-full max-h-full object-contain"
            />
            <button 
              onClick={handleCloseEnlarged}
              className="absolute top-4 right-4 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
            >
              <XCircle className="w-8 h-8" />
            </button>
          </div>
        </div>
      )}
      
      <Sidebar />
      
      <main className="flex-1 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-7xl mx-auto"
          >
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/new-project')}
                className="glass-effect border-white/20 hover:bg-white/10"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Terug
              </Button>
              <div>
                <h1 className="text-3xl font-bold gradient-text">Retouch Tool</h1>
                <p className="text-white/70">Bewerk specifieke delen van je foto's met precisie</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Upload Section */}
              {!photo && (
                <div className="lg:col-span-3">
                  <BackgroundGradient className="rounded-[22px] bg-slate-900/80 p-1">
                    <Card className="bg-transparent border-none shadow-none">
                      <CardHeader className="text-center">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-r from-orange-500 to-red-500 flex items-center justify-center">
                          <Upload className="w-8 h-8 text-white" />
                        </div>
                        <CardTitle className="text-2xl text-white">Upload je foto</CardTitle>
                        <CardDescription className="text-white/70">
                          Kies een foto om te beginnen met retoucheren
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileUpload(e.target.files[0])}
                          className="hidden"
                        />
                        <Button
                          onClick={() => fileInputRef.current?.click()}
                          className="w-full button-glow h-12"
                        >
                          <Upload className="w-5 h-5 mr-2" />
                          Selecteer Foto
                        </Button>
                      </CardContent>
                    </Card>
                  </BackgroundGradient>
                </div>
              )}

              {/* Photo Display */}
              {photo && (
                <div className="lg:col-span-2">
                  <BackgroundGradient className="rounded-[22px] bg-slate-900/80 p-1">
                    <Card className="bg-transparent border-none shadow-none">
                      <CardHeader>
                        <CardTitle className="text-white flex items-center gap-2">
                          <Sparkles className="w-5 h-5" />
                          {currentImage && currentImage !== photo.url ? 'Bewerkte Foto' : 'Originele Foto'}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div 
                          ref={imageContainerRef}
                          className="relative flex items-center justify-center overflow-hidden rounded-xl"
                          style={{
                            height: '75vh',
                            maxWidth: '90vw',
                            cursor: activeTab === 'retouch' && zoom > 1 ? 'grab' : activeTab === 'retouch' ? 'crosshair' : 'default'
                          }}
                          onMouseDown={activeTab === 'retouch' ? handleRetouchMouseDown : undefined}
                          onMouseMove={activeTab === 'retouch' ? handleRetouchMouseMove : undefined}
                          onMouseUp={activeTab === 'retouch' ? handleRetouchMouseUp : undefined}
                          onMouseLeave={activeTab === 'retouch' ? handleRetouchMouseLeave : undefined}
                        >
                          <img
                            ref={imgRef}
                            src={isComparing ? photo.url : (currentImage || photo.url)}
                            alt="Foto voor retoucheren"
                            className="rounded-xl"
                            style={{
                              maxHeight: '100%',
                              maxWidth: '100%',
                              objectFit: 'contain',
                              transform: activeTab === 'retouch' ? `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)` : 'none',
                              transformOrigin: 'center center',
                              transition: isPanning ? 'none' : 'transform 0.2s ease-out'
                            }}
                          />
                          
                          {/* Hotspot Display */}
                          {activeTab === 'retouch' && displayHotspot && (
                            <div
                              className="absolute w-4 h-4 bg-red-500 border-2 border-white rounded-full shadow-lg pointer-events-none"
                              style={{
                                left: displayHotspot.x - 8,
                                top: displayHotspot.y - 8,
                                zIndex: 10
                              }}
                            />
                          )}

                          {/* Loading Overlay */}
                          {currentIsLoading && (
                            <div className="absolute inset-0 bg-black/50 rounded-xl flex items-center justify-center">
                              <LoadingAnimation size="lg" />
                            </div>
                          )}
                        </div>
                        
                        {/* Compare Button - altijd zichtbaar als er een foto is */}
                        {photo && (
                          <div className="mt-4">
                            <div className="flex gap-2 mb-2">
                              <Button
                                onMouseDown={() => setIsComparing(true)}
                                onMouseUp={() => setIsComparing(false)}
                                onMouseLeave={() => setIsComparing(false)}
                                onTouchStart={() => setIsComparing(true)}
                                onTouchEnd={() => setIsComparing(false)}
                                variant="outline"
                                className="flex-1 glass-effect border-white/20"
                                disabled={!resultImageUrl || currentIsLoading}
                              >
                                <Eye className="w-4 h-4 mr-2" />
                                Vergelijk
                              </Button>
                              <Button
                                onClick={handleEnlarge}
                                variant="outline"
                                className="flex-1 glass-effect border-white/20"
                                disabled={!currentImage || currentIsLoading}
                              >
                                <Maximize className="w-4 h-4 mr-2" />
                                Vergroten
                              </Button>
                            </div>
                          </div>
                        )}

                        {/* Download button - alleen zichtbaar als er bewerkingen zijn */}
                        {currentImage && currentImage !== photo.url && (
                          <div className="mt-2">
                            <Button
                              onClick={handleDownload}
                              className="w-full button-glow"
                            >
                              <Download className="w-4 h-4 mr-2" />
                              Download Bewerkte Foto
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </BackgroundGradient>
                </div>
              )}

              {/* Controls - nu altijd zichtbaar als er een foto is */}
              {photo && (
                <div className="lg:col-span-1">
                  <BackgroundGradient className="rounded-[22px] bg-slate-900/80 p-1">
                    <Card className="bg-transparent border-none shadow-none">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-white flex items-center gap-2">
                            <Wand2 className="w-5 h-5" />
                            Bewerking Tools
                          </CardTitle>
                          {/* History Controls */}
                          <div className="flex gap-2">
                            <Button
                              onClick={undo}
                              disabled={!canUndo}
                              variant="outline"
                              size="sm"
                              className="glass-effect border-white/20 p-2"
                            >
                              <Undo className="w-4 h-4" />
                            </Button>
                            <Button
                              onClick={redo}
                              disabled={!canRedo}
                              variant="outline"
                              size="sm"
                              className="glass-effect border-white/20 p-2"
                            >
                              <Redo className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                        
                        {/* Tabs */}
                        <div className="grid grid-cols-3 gap-1 mt-4 bg-white/5 rounded-lg p-1">
                          <Button
                            onClick={() => setActiveTab('retouch')}
                            variant={activeTab === 'retouch' ? 'default' : 'ghost'}
                            size="sm"
                            className={`${activeTab === 'retouch' ? 'bg-white/20' : 'hover:bg-white/10'}`}
                          >
                            <Target className="w-4 h-4 mr-1" />
                            Retouch
                          </Button>
                          <Button
                            onClick={() => setActiveTab('filters')}
                            variant={activeTab === 'filters' ? 'default' : 'ghost'}
                            size="sm"
                            className={`${activeTab === 'filters' ? 'bg-white/20' : 'hover:bg-white/10'}`}
                          >
                            <Sparkles className="w-4 h-4 mr-1" />
                            Filters
                          </Button>
                          <Button
                            onClick={() => setActiveTab('adjustments')}
                            variant={activeTab === 'adjustments' ? 'default' : 'ghost'}
                            size="sm"
                            className={`${activeTab === 'adjustments' ? 'bg-white/20' : 'hover:bg-white/10'}`}
                          >
                            <Settings className="w-4 h-4 mr-1" />
                            Aanpassingen
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-6">

                        {/* Retouch Tab */}
                        {activeTab === 'retouch' && (
                          <>
                            {/* Info */}
                            <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-3">
                              <p className="text-blue-400 text-sm font-medium">🎯 Klik op een punt in de afbeelding om te retoucheren</p>
                            </div>

                            {/* Zoom Controls */}
                            <ZoomPanel 
                              zoom={zoom}
                              onZoomChange={handleZoomChange}
                              onReset={resetZoomAndPan}
                              minZoom={0.5}
                              maxZoom={5}
                              step={0.1}
                            />

                            {/* Hotspot Info */}
                            {editHotspot && (
                              <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-3">
                                <p className="text-green-400 text-sm font-medium">
                                  ✓ Punt geselecteerd op ({editHotspot.x}, {editHotspot.y})
                                </p>
                              </div>
                            )}

                            {/* Prompt Input */}
                            <div>
                              <Label htmlFor="retouchPrompt">Beschrijf de gewenste verandering</Label>
                              <Textarea 
                                id="retouchPrompt" 
                                value={retouchPrompt} 
                                onChange={(e) => setRetouchPrompt(e.target.value)} 
                                placeholder="bv. 'Verwijder deze vlek' of 'Maak dit object groter'" 
                                className="min-h-[100px] input-glow resize-none mt-2" 
                                spellCheck={true} 
                              />
                            </div>

                            {/* Retouch Button */}
                            <Button 
                              onClick={handleRetouch} 
                              disabled={!editHotspot || !retouchPrompt.trim() || currentIsLoading}
                              className="w-full button-glow"
                            >
                              {currentIsLoading ? (
                                <>
                                  Bezig met retoucheren...
                                </>
                              ) : (
                                <>
                                  <Brush className="w-4 h-4 mr-2" />
                                  Retouch Toepassen
                                </>
                              )}
                            </Button>
                          </>
                        )}

                        {/* Filters Tab */}
                        {activeTab === 'filters' && (
                          <FilterPanel 
                            onApplyFilter={handleApplyFilter}
                            isLoading={currentIsLoading}
                          />
                        )}

                        {/* Adjustments Tab */}
                        {activeTab === 'adjustments' && (
                          <AdjustmentPanel 
                            onApplyAdjustment={handleApplyAdjustment}
                            isLoading={currentIsLoading}
                          />
                        )}

                      </CardContent>
                    </Card>
                  </BackgroundGradient>
                </div>
              )}
            </div>
          </motion.div>
        </main>
      </div>
    </>
  );
};

export default RetouchTools;