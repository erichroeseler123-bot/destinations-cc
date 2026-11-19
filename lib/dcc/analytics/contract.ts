import { z } from "zod";

export const ANALYTICS_SCHEMA_VERSION = "dcc.analytics.event.v2" as const;
export const METRIC_DICTIONARY_VERSION = "dcc.metrics.v2.0.0" as const;

export type AnalyticsEnvironment = "production" | "preview" | "development" | "test";

export type TrafficClassification =
  | "observed_browser"
  | "known_bot"
  | "suspected_automation"
  | "qa_or_synthetic"
  | "internal"
  | "unclassified_non_pageview";

export type InstrumentationCoverageTier =
  | "v2_end_to_end"
  | "v2_server_adapter"
  | "supplemental_manifest"
  | "uninstrumented_unavailable"
  | "retired_or_redirected"
  | "excluded_community"
  | "excluded_external";

export type CanonicalAnalyticsSiteId =
  | "destinationcommandcenter"
  | "cruisepromenade"
  | "lastfrontiershoreexcursions"
  | "juneauflightdeck"
  | "welcometoneworleanstours"
  | "welcometotheswamp"
  | "vibearoundtown"
  | "gosno"
  | "feastlyspread"
  | "brinkberry"
  | "partyatredrocks"
  | "420friendlyairportpickup"
  | "welcometothedells"
  | "saveonthestrip"
  | "frenchquarterorientation"
  | "bluehillsoutpost"
  | "somersetshuttle"
  | "shuttleya"
  | "laketahoebus"
  | "sedonajeep"
  | "redrocksfastpass"
  | "mightyargoshuttle"
  | "rollcallusa"
  | "welcometoalaskatours"
  | "unregistered_or_legacy";

export type ContentFamily =
  | "cruise_sailing"
  | "hosted_group"
  | "uncruise"
  | "independent_alaska_ferry"
  | "alaska_rv"
  | "fishing_lodges"
  | "weekend_in_juneau"
  | "flightseeing"
  | "new_orleans_swamp"
  | "operating_mor"
  | "general_discovery";

export type JourneyKind =
  | "cruise_sailing"
  | "hosted_group"
  | "expedition_uncruise"
  | "independent_alaska_ferry"
  | "independent_rv"
  | "alaska_stay_or_lodge"
  | "operating_transfer_or_event";

export const TRAFFIC_EVENT_TYPES = [
  "page_viewed",
  "guide_engaged",
  "printable_view_opened",
  "cross_site_handoff_clicked",
  "cross_site_handoff_arrived",
] as const;

export const TRIP_LIFECYCLE_EVENT_TYPES = [
  "planning_entry_selected",
  "trip_draft_started",
  "trip_persisted",
  "trip_customized",
  "confirmation_staged",
  "confirmation_reviewed_edited",
  "confirmation_applied",
  "confirmation_rejected",
  "confirmation_amended",
  "confirmation_cancelled",
  "invitation_shared",
  "companion_participated",
  "participant_merged",
  "trip_returned_later",
  "seller_handoff_initiated",
  "booking_outcome_confirmed",
  "trip_deleted",
] as const;

export const ALL_ANALYTICS_EVENT_TYPES = [
  ...TRAFFIC_EVENT_TYPES,
  ...TRIP_LIFECYCLE_EVENT_TYPES,
] as const;

export type AnalyticsEventType = (typeof ALL_ANALYTICS_EVENT_TYPES)[number];
export type AnalyticsLayer = "traffic" | "trip_lifecycle";

export interface AnalyticsSiteRegistryEntry {
  siteId: Exclude<CanonicalAnalyticsSiteId, "unregistered_or_legacy">;
  displayName: string;
  canonicalDomain: string;
  aliases: readonly string[];
  commercialModel:
    | "owned_planning_hub"
    | "owned_storefront_external_checkout"
    | "owned_inquiry_feeder"
    | "owned_direct_checkout"
    | "dcc_sourced_direct_10pct"
    | "owned_hosted_community"
    | "retired_or_redirected"
    | "excluded_external";
  inActive12Portfolio: boolean;
  instrumentationTier: InstrumentationCoverageTier;
  pageviewCollectionWired: boolean;
  residency: string;
  redirectAndSourceNotes: string;
  externalSourcesStatus: {
    ga4: "unavailable" | "not_configured";
    gsc: "snapshot_attached_2026_11_19" | "unavailable";
    vercelWebAnalytics: "unavailable" | "not_configured";
  };
  outcomeFeedMode:
    | "modified_since_poller"
    | "direct_mor_summary"
    | "click_level_only"
    | "inquiry_only"
    | "not_applicable";
}

export const ANALYTICS_SITE_REGISTRY: readonly AnalyticsSiteRegistryEntry[] = [
  {
    siteId: "destinationcommandcenter",
    displayName: "Destination Command Center",
    canonicalDomain: "destinationcommandcenter.com",
    aliases: [
      "dcc",
      "destination-command-center",
      "destinations-cc",
      "dcc:site:destination-command-center",
    ],
    commercialModel: "owned_planning_hub",
    inActive12Portfolio: true,
    instrumentationTier: "v2_end_to_end",
    pageviewCollectionWired: true,
    residency: "destinations-cc (root app)",
    redirectAndSourceNotes: "v2 DccAnalyticsBridge + /go/out & /go/commerce/handoff server bridges active.",
    externalSourcesStatus: { ga4: "unavailable", gsc: "unavailable", vercelWebAnalytics: "unavailable" },
    outcomeFeedMode: "modified_since_poller",
  },
  {
    siteId: "cruisepromenade",
    displayName: "Cruise Promenade",
    canonicalDomain: "cruisepromenade.com",
    aliases: ["cp", "cruise-promenade", "dcc:site:cruise-promenade"],
    commercialModel: "owned_planning_hub",
    inActive12Portfolio: true,
    instrumentationTier: "v2_end_to_end",
    pageviewCollectionWired: true,
    residency: "cruisepromenade (dedicated repo)",
    redirectAndSourceNotes: "v2 client + 10-stage server lifecycle + durable outbox; Nov 19 GSC export attached.",
    externalSourcesStatus: { ga4: "unavailable", gsc: "snapshot_attached_2026_11_19", vercelWebAnalytics: "unavailable" },
    outcomeFeedMode: "click_level_only",
  },
  {
    siteId: "lastfrontiershoreexcursions",
    displayName: "Last Frontier Shore Excursions",
    canonicalDomain: "lastfrontiershoreexcursions.com",
    aliases: [
      "lfse",
      "lastfrontier",
      "last-frontier",
      "last-frontier-shore-excursions",
      "lastfrontier-alaska",
      "dcc:site:last-frontier-shore-excursions",
    ],
    commercialModel: "owned_storefront_external_checkout",
    inActive12Portfolio: true,
    instrumentationTier: "v2_end_to_end",
    pageviewCollectionWired: true,
    residency: "destinations-cc (apps/last-frontier-shore-excursions)",
    redirectAndSourceNotes: "v2 LfseAnalyticsBridge + /api/telemetry proxy active across all SE Alaska & lodge pages.",
    externalSourcesStatus: { ga4: "unavailable", gsc: "unavailable", vercelWebAnalytics: "unavailable" },
    outcomeFeedMode: "click_level_only",
  },
  {
    siteId: "juneauflightdeck",
    displayName: "Juneau Flight Deck",
    canonicalDomain: "juneauflightdeck.com",
    aliases: ["jfd", "juneau-flight-deck", "dcc:site:juneau-flight-deck"],
    commercialModel: "owned_storefront_external_checkout",
    inActive12Portfolio: true,
    instrumentationTier: "v2_end_to_end",
    pageviewCollectionWired: true,
    residency: "destinations-cc (apps/juneauflightdeck)",
    redirectAndSourceNotes: "v2 DccNetworkBridge + /api/network/telemetry proxy active; /go/juneau/helicopter-tours edge route.",
    externalSourcesStatus: { ga4: "unavailable", gsc: "unavailable", vercelWebAnalytics: "unavailable" },
    outcomeFeedMode: "click_level_only",
  },
  {
    siteId: "welcometoneworleanstours",
    displayName: "Welcome to New Orleans Tours",
    canonicalDomain: "welcometoneworleanstours.com",
    aliases: [
      "wtno",
      "wno",
      "wno-tours",
      "wtonot",
      "wno-commerce",
      "welcome-to-new-orleans-tours",
      "dcc:site:wno-tours",
    ],
    commercialModel: "owned_storefront_external_checkout",
    inActive12Portfolio: true,
    instrumentationTier: "v2_server_adapter",
    pageviewCollectionWired: true,
    residency: "destinations-cc (root host rewrites to /new-orleans/*)",
    redirectAndSourceNotes: "Host-rewritten inside DCC root layout (DccAnalyticsBridge + /api/internal/corridor-events + /go/commerce/handoff).",
    externalSourcesStatus: { ga4: "unavailable", gsc: "unavailable", vercelWebAnalytics: "unavailable" },
    outcomeFeedMode: "click_level_only",
  },
  {
    siteId: "welcometotheswamp",
    displayName: "Welcome to the Swamp",
    canonicalDomain: "welcometotheswamp.com",
    aliases: ["wts", "welcome-to-the-swamp", "dcc:site:welcome-to-the-swamp"],
    commercialModel: "owned_storefront_external_checkout",
    inActive12Portfolio: true,
    instrumentationTier: "v2_server_adapter",
    pageviewCollectionWired: false,
    residency: "destinations-cc (apps/welcometotheswamp)",
    redirectAndSourceNotes: "Bridged via /api/network/telemetry & /go/new-orleans/swamp-tours; v2 client SDK pending rollout.",
    externalSourcesStatus: { ga4: "unavailable", gsc: "unavailable", vercelWebAnalytics: "unavailable" },
    outcomeFeedMode: "modified_since_poller",
  },
  {
    siteId: "vibearoundtown",
    displayName: "Vibing Around Tour Co.",
    canonicalDomain: "vibearoundtown.com",
    aliases: ["vat", "vibing-around", "vibe-around-town", "dcc:site:vibe-around-town"],
    commercialModel: "owned_inquiry_feeder",
    inActive12Portfolio: true,
    instrumentationTier: "v2_server_adapter",
    pageviewCollectionWired: false,
    residency: "vibing-around (external repo)",
    redirectAndSourceNotes: "Bridged via DCC /api/network/telemetry; external repo v2 client SDK pending rollout.",
    externalSourcesStatus: { ga4: "unavailable", gsc: "unavailable", vercelWebAnalytics: "unavailable" },
    outcomeFeedMode: "inquiry_only",
  },
  {
    siteId: "gosno",
    displayName: "GoSno",
    canonicalDomain: "gosno.co",
    aliases: [
      "gosno-production",
      "bigsky-gosno",
      "bigsky.gosno.co",
      "denver-to-mountains",
      "dcc:site:gosno",
    ],
    commercialModel: "owned_direct_checkout",
    inActive12Portfolio: true,
    instrumentationTier: "v2_server_adapter",
    pageviewCollectionWired: false,
    residency: "gosno-production (external repo) + bigsky.gosno.co",
    redirectAndSourceNotes: "Inbound /go/dcc-to-gosno & /go/denver/breckenridge/shared; Direct MoR summary API; client pageview SDK not wired.",
    externalSourcesStatus: { ga4: "unavailable", gsc: "unavailable", vercelWebAnalytics: "unavailable" },
    outcomeFeedMode: "direct_mor_summary",
  },
  {
    siteId: "feastlyspread",
    displayName: "FeastlySpread",
    canonicalDomain: "feastlyspread.com",
    aliases: [
      "feastly",
      "feastly-spread",
      "v0-feastlyspread",
      "feastly-big-ass-italian-night",
      "dcc:site:feastly-spread",
    ],
    commercialModel: "owned_direct_checkout",
    inActive12Portfolio: true,
    instrumentationTier: "v2_server_adapter",
    pageviewCollectionWired: false,
    residency: "v0-feastlyspread (external repo)",
    redirectAndSourceNotes: "External Direct MoR repo; client pageview SDK not yet wired (`unavailable` until instrumented).",
    externalSourcesStatus: { ga4: "unavailable", gsc: "unavailable", vercelWebAnalytics: "unavailable" },
    outcomeFeedMode: "direct_mor_summary",
  },
  {
    siteId: "brinkberry",
    displayName: "Brinkberry",
    canonicalDomain: "brinkberry.com",
    aliases: ["dcc:site:brinkberry"],
    commercialModel: "owned_inquiry_feeder",
    inActive12Portfolio: true,
    instrumentationTier: "v2_server_adapter",
    pageviewCollectionWired: false,
    residency: "brinkberry (external repo)",
    redirectAndSourceNotes: "External inquiry feeder repo; client pageview SDK not yet wired (`unavailable` until instrumented).",
    externalSourcesStatus: { ga4: "unavailable", gsc: "unavailable", vercelWebAnalytics: "unavailable" },
    outcomeFeedMode: "inquiry_only",
  },
  {
    siteId: "partyatredrocks",
    displayName: "Party at Red Rocks",
    canonicalDomain: "partyatredrocks.com",
    aliases: ["parr", "party-at-red-rocks", "dcc:site:party-at-red-rocks"],
    commercialModel: "owned_direct_checkout",
    inActive12Portfolio: true,
    instrumentationTier: "v2_server_adapter",
    pageviewCollectionWired: false,
    residency: "partyatredrocks (external repo)",
    redirectAndSourceNotes: "Inbound /go/red-rocks/shared edge redirect; Direct MoR summary API; client pageview SDK pending.",
    externalSourcesStatus: { ga4: "unavailable", gsc: "unavailable", vercelWebAnalytics: "unavailable" },
    outcomeFeedMode: "direct_mor_summary",
  },
  {
    siteId: "420friendlyairportpickup",
    displayName: "420 Friendly Airport Pickup",
    canonicalDomain: "420friendlyairportpickup.com",
    aliases: [
      "420-airport-pickup",
      "420-friendly-airport-pickup",
      "420airportpickup",
      "dcc:site:420-friendly-airport-pickup",
    ],
    commercialModel: "owned_direct_checkout",
    inActive12Portfolio: true,
    instrumentationTier: "v2_server_adapter",
    pageviewCollectionWired: false,
    residency: "destinations-cc (apps/420-airport-pickup)",
    redirectAndSourceNotes: "Bridged via /api/network/telemetry & /go/denver/420-airport-pickup; Square Direct MoR.",
    externalSourcesStatus: { ga4: "unavailable", gsc: "unavailable", vercelWebAnalytics: "unavailable" },
    outcomeFeedMode: "direct_mor_summary",
  },
  {
    siteId: "bluehillsoutpost",
    displayName: "Blue Hills Outpost",
    canonicalDomain: "bluehillsoutpost.com",
    aliases: [
      "bluehills",
      "blue-hills",
      "blue-hills-outpost",
      "dcc:site:blue-hills-outpost",
    ],
    commercialModel: "owned_inquiry_feeder",
    inActive12Portfolio: false,
    instrumentationTier: "uninstrumented_unavailable",
    pageviewCollectionWired: false,
    residency: "blue-hills-outpost/src (static HTML/JS + Vercel functions)",
    redirectAndSourceNotes:
      "Active Northern WI directory (42 URLs); 6 internal 308 slug redirects; inbound /handoff/dcc 302; direct /api/outbound/viator (pid=P00281144, bypasses DCC /go/out) & /api/inquiries email. Zero GA4, Vercel Analytics, or DCC telemetry wired (`unavailable`).",
    externalSourcesStatus: { ga4: "not_configured", gsc: "unavailable", vercelWebAnalytics: "not_configured" },
    outcomeFeedMode: "inquiry_only",
  },
  {
    siteId: "welcometothedells",
    displayName: "Welcome to the Dells",
    canonicalDomain: "welcometothedells.com",
    aliases: ["wtd", "welcome-to-the-dells", "dcc:site:welcome-to-the-dells"],
    commercialModel: "dcc_sourced_direct_10pct",
    inActive12Portfolio: false,
    instrumentationTier: "supplemental_manifest",
    pageviewCollectionWired: false,
    residency: "destinations-cc (apps/welcometothedells)",
    redirectAndSourceNotes: "Supplemental sub-app; outbound /out/wisconsin-dells/[slug] -> createCommercialHandoff; v2 pageviews not wired.",
    externalSourcesStatus: { ga4: "unavailable", gsc: "unavailable", vercelWebAnalytics: "unavailable" },
    outcomeFeedMode: "modified_since_poller",
  },
  {
    siteId: "saveonthestrip",
    displayName: "Save On The Strip",
    canonicalDomain: "saveonthestrip.com",
    aliases: ["sots", "save-on-the-strip", "dcc:site:save-on-the-strip"],
    commercialModel: "owned_storefront_external_checkout",
    inActive12Portfolio: false,
    instrumentationTier: "supplemental_manifest",
    pageviewCollectionWired: false,
    residency: "destinations-cc (apps/saveonthestrip)",
    redirectAndSourceNotes: "Supplemental sub-app; /go/vegas/deals edge redirect; v2 pageviews not wired (`unavailable`).",
    externalSourcesStatus: { ga4: "unavailable", gsc: "unavailable", vercelWebAnalytics: "unavailable" },
    outcomeFeedMode: "click_level_only",
  },
  {
    siteId: "frenchquarterorientation",
    displayName: "French Quarter Orientation",
    canonicalDomain: "frenchquarterorientation.com",
    aliases: ["fqo", "french-quarter-orientation", "dcc:site:french-quarter-orientation"],
    commercialModel: "owned_inquiry_feeder",
    inActive12Portfolio: false,
    instrumentationTier: "supplemental_manifest",
    pageviewCollectionWired: false,
    residency: "destinations-cc (apps/frenchquarterorientation)",
    redirectAndSourceNotes: "Supplemental sub-app; v2 pageviews not wired (`unavailable`).",
    externalSourcesStatus: { ga4: "unavailable", gsc: "unavailable", vercelWebAnalytics: "unavailable" },
    outcomeFeedMode: "inquiry_only",
  },
  {
    siteId: "somersetshuttle",
    displayName: "Somerset Amphitheater Shuttle",
    canonicalDomain: "shuttletosomersetamphitheater.com",
    aliases: ["somerset", "somerset-wi", "shuttletosomersetamphitheater"],
    commercialModel: "owned_inquiry_feeder",
    inActive12Portfolio: false,
    instrumentationTier: "supplemental_manifest",
    pageviewCollectionWired: true,
    residency: "destinations-cc (proxy.ts host rewrites to /somerset-wi/*)",
    redirectAndSourceNotes: "Host-rewritten in DCC root (inherits DccAnalyticsBridge); 6 legacy paths 301-redirected on host.",
    externalSourcesStatus: { ga4: "unavailable", gsc: "unavailable", vercelWebAnalytics: "unavailable" },
    outcomeFeedMode: "click_level_only",
  },
  {
    siteId: "redrocksfastpass",
    displayName: "Red Rocks Fast Pass",
    canonicalDomain: "redrocksfastpass.com",
    aliases: ["rrfp", "red-rocks-fastpass", "red-rocks-fast-pass"],
    commercialModel: "owned_storefront_external_checkout",
    inActive12Portfolio: false,
    instrumentationTier: "supplemental_manifest",
    pageviewCollectionWired: false,
    residency: "destinations-cc (apps/redrocksfastpass)",
    redirectAndSourceNotes: "Inbound /go/red-rocks/fastpass edge redirect; v2 pageviews not wired (`unavailable`).",
    externalSourcesStatus: { ga4: "unavailable", gsc: "unavailable", vercelWebAnalytics: "unavailable" },
    outcomeFeedMode: "click_level_only",
  },
  {
    siteId: "shuttleya",
    displayName: "ShuttleYa",
    canonicalDomain: "shuttleya.com",
    aliases: ["shuttle-ya"],
    commercialModel: "owned_inquiry_feeder",
    inActive12Portfolio: false,
    instrumentationTier: "uninstrumented_unavailable",
    pageviewCollectionWired: false,
    residency: "destinations-cc (apps/shuttleya)",
    redirectAndSourceNotes: "Supplemental sub-app; v2 telemetry not wired (`unavailable`).",
    externalSourcesStatus: { ga4: "unavailable", gsc: "unavailable", vercelWebAnalytics: "unavailable" },
    outcomeFeedMode: "inquiry_only",
  },
  {
    siteId: "laketahoebus",
    displayName: "Lake Tahoe Bus",
    canonicalDomain: "laketahoebus.com",
    aliases: ["laketahoe", "lake-tahoe-bus"],
    commercialModel: "owned_inquiry_feeder",
    inActive12Portfolio: false,
    instrumentationTier: "uninstrumented_unavailable",
    pageviewCollectionWired: false,
    residency: "destinations-cc (apps/laketahoe)",
    redirectAndSourceNotes: "Supplemental sub-app; v2 telemetry not wired (`unavailable`).",
    externalSourcesStatus: { ga4: "unavailable", gsc: "unavailable", vercelWebAnalytics: "unavailable" },
    outcomeFeedMode: "inquiry_only",
  },
  {
    siteId: "sedonajeep",
    displayName: "Sedona Jeep",
    canonicalDomain: "sedonajeep.com",
    aliases: ["sedona-jeep"],
    commercialModel: "owned_storefront_external_checkout",
    inActive12Portfolio: false,
    instrumentationTier: "uninstrumented_unavailable",
    pageviewCollectionWired: false,
    residency: "destinations-cc (apps/sedonajeep)",
    redirectAndSourceNotes: "Supplemental sub-app; v2 telemetry not wired (`unavailable`).",
    externalSourcesStatus: { ga4: "unavailable", gsc: "unavailable", vercelWebAnalytics: "unavailable" },
    outcomeFeedMode: "click_level_only",
  },
  {
    siteId: "mightyargoshuttle",
    displayName: "Mighty Argo Shuttle (Retired)",
    canonicalDomain: "mightyargoshuttle.com",
    aliases: ["mighty-argo", "mighty-argo-shuttle"],
    commercialModel: "retired_or_redirected",
    inActive12Portfolio: false,
    instrumentationTier: "retired_or_redirected",
    pageviewCollectionWired: false,
    residency: "destinations-cc (app/mighty-argo-shuttle — retired corridor)",
    redirectAndSourceNotes: "Retired/deprecated corridor; historical external traffic `unavailable`.",
    externalSourcesStatus: { ga4: "unavailable", gsc: "unavailable", vercelWebAnalytics: "unavailable" },
    outcomeFeedMode: "not_applicable",
  },
  {
    siteId: "rollcallusa",
    displayName: "RollCallUSA",
    canonicalDomain: "rollcallusa.com",
    aliases: ["rc", "roll-call-usa", "rollcall-usa", "rollcall"],
    commercialModel: "owned_hosted_community",
    inActive12Portfolio: false,
    instrumentationTier: "excluded_community",
    pageviewCollectionWired: false,
    residency: "rollcallusa (external community repo, Mode B beta_allowlist)",
    redirectAndSourceNotes: "Optional community layer strictly separated from private trip membership & active-12 traffic.",
    externalSourcesStatus: { ga4: "unavailable", gsc: "unavailable", vercelWebAnalytics: "unavailable" },
    outcomeFeedMode: "not_applicable",
  },
  {
    siteId: "welcometoalaskatours",
    displayName: "Welcome to Alaska Tours (Legacy Contained)",
    canonicalDomain: "welcometoalaskatours.com",
    aliases: [
      "wta",
      "wta-renderer",
      "wta-ui",
      "welcome-to-alaska",
      "welcome-to-alaska-tours",
      "dcc:site:welcome-to-alaska-tours",
    ],
    commercialModel: "excluded_external",
    inActive12Portfolio: false,
    instrumentationTier: "excluded_external",
    pageviewCollectionWired: false,
    residency: "wta-renderer (contained independent partner property)",
    redirectAndSourceNotes:
      "Serves 156+ pages under 503_BOOKINGS_DISABLED checkout containment; ZERO external 301/302/308 consolidation redirects to LFSE/JFD/CP/DCC (only 2 internal 308s `/home`->`/`, `/contact`->`/contact-us`, plus optional `<a>` links to CP with `utm_source=welcometoalaskatours`). Inbound `/handoff/dcc` strips `payload`/`sig`/`token` on 302; organic WTA->DCC callbacks blocked; WTA GA4/Redis/logs `unavailable` from DCC.",
    externalSourcesStatus: { ga4: "unavailable", gsc: "unavailable", vercelWebAnalytics: "not_configured" },
    outcomeFeedMode: "not_applicable",
  },
] as const;

const SITE_ALIAS_LOOKUP = (() => {
  const map = new Map<string, AnalyticsSiteRegistryEntry>();
  for (const entry of ANALYTICS_SITE_REGISTRY) {
    map.set(entry.siteId.toLowerCase(), entry);
    map.set(entry.canonicalDomain.toLowerCase(), entry);
    map.set(`www.${entry.canonicalDomain.toLowerCase()}`, entry);
    for (const alias of entry.aliases) {
      map.set(alias.toLowerCase(), entry);
    }
  }
  return map;
})();

export function resolveCanonicalAnalyticsSite(rawSiteOrHost?: string | null): {
  siteId: CanonicalAnalyticsSiteId;
  entry: AnalyticsSiteRegistryEntry | null;
} {
  if (!rawSiteOrHost || typeof rawSiteOrHost !== "string") {
    return { siteId: "unregistered_or_legacy", entry: null };
  }
  let cleaned = rawSiteOrHost.trim().toLowerCase();
  if (!cleaned) return { siteId: "unregistered_or_legacy", entry: null };
  cleaned = cleaned
    .replace(/^https?:\/\//, "")
    .split("/")[0]!
    .split(":")[0]!
    .trim();

  const exact = SITE_ALIAS_LOOKUP.get(cleaned) || SITE_ALIAS_LOOKUP.get(cleaned.replace(/^www\./, ""));
  if (exact) {
    return { siteId: exact.siteId, entry: exact };
  }

  // Match Vercel preview deployment host prefixes safely (e.g. cruisepromenade-git-feat-...vercel.app)
  if (cleaned.endsWith(".vercel.app")) {
    const prefix = cleaned.slice(0, -".vercel.app".length);
    if (prefix.startsWith("cruisepromenade") || prefix.startsWith("cp-")) {
      const cp = SITE_ALIAS_LOOKUP.get("cruisepromenade")!;
      return { siteId: cp.siteId, entry: cp };
    }
    if (prefix.startsWith("last-frontier") || prefix.startsWith("lastfrontier") || prefix.startsWith("lfse")) {
      const lfse = SITE_ALIAS_LOOKUP.get("lastfrontiershoreexcursions")!;
      return { siteId: lfse.siteId, entry: lfse };
    }
    if (prefix.startsWith("juneauflightdeck") || prefix.startsWith("juneau-flight-deck") || prefix.startsWith("jfd")) {
      const jfd = SITE_ALIAS_LOOKUP.get("juneauflightdeck")!;
      return { siteId: jfd.siteId, entry: jfd };
    }
    if (prefix.startsWith("destinations-cc") || prefix.startsWith("destinationcommandcenter") || prefix.startsWith("dcc-")) {
      const dcc = SITE_ALIAS_LOOKUP.get("destinationcommandcenter")!;
      return { siteId: dcc.siteId, entry: dcc };
    }
  }

  return { siteId: "unregistered_or_legacy", entry: null };
}

export function resolveEventLayer(eventType: AnalyticsEventType): AnalyticsLayer {
  return (TRAFFIC_EVENT_TYPES as readonly string[]).includes(eventType) ? "traffic" : "trip_lifecycle";
}

export function classifyContentFamily(params: {
  siteId: CanonicalAnalyticsSiteId;
  canonicalPath: string;
  explicitFamily?: ContentFamily | null;
  journeyKind?: string | null;
}): ContentFamily {
  if (params.explicitFamily) return params.explicitFamily;
  const pathLower = (params.canonicalPath || "/").toLowerCase();
  const jk = (params.journeyKind || "").toLowerCase();

  if (pathLower.includes("uncruise") || jk.includes("uncruise") || jk === "expedition_sailing") {
    return "uncruise";
  }
  if (
    pathLower.includes("cruise-alaska-without-a-cruise-ship") ||
    jk === "independent_alaska" ||
    jk === "independent_alaska_ferry"
  ) {
    return "independent_alaska_ferry";
  }
  if (pathLower.includes("alaska-rv") || pathLower.includes("rv-pilot") || jk === "independent_rv") {
    return "alaska_rv";
  }
  if (pathLower.includes("fishing-lodge") || pathLower.includes("fishing_lodge")) {
    return "fishing_lodges";
  }
  if (pathLower.includes("weekend-in-juneau")) {
    return "weekend_in_juneau";
  }
  if (
    pathLower.startsWith("/hosted-cruises") ||
    pathLower.startsWith("/for-organizers") ||
    pathLower.startsWith("/organizer/hosted") ||
    jk === "hosted_group"
  ) {
    return "hosted_group";
  }
  if (
    params.siteId === "juneauflightdeck" ||
    pathLower.includes("helicopter") ||
    pathLower.includes("flightseeing")
  ) {
    return "flightseeing";
  }
  if (
    params.siteId === "welcometoneworleanstours" ||
    params.siteId === "welcometotheswamp" ||
    pathLower.startsWith("/new-orleans")
  ) {
    return "new_orleans_swamp";
  }
  if (
    params.siteId === "gosno" ||
    params.siteId === "partyatredrocks" ||
    params.siteId === "feastlyspread" ||
    params.siteId === "420friendlyairportpickup"
  ) {
    return "operating_mor";
  }
  if (
    params.siteId === "cruisepromenade" &&
    (pathLower.startsWith("/sailings") ||
      pathLower.startsWith("/cruise-ships") ||
      pathLower.startsWith("/planner") ||
      pathLower.startsWith("/p/") ||
      pathLower.startsWith("/organizer/") ||
      pathLower.startsWith("/ports") ||
      pathLower.startsWith("/groups"))
  ) {
    return "cruise_sailing";
  }
  return "general_discovery";
}

export const ConfirmationProvenanceSchema = z
  .object({
    extraction: z
      .object({
        channel: z.enum([
          "inbound_email",
          "webhook_mime",
          "manual_paste",
          "pdf_text",
          "ocr_image",
          "ics_calendar",
          "attachment_ics_pdf",
          "synthetic_sample",
          "manual_entry",
        ]),
        category: z
          .enum([
            "shore_excursion",
            "rv_rental",
            "campground",
            "ferry_vehicle",
            "activity",
            "flight",
            "hotel",
            "other",
          ])
          .default("shore_excursion"),
        lifecycleIntent: z.enum(["new", "amendment", "cancellation"]).default("new"),
        extractedFieldsMask: z.array(z.string().max(40)).max(20).default([]),
        attachmentSafety: z.enum(["none", "safe", "blocked"]).default("none"),
      })
      .optional(),
    travelerReview: z
      .object({
        state: z.enum([
          "unreviewed_staged",
          "reviewed_unchanged",
          "reviewed_edited",
          "rejected",
          "removed",
        ]),
        editedFields: z.array(z.string().max(40)).max(20).default([]),
        seatAssignmentMode: z.enum(["named_slots", "unassigned_block", "none"]).default("none"),
      })
      .optional(),
    providerVerification: z
      .object({
        state: z.enum([
          "unverified_document",
          "catalog_matched",
          "verified_direct_api",
          "verified_marketplace_webhook",
          "verified_csv_reconciled",
          "provider_cancelled_or_refunded",
        ]),
        verifiedAtIso: z.string().max(40).nullable().default(null),
        freshnessAgeSeconds: z.number().int().min(0).nullable().default(null),
      })
      .optional(),
    dccInference: z
      .object({
        portSlug: z.string().max(64).nullable().default(null),
        dayMatchMethod: z
          .enum([
            "explicit_day",
            "exact_date_and_port",
            "exact_date",
            "port_fallback",
            "unmatched",
          ])
          .default("unmatched"),
        catalogConfidence: z.enum(["exact_sku", "title_operator", "none"]).default("none"),
        windowFit: z
          .enum(["fits_2h_buffer", "tight_or_unverified", "conflict", "not_applicable"])
          .default("not_applicable"),
      })
      .optional(),
  })
  .strict();

export type ConfirmationProvenance = z.infer<typeof ConfirmationProvenanceSchema>;

export const AnalyticsIngestEventSchema = z.object({
  schemaVersion: z.string().max(40).default(ANALYTICS_SCHEMA_VERSION),
  logicalEventId: z.string().min(6).max(128),
  eventType: z.enum(ALL_ANALYTICS_EVENT_TYPES),
  occurredAt: z.string().datetime({ offset: true }).optional(),
  site: z.string().min(1).max(120),
  environment: z.enum(["production", "preview", "development", "test"]).optional(),

  // First-party browser/session seeds (hashed server-side into reportingSubjectId; never raw PII)
  browserSeed: z.string().min(6).max(128).optional(),
  sessionId: z.string().min(4).max(128).optional(),
  navigationType: z.enum(["initial_load", "spa_route_change", "reload", "server_action"]).optional(),

  // Page & attribution context
  path: z.string().max(512).optional(),
  landingPath: z.string().max(512).optional(),
  referrer: z.string().max(512).optional(),
  utmSource: z.string().max(80).optional(),
  utmMedium: z.string().max(80).optional(),
  utmCampaign: z.string().max(120).optional(),
  contentFamily: z
    .enum([
      "cruise_sailing",
      "hosted_group",
      "uncruise",
      "independent_alaska_ferry",
      "alaska_rv",
      "fishing_lodges",
      "weekend_in_juneau",
      "flightseeing",
      "new_orleans_swamp",
      "operating_mor",
      "general_discovery",
    ])
    .optional(),

  // Cross-site & seller handoff linkage
  handoffId: z.string().max(128).optional(),
  clickId: z.string().max(128).optional(),
  contextTokenPresent: z.boolean().optional(),
  continuityTier: z.enum(["verified_dcc_ctx", "public_param_referral", "none"]).optional(),
  targetSite: z.string().max(120).optional(),
  provider: z.string().max(64).optional(),
  productCode: z.string().max(96).optional(),

  // Canonical ecosystem & trip lifecycle identities (raw shareCode is NEVER accepted as analyticsTripKey; if passed in server-internal tripIdentifier, hashed immediately!)
  physicalSailingId: z.string().max(140).optional(),
  hostedDepartureId: z.string().max(140).optional(),
  journeyKind: z.string().max(64).optional(),
  draftKey: z.string().max(128).optional(),
  tripIdentifier: z.string().max(140).optional(), // Server-derived internal plannerId or shareCode -> converted immediately to atk_v1_ HMAC and discarded!
  analyticsTripKey: z.string().regex(/^atk_v\d+_[a-f0-9]{24,64}$/).optional(),

  // Validated participant / household invariants
  participantRole: z
    .enum(["organizer", "companion_claimed_slot", "companion_self_joined", "viewer", "system"])
    .optional(),
  participantKey: z.string().max(128).optional(),
  mergedFromParticipantKey: z.string().max(128).optional(),
  partyHeadcountTotal: z.number().int().min(1).max(500).optional(),
  subMilestone: z.string().max(64).optional(),
  isTemplateOrHydration: z.boolean().optional(),
  isNoOpSave: z.boolean().optional(),

  // Travel date input (never stored raw; converted immediately into coarse leadTimeBucket!)
  travelDateHint: z.string().max(32).optional(),
  leadTimeBucket: z
    .enum(["past_or_today", "1_7d", "8_30d", "31_90d", "91_180d", "181_365d", "365d_plus"])
    .optional(),

  // 4-dimension confirmation provenance
  confirmationProvenance: ConfirmationProvenanceSchema.optional(),

  // Server-only financial / booking outcome fields
  outcomeType: z
    .enum([
      "confirmed_paid",
      "confirmed_unpaid",
      "fulfilled",
      "cancelled",
      "refunded",
      "commission_settled",
    ])
    .optional(),
  grossAmountUsd: z.number().min(0).max(1_000_000).optional(),
  commissionAmountUsd: z.number().min(0).max(1_000_000).optional(),

  // QA / synthetic flags
  isTest: z.boolean().optional(),
  isSyntheticSample: z.boolean().optional(),

  // Safe bounded custom properties
  props: z.record(z.string().max(48), z.union([z.string().max(160), z.number(), z.boolean(), z.null()])).optional(),
});

export type AnalyticsIngestEventInput = z.infer<typeof AnalyticsIngestEventSchema>;

export const AnalyticsCollectBatchSchema = z.object({
  deliveryId: z.string().max(128).optional(),
  sentAt: z.string().datetime({ offset: true }).optional(),
  events: z.array(AnalyticsIngestEventSchema).min(1).max(25),
});

export type AnalyticsCollectBatchInput = z.infer<typeof AnalyticsCollectBatchSchema>;
