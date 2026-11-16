import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  ADMIN_SESSION_COOKIE,
  authorizeControlCenterCaller,
} from "@/lib/adminAccess";
import { buildOwnerControlCenterSnapshot } from "@/lib/dcc/ownerControlCenter";
import { listDccFactVerificationQueue } from "@/lib/dcc/cruise/canonicalLocationsAndRoutePatterns";
import { ensureFoundingPilotVerificationQueueSeeded } from "@/lib/dcc/cruise/foundingOrganizerPilotCohort";
import {
  buildNormalizedJuneauSupplierFeed,
  getCachedSereneRezgoInspection,
  getSereneRezgoReadinessStatus,
} from "@/lib/dcc/liveSlots/rezgoReadOnly";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NO_STORE_NOINDEX_HEADERS = {
  "Cache-Control": "private, no-store, max-age=0",
  "X-Robots-Tag": "noindex, nofollow",
};

export async function GET(request: Request) {
  let fallbackCookie: string | null = null;
  try {
    const store = await cookies();
    fallbackCookie = store.get(ADMIN_SESSION_COOKIE)?.value || null;
  } catch {
    fallbackCookie = null;
  }
  const auth = await authorizeControlCenterCaller(request, fallbackCookie);
  if (!auth.authorized) {
    return NextResponse.json(
      {
        ok: false,
        error: "UNAUTHORIZED",
        message: "Valid admin session or internal secret required.",
      },
      { status: 401, headers: NO_STORE_NOINDEX_HEADERS },
    );
  }

  const { searchParams } = new URL(request.url);
  const requestedAction = (searchParams.get("action") || "").trim().toLowerCase();
  const inspectRezgo =
    requestedAction === "inspect_serene_rezgo" ||
    searchParams.get("inspectRezgo") === "1" ||
    searchParams.get("inspectRezgo") === "true";

  if (inspectRezgo) {
    const bypassCache =
      searchParams.get("fresh") === "1" || searchParams.get("fresh") === "true";
    const singleDateRaw = (searchParams.get("rezgoDate") || "").trim();
    const multiDatesRaw = (searchParams.get("rezgoDates") || "").trim();

    const parsedDates = Array.from(
      new Set(
        [
          ...(singleDateRaw ? [singleDateRaw] : []),
          ...(multiDatesRaw ? multiDatesRaw.split(",") : []),
        ]
          .map((d) => d.trim())
          .filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d)),
      ),
    ).slice(0, 5);

    const [catalogInspection, dateInspections, normalizedSupplierFeed] =
      await Promise.all([
        getCachedSereneRezgoInspection({ bypassCache }),
        Promise.all(
          parsedDates.map((d) =>
            getCachedSereneRezgoInspection({ searchDate: d, bypassCache }),
          ),
        ),
        buildNormalizedJuneauSupplierFeed({
          searchDate: parsedDates[0] || undefined,
          bypassCache,
        }),
      ]);

    const readiness = getSereneRezgoReadinessStatus();

    return NextResponse.json(
      {
        ok: true,
        action: "inspect_serene_rezgo",
        actor: auth.actor,
        readOnly: true,
        mutatedRemoteState: false,
        secretsExposed: false,
        credentialHolder: "destinations-cc",
        writeCapabilitiesDisabled: {
          commitBookingDisabled: true,
          paymentCaptureDisabled: true,
          cancellationDisabled: true,
          customerMessagingDisabled: true,
          liveDirectCheckoutEnabled: false,
        },
        readiness,
        catalogInspection,
        dateInspections,
        normalizedSupplierFeed,
      },
      { status: 200, headers: NO_STORE_NOINDEX_HEADERS },
    );
  }

  ensureFoundingPilotVerificationQueueSeeded();
  const snapshot = await buildOwnerControlCenterSnapshot();
  const verificationQueueOpenCount = listDccFactVerificationQueue({
    includeSyntheticTest: false,
  }).filter((q) => q.state === "needs_review").length;
  return NextResponse.json(
    {
      ...snapshot,
      actor: auth.actor,
      foundingPilotVerificationAttentionCount: verificationQueueOpenCount,
    },
    { status: 200, headers: NO_STORE_NOINDEX_HEADERS },
  );
}
