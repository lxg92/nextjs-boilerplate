import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '../../lib/redis';
import { getItem, updateItem } from '../../lib/dynamodb';
import { TABLES } from '../../lib/dynamodb';
import { getMaxRecordings } from '../../lib/feature-flags';

export async function POST(req: NextRequest) {
  const { voiceId, text, speed } = await req.json();

  if (!voiceId || !text) {
    return new Response(JSON.stringify({ error: "voiceId and text are required" }), { status: 400 });
  }

  // Check authentication and usage limits
  const sessionId = req.cookies.get('sessionId')?.value;
  
  if (!sessionId) {
    return new Response(JSON.stringify({ error: "Not authenticated" }), { status: 401 });
  }

  const sessionData = await getSession(sessionId);
  
  if (!sessionData) {
    return new Response(JSON.stringify({ error: "Invalid session" }), { status: 401 });
  }

  // Get user to check usage limits
  const userResult = await getItem(TABLES.USERS, { userId: sessionData.userId });
  
  if (!userResult.Item) {
    return new Response(JSON.stringify({ error: "User not found" }), { status: 404 });
  }

  const user = userResult.Item;
  const maxRecordings = getMaxRecordings(user.subscriptionTier);
  
  // Check if user has reached their monthly limit (unless Premium)
  if (maxRecordings !== -1 && user.recordingsThisMonth >= maxRecordings) {
    return new Response(JSON.stringify({ 
      error: "LIMIT_REACHED", 
      message: "You've reached your monthly recording limit. Upgrade your plan to continue.",
      upgradeUrl: "/pricing"
    }), { status: 403 });
  }

  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "ELEVENLABS_API_KEY environment variable is not set" }), { status: 500 });
  }

  // Debug: Log what we're sending to ElevenLabs
  console.log('Sending to ElevenLabs:', { voiceId, text, speed });

  // ElevenLabs TTS REST: POST /v1/text-to-speech/:voice_id
  const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: "POST",
    headers: {
      "xi-api-key": apiKey,
      "Content-Type": "application/json",
      Accept: "audio/mpeg",
    },
    body: JSON.stringify({
      text,
      model_id: "eleven_multilingual_v2",
      output_format: "mp3_44100_128",
      voice_settings: { speed },
    }),
  });

  if (!r.ok) {
    const err = await r.text();
    return new Response(err, { status: r.status });
  }

  // Increment user's recording count
  await updateItem(
    TABLES.USERS,
    { userId: sessionData.userId },
    'SET recordingsThisMonth = recordingsThisMonth + :inc',
    { ':inc': 1 }
  );

  const audio = await r.arrayBuffer();
  return new Response(audio, {
    status: 200,
    headers: {
      "Content-Type": "audio/mpeg",
      "Cache-Control": "no-store",
    },
  });
}