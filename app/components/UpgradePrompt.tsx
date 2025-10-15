"use client";

import { useUserProfile } from '../hooks/useSession';
import { useCreateCheckoutSession } from '../hooks/useSubscription';

export const UpgradePrompt = ({ 
  message, 
  showUpgradeButton = true 
}: { 
  message: string; 
  showUpgradeButton?: boolean; 
}) => {
  const { data: userProfile } = useUserProfile();
  const createCheckoutSession = useCreateCheckoutSession();

  const handleUpgrade = async (tier: 'BASIC' | 'PREMIUM') => {
    try {
      const priceId = tier === 'BASIC' ? process.env.NEXT_PUBLIC_STRIPE_BASIC_PRICE_ID : process.env.NEXT_PUBLIC_STRIPE_PREMIUM_PRICE_ID;
      if (!priceId) {
        console.error('Price ID not configured');
        return;
      }

      const sessionUrl = await createCheckoutSession.mutateAsync({ priceId, tier });
      window.location.href = sessionUrl;
    } catch (error) {
      console.error('Failed to create checkout session:', error);
    }
  };

  if (!userProfile) return null;

  return (
    <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-6 mb-6">
      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0">
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
            <span className="text-white text-sm font-bold">!</span>
          </div>
        </div>
        
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Upgrade Required
          </h3>
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            {message}
          </p>
          
          {showUpgradeButton && (
            <div className="flex space-x-3">
              {userProfile.subscriptionTier === 'FREE' && (
                <button
                  onClick={() => handleUpgrade('BASIC')}
                  disabled={createCheckoutSession.isPending}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  Upgrade to Basic ($9.99/month)
                </button>
              )}
              
              <button
                onClick={() => handleUpgrade('PREMIUM')}
                disabled={createCheckoutSession.isPending}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
              >
                Upgrade to Premium ($29.99/month)
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};


