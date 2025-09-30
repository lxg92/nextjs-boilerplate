// app/api/ivc/route.ts
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs"; // ensure Node runtime for FormData streaming

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



  const r = await fetch("https://api.elevenlabs.io/v1/voices/add", {
    method: "POST",
    headers: {
      "xi-api-key": process.env.ELEVENLABS_API_KEY!,
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

