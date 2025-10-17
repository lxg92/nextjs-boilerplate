"use client";

import { createContext, useContext, useState, ReactNode } from 'react';
import { SubscriptionTier } from '../types/subscription';
import { getMaxScriptsPerSession } from '../lib/feature-flags';

interface TierEmulationContextType {
  emulatedTier: SubscriptionTier | null;
  actualTier: SubscriptionTier;
  scriptsGeneratedThisSession: number;
  setEmulatedTier: (tier: SubscriptionTier | null) => void;
  incrementScriptCount: () => void;
  getActiveTier: () => SubscriptionTier;
  canGenerateScript: () => boolean;
  resetScriptCount: () => void;
  getMaxScripts: () => number;
}

const TierEmulationContext = createContext<TierEmulationContextType | undefined>(undefined);

interface TierEmulationProviderProps {
  children: ReactNode;
  actualTier: SubscriptionTier;
}

export const TierEmulationProvider = ({ children, actualTier }: TierEmulationProviderProps) => {
  const [emulatedTier, setEmulatedTier] = useState<SubscriptionTier | null>(null);
  const [scriptsGeneratedThisSession, setScriptsGeneratedThisSession] = useState(0);

  const getActiveTier = (): SubscriptionTier => {
    return emulatedTier || actualTier;
  };

  const incrementScriptCount = () => {
    setScriptsGeneratedThisSession(prev => prev + 1);
  };

  const resetScriptCount = () => {
    setScriptsGeneratedThisSession(0);
  };

  const getMaxScripts = (): number => {
    const activeTier = getActiveTier();
    return getMaxScriptsPerSession(activeTier);
  };

  const canGenerateScript = (): boolean => {
    const maxScripts = getMaxScripts();
    return scriptsGeneratedThisSession < maxScripts;
  };

  const handleSetEmulatedTier = (tier: SubscriptionTier | null) => {
    setEmulatedTier(tier);
    // Reset script count when tier changes
    setScriptsGeneratedThisSession(0);
  };

  const value: TierEmulationContextType = {
    emulatedTier,
    actualTier,
    scriptsGeneratedThisSession,
    setEmulatedTier: handleSetEmulatedTier,
    incrementScriptCount,
    getActiveTier,
    canGenerateScript,
    resetScriptCount,
    getMaxScripts,
  };

  return (
    <TierEmulationContext.Provider value={value}>
      {children}
    </TierEmulationContext.Provider>
  );
};

export const useTierEmulation = () => {
  const context = useContext(TierEmulationContext);
  if (context === undefined) {
    throw new Error('useTierEmulation must be used within a TierEmulationProvider');
  }
  return context;
};
