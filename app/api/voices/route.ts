// app/api/voices/route.ts
import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { db } from "@/lib/database";

export async function GET() {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's voices from database
    const userVoices = await db.getVoicesByUserId(user.id);
    
    // Convert to the expected format
    const voices = userVoices.map(voice => ({
      voice_id: voice.voiceId,
      name: voice.name,
      category: voice.category || 'cloned',
    }));

    return NextResponse.json({
      voices
    });
  } catch (error) {
    console.error('Error fetching voices:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
