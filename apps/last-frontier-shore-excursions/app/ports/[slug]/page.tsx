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
import { PortSailingTimingFitPanel } from "@/components/PortSailingTimingFitPanel";
import { loadLfseJuneauNormalizedSupplierFeed } from "@/lib/dccJuneauSupplierFeed";
import {
  BLOCKED_KETCHIKAN_UMBRELLA_PRODUCTS,
  loadLfseApprovedPortFacts,
  qualifyLfsePortDirectContexts,
} from "@/lib/dccResearchFeed";
import { SOUTHEAST_ALASKA_PLACES } from "../../../../../lib/dcc/shared/southeastAlaskaDirectoryData";
import {
  findSoutheastAlaskaPlaceByPortSlug,
  getSoutheastAlaskaDirectorySnapshot,
} from "../../../../../lib/dcc/shared/southeastAlaskaDirectoryOperatorsAndTours";

const SITE = "https://www.lastfrontiershoreexcursions.com";

const PLACE_TYPE_LABELS: Record<string, string> = {
  community: "Community & Local Harbor",
  cruise_terminal: "Cruise Terminal Destination",
  harbor: "Municipal Small-Boat Harbor",
  national_park: "National Park & Preserve",
  scenic_cruise_destination: "Scenic Cruising Waterway (No Ship Disembarkation)",
};

const LEGACY_CALCULATOR_PORTS = new Set([
  "juneau",
  "skagway",
  "ketchikan",
  "sitka",
  "icy-strait-point",
]);

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
  const isScenicOnly = !place.largeCruiseShipDisembarkationAllowed;

  const title = isScenicOnly
    ? `${place.name} Cruise Guide | Scenic Cruising Rules, Rangers & Gateway Access`
    : `${place.name} Shore Excursions, Docks & Local Operators Directory`;

  const description = isScenicOnly
    ? `${place.name} National Park scenic cruising guide: why large cruise ships do not dock or disembark passengers in Glacier Bay, NPS ranger boarding, and separate Gustavus gateway access.`
    : `Compare ${place.name} Alaska docks, cruise pickup rules, verified local operators, tours, and 2-hour return-to-ship timing buffers.`;

  return {
    title,
    description,
    alternates: { canonical: `${SITE}/ports/${slug}` },
    robots: {
      index: gate.indexable,
      follow: true,
    },
    openGraph: {
      title: `${title} | Last Frontier Shore Excursions`,
      description,
      url: `${SITE}/ports/${slug}`,
      siteName: "Last Frontier Shore Excursions",
      type: "website",
      images: [
        {
          url: `${SITE}${place.heroImage}`,
          width: 1600,
          height: 1067,
          alt: place.heroImageAlt,
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
  const snapshot = getSoutheastAlaskaDirectorySnapshot();
  const legacyPort = getPort(slug);
  const legacyActivities = legacyPort ? getPortActivities(slug) : [];
  const legacyPortExcursions = legacyPort ? getExcursionsByPort(slug as PortSlug) : [];

  // Canonical Southeast Alaska operators & tours for this destination
  const localOperators = snapshot.operators.filter(
    (o) => o.gate.indexable && o.operator.publicPortSlugs.includes(slug),
  );
  const canonicalPortTours = snapshot.tours.filter(
    (t) => t.portSlug === slug && !t.isCommerciallyHeld,
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

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": `${SITE}/ports/${slug}#webpage`,
        url: `${SITE}/ports/${slug}`,
        name: `${place.name} Directory & Cruise Logistics`,
        description: place.hook,
        isPartOf: { "@id": `${SITE}/#website` },
        ...(place.verifiedAt ? { dateModified: place.lastModifiedAt } : {}),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: `${SITE}/` },
          {
            "@type": "ListItem",
            position: 2,
            name: "Southeast Alaska",
            item: `${SITE}/southeast-alaska`,
          },
          {
            "@type": "ListItem",
            position: 3,
            name: "Ports & Communities",
            item: `${SITE}/ports`,
          },
          {
            "@type": "ListItem",
            position: 4,
            name: place.name,
            item: `${SITE}/ports/${slug}`,
          },
        ],
      },
      {
        "@type": "TouristDestination",
        "@id": `${SITE}/ports/${slug}#destination`,
        name: `${place.name}, Alaska`,
        description: place.overview,
        touristType: ["Cruise Travelers", "Independent Alaska Travelers"],
      },
    ],
  };

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
              Research Queue Destination (Unindexed · noindex, follow):
            </strong>{" "}
            <span style={{ fontSize: 14, color: "#5c3b09" }}>
              {place.name} remains excluded from search indexing until primary-source dock
              transfers and independent local operator schedules pass publication review.
            </span>
          </div>
        </section>
      )}

      {/* 1. Hero & Entity Type */}
      <section className="port-hero" style={{ padding: "40px 0 36px" }}>
        <div className="shell">
          <nav className="breadcrumbs" aria-label="Breadcrumbs">
            <Link href="/">Home</Link>
            <span>›</span>
            <Link href="/southeast-alaska">Southeast Alaska</Link>
            <span>›</span>
            <Link href="/ports">Ports &amp; Communities</Link>
            <span>›</span>
            <span>{place.name}</span>
          </nav>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
              gap: 32,
              alignItems: "center",
            }}
          >
            <div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
                <span
                  className={`badge ${
                    place.largeCruiseShipDisembarkationAllowed
                      ? "badge-safety"
                      : "badge-warning"
                  }`}
                >
                  {PLACE_TYPE_LABELS[place.placeType] || place.placeType}
                </span>
                <span className="chip">{place.subRegionLabel}</span>
                {place.verifiedAt && (
                  <span className="chip" data-testid="place-last-verified">
                    Verified {place.verifiedAt}
                  </span>
                )}
              </div>

              <h1 style={{ marginTop: 6, marginBottom: 12 }}>
                {place.largeCruiseShipDisembarkationAllowed
                  ? `${place.name} Shore Excursions & Local Port Directory`
                  : `${place.name} Scenic Cruising & National Park Guide`}
              </h1>
              <p
                className="lead"
                style={{ color: "#485b63", fontSize: "17px", marginBottom: 14 }}
              >
                {place.hook}
              </p>
              <p style={{ color: "var(--muted)", fontSize: 15, marginBottom: 20 }}>
                {place.overview}
              </p>

              <div className="cta-row">
                {localOperators.length > 0 && (
                  <a className="button" href="#local-operators">
                    Local {place.name} operators ({localOperators.length}) ↓
                  </a>
                )}
                <a className="button secondary" href="#dock-and-pickup-guide">
                  {place.largeCruiseShipDisembarkationAllowed
                    ? "Docks & pickup rules"
                    : "Scenic cruising rules"}
                </a>
                {canonicalPortTours.length > 0 && (
                  <a className="button secondary" href="#sailing-timing-fit">
                    Check 2-hour sailing fit
                  </a>
                )}
              </div>
              <TrustDisclosure compact />
            </div>

            <div style={{ position: "relative" }}>
              <div
                style={{
                  position: "relative",
                  borderRadius: "14px",
                  overflow: "hidden",
                  border: "1px solid var(--line)",
                  boxShadow: "var(--card-shadow)",
                  aspectRatio: "16 / 10",
                  background: "#eef5f6",
                }}
              >
                <img
                  src={place.heroImage}
                  alt={place.heroImageAlt}
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
                <span
                  style={{
                    position: "absolute",
                    bottom: 8,
                    right: 10,
                    background: "rgba(14, 26, 31, 0.75)",
                    backdropFilter: "blur(4px)",
                    color: "#ffffff",
                    fontSize: "11px",
                    padding: "3px 8px",
                    borderRadius: "4px",
                  }}
                >
                  {place.heroImageCredit}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Non-Disembarkation Alert (Mandatory for Glacier Bay) */}
      {!place.largeCruiseShipDisembarkationAllowed && (
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
              Large Cruise Ships Do NOT Dock or Disembark Passengers in {place.name}
            </h2>
            <p style={{ margin: 0, fontSize: 15.5, color: "var(--ink)", maxWidth: 900 }}>
              {place.disembarkationExplanation}
            </p>
          </div>
        </section>
      )}

      {/* Related Distinct Places Cross-Links (Hoonah <-> ISP, Gustavus <-> Glacier Bay, Haines <-> Skagway, etc.) */}
      {place.relatedPlaces.length > 0 && (
        <section
          data-testid="related-places-crosslinks"
          className="section"
          style={{
            background: "#f4f9f9",
            borderBottom: "1px solid var(--line)",
            padding: "26px 0",
          }}
        >
          <div className="shell">
            <p className="eyebrow" style={{ color: "var(--forest)", marginBottom: 6 }}>
              Geographic &amp; Operational Relationship
            </p>
            <h2 style={{ fontSize: 21, marginTop: 0, marginBottom: 14 }}>
              Related Communities, Terminals &amp; Waterways Near {place.name}
            </h2>
            <div
              className="grid"
              style={{ gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))" }}
            >
              {place.relatedPlaces.map((rel) => (
                <div
                  key={rel.targetPlaceId}
                  className="card"
                  style={{ background: "#ffffff" }}
                >
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 6 }}>
                    <span className="badge badge-safety">
                      {PLACE_TYPE_LABELS[rel.targetPlaceType] || rel.targetPlaceType}
                    </span>
                    <span className="chip">{rel.distanceOrTransitSummary}</span>
                  </div>
                  <h3 style={{ fontSize: 18, margin: "4px 0 6px" }}>
                    {rel.targetPublicPortSlug ? (
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
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 2. Excursion Categories (Canonical /ports/[slug]/[categorySlug] + Legacy /[port]/[activity]) */}
      {(indexablePortCategories.length > 0 || legacyActivities.length > 0) && (
        <section
          className="section"
          id="excursion-categories"
          style={{ background: "#ffffff", padding: "34px 0" }}
        >
          <div className="shell">
            <h2>{place.name} Excursion Categories</h2>
            <p className="lead" style={{ color: "var(--muted)" }}>
              Compare verified multi-operator category guides and port-window activity
              clusters in {place.name}:
            </p>

            {indexablePortCategories.length > 0 && (
              <div className="grid" style={{ marginTop: 20 }}>
                {indexablePortCategories.map((pc) => (
                  <Link
                    key={pc.category.categorySlug}
                    href={`/ports/${slug}/${pc.category.categorySlug}`}
                    className="card"
                  >
                    <div
                      style={{
                        borderRadius: 10,
                        overflow: "hidden",
                        aspectRatio: "16 / 9",
                        marginBottom: 12,
                        background: "#eef5f6",
                        position: "relative",
                      }}
                    >
                      <img
                        src={pc.category.image}
                        alt={pc.category.imageAlt}
                        width={640}
                        height={360}
                        loading="lazy"
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          display: "block",
                        }}
                      />
                      <span
                        style={{
                          position: "absolute",
                          bottom: 6,
                          right: 8,
                          background: "rgba(14,26,31,0.72)",
                          color: "#fff",
                          fontSize: 10.5,
                          padding: "2px 6px",
                          borderRadius: 4,
                        }}
                      >
                        {pc.category.imageCredit}
                      </span>
                    </div>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
                      <span className="badge badge-safety">
                        {pc.qualifiedOperators.length} Verified Operators
                      </span>
                      <span className="chip">
                        {pc.qualifiedTours.length} Verified Tours
                      </span>
                    </div>
                    <h3>{pc.comparison?.h1 || `${place.name} ${pc.category.name}`}</h3>
                    <p style={{ fontSize: 14, color: "var(--muted)" }}>
                      {pc.comparison?.metaDescription || pc.category.summary}
                    </p>
                  </Link>
                ))}
              </div>
            )}

            {/* Preserve legacy /[port]/[activity] cards & data-testid attributes on original 5 ports */}
            {legacyActivities.length > 0 && (
              <div style={{ marginTop: indexablePortCategories.length > 0 ? 28 : 20 }}>
                {indexablePortCategories.length > 0 && (
                  <h3 style={{ fontSize: 18, marginBottom: 12, color: "var(--deep)" }}>
                    {place.name} Port-Window Activity Guides
                  </h3>
                )}
                <div className="grid">
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
        style={{ background: "#f8fbfb", borderTop: "1px solid var(--line)" }}
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
                Company Profiles · Primary-Source Verified
              </p>
              <h2 style={{ margin: 0 }}>{place.name} Local Excursion Operators</h2>
            </div>
            <Link
              href="/operators"
              style={{ fontWeight: 700, color: "var(--forest)", fontSize: 14.5 }}
            >
              View all Southeast Alaska operators →
            </Link>
          </div>

          {localOperators.length === 0 ? (
            <div className="card" style={{ background: "#ffffff" }}>
              <p style={{ margin: 0, fontSize: 14.5, color: "var(--muted)" }}>
                {!place.largeCruiseShipDisembarkationAllowed
                  ? `Because large cruise ships do not disembark passengers in ${place.name}, independent local boat and flight operators base out of neighboring Gustavus instead. See the Gustavus community directory for Bartlett Cove day-boat operators.`
                  : `Independent local operator profiles for ${place.name} are currently in verification review. See dock and official harbor visitor resources below.`}
              </p>
            </div>
          ) : (
            <div className="grid">
              {localOperators.map(({ operator, tours }) => {
                const portToursCount = tours.filter(
                  (t) => t.portSlug === slug && !t.isCommerciallyHeld,
                ).length;
                return (
                  <div
                    key={operator.operatorId}
                    className="card"
                    style={{
                      background: "#ffffff",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                    }}
                  >
                    <div>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
                        {operator.verifiedOwnershipBadges.map((b) => (
                          <span key={b.tag} className="badge badge-safety">
                            {b.label}
                          </span>
                        ))}
                        <span className="chip">{operator.bookingPlatform}</span>
                      </div>
                      <h3 style={{ marginTop: 4, marginBottom: 6 }}>
                        <Link
                          href={`/operators/${operator.slug}`}
                          style={{ color: "var(--deep)" }}
                        >
                          {operator.name}
                        </Link>
                      </h3>
                      <p style={{ fontSize: 14, color: "var(--muted)", marginBottom: 10 }}>
                        {operator.tagline}
                      </p>
                      <p style={{ fontSize: 13, color: "var(--ink)", margin: 0 }}>
                        <strong>Cruise Pickup:</strong> {operator.cruiseLogisticsSummary}
                      </p>
                    </div>

                    <div
                      style={{
                        marginTop: 14,
                        paddingTop: 12,
                        borderTop: "1px solid var(--line)",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      <span style={{ fontSize: 12.5, color: "var(--muted)" }}>
                        {portToursCount} verified {portToursCount === 1 ? "tour" : "tours"} in{" "}
                        {place.name}
                      </span>
                      <Link
                        href={`/operators/${operator.slug}`}
                        style={{ fontWeight: 700, fontSize: 13.5, color: "var(--forest)" }}
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
              Connected to Canonical Operator &amp; Dock Rules
            </p>
            <h2>Tours Currently Available in {place.name}</h2>
            <div className="grid" style={{ marginTop: 18 }}>
              {canonicalPortTours.map((tour) => {
                const bookingHref =
                  tour.bookingChannel === "viator_exact_product" &&
                  tour.viatorOfficialUrl
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
                    className="card"
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                    }}
                  >
                    <div>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
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
                      style={{
                        marginTop: 14,
                        paddingTop: 12,
                        borderTop: "1px solid var(--line)",
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
                          tour.bookingChannel === "viator_exact_product"
                            ? "noopener noreferrer sponsored"
                            : "noopener noreferrer"
                        }
                      >
                        {tour.bookingChannel === "viator_exact_product"
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
        <section className="section" id="clusters" style={{ background: "#f8fbfb" }}>
          <div className="shell">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
                flexWrap: "wrap",
                marginBottom: 20,
              }}
            >
              <div>
                <p className="eyebrow" style={{ color: "var(--muted)" }}>
                  Compare Partner Catalog Excursions
                </p>
                <h2>{place.name} Shore Excursion Filter</h2>
              </div>
              <span
                data-testid="lfse-port-excursion-count"
                style={{ fontSize: "14px", color: "var(--forest)", fontWeight: 700 }}
              >
                {legacyPortExcursions.length} {place.name}{" "}
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

      {/* 5. Port, Dock & Cruise Pickup / Drop-Off Guide */}
      <section
        className="section"
        id="dock-and-pickup-guide"
        style={{
          background: "#ffffff",
          borderTop: "1px solid var(--line)",
          padding: "36px 0",
        }}
      >
        <div className="shell">
          <h2>{place.name} Docks, Landings &amp; Cruise Pickup Rules</h2>
          <p style={{ color: "var(--ink)", maxWidth: 860, fontSize: 15.5 }}>
            {place.portAndDockSummary}
          </p>
          <div
            className="callout"
            style={{ marginTop: 16, marginBottom: 22, background: "#f4f9f9" }}
          >
            <strong style={{ display: "block", color: "var(--deep)", marginBottom: 4 }}>
              Independent Excursion Pickup &amp; Drop-Off Logistics ({place.typicalPortHours})
            </strong>
            <p style={{ margin: 0, fontSize: 14.5, color: "var(--ink)" }}>
              {place.cruisePickupDropoffNotes}
            </p>
          </div>

          <div className="grid">
            {place.docksAndAccessPoints.map((dock) => (
              <div
                key={dock.locationId}
                className="card"
                style={{ background: "#f8fbfb", border: "1px solid var(--line)" }}
              >
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 6 }}>
                  <span className="badge badge-safety">{dock.facilityKind.replace(/_/g, " ")}</span>
                  <span className="chip">
                    +{dock.additionalTransferMinutesEachWay}m transfer buffer each way
                  </span>
                </div>
                <strong
                  style={{ fontSize: "16px", color: "var(--forest)", display: "block" }}
                >
                  {dock.name}
                </strong>
                <p style={{ fontSize: "13.5px", color: "var(--muted)", marginTop: 6 }}>
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
          style={{ background: "#f8fbfb", borderTop: "1px solid var(--line)" }}
        >
          <div className="shell">
            <h2>Cruise Ships &amp; Sailings Calling at {place.name}</h2>
            <p style={{ color: "var(--muted)", maxWidth: 800 }}>
              Representative ships and call patterns visiting {place.name}, linked to
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

      {/* 7. Timing-Fit Results for Your Sailing */}
      <section
        className="section"
        id="sailing-timing-fit"
        style={{ background: "#ffffff", borderTop: "1px solid var(--line)" }}
      >
        <div className="shell">
          <PortSailingTimingFitPanel
            portName={place.name}
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

      {/* 8. Weather Backup & Official Local Tourism / Harbor Sources */}
      <section
        className="section"
        style={{ background: "#f8fbfb", borderTop: "1px solid var(--line)" }}
      >
        <div className="shell">
          <div className="callout" style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: "20px", marginTop: 0 }}>
              Weather &amp; Operational Reality in {place.name}
            </h2>
            <p style={{ fontSize: "15px", lineHeight: 1.6, marginTop: 8 }}>
              {place.weatherBackupAdvice}
            </p>
          </div>

          <div className="card" style={{ background: "#ffffff" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
                flexWrap: "wrap",
                gap: 10,
                marginBottom: 12,
              }}
            >
              <h2 style={{ fontSize: 19, margin: 0 }}>
                Official {place.name} Tourism, Harbor &amp; Park Sources
              </h2>
              <span style={{ fontSize: 13, fontWeight: 700, color: "var(--forest)" }}>
                {place.verifiedAt
                  ? `Primary-Source Verified: ${place.verifiedAt}`
                  : "Verification Status: Held in Research Queue"}
              </span>
            </div>

            {place.officialLocalSources.length > 0 ? (
              <ul style={{ margin: 0, paddingLeft: 20, display: "grid", gap: 8 }}>
                {place.officialLocalSources.map((src) => (
                  <li key={src.url} style={{ fontSize: 14 }}>
                    <a
                      href={src.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ fontWeight: 700, color: "var(--forest)" }}
                    >
                      {src.label} ↗
                    </a>{" "}
                    <span style={{ color: "var(--muted)", fontSize: 12.5 }}>
                      ({src.sourceKind.replace(/_/g, " ")} · checked {src.checkedAt})
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p style={{ margin: 0, fontSize: 14, color: "var(--muted)" }}>
                Official local visitor sources are queued for primary-source verification.
              </p>
            )}
          </div>
        </div>
      </section>

      {researchQualifications.length > 0 && (
        <section
          className="section"
          style={{
            background: "#ffffff",
            borderTop: "1px solid var(--line)",
            padding: "24px 0",
          }}
        >
          <div className="shell">
            <details
              data-testid="lfse-port-research-methodology-details"
              style={{
                background: "#f8fbfb",
                border: "1px solid var(--line)",
                borderRadius: 10,
                padding: "14px 18px",
              }}
            >
              <summary
                style={{
                  cursor: "pointer",
                  fontWeight: 700,
                  fontSize: "15px",
                  color: "var(--deep)",
                }}
              >
                Research &amp; Operator Verification Methodology
              </summary>
              <div style={{ marginTop: 14 }}>
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
          </div>
        </section>
      )}
    </main>
  );
}
