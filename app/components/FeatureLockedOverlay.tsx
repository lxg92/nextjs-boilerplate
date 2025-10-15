"use client";

import { useUserProfile } from '../hooks/useSession';

interface FeatureLockedOverlayProps {
  children: React.ReactNode;
  feature: 'advancedAudioControls' | 'customPresets';
  message?: string;
}

export const FeatureLockedOverlay = ({ 
  children, 
  feature, 
  message 
}: FeatureLockedOverlayProps) => {
  const { data: userProfile } = useUserProfile();

  if (!userProfile) return <>{children}</>;

  const isLocked = 
    (feature === 'advancedAudioControls' && !userProfile.features.allowAdvancedAudioControls) ||
    (feature === 'customPresets' && !userProfile.features.allowCustomPresets);

  if (!isLocked) return <>{children}</>;

  const defaultMessage = 
    feature === 'advancedAudioControls' 
      ? 'Advanced audio controls are available with Premium subscription'
      : 'Custom presets are available with Premium subscription';

  return (
    <div className="relative">
      <div className="opacity-50 pointer-events-none">
        {children}
      </div>
      
      <div className="absolute inset-0 bg-black/20 rounded-lg flex items-center justify-center">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg text-center max-w-sm">
          <div className="text-2xl mb-2">🔒</div>
          <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
            {message || defaultMessage}
          </p>
          <button
            onClick={() => window.location.href = '/pricing'}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
          >
            Upgrade to Premium
          </button>
        </div>
      </div>
    </div>
  );
};


