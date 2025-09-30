
import React, { useState } from 'react';
    import { Link, useNavigate } from 'react-router-dom';
    import { motion } from 'framer-motion';
    import { Helmet } from 'react-helmet';
    import { Eye, EyeOff, Sparkles, ArrowRight } from 'lucide-react';
    import { useAuth } from '@/contexts/AuthContext';
    import { Button } from '@/components/ui/button';
    import { Input } from '@/components/ui/input';
    import { Label } from '@/components/ui/label';
    import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

    const Login = () => {
      const [email, setEmail] = useState('');
      const [password, setPassword] = useState('');
      const [showPassword, setShowPassword] = useState(false);
      const [loading, setLoading] = useState(false);
      const { login } = useAuth();
      const navigate = useNavigate();

      const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        await login(email, password);
        setLoading(false);
        // Navigation will be handled by AuthContext listener
      };

      return (
        <>
          <Helmet>
            <title>Inloggen - PHIXO</title>
            <meta name="description" content="Log in op uw PHIXO account en begin met het optimaliseren van uw foto's met AI-technologie." />
            <meta property="og:title" content="Inloggen - PHIXO" />
            <meta property="og:description" content="Log in op uw PHIXO account en begin met het optimaliseren van uw foto's met AI-technologie." />
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
                    Welkom terug
                  </CardTitle>
                  <CardDescription className="text-white/70 text-base">
                    Log in op je PHIXO account
                  </CardDescription>
                </CardHeader>

                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-white/80">E-mailadres</Label>
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
                      <Label htmlFor="password" className="text-white/80">Wachtwoord</Label>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          className="input-glow pr-12"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/60 hover:text-white transition-colors"
                          aria-label={showPassword ? "Verberg wachtwoord" : "Toon wachtwoord"}
                        >
                          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-end">
                      <Link
                        to="/forgot-password"
                        className="text-sm text-purple-400 hover:text-purple-300 transition-colors"
                      >
                        Wachtwoord vergeten?
                      </Link>
                    </div>

                    <Button
                      type="submit"
                      disabled={loading}
                      className="w-full button-glow h-12 text-base font-semibold"
                    >
                      {loading ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          <span>Inloggen...</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span>Inloggen</span>
                          <ArrowRight className="w-4 h-4" />
                        </div>
                      )}
                    </Button>
                  </form>

                  <div className="mt-8 text-center">
                    <p className="text-white/70">
                      Nog geen account?{' '}
                      <Link
                        to="/register"
                        className="text-purple-400 hover:text-purple-300 font-semibold transition-colors"
                      >
                        Registreer hier
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

    export default Login;
  