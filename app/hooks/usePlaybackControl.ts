"use client";

import { useCallback, useRef } from "react";
import * as Tone from "tone/build/esm/index.js";

type Refs = {
  playerRef: React.MutableRefObject<Tone.Player | null>;
  leftOscillatorRef: React.MutableRefObject<Tone.Oscillator | null>;
  rightOscillatorRef: React.MutableRefObject<Tone.Oscillator | null>;
};

type Setters = {
  setIsPlaying: (v: boolean) => void;
  setProgress: (currentTime: number, duration: number, progress: number) => void;
  onPlaybackEnd?: () => void;
};

type OscillatorState = {
  leftEnabled: boolean;
  rightEnabled: boolean;
};

export const usePlaybackControl = (refs: Refs, setters: Setters, oscillatorState?: OscillatorState) => {
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
    try { refs.leftOscillatorRef.current?.stop(); } catch {}
    try { refs.rightOscillatorRef.current?.stop(); } catch {}

    playbackStartTimeRef.current = null;
    setters.setIsPlaying(false);
    clearTimers();
  }, [refs.playerRef, refs.leftOscillatorRef, refs.rightOscillatorRef, clearTimers, setters]);

  const start = useCallback((loop: boolean) => {
    if (!refs.playerRef.current || !refs.playerRef.current.loaded) return;

    const audioDuration = refs.playerRef.current.buffer.duration;
    refs.playerRef.current.start();
    playbackStartTimeRef.current = Tone.now();
    loopStateRef.current = loop;

    // Start oscillators if they are enabled
    if (oscillatorState?.leftEnabled && refs.leftOscillatorRef.current) {
      try { refs.leftOscillatorRef.current.start(); } catch {}
    }
    if (oscillatorState?.rightEnabled && refs.rightOscillatorRef.current) {
      try { refs.rightOscillatorRef.current.start(); } catch {}
    }

    setters.setIsPlaying(true);
    setters.setProgress(0, audioDuration, 0);

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
        // Stop oscillators when playback naturally ends
        try { refs.leftOscillatorRef.current?.stop(); } catch {}
        try { refs.rightOscillatorRef.current?.stop(); } catch {}
        
        setters.setIsPlaying(false);
        setters.onPlaybackEnd?.();
        clearTimers();
      }, Math.floor(audioDuration * 1000) + 100);
    }
  }, [refs.playerRef, refs.leftOscillatorRef, refs.rightOscillatorRef, oscillatorState, setters, clearTimers]);

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
          // Stop oscillators when playback naturally ends
          try { refs.leftOscillatorRef.current?.stop(); } catch {}
          try { refs.rightOscillatorRef.current?.stop(); } catch {}
          
          setters.setIsPlaying(false);
          setters.onPlaybackEnd?.();
          clearTimers();
        }, Math.floor(remainingTime * 1000) + 100);
      }
    }
  }, [refs.playerRef, refs.leftOscillatorRef, refs.rightOscillatorRef, setters, clearTimers]);

  const cleanupPlayback = useCallback(() => {
    clearTimers();
    playbackStartTimeRef.current = null;
    loopStateRef.current = false;
  }, [clearTimers]);

  return { start, stop, setLoop, cleanupPlayback };
};


