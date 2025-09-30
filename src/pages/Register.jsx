
import React, { useState } from 'react';
    import { Link, useNavigate } from 'react-router-dom';
    import { motion } from 'framer-motion';
    import { Helmet } from 'react-helmet';
    import { Eye, EyeOff, Sparkles, ArrowRight, Gift } from 'lucide-react';
    import { useAuth } from '@/contexts/AuthContext';
    import { Button } from '@/components/ui/button';
    import { Input } from '@/components/ui/input';
    import { Label } from '@/components/ui/label';
    import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
    import { toast } from '@/components/ui/use-toast';

    const Register = () => {
      const [email, setEmail] = useState('');
      const [password, setPassword] = useState('');
      const [confirmPassword, setConfirmPassword] = useState('');
      const [showPassword, setShowPassword] = useState(false);
      const [showConfirmPassword, setShowConfirmPassword] = useState(false);
      const [loading, setLoading] = useState(false);
      const { register } = useAuth();
      const navigate = useNavigate();

      const handleSubmit = async (e) => {
        e.preventDefault();
        if (password !== confirmPassword) {
          toast({ title: "Fout", description: "Wachtwoorden komen niet overeen.", variant: "destructive" });
          return;
        }
        setLoading(true);
        await register(email, password);
        setLoading(false);
        // After registration, user will be shown a toast to check email.
        // They can then login.
        navigate('/login');
      };

      return (
        <>
          <Helmet>
            <title>Registreren - PHIXO</title>
            <meta name="description" content="Maak een gratis PHIXO account aan en ontvang 10 credits om uit te proberen met AI-foto-optimalisatie." />
            <meta property="og:title" content="Registreren - PHIXO" />
            <meta property="og:description" content="Maak een gratis PHIXO account aan en ontvang 10 credits om uit te proberen met AI-foto-optimalisatie." />
          </Helmet>

          <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-slate-900">
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl floating-animation"></div>
              <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl floating-animation" style={{ animationDelay: '2s' }}></div>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl floating-animation" style={{ animationDelay: '4s' }}></div>
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
                    <Sparkles className="w-8 h-8 text-white" />
                  </motion.div>
                  <CardTitle className="text-3xl font-bold gradient-text">
                    Account aanmaken
                  </CardTitle>
                  <CardDescription className="text-white/70 text-base">
                    Start je reis met PHIXO
                  </CardDescription>
                  
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4 }}
                    className="mt-4 p-3 rounded-xl bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30"
                  >
                    <div className="flex items-center justify-center gap-2 text-green-400">
                      <Gift className="w-4 h-4" />
                      <span className="text-sm font-semibold">10 credits om uit te proberen bij registratie!</span>
                    </div>
                  </motion.div>
                </CardHeader>

                <CardContent>
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

                    <div className="space-y-2">
                      <Label htmlFor="password">Wachtwoord</Label>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Minimaal 6 karakters"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          className="input-glow pr-12"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/60 hover:text-white transition-colors"
                        >
                          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Wachtwoord bevestigen</Label>
                      <div className="relative">
                        <Input
                          id="confirmPassword"
                          type={showConfirmPassword ? 'text' : 'password'}
                          placeholder="Herhaal je wachtwoord"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          required
                          className="input-glow pr-12"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/60 hover:text-white transition-colors"
                        >
                          {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>

                    <Button
                      type="submit"
                      disabled={loading}
                      className="w-full button-glow h-12 text-base font-semibold"
                    >
                      {loading ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          Account aanmaken...
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          Account aanmaken
                          <ArrowRight className="w-4 h-4" />
                        </div>
                      )}
                    </Button>
                  </form>

                  <div className="mt-8 text-center">
                    <p className="text-white/70">
                      Al een account?{' '}
                      <Link
                        to="/login"
                        className="text-purple-400 hover:text-purple-300 font-semibold transition-colors"
                      >
                        Log hier in
                      </Link>
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </>
      );
    };

    export default Register;
  