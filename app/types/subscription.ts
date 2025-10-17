export type SubscriptionTier = 'FREE' | 'BASIC' | 'PREMIUM';

export interface SubscriptionFeatures {
  maxRecordingsPerMonth: number;
  maxVoices: number;
  maxTextLength: number;
  allowAdvancedAudioControls: boolean;
  allowCustomPresets: boolean;
  availablePresets: string[] | 'all';
  priorityGeneration: boolean;
  supportLevel: 'standard' | 'premium';
}

export const TIER_FEATURES: Record<SubscriptionTier, SubscriptionFeatures> = {
  FREE: {
    maxRecordingsPerMonth: 1,
    maxVoices: 1,
    maxTextLength: 0, // Only default texts allowed
    allowAdvancedAudioControls: false,
    allowCustomPresets: false,
    availablePresets: ['Mono', 'Stereo Separation', 'Cinematic Reverb'],
    priorityGeneration: false,
    supportLevel: 'standard'
  },
  BASIC: {
    maxRecordingsPerMonth: 10,
    maxVoices: 3,
    maxTextLength: 1500,
    allowAdvancedAudioControls: false,
    allowCustomPresets: false,
    availablePresets: 'all',
    priorityGeneration: true,
    supportLevel: 'standard'
  },
  PREMIUM: {
    maxRecordingsPerMonth: 50,
    maxVoices: 5,
    maxTextLength: 5000,
    allowAdvancedAudioControls: true,
    allowCustomPresets: true,
    availablePresets: 'all',
    priorityGeneration: true,
    supportLevel: 'premium'
  }
};

export interface SubscriptionPlan {
  tier: SubscriptionTier;
  priceId: string;
  price: number;
  currency: string;
  interval: 'month' | 'year';
  features: SubscriptionFeatures;
}

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    tier: 'FREE',
    priceId: '',
    price: 0,
    currency: 'usd',
    interval: 'month',
    features: TIER_FEATURES.FREE
  },
  {
    tier: 'BASIC',
    priceId: process.env.STRIPE_BASIC_PRICE_ID || '',
    price: 9.99,
    currency: 'usd',
    interval: 'month',
    features: TIER_FEATURES.BASIC
  },
  {
    tier: 'PREMIUM',
    priceId: process.env.STRIPE_PREMIUM_PRICE_ID || '',
    price: 29.99,
    currency: 'usd',
    interval: 'month',
    features: TIER_FEATURES.PREMIUM
  }
];
