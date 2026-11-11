import { NextRequest, NextResponse } from "next/server";
import {
  buildDccReturnUrl,
  emitDccEvent,
  getHandoffIdFromSearchParams,
} from "../../../../lib/dcc";
import { stripEdgePiiQueryParams } from "../../../../../../lib/dcc/shared/edgeContextAndPii";

const VALID_LFSE_PORTS: Readonly<Record<string, string>> = {
  juneau: "juneau",
  "juneau-alaska": "juneau",
  "juneau-ak": "juneau",
  skagway: "skagway",
  "skagway-alaska": "skagway",
  "skagway-ak": "skagway",
  ketchikan: "ketchikan",
  "ketchikan-alaska": "ketchikan",
  "ketchikan-ak": "ketchikan",
  sitka: "sitka",
  "sitka-alaska": "sitka",
  "sitka-ak": "sitka",
  "icy-strait-point": "icy-strait-point",
  hoonah: "icy-strait-point",
};

export async function GET(request: NextRequest) {
  const cleanIncoming = new URL(request.url);
  stripEdgePiiQueryParams(cleanIncoming);

  const handoffId = getHandoffIdFromSearchParams(cleanIncoming.searchParams);
  if (!handoffId) {
    return NextResponse.json(
      { ok: false, error: "missing_handoff_id" },
      { status: 400 },
    );
  }

  const rawPort = (cleanIncoming.searchParams.get("port") || "juneau-alaska")
    .trim()
    .toLowerCase();
  const normalizedLfsePort = VALID_LFSE_PORTS[rawPort] || null;
  const targetPath = normalizedLfsePort ? `/ports/${normalizedLfsePort}` : "/";

  const lfseUrl = new URL(
    targetPath,
    "https://www.lastfrontiershoreexcursions.com",
  );
  lfseUrl.searchParams.set("dcc_handoff_id", handoffId);
  lfseUrl.searchParams.set("source", "dcc");
  lfseUrl.searchParams.set("source_slug", "saveonthestrip-network-forward");
  lfseUrl.searchParams.set("source_page", "/handoff/partner/welcome-to-alaska");
  lfseUrl.searchParams.set("topic", "shore-excursions");
  lfseUrl.searchParams.set("port", rawPort);
  lfseUrl.searchParams.set("partner_satellite", "saveonthestrip");
  lfseUrl.searchParams.set("partner_reason", "traveler_reuse");
  lfseUrl.searchParams.set("partner_handoff_id", handoffId);
  lfseUrl.searchParams.set(
    "dcc_return",
    cleanIncoming.searchParams.get("dcc_return") ||
      buildDccReturnUrl("/vegas", handoffId),
  );
  stripEdgePiiQueryParams(lfseUrl);

  await emitDccEvent({
    handoffId,
    satelliteId: "saveonthestrip",
    eventType: "forwarded_to_partner",
    source: "saveonthestrip",
    sourcePath: "/handoff/partner/welcome-to-alaska",
    status: "forwarded",
    stage: "partner_handoff",
    attribution: {
      sourceSlug: "saveonthestrip-network-forward",
      sourcePage: "/handoff/partner/welcome-to-alaska",
      topicSlug: "shore-excursions",
    },
    booking: {
      citySlug: "las-vegas",
      portSlug: rawPort,
    },
    partner: {
      fromSite: "saveonthestrip",
      toSite: "last-frontier-shore-excursions",
      partnerHandoffId: handoffId,
      reason: "traveler_reuse",
    },
  }).catch(() => null);

  return NextResponse.redirect(lfseUrl, { status: 308 });
}
