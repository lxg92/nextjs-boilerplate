"use client";

import { Recording } from "../types";
import { AudioPlayer } from "./AudioPlayer";
import { useTierEmulation } from "../contexts/TierEmulationContext";

interface VoiceRecordingsRouteProps {
  recordings: Recording[];
  currentRecordingId: string | null;
  onRecordingSelect: (recordingId: string) => void;
}

const formatTimestamp = (timestamp: number): string => {
  const date = new Date(timestamp);
  return date.toLocaleString();
};

const formatTextPreview = (text: string, maxLength: number = 100): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + "...";
};

export const VoiceRecordingsRoute = ({ 
  recordings, 
  currentRecordingId, 
  onRecordingSelect 
}: VoiceRecordingsRouteProps) => {
  const { actualTier } = useTierEmulation();
  const currentRecording = recordings.find(r => r.id === currentRecordingId);

  if (recordings.length === 0) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Voice Recordings
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Your generated voice recordings will appear here
          </p>
        </div>

        {/* Empty State */}
        <div className="max-w-2xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8 shadow-sm text-center">
            <div className="text-6xl mb-6">🎵</div>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              No Recordings Yet
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Generate your first voice recording using the Generate Speech tab
            </p>
            
            <div className="inline-flex items-center px-4 py-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg text-blue-700 dark:text-blue-300">
              <span className="mr-2">🎤</span>
              Go to Generate Speech to create your first recording
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Voice Recordings
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Browse and manage your voice recordings ({recordings.length} total)
        </p>
      </div>

      <div className="max-w-6xl mx-auto space-y-6">
        {/* Recordings List */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Your Recordings
          </h2>
          
          <div className="space-y-3">
            {recordings.map((recording) => (
              <div 
                key={recording.id}
                className={`p-4 rounded-lg border transition-colors cursor-pointer ${
                  currentRecordingId === recording.id
                    ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
                    : "bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}
                onClick={() => onRecordingSelect(recording.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                        {recording.voiceName}
                      </h3>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {recording.speed}x speed
                      </span>
                      {currentRecordingId === recording.id && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200">
                          Currently Playing
                        </span>
                      )}
                    </div>
                    
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      {formatTextPreview(recording.text)}
                    </p>
                    
                    <p className="text-xs text-gray-500 dark:text-gray-500">
                      Generated {formatTimestamp(recording.timestamp)}
                    </p>
                  </div>
                  
                  <div className="ml-4 flex-shrink-0">
                    <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-gray-500 dark:text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM15.657 6.343a1 1 0 011.414 0A9.972 9.972 0 0119 12a9.972 9.972 0 01-1.929 5.657 1 1 0 11-1.414-1.414A7.971 7.971 0 0017 12a7.971 7.971 0 00-1.343-4.243 1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Audio Player */}
        {currentRecording && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Audio Playback & Channel Control
            </h2>
            
            {/* Recording Info */}
            <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                {currentRecording.voiceName}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                Speed: {currentRecording.speed}x
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Generated: {formatTimestamp(currentRecording.timestamp)}
              </p>
            </div>

            {/* Audio Player Component */}
            <AudioPlayer audioUrl={currentRecording.audioUrl} actualTier={actualTier} />
          </div>
        )}
      </div>
    </div>
  );
};