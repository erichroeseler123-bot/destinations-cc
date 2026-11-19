import type { Metadata } from "next";
import Link from "next/link";
import { TrustDisclosure } from "@/components/TrustDisclosure";
import { OperatorIdentityMark } from "@/components/OperatorIdentityMark";
import { loadLfseJuneauNormalizedSupplierFeed } from "@/lib/dccJuneauSupplierFeed";
import {
  classifyDestinationType,
  resolveDestinationHeroMedia,
  STANDARDIZED_TWO_HOUR_PLANNING_NOTE,
} from "@/lib/directoryDisplay";
import {
  buildSoutheastAlaskaHubJsonLd,
  DCC_ALASKA_DIRECTORY_API_URL,
  LFSE_SITE_URL,
} from "@/lib/structuredData";
import { getSoutheastAlaskaDirectorySnapshot } from "../../../../lib/dcc/shared/southeastAlaskaDirectoryOperatorsAndTours";

export const metadata: Metadata = {
  title: "Southeast Alaska Cruise Ports, Communities & Local Operators Guide",
  description:
    "Explore Southeast Alaska's 12 verified cruise ports, Tlingit communities, terminals, Glacier Bay scenic cruising, side-by-side excursion comparisons, and 21 local operators.",
  alternates: { canonical: `${LFSE_SITE_URL}/southeast-alaska` },
  openGraph: {
    title: "Southeast Alaska Guide | Ports, Communities & Local Operators",
    description:
      "Compare Southeast Alaska cruise ports, terminal vs. community logistics (Icy Strait Point vs. Hoonah, Glacier Bay scenic cruising vs. Gustavus), and verified local operators.",
    url: `${LFSE_SITE_URL}/southeast-alaska`,
    siteName: "Last Frontier Shore Excursions",
    type: "website",
    images: [
      {
        url: `${LFSE_SITE_URL}/images/alaska/inside-passage-hero.jpg`,
        width: 1440,
        height: 900,
        alt: "Glaciated coastal peaks and calm Inside Passage waters in Southeast Alaska",
      },
    ],
  },
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
  const indexableOperators = snapshot.operators.filter((o) => o.gate.indexable);
  const indexablePortCategories = snapshot.portCategories.filter(
    (pc) => pc.gate.indexable,
  );

  const placeNameBySlug = new Map<string, string>();
  for (const { place } of indexablePlaces) {
    if (place.publicPortSlug) {
      placeNameBySlug.set(place.publicPortSlug, place.name);
    }
  }

  const shipVisits = indexablePlaces.flatMap(({ place }) =>
    place.visitingShips.map((ship) => ({
      ...ship,
      portName: place.name,
      portSlug: place.publicPortSlug!,
      placeType: place.placeType,
    })),
  );

  const jsonLd = buildSoutheastAlaskaHubJsonLd();

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* 1. Warm Regional Discovery Hero */}
      <section className="hero">
        <div className="shell">
          <nav className="breadcrumbs" aria-label="Breadcrumbs" style={{ color: "#cfe5ea" }}>
            <Link href="/" style={{ color: "#ffffff" }}>
              Home
            </Link>
            <span>›</span>
            <span style={{ color: "#cfe5ea" }}>Southeast Alaska</span>
          </nav>

          <p className="eyebrow">
            Inside Passage · Icy Strait · Lynn Canal · Outer Coast
          </p>
          <h1>
            Southeast Alaska Ports, Harbor Communities &amp; Local Operators
          </h1>
          <p className="lead" style={{ color: "#e4f1f4", maxWidth: 840 }}>
            Plan your Alaska itinerary with clear dock-by-dock logistics across{" "}
            {indexablePlaces.length} verified cruise ports, island communities, and
            scenic National Park fjords—connected directly to{" "}
            {indexableOperators.length} local excursion operators and two-hour
            all-aboard return timing.
          </p>

          <div className="cta-row">
            <a className="button" href="#ports-and-communities">
              {`Explore ${indexablePlaces.length} Verified Destinations ↓`}
            </a>
            <a className="button secondary" href="#excursion-categories">
              {`Compare ${indexablePortCategories.length} Port × Category Guides`}
            </a>
            <Link className="button secondary" href="/operators">
              {`Browse ${indexableOperators.length} Local Operators →`}
            </Link>
            <Link className="button secondary" href="/southeast-alaska/fishing-lodges">
              Compare 16 Fishing Lodges →
            </Link>
          </div>
        </div>
      </section>

      {/* 2. 12 Verified Destinations (Visual Cards First!) */}
      <section className="section" id="ports-and-communities">
        <div className="shell">
          <p className="eyebrow" style={{ color: "var(--muted)" }}>
            12 Verified Destinations
          </p>
          <h2>Explore Southeast Alaska Ports, Communities &amp; Scenic Waterways</h2>
          <p className="lead" style={{ color: "var(--muted)" }}>
            Choose your port of call, neighboring harbor community, or scenic cruising
            waterway to review docks, shuttle transfers, local operators, and excursion
            timing fit:
          </p>

          <div className="lfse-cards-grid" style={{ marginTop: 24 }}>
            {indexablePlaces.map(({ place }) => {
              const slug = place.publicPortSlug!;
              const typeInfo = classifyDestinationType(place);
              const media = resolveDestinationHeroMedia(place);
              const localOpsCount = indexableOperators.filter((o) =>
                o.operator.publicPortSlugs.includes(slug),
              ).length;
              const localToursCount = snapshot.tours.filter(
                (t) => t.portSlug === slug && !t.isCommerciallyHeld,
              ).length;

              return (
                <Link
                  key={place.placeId}
                  href={`/ports/${slug}`}
                  className="card lfse-directory-card"
                >
                  <div>
                    <div className="lfse-card-media">
                      <img
                        src={media.heroImage}
                        alt={media.heroImageAlt}
                        width={640}
                        height={400}
                        loading="lazy"
                      />
                      <span className="lfse-card-credit">{media.heroImageCredit}</span>
                    </div>

                    <div className="lfse-card-meta-row">
                      <span
                        className={`badge ${
                          place.placeType === "scenic_cruise_destination"
                            ? "badge-warning"
                            : "badge-safety"
                        }`}
                      >
                        {typeInfo.label}
                      </span>
                      <span className="chip">{place.subRegionLabel}</span>
                    </div>

                    <h3>{place.name}</h3>
                    <p>{place.hook}</p>
                  </div>

                  <div className="lfse-card-footer">
                    <div className="chips">
                      <span className="chip">
                        {localOpsCount > 0
                          ? `${localOpsCount} local operator${localOpsCount === 1 ? "" : "s"}`
                          : place.placeType === "scenic_cruise_destination"
                            ? "Onboard Scenic Guide"
                            : "Air & Ferry Gateway"}
                      </span>
                      {localToursCount > 0 && (
                        <span className="chip">
                          {localToursCount} {localToursCount === 1 ? "tour" : "tours"}
                        </span>
                      )}
                      <span className="chip">
                        {place.docksAndAccessPoints.length}{" "}
                        {place.docksAndAccessPoints.length === 1
                          ? "access point"
                          : "docks & landings"}
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* 3. Concise Human-Language Port Disambiguation Cards */}
      <section
        className="section"
        style={{
          background: "#ffffff",
          borderTop: "1px solid var(--line)",
          borderBottom: "1px solid var(--line)",
        }}
      >
        <div className="shell">
          <p className="eyebrow" style={{ color: "var(--muted)" }}>
            Terminal, Harbor &amp; Scenic Waterway Logistics
          </p>
          <h2>Know How Neighboring Stops &amp; Waterways Work</h2>
          <p className="lead" style={{ color: "var(--muted)" }}>
            Not every Alaska cruise itinerary stop is a traditional downtown pier. Keeping
            private cruise terminals, neighboring harbor towns, and onboard National Park
            scenic days distinct prevents missed pickups and impossible bookings:
          </p>

          <div className="lfse-two-col" style={{ marginTop: 22 }}>
            <div className="card">
              <span className="badge badge-safety" style={{ alignSelf: "flex-start" }}>
                Cruise Terminal vs. Neighboring Community
              </span>
              <h3 style={{ marginTop: 10 }}>Icy Strait Point vs. Hoonah</h3>
              <p>
                <Link
                  href="/ports/icy-strait-point"
                  style={{ color: "var(--forest)", fontWeight: 700, textDecoration: "underline" }}
                >
                  Icy Strait Point
                </Link>{" "}
                is Huna Totem Corporation&apos;s private Cannery Point cruise terminal with
                Ocean Landing, Wilderness Landing, two aerial gondolas, and the 5,495-foot
                ZipRider.{" "}
                <Link
                  href="/ports/hoonah"
                  style={{ color: "var(--forest)", fontWeight: 700, textDecoration: "underline" }}
                >
                  Hoonah
                </Link>{" "}
                is Alaska&apos;s largest Tlingit community 1.5 miles southwest, where
                independent local whale captains moor at Hoonah Boat Harbor after picking
                up cruise guests at the Excursion Hub.
              </p>
              <div className="chips">
                <Link className="chip lfse-chip-link" href="/ports/icy-strait-point">
                  Icy Strait Point Guide →
                </Link>
                <Link className="chip lfse-chip-link" href="/ports/hoonah">
                  Hoonah Community &amp; Harbor →
                </Link>
              </div>
            </div>

            <div className="card" style={{ background: "#fffaf3", borderColor: "var(--safety-border)" }}>
              <span className="badge badge-warning" style={{ alignSelf: "flex-start" }}>
                Onboard Scenic Day vs. Gateway Town
              </span>
              <h3 style={{ marginTop: 10 }}>
                Glacier Bay Scenic Cruising vs. Gustavus
              </h3>
              <p>
                <Link
                  href="/ports/glacier-bay"
                  style={{ color: "var(--forest)", fontWeight: 700, textDecoration: "underline" }}
                >
                  Glacier Bay National Park
                </Link>{" "}
                is a 9-to-10-hour onboard scenic-cruising day:{" "}
                <strong>
                  large cruise ships never dock or disembark passengers anywhere in
                  Glacier Bay
                </strong>{" "}
                (Park Rangers and Huna Tlingit interpreters board by launch).{" "}
                <Link
                  href="/ports/gustavus"
                  style={{ color: "var(--forest)", fontWeight: 700, textDecoration: "underline" }}
                >
                  Gustavus
                </Link>{" "}
                is the separate airport, state ferry, and Bartlett Cove gateway community
                for independent overland and fly-in visitors.
              </p>
              <div className="chips">
                <Link className="chip lfse-chip-link" href="/ports/glacier-bay">
                  Glacier Bay Scenic Cruising Guide →
                </Link>
                <Link className="chip lfse-chip-link" href="/ports/gustavus">
                  Gustavus &amp; Bartlett Cove Guide →
                </Link>
              </div>
            </div>

            <div className="card">
              <span className="badge badge-safety" style={{ alignSelf: "flex-start" }}>
                Lynn Canal Fast-Ferry Corridor
              </span>
              <h3 style={{ marginTop: 10 }}>Skagway &amp; Haines (45-Minute Catamaran)</h3>
              <p>
                Separated by 14 nautical miles of dramatic fjord cliffs in Upper Lynn
                Canal,{" "}
                <Link
                  href="/ports/skagway"
                  style={{ color: "var(--forest)", fontWeight: 700, textDecoration: "underline" }}
                >
                  Skagway
                </Link>{" "}
                and{" "}
                <Link
                  href="/ports/haines"
                  style={{ color: "var(--forest)", fontWeight: 700, textDecoration: "underline" }}
                >
                  Haines
                </Link>{" "}
                connect via the seasonal 45-minute Haines-Skagway Fast Ferry—giving
                Skagway cruise travelers access to Chilkoot Lake bears and the Chilkat
                Bald Eagle Preserve.
              </p>
            </div>

            <div className="card">
              <span className="badge badge-warning" style={{ alignSelf: "flex-start" }}>
                20–30 Minute Shuttle Buffers
              </span>
              <h3 style={{ marginTop: 10 }}>
                Ward Cove · Sitka Sound Terminal · AJ Dock
              </h3>
              <p>
                Ships berthed at <strong>The Mill at Ward Cove</strong> north of{" "}
                <Link
                  href="/ports/ketchikan"
                  style={{ color: "var(--forest)", fontWeight: 700, textDecoration: "underline" }}
                >
                  Ketchikan
                </Link>
                , <strong>Sitka Sound Cruise Terminal</strong> north of{" "}
                <Link
                  href="/ports/sitka"
                  style={{ color: "var(--forest)", fontWeight: 700, textDecoration: "underline" }}
                >
                  Sitka
                </Link>
                , or <strong>AJ Dock</strong> south of downtown{" "}
                <Link
                  href="/ports/juneau"
                  style={{ color: "var(--forest)", fontWeight: 700, textDecoration: "underline" }}
                >
                  Juneau
                </Link>{" "}
                require 15–30 minutes of shuttle transit before downtown or harbor check-ins.
              </p>
            </div>
          </div>

          <div className="lfse-return-standard-box" style={{ marginTop: 24 }}>
            <strong>2-Hour Return Planning Standard:</strong>
            <p>
              {STANDARDIZED_TWO_HOUR_PLANNING_NOTE} This is an independent planning
              guideline—not an operator guarantee or cruise-line rule—and remains distinct
              from each operator&apos;s check-in deadline, cancellation cutoff, and your
              ship&apos;s published all-aboard time.
            </p>
          </div>
        </div>
      </section>

      {/* 4. 7 Verified Port × Excursion Category Comparisons */}
      <section className="section" id="excursion-categories">
        <div className="shell">
          <p className="eyebrow" style={{ color: "var(--muted)" }}>
            Side-by-Side Port Comparisons
          </p>
          <h2>Compare Excursion Categories Across Southeast Alaska</h2>
          <p className="lead" style={{ color: "var(--muted)" }}>
            Explore dedicated side-by-side comparison guides where multiple verified local
            operators run distinct vessels, aircraft, or routes in the same port:
          </p>

          <div className="lfse-cards-grid" style={{ marginTop: 24 }}>
            {indexablePortCategories.map((pc) => (
              <Link
                key={pc.gate.entityId}
                href={`/ports/${pc.portSlug}/${pc.category.categorySlug}`}
                className="card lfse-directory-card"
              >
                <div>
                  <div className="lfse-card-media">
                    <img
                      src={pc.category.image}
                      alt={pc.category.imageAlt}
                      width={640}
                      height={400}
                      loading="lazy"
                    />
                    <span className="lfse-card-credit">{pc.category.imageCredit}</span>
                  </div>
                  <div className="lfse-card-meta-row">
                    <span className="badge badge-safety">
                      {pc.portName} · {pc.qualifiedOperators.length} Operators ·{" "}
                      {pc.qualifiedTours.length} Tours
                    </span>
                  </div>
                  <h3>{pc.comparison?.h1 || `${pc.portName} ${pc.category.shortLabel}`}</h3>
                  <p>{pc.category.summary}</p>
                </div>
                <div className="lfse-card-footer">
                  <span className="lfse-card-action-link">
                    Compare {pc.portName} {pc.category.shortLabel.toLowerCase()} →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 5. Featured Local Operators */}
      <section
        className="section"
        id="featured-operators"
        style={{ background: "#ffffff", borderTop: "1px solid var(--line)" }}
      >
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
                Local Alaska Companies
              </p>
              <h2>Featured Southeast Alaska Excursion Operators</h2>
            </div>
            <Link
              href="/operators"
              style={{ color: "var(--forest)", fontWeight: 700, fontSize: 15 }}
            >
              Browse all {indexableOperators.length} local operator profiles →
            </Link>
          </div>

          <div className="lfse-cards-grid" style={{ marginTop: 22 }}>
            {indexableOperators.slice(0, 12).map(({ operator, tours }) => {
              const activeCount = tours.filter((t) => !t.isCommerciallyHeld).length;
              return (
                <Link
                  key={operator.operatorId}
                  href={`/operators/${operator.slug}`}
                  className="card lfse-directory-card"
                >
                  <div>
                    <div className="lfse-card-meta-row">
                      {operator.verifiedOwnershipBadges[0] && (
                        <span className="badge badge-safety">
                          {operator.verifiedOwnershipBadges[0].label}
                        </span>
                      )}
                    </div>
                    <div className="lfse-operator-card-heading">
                      <OperatorIdentityMark name={operator.name} size="md" />
                      <h3>{operator.name}</h3>
                    </div>
                    <p>{operator.tagline}</p>
                  </div>
                  <div className="lfse-card-footer">
                    <div className="chips">
                      {operator.publicPortSlugs.map((ps) => (
                        <span key={ps} className="chip">
                          {placeNameBySlug.get(ps) || ps}
                        </span>
                      ))}
                      <span className="chip">
                        {activeCount} {activeCount === 1 ? "verified tour" : "verified tours"}
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* 5b. Multi-Night Fishing Lodges, Basecamps & Private Stays */}
      <section
        className="section"
        id="fishing-lodges-directory"
        style={{
          background: "#f4f7f6",
          borderTop: "1px solid var(--line)",
        }}
      >
        <div className="shell">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              flexWrap: "wrap",
              gap: 18,
            }}
          >
            <div style={{ maxWidth: 760 }}>
              <p className="eyebrow" style={{ color: "var(--forest)" }}>
                Multi-Night Fly-In &amp; Coastal Stays
              </p>
              <h2 style={{ marginTop: 4 }}>
                Southeast Alaska Fishing Lodges, Basecamps &amp; Whole-Lodge Stays
              </h2>
              <p style={{ margin: "0 0 12px", color: "var(--muted)" }}>
                Planning a dedicated fishing trip or pairing a multi-night island stay
                with Juneau, Sitka, Gustavus, Petersburg, Ketchikan, or Prince of Wales
                Island? Compare 16 Southeast Alaska properties side by side—including
                published package dates and rates, guided vs. self-guided boats,
                options for non-angling companions, floatplane and ferry baggage rules,
                and whole-lodge private rentals.
              </p>
              <div className="chips">
                <Link
                  className="chip lfse-chip-link"
                  href="/southeast-alaska/fishing-lodges/favorite-bay-lodge"
                >
                  Admiralty Island Fly-In Lodges →
                </Link>
                <Link
                  className="chip lfse-chip-link"
                  href="/southeast-alaska/fishing-lodges/elfin-cove-resort"
                >
                  Elfin Cove &amp; Cross Sound →
                </Link>
                <Link
                  className="chip lfse-chip-link"
                  href="/southeast-alaska/fishing-lodges/fish-baranof-sitka"
                >
                  Sitka DIY Boat + Waterfront Hotel →
                </Link>
                <Link
                  className="chip lfse-chip-link"
                  href="/southeast-alaska/fishing-lodges/boardwalk-lodge"
                >
                  Prince of Wales Whole-Lodge Stay →
                </Link>
              </div>
            </div>
            <Link href="/southeast-alaska/fishing-lodges" className="button">
              Compare All 16 Fishing Lodges →
            </Link>
          </div>
        </div>
      </section>

      {/* 6. Representative Cruise Ships & Port Windows */}
      <section className="section" style={{ borderTop: "1px solid var(--line)" }}>
        <div className="shell">
          <p className="eyebrow" style={{ color: "var(--muted)" }}>
            Cruise Ship Guides
          </p>
          <h2>Cruise Ships Calling in Southeast Alaska</h2>
          <p style={{ color: "var(--muted)", maxWidth: 820 }}>
            Check your ship&apos;s typical berth assignment and port hours before choosing
            a departure time, or open{" "}
            <Link
              href="/cruise-ships"
              style={{ color: "var(--forest)", fontWeight: 700, textDecoration: "underline" }}
            >
              all Alaska cruise ship guides
            </Link>{" "}
            and{" "}
            <a
              href="https://cruisepromenade.com"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "var(--forest)", fontWeight: 700, textDecoration: "underline" }}
            >
              Cruise Promenade sailing boards ↗
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
                  <th>Berth / Access Note</th>
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

          <div style={{ marginTop: 28 }}>
            <details className="lfse-sources-details" data-testid="hub-sources-and-freshness">
              <summary>Sources and freshness</summary>
              <div className="lfse-sources-body">
                <p style={{ margin: 0 }}>
                  <strong>Regional verification date:</strong> 2026-11-17. Port berths,
                  municipal harbor rules, National Park Service scenic-cruising permits,
                  and local operator pickup procedures are compiled from official
                  municipal harbor authorities, destination marketing organizations, NPS
                  Glacier Bay guidance, and published operator schedules.
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
                <TrustDisclosure compact />
              </div>
            </details>
          </div>
        </div>
      </section>
    </main>
  );
}
