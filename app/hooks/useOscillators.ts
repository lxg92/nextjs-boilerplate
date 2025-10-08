"use client";

import { useCallback } from "react";
import * as Tone from "tone/build/esm/index.js";

type OscRefs = {
  leftOscillatorRef: React.MutableRefObject<Tone.Oscillator | null>;
  rightOscillatorRef: React.MutableRefObject<Tone.Oscillator | null>;
  leftOscGainRef: React.MutableRefObject<Tone.Gain | null>;
  rightOscGainRef: React.MutableRefObject<Tone.Gain | null>;
};

export const useOscillators = (refs: OscRefs) => {
  const startIfEnabled = useCallback((leftEnabled: boolean, rightEnabled: boolean) => {
    if (leftEnabled && refs.leftOscillatorRef.current) {
      try { refs.leftOscillatorRef.current.start(); } catch {}
    }
    if (rightEnabled && refs.rightOscillatorRef.current) {
      try { refs.rightOscillatorRef.current.start(); } catch {}
    }
  }, [refs.leftOscillatorRef, refs.rightOscillatorRef]);

  const stopBoth = useCallback(() => {
    try { refs.leftOscillatorRef.current?.stop(); } catch {}
    try { refs.rightOscillatorRef.current?.stop(); } catch {}
  }, [refs.leftOscillatorRef, refs.rightOscillatorRef]);

  const applyFrequency = useCallback((leftHz: number, rightHz: number, leftEnabled: boolean, rightEnabled: boolean, leftWet: number, rightWet: number) => {
    if (refs.leftOscillatorRef.current && refs.leftOscGainRef.current) {
      refs.leftOscillatorRef.current.frequency.value = leftHz;
      refs.leftOscGainRef.current.gain.value = leftEnabled ? leftWet : 0;
    }
    if (refs.rightOscillatorRef.current && refs.rightOscGainRef.current) {
      refs.rightOscillatorRef.current.frequency.value = rightHz;
      refs.rightOscGainRef.current.gain.value = rightEnabled ? rightWet : 0;
    }

    // Don't auto-start oscillators - they should only play when recording is playing
    // The oscillators will be started/stopped by the playback control
  }, [refs.leftOscillatorRef, refs.rightOscillatorRef, refs.leftOscGainRef, refs.rightOscGainRef]);

  return { startIfEnabled, stopBoth, applyFrequency };
};


