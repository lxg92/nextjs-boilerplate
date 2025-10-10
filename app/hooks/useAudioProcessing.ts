"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import * as Tone from "tone/build/esm/index.js";
import { AudioPresetConfig } from "../utils/audioPresets";
import { useToneNodes } from "./useToneNodes";
import { usePlaybackControl } from "./usePlaybackControl";
import { updateChannelParameters, updateMasterVolume as applyMasterVol, stopAllEffects } from "../utils/audioNodeUpdaters";

export interface ChannelConfig {
  volume: number; // 0-200%
  pan: number; // -1 to 1
  reverb: {
    enabled: boolean;
    roomSize: number; // 0.1-10
    wet: number; // 0-1
  };
  delay: {
    enabled: boolean;
    delayTime: string; // Tone.Time notation
    feedback: number; // 0-0.9
    wet: number; // 0-1
  };
  frequency: {
    enabled: boolean;
    frequency: number; // Hz
    wet: number; // 0-1
  };
  noise: {
    enabled: boolean;
    type: "brown" | "pink" | "white";
    wet: number; // 0-1
  };
}

export interface AudioProcessingState {
  leftChannel: ChannelConfig;
  rightChannel: ChannelConfig;
  masterVolume: number;
  isPlaying: boolean;
  isLoading: boolean;
  bufferLoaded: boolean;
  loop: boolean;
  playbackProgress: {
    currentTime: number;
    duration: number;
    progress: number;
  };
}

// Visualizer removed

const DEFAULT_CHANNEL_CONFIG: ChannelConfig = {
  volume: 100,
  pan: 0,
  reverb: {
    enabled: false,
    roomSize: 3,
    wet: 0.3,
  },
  delay: {
    enabled: false,
    delayTime: "8n",
    feedback: 0.3,
    wet: 0.3,
  },
  frequency: {
    enabled: false,
    frequency: 500, // Middle of 100-1000Hz range
    wet: 0.5,
  },
  noise: {
    enabled: false,
    type: "white",
    wet: 0.3,
  },
};

const DEFAULT_STATE: AudioProcessingState = {
  leftChannel: { ...DEFAULT_CHANNEL_CONFIG },
  rightChannel: { ...DEFAULT_CHANNEL_CONFIG },
  masterVolume: 100,
  isPlaying: false,
  isLoading: false,
  bufferLoaded: false,
  loop: false,
  playbackProgress: {
    currentTime: 0,
    duration: 0,
    progress: 0,
  },
};

export const useAudioProcessing = () => {
  const [state, setState] = useState<AudioProcessingState>(DEFAULT_STATE);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  const {
    playerRef,
    leftGainRef,
    rightGainRef,
    leftPanRef,
    rightPanRef,
    leftReverbRef,
    rightReverbRef,
    leftDelayRef,
    rightDelayRef,
    leftOscillatorRef,
    rightOscillatorRef,
    leftOscGainRef,
    rightOscGainRef,
    leftNoiseRef,
    rightNoiseRef,
    leftNoiseGainRef,
    rightNoiseGainRef,
    masterGainRef,
    createAudioChain: createToneChain,
    cleanup,
  } = useToneNodes();

  // Helper function to create channel node bundles
  const getChannelNodeBundles = useCallback(() => ({
    left: {
      gain: leftGainRef.current,
      pan: leftPanRef.current,
      reverb: leftReverbRef.current,
      delay: leftDelayRef.current,
      oscillator: leftOscillatorRef.current,
      oscillatorGain: leftOscGainRef.current,
      noise: leftNoiseRef.current,
      noiseGain: leftNoiseGainRef.current,
    },
    right: {
      gain: rightGainRef.current,
      pan: rightPanRef.current,
      reverb: rightReverbRef.current,
      delay: rightDelayRef.current,
      oscillator: rightOscillatorRef.current,
      oscillatorGain: rightOscGainRef.current,
      noise: rightNoiseRef.current,
      noiseGain: rightNoiseGainRef.current,
    },
  }), [leftGainRef, rightGainRef, leftPanRef, rightPanRef, leftReverbRef, rightReverbRef, leftDelayRef, rightDelayRef, leftOscillatorRef, rightOscillatorRef, leftOscGainRef, rightOscGainRef, leftNoiseRef, rightNoiseRef, leftNoiseGainRef, rightNoiseGainRef]);

  // Helper function to update both channel parameters
  const updateBothChannels = useCallback((leftConfig: ChannelConfig, rightConfig: ChannelConfig, isPlaying: boolean) => {
    const nodeBundles = getChannelNodeBundles();
    updateChannelParameters(leftConfig, nodeBundles.left, isPlaying);
    updateChannelParameters(rightConfig, nodeBundles.right, isPlaying);
  }, [getChannelNodeBundles]);

  const { start: startPlayback, stop: stopPlayback, setLoop: setLoopPlayback, cleanupPlayback } = usePlaybackControl(
    { 
      playerRef,
      leftOscillatorRef,
      rightOscillatorRef,
      leftOscGainRef,
      rightOscGainRef,
      leftNoiseRef,
      rightNoiseRef,
      leftNoiseGainRef,
      rightNoiseGainRef
    },
    {
      setIsPlaying: (v: boolean) => setState(prev => ({ ...prev, isPlaying: v })),
      setProgress: (currentTime: number, duration: number, progress: number) => setState(prev => ({
        ...prev,
        playbackProgress: { currentTime, duration, progress }
      })),
      onPlaybackStart: () => {
        // Update channel parameters when playback starts to ensure effects are properly applied
        updateBothChannels(state.leftChannel, state.rightChannel, true);
      },
      onPlaybackEnd: () => {
        // Stop all effects when playback naturally ends
        const nodeBundles = getChannelNodeBundles();
        stopAllEffects(nodeBundles.left, nodeBundles.right);
      },
    },
    {
      leftFrequencyEnabled: state.leftChannel.frequency.enabled,
      rightFrequencyEnabled: state.rightChannel.frequency.enabled,
      leftNoiseEnabled: state.leftChannel.noise.enabled,
      rightNoiseEnabled: state.rightChannel.noise.enabled,
    }
  );

  // Independent effects (frequency) are controlled by enabled state and only active during playback


  // Progress handled in usePlaybackControl

  // Create audio processing chain
  const createAudioChain = useCallback(async () => {
    if (!audioUrl) return;
    if (Tone.context.state !== "running") {
      await Tone.start();
    }
    setState(prev => ({ ...prev, isLoading: true, bufferLoaded: false }));
    try {
      const result = await createToneChain(audioUrl, state);
      if (result.loaded) {
        setState(prev => ({ ...prev, isLoading: false, bufferLoaded: true }));
      } else {
        // Poll until loaded
        const checkLoaded = () => {
          if (playerRef.current?.loaded) {
            setState(prev => ({ ...prev, isLoading: false, bufferLoaded: true }));
          } else {
            setTimeout(checkLoaded, 50);
          }
        };
        checkLoaded();
      }
    } catch (e) {
      setState(prev => ({ ...prev, isLoading: false, bufferLoaded: false }));
    }
  }, [audioUrl, createToneChain]);
  

  // Update channel configurations
  const updateChannelConfig = useCallback((channel: "left" | "right", config: Partial<ChannelConfig>) => {
    setState(prev => {
      const newState = {
        ...prev,
        [`${channel}Channel` as keyof AudioProcessingState]: {
          ...prev[`${channel}Channel` as keyof AudioProcessingState] as ChannelConfig,
          ...config
        }
      };
      
      // Update audio parameters immediately with new state
      updateBothChannels(newState.leftChannel, newState.rightChannel, newState.isPlaying);
      
      return newState;
    });
  }, [updateBothChannels]);

  // Update master volume
  const updateMasterVolume = useCallback((volume: number) => {
    setState(prev => ({ ...prev, masterVolume: volume }));
    applyMasterVol(volume, masterGainRef.current);
  }, [masterGainRef]);

  // Toggle loop mode via playback control
  const toggleLoop = useCallback(() => {
    const newLoopState = !state.loop;
    setState(prev => ({ ...prev, loop: newLoopState }));
    setLoopPlayback(newLoopState);
  }, [state.loop, setLoopPlayback]);

  // Apply audio preset configuration
  const applyPreset = useCallback((config: AudioPresetConfig) => {
    setState(prev => ({
      ...prev,
      leftChannel: config.leftChannel,
      rightChannel: config.rightChannel,
      masterVolume: config.masterVolume,
    }));

    // Update audio parameters immediately
    updateBothChannels(config.leftChannel, config.rightChannel, state.isPlaying);
    applyMasterVol(config.masterVolume, masterGainRef.current);
  }, [updateBothChannels, state.isPlaying, masterGainRef]);


  // Play audio
  const handlePlay = useCallback(async () => {
    if (!playerRef.current) {
      await createAudioChain();
    }
    if (!playerRef.current || !playerRef.current.loaded) return;
    
    // Start playback - effects will be enabled via onPlaybackStart callback
    startPlayback(state.loop);
  }, [createAudioChain, playerRef, startPlayback, state.loop]);

  // Stop audio
  const handleStop = useCallback(() => {
    stopPlayback();
    setState(prev => ({
      ...prev,
      playbackProgress: { currentTime: 0, duration: prev.playbackProgress.duration, progress: 0 },
    }));
  }, [stopPlayback]);

  // Cleanup handled by hooks: useToneNodes.cleanup and usePlaybackControl.cleanupPlayback

  // Set audio source
  const setAudioSource = useCallback((url: string) => {
    setAudioUrl(url);
    setState(prev => ({ ...prev, isLoading: true }));
    cleanup();
  }, [cleanup]);

  // Test oscillators function - temporarily enables independent effects
  const testOscillators = useCallback(async () => {
    if (Tone.context.state !== "running") {
      await Tone.start();
    }
    
    // Temporarily enable oscillators for testing
    if (leftOscillatorRef.current && rightOscillatorRef.current && 
        leftOscGainRef.current && rightOscGainRef.current) {
      
      // Start oscillators
      try { leftOscillatorRef.current.start(); } catch {}
      try { rightOscillatorRef.current.start(); } catch {}
      
      // Enable oscillators
      leftOscGainRef.current.gain.value = 0.3;
      rightOscGainRef.current.gain.value = 0.3;
      
      // Stop and disable after 3 seconds
      setTimeout(() => {
        try { leftOscillatorRef.current?.stop(); } catch {}
        try { rightOscillatorRef.current?.stop(); } catch {}
        if (leftOscGainRef.current) leftOscGainRef.current.gain.value = 0;
        if (rightOscGainRef.current) rightOscGainRef.current.gain.value = 0;
      }, 3000);
    }
  }, [leftOscillatorRef, rightOscillatorRef, leftOscGainRef, rightOscGainRef]);

  // Debug state function
  const debugState = useCallback(() => {
    console.log("=== Audio Processing State Debug ===");
    console.log("Current State:", state);
    console.log("Audio URL:", audioUrl);
    console.log("Player Loaded:", playerRef.current?.loaded);
    console.log("Tone Context State:", Tone.context.state);
    console.log("Left Oscillator:", leftOscillatorRef.current);
    console.log("Right Oscillator:", rightOscillatorRef.current);
    console.log("Left Noise:", leftNoiseRef.current);
    console.log("Right Noise:", rightNoiseRef.current);
    console.log("Master Gain:", masterGainRef.current);
    console.log("=====================================");
  }, [state, audioUrl, playerRef, leftOscillatorRef, rightOscillatorRef, leftNoiseRef, rightNoiseRef, masterGainRef]);

  // Effect to recreate chain when audio URL changes
  useEffect(() => {
    if (audioUrl) {
      createAudioChain();
    }
  }, [audioUrl, createAudioChain]);


  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupPlayback();
      cleanup();
    };
  }, [cleanup, cleanupPlayback]);

  return {
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
    isLoading: state.isLoading,
    // Visualizer removed
  };
};