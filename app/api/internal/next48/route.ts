import { NextResponse } from "next/server";
import { buildNext48Feed, isNext48Supported } from "@/lib/dcc/next48/feed";
import type { Next48EntityType, Next48SourceName } from "@/lib/dcc/next48/types";

function parseEntityType(value: string | null): Next48EntityType | null {
  if (value === "city" || value === "port") return value;
  return null;
}

function parseDebugSource(value: string | null): Next48SourceName | null {
  if (!value) return null;
  if (["concerts", "sports", "festivals", "tours", "curated", "live-pulse"].includes(value)) {
    return value as Next48SourceName;
  }
  return null;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const entityType = parseEntityType(searchParams.get("entityType"));
  const slug = (searchParams.get("slug") || "").trim().toLowerCase();
  const debugFailSource = parseDebugSource(searchParams.get("debugFailSource"));

  if (!entityType || !slug) {
    return NextResponse.json(
      { ok: false, error: "entityType and slug are required" },
      { status: 400 }
    );
  }

  if (!isNext48Supported(entityType, slug)) {
    return NextResponse.json(
      { ok: false, error: "next48 is not supported for this node yet" },
      { status: 404 }
    );
  }

  try {
    const feed = await buildNext48Feed({
      entityType,
      slug,
      now: new Date(),
      debugFailSource,
    });

    return NextResponse.json({ ok: true, feed }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: "failed to build next48 feed",
        detail: String(error),
      },
      { status: 500 }
    );
  }
}
