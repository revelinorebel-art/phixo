import React, { createContext, useContext, useEffect, useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { authService } from '../services/authService';
import { databaseService } from '../services/databaseService';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const { toast } = useToast();
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isLoggedOut, setIsLoggedOut] = useState(() => {
    const loggedOutValue = localStorage.getItem('phixo_logged_out');
    return loggedOutValue === 'true';
  });

  useEffect(() => {
    let unsubscribeUserData = null;

    // Subscribe to auth state changes
    const unsubscribeAuth = authService.onAuthStateChange(async (firebaseUser) => {
      console.log('🔍 Auth state changed:', firebaseUser ? `User: ${firebaseUser.email}` : 'No user');
      setUser(firebaseUser);
      setError(null);

      if (firebaseUser) {
        try {
          console.log('📊 Fetching user data for:', firebaseUser.email);
          // Get user data from Firestore
          const userDoc = await authService.getCurrentUserData();
          console.log('📋 User document:', userDoc);
          setUserProfile(userDoc);

          // Subscribe to real-time user data updates with enhanced error handling
          try {
            unsubscribeUserData = databaseService.subscribeToUserData(
              firebaseUser.uid,
              (data) => {
                if (data) {
                  console.log('🔄 Real-time user data update:', data);
                  setUserProfile(data);
                } else {
                  console.warn('⚠️ Received null user data from listener');
                }
              }
            );
            console.log('✅ Real-time user data listener established');
          } catch (listenerError) {
            console.error('❌ Failed to establish real-time listener:', listenerError);
            // Fallback: just use the initial user data without real-time updates
            toast({
              title: "Waarschuwing",
              description: "Real-time updates zijn tijdelijk niet beschikbaar",
              variant: "default"
            });
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          setError(error.message);
          toast({
            title: "Fout",
            description: "Kon gebruikersgegevens niet ophalen",
            variant: "destructive"
          });
        }
      } else {
        console.log('👤 No user - clearing profile');
        setUserProfile(null);
        if (unsubscribeUserData) {
          unsubscribeUserData();
          unsubscribeUserData = null;
        }
      }

      setLoading(false);
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeUserData) {
        unsubscribeUserData();
      }
    };
  }, [toast, isLoggedOut]);

  // Register (sign up)
  const register = async (email, password, displayName = '') => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🚀 Starting registration process...', { email, displayName });
      
      const result = await authService.signUp(email, password, displayName);
      console.log('📝 AuthService signUp result:', result);
      
      if (result.error) {
        console.error('❌ Registration error:', result.error);
        setError(result.error);
        toast({
          title: "Registratie mislukt",
          description: result.error,
          variant: "destructive"
        });
        return { success: false, error: result.error };
      }
      
      console.log('✅ Registration successful!', result.user);
      toast({
        title: "Account aangemaakt",
        description: "Je account is succesvol aangemaakt!"
      });
      return { success: true, user: result.user };
    } catch (error) {
      console.error('❌ Registration exception:', error);
      setError(error.message);
      toast({
        title: "Registratie mislukt",
        description: error.message,
        variant: "destructive"
      });
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Login (sign in)
  const login = async (email, password) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await authService.signIn(email, password);
      if (result.error) {
        setError(result.error);
        toast({
          title: "Inloggen mislukt",
          description: result.error,
          variant: "destructive"
        });
        return { success: false, error: result.error };
      }
      
      setIsLoggedOut(false);
      localStorage.removeItem('phixo_logged_out');
      toast({
        title: "Welkom terug!",
        description: "Je bent succesvol ingelogd."
      });
      return { success: true, user: result.user };
    } catch (error) {
      setError(error.message);
      toast({
        title: "Inloggen mislukt",
        description: error.message,
        variant: "destructive"
      });
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Sign in with Google
  const signInWithGoogle = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await authService.signInWithGoogle();
      if (result.error) {
        setError(result.error);
        toast({
          title: "Google inloggen mislukt",
          description: result.error,
          variant: "destructive"
        });
        return { success: false, error: result.error };
      }
      
      setIsLoggedOut(false);
      localStorage.removeItem('phixo_logged_out');
      toast({
        title: "Welkom!",
        description: "Je bent succesvol ingelogd met Google."
      });
      return { success: true, user: result.user };
    } catch (error) {
      setError(error.message);
      toast({
        title: "Google inloggen mislukt",
        description: error.message,
        variant: "destructive"
      });
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Logout (sign out)
  const logout = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Set logged out flag in localStorage
      localStorage.setItem('phixo_logged_out', 'true');
      
      // Update state
      setIsLoggedOut(true);
      setUser(null);
      setUserProfile(null);
      
      // Sign out from Firebase (if not in development mode)
      if (!isDevelopment) {
        await authService.signOut();
      }
      
    } catch (error) {
      console.error('Logout error:', error);
      setError('Er is een fout opgetreden bij het uitloggen');
    } finally {
      setLoading(false);
    }
  };

  // Reset password
  const resetPassword = async (email) => {
    setError(null);
    
    try {
      const result = await authService.resetPassword(email);
      if (result.error) {
        setError(result.error);
        toast({
          title: "Wachtwoord reset mislukt",
          description: result.error,
          variant: "destructive"
        });
        return { success: false, error: result.error };
      }
      
      toast({
        title: "Reset email verzonden",
        description: "Controleer je email voor instructies om je wachtwoord te resetten."
      });
      return { success: true };
    } catch (error) {
      setError(error.message);
      toast({
        title: "Wachtwoord reset mislukt",
        description: error.message,
        variant: "destructive"
      });
      return { success: false, error: error.message };
    }
  };

  // Update user data
  const updateUserData = async (updates) => {
    setError(null);
    
    try {
      const result = await authService.updateUserProfile(updates);
      if (result.error) {
        setError(result.error);
        toast({
          title: "Update mislukt",
          description: result.error,
          variant: "destructive"
        });
        return { success: false, error: result.error };
      }
      
      toast({
        title: "Profiel bijgewerkt",
        description: "Je profielgegevens zijn succesvol bijgewerkt."
      });
      return { success: true };
    } catch (error) {
      setError(error.message);
      toast({
        title: "Update mislukt",
        description: error.message,
        variant: "destructive"
      });
      return { success: false, error: error.message };
    }
  };

  // Get credits
  const getCredits = () => {
    return userProfile?.credits || 0;
  };

  // Check if user has enough credits
  const hasCredits = (amount = 1) => {
    return getCredits() >= amount;
  };

  // Refresh user data
  const refreshUserData = async () => {
    if (user) {
      try {
        const userDoc = await authService.getCurrentUserData();
        setUserProfile(userDoc);
      } catch (error) {
        console.error('Error refreshing user data:', error);
        setError(error.message);
      }
    }
  };

  const value = {
    // User state (backward compatibility)
    session: user ? { user } : null,
    user,
    userProfile,
    loading,
    error,
    
    // Auth methods
    register,
    login,
    signInWithGoogle,
    logout,
    resetPassword,
    updateUserData,
    
    // Utility methods
    isAuthenticated: !!user,
    getCredits,
    hasCredits,
    refreshUserData,
    
    // Clear error
    clearError: () => setError(null)
  };



  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};