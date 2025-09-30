"use client";

import { useState, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

type VoicesResponse = {
  voices: Array<{ voice_id: string; name: string; category?: string }>;
};

const FIXED_TEXT =
  "This is a text I want to read out and to make you understand what I am reading";

export default function Page() {
  const qc = useQueryClient();

  const [file, setFile] = useState<File | null>(null);
  const [voiceName, setVoiceName] = useState("My IVC");
  const [selectedVoiceId, setSelectedVoiceId] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

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
      const r = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ voiceId, text }),
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

  return (
    <main className="mx-auto max-w-xl p-6 space-y-6">
      <h1 className="text-2xl font-semibold">IVC → TTS demo</h1>

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
        <h2 className="font-medium">3) Generate speech with this IVC</h2>
        <button
          className="px-4 py-2 rounded bg-indigo-600 text-white disabled:opacity-50"
          disabled={!canSpeak}
          onClick={() =>
            selectedVoiceId &&
            ttsMutation.mutate({ voiceId: selectedVoiceId, text: FIXED_TEXT })
          }
        >
          {ttsMutation.isPending ? "Generating…" : "Speak the fixed text"}
        </button>

        {ttsMutation.isError && (
          <p className="text-red-600 text-sm">{(ttsMutation.error as Error).message}</p>
        )}

        {audioUrl && (
          <audio controls src={audioUrl} className="w-full">
            Your browser does not support the <code>audio</code> element.
          </audio>
        )}
      </section>
    </main>
  );
}