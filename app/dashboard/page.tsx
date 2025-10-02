"use client";

import { useState, useMemo, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useUser } from '@auth0/nextjs-auth0/client';
import { getUsageLimits, SubscriptionTier } from "@/lib/subscription-tiers";

type VoicesResponse = {
  voices: Array<{ voice_id: string; name: string; category?: string }>;
};

type SavedRecording = {
  id: string;
  voiceName: string;
  text: string;
  audioData: string; // base64 encoded audio
  timestamp: number;
  speed: number;
};

const DEFAULT_TEXTS = [
  "Hello, this is a test of the voice cloning system.",
  "Welcome to our demonstration of text-to-speech technology.",
  "This is a sample text to showcase the voice synthesis capabilities.",
  "Thank you for using our voice cloning application today."
];

export default function DashboardPage() {
  const { user, isLoading: userLoading } = useUser();
  const qc = useQueryClient();

  const [file, setFile] = useState<File | null>(null);
  const [voiceName, setVoiceName] = useState("My IVC");
  const [selectedVoiceId, setSelectedVoiceId] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [customText, setCustomText] = useState("");
  const [selectedDefaultText, setSelectedDefaultText] = useState("");
  const [speechSpeed, setSpeechSpeed] = useState(1.0);
  const [savedRecordings, setSavedRecordings] = useState<SavedRecording[]>([]);
  const [subscriptionTier, setSubscriptionTier] = useState<SubscriptionTier>('free');
  const [usageStats, setUsageStats] = useState({
    charactersUsed: 0,
    recordingsCreated: 0,
    voicesCreated: 0,
  });

  // Load user data and usage stats
  useEffect(() => {
    if (user) {
      // In a real app, you'd fetch this from your API
      // For now, we'll simulate the data
      setUsageStats({
        charactersUsed: 2500,
        recordingsCreated: 12,
        voicesCreated: 1,
      });
    }
  }, [user]);

  // Functions to handle saved recordings
  const saveRecording = async (audioBlob: Blob, voiceName: string, text: string, speed: number) => {
    try {
      const reader = new FileReader();
      reader.onload = () => {
        const audioData = reader.result as string;
        const newRecording: SavedRecording = {
          id: Date.now().toString(),
          voiceName,
          text,
          audioData,
          timestamp: Date.now(),
          speed
        };
        
        const updatedRecordings = [newRecording, ...savedRecordings];
        setSavedRecordings(updatedRecordings);
        localStorage.setItem('voiceAppRecordings', JSON.stringify(updatedRecordings));
      };
      reader.readAsDataURL(audioBlob);
    } catch (error) {
      console.error('Error saving recording:', error);
    }
  };

  const deleteRecording = (id: string) => {
    const updatedRecordings = savedRecordings.filter(rec => rec.id !== id);
    setSavedRecordings(updatedRecordings);
    localStorage.setItem('voiceAppRecordings', JSON.stringify(updatedRecordings));
  };

  const downloadRecording = (recording: SavedRecording) => {
    const link = document.createElement('a');
    link.href = recording.audioData;
    link.download = `recording_${recording.id}.mp3`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 1) useQuery: fetch the current voices
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
      await qc.invalidateQueries({ queryKey: ["voices"] });
      setSelectedVoiceId(newId);
    },
  });

  // 3) useMutation: delete a voice
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
      await qc.invalidateQueries({ queryKey: ["voices"] });
      setSelectedVoiceId(null);
    },
  });

  // 4) useMutation: generate audio with TTS for the selected voice
  const ttsMutation = useMutation({
    mutationFn: async ({ voiceId, text }: { voiceId: string; text: string }) => {
      let processedText = text
        .replace(/---/g, '<break time="3s"/>')
        .replace(/--/g, '<break time="1s"/>')
        .replace(/(?<!-)-(?!-)/g, '<break time="0.5s"/>');
      
      const r = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ voiceId, text: processedText, speed: speechSpeed }),
      });
      if (!r.ok) throw new Error(await r.text());
      const blob = await r.blob();
      return { url: URL.createObjectURL(blob), blob };
    },
    onSuccess: ({ url, blob }) => {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      setAudioUrl(url);
      
      if (selectedVoice) {
        saveRecording(blob, selectedVoice.name, customText, speechSpeed);
      }
    },
  });

  // 5) useMutation: create customer portal session
  const createPortalSession = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/subscriptions/create-portal-session', {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error('Failed to create portal session');
      }
      
      const { url } = await response.json();
      window.location.href = url;
    },
  });

  const canCreate = !!file && !createIvcmutation.isPending;
  const canSpeak = !!selectedVoiceId && !ttsMutation.isPending;

  const limits = getUsageLimits(subscriptionTier);

  if (userLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Please log in to access your dashboard</h1>
          <a href="/api/auth/login" className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700">
            Log In
          </a>
        </div>
      </div>
    );
  }

  return (
    <main className="mx-auto max-w-6xl p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-semibold">Voice Cloning Dashboard</h1>
          <p className="text-gray-600">Welcome back, {user.name}</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <p className="text-sm text-gray-600">Current Plan</p>
            <p className="font-semibold capitalize">{subscriptionTier}</p>
          </div>
          <a href="/api/auth/logout" className="text-sm text-gray-500 hover:text-gray-700 underline">
            Logout
          </a>
        </div>
      </div>

      {/* Usage Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg border">
          <h3 className="font-medium text-gray-900">Characters Used</h3>
          <p className="text-2xl font-bold text-indigo-600">{usageStats.charactersUsed.toLocaleString()}</p>
          <p className="text-sm text-gray-500">of {limits.maxCharactersPerMonth.toLocaleString()} this month</p>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <h3 className="font-medium text-gray-900">Recordings Created</h3>
          <p className="text-2xl font-bold text-indigo-600">{usageStats.recordingsCreated}</p>
          <p className="text-sm text-gray-500">of {limits.maxRecordingsPerMonth} this month</p>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <h3 className="font-medium text-gray-900">Voice Clones</h3>
          <p className="text-2xl font-bold text-indigo-600">{usageStats.voicesCreated}</p>
          <p className="text-sm text-gray-500">of {limits.maxVoices} total</p>
        </div>
      </div>

      {/* Upgrade Banner */}
      {subscriptionTier === 'free' && (
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white p-6 rounded-lg">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold mb-2">Ready to unlock more features?</h2>
              <p className="text-indigo-100">Upgrade to Basic or Premium for more voices, characters, and recordings.</p>
            </div>
            <a href="/pricing" className="bg-white text-indigo-600 px-6 py-3 rounded-lg font-medium hover:bg-gray-100">
              View Plans
            </a>
          </div>
        </div>
      )}

      {/* Subscription Management */}
      {subscriptionTier !== 'free' && (
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-medium text-gray-900">Manage Subscription</h3>
              <p className="text-sm text-gray-600">Update payment method, view invoices, or cancel subscription</p>
            </div>
            <button
              onClick={() => createPortalSession.mutate()}
              disabled={createPortalSession.isPending}
              className="bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800 disabled:opacity-50"
            >
              {createPortalSession.isPending ? 'Loading...' : 'Manage'}
            </button>
          </div>
        </div>
      )}

      {/* Voice Creation Section */}
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
            <label htmlFor="file-upload" className="cursor-pointer block">
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

      {/* Voice Selection Section */}
      <section className="space-y-3 rounded-xl border p-4">
        <h2 className="font-medium">2) Pick a voice</h2>
        {voicesLoading ? (
          <p>Loading voices…</p>
        ) : (
          <div className="space-y-3">
            {voices.length === 0 ? (
              <div className="space-y-3">
                <p className="text-sm text-gray-500">No user-generated voices available. Upload a voice sample to create one.</p>
              </div>
            ) : (
              <>
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
                
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-gray-700">Your Voices:</h3>
                  <div className="space-y-1">
                    {voices.map((voice) => (
                      <div key={voice.voice_id} className="flex items-center justify-between p-2 bg-gray-50 rounded border">
                        <div className="flex-1">
                          <span className="text-sm font-medium">{voice.name}</span>
                          <span className="text-xs text-gray-500 ml-2">({voice.category ?? "cloned"})</span>
                        </div>
                        <button
                          onClick={() => {
                            if (confirm(`Are you sure you want to delete "${voice.name}"? This action cannot be undone.`)) {
                              deleteVoiceMutation.mutate(voice.voice_id);
                            }
                          }}
                          disabled={deleteVoiceMutation.isPending}
                          className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
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
          <p className="text-sm text-gray-600">Selected: {selectedVoice.name}</p>
        )}
        {deleteVoiceMutation.isError && (
          <p className="text-red-600 text-sm">{(deleteVoiceMutation.error as Error).message}</p>
        )}
      </section>

      {/* TTS Generation Section */}
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
                <div className="text-xs text-gray-500">
                  <span className="font-medium">Pauses:</span> <code className="bg-gray-100 px-1 rounded">-</code> (0.5s), <code className="bg-gray-100 px-1 rounded">--</code> (1s), <code className="bg-gray-100 px-1 rounded">---</code> (3s)
                </div>
                <span className={`text-xs ${customText.length > 2500 ? 'text-red-500' : customText.length > 2250 ? 'text-yellow-500' : 'text-gray-500'}`}>
                  {customText.length}/2500
                </span>
              </div>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">
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
              <div className="flex justify-between text-xs text-gray-500">
                <span>0.7x (Slow)</span>
                <span>1.0x (Normal)</span>
                <span>1.2x (Fast)</span>
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

      {/* Saved Recordings Section */}
      <section className="space-y-3 rounded-xl border p-4">
        <h2 className="font-medium">4) Saved Recordings</h2>
        
        {savedRecordings.length === 0 ? (
          <p className="text-sm text-gray-500">No recordings saved yet. Generate some speech to see your recordings here.</p>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-gray-600">You have {savedRecordings.length} saved recording{savedRecordings.length !== 1 ? 's' : ''}.</p>
            
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {savedRecordings.map((recording) => (
                <div key={recording.id} className="border rounded-lg p-3 bg-gray-50">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="font-medium text-sm">{recording.voiceName}</h3>
                      <p className="text-xs text-gray-500">
                        {new Date(recording.timestamp).toLocaleString()} • Speed: {recording.speed}x
                      </p>
                    </div>
                    <div className="flex space-x-1 ml-2">
                      <button
                        onClick={() => downloadRecording(recording)}
                        className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                        title="Download"
                      >
                        📥
                      </button>
                      <button
                        onClick={() => {
                          if (confirm('Are you sure you want to delete this recording?')) {
                            deleteRecording(recording.id);
                          }
                        }}
                        className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600"
                        title="Delete"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                  
                  <div className="mb-2">
                    <p className="text-sm text-gray-700 line-clamp-2">
                      {recording.text.length > 100 
                        ? `${recording.text.substring(0, 100)}...` 
                        : recording.text
                      }
                    </p>
                  </div>
                  
                  <audio 
                    controls 
                    src={recording.audioData} 
                    className="w-full h-8"
                  >
                    Your browser does not support the <code>audio</code> element.
                  </audio>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </main>
  );
}

