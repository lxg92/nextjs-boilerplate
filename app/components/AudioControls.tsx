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
  onLeftFrequencyToggle: (enabled: boolean) => void;
  onRightFrequencyToggle: (enabled: boolean) => void;
  onLeftFrequencyChange: (params: { frequency?: number; wet?: number }) => void;
  onRightFrequencyChange: (params: { frequency?: number; wet?: number }) => void;
  onLeftNoiseToggle: (enabled: boolean) => void;
  onRightNoiseToggle: (enabled: boolean) => void;
  onLeftNoiseChange: (params: { type?: "brown" | "pink" | "white"; wet?: number }) => void;
  onRightNoiseChange: (params: { type?: "brown" | "pink" | "white"; wet?: number }) => void;
  isLocked?: boolean;
  presetLeftChannel?: ChannelConfig;
  presetRightChannel?: ChannelConfig;
}

const ChannelPanel = ({
  channel,
  config,
  presetConfig,
  otherChannelConfig,
  onVolumeChange,
  onPanChange,
  onReverbToggle,
  onReverbChange,
  onDelayToggle,
  onDelayChange,
  onFrequencyToggle,
  onFrequencyChange,
  onNoiseToggle,
  onNoiseChange,
  isLocked = false,
}: {
  channel: string;
  config: ChannelConfig;
  presetConfig?: ChannelConfig;
  otherChannelConfig?: ChannelConfig;
  onVolumeChange: (volume: number) => void;
  onPanChange: (pan: number) => void;
  onReverbToggle: (enabled: boolean) => void;
  onReverbChange: (params: { roomSize?: number; wet?: number }) => void;
  onDelayToggle: (enabled: boolean) => void;
  onDelayChange: (params: { delayTime?: string; feedback?: number; wet?: number }) => void;
  onFrequencyToggle: (enabled: boolean) => void;
  onFrequencyChange: (params: { frequency?: number; wet?: number }) => void;
  onNoiseToggle: (enabled: boolean) => void;
  onNoiseChange: (params: { type?: "brown" | "pink" | "white"; wet?: number }) => void;
  isLocked?: boolean;
}) => {
  // Use preset values when locked, otherwise use current config
  const displayConfig = isLocked && presetConfig ? presetConfig : config;
  
  // Calculate cross-channel frequency display
  const getFrequencyDisplay = () => {
    if (!otherChannelConfig || !displayConfig.frequency.enabled || !otherChannelConfig.frequency.enabled) {
      return `Frequency: ${displayConfig.frequency.frequency}Hz`;
    }
    
    const currentFreq = displayConfig.frequency.frequency;
    const otherFreq = otherChannelConfig.frequency.frequency;
    const difference = Math.abs(currentFreq - otherFreq);
    const isHigher = currentFreq > otherFreq;
    
    // Format frequencies to show decimals when needed
    const formatFreq = (freq: number) => {
      return freq % 1 === 0 ? freq.toString() : freq.toFixed(1);
    };
    
    // Format difference to show decimals when needed
    const formatDiff = (diff: number) => {
      return diff % 1 === 0 ? diff.toString() : diff.toFixed(1);
    };
    
    return `Frequency: ${formatFreq(currentFreq)}Hz vs ${formatFreq(otherFreq)}Hz (${formatDiff(difference)}Hz${isHigher ? '+' : '-'})`;
  };
  
  return (
    <div className={`flex-1 space-y-4 relative ${isLocked ? 'opacity-60' : ''}`}>
      <div className="flex items-center justify-between">
        <h4 className="text-md font-semibold text-gray-900 dark:text-white">{channel} Channel</h4>
        {isLocked && (
          <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
            <span className="mr-1">🔒</span>
            <span>Locked</span>
          </div>
        )}
      </div>
      
      {/* Volume Control */}
      <div>
        <label className={`block text-sm font-medium mb-2 ${isLocked ? 'text-gray-500 dark:text-gray-400' : 'text-gray-900 dark:text-white'}`}>
          Volume: {displayConfig.volume}%
        </label>
         <input
           type="range"
           min="0"
           max="200"
           value={displayConfig.volume}
           onChange={(e) => onVolumeChange(Number(e.target.value))}
           disabled={isLocked}
           className={`w-full h-2 rounded-lg appearance-none slider volume-slider ${
             isLocked 
               ? 'bg-gray-300 dark:bg-gray-600 cursor-not-allowed opacity-60' 
               : 'bg-gray-200 cursor-pointer'
           }`}
            style={isLocked ? {} : {
              background: `linear-gradient(to right, #f59e0b 0%, #f59e0b ${(displayConfig.volume / 200) * 100}%, #e5e7eb ${(displayConfig.volume / 200) * 100}%, #e5e7eb 100%)`,
              WebkitAppearance: 'none',
              appearance: 'none',
              backgroundImage: `linear-gradient(to right, #f59e0b 0%, #f59e0b ${(displayConfig.volume / 200) * 100}%, #e5e7eb ${(displayConfig.volume / 200) * 100}%, #e5e7eb 100%)`
            }}
         />
      </div>

       {/* Pan Control */}
       <div>
         <label className={`block text-sm font-medium mb-2 ${isLocked ? 'text-gray-500 dark:text-gray-400' : 'text-gray-900 dark:text-white'}`}>
           Pan: {displayConfig.pan === 0 ? "Center" : displayConfig.pan > 0 ? `Right ${displayConfig.pan}` : `Left ${Math.abs(displayConfig.pan)}`}
         </label>
         <input
           type="range"
           min="-1"
           max="1"
           step="0.1"
           value={displayConfig.pan}
           onChange={(e) => onPanChange(Number(e.target.value))}
           disabled={isLocked}
           className={`w-full h-2 rounded-lg appearance-none slider ${
             channel === "Left" ? "left-pan-slider" : "right-pan-slider"
           } ${
             isLocked 
               ? 'bg-gray-300 dark:bg-gray-600 cursor-not-allowed opacity-60' 
               : 'bg-gray-200 cursor-pointer'
           }`}
           style={isLocked ? {} : {
             background: `linear-gradient(to right, #ef4444 0%, #ef4444 ${((displayConfig.pan + 1) / 2) * 100}%, #84cc16 ${((displayConfig.pan + 1) / 2) * 100}%, #84cc16 100%)`
           }}
         />
       </div>

      {/* Reverb Control */}
      <div className={`border rounded-lg p-3 ${
        isLocked 
          ? 'border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800' 
          : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900'
      }`}>
        <div className="flex items-center justify-between mb-3">
          <label className={`text-sm font-medium ${isLocked ? 'text-gray-500 dark:text-gray-400' : 'text-gray-900 dark:text-white'}`}>Reverb</label>
          <input
            type="checkbox"
            checked={displayConfig.reverb.enabled}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => onReverbToggle(e.target.checked)}
            disabled={isLocked}
            className={`rounded ${isLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
          />
        </div>
        
        {displayConfig.reverb.enabled && (
          <div className="space-y-3">
            <div>
              <label className={`block text-xs mb-1 ${isLocked ? 'text-gray-500 dark:text-gray-400' : 'text-gray-700 dark:text-gray-300'}`}>
                Room Size: {displayConfig.reverb.roomSize}s
              </label>
              <input
                type="range"
                min="0.1"
                max="10"
                step="0.1"
                value={displayConfig.reverb.roomSize}
                onChange={(e) => onReverbChange({ roomSize: Number(e.target.value) })}
                disabled={isLocked}
                className={`w-full h-1 rounded-lg appearance-none ${
                  isLocked 
                    ? 'bg-gray-300 dark:bg-gray-600 cursor-not-allowed opacity-60' 
                    : 'bg-gray-200 cursor-pointer'
                }`}
              />
            </div>
            
            <div>
              <label className={`block text-xs mb-1 ${isLocked ? 'text-gray-500 dark:text-gray-400' : 'text-gray-700 dark:text-gray-300'}`}>
                Wet Mix: {Math.round(displayConfig.reverb.wet * 100)}%
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={displayConfig.reverb.wet}
                onChange={(e) => onReverbChange({ wet: Number(e.target.value) })}
                disabled={isLocked}
                className={`w-full h-1 rounded-lg appearance-none ${
                  isLocked 
                    ? 'bg-gray-300 dark:bg-gray-600 cursor-not-allowed opacity-60' 
                    : 'bg-gray-200 cursor-pointer'
                }`}
              />
            </div>
          </div>
        )}
      </div>

      {/* Delay Control */}
      <div className={`border rounded-lg p-3 ${
        isLocked 
          ? 'border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800' 
          : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900'
      }`}>
        <div className="flex items-center justify-between mb-3">
          <label className={`text-sm font-medium ${isLocked ? 'text-gray-500 dark:text-gray-400' : 'text-gray-900 dark:text-white'}`}>Delay</label>
          <input
            type="checkbox"
            checked={displayConfig.delay.enabled}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => onDelayToggle(e.target.checked)}
            disabled={isLocked}
            className={`rounded ${isLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
          />
        </div>
        
        {displayConfig.delay.enabled && (
          <div className="space-y-3">
            <div>
              <label className={`block text-xs mb-1 ${isLocked ? 'text-gray-500 dark:text-gray-400' : 'text-gray-700 dark:text-gray-300'}`}>
                Delay Time
              </label>
              <select
                value={displayConfig.delay.delayTime}
                onChange={(e) => onDelayChange({ delayTime: e.target.value })}
                disabled={isLocked}
                className={`w-full text-xs border rounded p-1 focus:outline-none ${
                  isLocked 
                    ? 'border-gray-300 dark:border-gray-600 bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed opacity-60' 
                    : 'border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-600'
                }`}
              >
                <option value="8n">8th Note</option>
                <option value="4n">Quarter Note</option>
                <option value="4n.">Dotted Quarter</option>
                <option value="2n">Half Note</option>
                <option value="1n">Whole Note</option>
              </select>
            </div>
            
            <div>
              <label className={`block text-xs mb-1 ${isLocked ? 'text-gray-500 dark:text-gray-400' : 'text-gray-700 dark:text-gray-300'}`}>
                Feedback: {Math.round(displayConfig.delay.feedback * 100)}%
              </label>
              <input
                type="range"
                min="0"
                max="0.9"
                step="0.05"
                value={displayConfig.delay.feedback}
                onChange={(e) => onDelayChange({ feedback: Number(e.target.value) })}
                disabled={isLocked}
                className={`w-full h-1 rounded-lg appearance-none ${
                  isLocked 
                    ? 'bg-gray-300 dark:bg-gray-600 cursor-not-allowed opacity-60' 
                    : 'bg-gray-200 cursor-pointer'
                }`}
              />
            </div>
            
            <div>
              <label className={`block text-xs mb-1 ${isLocked ? 'text-gray-500 dark:text-gray-400' : 'text-gray-700 dark:text-gray-300'}`}>
                Wet Mix: {Math.round(displayConfig.delay.wet * 100)}%
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={displayConfig.delay.wet}
                onChange={(e) => onDelayChange({ wet: Number(e.target.value) })}
                disabled={isLocked}
                className={`w-full h-1 rounded-lg appearance-none ${
                  isLocked 
                    ? 'bg-gray-300 dark:bg-gray-600 cursor-not-allowed opacity-60' 
                    : 'bg-gray-200 cursor-pointer'
                }`}
              />
            </div>
          </div>
        )}
      </div>

      {/* Frequency Control */}
      <div className={`border rounded-lg p-3 ${
        isLocked 
          ? 'border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800' 
          : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900'
      }`}>
        <div className="flex items-center justify-between mb-3">
          <label className={`text-sm font-medium ${isLocked ? 'text-gray-500 dark:text-gray-400' : 'text-gray-900 dark:text-white'}`}>Frequency (Binaural Beat)</label>
          <input
            type="checkbox"
            checked={displayConfig.frequency.enabled}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => onFrequencyToggle(e.target.checked)}
            disabled={isLocked}
            className={`rounded ${isLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
          />
        </div>
        
        {displayConfig.frequency.enabled && (
          <div className="space-y-3">
            <div>
              <label className={`block text-xs mb-1 ${isLocked ? 'text-gray-500 dark:text-gray-400' : 'text-gray-700 dark:text-gray-300'}`}>
                {getFrequencyDisplay()}
              </label>
               <input
                 type="range"
                 min="20"
                 max="500"
                 step="1"
                 value={displayConfig.frequency.frequency}
                 onChange={(e) => onFrequencyChange({ frequency: Number(e.target.value) })}
                 disabled={isLocked}
                 className={`w-full h-1 rounded-lg appearance-none ${
                   isLocked 
                     ? 'bg-gray-300 dark:bg-gray-600 cursor-not-allowed opacity-60' 
                     : 'bg-gray-200 cursor-pointer'
                 }`}
               />
              
              {/* Fine tuning controls */}
              <div className="flex items-center justify-center mt-2 space-x-1">
                 {/* -1Hz button */}
                 <button
                   onClick={() => onFrequencyChange({ frequency: Math.max(20, displayConfig.frequency.frequency - 1) })}
                   disabled={isLocked || displayConfig.frequency.frequency <= 20}
                   className={`px-2 py-1 text-xs rounded hover:bg-gray-300 dark:hover:bg-gray-600 ${
                     isLocked 
                       ? 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed opacity-60' 
                       : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                   }`}
                 >
                   -1
                 </button>
                 
                 {/* -0.1Hz button */}
                 <button
                   onClick={() => onFrequencyChange({ frequency: Math.max(20, Math.round((displayConfig.frequency.frequency - 0.1) * 10) / 10) })}
                   disabled={isLocked || displayConfig.frequency.frequency <= 20}
                   className={`px-2 py-1 text-xs rounded hover:bg-blue-300 dark:hover:bg-blue-600 ${
                     isLocked 
                       ? 'bg-blue-200 dark:bg-blue-700 text-blue-500 dark:text-blue-400 cursor-not-allowed opacity-60' 
                       : 'bg-blue-200 dark:bg-blue-700 text-blue-700 dark:text-blue-300'
                   }`}
                 >
                   -0.1
                 </button>
                
                {/* +0.1Hz button */}
                <button
                  onClick={() => onFrequencyChange({ frequency: Math.min(500, Math.round((displayConfig.frequency.frequency + 0.1) * 10) / 10) })}
                  disabled={isLocked || displayConfig.frequency.frequency >= 500}
                  className={`px-2 py-1 text-xs rounded hover:bg-blue-300 dark:hover:bg-blue-600 ${
                    isLocked 
                      ? 'bg-blue-200 dark:bg-blue-700 text-blue-500 dark:text-blue-400 cursor-not-allowed opacity-60' 
                      : 'bg-blue-200 dark:bg-blue-700 text-blue-700 dark:text-blue-300'
                  }`}
                >
                  +0.1
                </button>
                
                {/* +1Hz button */}
                <button
                  onClick={() => onFrequencyChange({ frequency: Math.min(500, displayConfig.frequency.frequency + 1) })}
                  disabled={isLocked || displayConfig.frequency.frequency >= 500}
                  className={`px-2 py-1 text-xs rounded hover:bg-gray-300 dark:hover:bg-gray-600 ${
                    isLocked 
                      ? 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed opacity-60' 
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  +1
                </button>
              </div>
            </div>
            
            <div>
              <label className={`block text-xs mb-1 ${isLocked ? 'text-gray-500 dark:text-gray-400' : 'text-gray-700 dark:text-gray-300'}`}>
                Wet Mix: {Math.round(displayConfig.frequency.wet * 100)}%
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={displayConfig.frequency.wet}
                onChange={(e) => onFrequencyChange({ wet: Number(e.target.value) })}
                disabled={isLocked}
                className={`w-full h-1 rounded-lg appearance-none ${
                  isLocked 
                    ? 'bg-gray-300 dark:bg-gray-600 cursor-not-allowed opacity-60' 
                    : 'bg-gray-200 cursor-pointer'
                }`}
              />
            </div>
          </div>
        )}
      </div>

      {/* Noise Control */}
      <div className={`border rounded-lg p-3 ${
        isLocked 
          ? 'border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800' 
          : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900'
      }`}>
        <div className="flex items-center justify-between mb-3">
          <label className={`text-sm font-medium ${isLocked ? 'text-gray-500 dark:text-gray-400' : 'text-gray-900 dark:text-white'}`}>Noise Generator</label>
          <input
            type="checkbox"
            checked={displayConfig.noise.enabled}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => onNoiseToggle(e.target.checked)}
            disabled={isLocked}
            className={`rounded ${isLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
          />
        </div>
        
        {displayConfig.noise.enabled && (
          <div className="space-y-3">
            <div>
              <label className={`block text-xs mb-1 ${isLocked ? 'text-gray-500 dark:text-gray-400' : 'text-gray-700 dark:text-gray-300'}`}>
                Noise Type
              </label>
              <select
                value={displayConfig.noise.type}
                onChange={(e) => onNoiseChange({ type: e.target.value as "brown" | "pink" | "white" })}
                disabled={isLocked}
                className={`w-full text-xs border rounded p-1 focus:outline-none ${
                  isLocked 
                    ? 'border-gray-300 dark:border-gray-600 bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed opacity-60' 
                    : 'border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-600'
                }`}
              >
                <option value="white">White Noise</option>
                <option value="pink">Pink Noise</option>
                <option value="brown">Brown Noise</option>
              </select>
            </div>
            
            <div>
              <label className={`block text-xs mb-1 ${isLocked ? 'text-gray-500 dark:text-gray-400' : 'text-gray-700 dark:text-gray-300'}`}>
                Wet Mix: {Math.round(displayConfig.noise.wet * 100)}%
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={displayConfig.noise.wet}
                onChange={(e) => onNoiseChange({ wet: Number(e.target.value) })}
                disabled={isLocked}
                className={`w-full h-1 rounded-lg appearance-none ${
                  isLocked 
                    ? 'bg-gray-300 dark:bg-gray-600 cursor-not-allowed opacity-60' 
                    : 'bg-gray-200 cursor-pointer'
                }`}
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
  onLeftFrequencyToggle,
  onRightFrequencyToggle,
  onLeftFrequencyChange,
  onRightFrequencyChange,
  onLeftNoiseToggle,
  onRightNoiseToggle,
  onLeftNoiseChange,
  onRightNoiseChange,
  isLocked = false,
  presetLeftChannel,
  presetRightChannel,
}: AudioControlsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
       <ChannelPanel
         channel="Left"
         config={leftChannel}
         presetConfig={presetLeftChannel}
         otherChannelConfig={rightChannel}
         onVolumeChange={onLeftVolumeChange}
         onPanChange={onLeftPanChange}
         onReverbToggle={onLeftReverbToggle}
         onReverbChange={onLeftReverbChange}
         onDelayToggle={onLeftDelayToggle}
         onDelayChange={onLeftDelayChange}
         onFrequencyToggle={onLeftFrequencyToggle}
         onFrequencyChange={onLeftFrequencyChange}
         onNoiseToggle={onLeftNoiseToggle}
         onNoiseChange={onLeftNoiseChange}
         isLocked={isLocked}
       />
       
       <ChannelPanel
         channel="Right"
         config={rightChannel}
         presetConfig={presetRightChannel}
         otherChannelConfig={leftChannel}
         onVolumeChange={onRightVolumeChange}
         onPanChange={onRightPanChange}
         onReverbToggle={onRightReverbToggle}
         onReverbChange={onRightReverbChange}
         onDelayToggle={onRightDelayToggle}
         onDelayChange={onRightDelayChange}
         onFrequencyToggle={onRightFrequencyToggle}
         onFrequencyChange={onRightFrequencyChange}
         onNoiseToggle={onRightNoiseToggle}
         onNoiseChange={onRightNoiseChange}
         isLocked={isLocked}
       />
    </div>
  );
}
