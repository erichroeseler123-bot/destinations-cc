import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { buildDccHandoffAffiliateUrl } from "@/lib/affiliate/links";
import { TrustDisclosure } from "@/components/TrustDisclosure";
import { OperatorProfileClaimPanel } from "@/components/OperatorProfileClaimPanel";
import { OperatorEntityReviewsTabs } from "@/components/OperatorEntityReviewsTabs";
import { OperatorIdentityMark } from "@/components/OperatorIdentityMark";
import { JuneauNormalizedSupplierFeedSection } from "@/components/JuneauNormalizedSupplierFeedSection";
import { JuneauFlightDeckPlanningCallout } from "@/components/JuneauFlightDeckPlanningCallout";
import { loadLfseJuneauNormalizedSupplierFeed } from "@/lib/dccJuneauSupplierFeed";
import {
  formatCleanPlaceBaseName,
  STANDARDIZED_TWO_HOUR_PLANNING_NOTE,
} from "@/lib/directoryDisplay";
import {
  buildOperatorProfileJsonLd,
  DCC_ALASKA_DIRECTORY_API_URL,
  LFSE_SITE_URL,
} from "@/lib/structuredData";
import {
  UNCLAIMED_OPERATOR_PROFILE_NOTICE,
  isOperatorDirectCheckoutConnected,
  isOperatorLiveAvailabilityConnected,
} from "../../../../../lib/dcc/shared/southeastAlaskaDirectoryContract";
import {
  SOUTHEAST_ALASKA_OPERATORS,
  findSoutheastAlaskaOperatorBySlugOrAlias,
  getSoutheastAlaskaDirectorySnapshot,
  resolveSoutheastAlaskaTourDirectRezgoHref,
} from "../../../../../lib/dcc/shared/southeastAlaskaDirectoryOperatorsAndTours";

export function generateStaticParams() {
  return SOUTHEAST_ALASKA_OPERATORS.map((op) => ({ operatorSlug: op.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ operatorSlug: string }>;
}): Promise<Metadata> {
  const { operatorSlug } = await params;
  const entry = findSoutheastAlaskaOperatorBySlugOrAlias(operatorSlug);
  if (!entry) return {};

  const { operator, gate } = entry;
  const title = `${operator.name} | Tours, Cruise Pickup Rules & Official Info`;
  const description = `${operator.name} (${operator.publicPortSlugs.join(", ")}): ${operator.tagline}`;

  return {
    title,
    description,
    alternates: { canonical: `${LFSE_SITE_URL}/operators/${operator.slug}` },
    robots: {
      index: gate.indexable,
      follow: true,
    },
    openGraph: {
      title: `${operator.name} | Last Frontier Shore Excursions`,
      description,
      url: `${LFSE_SITE_URL}/operators/${operator.slug}`,
      siteName: "Last Frontier Shore Excursions",
      type: "website",
      images: [
        {
          url: `${LFSE_SITE_URL}${operator.heroImage}`,
          width: 1200,
          height: 800,
          alt: operator.heroImageAlt,
        },
      ],
    },
  };
}

export default async function OperatorProfilePage({
  params,
}: {
  params: Promise<{ operatorSlug: string }>;
}) {
  const { operatorSlug } = await params;
  const entry = findSoutheastAlaskaOperatorBySlugOrAlias(operatorSlug);
  if (!entry) {
    notFound();
  }

  const { operator, tours, gate } = entry;

  if (operatorSlug.trim().toLowerCase() !== operator.slug) {
    permanentRedirect(`/operators/${operator.slug}`);
  }

  const snapshot = getSoutheastAlaskaDirectorySnapshot();
  const servedPlaces = snapshot.places.filter((p) =>
    operator.servedPlaceIds.includes(p.place.placeId),
  );
  const categoryMap = new Map(
    snapshot.categories.map((c) => [c.categorySlug, c]),
  );

  const liveAvailConnected = isOperatorLiveAvailabilityConnected(operator);
  const directCheckoutConnected = isOperatorDirectCheckoutConnected(operator);
  const juneauFeed =
    operator.slug === "juneau-tours-and-whale-watch"
      ? await loadLfseJuneauNormalizedSupplierFeed({
          date: "2027-07-15",
          revalidateSeconds: 120,
        })
      : null;

  const verifiedLiveAvail =
    liveAvailConnected &&
    (operator.slug !== "juneau-tours-and-whale-watch" ||
      Boolean(juneauFeed?.ok && juneauFeed.source === "dcc_rezgo_readonly_xml"));
  const verifiedDirectCheckout =
    directCheckoutConnected &&
    (operator.slug !== "juneau-tours-and-whale-watch" ||
      Boolean(juneauFeed?.liveDirectRezgoCheckoutEnabled));
  const isJuneauAviation =
    operator.publicPortSlugs.includes("juneau") &&
    operator.categorySlugs.includes("helicopter-glacier-tours");

  const verifiedTours = tours.filter((t) => !t.isCommerciallyHeld);

  const jsonLd = buildOperatorProfileJsonLd({
    slug: operator.slug,
    name: operator.name,
    tagline: operator.tagline,
    companyOverview: operator.companyOverview,
    officialWebsite: operator.officialWebsite,
    officialPhone: operator.officialPhone,
    servedPlaceNames: servedPlaces.map(({ place }) =>
      formatCleanPlaceBaseName(place.name),
    ),
    lastModifiedAt: operator.lastModifiedAt,
  });

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Held / Research Queue Banner if !gate.indexable */}
      {!gate.indexable && (
        <section
          data-testid="held-operator-noindex-banner"
          style={{
            background: "#fff4e5",
            borderBottom: "1px solid #f0c36d",
            padding: "16px 0",
          }}
        >
          <div className="shell">
            <strong style={{ color: "#7a4500" }}>
              Unindexed Operator Record (noindex, follow):
            </strong>{" "}
            <span style={{ fontSize: 14, color: "#5c3b09" }}>
              {gate.holdDetails.join(" ")}
            </span>
          </div>
        </section>
      )}

      {/* 1. Operator Hero — Overview, Neutral Monogram & Primary Traveler Actions First */}
      <section className="port-hero">
        <div className="shell">
          <nav className="breadcrumbs" aria-label="Breadcrumbs">
            <Link href="/">Home</Link>
            <span>›</span>
            <Link href="/southeast-alaska">Southeast Alaska</Link>
            <span>›</span>
            <Link href="/operators">Local Operators</Link>
            <span>›</span>
            <span>{operator.name}</span>
          </nav>

          <div className="lfse-split-hero">
            <div>
              <div className="lfse-card-meta-row">
                {verifiedLiveAvail && verifiedDirectCheckout && (
                  <span className="badge badge-safety">
                    Live Availability + Direct Checkout
                  </span>
                )}
                {operator.verifiedOwnershipBadges.map((badge) => (
                  <a
                    key={badge.tag}
                    href={badge.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="badge badge-safety"
                    title={badge.evidenceSummary}
                  >
                    {badge.label} ↗
                  </a>
                ))}
                {operator.yearEstablished && (
                  <span className="chip">Est. {operator.yearEstablished}</span>
                )}
              </div>

              <div className="lfse-operator-hero-heading">
                <OperatorIdentityMark name={operator.name} size="lg" />
                <h1>{operator.name}</h1>
              </div>

              <p className="lead" style={{ color: "#42555d", marginBottom: 12 }}>
                {operator.tagline}
              </p>
              <p style={{ fontSize: 15, color: "var(--muted)", marginBottom: 14 }}>
                {operator.companyOverview}
              </p>

              <p
                style={{
                  fontSize: 13,
                  color: "var(--muted)",
                  margin: "0 0 18px",
                  padding: "8px 12px",
                  borderRadius: 10,
                  background: "rgba(255, 255, 255, 0.72)",
                  border: "1px solid var(--line)",
                }}
              >
                {operator.claimStatus === "claimed_verified"
                  ? `${operator.name} has verified ownership of this company profile.`
                  : UNCLAIMED_OPERATOR_PROFILE_NOTICE}
              </p>

              <div className="cta-row">
                {verifiedTours.length > 0 && (
                  <a className="button" href="#operator-tours">
                    {`View ${operator.name} Tours (${verifiedTours.length}) ↓`}
                  </a>
                )}
                <a className="button secondary" href="#pickup-and-policies">
                  Cruise Pickup &amp; Policies
                </a>
                {operator.officialWebsite && (
                  <a
                    className="button secondary"
                    href={operator.officialWebsite}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Official Website ↗
                  </a>
                )}
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
                src={operator.heroImage}
                alt={operator.heroImageAlt}
                width={1200}
                height={800}
                loading="eager"
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
              />
              <span className="lfse-card-credit">{operator.heroImageCredit}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Separate-Entity Note (e.g., Alaska Travel Adventures vs. Gastineau Guiding) */}
      {operator.separationGovernanceNote && (
        <section
          data-testid="operator-separation-note"
          style={{
            background: "#eef5f5",
            borderBottom: "1px solid var(--line)",
            padding: "14px 0",
          }}
        >
          <div className="shell">
            <strong style={{ color: "var(--deep)" }}>Independent Company Note:</strong>{" "}
            <span style={{ fontSize: 14.5, color: "var(--ink)" }}>
              {operator.separationGovernanceNote}
            </span>
          </div>
        </section>
      )}

      {/* 2. Port & Harbor Pickup Context + Categories Served */}
      <section
        className="section"
        style={{
          background: "#ffffff",
          borderBottom: "1px solid var(--line)",
          padding: "30px 0",
        }}
      >
        <div className="shell">
          <div className="lfse-cards-grid">
            <div className="card">
              <strong
                style={{
                  fontSize: 12,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  color: "var(--muted)",
                }}
              >
                Ports, Terminals &amp; Harbors Served
              </strong>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
                {servedPlaces.map(({ place, gate: placeGate }) =>
                  place.publicPortSlug && placeGate.indexable ? (
                    <Link
                      key={place.placeId}
                      href={`/ports/${place.publicPortSlug}`}
                      className="button small secondary"
                    >
                      {formatCleanPlaceBaseName(place.name)}
                    </Link>
                  ) : (
                    <span key={place.placeId} className="chip">
                      {formatCleanPlaceBaseName(place.name)}
                    </span>
                  ),
                )}
              </div>
            </div>

            <div className="card">
              <strong
                style={{
                  fontSize: 12,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  color: "var(--muted)",
                }}
              >
                Cruise Pier &amp; Harbor Pickup Summary
              </strong>
              <p style={{ margin: "10px 0 0", fontSize: 14, color: "var(--ink)" }}>
                {operator.cruiseLogisticsSummary}
              </p>
            </div>

            <div className="card">
              <strong
                style={{
                  fontSize: 12,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  color: "var(--muted)",
                }}
              >
                Excursion Categories &amp; Direct Contact
              </strong>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
                {operator.categorySlugs.map((catSlug) => {
                  const cat = categoryMap.get(catSlug);
                  const qualifiedPc = snapshot.portCategories.find(
                    (pc) =>
                      operator.publicPortSlugs.includes(pc.portSlug) &&
                      pc.category.categorySlug === catSlug &&
                      pc.gate.indexable,
                  );
                  return qualifiedPc ? (
                    <Link
                      key={catSlug}
                      href={`/ports/${qualifiedPc.portSlug}/${catSlug}`}
                      className="chip lfse-chip-link"
                    >
                      {cat?.shortLabel || catSlug}
                    </Link>
                  ) : (
                    <span key={catSlug} className="chip">
                      {cat?.shortLabel || catSlug}
                    </span>
                  );
                })}
              </div>
              {operator.officialPhone && (
                <p style={{ margin: "10px 0 0", fontSize: 13.5, color: "var(--ink)" }}>
                  <strong>Operator Phone:</strong> {operator.officialPhone}
                </p>
              )}
            </div>
          </div>

          {isJuneauAviation && (
            <JuneauFlightDeckPlanningCallout
              heading={`Planning a Juneau Flight with ${operator.name}?`}
              contextLabel="Juneau Flight Deck · Aviation Weather & Weight Guides"
            />
          )}
        </div>
      </section>

      {/* 2B. Live Authorized Rezgo Availability & Direct Checkout (Juneau Tours ONLY) */}
      {juneauFeed && verifiedLiveAvail && (
        <div id="live-rezgo-booking" data-testid="operator-live-rezgo-feed">
          <JuneauNormalizedSupplierFeedSection feed={juneauFeed} />
        </div>
      )}

      {/* 3. Verified Tour Lineup */}
      <section
        className="section"
        id="operator-tours"
        style={{ borderBottom: "1px solid var(--line)" }}
      >
        <div className="shell">
          <h2>{operator.name} Excursion Lineup</h2>
          {verifiedTours.length === 0 ? (
            <div className="card" style={{ marginTop: 16 }}>
              <p style={{ margin: 0, fontSize: 14.5, color: "var(--muted)" }}>
                Standalone excursion schedules for {operator.name} are currently pending
                current-season schedule verification. Visit the official operator website
                above for direct inquiries.
              </p>
            </div>
          ) : (
            <div className="lfse-cards-grid" style={{ marginTop: 18 }}>
              {verifiedTours.map((tour) => {
                const matchedLiveRezgoTour =
                  verifiedLiveAvail && tour.authorizedSupplierBinding
                    ? juneauFeed?.tours.find(
                        (t) =>
                          t.normalizedTourId ===
                            tour.authorizedSupplierBinding?.normalizedFeedTourId ||
                          t.rezgoCom === tour.authorizedSupplierBinding?.supplierItemCode,
                      ) || null
                    : null;
                const isTourDirectRezgo = Boolean(
                  verifiedDirectCheckout &&
                    tour.authorizedSupplierBinding &&
                    (!juneauFeed || matchedLiveRezgoTour?.liveDirectRezgoCheckoutEnabled),
                );
                const directRezgoHref = isTourDirectRezgo
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
                        <Link
                          href={`/ports/${tour.portSlug}`}
                          className="chip lfse-chip-link"
                        >
                          {tour.portSlug}
                        </Link>
                      </div>
                      <h3 style={{ marginTop: 4, marginBottom: 6 }}>
                        <Link
                          href={`/tours/${operator.slug}/${tour.tourSlug}`}
                          style={{ color: "var(--deep)" }}
                        >
                          {tour.title}
                        </Link>
                      </h3>
                      <p style={{ fontSize: 14, color: "var(--muted)", marginBottom: 10 }}>
                        {tour.summary}
                      </p>
                      <p style={{ fontSize: 13, color: "var(--ink)", margin: "0 0 6px" }}>
                        <strong>Typical Departures:</strong>{" "}
                        {tour.typicalDepartureTimes.join(", ") || "Check operator calendar"}
                      </p>
                      <p style={{ fontSize: 13, color: "var(--ink)", margin: 0 }}>
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
                        href={`/tours/${operator.slug}/${tour.tourSlug}`}
                      >
                        Full Tour &amp; Buffer Page
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
                          ? `Direct Checkout with ${operator.name} ↗`
                          : isViatorFallback
                            ? "Check Partner Availability ↗"
                            : "Official Tour Page ↗"}
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* 4. Cruise Dock Pickup Rules, Accessibility & Weight/Age Policies */}
      <section
        className="section"
        id="pickup-and-policies"
        style={{ background: "#ffffff", borderBottom: "1px solid var(--line)" }}
      >
        <div className="shell">
          <h2>Cruise Pickup Rules, Mobility &amp; Passenger Policies</h2>
          <p style={{ color: "var(--ink)", maxWidth: 850 }}>
            {operator.cruiseLogisticsSummary}
          </p>

          {operator.dockPickupRules.length > 0 && (
            <div className="table-wrap" style={{ marginTop: 16, marginBottom: 22 }}>
              <table>
                <thead>
                  <tr>
                    <th>Dock / Terminal / Harbor</th>
                    <th>Courtesy Pickup</th>
                    <th>Meeting Instructions</th>
                    <th>Added Transfer Buffer</th>
                  </tr>
                </thead>
                <tbody>
                  {operator.dockPickupRules.map((rule, idx) => (
                    <tr key={`${rule.placeId}-${idx}`}>
                      <td>
                        <strong>{rule.dockOrTerminalName}</strong>
                      </td>
                      <td>
                        <span
                          className={`badge ${
                            rule.pickupProvided ? "badge-safety" : "badge-warning"
                          }`}
                        >
                          {rule.pickupProvided
                            ? "Pickup Provided"
                            : "Walk / Port Shuttle"}
                        </span>
                      </td>
                      <td>{rule.meetingPointInstructions}</td>
                      <td>+{rule.addedBufferMinutesEachWay} mins each way</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="lfse-two-col">
            <div className="card">
              <h3 style={{ fontSize: 17, marginTop: 0 }}>
                Accessibility &amp; Mobility Notes
              </h3>
              <p style={{ margin: 0, fontSize: 14, color: "var(--ink)" }}>
                {operator.accessibilityAndMobilityNotes}
              </p>
            </div>

            <div className="card">
              <h3 style={{ fontSize: 17, marginTop: 0 }}>
                Weight, Age &amp; Capacity Policies
              </h3>
              <p style={{ margin: 0, fontSize: 14, color: "var(--ink)" }}>
                {operator.weightAndAgePolicies}
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
        </div>
      </section>

      {/* 5. Entity-Separated Reviews, Calm Operator Claim Panel & "Sources and freshness" Disclosure */}
      <section className="section">
        <div className="shell" style={{ display: "grid", gap: 22 }}>
          <OperatorEntityReviewsTabs
            operatorName={operator.name}
            operatorSlug={operator.slug}
            operatorReviews={operator.operatorReviews}
            tourReviewBundles={verifiedTours.map((t) => ({
              tourSlug: t.tourSlug,
              tourTitle: t.title,
              reviews: t.tourReviews,
            }))}
          />

          <OperatorProfileClaimPanel
            operatorId={operator.operatorId}
            operatorSlug={operator.slug}
            operatorName={operator.name}
            officialEmailDomain={operator.officialEmailDomain}
            officialPhone={operator.officialPhone}
            bookingPlatform={operator.bookingPlatform}
            claimStatus={operator.claimStatus}
          />

          <details
            className="lfse-sources-details"
            data-testid="operator-sources-and-freshness"
          >
            <summary>Sources and freshness</summary>
            <div className="lfse-sources-body">
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
                <strong style={{ color: "var(--deep)" }}>
                  Primary Sources &amp; Integration Record
                </strong>
                {operator.verifiedAt ? (
                  <span className="chip" data-testid="operator-last-verified">
                    Last verified: {operator.verifiedAt}
                  </span>
                ) : (
                  <span className="chip">Verification pending</span>
                )}
              </div>

              <div
                className="card"
                style={{ background: "#ffffff", padding: "14px 16px" }}
                data-testid="operator-integration-status-card"
              >
                <strong
                  style={{
                    fontSize: 12,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    color: "var(--muted)",
                  }}
                >
                  Reservation &amp; Feed Connection Status
                </strong>
                <ul
                  style={{
                    margin: "8px 0 0",
                    paddingLeft: 18,
                    fontSize: 13.5,
                    color: "var(--ink)",
                    display: "grid",
                    gap: 4,
                  }}
                >
                  <li>
                    <strong>Reservation System:</strong> {operator.bookingPlatform}
                  </li>
                  <li>
                    <strong>Live Availability Feed:</strong>{" "}
                    {verifiedLiveAvail
                      ? "Connected (Authorized Rezgo Live Feed)"
                      : "Not connected (static source-backed schedule summary)"}
                  </li>
                  <li>
                    <strong>Direct Checkout:</strong>{" "}
                    {verifiedDirectCheckout
                      ? `Connected (Direct checkout hosted by ${operator.name}; operator is merchant of record)`
                      : "Not connected (bookings completed on official operator website or listed booking partner)"}
                  </li>
                </ul>
              </div>

              {operator.sources.length > 0 ? (
                <ul style={{ margin: 0, paddingLeft: 20, display: "grid", gap: 6 }}>
                  {operator.sources.map((src) => (
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
                  Primary sources pending verification before search indexing is enabled.
                </p>
              )}

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
      </section>
    </main>
  );
}
