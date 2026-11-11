import { NextResponse } from "next/server";
import {
  getCruisePortDirectory,
  getCruisePortViatorSearch,
  type CruisePortDirectoryEntry,
} from "@/lib/dcc/cruisePortDirectory";
import {
  queryPortDayExcursionCatalog,
  type PortDayExcursionCard,
  type PortDayExcursionCategoryFilter,
} from "@/lib/dcc/cruisePortExcursionCatalogEngine";
import {
  buildCanonicalFitEvaluation,
  type CanonicalFitEvaluation,
  type InformationBasis,
} from "@/lib/dcc/shared/canonicalFitStatus";
import { buildAddToCruisePromenadeUrl } from "@/lib/dcc/shared/addToCruisePromenadeUrl";

export const dynamic = "force-dynamic";

const SITE_URL = "https://www.destinationcommandcenter.com";
const TRANSACTION_DISCLOSURE =
  "Native machine booking requires explicit supplier authorization; use context-preserving handoff." as const;

export type TravelGraphAvailableRoute =
  | "marketplace_affiliate"
  | "direct_operator_handoff"
  | "human_concierge";

export interface TravelGraphTransactionCapabilities {
  nativeBookingAuthorized: false;
  availableRoutes: TravelGraphAvailableRoute[];
  disclosure: typeof TRANSACTION_DISCLOSURE;
}

export interface TravelGraphEvaluatedOption {
  optionId: string;
  productCode: string | null;
  optionCode: string | null;
  title: string;
  operatorName: string;
  provider: string;
  primaryCategory: string;
  categories: string[];
  durationMinutes: number | null;
  fromPriceUsd: number | null;
  currency: string;
  selectedDepartureTime: string | null;
  estimatedBackAtPierTime: string | null;
  canonicalFit: CanonicalFitEvaluation;
  transactionCapabilities: TravelGraphTransactionCapabilities;
  handoffUrl: string;
  addToCruisePromenadeUrl: string;
}

interface NormalizedEvaluateInput {
  shipSlug: string | null;
  sailDate: string | null;
  portSlug: string;
  portDate: string | null;
  arrivalTime: string | null;
  allAboardTime: string | null;
  partySize: number;
  category: PortDayExcursionCategoryFilter;
  limit: number;
}

const VALID_CATEGORIES = new Set<PortDayExcursionCategoryFilter>([
  "all",
  "sightseeing",
  "wildlife",
  "food",
  "culture",
  "adventure",
  "family",
]);

function normalizeCategory(raw?: string | null): PortDayExcursionCategoryFilter {
  const cleaned = (raw || "all").trim().toLowerCase() as PortDayExcursionCategoryFilter;
  return VALID_CATEGORIES.has(cleaned) ? cleaned : "all";
}

function subtractMinutesFromTime(hhmm: string | null | undefined, minutes: number): string | null {
  if (!hhmm || !/^\d{1,2}:\d{2}$/.test(hhmm.trim())) return null;
  const [hStr, mStr] = hhmm.trim().split(":");
  const h = Number(hStr);
  const m = Number(mStr);
  if (!Number.isFinite(h) || !Number.isFinite(m) || h < 0 || h > 23 || m < 0 || m > 59) {
    return null;
  }
  const total = h * 60 + m - Math.max(0, Math.round(minutes));
  if (total < 0) return null;
  const outH = Math.floor(total / 60) % 24;
  const outM = total % 60;
  return `${String(outH).padStart(2, "0")}:${String(outM).padStart(2, "0")}`;
}

function resolvePortFromDirectory(rawPort: string): CruisePortDirectoryEntry | null {
  const slugCandidate = rawPort.trim().toLowerCase();
  if (!slugCandidate) return null;
  const dir = getCruisePortDirectory();
  return (
    dir.find(
      (entry) =>
        entry.slug === slugCandidate ||
        entry.aliases?.some((a) => a.toLowerCase() === slugCandidate),
    ) || null
  );
}

function toAbsoluteDccUrl(href: string): string {
  if (!href) return `${SITE_URL}/ports`;
  if (href.startsWith("https://") || href.startsWith("http://")) return href;
  return `${SITE_URL}${href.startsWith("/") ? "" : "/"}${href}`;
}

function resolveSpecialistDeskFallback(portSlug: string): string | null {
  if (portSlug === "juneau") return "https://juneauflightdeck.com";
  if (
    portSlug === "ketchikan" ||
    portSlug === "skagway" ||
    portSlug === "sitka" ||
    portSlug === "icy-strait-point"
  ) {
    return `https://lastfrontiershoreexcursions.com/ports/${portSlug}`;
  }
  if (portSlug === "new-orleans") return "https://www.welcometoneworleanstours.com";
  return null;
}

function mapCardToEvaluatedOption(params: {
  card: PortDayExcursionCard;
  portSlug: string;
  portDate: string | null;
  shipLabel: string | null;
  sailDate: string | null;
  partySize: number;
  evaluatedAt: string;
}): TravelGraphEvaluatedOption {
  const { card, portSlug, portDate, shipLabel, sailDate, partySize, evaluatedAt } = params;
  const tf = card.timeFit;

  const hasVerifiedSchedule =
    tf.hasVerifiedDeparture &&
    tf.hasVerifiedReturnBuffer &&
    tf.missingFields.length === 0;

  const informationBasis: InformationBasis =
    tf.status === "missing_operator_info"
      ? "unverified"
      : hasVerifiedSchedule && tf.departureEvidenceSource
        ? "official_operating_fact"
        : "modeled_schedule_math";

  const assumptions: string[] = [
    `Required return buffer before all-aboard: ${tf.requiredReturnBufferMinutes} minutes.`,
  ];
  if (typeof tf.oneWayTransferMinutes === "number") {
    assumptions.push(
      `Modeled one-way pier-to-meeting transfer: ${tf.oneWayTransferMinutes} minutes.`,
    );
  }
  if (typeof tf.checkInCutoffMinutes === "number") {
    assumptions.push(`Operator check-in cutoff: ${tf.checkInCutoffMinutes} minutes prior.`);
  }
  if (tf.missingFields.length > 0) {
    assumptions.push(`Unverified schedule fields: ${tf.missingFields.join(", ")}.`);
  }

  const sources: string[] = [
    "dcc:cruise-port-excursion-catalog-engine",
    ...(tf.departureEvidenceSource ? [tf.departureEvidenceSource] : []),
    ...(tf.transferEvidenceSource ? [tf.transferEvidenceSource] : []),
    ...(tf.meetingPointEvidenceSource ? [tf.meetingPointEvidenceSource] : []),
  ];

  const canonicalFit = buildCanonicalFitEvaluation({
    rawStatus:
      card.seatAvailability.status === "sold_out" ? "sold_out" : tf.status,
    label: tf.statusLabel,
    informationBasis,
    factAppliesAt: portDate || card.seatAvailability.checkedDate || null,
    learnedByDccAt: evaluatedAt,
    freshnessState: tf.status === "missing_operator_info" ? "unknown" : "current",
    pastDepartureRejected: Boolean(card.seatAvailability.pastDepartureRejected),
    seatAvailable: card.seatAvailability.available,
    assumptions,
    sources,
  });

  const availableRoutes: TravelGraphAvailableRoute[] =
    card.provider === "operator_direct"
      ? ["direct_operator_handoff", "human_concierge"]
      : ["marketplace_affiliate", "human_concierge"];

  const handoffUrl = toAbsoluteDccUrl(
    card.handoff.dccTrackedHref || card.handoff.exactProductUrl,
  );

  const addToCruisePromenadeUrl = buildAddToCruisePromenadeUrl({
    title: card.title,
    port: portSlug,
    date: portDate,
    ship: shipLabel,
    sailDate,
    durationMinutes: card.durationMinutes,
    partySize,
    operator: card.operatorName,
    fitStatus: canonicalFit.status,
    sourceSite: "destinationcommandcenter.com",
    productCode: card.productCode || card.tourId,
  });

  return {
    optionId: card.tourId,
    productCode: card.productCode,
    optionCode: card.optionCode,
    title: card.title,
    operatorName: card.operatorName,
    provider: card.provider,
    primaryCategory: card.primaryCategory,
    categories: card.categories,
    durationMinutes: card.durationMinutes,
    fromPriceUsd: card.fromPriceUsd,
    currency: card.currency,
    selectedDepartureTime: tf.selectedDepartureTime,
    estimatedBackAtPierTime: tf.estimatedBackAtPierTime,
    canonicalFit,
    transactionCapabilities: {
      nativeBookingAuthorized: false,
      availableRoutes,
      disclosure: TRANSACTION_DISCLOSURE,
    },
    handoffUrl,
    addToCruisePromenadeUrl,
  };
}

async function runEvaluation(input: NormalizedEvaluateInput) {
  const evaluatedAt = new Date().toISOString();
  const portEntry = resolvePortFromDirectory(input.portSlug);
  if (!portEntry) {
    return NextResponse.json(
      {
        ok: false,
        error: "UNKNOWN_CRUISE_PORT",
        message: `Port '${input.portSlug}' was not found in the 629-port DCC cruise port directory.`,
      },
      {
        status: 404,
        headers: {
          "Cache-Control": "no-store",
          "Access-Control-Allow-Origin": "*",
        },
      },
    );
  }

  const catalog = await queryPortDayExcursionCatalog({
    portSlug: portEntry.slug,
    shipSlug: input.shipSlug,
    ship: input.shipSlug || undefined,
    sailingDate: input.portDate || input.sailDate || undefined,
    cruiseSailDate: input.sailDate || input.portDate || undefined,
    shipArrivalTime: input.arrivalTime || undefined,
    shipAllAboardTime: input.allAboardTime || undefined,
    partySize: input.partySize,
    category: input.category,
    viewMode: "browse_all",
    limit: input.limit,
    originatingSite: "destinationcommandcenter.com",
    surface: "travel_graph_evaluate_v1",
  });

  const resolvedPortDate =
    input.portDate || catalog?.sailingWindow.sailingDate || input.sailDate || null;
  const resolvedArrivalTime =
    input.arrivalTime || catalog?.sailingWindow.shipArrivalTime || null;
  const resolvedAllAboardTime =
    input.allAboardTime || catalog?.sailingWindow.shipAllAboardTime || null;
  const requiredReturnBufferMinutes =
    catalog?.port.requiredReturnBufferMinutes ?? 60;
  const oneWayPierTransferMinutes =
    catalog?.port.defaultOneWayPierTransferMinutes ?? 20;
  const checkInCutoffMinutes = catalog?.port.defaultCheckInCutoffMinutes ?? 15;
  const safeReturnCutoffTime = subtractMinutesFromTime(
    resolvedAllAboardTime,
    requiredReturnBufferMinutes,
  );
  const resolvedShipLabel =
    catalog?.sailingWindow.shipName ||
    catalog?.sailingWindow.shipSlug ||
    input.shipSlug ||
    null;

  let options: TravelGraphEvaluatedOption[] = (catalog?.tours || []).map((card) =>
    mapCardToEvaluatedOption({
      card,
      portSlug: portEntry.slug,
      portDate: resolvedPortDate,
      shipLabel: resolvedShipLabel,
      sailDate: input.sailDate,
      partySize: input.partySize,
      evaluatedAt,
    }),
  );

  // If a reference-tier port has no pre-indexed catalog rows yet (and caller asked for `all`),
  // emit an honest discovery/concierge option so callers never receive fabricated fit claims.
  if (options.length === 0 && input.category === "all") {
    const viatorSearch = getCruisePortViatorSearch(portEntry);
    const specialistDesk = resolveSpecialistDeskFallback(portEntry.slug);
    const handoffUrl = specialistDesk
      ? specialistDesk
      : viatorSearch
        ? `${SITE_URL}/go/out?${new URLSearchParams({
            url: viatorSearch,
            port: portEntry.slug,
            surface: "travel_graph_evaluate_v1",
            originatingSite: "destinationcommandcenter.com",
          }).toString()}`
        : `${SITE_URL}${portEntry.path}`;

    const hasExplicitPortWindow = Boolean(
      input.arrivalTime && input.allAboardTime,
    );
    const fallbackFit = buildCanonicalFitEvaluation({
      rawStatus: hasExplicitPortWindow ? "needs_verification" : "unknown",
      label: hasExplicitPortWindow
        ? "Needs operator departure & pier-buffer verification"
        : "Fit unknown without ship window and operator departure times",
      informationBasis: "unverified",
      factAppliesAt: resolvedPortDate,
      learnedByDccAt: evaluatedAt,
      freshnessState: "unknown",
      assumptions: [
        `Default required return buffer before all-aboard: ${requiredReturnBufferMinutes} minutes.`,
        "Exact operator departure time and pier-to-meeting transfer duration must be verified before booking.",
      ],
      sources: ["dcc:cruise-port-directory"],
    });

    const fallbackTitle = `${portEntry.name} Shore Excursion Options`;
    options = [
      {
        optionId: `port-discovery:${portEntry.slug}`,
        productCode: null,
        optionCode: null,
        title: fallbackTitle,
        operatorName: specialistDesk
          ? `${portEntry.name} Specialist Desk`
          : `${portEntry.name} Verified Providers`,
        provider: specialistDesk ? "specialist_desk" : "viator",
        primaryCategory: "sightseeing",
        categories: ["sightseeing"],
        durationMinutes: null,
        fromPriceUsd: null,
        currency: "USD",
        selectedDepartureTime: null,
        estimatedBackAtPierTime: null,
        canonicalFit: fallbackFit,
        transactionCapabilities: {
          nativeBookingAuthorized: false,
          availableRoutes: viatorSearch
            ? ["marketplace_affiliate", "human_concierge"]
            : ["human_concierge"],
          disclosure: TRANSACTION_DISCLOSURE,
        },
        handoffUrl,
        addToCruisePromenadeUrl: buildAddToCruisePromenadeUrl({
          title: fallbackTitle,
          port: portEntry.slug,
          date: resolvedPortDate,
          ship: resolvedShipLabel,
          sailDate: input.sailDate,
          partySize: input.partySize,
          fitStatus: fallbackFit.status,
          sourceSite: "destinationcommandcenter.com",
        }),
      },
    ];
  }

  return NextResponse.json(
    {
      ok: true,
      spec: "dcc-travel-graph-evaluate/1.0",
      evaluatedAt,
      commissionNeutral: true,
      context: {
        port: {
          slug: portEntry.slug,
          name: portEntry.name,
          country: portEntry.country || catalog?.port.country || null,
          coverage: portEntry.coverage,
          path: portEntry.path,
          pierName: catalog?.port.defaultPierName || null,
          dockOrTender: catalog?.port.dockOrTender || "unknown",
        },
        shipSlug: input.shipSlug,
        shipName: resolvedShipLabel,
        sailDate: input.sailDate,
        portDate: resolvedPortDate,
        partySize: input.partySize,
        category: input.category,
        portWindow: {
          arrivalTime: resolvedArrivalTime,
          arrivalTimeSource: catalog?.sailingWindow.arrivalTimeSource || (input.arrivalTime ? "request_param" : "missing"),
          allAboardTime: resolvedAllAboardTime,
          allAboardTimeSource: catalog?.sailingWindow.allAboardTimeSource || (input.allAboardTime ? "request_param" : "missing"),
          timingStatus: catalog?.sailingWindow.timingStatus || (input.arrivalTime && input.allAboardTime ? "verified" : "needs_verification"),
        },
        bufferAssumptions: {
          requiredReturnBufferMinutes,
          oneWayPierTransferMinutes,
          checkInCutoffMinutes,
          assumptions: [
            `Travelers must return to pier at least ${requiredReturnBufferMinutes} minutes before all-aboard.`,
            `Default pier transfer modeled at ${oneWayPierTransferMinutes} minutes each way when operator-specific transfer timing is absent.`,
            "Fit evaluation is 100% commission-neutral; commercial routes never alter status or sort order.",
          ],
        },
        safeReturnCutoffTime,
      },
      summary: {
        totalOptions: options.length,
        fitsCount: options.filter((o) => o.canonicalFit.status === "fits").length,
        doesNotFitCount: options.filter((o) => o.canonicalFit.status === "does_not_fit").length,
        needsVerificationCount: options.filter((o) => o.canonicalFit.status === "needs_verification").length,
        unavailableCount: options.filter((o) => o.canonicalFit.status === "unavailable").length,
        unknownCount: options.filter((o) => o.canonicalFit.status === "unknown").length,
      },
      options,
    },
    {
      status: 200,
      headers: {
        "Cache-Control": "no-store",
        "Access-Control-Allow-Origin": "*",
      },
    },
  );
}

function parseInputRecord(raw: Record<string, unknown>): NormalizedEvaluateInput | NextResponse {
  const str = (keys: string[]): string | null => {
    for (const k of keys) {
      const v = raw[k];
      if (typeof v === "string" && v.trim().length > 0) {
        return v.trim();
      }
    }
    return null;
  };

  const portSlug = str(["portSlug", "port", "port_slug"]);
  if (!portSlug) {
    return NextResponse.json(
      {
        ok: false,
        error: "MISSING_PORT_SLUG",
        message: "Provide `portSlug` (or `port`) to evaluate port-day travel graph options.",
      },
      {
        status: 400,
        headers: {
          "Cache-Control": "no-store",
          "Access-Control-Allow-Origin": "*",
        },
      },
    );
  }

  const rawParty = raw.partySize ?? raw.adults ?? raw.guests ?? 2;
  const parsedParty = Number(rawParty);
  const partySize =
    Number.isFinite(parsedParty) && parsedParty >= 1
      ? Math.min(100, Math.round(parsedParty))
      : 2;

  const rawLimit = raw.limit ?? 12;
  const parsedLimit = Number(rawLimit);
  const limit =
    Number.isFinite(parsedLimit) && parsedLimit >= 1
      ? Math.min(50, Math.round(parsedLimit))
      : 12;

  return {
    shipSlug: str(["shipSlug", "ship", "ship_slug"]),
    sailDate: str(["sailDate", "sail_date", "cruiseSailDate"]),
    portSlug,
    portDate: str(["portDate", "date", "port_date", "sailingDate"]),
    arrivalTime: str(["arrivalTime", "shipArrival", "shipArrivalTime", "arrival_time"]),
    allAboardTime: str(["allAboardTime", "allAboard", "shipAllAboardTime", "all_aboard_time"]),
    partySize,
    category: normalizeCategory(str(["category"])),
    limit,
  };
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const raw: Record<string, unknown> = {};
  for (const [k, v] of url.searchParams.entries()) {
    raw[k] = v;
  }
  const parsed = parseInputRecord(raw);
  if (parsed instanceof NextResponse) return parsed;
  return runEvaluation(parsed);
}

export async function POST(request: Request) {
  let body: Record<string, unknown> = {};
  try {
    const json = await request.json();
    if (json && typeof json === "object" && !Array.isArray(json)) {
      body = json as Record<string, unknown>;
    }
  } catch {
    return NextResponse.json(
      {
        ok: false,
        error: "INVALID_JSON_BODY",
        message: "Request body must be a valid JSON object.",
      },
      {
        status: 400,
        headers: {
          "Cache-Control": "no-store",
          "Access-Control-Allow-Origin": "*",
        },
      },
    );
  }
  const parsed = parseInputRecord(body);
  if (parsed instanceof NextResponse) return parsed;
  return runEvaluation(parsed);
}
