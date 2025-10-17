"use client";

import { useCallback, useRef } from "react";
import * as Tone from "tone/build/esm/index.js";
import { AudioProcessingState, ChannelConfig } from "./useAudioProcessing";

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
  const leftNoiseRef = useRef<Tone.Noise | null>(null);
  const rightNoiseRef = useRef<Tone.Noise | null>(null);
  const leftNoiseGainRef = useRef<Tone.Gain | null>(null);
  const rightNoiseGainRef = useRef<Tone.Gain | null>(null);
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
      leftNoiseRef.current,
      rightNoiseRef.current,
      leftNoiseGainRef.current,
      rightNoiseGainRef.current,
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
    leftNoiseRef.current = null;
    rightNoiseRef.current = null;
    leftNoiseGainRef.current = null;
    rightNoiseGainRef.current = null;
    masterGainRef.current = null;
  }, []);

  // Helper function to configure effects for a channel
  const configureChannelEffects = useCallback((
    channelConfig: ChannelConfig,
    reverb: Tone.Reverb,
    delay: Tone.PingPongDelay,
    oscillator: Tone.Oscillator,
    oscGain: Tone.Gain,
    noise: Tone.Noise,
    noiseGain: Tone.Gain
  ) => {
    // Configure reverb
    reverb.decay = channelConfig.reverb.roomSize;
    reverb.wet.value = channelConfig.reverb.enabled ? channelConfig.reverb.wet : 0;

    // Configure delay
    delay.delayTime.value = channelConfig.delay.delayTime;
    delay.feedback.value = channelConfig.delay.feedback;
    delay.wet.value = channelConfig.delay.enabled ? channelConfig.delay.wet : 0;

    // Configure oscillator
    oscillator.frequency.value = channelConfig.frequency.frequency;
    oscGain.gain.value = channelConfig.frequency.enabled ? channelConfig.frequency.wet : 0;

    // Configure noise
    noise.type = channelConfig.noise.type;
    noiseGain.gain.value = channelConfig.noise.enabled ? channelConfig.noise.wet : 0;
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
    const leftNoise = new Tone.Noise(state.leftChannel.noise.type);
    const rightNoise = new Tone.Noise(state.rightChannel.noise.type);
    const leftNoiseGain = new Tone.Gain();
    const rightNoiseGain = new Tone.Gain();
    const masterGain = new Tone.Gain();

    // Configure effects using helper function
    configureChannelEffects(state.leftChannel, leftReverb, leftDelay, leftOscillator, leftOscGain, leftNoise, leftNoiseGain);
    configureChannelEffects(state.rightChannel, rightReverb, rightDelay, rightOscillator, rightOscGain, rightNoise, rightNoiseGain);

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
    leftOscillator.chain(leftOscGain, leftPan, masterGain);
    rightOscillator.chain(rightOscGain, rightPan, masterGain);
    leftNoise.chain(leftNoiseGain, leftPan, masterGain);
    rightNoise.chain(rightNoiseGain, rightPan, masterGain);
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
    leftNoiseRef.current = leftNoise;
    rightNoiseRef.current = rightNoise;
    leftNoiseGainRef.current = leftNoiseGain;
    rightNoiseGainRef.current = rightNoiseGain;
    masterGainRef.current = masterGain;

    // Oscillators are created but not started - they will be controlled by playback state
    // Independent effects only run when voice playback is active

    return { loaded: player.loaded };
  }, [cleanup, configureChannelEffects]);

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
    leftNoiseRef,
    rightNoiseRef,
    leftNoiseGainRef,
    rightNoiseGainRef,
    masterGainRef,
    // actions
    createAudioChain,
    cleanup,
  };
};


