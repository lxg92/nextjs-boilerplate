// app/api/voices/route.ts
import { NextResponse } from "next/server";
import { getSession } from "../../lib/redis";

export async function GET(req: Request) {
  // Check authentication
  const sessionId = req.headers.get('cookie')?.split('sessionId=')[1]?.split(';')[0];
  
  if (!sessionId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const sessionData = await getSession(sessionId);
  
  if (!sessionData) {
    return NextResponse.json({ error: "Invalid session" }, { status: 401 });
  }

  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "ELEVENLABS_API_KEY environment variable is not set" }, { status: 500 });
  }

  const r = await fetch("https://api.elevenlabs.io/v1/voices", {
    headers: { "xi-api-key": apiKey },
    cache: "no-store",
  });

  if (!r.ok) {
    const err = await r.text();
    return NextResponse.json({ error: err }, { status: r.status });
  }

  const json = await r.json();
  
  // Filter to only return user-generated voices (cloned or instant voices)
  const userGeneratedVoices = json.voices.filter((voice: any) => 
    voice.category === "cloned" || voice.category === "instant"
  );
  
  return NextResponse.json({
    ...json,
    voices: userGeneratedVoices
  });
}
