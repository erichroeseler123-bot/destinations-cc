import type { Metadata } from "next";
import Link from "next/link";
import { TrustDisclosure } from "@/components/TrustDisclosure";
import { getSoutheastAlaskaDirectorySnapshot } from "../../../../lib/dcc/shared/southeastAlaskaDirectoryOperatorsAndTours";

const SITE = "https://www.lastfrontiershoreexcursions.com";

export const metadata: Metadata = {
  title: "Southeast Alaska Cruise Ports, Communities & Scenic Cruising Directory",
  description:
    "Compare Southeast Alaska cruise ports, communities, terminals, harbors, and Glacier Bay scenic cruising—with separate pages for Hoonah vs. Icy Strait Point and Gustavus vs. Glacier Bay.",
  alternates: { canonical: `${SITE}/ports` },
  openGraph: {
    title: "Southeast Alaska Ports & Communities | Last Frontier Shore Excursions",
    description:
      "Verified dock logistics, independent local operators, 2-hour return buffers, and scenic non-disembarkation guidance across Southeast Alaska.",
    url: `${SITE}/ports`,
    siteName: "Last Frontier Shore Excursions",
    type: "website",
  },
};

const PLACE_TYPE_BADGES: Record<string, string> = {
  community: "Community & Harbor",
  cruise_terminal: "Cruise Terminal Destination",
  harbor: "Small-Boat Harbor",
  national_park: "National Park",
  scenic_cruise_destination: "Scenic Cruising (No Ship Disembarkation)",
};

export default function PortsDirectoryPage() {
  const snapshot = getSoutheastAlaskaDirectorySnapshot();
  const verifiedPlaces = snapshot.places.filter((p) => p.gate.indexable);
  const heldPlaces = snapshot.places.filter(
    (p) => p.place.hasPublicDirectoryPage && !p.gate.indexable,
  );

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": `${SITE}/ports#webpage`,
        url: `${SITE}/ports`,
        name: "Southeast Alaska Cruise Ports, Communities & Scenic Cruising Directory",
        description:
          "Primary-source directory of Southeast Alaska cruise ports, communities, terminals, and scenic Glacier Bay cruising.",
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
            name: "Ports & Communities",
            item: `${SITE}/ports`,
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
            <span>Ports &amp; Communities</span>
          </nav>

          <p className="eyebrow" style={{ color: "#607078" }}>
            Southeast Alaska Knowledge Graph · {verifiedPlaces.length} Verified Destinations
          </p>
          <h1 style={{ marginTop: 6, marginBottom: 12 }}>
            Southeast Alaska Ports, Communities &amp; Scenic Waterways
          </h1>
          <p
            className="lead"
            style={{ color: "#485b63", maxWidth: 840, marginBottom: 20 }}
          >
            Every Southeast Alaska destination is modeled by its true operational role—distinguishing
            communities and municipal harbors from private cruise terminals and scenic
            non-disembarkation National Park waters—so you never confuse dockside boarding
            with shuttle or ferry transfers.
          </p>
          <div className="cta-row">
            <Link className="button" href="/operators">
              Browse Local Operators ({snapshot.counts.indexableOperatorProfiles})
            </Link>
            <Link className="button secondary" href="/southeast-alaska">
              Southeast Alaska Regional Hub
            </Link>
          </div>
          <TrustDisclosure compact />
        </div>
      </section>

      {/* Distinct Entity Relationship Callout */}
      <section
        className="section"
        style={{
          background: "#f8fbfb",
          borderBottom: "1px solid var(--line)",
          padding: "28px 0",
        }}
      >
        <div className="shell">
          <div
            className="grid"
            style={{ gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))" }}
          >
            <div className="card" style={{ background: "#ffffff" }}>
              <span className="badge badge-safety" style={{ alignSelf: "flex-start" }}>
                Separate Terminal vs. Community Guides
              </span>
              <h2 style={{ fontSize: 20, marginTop: 10, marginBottom: 8 }}>
                Icy Strait Point vs. Hoonah
              </h2>
              <p style={{ fontSize: 14.5, color: "var(--muted)", marginBottom: 12 }}>
                <Link href="/ports/icy-strait-point" style={{ fontWeight: 700, color: "var(--forest)" }}>
                  Icy Strait Point
                </Link>{" "}
                covers the Cannery Point cruise destination (Ocean &amp; Wilderness Landings,
                gondolas, ZipRider, and Excursion Hub).{" "}
                <Link href="/ports/hoonah" style={{ fontWeight: 700, color: "var(--forest)" }}>
                  Hoonah
                </Link>{" "}
                covers the Tlingit community of Xunaa ~1.5 miles southwest, Hoonah Boat Harbor,
                independent local whale captains, and the flat shoreline Sea Walk.
              </p>
            </div>

            <div className="card" style={{ background: "#ffffff" }}>
              <span className="badge badge-warning" style={{ alignSelf: "flex-start" }}>
                Gateway Community vs. Scenic Cruising
              </span>
              <h2 style={{ fontSize: 20, marginTop: 10, marginBottom: 8 }}>
                Gustavus vs. Glacier Bay National Park
              </h2>
              <p style={{ fontSize: 14.5, color: "var(--muted)", marginBottom: 12 }}>
                <Link href="/ports/glacier-bay" style={{ fontWeight: 700, color: "var(--forest)" }}>
                  Glacier Bay
                </Link>{" "}
                is a scenic-cruising National Park waterway where{" "}
                <strong>large cruise ships never dock or disembark passengers</strong>.{" "}
                <Link href="/ports/gustavus" style={{ fontWeight: 700, color: "var(--forest)" }}>
                  Gustavus
                </Link>{" "}
                covers the gateway town, GST airport, AMHS ferry dock, Bartlett Cove road
                access, and locally based day-boat operators.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 12 Verified Destinations */}
      <section className="section" style={{ background: "#ffffff" }}>
        <div className="shell">
          <h2>Verified Ports, Communities &amp; Scenic Destinations</h2>
          <p className="lead" style={{ color: "var(--muted)", marginBottom: 24 }}>
            Each verified destination includes dock/tender accuracy, cruise pickup rules,
            local operators, 2-hour buffer timing checks, and official local sources:
          </p>

          <div className="grid">
            {verifiedPlaces.map(({ place }) => {
              const slug = place.publicPortSlug!;
              const localOps = snapshot.operators.filter(
                (o) => o.gate.indexable && o.operator.publicPortSlugs.includes(slug),
              );
              const localTours = snapshot.tours.filter(
                (t) => t.portSlug === slug && !t.isCommerciallyHeld,
              );
              return (
                <Link
                  key={place.placeId}
                  href={`/ports/${slug}`}
                  className="card"
                  style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}
                >
                  <div>
                    <div
                      style={{
                        borderRadius: 12,
                        overflow: "hidden",
                        aspectRatio: "16 / 10",
                        marginBottom: 14,
                        background: "#eef5f6",
                      }}
                    >
                      <img
                        src={place.heroImage}
                        alt={place.heroImageAlt}
                        width={640}
                        height={400}
                        loading="lazy"
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          display: "block",
                        }}
                      />
                    </div>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
                      <span
                        className={`badge ${
                          place.placeType === "scenic_cruise_destination"
                            ? "badge-warning"
                            : "badge-safety"
                        }`}
                      >
                        {PLACE_TYPE_BADGES[place.placeType] || place.placeType}
                      </span>
                      <span className="chip">{place.subRegionLabel}</span>
                    </div>
                    <h3 style={{ marginTop: 4, marginBottom: 8 }}>{place.name}</h3>
                    <p style={{ fontSize: 14, color: "var(--muted)" }}>{place.hook}</p>
                  </div>

                  <div style={{ marginTop: 14, paddingTop: 12, borderTop: "1px solid var(--line)" }}>
                    <div className="chips">
                      <span className="chip">{localOps.length} verified operators</span>
                      <span className="chip">{localTours.length} verified tours</span>
                      <span className="chip">Verified {place.verifiedAt}</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Smaller Communities Held Unindexed */}
      {heldPlaces.length > 0 && (
        <section
          className="section"
          style={{ background: "#f8fbfb", borderTop: "1px solid var(--line)" }}
        >
          <div className="shell">
            <span className="badge badge-warning">Held Unindexed · Research Queue</span>
            <h2 style={{ marginTop: 8 }}>
              Smaller Southeast Alaska Communities (Unindexed Until Verified)
            </h2>
            <p style={{ color: "var(--muted)", maxWidth: 800 }}>
              Smaller Inside Passage and outer-island communities are modeled in our regional
              graph for geographic context, but remain excluded from search indexing and XML
              sitemaps (`noindex, follow`) until dock transfers and independent local operator
              schedules are primary-source verified:
            </p>
            <div
              className="grid"
              style={{
                marginTop: 18,
                gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              }}
            >
              {heldPlaces.map(({ place }) => (
                <div
                  key={place.placeId}
                  className="card"
                  style={{ background: "#ffffff", borderStyle: "dashed" }}
                >
                  <strong style={{ color: "var(--deep)" }}>{place.name}</strong>
                  <p style={{ fontSize: 13.5, color: "var(--muted)", margin: "6px 0 10px" }}>
                    {place.hook}
                  </p>
                  <span style={{ fontSize: 12.5, fontWeight: 600, color: "#7a4500" }}>
                    Held unindexed pending dock &amp; local operator verification
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
