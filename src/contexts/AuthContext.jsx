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

  // Development mock user for testing
  const isDevelopment = import.meta.env.DEV;
  const mockUser = isDevelopment ? {
    uid: 'mock-user-123',
    email: 'test@phixo.nl',
    displayName: 'Test User',
    photoURL: null
  } : null;

  const mockUserProfile = isDevelopment ? {
    uid: 'mock-user-123',
    email: 'test@phixo.nl',
    displayName: 'Test User',
    credits: 100,
    totalCreditsUsed: 0,
    totalImagesGenerated: 0,
    subscription: {
      plan: 'pro',
      status: 'active'
    }
  } : null;

  useEffect(() => {
    let unsubscribeUserData = null;

    // In development mode, handle mock user logic
    if (isDevelopment && mockUser) {
      if (!isLoggedOut) {
        setUser(mockUser);
        setUserProfile(mockUserProfile);
        setLoading(false);
        return () => {}; // Return empty cleanup function
      } else {
        // User is logged out, clear user state
        setUser(null);
        setUserProfile(null);
        setLoading(false);
        return () => {}; // Return empty cleanup function
      }
    }

    // Subscribe to auth state changes
    const unsubscribeAuth = authService.onAuthStateChange(async (firebaseUser) => {
      setUser(firebaseUser);
      setError(null);

      if (firebaseUser) {
        try {
          // Get user data from Firestore
          const userDoc = await authService.getCurrentUserData();
          setUserProfile(userDoc);

          // Subscribe to real-time user data updates
          unsubscribeUserData = databaseService.subscribeToUserData(
            firebaseUser.uid,
            (data) => {
              setUserProfile(data);
            }
          );
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

  // Development helper - expose logout function to window for testing
  if (isDevelopment) {
    window.testLogout = logout;
    window.testAuthState = () => {
      console.log('🔍 Current Auth State:', {
        user: !!user,
        isLoggedOut,
        localStorage: localStorage.getItem('phixo_logged_out')
      });
    };
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};