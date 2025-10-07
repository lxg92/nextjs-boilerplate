"use client";

import { useVoiceManagement } from "../hooks/useVoiceManagement";

export const VoiceSelectionSection = () => {
  const {
    voices,
    voicesLoading,
    selectedVoiceId,
    setSelectedVoiceId,
    selectedVoice,
    deleteVoiceMutation
  } = useVoiceManagement();

  const handleVoiceSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedVoiceId(e.target.value || null);
  };

  const handleDeleteVoice = (voiceId: string, voiceName: string) => {
    if (confirm(`Are you sure you want to delete "${voiceName}"? This action cannot be undone.`)) {
      deleteVoiceMutation.mutate(voiceId);
    }
  };

  return (
    <section className="space-y-3 rounded-xl border border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-800">
      <h2 className="font-medium text-gray-900 dark:text-white">
        2) Pick a voice
      </h2>
      
      {voicesLoading ? (
        <p className="text-gray-700 dark:text-gray-300">Loading voices…</p>
      ) : (
        <div className="space-y-3">
          {voices.length === 0 ? (
            <div className="space-y-3">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                No user-generated voices available. Upload a voice sample to create one.
              </p>
            </div>
          ) : (
            <>
              <select
                className="border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white p-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-colors"
                value={selectedVoiceId ?? ""}
                onChange={handleVoiceSelect}
              >
                <option value="">— Select —</option>
                {voices.map((voice) => (
                  <option key={voice.voice_id} value={voice.voice_id}>
                    {voice.name} ({voice.category ?? "personal"})
                  </option>
                ))}
              </select>
              
              {/* Voice list with delete buttons */}
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-gray-800 dark:text-gray-200">
                  Your Voices:
                </h3>
                <div className="space-y-1">
                  {voices.map((voice) => (
                    <div 
                      key={voice.voice_id} 
                      className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-600"
                    >
                      <div className="flex-1">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {voice.name}
                        </span>
                        <span className="text-xs text-gray-600 dark:text-gray-400 ml-2">
                          ({voice.category ?? "cloned"})
                        </span>
                      </div>
                      <button
                        onClick={() => handleDeleteVoice(voice.voice_id, voice.name)}
                        disabled={deleteVoiceMutation.isPending}
                        className="px-2 py-1 text-xs bg-red-600 dark:bg-red-700 text-white rounded hover:bg-red-700 dark:hover:bg-red-800 disabled:opacity-50 disabled:cursor-not-allowed font-medium focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
                      >
                        {deleteVoiceMutation.isPending ? "Deleting..." : "Delete"}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}
      
      {selectedVoice && (
        <p className="text-sm text-gray-700 dark:text-gray-300 font-medium">
          Selected: {selectedVoice.name}
        </p>
      )}
      
      {deleteVoiceMutation.isError && (
        <p className="text-red-600 dark:text-red-400 text-sm font-medium">
          {(deleteVoiceMutation.error as Error).message}
        </p>
      )}
    </section>
  );
};
