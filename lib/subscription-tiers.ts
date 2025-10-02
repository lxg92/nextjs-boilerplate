export type SubscriptionTier = 'free' | 'basic' | 'premium';

export interface SubscriptionLimits {
  maxVoices: number;
  maxCharactersPerMonth: number;
  maxRecordingsPerMonth: number;
  canUseCustomVoices: boolean;
  canUseAdvancedSSML: boolean;
  prioritySupport: boolean;
}

export const SUBSCRIPTION_TIERS: Record<SubscriptionTier, SubscriptionLimits> = {
  free: {
    maxVoices: 1,
    maxCharactersPerMonth: 10000,
    maxRecordingsPerMonth: 50,
    canUseCustomVoices: true,
    canUseAdvancedSSML: false,
    prioritySupport: false,
  },
  basic: {
    maxVoices: 5,
    maxCharactersPerMonth: 100000,
    maxRecordingsPerMonth: 500,
    canUseCustomVoices: true,
    canUseAdvancedSSML: true,
    prioritySupport: false,
  },
  premium: {
    maxVoices: 20,
    maxCharactersPerMonth: 1000000,
    maxRecordingsPerMonth: 5000,
    canUseCustomVoices: true,
    canUseAdvancedSSML: true,
    prioritySupport: true,
  },
};

export const STRIPE_PRICE_IDS = {
  basic: process.env.STRIPE_BASIC_PRICE_ID || 'price_basic_monthly',
  premium: process.env.STRIPE_PREMIUM_PRICE_ID || 'price_premium_monthly',
};

export function getSubscriptionTier(subscriptionStatus?: string): SubscriptionTier {
  switch (subscriptionStatus) {
    case 'active':
      // This would need to be determined by checking the actual subscription
      // For now, we'll assume active means premium
      return 'premium';
    case 'basic':
      return 'basic';
    case 'free':
    default:
      return 'free';
  }
}

export function getUsageLimits(tier: SubscriptionTier): SubscriptionLimits {
  return SUBSCRIPTION_TIERS[tier];
}

export function checkUsageLimit(
  tier: SubscriptionTier,
  currentUsage: number,
  limitType: keyof SubscriptionLimits
): boolean {
  const limits = getUsageLimits(tier);
  const limit = limits[limitType] as number;
  return currentUsage < limit;
}

