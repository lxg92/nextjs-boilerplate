import { useState, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as Sentry from "@sentry/nextjs";
import { Voice, VoicesResponse, CreateIVCResponse, DeleteVoiceRequest, VoiceUploadData } from "../types";

export const useVoiceManagement = () => {
  const queryClient = useQueryClient();
  const [selectedVoiceId, setSelectedVoiceId] = useState<string | null>(null);

  // Fetch voices
  const { data: voicesData, isLoading: voicesLoading } = useQuery<VoicesResponse>({
    queryKey: ["voices"],
    queryFn: async () => {
      try {
        const response = await fetch("/api/voices", { cache: "no-store" });
        if (!response.ok) {
          const errorText = await response.text();
          Sentry.captureException(new Error(`Failed to fetch voices: ${errorText}`), {
            tags: { feature: "voices", operation: "fetch", http_status: response.status },
            extra: { endpoint: "/api/voices", method: "GET", status: response.status, error_message: errorText },
          });
          throw new Error(`Failed to fetch voices: ${errorText}`);
        }
        return response.json();
      } catch (error) {
        if (error instanceof Error && !error.message.includes("Failed to fetch voices")) {
          Sentry.captureException(error, {
            tags: { feature: "voices", operation: "fetch", error_type: "network" },
            extra: { endpoint: "/api/voices", method: "GET" },
          });
        }
        throw error;
      }
    },
    staleTime: 0,
  });

  const voices = voicesData?.voices ?? [];
  
  const selectedVoice = useMemo(
    () => voices.find((v) => v.voice_id === selectedVoiceId) ?? null,
    [voices, selectedVoiceId]
  );

  // Create voice mutation
  const createVoiceMutation = useMutation({
    mutationFn: async ({ file, name }: VoiceUploadData): Promise<CreateIVCResponse> => {
      try {
        const formData = new FormData();
        formData.set("name", name);
        formData.set("file", file, file.name);
        
        const response = await fetch("/api/voices", { 
          method: "POST", 
          body: formData 
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          Sentry.captureException(new Error(`Failed to create voice: ${errorText}`), {
            tags: { feature: "voices", operation: "create", http_status: response.status },
            extra: { endpoint: "/api/voices", method: "POST", status: response.status, error_message: errorText, file_name: file.name, voice_name: name },
          });
          throw new Error(errorText);
        }
        return response.json();
      } catch (error) {
        if (error instanceof Error && !error.message.includes("Failed to create voice")) {
          Sentry.captureException(error, {
            tags: { feature: "voices", operation: "create", error_type: "network" },
            extra: { endpoint: "/api/voices", method: "POST", file_name: file.name, voice_name: name },
          });
        }
        throw error;
      }
    },
    onSuccess: async (payload) => {
      const newId = payload.voice_id;
      // Refresh voices and auto-select the new one
      await queryClient.invalidateQueries({ queryKey: ["voices"] });
      setSelectedVoiceId(newId);
    },
  });

  // Delete voice mutation
  const deleteVoiceMutation = useMutation({
    mutationFn: async (voiceId: string) => {
      try {
        const response = await fetch("/api/voices", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ voiceId } as DeleteVoiceRequest),
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          Sentry.captureException(new Error(`Failed to delete voice: ${errorText}`), {
            tags: { feature: "voices", operation: "delete", http_status: response.status },
            extra: { endpoint: "/api/voices", method: "DELETE", status: response.status, error_message: errorText, voiceId },
          });
          throw new Error(errorText);
        }
        return response.json();
      } catch (error) {
        if (error instanceof Error && !error.message.includes("Failed to delete voice")) {
          Sentry.captureException(error, {
            tags: { feature: "voices", operation: "delete", error_type: "network" },
            extra: { endpoint: "/api/voices", method: "DELETE", voiceId },
          });
        }
        throw error;
      }
    },
    onSuccess: async () => {
      // Refresh voices list after deletion
      await queryClient.invalidateQueries({ queryKey: ["voices"] });
      // Clear selection if the deleted voice was selected
      setSelectedVoiceId(null);
    },
  });

  const canCreateVoice = (file: File | null, isLoading: boolean) => 
    !!file && !isLoading;

  return {
    voices,
    voicesLoading,
    selectedVoiceId,
    setSelectedVoiceId,
    selectedVoice,
    createVoiceMutation,
    deleteVoiceMutation,
    canCreateVoice
  };
};
