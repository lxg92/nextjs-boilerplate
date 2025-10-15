export type SubscriptionTier = 'FREE' | 'BASIC' | 'PREMIUM';

export interface SubscriptionFeatures {
  maxRecordingsPerMonth: number;
  allowAdvancedAudioControls: boolean;
  allowCustomPresets: boolean;
  availablePresets: string[];
  priorityGeneration: boolean;
  supportLevel: 'standard' | 'premium';
}

export const TIER_FEATURES: Record<SubscriptionTier, SubscriptionFeatures> = {
  FREE: {
    maxRecordingsPerMonth: 10,
    allowAdvancedAudioControls: false,
    allowCustomPresets: false,
    availablePresets: ['preset1', 'preset2', 'preset3'],
    priorityGeneration: false,
    supportLevel: 'standard'
  },
  BASIC: {
    maxRecordingsPerMonth: 100,
    allowAdvancedAudioControls: false,
    allowCustomPresets: false,
    availablePresets: ['preset1', 'preset2', 'preset3', 'preset4', 'preset5', 'preset6', 'preset7', 'preset8', 'preset9', 'preset10'],
    priorityGeneration: true,
    supportLevel: 'standard'
  },
  PREMIUM: {
    maxRecordingsPerMonth: -1, // unlimited
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

