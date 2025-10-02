// app/api/ivc/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, checkUsageLimit } from "@/lib/auth";
import { db } from "@/lib/database";

export const runtime = "nodejs"; // ensure Node runtime for FormData streaming

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check voice creation limit
    const voices = await db.getVoicesByUserId(user.id);
    const usageCheck = await checkUsageLimit(user.id, 'maxVoices', voices.length);
    
    if (!usageCheck.allowed) {
      return NextResponse.json({ 
        error: `Voice limit reached. You can create up to ${usageCheck.limit} voices with your ${usageCheck.tier} plan.` 
      }, { status: 403 });
    }

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
    
    // Save voice to database
    await db.createVoice({
      userId: user.id,
      voiceId: json.voice_id,
      name: name,
      category: 'cloned',
    });

    // Update usage stats
    await db.updateUsageStats(user.id, {
      voicesCreated: voices.length + 1,
    });

    return NextResponse.json(json);
  } catch (error) {
    console.error('Error creating voice:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

