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
import {
  buildHostedCatalogFieldProvenance,
  computeStrongRfc8785Etag,
  getDccHostedIdentifierRegistry,
  getDccHostedProvenanceLedger,
  getSignedHostedCatalogSnapshotEnvelope,
  HOSTED_FIELD_AUTHORITY_MATRIX,
  HOSTED_SOURCE_AUTHORITY_DEFINITIONS,
  HOSTED_USAGE_RIGHTS_DEFINITIONS,
  matchesIfNoneMatch,
  ZERO_FEE_ORGANIZER_POLICY,
} from "@/lib/dcc/cruise/hostedProvenanceLedger";

export const dynamic = "force-dynamic";

const BASE_MACHINE_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-DCC-API-Key, If-None-Match",
  "Access-Control-Expose-Headers":
    "ETag, X-DCC-Snapshot-Sha256, X-DCC-Ledger-Cursor, X-Robots-Tag",
  "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
  "X-Robots-Tag": "noindex, nofollow",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: BASE_MACHINE_HEADERS });
}

async function handleCatalogRequest(request: NextRequest, headOnly: boolean) {
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
      { status: 400, headers: BASE_MACHINE_HEADERS },
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
      { status: 404, headers: BASE_MACHINE_HEADERS },
    );
  }

  const includeHeldParam = searchParams.get("includeHeld");
  const includeHeld =
    includeHeldParam === null
      ? true
      : includeHeldParam !== "0" && includeHeldParam !== "false";

  const includeProvenance =
    searchParams.get("provenance") === "1" || searchParams.get("provenance") === "true";
  const includeSigned =
    searchParams.get("signed") === "1" || searchParams.get("signed") === "true";

  const snapshot = getDccCanonicalHostedCatalogSnapshot({
    theme,
    organizerSlug: resolvedOrganizer?.organizerSlug ?? null,
    includeHeld,
  });

  const ledger = getDccHostedProvenanceLedger();
  const idRegistry = getDccHostedIdentifierRegistry();
  const latestCursorToken = ledger.getLatestCursorToken();
  const ledgerChainCheck = ledger.verifyHashChainIntegrity();

  const { etag, sha256: snapshotSha256 } = computeStrongRfc8785Etag({
    snapshot,
    latestCursorToken,
    includeProvenance,
    includeSigned,
  });

  const responseHeaders = {
    ...BASE_MACHINE_HEADERS,
    ETag: etag,
    "X-DCC-Snapshot-Sha256": snapshotSha256,
    "X-DCC-Ledger-Cursor": latestCursorToken,
  };

  if (matchesIfNoneMatch(request.headers.get("if-none-match"), etag)) {
    return new NextResponse(null, {
      status: 304,
      headers: responseHeaders,
    });
  }

  if (headOnly) {
    return new NextResponse(null, {
      status: 200,
      headers: responseHeaders,
    });
  }

  const integrity = validateDccHostedCatalogIntegrity();
  const provenanceBundle = buildHostedCatalogFieldProvenance(snapshot, ledger);

  let signedSnapshot: unknown = undefined;
  let signingError: string | undefined;
  if (includeSigned) {
    try {
      signedSnapshot = await getSignedHostedCatalogSnapshotEnvelope(snapshot, latestCursorToken);
    } catch (err) {
      signingError = err instanceof Error ? err.message : "Snapshot signing unavailable";
    }
  }

  return NextResponse.json(
    {
      ok: true,
      machineAccessOnly: true,
      robotsPolicy: "noindex, nofollow",
      etag,
      snapshotRfc8785Sha256: snapshotSha256,
      latestLedgerCursor: latestCursorToken,
      incrementalChangesEndpoint: `/api/v1/cruises/hosted-catalog/changes?since=${latestCursorToken}`,
      zeroFeeOrganizerPolicy: ZERO_FEE_ORGANIZER_POLICY,
      systemOfRecordOwnership: SYSTEM_OF_RECORD_OWNERSHIP,
      sourceAuthorityDefinitions: HOSTED_SOURCE_AUTHORITY_DEFINITIONS,
      usageRightsDefinitions: HOSTED_USAGE_RIGHTS_DEFINITIONS,
      fieldAuthorityMatrix: HOSTED_FIELD_AUTHORITY_MATRIX,
      identifierRegistrySummary: idRegistry.getSummaryCounts(),
      ledgerIntegrity: ledgerChainCheck,
      provenanceSummary: provenanceBundle.summary,
      ...(includeProvenance
        ? {
            fieldProvenance: {
              organizersByEntityId: provenanceBundle.organizersByEntityId,
              hostedSailingsByEntityId: provenanceBundle.hostedSailingsByEntityId,
            },
          }
        : {}),
      ...(includeSigned
        ? {
            signedSnapshot: signedSnapshot ?? null,
            ...(signingError ? { signingError } : {}),
          }
        : {}),
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
    { status: 200, headers: responseHeaders },
  );
}

export async function GET(request: NextRequest) {
  return handleCatalogRequest(request, false);
}

export async function HEAD(request: NextRequest) {
  return handleCatalogRequest(request, true);
}
