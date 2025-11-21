import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import * as Sentry from "@sentry/nextjs";
import { TTSRequest } from "../types";
import { useTierEmulation } from "../contexts/TierEmulationContext";

export const useTTSGeneration = (onSuccess?: (audioUrl: string, voiceId: string, voiceName: string, text: string, speed: number) => void, selectedVoice?: { voice_id: string; name: string } | null) => {
  const [customText, setCustomText] = useState("");
  const [selectedDefaultText, setSelectedDefaultText] = useState("");
  const [speechSpeed, setSpeechSpeed] = useState(1.0);

  const { incrementScriptCount } = useTierEmulation();

  // TTS generation mutation
  const ttsMutation = useMutation({
    mutationFn: async ({ voiceId, text, speed }: TTSRequest): Promise<string> => {
      let processedText;
      try {
        // Replace dashes with SSML break tags (following ElevenLabs best practices)
        processedText = text
          .replace(/---/g, '<break time="3s"/>')  // --- for 3 second pause
          .replace(/--/g, '<break time="1s"/>')   // -- for 1 second pause  
          .replace(/(?<!-)(?<![a-zA-Z])-((?!-)(?![a-zA-Z]))/g, '<break time="0.5s"/>'); // single dash for short pause, not between letters
      } catch (error) {
        Sentry.captureException(error as Error, {
          tags: { feature: "tts", operation: "ssml_processing", error_type: "text_processing" },
          extra: { voiceId, text_length: text?.length, speed },
        });
        // Fallback to original text if SSML processing fails
        processedText = text;
      }
      
      // Debug: Log the processed text to see what's being sent to ElevenLabs
      console.log('Original text:', text);
      console.log('Processed SSML:', processedText);
      
      try {
        const response = await fetch("/api/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ voiceId, text: processedText, speed }),
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          Sentry.captureException(new Error(`Failed to generate TTS: ${errorText}`), {
            tags: { feature: "tts", operation: "generate", http_status: response.status },
            extra: { endpoint: "/api/tts", method: "POST", status: response.status, error_message: errorText, voiceId, text_length: text?.length, speed },
          });
          throw new Error(errorText);
        }
        
        const blob = await response.blob();
        let blobUrl;
        try {
          blobUrl = URL.createObjectURL(blob);
        } catch (error) {
          Sentry.captureException(error as Error, {
            tags: { feature: "tts", operation: "blob_url_creation", error_type: "blob_creation" },
            extra: { voiceId, text_length: text?.length, speed, blob_size: blob.size },
          });
          throw new Error("Failed to create blob URL from audio response");
        }
        return blobUrl;
      } catch (error) {
        if (error instanceof Error && !error.message.includes("Failed to generate TTS") && !error.message.includes("Failed to create blob URL")) {
          Sentry.captureException(error, {
            tags: { feature: "tts", operation: "generate", error_type: "network" },
            extra: { endpoint: "/api/tts", method: "POST", voiceId, text_length: text?.length, speed },
          });
        }
        throw error;
      }
    },
    onSuccess: (url, variables) => {
      // Increment script count after successful generation
      incrementScriptCount();
      
      // Call the external success callback with all necessary data
      if (onSuccess) {
        const voiceName = selectedVoice?.name || "";
        onSuccess(url, variables.voiceId, voiceName, variables.text, variables.speed);
      }
    },
  });

  const canGenerateSpeech = (voiceId: string | null, isLoading: boolean) => 
    !!voiceId && !isLoading && customText.trim().length > 0;

  const handleDefaultTextChange = (text: string) => {
    setSelectedDefaultText(text);
    if (text) {
      setCustomText(text);
    }
  };

  const handleCustomTextChange = (text: string) => {
    setCustomText(text);
    if (text !== selectedDefaultText) {
      setSelectedDefaultText("");
    }
  };

  return {
    customText,
    selectedDefaultText,
    speechSpeed,
    setCustomText,
    setSelectedDefaultText,
    setSpeechSpeed,
    ttsMutation,
    canGenerateSpeech,
    handleDefaultTextChange,
    handleCustomTextChange
  };
};
