import type { Metadata } from "next";
import Link from "next/link";
import { TrustDisclosure } from "@/components/TrustDisclosure";
import {
  LfseOperatorsDirectoryClient,
  type LfseOperatorDirectoryCardItem,
} from "@/components/LfseOperatorsDirectoryClient";
import { loadLfseJuneauNormalizedSupplierFeed } from "@/lib/dccJuneauSupplierFeed";
import { formatCleanPlaceBaseName } from "@/lib/directoryDisplay";
import {
  buildOperatorsDirectoryJsonLd,
  DCC_ALASKA_DIRECTORY_API_URL,
  LFSE_SITE_URL,
} from "@/lib/structuredData";
import { UNCLAIMED_OPERATOR_PROFILE_NOTICE } from "../../../../lib/dcc/shared/southeastAlaskaDirectoryContract";
import { getSoutheastAlaskaDirectorySnapshot } from "../../../../lib/dcc/shared/southeastAlaskaDirectoryOperatorsAndTours";

export const metadata: Metadata = {
  title: "Southeast Alaska Shore Excursion Operators Directory | Local Companies",
  description:
    "Browse 21 verified local Southeast Alaska shore excursion operators across Juneau, Hoonah, Icy Strait Point, Ketchikan, Skagway, Sitka, Haines, Wrangell, and Petersburg.",
  alternates: { canonical: `${LFSE_SITE_URL}/operators` },
  openGraph: {
    title: "Southeast Alaska Local Excursion Operators | Last Frontier Shore Excursions",
    description:
      "Compare verified Alaska whale captains, glacier helicopter pilots, floatplane operators, and Alaska Native-owned excursion companies—with dock pickup rules and passenger policies.",
    url: `${LFSE_SITE_URL}/operators`,
    siteName: "Last Frontier Shore Excursions",
    type: "website",
  },
};

export default async function OperatorsDirectoryPage() {
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
  const verifiedOperators = snapshot.operators.filter((o) => o.gate.indexable);

  const indexablePlaces = snapshot.places.filter(
    (p) => p.gate.indexable && p.place.publicPortSlug,
  );
  const placeNameBySlug = new Map<string, string>();
  for (const { place } of indexablePlaces) {
    if (place.publicPortSlug) {
      placeNameBySlug.set(
        place.publicPortSlug,
        formatCleanPlaceBaseName(place.name),
      );
    }
  }

  const categoryLabelBySlug = new Map<string, string>();
  for (const cat of snapshot.categories) {
    categoryLabelBySlug.set(cat.categorySlug, cat.shortLabel);
  }

  const usedPortSlugs = new Set<string>();
  const usedCategorySlugs = new Set<string>();

  const cardItems: LfseOperatorDirectoryCardItem[] = verifiedOperators.map(
    ({ operator, liveAvailabilityConnected, directCheckoutConnected, tours }) => {
      const ports = operator.publicPortSlugs
        .filter((ps) => placeNameBySlug.has(ps))
        .map((ps) => {
          usedPortSlugs.add(ps);
          return { slug: ps, name: placeNameBySlug.get(ps)! };
        });

      const categories = operator.categorySlugs.map((cs) => {
        usedCategorySlugs.add(cs);
        return { slug: cs, label: categoryLabelBySlug.get(cs) || cs };
      });

      const activeToursCount = tours.filter((t) => !t.isCommerciallyHeld).length;

      return {
        operatorId: operator.operatorId,
        slug: operator.slug,
        name: operator.name,
        tagline: operator.tagline,
        cruiseLogisticsSummary: operator.cruiseLogisticsSummary,
        heroImage: operator.heroImage,
        heroImageAlt: operator.heroImageAlt,
        heroImageCredit: operator.heroImageCredit,
        ports,
        categories,
        ownershipBadges: operator.verifiedOwnershipBadges.map((b) => b.label),
        liveDirectConnected: Boolean(
          liveAvailabilityConnected && directCheckoutConnected,
        ),
        activeToursCount,
        yearEstablished: operator.yearEstablished ?? null,
      };
    },
  );

  const portOptions = indexablePlaces
    .filter(({ place }) => usedPortSlugs.has(place.publicPortSlug!))
    .map(({ place }) => ({
      slug: place.publicPortSlug!,
      name: formatCleanPlaceBaseName(place.name),
    }));

  const categoryOptions = snapshot.categories
    .filter((c) => usedCategorySlugs.has(c.categorySlug))
    .map((c) => ({
      slug: c.categorySlug,
      label: c.shortLabel,
    }));

  const jsonLd = buildOperatorsDirectoryJsonLd(
    verifiedOperators.map(({ operator }) => ({
      slug: operator.slug,
      name: operator.name,
    })),
  );

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
            <span>Local Operators</span>
          </nav>

          <p className="eyebrow" style={{ color: "var(--muted)" }}>
            Southeast Alaska Local Companies · {verifiedOperators.length} Verified
            Operators
          </p>
          <h1>Southeast Alaska Shore Excursion Operators</h1>
          <p
            className="lead"
            style={{ color: "#42555d", maxWidth: 850, marginBottom: 18 }}
          >
            Compare independent Southeast Alaska whale-watching captains, glacier
            helicopter pilots, floatplane operators, river guides, and Alaska Native-owned
            excursion companies—complete with dock-by-dock pickup rules, mobility notes,
            and verified tour lineups.
          </p>
          <div className="cta-row">
            <Link className="button" href="/ports">
              {`Explore All ${snapshot.counts.indexablePublicPlacePages} Ports & Communities`}
            </Link>
            <Link className="button secondary" href="/southeast-alaska">
              Southeast Alaska Overview
            </Link>
          </div>
          <TrustDisclosure compact />
        </div>
      </section>

      {/* Searchable & Filterable 21 Verified Operators */}
      <section className="section">
        <div className="shell">
          <h2>Browse Verified Local Excursion Operators ({verifiedOperators.length})</h2>
          <p className="lead" style={{ color: "var(--muted)", marginBottom: 22 }}>
            Filter by cruise port or excursion category, or search by company name, harbor,
            or vessel style:
          </p>

          <LfseOperatorsDirectoryClient
            items={cardItems}
            portOptions={portOptions}
            categoryOptions={categoryOptions}
          />
        </div>
      </section>

      {/* Subtle Bottom Operator Claim Note + Calm "Sources and freshness" Disclosure */}
      <section
        className="section"
        style={{ background: "#ffffff", borderTop: "1px solid var(--line)" }}
      >
        <div className="shell" style={{ display: "grid", gap: 18 }}>
          <div
            className="card"
            data-testid="operators-footer-claim-callout"
            style={{ background: "var(--parchment)" }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 14,
              }}
            >
              <div style={{ maxWidth: 740 }}>
                <span className="badge badge-safety">For Local Alaska Operators</span>
                <h3 style={{ fontSize: 18, margin: "8px 0 6px" }}>
                  Operate excursions in Southeast Alaska?
                </h3>
                <p style={{ margin: 0, fontSize: 14, color: "var(--muted)" }}>
                  Unclaimed company pages display:{" "}
                  <em>&ldquo;{UNCLAIMED_OPERATOR_PROFILE_NOTICE}&rdquo;</em> Local
                  operators can claim their profile at no cost from any company page to
                  update pickup details, accessibility notes, and tour schedules.
                </p>
              </div>
              <Link className="button small secondary" href="/contact">
                Contact Directory Team
              </Link>
            </div>
          </div>

          <details
            className="lfse-sources-details"
            data-testid="operators-sources-and-freshness"
          >
            <summary>Sources and freshness</summary>
            <div className="lfse-sources-body">
              <p style={{ margin: 0 }}>
                <strong>Last verified:</strong> 2026-11-17. Company profiles are compiled
                from official operator websites, published passenger weight and mobility
                FAQs, municipal harbor directories, and Alaska Native corporation filings.
                Initials shown on operator cards are neutral editorial monograms rather
                than official company trademarks.
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
      </section>
    </main>
  );
}
