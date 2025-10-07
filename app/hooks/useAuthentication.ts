import { useState, useEffect } from "react";

export interface AuthData {
  timestamp: number;
}

const AUTH_STORAGE_KEY = 'voiceAppAuth';
const SESSION_DURATION = 15 * 60 * 1000; // 15 minutes

export const useAuthentication = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");

  // Check authentication on mount
  useEffect(() => {
    const checkAuth = () => {
      const authData = localStorage.getItem(AUTH_STORAGE_KEY);
      if (authData) {
        const { timestamp }: AuthData = JSON.parse(authData);
        const now = Date.now();
        
        if (now - timestamp < SESSION_DURATION) {
          setIsAuthenticated(true);
        } else {
          // Session expired, clear storage
          localStorage.removeItem(AUTH_STORAGE_KEY);
        }
      }
    };

    checkAuth();
  }, []);

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === "vip") {
      setIsAuthenticated(true);
      setPasswordError("");
      // Store authentication with timestamp
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({
        timestamp: Date.now()
      }));
    } else {
      setPasswordError("Incorrect password. Please try again.");
      setPassword("");
    }
  };

  const logout = () => {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    setIsAuthenticated(false);
    setPassword("");
    setPasswordError("");
  };

  return {
    isAuthenticated,
    password,
    setPassword,
    passwordError,
    handlePasswordSubmit,
    logout
  };
};
