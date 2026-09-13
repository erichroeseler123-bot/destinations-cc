import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();

    // Validate expected structure
    if (!data || !data.event) {
      return NextResponse.json({ error: "invalid_event" }, { status: 400 });
    }

    // In production, can log to stdout or forward to monitoring service
    // Zero PII policy enforced: do not store IP, user-agent, or personal identifiers
    return NextResponse.json({ ok: true, received: data.event }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }
}
