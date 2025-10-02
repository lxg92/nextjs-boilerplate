import { SubscriptionTier } from './subscription-tiers';

export interface User {
  id: string;
  auth0Id: string;
  email: string;
  name: string;
  subscriptionTier: SubscriptionTier;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  subscriptionStatus?: 'active' | 'canceled' | 'past_due' | 'unpaid' | 'trialing';
  currentPeriodEnd?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface UsageStats {
  userId: string;
  charactersUsedThisMonth: number;
  recordingsCreatedThisMonth: number;
  voicesCreated: number;
  lastResetDate: Date;
}

export interface Voice {
  id: string;
  userId: string;
  voiceId: string;
  name: string;
  category?: string;
  createdAt: Date;
}

export interface Recording {
  id: string;
  userId: string;
  voiceId: string;
  voiceName: string;
  text: string;
  audioData: string; // base64 encoded audio
  timestamp: Date;
  speed: number;
  charactersUsed: number;
}

