import * as Tone from "tone/build/esm/index.js";
import type { ChannelConfig } from "../hooks/useAudioProcessing";

export type ChannelSide = "left" | "right";

export type NodeBundle = {
  gain: Tone.Gain | null;
  pan: Tone.Panner | null;
  reverb: Tone.Reverb | null;
  delay: Tone.PingPongDelay | null;
  oscillator: Tone.Oscillator | null;
  oscillatorGain: Tone.Gain | null;
};

export type MasterNodes = {
  masterGain: Tone.Gain | null;
};

export const updateChannelParameters = (
  config: ChannelConfig,
  nodes: NodeBundle,
  isPlaying: boolean = false
) => {
  if (!nodes.gain || !nodes.pan || !nodes.reverb || !nodes.delay || !nodes.oscillator || !nodes.oscillatorGain) {
    return;
  }

  // Volume and pan
  nodes.gain.gain.value = Tone.dbToGain(Tone.gainToDb(config.volume / 100));
  nodes.pan.pan.value = config.pan;

  // Reverb
  nodes.reverb.decay = config.reverb.roomSize;
  nodes.reverb.wet.value = config.reverb.enabled ? config.reverb.wet : 0;

  // Delay
  nodes.delay.delayTime.value = config.delay.delayTime;
  nodes.delay.feedback.value = config.delay.feedback;
  nodes.delay.wet.value = config.delay.enabled ? config.delay.wet : 0;

  // Oscillator
  nodes.oscillator.frequency.value = config.frequency.frequency;
  nodes.oscillatorGain.gain.value = config.frequency.enabled ? config.frequency.wet : 0;
  
  // Handle oscillator start/stop during playback
  if (isPlaying) {
    if (config.frequency.enabled) {
      try { nodes.oscillator.start(); } catch {}
    } else {
      try { nodes.oscillator.stop(); } catch {}
    }
  }
};

export const updateMasterVolume = (masterVolume: number, masterGain: Tone.Gain | null) => {
  if (!masterGain) return;
  masterGain.gain.value = Tone.dbToGain(Tone.gainToDb(masterVolume / 100));
};

export const stopAllEffects = (leftNodes: NodeBundle, rightNodes: NodeBundle) => {
  // Stop oscillators
  try { leftNodes.oscillator?.stop(); } catch {}
  try { rightNodes.oscillator?.stop(); } catch {}
  
  // Reset effect wet levels to 0
  if (leftNodes.reverb) leftNodes.reverb.wet.value = 0;
  if (leftNodes.delay) leftNodes.delay.wet.value = 0;
  if (rightNodes.reverb) rightNodes.reverb.wet.value = 0;
  if (rightNodes.delay) rightNodes.delay.wet.value = 0;
};


