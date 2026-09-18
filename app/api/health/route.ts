import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json(
    {
      ok: true,
      service: "destinationcommandcenter",
      role: "authority",
      environment: process.env.VERCEL_ENV || process.env.NODE_ENV || "staging",
      commitSha: process.env.VERCEL_GIT_COMMIT_SHA || process.env.GITHUB_SHA || "local",
    },
    {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    }
  );
}
