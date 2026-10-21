import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const targetUrl = searchParams.get("url");

  if (!targetUrl) {
    return NextResponse.json({ error: "Missing required 'url' parameter" }, { status: 400 });
  }

  // Security check: only allow images from official FAA weathercams static domain
  try {
    const parsed = new URL(targetUrl);
    if (!parsed.hostname.endsWith(".faa.gov") && parsed.hostname !== "faa.gov") {
      return NextResponse.json({ error: "Invalid upstream host. Only FAA sources permitted." }, { status: 403 });
    }
  } catch {
    return NextResponse.json({ error: "Malformed URL parameter" }, { status: 400 });
  }

  try {
    const upstreamRes = await fetch(targetUrl, {
      headers: {
        "User-Agent": "JuneauFlightDeck/2.0 (+https://juneauflightdeck.com)",
        Accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
        Referer: "https://weathercams.faa.gov/",
      },
      next: { revalidate: 180 },
    });

    if (!upstreamRes.ok) {
      return NextResponse.json(
        { error: `Upstream FAA server returned ${upstreamRes.status}` },
        { status: upstreamRes.status }
      );
    }

    const contentType = upstreamRes.headers.get("content-type") || "image/jpeg";
    const imageArrayBuffer = await upstreamRes.arrayBuffer();

    return new NextResponse(imageArrayBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=180, stale-while-revalidate=360",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: "Failed to fetch FAA camera frame", details: message }, { status: 502 });
  }
}
