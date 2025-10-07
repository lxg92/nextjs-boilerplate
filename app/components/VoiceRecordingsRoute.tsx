"use client";

export const VoiceRecordingsRoute = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Voice Recordings
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Browse and manage your saved voice recordings
        </p>
      </div>

      {/* Coming Soon Section */}
      <div className="max-w-2xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8 shadow-sm text-center">
          <div className="text-6xl mb-6">🎵</div>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
            Coming Soon
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            This feature is currently under development. Soon you'll be able to:
          </p>
          
          <div className="space-y-3 text-left max-w-md mx-auto">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-blue-600 rounded-full mr-3"></div>
              <span className="text-gray-700 dark:text-gray-300">Save generated audio recordings</span>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-blue-600 rounded-full mr-3"></div>
              <span className="text-gray-700 dark:text-gray-300">Organize recordings by voice</span>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-blue-600 rounded-full mr-3"></div>
              <span className="text-gray-700 dark:text-gray-300">Download recordings as MP3</span>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-blue-600 rounded-full mr-3"></div>
              <span className="text-gray-700 dark:text-gray-300">Share recordings with others</span>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-blue-600 rounded-full mr-3"></div>
              <span className="text-gray-700 dark:text-gray-300">Create playlists and favorites</span>
            </div>
          </div>
        </div>

        {/* Feature Preview */}
        <div className="mt-8 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-3">
            🚀 What's Coming Next
          </h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm text-blue-800 dark:text-blue-200">
            <div>
              <h4 className="font-medium mb-2">Recording Management</h4>
              <ul className="space-y-1">
                <li>• Auto-save generated audio</li>
                <li>• Batch download options</li>
                <li>• Recording metadata</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Enhanced Features</h4>
              <ul className="space-y-1">
                <li>• Audio waveform visualization</li>
                <li>• Recording quality settings</li>
                <li>• Export to different formats</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Back to Generation */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            In the meantime, you can generate speech using the Generate Speech tab
          </p>
          <div className="inline-flex items-center px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-700 dark:text-gray-300">
            <span className="mr-2">🎤</span>
            Use the Generate Speech tab to create audio
          </div>
        </div>
      </div>
    </div>
  );
};
