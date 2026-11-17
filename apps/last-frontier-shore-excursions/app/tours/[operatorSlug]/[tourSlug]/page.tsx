import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { AFFILIATE_CATALOG } from "@/lib/affiliate/catalog";
import { buildDccHandoffAffiliateUrl } from "@/lib/affiliate/links";
import { TrustDisclosure } from "@/components/TrustDisclosure";
import { PortSailingTimingFitPanel } from "@/components/PortSailingTimingFitPanel";
import {
  SOUTHEAST_ALASKA_TOURS,
  findEvaluatedPortCategory,
  findSoutheastAlaskaOperatorBySlugOrAlias,
  findSoutheastAlaskaPlaceByPortSlug,
  findSoutheastAlaskaTourByOperatorAndSlug,
} from "../../../../../../lib/dcc/shared/southeastAlaskaDirectoryOperatorsAndTours";

const SITE = "https://www.lastfrontiershoreexcursions.com";

export function generateStaticParams() {
  return SOUTHEAST_ALASKA_TOURS.map((tour) => ({
    operatorSlug: tour.operatorSlug,
    tourSlug: tour.tourSlug,
  }));
}

function resolveTourOrLegacyCatalogItem(operatorSlug: string, tourSlug: string) {
  const canonicalTour = findSoutheastAlaskaTourByOperatorAndSlug(
    operatorSlug,
    tourSlug,
  );
  if (canonicalTour) {
    return { kind: "canonical" as const, tour: canonicalTour };
  }

  // Fallback for any legacy /tours/[company]/[productId] hit against AFFILIATE_CATALOG
  const normItem = tourSlug.trim().toLowerCase();
  const legacyItem = AFFILIATE_CATALOG.find(
    (ex) =>
      (ex.productId && ex.productId.toLowerCase() === normItem) ||
      ex.attributionCampaign.toLowerCase() === normItem,
  );
  if (legacyItem) {
    return { kind: "legacy_affiliate" as const, legacyItem };
  }

  return null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ operatorSlug: string; tourSlug: string }>;
}): Promise<Metadata> {
  const { operatorSlug, tourSlug } = await params;
  const resolved = resolveTourOrLegacyCatalogItem(operatorSlug, tourSlug);
  if (!resolved) return {};

  if (resolved.kind === "legacy_affiliate") {
    const ex = resolved.legacyItem;
    return {
      title: `${ex.title} | ${ex.provider} (${ex.portSlug})`,
      description: ex.description,
      alternates: { canonical: `${SITE}/tours/${operatorSlug}/${tourSlug}` },
    };
  }

  const { tour } = resolved;
  const operatorEntry = findSoutheastAlaskaOperatorBySlugOrAlias(tour.operatorSlug);
  const indexable =
    !tour.isCommerciallyHeld && Boolean(operatorEntry?.gate.indexable);

  return {
    title: `${tour.title} | ${tour.operatorName} (${tour.portSlug.toUpperCase()})`,
    description: `${tour.title} operated by ${tour.operatorName}: ${tour.durationLabel}, ${tour.priceDisplayLabel}, meeting point, and 2-hour cruise all-aboard buffer check.`,
    alternates: {
      canonical: `${SITE}/tours/${tour.operatorSlug}/${tour.tourSlug}`,
    },
    robots: {
      index: indexable,
      follow: true,
    },
    openGraph: {
      title: `${tour.title} | ${tour.operatorName}`,
      description: tour.summary,
      url: `${SITE}/tours/${tour.operatorSlug}/${tour.tourSlug}`,
      siteName: "Last Frontier Shore Excursions",
      type: "website",
      images: [
        {
          url: `${SITE}${tour.image}`,
          width: 1200,
          height: 800,
          alt: tour.imageAlt,
        },
      ],
    },
  };
}

export default async function TourDetailPage({
  params,
}: {
  params: Promise<{ operatorSlug: string; tourSlug: string }>;
}) {
  const { operatorSlug, tourSlug } = await params;
  const resolved = resolveTourOrLegacyCatalogItem(operatorSlug, tourSlug);
  if (!resolved) {
    notFound();
  }

  if (resolved.kind === "legacy_affiliate") {
    const ex = resolved.legacyItem;
    const matchedOp = findSoutheastAlaskaOperatorBySlugOrAlias(
      operatorSlug,
    );
    const handoffHref = buildDccHandoffAffiliateUrl({
      source: ex.source,
      destinationUrl: ex.officialUrl,
      productCode: ex.productId || undefined,
      campaign: ex.attributionCampaign,
    });
    return (
      <main>
        <section className="port-hero" style={{ padding: "40px 0" }}>
          <div className="shell">
            <nav className="breadcrumbs" aria-label="Breadcrumbs">
              <Link href="/">Home</Link>
              <span>›</span>
              <Link href={`/ports/${ex.portSlug}`}>{ex.portSlug}</Link>
              <span>›</span>
              <Link href={`/${ex.portSlug}/${ex.activitySlug}`}>{ex.activitySlug}</Link>
              <span>›</span>
              <span>{ex.title}</span>
            </nav>
            <h1>{ex.title}</h1>
            <p className="lead">{ex.description}</p>
            <div className="cta-row">
              {matchedOp && (
                <Link
                  className="button secondary"
                  href={`/operators/${matchedOp.operator.slug}`}
                >
                  Operator: {matchedOp.operator.name}
                </Link>
              )}
              <Link className="button secondary" href={`/ports/${ex.portSlug}`}>
                Port Directory
              </Link>
              <a
                className="button"
                href={handoffHref}
                target="_blank"
                rel="noopener noreferrer sponsored"
              >
                Check Partner Availability ↗
              </a>
            </div>
            <TrustDisclosure />
          </div>
        </section>
      </main>
    );
  }

  const { tour } = resolved;

  // Redirect legacy /tours/[company]/[item] alias to canonical /tours/[operatorSlug]/[tourSlug]
  if (
    operatorSlug.trim().toLowerCase() !== tour.operatorSlug ||
    tourSlug.trim().toLowerCase() !== tour.tourSlug
  ) {
    permanentRedirect(`/tours/${tour.operatorSlug}/${tour.tourSlug}`);
  }

  const placeEntry = findSoutheastAlaskaPlaceByPortSlug(tour.portSlug);
  const operatorEntry = findSoutheastAlaskaOperatorBySlugOrAlias(tour.operatorSlug);
  const portCategoryBundle = findEvaluatedPortCategory(
    tour.portSlug,
    tour.categorySlug,
  );

  const portName = placeEntry?.place.name || tour.portSlug;
  const categoryLabel =
    portCategoryBundle?.category.shortLabel ||
    tour.categorySlug.replace(/-/g, " ");

  const bookingHref =
    tour.bookingChannel === "viator_exact_product" && tour.viatorOfficialUrl
      ? buildDccHandoffAffiliateUrl({
          source: "viator",
          destinationUrl: tour.viatorOfficialUrl,
          productCode: tour.viatorProductCode || undefined,
          campaign: tour.attributionCampaign,
        })
      : tour.officialProductUrl;

  // Truthful WebPage + BreadcrumbList JSON-LD (Offer/price/Review/AggregateRating disabled per policy)
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${SITE}/tours/${tour.operatorSlug}/${tour.tourSlug}#webpage`,
        url: `${SITE}/tours/${tour.operatorSlug}/${tour.tourSlug}`,
        name: `${tour.title} — ${tour.operatorName}`,
        description: tour.summary,
        isPartOf: { "@id": `${SITE}/#website` },
        ...(tour.verifiedAt ? { dateModified: tour.lastModifiedAt } : {}),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: `${SITE}/` },
          {
            "@type": "ListItem",
            position: 2,
            name: portName,
            item: `${SITE}/ports/${tour.portSlug}`,
          },
          {
            "@type": "ListItem",
            position: 3,
            name: tour.operatorName,
            item: `${SITE}/operators/${tour.operatorSlug}`,
          },
          {
            "@type": "ListItem",
            position: 4,
            name: tour.title,
            item: `${SITE}/tours/${tour.operatorSlug}/${tour.tourSlug}`,
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

      {tour.isCommerciallyHeld && (
        <section
          data-testid="held-tour-noindex-banner"
          style={{
            background: "#fff4e5",
            borderBottom: "1px solid #f0c36d",
            padding: "16px 0",
          }}
        >
          <div className="shell">
            <strong style={{ color: "#7a4500" }}>
              Held Excursion Record (Unindexed · noindex, follow):
            </strong>{" "}
            <span style={{ fontSize: 14, color: "#5c3b09" }}>
              {tour.commercialHoldReason ||
                "Self-service checkout is held pending current-season pier shuttle verification."}
            </span>
          </div>
        </section>
      )}

      <section className="port-hero" style={{ padding: "40px 0 36px" }}>
        <div className="shell">
          <nav className="breadcrumbs" aria-label="Breadcrumbs">
            <Link href="/">Home</Link>
            <span>›</span>
            <Link href={`/ports/${tour.portSlug}`}>{portName}</Link>
            <span>›</span>
            <Link href={`/ports/${tour.portSlug}/${tour.categorySlug}`}>
              {categoryLabel}
            </Link>
            <span>›</span>
            <Link href={`/operators/${tour.operatorSlug}`}>{tour.operatorName}</Link>
            <span>›</span>
            <span>{tour.title}</span>
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
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
                <span className="badge badge-safety">{tour.durationLabel}</span>
                <span className="chip">{tour.priceDisplayLabel}</span>
                <span className="chip">
                  Min port call: {tour.recommendedMinPortHours}h
                </span>
                <span className="chip">
                  Weather sensitivity: {tour.weatherSensitivity}
                </span>
              </div>

              <h1 style={{ marginTop: 4, marginBottom: 10 }}>{tour.title}</h1>
              <p
                style={{
                  fontSize: 15,
                  fontWeight: 700,
                  color: "var(--forest)",
                  marginTop: 0,
                  marginBottom: 12,
                }}
              >
                Operated by{" "}
                <Link href={`/operators/${tour.operatorSlug}`}>
                  {tour.operatorName}
                </Link>{" "}
                in <Link href={`/ports/${tour.portSlug}`}>{portName}, Alaska</Link>
              </p>
              <p className="lead" style={{ color: "#485b63", marginBottom: 20 }}>
                {tour.summary}
              </p>

              <div className="cta-row">
                {!tour.isCommerciallyHeld ? (
                  <a
                    className="button"
                    href={bookingHref}
                    target="_blank"
                    rel={
                      tour.bookingChannel === "viator_exact_product"
                        ? "noopener noreferrer sponsored"
                        : "noopener noreferrer"
                    }
                  >
                    {tour.bookingChannel === "viator_exact_product"
                      ? "Check Partner Availability & Rates ↗"
                      : `Visit ${tour.operatorName} Official Page ↗`}
                  </a>
                ) : (
                  <span className="badge badge-warning">
                    Checkout Held Pending Shuttle Buffer Verification
                  </span>
                )}
                <Link
                  className="button secondary"
                  href={`/operators/${tour.operatorSlug}`}
                >
                  Operator Profile
                </Link>
                <Link className="button secondary" href={`/ports/${tour.portSlug}`}>
                  {portName} Port Guide
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
                boxShadow: "var(--card-shadow)",
                aspectRatio: "16 / 10",
                background: "#eef5f6",
              }}
            >
              <img
                src={tour.image}
                alt={tour.imageAlt}
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
                {tour.imageCredit}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Upward Knowledge Graph Connections */}
      <section
        className="section"
        data-testid="tour-upward-connections"
        style={{
          background: "#ffffff",
          borderBottom: "1px solid var(--line)",
          padding: "28px 0",
        }}
      >
        <div className="shell">
          <div
            className="grid"
            style={{ gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))" }}
          >
            <div className="card" style={{ background: "#f8fbfb" }}>
              <span className="badge badge-safety" style={{ alignSelf: "flex-start" }}>
                Local Operator
              </span>
              <h2 style={{ fontSize: 18, margin: "8px 0 6px" }}>
                <Link href={`/operators/${tour.operatorSlug}`}>
                  {tour.operatorName} →
                </Link>
              </h2>
              <p style={{ margin: 0, fontSize: 13.5, color: "var(--muted)" }}>
                {operatorEntry?.operator.tagline ||
                  "View company background, dock pickup rules, and policies."}
              </p>
            </div>

            <div className="card" style={{ background: "#f8fbfb" }}>
              <span className="badge badge-safety" style={{ alignSelf: "flex-start" }}>
                Port &amp; Community
              </span>
              <h2 style={{ fontSize: 18, margin: "8px 0 6px" }}>
                <Link href={`/ports/${tour.portSlug}`}>
                  {portName} Port Directory →
                </Link>
              </h2>
              <p style={{ margin: 0, fontSize: 13.5, color: "var(--muted)" }}>
                Compare {portName} docks, tender status, shuttles, and visiting ships.
              </p>
            </div>

            <div className="card" style={{ background: "#f8fbfb" }}>
              <span className="badge badge-safety" style={{ alignSelf: "flex-start" }}>
                Category Comparison
              </span>
              <h2 style={{ fontSize: 18, margin: "8px 0 6px" }}>
                <Link href={`/ports/${tour.portSlug}/${tour.categorySlug}`}>
                  {portName} {categoryLabel} →
                </Link>
              </h2>
              <p style={{ margin: 0, fontSize: 13.5, color: "var(--muted)" }}>
                Compare this excursion side-by-side against other {portName} options.
                {tour.legacyPortActivityHref && (
                  <>
                    {" "}
                    (Also listed in{" "}
                    <Link
                      href={tour.legacyPortActivityHref}
                      style={{ fontWeight: 700, color: "var(--forest)" }}
                    >
                      port-window activity guide
                    </Link>
                    .)
                  </>
                )}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Logistics, Pickup, Accessibility & Weight/Age */}
      <section className="section" style={{ background: "#f8fbfb" }}>
        <div className="shell">
          <h2>Cruise Pickup, Departures &amp; Passenger Requirements</h2>
          <div
            className="grid"
            style={{
              marginTop: 18,
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            }}
          >
            <div className="card" style={{ background: "#ffffff" }}>
              <h3 style={{ fontSize: 17, marginTop: 0 }}>
                Meeting Point &amp; Cruise Pickup
              </h3>
              <p style={{ fontSize: 14, color: "var(--ink)", marginBottom: 8 }}>
                <strong>Meeting Point:</strong> {tour.meetingPoint}
              </p>
              <p style={{ fontSize: 14, color: "var(--muted)", margin: 0 }}>
                {tour.pickupDetails}
              </p>
            </div>

            <div className="card" style={{ background: "#ffffff" }}>
              <h3 style={{ fontSize: 17, marginTop: 0 }}>
                Schedule &amp; Return Buffer
              </h3>
              <p style={{ fontSize: 14, color: "var(--ink)", marginBottom: 8 }}>
                <strong>Typical Departures:</strong>{" "}
                {tour.typicalDepartureTimes.join(", ")}
              </p>
              <p style={{ fontSize: 14, color: "var(--muted)", margin: 0 }}>
                Includes +{tour.transferBufferMinutesEachWay}m pier transfer allowance
                each way. Recommended minimum ship call:{" "}
                <strong>{tour.recommendedMinPortHours} hours</strong>.
              </p>
            </div>

            <div className="card" style={{ background: "#ffffff" }}>
              <h3 style={{ fontSize: 17, marginTop: 0 }}>
                Mobility, Weight &amp; Age Policies
              </h3>
              <p style={{ fontSize: 14, color: "var(--ink)", marginBottom: 8 }}>
                <strong>Accessibility:</strong> {tour.accessibilityNotes}
              </p>
              <p style={{ fontSize: 14, color: "var(--muted)", margin: 0 }}>
                <strong>Restrictions:</strong> {tour.weightOrAgeRestrictions}
              </p>
            </div>
          </div>

          {placeEntry && !tour.isCommerciallyHeld && (
            <div style={{ marginTop: 28 }}>
              <PortSailingTimingFitPanel
                portName={portName}
                docks={placeEntry.place.docksAndAccessPoints}
                tours={[tour]}
              />
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
