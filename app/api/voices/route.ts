// app/api/voices/route.ts
import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";

export const runtime = "nodejs"; // ensure Node runtime for FormData streaming

export async function GET() {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    Sentry.captureMessage("ELEVENLABS_API_KEY missing in GET /api/voices", {
      level: "error",
      tags: { feature: "voices", operation: "get", api_key_issue: true },
      extra: { endpoint: "/api/voices", method: "GET" },
    });
    return NextResponse.json({ error: "ELEVENLABS_API_KEY environment variable is not set" }, { status: 500 });
  }

  try {
    const r = await fetch("https://api.elevenlabs.io/v1/voices", {
      headers: { "xi-api-key": apiKey },
      cache: "no-store",
    });

    if (!r.ok) {
      const err = await r.text();
      Sentry.captureException(new Error(`Failed to fetch voices: ${err}`), {
        tags: { feature: "voices", operation: "get", http_status: r.status },
        extra: { endpoint: "/api/voices", method: "GET", upstream_status: r.status, error_message: err },
      });
      return NextResponse.json({ error: err }, { status: r.status });
    }

    let json;
    try {
      json = await r.json();
    } catch (parseError) {
      Sentry.captureException(parseError as Error, {
        tags: { feature: "voices", operation: "get", error_type: "json_parse" },
        extra: { endpoint: "/api/voices", method: "GET" },
      });
      return NextResponse.json({ error: "Failed to parse response from ElevenLabs API" }, { status: 500 });
    }
    
    // Filter to only return user-generated voices (cloned or instant voices)
    const userGeneratedVoices = json.voices.filter((voice: any) => 
      voice.category === "cloned" || voice.category === "instant"
    );
    
    return NextResponse.json({
      ...json,
      voices: userGeneratedVoices
    });
  } catch (error) {
    Sentry.captureException(error as Error, {
      tags: { feature: "voices", operation: "get", error_type: "network" },
      extra: { endpoint: "/api/voices", method: "GET" },
    });
    return NextResponse.json({ error: "Network error while fetching voices" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  let body;
  try {
    body = await req.formData();
  } catch (error) {
    Sentry.captureException(error as Error, {
      tags: { feature: "voices", operation: "post", error_type: "formdata_parse" },
      extra: { endpoint: "/api/voices", method: "POST" },
    });
    return NextResponse.json({ error: "Failed to parse form data" }, { status: 400 });
  }

  const name = body.get("name")?.toString() ?? "My IVC";
  const file = body.get("file");

  if (!(file instanceof File)) {
    Sentry.captureMessage("Missing file upload in POST /api/voices", {
      level: "warning",
      tags: { feature: "voices", operation: "post", validation_error: true },
      extra: { endpoint: "/api/voices", method: "POST", name },
    });
    return NextResponse.json({ error: "Missing 'file' upload" }, { status: 400 });
  }

  // Forward multipart to ElevenLabs IVC endpoint
  const upstream = new FormData();
  upstream.set("name", name);
  upstream.append("files", file, file.name);

  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    Sentry.captureMessage("ELEVENLABS_API_KEY missing in POST /api/voices", {
      level: "error",
      tags: { feature: "voices", operation: "post", api_key_issue: true },
      extra: { endpoint: "/api/voices", method: "POST", file_name: file.name },
    });
    return NextResponse.json({ error: "ELEVENLABS_API_KEY environment variable is not set" }, { status: 500 });
  }

  try {
    const r = await fetch("https://api.elevenlabs.io/v1/voices/add", {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
      },
      body: upstream,
    });

    if (!r.ok) {
      const err = await r.text();
      Sentry.captureException(new Error(`Failed to create voice: ${err}`), {
        tags: { feature: "voices", operation: "post", http_status: r.status },
        extra: { endpoint: "/api/voices", method: "POST", upstream_status: r.status, error_message: err, file_name: file.name },
      });
      return NextResponse.json({ error: err }, { status: r.status });
    }

    let json;
    try {
      json = await r.json();
    } catch (parseError) {
      Sentry.captureException(parseError as Error, {
        tags: { feature: "voices", operation: "post", error_type: "json_parse" },
        extra: { endpoint: "/api/voices", method: "POST", file_name: file.name },
      });
      return NextResponse.json({ error: "Failed to parse response from ElevenLabs API" }, { status: 500 });
    }
    // Typical shape includes the new voice_id
    return NextResponse.json(json);
  } catch (error) {
    Sentry.captureException(error as Error, {
      tags: { feature: "voices", operation: "post", error_type: "network" },
      extra: { endpoint: "/api/voices", method: "POST", file_name: file.name },
    });
    return NextResponse.json({ error: "Network error while creating voice" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  let requestBody;
  try {
    requestBody = await req.json();
  } catch (error) {
    Sentry.captureException(error as Error, {
      tags: { feature: "voices", operation: "delete", error_type: "json_parse" },
      extra: { endpoint: "/api/voices", method: "DELETE" },
    });
    return NextResponse.json({ error: "Failed to parse request body" }, { status: 400 });
  }

  const { voiceId } = requestBody;

  if (!voiceId) {
    Sentry.captureMessage("Missing voiceId in DELETE /api/voices", {
      level: "warning",
      tags: { feature: "voices", operation: "delete", validation_error: true },
      extra: { endpoint: "/api/voices", method: "DELETE" },
    });
    return NextResponse.json({ error: "voiceId is required" }, { status: 400 });
  }

  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    Sentry.captureMessage("ELEVENLABS_API_KEY missing in DELETE /api/voices", {
      level: "error",
      tags: { feature: "voices", operation: "delete", api_key_issue: true },
      extra: { endpoint: "/api/voices", method: "DELETE", voiceId },
    });
    return NextResponse.json({ error: "ELEVENLABS_API_KEY environment variable is not set" }, { status: 500 });
  }

  try {
    const r = await fetch(`https://api.elevenlabs.io/v1/voices/${voiceId}`, {
      method: "DELETE",
      headers: { "xi-api-key": apiKey },
    });

    if (!r.ok) {
      const err = await r.text();
      Sentry.captureException(new Error(`Failed to delete voice: ${err}`), {
        tags: { feature: "voices", operation: "delete", http_status: r.status },
        extra: { endpoint: "/api/voices", method: "DELETE", upstream_status: r.status, error_message: err, voiceId },
      });
      return NextResponse.json({ error: err }, { status: r.status });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    Sentry.captureException(error as Error, {
      tags: { feature: "voices", operation: "delete", error_type: "network" },
      extra: { endpoint: "/api/voices", method: "DELETE", voiceId },
    });
    return NextResponse.json({ error: "Network error while deleting voice" }, { status: 500 });
  }
}
