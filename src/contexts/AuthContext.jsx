import React, { createContext, useContext, useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';

const AuthContext = createContext(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Dummy user data for local/disconnected state
const dummyUserProfile = {
  id: 'local-user',
  email: 'gebruiker@lokaal.dev',
  credits: 100,
  subscription_type: 'pro',
  photos: [],
  ads: [],
};

export const AuthProvider = ({ children }) => {
  const { toast } = useToast();
  const [session, setSession] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check local storage for a "logged in" flag
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    if (isLoggedIn) {
      setSession({ user: { id: 'local-user' } });
      setUserProfile(dummyUserProfile);
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    // Simulate a successful login
    console.log(`Logging in with ${email}`);
    localStorage.setItem('isLoggedIn', 'true');
    setSession({ user: { id: 'local-user' } });
    setUserProfile(dummyUserProfile);
    toast({ title: "Ingelogd (Lokaal)", description: "Je bent nu lokaal ingelogd." });
    setLoading(false);
  };

  const register = async (email, password) => {
    setLoading(true);
    console.log(`Registering ${email}`);
    toast({ title: "Registratie (Lokaal)", description: "Account lokaal aangemaakt. Je kunt nu inloggen." });
    setLoading(false);
  };

  const logout = async () => {
    localStorage.removeItem('isLoggedIn');
    setUserProfile(null);
    setSession(null);
    toast({ title: "Uitgelogd", description: "Je bent succesvol uitgelogd." });
  };
  
  const resetPassword = async (email) => {
     toast({ title: "Info", description: "Wachtwoord reset is niet beschikbaar in offline modus." });
  };

  const updateUserData = async (dataToUpdate) => {
    const updatedProfile = { ...userProfile, ...dataToUpdate };
    setUserProfile(updatedProfile);
    toast({ title: "Gegevens bijgewerkt (Lokaal)", description: "Je gegevens zijn lokaal bijgewerkt." });
  };

  const value = {
    session,
    user: session?.user,
    userProfile,
    loading,
    login,
    register,
    logout,
    resetPassword,
    updateUserData,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};