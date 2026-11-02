import { SITE_IDENTITY } from "@/src/data/site-identity";
import { PUBLISHED_DECISION_GUIDES } from "@/src/data/published-decision-guides";
import type { PreSiteGuide } from "@/src/data/pre-site-guides";
import {
  DECISION_CATEGORIES,
  type DecisionCategoryDefinition,
} from "@/src/data/decision-taxonomy";
import { resolvePortfolioSiteContractByUrl } from "@/src/data/portfolio-site-contracts";
import {
  DISCOVERABLE_LOCATIONS,
  canonicalCoordinate,
  isIndexableCoordinate,
  type DiscoverableLocation,
} from "@/lib/dcc/locationDiscovery";
import seasonalOperatorProfiles from "@/data/seasonal-operator-pages.json";
import preservedViatorSnapshots from "@/data/viator-operator-snapshots/preserved-operator-products-v2.json";
import preservedGosnoPilotProbe from "@/data/viator-operator-snapshots/preserved-gosno-pilot-probe.json";
import {
  evaluateNodeClaimDependencies,
  getAllTravelReferenceNodes,
  type TravelReferenceNode,
} from "@/lib/dcc/travelReferenceCore";
import { DCC_PRODUCT_SCOPE } from "@/lib/dcc/productScope";

export const PUBLICATION_POLICY_VERSION = "dcc-publication-policy.v1" as const;
export const PUBLICATION_COMPILER_VERSION = "dcc-publication-compiler.v1.1.0" as const;

export type PublicationAcceptanceState =
  | "public_indexable"
  | "public_non_indexable"
  | "internal_canary"
  | "withdrawn_historical";

export type PublicationState = "published" | "unpromoted" | "canary" | "withdrawn";

export type IndexingState = "index_follow" | "noindex_nofollow";

export type PublicationLifecyclePolicy =
  | "serve_200_index"
  | "serve_200_noindex"
  | "require_auth_or_unavailable"
  | "withdrawn_noindex_or_redirect";

export type PublicationBlockingReasonCode =
  | "blocking_defect_unresolved"
  | "incomplete_operator_universe"
  | "missing_identity_resolution"
  | "unverified_evidence_snapshot"
  | "corridor_unpromoted"
  | "utility_or_interactive_surface"
  | "internal_canary_only"
  | "withdrawn_or_superseded";

export interface PublicationManifestRecord {
  route: string;
  canonicalUrl: string;
  acceptanceState: PublicationAcceptanceState;
  publicationState: PublicationState;
  indexingState: IndexingState;
  lifecyclePolicy: PublicationLifecyclePolicy;
  includeInSitemap: boolean;
  robotsTag: "index, follow" | "noindex, nofollow";
  blockingReasonCodes: readonly PublicationBlockingReasonCode[];
  evidenceSnapshotId: string | null;
  policyVersion: typeof PUBLICATION_POLICY_VERSION;
  compilerVersion: typeof PUBLICATION_COMPILER_VERSION;
  materialChangeDate: string;
}

const ORIGIN = SITE_IDENTITY.siteUrl;

const COMPILER_REFERENCE_NOW = new Date("2026-11-02T12:00:00.000Z");

const WITHDRAWN_GUIDE_SLUGS = new Set<string>([
  "juneau-glacier-landing-vs-scenic-flight",
]);

const SWAMP_HUB_REQUIRED_GUIDE_SLUGS = [
  "new-orleans-airboat-vs-covered-swamp-boat",
  "new-orleans-swamp-tour-with-kids",
  "new-orleans-swamp-tour-pickup-vs-self-drive",
  "new-orleans-small-vs-large-airboat",
  "best-time-of-day-for-new-orleans-swamp-tour",
  "is-a-new-orleans-swamp-tour-worth-it",
] as const;

export const INTERNAL_CANARY_ROUTES = [
  "/admin",
  "/admin/portfolio",
  "/admin/portfolio/activity",
  "/admin/live-pulse",
  "/admin/satellite-handoffs",
  "/admin/argo-waitlist",
  "/dashboard",
  "/internal/dashboard",
  "/internal/telemetry",
  "/internal/telemetry/ask-dcc",
  "/internal/feastly",
  "/internal/graph",
  "/map",
  "/command",
  "/governance",
] as const;

function toCanonicalUrl(route: string): string {
  if (route === "/" || route === "") return ORIGIN;
  return `${ORIGIN}${route.startsWith("/") ? route : `/${route}`}`;
}

function isIsoDateString(value: string | undefined | null): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function maxIsoDate(dates: Array<string | undefined | null>, fallback: string): string {
  const valid = dates
    .map((d) => (typeof d === "string" ? d.slice(0, 10) : ""))
    .filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d))
    .sort();
  return valid.length > 0 ? valid[valid.length - 1] : fallback;
}

function createRecord(input: {
  route: string;
  canonicalPathOverride?: string | null;
  acceptanceState: PublicationAcceptanceState;
  blockingReasonCodes?: readonly PublicationBlockingReasonCode[];
  evidenceSnapshotId: string | null;
  materialChangeDate: string;
}): PublicationManifestRecord {
  const isIndexable = input.acceptanceState === "public_indexable";
  const blockingReasonCodes = input.blockingReasonCodes ?? [];

  if (isIndexable && blockingReasonCodes.length > 0) {
    throw new Error(
      `Invalid publication manifest record for ${input.route}: public_indexable cannot have blockingReasonCodes`,
    );
  }
  if (isIndexable && !input.evidenceSnapshotId) {
    throw new Error(
      `Invalid publication manifest record for ${input.route}: public_indexable requires an evidenceSnapshotId`,
    );
  }
  if (!isIndexable && blockingReasonCodes.length === 0) {
    throw new Error(
      `Invalid publication manifest record for ${input.route}: ${input.acceptanceState} requires at least one blockingReasonCode`,
    );
  }

  const publicationState: PublicationState =
    input.acceptanceState === "public_indexable"
      ? "published"
      : input.acceptanceState === "public_non_indexable"
        ? "unpromoted"
        : input.acceptanceState === "internal_canary"
          ? "canary"
          : "withdrawn";

  const lifecyclePolicy: PublicationLifecyclePolicy =
    input.acceptanceState === "public_indexable"
      ? "serve_200_index"
      : input.acceptanceState === "public_non_indexable"
        ? "serve_200_noindex"
        : input.acceptanceState === "internal_canary"
          ? "require_auth_or_unavailable"
          : "withdrawn_noindex_or_redirect";

  return {
    route: input.route,
    canonicalUrl: toCanonicalUrl(input.canonicalPathOverride || input.route),
    acceptanceState: input.acceptanceState,
    publicationState,
    indexingState: isIndexable ? "index_follow" : "noindex_nofollow",
    lifecyclePolicy,
    includeInSitemap: isIndexable,
    robotsTag: isIndexable ? "index, follow" : "noindex, nofollow",
    blockingReasonCodes,
    evidenceSnapshotId: input.evidenceSnapshotId,
    policyVersion: PUBLICATION_POLICY_VERSION,
    compilerVersion: PUBLICATION_COMPILER_VERSION,
    materialChangeDate: input.materialChangeDate,
  };
}

/**
 * Evaluates a TravelReferenceNode's authoritative evidence registry and claim dependencies.
 * Automatically demotes the node and its alias routes to public_non_indexable if any
 * supporting citation is expired, conflicted, unavailable, or missing.
 */
export function evaluateTravelReferenceNodePublishability(
  node: TravelReferenceNode,
  now: Date = COMPILER_REFERENCE_NOW,
): PublicationManifestRecord[] {
  const depReport = evaluateNodeClaimDependencies(node, now);
  const reasons: PublicationBlockingReasonCode[] = [];

  if (!node.evidenceRegistry || node.evidenceRegistry.length === 0) {
    reasons.push("unverified_evidence_snapshot");
  }
  if (depReport.hasWithdrawnOrConflictedClaims || depReport.withdrawnCount > 0) {
    reasons.push("blocking_defect_unresolved");
    if (!reasons.includes("unverified_evidence_snapshot")) {
      reasons.push("unverified_evidence_snapshot");
    }
  }
  if (!node.specialistHandoffs || node.specialistHandoffs.options.length === 0) {
    reasons.push("incomplete_operator_universe");
  }

  const materialChangeDate = maxIsoDate(
    [
      node.lastReviewedAt,
      ...node.evidenceRegistry.map((c) => c.lastCheckedAt),
      ...node.evidenceRegistry.map((c) => c.verifiedAt),
    ],
    "2026-10-23",
  );

  const snapshotId =
    reasons.length === 0
      ? `evidence:travel-reference:${node.id}:${node.evidenceRegistry.length}c:${materialChangeDate}`
      : null;

  const unmountedAliases = new Set<string>(["/cities/new-orleans", "/cities/las-vegas"]);
  const promotedReferencePaths = new Set<string>(
    [
      ...DCC_PRODUCT_SCOPE.secondaryProducts[0].canonicalPaths,
      ...DCC_PRODUCT_SCOPE.travelReferenceArchitecture.flagshipReleases.flatMap((release) => [
        release.canonicalPath,
        ...release.aliases,
      ]),
      "/cities/denver",
    ].filter((p) => !unmountedAliases.has(p)),
  );
  const routes = [
    node.canonicalPath,
    ...node.aliasPaths.filter((p) => p !== "/regions/colorado"),
  ];
  return routes.map((route) => {
    const routeReasons = promotedReferencePaths.has(route)
      ? reasons
      : ([...reasons, "corridor_unpromoted", "withdrawn_or_superseded"] as PublicationBlockingReasonCode[]);
    return createRecord({
      route,
      acceptanceState: routeReasons.length === 0 ? "public_indexable" : "public_non_indexable",
      blockingReasonCodes: routeReasons,
      evidenceSnapshotId: routeReasons.length === 0 ? snapshotId : null,
      materialChangeDate,
    });
  });
}

/**
 * Evaluates a PreSiteGuide againstDCC's automated publishability gates:
 * 1. Verified timestamp & complete primary-source citations
 * 2. Explicit assumptions and unknowns
 * 3. Fair multi-option universe comparison (>= 2 options)
 * 4. Valid handoff identity resolution (internal route or active non-retired portfolio contract)
 */
export function evaluateGuidePublishability(
  guide: PreSiteGuide,
  options?: { categoryVerifiedCount?: number },
): PublicationManifestRecord {
  const route = `/guides/${guide.slug}`;

  if (WITHDRAWN_GUIDE_SLUGS.has(guide.slug)) {
    return createRecord({
      route,
      acceptanceState: "withdrawn_historical",
      blockingReasonCodes: ["withdrawn_or_superseded", "unverified_evidence_snapshot"],
      evidenceSnapshotId: null,
      materialChangeDate: "2026-10-23",
    });
  }

  const reasons: PublicationBlockingReasonCode[] = [];

  const hasValidCitationsArray =
    guide.citations === undefined ||
    (guide.citations.length > 0 &&
      guide.citations.every(
        (c) =>
          Boolean(c.id) &&
          Boolean(c.label) &&
          Boolean(c.organization) &&
          c.url.startsWith("https://") &&
          isIsoDateString(c.checkedAt) &&
          Boolean(c.claimSupported),
      ));

  const citationsValid = Boolean(isIsoDateString(guide.verifiedAt) && hasValidCitationsArray);
  if (!citationsValid) {
    reasons.push("unverified_evidence_snapshot");
  }

  const hasAssumptionsAndUnknowns = Boolean(
    guide.assumptionsAndUnknowns !== undefined
      ? guide.assumptionsAndUnknowns.length > 0
      : guide.questions && guide.questions.length >= 4,
  );
  if (!hasAssumptionsAndUnknowns) {
    reasons.push("blocking_defect_unresolved");
  }

  const hasOptionUniverse = Boolean(
    guide.optionComparison !== undefined
      ? guide.optionComparison.length >= 2
      : guide.tradeoffs && guide.tradeoffs.length >= 2,
  );
  if (!hasOptionUniverse) {
    reasons.push("incomplete_operator_universe");
  }

  const href = guide.nextStep?.href || "";
  const isInternalRoute = href.startsWith("/");
  const portfolioContract = href.startsWith("http")
    ? resolvePortfolioSiteContractByUrl(href)
    : null;
  const hasResolvedIdentity = Boolean(
    isInternalRoute || (portfolioContract && portfolioContract.strategy !== "review"),
  );
  if (!hasResolvedIdentity) {
    reasons.push("missing_identity_resolution");
  }

  const categoryVerifiedCount = options?.categoryVerifiedCount ?? 3;
  if (reasons.length > 0 || categoryVerifiedCount < 3) {
    reasons.push("corridor_unpromoted");
  }

  const materialChangeDate = maxIsoDate(
    [guide.verifiedAt, ...(guide.citations ?? []).map((c) => c.checkedAt)],
    "2026-10-23",
  );

  const citationCount = guide.citations ? guide.citations.length : guide.tradeoffs.length;

  return createRecord({
    route,
    acceptanceState: reasons.length === 0 ? "public_indexable" : "public_non_indexable",
    blockingReasonCodes: reasons,
    evidenceSnapshotId:
      reasons.length === 0
        ? `evidence:guide:${guide.slug}:${citationCount}c:${materialChangeDate}`
        : guide.verifiedAt
          ? `evidence:guide-partial:${guide.slug}:${materialChangeDate}`
          : null,
    materialChangeDate,
  });
}

export function evaluateGuideCategoryPublishability(
  category: DecisionCategoryDefinition,
  compiledGuidesInCategory: readonly PublicationManifestRecord[],
): PublicationManifestRecord {
  const route = `/guides/category/${category.slug}`;
  const indexableGuides = compiledGuidesInCategory.filter(
    (g) => g.acceptanceState === "public_indexable",
  );

  if (indexableGuides.length >= 3) {
    const materialChangeDate = maxIsoDate(
      indexableGuides.map((g) => g.materialChangeDate),
      "2026-11-02",
    );
    return createRecord({
      route,
      acceptanceState: "public_indexable",
      evidenceSnapshotId: `evidence:guide-category:${category.slug}:${indexableGuides.length}g:${materialChangeDate}`,
      materialChangeDate,
    });
  }

  return createRecord({
    route,
    acceptanceState: "public_non_indexable",
    blockingReasonCodes: ["corridor_unpromoted", "unverified_evidence_snapshot"],
    evidenceSnapshotId: null,
    materialChangeDate: "2026-10-23",
  });
}

export function evaluateCoordinatePublishability(
  location: DiscoverableLocation,
): PublicationManifestRecord {
  const route = `/location/${canonicalCoordinate(location.lat)}/${canonicalCoordinate(location.lng)}`;
  const indexable = isIndexableCoordinate(location.lat, location.lng);

  if (indexable) {
    return createRecord({
      route,
      acceptanceState: "public_indexable",
      evidenceSnapshotId: `evidence:coordinate:${canonicalCoordinate(location.lat)},${canonicalCoordinate(location.lng)}`,
      materialChangeDate: "2026-10-23",
    });
  }

  const reasons: PublicationBlockingReasonCode[] = ["utility_or_interactive_surface"];
  if (location.canonicalNamedPath) {
    reasons.push("withdrawn_or_superseded");
  } else {
    reasons.push("unverified_evidence_snapshot");
  }

  return createRecord({
    route,
    canonicalPathOverride: location.canonicalNamedPath,
    acceptanceState: "public_non_indexable",
    blockingReasonCodes: reasons,
    evidenceSnapshotId: null,
    materialChangeDate: "2026-10-23",
  });
}

function compileGuideManifestRecords(): PublicationManifestRecord[] {
  const verifiedCountByCategory = new Map<string, number>();
  for (const guide of PUBLISHED_DECISION_GUIDES) {
    if (isIsoDateString(guide.verifiedAt)) {
      verifiedCountByCategory.set(
        guide.category,
        (verifiedCountByCategory.get(guide.category) ?? 0) + 1,
      );
    }
  }

  const guideRecordsBySlug = new Map<string, PublicationManifestRecord>();
  const guideRecordsByCategory = new Map<string, PublicationManifestRecord[]>();

  for (const guide of PUBLISHED_DECISION_GUIDES) {
    const record = evaluateGuidePublishability(guide, {
      categoryVerifiedCount: verifiedCountByCategory.get(guide.category) ?? 0,
    });
    guideRecordsBySlug.set(guide.slug, record);
    const list = guideRecordsByCategory.get(guide.category) ?? [];
    list.push(record);
    guideRecordsByCategory.set(guide.category, list);
  }

  const allGuideRecords = [...guideRecordsBySlug.values()];
  const indexableGuides = allGuideRecords.filter((r) => r.acceptanceState === "public_indexable");

  const records: PublicationManifestRecord[] = [];

  if (indexableGuides.length >= 3) {
    const latestGuideDate = maxIsoDate(
      indexableGuides.map((r) => r.materialChangeDate),
      "2026-11-02",
    );
    records.push(
      createRecord({
        route: "/guides",
        acceptanceState: "public_indexable",
        evidenceSnapshotId: `evidence:guides-hub:${indexableGuides.length}g:${latestGuideDate}`,
        materialChangeDate: latestGuideDate,
      }),
    );
  } else {
    records.push(
      createRecord({
        route: "/guides",
        acceptanceState: "public_non_indexable",
        blockingReasonCodes: ["unverified_evidence_snapshot", "corridor_unpromoted"],
        evidenceSnapshotId: null,
        materialChangeDate: "2026-10-23",
      }),
    );
  }

  const swampHubGuidesIndexable = SWAMP_HUB_REQUIRED_GUIDE_SLUGS.every(
    (slug) => guideRecordsBySlug.get(slug)?.acceptanceState === "public_indexable",
  );
  if (swampHubGuidesIndexable) {
    const swampHubDate = maxIsoDate(
      SWAMP_HUB_REQUIRED_GUIDE_SLUGS.map((slug) => guideRecordsBySlug.get(slug)?.materialChangeDate),
      "2026-11-02",
    );
    records.push(
      createRecord({
        route: "/new-orleans-swamp-tours",
        acceptanceState: "public_indexable",
        evidenceSnapshotId: `evidence:swamp-decision-hub:${SWAMP_HUB_REQUIRED_GUIDE_SLUGS.length}g:${swampHubDate}`,
        materialChangeDate: swampHubDate,
      }),
    );
  } else {
    records.push(
      createRecord({
        route: "/new-orleans-swamp-tours",
        acceptanceState: "public_non_indexable",
        blockingReasonCodes: ["unverified_evidence_snapshot", "blocking_defect_unresolved"],
        evidenceSnapshotId: null,
        materialChangeDate: "2026-10-23",
      }),
    );
  }

  for (const category of DECISION_CATEGORIES) {
    records.push(
      evaluateGuideCategoryPublishability(
        category,
        guideRecordsByCategory.get(category.slug) ?? [],
      ),
    );
  }

  records.push(...allGuideRecords);
  return records;
}

function slugifySupplierName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+tour\s+co\.?$/i, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function compileOperatorManifestRecords(): PublicationManifestRecord[] {
  const snapshotDate = String(preservedViatorSnapshots.fetchedAt || "2026-10-30").slice(0, 10);
  const gosnoDate = String(preservedGosnoPilotProbe.capturedAt || "2026-11-02").slice(0, 10);

  const records: PublicationManifestRecord[] = [
    createRecord({
      route: "/operators",
      acceptanceState: "public_non_indexable",
      blockingReasonCodes: ["utility_or_interactive_surface", "incomplete_operator_universe"],
      evidenceSnapshotId: "dcc-operator-directory-v1",
      materialChangeDate: snapshotDate,
    }),
    createRecord({
      route: "/operators/gosno",
      acceptanceState: "public_non_indexable",
      blockingReasonCodes: ["incomplete_operator_universe", "corridor_unpromoted"],
      evidenceSnapshotId: `dcc-operator-gosno-pilot-${gosnoDate}`,
      materialChangeDate: gosnoDate,
    }),
  ];

  const verifiedSlugs = new Set<string>();
  for (const item of preservedViatorSnapshots.products) {
    const supplierName = item?.data?.supplier?.name;
    if (supplierName) {
      verifiedSlugs.add(slugifySupplierName(supplierName));
    }
  }

  for (const slug of verifiedSlugs) {
    records.push(
      createRecord({
        route: `/operators/${slug}`,
        acceptanceState: "public_non_indexable",
        blockingReasonCodes: ["incomplete_operator_universe", "corridor_unpromoted"],
        evidenceSnapshotId: `dcc-operator-viator-${slug}`,
        materialChangeDate: snapshotDate,
      }),
    );
  }

  for (const op of seasonalOperatorProfiles) {
    records.push(
      createRecord({
        route: `/operators/${op.slug}`,
        acceptanceState: "public_non_indexable",
        blockingReasonCodes: ["missing_identity_resolution", "incomplete_operator_universe"],
        evidenceSnapshotId: null,
        materialChangeDate: snapshotDate,
      }),
    );
  }

  return records;
}

function compilePublicationManifest(): readonly PublicationManifestRecord[] {
  const map = new Map<string, PublicationManifestRecord>();

  const register = (record: PublicationManifestRecord) => {
    map.set(record.route, record);
  };

  // 1. Authoritative Travel Reference Nodes & Alias Surfaces
  const referenceNodes = getAllTravelReferenceNodes();
  const nodeRecordsByCanonicalPath = new Map<string, PublicationManifestRecord>();

  for (const node of referenceNodes) {
    const compiledNodeRecords = evaluateTravelReferenceNodePublishability(node);
    for (const record of compiledNodeRecords) {
      register(record);
      if (record.route === node.canonicalPath) {
        nodeRecordsByCanonicalPath.set(node.canonicalPath, record);
      }
    }
  }

  // 2. Platform & Reference Directory Hubs derived from Reference Node health and Product Scope
  const scopeReady =
    DCC_PRODUCT_SCOPE.schemaVersion >= 3 &&
    DCC_PRODUCT_SCOPE.travelReferenceArchitecture.status === "first_class_travel_reference";
  const allNodesHealthy = [...nodeRecordsByCanonicalPath.values()].every(
    (r) => r.acceptanceState === "public_indexable",
  );
  const latestNodeDate = maxIsoDate(
    [...nodeRecordsByCanonicalPath.values()].map((r) => r.materialChangeDate),
    "2026-11-02",
  );

  for (const route of ["/", "/about", "/developers", "/widget", "/pricing"]) {
    if (scopeReady && allNodesHealthy) {
      register(
        createRecord({
          route,
          acceptanceState: "public_indexable",
          evidenceSnapshotId: `evidence:platform:${route === "/" ? "root" : route.slice(1)}:v${DCC_PRODUCT_SCOPE.schemaVersion}`,
          materialChangeDate: route === "/" ? latestNodeDate : "2026-10-23",
        }),
      );
    } else {
      register(
        createRecord({
          route,
          acceptanceState: "public_non_indexable",
          blockingReasonCodes: ["blocking_defect_unresolved"],
          evidenceSnapshotId: null,
          materialChangeDate: "2026-10-23",
        }),
      );
    }
  }

  const portsHealthy =
    nodeRecordsByCanonicalPath.get("/juneau")?.acceptanceState === "public_indexable" &&
    nodeRecordsByCanonicalPath.get("/new-orleans")?.acceptanceState === "public_indexable";
  register(
    createRecord({
      route: "/ports",
      acceptanceState: portsHealthy ? "public_indexable" : "public_non_indexable",
      blockingReasonCodes: portsHealthy ? [] : ["incomplete_operator_universe"],
      evidenceSnapshotId: portsHealthy ? `evidence:hub:ports:${latestNodeDate}` : null,
      materialChangeDate: "2026-10-23",
    }),
  );

  const venuesHealthy =
    nodeRecordsByCanonicalPath.get("/red-rocks")?.acceptanceState === "public_indexable";
  register(
    createRecord({
      route: "/venues",
      acceptanceState: venuesHealthy ? "public_indexable" : "public_non_indexable",
      blockingReasonCodes: venuesHealthy ? [] : ["incomplete_operator_universe"],
      evidenceSnapshotId: venuesHealthy ? "evidence:hub:venues:2026-10-23" : null,
      materialChangeDate: "2026-10-23",
    }),
  );

  // 2b. Regional Topic Cluster Hubs (/destinations and /destinations/[state]) derived from state Reference Nodes
  register(
    createRecord({
      route: "/destinations",
      acceptanceState: scopeReady && allNodesHealthy ? "public_indexable" : "public_non_indexable",
      blockingReasonCodes: scopeReady && allNodesHealthy ? [] : ["incomplete_operator_universe"],
      evidenceSnapshotId:
        scopeReady && allNodesHealthy ? `evidence:hub:destinations:${latestNodeDate}` : null,
      materialChangeDate: latestNodeDate,
    }),
  );

  const regionalHubSpecs: Array<{
    stateSlug: string;
    requiredNodePaths: string[];
  }> = [
    { stateSlug: "colorado", requiredNodePaths: ["/red-rocks", "/routes/denver-breckenridge"] },
    { stateSlug: "alaska", requiredNodePaths: ["/juneau"] },
    { stateSlug: "louisiana", requiredNodePaths: ["/new-orleans"] },
    { stateSlug: "nevada", requiredNodePaths: ["/vegas"] },
    { stateSlug: "florida", requiredNodePaths: [] },
    { stateSlug: "montana", requiredNodePaths: [] },
    { stateSlug: "wisconsin", requiredNodePaths: [] },
    { stateSlug: "us-virgin-islands", requiredNodePaths: [] },
  ];

  for (const spec of regionalHubSpecs) {
    const hasPromotedNodes = spec.requiredNodePaths.length > 0;
    const nodesHealthyForState =
      hasPromotedNodes &&
      spec.requiredNodePaths.every(
        (p) => nodeRecordsByCanonicalPath.get(p)?.acceptanceState === "public_indexable",
      );
    const stateMaterialDate = maxIsoDate(
      spec.requiredNodePaths.map((p) => nodeRecordsByCanonicalPath.get(p)?.materialChangeDate),
      "2026-11-02",
    );
    const snapshotId = nodesHealthyForState
      ? `evidence:regional-hub:${spec.stateSlug}:${spec.requiredNodePaths.length}n:${stateMaterialDate}`
      : null;
    const blockingReasons: PublicationBlockingReasonCode[] = nodesHealthyForState
      ? []
      : hasPromotedNodes
        ? ["blocking_defect_unresolved", "unverified_evidence_snapshot"]
        : ["corridor_unpromoted"];

    register(
      createRecord({
        route: `/destinations/${spec.stateSlug}`,
        acceptanceState: nodesHealthyForState ? "public_indexable" : "public_non_indexable",
        blockingReasonCodes: blockingReasons,
        evidenceSnapshotId: snapshotId,
        materialChangeDate: stateMaterialDate,
      }),
    );

    if (!map.has(`/regions/${spec.stateSlug}`)) {
      register(
        createRecord({
          route: `/regions/${spec.stateSlug}`,
          canonicalPathOverride: `/destinations/${spec.stateSlug}`,
          acceptanceState: "withdrawn_historical",
          blockingReasonCodes: ["withdrawn_or_superseded"],
          evidenceSnapshotId: null,
          materialChangeDate: stateMaterialDate,
        }),
      );
    }
  }

  // 3. Coordinate telemetry views (governed as non-indexable unless possessing distinct search value)
  for (const location of DISCOVERABLE_LOCATIONS) {
    register(evaluateCoordinatePublishability(location));
  }

  // 4. Decision Guides & Category Hubs compiled from guide evidence & universe state
  for (const record of compileGuideManifestRecords()) {
    register(record);
  }

  // 5. Operator Directory Universe
  for (const record of compileOperatorManifestRecords()) {
    register(record);
  }

  // 6. Public + non-indexable utility, compliance, and bridge surfaces
  for (const route of [
    "/ask",
    "/book",
    "/checkout",
    "/track",
    "/privacy",
    "/terms",
    "/affiliate-disclosure",
    "/contact",
  ]) {
    register(
      createRecord({
        route,
        acceptanceState: "public_non_indexable",
        blockingReasonCodes: ["utility_or_interactive_surface"],
        evidenceSnapshotId: null,
        materialChangeDate: "2026-11-02",
      }),
    );
  }

  for (const route of [
    "/vibe-around",
    "/shuttleya",
    "/juneau-flightseeing",
    "/french-quarter-orientation",
    "/new-orleans/swamp-tours",
    "/sedona/jeep-tours",
    "/juneau/whale-watching-tours",
    "/juneau/helicopter-tours",
    "/transportation/colorado/denver-to-vail-shuttle-guide",
  ]) {
    register(
      createRecord({
        route,
        acceptanceState: "public_non_indexable",
        blockingReasonCodes: ["corridor_unpromoted"],
        evidenceSnapshotId: "dcc-corridor-feeder-2026-11-02",
        materialChangeDate: "2026-11-02",
      }),
    );
  }

  // 7. Internal canary surfaces (require operator authentication at edge proxy)
  for (const route of INTERNAL_CANARY_ROUTES) {
    register(
      createRecord({
        route,
        acceptanceState: "internal_canary",
        blockingReasonCodes: ["internal_canary_only"],
        evidenceSnapshotId: null,
        materialChangeDate: "2026-10-23",
      }),
    );
  }

  // 8. Withdrawn / historical surfaces
  for (const route of [
    "/how-to-get-to-argo-cable-car-from-denver",
    "/colorado/what-to-do-if-rafting-is-canceled",
    "/juneau-helicopters",
  ]) {
    register(
      createRecord({
        route,
        acceptanceState: "withdrawn_historical",
        blockingReasonCodes: ["withdrawn_or_superseded"],
        evidenceSnapshotId: null,
        materialChangeDate: "2026-10-23",
      }),
    );
  }

  return [...map.values()].sort((a, b) => a.route.localeCompare(b.route));
}

export const PUBLICATION_MANIFEST: readonly PublicationManifestRecord[] = compilePublicationManifest();

const PUBLICATION_MANIFEST_BY_ROUTE = new Map<string, PublicationManifestRecord>(
  PUBLICATION_MANIFEST.map((entry) => [entry.route, entry]),
);

export function getPublicationManifestEntry(pathname: string): PublicationManifestRecord | null {
  return PUBLICATION_MANIFEST_BY_ROUTE.get(pathname) ?? null;
}

export function listIndexablePublicationEntries(): readonly PublicationManifestRecord[] {
  return PUBLICATION_MANIFEST.filter(
    (entry) =>
      entry.acceptanceState === "public_indexable" &&
      entry.includeInSitemap &&
      entry.indexingState === "index_follow" &&
      entry.blockingReasonCodes.length === 0,
  );
}
