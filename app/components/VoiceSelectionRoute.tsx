"use client";

import { useState, useEffect } from "react";
import { useVoiceManagement } from "../hooks/useVoiceManagement";
import { useTTSGeneration } from "../hooks/useTTSGeneration";
import { AudioPlayer } from "./AudioPlayer";

const DEFAULT_TEXTS = [
  "Hello, this is a test of the voice cloning system.",
  "Hello, this is a test of the voice cloning system. Welcome to our demonstration of text-to-speech technology. This is a sample text to showcase the voice synthesis capabilities. Thank you for using our voice cloning application today.",
  "Large sums of money come to me easily and quickly, in increasing quantities, from multiple sources, on a continuous basis, in the best interest of all, that I get to keep",
];

interface VoiceSelectionRouteProps {
  selectedVoiceId?: string;
  onVoiceSelect?: (voiceId: string) => void;
}

export const VoiceSelectionRoute = ({ 
  selectedVoiceId: initialSelectedVoiceId, 
  onVoiceSelect 
}: VoiceSelectionRouteProps) => {
  // Use the voice management hook
  const {
    voices,
    voicesLoading,
    selectedVoiceId,
    setSelectedVoiceId,
    selectedVoice,
    deleteVoiceMutation
  } = useVoiceManagement();

  // Use the TTS generation hook
  const {
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
  } = useTTSGeneration();

  // Initialize selected voice if provided
  useEffect(() => {
    if (initialSelectedVoiceId && initialSelectedVoiceId !== selectedVoiceId) {
      setSelectedVoiceId(initialSelectedVoiceId);
    }
  }, [initialSelectedVoiceId, selectedVoiceId, setSelectedVoiceId]);

  const handleVoiceSelect = (voiceId: string) => {
    setSelectedVoiceId(voiceId);
    onVoiceSelect?.(voiceId);
  };

  const canSpeak = canGenerateSpeech(selectedVoiceId, ttsMutation.isPending);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Generate Speech
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Select a voice and create text-to-speech audio
        </p>
      </div>

      <div className="max-w-4xl mx-auto space-y-6">
        {/* Voice Selection */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Select Voice
          </h2>
          
          {voicesLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-2" />
              <span className="text-gray-600 dark:text-gray-400">Loading voices...</span>
            </div>
          ) : voices.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">🎤</div>
              <p className="text-gray-600 dark:text-gray-400 mb-2">
                No voices available yet
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500">
                Upload a voice sample to get started
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Voice Dropdown */}
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                  Choose Voice
                </label>
                <select
                  className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-colors"
                  value={selectedVoiceId ?? ""}
                  onChange={(e) => handleVoiceSelect(e.target.value || "")}
                >
                  <option value="">— Select a voice —</option>
                  {voices.map((v) => (
                    <option key={v.voice_id} value={v.voice_id}>
                      {v.name} ({v.category ?? "personal"})
                    </option>
                  ))}
                </select>
              </div>

              {/* Voice List with Delete */}
              <div>
                <h3 className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-3">
                  Your Voices
                </h3>
                <div className="space-y-2">
                  {voices.map((voice) => (
                    <div 
                      key={voice.voice_id} 
                      className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                        selectedVoiceId === voice.voice_id
                          ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
                          : "bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-600"
                      }`}
                    >
                      <div className="flex-1">
                        <span className="font-medium text-gray-900 dark:text-white">
                          {voice.name}
                        </span>
                        <span className="text-sm text-gray-600 dark:text-gray-400 ml-2">
                          ({voice.category ?? "cloned"})
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          if (confirm(`Delete "${voice.name}"? This cannot be undone.`)) {
                            deleteVoiceMutation.mutate(voice.voice_id);
                          }
                        }}
                        disabled={deleteVoiceMutation.isPending}
                        className="px-3 py-1 text-sm bg-red-600 dark:bg-red-700 text-white rounded hover:bg-red-700 dark:hover:bg-red-800 disabled:opacity-50 disabled:cursor-not-allowed font-medium focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
                      >
                        {deleteVoiceMutation.isPending ? "Deleting..." : "Delete"}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {selectedVoice && (
                <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <p className="text-sm text-green-700 dark:text-green-300 font-medium">
                    ✅ Selected: {selectedVoice.name}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* TTS Generation */}
        {selectedVoiceId && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Generate Speech
            </h2>
            
            <div className="space-y-6">
              {/* Text Input */}
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                  Choose default text or enter custom:
                </label>
                <select
                  className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white p-3 rounded-lg mb-3 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-colors"
                  value={selectedDefaultText}
                  onChange={(e) => handleDefaultTextChange(e.target.value)}
                >
                  <option value="">— Select default text —</option>
                  {DEFAULT_TEXTS.map((text, index) => (
                    <option key={index} value={text}>
                      {text.length > 50 ? `(${text.length} chars) ` + text.substring(0, 50) + "..." : text}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                  Custom text (max 2500 characters):
                </label>
                <textarea
                  className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white p-3 rounded-lg h-32 resize-none focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-colors"
                  placeholder="Enter your text here... Use -, --, --- for pauses."
                  value={customText}
                  onChange={(e) => handleCustomTextChange(e.target.value)}
                  maxLength={2500}
                />
                <div className="mt-2 flex justify-between items-center">
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    <span className="font-medium">Pauses:</span> 
                    <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded mx-1">-</code> (0.5s), 
                    <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded mx-1">--</code> (1s), 
                    <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded mx-1">---</code> (3s)
                  </div>
                  <span className={`text-xs font-medium ${
                    customText.length > 2500 ? 'text-red-600 dark:text-red-400' : 
                    customText.length > 2250 ? 'text-yellow-600 dark:text-yellow-400' : 
                    'text-gray-600 dark:text-gray-400'
                  }`}>
                    {customText.length}/2500
                  </span>
                </div>
              </div>
              
              {/* Speed Control */}
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                  Speech Speed: {speechSpeed}x
                </label>
                <div className="space-y-2">
                  <input
                    type="range"
                    min="0.7"
                    max="1.2"
                    step="0.1"
                    value={speechSpeed}
                    onChange={(e) => setSpeechSpeed(parseFloat(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                    style={{
                      background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${((speechSpeed - 0.7) / 0.5) * 100}%, #e5e7eb ${((speechSpeed - 0.7) / 0.5) * 100}%, #e5e7eb 100%)`
                    }}
                  />
                  <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
                    <span>0.7x (Slow)</span>
                    <span>1.0x (Normal)</span>
                    <span>1.2x (Fast)</span>
                  </div>
                </div>
              </div>
              
              {/* Generate Button */}
              <button
                className="w-full px-6 py-3 rounded-lg bg-blue-600 dark:bg-blue-700 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 dark:hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                disabled={!canSpeak || !customText.trim()}
                onClick={() =>
                  selectedVoiceId &&
                  customText.trim() &&
                  ttsMutation.mutate({ voiceId: selectedVoiceId, text: customText, speed: speechSpeed })
                }
              >
                {ttsMutation.isPending ? (
                  <div className="flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Generating Speech...
                  </div>
                ) : (
                  "Generate Speech"
                )}
              </button>

              {/* Error Message */}
              {ttsMutation.isError && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-red-600 dark:text-red-400 text-sm font-medium">
                    {(ttsMutation.error as Error).message}
                  </p>
                </div>
              )}

              {/* Audio Player */}
              {audioUrl && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Generated Audio
                  </h3>
                  <AudioPlayer audioUrl={audioUrl} />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
