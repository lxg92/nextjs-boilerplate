import { useQuery } from '@tanstack/react-query';

export const useUserProfile = () => {
  return useQuery({
    queryKey: ['userProfile'],
    queryFn: async () => {
      const response = await fetch('/api/user/profile');
      if (!response.ok) {
        throw new Error('Failed to fetch user profile');
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useUsageStats = () => {
  return useQuery({
    queryKey: ['usageStats'],
    queryFn: async () => {
      const response = await fetch('/api/user/usage');
      if (!response.ok) {
        throw new Error('Failed to fetch usage stats');
      }
      return response.json();
    },
    staleTime: 1 * 60 * 1000, // 1 minute
  });
};


