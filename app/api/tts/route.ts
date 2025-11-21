// app/api/tts/route.ts
import { NextRequest } from "next/server";
import * as Sentry from "@sentry/nextjs";

export async function POST(req: NextRequest) {
  let requestBody;
  try {
    requestBody = await req.json();
  } catch (error) {
    Sentry.captureException(error as Error, {
      tags: { feature: "tts", operation: "post", error_type: "json_parse" },
      extra: { endpoint: "/api/tts", method: "POST" },
    });
    return new Response(JSON.stringify({ error: "Failed to parse request body" }), { status: 400 });
  }

  const { voiceId, text, speed } = requestBody;

  if (!voiceId || !text) {
    Sentry.captureMessage("Missing required fields in POST /api/tts", {
      level: "warning",
      tags: { feature: "tts", operation: "post", validation_error: true },
      extra: { endpoint: "/api/tts", method: "POST", has_voiceId: !!voiceId, has_text: !!text },
    });
    return new Response(JSON.stringify({ error: "voiceId and text are required" }), { status: 400 });
  }

  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    Sentry.captureMessage("ELEVENLABS_API_KEY missing in POST /api/tts", {
      level: "error",
      tags: { feature: "tts", operation: "post", api_key_issue: true },
      extra: { endpoint: "/api/tts", method: "POST", voiceId, text_length: text?.length },
    });
    return new Response(JSON.stringify({ error: "ELEVENLABS_API_KEY environment variable is not set" }), { status: 500 });
  }

  // Debug: Log what we're sending to ElevenLabs
  console.log('Sending to ElevenLabs:', { voiceId, text, speed });

  try {
    // ElevenLabs TTS REST: POST /v1/text-to-speech/:voice_id
    // Returns audio bytes. We'll pass them right back to the client.
    const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
      },
      body: JSON.stringify({
        text,
        model_id: "eleven_v3", // a current, general-purpose model
        output_format: "mp3_44100_128", // Explicitly set output format for better SSML support
        voice_settings: { speed }, // speed multiplier
      }),
    });

    if (!r.ok) {
      const err = await r.text();
      Sentry.captureException(new Error(`Failed to generate TTS: ${err}`), {
        tags: { feature: "tts", operation: "post", http_status: r.status },
        extra: { endpoint: "/api/tts", method: "POST", upstream_status: r.status, error_message: err, voiceId, text_length: text?.length, speed },
      });
      return new Response(err, { status: r.status });
    }

    let audio;
    try {
      audio = await r.arrayBuffer();
    } catch (bufferError) {
      Sentry.captureException(bufferError as Error, {
        tags: { feature: "tts", operation: "post", error_type: "audio_buffer" },
        extra: { endpoint: "/api/tts", method: "POST", voiceId, text_length: text?.length, speed },
      });
      return new Response(JSON.stringify({ error: "Failed to process audio buffer" }), { status: 500 });
    }

    return new Response(audio, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    Sentry.captureException(error as Error, {
      tags: { feature: "tts", operation: "post", error_type: "network" },
      extra: { endpoint: "/api/tts", method: "POST", voiceId, text_length: text?.length, speed },
    });
    return new Response(JSON.stringify({ error: "Network error while generating TTS" }), { status: 500 });
  }
}