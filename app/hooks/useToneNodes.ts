"use client";

import { useCallback, useRef } from "react";
import * as Tone from "tone/build/esm/index.js";
import { AudioProcessingState } from "./useAudioProcessing";

export const useToneNodes = () => {
  const playerRef = useRef<Tone.Player | null>(null);
  const leftGainRef = useRef<Tone.Gain | null>(null);
  const rightGainRef = useRef<Tone.Gain | null>(null);
  const leftPanRef = useRef<Tone.Panner | null>(null);
  const rightPanRef = useRef<Tone.Panner | null>(null);
  const leftReverbRef = useRef<Tone.Reverb | null>(null);
  const rightReverbRef = useRef<Tone.Reverb | null>(null);
  const leftDelayRef = useRef<Tone.PingPongDelay | null>(null);
  const rightDelayRef = useRef<Tone.PingPongDelay | null>(null);
  const leftOscillatorRef = useRef<Tone.Oscillator | null>(null);
  const rightOscillatorRef = useRef<Tone.Oscillator | null>(null);
  const leftOscGainRef = useRef<Tone.Gain | null>(null);
  const rightOscGainRef = useRef<Tone.Gain | null>(null);
  const masterGainRef = useRef<Tone.Gain | null>(null);

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
      leftOscillatorRef.current,
      rightOscillatorRef.current,
      leftOscGainRef.current,
      rightOscGainRef.current,
      masterGainRef.current,
    ].forEach((node) => node?.dispose());

    playerRef.current = null;
    leftGainRef.current = null;
    rightGainRef.current = null;
    leftPanRef.current = null;
    rightPanRef.current = null;
    leftReverbRef.current = null;
    rightReverbRef.current = null;
    leftDelayRef.current = null;
    rightDelayRef.current = null;
    leftOscillatorRef.current = null;
    rightOscillatorRef.current = null;
    leftOscGainRef.current = null;
    rightOscGainRef.current = null;
    masterGainRef.current = null;
  }, []);

  const createAudioChain = useCallback(async (audioUrl: string, state: AudioProcessingState) => {
    if (Tone.context.state !== "running") {
      await Tone.start();
    }

    cleanup();

    const player = new Tone.Player(audioUrl);
    player.loop = state.loop;

    const leftGain = new Tone.Gain();
    const rightGain = new Tone.Gain();
    const leftPan = new Tone.Panner();
    const rightPan = new Tone.Panner();
    const leftReverb = new Tone.Reverb();
    const rightReverb = new Tone.Reverb();
    const leftDelay = new Tone.PingPongDelay();
    const rightDelay = new Tone.PingPongDelay();
    const leftOscillator = new Tone.Oscillator(state.leftChannel.frequency.frequency, "sine");
    const rightOscillator = new Tone.Oscillator(state.rightChannel.frequency.frequency, "sine");
    const leftOscGain = new Tone.Gain();
    const rightOscGain = new Tone.Gain();
    const masterGain = new Tone.Gain();

    // Configure effects
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

    // Oscillators
    leftOscillator.frequency.value = state.leftChannel.frequency.frequency;
    rightOscillator.frequency.value = state.rightChannel.frequency.frequency;
    leftOscGain.gain.value = state.leftChannel.frequency.enabled ? state.leftChannel.frequency.wet : 0;
    rightOscGain.gain.value = state.rightChannel.frequency.enabled ? state.rightChannel.frequency.wet : 0;

    // Pan/volume
    leftPan.pan.value = state.leftChannel.pan;
    rightPan.pan.value = state.rightChannel.pan;
    leftGain.gain.value = Tone.dbToGain(Tone.gainToDb(state.leftChannel.volume / 100));
    rightGain.gain.value = Tone.dbToGain(Tone.gainToDb(state.rightChannel.volume / 100));
    masterGain.gain.value = Tone.dbToGain(Tone.gainToDb(state.masterVolume / 100));

    // Chain
    player.fan(leftDelay, rightDelay);
    leftDelay.chain(leftReverb, leftGain, leftPan, masterGain);
    rightDelay.chain(rightReverb, rightGain, rightPan, masterGain);
    leftOscillator.chain(leftOscGain, masterGain);
    rightOscillator.chain(rightOscGain, masterGain);
    masterGain.toDestination();

    // Refs
    playerRef.current = player;
    leftGainRef.current = leftGain;
    rightGainRef.current = rightGain;
    leftPanRef.current = leftPan;
    rightPanRef.current = rightPan;
    leftReverbRef.current = leftReverb;
    rightReverbRef.current = rightReverb;
    leftDelayRef.current = leftDelay;
    rightDelayRef.current = rightDelay;
    leftOscillatorRef.current = leftOscillator;
    rightOscillatorRef.current = rightOscillator;
    leftOscGainRef.current = leftOscGain;
    rightOscGainRef.current = rightOscGain;
    masterGainRef.current = masterGain;

    // Oscillators are created but not started - they will be controlled by playback state
    // Independent effects only run when voice playback is active

    return { loaded: player.loaded };
  }, [cleanup]);

  return {
    // refs
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
    masterGainRef,
    // actions
    createAudioChain,
    cleanup,
  };
};


