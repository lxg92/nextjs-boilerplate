// app/api/tts/route.ts
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const { voiceId, text } = await req.json();

  if (!voiceId || !text) {
    return new Response(JSON.stringify({ error: "voiceId and text are required" }), { status: 400 });
  }
  // ElevenLabs TTS REST: POST /v1/text-to-speech/:voice_id
  // Returns audio bytes. We'll pass them right back to the client.
  const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: "POST",
    headers: {
      "xi-api-key": process.env.ELEVENLABS_API_KEY!,
      "Content-Type": "application/json",
      Accept: "audio/mpeg",
    },
    body: JSON.stringify({
      text,
      model_id: "eleven_multilingual_v2", // a current, general-purpose model
    }),
  });

  if (!r.ok) {
    const err = await r.text();
    return new Response(err, { status: r.status });
  }

  const audio = await r.arrayBuffer();
  return new Response(audio, {
    status: 200,
    headers: {
      "Content-Type": "audio/mpeg",
      "Cache-Control": "no-store",
    },
  });
}