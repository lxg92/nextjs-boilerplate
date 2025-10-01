// app/api/voices/route.ts
import { NextResponse } from "next/server";

export async function GET() {
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
