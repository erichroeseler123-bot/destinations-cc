import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { buildDccHandoffAffiliateUrl } from "@/lib/affiliate/links";
import { TrustDisclosure } from "@/components/TrustDisclosure";
import { PortSailingTimingFitPanel } from "@/components/PortSailingTimingFitPanel";
import { evaluatePortCategoryPublicationGate } from "../../../../../../lib/dcc/shared/southeastAlaskaDirectoryContract";
import { SOUTHEAST_ALASKA_CATEGORIES } from "../../../../../../lib/dcc/shared/southeastAlaskaDirectoryData";
import {
  findEvaluatedPortCategory,
  findSoutheastAlaskaPlaceByPortSlug,
  getSoutheastAlaskaDirectorySnapshot,
} from "../../../../../../lib/dcc/shared/southeastAlaskaDirectoryOperatorsAndTours";

const SITE = "https://www.lastfrontiershoreexcursions.com";

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

  // Fallback for valid port + valid category with 0 matching tours (still render clean noindex consolidation notice)
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
  const title =
    bundle.comparison?.title ||
    `${bundle.portName} ${bundle.category.name} | Local Operators & Timing`;
  const description =
    bundle.comparison?.metaDescription ||
    `Compare verified ${bundle.category.name.toLowerCase()} operators, meeting points, and 2-hour return buffers in ${bundle.portName}, Alaska.`;

  return {
    title,
    description,
    alternates: {
      canonical: bundle.gate.indexable
        ? `${SITE}/ports/${bundle.portSlug}/${bundle.category.categorySlug}`
        : `${SITE}/ports/${bundle.portSlug}`,
    },
    robots: {
      index: bundle.gate.indexable,
      follow: true,
    },
    openGraph: {
      title,
      description,
      url: `${SITE}/ports/${bundle.portSlug}/${bundle.category.categorySlug}`,
      siteName: "Last Frontier Shore Excursions",
      type: "website",
      images: [
        {
          url: `${SITE}${bundle.category.image}`,
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

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": `${SITE}/ports/${bundle.portSlug}/${category.categorySlug}#webpage`,
        url: `${SITE}/ports/${bundle.portSlug}/${category.categorySlug}`,
        name: comparison?.h1 || `${bundle.portName} ${category.name}`,
        description: comparison?.metaDescription || category.summary,
        isPartOf: { "@id": `${SITE}/#website` },
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
            name: bundle.portName,
            item: `${SITE}/ports/${bundle.portSlug}`,
          },
          {
            "@type": "ListItem",
            position: 4,
            name: category.shortLabel,
            item: `${SITE}/ports/${bundle.portSlug}/${category.categorySlug}`,
          },
        ],
      },
    ],
  };

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
              Consolidated Inside {bundle.portName} Town Guide (noindex, follow):
            </strong>{" "}
            <span style={{ fontSize: 14, color: "#5c3b09" }}>
              Standalone port-category index pages require at least 2 verified local
              operators, 3 verified products, and substantive operational comparison
              ({qualifiedOperators.length} verified{" "}
              {qualifiedOperators.length === 1 ? "operator" : "operators"} /{" "}
              {qualifiedTours.length} verified{" "}
              {qualifiedTours.length === 1 ? "product" : "products"} currently verified
              here).{" "}
              <Link
                href={`/ports/${bundle.portSlug}`}
                style={{ fontWeight: 700, color: "#7a4500", textDecoration: "underline" }}
              >
                Return to the consolidated {bundle.portName} directory →
              </Link>
            </span>
          </div>
        </section>
      )}

      <section className="port-hero" style={{ padding: "40px 0 34px" }}>
        <div className="shell">
          <nav className="breadcrumbs" aria-label="Breadcrumbs">
            <Link href="/">Home</Link>
            <span>›</span>
            <Link href="/southeast-alaska">Southeast Alaska</Link>
            <span>›</span>
            <Link href={`/ports/${bundle.portSlug}`}>{bundle.portName}</Link>
            <span>›</span>
            <span>{category.shortLabel}</span>
          </nav>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
              gap: 28,
              alignItems: "center",
            }}
          >
            <div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
                <span className="badge badge-safety">
                  {qualifiedOperators.length} Verified{" "}
                  {qualifiedOperators.length === 1 ? "Operator" : "Operators"}
                </span>
                <span className="chip">
                  {qualifiedTours.length} Verified{" "}
                  {qualifiedTours.length === 1 ? "Excursion" : "Excursions"}
                </span>
                {comparison?.verifiedAt && (
                  <span className="chip">Verified {comparison.verifiedAt}</span>
                )}
              </div>

              <h1 style={{ marginTop: 6, marginBottom: 12 }}>
                {comparison?.h1 || `${bundle.portName} ${category.name}`}
              </h1>
              <p className="lead" style={{ color: "#485b63", marginBottom: 18 }}>
                {comparison?.comparisonIntro || category.summary}
              </p>

              <div className="cta-row">
                <Link className="button secondary" href={`/ports/${bundle.portSlug}`}>
                  ← {bundle.portName} Port &amp; Dock Guide
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
                borderRadius: 14,
                overflow: "hidden",
                border: "1px solid var(--line)",
                aspectRatio: "16 / 10",
                background: "#eef5f6",
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
              <span
                style={{
                  position: "absolute",
                  bottom: 8,
                  right: 10,
                  background: "rgba(14, 26, 31, 0.75)",
                  color: "#fff",
                  fontSize: 11,
                  padding: "3px 8px",
                  borderRadius: 4,
                }}
              >
                {category.imageCredit}
              </span>
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
            <h2>How {bundle.portName} Operators Differ</h2>
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

            <div className="callout" style={{ background: "#f4f9f9" }}>
              <strong style={{ display: "block", color: "var(--deep)", marginBottom: 4 }}>
                Dock Transfer &amp; 2-Hour Return Buffer Guidance
              </strong>
              <p style={{ margin: 0, fontSize: 14.5, color: "var(--ink)" }}>
                {comparison.dockAndTimingGuidance}
              </p>
            </div>

            {/* Juneau Flight Deck Specialist Aviation Boundary Callout */}
            {comparison.juneauFlightDeckNote && (
              <div
                data-testid="juneau-flight-deck-boundary-callout"
                className="card"
                style={{
                  marginTop: 18,
                  background: "#eef6fb",
                  border: "1px solid #bcd8ec",
                }}
              >
                <span className="badge badge-safety" style={{ alignSelf: "flex-start" }}>
                  Specialist Aviation Weather &amp; Concierge Desk
                </span>
                <p style={{ margin: "8px 0 0", fontSize: 14.5, color: "var(--ink)" }}>
                  Last Frontier Shore Excursions maintains canonical company profiles for
                  Coastal Helicopters, NorthStar Trekking, TEMSCO Helicopters, and Wings
                  Airways below. For Juneau cloud-ceiling guidance, glacier flightseeing
                  education, and concierge seat handoffs, visit{" "}
                  <a
                    href="https://juneauflightdeck.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontWeight: 700, color: "var(--forest)" }}
                  >
                    Juneau Flight Deck (juneauflightdeck.com) ↗
                  </a>
                  .
                </p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Qualified Operators */}
      <section className="section" style={{ background: "#f8fbfb" }}>
        <div className="shell">
          <h2>
            Verified {category.shortLabel} Operators in {bundle.portName}
          </h2>
          {qualifiedOperators.length === 0 ? (
            <p style={{ color: "var(--muted)" }}>
              No verified standalone operators currently published for this category in{" "}
              {bundle.portName}. See the{" "}
              <Link href={`/ports/${bundle.portSlug}`} style={{ fontWeight: 700, color: "var(--forest)" }}>
                {bundle.portName} directory
              </Link>{" "}
              for available local options.
            </p>
          ) : (
            <div className="grid" style={{ marginTop: 18 }}>
              {qualifiedOperators.map((op) => (
                <div key={op.operatorId} className="card" style={{ background: "#ffffff" }}>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
                    {op.verifiedOwnershipBadges.map((b) => (
                      <span key={b.tag} className="badge badge-safety">
                        {b.label}
                      </span>
                    ))}
                  </div>
                  <h3 style={{ marginTop: 4, marginBottom: 6 }}>
                    <Link href={`/operators/${op.slug}`} style={{ color: "var(--deep)" }}>
                      {op.name}
                    </Link>
                  </h3>
                  <p style={{ fontSize: 14, color: "var(--muted)", marginBottom: 10 }}>
                    {op.tagline}
                  </p>
                  <p style={{ fontSize: 13, color: "var(--ink)", marginBottom: 12 }}>
                    <strong>Policies &amp; Limits:</strong> {op.weightAndAgePolicies}
                  </p>
                  <Link
                    href={`/operators/${op.slug}`}
                    style={{ fontWeight: 700, fontSize: 13.5, color: "var(--forest)" }}
                  >
                    View {op.name} company profile →
                  </Link>
                </div>
              ))}
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
              Compare {bundle.portName} {category.shortLabel} Tours
            </h2>
            <div className="grid" style={{ marginTop: 18, marginBottom: 28 }}>
              {qualifiedTours.map((tour) => {
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
                        Tour Details
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

            <PortSailingTimingFitPanel
              portName={`${bundle.portName} (${category.shortLabel})`}
              docks={place.docksAndAccessPoints}
              tours={qualifiedTours}
            />
          </div>
        </section>
      )}
    </main>
  );
}
