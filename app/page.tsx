"use client";

import { useState, useMemo, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

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

  // 4) useMutation: generate audio with TTS for the selected voice
  const ttsMutation = useMutation({
    mutationFn: async ({ voiceId, text }: { voiceId: string; text: string }) => {
      // Replace dashes with SSML pause tags and speed controls
      let processedText = text
        .replace(/---/g, '<break time="3s"/>')  // --- for 3 second pause
        .replace(/--/g, '<break time="1s"/>')   // -- for 1 second pause  
        .replace(/-/g, '<prosody rate="100%">')    // - for normal speed (100%)
        .replace(/>>>/g, '<prosody rate="130%">')  // >>> for 30% faster
        .replace(/>>/g, '<prosody rate="120%">')    // >> for 20% faster
        .replace(/>/g, '<prosody rate="110%">')     // > for 10% faster
        .replace(/<<</g, '<prosody rate="70%">')    // <<< for 30% slower
        .replace(/<</g, '<prosody rate="80%">')     // << for 20% slower
        .replace(/</g, '<prosody rate="90%">');     // < for 10% slower
      
      // Close any unclosed prosody tags
      const openTags = (processedText.match(/<prosody/g) || []).length;
      const closeTags = (processedText.match(/<\/prosody>/g) || []).length;
      const unclosedTags = openTags - closeTags;
      
      if (unclosedTags > 0) {
        processedText += '</prosody>'.repeat(unclosedTags);
      }
      
      const r = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ voiceId, text: processedText }),
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
          <div className="bg-white p-8 rounded-xl shadow-lg border w-full">
            <h1 className="text-2xl font-semibold text-center mb-6">Voice Cloning App</h1>
            <p className="text-gray-600 text-center mb-6">Please enter the password to access this application.</p>
            
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <input
                  type="password"
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  autoFocus
                />
                {passwordError && (
                  <p className="text-red-500 text-sm mt-2">{passwordError}</p>
                )}
              </div>
              
              <button
                type="submit"
                className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Access Application
              </button>
            </form>
            
            <p className="text-xs text-gray-500 text-center mt-4">
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
        <h1 className="text-2xl font-semibold">IVC → TTS demo</h1>
        <button
          onClick={() => {
            localStorage.removeItem('voiceAppAuth');
            setIsAuthenticated(false);
          }}
          className="text-sm text-gray-500 hover:text-gray-700 underline"
        >
          Logout
        </button>
      </div>

      <section className="space-y-3 rounded-xl border p-4">
        <h2 className="font-medium">1) Upload your voice sample</h2>
        
        <div className="space-y-3">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
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
              <div className="text-gray-600 mb-2">
                {file ? (
                  <div>
                    <p className="text-green-600 font-medium">✓ {file.name}</p>
                    <p className="text-sm text-gray-500">Click to change file</p>
                  </div>
                ) : (
                  <div>
                    <p className="text-lg">📁 Click to upload audio file</p>
                    <p className="text-sm text-gray-500">Supports MP3, WAV, M4A, etc.</p>
                  </div>
                )}
              </div>
            </label>
          </div>
          
          <input
            className="border p-2 rounded w-full"
            placeholder="Voice name"
            value={voiceName}
            onChange={(e) => setVoiceName(e.target.value)}
          />
          
          <button
            className="px-4 py-2 rounded bg-black text-white disabled:opacity-50 w-full"
            disabled={!canCreate}
            onClick={() => file && createIvcmutation.mutate({ file, name: voiceName })}
          >
            {createIvcmutation.isPending ? "Cloning…" : "Create Instant Voice Clone"}
          </button>
          
          {createIvcmutation.isError && (
            <p className="text-red-600 text-sm">
              {(createIvcmutation.error as Error).message}
            </p>
          )}
        </div>
      </section>

      <section className="space-y-3 rounded-xl border p-4">
        <h2 className="font-medium">2) Pick a voice</h2>
        {voicesLoading ? (
          <p>Loading voices…</p>
        ) : (
          <select
            className="border p-2 rounded w-full"
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
        )}
        {selectedVoice && (
          <p className="text-sm text-gray-600">Selected: {selectedVoice.name}</p>
        )}
      </section>

      <section className="space-y-3 rounded-xl border p-4">
        <h2 className="font-medium">3) Generate speech with this voice</h2>
        
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-2">Choose default text or enter custom:</label>
            <select
              className="border p-2 rounded w-full mb-3"
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
            <label className="block text-sm font-medium mb-2">
              Custom text (max 2500 characters):
            </label>
            <textarea
              className="border p-2 rounded w-full h-32 resize-none"
              placeholder="Enter your text here... Use - for pauses and >/< for speed control"
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
                <div className="text-xs text-gray-500">
                  <span className="font-medium">Pauses:</span> <code className="bg-gray-100 px-1 rounded">--</code> (1s), <code className="bg-gray-100 px-1 rounded">---</code> (3s)
                </div>
                <span className={`text-xs ${customText.length > 2500 ? 'text-red-500' : customText.length > 2250 ? 'text-yellow-500' : 'text-gray-500'}`}>
                  {customText.length}/2500
                </span>
              </div>
              <div className="text-xs text-gray-500">
                <span className="font-medium">Speed:</span> <code className="bg-gray-100 px-1 rounded">-</code> (100%), <code className="bg-gray-100 px-1 rounded">></code> (+10%), <code className="bg-gray-100 px-1 rounded">>></code> (+20%), <code className="bg-gray-100 px-1 rounded">>>></code> (+30%) | 
                <code className="bg-gray-100 px-1 rounded"> < </code> (-10%), <code className="bg-gray-100 px-1 rounded"> << </code> (-20%), <code className="bg-gray-100 px-1 rounded"> <<< </code> (-30%)
              </div>
            </div>
          </div>
          
          <button
            className="px-4 py-2 rounded bg-indigo-600 text-white disabled:opacity-50 w-full"
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
            <p className="text-red-600 text-sm">{(ttsMutation.error as Error).message}</p>
          )}

          {audioUrl && (
            <audio controls src={audioUrl} className="w-full">
              Your browser does not support the <code>audio</code> element.
            </audio>
          )}
        </div>
      </section>
    </main>
  );
}