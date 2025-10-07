"use client";

import { createContext, useContext } from "react";
import { useAuthentication } from "../hooks/useAuthentication";

interface AuthContextType {
  logout: () => void;
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
    password,
    setPassword,
    passwordError,
    handlePasswordSubmit,
    logout
  } = useAuthentication();

  if (!isAuthenticated) {
    return (
      <main className="mx-auto max-w-md p-6">
        <div className="min-h-screen flex items-center justify-center">
          <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg border w-full">
            <h1 className="text-2xl font-semibold text-center mb-6 text-gray-900 dark:text-white">
              Voice Cloning App
            </h1>
            <p className="text-gray-700 dark:text-gray-300 text-center mb-6">
              Please enter the password to access this application.
            </p>
            
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <input
                  type="password"
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-colors"
                  autoFocus
                />
                {passwordError && (
                  <p className="text-red-600 dark:text-red-400 text-sm mt-2 font-medium">
                    {passwordError}
                  </p>
                )}
              </div>
              
              <button
                type="submit"
                className="w-full bg-blue-600 dark:bg-blue-700 text-white py-3 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-800 transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Access Application
              </button>
            </form>
            
            <p className="text-xs text-gray-600 dark:text-gray-400 text-center mt-4">
              Session will remain active for 15 minutes
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <AuthContext.Provider value={{ logout }}>
      {children}
    </AuthContext.Provider>
  );
};
