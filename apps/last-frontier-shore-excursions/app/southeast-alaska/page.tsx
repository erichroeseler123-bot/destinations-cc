import type { Metadata } from "next";
import Link from "next/link";
import { TrustDisclosure } from "@/components/TrustDisclosure";
import { loadLfseJuneauNormalizedSupplierFeed } from "@/lib/dccJuneauSupplierFeed";
import { getSoutheastAlaskaDirectorySnapshot } from "../../../../lib/dcc/shared/southeastAlaskaDirectoryOperatorsAndTours";

const SITE = "https://www.lastfrontiershoreexcursions.com";

export const metadata: Metadata = {
  title:
    "Southeast Alaska Cruise Ports, Communities & Local Operators Directory",
  description:
    "Explore Southeast Alaska's cruise ports, Tlingit communities, terminals, scenic Glacier Bay cruising, excursion categories, and primary-source verified local operators.",
  alternates: { canonical: `${SITE}/southeast-alaska` },
  openGraph: {
    title: "Southeast Alaska Directory | Ports, Communities & Local Operators",
    description:
      "Compare Southeast Alaska cruise ports, separate terminal vs. community logistics (Hoonah vs. Icy Strait Point, Gustavus vs. Glacier Bay), and verified local excursion operators.",
    url: `${SITE}/southeast-alaska`,
    siteName: "Last Frontier Shore Excursions",
    type: "website",
  },
};

const PLACE_TYPE_LABELS: Record<string, string> = {
  community: "Community",
  cruise_terminal: "Cruise Terminal",
  harbor: "Harbor",
  national_park: "National Park",
  scenic_cruise_destination: "Scenic Cruise Waterway (No Disembarkation)",
};

export default async function SoutheastAlaskaHubPage() {
  const juneauFeed = await loadLfseJuneauNormalizedSupplierFeed({
    date: "2027-07-15",
    revalidateSeconds: 120,
  });
  const snapshot = getSoutheastAlaskaDirectorySnapshot(
    juneauFeed
      ? {
          juneauToursRezgo: {
            liveAvailabilityVerified:
              Boolean(juneauFeed.ok) && juneauFeed.source === "dcc_rezgo_readonly_xml",
            directCheckoutVerified: Boolean(juneauFeed.liveDirectRezgoCheckoutEnabled),
          },
        }
      : undefined,
  );

  const indexablePlaces = snapshot.places.filter((p) => p.gate.indexable);
  const heldPublicPlaces = snapshot.places.filter(
    (p) => p.place.hasPublicDirectoryPage && !p.gate.indexable,
  );
  const indexableOperators = snapshot.operators.filter((o) => o.gate.indexable);
  const heldOperators = snapshot.operators.filter((o) => !o.gate.indexable);
  const indexablePortCategories = snapshot.portCategories.filter(
    (pc) => pc.gate.indexable,
  );

  // Deduplicated upcoming ship visits across Southeast Alaska
  const shipVisits = indexablePlaces.flatMap(({ place }) =>
    place.visitingShips.map((ship) => ({
      ...ship,
      portName: place.name,
      portSlug: place.publicPortSlug!,
      placeType: place.placeType,
    })),
  );

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": `${SITE}/southeast-alaska#webpage`,
        url: `${SITE}/southeast-alaska`,
        name: "Southeast Alaska Cruise Ports, Communities & Local Operators Directory",
        description:
          "Primary-source directory of Southeast Alaska cruise ports, communities, terminals, scenic Glacier Bay cruising, and local shore excursion operators.",
        isPartOf: { "@id": `${SITE}/#website` },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: `${SITE}/` },
          {
            "@type": "ListItem",
            position: 2,
            name: "Southeast Alaska Directory",
            item: `${SITE}/southeast-alaska`,
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

      {/* 1. Regional Hero */}
      <section className="hero" style={{ padding: "52px 0 44px" }}>
        <div className="shell">
          <nav className="breadcrumbs" aria-label="Breadcrumbs" style={{ color: "#cfe5ea" }}>
            <Link href="/" style={{ color: "#ffffff" }}>
              Home
            </Link>
            <span>›</span>
            <span style={{ color: "#cfe5ea" }}>Southeast Alaska Directory</span>
          </nav>

          <p className="eyebrow">
            Inside Passage · Icy Strait · Lynn Canal · Outer Coast
          </p>
          <h1 style={{ marginTop: 10, marginBottom: 16 }}>
            Southeast Alaska Ports, Communities &amp; Local Excursion Operators
          </h1>
          <p className="lead" style={{ color: "#e4f1f4", maxWidth: 840 }}>
            One primary-source directory connecting every major Southeast Alaska cruise
            port, neighboring community, private cruise terminal, and scenic National Park
            waterway—with permanent profiles for verified local operators and 2-hour
            all-aboard return timing built in.
          </p>

          <div className="cta-row">
            <a className="button" href="#ports-and-communities">
              Explore {indexablePlaces.length} Verified Destinations ↓
            </a>
            <Link className="button secondary" href="/operators">
              Browse {indexableOperators.length} Local Operators →
            </Link>
            <a className="button secondary" href="#coverage-ledger">
              Verified vs. Held Coverage ({snapshot.counts.indexableOperatorProfiles}/
              {snapshot.counts.totalOperatorsModeled})
            </a>
          </div>
        </div>
      </section>

      {/* 2. Corridor Map & Distinct Place-Relationship Diagram */}
      <section className="section" style={{ background: "#ffffff", borderBottom: "1px solid var(--line)" }}>
        <div className="shell">
          <p className="eyebrow" style={{ color: "var(--muted)" }}>
            Geographic &amp; Operational Relationships
          </p>
          <h2>How Southeast Alaska Ports, Terminals &amp; Waterways Connect</h2>
          <p className="lead" style={{ color: "var(--muted)" }}>
            Not every itinerary stop is a traditional downtown dock. Understanding the
            difference between a private cruise terminal, a neighboring community harbor,
            and a non-disembarking National Park waterway prevents missed pickups and
            impossible bookings:
          </p>

          <div className="grid-2" style={{ marginTop: 24 }}>
            <div className="card" style={{ background: "#f4f9fa" }}>
              <span className="badge badge-safety" style={{ alignSelf: "flex-start" }}>
                Separate Canonical Entities · Never Redirected
              </span>
              <h3 style={{ marginTop: 10 }}>
                Hoonah (Community &amp; Harbor) ↔ Icy Strait Point (Cruise Terminal)
              </h3>
              <p>
                <strong>Icy Strait Point</strong> (
                <Link href="/ports/icy-strait-point" style={{ color: "var(--forest)", fontWeight: 700 }}>
                  /ports/icy-strait-point
                </Link>
                ) is Huna Totem Corporation&apos;s private Cannery Point cruise destination with
                Ocean Landing, Wilderness Landing, two Doppelmayr gondolas, and the
                5,495-foot ZipRider. <strong>Hoonah</strong> (
                <Link href="/ports/hoonah" style={{ color: "var(--forest)", fontWeight: 700 }}>
                  /ports/hoonah
                </Link>
                ) is Alaska&apos;s largest Tlingit municipality ~1.5 miles southwest, where
                independent local captains depart Hoonah Boat Harbor (after picking up
                cruise guests at ISP&apos;s Excursion Hub).
              </p>
              <div className="chips">
                <Link className="chip" href="/ports/icy-strait-point">
                  Icy Strait Point Terminal →
                </Link>
                <Link className="chip" href="/ports/hoonah">
                  Hoonah Community &amp; Harbor →
                </Link>
              </div>
            </div>

            <div className="card" style={{ background: "#fffaf5", borderColor: "var(--safety-border)" }}>
              <span className="badge badge-warning" style={{ alignSelf: "flex-start" }}>
                Critical Non-Disembarkation Rule
              </span>
              <h3 style={{ marginTop: 10 }}>
                Glacier Bay (Scenic Cruising) ↔ Gustavus (Air/Ferry Gateway)
              </h3>
              <p>
                <strong>Glacier Bay National Park</strong> (
                <Link href="/ports/glacier-bay" style={{ color: "var(--forest)", fontWeight: 700 }}>
                  /ports/glacier-bay
                </Link>
                ) is a 9-to-10-hour onboard scenic-cruising day: <strong>large cruise ships
                never dock or disembark passengers anywhere in Glacier Bay</strong> (NPS
                Rangers and Huna Tlingit interpreters board via launch).{" "}
                <strong>Gustavus</strong> (
                <Link href="/ports/gustavus" style={{ color: "var(--forest)", fontWeight: 700 }}>
                  /ports/gustavus
                </Link>
                ) is the independent airport (GST), state ferry (GUS), and Bartlett Cove
                gateway town for overland/fly-in travelers.
              </p>
              <div className="chips">
                <Link className="chip" href="/ports/glacier-bay">
                  Glacier Bay Scenic Guide →
                </Link>
                <Link className="chip" href="/ports/gustavus">
                  Gustavus &amp; Bartlett Cove →
                </Link>
              </div>
            </div>

            <div className="card">
              <span className="badge badge-safety" style={{ alignSelf: "flex-start" }}>
                Lynn Canal Fast-Ferry Link
              </span>
              <h3 style={{ marginTop: 10 }}>Skagway ↔ Haines (45-Minute Catamaran)</h3>
              <p>
                Separated by 14 nautical miles of dramatic fjord scenery in Upper Lynn
                Canal (vs. 350+ miles by road),{" "}
                <Link href="/ports/skagway" style={{ color: "var(--forest)", fontWeight: 700 }}>
                  Skagway
                </Link>{" "}
                and{" "}
                <Link href="/ports/haines" style={{ color: "var(--forest)", fontWeight: 700 }}>
                  Haines
                </Link>{" "}
                connect via the seasonal 45-minute Haines-Skagway Fast Ferry—allowing
                Skagway ship guests to explore Chilkoot Lake bears and the Chilkat Bald
                Eagle Preserve.
              </p>
            </div>

            <div className="card">
              <span className="badge badge-warning" style={{ alignSelf: "flex-start" }}>
                20–30 Minute Shuttle Buffers
              </span>
              <h3 style={{ marginTop: 10 }}>
                Ward Cove (Ketchikan) · Halibut Point (Sitka) · AJ Dock (Juneau)
              </h3>
              <p>
                Ships berthed at <strong>The Mill at Ward Cove</strong> (~5.5–7 mi north of
                downtown Ketchikan), <strong>Sitka Sound Cruise Terminal</strong> (~5–6 mi
                north of Crescent Harbor), or <strong>AJ Dock</strong> (~1 mi south of
                downtown Juneau) require shuttle margin before downtown or harbor check-ins.
              </p>
            </div>
          </div>

          {/* South-to-North Inside Passage Corridor Diagram */}
          <div className="table-wrap" style={{ marginTop: 28 }}>
            <table>
              <thead>
                <tr>
                  <th>Corridor Zone (South → North)</th>
                  <th>Canonical Destination</th>
                  <th>Entity Type</th>
                  <th>Primary Access &amp; Key Relationship</th>
                </tr>
              </thead>
              <tbody>
                {indexablePlaces.map(({ place }) => (
                  <tr key={place.placeId}>
                    <td>{place.subRegionLabel}</td>
                    <td>
                      <Link
                        href={`/ports/${place.publicPortSlug}`}
                        style={{ fontWeight: 700, color: "var(--forest)" }}
                      >
                        {place.name} →
                      </Link>
                    </td>
                    <td>
                      <span className="chip">
                        {PLACE_TYPE_LABELS[place.placeType] || place.placeType}
                      </span>
                    </td>
                    <td style={{ fontSize: 13.5 }}>{place.disembarkationExplanation}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* 3. Verified Towns, Ports & Scenic Destinations */}
      <section className="section" id="ports-and-communities">
        <div className="shell">
          <p className="eyebrow" style={{ color: "var(--muted)" }}>
            12 Verified Destinations
          </p>
          <h2>Southeast Alaska Port, Community &amp; Scenic Directories</h2>
          <p className="lead" style={{ color: "var(--muted)" }}>
            Each verified destination page includes berth/harbor logistics, visiting cruise
            ships, local operators, tour timing-fit checks, official tourism/harbor
            sources, and verification dates:
          </p>

          <div className="grid-3" style={{ marginTop: 24 }}>
            {indexablePlaces.map(({ place }) => {
              const localOpsCount = indexableOperators.filter((o) =>
                o.operator.publicPortSlugs.includes(place.publicPortSlug!),
              ).length;
              return (
                <Link
                  key={place.placeId}
                  href={`/ports/${place.publicPortSlug}`}
                  className="card"
                >
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
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
                    <span
                      className={`badge ${
                        place.largeCruiseShipDisembarkationAllowed
                          ? "badge-safety"
                          : "badge-warning"
                      }`}
                    >
                      {PLACE_TYPE_LABELS[place.placeType]}
                    </span>
                    <span className="chip" style={{ padding: "3px 9px" }}>
                      Verified {place.verifiedAt}
                    </span>
                  </div>
                  <h3>{place.name}</h3>
                  <p>{place.hook}</p>
                  <div className="chips">
                    <span className="chip">
                      {localOpsCount > 0
                        ? `${localOpsCount} verified operator${localOpsCount === 1 ? "" : "s"}`
                        : "Scenic / Gateway Guide"}
                    </span>
                    <span className="chip">{place.docksAndAccessPoints.length} facilities</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* 4. Qualified Category Comparisons + Regional Categories */}
      <section
        className="section"
        id="excursion-categories"
        style={{ background: "#ffffff", borderTop: "1px solid var(--line)" }}
      >
        <div className="shell">
          <p className="eyebrow" style={{ color: "var(--muted)" }}>
            Strict Multi-Operator Comparison Gate
          </p>
          <h2>Excursion Categories Across Southeast Alaska</h2>
          <p className="lead" style={{ color: "var(--muted)" }}>
            Standalone port-category pages (<code>/ports/[port]/[category]</code>) are
            indexed only where at least <strong>2 distinct verified operators</strong>,{" "}
            <strong>3 verified products</strong>, and substantive comparison guidance
            exist—keeping smaller 1-operator towns cleanly consolidated on their main port
            page.
          </p>

          <div className="grid-3" style={{ marginTop: 24 }}>
            {indexablePortCategories.map((pc) => (
              <Link
                key={pc.gate.entityId}
                href={`/ports/${pc.portSlug}/${pc.category.categorySlug}`}
                className="card"
              >
                <div
                  style={{
                    borderRadius: 12,
                    overflow: "hidden",
                    aspectRatio: "16 / 10",
                    marginBottom: 12,
                    background: "#eef5f6",
                  }}
                >
                  <img
                    src={pc.category.image}
                    alt={pc.category.imageAlt}
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
                <span className="badge badge-safety" style={{ alignSelf: "flex-start", marginBottom: 6 }}>
                  {pc.portName} · {pc.qualifiedOperators.length} Operators ·{" "}
                  {pc.qualifiedTours.length} Tours
                </span>
                <h3>{pc.comparison?.h1 || `${pc.portName} ${pc.category.shortLabel}`}</h3>
                <p>{pc.category.summary}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 5. Featured Verified Local Operators */}
      <section className="section" id="featured-operators" style={{ borderTop: "1px solid var(--line)" }}>
        <div className="shell">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "baseline",
              flexWrap: "wrap",
              gap: 12,
            }}
          >
            <div>
              <p className="eyebrow" style={{ color: "var(--muted)" }}>
                Permanent Company Profiles
              </p>
              <h2>Featured Verified Southeast Alaska Operators</h2>
            </div>
            <Link
              href="/operators"
              style={{ color: "var(--forest)", fontWeight: 700, fontSize: 15 }}
            >
              View all {indexableOperators.length} verified operator profiles →
            </Link>
          </div>

          <div className="grid-3" style={{ marginTop: 20 }}>
            {indexableOperators.slice(0, 12).map(({ operator, tours }) => (
              <Link
                key={operator.operatorId}
                href={`/operators/${operator.slug}`}
                className="card"
              >
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
                  {operator.verifiedOwnershipBadges[0] && (
                    <span className="badge badge-safety">
                      {operator.verifiedOwnershipBadges[0].label}
                    </span>
                  )}
                </div>
                <h3>{operator.name}</h3>
                <p>{operator.tagline}</p>
                <div className="chips">
                  {operator.publicPortSlugs.map((ps) => (
                    <span key={ps} className="chip">
                      {ps.replace(/-/g, " ")}
                    </span>
                  ))}
                  <span className="chip">{tours.length} verified tours</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 6. Upcoming Ship Visits */}
      <section className="section" style={{ background: "#ffffff", borderTop: "1px solid var(--line)" }}>
        <div className="shell">
          <p className="eyebrow" style={{ color: "var(--muted)" }}>
            Cruise Schedule Context
          </p>
          <h2>Representative Cruise Ships Calling in Southeast Alaska</h2>
          <p style={{ color: "var(--muted)" }}>
            Match your vessel&apos;s berth assignment and port hours before booking, or open{" "}
            <Link href="/cruise-ships" style={{ color: "var(--forest)", fontWeight: 700 }}>
              all Alaska cruise ship guides
            </Link>{" "}
            and{" "}
            <a
              href="https://cruisepromenade.com"
              target="_blank"
              rel="noreferrer"
              style={{ color: "var(--forest)", fontWeight: 700 }}
            >
              Cruise Promenade group sailing boards ↗
            </a>
            .
          </p>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Ship &amp; Cruise Line</th>
                  <th>Destination</th>
                  <th>Typical Window</th>
                  <th>Berth / Disembarkation Note</th>
                </tr>
              </thead>
              <tbody>
                {shipVisits.slice(0, 10).map((sv, idx) => (
                  <tr key={`${sv.shipSlug}-${sv.portSlug}-${idx}`}>
                    <td>
                      <strong>{sv.shipName}</strong>
                      <div style={{ fontSize: 12.5, color: "var(--muted)" }}>
                        {sv.cruiseLine}
                      </div>
                    </td>
                    <td>
                      <Link
                        href={`/ports/${sv.portSlug}`}
                        style={{ color: "var(--forest)", fontWeight: 700 }}
                      >
                        {sv.portName}
                      </Link>
                    </td>
                    <td>{sv.typicalPortWindow}</td>
                    <td>{sv.berthOrAccessNote}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* 7. Truthful Verified vs. Unverified Coverage Ledger */}
      <section
        className="section"
        id="coverage-ledger"
        style={{ background: "#eef5f6", borderTop: "1px solid var(--line)" }}
      >
        <div className="shell">
          <p className="eyebrow" style={{ color: "var(--muted)" }}>
            Fail-Closed Indexing &amp; Provenance Transparency
          </p>
          <h2>Verified vs. Unverified Southeast Alaska Coverage</h2>
          <p className="lead" style={{ color: "var(--muted)" }}>
            We never index empty stubs. Destinations, operators, and category intersections
            appear in search sitemaps only after primary-source verification passes;
            incomplete records remain held (<code>noindex, follow</code>) in Destination
            Command Center&apos;s research queue:
          </p>

          <div className="grid" style={{ marginTop: 22 }}>
            <div className="card">
              <span className="badge badge-safety" style={{ alignSelf: "flex-start" }}>
                Indexable Destinations
              </span>
              <h3 style={{ fontSize: 32, marginTop: 10 }}>
                {snapshot.counts.indexablePublicPlacePages}
              </h3>
              <p>
                Verified ports, communities, terminals &amp; scenic Glacier Bay guide (plus{" "}
                <strong>{heldPublicPlaces.length}</strong> smaller communities held{" "}
                <code>noindex</code> pending local operator verification:{" "}
                {heldPublicPlaces.map((h) => h.place.name).join(", ")}).
              </p>
            </div>

            <div className="card">
              <span className="badge badge-safety" style={{ alignSelf: "flex-start" }}>
                Verified Local Operators
              </span>
              <h3 style={{ fontSize: 32, marginTop: 10 }}>
                {snapshot.counts.indexableOperatorProfiles}
              </h3>
              <p>
                Primary-source verified company profiles passing all 6 publication checks
                (plus <strong>{heldOperators.length}</strong> records held{" "}
                <code>noindex</code> in the research queue).
              </p>
            </div>

            <div className="card">
              <span className="badge badge-safety" style={{ alignSelf: "flex-start" }}>
                Qualified Category Pages
              </span>
              <h3 style={{ fontSize: 32, marginTop: 10 }}>
                {snapshot.counts.indexablePortCategoryPages}
              </h3>
              <p>
                Port-category pages meeting &ge;2 verified operators, &ge;3 verified
                products, and comparison copy (
                <strong>{snapshot.counts.heldPortCategoryIntersections}</strong> narrower
                categories kept consolidated inside parent port pages).
              </p>
            </div>

            <div className="card">
              <span
                className={`badge ${
                  snapshot.counts.liveAvailabilityConnectedOperators > 0
                    ? "badge-safety"
                    : "badge-warning"
                }`}
                style={{ alignSelf: "flex-start" }}
              >
                Direct API Connections
              </span>
              <h3 style={{ fontSize: 32, marginTop: 10 }}>
                {snapshot.counts.liveAvailabilityConnectedOperators} Live
              </h3>
              <p>
                {snapshot.counts.directCheckoutConnectedOperators > 0 ? (
                  <>
                    <strong>{snapshot.counts.directCheckoutConnectedOperators}</strong>{" "}
                    authorized direct supplier checkout active (
                    <Link
                      href="/operators/juneau-tours-and-whale-watch"
                      style={{ fontWeight: 700, color: "var(--forest)" }}
                    >
                      Juneau Tours &amp; Whale Watch
                    </Link>
                    ); all other operators remain unconnected until verified authorization
                    and explicit owner approval.
                  </>
                ) : (
                  <>
                    Live API availability and optional 10% supplier-hosted direct checkout
                    strictly require operator authorization and explicit owner approval
                    (never self-activated).
                  </>
                )}
              </p>
            </div>
          </div>

          <div style={{ marginTop: 24 }}>
            <TrustDisclosure />
          </div>
        </div>
      </section>
    </main>
  );
}
