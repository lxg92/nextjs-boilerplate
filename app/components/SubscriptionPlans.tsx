"use client";

import { useUserProfile } from '../hooks/useSession';
import { useCreateCheckoutSession } from '../hooks/useSubscription';

export const SubscriptionPlans = () => {
  const { data: userProfile } = useUserProfile();
  const createCheckoutSession = useCreateCheckoutSession();

  const plans = [
    {
      name: 'Free',
      price: '$0',
      period: 'forever',
      features: [
        '3 preset audio configurations',
        '10 recordings per month',
        'Standard voice generation',
        'Basic support'
      ],
      tier: 'FREE' as const,
      current: userProfile?.subscriptionTier === 'FREE',
    },
    {
      name: 'Basic',
      price: '$9.99',
      period: 'per month',
      features: [
        '10+ preset audio configurations',
        '100 recordings per month',
        'Priority voice generation',
        'Standard support'
      ],
      tier: 'BASIC' as const,
      current: userProfile?.subscriptionTier === 'BASIC',
    },
    {
      name: 'Premium',
      price: '$29.99',
      period: 'per month',
      features: [
        'Full access to all audio sliders',
        'Unlimited recordings',
        'Fastest voice generation',
        'Custom audio presets',
        'Premium support'
      ],
      tier: 'PREMIUM' as const,
      current: userProfile?.subscriptionTier === 'PREMIUM',
      popular: true,
    },
  ];

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

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
          Choose Your Plan
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400">
          Unlock advanced features and increase your recording limits
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={`relative bg-white dark:bg-gray-800 rounded-2xl shadow-lg border-2 ${
              plan.popular 
                ? 'border-purple-500 ring-2 ring-purple-200 dark:ring-purple-800' 
                : 'border-gray-200 dark:border-gray-700'
            } ${plan.current ? 'ring-2 ring-blue-500' : ''}`}
          >
            {plan.popular && (
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-purple-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                  Most Popular
                </span>
              </div>
            )}
            
            {plan.current && (
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                  Current Plan
                </span>
              </div>
            )}

            <div className="p-8">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {plan.name}
              </h3>
              
              <div className="mb-6">
                <span className="text-4xl font-bold text-gray-900 dark:text-white">
                  {plan.price}
                </span>
                <span className="text-gray-600 dark:text-gray-400 ml-1">
                  {plan.period}
                </span>
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-center">
                    <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                  </li>
                ))}
              </ul>

              {plan.tier === 'FREE' ? (
                <div className="text-center py-3 text-gray-500 dark:text-gray-400">
                  Current Plan
                </div>
              ) : (
                <button
                  onClick={() => handleUpgrade(plan.tier)}
                  disabled={createCheckoutSession.isPending || plan.current}
                  className={`w-full py-3 px-6 rounded-lg font-medium transition-colors ${
                    plan.popular
                      ? 'bg-purple-600 text-white hover:bg-purple-700'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {plan.current ? 'Current Plan' : `Upgrade to ${plan.name}`}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="text-center mt-12">
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          All plans include secure authentication and cloud storage
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-500">
          Cancel anytime. No hidden fees.
        </p>
      </div>
    </div>
  );
};


