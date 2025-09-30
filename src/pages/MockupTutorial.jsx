import React from 'react';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { ArrowLeft, BookOpen, Target, MessageSquare, Settings, Eye, Palette, Shuffle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Sidebar from '@/components/Layout/Sidebar';

const MockupTutorial = () => {
  const tutorialSteps = [
    {
      number: 1,
      title: "Leg uit wat je probeert te doen",
      icon: <MessageSquare className="w-6 h-6" />,
      content: "Begin door in duidelijke taal tegen de AI te zeggen: \"Ik wil een prompt die elke screenshot die ik upload kan omzetten in een realistische mockup.\""
    },
    {
      number: 2,
      title: "Geef het context",
      icon: <Target className="w-6 h-6" />,
      content: "Vertel de AI wat er gaat gebeuren: \"Ik zal afbeeldingen uploaden. Dit zullen screenshots zijn van websites, apps of ontwerpen.\""
    },
    {
      number: 3,
      title: "Stel ononderhandelbare voorwaarden in",
      icon: <Settings className="w-6 h-6" />,
      content: "Maak regels duidelijk, zoals: \"De screenshot mag niet worden veranderd of vervormd. Hij moet scherp en nauwkeurig blijven.\""
    },
    {
      number: 4,
      title: "Stuur hoe het moet denken",
      icon: <Eye className="w-6 h-6" />,
      content: "In plaats van elk detail te micromanagen, gebruik woorden als \"analyseer\", \"beslis\" of \"zoek een overeenkomst\" zodat de AI weet dat hij dingen intelligent moet uitzoeken."
    },
    {
      number: 5,
      title: "Beschrijf mogelijke resultaten",
      icon: <Palette className="w-6 h-6" />,
      content: "Geef voorbeelden van hoe goede resultaten eruit kunnen zien—close-ups, brede shots, gekantelde weergaven, verschillende sferen."
    },
    {
      number: 6,
      title: "Koppel het terug aan de merkstijl",
      icon: <Target className="w-6 h-6" />,
      content: "Herinner de AI eraan om naar de sfeer van het ontwerp te kijken en een omgeving te creëren die daarbij past (strak, gedurfd, sfeervol, speels, etc.)."
    },
    {
      number: 7,
      title: "Bouw variatie in",
      icon: <Shuffle className="w-6 h-6" />,
      content: "Vraag de AI om elk resultaat uniek te laten aanvoelen, terwijl het ontwerp intact blijft."
    }
  ];

  return (
    <>
      <Helmet>
        <title>Mockup Tutorial - phixo</title>
        <meta name="description" content="Leer hoe je de beste resultaten krijgt met de Mockup Creator." />
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
            <div className="flex justify-between items-center mb-8">
              <Link to="/mockup-creator" className="inline-flex items-center gap-2 text-purple-400 hover:text-purple-300 transition-colors">
                <ArrowLeft className="w-4 h-4" />
                Terug naar Mockup Creator
              </Link>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-center mb-12"
            >
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-r from-orange-500 to-red-500 flex items-center justify-center mx-auto mb-6">
                <BookOpen className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-4xl font-bold gradient-text mb-4">
                Mockup Tutorial
              </h1>
              <p className="text-xl text-white/70 max-w-2xl mx-auto">
                Leer hoe je de beste resultaten krijgt met de Mockup Creator door deze 7 stappen te volgen
              </p>
            </motion.div>

            <div className="space-y-6">
              {tutorialSteps.map((step, index) => (
                <motion.div
                  key={step.number}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 + index * 0.1 }}
                >
                  <Card className="glass-effect border-white/10 hover:border-orange-500/30 transition-all duration-300">
                    <CardHeader>
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 flex items-center justify-center text-white font-bold text-lg">
                          {step.number}
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-orange-400">
                            {step.icon}
                          </div>
                          <CardTitle className="text-xl text-white">
                            {step.title}
                          </CardTitle>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-white/80 text-lg leading-relaxed">
                        {step.content}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1.0 }}
              className="mt-12 text-center"
            >
              <Card className="glass-effect border-white/10 bg-gradient-to-r from-orange-500/10 to-red-500/10">
                <CardContent className="p-8">
                  <h3 className="text-2xl font-bold text-white mb-4">
                    Klaar om te beginnen?
                  </h3>
                  <p className="text-white/70 mb-6">
                    Ga terug naar de Mockup Creator en pas deze tips toe voor de beste resultaten!
                  </p>
                  <Link 
                    to="/mockup-creator"
                    className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-3 rounded-xl font-semibold hover:from-orange-600 hover:to-red-600 transition-all duration-300"
                  >
                    <ArrowLeft className="w-5 h-5" />
                    Start met Mockup Creator
                  </Link>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </main>
      </div>
    </>
  );
};

export default MockupTutorial;