import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Image, 
  Megaphone, 
  CreditCard, 
  Clock,
  Star,
  Zap,
  Trash2,
  RefreshCw,
  Download,
  X,
  ZoomIn,
  Filter,
  Calendar,
  Edit3
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';
import Sidebar from '@/components/Layout/Sidebar';
import { autoSaveService } from '@/services/autoSaveService';

const Dashboard = () => {
  const { user, userProfile, logout } = useAuth();
  const navigate = useNavigate();
  const credits = userProfile?.credits || 0;
  const [recentProjects, setRecentProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [loadingPhotos, setLoadingPhotos] = useState(false);
  const [deletingPhotoId, setDeletingPhotoId] = useState(null);
  const [enlargedPhoto, setEnlargedPhoto] = useState(null);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [dateFilter, setDateFilter] = useState('all'); // 'all', 'today', 'week', 'month'
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  // Debug: Log user status
  useEffect(() => {
    console.log('🔍 Dashboard - Current user:', user);
    console.log('🔍 Dashboard - User profile:', userProfile);
    console.log('🔍 Dashboard - User authenticated:', !!user);
    console.log('🔍 Dashboard - localStorage keys:', Object.keys(localStorage));
    console.log('🔍 Dashboard - phixo_logged_out:', localStorage.getItem('phixo_logged_out'));
  }, [user, userProfile]);

  // Load recent projects from Firebase Storage via autoSaveService
  const loadRecentProjects = async () => {
    if (!user) {
      console.log('🔍 Dashboard: No user authenticated, skipping photo load');
      setRecentProjects([]);
      return;
    }

    try {
      setLoadingPhotos(true);
      console.log('🔄 Dashboard: Loading recent photos from autoSaveService...');
      
      // Use the new autoSaveService to get recent photos
      const photos = await autoSaveService.getRecentPhotos(12); // Get more photos for better overview
      console.log('✅ Dashboard: Loaded photos from autoSaveService:', photos.length);
      
      // If no photos from database, add a test photo for development
      if (photos.length === 0) {
        console.log('🧪 Dashboard: No photos found, adding test photo for development');
        const testPhoto = {
          id: 'test_photo_123',
          name: 'Test Foto voor Bewerking',
          url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop',
          originalImage: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop',
          editedImage: null,
          category: 'test',
          createdAt: new Date().toISOString(),
          prompt: 'Test foto voor het testen van de edit functionaliteit',
          tool: 'test',
          firebasePath: null,
          autoSaved: false,
          displayCategory: 'Test Foto'
        };
        
        setRecentProjects([testPhoto]);
        setFilteredProjects([testPhoto]);
      } else {
        setRecentProjects(photos);
        setFilteredProjects(photos); // Initially show all photos
      }
    } catch (error) {
      console.error('❌ Dashboard: Error loading recent projects:', error);
      setRecentProjects([]);
      setFilteredProjects([]);
      toast({
        title: "Fout bij laden foto's",
        description: "Kon recente foto's niet laden. Probeer de pagina te vernieuwen.",
        variant: "destructive"
      });
    } finally {
      setLoadingPhotos(false);
    }
  };

  // Filter photos by date
  const filterPhotosByDate = (photos, filter) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (filter) {
      case 'today':
        return photos.filter(photo => {
          const photoDate = new Date(photo.createdAt);
          const photoDay = new Date(photoDate.getFullYear(), photoDate.getMonth(), photoDate.getDate());
          return photoDay.getTime() === today.getTime();
        });
      
      case 'week':
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        return photos.filter(photo => {
          const photoDate = new Date(photo.createdAt);
          return photoDate >= weekAgo;
        });
      
      case 'month':
        const monthAgo = new Date(today);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        return photos.filter(photo => {
          const photoDate = new Date(photo.createdAt);
          return photoDate >= monthAgo;
        });
      
      case 'all':
      default:
        return photos;
    }
  };

  // Apply filter when dateFilter or recentProjects change
  useEffect(() => {
    const filtered = filterPhotosByDate(recentProjects, dateFilter);
    setFilteredProjects(filtered);
    console.log(`🔍 Dashboard: Applied filter '${dateFilter}', showing ${filtered.length} of ${recentProjects.length} photos`);
  }, [recentProjects, dateFilter]);

  // Load recent projects on component mount and user change
  useEffect(() => {
    loadRecentProjects();
  }, [user]);

  // Close filter dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showFilterDropdown && !event.target.closest('.filter-dropdown-container')) {
        setShowFilterDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showFilterDropdown]);

  // Listen for photo updates
  useEffect(() => {
    const handlePhotosUpdated = (e) => {
      console.log('🔄 Dashboard: Photos updated event received, refreshing...', e.detail);
      loadRecentProjects();
    };

    const handleStorageUpdate = (e) => {
      console.log('🔄 Dashboard: Storage updated, refreshing projects...', e.detail);
      loadRecentProjects();
    };

    window.addEventListener('photosUpdated', handlePhotosUpdated);
    window.addEventListener('localStorageUpdated', handleStorageUpdate);
    
    // Also listen for storage events from other tabs
    const handleStorageChange = (e) => {
      if (e.key === null) {
        console.log('🔄 Dashboard: localStorage changed, refreshing projects...');
        loadRecentProjects();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('photosUpdated', handlePhotosUpdated);
      window.removeEventListener('localStorageUpdated', handleStorageUpdate);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [user]);

  // Delete photo function
  const handleDeletePhoto = async (photo) => {
    if (!photo || !photo.id) {
      toast({
        title: "Fout",
        description: "Kan foto niet verwijderen: geen geldige foto ID.",
        variant: "destructive"
      });
      return;
    }

    try {
      setDeletingPhotoId(photo.id);
      console.log('🗑️ Dashboard: Deleting photo...', photo);
      
      const success = await autoSaveService.deletePhoto(photo);
      
      if (success) {
        // Remove from local state immediately for better UX
        setRecentProjects(prev => prev.filter(p => p.id !== photo.id));
        setFilteredProjects(prev => prev.filter(p => p.id !== photo.id));
        console.log('✅ Dashboard: Photo deleted successfully');
      }
    } catch (error) {
      console.error('❌ Dashboard: Error deleting photo:', error);
      toast({
        title: "Verwijderen mislukt",
        description: "Er is een fout opgetreden bij het verwijderen van de foto.",
        variant: "destructive"
      });
    } finally {
      setDeletingPhotoId(null);
    }
  };

  // Handle photo enlargement
  const handleEnlargePhoto = (photo) => {
    setEnlargedPhoto(photo);
    setShowPhotoModal(true);
  };

  // Handle photo download - prioritize original photo if available
  const handleDownloadPhoto = async (photo) => {
    try {
      // Determine which photo to download: original (clean) or edited version
      const downloadUrl = photo.originalImage || photo.url;
      const isOriginal = !!photo.originalImage;
      
      console.log('📥 Dashboard: Downloading photo...', {
        photoName: photo.name,
        isOriginal,
        originalUrl: photo.originalImage,
        editedUrl: photo.url,
        downloadUrl
      });
      
      // Detect file extension from URL or default to jpg
      let fileExtension = '.jpg';
      if (downloadUrl.includes('.png')) fileExtension = '.png';
      else if (downloadUrl.includes('.gif')) fileExtension = '.gif';
      else if (downloadUrl.includes('.webp')) fileExtension = '.webp';
      else if (downloadUrl.includes('.jpeg')) fileExtension = '.jpeg';
      
      // Create a proper filename with timestamp and version indicator
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
      const baseFilename = photo.name ? photo.name.replace(/\.[^/.]+$/, "") : `phixo-foto-${timestamp}`;
      const versionSuffix = isOriginal ? '_origineel' : '_bewerkt';
      const filename = `${baseFilename}${versionSuffix}${fileExtension}`;
      
      // Use a proxy approach to avoid CORS issues
      const proxyUrl = `http://localhost:3001/download-image?url=${encodeURIComponent(downloadUrl)}&filename=${encodeURIComponent(filename)}`;
      
      // Create and trigger download link
      const link = document.createElement('a');
      link.href = proxyUrl;
      link.download = filename;
      link.style.display = 'none';
      
      // Add to DOM, click, and remove
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Download gestart",
        description: `${isOriginal ? '🎯 Originele (schone)' : '✏️ Bewerkte'} versie: ${filename} wordt gedownload.`,
      });
    } catch (error) {
      console.error('❌ Dashboard: Error downloading photo:', error);
      toast({
        title: "Download mislukt",
        description: "Er is een fout opgetreden bij het downloaden van de foto.",
        variant: "destructive"
      });
    }
  };

  // Close photo modal
  const closePhotoModal = () => {
    setShowPhotoModal(false);
    setEnlargedPhoto(null);
  };

  // Handle edit photo - navigate to PhotoEditor with photo data
  const handleEditPhoto = (photo) => {
    console.log('🔧 Dashboard: handleEditPhoto called with photo:', photo);
    try {
      // Store photo data in localStorage for PhotoEditor to access
      const photoData = {
        id: photo.id,
        name: photo.name,
        url: photo.url,
        originalImage: photo.originalImage,
        editedImage: photo.editedImage,
        createdAt: photo.createdAt,
        isAutoSaved: photo.isAutoSaved
      };
      
      console.log('💾 Dashboard: Storing photo data in localStorage:', photoData);
      localStorage.setItem(`photo_${photo.id}`, JSON.stringify(photoData));
      
      // Verify data was stored
      const storedData = localStorage.getItem(`photo_${photo.id}`);
      console.log('✅ Dashboard: Verified stored data:', storedData);
      
      // Navigate to PhotoEditor with photoId parameter
      const targetRoute = `/edit-photo/${photo.id}`;
      console.log('🚀 Dashboard: Navigating to:', targetRoute);
      navigate(targetRoute);
      
      toast({
        title: "Foto wordt geladen",
        description: "Je wordt doorgestuurd naar de foto editor...",
      });
    } catch (error) {
      console.error('❌ Dashboard: Error preparing photo for editing:', error);
      toast({
        title: "Fout bij laden foto",
        description: "Er is een fout opgetreden bij het voorbereiden van de foto voor bewerking.",
        variant: "destructive"
      });
    }
  };

      // Statistics removed as requested

      const quickActions = [
        {
          title: 'Upload Foto\'s',
          description: 'Begin met het uploaden van je foto\'s voor AI-optimalisatie',
          icon: Image,
          color: 'from-blue-500 to-cyan-500',
          link: '/upload-photos'
        }
      ];

      return (
        <>
          <Helmet>
            <title>Dashboard - phixo</title>
            <meta name="description" content="Beheer uw foto-optimalisatie projecten, bekijk uw credits en maak nieuwe advertenties met AI-technologie op uw phixo dashboard." />
          </Helmet>

          <div className="flex min-h-screen">
            <Sidebar />
            
            <main className="flex-1 ml-72 p-8 pb-16">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="max-w-7xl mx-auto"
              >
                <div className="mb-12">
                  <h1 className="text-4xl font-bold gradient-text mb-2">
                    Welkom terug! 👋
                  </h1>
                  <p className="text-white/70 text-lg">
                    Hier is een overzicht van je phixo activiteiten
                  </p>
                </div>

                {/* Statistics section removed as requested */}

                {/* Quick Actions and Credits Grid */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="mb-16"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    {/* Upload Photos Section */}
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 }}
                    >
                      <h2 className="text-2xl font-bold text-white mb-4">Snelle Acties</h2>
                      {quickActions.map((action) => {
                        const Icon = action.icon;
                        return (
                          <Link key={action.title} to={action.link}>
                            <Card className="glass-effect border-white/10 card-hover cursor-pointer h-full">
                              <CardContent className="p-6">
                                <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${action.color} flex items-center justify-center mb-4`}>
                                  <Icon className="w-6 h-6 text-white" />
                                </div>
                                <h3 className="text-lg font-semibold text-white mb-2">{action.title}</h3>
                                <p className="text-white/70 text-sm">{action.description}</p>
                              </CardContent>
                            </Card>
                          </Link>
                        );
                      })}
                    </motion.div>

                    {/* Credits Overview Section */}
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.6 }}
                    >
                      <h2 className="text-2xl font-bold text-white mb-4">Credits Overzicht</h2>
                      <Card className="glass-effect border-white/10 h-full">
                        <CardHeader>
                          <CardTitle className="text-lg text-white flex items-center gap-2">
                            <Zap className="w-5 h-5 text-yellow-400" />
                            Credits Overzicht
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-center mb-4">
                            <div className="text-4xl font-bold text-purple-400 mb-2">
                              {credits}
                            </div>
                            <p className="text-white/70 text-sm">Credits beschikbaar</p>
                          </div>
                          <div className="flex justify-between text-sm mb-4">
                            <span className="text-white/70">Plan:</span>
                            <span className="text-purple-400 capitalize">{userProfile?.subscription_type}</span>
                          </div>
                          <Link to="/subscription" className="block">
                            <Button className="w-full button-glow">
                              <CreditCard className="w-4 h-4 mr-2" />
                              Meer Credits
                            </Button>
                          </Link>
                        </CardContent>
                      </Card>
                    </motion.div>
                  </div>
                </motion.div>

                {/* Recent Projects - Full Width */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                  className="mt-12"
                >
                  <Card className="glass-effect border-white/10">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-xl text-white">Recente Projecten</CardTitle>
                          <CardDescription className="text-white/70">
                            Je laatste foto-optimalisatie projecten
                          </CardDescription>
                        </div>
                        <div className="flex gap-2">
                          <div className="relative filter-dropdown-container">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="border-white/20 hover:bg-white/10"
                              onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                            >
                              <Filter className="w-4 h-4 mr-2" />
                              Filter
                            </Button>
                            
                            {showFilterDropdown && (
                              <div className="absolute right-0 top-full mt-2 w-48 bg-gray-900/95 backdrop-blur-sm border border-white/20 rounded-lg shadow-xl z-50">
                                <div className="p-2">
                                  <div className="text-xs text-white/70 mb-2 px-2">Filter op datum:</div>
                                  {[
                                    { value: 'all', label: 'Alle foto\'s', icon: Calendar },
                                    { value: 'today', label: 'Vandaag', icon: Calendar },
                                    { value: 'week', label: 'Deze week', icon: Calendar },
                                    { value: 'month', label: 'Deze maand', icon: Calendar }
                                  ].map((option) => {
                                    const Icon = option.icon;
                                    return (
                                      <button
                                        key={option.value}
                                        className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors ${
                                          dateFilter === option.value 
                                            ? 'bg-purple-600/50 text-white' 
                                            : 'text-white/80 hover:bg-white/10'
                                        }`}
                                        onClick={() => {
                                          setDateFilter(option.value);
                                          setShowFilterDropdown(false);
                                        }}
                                      >
                                        <Icon className="w-4 h-4" />
                                        {option.label}
                                        {dateFilter === option.value && (
                                          <div className="ml-auto w-2 h-2 bg-purple-400 rounded-full"></div>
                                        )}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {loadingPhotos ? (
                          <div className="text-center py-8">
                            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-white/50" />
                            <p className="text-white/60">Foto's laden...</p>
                          </div>
                        ) : filteredProjects.length > 0 ? filteredProjects.map((project) => (
                          <div key={project.id} className="flex items-center gap-6 p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors group">
                            <div className="relative group/photo">
                              <img 
                                className="w-32 h-32 rounded-lg object-contain bg-gray-900/50 cursor-pointer hover:opacity-80 transition-opacity" 
                                alt={project.name || 'Foto'} 
                                src={project.url}
                                onClick={() => handleEnlargePhoto(project)}
                              />
                              <div 
                                className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/photo:opacity-100 transition-opacity bg-black/20 rounded-lg cursor-pointer"
                                onClick={() => handleEnlargePhoto(project)}
                              >
                                <ZoomIn className="w-6 h-6 text-white" />
                              </div>
                            </div>
                            <div className="flex-1">
                              <h4 className="font-semibold text-white truncate">{project.name || 'Naamloos'}</h4>
                              <p className="text-sm text-white/70">{project.displayCategory || project.tool || 'Foto'}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <Clock className="w-3 h-3 text-white/50" />
                                <span className="text-xs text-white/50">
                                  {new Date(project.createdAt || project.date || Date.now()).toLocaleDateString()}
                                </span>
                                {project.metadata?.autoSaved && (
                                  <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full">
                                    Auto-opgeslagen
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                variant="outline"
                                size="sm"
                                className="border-blue-500/20 hover:bg-blue-500/10 text-blue-400"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDownloadPhoto(project);
                                }}
                              >
                                <Download className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="border-green-500/20 hover:bg-green-500/10 text-green-400"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditPhoto(project);
                                }}
                              >
                                <Edit3 className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="border-red-500/20 hover:bg-red-500/10 text-red-400"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeletePhoto(project);
                                }}
                                disabled={deletingPhotoId === project.id}
                              >
                                {deletingPhotoId === project.id ? (
                                  <RefreshCw className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Trash2 className="w-4 h-4" />
                                )}
                              </Button>
                              </div>
                            </div>
                        )) : (
                           <div className="text-center py-8">
                             <Image className="w-12 h-12 mx-auto mb-4 text-white/30" />
                             {recentProjects.length === 0 ? (
                               <>
                                 <p className="text-white/60 mb-2">Je hebt nog geen foto's opgeslagen.</p>
                                 <p className="text-white/40 text-sm">Begin met het bewerken van foto's om ze hier te zien verschijnen.</p>
                               </>
                             ) : (
                               <>
                                 <p className="text-white/60 mb-2">Geen foto's gevonden voor deze filter.</p>
                                 <p className="text-white/40 text-sm">Probeer een andere datumfilter of voeg nieuwe foto's toe.</p>
                               </>
                             )}
                           </div>
                         )}
                       </div>
                     </CardContent>
                   </Card>
                 </motion.div>


              </motion.div>
            </main>
          </div>

          {/* Photo Enlargement Modal */}
          {showPhotoModal && enlargedPhoto && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="relative max-w-4xl max-h-[90vh] bg-gray-900 rounded-lg overflow-hidden"
              >
                {/* Close Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute top-4 right-4 z-10 bg-black/50 hover:bg-black/70 text-white"
                  onClick={closePhotoModal}
                >
                  <X className="w-5 h-5" />
                </Button>

                {/* Download Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute top-4 left-4 z-10 bg-black/50 hover:bg-black/70 text-white"
                  onClick={() => handleDownloadPhoto(enlargedPhoto)}
                >
                  <Download className="w-5 h-5 mr-2" />
                  Download
                </Button>

                {/* Enlarged Image */}
                <img
                  src={enlargedPhoto.url}
                  alt={enlargedPhoto.name}
                  className="w-full h-full object-contain"
                  style={{ maxHeight: '90vh' }}
                />

                {/* Photo Info */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
                  <h3 className="text-white text-xl font-semibold mb-2">{enlargedPhoto.name}</h3>
                  <div className="flex items-center gap-4 text-white/70 text-sm">
                    <span>{enlargedPhoto.category || enlargedPhoto.tool}</span>
                    <span>•</span>
                    <span>{new Date(enlargedPhoto.createdAt).toLocaleDateString('nl-NL')}</span>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </>
      );
    };

    export default Dashboard;
