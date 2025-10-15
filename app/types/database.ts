export interface User {
  userId: string; // Auth0 user ID
  email: string;
  auth0Id: string;
  stripeCustomerId?: string;
  subscriptionTier: 'FREE' | 'BASIC' | 'PREMIUM';
  subscriptionStatus: 'active' | 'canceled' | 'past_due' | 'trialing';
  recordingsThisMonth: number;
  recordingsResetDate: number; // timestamp
  createdAt: number; // timestamp
  lastLogin: number; // timestamp
  preferences?: Record<string, any>;
}

export interface Session {
  sessionId: string;
  userId: string;
  auth0Token: string;
  createdAt: number; // timestamp
  expiresAt: number; // timestamp
  ipAddress?: string;
}

export interface Recording {
  userId: string;
  recordingId: string;
  voiceId: string;
  voiceName: string;
  text: string;
  speed: number;
  s3Key: string;
  isFavorite: boolean;
  createdAt: number; // timestamp
  audioConfig?: Record<string, any>;
  presetUsed?: string;
}

export interface Subscription {
  userId: string;
  subscriptionId: string;
  stripeSubscriptionId: string;
  stripePriceId: string;
  tier: 'BASIC' | 'PREMIUM';
  status: 'active' | 'canceled' | 'past_due' | 'trialing';
  currentPeriodStart: number; // timestamp
  currentPeriodEnd: number; // timestamp
  cancelAtPeriodEnd: boolean;
  createdAt: number; // timestamp
}

export interface UserProfile {
  userId: string;
  email: string;
  subscriptionTier: 'FREE' | 'BASIC' | 'PREMIUM';
  subscriptionStatus: 'active' | 'canceled' | 'past_due' | 'trialing';
  recordingsThisMonth: number;
  maxRecordings: number;
  features: {
    allowAdvancedAudioControls: boolean;
    allowCustomPresets: boolean;
    availablePresets: string[];
  };
}

export interface UsageStats {
  recordingsUsed: number;
  recordingsLimit: number;
  resetDate: number; // timestamp
}

