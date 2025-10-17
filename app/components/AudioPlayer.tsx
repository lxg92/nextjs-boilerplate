"use client";

import { useEffect, useState } from "react";
import { useAudioProcessing } from "../hooks/useAudioProcessing";
import AudioControls from "./AudioControls";
import { PlaybackProgress } from "./PlaybackProgress";
import { AUDIO_PRESETS, AudioPreset } from "../utils/audioPresets";
import { useTierEmulation } from "../contexts/TierEmulationContext";
import { getFilteredPresets, getAllAvailablePresets, canCreateCustomPresets } from "../lib/feature-flags";
import { SubscriptionTier } from "../types/subscription";
import { PresetManager } from './PresetManager';
import { CustomPreset, useCustomPresets, isCustomPreset } from '../hooks/useCustomPresets';

type Channel = "left" | "right";

interface AudioPlayerProps {
  audioUrl: string | null;
  className?: string;
  actualTier: SubscriptionTier;
}

interface ChannelHandlers {
  onVolumeChange: (channel: Channel, volume: number) => void;
  onPanChange: (channel: Channel, pan: number) => void;
  onReverbToggle: (channel: Channel, enabled: boolean) => void;
  onReverbChange: (channel: Channel, params: { roomSize?: number; wet?: number }) => void;
  onDelayToggle: (channel: Channel, enabled: boolean) => void;
  onDelayChange: (channel: Channel, params: { delayTime?: string; feedback?: number; wet?: number }) => void;
  onFrequencyToggle: (channel: Channel, enabled: boolean) => void;
  onFrequencyChange: (channel: Channel, params: { frequency?: number; wet?: number }) => void;
  onNoiseToggle: (channel: Channel, enabled: boolean) => void;
  onNoiseChange: (channel: Channel, params: { type?: "brown" | "pink" | "white"; wet?: number }) => void;
}

const Spinner = ({ label }: { label: string }) => (
  <>
    <div
      className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"
      aria-hidden="true"
    />
    <span className="sr-only">{label}</span>
    {label}
  </>
);

// Custom hook for channel event handlers
const useChannelHandlers = (
  updateChannelConfig: (channel: "left" | "right", config: any) => void,
  state: any
): ChannelHandlers => {
  const handleVolumeChange = (channel: Channel, volume: number) => {
    updateChannelConfig(channel, { volume });
  };

  const handlePanChange = (channel: Channel, pan: number) => {
    updateChannelConfig(channel, { pan });
  };

  const handleReverbToggle = (channel: Channel, enabled: boolean) => {
    updateChannelConfig(channel, {
      reverb: { ...state[`${channel}Channel`].reverb, enabled }
    });
  };

  const handleReverbChange = (
    channel: Channel,
    params: { roomSize?: number; wet?: number }
  ) => {
    updateChannelConfig(channel, {
      reverb: {
        ...state[`${channel}Channel`].reverb,
        ...params
      }
    });
  };

  const handleDelayToggle = (channel: Channel, enabled: boolean) => {
    updateChannelConfig(channel, {
      delay: { ...state[`${channel}Channel`].delay, enabled }
    });
  };

  const handleDelayChange = (
    channel: Channel,
    params: { delayTime?: string; feedback?: number; wet?: number }
  ) => {
    updateChannelConfig(channel, {
      delay: {
        ...state[`${channel}Channel`].delay,
        ...params
      }
    });
  };

  const handleFrequencyToggle = (channel: Channel, enabled: boolean) => {
    updateChannelConfig(channel, {
      frequency: { ...state[`${channel}Channel`].frequency, enabled }
    });
  };

  const handleFrequencyChange = (
    channel: Channel,
    params: { frequency?: number; wet?: number }
  ) => {
    updateChannelConfig(channel, {
      frequency: {
        ...state[`${channel}Channel`].frequency,
        ...params
      }
    });
  };

  const handleNoiseToggle = (channel: Channel, enabled: boolean) => {
    updateChannelConfig(channel, {
      noise: { ...state[`${channel}Channel`].noise, enabled }
    });
  };

  const handleNoiseChange = (
    channel: Channel,
    params: { type?: "brown" | "pink" | "white"; wet?: number }
  ) => {
    updateChannelConfig(channel, {
      noise: {
        ...state[`${channel}Channel`].noise,
        ...params
      }
    });
  };

  return {
    onVolumeChange: handleVolumeChange,
    onPanChange: handlePanChange,
    onReverbToggle: handleReverbToggle,
    onReverbChange: handleReverbChange,
    onDelayToggle: handleDelayToggle,
    onDelayChange: handleDelayChange,
    onFrequencyToggle: handleFrequencyToggle,
    onFrequencyChange: handleFrequencyChange,
    onNoiseToggle: handleNoiseToggle,
    onNoiseChange: handleNoiseChange,
  };
};

// Preset selection component
const PresetSelector = ({ 
  selectedPreset, 
  onPresetSelect,
  actualTier,
  customPresets,
  onOpenPresetManager
}: { 
  selectedPreset: AudioPreset | CustomPreset | null;
  onPresetSelect: (presetName: string) => void;
  actualTier: SubscriptionTier;
  customPresets: CustomPreset[];
  onOpenPresetManager: () => void;
}) => {
  const { getActiveTier } = useTierEmulation();
  const activeTier = getActiveTier();
  const allPresets = getAllAvailablePresets(activeTier, customPresets);
  const presetSelectId = "presetSelect";
  const canCreateCustom = canCreateCustomPresets(activeTier);
  
  return (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-2">
        <label
          htmlFor={presetSelectId}
          className="block text-sm font-medium text-gray-900 dark:text-white"
        >
          Audio Presets:
        </label>
        {canCreateCustom && (
          <button
            onClick={onOpenPresetManager}
            className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
          >
            Manage Custom Presets
          </button>
        )}
      </div>
      <select
        id={presetSelectId}
        aria-label="Audio Preset"
        value={selectedPreset?.name || ""}
        onChange={(e) => onPresetSelect(e.target.value)}
        className="border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white p-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-colors"
      >
        <option value="">— Select a preset —</option>
        {allPresets.map((preset) => (
          <option key={preset.name} value={preset.name}>
            {isCustomPreset(preset) ? '⭐ ' : ''}{preset.name} - {preset.description}
          </option>
        ))}
      </select>
    </div>
  );
};

// Loop control component
const LoopControl = ({ 
  isLooping, 
  onToggle 
}: { 
  isLooping: boolean;
  onToggle: () => void;
}) => (
  <div className="mb-4 flex items-center justify-center">
    <button
      onClick={onToggle}
      aria-pressed={isLooping}
      className={`px-6 py-2 rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors flex items-center gap-2 ${
        isLooping
          ? "bg-blue-600 dark:bg-blue-700 hover:bg-blue-700 dark:hover:bg-blue-800 text-white focus:ring-blue-500"
          : "bg-gray-600 dark:bg-gray-700 hover:bg-gray-700 dark:hover:bg-gray-800 text-white focus:ring-gray-500"
      }`}
    >
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
        <path
          fillRule="evenodd"
          d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
          clipRule="evenodd"
        />
      </svg>
      {isLooping ? "Loop Enabled" : "Loop Disabled"}
    </button>
  </div>
);

// Playback controls component
const PlaybackControls = ({ 
  isPlaying, 
  isLoading, 
  bufferLoaded, 
  onPlay, 
  onStop 
}: {
  isPlaying: boolean;
  isLoading: boolean;
  bufferLoaded: boolean;
  onPlay: () => void;
  onStop: () => void;
}) => (
  <div className="flex items-center justify-center gap-4 mb-4">
    <button
      onClick={onPlay}
      disabled={isPlaying || isLoading || !bufferLoaded}
      className="px-6 py-2 bg-green-600 dark:bg-green-700 text-white rounded-lg hover:bg-green-700 dark:hover:bg-green-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors"
    >
      {isLoading ? (
        <Spinner label="Loading..." />
      ) : !bufferLoaded ? (
        <Spinner label="Buffer Loading..." />
      ) : isPlaying ? (
        "Playing..."
      ) : (
        <>
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
              clipRule="evenodd"
            />
          </svg>
          Play Audio
        </>
      )}
    </button>

    <button
      onClick={onStop}
      disabled={!isPlaying}
      className="px-6 py-2 bg-red-600 dark:bg-red-700 text-white rounded-lg hover:bg-red-700 dark:hover:bg-red-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
    >
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
        <path
          fillRule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1zm4 0a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 8 0 00-1-1z"
          clipRule="evenodd"
        />
      </svg>
      Stop
    </button>
  </div>
);

// Master volume component
const MasterVolumeControl = ({ 
  volume, 
  onVolumeChange 
}: { 
  volume: number;
  onVolumeChange: (volume: number) => void;
}) => {
  const volumeSliderId = "masterVolume";
  
  return (
    <div className="mb-6">
      <label
        htmlFor={volumeSliderId}
        className="block text-sm font-medium mb-2 text-gray-900 dark:text-white"
      >
        Master Volume: {volume}%
      </label>
      <input
        id={volumeSliderId}
        aria-label="Master Volume"
        type="range"
        min="0"
        max="200"
        value={volume}
        step="5"
        onChange={(e) => onVolumeChange(Number(e.target.value))}
        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
        style={{
          background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${(volume / 200) * 100}%, #e5e7eb ${(volume / 200) * 100}%, #e5e7eb 100%)`
        }}
      />
    </div>
  );
};

export const AudioPlayer = ({ audioUrl, className = "", actualTier }: AudioPlayerProps) => {
  const {
    state,
    updateChannelConfig,
    updateMasterVolume,
    applyPreset,
    setAudioSource,
    handlePlay,
    handleStop,
    toggleLoop,
    testOscillators,
    debugState,
    isLoading,
  } = useAudioProcessing();

  const { getActiveTier } = useTierEmulation();
  const activeTier = getActiveTier();
  const isLocked = activeTier !== 'PREMIUM';

  const [selectedPreset, setSelectedPreset] = useState<AudioPreset | CustomPreset | null>(null);
  const [showPresetManager, setShowPresetManager] = useState(false);
  
  // Custom preset management
  const { customPresets } = useCustomPresets();

  // Custom hook for channel handlers
  const channelHandlers = useChannelHandlers(updateChannelConfig, state);

  // Set audio source when audioUrl changes
  useEffect(() => {
    if (!audioUrl) return;
    setAudioSource(audioUrl);
  }, [audioUrl, setAudioSource]);

  const handlePresetSelect = (presetName: string) => {
    const allPresets = getAllAvailablePresets(activeTier, customPresets);
    const preset = allPresets.find(p => p.name === presetName);
    if (!preset) return;
    setSelectedPreset(preset);
    applyPreset(preset.config);
  };

  const handleCustomPresetSelect = (preset: CustomPreset) => {
    setSelectedPreset(preset);
    applyPreset(preset.config);
    setShowPresetManager(false);
  };

  const handlePresetManagerClose = () => {
    setShowPresetManager(false);
  };

  if (!audioUrl) {
    return null;
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Audio Controls */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-800">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
          Audio Playback & Channel Control
        </h3>

        {/* Audio Presets */}
        <PresetSelector 
          selectedPreset={selectedPreset}
          onPresetSelect={handlePresetSelect}
          actualTier={actualTier}
          customPresets={customPresets}
          onOpenPresetManager={() => setShowPresetManager(true)}
        />

        {/* Loop Control */}
        <LoopControl 
          isLooping={state.loop}
          onToggle={toggleLoop}
        />

        {/* Playback Controls */}
        <PlaybackControls
          isPlaying={state.isPlaying}
          isLoading={isLoading}
          bufferLoaded={state.bufferLoaded}
          onPlay={handlePlay}
          onStop={handleStop}
        />

        {/* Playback Progress */}
        {state.bufferLoaded && (
          <div className="mb-6">
            <h4 className="text-sm font-medium mb-3 text-gray-900 dark:text-white">
              Playback Progress
            </h4>
            <PlaybackProgress progress={state.playbackProgress} isLooping={state.loop} />
          </div>
        )}

        {/* Master Volume */}
        <MasterVolumeControl 
          volume={state.masterVolume}
          onVolumeChange={updateMasterVolume}
        />

        {/* Test Buttons - Only visible in development */}
        {process.env.NODE_ENV !== 'production' && (
          <div className="mb-6 flex items-center justify-center gap-4">
            <button
              onClick={testOscillators}
              className="px-4 py-2 bg-purple-600 dark:bg-purple-700 text-white rounded-lg hover:bg-purple-700 dark:hover:bg-purple-800 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-colors"
            >
              Test Oscillators (3s)
            </button>
            <button
              onClick={debugState}
              className="px-4 py-2 bg-orange-600 dark:bg-orange-700 text-white rounded-lg hover:bg-orange-700 dark:hover:bg-orange-800 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-colors"
            >
              Debug State
            </button>
          </div>
        )}

        {/* Channel Controls */}
        <AudioControls
          leftChannel={state.leftChannel}
          rightChannel={state.rightChannel}
          onLeftVolumeChange={(volume) => channelHandlers.onVolumeChange("left", volume)}
          onRightVolumeChange={(volume) => channelHandlers.onVolumeChange("right", volume)}
          onLeftPanChange={(pan) => channelHandlers.onPanChange("left", pan)}
          onRightPanChange={(pan) => channelHandlers.onPanChange("right", pan)}
          onLeftReverbToggle={(enabled) => channelHandlers.onReverbToggle("left", enabled)}
          onRightReverbToggle={(enabled) => channelHandlers.onReverbToggle("right", enabled)}
          onLeftReverbChange={(params) => channelHandlers.onReverbChange("left", params)}
          onRightReverbChange={(params) => channelHandlers.onReverbChange("right", params)}
          onLeftDelayToggle={(enabled) => channelHandlers.onDelayToggle("left", enabled)}
          onRightDelayToggle={(enabled) => channelHandlers.onDelayToggle("right", enabled)}
          onLeftDelayChange={(params) => channelHandlers.onDelayChange("left", params)}
          onRightDelayChange={(params) => channelHandlers.onDelayChange("right", params)}
          onLeftFrequencyToggle={(enabled) => channelHandlers.onFrequencyToggle("left", enabled)}
          onRightFrequencyToggle={(enabled) => channelHandlers.onFrequencyToggle("right", enabled)}
          onLeftFrequencyChange={(params) => channelHandlers.onFrequencyChange("left", params)}
          onRightFrequencyChange={(params) => channelHandlers.onFrequencyChange("right", params)}
          onLeftNoiseToggle={(enabled) => channelHandlers.onNoiseToggle("left", enabled)}
          onRightNoiseToggle={(enabled) => channelHandlers.onNoiseToggle("right", enabled)}
          onLeftNoiseChange={(params) => channelHandlers.onNoiseChange("left", params)}
          onRightNoiseChange={(params) => channelHandlers.onNoiseChange("right", params)}
          isLocked={isLocked}
          presetLeftChannel={selectedPreset?.config.leftChannel}
          presetRightChannel={selectedPreset?.config.rightChannel}
        />
      </div>
      
      {/* Preset Manager Modal */}
      <PresetManager
        isOpen={showPresetManager}
        onClose={handlePresetManagerClose}
        currentConfig={{
          leftChannel: state.leftChannel,
          rightChannel: state.rightChannel,
          masterVolume: state.masterVolume,
        }}
        onPresetSelect={handleCustomPresetSelect}
      />
    </div>
  );
};
