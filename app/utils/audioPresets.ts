import { ChannelConfig } from "../hooks/useAudioProcessing";

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
        reverb: { enabled: false, roomSize: 3, wet: 0.3 },
        delay: { enabled: false, delayTime: "8n", feedback: 0.3, wet: 0.3 },
        frequency: { enabled: false, frequency: 500, wet: 0.5 },
        noise: { enabled: false, type: "white", wet: 0.3 },
      },
      rightChannel: {
        volume: 100,
        pan: 0,
        reverb: { enabled: false, roomSize: 3, wet: 0.3 },
        delay: { enabled: false, delayTime: "8n", feedback: 0.3, wet: 0.3 },
        frequency: { enabled: false, frequency: 500, wet: 0.5 },
        noise: { enabled: false, type: "white", wet: 0.3 },
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
        reverb: { enabled: false, roomSize: 3, wet: 0.3 },
        delay: { enabled: false, delayTime: "8n", feedback: 0.3, wet: 0.3 },
        frequency: { enabled: false, frequency: 500, wet: 0.5 },
        noise: { enabled: false, type: "white", wet: 0.3 },
      },
      rightChannel: {
        volume: 100,
        pan: 1,
        reverb: { enabled: false, roomSize: 3, wet: 0.3 },
        delay: { enabled: false, delayTime: "8n", feedback: 0.3, wet: 0.3 },
        frequency: { enabled: false, frequency: 500, wet: 0.5 },
        noise: { enabled: false, type: "white", wet: 0.3 },
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
        delay: { enabled: false, delayTime: "8n", feedback: 0.3, wet: 0.3 },
        frequency: { enabled: false, frequency: 500, wet: 0.5 },
        noise: { enabled: false, type: "white", wet: 0.3 },
      },
      rightChannel: {
        volume: 110,
        pan: 0.3,
        reverb: { enabled: true, roomSize: 8, wet: 0.4 },
        delay: { enabled: false, delayTime: "8n", feedback: 0.3, wet: 0.3 },
        frequency: { enabled: false, frequency: 500, wet: 0.5 },
        noise: { enabled: false, type: "white", wet: 0.3 },
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
        reverb: { enabled: false, roomSize: 3, wet: 0.3 },
        delay: { enabled: true, delayTime: "4n", feedback: 0.4, wet: 0.25 },
        frequency: { enabled: false, frequency: 500, wet: 0.5 },
        noise: { enabled: false, type: "white", wet: 0.3 },
      },
      rightChannel: {
        volume: 90,
        pan: 0,
        reverb: { enabled: false, roomSize: 3, wet: 0.3 },
        delay: { enabled: true, delayTime: "4n", feedback: 0.4, wet: 0.25 },
        frequency: { enabled: false, frequency: 500, wet: 0.5 },
        noise: { enabled: false, type: "white", wet: 0.3 },
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
        frequency: { enabled: false, frequency: 500, wet: 0.5 },
        noise: { enabled: false, type: "white", wet: 0.3 },
      },
      rightChannel: {
        volume: 85,
        pan: 0.5,
        reverb: { enabled: true, roomSize: 6, wet: 0.5 },
        delay: { enabled: true, delayTime: "2n", feedback: 0.3, wet: 0.2 },
        frequency: { enabled: false, frequency: 500, wet: 0.5 },
        noise: { enabled: false, type: "white", wet: 0.3 },
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
        delay: { enabled: false, delayTime: "8n", feedback: 0.3, wet: 0.3 },
        frequency: { enabled: false, frequency: 500, wet: 0.5 },
        noise: { enabled: false, type: "white", wet: 0.3 },
      },
      rightChannel: {
        volume: 105,
        pan: 0.7,
        reverb: { enabled: true, roomSize: 4, wet: 0.2 },
        delay: { enabled: false, delayTime: "8n", feedback: 0.3, wet: 0.3 },
        frequency: { enabled: false, frequency: 500, wet: 0.5 },
        noise: { enabled: false, type: "white", wet: 0.3 },
      },
      masterVolume: 100,
    },
  },
  {
    name: "Alpha Binaural Beat",
    description: "10Hz binaural beat for relaxation and focus (500Hz vs 510Hz)",
    config: {
      leftChannel: {
        volume: 100,
        pan: 0,
        reverb: { enabled: false, roomSize: 3, wet: 0.3 },
        delay: { enabled: false, delayTime: "8n", feedback: 0.3, wet: 0.3 },
        frequency: { enabled: true, frequency: 500, wet: 0.3 },
        noise: { enabled: false, type: "white", wet: 0.3 },
      },
      rightChannel: {
        volume: 100,
        pan: 0,
        reverb: { enabled: false, roomSize: 3, wet: 0.3 },
        delay: { enabled: false, delayTime: "8n", feedback: 0.3, wet: 0.3 },
        frequency: { enabled: true, frequency: 510, wet: 0.3 },
        noise: { enabled: false, type: "white", wet: 0.3 },
      },
      masterVolume: 100,
    },
  },
  {
    name: "Theta Binaural Beat",
    description: "6Hz binaural beat for deep meditation (300Hz vs 306Hz)",
    config: {
      leftChannel: {
        volume: 100,
        pan: 0,
        reverb: { enabled: false, roomSize: 3, wet: 0.3 },
        delay: { enabled: false, delayTime: "8n", feedback: 0.3, wet: 0.3 },
        frequency: { enabled: true, frequency: 300, wet: 0.4 },
        noise: { enabled: false, type: "white", wet: 0.3 },
      },
      rightChannel: {
        volume: 100,
        pan: 0,
        reverb: { enabled: false, roomSize: 3, wet: 0.3 },
        delay: { enabled: false, delayTime: "8n", feedback: 0.3, wet: 0.3 },
        frequency: { enabled: true, frequency: 306, wet: 0.4 },
        noise: { enabled: false, type: "white", wet: 0.3 },
      },
      masterVolume: 100,
    },
  },
  {
    name: "Beta Binaural Beat",
    description: "20Hz binaural beat for alertness and concentration (600Hz vs 620Hz)",
    config: {
      leftChannel: {
        volume: 100,
        pan: 0,
        reverb: { enabled: false, roomSize: 3, wet: 0.3 },
        delay: { enabled: false, delayTime: "8n", feedback: 0.3, wet: 0.3 },
        frequency: { enabled: true, frequency: 600, wet: 0.25 },
        noise: { enabled: false, type: "white", wet: 0.3 },
      },
      rightChannel: {
        volume: 100,
        pan: 0,
        reverb: { enabled: false, roomSize: 3, wet: 0.3 },
        delay: { enabled: false, delayTime: "8n", feedback: 0.3, wet: 0.3 },
        frequency: { enabled: true, frequency: 620, wet: 0.25 },
        noise: { enabled: false, type: "white", wet: 0.3 },
      },
      masterVolume: 100,
    },
  },
  {
    name: "Delta Binaural Beat",
    description: "2Hz binaural beat for deep sleep (150Hz vs 152Hz)",
    config: {
      leftChannel: {
        volume: 100,
        pan: 0,
        reverb: { enabled: false, roomSize: 3, wet: 0.3 },
        delay: { enabled: false, delayTime: "8n", feedback: 0.3, wet: 0.3 },
        frequency: { enabled: true, frequency: 150, wet: 0.5 },
        noise: { enabled: false, type: "white", wet: 0.3 },
      },
      rightChannel: {
        volume: 100,
        pan: 0,
        reverb: { enabled: false, roomSize: 3, wet: 0.3 },
        delay: { enabled: false, delayTime: "8n", feedback: 0.3, wet: 0.3 },
        frequency: { enabled: true, frequency: 152, wet: 0.5 },
        noise: { enabled: false, type: "white", wet: 0.3 },
      },
      masterVolume: 100,
    },
  },
  {
    name: "Brown Noise Ambience",
    description: "Brown noise with subtle binaural beat for deep relaxation (100Hz vs 104Hz)",
    config: {
      leftChannel: {
        volume: 100,
        pan: 0,
        reverb: { enabled: true, roomSize: 4, wet: 0.2 },
        delay: { enabled: false, delayTime: "8n", feedback: 0.3, wet: 0.3 },
        frequency: { enabled: true, frequency: 100, wet: 0.2 },
        noise: { enabled: true, type: "brown", wet: 0.4 },
      },
      rightChannel: {
        volume: 100,
        pan: 0,
        reverb: { enabled: true, roomSize: 4, wet: 0.2 },
        delay: { enabled: false, delayTime: "8n", feedback: 0.3, wet: 0.3 },
        frequency: { enabled: true, frequency: 104, wet: 0.2 },
        noise: { enabled: true, type: "brown", wet: 0.4 },
      },
      masterVolume: 100,
    },
  },
];
