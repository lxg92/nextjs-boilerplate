// app/api/voices/route.ts
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs"; // ensure Node runtime for FormData streaming

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

export async function POST(req: NextRequest) {
  const body = await req.formData();
  const name = body.get("name")?.toString() ?? "My IVC";
  const file = body.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing 'file' upload" }, { status: 400 });
  }

  // Forward multipart to ElevenLabs IVC endpoint
  const upstream = new FormData();
  upstream.set("name", name);
  upstream.append("files", file, file.name);

  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "ELEVENLABS_API_KEY environment variable is not set" }, { status: 500 });
  }

  const r = await fetch("https://api.elevenlabs.io/v1/voices/add", {
    method: "POST",
    headers: {
      "xi-api-key": apiKey,
    },
    body: upstream,
  });

  if (!r.ok) {
    const err = await r.text();
    return NextResponse.json({ error: err }, { status: r.status });
  }

  const json = await r.json();
  // Typical shape includes the new voice_id
  return NextResponse.json(json);
}

export async function DELETE(req: NextRequest) {
  const { voiceId } = await req.json();

  if (!voiceId) {
    return NextResponse.json({ error: "voiceId is required" }, { status: 400 });
  }

  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "ELEVENLABS_API_KEY environment variable is not set" }, { status: 500 });
  }

  const r = await fetch(`https://api.elevenlabs.io/v1/voices/${voiceId}`, {
    method: "DELETE",
    headers: { "xi-api-key": apiKey },
  });

  if (!r.ok) {
    const err = await r.text();
    return NextResponse.json({ error: err }, { status: r.status });
  }

  return NextResponse.json({ success: true });
}
