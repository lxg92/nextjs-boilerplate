// app/api/tts/route.ts
import { NextRequest } from "next/server";
import * as Sentry from "@sentry/nextjs";

export async function POST(req: NextRequest) {
  let requestBody: { voiceId?: string; text?: string; speed?: number };
  try {
    requestBody = await req.json();
  } catch (error) {
    Sentry.captureException(error as Error, {
      tags: { operation: "post-tts", error_type: "json_parse" },
      extra: { 
        endpoint: "/api/tts", 
        method: "POST",
      },
    });
    return new Response(JSON.stringify({ error: "Invalid JSON in request body" }), { status: 400 });
  }

  const { voiceId, text, speed } = requestBody;

  if (!voiceId || !text) {
    Sentry.captureMessage("Missing required fields in POST /api/tts", {
      level: "warning",
      tags: { operation: "post-tts", error_type: "validation" },
      extra: { 
        endpoint: "/api/tts", 
        method: "POST",
        has_voice_id: !!voiceId,
        has_text: !!text,
        text_length: text?.length,
      },
    });
    return new Response(JSON.stringify({ error: "voiceId and text are required" }), { status: 400 });
  }

  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    Sentry.captureMessage("ELEVENLABS_API_KEY missing in POST /api/tts", {
      level: "error",
      tags: { operation: "post-tts", api_key_status: "missing" },
      extra: { 
        endpoint: "/api/tts", 
        method: "POST",
        voice_id: voiceId,
        text_length: text.length,
      },
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
      Sentry.captureException(new Error(`Failed to generate TTS from ElevenLabs: ${err}`), {
        tags: { operation: "post-tts", api_key_status: "present" },
        extra: { 
          endpoint: "/api/tts", 
          method: "POST",
          voice_id: voiceId,
          text_length: text.length,
          speed: speed,
          upstream_status: r.status,
          upstream_error: err,
        },
      });
      return new Response(err, { status: r.status });
    }

    let audio: ArrayBuffer;
    try {
      audio = await r.arrayBuffer();
    } catch (error) {
      Sentry.captureException(error as Error, {
        tags: { operation: "post-tts", error_type: "audio_buffer_processing" },
        extra: { 
          endpoint: "/api/tts", 
          method: "POST",
          voice_id: voiceId,
          text_length: text.length,
          response_status: r.status,
          response_content_type: r.headers.get("content-type"),
        },
      });
      throw error;
    }

    return new Response(audio, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    if (error instanceof TypeError && error.message.includes("fetch")) {
      Sentry.captureException(error, {
        tags: { operation: "post-tts", error_type: "network_failure" },
        extra: { 
          endpoint: "/api/tts", 
          method: "POST",
          voice_id: voiceId,
          text_length: text.length,
          upstream_url: `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
        },
      });
    } else if (!(error instanceof Error && error.message.includes("audio buffer"))) {
      Sentry.captureException(error as Error, {
        tags: { operation: "post-tts" },
        extra: { endpoint: "/api/tts", method: "POST", voice_id: voiceId },
      });
    }
    throw error;
  }
}