import React from 'react';
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
  Zap
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useCredits } from '@/contexts/CreditsContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';
import Sidebar from '@/components/Layout/Sidebar';

    const Dashboard = () => {
  const { userProfile } = useAuth();
  const { credits } = useCredits();

      const stats = [
        {
          title: 'Totaal Projecten',
          value: userProfile?.photos?.length || 0,
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

      const recentProjects = userProfile?.photos?.slice(0, 3) || [];

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
                            <Link to={`/edit-photo/${project.id}`} key={project.id}>
                              <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors cursor-pointer">
                                 <img  className="w-16 h-16 rounded-lg object-contain bg-gray-900/50" alt={project.name} src={project.url} />
                                <div className="flex-1">
                                  <h4 className="font-semibold text-white truncate">{project.name}</h4>
                                  <p className="text-sm text-white/70">Foto Optimalisatie</p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <Clock className="w-3 h-3 text-white/50" />
                                    <span className="text-xs text-white/50">{new Date(project.date).toLocaleDateString()}</span>
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
              </motion.div>
            </main>
          </div>
        </>
      );
    };

    export default Dashboard;
