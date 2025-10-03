"use client";

import { ChannelConfig } from "../hooks/useAudioProcessing";

interface AudioControlsProps {
  leftChannel: ChannelConfig;
  rightChannel: ChannelConfig;
  onLeftVolumeChange: (volume: number) => void;
  onRightVolumeChange: (volume: number) => void;
  onLeftPanChange: (pan: number) => void;
  onRightPanChange: (pan: number) => void;
  onLeftReverbToggle: (enabled: boolean) => void;
  onRightReverbToggle: (enabled: boolean) => void;
  onLeftReverbChange: (params: { roomSize?: number; wet?: number }) => void;
  onRightReverbChange: (params: { roomSize?: number; wet?: number }) => void;
  onLeftDelayToggle: (enabled: boolean) => void;
  onRightDelayToggle: (enabled: boolean) => void;
  onLeftDelayChange: (params: { delayTime?: string; feedback?: number; wet?: number }) => void;
  onRightDelayChange: (params: { delayTime?: string; feedback?: number; wet?: number }) => void;
}

const ChannelPanel = ({
  channel,
  config,
  onVolumeChange,
  onPanChange,
  onReverbToggle,
  onReverbChange,
  onDelayToggle,
  onDelayChange,
}: {
  channel: string;
  config: ChannelConfig;
  onVolumeChange: (volume: number) => void;
  onPanChange: (pan: number) => void;
  onReverbToggle: (enabled: boolean) => void;
  onReverbChange: (params: { roomSize?: number; wet?: number }) => void;
  onDelayToggle: (enabled: boolean) => void;
  onDelayChange: (params: { delayTime?: string; feedback?: number; wet?: number }) => void;
}) => {
  return (
    <div className="flex-1 space-y-4">
      <h4 className="text-md font-semibold text-gray-900 dark:text-white">{channel} Channel</h4>
      
      {/* Volume Control */}
      <div>
        <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">
          Volume: {config.volume}%
        </label>
        <input
          type="range"
          min="0"
          max="200"
          value={config.volume}
          onChange={(e) => onVolumeChange(Number(e.target.value))}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
          style={{
            background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${(config.volume / 200) * 100}%, #e5e7eb ${(config.volume / 200) * 100}%, #e5e7eb 100%)`
          }}
        />
      </div>

      {/* Pan Control */}
      <div>
        <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">
          Pan: {config.pan === 0 ? "Center" : config.pan > 0 ? `Right ${config.pan}` : `Left ${Math.abs(config.pan)}`}
        </label>
        <input
          type="range"
          min="-1"
          max="1"
          step="0.1"
          value={config.pan}
          onChange={(e) => onPanChange(Number(e.target.value))}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
          style={{
            background: `linear-gradient(to right, #ef4444 0%, #ef4444 ${((config.pan + 1) / 2) * 100}%, #3b82f6 ${((config.pan + 1) / 2) * 100}%, #3b82f6 100%)`
          }}
        />
      </div>

      {/* Reverb Control */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 bg-gray-50 dark:bg-gray-900">
        <div className="flex items-center justify-between mb-3">
          <label className="text-sm font-medium text-gray-900 dark:text-white">Reverb</label>
          <input
            type="checkbox"
            checked={config.reverb.enabled}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => onReverbToggle(e.target.checked)}
            className="rounded"
          />
        </div>
        
        {config.reverb.enabled && (
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-gray-700 dark:text-gray-300 mb-1">
                Room Size: {config.reverb.roomSize}s
              </label>
              <input
                type="range"
                min="0.1"
                max="10"
                step="0.1"
                value={config.reverb.roomSize}
                onChange={(e) => onReverbChange({ roomSize: Number(e.target.value) })}
                className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>
            
            <div>
              <label className="block text-xs text-gray-700 dark:text-gray-300 mb-1">
                Wet Mix: {Math.round(config.reverb.wet * 100)}%
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={config.reverb.wet}
                onChange={(e) => onReverbChange({ wet: Number(e.target.value) })}
                className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          </div>
        )}
      </div>

      {/* Delay Control */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 bg-gray-50 dark:bg-gray-900">
        <div className="flex items-center justify-between mb-3">
          <label className="text-sm font-medium text-gray-900 dark:text-white">Delay</label>
          <input
            type="checkbox"
            checked={config.delay.enabled}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => onDelayToggle(e.target.checked)}
            className="rounded"
          />
        </div>
        
        {config.delay.enabled && (
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-gray-700 dark:text-gray-300 mb-1">
                Delay Time
              </label>
              <select
                value={config.delay.delayTime}
                onChange={(e) => onDelayChange({ delayTime: e.target.value })}
                className="w-full text-xs border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded p-1 focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <option value="8n">8th Note</option>
                <option value="4n">Quarter Note</option>
                <option value="4n.">Dotted Quarter</option>
                <option value="2n">Half Note</option>
                <option value="1n">Whole Note</option>
              </select>
            </div>
            
            <div>
              <label className="block text-xs text-gray-700 dark:text-gray-300 mb-1">
                Feedback: {Math.round(config.delay.feedback * 100)}%
              </label>
              <input
                type="range"
                min="0"
                max="0.9"
                step="0.05"
                value={config.delay.feedback}
                onChange={(e) => onDelayChange({ feedback: Number(e.target.value) })}
                className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>
            
            <div>
              <label className="block text-xs text-gray-700 dark:text-gray-300 mb-1">
                Wet Mix: {Math.round(config.delay.wet * 100)}%
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={config.delay.wet}
                onChange={(e) => onDelayChange({ wet: Number(e.target.value) })}
                className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default function AudioControls({
  leftChannel,
  rightChannel,
  onLeftVolumeChange,
  onRightVolumeChange,
  onLeftPanChange,
  onRightPanChange,
  onLeftReverbToggle,
  onRightReverbToggle,
  onLeftReverbChange,
  onRightReverbChange,
  onLeftDelayToggle,
  onRightDelayToggle,
  onLeftDelayChange,
  onRightDelayChange,
}: AudioControlsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <ChannelPanel
        channel="Left"
        config={leftChannel}
        onVolumeChange={onLeftVolumeChange}
        onPanChange={onLeftPanChange}
        onReverbToggle={onLeftReverbToggle}
        onReverbChange={onLeftReverbChange}
        onDelayToggle={onLeftDelayToggle}
        onDelayChange={onLeftDelayChange}
      />
      
      <ChannelPanel
        channel="Right"
        config={rightChannel}
        onVolumeChange={onRightVolumeChange}
        onPanChange={onRightPanChange}
        onReverbToggle={onRightReverbToggle}
        onReverbChange={onRightReverbChange}
        onDelayToggle={onRightDelayToggle}
        onDelayChange={onRightDelayChange}
      />
    </div>
  );
}
