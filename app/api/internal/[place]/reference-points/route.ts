import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";
import { getNodeBySlug, getNodesByAlias } from "@/lib/dcc/registry";

export const runtime = "nodejs";

function resolveCanonicalSlug(input: string): string {
  const canonical = getNodeBySlug(input) || getNodesByAlias(input)[0] || null;
  return canonical?.slug || input;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ place: string }> }
) {
  const resolved = await params;
  const slug = resolveCanonicalSlug(resolved.place);
  const file = path.join(
    process.cwd(),
    "data",
    "map",
    "reference-points",
    "by-place",
    `${slug}.json`
  );

  if (!fs.existsSync(file)) {
    return NextResponse.json(
      { error: "reference_points_not_found", place: resolved.place, slug },
      { status: 404 }
    );
  }

  const json = JSON.parse(fs.readFileSync(file, "utf8"));
  return NextResponse.json(json, { status: 200 });
}
