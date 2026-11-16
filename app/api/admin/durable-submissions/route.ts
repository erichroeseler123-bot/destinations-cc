import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  ADMIN_SESSION_COOKIE,
  authorizeControlCenterCaller,
} from "@/lib/adminAccess";
import { listDccFactVerificationQueue } from "@/lib/dcc/cruise/canonicalLocationsAndRoutePatterns";
import { ensureFoundingPilotVerificationQueueSeeded } from "@/lib/dcc/cruise/foundingOrganizerPilotCohort";
import { resolveCruisePromenadeAdminTarget } from "@/lib/dcc/hostedCruisesAdminBridge";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PRIVATE_NO_STORE_HEADERS = {
  "Cache-Control": "private, no-store, max-age=0",
  "X-Robots-Tag": "noindex, nofollow",
};

async function readFallbackAdminSessionCookie(): Promise<string | null> {
  try {
    const store = await cookies();
    return store.get(ADMIN_SESSION_COOKIE)?.value || null;
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  const auth = await authorizeControlCenterCaller(
    request,
    await readFallbackAdminSessionCookie(),
  );
  if (!auth.authorized) {
    return NextResponse.json(
      { ok: false, error: "UNAUTHORIZED" },
      { status: 401, headers: PRIVATE_NO_STORE_HEADERS },
    );
  }

  const { searchParams } = new URL(request.url);
  const cpPreviewUrl = searchParams.get("cpPreviewUrl");
  const format = (searchParams.get("format") || "json").toLowerCase();
  const includeTest = searchParams.get("includeTest") !== "0";

  const { cpBaseUrl } = resolveCruisePromenadeAdminTarget({
    cpBaseUrlOverride: cpPreviewUrl,
  });
  ensureFoundingPilotVerificationQueueSeeded();
  const serviceSecret = (process.env.DCC_CP_SERVICE_SECRET || "").trim();
  const dccVerificationQueue = listDccFactVerificationQueue({
    includeSyntheticTest: includeTest,
  });

  if (!serviceSecret) {
    return NextResponse.json(
      {
        ok: true,
        cpConnected: false,
        cpBaseUrl,
        reason: "DCC_CP_SERVICE_SECRET not configured in environment",
        counts: {
          total: 0,
          genuineCount: 0,
          testCount: 0,
          needsAttentionCount: dccVerificationQueue.filter((q) => q.state === "needs_review").length,
          scheduleCorrectionsNeedsReviewCount: dccVerificationQueue.filter(
            (q) => q.state === "needs_review",
          ).length,
        },
        submissions: [],
        scheduleCorrections: [],
        dccVerificationQueue,
      },
      { status: 200, headers: PRIVATE_NO_STORE_HEADERS },
    );
  }

  const targetUrl = `${cpBaseUrl}/api/v2/durable-submissions?includeTest=${includeTest ? "1" : "0"}${format === "csv" ? "&format=csv" : ""}`;
  try {
    const upstream = await fetch(targetUrl, {
      method: "GET",
      headers: {
        "x-dcc-cp-service-secret": serviceSecret,
        "Cache-Control": "no-cache",
      },
      cache: "no-store",
    });

    if (format === "csv" && upstream.ok) {
      const csvText = await upstream.text();
      return new NextResponse(csvText, {
        status: 200,
        headers: {
          ...PRIVATE_NO_STORE_HEADERS,
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": 'attachment; filename="dcc-owner-durable-submissions-safe.csv"',
        },
      });
    }

    if (!upstream.ok) {
      return NextResponse.json(
        {
          ok: true,
          cpConnected: false,
          cpBaseUrl,
          reason: `Upstream Cruise Promenade returned HTTP ${upstream.status}`,
          counts: {
            total: 0,
            genuineCount: 0,
            testCount: 0,
            needsAttentionCount: dccVerificationQueue.filter((q) => q.state === "needs_review").length,
            scheduleCorrectionsNeedsReviewCount: dccVerificationQueue.filter(
              (q) => q.state === "needs_review",
            ).length,
          },
          submissions: [],
          scheduleCorrections: [],
          dccVerificationQueue,
        },
        { status: 200, headers: PRIVATE_NO_STORE_HEADERS },
      );
    }

    const body = await upstream.json();
    const dccNeedsReviewCount = dccVerificationQueue.filter(
      (q) => q.state === "needs_review",
    ).length;

    return NextResponse.json(
      {
        ok: true,
        cpConnected: true,
        cpBaseUrl,
        counts: {
          total: body.counts?.total ?? 0,
          genuineCount: body.counts?.genuineCount ?? 0,
          testCount: body.counts?.testCount ?? 0,
          needsAttentionCount: (body.counts?.needsAttentionCount ?? 0) + dccNeedsReviewCount,
          scheduleCorrectionsNeedsReviewCount:
            (body.counts?.scheduleCorrectionsNeedsReviewCount ?? 0) + dccNeedsReviewCount,
        },
        submissions: body.submissions ?? [],
        scheduleCorrections: body.scheduleCorrections ?? [],
        dccVerificationQueue,
      },
      { status: 200, headers: PRIVATE_NO_STORE_HEADERS },
    );
  } catch (err) {
    return NextResponse.json(
      {
        ok: true,
        cpConnected: false,
        cpBaseUrl,
        reason: err instanceof Error ? err.message : "CP connection error",
        counts: {
          total: 0,
          genuineCount: 0,
          testCount: 0,
          needsAttentionCount: dccVerificationQueue.filter((q) => q.state === "needs_review").length,
          scheduleCorrectionsNeedsReviewCount: dccVerificationQueue.filter(
            (q) => q.state === "needs_review",
          ).length,
        },
        submissions: [],
        scheduleCorrections: [],
        dccVerificationQueue,
      },
      { status: 200, headers: PRIVATE_NO_STORE_HEADERS },
    );
  }
}

export async function PATCH(request: Request) {
  const auth = await authorizeControlCenterCaller(
    request,
    await readFallbackAdminSessionCookie(),
  );
  if (!auth.authorized) {
    return NextResponse.json(
      { ok: false, error: "UNAUTHORIZED" },
      { status: 401, headers: PRIVATE_NO_STORE_HEADERS },
    );
  }

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const { cpBaseUrl } = resolveCruisePromenadeAdminTarget({
    cpBaseUrlOverride:
      typeof body.cpPreviewUrl === "string" ? body.cpPreviewUrl : null,
  });
  const serviceSecret = (process.env.DCC_CP_SERVICE_SECRET || "").trim();
  if (!serviceSecret) {
    return NextResponse.json(
      { ok: false, error: "DCC_CP_SERVICE_SECRET not configured" },
      { status: 503, headers: PRIVATE_NO_STORE_HEADERS },
    );
  }

  const upstream = await fetch(`${cpBaseUrl}/api/v2/durable-submissions`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "x-dcc-cp-service-secret": serviceSecret,
    },
    body: JSON.stringify(body),
  });
  const data = await upstream.json().catch(() => ({}));
  return NextResponse.json(data, {
    status: upstream.status,
    headers: PRIVATE_NO_STORE_HEADERS,
  });
}
