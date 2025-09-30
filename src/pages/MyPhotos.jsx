import React, { useEffect, useState } from 'react';
    import { motion } from 'framer-motion';
    import { Helmet } from 'react-helmet';
    import { Link } from 'react-router-dom';
    import { Image, Upload, Trash2, Edit, Filter, Download, Search, Grid, List, ArrowLeft } from 'lucide-react';
    import { Button } from '@/components/ui/button';
    import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/card';
    import { Input } from '@/components/ui/input';
    import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
    import { toast } from '@/components/ui/use-toast';
    import Sidebar from '@/components/Layout/Sidebar';
    import { useAuth } from '@/contexts/AuthContext';
    // import { ref, deleteObject } from 'firebase/storage'; // Temporarily disabled
// import { storage } from '@/lib/firebase'; // Temporarily disabled

    const MyPhotos = () => {
      const { user, userProfile, updateUserData } = useAuth();
      const [photos, setPhotos] = useState([]);
      const [filteredPhotos, setFilteredPhotos] = useState([]);
      const [searchTerm, setSearchTerm] = useState('');
      const [filterCategory, setFilterCategory] = useState('all');
      const [viewMode, setViewMode] = useState('grid');

      useEffect(() => {
    // Load photos from localStorage where they are actually saved
    const loadPhotos = () => {
      const savedPhotos = JSON.parse(localStorage.getItem('myPhotos') || '[]');
      console.log('Loaded photos from localStorage:', savedPhotos);
      setPhotos(savedPhotos);
    };

    loadPhotos();

    // Also check userProfile.photos for backward compatibility
    if (userProfile && userProfile.photos) {
      const userPhotos = userProfile.photos.map(photo => ({
        ...photo,
        source: 'userProfile'
      }));
      setPhotos(prevPhotos => {
        // Merge and deduplicate
        const allPhotos = [...prevPhotos, ...userPhotos];
        const uniquePhotos = allPhotos.filter((photo, index, self) => 
          index === self.findIndex(p => p.url === photo.url)
        );
        console.log('Final photos after merge:', uniquePhotos);
        return uniquePhotos;
      });
    }
  }, [userProfile]);

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
            // Delete from localStorage
            const savedPhotos = JSON.parse(localStorage.getItem('myPhotos') || '[]');
            const updatedPhotos = savedPhotos.filter(p => p.id !== photoId);
            localStorage.setItem('myPhotos', JSON.stringify(updatedPhotos));

            // Update local state
            setPhotos(prevPhotos => prevPhotos.filter(p => p.id !== photoId));

            // If it's from userProfile, also update Firestore
            const photo = photos.find(p => p.id === photoId);
            if (photo && photo.source === 'userProfile' && user) {
                // Delete from Firebase Storage if it's a firebase URL
            // if (photoUrl.includes('firebasestorage.googleapis.com')) {
            //     const photoRef = ref(storage, photoUrl);
            //     await deleteObject(photoRef);
            // }
                // Update Firestore document
                const userPhotos = photos.filter(p => p.source === 'userProfile' && p.id !== photoId);
                await updateUserData({ photos: userPhotos });
            }

            toast({
              title: "Foto verwijderd! 🗑️",
              description: "De foto is succesvol verwijderd.",
            });
        } catch(error) {
             toast({ title: "Fout bij verwijderen", description: error.message, variant: "destructive" });
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
                      <p className="text-white/50 text-sm mt-1">{filteredPhotos.length} van {photos.length} foto's</p>
                    </div>
                  </div>
                  <Link to="/upload-photos">
                    <Button className="button-glow">
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Foto's
                    </Button>
                  </Link>
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
