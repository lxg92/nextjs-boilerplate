"use client";

import { useTTSGeneration } from "../hooks/useTTSGeneration";
import { useVoiceManagement } from "../hooks/useVoiceManagement";
import { AudioPlayer } from "./AudioPlayer";

const DEFAULT_TEXTS = [
  "Hello, this is a test of the voice cloning system.",
  "Hello, this is a test of the voice cloning system. Welcome to our demonstration of text-to-speech technology. This is a sample text to showcase the voice synthesis capabilities. Thank you for using our voice cloning application today.",
  "Large sums of money come to me easily and quickly, in increasing quantities, from multiple sources, on a continuous basis, in the best interest of all, that I get to keep",
];

export const TTSGenerationSection = () => {
  const { selectedVoiceId } = useVoiceManagement();
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

  const handleGenerateSpeech = () => {
    if (selectedVoiceId && customText.trim()) {
      ttsMutation.mutate({ 
        voiceId: selectedVoiceId, 
        text: customText,
        speed: speechSpeed 
      });
    }
  };

  return (
    <section className="space-y-3 rounded-xl border border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-800">
      <h2 className="font-medium text-gray-900 dark:text-white">
        3) Generate speech with this voice
      </h2>
      
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">
            Choose default text or enter custom:
          </label>
          <select
            className="border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white p-2 rounded w-full mb-3 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-colors"
            value={selectedDefaultText}
            onChange={(e) => handleDefaultTextChange(e.target.value)}
          >
            <option value="">— Select default text —</option>
            {DEFAULT_TEXTS.map((text, index) => (
              <option key={index} value={text}>
                {text.length > 50 ? `(${text.length} characters) ` + text.substring(0, 50) + "..." : text}
              </option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">
            Custom text (max 2500 characters):
          </label>
          <textarea
            className="border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white p-2 rounded w-full h-32 resize-none focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-colors"
            placeholder="Enter your text here... Use -, --, --- for pauses. Speed is controlled by the slider below."
            value={customText}
            onChange={(e) => handleCustomTextChange(e.target.value)}
            maxLength={2500}
          />
          <div className="mt-2 space-y-1">
            <div className="flex justify-between items-center">
              <div className="text-xs text-gray-600 dark:text-gray-400">
                <span className="font-medium">Pauses:</span> 
                <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">-</code> (0.5s), 
                <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">--</code> (1s), 
                <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">---</code> (3s)
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
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">
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
        
        <button
          className="px-4 py-2 rounded bg-blue-600 dark:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed w-full font-medium hover:bg-blue-700 dark:hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          disabled={!canGenerateSpeech(selectedVoiceId, ttsMutation.isPending)}
          onClick={handleGenerateSpeech}
        >
          {ttsMutation.isPending ? "Generating…" : "Generate Speech"}
        </button>

        {ttsMutation.isError && (
          <p className="text-red-600 dark:text-red-400 text-sm font-medium">
            {(ttsMutation.error as Error).message}
          </p>
        )}

        {audioUrl && <AudioPlayer audioUrl={audioUrl} />}
      </div>
    </section>
  );
};
