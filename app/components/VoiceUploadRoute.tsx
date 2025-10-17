"use client";

import { useState } from "react";
import { useVoiceManagement } from "../hooks/useVoiceManagement";
import { useTierEmulation } from "../contexts/TierEmulationContext";
import { getMaxVoices } from "../lib/feature-flags";
import { SubscriptionTier } from "../types/subscription";

interface VoiceUploadRouteProps {
  onUploadSuccess?: (voiceId: string) => void;
}

export const VoiceUploadRoute = ({ onUploadSuccess }: VoiceUploadRouteProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [voiceName, setVoiceName] = useState("My IVC");

  const { createVoiceMutation, voices } = useVoiceManagement();
  const { getActiveTier } = useTierEmulation();
  
  const activeTier = getActiveTier();
  const maxVoices = getMaxVoices(activeTier);
  const currentVoiceCount = voices.length;
  const isAtLimit = currentVoiceCount >= maxVoices;

  const canCreate = !!file && !createVoiceMutation.isPending && !isAtLimit;

  const handleCreateVoice = () => {
    if (file) {
      createVoiceMutation.mutate(
        { file, name: voiceName },
        {
          onSuccess: (payload) => {
            const newId = payload.voice_id;
            onUploadSuccess?.(newId);
            
            // Reset form
            setFile(null);
            setVoiceName("My IVC");
          }
        }
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Upload Voice
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Create your own voice clone from an audio sample
        </p>
      </div>

      {/* Upload Section */}
      <div className="max-w-2xl mx-auto">
        {/* Voice Count Display */}
        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-blue-900 dark:text-blue-100">
                Voice Limit: {currentVoiceCount} / {maxVoices}
              </h3>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                {isAtLimit ? 'You\'ve reached your voice limit' : `${maxVoices - currentVoiceCount} voices remaining`}
              </p>
            </div>
            {isAtLimit && (
              <div className="text-2xl">🔒</div>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
            Voice Sample Upload
          </h2>
          
          <div className="space-y-6">
            {/* File Upload Area */}
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 text-center hover:border-gray-400 dark:hover:border-gray-500 transition-colors">
              <input
                type="file"
                accept=".mp3,.wav,.m4a,.aac,.ogg,.flac,audio/mpeg,audio/wav,audio/mp4,audio/aac,audio/ogg,audio/flac"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="cursor-pointer block"
              >
                <div className="text-gray-700 dark:text-gray-300">
                  {file ? (
                    <div>
                      <div className="text-4xl mb-4">✅</div>
                      <p className="text-green-600 dark:text-green-400 font-semibold text-lg">
                        {file.name}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                        Click to change file
                      </p>
                    </div>
                  ) : (
                    <div>
                      <div className="text-6xl mb-4">📁</div>
                      <p className="text-xl text-gray-900 dark:text-white font-medium">
                        Click to upload audio file
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                        Supports MP3, WAV, M4A, and other audio formats
                      </p>
                    </div>
                  )}
                </div>
              </label>
            </div>
            
            {/* Voice Name Input */}
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                Voice Name
              </label>
              <input
                className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-colors"
                placeholder="Enter a name for your voice"
                value={voiceName}
                onChange={(e) => setVoiceName(e.target.value)}
              />
            </div>
            
            {/* Upload Button */}
            <button
              className="w-full px-6 py-3 rounded-lg bg-blue-600 dark:bg-blue-700 text-white font-semibold hover:bg-blue-700 dark:hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
              disabled={!canCreate}
              onClick={handleCreateVoice}
            >
              {createVoiceMutation.isPending ? (
                <div className="flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Creating Voice Clone...
                </div>
              ) : isAtLimit ? (
                `Voice Limit Reached (${currentVoiceCount}/${maxVoices})`
              ) : (
                "Create Voice Clone"
              )}
            </button>
            
            {/* Voice Limit Warning */}
            {isAtLimit && (
              <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <p className="text-yellow-600 dark:text-yellow-400 text-sm font-medium">
                  You've reached your voice limit ({currentVoiceCount}/{maxVoices}). Delete a voice to upload a new one, or upgrade your tier.
                </p>
              </div>
            )}
            
            {/* Error Message */}
            {createVoiceMutation.isError && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-red-600 dark:text-red-400 text-sm font-medium">
                  {(createVoiceMutation.error as Error).message}
                </p>
              </div>
            )}

            {/* Success Message */}
            {createVoiceMutation.isSuccess && (
              <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <p className="text-green-600 dark:text-green-400 text-sm font-medium">
                  ✅ Voice clone created successfully! You can now use it to generate speech.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Tips Section */}
        <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-3">
            💡 Tips for Best Results
          </h3>
          <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
            <li>• Use clear, high-quality audio recordings</li>
            <li>• Speak naturally and at a consistent pace</li>
            <li>• Include a variety of words and phrases</li>
            <li>• Keep recordings between 30 seconds to 2 minutes</li>
            <li>• Avoid background noise and music</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
