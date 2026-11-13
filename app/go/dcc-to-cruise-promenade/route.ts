import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { stripEdgePiiQueryParams } from "@/lib/dcc/shared/edgeContextAndPii";

const EMAIL_RE = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const SAFE_JOURNEY_ID_RE = /^[a-zA-Z0-9_-]{8,64}$/;
const SAFE_STAGE_RE = /^[a-zA-Z0-9_-]{1,48}$/;
const SAFE_BERTH_RE = /^[a-zA-Z0-9_-]{1,24}$/;
const SAFE_HHMM_RE = /^\d{1,2}:\d{2}$/;

function clean(value: string | null, max = 120) {
  return (value || "")
    .replace(EMAIL_RE, "")
    .replace(/\bdcc_ctx_[a-z0-9_-]+/gi, "")
    .trim()
    .slice(0, max);
}

function slug(value: string | null) {
  return clean(value, 80).toLowerCase().replace(/[^a-z0-9-]/g, "");
}

export async function GET(request: Request) {
  const incoming = new URL(request.url);
  stripEdgePiiQueryParams(incoming);

  const target = new URL("https://cruisepromenade.com/api/dcc-handoff");

  const cruiseLine = clean(
    incoming.searchParams.get("cruise_line") || incoming.searchParams.get("cruiseLine"),
    120,
  );
  const ship = clean(incoming.searchParams.get("ship"), 120);
  const sailingDate = clean(
    incoming.searchParams.get("sailing_date") ||
      incoming.searchParams.get("sailingDate") ||
      incoming.searchParams.get("sailDate"),
    10,
  );
  const port = slug(incoming.searchParams.get("port"));
  const portDate = clean(
    incoming.searchParams.get("port_date") ||
      incoming.searchParams.get("portDate") ||
      incoming.searchParams.get("date"),
    10,
  );
  const partySize = clean(
    incoming.searchParams.get("party_size") || incoming.searchParams.get("partySize"),
    3,
  );
  const tourCode = clean(
    incoming.searchParams.get("tour_code") || incoming.searchParams.get("productCode"),
    40,
  );
  const mode = clean(
    incoming.searchParams.get("mode") || incoming.searchParams.get("flow"),
    32,
  );
  const journeyIdRaw = clean(
    incoming.searchParams.get("journey_id") || incoming.searchParams.get("journeyId"),
    64,
  );
  const stageRaw = clean(incoming.searchParams.get("stage"), 48);
  const shipArrivalRaw = clean(
    incoming.searchParams.get("shipArrival") ||
      incoming.searchParams.get("ship_arrival") ||
      incoming.searchParams.get("arrival"),
    10,
  );
  const allAboardRaw = clean(
    incoming.searchParams.get("allAboard") || incoming.searchParams.get("all_aboard"),
    10,
  );
  const berthRaw = clean(incoming.searchParams.get("berth"), 24);
  const tenderRaw = clean(incoming.searchParams.get("tender"), 16).toLowerCase();
  const qaTestRaw = clean(
    incoming.searchParams.get("qa_test") || incoming.searchParams.get("is_test"),
    8,
  ).toLowerCase();

  const existingHandoffId = clean(
    incoming.searchParams.get("dcc_handoff_id") ||
      incoming.searchParams.get("referral_id") ||
      incoming.searchParams.get("ref"),
    120,
  );
  const handoffId = existingHandoffId || `ho_${randomUUID()}`;

  if (cruiseLine) target.searchParams.set("cruise_line", cruiseLine);
  if (ship) target.searchParams.set("ship", ship);
  if (/^\d{4}-\d{2}-\d{2}$/.test(sailingDate)) target.searchParams.set("sailing_date", sailingDate);
  if (port) target.searchParams.set("port", port);
  if (/^\d{4}-\d{2}-\d{2}$/.test(portDate)) target.searchParams.set("port_date", portDate);
  if (/^\d{1,2}$/.test(partySize) && Number(partySize) >= 1) {
    target.searchParams.set("party_size", partySize);
  }
  if (tourCode) target.searchParams.set("tour_code", tourCode);
  if (mode === "import") target.searchParams.set("mode", "import");
  if (SAFE_JOURNEY_ID_RE.test(journeyIdRaw) && !journeyIdRaw.startsWith("dcc_ctx_")) {
    target.searchParams.set("journey_id", journeyIdRaw);
  }
  if (SAFE_STAGE_RE.test(stageRaw)) {
    target.searchParams.set("stage", stageRaw);
  }
  if (SAFE_HHMM_RE.test(shipArrivalRaw)) {
    target.searchParams.set("shipArrival", shipArrivalRaw);
  }
  if (SAFE_HHMM_RE.test(allAboardRaw)) {
    target.searchParams.set("allAboard", allAboardRaw);
  }
  if (SAFE_BERTH_RE.test(berthRaw)) {
    target.searchParams.set("berth", berthRaw);
  }
  if (["1", "0", "true", "false", "dock", "tender", "mixed"].includes(tenderRaw)) {
    target.searchParams.set("tender", tenderRaw);
  }
  if (qaTestRaw === "1" || qaTestRaw === "true") {
    target.searchParams.set("qa_test", "1");
  }
  target.searchParams.set("dcc_handoff_id", handoffId);

  const response = NextResponse.redirect(target, 302);
  response.headers.set("x-dcc-handoff-id", handoffId);
  return response;
}
