import React, { useState } from 'react';
    import { motion } from 'framer-motion';
    import { Helmet } from 'react-helmet';
    import { Upload, Image, Megaphone, Sparkles, ArrowRight, Layers, Palette, Camera, Brush } from 'lucide-react';
    import { Button } from '@/components/ui/button';
    import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
    import { useNavigate } from 'react-router-dom';
    import Sidebar from '@/components/Layout/Sidebar';
    import { BackgroundGradient } from '@/components/ui/background-gradient';

    const NewProject = () => {
      const [selectedType, setSelectedType] = useState(null);
      const navigate = useNavigate();

      const handleContinue = () => {
        if (selectedType === 'photo') {
          navigate('/upload-photos');
        } else if (selectedType === 'mockup') {
          navigate('/mockup-creator');
        } else if (selectedType === 'foto-generator') {
          navigate('/foto-generator');
        } else if (selectedType === 'retouch') {
          navigate('/retouch-tools');
        }
      };

      const projectTypes = [
        {
          id: 'photo',
          title: 'Foto Optimalisatie',
          description: 'Upload en optimaliseer je foto\'s met AI-technologie',
          icon: Image,
          color: 'from-blue-500 to-cyan-500',
          features: ['AI-verbetering', 'Achtergrond verwijdering', 'Kleur correctie', 'HD export']
        },

        {
          id: 'mockup',
          title: 'Mockup Creator',
          description: 'Plaats je product in elke gewenste omgeving met AI',
          icon: Layers,
          color: 'from-teal-500 to-green-500',
          features: ['Object in achtergrond plaatsen', 'Realistische schaduwen & licht', 'Snelle aanpassingen', 'Sla op in Mijn Foto\'s']
        },
        {
          id: 'foto-generator',
          title: 'Foto Generator',
          description: 'Genereer realistische foto\'s met PHIXO AI',
      icon: Camera,
      color: 'from-purple-500 to-pink-500',
      features: ['PHIXO AI', 'Realistische foto\'s', 'Creatieve prompts', 'HD kwaliteit']
        },
        {
          id: 'retouch',
          title: 'Retouch Tools',
          description: 'Bewerk specifieke delen van je foto\'s met precisie',
          icon: Brush,
          color: 'from-orange-500 to-red-500',
          features: ['Precisie bewerking', 'Selectief aanpassen', 'AI-gestuurde retouch', 'Professionele resultaten']
        }
      ];

      return (
        <>
          <Helmet>
            <title>Nieuw Project - phixo</title>
            <meta name="description" content="Start een nieuw project met phixo. Kies tussen foto-optimalisatie en advertentie-creatie met AI-technologie." />
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
                <div className="text-center mb-12">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                    className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 flex items-center justify-center pulse-glow"
                  >
                    <Sparkles className="w-10 h-10 text-white" />
                  </motion.div>
                  <h1 className="text-4xl font-bold gradient-text mb-4">Nieuw Project Starten</h1>
                  <p className="text-white/70 text-lg max-w-2xl mx-auto">
                    Kies het type project dat je wilt maken en laat onze AI de magie doen
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10 justify-items-center max-w-6xl mx-auto">
                  {projectTypes.map((type, index) => {
                    const Icon = type.icon;
                    const isSelected = selectedType === type.id;
                    
                    return (
                      <motion.div
                        key={type.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 + index * 0.1 }}
                        className="h-full w-full min-w-[280px] max-w-[320px]"
                        onClick={() => setSelectedType(type.id)}
                      >
                        <BackgroundGradient 
                          containerClassName="rounded-[22px] h-full" 
                          className={`rounded-[22px] bg-slate-900/80 flex flex-col h-full transition-all duration-300 ${ isSelected ? 'ring-2 ring-purple-500/50' : '' }`}
                          animate={isSelected}
                        >
                          <Card 
                            className={`bg-transparent border-none shadow-none cursor-pointer flex flex-col h-full p-2`}
                          >
                            <CardHeader className="text-center pb-6">
                              <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-r ${type.color} flex items-center justify-center`}>
                                <Icon className="w-8 h-8 text-white" />
                              </div>
                              <CardTitle className="text-2xl text-white">{type.title}</CardTitle>
                              <CardDescription className="text-white/70 text-base">
                                {type.description}
                              </CardDescription>
                            </CardHeader>
                            <CardContent className="flex-grow flex flex-col">
                              <ul className="space-y-2 mb-6">
                                {type.features.map((feature, featureIndex) => (
                                  <li key={featureIndex} className="flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full bg-purple-400"></div>
                                    <span className="text-white/80 text-sm">{feature}</span>
                                  </li>
                                ))}
                              </ul>
                              <Button 
                                className={`w-full mt-auto ${isSelected ? 'button-glow' : 'bg-white/10 hover:bg-white/20'}`}
                                onClick={() => setSelectedType(type.id)}
                              >
                                {isSelected ? 'Geselecteerd' : 'Selecteer'}
                              </Button>
                            </CardContent>
                          </Card>
                        </BackgroundGradient>
                      </motion.div>
                    );
                  })}
                </div>

                {selectedType && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.2 }}
                    className="text-center mt-12"
                  >
                    <Card className="glass-effect border-white/10 max-w-md mx-auto">
                      <CardContent className="p-8">
                        <h3 className="text-xl font-bold text-white mb-4">
                          Klaar om te beginnen?
                        </h3>
                        <p className="text-white/70 mb-6">
                          {
                            projectTypes.find(p => p.id === selectedType)?.title
                          } geselecteerd. Klik hieronder om door te gaan.
                        </p>
                        <Button 
                          className="w-full button-glow h-12 text-base font-semibold"
                          onClick={handleContinue}
                        >
                          <Upload className="w-5 h-5 mr-2" />
                          Ga verder
                          <ArrowRight className="w-5 h-5 ml-2" />
                        </Button>
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

    export default NewProject;
