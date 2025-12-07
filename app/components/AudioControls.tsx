"use client";

import { useState, useEffect, useRef } from "react";
import { ChannelConfig } from "../types";

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
  onLeftIsochronicToggle: (enabled: boolean) => void;
  onRightIsochronicToggle: (enabled: boolean) => void;
  onLeftIsochronicChange: (params: { carrierFrequency?: number; pulseRate?: number; wet?: number }) => void;
  onRightIsochronicChange: (params: { carrierFrequency?: number; pulseRate?: number; wet?: number }) => void;
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
  onIsochronicToggle,
  onIsochronicChange,
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
  onIsochronicToggle: (enabled: boolean) => void;
  onIsochronicChange: (params: { carrierFrequency?: number; pulseRate?: number; wet?: number }) => void;
  onNoiseToggle: (enabled: boolean) => void;
  onNoiseChange: (params: { type?: "brown" | "pink" | "white"; wet?: number }) => void;
  isLocked?: boolean;
}) => {
  // Use preset values when locked, otherwise use current config
  const displayConfig = isLocked && presetConfig ? presetConfig : config;
  
  // Brainwave frequency range mapping
  const getBrainwaveRange = (difference: number) => {
    if (difference >= 0.5 && difference <= 3.9) {
      return { name: 'Delta', color: '#fc4242' };
    } else if (difference >= 4 && difference <= 7.9) {
      return { name: 'Theta', color: '#fca542' };
    } else if (difference >= 8 && difference <= 11.9) {
      return { name: 'Alpha', color: '#a3fa52' };
    } else if (difference >= 12 && difference <= 14.9) {
      return { name: 'Low Beta', color: '#52e6fa' };
    } else if (difference >= 15 && difference <= 17.9) {
      return { name: 'Mid Beta', color: '#5293fa' };
    } else if (difference >= 18 && difference <= 29.9) {
      return { name: 'High Beta', color: '#3c3ffa' };
    } else if (difference >= 30 && difference <= 100) {
      return { name: 'Gamma', color: '#ce3cfa' };
    }
    return null; // Above 100Hz or below 0.5Hz, no indicator
  };

  // Calculate cross-channel frequency display with brainwave range
  const getFrequencyDisplayComponents = () => {
    if (!otherChannelConfig || !displayConfig.frequency.enabled || !otherChannelConfig.frequency.enabled) {
      return {
        baseText: `Frequency: ${displayConfig.frequency.frequency}Hz`,
        brainwaveRange: null
      };
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
    
    const brainwaveRange = getBrainwaveRange(difference);
    const baseText = `Frequency: ${formatFreq(currentFreq)}Hz vs ${formatFreq(otherFreq)}Hz (${formatDiff(difference)}Hz${isHigher ? '+' : '-'})`;
    
    return {
      baseText,
      brainwaveRange
    };
  };
  
  return (
    <div className={`flex-1 space-y-4 relative ${isLocked ? 'opacity-60' : ''}`}>
      <div className="flex items-center justify-center md:justify-between">
        <h4 className="text-md font-semibold text-center md:text-left text-gray-900 dark:text-white">{channel} Channel</h4>
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
                step="0.01"
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
                step="0.01"
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
          <label className={`text-sm font-medium ${isLocked ? 'text-gray-500 dark:text-gray-400' : 'text-gray-900 dark:text-white'}`}>
            Frequency{displayConfig.frequency.enabled && otherChannelConfig?.frequency.enabled ? ' (Binaural Beat)' : ''}
          </label>
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
                {(() => {
                  const { baseText, brainwaveRange } = getFrequencyDisplayComponents();
                  return (
                    <span>
                      {baseText}
                      {brainwaveRange && (
                        <span style={{ color: brainwaveRange.color }} className="ml-1">
                          ({brainwaveRange.name})
                        </span>
                      )}
                    </span>
                  );
                })()}
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
                step="0.01"
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

      {/* Isochronic Beats */}
      <div className={`border rounded-lg p-3 ${
        isLocked 
          ? 'border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800' 
          : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900'
      }`}>
        <div className="flex items-center justify-between mb-3">
          <label className={`text-sm font-medium ${isLocked ? 'text-gray-500 dark:text-gray-400' : 'text-gray-900 dark:text-white'}`}>
            Isochronic Beats
          </label>
          <input
            type="checkbox"
            checked={displayConfig.isochronic.enabled}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => onIsochronicToggle(e.target.checked)}
            disabled={isLocked}
            className={`rounded ${isLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
          />
        </div>

        {displayConfig.isochronic.enabled && (
          <div className="space-y-3">
            <div>
              <label className={`block text-xs mb-1 ${isLocked ? 'text-gray-500 dark:text-gray-400' : 'text-gray-700 dark:text-gray-300'}`}>
                Carrier Frequency: {displayConfig.isochronic.carrierFrequency}Hz
              </label>
              <input
                type="range"
                min="20"
                max="500"
                step="1"
                value={displayConfig.isochronic.carrierFrequency}
                onChange={(e) => onIsochronicChange({ carrierFrequency: Number(e.target.value) })}
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
                Pulse Rate: {displayConfig.isochronic.pulseRate.toFixed(1)}Hz
              </label>
              <input
                type="range"
                min="0.5"
                max="40"
                step="0.1"
                value={displayConfig.isochronic.pulseRate}
                onChange={(e) => onIsochronicChange({ pulseRate: Number(e.target.value) })}
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
                Wet Mix: {Math.round(displayConfig.isochronic.wet * 100)}%
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={displayConfig.isochronic.wet}
                onChange={(e) => onIsochronicChange({ wet: Number(e.target.value) })}
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
                step="0.01"
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

// Mobile Tab Component
const MobileChannelTabs = ({
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
  onLeftIsochronicToggle,
  onRightIsochronicToggle,
  onLeftIsochronicChange,
  onRightIsochronicChange,
  onLeftNoiseToggle,
  onRightNoiseToggle,
  onLeftNoiseChange,
  onRightNoiseChange,
  isLocked = false,
  presetLeftChannel,
  presetRightChannel,
}: AudioControlsProps) => {
  const [activeTab, setActiveTab] = useState<"left" | "right">("left");
  const [isSticky, setIsSticky] = useState(false);
  const tabsRef = useRef<HTMLDivElement>(null);
  const originalPositionRef = useRef<number>(0);

  useEffect(() => {
    const handleScroll = () => {
      if (tabsRef.current) {
        // Store the original position when not sticky
        if (!isSticky) {
          const rect = tabsRef.current.getBoundingClientRect();
          originalPositionRef.current = rect.top + window.scrollY;
        }
        
        // Check if we should stick based on scroll position
        const scrollY = window.scrollY;
        const shouldStick = scrollY >= (originalPositionRef.current - 64);
        
        setIsSticky(shouldStick);
      }
    };

    // Set initial position
    if (tabsRef.current && !isSticky) {
      const rect = tabsRef.current.getBoundingClientRect();
      originalPositionRef.current = rect.top + window.scrollY;
    }

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isSticky]);

  const handleTabClick = (tab: "left" | "right") => {
    setActiveTab(tab);
  };

  return (
    <div className="md:hidden">
      {/* Sticky Tab Header */}
      <div 
        ref={tabsRef}
        className={`bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 transition-all duration-200 ${
          isSticky ? 'fixed top-16 left-0 right-0 z-40 shadow-lg' : 'relative'
        }`}
      >
        <div className="flex">
          <button
            onClick={() => handleTabClick("left")}
            aria-pressed={activeTab === "left"}
            aria-label="Left Channel Controls"
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset ${
              activeTab === "left"
                ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700"
            }`}
          >
            Left Channel
          </button>
          <button
            onClick={() => handleTabClick("right")}
            aria-pressed={activeTab === "right"}
            aria-label="Right Channel Controls"
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset ${
              activeTab === "right"
                ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700"
            }`}
          >
            Right Channel
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className={`${isSticky ? 'pt-20' : ''}`}>
        {activeTab === "left" && (
          <div className="p-4">
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
              onIsochronicToggle={onLeftIsochronicToggle}
              onIsochronicChange={onLeftIsochronicChange}
              onNoiseToggle={onLeftNoiseToggle}
              onNoiseChange={onLeftNoiseChange}
              isLocked={isLocked}
            />
          </div>
        )}
        
        {activeTab === "right" && (
          <div className="p-4">
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
              onIsochronicToggle={onRightIsochronicToggle}
              onIsochronicChange={onRightIsochronicChange}
              onNoiseToggle={onRightNoiseToggle}
              onNoiseChange={onRightNoiseChange}
              isLocked={isLocked}
            />
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
  onLeftIsochronicToggle,
  onRightIsochronicToggle,
  onLeftIsochronicChange,
  onRightIsochronicChange,
  onLeftNoiseToggle,
  onRightNoiseToggle,
  onLeftNoiseChange,
  onRightNoiseChange,
  isLocked = false,
  presetLeftChannel,
  presetRightChannel,
}: AudioControlsProps) {
  return (
    <>
      {/* Mobile Tabbed Layout */}
      <MobileChannelTabs
        leftChannel={leftChannel}
        rightChannel={rightChannel}
        onLeftVolumeChange={onLeftVolumeChange}
        onRightVolumeChange={onRightVolumeChange}
        onLeftPanChange={onLeftPanChange}
        onRightPanChange={onRightPanChange}
        onLeftReverbToggle={onLeftReverbToggle}
        onRightReverbToggle={onRightReverbToggle}
        onLeftReverbChange={onLeftReverbChange}
        onRightReverbChange={onRightReverbChange}
        onLeftDelayToggle={onLeftDelayToggle}
        onRightDelayToggle={onRightDelayToggle}
        onLeftDelayChange={onLeftDelayChange}
        onRightDelayChange={onRightDelayChange}
        onLeftFrequencyToggle={onLeftFrequencyToggle}
        onRightFrequencyToggle={onRightFrequencyToggle}
        onLeftFrequencyChange={onLeftFrequencyChange}
        onRightFrequencyChange={onRightFrequencyChange}
        onLeftIsochronicToggle={onLeftIsochronicToggle}
        onRightIsochronicToggle={onRightIsochronicToggle}
        onLeftIsochronicChange={onLeftIsochronicChange}
        onRightIsochronicChange={onRightIsochronicChange}
        onLeftNoiseToggle={onLeftNoiseToggle}
        onRightNoiseToggle={onRightNoiseToggle}
        onLeftNoiseChange={onLeftNoiseChange}
        onRightNoiseChange={onRightNoiseChange}
        isLocked={isLocked}
        presetLeftChannel={presetLeftChannel}
        presetRightChannel={presetRightChannel}
      />

      {/* Desktop Grid Layout */}
      <div className="hidden md:grid grid-cols-2 gap-6">
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
          onIsochronicToggle={onLeftIsochronicToggle}
          onIsochronicChange={onLeftIsochronicChange}
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
          onIsochronicToggle={onRightIsochronicToggle}
          onIsochronicChange={onRightIsochronicChange}
           onNoiseToggle={onRightNoiseToggle}
           onNoiseChange={onRightNoiseChange}
           isLocked={isLocked}
         />
      </div>
    </>
  );
}
