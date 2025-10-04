"use client";

import { useEffect } from "react";
import { useAudioProcessing } from "../hooks/useAudioProcessing";
import AudioControls from "./AudioControls";
import { AudioVisualizer } from "./AudioVisualizer";

interface AudioPlayerProps {
  audioUrl: string | null;
  className?: string;
}

export const AudioPlayer = ({ audioUrl, className = "" }: AudioPlayerProps) => {
  const {
    state,
    updateChannelConfig,
    updateMasterVolume,
    setAudioSource,
    handlePlay,
    handleStop,
    isLoading,
  } = useAudioProcessing();

  // Set audio source when audioUrl changes
  useEffect(() => {
    if (audioUrl) {
      setAudioSource(audioUrl);
    }
  }, [audioUrl, setAudioSource]);

  const handleChannelVolumeChange = (channel: "left" | "right", volume: number) => {
    updateChannelConfig(channel, { volume });
  };

  const handleChannelPanChange = (channel: "left" | "right", pan: number) => {
    updateChannelConfig(channel, { pan });
  };

  const handleReverbToggle = (channel: "left" | "right", enabled: boolean) => {
    updateChannelConfig(channel, {
      reverb: { ...state[`${channel}Channel`].reverb, enabled }
    });
  };

  const handleReverbParametersChange = (
    channel: "left" | "right", 
    params: { roomSize?: number; wet?: number }
  ) => {
    updateChannelConfig(channel, {
      reverb: { 
        ...state[`${channel}Channel`].reverb, 
        ...params 
      }
    });
  };

  const handleDelayToggle = (channel: "left" | "right", enabled: boolean) => {
    updateChannelConfig(channel, {
      delay: { ...state[`${channel}Channel`].delay, enabled }
    });
  };

  const handleDelayParametersChange = (
    channel: "left" | "right", 
    params: { delayTime?: string; feedback?: number; wet?: number }
  ) => {
    updateChannelConfig(channel, {
      delay: { 
        ...state[`${channel}Channel`].delay, 
        ...params 
      }
    });
  };

  // Debug logging for state
  console.log("🚀 AudioPlayer Debug:", {
    isLoading,
    bufferLoaded: state.bufferLoaded,
    isPlaying: state.isPlaying,
    masterVolume: state.masterVolume
  });

  if (!audioUrl) {
    return null;
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Audio Controls */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-800">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Audio Playback & Channel Control</h3>
        
        <div className="flex items-center justify-center gap-4 mb-4">
          <button
            onClick={handlePlay}
            disabled={state.isPlaying || isLoading || !state.bufferLoaded}
            className="px-6 py-2 bg-green-600 dark:bg-green-700 text-white rounded-lg hover:bg-green-700 dark:hover:bg-green-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Loading...
              </>
            ) : !state.bufferLoaded ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Buffer Loading...
              </>
            ) : state.isPlaying ? (
              "Playing..."
            ) : (
              <>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                </svg>
                Play Audio
              </>
            )}
          </button>

          <button
            onClick={handleStop}
            disabled={!state.isPlaying}
            className="px-6 py-2 bg-red-600 dark:bg-red-700 text-white rounded-lg hover:bg-red-700 dark:hover:bg-red-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1zm4 0a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 8 0 00-1-1z" clipRule="evenodd" />
            </svg>
            Stop
          </button>
        </div>

        {/* Master Volume */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">
            Master Volume: {state.masterVolume}%
          </label>
          <input
            type="range"
            min="0"
            max="200"
            value={state.masterVolume}
            step="5"
            onChange={(e) => updateMasterVolume(Number(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
            style={{
              background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${(state.masterVolume / 200) * 100}%, #e5e7eb ${(state.masterVolume / 200) * 100}%, #e5e7eb 100%)`
            }}
          />
        </div>

        {/* Channel Controls */}
        <AudioControls
          leftChannel={state.leftChannel}
          rightChannel={state.rightChannel}
          onLeftVolumeChange={(volume) => handleChannelVolumeChange("left", volume)}
          onRightVolumeChange={(volume) => handleChannelVolumeChange("right", volume)}
          onLeftPanChange={(pan) => handleChannelPanChange("left", pan)}
          onRightPanChange={(pan) => handleChannelPanChange("right", pan)}
          onLeftReverbToggle={(enabled) => handleReverbToggle("left", enabled)}
          onRightReverbToggle={(enabled) => handleReverbToggle("right", enabled)}
          onLeftReverbChange={(params) => handleReverbParametersChange("left", params)}
          onRightReverbChange={(params) => handleReverbParametersChange("right", params)}
          onLeftDelayToggle={(enabled) => handleDelayToggle("left", enabled)}
          onRightDelayToggle={(enabled) => handleDelayToggle("right", enabled)}
          onLeftDelayChange={(params) => handleDelayParametersChange("left", params)}
          onRightDelayChange={(params) => handleDelayParametersChange("right", params)}
        />
      </div>

      {/* Audio Visualizer */}
      <AudioVisualizer audioUrl={audioUrl} />
    </div>
  );
};
