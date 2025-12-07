import { ChannelConfig } from ".";

type ReverbConfig = ChannelConfig["reverb"];
type DelayConfig = ChannelConfig["delay"];
type FrequencyConfig = ChannelConfig["frequency"];
type NoiseConfig = ChannelConfig["noise"];
type IsochronicConfig = ChannelConfig["isochronic"];

export const DEFAULT_REVERB_CONFIG: ReverbConfig = {
  enabled: false,
  roomSize: 3,
  wet: 0.3,
};

export const DEFAULT_DELAY_CONFIG: DelayConfig = {
  enabled: false,
  delayTime: "8n",
  feedback: 0.3,
  wet: 0.3,
};

export const DEFAULT_FREQUENCY_CONFIG: FrequencyConfig = {
  enabled: false,
  frequency: 260,
  wet: 0.5,
};

export const DEFAULT_NOISE_CONFIG: NoiseConfig = {
  enabled: false,
  type: "white",
  wet: 0.3,
};

export const DEFAULT_ISOCHRONIC_CONFIG: IsochronicConfig = {
  enabled: false,
  carrierFrequency: 136.1,
  pulseRate: 8,
  wet: 0.4,
};

export const DEFAULT_CHANNEL_CONFIG: ChannelConfig = {
  volume: 100,
  pan: 0,
  reverb: DEFAULT_REVERB_CONFIG,
  delay: DEFAULT_DELAY_CONFIG,
  frequency: DEFAULT_FREQUENCY_CONFIG,
  noise: DEFAULT_NOISE_CONFIG,
  isochronic: DEFAULT_ISOCHRONIC_CONFIG,
};

