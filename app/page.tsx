"use client";

import { useState, useMemo, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AudioPlayer } from "./components/AudioPlayer";

type VoicesResponse = {
  voices: Array<{ voice_id: string; name: string; category?: string }>;
};

const DEFAULT_TEXTS = [
  "Hello, this is a test of the voice cloning system.",
  "Welcome to our demonstration of text-to-speech technology.",
  "This is a sample text to showcase the voice synthesis capabilities.",
  "Thank you for using our voice cloning application today."
];

export default function Page() {
  const qc = useQueryClient();

  const [file, setFile] = useState<File | null>(null);
  const [voiceName, setVoiceName] = useState("My IVC");
  const [selectedVoiceId, setSelectedVoiceId] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [customText, setCustomText] = useState("");
  const [selectedDefaultText, setSelectedDefaultText] = useState("");
  const [speechSpeed, setSpeechSpeed] = useState(1.0); // Speed multiplier (0.7-1.2)
  
  // Password protection state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");

  // Check authentication on component mount
  useEffect(() => {
    const checkAuth = () => {
      const authData = localStorage.getItem('voiceAppAuth');
      if (authData) {
        const { timestamp } = JSON.parse(authData);
        const now = Date.now();
        const fifteenMinutes = 15 * 60 * 1000; // 15 minutes in milliseconds
        
        if (now - timestamp < fifteenMinutes) {
          setIsAuthenticated(true);
        } else {
          // Session expired, clear storage
          localStorage.removeItem('voiceAppAuth');
        }
      }
    };

    checkAuth();
  }, []);

  // Handle password submission
  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === "vip") {
      setIsAuthenticated(true);
      setPasswordError("");
      // Store authentication with timestamp
      localStorage.setItem('voiceAppAuth', JSON.stringify({
        timestamp: Date.now()
      }));
    } else {
      setPasswordError("Incorrect password. Please try again.");
      setPassword("");
    }
  };

  // 1) useQuery: fetch the current voices so we can pick the newly-created IVC
  const { data: voicesData, isLoading: voicesLoading } = useQuery<VoicesResponse>({
    queryKey: ["voices"],
    queryFn: async () => {
      const r = await fetch("/api/voices", { cache: "no-store" });
      if (!r.ok) throw new Error("Failed to fetch voices");
      return r.json();
    },
    staleTime: 0,
  });

  const voices = voicesData?.voices ?? [];
  const selectedVoice = useMemo(
    () => voices.find((v) => v.voice_id === selectedVoiceId) ?? null,
    [voices, selectedVoiceId]
  );

  // 2) useMutation: create an Instant Voice Clone from the uploaded file
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
      // 3) useQueryClient: refresh cached voices, then auto-select the new one
      await qc.invalidateQueries({ queryKey: ["voices"] });
      setSelectedVoiceId(newId);
    },
  });

  // 4) useMutation: delete a voice
  const deleteVoiceMutation = useMutation({
    mutationFn: async (voiceId: string) => {
      const r = await fetch("/api/voices/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ voiceId }),
      });
      if (!r.ok) throw new Error(await r.text());
      return r.json();
    },
    onSuccess: async () => {
      // Refresh voices list after deletion
      await qc.invalidateQueries({ queryKey: ["voices"] });
      // Clear selection if the deleted voice was selected
      setSelectedVoiceId(null);
    },
  });

  // 5) useMutation: generate audio with TTS for the selected voice
  const ttsMutation = useMutation({
    mutationFn: async ({ voiceId, text }: { voiceId: string; text: string }) => {
      // Replace dashes with SSML break tags (following ElevenLabs best practices)
      let processedText = text
        .replace(/---/g, '<break time="3s"/>')  // --- for 3 second pause
        .replace(/--/g, '<break time="1s"/>')   // -- for 1 second pause  
        .replace(/(?<!-)-(?!-)/g, '<break time="0.5s"/>'); // single dash for short pause
      
      // Apply global speed control from UI slider
      // if (speechSpeed !== 1.0) {
      //   processedText = `<prosody rate="${speechSpeed}">${processedText}</prosody>`;
      // }
      
      // Debug: Log the processed text to see what's being sent to ElevenLabs
      console.log('Original text:', text);
      console.log('Processed SSML:', processedText);
      
      const r = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ voiceId, text: processedText, speed: speechSpeed }),
        
      });
      if (!r.ok) throw new Error(await r.text());
      const blob = await r.blob();
      return URL.createObjectURL(blob);
    },
    onSuccess: (url) => {
      // assign output to an <audio> tag
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      setAudioUrl(url);
    },
  });

  const canCreate = !!file && !createIvcmutation.isPending;
  const canSpeak = !!selectedVoiceId && !ttsMutation.isPending;

  // Show password form if not authenticated
  if (!isAuthenticated) {
    return (
      <main className="mx-auto max-w-md p-6">
        <div className="min-h-screen flex items-center justify-center">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg border w-full">
          <h1 className="text-2xl font-semibold text-center mb-6 text-gray-900 dark:text-white">Voice Cloning App</h1>
          <p className="text-gray-700 dark:text-gray-300 text-center mb-6">Please enter the password to access this application.</p>
            
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <input
                  type="password"
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-colors"
                  autoFocus
                />
                {passwordError && (
                  <p className="text-red-600 dark:text-red-400 text-sm mt-2 font-medium">{passwordError}</p>
                )}
              </div>
              
              <button
                type="submit"
                className="w-full bg-blue-600 dark:bg-blue-700 text-white py-3 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-800 transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Access Application
              </button>
            </form>
            
            <p className="text-xs text-gray-600 dark:text-gray-400 text-center mt-4">
              Session will remain active for 15 minutes
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-xl p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">IVC → TTS demo</h1>
        <button
          onClick={() => {
            localStorage.removeItem('voiceAppAuth');
            setIsAuthenticated(false);
          }}
          className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 underline focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded transition-colors"
        >
          Logout
        </button>
      </div>

      <section className="space-y-3 rounded-xl border border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-800">
        <h2 className="font-medium text-gray-900 dark:text-white">1) Upload your voice sample</h2>
        
        <div className="space-y-3">
          <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center hover:border-gray-400 dark:hover:border-gray-500 transition-colors">
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
              <div className="text-gray-700 dark:text-gray-300 mb-2">
                {file ? (
                  <div>
                    <p className="text-green-600 dark:text-green-400 font-medium">✓ {file.name}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Click to change file</p>
                  </div>
                ) : (
                  <div>
                    <p className="text-lg text-gray-900 dark:text-white">📁 Click to upload audio file</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Supports MP3, WAV, M4A, etc.</p>
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
            disabled={!canCreate}
            onClick={() => file && createIvcmutation.mutate({ file, name: voiceName })}
          >
            {createIvcmutation.isPending ? "Cloning…" : "Create Instant Voice Clone"}
          </button>
          
          {createIvcmutation.isError && (
            <p className="text-red-600 dark:text-red-400 text-sm font-medium">
              {(createIvcmutation.error as Error).message}
            </p>
          )}
        </div>
      </section>

      <section className="space-y-3 rounded-xl border border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-800">
        <h2 className="font-medium text-gray-900 dark:text-white">2) Pick a voice</h2>
        {voicesLoading ? (
          <p className="text-gray-700 dark:text-gray-300">Loading voices…</p>
        ) : (
          <div className="space-y-3">
            {voices.length === 0 ? (
              <div className="space-y-3">
                <p className="text-sm text-gray-600 dark:text-gray-400">No user-generated voices available. Upload a voice sample to create one.</p>
              </div>
            ) : (
              <>
                <select
                  className="border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white p-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-colors"
                  value={selectedVoiceId ?? ""}
                  onChange={(e) => setSelectedVoiceId(e.target.value || null)}
                >
                  <option value="">— Select —</option>
                  {voices.map((v) => (
                    <option key={v.voice_id} value={v.voice_id}>
                      {v.name} ({v.category ?? "personal"})
                    </option>
                  ))}
                </select>
                
                {/* Voice list with delete buttons */}
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-gray-800 dark:text-gray-200">Your Voices:</h3>
                  <div className="space-y-1">
                    {voices.map((voice) => (
                      <div key={voice.voice_id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-600">
                        <div className="flex-1">
                          <span className="text-sm font-medium text-gray-900 dark:text-white">{voice.name}</span>
                          <span className="text-xs text-gray-600 dark:text-gray-400 ml-2">({voice.category ?? "cloned"})</span>
                        </div>
                        <button
                          onClick={() => {
                            if (confirm(`Are you sure you want to delete "${voice.name}"? This action cannot be undone.`)) {
                              deleteVoiceMutation.mutate(voice.voice_id);
                            }
                          }}
                          disabled={deleteVoiceMutation.isPending}
                          className="px-2 py-1 text-xs bg-red-600 dark:bg-red-700 text-white rounded hover:bg-red-700 dark:hover:bg-red-800 disabled:opacity-50 disabled:cursor-not-allowed font-medium focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
                        >
                          {deleteVoiceMutation.isPending ? "Deleting..." : "Delete"}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        )}
        {selectedVoice && (
          <p className="text-sm text-gray-700 dark:text-gray-300 font-medium">Selected: {selectedVoice.name}</p>
        )}
        {deleteVoiceMutation.isError && (
          <p className="text-red-600 dark:text-red-400 text-sm font-medium">{(deleteVoiceMutation.error as Error).message}</p>
        )}
      </section>

      <section className="space-y-3 rounded-xl border border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-800">
        <h2 className="font-medium text-gray-900 dark:text-white">3) Generate speech with this voice</h2>
        
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">Choose default text or enter custom:</label>
            <select
              className="border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white p-2 rounded w-full mb-3 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-colors"
              value={selectedDefaultText}
              onChange={(e) => {
                setSelectedDefaultText(e.target.value);
                if (e.target.value) {
                  setCustomText(e.target.value);
                }
              }}
            >
              <option value="">— Select default text —</option>
              {DEFAULT_TEXTS.map((text, index) => (
                <option key={index} value={text}>
                  {text.length > 50 ? text.substring(0, 50) + "..." : text}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">
              Custom text (max 2500 characters):
            </label>
            <textarea
              className="border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white p-2 rounded w-full h-32 resize-none focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-colors"
              placeholder="Enter your text here... Use -, --, --- for pauses. Speed is controlled by the slider below."
              value={customText}
              onChange={(e) => {
                setCustomText(e.target.value);
                if (e.target.value !== selectedDefaultText) {
                  setSelectedDefaultText("");
                }
              }}
              maxLength={2500}
            />
            <div className="mt-2 space-y-1">
              <div className="flex justify-between items-center">
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  <span className="font-medium">Pauses:</span> <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">-</code> (0.5s), <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">--</code> (1s), <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">---</code> (3s)
                </div>
                <span className={`text-xs font-medium ${customText.length > 2500 ? 'text-red-600 dark:text-red-400' : customText.length > 2250 ? 'text-yellow-600 dark:text-yellow-400' : 'text-gray-600 dark:text-gray-400'}`}>
                  {customText.length}/2500
                </span>
              </div>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">
              Speech Speed: {speechSpeed}x
            </label>
            <div className="space-y-2">
              <input
                type="range"
                min="0.7"
                max="1.2"
                step="0.1"
                value={speechSpeed}
                onChange={(e) => setSpeechSpeed(parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                style={{
                    background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${((speechSpeed - 0.7) / 0.5) * 100}%, #e5e7eb ${((speechSpeed - 0.7) / 0.5) * 100}%, #e5e7eb 100%)`
                }}
              />
              <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
                <span>0.7x (Slow)</span>
                <span>1.0x (Normal)</span>
                <span>1.2x (Fast)</span>
              </div>
            </div>
          </div>
          
          <button
            className="px-4 py-2 rounded bg-blue-600 dark:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed w-full font-medium hover:bg-blue-700 dark:hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            disabled={!canSpeak || !customText.trim()}
            onClick={() =>
              selectedVoiceId &&
              customText.trim() &&
              ttsMutation.mutate({ voiceId: selectedVoiceId, text: customText })
            }
          >
            {ttsMutation.isPending ? "Generating…" : "Generate Speech"}
          </button>

          {ttsMutation.isError && (
            <p className="text-red-600 dark:text-red-400 text-sm font-medium">{(ttsMutation.error as Error).message}</p>
          )}

          {audioUrl && <AudioPlayer audioUrl={audioUrl} />}
        </div>
      </section>
    </main>
  );
}