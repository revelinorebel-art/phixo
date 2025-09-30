import React, { useEffect, useState } from 'react';
    import { motion } from 'framer-motion';
    import { Helmet } from 'react-helmet';
    import { Link } from 'react-router-dom';
    import { Megaphone, Plus, Eye, Edit, Share, Trash2 } from 'lucide-react';
    import { Button } from '@/components/ui/button';
    import { Card, CardContent, CardFooter } from '@/components/ui/card';
    import { toast } from '@/components/ui/use-toast';
    import Sidebar from '@/components/Layout/Sidebar';
    import { useAuth } from '@/contexts/AuthContext';

    const MyAds = () => {
      const { userProfile, updateUserData } = useAuth();
      const [ads, setAds] = useState([]);

      useEffect(() => {
        if (userProfile && userProfile.ads) {
          setAds(userProfile.ads);
        }
      }, [userProfile]);

      const handleDelete = (adId) => {
        const updatedAds = ads.filter(ad => ad.id !== adId);
        updateUserData({ ads: updatedAds });
        toast({
          title: "Advertentie verwijderd! 🗑️",
          description: "De advertentie is succesvol verwijderd.",
        });
      };

      const handleFeatureClick = (feature) => {
        toast({
          title: "🚧 Deze functie is nog niet geïmplementeerd—maar maak je geen zorgen! Je kunt het aanvragen in je volgende prompt! 🚀",
          description: `${feature} wordt binnenkort beschikbaar.`,
        });
      };

      return (
        <>
          <Helmet>
            <title>Mijn Advertenties - phixo</title>
            <meta name="description" content="Creëer en beheer professionele advertenties met AI-technologie." />
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
                  <div>
                    <h1 className="text-4xl font-bold gradient-text mb-2">Mijn Advertenties</h1>
                    <p className="text-white/70 text-lg">Creëer professionele advertenties met AI</p>
                  </div>
                  <Link to="/create-ad">
                    <Button className="button-glow">
                      <Plus className="w-4 h-4 mr-2" />
                      Nieuwe Advertentie
                    </Button>
                  </Link>
                </div>

                {ads.length === 0 ? (
                  <Card className="glass-effect border-white/10">
                    <CardContent className="p-12 text-center">
                      <div className="w-24 h-24 mx-auto mb-6 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 flex items-center justify-center">
                        <Megaphone className="w-12 h-12 text-white" />
                      </div>
                      <h3 className="text-2xl font-bold text-white mb-4">Nog geen advertenties gemaakt</h3>
                      <p className="text-white/70 mb-8 max-w-md mx-auto">
                        Begin met het maken van je eerste advertentie met onze AI-gestuurde tools voor maximale impact.
                      </p>
                      <Link to="/create-ad">
                        <Button className="button-glow">
                          <Plus className="w-4 h-4 mr-2" />
                          Maak je eerste advertentie
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                ) : (
                   <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {ads.map((ad, index) => (
                      <motion.div
                        key={ad.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <Card className="glass-effect border-white/10 card-hover overflow-hidden">
                           <div className="p-4 bg-gray-800">
                               <img  className="w-full h-40 object-contain" alt={ad.prompt} src={ad.imageUrl} />
                           </div>
                          <CardContent className="p-4">
                            <h3 className="text-md font-semibold text-white truncate mb-1" title={ad.prompt}>{ad.prompt}</h3>
                            <p className="text-xs text-white/60 mt-2">{new Date(ad.date).toLocaleDateString('nl-NL')}</p>
                          </CardContent>
                          <CardFooter className="p-4 pt-0 flex justify-between">
                             <Button variant="outline" size="sm" className="border-white/20 hover:bg-white/10" onClick={() => handleFeatureClick('Advertentie Bewerken')}>
                               <Edit className="w-4 h-4" />
                             </Button>
                             <Button variant="outline" size="sm" className="border-white/20 hover:bg-white/10" onClick={() => handleFeatureClick('Advertentie Delen')}>
                               <Share className="w-4 h-4" />
                             </Button>
                             <Button variant="destructive" size="sm" className="bg-red-500/20 hover:bg-red-500/40 text-red-400" onClick={() => handleDelete(ad.id)}>
                               <Trash2 className="w-4 h-4" />
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

    export default MyAds;
