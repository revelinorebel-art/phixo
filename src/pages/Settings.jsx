import React, { useState } from 'react';
    import { motion } from 'framer-motion';
    import { Helmet } from 'react-helmet';
    import { User, Lock, Bell, Shield, Trash2 } from 'lucide-react';
    import { useAuth } from '@/contexts/AuthContext';
    import { Button } from '@/components/ui/button';
    import { Input } from '@/components/ui/input';
    import { Label } from '@/components/ui/label';
    import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
    import { toast } from '@/components/ui/use-toast';
    import Sidebar from '@/components/Layout/Sidebar';

    const Settings = () => {
      const { userProfile, resetPassword } = useAuth();
      const [newPassword, setNewPassword] = useState('');
      const [confirmPassword, setConfirmPassword] = useState('');

      const handleFeatureClick = (feature) => {
        toast({
          title: "🚧 Deze functie is nog niet geïmplementeerd—maar maak je geen zorgen! Je kunt het aanvragen in je volgende prompt! 🚀",
          description: `${feature} wordt binnenkort beschikbaar.`,
        });
      };

      const handlePasswordUpdate = async (e) => {
        e.preventDefault();
        handleFeatureClick('Wachtwoord wijzigen is nog niet geïmplementeerd in de UI. Gebruik de wachtwoord reset functie.');
      };

      return (
        <>
          <Helmet>
            <title>Instellingen - phixo</title>
            <meta name="description" content="Beheer uw account instellingen, wijzig uw wachtwoord en pas uw voorkeuren aan voor phixo." />
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
                <div className="mb-8">
                  <h1 className="text-4xl font-bold gradient-text mb-2">Instellingen</h1>
                  <p className="text-white/70 text-lg">Beheer je account en voorkeuren</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-1">
                    <Card className="glass-effect border-white/10">
                      <CardContent className="p-6">
                        <nav className="space-y-2">
                          <a href="#profile" className="nav-item active">
                            <User className="w-5 h-5" />
                            Profiel
                          </a>
                          <a href="#security" className="nav-item">
                            <Shield className="w-5 h-5" />
                            Beveiliging
                          </a>
                          <a href="#notifications" className="nav-item">
                            <Bell className="w-5 h-5" />
                            Notificaties
                          </a>
                        </nav>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="lg:col-span-2 space-y-8">
                    <Card className="glass-effect border-white/10" id="profile">
                      <CardHeader>
                        <CardTitle className="text-xl text-white flex items-center gap-2">
                          <User className="w-5 h-5" />
                          Profiel Instellingen
                        </CardTitle>
                        <CardDescription className="text-white/70">
                          Beheer je persoonlijke informatie
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <form className="space-y-6">
                          <div className="space-y-2">
                            <Label htmlFor="email">E-mailadres</Label>
                            <Input
                              id="email"
                              type="email"
                              value={userProfile?.email || ''}
                              readOnly
                              className="input-glow cursor-not-allowed"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label>Account Type</Label>
                            <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                              <span className="text-purple-400 font-semibold capitalize">
                                {userProfile?.subscription_type} Plan
                              </span>
                            </div>
                          </div>

                          <Button type="button" onClick={() => handleFeatureClick('Profiel Bijwerken')} className="button-glow">
                            Profiel Bijwerken
                          </Button>
                        </form>
                      </CardContent>
                    </Card>

                    <Card className="glass-effect border-white/10" id="security">
                      <CardHeader>
                        <CardTitle className="text-xl text-white flex items-center gap-2">
                          <Lock className="w-5 h-5" />
                          Beveiliging
                        </CardTitle>
                        <CardDescription className="text-white/70">
                          Wijzig je wachtwoord en beveiligingsinstellingen
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <form onSubmit={handlePasswordUpdate} className="space-y-6">
                          <div className="space-y-2">
                            <Label htmlFor="newPassword">Nieuw Wachtwoord</Label>
                            <Input
                              id="newPassword"
                              type="password"
                              value={newPassword}
                              onChange={(e) => setNewPassword(e.target.value)}
                              className="input-glow"
                              disabled
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Bevestig Nieuw Wachtwoord</Label>
                            <Input
                              id="confirmPassword"
                              type="password"
                              value={confirmPassword}
                              onChange={(e) => setConfirmPassword(e.target.value)}
                              className="input-glow"
                              disabled
                            />
                          </div>

                          <Button type="submit" className="button-glow" disabled>
                            Wachtwoord Wijzigen
                          </Button>
                        </form>
                      </CardContent>
                    </Card>

                    <Card className="glass-effect border-red-500/20">
                      <CardHeader>
                        <CardTitle className="text-xl text-red-400 flex items-center gap-2">
                          <Trash2 className="w-5 h-5" />
                          Gevaarlijke Zone
                        </CardTitle>
                        <CardDescription className="text-white/70">
                          Permanente acties die niet ongedaan gemaakt kunnen worden
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                          <h4 className="font-medium text-red-400 mb-2">Account Verwijderen</h4>
                          <p className="text-white/70 text-sm mb-4">
                            Dit zal permanent je account en alle data verwijderen. Deze actie kan niet ongedaan gemaakt worden.
                          </p>
                          <Button 
                            variant="destructive"
                            onClick={() => handleFeatureClick('Account Verwijderen')}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Account Verwijderen
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </motion.div>
            </main>
          </div>
        </>
      );
    };

    export default Settings;
