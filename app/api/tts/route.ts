// app/api/tts/route.ts
import { NextRequest } from "next/server";
import { getAuthenticatedUser, checkUsageLimit, incrementUsage } from "@/lib/auth";
import { db } from "@/lib/database";

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    const { voiceId, text, speed } = await req.json();

    if (!voiceId || !text) {
      return new Response(JSON.stringify({ error: "voiceId and text are required" }), { status: 400 });
    }

    // Check character usage limit
    const stats = await db.getUsageStats(user.id);
    if (!stats) {
      return new Response(JSON.stringify({ error: "Usage stats not found" }), { status: 500 });
    }

    const textLength = text.length;
    const usageCheck = await checkUsageLimit(user.id, 'maxCharactersPerMonth', stats.charactersUsedThisMonth + textLength);
    
    if (!usageCheck.allowed) {
      return new Response(JSON.stringify({ 
        error: `Character limit reached. You can use up to ${usageCheck.limit} characters per month with your ${usageCheck.tier} plan.` 
      }), { status: 403 });
    }

    // Check recording limit
    const recordingsCheck = await checkUsageLimit(user.id, 'maxRecordingsPerMonth', stats.recordingsCreatedThisMonth + 1);
    
    if (!recordingsCheck.allowed) {
      return new Response(JSON.stringify({ 
        error: `Recording limit reached. You can create up to ${recordingsCheck.limit} recordings per month with your ${recordingsCheck.tier} plan.` 
      }), { status: 403 });
    }

    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "ELEVENLABS_API_KEY environment variable is not set" }), { status: 500 });
    }

    // Debug: Log what we're sending to ElevenLabs
    console.log('Sending to ElevenLabs:', { voiceId, text, speed });

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
        model_id: "eleven_multilingual_v2", // a current, general-purpose model
        output_format: "mp3_44100_128", // Explicitly set output format for better SSML support
        voice_settings: { speed }, // speed multiplier
      }),
    });

    if (!r.ok) {
      const err = await r.text();
      return new Response(err, { status: r.status });
    }

    const audio = await r.arrayBuffer();
    
    // Update usage stats
    await incrementUsage(user.id, textLength, 1);

    return new Response(audio, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error('Error generating TTS:', error);
    return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500 });
  }
}