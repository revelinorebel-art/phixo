import React, { useState } from 'react';
    import { motion } from 'framer-motion';
    import { Helmet } from 'react-helmet';
    import { Link, useNavigate } from 'react-router-dom';
    import { Image, Sparkles, ArrowLeft, FileUp } from 'lucide-react';
    // import { useAuth } from '@/contexts/AuthContext'; // Temporarily disabled for testing

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';
import Sidebar from '@/components/Layout/Sidebar';
import { v4 as uuidv4 } from 'uuid';
// import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage"; // Temporarily disabled
// import { arrayUnion } from 'firebase/firestore'; // Temporarily disabled


    const PhotoUploader = () => {
  // Mock user data for testing without Firebase
  const user = { uid: 'test-user-123' };
  const userProfile = { photos: [] };
  const credits = 0; // Mock credits for testing
  const updateUserData = (data) => {
    console.log('Mock updateUserData called with:', data);
    return Promise.resolve();
  };
      const navigate = useNavigate();
      const [file, setFile] = useState(null);
      const [filePreview, setFilePreview] = useState(null);
      const [isUploading, setIsUploading] = useState(false);

      const handleFileChange = (event) => {
        const selectedFile = event.target.files?.[0];
        if (selectedFile) {
          if (selectedFile.size > 10 * 1024 * 1024) { // 10MB limit
             toast({ title: "Bestand te groot", description: "Selecteer een bestand kleiner dan 10MB.", variant: "destructive" });
             return;
          }
          setFile(selectedFile);
          
          // Convert file to base64 for preview and later upload
          const reader = new FileReader();
          reader.onload = (e) => {
            const base64Data = e.target.result;
            setFilePreview(base64Data); // Use base64 data for preview
          };
          reader.readAsDataURL(selectedFile);
        }
      };

      const handleContinueToEditor = async () => {
        if (!file || !filePreview) {
          toast({ title: "Geen foto geselecteerd", description: "Selecteer een foto om door te gaan.", variant: "destructive" });
          return;
        }

        setIsUploading(true);
        toast({ title: "Uploaden gestart...", description: "Je foto wordt veilig opgeslagen." });

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
          
          // Store photo data in localStorage for PhotoEditor to access
          localStorage.setItem(`photo_${photoId}`, JSON.stringify(newPhoto));
          
          // Mock data update
          await updateUserData({ photos: [newPhoto] });

          toast({ title: "Upload geslaagd!", description: "Je wordt doorgestuurd naar de editor." });
          navigate(`/edit-photo/${newPhoto.id}`);

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
            <title>Foto Uploaden - phixo</title>
            <meta name="description" content="Upload uw foto voor AI-optimalisatie." />
          </Helmet>

          <div className="flex min-h-screen">
            <Sidebar />
            
            <main className="flex-1 ml-72 p-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="max-w-4xl mx-auto"
              >
                <Link to="/new-project" className="inline-flex items-center gap-2 text-purple-400 hover:text-purple-300 transition-colors mb-6">
                  <ArrowLeft className="w-4 h-4" />
                  Terug naar projectkeuze
                </Link>

                <Card className="glass-effect border-white/10">
                  <CardHeader>
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center">
                        <Image className="w-8 h-8 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-3xl font-bold gradient-text">Foto Optimalisatie</CardTitle>
                        <CardDescription className="text-white/70 text-base">Upload een foto en laat de AI deze verbeteren</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div 
                      className="relative p-8 border-2 border-dashed border-white/20 rounded-2xl text-center cursor-pointer hover:border-purple-500/50 hover:bg-white/5 transition-all"
                      onClick={() => document.getElementById('file-upload').click()}
                    >
                      <input id="file-upload" type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                      <div className="flex flex-col items-center justify-center text-white/70">
                        <FileUp className="w-12 h-12 mb-4 text-purple-400" />
                        <p className="font-semibold text-lg">Klik om te uploaden of sleep een bestand hier</p>
                        <p className="text-sm">PNG, JPG, WEBP tot 10MB</p>
                      </div>
                    </div>

                    {filePreview && (
                      <div className="mt-8">
                        <h3 className="text-lg font-semibold text-white mb-4">Geselecteerde foto</h3>
                        <motion.div
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="relative group w-full max-w-sm mx-auto"
                        >
                           <img  className="w-full h-auto object-contain rounded-lg border border-white/10 bg-gray-900/50" alt={file?.name || 'Preview'} src={filePreview} />
                          <p className="text-sm text-white/70 truncate mt-2 text-center">{file?.name}</p>
                        </motion.div>
                      </div>
                    )}

                    <div className="mt-8 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
                       <div className="text-white/80">
                        <p>Je hebt <span className="font-bold text-purple-400">{credits}</span> credits.</p>
                        <p>Bewerkingen kosten 1 credit per actie.</p>
                      </div>
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
                            Doorgaan naar Editor
                          </div>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </main>
          </div>
        </>
      );
    };

    export default PhotoUploader;
