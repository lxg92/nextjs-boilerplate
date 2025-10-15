import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Recording } from '../types';

export const useRecordings = (page: number = 1, limit: number = 20, favoritesOnly: boolean = false) => {
  return useQuery({
    queryKey: ['recordings', page, limit, favoritesOnly],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        favoritesOnly: favoritesOnly.toString(),
      });
      
      const response = await fetch(`/api/recordings?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch recordings');
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useRecording = (recordingId: string) => {
  return useQuery({
    queryKey: ['recording', recordingId],
    queryFn: async () => {
      const response = await fetch(`/api/recordings/${recordingId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch recording');
      }
      return response.json();
    },
    enabled: !!recordingId,
  });
};

export const useSaveRecording = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: {
      audioBlob: File;
      voiceId: string;
      voiceName: string;
      text: string;
      speed: number;
      audioConfig?: any;
      presetUsed?: string;
    }) => {
      const formData = new FormData();
      formData.append('audioBlob', data.audioBlob);
      formData.append('voiceId', data.voiceId);
      formData.append('voiceName', data.voiceName);
      formData.append('text', data.text);
      formData.append('speed', data.speed.toString());
      if (data.audioConfig) {
        formData.append('audioConfig', JSON.stringify(data.audioConfig));
      }
      if (data.presetUsed) {
        formData.append('presetUsed', data.presetUsed);
      }

      const response = await fetch('/api/recordings', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to save recording');
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate recordings queries to refetch
      queryClient.invalidateQueries({ queryKey: ['recordings'] });
    },
  });
};

export const useToggleFavorite = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ recordingId, isFavorite }: { recordingId: string; isFavorite: boolean }) => {
      const response = await fetch(`/api/recordings/${recordingId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isFavorite }),
      });

      if (!response.ok) {
        throw new Error('Failed to toggle favorite');
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate recordings queries to refetch
      queryClient.invalidateQueries({ queryKey: ['recordings'] });
    },
  });
};

export const useDeleteRecording = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (recordingId: string) => {
      const response = await fetch(`/api/recordings/${recordingId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete recording');
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate recordings queries to refetch
      queryClient.invalidateQueries({ queryKey: ['recordings'] });
    },
  });
};


