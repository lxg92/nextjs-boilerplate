"use client";

import { useState } from "react";
import { AuthGuard, useAuthContext } from "./components/AuthGuard";
import { Navigation, AppRoute } from "./components/Navigation";
import { VoiceUploadRoute } from "./components/VoiceUploadRoute";
import { VoiceSelectionRoute } from "./components/VoiceSelectionRoute";
import { VoiceRecordingsRoute } from "./components/VoiceRecordingsRoute";
import { Recording } from "./types";

const MainContent = () => {
  const { logout } = useAuthContext();
  const [currentRoute, setCurrentRoute] = useState<AppRoute>("upload");
  const [selectedVoiceId, setSelectedVoiceId] = useState<string | null>(null);
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [currentRecordingId, setCurrentRecordingId] = useState<string | null>(null);

  const handleRouteChange = (route: AppRoute) => {
    setCurrentRoute(route);
  };

  const handleUploadSuccess = (voiceId: string) => {
    setSelectedVoiceId(voiceId);
    // Automatically switch to generate route after successful upload
    setCurrentRoute("generate");
  };

  const handleVoiceSelect = (voiceId: string) => {
    setSelectedVoiceId(voiceId);
  };

  const handleTTSSuccess = (audioUrl: string, voiceId: string, voiceName: string, text: string, speed: number) => {
    const recording: Recording = {
      id: `recording_${Date.now()}`,
      audioUrl,
      voiceId,
      voiceName,
      text,
      speed,
      timestamp: Date.now()
    };
    
    setRecordings(prev => [recording, ...prev]);
    setCurrentRecordingId(recording.id);
    setCurrentRoute("recordings");
  };

  const renderCurrentRoute = () => {
    switch (currentRoute) {
      case "upload":
        return <VoiceUploadRoute onUploadSuccess={handleUploadSuccess} />;
      case "generate":
        return (
          <VoiceSelectionRoute 
            selectedVoiceId={selectedVoiceId || undefined}
            onVoiceSelect={handleVoiceSelect}
            onTTSSuccess={handleTTSSuccess}
          />
        );
      case "recordings":
        return (
          <VoiceRecordingsRoute 
            recordings={recordings}
            currentRecordingId={currentRecordingId}
            onRecordingSelect={(recordingId) => setCurrentRecordingId(recordingId)}
          />
        );
      default:
        return <VoiceUploadRoute onUploadSuccess={handleUploadSuccess} />;
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo/Title */}
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                Voice App
              </h1>
            </div>

            {/* Navigation */}
            <div className="flex items-center space-x-4">
              <Navigation 
                currentRoute={currentRoute} 
                onRouteChange={handleRouteChange}
                onLogout={logout}
              />
              
              {/* Logout Button */}
              <button
                onClick={logout}
                className="hidden sm:inline-flex items-center px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderCurrentRoute()}
      </div>

      {/* Mobile Logout Button */}
      <div className="sm:hidden fixed bottom-4 right-4">
        <button
          onClick={logout}
          className="bg-red-600 hover:bg-red-700 text-white p-3 rounded-full shadow-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
          aria-label="Logout"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </button>
      </div>
    </main>
  );
};

export default function Page() {
  return (
    <AuthGuard>
      <MainContent />
    </AuthGuard>
  );
}