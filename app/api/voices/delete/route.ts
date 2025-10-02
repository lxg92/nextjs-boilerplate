// app/api/voices/delete/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { db } from "@/lib/database";

export async function DELETE(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { voiceId } = await req.json();

    if (!voiceId) {
      return NextResponse.json({ error: "voiceId is required" }, { status: 400 });
    }

    // Verify the voice belongs to the user
    const userVoices = await db.getVoicesByUserId(user.id);
    const voiceToDelete = userVoices.find(v => v.voiceId === voiceId);
    
    if (!voiceToDelete) {
      return NextResponse.json({ error: "Voice not found or access denied" }, { status: 404 });
    }

    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "ELEVENLABS_API_KEY environment variable is not set" }, { status: 500 });
    }

    // Delete from ElevenLabs
    const r = await fetch(`https://api.elevenlabs.io/v1/voices/${voiceId}`, {
      method: "DELETE",
      headers: { "xi-api-key": apiKey },
    });

    if (!r.ok) {
      const err = await r.text();
      return NextResponse.json({ error: err }, { status: r.status });
    }

    // Delete from database
    await db.deleteVoice(voiceToDelete.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting voice:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
