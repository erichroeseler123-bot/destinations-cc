import { NextResponse } from "next/server";
import { getVegasWhatsLiveFeed } from "@/lib/whatsLive";

export async function GET() {
  try {
    const payload = await getVegasWhatsLiveFeed();
    return NextResponse.json(payload, {
      status: 200,
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: "failed_to_load_whats_live",
        detail: error instanceof Error ? error.message : "unknown_error",
      },
      { status: 500 },
    );
  }
}
