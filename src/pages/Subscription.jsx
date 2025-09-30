import React from 'react';
    import { motion } from 'framer-motion';
    import { Helmet } from 'react-helmet';
    import { CreditCard, Zap, Star, Check, Crown } from 'lucide-react';
    import { useAuth } from '@/contexts/AuthContext';
import { useCredits } from '@/contexts/CreditsContext';
    import { Button } from '@/components/ui/button';
    import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
    import { toast } from '@/components/ui/use-toast';
    import Sidebar from '@/components/Layout/Sidebar';

    const Subscription = () => {
  const { userProfile } = useAuth();
  const { credits } = useCredits();
      
      const handleFeatureClick = (feature) => {
        toast({
          title: "🚧 Deze functie is nog niet geïmplementeerd—maar maak je geen zorgen! Je kunt het aanvragen in je volgende prompt! 🚀",
          description: `${feature} wordt binnenkort beschikbaar.`,
        });
      };

      const plans = [
        {
          name: 'Gratis',
          price: '€0',
          period: '/maand',
          description: 'Perfect om te beginnen',
          credits: '10 credits',
          features: [
            'Basis foto optimalisatie',
            'Tot 5 foto\'s per maand',
            'Standaard kwaliteit export',
            'E-mail support'
          ],
          color: 'from-gray-500 to-gray-600',
          current: userProfile?.subscription_type === 'free'
        },
        {
          name: 'Pro',
          price: '€19',
          period: '/maand',
          description: 'Voor professionals',
          credits: '100 credits/maand',
          features: [
            'Geavanceerde AI optimalisatie',
            'Onbeperkte foto uploads',
            'HD kwaliteit export',
            'Achtergrond verwijdering',
            'Batch verwerking',
            'Prioriteit support'
          ],
          color: 'from-purple-500 to-indigo-500',
          popular: true,
          current: userProfile?.subscription_type === 'pro'
        },
        {
          name: 'Enterprise',
          price: '€49',
          period: '/maand',
          description: 'Voor teams en bedrijven',
          credits: '500 credits/maand',
          features: [
            'Alle Pro functies',
            'API toegang',
            'White-label oplossing',
            'Aangepaste integraties',
            'Dedicated account manager',
            '24/7 support'
          ],
          color: 'from-yellow-500 to-orange-500',
          current: userProfile?.subscription_type === 'enterprise'
        }
      ];

      const creditPacks = [
        {
          credits: 50,
          price: '€9',
          bonus: 0,
          popular: false
        },
        {
          credits: 100,
          price: '€15',
          bonus: 10,
          popular: true
        },
        {
          credits: 250,
          price: '€35',
          bonus: 50,
          popular: false
        }
      ];

      return (
        <>
          <Helmet>
            <title>Abonnement & Credits - phixo</title>
            <meta name="description" content="Kies het juiste abonnement voor uw behoeften. Krijg meer credits en toegang tot geavanceerde AI-foto-optimalisatie functies." />
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
                  <h1 className="text-4xl font-bold gradient-text mb-2">Abonnement & Credits</h1>
                  <p className="text-white/70 text-lg">Kies het plan dat bij je past</p>
                </div>

                <Card className="glass-effect border-white/10 mb-8">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 flex items-center justify-center">
                          <Zap className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-white">Huidig Plan: {userProfile?.subscription_type?.charAt(0).toUpperCase() + userProfile?.subscription_type?.slice(1)}</h3>
                          <p className="text-white/70">Je hebt nog {credits} credits over</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="mb-12">
                  <h2 className="text-2xl font-bold text-white mb-6">Abonnementen</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {plans.map((plan, index) => (
                      <motion.div
                        key={plan.name}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="relative"
                      >
                        {plan.popular && (
                          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
                            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                              Populair
                            </div>
                          </div>
                        )}
                        <Card className={`glass-effect border-white/10 h-full flex flex-col ${plan.current ? 'ring-2 ring-purple-500/50' : ''} ${plan.popular ? 'scale-105' : ''}`}>
                          <CardHeader className="text-center pb-8">
                            <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-r ${plan.color} flex items-center justify-center`}>
                              {plan.name === 'Enterprise' ? <Crown className="w-8 h-8 text-white" /> : 
                               plan.name === 'Pro' ? <Star className="w-8 h-8 text-white" /> :
                               <Zap className="w-8 h-8 text-white" />}
                            </div>
                            <CardTitle className="text-2xl font-bold text-white">{plan.name}</CardTitle>
                            <CardDescription className="text-white/70">{plan.description}</CardDescription>
                            <div className="mt-4">
                              <span className="text-4xl font-bold text-white">{plan.price}</span>
                              <span className="text-white/70">{plan.period}</span>
                            </div>
                            <p className="text-purple-400 font-semibold">{plan.credits}</p>
                          </CardHeader>
                          <CardContent className="flex-grow flex flex-col">
                            <ul className="space-y-3 mb-6 flex-grow">
                              {plan.features.map((feature, featureIndex) => (
                                <li key={featureIndex} className="flex items-center gap-3">
                                  <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                                  <span className="text-white/80 text-sm">{feature}</span>
                                </li>
                              ))}
                            </ul>
                             <Button 
                              className={`w-full mt-auto ${plan.current ? 'bg-gray-600 hover:bg-gray-700' : 'button-glow'}`}
                              disabled={plan.current}
                              onClick={() => handleFeatureClick(`Upgrade naar ${plan.name}`)}
                            >
                              {plan.current ? 'Huidig Plan' : `Kies ${plan.name}`}
                            </Button>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                </div>

                <div>
                  <h2 className="text-2xl font-bold text-white mb-6">Extra Credits Kopen</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {creditPacks.map((pack, index) => (
                      <motion.div
                        key={pack.credits}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 + index * 0.1 }}
                        className="relative"
                      >
                        {pack.popular && (
                          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
                            <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                              Beste Deal
                            </div>
                          </div>
                        )}
                        <Card className={`glass-effect border-white/10 ${pack.popular ? 'scale-105 ring-2 ring-green-500/50' : ''}`}>
                          <CardContent className="p-6 text-center">
                            <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center">
                              <CreditCard className="w-6 h-6 text-white" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">
                              {pack.credits} Credits
                              {pack.bonus > 0 && (
                                <span className="text-green-400 text-sm ml-2">+{pack.bonus} bonus</span>
                              )}
                            </h3>
                            <p className="text-3xl font-bold text-white mb-4">{pack.price}</p>
                            <p className="text-white/70 text-sm mb-6">
                              {pack.bonus > 0 ? `Totaal: ${pack.credits + pack.bonus} credits` : `${pack.credits} credits`}
                            </p>
                            <Button 
                              className="w-full button-glow"
                              onClick={() => handleFeatureClick(`Koop ${pack.credits} credits`)}
                            >
                               Koop Nu
                            </Button>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>
            </main>
          </div>
        </>
      );
    };

    export default Subscription;