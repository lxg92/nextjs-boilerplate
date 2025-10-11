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