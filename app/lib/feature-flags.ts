import { TIER_FEATURES } from '../types/subscription';
import { AUDIO_PRESETS, AudioPreset } from '../utils/audioPresets';

export const getFeatureFlags = (subscriptionTier: 'FREE' | 'BASIC' | 'PREMIUM') => {
  const features = TIER_FEATURES[subscriptionTier];
  if (!features) {
    console.error(`Invalid subscription tier: ${subscriptionTier}`);
    return TIER_FEATURES.FREE; // Fallback to FREE tier
  }
  return features;
};

export const canUseAdvancedControls = (subscriptionTier: 'FREE' | 'BASIC' | 'PREMIUM') => {
  const features = getFeatureFlags(subscriptionTier);
  return features.allowAdvancedAudioControls;
};

export const canCreateCustomPresets = (subscriptionTier: 'FREE' | 'BASIC' | 'PREMIUM') => {
  const features = getFeatureFlags(subscriptionTier);
  return features.allowCustomPresets;
};

export const getAvailablePresets = (subscriptionTier: 'FREE' | 'BASIC' | 'PREMIUM') => {
  const features = getFeatureFlags(subscriptionTier);
  return features.availablePresets;
};

export const getMaxRecordings = (subscriptionTier: 'FREE' | 'BASIC' | 'PREMIUM') => {
  const features = getFeatureFlags(subscriptionTier);
  return features.maxRecordingsPerMonth;
};

export const getMaxVoices = (subscriptionTier: 'FREE' | 'BASIC' | 'PREMIUM') => {
  const features = getFeatureFlags(subscriptionTier);
  return features.maxVoices;
};

export const getMaxTextLength = (subscriptionTier: 'FREE' | 'BASIC' | 'PREMIUM') => {
  const features = getFeatureFlags(subscriptionTier);
  return features.maxTextLength;
};

// Add this new function to centralize script limits
export const getMaxScriptsPerSession = (subscriptionTier: 'FREE' | 'BASIC' | 'PREMIUM') => {
  return subscriptionTier === 'FREE' ? 1 : subscriptionTier === 'BASIC' ? 10 : 50;
};

export const getFilteredPresets = (subscriptionTier: 'FREE' | 'BASIC' | 'PREMIUM'): AudioPreset[] => {
  const availablePresets = getAvailablePresets(subscriptionTier);
  
  if (availablePresets === 'all') {
    return AUDIO_PRESETS;
  }
  
  return AUDIO_PRESETS.filter(preset => 
    availablePresets.includes(preset.name)
  );
};

export const hasPriorityGeneration = (subscriptionTier: 'FREE' | 'BASIC' | 'PREMIUM') => {
  const features = getFeatureFlags(subscriptionTier);
  return features.priorityGeneration;
};
