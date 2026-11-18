import type { Metadata } from "next";
import Link from "next/link";
import { TrustDisclosure } from "@/components/TrustDisclosure";
import {
  LfsePortsDirectoryClient,
  type LfsePortDirectoryCardItem,
} from "@/components/LfsePortsDirectoryClient";
import {
  classifyDestinationType,
  resolveDestinationHeroMedia,
  STANDARDIZED_TWO_HOUR_PLANNING_NOTE,
} from "@/lib/directoryDisplay";
import {
  buildPortsDirectoryJsonLd,
  DCC_ALASKA_DIRECTORY_API_URL,
  LFSE_SITE_URL,
} from "@/lib/structuredData";
import { getSoutheastAlaskaDirectorySnapshot } from "../../../../lib/dcc/shared/southeastAlaskaDirectoryOperatorsAndTours";

export const metadata: Metadata = {
  title: "Southeast Alaska Cruise Ports, Communities & Scenic Cruising Guide",
  description:
    "Explore 12 verified Southeast Alaska cruise ports, communities, terminals, and Glacier Bay scenic cruising—with separate guides for Icy Strait Point vs. Hoonah and Glacier Bay vs. Gustavus.",
  alternates: { canonical: `${LFSE_SITE_URL}/ports` },
  openGraph: {
    title: "Southeast Alaska Ports & Communities | Last Frontier Shore Excursions",
    description:
      "Verified dock logistics, local excursion operators, two-hour return planning margins, and scenic non-disembarkation guidance across Southeast Alaska.",
    url: `${LFSE_SITE_URL}/ports`,
    siteName: "Last Frontier Shore Excursions",
    type: "website",
  },
};

export default function PortsDirectoryPage() {
  const snapshot = getSoutheastAlaskaDirectorySnapshot();
  const verifiedPlaces = snapshot.places.filter(
    (p) => p.gate.indexable && p.place.publicPortSlug,
  );
  const indexableOperatorIds = new Set(
    snapshot.operators
      .filter((o) => o.gate.indexable)
      .map((o) => o.operator.operatorId),
  );

  const cardItems: LfsePortDirectoryCardItem[] = verifiedPlaces.map(({ place }) => {
    const slug = place.publicPortSlug!;
    const typeInfo = classifyDestinationType(place);
    const media = resolveDestinationHeroMedia(place);
    const operatorsCount = snapshot.operators.filter(
      (o) => o.gate.indexable && o.operator.publicPortSlugs.includes(slug),
    ).length;
    const toursCount = snapshot.tours.filter(
      (t) =>
        t.portSlug === slug &&
        !t.isCommerciallyHeld &&
        indexableOperatorIds.has(t.operatorId),
    ).length;

    return {
      placeId: place.placeId,
      slug,
      name: place.name,
      subRegionLabel: place.subRegionLabel,
      destinationTypeKey: typeInfo.key,
      destinationTypeLabel: typeInfo.label,
      heroImage: media.heroImage,
      heroImageAlt: media.heroImageAlt,
      heroImageCredit: media.heroImageCredit,
      hook: place.hook,
      typicalPortHours: place.typicalPortHours,
      facilitiesCount: place.docksAndAccessPoints.length,
      operatorsCount,
      toursCount,
      isScenicNonDisembarkation: place.placeType === "scenic_cruise_destination",
    };
  });

  const jsonLd = buildPortsDirectoryJsonLd();

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <section className="port-hero">
        <div className="shell">
          <nav className="breadcrumbs" aria-label="Breadcrumbs">
            <Link href="/">Home</Link>
            <span>›</span>
            <Link href="/southeast-alaska">Southeast Alaska</Link>
            <span>›</span>
            <span>Ports &amp; Communities</span>
          </nav>

          <p className="eyebrow" style={{ color: "var(--muted)" }}>
            Southeast Alaska Port &amp; Community Guide · {cardItems.length} Verified
            Destinations
          </p>
          <h1>Southeast Alaska Ports, Communities &amp; Scenic Waterways</h1>
          <p
            className="lead"
            style={{ color: "#42555d", maxWidth: 840, marginBottom: 20 }}
          >
            Each Southeast Alaska stop is organized by how travelers actually arrive—separating
            walkable cruise port towns and private cruise terminals from neighboring
            harbor communities, fly-in gateway towns, and onboard National Park scenic
            cruising.
          </p>
          <div className="cta-row">
            <Link className="button" href="/operators">
              Browse Local Operators ({snapshot.counts.indexableOperatorProfiles})
            </Link>
            <Link className="button secondary" href="/southeast-alaska">
              Southeast Alaska Overview
            </Link>
          </div>
          <TrustDisclosure compact />
        </div>
      </section>

      {/* Human-Language Terminal & Scenic Cruising Disambiguation */}
      <section
        className="section"
        style={{
          background: "#ffffff",
          borderBottom: "1px solid var(--line)",
          padding: "28px 0",
        }}
      >
        <div className="shell">
          <div className="lfse-two-col">
            <div className="card">
              <span className="badge badge-safety" style={{ alignSelf: "flex-start" }}>
                Cruise Terminal vs. Neighboring Harbor Town
              </span>
              <h2 style={{ fontSize: 20, marginTop: 10, marginBottom: 8 }}>
                Icy Strait Point vs. Hoonah
              </h2>
              <p style={{ marginBottom: 0 }}>
                <Link
                  href="/ports/icy-strait-point"
                  style={{ fontWeight: 700, color: "var(--forest)", textDecoration: "underline" }}
                >
                  Icy Strait Point
                </Link>{" "}
                covers the Cannery Point cruise terminal (Ocean &amp; Wilderness Landings,
                gondolas, ZipRider, and Excursion Hub).{" "}
                <Link
                  href="/ports/hoonah"
                  style={{ fontWeight: 700, color: "var(--forest)", textDecoration: "underline" }}
                >
                  Hoonah
                </Link>{" "}
                covers the Tlingit community of Xunaa 1.5 miles southwest, Hoonah Boat
                Harbor, independent local whale captains, and the flat shoreline Sea Walk.
              </p>
            </div>

            <div className="card" style={{ background: "#fffaf3", borderColor: "var(--safety-border)" }}>
              <span className="badge badge-warning" style={{ alignSelf: "flex-start" }}>
                Scenic Cruising vs. Gateway Community
              </span>
              <h2 style={{ fontSize: 20, marginTop: 10, marginBottom: 8 }}>
                Glacier Bay Scenic Cruising vs. Gustavus
              </h2>
              <p style={{ marginBottom: 0 }}>
                <Link
                  href="/ports/glacier-bay"
                  style={{ fontWeight: 700, color: "var(--forest)", textDecoration: "underline" }}
                >
                  Glacier Bay National Park
                </Link>{" "}
                is an onboard scenic-cruising waterway where{" "}
                <strong>large cruise ships never dock or disembark passengers</strong>.{" "}
                <Link
                  href="/ports/gustavus"
                  style={{ fontWeight: 700, color: "var(--forest)", textDecoration: "underline" }}
                >
                  Gustavus
                </Link>{" "}
                covers the independent gateway town, airport, state ferry dock, and
                Bartlett Cove day-boat access.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Searchable & Filterable 12 Verified Destinations */}
      <section className="section">
        <div className="shell">
          <h2>All 12 Verified Southeast Alaska Destinations</h2>
          <p className="lead" style={{ color: "var(--muted)", marginBottom: 22 }}>
            Filter by destination type or search by town, island, or waterway. Every
            destination guide includes dock and shuttle notes, local operators, and
            two-hour return planning checks:
          </p>

          <LfsePortsDirectoryClient items={cardItems} />

          <div className="lfse-return-standard-box" style={{ marginTop: 28 }}>
            <strong>2-Hour Return Planning Standard:</strong>
            <p>
              {STANDARDIZED_TWO_HOUR_PLANNING_NOTE} This is an independent planning
              standard—not an operator guarantee or cruise-line rule. Always check your
              operator&apos;s meeting deadline, cancellation cutoff, and your ship&apos;s
              published all-aboard time separately.
            </p>
          </div>

          <div style={{ marginTop: 22 }}>
            <details className="lfse-sources-details" data-testid="ports-sources-and-freshness">
              <summary>Sources and freshness</summary>
              <div className="lfse-sources-body">
                <p style={{ margin: 0 }}>
                  <strong>Last verified:</strong> 2026-11-17 across municipal port and
                  harbor directories, official community visitor bureaus, Huna Totem and
                  Klawock-Heenya port guides, and National Park Service Glacier Bay cruise
                  regulations.
                </p>
                <p style={{ margin: 0 }}>
                  <strong>Directory data feed:</strong>{" "}
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
