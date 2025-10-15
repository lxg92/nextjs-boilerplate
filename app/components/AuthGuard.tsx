"use client";

import { createContext, useContext } from "react";
import { useAuthentication } from "../hooks/useAuthentication";

interface AuthContextType {
  isAuthenticated: boolean;
  userProfile: any;
  isLoading: boolean;
  login: () => void;
  logout: () => void;
  refreshProfile: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuthContext must be used within an AuthGuard");
  }
  return context;
};

export const AuthGuard = ({ children }: { children: React.ReactNode }) => {
  const {
    isAuthenticated,
    userProfile,
    isLoading,
    login,
    logout,
    refreshProfile
  } = useAuthentication();

  if (isLoading) {
    return (
      <main className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </main>
    );
  }

  if (!isAuthenticated) {
    return (
      <main className="mx-auto max-w-md p-6">
        <div className="min-h-screen flex items-center justify-center">
          <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg border w-full">
            <h1 className="text-2xl font-semibold text-center mb-6 text-gray-900 dark:text-white">
              Voice Cloning App
            </h1>
            <p className="text-gray-700 dark:text-gray-300 text-center mb-6">
              Please sign in to access this application.
            </p>
            
            <button
              onClick={login}
              className="w-full bg-blue-600 dark:bg-blue-700 text-white py-3 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-800 transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Sign In
            </button>
            
            <p className="text-xs text-gray-600 dark:text-gray-400 text-center mt-4">
              Secure authentication powered by Auth0
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <AuthContext.Provider value={{ 
      isAuthenticated, 
      userProfile, 
      isLoading, 
      login, 
      logout, 
      refreshProfile 
    }}>
      {children}
    </AuthContext.Provider>
  );
};