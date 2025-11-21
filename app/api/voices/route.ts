// app/api/voices/route.ts
import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";

export const runtime = "nodejs"; // ensure Node runtime for FormData streaming

export async function GET() {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    Sentry.captureMessage("ELEVENLABS_API_KEY missing in GET /api/voices", {
      level: "error",
      tags: { operation: "get-voices", api_key_status: "missing" },
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
      Sentry.captureException(new Error(`Failed to fetch voices from ElevenLabs: ${err}`), {
        tags: { operation: "get-voices", api_key_status: "present" },
        extra: { 
          endpoint: "/api/voices", 
          method: "GET",
          upstream_status: r.status,
          upstream_error: err,
        },
      });
      return NextResponse.json({ error: err }, { status: r.status });
    }

    let json;
    try {
      json = await r.json();
    } catch (parseError) {
      Sentry.captureException(parseError as Error, {
        tags: { operation: "get-voices", error_type: "json_parse" },
        extra: { 
          endpoint: "/api/voices", 
          method: "GET",
          response_status: r.status,
        },
      });
      throw parseError;
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
    if (error instanceof TypeError && error.message.includes("fetch")) {
      Sentry.captureException(error, {
        tags: { operation: "get-voices", error_type: "network_failure" },
        extra: { 
          endpoint: "/api/voices", 
          method: "GET",
          upstream_url: "https://api.elevenlabs.io/v1/voices",
        },
      });
    } else {
      Sentry.captureException(error as Error, {
        tags: { operation: "get-voices" },
        extra: { endpoint: "/api/voices", method: "GET" },
      });
    }
    throw error;
  }
}

export async function POST(req: NextRequest) {
  let body: FormData;
  try {
    body = await req.formData();
  } catch (error) {
    Sentry.captureException(error as Error, {
      tags: { operation: "post-voices", error_type: "formdata_parse" },
      extra: { 
        endpoint: "/api/voices", 
        method: "POST",
      },
    });
    return NextResponse.json({ error: "Failed to parse form data" }, { status: 400 });
  }

  const name = body.get("name")?.toString() ?? "My IVC";
  const file = body.get("file");

  if (!(file instanceof File)) {
    Sentry.captureMessage("Missing file upload in POST /api/voices", {
      level: "warning",
      tags: { operation: "post-voices", error_type: "validation" },
      extra: { 
        endpoint: "/api/voices", 
        method: "POST",
        has_name: !!name,
      },
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
      tags: { operation: "post-voices", api_key_status: "missing" },
      extra: { endpoint: "/api/voices", method: "POST" },
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
      Sentry.captureException(new Error(`Failed to create voice in ElevenLabs: ${err}`), {
        tags: { operation: "post-voices", api_key_status: "present" },
        extra: { 
          endpoint: "/api/voices", 
          method: "POST",
          upstream_status: r.status,
          upstream_error: err,
          file_name: file.name,
          file_size: file.size,
          voice_name: name,
        },
      });
      return NextResponse.json({ error: err }, { status: r.status });
    }

    const json = await r.json();
    // Typical shape includes the new voice_id
    return NextResponse.json(json);
  } catch (error) {
    if (error instanceof TypeError && error.message.includes("fetch")) {
      Sentry.captureException(error, {
        tags: { operation: "post-voices", error_type: "network_failure" },
        extra: { 
          endpoint: "/api/voices", 
          method: "POST",
          upstream_url: "https://api.elevenlabs.io/v1/voices/add",
          file_name: file.name,
          voice_name: name,
        },
      });
    } else {
      Sentry.captureException(error as Error, {
        tags: { operation: "post-voices" },
        extra: { endpoint: "/api/voices", method: "POST", file_name: file.name },
      });
    }
    throw error;
  }
}

export async function DELETE(req: NextRequest) {
  let requestBody: { voiceId?: string };
  try {
    requestBody = await req.json();
  } catch (error) {
    Sentry.captureException(error as Error, {
      tags: { operation: "delete-voices", error_type: "json_parse" },
      extra: { 
        endpoint: "/api/voices", 
        method: "DELETE",
      },
    });
    return NextResponse.json({ error: "Invalid JSON in request body" }, { status: 400 });
  }

  const { voiceId } = requestBody;

  if (!voiceId) {
    Sentry.captureMessage("Missing voiceId in DELETE /api/voices", {
      level: "warning",
      tags: { operation: "delete-voices", error_type: "validation" },
      extra: { 
        endpoint: "/api/voices", 
        method: "DELETE",
      },
    });
    return NextResponse.json({ error: "voiceId is required" }, { status: 400 });
  }

  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    Sentry.captureMessage("ELEVENLABS_API_KEY missing in DELETE /api/voices", {
      level: "error",
      tags: { operation: "delete-voices", api_key_status: "missing" },
      extra: { 
        endpoint: "/api/voices", 
        method: "DELETE",
        voice_id: voiceId,
      },
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
      Sentry.captureException(new Error(`Failed to delete voice in ElevenLabs: ${err}`), {
        tags: { operation: "delete-voices", api_key_status: "present" },
        extra: { 
          endpoint: "/api/voices", 
          method: "DELETE",
          voice_id: voiceId,
          upstream_status: r.status,
          upstream_error: err,
        },
      });
      return NextResponse.json({ error: err }, { status: r.status });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof TypeError && error.message.includes("fetch")) {
      Sentry.captureException(error, {
        tags: { operation: "delete-voices", error_type: "network_failure" },
        extra: { 
          endpoint: "/api/voices", 
          method: "DELETE",
          voice_id: voiceId,
          upstream_url: `https://api.elevenlabs.io/v1/voices/${voiceId}`,
        },
      });
    } else {
      Sentry.captureException(error as Error, {
        tags: { operation: "delete-voices" },
        extra: { endpoint: "/api/voices", method: "DELETE", voice_id: voiceId },
      });
    }
    throw error;
  }
}
