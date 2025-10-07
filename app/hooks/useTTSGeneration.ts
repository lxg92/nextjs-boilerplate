import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { TTSRequest } from "../types";

export const useTTSGeneration = () => {
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [customText, setCustomText] = useState("");
  const [selectedDefaultText, setSelectedDefaultText] = useState("");
  const [speechSpeed, setSpeechSpeed] = useState(1.0);

  // TTS generation mutation
  const ttsMutation = useMutation({
    mutationFn: async ({ voiceId, text, speed }: TTSRequest): Promise<string> => {
      // Replace dashes with SSML break tags (following ElevenLabs best practices)
      let processedText = text
        .replace(/---/g, '<break time="3s"/>')  // --- for 3 second pause
        .replace(/--/g, '<break time="1s"/>')   // -- for 1 second pause  
        .replace(/(?<!-)(?<![a-zA-Z])-((?!-)(?![a-zA-Z]))/g, '<break time="0.5s"/>'); // single dash for short pause, not between letters
      
      // Debug: Log the processed text to see what's being sent to ElevenLabs
      console.log('Original text:', text);
      console.log('Processed SSML:', processedText);
      
      const response = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ voiceId, text: processedText, speed }),
      });
      
      if (!response.ok) throw new Error(await response.text());
      const blob = await response.blob();
      return URL.createObjectURL(blob);
    },
    onSuccess: (url) => {
      // Clean up previous audio URL
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      setAudioUrl(url);
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
    audioUrl,
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
