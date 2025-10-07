"use client";

import { useState } from "react";
import { useVoiceManagement } from "../hooks/useVoiceManagement";

export const VoiceUploadSection = () => {
  const [file, setFile] = useState<File | null>(null);
  const [voiceName, setVoiceName] = useState("My IVC");
  
  const { createVoiceMutation, canCreateVoice } = useVoiceManagement();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFile(e.target.files?.[0] ?? null);
  };

  const handleCreateVoice = () => {
    if (file) {
      createVoiceMutation.mutate({ file, name: voiceName });
    }
  };

  return (
    <section className="space-y-3 rounded-xl border border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-800">
      <h2 className="font-medium text-gray-900 dark:text-white">
        1) Upload your voice sample
      </h2>
      
      <div className="space-y-3">
        <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center hover:border-gray-400 dark:hover:border-gray-500 transition-colors">
          <input
            type="file"
            accept="audio/*"
            onChange={handleFileChange}
            className="hidden"
            id="file-upload"
          />
          <label
            htmlFor="file-upload"
            className="cursor-pointer block"
          >
            <div className="text-gray-700 dark:text-gray-300 mb-2">
              {file ? (
                <div>
                  <p className="text-green-600 dark:text-green-400 font-medium">
                    ✓ {file.name}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Click to change file
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-lg text-gray-900 dark:text-white">
                    📁 Click to upload audio file
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Supports MP3, WAV, M4A, etc.
                  </p>
                </div>
              )}
            </div>
          </label>
        </div>
        
        <input
          className="border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white p-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-colors"
          placeholder="Voice name"
          value={voiceName}
          onChange={(e) => setVoiceName(e.target.value)}
        />
        
        <button
          className="px-4 py-2 rounded bg-gray-900 dark:bg-gray-700 text-white hover:bg-gray-800 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed w-full font-medium focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
          disabled={!canCreateVoice(file, createVoiceMutation.isPending)}
          onClick={handleCreateVoice}
        >
          {createVoiceMutation.isPending ? "Cloning…" : "Create Instant Voice Clone"}
        </button>
        
        {createVoiceMutation.isError && (
          <p className="text-red-600 dark:text-red-400 text-sm font-medium">
            {(createVoiceMutation.error as Error).message}
          </p>
        )}
      </div>
    </section>
  );
};
