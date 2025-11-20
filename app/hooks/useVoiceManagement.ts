import { useState, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Voice, VoicesResponse, CreateIVCResponse, DeleteVoiceRequest, VoiceUploadData } from "../types";

export const useVoiceManagement = () => {
  const queryClient = useQueryClient();
  const [selectedVoiceId, setSelectedVoiceId] = useState<string | null>(null);

  // Fetch voices
  const { data: voicesData, isLoading: voicesLoading } = useQuery<VoicesResponse>({
    queryKey: ["voices"],
    queryFn: async () => {
      const response = await fetch("/api/voices", { cache: "no-store" });
      if (!response.ok) throw new Error("Failed to fetch voices");
      return response.json();
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
      const formData = new FormData();
      formData.set("name", name);
      formData.set("file", file, file.name);
      
      const response = await fetch("/api/voices", { 
        method: "POST", 
        body: formData 
      });
      
      if (!response.ok) throw new Error(await response.text());
      return response.json();
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
      const response = await fetch("/api/voices", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ voiceId } as DeleteVoiceRequest),
      });
      
      if (!response.ok) throw new Error(await response.text());
      return response.json();
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
