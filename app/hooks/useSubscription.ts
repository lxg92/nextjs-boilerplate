import { useMutation } from '@tanstack/react-query';

export const useCreateCheckoutSession = () => {
  return useMutation({
    mutationFn: async ({ priceId, tier }: { priceId: string; tier: 'BASIC' | 'PREMIUM' }) => {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ priceId, tier }),
      });

      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }

      const data = await response.json();
      return data.sessionUrl;
    },
  });
};

export const useCreatePortalSession = () => {
  return useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/stripe/portal', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to create portal session');
      }

      const data = await response.json();
      return data.portalUrl;
    },
  });
};


