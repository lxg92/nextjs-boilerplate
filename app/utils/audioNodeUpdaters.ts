import * as Tone from "tone/build/esm/index.js";
import type { ChannelConfig } from "../hooks/useAudioProcessing";

export type ChannelSide = "left" | "right";

// Effect categories for proper lifecycle management
export type EffectCategory = "dependent" | "independent";

export type NodeBundle = {
  gain: Tone.Gain | null;
  pan: Tone.Panner | null;
  reverb: Tone.Reverb | null;
  delay: Tone.PingPongDelay | null;
  oscillator: Tone.Oscillator | null;
  oscillatorGain: Tone.Gain | null;
  noise: Tone.Noise | null;
  noiseGain: Tone.Gain | null;
};

export type MasterNodes = {
  masterGain: Tone.Gain | null;
};

// Effect configuration with category information
export const EFFECT_CATEGORIES = {
  reverb: "dependent" as EffectCategory,
  delay: "dependent" as EffectCategory,
  frequency: "independent" as EffectCategory,
  noise: "independent" as EffectCategory,
} as const;

export const updateChannelParameters = (
  config: ChannelConfig,
  nodes: NodeBundle,
  isPlaying: boolean = false
) => {
  if (!nodes.gain || !nodes.pan || !nodes.reverb || !nodes.delay || !nodes.oscillator || !nodes.oscillatorGain || !nodes.noise || !nodes.noiseGain) {
    return;
  }

  // Volume and pan
  nodes.gain.gain.value = Tone.dbToGain(Tone.gainToDb(config.volume / 100));
  nodes.pan.pan.value = config.pan;

  // Dependent effects (Reverb, Delay) - only active when voice is playing
  if (isPlaying) {
    // Reverb
    nodes.reverb.decay = config.reverb.roomSize;
    nodes.reverb.wet.value = config.reverb.enabled ? config.reverb.wet : 0;

    // Delay
    nodes.delay.delayTime.value = config.delay.delayTime;
    nodes.delay.feedback.value = config.delay.feedback;
    nodes.delay.wet.value = config.delay.enabled ? config.delay.wet : 0;
  } else {
    // Disable dependent effects when not playing
    nodes.reverb.wet.value = 0;
    nodes.delay.wet.value = 0;
  }

  // Independent effects (Frequency) - controlled by enabled state AND playback state
  nodes.oscillator.frequency.value = config.frequency.frequency;
  
  // Independent effects should only be active when both enabled AND playing
  const shouldBeActive = config.frequency.enabled && isPlaying;
  
  if (shouldBeActive) {
    // Start oscillator if not already running
    if (nodes.oscillator.state !== "started") {
      try {
        nodes.oscillator.start();
      } catch (e) {
        // Oscillator might already be started, ignore error
      }
    }
    nodes.oscillatorGain.gain.value = config.frequency.wet;
  } else {
    // Stop oscillator when disabled OR when playback stops
    if (nodes.oscillator.state === "started") {
      try {
        nodes.oscillator.stop();
      } catch (e) {
        // Oscillator might already be stopped, ignore error
      }
    }
    nodes.oscillatorGain.gain.value = 0;
  }

  // Independent effects (Noise) - controlled by enabled state AND playback state
  nodes.noise.type = config.noise.type;
  
  // Independent effects should only be active when both enabled AND playing
  const noiseShouldBeActive = config.noise.enabled && isPlaying;
  
  if (noiseShouldBeActive) {
    // Start noise if not already running
    if (nodes.noise.state !== "started") {
      try {
        nodes.noise.start();
      } catch (e) {
        // Noise might already be started, ignore error
      }
    }
    nodes.noiseGain.gain.value = config.noise.wet;
  } else {
    // Stop noise when disabled OR when playback stops
    if (nodes.noise.state === "started") {
      try {
        nodes.noise.stop();
      } catch (e) {
        // Noise might already be stopped, ignore error
      }
    }
    nodes.noiseGain.gain.value = 0;
  }
};

export const updateMasterVolume = (masterVolume: number, masterGain: Tone.Gain | null) => {
  if (!masterGain) return;
  masterGain.gain.value = Tone.dbToGain(Tone.gainToDb(masterVolume / 100));
};

export const stopAllEffects = (leftNodes: NodeBundle, rightNodes: NodeBundle) => {
  // Stop dependent effects (reverb, delay) when playback ends
  if (leftNodes.reverb) leftNodes.reverb.wet.value = 0;
  if (leftNodes.delay) leftNodes.delay.wet.value = 0;
  if (rightNodes.reverb) rightNodes.reverb.wet.value = 0;
  if (rightNodes.delay) rightNodes.delay.wet.value = 0;
  
  // Stop independent effects (frequency) when playback ends
  // Independent effects should only run during playback
  if (leftNodes.oscillator && leftNodes.oscillator.state === "started") {
    try {
      leftNodes.oscillator.stop();
    } catch (e) {
      // Oscillator might already be stopped, ignore error
    }
  }
  if (rightNodes.oscillator && rightNodes.oscillator.state === "started") {
    try {
      rightNodes.oscillator.stop();
    } catch (e) {
      // Oscillator might already be stopped, ignore error
    }
  }
  if (leftNodes.oscillatorGain) leftNodes.oscillatorGain.gain.value = 0;
  if (rightNodes.oscillatorGain) rightNodes.oscillatorGain.gain.value = 0;

  // Stop independent effects (noise) when playback ends
  // Independent effects should only run during playback
  if (leftNodes.noise && leftNodes.noise.state === "started") {
    try {
      leftNodes.noise.stop();
    } catch (e) {
      // Noise might already be stopped, ignore error
    }
  }
  if (rightNodes.noise && rightNodes.noise.state === "started") {
    try {
      rightNodes.noise.stop();
    } catch (e) {
      // Noise might already be stopped, ignore error
    }
  }
  if (leftNodes.noiseGain) leftNodes.noiseGain.gain.value = 0;
  if (rightNodes.noiseGain) rightNodes.noiseGain.gain.value = 0;
};

// Helper function to get independent effects that should be active during playback
export const getActiveIndependentEffects = (config: ChannelConfig) => {
  const activeEffects: string[] = [];
  
  if (config.frequency.enabled) {
    activeEffects.push('frequency');
  }
  
  if (config.noise.enabled) {
    activeEffects.push('noise');
  }
  
  // Future independent effects can be added here
  // if (config.newEffect.enabled) {
  //   activeEffects.push('newEffect');
  // }
  
  return activeEffects;
};


