import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const raw = await request.text();

    // Fire-and-forget relay to upstream DCC telemetry endpoint if available
    const dccOrigin = process.env.DCC_ORIGIN || "https://www.destinationcommandcenter.com";
    try {
      fetch(`${dccOrigin}/api/network/telemetry`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: raw,
      }).catch(() => undefined);
    } catch {
      // Silently ignore upstream connection or certificate failures
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}
