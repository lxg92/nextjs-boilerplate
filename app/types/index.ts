export interface Voice {
  voice_id: string;
  name: string;
  category?: string;
}

export interface VoicesResponse {
  voices: Voice[];
}

export interface CreateIVCResponse {
  voice_id: string;
}

export interface DeleteVoiceRequest {
  voiceId: string;
}

export interface TTSRequest {
  voiceId: string;
  text: string;
  speed: number;
}

export interface AuthData {
  timestamp: number;
}

export interface VoiceUploadData {
  file: File;
  name: string;
}

export interface PlaybackProgress {
  currentTime: number; // in seconds
  duration: number; // in seconds
  progress: number; // 0-1 percentage
}

export interface Recording {
  id: string;
  audioUrl: string;
  voiceId: string;
  voiceName: string;
  text: string;
  speed: number;
  timestamp: number;
  audioConfig?: any; // Optional audio configuration for future preset saving
}

export interface ChannelConfig {
  volume: number; // 0-200%
  pan: number; // -1 to 1
  reverb: {
    enabled: boolean;
    roomSize: number; // 0.1-10
    wet: number; // 0-1
  };
  delay: {
    enabled: boolean;
    delayTime: string; // Tone.Time notation
    feedback: number; // 0-0.9
    wet: number; // 0-1
  };
  frequency: {
    enabled: boolean;
    frequency: number; // Hz
    wet: number; // 0-1
  };
  noise: {
    enabled: boolean;
    type: "brown" | "pink" | "white";
    wet: number; // 0-1
  };
}

export interface AudioProcessingState {
  leftChannel: ChannelConfig;
  rightChannel: ChannelConfig;
  masterVolume: number;
  isPlaying: boolean;
  isLoading: boolean;
  bufferLoaded: boolean;
  loop: boolean;
  playbackProgress: {
    currentTime: number;
    duration: number;
    progress: number;
  };
}