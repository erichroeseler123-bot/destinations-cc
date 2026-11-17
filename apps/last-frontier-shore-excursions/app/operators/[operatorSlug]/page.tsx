import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { buildDccHandoffAffiliateUrl } from "@/lib/affiliate/links";
import { TrustDisclosure } from "@/components/TrustDisclosure";
import { OperatorProfileClaimPanel } from "@/components/OperatorProfileClaimPanel";
import { OperatorEntityReviewsTabs } from "@/components/OperatorEntityReviewsTabs";
import {
  isOperatorDirectCheckoutConnected,
  isOperatorLiveAvailabilityConnected,
} from "../../../../../lib/dcc/shared/southeastAlaskaDirectoryContract";
import { SOUTHEAST_ALASKA_OPERATORS } from "../../../../../lib/dcc/shared/southeastAlaskaDirectoryOperatorsAndTours";
import {
  findSoutheastAlaskaOperatorBySlugOrAlias,
  getSoutheastAlaskaDirectorySnapshot,
} from "../../../../../lib/dcc/shared/southeastAlaskaDirectoryOperatorsAndTours";

const SITE = "https://www.lastfrontiershoreexcursions.com";

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
    alternates: { canonical: `${SITE}/operators/${operator.slug}` },
    robots: {
      index: gate.indexable,
      follow: true,
    },
    openGraph: {
      title: `${operator.name} | Last Frontier Shore Excursions`,
      description,
      url: `${SITE}/operators/${operator.slug}`,
      siteName: "Last Frontier Shore Excursions",
      type: "website",
      images: [
        {
          url: `${SITE}${operator.heroImage}`,
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

  // Redirect legacy FareHarbor shortname alias to canonical /operators/[slug]
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
  const isJuneauAviation =
    operator.publicPortSlugs.includes("juneau") &&
    operator.categorySlugs.includes("helicopter-glacier-tours");

  // JSON-LD: Truthful Organization + BreadcrumbList (NO automatic Offer, Review, or AggregateRating!)
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${SITE}/operators/${operator.slug}#webpage`,
        url: `${SITE}/operators/${operator.slug}`,
        name: `${operator.name} — Southeast Alaska Operator Profile`,
        description: operator.tagline,
        isPartOf: { "@id": `${SITE}/#website` },
        ...(operator.verifiedAt ? { dateModified: operator.lastModifiedAt } : {}),
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
            name: "Local Operators",
            item: `${SITE}/operators`,
          },
          {
            "@type": "ListItem",
            position: 4,
            name: operator.name,
            item: `${SITE}/operators/${operator.slug}`,
          },
        ],
      },
      {
        "@type": "LocalBusiness",
        "@id": `${SITE}/operators/${operator.slug}#operator`,
        name: operator.name,
        description: operator.companyOverview,
        ...(operator.officialWebsite ? { sameAs: [operator.officialWebsite] } : {}),
        ...(operator.officialPhone ? { telephone: operator.officialPhone } : {}),
        areaServed: servedPlaces.map(({ place }) => ({
          "@type": "Place",
          name: `${place.name}, Alaska`,
        })),
      },
    ],
  };

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
              Operator Research Queue Record (Unindexed · noindex, follow):
            </strong>{" "}
            <span style={{ fontSize: 14, color: "#5c3b09" }}>
              {gate.holdDetails.join(" ")}
            </span>
          </div>
        </section>
      )}

      {/* 1. Operator Hero */}
      <section className="port-hero" style={{ padding: "40px 0 36px" }}>
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
                {operator.verifiedAt && (
                  <span className="chip" data-testid="operator-last-verified">
                    Last verified: {operator.verifiedAt}
                  </span>
                )}
              </div>

              <h1 style={{ marginTop: 4, marginBottom: 10 }}>{operator.name}</h1>
              <p className="lead" style={{ color: "#485b63", marginBottom: 14 }}>
                {operator.tagline}
              </p>
              <p style={{ fontSize: 15, color: "var(--muted)", marginBottom: 20 }}>
                {operator.companyOverview}
              </p>

              <div className="cta-row">
                {tours.length > 0 && (
                  <a className="button" href="#operator-tours">
                    View {operator.name} Tours ({tours.length}) ↓
                  </a>
                )}
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
                <a className="button secondary" href="#claim-operator-profile">
                  Claim Free Profile
                </a>
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
                src={operator.heroImage}
                alt={operator.heroImageAlt}
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
                {operator.heroImageCredit}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Separate-Entity Governance Note (e.g., Alaska Travel Adventures vs. Gastineau Guiding) */}
      {operator.separationGovernanceNote && (
        <section
          data-testid="operator-separation-note"
          style={{
            background: "#f4f9f9",
            borderBottom: "1px solid var(--line)",
            padding: "16px 0",
          }}
        >
          <div className="shell">
            <strong style={{ color: "var(--deep)" }}>Independent Entity Note:</strong>{" "}
            <span style={{ fontSize: 14.5, color: "var(--ink)" }}>
              {operator.separationGovernanceNote}
            </span>
          </div>
        </section>
      )}

      {/* 2. Communities Served, Categories & Connection Status */}
      <section
        className="section"
        style={{
          background: "#ffffff",
          borderBottom: "1px solid var(--line)",
          padding: "30px 0",
        }}
      >
        <div className="shell">
          <div
            className="grid"
            style={{ gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))" }}
          >
            <div className="card" style={{ background: "#f8fbfb" }}>
              <strong
                style={{
                  fontSize: 12.5,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  color: "var(--muted)",
                }}
              >
                Towns, Terminals &amp; Harbors Served
              </strong>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
                {servedPlaces.map(({ place }) =>
                  place.publicPortSlug ? (
                    <Link
                      key={place.placeId}
                      href={`/ports/${place.publicPortSlug}`}
                      className="button small secondary"
                    >
                      {place.name} ({place.placeType.replace(/_/g, " ")})
                    </Link>
                  ) : (
                    <span key={place.placeId} className="chip">
                      {place.name}
                    </span>
                  ),
                )}
              </div>
            </div>

            <div className="card" style={{ background: "#f8fbfb" }}>
              <strong
                style={{
                  fontSize: 12.5,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  color: "var(--muted)",
                }}
              >
                Excursion Categories
              </strong>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
                {operator.categorySlugs.map((catSlug) => {
                  const cat = categoryMap.get(catSlug);
                  const primaryPort = operator.publicPortSlugs[0];
                  return primaryPort ? (
                    <Link
                      key={catSlug}
                      href={`/ports/${primaryPort}/${catSlug}`}
                      className="chip"
                      style={{ fontWeight: 700, color: "var(--forest)" }}
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
            </div>

            <div
              className="card"
              style={{ background: "#f8fbfb" }}
              data-testid="operator-integration-status-card"
            >
              <strong
                style={{
                  fontSize: 12.5,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  color: "var(--muted)",
                }}
              >
                Contact, Platform &amp; Integration Status
              </strong>
              <ul
                style={{
                  margin: "10px 0 0",
                  paddingLeft: 18,
                  fontSize: 13.5,
                  display: "grid",
                  gap: 5,
                }}
              >
                {operator.officialPhone && (
                  <li>
                    <strong>Phone:</strong> {operator.officialPhone}
                  </li>
                )}
                <li>
                  <strong>Reservation Platform:</strong> {operator.bookingPlatform}
                </li>
                <li>
                  <strong>Live Availability API:</strong>{" "}
                  {liveAvailConnected
                    ? "Connected (Owner Approved)"
                    : "Not yet connected"}
                </li>
                <li>
                  <strong>Direct Facilitator Checkout:</strong>{" "}
                  {directCheckoutConnected
                    ? "Connected (10% Facilitator Active)"
                    : "Not connected (Official Site / Partner Reference)"}
                </li>
              </ul>
            </div>
          </div>

          {isJuneauAviation && (
            <div
              className="card"
              style={{
                marginTop: 18,
                background: "#eef6fb",
                border: "1px solid #bcd8ec",
              }}
            >
              <span className="badge badge-safety" style={{ alignSelf: "flex-start" }}>
                Juneau Aviation Weather &amp; Ceiling Resource
              </span>
              <p style={{ margin: "6px 0 0", fontSize: 14, color: "var(--ink)" }}>
                Planning a Juneau glacier flight with {operator.name}? Check{" "}
                <a
                  href="https://juneauflightdeck.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ fontWeight: 700, color: "var(--forest)" }}
                >
                  Juneau Flight Deck (juneauflightdeck.com) ↗
                </a>{" "}
                for cloud-ceiling guidance, morning vs. afternoon visibility tips, and
                specialist flight-desk coordination.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* 3. Tour Lineup */}
      <section
        className="section"
        id="operator-tours"
        style={{ background: "#f8fbfb", borderBottom: "1px solid var(--line)" }}
      >
        <div className="shell">
          <h2>{operator.name} Excursion Lineup</h2>
          {tours.length === 0 ? (
            <div className="card" style={{ background: "#ffffff", marginTop: 16 }}>
              <p style={{ margin: 0, fontSize: 14.5, color: "var(--muted)" }}>
                Individual excursion records for {operator.name} are currently held in
                our verification queue until standalone departure times and pier pickup
                rules are primary-source confirmed.
              </p>
            </div>
          ) : (
            <div className="grid" style={{ marginTop: 18 }}>
              {tours.map((tour) => {
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
                      background: "#ffffff",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                    }}
                  >
                    <div>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
                        <span className="badge badge-safety">{tour.durationLabel}</span>
                        <span className="chip">{tour.priceDisplayLabel}</span>
                        <Link href={`/ports/${tour.portSlug}`} className="chip">
                          Port: {tour.portSlug}
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
                        {tour.typicalDepartureTimes.join(", ")}
                      </p>
                      <p style={{ fontSize: 13, color: "var(--ink)", margin: 0 }}>
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
                        href={`/tours/${operator.slug}/${tour.tourSlug}`}
                      >
                        Full Tour &amp; Buffer Page
                      </Link>
                      {!tour.isCommerciallyHeld ? (
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
                            : "Official Tour Page ↗"}
                        </a>
                      ) : (
                        <span className="badge badge-warning">
                          Checkout Held Pending Verification
                        </span>
                      )}
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
        style={{ background: "#ffffff", borderBottom: "1px solid var(--line)" }}
      >
        <div className="shell">
          <h2>Cruise Pickup Rules, Mobility &amp; Passenger Policies</h2>
          <p style={{ color: "var(--ink)", maxWidth: 850 }}>
            {operator.cruiseLogisticsSummary}
          </p>

          {operator.dockPickupRules.length > 0 && (
            <div className="table-wrap" style={{ marginTop: 16, marginBottom: 24 }}>
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
                            : "Independent Walk / Port Shuttle"}
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

          <div
            className="grid"
            style={{ gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))" }}
          >
            <div className="card" style={{ background: "#f8fbfb" }}>
              <h3 style={{ fontSize: 17, marginTop: 0 }}>
                Accessibility &amp; Mobility Notes
              </h3>
              <p style={{ margin: 0, fontSize: 14, color: "var(--ink)" }}>
                {operator.accessibilityAndMobilityNotes}
              </p>
            </div>

            <div className="card" style={{ background: "#f8fbfb" }}>
              <h3 style={{ fontSize: 17, marginTop: 0 }}>
                Weight, Age &amp; Capacity Policies
              </h3>
              <p style={{ margin: 0, fontSize: 14, color: "var(--ink)" }}>
                {operator.weightAndAgePolicies}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Entity-Separated Reviews + Primary Sources + Free Operator Claim Panel */}
      <section className="section" style={{ background: "#f8fbfb" }}>
        <div className="shell" style={{ display: "grid", gap: 24 }}>
          <OperatorEntityReviewsTabs
            operatorName={operator.name}
            operatorSlug={operator.slug}
            operatorReviews={operator.operatorReviews}
            tourReviewBundles={tours.map((t) => ({
              tourSlug: t.tourSlug,
              tourTitle: t.title,
              reviews: t.tourReviews,
            }))}
          />

          <div className="card" style={{ background: "#ffffff" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
                flexWrap: "wrap",
                gap: 10,
                marginBottom: 10,
              }}
            >
              <h3 style={{ margin: 0 }}>Primary Sources &amp; Verification Record</h3>
              <span style={{ fontSize: 13, fontWeight: 700, color: "var(--forest)" }}>
                {operator.verifiedAt
                  ? `Last verified: ${operator.verifiedAt}`
                  : "Held in Research Queue"}
              </span>
            </div>
            {operator.sources.length > 0 ? (
              <ul style={{ margin: 0, paddingLeft: 20, display: "grid", gap: 6 }}>
                {operator.sources.map((src) => (
                  <li key={src.url} style={{ fontSize: 14 }}>
                    <a
                      href={src.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ fontWeight: 700, color: "var(--forest)" }}
                    >
                      {src.label} ↗
                    </a>{" "}
                    <span style={{ fontSize: 12.5, color: "var(--muted)" }}>
                      ({src.sourceKind.replace(/_/g, " ")} · checked {src.checkedAt})
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p style={{ margin: 0, fontSize: 14, color: "var(--muted)" }}>
                Primary sources pending verification before search indexing is enabled.
              </p>
            )}
          </div>

          <OperatorProfileClaimPanel
            operatorId={operator.operatorId}
            operatorSlug={operator.slug}
            operatorName={operator.name}
            officialEmailDomain={operator.officialEmailDomain}
            officialPhone={operator.officialPhone}
            bookingPlatform={operator.bookingPlatform}
            claimStatus={operator.claimStatus}
          />
        </div>
      </section>
    </main>
  );
}
