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
  return NextResponse.json(json);
}
