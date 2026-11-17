import type { Metadata } from "next";
import Link from "next/link";
import { TrustDisclosure } from "@/components/TrustDisclosure";
import { UNCLAIMED_OPERATOR_PROFILE_NOTICE } from "../../../../lib/dcc/shared/southeastAlaskaDirectoryContract";
import { getSoutheastAlaskaDirectorySnapshot } from "../../../../lib/dcc/shared/southeastAlaskaDirectoryOperatorsAndTours";

const SITE = "https://www.lastfrontiershoreexcursions.com";

export const metadata: Metadata = {
  title: "Southeast Alaska Shore Excursion Operators Directory | Local Companies",
  description:
    "Permanent source-backed directory of verified Southeast Alaska shore excursion operators across Juneau, Hoonah, Icy Strait Point, Ketchikan, Skagway, Sitka, Haines, Wrangell, Petersburg, Klawock, and Gustavus.",
  alternates: { canonical: `${SITE}/operators` },
  openGraph: {
    title: "Southeast Alaska Local Excursion Operators | Last Frontier Shore Excursions",
    description:
      "Compare verified Alaska whale captains, flightseeing companies, glacier guides, and Native-owned operators—with dock pickup rules, policies, and $0 free operator profile claims.",
    url: `${SITE}/operators`,
    siteName: "Last Frontier Shore Excursions",
    type: "website",
  },
};

export default function OperatorsDirectoryPage() {
  const snapshot = getSoutheastAlaskaDirectorySnapshot();
  const verifiedOperators = snapshot.operators.filter((o) => o.gate.indexable);
  const heldOperators = snapshot.operators.filter((o) => !o.gate.indexable);

  const placeNameBySlug = new Map<string, string>();
  for (const { place } of snapshot.places) {
    if (place.publicPortSlug) {
      placeNameBySlug.set(place.publicPortSlug, place.name);
    }
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": `${SITE}/operators#webpage`,
        url: `${SITE}/operators`,
        name: "Southeast Alaska Shore Excursion Operators Directory",
        description:
          "Primary-source verified company profiles for Southeast Alaska excursion operators.",
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
            name: "Local Operators",
            item: `${SITE}/operators`,
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

      <section className="port-hero" style={{ padding: "44px 0 36px" }}>
        <div className="shell">
          <nav className="breadcrumbs" aria-label="Breadcrumbs">
            <Link href="/">Home</Link>
            <span>›</span>
            <Link href="/southeast-alaska">Southeast Alaska</Link>
            <span>›</span>
            <span>Local Operators</span>
          </nav>

          <p className="eyebrow" style={{ color: "#607078" }}>
            Canonical Company Profiles · {verifiedOperators.length} Verified Operators
          </p>
          <h1 style={{ marginTop: 6, marginBottom: 12 }}>
            Southeast Alaska Shore Excursion Operators Directory
          </h1>
          <p
            className="lead"
            style={{ color: "#485b63", maxWidth: 850, marginBottom: 18 }}
          >
            Every verified Southeast Alaska excursion company receives a permanent{" "}
            <strong>$0 profile</strong> documenting its operating communities, vessel or
            aircraft specs, dock-by-dock pickup rules, mobility and weight policies, and
            primary sources—whether or not the operator has connected live inventory.
          </p>
          <div className="cta-row">
            <Link className="button" href="/ports">
              Explore Ports &amp; Communities ({snapshot.counts.indexablePublicPlacePages})
            </Link>
            <Link className="button secondary" href="/southeast-alaska">
              Southeast Alaska Regional Hub
            </Link>
          </div>
          <TrustDisclosure compact />
        </div>
      </section>

      {/* Governance & Free Claim Summary */}
      <section
        className="section"
        style={{
          background: "#f8fbfb",
          borderBottom: "1px solid var(--line)",
          padding: "26px 0",
        }}
      >
        <div className="shell">
          <div
            className="grid"
            style={{ gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))" }}
          >
            <div className="card" style={{ background: "#ffffff" }}>
              <span className="badge badge-safety" style={{ alignSelf: "flex-start" }}>
                $0 Permanent Operator Listing
              </span>
              <h2 style={{ fontSize: 18, marginTop: 8, marginBottom: 6 }}>
                Unclaimed vs. Verified Operator Profiles
              </h2>
              <p style={{ margin: 0, fontSize: 14, color: "var(--muted)" }}>
                Unclaimed pages clearly display:{" "}
                <em>&ldquo;{UNCLAIMED_OPERATOR_PROFILE_NOTICE}&rdquo;</em> Operators can
                claim their page at no cost using an official company-domain email, listed
                business phone, or manual owner review.
              </p>
            </div>

            <div className="card" style={{ background: "#ffffff" }}>
              <span className="badge badge-safety" style={{ alignSelf: "flex-start" }}>
                Juneau Aviation Specialist Desk
              </span>
              <h2 style={{ fontSize: 18, marginTop: 8, marginBottom: 6 }}>
                Juneau Flight Deck Boundary
              </h2>
              <p style={{ margin: 0, fontSize: 14, color: "var(--muted)" }}>
                Last Frontier Shore Excursions hosts canonical company profiles for{" "}
                <Link href="/operators/coastal-helicopters">Coastal Helicopters</Link>,{" "}
                <Link href="/operators/northstar-trekking">NorthStar Trekking</Link>,{" "}
                <Link href="/operators/temsco-helicopters">TEMSCO</Link>, and{" "}
                <Link href="/operators/wings-airways">Wings Airways</Link>, while{" "}
                <a
                  href="https://juneauflightdeck.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ fontWeight: 700, color: "var(--forest)" }}
                >
                  Juneau Flight Deck ↗
                </a>{" "}
                provides flight-ceiling weather guidance and concierge handoffs.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Verified Operators Grid */}
      <section className="section" style={{ background: "#ffffff" }}>
        <div className="shell">
          <h2>Verified Southeast Alaska Excursion Companies ({verifiedOperators.length})</h2>
          <p className="lead" style={{ color: "var(--muted)", marginBottom: 22 }}>
            Each company below has passed our 6-point publication gate (verified legal
            identity, official website/phone, operating communities, verified tours,
            original cruise-logistics summary, and primary-source verification date):
          </p>

          <div className="grid">
            {verifiedOperators.map(({ operator, tours }) => {
              const activeTours = tours.filter((t) => !t.isCommerciallyHeld);
              return (
                <div
                  key={operator.operatorId}
                  className="card"
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                  }}
                >
                  <div>
                    <div
                      style={{
                        borderRadius: 12,
                        overflow: "hidden",
                        aspectRatio: "16 / 9",
                        marginBottom: 12,
                        background: "#eef5f6",
                        position: "relative",
                      }}
                    >
                      <img
                        src={operator.heroImage}
                        alt={operator.heroImageAlt}
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
                          background: "rgba(14,26,31,0.75)",
                          color: "#fff",
                          fontSize: 10.5,
                          padding: "2px 6px",
                          borderRadius: 4,
                        }}
                      >
                        {operator.heroImageCredit}
                      </span>
                    </div>

                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
                      {operator.publicPortSlugs.map((portSlug) => (
                        <Link
                          key={portSlug}
                          href={`/ports/${portSlug}`}
                          className="chip"
                          style={{ fontWeight: 700, color: "var(--forest)" }}
                        >
                          {placeNameBySlug.get(portSlug) || portSlug}
                        </Link>
                      ))}
                      <span className="chip">{operator.bookingPlatform}</span>
                    </div>

                    {operator.verifiedOwnershipBadges.length > 0 && (
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
                        {operator.verifiedOwnershipBadges.map((b) => (
                          <span key={b.tag} className="badge badge-safety">
                            {b.label}
                          </span>
                        ))}
                      </div>
                    )}

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
                      {activeTours.length} verified{" "}
                      {activeTours.length === 1 ? "tour" : "tours"} · Verified{" "}
                      {operator.verifiedAt}
                    </span>
                    <Link
                      href={`/operators/${operator.slug}`}
                      style={{ fontWeight: 700, fontSize: 13.5, color: "var(--forest)" }}
                    >
                      View Profile →
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Held Operator Research Queue */}
      {heldOperators.length > 0 && (
        <section
          className="section"
          style={{ background: "#f8fbfb", borderTop: "1px solid var(--line)" }}
        >
          <div className="shell">
            <span className="badge badge-warning">
              OperatorResearchQueue · Held Unindexed
            </span>
            <h2 style={{ marginTop: 8 }}>
              Operators Held Pending Primary-Source Verification ({heldOperators.length})
            </h2>
            <p style={{ color: "var(--muted)", maxWidth: 820 }}>
              Companies or reseller listings with incomplete direct schedules, unconfirmed
              shuttle buffers, or unresolved legal domains remain held in our research
              queue (`noindex, follow`) and excluded from XML sitemaps:
            </p>
            <div
              className="grid"
              style={{
                marginTop: 18,
                gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              }}
            >
              {heldOperators.map(({ operator, gate }) => (
                <div
                  key={operator.operatorId}
                  className="card"
                  style={{ background: "#ffffff", borderStyle: "dashed" }}
                >
                  <strong style={{ color: "var(--deep)" }}>{operator.name}</strong>
                  <p style={{ fontSize: 13.5, color: "var(--muted)", margin: "6px 0 8px" }}>
                    {gate.holdDetails[0] || operator.tagline}
                  </p>
                  <span style={{ fontSize: 12, color: "#7a4500", fontWeight: 600 }}>
                    Hold codes: {gate.holdReasonCodes.join(", ")}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
