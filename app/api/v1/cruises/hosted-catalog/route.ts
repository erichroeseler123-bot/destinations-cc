import { NextRequest, NextResponse } from "next/server";
import {
  HOSTED_CRUISE_THEME_SLUGS,
  SYSTEM_OF_RECORD_OWNERSHIP,
  type HostedCruiseThemeSlug,
} from "@/lib/dcc/cruise/canonicalHostedCruiseContract";
import {
  getDccCanonicalHostedCatalogSnapshot,
  resolveDccHostedOrganizerBySlugOrAlias,
  validateDccHostedCatalogIntegrity,
} from "@/lib/dcc/cruise/hostedCatalogRegistry";

export const dynamic = "force-dynamic";

const MACHINE_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-DCC-API-Key",
  "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
  "X-Robots-Tag": "noindex, nofollow",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: MACHINE_HEADERS });
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const rawTheme = (searchParams.get("theme") || "").trim().toLowerCase();
  const theme = (HOSTED_CRUISE_THEME_SLUGS as readonly string[]).includes(rawTheme)
    ? (rawTheme as HostedCruiseThemeSlug)
    : null;

  if (rawTheme && !theme) {
    return NextResponse.json(
      {
        ok: false,
        error: `Unknown hosted-cruise theme "${rawTheme}".`,
        supportedThemes: HOSTED_CRUISE_THEME_SLUGS,
      },
      { status: 400, headers: MACHINE_HEADERS },
    );
  }

  const organizerParam = (
    searchParams.get("organizer") ||
    searchParams.get("organizerSlug") ||
    ""
  ).trim();
  const resolvedOrganizer = organizerParam
    ? resolveDccHostedOrganizerBySlugOrAlias(organizerParam)
    : null;

  if (organizerParam && !resolvedOrganizer) {
    return NextResponse.json(
      {
        ok: false,
        error: `Hosted organizer "${organizerParam}" not found in DCC canonical registry.`,
      },
      { status: 404, headers: MACHINE_HEADERS },
    );
  }

  const includeHeldParam = searchParams.get("includeHeld");
  const includeHeld =
    includeHeldParam === null
      ? true
      : includeHeldParam !== "0" && includeHeldParam !== "false";

  const snapshot = getDccCanonicalHostedCatalogSnapshot({
    theme,
    organizerSlug: resolvedOrganizer?.organizerSlug ?? null,
    includeHeld,
  });

  const integrity = validateDccHostedCatalogIntegrity();

  return NextResponse.json(
    {
      ok: true,
      machineAccessOnly: true,
      robotsPolicy: "noindex, nofollow",
      systemOfRecordOwnership: SYSTEM_OF_RECORD_OWNERSHIP,
      integrity: {
        valid: integrity.valid,
        violationCount: integrity.violations.length,
      },
      counts: {
        themes: snapshot.themes.length,
        organizers: snapshot.organizers.length,
        hostedSailings: snapshot.hostedSailings.length,
        heldPendingScheduleVerification: snapshot.hostedSailings.filter((s) =>
          Boolean(s.scheduleHoldReason),
        ).length,
      },
      snapshot,
    },
    { status: 200, headers: MACHINE_HEADERS },
  );
}
