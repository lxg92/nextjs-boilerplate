// app/api/voices/route.ts
import { NextResponse } from "next/server";

export async function GET() {
  const r = await fetch("https://api.elevenlabs.io/v1/voices", {
    headers: { "xi-api-key": process.env.ELEVENLABS_API_KEY! },
    cache: "no-store",
  });

  if (!r.ok) {
    const err = await r.text();
    return NextResponse.json({ error: err }, { status: r.status });
  }

  const json = await r.json();
  return NextResponse.json(json);
}
