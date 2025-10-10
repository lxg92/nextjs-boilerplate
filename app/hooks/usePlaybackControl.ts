"use client";

import { useCallback, useRef } from "react";
import * as Tone from "tone/build/esm/index.js";

type Refs = {
  playerRef: React.MutableRefObject<Tone.Player | null>;
  leftOscillatorRef: React.MutableRefObject<Tone.Oscillator | null>;
  rightOscillatorRef: React.MutableRefObject<Tone.Oscillator | null>;
  leftOscGainRef: React.MutableRefObject<Tone.Gain | null>;
  rightOscGainRef: React.MutableRefObject<Tone.Gain | null>;
  leftNoiseRef: React.MutableRefObject<Tone.Noise | null>;
  rightNoiseRef: React.MutableRefObject<Tone.Noise | null>;
  leftNoiseGainRef: React.MutableRefObject<Tone.Gain | null>;
  rightNoiseGainRef: React.MutableRefObject<Tone.Gain | null>;
};

type Setters = {
  setIsPlaying: (v: boolean) => void;
  setProgress: (currentTime: number, duration: number, progress: number) => void;
  onPlaybackEnd?: () => void;
  onPlaybackStart?: () => void;
};

type IndependentEffectState = {
  leftFrequencyEnabled: boolean;
  rightFrequencyEnabled: boolean;
  leftNoiseEnabled: boolean;
  rightNoiseEnabled: boolean;
};

export const usePlaybackControl = (refs: Refs, setters: Setters, independentEffects?: IndependentEffectState) => {
  const playbackTimerRef = useRef<NodeJS.Timeout | null>(null);
  const progressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const playbackStartTimeRef = useRef<number | null>(null);
  const loopStateRef = useRef<boolean>(false);

  const clearTimers = useCallback(() => {
    if (playbackTimerRef.current) {
      clearTimeout(playbackTimerRef.current);
      playbackTimerRef.current = null;
    }
    if (progressTimerRef.current) {
      clearInterval(progressTimerRef.current);
      progressTimerRef.current = null;
    }
  }, []);

  const stop = useCallback(() => {
    if (refs.playerRef.current) {
      refs.playerRef.current.stop();
    }

    // Call onPlaybackEnd to trigger stopAllEffects for proper cleanup
    setters.onPlaybackEnd?.();

    playbackStartTimeRef.current = null;
    setters.setIsPlaying(false);
    clearTimers();
  }, [refs.playerRef, clearTimers, setters]);

  const start = useCallback((loop: boolean) => {
    if (!refs.playerRef.current || !refs.playerRef.current.loaded) return;

    const audioDuration = refs.playerRef.current.buffer.duration;
    refs.playerRef.current.start();
    playbackStartTimeRef.current = Tone.now();
    loopStateRef.current = loop;

    // Independent effects (oscillators) are now handled by updateChannelParameters
    // when their enabled state changes, so no need to start them here

    setters.setIsPlaying(true);
    setters.setProgress(0, audioDuration, 0);
    
    // Notify that playback has started so effects can be properly enabled
    setters.onPlaybackStart?.();

    const updateProgress = () => {
      if (!refs.playerRef.current || playbackStartTimeRef.current === null) return;
      if (Tone.context.state !== "running") return;

      const duration = refs.playerRef.current.buffer.duration;
      const totalElapsedTime = Tone.now() - playbackStartTimeRef.current;
      let currentTime: number;
      let progress: number;
      if (loopStateRef.current && duration > 0) {
        currentTime = totalElapsedTime % duration;
        progress = currentTime / duration;
      } else {
        currentTime = totalElapsedTime;
        progress = duration > 0 ? Math.min(currentTime / duration, 1) : 0;
      }
      setters.setProgress(Math.max(0, currentTime), duration, progress);
    };

    progressTimerRef.current = setInterval(updateProgress, 100);

    if (!loop) {
      playbackTimerRef.current = setTimeout(() => {
        // Independent effects are handled by stopAllEffects in onPlaybackEnd callback
        
        setters.setIsPlaying(false);
        setters.onPlaybackEnd?.();
        clearTimers();
      }, Math.floor(audioDuration * 1000) + 100);
    }
  }, [refs.playerRef, independentEffects, setters, clearTimers]);

  const setLoop = useCallback((loop: boolean) => {
    loopStateRef.current = loop;
    if (refs.playerRef.current) {
      refs.playerRef.current.loop = loop;
    }
    
    // If enabling loop, clear the end-of-playback timer
    if (loop && playbackTimerRef.current) {
      clearTimeout(playbackTimerRef.current);
      playbackTimerRef.current = null;
    } else if (!loop && playbackStartTimeRef.current !== null && !playbackTimerRef.current) {
      // If disabling loop during playback and no end timer exists, set one
      const audioDuration = refs.playerRef.current?.buffer.duration || 0;
      if (audioDuration > 0) {
        const elapsedTime = Tone.now() - playbackStartTimeRef.current;
        const remainingTime = Math.max(0, audioDuration - (elapsedTime % audioDuration));
        
        playbackTimerRef.current = setTimeout(() => {
          // Independent effects are handled by stopAllEffects in onPlaybackEnd callback
          
          setters.setIsPlaying(false);
          setters.onPlaybackEnd?.();
          clearTimers();
        }, Math.floor(remainingTime * 1000) + 100);
      }
    }
  }, [refs.playerRef, setters, clearTimers]);

  const cleanupPlayback = useCallback(() => {
    clearTimers();
    playbackStartTimeRef.current = null;
    loopStateRef.current = false;
  }, [clearTimers]);

  return { start, stop, setLoop, cleanupPlayback };
};


