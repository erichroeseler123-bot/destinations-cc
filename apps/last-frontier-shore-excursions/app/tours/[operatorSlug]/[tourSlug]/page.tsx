import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { AFFILIATE_CATALOG } from "@/lib/affiliate/catalog";
import { buildDccHandoffAffiliateUrl } from "@/lib/affiliate/links";
import { TrustDisclosure } from "@/components/TrustDisclosure";
import { OperatorIdentityMark } from "@/components/OperatorIdentityMark";
import { PortSailingTimingFitPanel } from "@/components/PortSailingTimingFitPanel";
import { JuneauNormalizedSupplierFeedSection } from "@/components/JuneauNormalizedSupplierFeedSection";
import { JuneauFlightDeckPlanningCallout } from "@/components/JuneauFlightDeckPlanningCallout";
import { loadLfseJuneauNormalizedSupplierFeed } from "@/lib/dccJuneauSupplierFeed";
import {
  formatCleanPlaceBaseName,
  STANDARDIZED_TWO_HOUR_PLANNING_NOTE,
} from "@/lib/directoryDisplay";
import {
  buildTourDetailJsonLd,
  DCC_ALASKA_DIRECTORY_API_URL,
  LFSE_SITE_URL,
} from "@/lib/structuredData";
import {
  SOUTHEAST_ALASKA_TOURS,
  findEvaluatedPortCategory,
  findSoutheastAlaskaOperatorBySlugOrAlias,
  findSoutheastAlaskaPlaceByPortSlug,
  findSoutheastAlaskaTourByOperatorAndSlug,
  resolveSoutheastAlaskaTourDirectRezgoHref,
} from "../../../../../../lib/dcc/shared/southeastAlaskaDirectoryOperatorsAndTours";

const JUNEAU_AVIATION_OPERATORS = new Set([
  "temsco-helicopters",
  "coastal-helicopters",
  "northstar-trekking",
  "wings-airways",
]);

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
      alternates: { canonical: `${LFSE_SITE_URL}/tours/${operatorSlug}/${tourSlug}` },
    };
  }

  const { tour } = resolved;
  const operatorEntry = findSoutheastAlaskaOperatorBySlugOrAlias(tour.operatorSlug);
  const indexable =
    !tour.isCommerciallyHeld && Boolean(operatorEntry?.gate.indexable);

  return {
    title: `${tour.title} | ${tour.operatorName} (${tour.portSlug.toUpperCase()})`,
    description: `${tour.title} operated by ${tour.operatorName}: ${tour.durationLabel}, ${tour.priceDisplayLabel}, meeting point, and two-hour cruise all-aboard buffer check.`,
    alternates: {
      canonical: `${LFSE_SITE_URL}/tours/${tour.operatorSlug}/${tour.tourSlug}`,
    },
    robots: {
      index: indexable,
      follow: true,
    },
    openGraph: {
      title: `${tour.title} | ${tour.operatorName}`,
      description: tour.summary,
      url: `${LFSE_SITE_URL}/tours/${tour.operatorSlug}/${tour.tourSlug}`,
      siteName: "Last Frontier Shore Excursions",
      type: "website",
      images: [
        {
          url: `${LFSE_SITE_URL}${tour.image}`,
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
    const matchedOp = findSoutheastAlaskaOperatorBySlugOrAlias(operatorSlug);
    const handoffHref = buildDccHandoffAffiliateUrl({
      source: ex.source,
      destinationUrl: ex.officialUrl,
      productCode: ex.productId || undefined,
      campaign: ex.attributionCampaign,
    });
    return (
      <main>
        <section className="port-hero">
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
                Port Guide
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

  const portName = placeEntry
    ? formatCleanPlaceBaseName(placeEntry.place.name)
    : tour.portSlug;
  const categoryLabel =
    portCategoryBundle?.category.shortLabel ||
    tour.categorySlug.replace(/-/g, " ");

  const isJuneauAviationTour =
    tour.portSlug === "juneau" &&
    (tour.categorySlug === "helicopter-glacier-tours" ||
      JUNEAU_AVIATION_OPERATORS.has(tour.operatorSlug));

  const juneauFeed = tour.authorizedSupplierBinding
    ? await loadLfseJuneauNormalizedSupplierFeed({
        date: "2027-07-15",
        revalidateSeconds: 120,
      })
    : null;
  const matchedLiveRezgoTour =
    juneauFeed && tour.authorizedSupplierBinding
      ? juneauFeed.tours.find(
          (t) =>
            t.normalizedTourId ===
              tour.authorizedSupplierBinding?.normalizedFeedTourId ||
            t.rezgoCom === tour.authorizedSupplierBinding?.supplierItemCode,
        ) || null
      : null;
  const isTourLiveRezgoConnected = Boolean(
    juneauFeed?.ok &&
      juneauFeed.source === "dcc_rezgo_readonly_xml" &&
      matchedLiveRezgoTour,
  );
  const isTourDirectRezgoCheckout = Boolean(
    isTourLiveRezgoConnected && matchedLiveRezgoTour?.liveDirectRezgoCheckoutEnabled,
  );
  const directRezgoHref = isTourDirectRezgoCheckout
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

  const jsonLd = buildTourDetailJsonLd({
    operatorSlug: tour.operatorSlug,
    operatorName: tour.operatorName,
    operatorOfficialWebsite: operatorEntry?.operator.officialWebsite,
    tourSlug: tour.tourSlug,
    tourTitle: tour.title,
    summary: tour.summary,
    portSlug: tour.portSlug,
    portName,
    lastModifiedAt: tour.lastModifiedAt,
  });

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
              Held Excursion Record (noindex, follow):
            </strong>{" "}
            <span style={{ fontSize: 14, color: "#5c3b09" }}>
              {tour.commercialHoldReason ||
                "Self-service checkout is held pending current-season pier shuttle verification."}
            </span>
          </div>
        </section>
      )}

      <section className="port-hero">
        <div className="shell">
          <nav className="breadcrumbs" aria-label="Breadcrumbs">
            <Link href="/">Home</Link>
            <span>›</span>
            <Link href={`/ports/${tour.portSlug}`}>{portName}</Link>
            <span>›</span>
            {portCategoryBundle?.gate.indexable ? (
              <Link href={`/ports/${tour.portSlug}/${tour.categorySlug}`}>
                {categoryLabel}
              </Link>
            ) : (
              <span>{categoryLabel}</span>
            )}
            <span>›</span>
            {operatorEntry?.gate.indexable ? (
              <Link href={`/operators/${tour.operatorSlug}`}>{tour.operatorName}</Link>
            ) : (
              <span>{tour.operatorName}</span>
            )}
            <span>›</span>
            <span>{tour.title}</span>
          </nav>

          <div className="lfse-split-hero">
            <div>
              <div className="lfse-card-meta-row">
                <span className="badge badge-safety">{tour.durationLabel}</span>
                <span className="chip">{tour.priceDisplayLabel}</span>
                <span className="chip">
                  Min port call: {tour.recommendedMinPortHours}h
                </span>
                <span className="chip">
                  Weather sensitivity: {tour.weatherSensitivity}
                </span>
              </div>

              <h1>{tour.title}</h1>
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
                {operatorEntry?.gate.indexable ? (
                  <Link href={`/operators/${tour.operatorSlug}`}>
                    {tour.operatorName}
                  </Link>
                ) : (
                  <span>{tour.operatorName}</span>
                )}{" "}
                in <Link href={`/ports/${tour.portSlug}`}>{portName}, Alaska</Link>
              </p>
              <p className="lead" style={{ color: "#42555d", marginBottom: 20 }}>
                {tour.summary}
              </p>

              <div className="cta-row">
                {!tour.isCommerciallyHeld ? (
                  <a
                    className="button"
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
                        ? "Check Partner Availability & Rates ↗"
                        : `Visit ${tour.operatorName} Official Page ↗`}
                  </a>
                ) : (
                  <span className="badge badge-warning">
                    Checkout Held Pending Shuttle Buffer Verification
                  </span>
                )}
                {isTourLiveRezgoConnected && (
                  <a className="button secondary" href="#live-rezgo-booking">
                    Check Live Port-Day Times ↓
                  </a>
                )}
                {operatorEntry?.gate.indexable && (
                  <Link
                    className="button secondary"
                    href={`/operators/${tour.operatorSlug}`}
                  >
                    Operator Profile
                  </Link>
                )}
                <Link className="button secondary" href={`/ports/${tour.portSlug}`}>
                  {`${portName} Port Guide`}
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
                boxShadow: "var(--card-shadow)",
                aspectRatio: "16 / 10",
                background: "var(--ice)",
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
              <span className="lfse-card-credit">{tour.imageCredit}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Operator, Port & Category Attribution Cards */}
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
          <div className="lfse-cards-grid">
            <div className="card">
              <span className="badge badge-safety" style={{ alignSelf: "flex-start" }}>
                Local Operator
              </span>
              <div className="lfse-operator-card-heading" style={{ marginTop: 10 }}>
                <OperatorIdentityMark name={tour.operatorName} size="md" />
                <h2 style={{ fontSize: 18, margin: 0 }}>
                  {operatorEntry?.gate.indexable ? (
                    <Link href={`/operators/${tour.operatorSlug}`}>
                      {tour.operatorName} →
                    </Link>
                  ) : (
                    <span>{tour.operatorName}</span>
                  )}
                </h2>
              </div>
              <p style={{ margin: 0, fontSize: 13.5, color: "var(--muted)" }}>
                {operatorEntry?.operator.tagline ||
                  "View company background, dock pickup rules, and passenger policies."}
              </p>
            </div>

            <div className="card">
              <span className="badge badge-safety" style={{ alignSelf: "flex-start" }}>
                Port &amp; Community
              </span>
              <h2 style={{ fontSize: 18, margin: "10px 0 6px" }}>
                <Link href={`/ports/${tour.portSlug}`}>
                  {portName} Port Guide →
                </Link>
              </h2>
              <p style={{ margin: 0, fontSize: 13.5, color: "var(--muted)" }}>
                Compare {portName} docks, tender status, shuttles, and visiting ships.
              </p>
            </div>

            <div className="card">
              <span className="badge badge-safety" style={{ alignSelf: "flex-start" }}>
                Category Comparison
              </span>
              <h2 style={{ fontSize: 18, margin: "10px 0 6px" }}>
                <Link
                  href={
                    portCategoryBundle?.gate.indexable
                      ? `/ports/${tour.portSlug}/${tour.categorySlug}`
                      : tour.legacyPortActivityHref || `/ports/${tour.portSlug}#available-tours`
                  }
                >
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
                      style={{ fontWeight: 700, color: "var(--forest)", textDecoration: "underline" }}
                    >
                      port-window activity guide
                    </Link>
                    .)
                  </>
                )}
              </p>
            </div>
          </div>

          {isJuneauAviationTour && (
            <JuneauFlightDeckPlanningCallout
              heading="Juneau Glacier Flight Weather, Weight Rules & Backup Plans"
              contextLabel="Juneau Flight Deck · Aviation Planning Guides"
            />
          )}
        </div>
      </section>

      {/* Scoped Live Authorized Rezgo Availability & Direct Checkout (Juneau Tours ONLY) */}
      {juneauFeed && tour.authorizedSupplierBinding && isTourLiveRezgoConnected && (
        <div id="live-rezgo-booking" data-testid="tour-live-rezgo-feed">
          <JuneauNormalizedSupplierFeedSection
            feed={juneauFeed}
            filterNormalizedTourId={
              matchedLiveRezgoTour?.normalizedTourId ||
              tour.authorizedSupplierBinding.normalizedFeedTourId
            }
          />
        </div>
      )}

      {/* Logistics, Pickup, Accessibility & Weight/Age */}
      <section className="section">
        <div className="shell">
          <h2>Cruise Pickup, Departures &amp; Passenger Requirements</h2>
          <div className="lfse-cards-grid" style={{ marginTop: 18 }}>
            <div className="card">
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

            <div className="card">
              <h3 style={{ fontSize: 17, marginTop: 0 }}>
                Schedule &amp; Return Buffer
              </h3>
              <p style={{ fontSize: 14, color: "var(--ink)", marginBottom: 8 }}>
                <strong>Typical Departures:</strong>{" "}
                {tour.typicalDepartureTimes.join(", ") || "Check operator calendar"}
              </p>
              <p style={{ fontSize: 14, color: "var(--muted)", margin: 0 }}>
                Includes +{tour.transferBufferMinutesEachWay}m pier transfer allowance
                each way. Recommended minimum ship call:{" "}
                <strong>{tour.recommendedMinPortHours} hours</strong>.
              </p>
            </div>

            <div className="card">
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

          <div className="lfse-return-standard-box" style={{ marginTop: 22 }}>
            <strong>2-Hour Return Planning Standard:</strong>
            <p>
              {STANDARDIZED_TWO_HOUR_PLANNING_NOTE} This is an independent planning
              standard—not an operator guarantee or cruise-line rule. Confirm your
              operator&apos;s check-in deadline, cancellation cutoff, and your ship&apos;s
              published all-aboard time separately.
            </p>
          </div>

          {placeEntry && !tour.isCommerciallyHeld && (
            <div style={{ marginTop: 26 }}>
              <PortSailingTimingFitPanel
                portName={portName}
                docks={placeEntry.place.docksAndAccessPoints}
                tours={[tour]}
              />
            </div>
          )}

          <div style={{ marginTop: 24 }}>
            <details
              className="lfse-sources-details"
              data-testid="tour-sources-and-freshness"
            >
              <summary>Sources and freshness</summary>
              <div className="lfse-sources-body">
                <p style={{ margin: 0 }}>
                  <strong>Last verified:</strong>{" "}
                  {tour.verifiedAt || "Pending verification"}. Departure windows, meeting
                  points, and passenger restrictions are compiled from{" "}
                  {tour.officialProductUrl ? (
                    <a
                      href={tour.officialProductUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {tour.operatorName}&apos;s official product schedule ↗
                    </a>
                  ) : (
                    `${tour.operatorName}'s published schedule`
                  )}{" "}
                  and municipal harbor berth guides.
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
    </main>
  );
}
