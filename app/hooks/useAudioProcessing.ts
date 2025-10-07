"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import * as Tone from "tone/build/esm/index.js";
import { AudioPresetConfig } from "../utils/audioPresets";

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
  
  // Tone.js nodes
  const playerRef = useRef<Tone.Player | null>(null);
  const leftGainRef = useRef<Tone.Gain | null>(null);
  const rightGainRef = useRef<Tone.Gain | null>(null);
  const leftPanRef = useRef<Tone.Panner | null>(null);
  const rightPanRef = useRef<Tone.Panner | null>(null);
  const leftReverbRef = useRef<Tone.Reverb | null>(null);
  const rightReverbRef = useRef<Tone.Reverb | null>(null);
  const leftDelayRef = useRef<Tone.PingPongDelay | null>(null);
  const rightDelayRef = useRef<Tone.PingPongDelay | null>(null);
  const masterGainRef = useRef<Tone.Gain | null>(null);
  const playbackTimerRef = useRef<NodeJS.Timeout | null>(null);
  const progressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const playbackStartTimeRef = useRef<number | null>(null);
  const loopStateRef = useRef<boolean>(false);
  
  // Visualizer removed

  // Initialize Tone.js context
  const initializeTone = useCallback(async () => {
    if (Tone.context.state !== "running") {
      await Tone.start();
    }
    // Visualizer removed
  }, []);

  // Update playback progress
  const updatePlaybackProgress = useCallback(() => {
    if (playerRef.current && playbackStartTimeRef.current !== null) {
      try {
        // Ensure Tone context is running
        if (Tone.context.state !== "running") {
          console.log("Tone context not running, skipping progress update");
          return;
        }
        
        const duration = playerRef.current.buffer.duration;
        const totalElapsedTime = Tone.now() - playbackStartTimeRef.current;
        
        // Calculate current time within the current loop cycle
        let currentTime;
        let progress;
        
        if (loopStateRef.current && duration > 0) {
          // For looping audio, calculate position within current loop cycle
          currentTime = totalElapsedTime % duration;
          progress = currentTime / duration;
        } else {
          // For non-looping audio, use total elapsed time
          currentTime = totalElapsedTime;
          progress = duration > 0 ? Math.min(currentTime / duration, 1) : 0;
        }
        
        console.log('Progress update:', { 
          currentTime, 
          duration, 
          progress,
          totalElapsedTime,
          isLooping: loopStateRef.current,
          toneNow: Tone.now(),
          startTime: playbackStartTimeRef.current,
          contextState: Tone.context.state
        });
        
        setState(prev => ({
          ...prev,
          playbackProgress: {
            currentTime: Math.max(0, currentTime),
            duration,
            progress,
          }
        }));
      } catch (error) {
        console.error('Error updating playback progress:', error);
      }
    }
  }, []);

  // Create audio processing chain
  const createAudioChain = useCallback(async () => {
    await initializeTone();

    // Clean up existing nodes
    cleanup();

    if (!audioUrl) return;
    
    // Set loading state only once
    setState(prev => ({ ...prev, isLoading: true, bufferLoaded: false }));

    try {
      // Create nodes
      const player = new Tone.Player(audioUrl);
      
      // Configure player loop based on state
      player.loop = state.loop;
      const leftGain = new Tone.Gain();
      const rightGain = new Tone.Gain();
      const leftPan = new Tone.Panner();
      const rightPan = new Tone.Panner();
      const leftReverb = new Tone.Reverb();
      const rightReverb = new Tone.Reverb();
      const leftDelay = new Tone.PingPongDelay();
      const rightDelay = new Tone.PingPongDelay();
      const masterGain = new Tone.Gain();
      
      // Visualizer removed

      // Configure effects using constructor options
      leftReverb.decay = state.leftChannel.reverb.roomSize;
      leftReverb.wet.value = state.leftChannel.reverb.enabled ? state.leftChannel.reverb.wet : 0;
      
      rightReverb.decay = state.rightChannel.reverb.roomSize;
      rightReverb.wet.value = state.rightChannel.reverb.enabled ? state.rightChannel.reverb.wet : 0;

      leftDelay.delayTime.value = state.leftChannel.delay.delayTime;
      leftDelay.feedback.value = state.leftChannel.delay.feedback;
      leftDelay.wet.value = state.leftChannel.delay.enabled ? state.leftChannel.delay.wet : 0;

      rightDelay.delayTime.value = state.rightChannel.delay.delayTime;
      rightDelay.feedback.value = state.rightChannel.delay.feedback;
      rightDelay.wet.value = state.rightChannel.delay.enabled ? state.rightChannel.delay.wet : 0;

      // Configure panning
      leftPan.pan.value = state.leftChannel.pan;
      rightPan.pan.value = state.rightChannel.pan;

      // Configure volumes
      leftGain.gain.value = Tone.dbToGain(Tone.gainToDb(state.leftChannel.volume / 100));
      rightGain.gain.value = Tone.dbToGain(Tone.gainToDb(state.rightChannel.volume / 100));
      masterGain.gain.value = Tone.dbToGain(Tone.gainToDb(state.masterVolume / 100));

      // Build audio chain - simplified approach for mono-to-stereo simulation
      player.fan(leftDelay, rightDelay);
      leftDelay.chain(leftReverb, leftGain, leftPan, masterGain);
      rightDelay.chain(rightReverb, rightGain, rightPan, masterGain);
      masterGain.toDestination();
      
      // Visualizer removed


      // Store references
      playerRef.current = player;
      leftGainRef.current = leftGain;
      rightGainRef.current = rightGain;
      leftPanRef.current = leftPan;
      rightPanRef.current = rightPan;
      leftReverbRef.current = leftReverb;
      rightReverbRef.current = rightReverb;
      leftDelayRef.current = leftDelay;
      rightDelayRef.current = rightDelay;
      masterGainRef.current = masterGain;
      // Visualizer removed

      // Wait for the buffer to load before marking as ready
      if (player.loaded) {
        setState(prev => ({ ...prev, isLoading: false, bufferLoaded: true }));
      } else {
        // Poll the loaded status until it's ready
        const checkLoaded = () => {
          if (player.loaded) {
            setState(prev => ({ ...prev, isLoading: false, bufferLoaded: true }));
          } else {
            // Check again after a short delay
            setTimeout(checkLoaded, 50);
          }
        };
        checkLoaded();
      }
    } catch (error) {
      console.error('Error creating audio chain:', error);
      setState(prev => ({ ...prev, isLoading: false, bufferLoaded: false }));
    }

  }, [audioUrl, initializeTone]);
  

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
      setTimeout(() => {
        console.log("Updating audio parameters");
        if (leftGainRef.current && rightGainRef.current && leftPanRef.current && 
            rightPanRef.current && leftReverbRef.current && rightReverbRef.current &&
            leftDelayRef.current && rightDelayRef.current) {
          
          // Update volumes
          leftGainRef.current.gain.value = Tone.dbToGain(Tone.gainToDb(newState.leftChannel.volume / 100));
          rightGainRef.current.gain.value = Tone.dbToGain(Tone.gainToDb(newState.rightChannel.volume / 100));

          // Update panning
          leftPanRef.current.pan.value = newState.leftChannel.pan;
          rightPanRef.current.pan.value = newState.rightChannel.pan;

          // Update reverb parameters
          leftReverbRef.current.decay = newState.leftChannel.reverb.roomSize;
          leftReverbRef.current.wet.value = newState.leftChannel.reverb.enabled ? newState.leftChannel.reverb.wet : 0;
          
          rightReverbRef.current.decay = newState.rightChannel.reverb.roomSize;
          rightReverbRef.current.wet.value = newState.rightChannel.reverb.enabled ? newState.rightChannel.reverb.wet : 0;

          // Update delay parameters
          leftDelayRef.current.delayTime.value = newState.leftChannel.delay.delayTime;
          leftDelayRef.current.feedback.value = newState.leftChannel.delay.feedback;
          leftDelayRef.current.wet.value = newState.leftChannel.delay.enabled ? newState.leftChannel.delay.wet : 0;

          rightDelayRef.current.delayTime.value = newState.rightChannel.delay.delayTime;
          rightDelayRef.current.feedback.value = newState.rightChannel.delay.feedback;
          rightDelayRef.current.wet.value = newState.rightChannel.delay.enabled ? newState.rightChannel.delay.wet : 0;
        }
      }, 0);
      
      return newState;
    });
  }, []);

  // Update master volume
  const updateMasterVolume = useCallback((volume: number) => {
    setState(prev => ({ ...prev, masterVolume: volume }));
    if (masterGainRef.current) {
      masterGainRef.current.gain.value = Tone.dbToGain(Tone.gainToDb(volume / 100));
    }
  }, []);

  // Toggle loop mode
  const toggleLoop = useCallback(() => {
    const newLoopState = !state.loop;
    setState(prev => ({ ...prev, loop: newLoopState }));
    loopStateRef.current = newLoopState;
    
    if (playerRef.current) {
      playerRef.current.loop = newLoopState;
      
      // If we're currently playing and just enabled loop, clear any existing timer
      if (state.isPlaying && newLoopState) {
        if (playbackTimerRef.current) {
          clearTimeout(playbackTimerRef.current);
          playbackTimerRef.current = null;
        }
        console.log('Loop enabled while playing - cleared stop timer');
      }
      // If we're currently playing and just disabled loop, set a new timer
      else if (state.isPlaying && !newLoopState) {
        const audioDuration = playerRef.current.buffer.duration;
        const playbackTimer = setTimeout(() => {
          console.log('Audio playback timer fired after disabling loop');
          setState(prev => ({ ...prev, isPlaying: false }));
        }, Math.floor(audioDuration * 1000) + 100);
        
        playbackTimerRef.current = playbackTimer;
        console.log('Loop disabled while playing - set new stop timer');
      }
    }
  }, [state.loop, state.isPlaying]);

  // Apply audio preset configuration
  const applyPreset = useCallback((config: AudioPresetConfig) => {
    setState(prev => ({
      ...prev,
      leftChannel: config.leftChannel,
      rightChannel: config.rightChannel,
      masterVolume: config.masterVolume,
    }));

    // Update audio parameters immediately
    setTimeout(() => {
      console.log("Applying preset configuration");
      if (leftGainRef.current && rightGainRef.current && leftPanRef.current && 
          rightPanRef.current && leftReverbRef.current && rightReverbRef.current &&
          leftDelayRef.current && rightDelayRef.current) {
        
        // Update volumes
        leftGainRef.current.gain.value = Tone.dbToGain(Tone.gainToDb(config.leftChannel.volume / 100));
        rightGainRef.current.gain.value = Tone.dbToGain(Tone.gainToDb(config.rightChannel.volume / 100));

        // Update panning
        leftPanRef.current.pan.value = config.leftChannel.pan;
        rightPanRef.current.pan.value = config.rightChannel.pan;

        // Update reverb parameters
        leftReverbRef.current.decay = config.leftChannel.reverb.roomSize;
        leftReverbRef.current.wet.value = config.leftChannel.reverb.enabled ? config.leftChannel.reverb.wet : 0;
        
        rightReverbRef.current.decay = config.rightChannel.reverb.roomSize;
        rightReverbRef.current.wet.value = config.rightChannel.reverb.enabled ? config.rightChannel.reverb.wet : 0;

        // Update delay parameters
        leftDelayRef.current.delayTime.value = config.leftChannel.delay.delayTime;
        leftDelayRef.current.feedback.value = config.leftChannel.delay.feedback;
        leftDelayRef.current.wet.value = config.leftChannel.delay.enabled ? config.leftChannel.delay.wet : 0;

        rightDelayRef.current.delayTime.value = config.rightChannel.delay.delayTime;
        rightDelayRef.current.feedback.value = config.rightChannel.delay.feedback;
        rightDelayRef.current.wet.value = config.rightChannel.delay.enabled ? config.rightChannel.delay.wet : 0;
      }

      // Update master volume
      if (masterGainRef.current) {
        masterGainRef.current.gain.value = Tone.dbToGain(Tone.gainToDb(config.masterVolume / 100));
      }
    }, 0);
  }, []);


  // Play audio
  const handlePlay = useCallback(async () => {
    if (!playerRef.current) {
      await createAudioChain();
    }
    
    if (playerRef.current && playerRef.current.loaded) {
      const audioDuration = playerRef.current.buffer.duration;
      console.log('Audio duration:', audioDuration);
      
      playerRef.current.start();
      playbackStartTimeRef.current = Tone.now();
      loopStateRef.current = state.loop;
      console.log('Playback started at:', playbackStartTimeRef.current);
      console.log('Tone context state:', Tone.context.state);
      console.log('Player loaded:', playerRef.current.loaded);
      console.log('Loop state:', loopStateRef.current);
      
      setState(prev => ({ 
        ...prev, 
        isPlaying: true,
        playbackProgress: {
          currentTime: 0,
          duration: audioDuration,
          progress: 0,
        }
      }));
      
      // Start progress tracking timer
      const progressTimer = setInterval(() => {
        updatePlaybackProgress();
      }, 100); // Update every 100ms
      progressTimerRef.current = progressTimer;
      console.log('Progress timer started');
      
      // Only set a timeout to stop if loop is disabled
      if (!state.loop) {
        const playbackTimer = setTimeout(() => {
          console.log('Audio playback timer fired - audio should be complete now');
          console.log('Setting isPlaying to false');
          setState(prev => ({ ...prev, isPlaying: false }));
          
          // Clear progress timer
          if (progressTimerRef.current) {
            clearInterval(progressTimerRef.current);
            progressTimerRef.current = null;
          }
        }, Math.floor(audioDuration * 1000) + 100); // Convert to milliseconds + small buffer
        
        // Store the timer for cleanup if needed
        playbackTimerRef.current = playbackTimer;
      } else {
        console.log('Loop enabled - no automatic stop timer set');
        // Clear any existing timer since we're looping
        if (playbackTimerRef.current) {
          clearTimeout(playbackTimerRef.current);
          playbackTimerRef.current = null;
        }
      }
    } else {
      console.warn('Audio buffer not loaded yet. Please wait for loading to complete.');
    }
  }, [createAudioChain, state.loop]);

  // Stop audio
  const handleStop = useCallback(() => {
    if (playerRef.current) {
      playerRef.current.stop();
      playbackStartTimeRef.current = null;
      setState(prev => ({ 
        ...prev, 
        isPlaying: false,
        playbackProgress: {
          currentTime: 0,
          duration: prev.playbackProgress.duration,
          progress: 0,
        }
      }));
      
      // Clear the playback timer if it exists
      if (playbackTimerRef.current) {
        clearTimeout(playbackTimerRef.current);
        playbackTimerRef.current = null;
      }
      
      // Clear the progress timer if it exists
      if (progressTimerRef.current) {
        clearInterval(progressTimerRef.current);
        progressTimerRef.current = null;
      }
    }
  }, []);

  // Cleanup function
  const cleanup = useCallback(() => {
    [
      playerRef.current,
      leftGainRef.current,
      rightGainRef.current,
      leftPanRef.current,
      rightPanRef.current,
      leftReverbRef.current,
      rightReverbRef.current,
      leftDelayRef.current,
      rightDelayRef.current,
      masterGainRef.current,
    ].forEach(node => {
      if (node) {
        node.dispose();
      }
    });
    
    // Visualizer removed
    
    playerRef.current = null;
    leftGainRef.current = null;
    rightGainRef.current = null;
    leftPanRef.current = null;
    rightPanRef.current = null;
    leftReverbRef.current = null;
    rightReverbRef.current = null;
    leftDelayRef.current = null;
    rightDelayRef.current = null;
    masterGainRef.current = null;
    
    // Clear any active playback timer
    if (playbackTimerRef.current) {
      clearTimeout(playbackTimerRef.current);
      playbackTimerRef.current = null;
    }
    
    // Clear any active progress timer
    if (progressTimerRef.current) {
      clearInterval(progressTimerRef.current);
      progressTimerRef.current = null;
    }
    
    // Reset playback start time and loop state
    playbackStartTimeRef.current = null;
    loopStateRef.current = false;
  }, []);

  // Set audio source
  const setAudioSource = useCallback((url: string) => {
    setAudioUrl(url);
    setState(prev => ({ ...prev, isLoading: true }));
    cleanup();
  }, [cleanup]);

  // Effect to recreate chain when audio URL changes
  useEffect(() => {
    if (audioUrl) {
      createAudioChain();
    }
  }, [audioUrl, createAudioChain]);


  // Debug useEffect to monitor state changes
  useEffect(() => {
    console.log('🎵 Audio state changed:', {
      isPlaying: state.isPlaying,
      isLoading: state.isLoading,
      bufferLoaded: state.bufferLoaded,
      masterVolume: state.masterVolume
    });
  }, [state.isPlaying, state.isLoading, state.bufferLoaded, state.masterVolume]);

  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  return {
    state,
    updateChannelConfig,
    updateMasterVolume,
    applyPreset,
    setAudioSource,
    handlePlay,
    handleStop,
    toggleLoop,
    isLoading: state.isLoading,
    // Visualizer removed
  };
};