import React, { useEffect, useState } from 'react';
    import { motion } from 'framer-motion';
    import { Helmet } from 'react-helmet';
    import { Link } from 'react-router-dom';
    import { Image, Upload, Trash2, Edit, Filter, Download, Search, Grid, List, ArrowLeft, RefreshCw } from 'lucide-react';
    import { Button } from '@/components/ui/button';
    import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/card';
    import { Input } from '@/components/ui/input';
    import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
    import { toast } from '@/components/ui/use-toast';
    import Sidebar from '@/components/Layout/Sidebar';
    import { useAuth } from '@/contexts/AuthContext';
import { useImageStorage, useImageHistory } from '@/hooks/useFirebase';
import { storageService } from '@/services/storageService';
import { databaseService } from '@/services/databaseService';

    const MyPhotos = () => {
    const { user, userProfile, updateUserData } = useAuth();
    const { getUserImages } = useImageStorage();
const { history: imageHistory, loading: loadingImageHistory, refreshHistory } = useImageHistory();
    const [photos, setPhotos] = useState([]);
    const [filteredPhotos, setFilteredPhotos] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState('all');
    const [viewMode, setViewMode] = useState('grid');
    const [loadingFirebasePhotos, setLoadingFirebasePhotos] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);

      useEffect(() => {
    const loadAllPhotos = async () => {
      // Load photos from localStorage where they are actually saved
      const savedPhotos = JSON.parse(localStorage.getItem('myPhotos') || '[]');
      console.log('🔍 DEBUG: localStorage myPhotos:', savedPhotos);
      console.log('🔍 DEBUG: localStorage keys:', Object.keys(localStorage));
      console.log('🔍 DEBUG: User authenticated:', !!user);
      console.log('🔍 DEBUG: User profile:', userProfile);
      
      let allPhotos = [...savedPhotos];
      let formattedFirebasePhotos = [];
      let formattedHistoryPhotos = [];

      // Also check userProfile.photos for backward compatibility
      if (userProfile && userProfile.photos) {
        const userPhotos = userProfile.photos.map(photo => ({
          ...photo,
          source: 'userProfile'
        }));
        allPhotos = [...allPhotos, ...userPhotos];
      }

      // Load photos from Firebase Storage
      if (user) {
        try {
          setLoadingFirebasePhotos(true);
          const firebasePhotos = await getUserImages();
          console.log('Loaded photos from Firebase Storage:', firebasePhotos);
          
          // Convert Firebase photos to our format
          formattedFirebasePhotos = firebasePhotos.map(photo => ({
            id: photo.name, // Use filename as ID
            name: photo.metadata?.originalName || photo.name,
            url: photo.url,
            date: photo.timeCreated,
            category: photo.metadata?.category || 'bewerkt',
            prompt: photo.metadata?.prompt || '',
            source: 'firebase',
            size: photo.size,
            contentType: photo.contentType,
            metadata: photo.metadata
          }));
          
          allPhotos = [...allPhotos, ...formattedFirebasePhotos];
        } catch (error) {
          console.error('Error loading Firebase photos:', error);
          toast({
            title: "Fout bij laden Firebase foto's",
            description: "Kon niet alle foto's laden uit de cloud.",
            variant: "destructive"
          });
        } finally {
          setLoadingFirebasePhotos(false);
        }
      }

      // Load photos from Image History (generated photos)
      if (imageHistory && imageHistory.length > 0) {
        console.log('Loaded photos from Image History:', imageHistory);
        
        // Convert image history to our format
        formattedHistoryPhotos = imageHistory.map(item => ({
          id: item.id || `history-${Date.now()}-${Math.random()}`,
          name: `Gegenereerde foto - ${item.prompt?.substring(0, 30) || 'Onbekend'}...`,
          url: item.imageUrl,
          date: item.createdAt || item.timestamp || new Date().toISOString(),
          category: 'ai-gegenereerd',
          prompt: item.prompt || '',
          source: 'imageHistory',
          type: 'ai-generated',
          aspectRatio: item.aspectRatio || '1:1'
        }));
        
        allPhotos = [...allPhotos, ...formattedHistoryPhotos];
      }

      // Merge and deduplicate based on multiple criteria
      const uniquePhotos = allPhotos.filter((photo, index, self) => {
        return index === self.findIndex(p => {
          // Primary deduplication by URL
          if (p.url === photo.url) return true;
          
          // Secondary deduplication by prompt + timestamp (within 5 seconds)
          if (p.prompt && photo.prompt && p.prompt === photo.prompt) {
            const pTime = new Date(p.date || p.createdAt || p.timestamp);
            const photoTime = new Date(photo.date || photo.createdAt || photo.timestamp);
            const timeDiff = Math.abs(pTime - photoTime);
            
            // If same prompt and created within 5 seconds, consider duplicate
            if (timeDiff < 5000) return true;
          }
          
          // Tertiary deduplication by Firebase path (if available)
          if (p.firebasePath && photo.firebasePath && p.firebasePath === photo.firebasePath) {
            return true;
          }
          
          return false;
        });
      });
      
      // Sort by date (newest first)
      uniquePhotos.sort((a, b) => new Date(b.date) - new Date(a.date));
      
      console.log('🔍 DEBUG: Photo loading summary:');
      console.log('  - localStorage photos:', savedPhotos?.length || 0);
      console.log('  - userProfile photos:', userProfile?.photos?.length || 0);
      console.log('  - Firebase photos:', formattedFirebasePhotos?.length || 0);
      console.log('  - imageHistory photos:', formattedHistoryPhotos?.length || 0);
      console.log('  - Total before deduplication:', allPhotos?.length || 0);
      console.log('  - Total after deduplication:', uniquePhotos?.length || 0);
      console.log('  - Duplicates removed:', (allPhotos?.length || 0) - (uniquePhotos?.length || 0));
      console.log('Final photos after merge:', uniquePhotos);
      setPhotos(uniquePhotos);
    };

    loadAllPhotos();
  }, [user, userProfile, getUserImages, imageHistory, loadingImageHistory, refreshKey]);

  // Refresh function that can be called to reload all photos
  const refreshPhotos = async () => {
    console.log('🔄 Refreshing photos...');
    await refreshHistory(); // Refresh image history first
    setRefreshKey(prev => prev + 1); // Trigger useEffect to reload all photos
  };

  // Auto-refresh when window gains focus (user returns from other tabs/apps)
  useEffect(() => {
    const handleFocus = () => {
      console.log('🔄 Window focused - auto-refreshing photos...');
      refreshPhotos();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  // Real-time updates: Listen for localStorage changes (when photos are auto-saved)
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'myPhotos' || e.key === null) {
        console.log('🔄 localStorage changed - auto-refreshing photos...');
        refreshPhotos();
      }
    };

    // Listen for storage events from other tabs/windows
    window.addEventListener('storage', handleStorageChange);

    // Also listen for custom events from the same tab (when AutoSaveService saves)
    const handleCustomStorageChange = () => {
      console.log('🔄 Custom storage event - auto-refreshing photos...');
      refreshPhotos();
    };

    window.addEventListener('localStorageUpdated', handleCustomStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('localStorageUpdated', handleCustomStorageChange);
    };
  }, []);

  // Periodic refresh every 30 seconds to catch any missed updates
  useEffect(() => {
    const interval = setInterval(() => {
      console.log('🔄 Periodic refresh - checking for new photos...');
      refreshPhotos();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, []);

      // Filter and search photos
      useEffect(() => {
        let filtered = photos;

        // Filter by category
        if (filterCategory !== 'all') {
          filtered = filtered.filter(photo => photo.category === filterCategory);
        }

        // Search by name or prompt
        if (searchTerm) {
          filtered = filtered.filter(photo => 
            photo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (photo.prompt && photo.prompt.toLowerCase().includes(searchTerm.toLowerCase()))
          );
        }

        setFilteredPhotos(filtered);
      }, [photos, filterCategory, searchTerm]);

      const handleDelete = async (photoId, photoUrl) => {
        try {
            console.log('🗑️ Starting delete process for photo:', { photoId, photoUrl });
            
            // Find the photo to get all its metadata
            const photo = photos.find(p => p.id === photoId);
            console.log('📸 Found photo to delete:', photo);

            // 1. Delete from localStorage
            const savedPhotos = JSON.parse(localStorage.getItem('myPhotos') || '[]');
            const updatedPhotos = savedPhotos.filter(p => p.id !== photoId);
            localStorage.setItem('myPhotos', JSON.stringify(updatedPhotos));
            console.log('✅ Removed from localStorage');

            // 2. Delete from Firebase Storage if it's a Firebase URL
            if (photoUrl && photoUrl.includes('firebasestorage.googleapis.com')) {
              try {
                // Extract the file path from the Firebase URL
                const urlParts = photoUrl.split('/');
                const encodedPath = urlParts[urlParts.length - 1].split('?')[0];
                const filePath = decodeURIComponent(encodedPath);
                
                // Remove the 'images/' prefix if present since storageService adds it
                const cleanPath = filePath.startsWith('images/') ? filePath.replace('images/', '') : filePath;
                
                console.log('🔥 Attempting to delete from Firebase Storage:', cleanPath);
                await storageService.deleteImage(cleanPath);
                console.log('✅ Successfully deleted from Firebase Storage');
              } catch (storageError) {
                console.warn('⚠️ Firebase Storage delete failed (photo may not exist):', storageError.message);
                // Don't throw error - continue with other cleanup
              }
            }

            // 3. Delete from Firebase Storage using firebasePath if available
            if (photo?.firebasePath && photo.firebasePath !== photoUrl) {
              try {
                console.log('🔥 Attempting to delete using firebasePath:', photo.firebasePath);
                await storageService.deleteImage(photo.firebasePath);
                console.log('✅ Successfully deleted using firebasePath');
              } catch (storageError) {
                console.warn('⚠️ Firebase Storage delete via firebasePath failed:', storageError.message);
              }
            }

            // 4. Delete from database (imageHistory)
            if (user && photo && photoUrl) {
              try {
                console.log('🗄️ Attempting to delete from database...', {
                  photoUrl,
                  firebasePath: photo.firebasePath,
                  imagePath: photo.imagePath,
                  source: photo.source
                });
                
                // Try with photoUrl first, then firebasePath if available
                let deleteResult = await databaseService.deleteImageGeneration(photoUrl);
                
                // If no records deleted and we have a firebasePath, try that too
                if (deleteResult.deletedCount === 0 && photo.firebasePath && photo.firebasePath !== photoUrl) {
                  console.log('🔄 Trying with firebasePath...');
                  deleteResult = await databaseService.deleteImageGeneration(photo.firebasePath);
                }
                
                // If still no records deleted and we have an imagePath, try that too
                if (deleteResult.deletedCount === 0 && photo.imagePath && photo.imagePath !== photoUrl && photo.imagePath !== photo.firebasePath) {
                  console.log('🔄 Trying with imagePath...');
                  deleteResult = await databaseService.deleteImageGeneration(photo.imagePath);
                }
                
                console.log('✅ Database delete result:', deleteResult);
                
                // Refresh history to update the UI
                await refreshHistory();
                console.log('✅ Refreshed database history');
              } catch (dbError) {
                console.warn('⚠️ Database delete failed:', dbError.message);
              }
            }

            // 5. Update userProfile if it's from there
            if (photo && photo.source === 'userProfile' && user) {
              try {
                const userPhotos = photos.filter(p => p.source === 'userProfile' && p.id !== photoId);
                await updateUserData({ photos: userPhotos });
                console.log('✅ Updated userProfile');
              } catch (profileError) {
                console.warn('⚠️ UserProfile update failed:', profileError.message);
              }
            }

            // 6. Update local state
            setPhotos(prevPhotos => prevPhotos.filter(p => p.id !== photoId));

            // 7. Clean up localStorage histories (Seedream and Imagen4)
            try {
              // Clean Seedream history
              const phixoHistory = JSON.parse(localStorage.getItem('phixo_history') || '[]');
              const updatedPhixoHistory = phixoHistory.filter(item => item.imageUrl !== photoUrl);
              if (updatedPhixoHistory.length !== phixoHistory.length) {
                localStorage.setItem('phixo_history', JSON.stringify(updatedPhixoHistory));
                console.log('✅ Cleaned Seedream history');
              }

              // Clean Imagen4 history
              const imagen4History = JSON.parse(localStorage.getItem('imagen4_history') || '[]');
              const updatedImagen4History = imagen4History.filter(item => item.imageUrl !== photoUrl);
              if (updatedImagen4History.length !== imagen4History.length) {
                localStorage.setItem('imagen4_history', JSON.stringify(updatedImagen4History));
                console.log('✅ Cleaned Imagen4 history');
              }
            } catch (historyError) {
              console.warn('⚠️ History cleanup failed:', historyError.message);
            }

            // 8. Dispatch custom event to notify other components
            window.dispatchEvent(new CustomEvent('localStorageUpdated'));

            console.log('✅ Delete process completed successfully');
            toast({
              title: "Foto verwijderd! 🗑️",
              description: "De foto is succesvol verwijderd uit alle locaties.",
            });

        } catch(error) {
            console.error('❌ Delete process failed:', error);
            toast({ 
              title: "Fout bij verwijderen", 
              description: `Er is een fout opgetreden: ${error.message}`, 
              variant: "destructive" 
            });
        }
      };

      const handleDownload = async (photoUrl, photoName) => {
        try {
          const response = await fetch(photoUrl);
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `${photoName}.jpg`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
          
          toast({
            title: "Download gestart! 📥",
            description: "Je foto wordt gedownload.",
          });
        } catch (error) {
          console.error('Download error:', error);
          toast({
            title: "Download mislukt",
            description: "Er is een fout opgetreden bij het downloaden.",
            variant: "destructive",
          });
        }
      };

      // Get unique categories for filter
      const categories = ['all', ...new Set(photos.map(photo => photo.category).filter(Boolean))];

      return (
        <>
          <Helmet>
            <title>Mijn Foto's - phixo</title>
            <meta name="description" content="Beheer en optimaliseer uw foto's met AI-technologie. Upload, bewerk en download uw geoptimaliseerde afbeeldingen." />
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
                {/* Header with navigation */}
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <Link to="/dashboard">
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="border-white/20 hover:bg-white/10 text-white"
                      >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Terug naar Dashboard
                      </Button>
                    </Link>
                    <div>
                      <h1 className="text-4xl font-bold gradient-text mb-2">Mijn Foto's</h1>
                      <p className="text-white/70 text-lg">Beheer en optimaliseer je foto's met AI</p>
                      <p className="text-white/50 text-sm mt-1">
                        {filteredPhotos.length} van {photos.length} foto's
                        {(loadingFirebasePhotos || loadingImageHistory) && (
                          <span className="ml-2 text-blue-400">
                            • Laden van foto's...
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Button 
                      onClick={refreshPhotos}
                      variant="outline"
                      className="border-white/20 hover:bg-white/10 text-white"
                      disabled={loadingFirebasePhotos || loadingImageHistory}
                    >
                      <RefreshCw className={`w-4 h-4 mr-2 ${(loadingFirebasePhotos || loadingImageHistory) ? 'animate-spin' : ''}`} />
                      Vernieuwen
                    </Button>
                    <Link to="/upload-photos">
                      <Button className="button-glow">
                        <Upload className="w-4 h-4 mr-2" />
                        Upload Foto's
                      </Button>
                    </Link>
                  </div>
                </div>

                {/* Search and Filter Controls */}
                <div className="flex flex-col sm:flex-row gap-4 mb-8">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40 w-4 h-4" />
                    <Input
                      placeholder="Zoek foto's..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/40"
                    />
                  </div>
                  
                  <Select value={filterCategory} onValueChange={setFilterCategory}>
                    <SelectTrigger className="w-full sm:w-48 bg-white/5 border-white/10 text-white">
                      <Filter className="w-4 h-4 mr-2" />
                      <SelectValue placeholder="Filter categorie" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Alle categorieën</SelectItem>
                      {categories.filter(cat => cat !== 'all').map(category => (
                        <SelectItem key={category} value={category}>
                          {category.charAt(0).toUpperCase() + category.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <div className="flex gap-2">
                    <Button
                      variant={viewMode === 'grid' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setViewMode('grid')}
                      className="border-white/20"
                    >
                      <Grid className="w-4 h-4" />
                    </Button>
                    <Button
                      variant={viewMode === 'list' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setViewMode('list')}
                      className="border-white/20"
                    >
                      <List className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {photos.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                  >
                    <Card className="glass-effect border-white/10 shadow-2xl">
                      <CardContent className="p-16 text-center">
                        <div className="w-32 h-32 mx-auto mb-8 rounded-3xl bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 flex items-center justify-center shadow-lg">
                          <Image className="w-16 h-16 text-white" />
                        </div>
                        <h3 className="text-3xl font-bold text-white mb-6">Nog geen foto's geüpload</h3>
                        <p className="text-white/70 mb-10 max-w-lg mx-auto text-lg leading-relaxed">
                          Begin met het uploaden van je foto's om ze te optimaliseren met onze geavanceerde AI-technologie. 
                          Transformeer gewone foto's naar professionele resultaten.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                          <Link to="/upload-photos">
                            <Button className="button-glow text-lg px-8 py-3">
                              <Upload className="w-5 h-5 mr-3" />
                              Upload je eerste foto
                            </Button>
                          </Link>

                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ) : filteredPhotos.length === 0 ? (
                  <Card className="glass-effect border-white/10">
                    <CardContent className="p-12 text-center">
                      <div className="w-24 h-24 mx-auto mb-6 rounded-2xl bg-gradient-to-r from-orange-600 to-red-600 flex items-center justify-center">
                        <Search className="w-12 h-12 text-white" />
                      </div>
                      <h3 className="text-2xl font-bold text-white mb-4">Geen foto's gevonden</h3>
                      <p className="text-white/70 mb-8 max-w-md mx-auto">
                        Er zijn geen foto's die voldoen aan je zoek- en filtercriteria. Probeer andere zoektermen of filters.
                      </p>
                      <div className="flex gap-4 justify-center">
                        <Button 
                          variant="outline" 
                          onClick={() => {
                            setSearchTerm('');
                            setFilterCategory('all');
                          }}
                          className="border-white/20 hover:bg-white/10"
                        >
                          Wis filters
                        </Button>
                        <Link to="/upload-photos">
                          <Button className="button-glow">
                            <Upload className="w-4 h-4 mr-2" />
                            Upload nieuwe foto's
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <div className={viewMode === 'grid' 
                    ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6" 
                    : "space-y-4"
                  }>
                    {filteredPhotos.map((photo, index) => (
                      <motion.div
                        key={photo.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <Card className={`glass-effect border-white/10 card-hover overflow-hidden group ${
                          viewMode === 'grid' ? 'flex flex-col h-full' : 'flex flex-row'
                        }`}>
                          <CardHeader className={`p-0 relative ${viewMode === 'list' ? 'w-32 flex-shrink-0' : ''}`}>
                             <div className="relative overflow-hidden rounded-lg">
                               <img  
                                className={`${viewMode === 'grid' ? 'w-full h-48' : 'w-32 h-24'} object-cover bg-gray-900/50 transition-transform duration-300 group-hover:scale-105`}
                                alt={photo.name} 
                                src={photo.url} />
                               <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                               {photo.type === 'ai-generated' && (
                                 <div className="absolute top-2 right-2 bg-purple-500/90 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm">
                                   AI
                                 </div>
                               )}
                             </div>
                          </CardHeader>
                          <CardContent className={`p-4 ${viewMode === 'grid' ? 'flex-grow' : 'flex-1'}`}>
                            <div className="flex justify-between items-start mb-3">
                              <h3 className="text-sm font-semibold text-white truncate" title={photo.name}>
                                {photo.name.replace(/^ai_generated_/, '').replace(/\.[^/.]+$/, '')}
                              </h3>
                            </div>
                            <div className="space-y-2">
                              <p className="text-xs text-white/60 flex items-center gap-1">
                                <span className="w-1 h-1 bg-white/40 rounded-full"></span>
                                {new Date(photo.createdAt || photo.date).toLocaleDateString('nl-NL', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric'
                                })}
                              </p>
                              {photo.description && (
                                <p className="text-xs text-white/50 line-clamp-2" title={photo.description}>
                                  {photo.description}
                                </p>
                              )}
                              {photo.category && (
                                <span className="inline-block text-xs bg-blue-500/20 text-blue-300 px-2 py-1 rounded-full">
                                  {photo.category}
                                </span>
                              )}
                            </div>
                          </CardContent>
                          <CardFooter className={`p-4 pt-0 ${
                            viewMode === 'grid' ? 'flex justify-between gap-2' : 'flex flex-col gap-2 justify-center'
                          }`}>
                             <Button 
                               variant="outline" 
                               size="sm" 
                               className="border-white/20 hover:bg-blue-500/20 hover:border-blue-400/40 hover:text-blue-300 transition-all duration-200"
                               onClick={() => handleDownload(photo.url, photo.name)}
                               title="Download foto"
                             >
                               <Download className="w-4 h-4" />
                               {viewMode === 'list' && <span className="ml-2">Download</span>}
                             </Button>
                             <Button 
                               variant="outline" 
                               size="sm" 
                               className="border-white/20 hover:bg-green-500/20 hover:border-green-400/40 hover:text-green-300 transition-all duration-200"
                               onClick={() => {
                                 // For now, just show a toast since edit functionality might not be implemented
                                 toast({
                                   title: "Bewerken",
                                   description: "Bewerk functionaliteit komt binnenkort beschikbaar.",
                                 });
                               }}
                               title="Bewerk foto"
                             >
                               <Edit className="w-4 h-4" />
                               {viewMode === 'list' && <span className="ml-2">Bewerken</span>}
                             </Button>
                             <Button 
                               variant="destructive" 
                               size="sm" 
                               className="bg-red-500/20 hover:bg-red-500/40 text-red-400 hover:text-red-300 border-red-500/30 hover:border-red-400/50 transition-all duration-200" 
                               onClick={() => handleDelete(photo.id, photo.url)}
                               title="Verwijder foto"
                             >
                               <Trash2 className="w-4 h-4" />
                               {viewMode === 'list' && <span className="ml-2">Verwijderen</span>}
                             </Button>
                          </CardFooter>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            </main>
          </div>
        </>
      );
    };

    export default MyPhotos;
