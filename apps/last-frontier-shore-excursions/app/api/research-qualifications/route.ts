import { NextResponse } from "next/server";
import {
  BLOCKED_KETCHIKAN_UMBRELLA_PRODUCTS,
  computeLfseResearchCacheControl,
  LFSE_MANDATORY_RETURN_BUFFER_MINUTES,
  loadLfseApprovedPortFacts,
  qualifyLfsePortDirectContexts,
} from "@/lib/dccResearchFeed";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  if (url.searchParams.has("now") || url.searchParams.has("clear")) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Test clock (?now=) and clear controls (?clear=) are excluded from production routes. Production eligibility always uses server time.",
        code: "PRODUCTION_TEST_CONTROL_FORBIDDEN",
      },
      {
        status: 400,
        headers: {
          "Cache-Control": "private, no-store, max-age=0, must-revalidate",
        },
      },
    );
  }

  const rawPort = (url.searchParams.get("port") || "juneau")
    .trim()
    .toLowerCase();
  const portSlug = rawPort.includes("ketchikan")
    ? "ketchikan"
    : rawPort.includes("juneau")
      ? "juneau"
      : rawPort;
  const activitySlug =
    url.searchParams.get("activity")?.trim().toLowerCase() || undefined;
  const shipArrival =
    url.searchParams.get("arrival")?.trim() ||
    url.searchParams.get("shipArrival")?.trim() ||
    undefined;
  const allAboardTime =
    url.searchParams.get("allAboard")?.trim() ||
    url.searchParams.get("allAboardTime")?.trim() ||
    undefined;
  const meetingTime =
    url.searchParams.get("meetingTime")?.trim() ||
    url.searchParams.get("departure")?.trim() ||
    undefined;
  const dockKey = url.searchParams.get("dockKey")?.trim() || undefined;
  const partyMinAgeRaw = url.searchParams.get("partyMinAgeMonths")?.trim();
  const partyMaxWeightRaw = url.searchParams
    .get("partyMaxPassengerWeightLbs")
    ?.trim();
  const requiresStepFreeWheelchair =
    url.searchParams.get("requiresStepFreeWheelchair") === "true" ||
    url.searchParams.get("requiresStepFreeWheelchair") === "1";

  const loadResult = await loadLfseApprovedPortFacts(portSlug);
  const qualifications = qualifyLfsePortDirectContexts(
    portSlug,
    loadResult.facts,
    {
      activitySlug,
      shipArrival,
      allAboardTime,
      meetingTime,
      dockKey,
      partyMinAgeMonths: partyMinAgeRaw
        ? Number.parseInt(partyMinAgeRaw, 10)
        : undefined,
      partyMaxPassengerWeightLbs: partyMaxWeightRaw
        ? Number.parseInt(partyMaxWeightRaw, 10)
        : undefined,
      requiresStepFreeWheelchair,
    },
  );

  const { cacheControlHeader, maxAgeSeconds } = computeLfseResearchCacheControl(
    qualifications,
    loadResult.recommendedMaxAgeSeconds,
  );

  return NextResponse.json(
    {
      ok: true,
      service: "lfse-research-qualifications",
      port: portSlug,
      activity: activitySlug ?? null,
      evaluated_at: new Date().toISOString(),
      mandatory_return_buffer_minutes: LFSE_MANDATORY_RETURN_BUFFER_MINUTES,
      research_ingestion: {
        source: loadResult.source,
        live_portal_readback_status: loadResult.livePortalReadbackStatus,
        live_portal_verified: loadResult.livePortalVerified,
        last_synced_at: loadResult.lastSyncedAt,
        access_blocker: loadResult.accessBlocker,
        recommended_max_age_seconds: maxAgeSeconds,
      },
      research_qualifications: qualifications,
      blocked_umbrella_products:
        portSlug === "ketchikan"
          ? [...BLOCKED_KETCHIKAN_UMBRELLA_PRODUCTS]
          : [],
    },
    {
      status: 200,
      headers: {
        "Cache-Control": cacheControlHeader,
        "X-LFSE-Research-Contexts": String(qualifications.length),
      },
    },
  );
}
