import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { buildDccHandoffAffiliateUrl } from "@/lib/affiliate/links";
import { TrustDisclosure } from "@/components/TrustDisclosure";
import { JuneauFlightDeckPlanningCallout } from "@/components/JuneauFlightDeckPlanningCallout";
import { OperatorIdentityMark } from "@/components/OperatorIdentityMark";
import { PortSailingTimingFitPanel } from "@/components/PortSailingTimingFitPanel";
import { loadLfseJuneauNormalizedSupplierFeed } from "@/lib/dccJuneauSupplierFeed";
import {
  formatCleanPlaceBaseName,
  STANDARDIZED_TWO_HOUR_PLANNING_NOTE,
} from "@/lib/directoryDisplay";
import {
  buildPortCategoryJsonLd,
  DCC_ALASKA_DIRECTORY_API_URL,
  LFSE_SITE_URL,
} from "@/lib/structuredData";
import {
  evaluatePortCategoryPublicationGate,
  isOperatorDirectCheckoutConnected,
  isOperatorLiveAvailabilityConnected,
} from "../../../../../../lib/dcc/shared/southeastAlaskaDirectoryContract";
import { SOUTHEAST_ALASKA_CATEGORIES } from "../../../../../../lib/dcc/shared/southeastAlaskaDirectoryData";
import {
  findEvaluatedPortCategory,
  findSoutheastAlaskaPlaceByPortSlug,
  getSoutheastAlaskaDirectorySnapshot,
  resolveSoutheastAlaskaTourDirectRezgoHref,
} from "../../../../../../lib/dcc/shared/southeastAlaskaDirectoryOperatorsAndTours";

export function generateStaticParams() {
  const snapshot = getSoutheastAlaskaDirectorySnapshot();
  return snapshot.portCategories.map((pc) => ({
    slug: pc.portSlug,
    categorySlug: pc.category.categorySlug,
  }));
}

function resolvePortCategoryContext(portSlug: string, categorySlug: string) {
  const evaluated = findEvaluatedPortCategory(portSlug, categorySlug);
  if (evaluated) {
    const placeEntry = findSoutheastAlaskaPlaceByPortSlug(portSlug);
    return {
      place: placeEntry?.place || null,
      bundle: evaluated,
    };
  }

  const placeEntry = findSoutheastAlaskaPlaceByPortSlug(portSlug);
  const category = SOUTHEAST_ALASKA_CATEGORIES.find(
    (c) => c.categorySlug === categorySlug.trim().toLowerCase(),
  );
  if (!placeEntry || !placeEntry.place.hasPublicDirectoryPage || !category) {
    return null;
  }

  const gate = evaluatePortCategoryPublicationGate({
    portSlug: placeEntry.place.publicPortSlug!,
    categorySlug: category.categorySlug,
    comparison: null,
    qualifiedOperatorIdsForPortCategory: [],
    qualifiedProductsForPortCategory: [],
  });

  return {
    place: placeEntry.place,
    bundle: {
      portSlug: placeEntry.place.publicPortSlug!,
      portName: placeEntry.place.name,
      category,
      comparison: null,
      qualifiedOperators: [],
      qualifiedTours: [],
      gate,
    },
  };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; categorySlug: string }>;
}): Promise<Metadata> {
  const { slug, categorySlug } = await params;
  const ctx = resolvePortCategoryContext(slug, categorySlug);
  if (!ctx) return {};

  const { bundle } = ctx;
  const cleanPortName = formatCleanPlaceBaseName(bundle.portName);
  const title =
    bundle.comparison?.title ||
    `${cleanPortName} ${bundle.category.name} | Local Operators & Timing`;
  const description =
    bundle.comparison?.metaDescription ||
    `Compare verified ${bundle.category.name.toLowerCase()} operators, meeting points, and two-hour return planning buffers in ${cleanPortName}, Alaska.`;

  return {
    title,
    description,
    alternates: {
      canonical: bundle.gate.indexable
        ? `${LFSE_SITE_URL}/ports/${bundle.portSlug}/${bundle.category.categorySlug}`
        : `${LFSE_SITE_URL}/ports/${bundle.portSlug}`,
    },
    robots: {
      index: bundle.gate.indexable,
      follow: true,
    },
    openGraph: {
      title,
      description,
      url: `${LFSE_SITE_URL}/ports/${bundle.portSlug}/${bundle.category.categorySlug}`,
      siteName: "Last Frontier Shore Excursions",
      type: "website",
      images: [
        {
          url: `${LFSE_SITE_URL}${bundle.category.image}`,
          width: 1200,
          height: 800,
          alt: bundle.category.imageAlt,
        },
      ],
    },
  };
}

export default async function PortCategoryComparisonPage({
  params,
}: {
  params: Promise<{ slug: string; categorySlug: string }>;
}) {
  const { slug, categorySlug } = await params;
  const ctx = resolvePortCategoryContext(slug, categorySlug);
  if (!ctx || !ctx.place) {
    notFound();
  }

  const { place, bundle } = ctx;
  const { category, comparison, qualifiedOperators, qualifiedTours, gate } = bundle;
  const cleanPortName = formatCleanPlaceBaseName(bundle.portName);
  const isJuneauHeliCategory =
    bundle.portSlug === "juneau" &&
    category.categorySlug === "helicopter-glacier-tours";

  const juneauFeed =
    bundle.portSlug === "juneau" &&
    qualifiedTours.some((t) => Boolean(t.authorizedSupplierBinding))
      ? await loadLfseJuneauNormalizedSupplierFeed({
          date: "2027-07-15",
          revalidateSeconds: 120,
        })
      : null;

  const jsonLd = buildPortCategoryJsonLd({
    portSlug: bundle.portSlug,
    portName: cleanPortName,
    categorySlug: category.categorySlug,
    categoryShortLabel: category.shortLabel,
    pageName: comparison?.h1 || `${cleanPortName} ${category.name}`,
    description: comparison?.metaDescription || category.summary,
    lastModifiedAt: comparison?.lastModifiedAt || place.lastModifiedAt,
  });

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {!gate.indexable && (
        <section
          data-testid="consolidated-category-noindex-banner"
          style={{
            background: "#fff4e5",
            borderBottom: "1px solid #f0c36d",
            padding: "16px 0",
          }}
        >
          <div className="shell">
            <strong style={{ color: "#7a4500" }}>
              Consolidated Inside {cleanPortName} Town Guide (noindex, follow):
            </strong>{" "}
            <span style={{ fontSize: 14, color: "#5c3b09" }}>
              Standalone category comparison pages require at least 2 verified local
              operators, 3 verified products, and side-by-side operational notes (
              {qualifiedOperators.length} verified{" "}
              {qualifiedOperators.length === 1 ? "operator" : "operators"} /{" "}
              {qualifiedTours.length} verified{" "}
              {qualifiedTours.length === 1 ? "product" : "products"} currently verified
              here).{" "}
              <Link
                href={`/ports/${bundle.portSlug}`}
                style={{ fontWeight: 700, color: "#7a4500", textDecoration: "underline" }}
              >
                Return to the consolidated {cleanPortName} guide →
              </Link>
            </span>
          </div>
        </section>
      )}

      <section className="port-hero">
        <div className="shell">
          <nav className="breadcrumbs" aria-label="Breadcrumbs">
            <Link href="/">Home</Link>
            <span>›</span>
            <Link href="/southeast-alaska">Southeast Alaska</Link>
            <span>›</span>
            <Link href={`/ports/${bundle.portSlug}`}>{cleanPortName}</Link>
            <span>›</span>
            <span>{category.shortLabel}</span>
          </nav>

          <div className="lfse-split-hero">
            <div>
              <div className="lfse-card-meta-row">
                <span className="badge badge-safety">
                  {`${qualifiedOperators.length} Local ${qualifiedOperators.length === 1 ? "Operator" : "Operators"}`}
                </span>
                <span className="chip">
                  {`${qualifiedTours.length} Verified ${qualifiedTours.length === 1 ? "Excursion" : "Excursions"}`}
                </span>
              </div>

              <h1>{comparison?.h1 || `${cleanPortName} ${category.name}`}</h1>
              <p className="lead" style={{ color: "#42555d", marginBottom: 18 }}>
                {comparison?.comparisonIntro || category.summary}
              </p>

              <div className="cta-row">
                <Link className="button secondary" href={`/ports/${bundle.portSlug}`}>
                  {`← ${cleanPortName} Port & Dock Guide`}
                </Link>
                <Link className="button secondary" href="/operators">
                  All Local Operators
                </Link>
              </div>
              <TrustDisclosure compact />
            </div>

            <div
              style={{
                position: "relative",
                borderRadius: 16,
                overflow: "hidden",
                border: "1px solid var(--line)",
                aspectRatio: "16 / 10",
                background: "var(--ice)",
              }}
            >
              <img
                src={category.image}
                alt={category.imageAlt}
                width={1200}
                height={800}
                loading="eager"
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
              />
              <span className="lfse-card-credit">{category.imageCredit}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Substantive Operational Comparison */}
      {comparison && (
        <section
          className="section"
          style={{ background: "#ffffff", borderBottom: "1px solid var(--line)" }}
        >
          <div className="shell">
            <h2>How {cleanPortName} Operators Differ</h2>
            <ul
              style={{
                marginTop: 14,
                marginBottom: 20,
                paddingLeft: 20,
                display: "grid",
                gap: 10,
                maxWidth: 880,
              }}
            >
              {comparison.keyDifferencesBullets.map((bullet, idx) => (
                <li key={idx} style={{ fontSize: 15, lineHeight: 1.6, color: "var(--ink)" }}>
                  {bullet}
                </li>
              ))}
            </ul>

            <div className="callout">
              <strong style={{ display: "block", color: "var(--deep)", marginBottom: 4 }}>
                Dock Transfer &amp; 2-Hour Return Buffer Guidance
              </strong>
              <p style={{ margin: 0, fontSize: 14.5, color: "var(--ink)" }}>
                {comparison.dockAndTimingGuidance}
              </p>
            </div>

            <div className="lfse-return-standard-box">
              <strong>2-Hour Return Planning Standard:</strong>
              <p>
                {STANDARDIZED_TWO_HOUR_PLANNING_NOTE} This is an independent planning
                standard—not an operator guarantee or cruise-line rule. Keep operator
                check-in times, cancellation cutoffs, and ship all-aboard times distinct.
              </p>
            </div>

            {(comparison.juneauFlightDeckNote || isJuneauHeliCategory) && (
              <JuneauFlightDeckPlanningCallout
                heading="Juneau Helicopter Weather, Weight Limits & Cancellation Backups"
                contextLabel="Juneau Flight Deck · Specialist Aviation Guides"
                testId="juneau-flight-deck-boundary-callout"
              />
            )}
          </div>
        </section>
      )}

      {/* Qualified Operators */}
      <section className="section">
        <div className="shell">
          <h2>
            Verified {category.shortLabel} Operators in {cleanPortName}
          </h2>
          {qualifiedOperators.length === 0 ? (
            <p style={{ color: "var(--muted)" }}>
              No standalone operators are currently published for this category in{" "}
              {cleanPortName}. See the{" "}
              <Link
                href={`/ports/${bundle.portSlug}`}
                style={{ fontWeight: 700, color: "var(--forest)", textDecoration: "underline" }}
              >
                {cleanPortName} port guide
              </Link>{" "}
              for available local options.
            </p>
          ) : (
            <div className="lfse-cards-grid" style={{ marginTop: 18 }}>
              {qualifiedOperators.map((op) => {
                const isLiveConnected =
                  isOperatorLiveAvailabilityConnected(op) &&
                  isOperatorDirectCheckoutConnected(op) &&
                  (op.slug !== "juneau-tours-and-whale-watch" ||
                    Boolean(
                      juneauFeed?.ok &&
                        juneauFeed.source === "dcc_rezgo_readonly_xml" &&
                        juneauFeed.liveDirectRezgoCheckoutEnabled,
                    ));
                return (
                  <div key={op.operatorId} className="card lfse-directory-card">
                    <div>
                      <div className="lfse-card-meta-row">
                        {isLiveConnected && (
                          <span className="badge badge-safety">
                            Live Availability + Direct Checkout
                          </span>
                        )}
                        {op.verifiedOwnershipBadges.map((b) => (
                          <span key={b.tag} className="badge badge-safety">
                            {b.label}
                          </span>
                        ))}
                      </div>
                      <div className="lfse-operator-card-heading">
                        <OperatorIdentityMark name={op.name} size="md" />
                        <h3>
                          <Link href={`/operators/${op.slug}`} style={{ color: "var(--deep)" }}>
                            {op.name}
                          </Link>
                        </h3>
                      </div>
                      <p style={{ fontSize: 14, color: "var(--muted)", marginBottom: 10 }}>
                        {op.tagline}
                      </p>
                      <p style={{ fontSize: 13, color: "var(--ink)", margin: 0 }}>
                        <strong>Policies &amp; Limits:</strong> {op.weightAndAgePolicies}
                      </p>
                    </div>
                    <div className="lfse-card-footer">
                      <Link
                        href={`/operators/${op.slug}`}
                        className="lfse-card-action-link"
                      >
                        View {op.name} company profile →
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Qualified Tours */}
      {qualifiedTours.length > 0 && (
        <section
          className="section"
          style={{ background: "#ffffff", borderTop: "1px solid var(--line)" }}
        >
          <div className="shell">
            <h2>
              Compare {cleanPortName} {category.shortLabel} Tours
            </h2>
            <div className="lfse-cards-grid" style={{ marginTop: 18, marginBottom: 28 }}>
              {qualifiedTours.map((tour) => {
                const matchedLiveRezgoTour =
                  juneauFeed && tour.authorizedSupplierBinding
                    ? juneauFeed.tours.find(
                        (t) =>
                          t.normalizedTourId ===
                            tour.authorizedSupplierBinding?.normalizedFeedTourId ||
                          t.rezgoCom === tour.authorizedSupplierBinding?.supplierItemCode,
                      ) || null
                    : null;
                const isDirectRezgo = Boolean(
                  tour.authorizedSupplierBinding &&
                    juneauFeed?.ok &&
                    juneauFeed.source === "dcc_rezgo_readonly_xml" &&
                    matchedLiveRezgoTour?.liveDirectRezgoCheckoutEnabled,
                );
                const directRezgoHref = isDirectRezgo
                  ? resolveSoutheastAlaskaTourDirectRezgoHref(tour, {
                      optionUid: matchedLiveRezgoTour?.rezgoUid ?? null,
                      serviceDate: juneauFeed?.dateChecked ?? "2027-07-15",
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
                      <p style={{ fontSize: 13, fontWeight: 600, color: "var(--forest)", margin: "0 0 8px" }}>
                        Operated by{" "}
                        <Link href={`/operators/${tour.operatorSlug}`}>
                          {tour.operatorName}
                        </Link>
                      </p>
                      <p style={{ fontSize: 14, color: "var(--muted)", marginBottom: 10 }}>
                        {tour.summary}
                      </p>
                      <p style={{ fontSize: 12.5, color: "var(--ink)", margin: 0 }}>
                        <strong>Meeting Point:</strong> {tour.meetingPoint}
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
                        Tour Details
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

            <PortSailingTimingFitPanel
              portName={`${cleanPortName} (${category.shortLabel})`}
              docks={place.docksAndAccessPoints}
              tours={qualifiedTours}
            />

            <div style={{ marginTop: 24 }}>
              <details
                className="lfse-sources-details"
                data-testid="category-sources-and-freshness"
              >
                <summary>Sources and freshness</summary>
                <div className="lfse-sources-body">
                  <p style={{ margin: 0 }}>
                    <strong>Last verified:</strong>{" "}
                    {comparison?.verifiedAt || place.verifiedAt || "2026-11-17"}. Operator
                    fleet specifications, passenger weight/mobility rules, and pier pickup
                    locations are compiled from published operator schedules and official
                    harbor visitor guides.
                  </p>
                  <p style={{ margin: 0 }}>
                    <strong>Regional data provenance:</strong>{" "}
                    <a
                      href={DCC_ALASKA_DIRECTORY_API_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Destination Command Center Southeast Alaska Regional Directory ↗
                    </a>
                  </p>
                </div>
              </details>
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
