import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { ChefHat, FileUp, Sparkles, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';
import Sidebar from '@/components/Layout/Sidebar';
import { BackgroundGradient } from '@/components/ui/background-gradient';

const FoodUploader = () => {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      if (selectedFile.size > 10 * 1024 * 1024) {
        toast({ 
          title: "Bestand te groot", 
          description: "Selecteer een bestand kleiner dan 10MB.", 
          variant: "destructive" 
        });
        return;
      }

      setFile(selectedFile);
      
      const reader = new FileReader();
      reader.onload = (e) => {
        setFilePreview(e.target.result);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleContinueToEditor = async () => {
    if (!file || !filePreview) {
      toast({ title: "Geen foto geselecteerd", description: "Selecteer een foodfoto om door te gaan.", variant: "destructive" });
      return;
    }

    setIsUploading(true);
    toast({ title: "Uploaden gestart...", description: "Je foodfoto wordt veilig opgeslagen." });

    try {
      // Upload image to proxy server to get a proper URL
      const uploadResponse = await fetch('http://localhost:3001/api/upload-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageData: filePreview, // base64 data
          fileName: file.name
        })
      });

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const uploadResult = await uploadResponse.json();
      
      if (!uploadResult.success || !uploadResult.imageUrl) {
        throw new Error('Upload failed: No image URL returned');
      }

      const photoId = uuidv4();
      const newPhoto = {
          id: photoId,
          name: file.name,
          date: new Date().toISOString(),
          url: uploadResult.imageUrl, // Use the proxy server URL
      };

      // Store photo data in localStorage for food editor to access
      localStorage.setItem(`food_photo_${photoId}`, JSON.stringify(newPhoto));

      toast({ title: "Upload geslaagd!", description: "Je wordt doorgestuurd naar de food editor." });
      navigate(`/edit-food-photo/${newPhoto.id}`);

    } catch (error) {
      console.error("Error uploading photo:", error);
      toast({ title: "Upload Fout", description: error.message, variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Upload Foodfoto - phixo</title>
        <meta name="description" content="Upload je foodfoto om te transformeren naar culinaire meesterwerken met AI-technologie." />
      </Helmet>

      <div className="flex min-h-screen">
        <Sidebar />
        
        <main className="flex-1 ml-72 p-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl mx-auto"
          >
            <div className="mb-8">
              <Button 
                variant="ghost" 
                onClick={() => navigate('/new-project')}
                className="text-white/70 hover:text-white mb-4"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Terug naar projectkeuze
              </Button>
              
              <div className="text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2 }}
                  className="w-20 h-20 bg-gradient-to-r from-orange-500 to-amber-500 rounded-2xl flex items-center justify-center mx-auto mb-6"
                >
                  <ChefHat className="w-10 h-10 text-white" />
                </motion.div>
                
                <h1 className="text-4xl font-bold gradient-text mb-4">
                  Upload je Foodfoto
                </h1>
                <p className="text-xl text-white/70">
                  Transformeer je foodfoto's naar culinaire meesterwerken met AI
                </p>
              </div>
            </div>

            <BackgroundGradient containerClassName="rounded-2xl" className="bg-slate-900/80 rounded-2xl" animate={false}>
              <Card className="bg-transparent border-none">
                <CardHeader>
                  <CardTitle className="text-white text-2xl flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-amber-500 rounded-lg flex items-center justify-center">
                      <ChefHat className="w-5 h-5 text-white" />
                    </div>
                    Selecteer je Foodfoto
                  </CardTitle>
                  <CardDescription>
                    Upload een foto van je gerecht om te beginnen met AI-transformatie
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div 
                    className="relative p-8 border-2 border-dashed border-white/20 rounded-2xl text-center cursor-pointer hover:border-orange-500/50 hover:bg-white/5 transition-all"
                    onClick={() => document.getElementById('file-upload').click()}
                  >
                    <input id="file-upload" type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                    <div className="flex flex-col items-center justify-center text-white/70">
                      <FileUp className="w-12 h-12 mb-4 text-orange-400" />
                      <p className="font-semibold text-lg">Klik om te uploaden of sleep een bestand hier</p>
                      <p className="text-sm">PNG, JPG, WEBP tot 10MB</p>
                    </div>
                  </div>

                  {filePreview && (
                    <div className="mt-8">
                      <h3 className="text-lg font-semibold text-white mb-4">Geselecteerde foodfoto</h3>
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="relative group w-full max-w-sm mx-auto"
                      >
                        <img className="w-full h-auto object-contain rounded-lg border border-white/10 bg-gray-900/50" alt={file?.name || 'Preview'} src={filePreview} />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-end">
                          <p className="text-white text-sm p-3 truncate">{file?.name}</p>
                        </div>
                      </motion.div>
                    </div>
                  )}

                  <div className="mt-8 flex justify-center">
                    <Button 
                      className="w-full sm:w-auto button-glow h-12 text-base" 
                      onClick={handleContinueToEditor} 
                      disabled={!file || isUploading}
                    >
                      {isUploading ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          <span>Uploaden...</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-5 h-5" />
                          Doorgaan naar Food Editor
                        </div>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </BackgroundGradient>
          </motion.div>
        </main>
      </div>
    </>
  );
};

export default FoodUploader;