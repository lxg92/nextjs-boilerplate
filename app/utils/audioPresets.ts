import { ChannelConfig } from "../types";
import {
  DEFAULT_DELAY_CONFIG,
  DEFAULT_FREQUENCY_CONFIG,
  DEFAULT_ISOCHRONIC_CONFIG,
  DEFAULT_NOISE_CONFIG,
  DEFAULT_REVERB_CONFIG,
} from "../types/constants";

// Configuration type for presets (excludes runtime state)
export type AudioPresetConfig = {
  leftChannel: ChannelConfig;
  rightChannel: ChannelConfig;
  masterVolume: number;
};

export type AudioPreset = {
  name: string;
  description: string;
  config: AudioPresetConfig;
};

export const AUDIO_PRESETS: AudioPreset[] = [
  {
    name: "Mono",
    description: "Mono audio with equal volume on both channels",
    config: {
      leftChannel: {
        volume: 100,
        pan: 0,
        reverb: DEFAULT_REVERB_CONFIG,
        delay: DEFAULT_DELAY_CONFIG,
        frequency: DEFAULT_FREQUENCY_CONFIG,
        noise: DEFAULT_NOISE_CONFIG,
        isochronic: DEFAULT_ISOCHRONIC_CONFIG,
      },
      rightChannel: {
        volume: 100,
        pan: 0,
        reverb: DEFAULT_REVERB_CONFIG,
        delay: DEFAULT_DELAY_CONFIG,
        frequency: DEFAULT_FREQUENCY_CONFIG,
        noise: DEFAULT_NOISE_CONFIG,
        isochronic: DEFAULT_ISOCHRONIC_CONFIG,
      },
      masterVolume: 100,
    },
  },
  {
    name: "Stereo Separation",
    description: "Hard left/right separation for dramatic stereo effect",
    config: {
      leftChannel: {
        volume: 100,
        pan: -1,
        reverb: DEFAULT_REVERB_CONFIG,
        delay: DEFAULT_DELAY_CONFIG,
        frequency: DEFAULT_FREQUENCY_CONFIG,
        noise: DEFAULT_NOISE_CONFIG,
        isochronic: DEFAULT_ISOCHRONIC_CONFIG,
      },
      rightChannel: {
        volume: 100,
        pan: 1,
        reverb: DEFAULT_REVERB_CONFIG,
        delay: DEFAULT_DELAY_CONFIG,
        frequency: DEFAULT_FREQUENCY_CONFIG,
        noise: DEFAULT_NOISE_CONFIG,
        isochronic: DEFAULT_ISOCHRONIC_CONFIG,
      },
      masterVolume: 100,
    },
  },
  {
    name: "Cinematic Reverb",
    description: "Reverb on both channels for spacious, cinematic sound",
    config: {
      leftChannel: {
        volume: 110,
        pan: -0.3,
        reverb: { enabled: true, roomSize: 8, wet: 0.4 },
        delay: DEFAULT_DELAY_CONFIG,
        frequency: DEFAULT_FREQUENCY_CONFIG,
        noise: DEFAULT_NOISE_CONFIG,
        isochronic: DEFAULT_ISOCHRONIC_CONFIG,
      },
      rightChannel: {
        volume: 110,
        pan: 0.3,
        reverb: { enabled: true, roomSize: 8, wet: 0.4 },
        delay: DEFAULT_DELAY_CONFIG,
        frequency: DEFAULT_FREQUENCY_CONFIG,
        noise: DEFAULT_NOISE_CONFIG,
        isochronic: DEFAULT_ISOCHRONIC_CONFIG,
      },
      masterVolume: 95,
    },
  },
  {
    name: "Delay Echo",
    description: "Synchronized delay effects on both channels",
    config: {
      leftChannel: {
        volume: 90,
        pan: 0,
        reverb: DEFAULT_REVERB_CONFIG,
        delay: { enabled: true, delayTime: "4n", feedback: 0.4, wet: 0.25 },
        frequency: DEFAULT_FREQUENCY_CONFIG,
        noise: DEFAULT_NOISE_CONFIG,
        isochronic: DEFAULT_ISOCHRONIC_CONFIG,
      },
      rightChannel: {
        volume: 90,
        pan: 0,
        reverb: DEFAULT_REVERB_CONFIG,
        delay: { enabled: true, delayTime: "4n", feedback: 0.4, wet: 0.25 },
        frequency: DEFAULT_FREQUENCY_CONFIG,
        noise: DEFAULT_NOISE_CONFIG,
        isochronic: DEFAULT_ISOCHRONIC_CONFIG,
      },
      masterVolume: 105,
    },
  },
  {
    name: "Ambient Space",
    description: "Combined reverb and delay for atmospheric ambient sound",
    config: {
      leftChannel: {
        volume: 85,
        pan: -0.5,
        reverb: { enabled: true, roomSize: 6, wet: 0.5 },
        delay: { enabled: true, delayTime: "2n", feedback: 0.3, wet: 0.2 },
        frequency: DEFAULT_FREQUENCY_CONFIG,
        noise: DEFAULT_NOISE_CONFIG,
        isochronic: DEFAULT_ISOCHRONIC_CONFIG,
      },
      rightChannel: {
        volume: 85,
        pan: 0.5,
        reverb: { enabled: true, roomSize: 6, wet: 0.5 },
        delay: { enabled: true, delayTime: "2n", feedback: 0.3, wet: 0.2 },
        frequency: DEFAULT_FREQUENCY_CONFIG,
        noise: DEFAULT_NOISE_CONFIG,
        isochronic: DEFAULT_ISOCHRONIC_CONFIG,
      },
      masterVolume: 110,
    },
  },
  {
    name: "Wide Stereo",
    description: "Moderately wide stereo field with subtle effects",
    config: {
      leftChannel: {
        volume: 105,
        pan: -0.7,
        reverb: { enabled: true, roomSize: 4, wet: 0.2 },
        delay: DEFAULT_DELAY_CONFIG,
        frequency: DEFAULT_FREQUENCY_CONFIG,
        noise: DEFAULT_NOISE_CONFIG,
        isochronic: DEFAULT_ISOCHRONIC_CONFIG,
      },
      rightChannel: {
        volume: 105,
        pan: 0.7,
        reverb: { enabled: true, roomSize: 4, wet: 0.2 },
        delay: DEFAULT_DELAY_CONFIG,
        frequency: DEFAULT_FREQUENCY_CONFIG,
        noise: DEFAULT_NOISE_CONFIG,
        isochronic: DEFAULT_ISOCHRONIC_CONFIG,
      },
      masterVolume: 100,
    },
  },
  {
    name: "Alpha Binaural Beat",
    description: "10Hz binaural beat for relaxation and focus (250Hz vs 260Hz)",
    config: {
      leftChannel: {
        volume: 100,
        pan: -0.5,
        reverb: DEFAULT_REVERB_CONFIG,
        delay: DEFAULT_DELAY_CONFIG,
        frequency: { enabled: true, frequency: 250, wet: 0.3 },
        noise: DEFAULT_NOISE_CONFIG,
        isochronic: DEFAULT_ISOCHRONIC_CONFIG,
      },
      rightChannel: {
        volume: 100,
        pan: 0.5,
        reverb: DEFAULT_REVERB_CONFIG,
        delay: DEFAULT_DELAY_CONFIG,
        frequency: { enabled: true, frequency: 260, wet: 0.3 },
        noise: DEFAULT_NOISE_CONFIG,
        isochronic: DEFAULT_ISOCHRONIC_CONFIG,
      },
      masterVolume: 100,
    },
  },
  {
    name: "Theta Binaural Beat",
    description: "6Hz binaural beat for deep meditation (150Hz vs 156Hz)",
    config: {
      leftChannel: {
        volume: 100,
        pan: -0.5,
        reverb: DEFAULT_REVERB_CONFIG,
        delay: DEFAULT_DELAY_CONFIG,
        frequency: { enabled: true, frequency: 150, wet: 0.4 },
        noise: DEFAULT_NOISE_CONFIG,
        isochronic: DEFAULT_ISOCHRONIC_CONFIG,
      },
      rightChannel: {
        volume: 100,
        pan: 0.5,
        reverb: DEFAULT_REVERB_CONFIG,
        delay: DEFAULT_DELAY_CONFIG,
        frequency: { enabled: true, frequency: 156, wet: 0.4 },
        noise: DEFAULT_NOISE_CONFIG,
        isochronic: DEFAULT_ISOCHRONIC_CONFIG,
      },
      masterVolume: 100,
    },
  },
  {
    name: "Beta Binaural Beat",
    description: "20Hz binaural beat for alertness and concentration (300Hz vs 320Hz)",
    config: {
      leftChannel: {
        volume: 100,
        pan: -0.5,
        reverb: DEFAULT_REVERB_CONFIG,
        delay: DEFAULT_DELAY_CONFIG,
        frequency: { enabled: true, frequency: 300, wet: 0.25 },
        noise: DEFAULT_NOISE_CONFIG,
        isochronic: DEFAULT_ISOCHRONIC_CONFIG,
      },
      rightChannel: {
        volume: 100,
        pan: 0.5,
        reverb: DEFAULT_REVERB_CONFIG,
        delay: DEFAULT_DELAY_CONFIG,
        frequency: { enabled: true, frequency: 320, wet: 0.25 },
        noise: DEFAULT_NOISE_CONFIG,
        isochronic: DEFAULT_ISOCHRONIC_CONFIG,
      },
      masterVolume: 100,
    },
  },
  {
    name: "Delta Binaural Beat",
    description: "2Hz binaural beat for deep sleep (75Hz vs 77Hz)",
    config: {
      leftChannel: {
        volume: 100,
        pan: -0.5,
        reverb: DEFAULT_REVERB_CONFIG,
        delay: DEFAULT_DELAY_CONFIG,
        frequency: { enabled: true, frequency: 75, wet: 0.5 },
        noise: DEFAULT_NOISE_CONFIG,
        isochronic: DEFAULT_ISOCHRONIC_CONFIG,
      },
      rightChannel: {
        volume: 100,
        pan: 0.5,
        reverb: DEFAULT_REVERB_CONFIG,
        delay: DEFAULT_DELAY_CONFIG,
        frequency: { enabled: true, frequency: 77, wet: 0.5 },
        noise: DEFAULT_NOISE_CONFIG,
        isochronic: DEFAULT_ISOCHRONIC_CONFIG,
      },
      masterVolume: 100,
    },
  },
  {
    name: "Brown Noise Ambience",
    description: "Brown noise with subtle binaural beat for deep relaxation (50Hz vs 54Hz)",
    config: {
      leftChannel: {
        volume: 100,
        pan: -0.5,
        reverb: { enabled: true, roomSize: 4, wet: 0.2 },
        delay: DEFAULT_DELAY_CONFIG,
        frequency: { enabled: true, frequency: 50, wet: 0.2 },
        noise: { enabled: true, type: "brown", wet: 0.4 },
        isochronic: DEFAULT_ISOCHRONIC_CONFIG,
      },
      rightChannel: {
        volume: 100,
        pan: 0.5,
        reverb: { enabled: true, roomSize: 4, wet: 0.2 },
        delay: DEFAULT_DELAY_CONFIG,
        frequency: { enabled: true, frequency: 54, wet: 0.2 },
        noise: { enabled: true, type: "brown", wet: 0.4 },
        isochronic: DEFAULT_ISOCHRONIC_CONFIG,
      },
      masterVolume: 100,
    },
  },
];
