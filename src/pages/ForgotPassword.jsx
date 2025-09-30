
import React, { useState } from 'react';
    import { Link } from 'react-router-dom';
    import { motion } from 'framer-motion';
    import { Helmet } from 'react-helmet';
    import { ArrowLeft, Mail, Sparkles } from 'lucide-react';
    import { useAuth } from '@/contexts/AuthContext';
    import { Button } from '@/components/ui/button';
    import { Input } from '@/components/ui/input';
    import { Label } from '@/components/ui/label';
    import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

    const ForgotPassword = () => {
      const [email, setEmail] = useState('');
      const [loading, setLoading] = useState(false);
      const [sent, setSent] = useState(false);
      const { resetPassword } = useAuth();

      const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        await resetPassword(email);
        setLoading(false);
        setSent(true);
      };

      return (
        <>
          <Helmet>
            <title>Wachtwoord Vergeten - PHIXO</title>
            <meta name="description" content="Reset uw wachtwoord voor uw PHIXO account. Voer uw e-mailadres in om een reset link te ontvangen." />
            <meta property="og:title" content="Wachtwoord Vergeten - PHIXO" />
            <meta property="og:description" content="Reset uw wachtwoord voor uw PHIXO account. Voer uw e-mailadres in om een reset link te ontvangen." />
          </Helmet>

          <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-slate-900">
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl floating-animation"></div>
              <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl floating-animation" style={{ animationDelay: '2s' }}></div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="w-full max-w-md relative z-10"
            >
              <Card className="glass-effect border-white/20 shadow-2xl">
                <CardHeader className="text-center pb-8">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                    className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 flex items-center justify-center pulse-glow"
                  >
                    {sent ? <Mail className="w-8 h-8 text-white" /> : <Sparkles className="w-8 h-8 text-white" />}
                  </motion.div>
                  <CardTitle className="text-3xl font-bold gradient-text">
                    {sent ? 'E-mail verzonden!' : 'Wachtwoord vergeten?'}
                  </CardTitle>
                  <CardDescription className="text-white/70 text-base">
                    {sent 
                      ? 'Controleer je inbox voor instructies om je wachtwoord te resetten.'
                      : 'Geen probleem! Voer je e-mailadres in en we sturen je een reset link.'
                    }
                  </CardDescription>
                </CardHeader>

                <CardContent>
                  {sent ? (
                    <div className="space-y-6">
                      <div className="text-center p-6 rounded-xl bg-green-500/10 border border-green-500/20">
                        <Mail className="w-12 h-12 text-green-400 mx-auto mb-3" />
                        <p className="text-green-400 font-medium">
                          Reset link verzonden naar {email}
                        </p>
                        <p className="text-white/70 text-sm mt-2">
                          Controleer ook je spam folder als je de e-mail niet ziet.
                        </p>
                      </div>
                      
                      <Link to="/login">
                        <Button className="w-full button-glow h-12 text-base font-semibold">
                          <ArrowLeft className="w-4 h-4 mr-2" />
                          Terug naar inloggen
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div className="space-y-2">
                        <Label htmlFor="email">E-mailadres</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="je@email.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          className="input-glow"
                        />
                      </div>

                      <Button
                        type="submit"
                        disabled={loading}
                        className="w-full button-glow h-12 text-base font-semibold"
                      >
                        {loading ? (
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            Verzenden...
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4" />
                            Reset link verzenden
                          </div>
                        )}
                      </Button>

                      <div className="text-center">
                        <Link
                          to="/login"
                          className="inline-flex items-center gap-2 text-purple-400 hover:text-purple-300 transition-colors"
                        >
                          <ArrowLeft className="w-4 h-4" />
                          Terug naar inloggen
                        </Link>
                      </div>
                    </form>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </>
      );
    };

    export default ForgotPassword;
  