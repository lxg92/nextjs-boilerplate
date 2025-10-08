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
      },
      rightChannel: {
        volume: 100,
        pan: 0,
        reverb: { enabled: false, roomSize: 3, wet: 0.3 },
        delay: { enabled: false, delayTime: "8n", feedback: 0.3, wet: 0.3 },
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
      },
      rightChannel: {
        volume: 100,
        pan: 1,
        reverb: { enabled: false, roomSize: 3, wet: 0.3 },
        delay: { enabled: false, delayTime: "8n", feedback: 0.3, wet: 0.3 },
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
      },
      rightChannel: {
        volume: 110,
        pan: 0.3,
        reverb: { enabled: true, roomSize: 8, wet: 0.4 },
        delay: { enabled: false, delayTime: "8n", feedback: 0.3, wet: 0.3 },
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
      },
      rightChannel: {
        volume: 90,
        pan: 0,
        reverb: { enabled: false, roomSize: 3, wet: 0.3 },
        delay: { enabled: true, delayTime: "4n", feedback: 0.4, wet: 0.25 },
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
      },
      rightChannel: {
        volume: 85,
        pan: 0.5,
        reverb: { enabled: true, roomSize: 6, wet: 0.5 },
        delay: { enabled: true, delayTime: "2n", feedback: 0.3, wet: 0.2 },
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
      },
      rightChannel: {
        volume: 105,
        pan: 0.7,
        reverb: { enabled: true, roomSize: 4, wet: 0.2 },
        delay: { enabled: false, delayTime: "8n", feedback: 0.3, wet: 0.3 },
      },
      masterVolume: 100,
    },
  },
];
