import { NextRequest, NextResponse } from "next/server";
import { resolveDccIngestBaseUrl } from "../../../../../lib/dcc/shared/envCompat";
import { EDGE_PII_QUERY_PARAM_KEYS } from "../../../../../lib/dcc/shared/edgeContextAndPii";

const PII_KEY_SET = new Set<string>(
  EDGE_PII_QUERY_PARAM_KEYS.map((key) => key.toLowerCase()),
);

function scrubEventProperties(
  raw: Record<string, unknown>,
): Record<string, string | number | boolean> {
  const safe: Record<string, string | number | boolean> = {};
  for (const [k, v] of Object.entries(raw)) {
    if (PII_KEY_SET.has(k.toLowerCase())) continue;
    if (typeof v === "string") {
      if (v.includes("@")) continue;
      safe[k] = v.slice(0, 160);
    } else if (typeof v === "number" && Number.isFinite(v)) {
      safe[k] = v;
    } else if (typeof v === "boolean") {
      safe[k] = v;
    }
  }
  return safe;
}

export async function POST(req: NextRequest) {
  try {
    const data = (await req.json().catch(() => null)) as Record<
      string,
      unknown
    > | null;

    if (!data || typeof data !== "object") {
      return NextResponse.json(
        { ok: true, accepted: false, reason: "empty_or_invalid_payload" },
        { status: 202 },
      );
    }

    const eventName = String(
      data.event ?? data.eventName ?? data.type ?? "",
    )
      .trim()
      .slice(0, 80);

    if (!eventName) {
      return NextResponse.json(
        { ok: true, accepted: false, reason: "missing_event_name" },
        { status: 202 },
      );
    }

    const sanitizedProps = scrubEventProperties(data);
    const dccBase = resolveDccIngestBaseUrl();
    let forwarded = false;

    if (
      process.env.DCC_FORWARD_SUBAPP_TELEMETRY !== "0" &&
      dccBase &&
      !req.url.includes("localhost")
    ) {
      try {
        const res = await fetch(
          `${dccBase}/api/internal/ingest-engagement`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              site: "lastfrontiershoreexcursions.com",
              event: eventName,
              path:
                typeof sanitizedProps.path === "string"
                  ? sanitizedProps.path
                  : typeof sanitizedProps.page === "string"
                    ? sanitizedProps.page
                    : "/",
              properties: sanitizedProps,
              occurredAt: new Date().toISOString(),
            }),
            cache: "no-store",
          },
        );
        forwarded = res.ok;
      } catch {
        // Never fail client pages if upstream telemetry collector is unreachable
        forwarded = false;
      }
    }

    return NextResponse.json(
      {
        ok: true,
        accepted: true,
        received: eventName,
        forwarded,
      },
      { status: 200 },
    );
  } catch {
    // Telemetry must never break client navigation or UI flows
    return NextResponse.json(
      { ok: true, accepted: false, reason: "malformed_body_ignored" },
      { status: 202 },
    );
  }
}
