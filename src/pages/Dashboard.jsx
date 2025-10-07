import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { 
  Image, 
  Megaphone, 
  CreditCard, 
  TrendingUp, 
  Clock,
  Star,
  Zap,
  Bug
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';
import Sidebar from '@/components/Layout/Sidebar';
import { testFirebaseConnection, testImageUpload } from '@/utils/firebaseTest';
import { autoSaveService } from '@/services/autoSaveService';

const Dashboard = () => {
  const { user, userProfile, logout } = useAuth();
  const credits = userProfile?.credits || 0;
  const [recentProjects, setRecentProjects] = useState([]);
  const [totalProjects, setTotalProjects] = useState(0);
  const [testingFirebase, setTestingFirebase] = useState(false);

  // Debug: Log user status
  useEffect(() => {
    console.log('🔍 Dashboard - Current user:', user);
    console.log('🔍 Dashboard - User profile:', userProfile);
    console.log('🔍 Dashboard - User authenticated:', !!user);
    console.log('🔍 Dashboard - localStorage keys:', Object.keys(localStorage));
    console.log('🔍 Dashboard - phixo_logged_out:', localStorage.getItem('phixo_logged_out'));
  }, [user, userProfile]);

  // Load recent projects from all sources
  useEffect(() => {
    const loadRecentProjects = () => {
      try {
        // Get photos from localStorage (auto-saved photos)
        const localPhotos = JSON.parse(localStorage.getItem('myPhotos') || '[]');
        
        // Get photos from userProfile (legacy photos)
        const profilePhotos = userProfile?.photos || [];
        
        // Merge and deduplicate
        const allPhotos = [...localPhotos, ...profilePhotos];
        const uniquePhotos = allPhotos.filter((photo, index, self) => 
          index === self.findIndex(p => p.url === photo.url)
        );
        
        // Sort by date (newest first) and take top 3
        uniquePhotos.sort((a, b) => {
          const dateA = new Date(a.createdAt || a.date || 0);
          const dateB = new Date(b.createdAt || b.date || 0);
          return dateB - dateA;
        });
        
        setRecentProjects(uniquePhotos.slice(0, 3));
        setTotalProjects(uniquePhotos.length);
      } catch (error) {
        console.error('Error loading recent projects:', error);
        setRecentProjects([]);
        setTotalProjects(0);
      }
    };

    loadRecentProjects();

    // Listen for real-time updates when new photos are saved
    const handleStorageUpdate = () => {
      loadRecentProjects();
    };

    window.addEventListener('localStorageUpdated', handleStorageUpdate);
    return () => window.removeEventListener('localStorageUpdated', handleStorageUpdate);
  }, [userProfile]);

  // Firebase test functions
  const handleTestFirebaseConnection = async () => {
    setTestingFirebase(true);
    try {
      const result = await testFirebaseConnection();
      if (result.success) {
        toast({
          title: "Firebase verbinding succesvol",
          description: result.message,
          variant: "default"
        });
      } else {
        toast({
          title: "Firebase verbinding gefaald",
          description: result.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Test fout",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setTestingFirebase(false);
    }
  };

  const handleTestImageUpload = async () => {
    setTestingFirebase(true);
    try {
      const result = await testImageUpload();
      if (result.success) {
        toast({
          title: "Image upload test succesvol",
          description: result.message,
          variant: "default"
        });
      } else {
        toast({
          title: "Image upload test gefaald",
          description: result.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Test fout",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setTestingFirebase(false);
    }
  };

  const handleTestAutoSave = async () => {
    setTestingFirebase(true);
    try {
      // Create a test canvas
      const canvas = document.createElement('canvas');
      canvas.width = 100;
      canvas.height = 100;
      const ctx = canvas.getContext('2d');
      
      // Draw a simple test image
      ctx.fillStyle = '#FF6B6B';
      ctx.fillRect(0, 0, 100, 100);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '12px Arial';
      ctx.fillText('TEST', 35, 55);

      // Convert canvas to blob and create imageUrl
      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
      const imageUrl = URL.createObjectURL(blob);
      
      // Create complete photo data with all required fields
      const photoData = {
        imageUrl: imageUrl,
        tool: 'mockup-creator',
        prompt: 'Test image for debugging AutoSave functionality',
        timestamp: Date.now(),
        canvas: canvas,
        metadata: {
          width: 100,
          height: 100,
          format: 'png',
          testMode: true
        }
      };
      
      console.log('Testing AutoSave with photoData:', photoData);
      
      // Test the AutoSave service
      const result = await autoSaveService.autoSavePhoto(photoData);
      
      // Clean up the object URL
      URL.revokeObjectURL(imageUrl);
      
      if (result && result.success) {
        toast({
          title: "AutoSave Test Successful",
          description: `Photo saved successfully: ${result.photoId}`,
          variant: "default"
        });
        console.log('AutoSave result:', result);
      } else {
        toast({
          title: "AutoSave Test Failed",
          description: result?.error || 'Unknown error occurred',
          variant: "destructive"
        });
        console.error('AutoSave failed:', result);
      }
    } catch (error) {
      console.error('AutoSave test error:', error);
      toast({
        title: "AutoSave Test Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setTestingFirebase(false);
    }
  };

  const handleCheckAuth = async () => {
    try {
      const { authService } = await import('@/services/authService');
      const currentUser = authService.getCurrentUser();
      
      console.log('Current user:', currentUser);
      console.log('User UID:', currentUser?.uid);
      console.log('User email:', currentUser?.email);
      console.log('User authenticated:', !!currentUser);
      
      if (currentUser) {
        toast({
          title: "Authentication Status",
          description: `Logged in as: ${currentUser.email} (UID: ${currentUser.uid})`,
          variant: "default"
        });
      } else {
        toast({
          title: "Authentication Status",
          description: "No user is currently logged in - Please login first",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Auth check error:', error);
      toast({
        title: "Auth Check Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleTestLogin = async () => {
    try {
      const { authService } = await import('@/services/authService');
      
      // Test with a demo account
      const result = await authService.signIn('test@phixo.nl', 'testpassword123');
      
      if (result.error) {
        toast({
          title: "Test Login Failed",
          description: `Error: ${result.error}. You may need to create this test account first.`,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Test Login Successful",
          description: "Test user logged in successfully!",
          variant: "default"
        });
      }
    } catch (error) {
      console.error('Test login error:', error);
      toast({
        title: "Test Login Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

      const stats = [
        {
          title: 'Totaal Projecten',
          value: totalProjects,
          icon: Image,
          color: 'from-blue-500 to-cyan-500',
        },
        {
          title: 'Advertenties Gemaakt',
          value: userProfile?.ads?.length || 0,
          icon: Megaphone,
          color: 'from-purple-500 to-pink-500',
        },
        {
          title: 'Credits Gebruikt',
          value: (100 - credits),
          icon: Zap,
          color: 'from-orange-500 to-red-500',
        },
        {
          title: 'Succes Rate',
          value: '100%',
          icon: TrendingUp,
          color: 'from-green-500 to-emerald-500',
        }
      ];

      const quickActions = [
        {
          title: 'Upload Foto\'s',
          description: 'Begin met het uploaden van je foto\'s voor AI-optimalisatie',
          icon: Image,
          color: 'from-blue-500 to-cyan-500',
          link: '/upload-photos'
        },
        {
          title: 'Maak Advertentie',
          description: 'Creëer professionele advertenties met AI-assistentie',
          icon: Megaphone,
          color: 'from-purple-500 to-pink-500',
          link: '/create-ad'
        },
        {
          title: 'Koop Credits',
          description: 'Krijg meer credits voor extra AI-verwerkingen',
          icon: CreditCard,
          color: 'from-green-500 to-emerald-500',
          link: '/subscription'
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
            
            <main className="flex-1 ml-72 p-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="max-w-7xl mx-auto"
              >
                <div className="mb-8">
                  <h1 className="text-4xl font-bold gradient-text mb-2">
                    Welkom terug! 👋
                  </h1>
                  <p className="text-white/70 text-lg">
                    Hier is een overzicht van je phixo activiteiten
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  {stats.map((stat, index) => {
                    const Icon = stat.icon;
                    return (
                      <motion.div
                        key={stat.title}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <Card className="glass-effect border-white/10 card-hover">
                          <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-white/70 text-sm font-medium">{stat.title}</p>
                                <p className="text-3xl font-bold text-white mt-1">{stat.value}</p>
                              </div>
                              <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${stat.color} flex items-center justify-center`}>
                                <Icon className="w-6 h-6 text-white" />
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
                </div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="mb-8"
                >
                  <h2 className="text-2xl font-bold text-white mb-6">Snelle Acties</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                  </div>
                </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 }}
                    className="lg:col-span-2"
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
                          <Link to="/my-photos">
                            <Button variant="outline" size="sm" className="border-white/20 hover:bg-white/10">
                              Alles bekijken
                            </Button>
                          </Link>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {recentProjects.length > 0 ? recentProjects.map((project) => (
                            <Link to={`/my-photos`} key={project.id}>
                              <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors cursor-pointer">
                                 <img  className="w-16 h-16 rounded-lg object-contain bg-gray-900/50" alt={project.name} src={project.url} />
                                <div className="flex-1">
                                  <h4 className="font-semibold text-white truncate">{project.name}</h4>
                                  <p className="text-sm text-white/70">{project.category || 'Foto Optimalisatie'}</p>
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
                              </div>
                            </Link>
                          )) : (
                            <p className="text-white/60 text-center py-8">Je hebt nog geen projecten.</p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.8 }}
                    className="space-y-6"
                  >
                    <Card className="glass-effect border-white/10">
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
                        <div className="flex justify-between text-sm">
                          <span className="text-white/70">Plan:</span>
                          <span className="text-purple-400 capitalize">{userProfile?.subscription_type}</span>
                        </div>
                        <Link to="/subscription" className="block mt-4">
                          <Button className="w-full button-glow">
                            <CreditCard className="w-4 h-4 mr-2" />
                            Meer Credits
                          </Button>
                        </Link>
                      </CardContent>
                    </Card>
                    
                    <Card className="glass-effect border-white/10">
                      <CardHeader>
                        <CardTitle className="text-lg text-white flex items-center gap-2">
                          <Star className="w-5 h-5 text-yellow-400" />
                          Pro Tips
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3 text-sm">
                          <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
                            <p className="text-purple-400 font-medium mb-1">💡 Optimalisatie Tip</p>
                            <p className="text-white/70">Upload foto's in hoge resolutie voor de beste AI-resultaten.</p>
                          </div>
                          <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                            <p className="text-blue-400 font-medium mb-1">🎯 Advertentie Tip</p>
                            <p className="text-white/70">Gebruik contrastrijke kleuren voor betere conversie.</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                </div>

                {/* Debug Section - Only show in development */}
                {process.env.NODE_ENV === 'development' && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                    className="mt-8"
                  >
                    <Card className="glass-effect border-white/10">
                      <CardHeader>
                        <CardTitle className="text-lg text-white flex items-center gap-2">
                          <Bug className="w-5 h-5 text-orange-400" />
                          Debug Tools
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                         <div className="flex flex-wrap gap-2">
                           <Button
                             onClick={handleCheckAuth}
                             variant="outline"
                             size="sm"
                             className="border-purple-500/20 hover:bg-purple-500/10 text-purple-400"
                           >
                             Check Auth
                           </Button>
                           <Button
                             onClick={handleTestLogin}
                             variant="outline"
                             size="sm"
                             className="border-yellow-500/20 hover:bg-yellow-500/10 text-yellow-400"
                           >
                             Test Login
                           </Button>
                           <Button
                             onClick={handleTestFirebaseConnection}
                             disabled={testingFirebase}
                             variant="outline"
                             size="sm"
                             className="border-orange-500/20 hover:bg-orange-500/10 text-orange-400"
                           >
                             {testingFirebase ? 'Testing...' : 'Firebase Test'}
                           </Button>
                           <Button
                             onClick={handleTestImageUpload}
                             disabled={testingFirebase}
                             variant="outline"
                             size="sm"
                             className="border-blue-500/20 hover:bg-blue-500/10 text-blue-400"
                           >
                             {testingFirebase ? 'Testing...' : 'Image Upload'}
                           </Button>
                           <Button
                             onClick={handleTestAutoSave}
                             disabled={testingFirebase}
                             variant="outline"
                             size="sm"
                             className="border-green-500/20 hover:bg-green-500/10 text-green-400"
                           >
                             {testingFirebase ? 'Testing...' : 'AutoSave Test'}
                           </Button>
                         </div>
                       </CardContent>
                    </Card>
                  </motion.div>
                )}
              </motion.div>
            </main>
          </div>
        </>
      );
    };

    export default Dashboard;
