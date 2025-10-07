"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface VoiceUploadRouteProps {
  onUploadSuccess?: (voiceId: string) => void;
}

export const VoiceUploadRoute = ({ onUploadSuccess }: VoiceUploadRouteProps) => {
  const queryClient = useQueryClient();
  const [file, setFile] = useState<File | null>(null);
  const [voiceName, setVoiceName] = useState("My IVC");

  const createIvcmutation = useMutation({
    mutationFn: async ({ file, name }: { file: File; name: string }) => {
      const fd = new FormData();
      fd.set("name", name);
      fd.set("file", file, file.name);
      const r = await fetch("/api/ivc", { method: "POST", body: fd });
      if (!r.ok) throw new Error(await r.text());
      return r.json() as Promise<{ voice_id: string }>;
    },
    onSuccess: async (payload) => {
      const newId = (payload as any).voice_id;
      // Refresh cached voices, then notify parent
      await queryClient.invalidateQueries({ queryKey: ["voices"] });
      onUploadSuccess?.(newId);
      
      // Reset form
      setFile(null);
      setVoiceName("My IVC");
    },
  });

  const canCreate = !!file && !createIvcmutation.isPending;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Upload Voice
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Create your own voice clone from an audio sample
        </p>
      </div>

      {/* Upload Section */}
      <div className="max-w-2xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
            Voice Sample Upload
          </h2>
          
          <div className="space-y-6">
            {/* File Upload Area */}
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 text-center hover:border-gray-400 dark:hover:border-gray-500 transition-colors">
              <input
                type="file"
                accept="audio/*"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="cursor-pointer block"
              >
                <div className="text-gray-700 dark:text-gray-300">
                  {file ? (
                    <div>
                      <div className="text-4xl mb-4">✅</div>
                      <p className="text-green-600 dark:text-green-400 font-semibold text-lg">
                        {file.name}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                        Click to change file
                      </p>
                    </div>
                  ) : (
                    <div>
                      <div className="text-6xl mb-4">📁</div>
                      <p className="text-xl text-gray-900 dark:text-white font-medium">
                        Click to upload audio file
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                        Supports MP3, WAV, M4A, and other audio formats
                      </p>
                    </div>
                  )}
                </div>
              </label>
            </div>
            
            {/* Voice Name Input */}
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                Voice Name
              </label>
              <input
                className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-colors"
                placeholder="Enter a name for your voice"
                value={voiceName}
                onChange={(e) => setVoiceName(e.target.value)}
              />
            </div>
            
            {/* Upload Button */}
            <button
              className="w-full px-6 py-3 rounded-lg bg-blue-600 dark:bg-blue-700 text-white font-semibold hover:bg-blue-700 dark:hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
              disabled={!canCreate}
              onClick={() => file && createIvcmutation.mutate({ file, name: voiceName })}
            >
              {createIvcmutation.isPending ? (
                <div className="flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Creating Voice Clone...
                </div>
              ) : (
                "Create Voice Clone"
              )}
            </button>
            
            {/* Error Message */}
            {createIvcmutation.isError && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-red-600 dark:text-red-400 text-sm font-medium">
                  {(createIvcmutation.error as Error).message}
                </p>
              </div>
            )}

            {/* Success Message */}
            {createIvcmutation.isSuccess && (
              <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <p className="text-green-600 dark:text-green-400 text-sm font-medium">
                  ✅ Voice clone created successfully! You can now use it to generate speech.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Tips Section */}
        <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-3">
            💡 Tips for Best Results
          </h3>
          <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
            <li>• Use clear, high-quality audio recordings</li>
            <li>• Speak naturally and at a consistent pace</li>
            <li>• Include a variety of words and phrases</li>
            <li>• Keep recordings between 30 seconds to 2 minutes</li>
            <li>• Avoid background noise and music</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
