import { TIER_FEATURES } from '../types/subscription';

export const getFeatureFlags = (subscriptionTier: 'FREE' | 'BASIC' | 'PREMIUM') => {
  return TIER_FEATURES[subscriptionTier];
};

export const canUseAdvancedControls = (subscriptionTier: 'FREE' | 'BASIC' | 'PREMIUM') => {
  return TIER_FEATURES[subscriptionTier].allowAdvancedAudioControls;
};

export const canCreateCustomPresets = (subscriptionTier: 'FREE' | 'BASIC' | 'PREMIUM') => {
  return TIER_FEATURES[subscriptionTier].allowCustomPresets;
};

export const getAvailablePresets = (subscriptionTier: 'FREE' | 'BASIC' | 'PREMIUM') => {
  return TIER_FEATURES[subscriptionTier].availablePresets;
};

export const getMaxRecordings = (subscriptionTier: 'FREE' | 'BASIC' | 'PREMIUM') => {
  return TIER_FEATURES[subscriptionTier].maxRecordingsPerMonth;
};

export const hasPriorityGeneration = (subscriptionTier: 'FREE' | 'BASIC' | 'PREMIUM') => {
  return TIER_FEATURES[subscriptionTier].priorityGeneration;
};

