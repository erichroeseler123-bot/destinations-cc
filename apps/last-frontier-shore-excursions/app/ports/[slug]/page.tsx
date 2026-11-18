import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPort } from "@/lib/ports";
import { getPortActivities } from "@/lib/portActivities";
import { getExcursionsByPort } from "@/lib/affiliate/catalog";
import { PortSlug } from "@/lib/affiliate/types";
import { buildDccHandoffAffiliateUrl } from "@/lib/affiliate/links";
import { CruiseWindowCalculator } from "@/components/CruiseWindowCalculator";
import { ExcursionFilters } from "@/components/ExcursionFilters";
import { TrustDisclosure } from "@/components/TrustDisclosure";
import { ApprovedResearchQualificationSection } from "@/components/ApprovedResearchQualificationSection";
import { JuneauNormalizedSupplierFeedSection } from "@/components/JuneauNormalizedSupplierFeedSection";
import { JuneauFlightDeckPlanningCallout } from "@/components/JuneauFlightDeckPlanningCallout";
import { OperatorIdentityMark } from "@/components/OperatorIdentityMark";
import { PortSailingTimingFitPanel } from "@/components/PortSailingTimingFitPanel";
import { loadLfseJuneauNormalizedSupplierFeed } from "@/lib/dccJuneauSupplierFeed";
import {
  buildPortDetailH1,
  classifyDestinationType,
  formatCleanPlaceBaseName,
  resolveDestinationHeroMedia,
  STANDARDIZED_TWO_HOUR_PLANNING_NOTE,
} from "@/lib/directoryDisplay";
import {
  buildPortDetailJsonLd,
  DCC_ALASKA_DIRECTORY_API_URL,
  LFSE_SITE_URL,
} from "@/lib/structuredData";
import {
  BLOCKED_KETCHIKAN_UMBRELLA_PRODUCTS,
  loadLfseApprovedPortFacts,
  qualifyLfsePortDirectContexts,
} from "@/lib/dccResearchFeed";
import { SOUTHEAST_ALASKA_PLACES } from "../../../../../lib/dcc/shared/southeastAlaskaDirectoryData";
import {
  isOperatorDirectCheckoutConnected,
  isOperatorLiveAvailabilityConnected,
} from "../../../../../lib/dcc/shared/southeastAlaskaDirectoryContract";
import {
  findSoutheastAlaskaPlaceByPortSlug,
  getSoutheastAlaskaDirectorySnapshot,
  resolveSoutheastAlaskaTourDirectRezgoHref,
} from "../../../../../lib/dcc/shared/southeastAlaskaDirectoryOperatorsAndTours";

const PLACE_TYPE_LABELS: Record<string, string> = {
  community: "Community & Local Harbor",
  cruise_terminal: "Cruise Terminal",
  harbor: "Small-Boat Harbor",
  national_park: "National Park & Preserve",
  scenic_cruise_destination: "Scenic Cruising — Non-Disembarkation",
};

const LEGACY_CALCULATOR_PORTS = new Set([
  "juneau",
  "skagway",
  "ketchikan",
  "sitka",
  "icy-strait-point",
]);

function renderHumanizedPortNotes(text: string) {
  const parts = text.split(/(\(\/ports\/glacier-bay\)|\/ports\/glacier-bay|\(\/ports\/gustavus\)|\/ports\/gustavus)/g);
  return parts.map((part, index) => {
    if (part === "(/ports/glacier-bay)" || part === "/ports/glacier-bay") {
      return (
        <span key={index}>
          {part.startsWith("(") ? "(" : ""}
          <Link
            href="/ports/glacier-bay"
            style={{ color: "var(--forest)", fontWeight: 700, textDecoration: "underline" }}
          >
            Glacier Bay Scenic Cruising Guide
          </Link>
          {part.endsWith(")") ? ")" : ""}
        </span>
      );
    }
    if (part === "(/ports/gustavus)" || part === "/ports/gustavus") {
      return (
        <span key={index}>
          {part.startsWith("(") ? "(" : ""}
          <Link
            href="/ports/gustavus"
            style={{ color: "var(--forest)", fontWeight: 700, textDecoration: "underline" }}
          >
            Gustavus Community Guide
          </Link>
          {part.endsWith(")") ? ")" : ""}
        </span>
      );
    }
    return <span key={index}>{part}</span>;
  });
}

function getDistinctCategoryTourCount(
  activitySlug: string,
  portExcursions: ReturnType<typeof getExcursionsByPort>,
  liveFeedTours: Array<{
    normalizedTourId: string;
    activityCategory: string;
    matchedViatorProductCode: string | null;
    departureOptions?: Array<{ availableSpots: number | null }>;
    availableSpots: number | null;
  }>,
): number {
  const seenKeys = new Set<string>();
  for (const ex of portExcursions) {
    if (ex.activitySlug === activitySlug) {
      seenKeys.add((ex.productId || ex.title).trim().toLowerCase());
    }
  }
  for (const tour of liveFeedTours) {
    const matchesActivity =
      (activitySlug === "whale-watching" &&
        (tour.activityCategory === "whale-watching" ||
          tour.activityCategory === "combo-whale-glacier")) ||
      (activitySlug === "mendenhall-glacier-tours" &&
        (tour.activityCategory === "mendenhall-glacier-tours" ||
          tour.activityCategory === "combo-whale-glacier")) ||
      tour.activityCategory === activitySlug;
    if (!matchesActivity) continue;
    const hasPositive =
      Array.isArray(tour.departureOptions) && tour.departureOptions.length > 0
        ? tour.departureOptions.some(
            (o) => typeof o.availableSpots === "number" && o.availableSpots > 0,
          )
        : typeof tour.availableSpots === "number" && tour.availableSpots > 0;
    if (!hasPositive) continue;
    const dedupKey = (tour.matchedViatorProductCode || tour.normalizedTourId)
      .trim()
      .toLowerCase();
    seenKeys.add(dedupKey);
  }
  return seenKeys.size;
}

export function generateStaticParams() {
  return SOUTHEAST_ALASKA_PLACES.filter(
    (p) => p.hasPublicDirectoryPage && p.publicPortSlug,
  ).map((p) => ({ slug: p.publicPortSlug! }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const entry = findSoutheastAlaskaPlaceByPortSlug(slug);
  if (!entry) return {};

  const { place, gate } = entry;
  const cleanName = formatCleanPlaceBaseName(place.name);
  const media = resolveDestinationHeroMedia(place);
  const isScenicOnly = place.placeType === "scenic_cruise_destination";

  const title = isScenicOnly
    ? `${cleanName} — Scenic Cruising (Non-Disembarkation) Guide`
    : `${cleanName} Shore Excursions, Docks & Local Operators`;

  const description = isScenicOnly
    ? `${cleanName} scenic cruising guide: why large cruise ships do not dock or disembark passengers in Glacier Bay, NPS ranger boarding, and separate Gustavus gateway access.`
    : `Compare ${cleanName} Alaska docks, cruise pickup rules, verified local operators, tours, and two-hour return-to-ship planning margins.`;

  return {
    title,
    description,
    alternates: { canonical: `${LFSE_SITE_URL}/ports/${slug}` },
    robots: {
      index: gate.indexable,
      follow: true,
    },
    openGraph: {
      title: `${title} | Last Frontier Shore Excursions`,
      description,
      url: `${LFSE_SITE_URL}/ports/${slug}`,
      siteName: "Last Frontier Shore Excursions",
      type: "website",
      images: [
        {
          url: `${LFSE_SITE_URL}${media.heroImage}`,
          width: 1600,
          height: 1067,
          alt: media.heroImageAlt,
        },
      ],
    },
  };
}

export default async function PortPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const placeBundle = findSoutheastAlaskaPlaceByPortSlug(slug);
  if (!placeBundle || !placeBundle.place.hasPublicDirectoryPage) {
    notFound();
  }

  const { place, gate } = placeBundle;
  const cleanPlaceName = formatCleanPlaceBaseName(place.name);
  const typeInfo = classifyDestinationType(place);
  const media = resolveDestinationHeroMedia(place);

  const snapshot = getSoutheastAlaskaDirectorySnapshot();
  const indexablePlaceSlugs = new Set(
    snapshot.places
      .filter((p) => p.gate.indexable && p.place.publicPortSlug)
      .map((p) => p.place.publicPortSlug!),
  );
  const indexableOperatorIds = new Set(
    snapshot.operators
      .filter((o) => o.gate.indexable)
      .map((o) => o.operator.operatorId),
  );

  const legacyPort = getPort(slug);
  const legacyActivities = legacyPort ? getPortActivities(slug) : [];
  const legacyPortExcursions = legacyPort ? getExcursionsByPort(slug as PortSlug) : [];

  const localOperators = snapshot.operators.filter(
    (o) => o.gate.indexable && o.operator.publicPortSlugs.includes(slug),
  );
  const canonicalPortTours = snapshot.tours.filter(
    (t) =>
      t.portSlug === slug &&
      !t.isCommerciallyHeld &&
      indexableOperatorIds.has(t.operatorId),
  );
  const portCategoryEvaluations = snapshot.portCategories.filter(
    (pc) => pc.portSlug === slug,
  );
  const indexablePortCategories = portCategoryEvaluations.filter(
    (pc) => pc.gate.indexable,
  );

  const [researchLoad, juneauNormalizedFeed] = await Promise.all([
    slug === "juneau" || slug === "ketchikan"
      ? loadLfseApprovedPortFacts(slug, { revalidateSeconds: 60 })
      : Promise.resolve(null),
    slug === "juneau"
      ? loadLfseJuneauNormalizedSupplierFeed({
          date: "2027-07-15",
          revalidateSeconds: 120,
        })
      : Promise.resolve(null),
  ]);
  const researchQualifications = researchLoad
    ? qualifyLfsePortDirectContexts(slug, researchLoad.facts)
    : [];

  const jsonLd = buildPortDetailJsonLd({
    slug,
    name: cleanPlaceName,
    hook: place.hook,
    overview: place.overview,
    lastModifiedAt: place.lastModifiedAt,
  });

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Held / Unindexed Notice for Smaller Communities */}
      {!gate.indexable && (
        <section
          data-testid="held-place-noindex-banner"
          style={{
            background: "#fff4e5",
            borderBottom: "1px solid #f0c36d",
            padding: "14px 0",
          }}
        >
          <div className="shell">
            <strong style={{ color: "#7a4500" }}>
              Unindexed Community Preview (noindex, follow):
            </strong>{" "}
            <span style={{ fontSize: 14, color: "#5c3b09" }}>
              {place.name} remains excluded from search indexing and public hubs until
              dock transfers and independent local operator schedules pass primary-source
              verification.
            </span>
          </div>
        </section>
      )}

      {/* 1. Hero & Destination Type */}
      <section className="port-hero">
        <div className="shell">
          <nav className="breadcrumbs" aria-label="Breadcrumbs">
            <Link href="/">Home</Link>
            <span>›</span>
            <Link href="/southeast-alaska">Southeast Alaska</Link>
            <span>›</span>
            <Link href="/ports">Ports &amp; Communities</Link>
            <span>›</span>
            <span>{cleanPlaceName}</span>
          </nav>

          <div className="lfse-split-hero">
            <div>
              <div className="lfse-card-meta-row">
                <span
                  className={`badge ${
                    place.placeType === "scenic_cruise_destination"
                      ? "badge-warning"
                      : "badge-safety"
                  }`}
                >
                  {typeInfo.label}
                </span>
                <span className="chip">{place.subRegionLabel}</span>
              </div>

              <h1>{buildPortDetailH1(place)}</h1>
              <p
                className="lead"
                style={{ color: "#42555d", fontSize: "17px", marginBottom: 14 }}
              >
                {place.hook}
              </p>
              <p style={{ color: "var(--muted)", fontSize: 15, marginBottom: 20 }}>
                {place.overview}
              </p>

              <div className="cta-row">
                {localOperators.length > 0 && (
                  <a className="button" href="#local-operators">
                    Local {cleanPlaceName} operators ({localOperators.length}) ↓
                  </a>
                )}
                <a className="button secondary" href="#dock-and-pickup-guide">
                  {place.placeType === "scenic_cruise_destination"
                    ? "Scenic cruising rules"
                    : "Docks & pickup rules"}
                </a>
                {canonicalPortTours.length > 0 && (
                  <a className="button secondary" href="#sailing-timing-fit">
                    Check 2-hour sailing fit
                  </a>
                )}
              </div>
              <TrustDisclosure compact />
            </div>

            <div>
              <div
                style={{
                  position: "relative",
                  borderRadius: "16px",
                  overflow: "hidden",
                  border: "1px solid var(--line)",
                  boxShadow: "var(--card-shadow)",
                  aspectRatio: "16 / 10",
                  background: "var(--ice)",
                }}
              >
                <img
                  src={media.heroImage}
                  alt={media.heroImageAlt}
                  width={1600}
                  height={1067}
                  loading="eager"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    display: "block",
                  }}
                />
                <span className="lfse-card-credit">{media.heroImageCredit}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Non-Disembarkation Alert (Glacier Bay) & Community Harbor Berth Explanation (Hoonah / Gustavus / Petersburg) */}
      {place.placeType === "scenic_cruise_destination" ? (
        <section
          data-testid="scenic-non-disembarkation-alert"
          style={{
            background: "#fff8eb",
            borderTop: "2px solid #d9822b",
            borderBottom: "2px solid #d9822b",
            padding: "24px 0",
          }}
        >
          <div className="shell">
            <span className="badge badge-warning">
              Important Cruise Logistics Rule · No Passenger Disembarkation
            </span>
            <h2 style={{ fontSize: 22, marginTop: 8, marginBottom: 8 }}>
              Large Cruise Ships Do NOT Dock or Disembark Passengers in {cleanPlaceName}
            </h2>
            <p style={{ margin: 0, fontSize: 15.5, color: "var(--ink)", maxWidth: 900 }}>
              {place.disembarkationExplanation}
            </p>
          </div>
        </section>
      ) : !place.largeCruiseShipDisembarkationAllowed ? (
        <section
          data-testid="community-terminal-separation-note"
          style={{
            background: "#eef7f3",
            borderTop: "1px solid #b7dfd2",
            borderBottom: "1px solid #b7dfd2",
            padding: "20px 0",
          }}
        >
          <div className="shell">
            <span className="badge badge-safety">
              Community Harbor &amp; Cruise Access Note
            </span>
            <p style={{ margin: "8px 0 0", fontSize: 15, color: "var(--ink)", maxWidth: 900 }}>
              {place.disembarkationExplanation}
            </p>
          </div>
        </section>
      ) : null}

      {/* Related Distinct Places Cross-Links */}
      {place.relatedPlaces.length > 0 && (
        <section
          data-testid="related-places-crosslinks"
          className="section"
          style={{
            background: "#ffffff",
            borderBottom: "1px solid var(--line)",
            padding: "26px 0",
          }}
        >
          <div className="shell">
            <p className="eyebrow" style={{ color: "var(--forest)", marginBottom: 6 }}>
              Neighboring Stops &amp; Waterways
            </p>
            <h2 style={{ fontSize: 21, marginTop: 0, marginBottom: 14 }}>
              Related Communities, Terminals &amp; Waterways Near {cleanPlaceName}
            </h2>
            <div className="lfse-two-col">
              {place.relatedPlaces.map((rel) => {
                const canLink =
                  Boolean(rel.targetPublicPortSlug) &&
                  indexablePlaceSlugs.has(rel.targetPublicPortSlug!);
                return (
                  <div key={rel.targetPlaceId} className="card">
                    <div className="lfse-card-meta-row">
                      <span className="badge badge-safety">
                        {PLACE_TYPE_LABELS[rel.targetPlaceType] || rel.targetPlaceType}
                      </span>
                      <span className="chip">{rel.distanceOrTransitSummary}</span>
                    </div>
                    <h3 style={{ fontSize: 18, margin: "4px 0 6px" }}>
                      {canLink ? (
                        <Link
                          href={`/ports/${rel.targetPublicPortSlug}`}
                          style={{ color: "var(--forest)" }}
                        >
                          {rel.targetName} →
                        </Link>
                      ) : (
                        rel.targetName
                      )}
                    </h3>
                    <p style={{ margin: 0, fontSize: 14, color: "var(--muted)" }}>
                      {rel.geographicExplanation}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* 2. Excursion Categories (Must appear BEFORE #calculator per test invariant!) */}
      {(indexablePortCategories.length > 0 || legacyActivities.length > 0) && (
        <section
          className="section"
          id="excursion-categories"
          style={{ background: "#ffffff", padding: "36px 0" }}
        >
          <div className="shell">
            <h2>{cleanPlaceName} Excursion Categories</h2>
            <p className="lead" style={{ color: "var(--muted)" }}>
              Compare side-by-side multi-operator category guides and port-window activity
              options in {cleanPlaceName}:
            </p>

            {indexablePortCategories.length > 0 && (
              <div className="lfse-cards-grid" style={{ marginTop: 20 }}>
                {indexablePortCategories.map((pc) => (
                  <Link
                    key={pc.category.categorySlug}
                    href={`/ports/${slug}/${pc.category.categorySlug}`}
                    className="card lfse-directory-card"
                  >
                    <div>
                      <div className="lfse-card-media">
                        <img
                          src={pc.category.image}
                          alt={pc.category.imageAlt}
                          width={640}
                          height={360}
                          loading="lazy"
                        />
                        <span className="lfse-card-credit">{pc.category.imageCredit}</span>
                      </div>
                      <div className="lfse-card-meta-row">
                        <span className="badge badge-safety">
                          {`${pc.qualifiedOperators.length} Local Operators`}
                        </span>
                        <span className="chip">
                          {`${pc.qualifiedTours.length} Excursions`}
                        </span>
                      </div>
                      <h3>{pc.comparison?.h1 || `${cleanPlaceName} ${pc.category.name}`}</h3>
                      <p style={{ fontSize: 14, color: "var(--muted)" }}>
                        {pc.comparison?.metaDescription || pc.category.summary}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {/* Juneau Flightseeing Contextual Planning Links */}
            {slug === "juneau" && (
              <JuneauFlightDeckPlanningCallout
                heading="Planning a Juneau Helicopter or Floatplane Excursion?"
                contextLabel="Juneau Flight Deck · Aviation Planning Guides"
              />
            )}

            {/* Preserve legacy /[port]/[activity] cards & data-testid attributes on original 5 ports */}
            {legacyActivities.length > 0 && (
              <div style={{ marginTop: indexablePortCategories.length > 0 ? 28 : 20 }}>
                {indexablePortCategories.length > 0 && (
                  <h3 style={{ fontSize: 18, marginBottom: 12, color: "var(--deep)" }}>
                    {cleanPlaceName} Port-Window Activity Guides
                  </h3>
                )}
                <div className="lfse-cards-grid">
                  {legacyActivities.map((act) => {
                    const catCount = getDistinctCategoryTourCount(
                      act.slug,
                      legacyPortExcursions,
                      juneauNormalizedFeed?.tours ?? [],
                    );
                    return (
                      <Link
                        className="card"
                        href={`/${act.portSlug}/${act.slug}`}
                        key={act.slug}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            flexWrap: "wrap",
                            gap: 8,
                            marginBottom: 8,
                          }}
                        >
                          <span
                            className="badge badge-safety"
                            style={{ alignSelf: "flex-start" }}
                          >
                            {act.typicalDuration}
                          </span>
                          {catCount > 0 && (
                            <span
                              data-testid={`lfse-category-count-${act.slug}`}
                              style={{
                                fontSize: "12.5px",
                                fontWeight: 700,
                                color: "var(--forest)",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {catCount}{" "}
                              {catCount === 1
                                ? "matching excursion"
                                : "matching excursions"}
                            </span>
                          )}
                        </div>
                        <h3>{act.h1}</h3>
                        <p>{act.metaDescription}</p>
                        <div className="chips">
                          <span className="chip">{act.returnMargin}</span>
                          <span
                            className="chip"
                            style={{
                              color:
                                act.weatherSensitivity === "High"
                                  ? "#9e2323"
                                  : "#156d3a",
                            }}
                          >
                            {act.weatherSensitivity} Sensitivity
                          </span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* 3. Local Operator Directory */}
      <section
        className="section"
        id="local-operators"
        style={{ borderTop: "1px solid var(--line)" }}
      >
        <div className="shell">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "baseline",
              flexWrap: "wrap",
              gap: 12,
              marginBottom: 18,
            }}
          >
            <div>
              <p className="eyebrow" style={{ color: "var(--muted)" }}>
                Local Alaska Companies
              </p>
              <h2 style={{ margin: 0 }}>{cleanPlaceName} Excursion Operators</h2>
            </div>
            <Link
              href="/operators"
              style={{ fontWeight: 700, color: "var(--forest)", fontSize: 14.5 }}
            >
              Browse all Southeast Alaska operators →
            </Link>
          </div>

          {localOperators.length === 0 ? (
            <div className="card">
              <p style={{ margin: 0, fontSize: 14.5, color: "var(--muted)" }}>
                {place.placeType === "scenic_cruise_destination" ? (
                  <>
                    Because large cruise ships do not disembark passengers in{" "}
                    {cleanPlaceName}, independent local day-boat and flight operators base
                    out of neighboring{" "}
                    <Link
                      href="/ports/gustavus"
                      style={{ color: "var(--forest)", fontWeight: 700, textDecoration: "underline" }}
                    >
                      Gustavus
                    </Link>{" "}
                    instead.
                  </>
                ) : (
                  `See dock, shuttle, and official visitor harbor guidance below for ${cleanPlaceName}.`
                )}
              </p>
            </div>
          ) : (
            <div className="lfse-cards-grid">
              {localOperators.map(({ operator, tours }) => {
                const portToursCount = tours.filter(
                  (t) => t.portSlug === slug && !t.isCommerciallyHeld,
                ).length;
                const isLiveConnected =
                  isOperatorLiveAvailabilityConnected(operator) &&
                  isOperatorDirectCheckoutConnected(operator) &&
                  (operator.slug !== "juneau-tours-and-whale-watch" ||
                    Boolean(
                      juneauNormalizedFeed?.ok &&
                        juneauNormalizedFeed.source === "dcc_rezgo_readonly_xml" &&
                        juneauNormalizedFeed.liveDirectRezgoCheckoutEnabled,
                    ));
                return (
                  <div
                    key={operator.operatorId}
                    className="card lfse-directory-card"
                  >
                    <div>
                      <div className="lfse-card-meta-row">
                        {isLiveConnected && (
                          <span className="badge badge-safety">
                            Live Availability + Direct Checkout
                          </span>
                        )}
                        {operator.verifiedOwnershipBadges.map((b) => (
                          <span key={b.tag} className="badge badge-safety">
                            {b.label}
                          </span>
                        ))}
                      </div>

                      <div className="lfse-operator-card-heading">
                        <OperatorIdentityMark name={operator.name} size="md" />
                        <h3>
                          <Link
                            href={`/operators/${operator.slug}`}
                            style={{ color: "var(--deep)" }}
                          >
                            {operator.name}
                          </Link>
                        </h3>
                      </div>

                      <p style={{ fontSize: 14, color: "var(--muted)", marginBottom: 10 }}>
                        {operator.tagline}
                      </p>
                      <p className="lfse-operator-pickup-snippet">
                        <strong>Cruise Pickup:</strong> {operator.cruiseLogisticsSummary}
                      </p>
                    </div>

                    <div className="lfse-card-footer lfse-card-footer--split">
                      <span className="lfse-card-footer-meta">
                        {portToursCount} verified {portToursCount === 1 ? "tour" : "tours"} in{" "}
                        {cleanPlaceName}
                      </span>
                      <Link
                        href={`/operators/${operator.slug}`}
                        className="lfse-card-action-link"
                      >
                        Operator Profile →
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* 4. Canonical Tours Currently Available */}
      {canonicalPortTours.length > 0 && (
        <section
          className="section"
          id="available-tours"
          style={{ background: "#ffffff", borderTop: "1px solid var(--line)" }}
        >
          <div className="shell">
            <p className="eyebrow" style={{ color: "var(--muted)" }}>
              Verified Local Excursions
            </p>
            <h2>Tours Currently Available in {cleanPlaceName}</h2>
            <div className="lfse-cards-grid" style={{ marginTop: 18 }}>
              {canonicalPortTours.map((tour) => {
                const matchedLiveRezgoTour =
                  juneauNormalizedFeed && tour.authorizedSupplierBinding
                    ? juneauNormalizedFeed.tours.find(
                        (t) =>
                          t.normalizedTourId ===
                            tour.authorizedSupplierBinding?.normalizedFeedTourId ||
                          t.rezgoCom === tour.authorizedSupplierBinding?.supplierItemCode,
                      ) || null
                    : null;
                const isDirectRezgo = Boolean(
                  tour.authorizedSupplierBinding &&
                    juneauNormalizedFeed?.ok &&
                    juneauNormalizedFeed.source === "dcc_rezgo_readonly_xml" &&
                    matchedLiveRezgoTour?.liveDirectRezgoCheckoutEnabled,
                );
                const directRezgoHref = isDirectRezgo
                  ? resolveSoutheastAlaskaTourDirectRezgoHref(tour, {
                      optionUid: matchedLiveRezgoTour?.rezgoUid ?? null,
                      serviceDate: juneauNormalizedFeed?.dateChecked ?? "2027-07-15",
                    })
                  : null;
                const isViatorFallback =
                  !directRezgoHref &&
                  (tour.bookingChannel === "viator_exact_product" ||
                    tour.bookingChannel === "supplier_direct_facilitator_10pct") &&
                  Boolean(tour.viatorOfficialUrl);
                const bookingHref = directRezgoHref
                  ? directRezgoHref
                  : isViatorFallback && tour.viatorOfficialUrl
                    ? buildDccHandoffAffiliateUrl({
                        source: "viator",
                        destinationUrl: tour.viatorOfficialUrl,
                        productCode: tour.viatorProductCode || undefined,
                        campaign: tour.attributionCampaign,
                      })
                    : tour.officialProductUrl;
                return (
                  <div
                    key={tour.tourId}
                    className="card lfse-directory-card"
                  >
                    <div>
                      <div className="lfse-card-meta-row">
                        <span className="badge badge-safety">{tour.durationLabel}</span>
                        <span className="chip">{tour.priceDisplayLabel}</span>
                      </div>
                      <h3 style={{ marginTop: 4, marginBottom: 6 }}>
                        <Link
                          href={`/tours/${tour.operatorSlug}/${tour.tourSlug}`}
                          style={{ color: "var(--deep)" }}
                        >
                          {tour.title}
                        </Link>
                      </h3>
                      <p style={{ fontSize: 13, margin: "0 0 8px", color: "var(--forest)", fontWeight: 600 }}>
                        Operated by{" "}
                        <Link href={`/operators/${tour.operatorSlug}`}>
                          {tour.operatorName}
                        </Link>
                      </p>
                      <p style={{ fontSize: 14, color: "var(--muted)", marginBottom: 10 }}>
                        {tour.summary}
                      </p>
                      <p style={{ fontSize: 12.5, color: "var(--ink)", margin: 0 }}>
                        <strong>Meeting / Pickup:</strong> {tour.meetingPoint}
                      </p>
                    </div>

                    <div
                      className="lfse-card-footer"
                      style={{
                        display: "flex",
                        gap: 10,
                        flexWrap: "wrap",
                      }}
                    >
                      <Link
                        className="button small secondary"
                        href={`/tours/${tour.operatorSlug}/${tour.tourSlug}`}
                      >
                        Tour &amp; Buffer Details
                      </Link>
                      <a
                        className="button small"
                        href={bookingHref}
                        target="_blank"
                        rel={
                          isViatorFallback
                            ? "noopener noreferrer sponsored"
                            : "noopener noreferrer"
                        }
                      >
                        {directRezgoHref
                          ? `Direct Checkout with ${tour.operatorName} ↗`
                          : isViatorFallback
                            ? "Check Partner Availability ↗"
                            : "Official Operator Site ↗"}
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {juneauNormalizedFeed && (
        <JuneauNormalizedSupplierFeedSection feed={juneauNormalizedFeed} />
      )}

      {/* Preserve existing Affiliate ExcursionFilters & lfse-port-excursion-count on legacy ports */}
      {legacyPort && (
        <section className="section" id="clusters" style={{ borderTop: "1px solid var(--line)" }}>
          <div className="shell">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
                flexWrap: "wrap",
                gap: 12,
                marginBottom: 20,
              }}
            >
              <div>
                <p className="eyebrow" style={{ color: "var(--muted)" }}>
                  Compare Partner Catalog Excursions
                </p>
                <h2>{cleanPlaceName} Shore Excursion Filter</h2>
              </div>
              <span
                data-testid="lfse-port-excursion-count"
                style={{ fontSize: "14px", color: "var(--forest)", fontWeight: 700 }}
              >
                {legacyPortExcursions.length} {cleanPlaceName}{" "}
                {legacyPortExcursions.length === 1 ? "excursion" : "excursions"}
              </span>
            </div>

            <ExcursionFilters
              excursions={legacyPortExcursions}
              initialPort={slug as PortSlug}
              showPortFilter={false}
            />
            <TrustDisclosure />
          </div>
        </section>
      )}

      {/* 5. Port, Dock & Cruise Pickup / Drop-Off Guide + Standardized 2-Hour Planning Note */}
      <section
        className="section"
        id="dock-and-pickup-guide"
        style={{
          background: "#ffffff",
          borderTop: "1px solid var(--line)",
        }}
      >
        <div className="shell">
          <h2>{cleanPlaceName} Docks, Landings &amp; Cruise Pickup Rules</h2>
          <p style={{ color: "var(--ink)", maxWidth: 860, fontSize: 15.5 }}>
            {place.portAndDockSummary}
          </p>

          <div className="callout" style={{ marginTop: 16, marginBottom: 18 }}>
            <strong style={{ display: "block", color: "var(--deep)", marginBottom: 4 }}>
              Excursion Pickup &amp; Drop-Off Logistics ({place.typicalPortHours})
            </strong>
            <p style={{ margin: 0, fontSize: 14.5, color: "var(--ink)" }}>
              {renderHumanizedPortNotes(place.cruisePickupDropoffNotes)}
            </p>
          </div>

          <div
            className="lfse-return-standard-box"
            data-testid="port-return-timing-standard"
          >
            <strong>2-Hour Return Planning Standard:</strong>
            <p>{STANDARDIZED_TWO_HOUR_PLANNING_NOTE}</p>
            <p>
              This two-hour buffer is an independent planning standard—not an operator
              return guarantee or a cruise-line rule. Always verify three separate times
              on your ticket: your <strong>operator check-in deadline</strong>, the{" "}
              <strong>operator or booking-partner cancellation cutoff</strong>, and your{" "}
              <strong>cruise ship&apos;s published all-aboard time</strong>.
            </p>
          </div>

          <div className="lfse-cards-grid" style={{ marginTop: 22 }}>
            {place.docksAndAccessPoints.map((dock) => (
              <div key={dock.locationId} className="card">
                <div className="lfse-card-meta-row">
                  <span className="badge badge-safety">
                    {dock.facilityKind.replace(/_/g, " ")}
                  </span>
                  <span className="chip">
                    +{dock.additionalTransferMinutesEachWay}m transfer buffer each way
                  </span>
                </div>
                <strong
                  style={{ fontSize: "16px", color: "var(--forest)", display: "block" }}
                >
                  {dock.name}
                </strong>
                <p style={{ fontSize: "13.5px", color: "var(--muted)", marginTop: 6, marginBottom: 0 }}>
                  {dock.shuttleOrWalkNotes}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. Ships & Sailings Visiting */}
      {place.visitingShips.length > 0 && (
        <section
          className="section"
          id="visiting-ships"
          style={{ borderTop: "1px solid var(--line)" }}
        >
          <div className="shell">
            <h2>Cruise Ships &amp; Sailings Calling at {cleanPlaceName}</h2>
            <p style={{ color: "var(--muted)", maxWidth: 800 }}>
              Representative ships and call patterns visiting {cleanPlaceName}, linked to
              ship-window guides:
            </p>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Ship &amp; Cruise Line</th>
                    <th>Call Pattern</th>
                    <th>Typical Port Window</th>
                    <th>Berth / Access Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {place.visitingShips.map((ship) => (
                    <tr key={`${ship.shipSlug}-${ship.typicalPortWindow}`}>
                      <td>
                        <strong>{ship.shipName}</strong>
                        <div style={{ fontSize: 12.5, color: "var(--muted)" }}>
                          {ship.cruiseLine}
                        </div>
                      </td>
                      <td>{ship.callPattern}</td>
                      <td>{ship.typicalPortWindow}</td>
                      <td>
                        {ship.berthOrAccessNote}{" "}
                        <a
                          href={ship.cruisePromenadeShipHref}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            fontSize: 12.5,
                            fontWeight: 700,
                            color: "var(--forest)",
                            whiteSpace: "nowrap",
                          }}
                        >
                          Ship profile ↗
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {/* 7. Timing-Fit Results & Calculator */}
      <section
        className="section"
        id="sailing-timing-fit"
        style={{ background: "#ffffff", borderTop: "1px solid var(--line)" }}
      >
        <div className="shell">
          <PortSailingTimingFitPanel
            portName={cleanPlaceName}
            docks={place.docksAndAccessPoints}
            tours={canonicalPortTours}
          />

          {LEGACY_CALCULATOR_PORTS.has(slug) && (
            <div id="calculator" style={{ marginTop: 28 }}>
              <CruiseWindowCalculator
                portSlug={slug as PortSlug}
                defaultDurationMinutes={
                  legacyPortExcursions[0]?.durationMinutes || 210
                }
              />
            </div>
          )}
        </div>
      </section>

      {/* 8. Weather Reality + Calm "Sources and freshness" Disclosure */}
      <section
        className="section"
        style={{ borderTop: "1px solid var(--line)" }}
      >
        <div className="shell" style={{ display: "grid", gap: 20 }}>
          <div className="callout" style={{ margin: 0 }}>
            <h2 style={{ fontSize: "20px", marginTop: 0, marginBottom: 6 }}>
              Weather &amp; Backup Planning in {cleanPlaceName}
            </h2>
            <p style={{ fontSize: "15px", lineHeight: 1.6 }}>
              {place.weatherBackupAdvice}
            </p>
          </div>

          <details
            className="lfse-sources-details"
            data-testid="port-sources-and-freshness"
          >
            <summary>Sources and freshness</summary>
            <div className="lfse-sources-body">
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
                <strong style={{ color: "var(--deep)" }}>
                  Official {cleanPlaceName} Tourism, Harbor &amp; Park Sources
                </strong>
                {place.verifiedAt ? (
                  <span className="chip" data-testid="place-last-verified">
                    Verified {place.verifiedAt}
                  </span>
                ) : (
                  <span className="chip">Verification pending</span>
                )}
              </div>

              {place.officialLocalSources.length > 0 ? (
                <ul style={{ margin: 0, paddingLeft: 20, display: "grid", gap: 6 }}>
                  {place.officialLocalSources.map((src) => (
                    <li key={src.url}>
                      <a
                        href={src.url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {src.label} ↗
                      </a>{" "}
                      <span>
                        ({src.sourceKind.replace(/_/g, " ")} · checked {src.checkedAt})
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p style={{ margin: 0 }}>
                  Official local visitor sources are pending primary-source verification.
                </p>
              )}

              <p style={{ margin: 0 }}>
                <strong>Regional data provenance:</strong> Compiled independently by Last
                Frontier Shore Excursions with geographic and berth coordinates referenced
                from{" "}
                <a
                  href={DCC_ALASKA_DIRECTORY_API_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Destination Command Center&apos;s Southeast Alaska Regional Directory ↗
                </a>
                .
              </p>
            </div>
          </details>

          {researchQualifications.length > 0 && (
            <details
              data-testid="lfse-port-research-methodology-details"
              className="lfse-sources-details"
            >
              <summary>Research &amp; Operator Verification Methodology</summary>
              <div className="lfse-sources-body">
                <ApprovedResearchQualificationSection
                  portSlug={slug}
                  initialQualifications={researchQualifications}
                  initialLastSyncedAt={researchLoad?.lastSyncedAt ?? null}
                  blockedUmbrellaProducts={
                    slug === "ketchikan"
                      ? [...BLOCKED_KETCHIKAN_UMBRELLA_PRODUCTS]
                      : []
                  }
                />
              </div>
            </details>
          )}
        </div>
      </section>
    </main>
  );
}
