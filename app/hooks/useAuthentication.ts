import { useState, useEffect } from "react";

export interface UserProfile {
  userId: string;
  email: string;
  subscriptionTier: 'FREE' | 'BASIC' | 'PREMIUM';
  subscriptionStatus: 'active' | 'canceled' | 'past_due' | 'trialing';
  recordingsThisMonth: number;
  features: {
    allowAdvancedAudioControls: boolean;
    allowCustomPresets: boolean;
    availablePresets: string[];
  };
}

export const useAuthentication = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/session');
        
        if (response.ok) {
          const data = await response.json();
          if (data.valid) {
            setIsAuthenticated(true);
            setUserProfile(data.user);
          } else {
            setIsAuthenticated(false);
            setUserProfile(null);
          }
        } else {
          setIsAuthenticated(false);
          setUserProfile(null);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        setIsAuthenticated(false);
        setUserProfile(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = () => {
    window.location.href = '/api/auth/login';
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setIsAuthenticated(false);
      setUserProfile(null);
      window.location.href = '/';
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const refreshProfile = async () => {
    try {
      const response = await fetch('/api/user/profile');
      if (response.ok) {
        const profile = await response.json();
        setUserProfile(profile);
      }
    } catch (error) {
      console.error('Profile refresh failed:', error);
    }
  };

  return {
    isAuthenticated,
    userProfile,
    isLoading,
    login,
    logout,
    refreshProfile,
  };
};